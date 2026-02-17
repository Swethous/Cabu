// src/features/stockDetail/chart/components/IntradayDropdown.client.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { Interval } from "../api/types";

const ITEMS: { label: string; value: Interval }[] = [
  { label: "5分", value: "5m" },
  { label: "15分", value: "15m" },
  { label: "30分", value: "30m" },
  { label: "60分", value: "60m" },
];

export default function IntradayDropdown({
  value,
  onChange,
}: {
  value?: Interval;
  onChange: (next?: Interval) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = useMemo(
    () => ITEMS.find((it) => it.value === value)?.label ?? "分",
    [value]
  );

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative", minWidth: 92 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: "100%",
          minHeight: 34,
          border: "1px solid #d1d5db",
          borderRadius: 10,
          background: "linear-gradient(180deg, #fff, #f9fafb)",
          boxSizing: "border-box",
          padding: "0 10px",
          fontSize: 13,
          fontWeight: 700,
          color: "#111827",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: "pointer",
        }}
      >
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {selectedLabel}
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          style={{ color: "#64748b", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="分봉 interval 선택"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 20,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            boxShadow: "0 12px 28px rgba(15, 23, 42, 0.14)",
            padding: 6,
            display: "grid",
            gap: 4,
          }}
        >
          {ITEMS.map((it) => {
            const active = it.value === value;
            return (
              <button
                key={it.value}
                type="button"
                onClick={() => {
                  onChange(it.value);
                  setOpen(false);
                }}
                style={{
                  minHeight: 30,
                  border: "none",
                  borderRadius: 8,
                  background: active ? "#e9f0ff" : "transparent",
                  padding: "0 10px",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: active ? "#1d4ed8" : "#334155",
                  cursor: "pointer",
                }}
              >
                <span>{it.label}</span>
                {active && <Check size={14} style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
