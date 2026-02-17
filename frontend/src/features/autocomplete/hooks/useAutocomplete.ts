// src/features/autocomplete/hooks/useAutocomplete.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AutocompleteItem, InstrumentProvider } from "../api/types";
import { getAutocomplete } from "../api/autocompleteApi";

export function useAutocomplete(opts?: {
  initialProvider?: InstrumentProvider; // ✅ ALL 제거
  debounceMs?: number;
  minChars?: number;
}) {
  const initialProvider = opts?.initialProvider ?? "JPX";
  const debounceMs = opts?.debounceMs ?? 180;
  const minChars = opts?.minChars ?? 1;

  const [q, setQ] = useState("");
  const [provider, setProvider] = useState<InstrumentProvider>(initialProvider);
  const [items, setItems] = useState<AutocompleteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const reqIdRef = useRef(0);

  const reset = useCallback(() => {
    setQ("");
    setProvider(initialProvider);
    setItems([]);
    setLoading(false);
    setError(null);
  }, [initialProvider]);

  useEffect(() => {
    const query = q.trim();
    if (query.length < minChars) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(async () => {
      const myReqId = ++reqIdRef.current;

      try {
        setLoading(true);
        setError(null);

        // ✅ provider는 항상 보냄 (백엔드 요구사항)
        const res = await getAutocomplete({ q: query, provider });

        if (reqIdRef.current !== myReqId) return;
        setItems(res.items ?? []);
      } catch (e: any) {
        if (reqIdRef.current !== myReqId) return;
        setError(e?.message ?? "検索に失敗しました");
        setItems([]);
      } finally {
        if (reqIdRef.current === myReqId) setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [q, provider, debounceMs, minChars]);

  return { q, setQ, provider, setProvider, items, loading, error, reset };
}