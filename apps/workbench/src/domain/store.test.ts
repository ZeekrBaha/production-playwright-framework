import { beforeEach, describe, expect, it } from "vitest";
import {
  copyScenario,
  getScenario,
  listActivities,
  listRecentActivities,
  loadData,
  recordActivity,
  saveData,
} from "./store";
import { seedAppData } from "./seed";

/** Minimal localStorage stub for the node test environment. */
class LocalStorageStub {
  private map = new Map<string, string>();
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
}

beforeEach(() => {
  (globalThis as Record<string, unknown>).localStorage = new LocalStorageStub();
});

describe("loadData", () => {
  it("defaults activities to an empty list for legacy data", () => {
    localStorage.setItem("fw:data", JSON.stringify({ scenarios: [] }));
    expect(loadData().activities).toEqual([]);
  });
});

describe("copyScenario", () => {
  it("creates a DRAFT copy with the new name and preserved values", () => {
    const source = seedAppData().scenarios.find((s) => s.id === "scn-1001")!;
    expect(source.status).toBe("APPROVED");

    const copy = copyScenario(source.id, "Baseline Copy", "ines");

    expect(copy.id).not.toBe(source.id);
    expect(copy.name).toBe("Baseline Copy");
    expect(copy.status).toBe("DRAFT");
    expect(copy.orgId).toBe(source.orgId);
    expect(copy.values).toEqual(source.values);
    expect(copy.visibleDrivers).toEqual(source.visibleDrivers);
    expect(getScenario(copy.id)).toBeDefined();
  });

  it("clears any review comment on the copy", () => {
    const data = loadData();
    data.scenarios[0].reviewComment = "needs work";
    saveData(data);

    const copy = copyScenario(data.scenarios[0].id, "Clean Copy", "ines");
    expect(copy.reviewComment).toBeNull();
  });

  it("records a copied activity for the new scenario", () => {
    const source = loadData().scenarios[0];
    const copy = copyScenario(source.id, "Audited Copy", "ines");

    const events = listActivities(copy.id);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("copied");
    expect(events[0].actor).toBe("ines");
  });
});

describe("activity log", () => {
  it("returns events for a scenario, newest first", () => {
    recordActivity({ scenarioId: "s1", type: "created", actor: "ines" });
    recordActivity({ scenarioId: "s1", type: "submitted", actor: "ines" });
    recordActivity({ scenarioId: "other", type: "created", actor: "ravi" });

    const events = listActivities("s1");
    expect(events.map((e) => e.type)).toEqual(["submitted", "created"]);
  });

  it("stores the comment on a changes_requested event", () => {
    recordActivity({
      scenarioId: "s1",
      type: "changes_requested",
      actor: "ravi",
      comment: "fix returns",
    });
    expect(listActivities("s1")[0].comment).toBe("fix returns");
  });

  it("listRecentActivities respects the limit, newest first", () => {
    for (let i = 0; i < 5; i++) {
      recordActivity({ scenarioId: `s${i}`, type: "created", actor: "ines" });
    }
    const recent = listRecentActivities(3);
    expect(recent).toHaveLength(3);
    expect(recent[0].scenarioId).toBe("s4");
  });
});
