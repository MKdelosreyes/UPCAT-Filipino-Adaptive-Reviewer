"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PersistedEnvelope<T> = {
  v: number;
  savedAt: string; // ISO
  payload: T;
};

export function makeUserScopedStorageKey(user: any, baseKey: string) {
  const userKey =
    user?.id ?? user?.user_id ?? user?.email ?? user?.username ?? "anon";
  return `${baseKey}:${String(userKey)}`;
}

export function usePersistedQuizSession<TPayload>(opts: {
  /**
   * Full localStorage key. Pass null to disable persistence.
   * Tip: use makeUserScopedStorageKey(user, "far:quizSession:...").
   */
  key: string | null;
  version: number;
  ttlMs?: number;

  /**
   * If false, restore won't run (useful while auth/SRS data is still loading).
   * Default: true.
   */
  restoreWhen?: boolean;

  /**
   * If false, persist won't run.
   * Default: true.
   */
  persistWhen?: boolean;

  /**
   * When true, we stop persisting. If clearOnComplete is true, we also clear.
   */
  isComplete?: boolean;
  clearOnComplete?: boolean;

  /**
   * Whether the session has meaningful data to persist (e.g., questions loaded).
   * Default: true.
   */
  hasDataToPersist?: boolean;

  /**
   * Create the payload to persist.
   */
  snapshot: () => TPayload;

  /**
   * Apply a restored payload into React state.
   */
  restore: (payload: TPayload) => void;

  /**
   * Optional runtime validation for restored payload.
   */
  validate?: (payload: any) => payload is TPayload;
}) {
  const {
    key,
    version,
    ttlMs = 12 * 60 * 60 * 1000, // 12 hours default
    restoreWhen = true,
    persistWhen = true,
    isComplete = false,
    clearOnComplete = true,
    hasDataToPersist = true,
    snapshot,
    restore,
    validate,
  } = opts;

  const [didRestore, setDidRestore] = useState(false);
  const didAttemptRestoreRef = useRef(false);

  const clear = useCallback(() => {
    if (!key) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key]);

  // Restore (once)
  useEffect(() => {
    if (!key) return;
    if (!restoreWhen) return;
    if (didAttemptRestoreRef.current) return;

    didAttemptRestoreRef.current = true;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;

      const parsed = JSON.parse(raw) as PersistedEnvelope<TPayload>;

      if (!parsed || typeof parsed !== "object") {
        clear();
        return;
      }

      if (parsed.v !== version || typeof parsed.savedAt !== "string") {
        clear();
        return;
      }

      const age = Date.now() - new Date(parsed.savedAt).getTime();
      if (!Number.isFinite(age) || age > ttlMs) {
        clear();
        return;
      }

      const payload = (parsed as any).payload;

      if (validate && !validate(payload)) {
        clear();
        return;
      }

      restore(payload);
      setDidRestore(true);
    } catch {
      clear();
    }
  }, [key, restoreWhen, version, ttlMs, restore, validate, clear]);

  // Persist
  useEffect(() => {
    if (!key) return;
    if (!persistWhen) return;
    if (!hasDataToPersist) return;

    if (isComplete) {
      if (clearOnComplete) clear();
      return;
    }

    const envelope: PersistedEnvelope<TPayload> = {
      v: version,
      savedAt: new Date().toISOString(),
      payload: snapshot(),
    };

    try {
      localStorage.setItem(key, JSON.stringify(envelope));
    } catch {
      // ignore quota / private mode errors
    }
  });

  return useMemo(
    () => ({
      didRestore,
      clear,
    }),
    [didRestore, clear],
  );
}
