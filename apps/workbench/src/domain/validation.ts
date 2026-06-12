import { driverByKey, MONTH_LABELS, MONTHS } from "./drivers";
import type { ScenarioValues } from "./types";

export type ParseResult = { ok: true; value: number } | { ok: false; error: string };

/**
 * Validates raw text typed into a grid cell for the given input driver.
 * Rules: Units is an integer ≥ 0; AUR is a number > 0;
 * currency drivers are numbers ≥ 0.
 */
export function parseCellInput(driverKey: string, raw: string): ParseResult {
  const def = driverByKey(driverKey);
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: false, error: `${def.label} is required` };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, error: `${def.label} must be a number` };
  }
  if (def.format === "int" && !Number.isInteger(value)) {
    return { ok: false, error: `${def.label} must be a whole number` };
  }
  if (def.key === "aur") {
    if (value <= 0) {
      return { ok: false, error: "AUR must be greater than 0" };
    }
  } else if (value < 0) {
    return { ok: false, error: `${def.label} cannot be negative` };
  }
  return { ok: true, value };
}

/**
 * Business rule checked on Save: Net Sales must not be negative
 * in any month. Returns one error message per offending month.
 */
export function validateScenarioForSave(values: ScenarioValues): string[] {
  const errors: string[] = [];
  for (const month of MONTHS) {
    const netSales = values.netSales?.[month] ?? 0;
    if (netSales < 0) {
      errors.push(`Net Sales is negative in ${MONTH_LABELS[month]} — returns exceed GMV`);
    }
  }
  return errors;
}

/** Returns an error message, or null when the name is valid. */
export function validateScenarioName(name: string, existingNames: string[]): string | null {
  const trimmed = name.trim();
  if (trimmed === "") {
    return "Forecast name is required";
  }
  if (trimmed.length > 60) {
    return "Forecast name must be 60 characters or fewer";
  }
  const lower = trimmed.toLowerCase();
  if (existingNames.some((n) => n.trim().toLowerCase() === lower)) {
    return "A forecast with this name already exists";
  }
  return null;
}
