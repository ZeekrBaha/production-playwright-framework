import { describe, expect, it } from "vitest";
import {
  parseCellInput,
  validateScenarioForSave,
  validateScenarioName,
} from "./validation";
import { MONTHS } from "./drivers";
import { recalculate } from "./calc";
import type { ScenarioValues } from "./types";

describe("parseCellInput", () => {
  it("accepts a non-negative integer for units", () => {
    expect(parseCellInput("units", "150")).toEqual({ ok: true, value: 150 });
  });

  it("rejects a negative value for units", () => {
    const result = parseCellInput("units", "-5");
    expect(result.ok).toBe(false);
  });

  it("rejects a decimal value for units", () => {
    const result = parseCellInput("units", "10.5");
    expect(result.ok).toBe(false);
  });

  it("accepts a positive decimal for AUR", () => {
    expect(parseCellInput("aur", "12.99")).toEqual({ ok: true, value: 12.99 });
  });

  it("rejects zero AUR", () => {
    const result = parseCellInput("aur", "0");
    expect(result.ok).toBe(false);
  });

  it("accepts zero returns", () => {
    expect(parseCellInput("returns", "0")).toEqual({ ok: true, value: 0 });
  });

  it("rejects negative returns", () => {
    const result = parseCellInput("returns", "-1");
    expect(result.ok).toBe(false);
  });

  it("rejects non-numeric input", () => {
    const result = parseCellInput("units", "abc");
    expect(result.ok).toBe(false);
  });

  it("rejects empty input", () => {
    const result = parseCellInput("units", "  ");
    expect(result.ok).toBe(false);
  });
});

describe("validateScenarioForSave", () => {
  function valuesWith(units: number, aur: number, returns: number): ScenarioValues {
    const row = (n: number) => Object.fromEntries(MONTHS.map((m) => [m, n]));
    return recalculate({
      units: row(units),
      aur: row(aur),
      returns: row(returns),
    });
  }

  it("passes a healthy scenario", () => {
    expect(validateScenarioForSave(valuesWith(100, 10, 50))).toEqual([]);
  });

  it("blocks save when Net Sales is negative in any month", () => {
    const errors = validateScenarioForSave(valuesWith(10, 1, 50));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("Net Sales");
  });

  it("names the offending month in the error", () => {
    const row = (n: number) => Object.fromEntries(MONTHS.map((m) => [m, n]));
    const values = recalculate({
      units: row(100),
      aur: row(10),
      returns: { ...row(0), "2026-03": 5000 },
    });
    const errors = validateScenarioForSave(values);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("Mar 26");
  });
});

describe("validateScenarioName", () => {
  it("accepts a unique, non-empty name", () => {
    expect(validateScenarioName("FY26 Plan", ["Other"])).toBeNull();
  });

  it("rejects an empty name", () => {
    expect(validateScenarioName("   ", [])).toMatch(/required/i);
  });

  it("rejects a duplicate name (case-insensitive)", () => {
    expect(validateScenarioName("fy26 plan", ["FY26 Plan"])).toMatch(
      /already exists/i,
    );
  });

  it("rejects names longer than 60 characters", () => {
    expect(validateScenarioName("x".repeat(61), [])).toMatch(/60/);
  });
});
