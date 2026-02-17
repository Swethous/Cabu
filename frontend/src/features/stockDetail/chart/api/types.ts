// src/features/stockDetail/chart/api/types.ts
export type Mode = "intraday" | "daily" | "weekly" | "monthly" | "yearly";
export type Period = "day" | "week" | "month" | "year";
export type Interval = "5m" | "15m" | "30m" | "60m";

export type Candle = {
  time: number; // epoch seconds
  open: number;
  high: number;
  low: number;
  close: number;
  color?: string;
  borderColor?: string;
  wickColor?: string;
};

export type Volume = {
  time: number; // epoch seconds
  value: number;
  color?: string;
};

export type ChartResponse = {
  symbol: string;
  mode: Mode;
  range?: string;
  interval?: string;

  metaName?: { short?: string; long?: string };
  metaMarket?: {
    currency?: string;
    exchangeName?: string;
    fullExchangeName?: string;
    timezone?: string;
    exchangeTimezoneName?: string; // "Asia/Tokyo" 등
  };

  names?: { ja?: string; en?: string };
  displayLabel?: string;

  candles: Candle[];
  volumes: Volume[];
};