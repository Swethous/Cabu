// src/features/stockDetail/chart/components/StockCandleChart.client.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type LogicalRange,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle, Interval, Mode, Volume } from "../api/types";

const MAX_INITIAL_VISIBLE_BARS = 80;
const MIN_INITIAL_VISIBLE_BARS = 20;
const INITIAL_VISIBLE_RATIO = 0.6;

type Props = {
  symbol: string;
  mode: Mode;
  interval?: Interval;
  candles: Candle[];
  volumes: Volume[];
  exchangeTz?: string;
  height?: number;
  volumePortion?: number; // 0.22~0.30
};

function formatTick(epochSec: number, mode: Mode, timeZone?: string) {
  const d = new Date(epochSec * 1000);

  if (mode === "intraday") {
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone,
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }
  if (mode === "yearly") {
    return new Intl.DateTimeFormat("ja-JP", { timeZone, year: "numeric" }).format(d);
  }
  // daily/weekly/monthly
  return new Intl.DateTimeFormat("ja-JP", { timeZone, month: "numeric" }).format(d) + "月";
}

export default function StockCandleChart({
  symbol,
  mode,
  interval,
  candles,
  volumes,
  exchangeTz,
  height = 420,
  volumePortion = 0.26,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const viewportKeyRef = useRef<string | null>(null);

  const tickFormatter = useMemo(() => {
    return (time: any) => {
      const t = typeof time === "number" ? time : (time?.timestamp ?? 0);
      return formatTick(t, mode, exchangeTz);
    };
  }, [mode, exchangeTz]);

  useEffect(() => {
    if (!hostRef.current) return;

    const el = hostRef.current;

    const chart = createChart(el, {
      width: el.clientWidth,
      height,
      layout: { background: { color: "transparent" }, textColor: "#6B7280" },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },

      rightPriceScale: { visible: true, borderVisible: false },
      leftPriceScale: { visible: true, borderVisible: false },

      timeScale: {
        borderVisible: false,
        timeVisible: mode === "intraday",
        secondsVisible: false,
        // @ts-ignore (버전에 따라 타입 정의가 다를 수 있음)
        tickMarkFormatter: tickFormatter,
      },
      crosshair: { mode: 1 },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      priceScaleId: "right",
      borderVisible: true,
      wickVisible: true,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: "left",
      priceFormat: { type: "volume" },
      lastValueVisible: false,
      // @ts-ignore
      priceLineVisible: false,
    });

    const gap = 0.03;

    chart.priceScale("right").applyOptions({
      scaleMargins: { top: 0.06, bottom: volumePortion + gap },
    });
    chart.priceScale("left").applyOptions({
      scaleMargins: { top: 1 - volumePortion + gap, bottom: 0.02 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const ro = new ResizeObserver(() => {
      if (!hostRef.current) return;
      chart.applyOptions({ width: hostRef.current.clientWidth });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [mode, height, volumePortion, tickFormatter]);

  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || !volumeSeriesRef.current) return;

    // lightweight-charts는 time을 UTCTimestamp로 기대
    const candleData = (candles ?? []).map((c) => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      color: c.color,
      borderColor: c.borderColor,
      wickColor: c.wickColor,
    }));

    const volumeData = (volumes ?? []).map((v) => ({
      time: v.time as UTCTimestamp,
      value: v.value,
      color: v.color,
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    if (candleData.length <= 0) return;

    // 최초 진입(심볼/모드/분봉 interval 변경 시)에만 고정된 개수의 봉을 보여주고,
    // 이후에는 사용자가 드래그/줌한 뷰포트를 유지한다.
    const viewportKey = `${symbol}:${mode}:${interval ?? "-"}`;
    if (viewportKeyRef.current === viewportKey) return;

    const initialVisibleBars = Math.min(
      MAX_INITIAL_VISIBLE_BARS,
      Math.max(MIN_INITIAL_VISIBLE_BARS, Math.floor(candleData.length * INITIAL_VISIBLE_RATIO))
    );
    const to = Math.max(candleData.length - 1 + 2, 0); // 오른쪽에 약간의 여백
    const from = Math.max(to - (initialVisibleBars - 1), 0);
    chartRef.current.timeScale().setVisibleLogicalRange({ from, to } as LogicalRange);
    viewportKeyRef.current = viewportKey;
  }, [symbol, mode, interval, candles, volumes]);

  const separatorTop = Math.round((1 - volumePortion) * height);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        ref={hostRef}
        style={{
          width: "100%",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          overflow: "hidden",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: separatorTop,
          borderTop: "1px dashed #E5E7EB",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
