// src/features/stockDetail/chart/components/PeriodTabs.client.tsx
"use client";

import type { Period } from "../api/types";

const ITEMS: { key: Period; label: string }[] = [
  { key: "day", label: "日" },
  { key: "week", label: "週" },
  { key: "month", label: "月" },
  { key: "year", label: "年" },
];

export default function PeriodTabs({
  value,
  onChange,
}: {
  value: Period;
  onChange: (next: Period) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {ITEMS.map((it) => {
        const active = value === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              background: active ? "#111827" : "#fff",
              color: active ? "#fff" : "#111827",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}