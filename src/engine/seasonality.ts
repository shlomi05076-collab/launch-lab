import type { Month, MonthlyIndex } from "./types";

const DAYS_PER_MONTH = 365.25 / 12;

/**
 * Calendar month (1–12) of launch week `week` (0-based) when the launch starts on the 1st of
 * `startMonth`. Uses the week's midpoint, so a week straddling two months counts as the one it
 * mostly falls in.
 */
export function monthOfWeek(startMonth: Month, week: number): Month {
  const midpointDay = week * 7 + 3.5;
  const offset = Math.floor(midpointDay / DAYS_PER_MONTH);
  return (((startMonth - 1 + offset) % 12) + 1) as Month;
}

export function indexFor(index: MonthlyIndex, month: Month): number {
  return index[month - 1] ?? 1;
}
