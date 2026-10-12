import type { DurationInputSnapMode } from "./types";

export const SLIDER_STEP_MINUTES = 30;

/** Decimal hours to `HH:MM`, e.g. `1.5` → `"01:30"`. */
export function floatToTime(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Parses decimal hours (`1.5`, `.5`) or `H:M` (`5:3`, `:30`, `5:`, `1:75`) into decimal hours.
 * Minutes may exceed 59 and carry over. Anything else is `0`.
 */
export function timeToFloat(value: string): number {
  const trimmed = value.trim();

  if (/^(\d+(\.\d*)?|\.\d+)$/.test(trimmed)) return Number(trimmed);

  const match = /^([0-9]*):([0-9]*)$/.exec(trimmed);
  if (!match || (!match[1] && !match[2])) return 0;

  return Number(match[1] || 0) + Number(match[2] || 0) / 60;
}

export function clampHours(hours: number, maxHours: number): number {
  return Math.min(Math.max(hours, 0), maxHours);
}

export function snapToSliderStep(minutes: number): number {
  return Math.round(minutes / SLIDER_STEP_MINUTES) * SLIDER_STEP_MINUTES;
}

/** Minutes the slider shows: smooth mode previews the step it will snap to on release. */
export function getPreviewMinutes(
  minutes: number,
  snap: DurationInputSnapMode,
): number {
  return snap === "smooth" ? snapToSliderStep(minutes) : minutes;
}

export function getSliderHours(
  minutes: number,
  snap: DurationInputSnapMode,
  maxHours: number,
): number {
  return clampHours(getPreviewMinutes(minutes, snap) / 60, maxHours);
}

export function normalizeCommittedHours(
  hours: number,
  maxHours: number,
  allowOverflow: boolean,
): number {
  return allowOverflow ? Math.max(hours, 0) : clampHours(hours, maxHours);
}

/** Keeps only characters valid for decimal hours or `H:M`; a colon wins over periods. */
export function sanitizeHoursInput(value: string): string {
  const sanitized = value.replace(/[^0-9:.]/g, "");

  if (sanitized.includes(":")) {
    const [hours = "", ...minuteParts] = sanitized
      .replace(/\./g, "")
      .split(":");
    return `${hours}:${minuteParts.join("")}`;
  }

  const [hours = "", ...decimalParts] = sanitized.split(".");
  return decimalParts.length ? `${hours}.${decimalParts.join("")}` : hours;
}

/** Hours as `Xh Ym`, e.g. `10m`, `1h 30m`, `8h`, `0h`. */
export function formatHoursBalance(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (totalMinutes === 0) return "0h";
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Positions (in %) of the step notches shown while dragging. */
export function getNotchOffsets(maxMinutes: number): number[] {
  const totalSteps = Math.floor(maxMinutes / SLIDER_STEP_MINUTES);
  return Array.from(
    { length: Math.max(totalSteps - 1, 0) },
    // -0.5 centres the 1px notch on the step.
    (_, i) => ((i + 1) / totalSteps) * 100 - 0.5,
  );
}
