"use client";

import { useEffect, useRef, useState } from "react";
import {
  pickMotivationalQuote,
  type MotivationalQuote,
} from "@/lib/motivationQuotes";

// Note: rotateMs kept for backward-compat with existing calls, but it's not used
export function useMotivationalQuote(active: boolean, _rotateMs = 4500) {
  const [quote, setQuote] = useState<MotivationalQuote | null>(() =>
    pickMotivationalQuote(),
  );

  const wasActiveRef = useRef(false);

  useEffect(() => {
    // When loading starts (false -> true), pick exactly one new quote
    if (active && !wasActiveRef.current) {
      setQuote((prev) => pickMotivationalQuote(prev?.text ?? undefined));
      wasActiveRef.current = true;
      return;
    }

    // When loading ends, reset the guard so next loading gets a new quote
    if (!active && wasActiveRef.current) {
      wasActiveRef.current = false;
    }
  }, [active]);

  return quote;
}