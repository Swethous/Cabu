// src/features/stockDetail/chart/utils/period.ts
import type { Mode, Period } from "../api/types";

export const periodToMode: Record<Period, Exclude<Mode, "intraday">> = {
  day: "daily",
  week: "weekly",
  month: "monthly",
  year: "yearly",
};