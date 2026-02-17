// src/features/autocomplete/components/SearchModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./SearchModal.module.css";
import type { InstrumentProvider } from "../api/types";
import { displayNameOf, secondaryTextOf } from "../ui/format";
import { useAutocomplete } from "../hooks/useAutocomplete";

export type AutocompleteSelectItem = {
  id: number;
  provider: InstrumentProvider;
  symbol: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect?: (item: AutocompleteSelectItem) => void;
};

const PROVIDERS: Array<{ label: string; value: InstrumentProvider }> = [
  { label: "日本株 (JPX)", value: "JPX" },
  { label: "米国株 (NASDAQ)", value: "NASDAQ_LISTED" },
];

export default function SearchModal({ open, onClose, onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { q, setQ, provider, setProvider, items, loading, error, reset } =
    useAutocomplete({ initialProvider: "JPX", debounceMs: 180, minChars: 1 });

  const [activeIdx, setActiveIdx] = useState(0);

  // ✅ 닫힐 때만 reset (open만 본다) → 무한루프 방지
  useEffect(() => {
    if (!open) {
      reset();
      setActiveIdx(0);
    }
  }, [open, reset]);

  // 키보드 핸들링은 ref로 (deps 폭발 방지)
  const itemsRef = useRef(items);
  const activeIdxRef = useRef(activeIdx);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);

  useEffect(() => {
    if (!open) return;

    const t = window.setTimeout(() => inputRef.current?.focus(), 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      const list = itemsRef.current;
      if (!list.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((v) => Math.min(v + 1, list.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((v) => Math.max(v - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const it = list[activeIdxRef.current];
        if (!it) return;
        onSelect?.({ id: it.id, provider: it.provider, symbol: it.symbol });
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, onSelect]);

  const hintText = useMemo(() => {
    if (!q.trim()) return "銘柄コード / 会社名で検索（例：7203、トヨタ、AAPL）";
    if (loading) return "検索中…";
    if (error) return error;
    if (!items.length) return "検索結果がありません";
    return "";
  }, [q, loading, error, items.length]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>銘柄検索</div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>

        <div className={styles.controls}>
          <div className={styles.filterGroup}>
            {PROVIDERS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.filterBtn} ${provider === opt.value ? styles.filterBtnActive : ""}`}
                onClick={() => {
                  setProvider(opt.value);
                  setActiveIdx(0);
                  // UX: provider 바꾸면 기존 결과/쿼리 유지 (원하면 q 유지/리셋 선택 가능)
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <input
            ref={inputRef}
            className={styles.input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActiveIdx(0);
            }}
            placeholder={provider === "JPX" ? "例：7203 / トヨタ" : "例：AAPL / Apple"}
            inputMode="search"
          />
        </div>

        <div className={styles.body}>
          {hintText ? <div className={styles.hint}>{hintText}</div> : null}

          {items.length ? (
            <ul className={styles.list}>
              {items.map((it, idx) => (
                <li key={`${it.provider}:${it.id}`} className={styles.item}>
                  <button
                    type="button"
                    className={`${styles.itemBtn} ${idx === activeIdx ? styles.itemBtnActive : ""}`}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => {
                      onSelect?.({ id: it.id, provider: it.provider, symbol: it.symbol });
                      onClose();
                    }}
                  >
                    <div className={styles.rowTop}>
                      <div className={styles.name}>{displayNameOf(it)}</div>
                      <div className={styles.symbol}>{it.symbol}</div>
                    </div>
                    <div className={styles.rowBottom}>
                      <span className={styles.badge}>
                        {it.provider === "JPX" ? "JPX" : "NASDAQ"}
                      </span>
                      <span className={styles.secondary}>{secondaryTextOf(it)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}