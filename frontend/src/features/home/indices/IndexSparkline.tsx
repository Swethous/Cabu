"use client";

import type { FC } from "react";
import { useId } from "react";
import type { IndexPoint } from "./types"

type Props = {
  points: IndexPoint[];
  isUp: boolean;
  width?: number;
  height?: number;
};

const IndexSparkline: FC<Props> = ({ points, isUp, width = 180, height = 110 }) => {
  const stroke = isUp ? "#2563eb" : "#ff2d55";
  const gradientId = useId();
  const padding = 8;

  if (!points || points.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <path
          d={`M ${padding} ${height / 2} L ${width - padding} ${height / 2}`}
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const closes = points.map((p) => p.close ?? 0);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;

  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  const toX = (i: number) => padding + (usableW * i) / (points.length - 1);
  const toY = (close: number) => padding + usableH - ((close - min) / range) * usableH;

  let lineD = "";
  points.forEach((p, i) => {
    const x = toX(i);
    const y = toY(p.close ?? 0);
    lineD += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  const firstX = toX(0);
  const lastX = toX(points.length - 1);
  const bottomY = padding + usableH;
  const areaD = `${lineD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.45" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={areaD} fill={`url(#${gradientId})`} stroke="none" />
      <path
        d={lineD}
        fill="none"
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IndexSparkline;