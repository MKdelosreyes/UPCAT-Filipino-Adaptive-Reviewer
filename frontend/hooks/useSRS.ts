"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import * as ProgressAPI from "@/lib/api/progress";
import * as ExercisesAPI from "@/lib/api/exercises";
import {
  initSrsCard,
  isDue,
  applySm2,
  type SrsCardState,
  type SrsGrade,
} from "@/utils/srs";

const STORAGE_KEY = "vocab-srs-v1";

type SrsMap = Record<string, SrsCardState>;

function normalizeLemmaId(raw: unknown): string {
  return String(raw ?? "").trim();
}

function lemmaIdToWordId(lemmaId: string): number | null {
  const m = normalizeLemmaId(lemmaId).match(/^LEX-(\d+)$/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

function wordIdToLemmaId(wordId: number): string {
  const n = Math.max(0, Math.trunc(wordId));
  return `LEX-${n.toString().padStart(3, "0")}`;
}

function loadFromStorage(): SrsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToStorage(map: SrsMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function convertBackendCard(backendCard: ProgressAPI.SRSCard): SrsCardState {
  return {
    id: backendCard.word_id,
    repetition: backendCard.repetitions,
    ease: backendCard.easiness_factor,
    interval: backendCard.interval,
    due: backendCard.next_review,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface UseSRSOptions {
  module: "vocabulary" | "grammar" | "sentence-construction";
  exerciseType?: ExercisesAPI.ExerciseType;
  targetDifficulty?: "easy" | "medium" | "hard";

  /** How many items you want to DISPLAY in the session. */
  sessionSize?: number;

  /** How many items to FETCH from ai-service as the candidate pool (should be >= sessionSize). */
  fetchLimit?: number;
}

export function useSRSWithExercises(options: UseSRSOptions) {
  const { user, tokens } = useAuth();
  const {
    module,
    exerciseType,
    targetDifficulty,
    sessionSize = 10,
    fetchLimit = 20,
  } = options;

  const [store, setStore] = useState<SrsMap>({});
  const [exercises, setExercises] = useState<any[]>([]);
  const [dueExercises, setDueExercises] = useState<any[]>([]);
  const [sessionExercises, setSessionExercises] = useState<any[]>([]);
  const [newExercises, setNewExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prevOptionsRef = useRef<string>("");

  const syncSRS = async () => {
    if (!user || !tokens) {
      const localStore = loadFromStorage();
      setStore(localStore);
      setExercises([]);
      setDueExercises([]);
      setSessionExercises([]);
      setNewExercises([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // 1) Fetch candidate exercises (pool) from AI service
      let fetchedExercises: any[] = [];

      if (module === "vocabulary") {
        fetchedExercises = await ExercisesAPI.getVocabularyExercisesAdaptive({
          userId: user.id.toString(),
          targetDifficulty,
          limit: fetchLimit,
          accessToken: tokens.access,
        });
      } else if (module === "grammar") {
        fetchedExercises = await ExercisesAPI.getGrammarExercisesAdaptive({
          userId: user.id.toString(),
          targetDifficulty,
          exerciseType: exerciseType as any,
          limit: fetchLimit,
          accessToken: tokens.access,
        });
      } else if (module === "sentence-construction") {
        fetchedExercises =
          await ExercisesAPI.getSentenceConstructionExercisesAdaptive({
            userId: user.id.toString(),
            targetDifficulty,
            exerciseType: exerciseType as any,
            limit: fetchLimit,
            accessToken: tokens.access,
          });
      }

      setExercises(fetchedExercises);

      // 2) Fetch SRS cards from backend (key by lemma_id)
      const response = await ProgressAPI.getAllSRSCards();
      const backendStore: SrsMap = {};

      response.all_cards.forEach((card) => {
        const lemmaId = wordIdToLemmaId(card.word_id);
        backendStore[lemmaId] = convertBackendCard(card);
      });

      // 3) Ensure every fetched exercise has a local SRS card state
      fetchedExercises.forEach((exercise) => {
        const lemmaId = normalizeLemmaId(exercise.lemma_id);
        if (!lemmaId) return;

        if (!backendStore[lemmaId]) {
          const wordId = lemmaIdToWordId(lemmaId) ?? 0;
          backendStore[lemmaId] = initSrsCard(wordId);
        }
      });

      setStore(backendStore);
      saveToStorage(backendStore);

      // 4) Partition into due vs not-due (within the fetched pool)
      const now = new Date();
      const due: any[] = [];
      const notDue: any[] = [];

      for (const ex of fetchedExercises) {
        const lemmaId = normalizeLemmaId(ex.lemma_id);
        const card = backendStore[lemmaId];
        if (!lemmaId || !card) continue;

        if (isDue(card, now)) due.push(ex);
        else notDue.push(ex);
      }

      setDueExercises(due);

      // 5) Build the final session list: due-first, then fill from not-due
      const dueShuffled = shuffle(due);
      const notDueShuffled = shuffle(notDue);

      const session: any[] = [];
      session.push(...dueShuffled.slice(0, sessionSize));

      if (session.length < sessionSize) {
        const remaining = sessionSize - session.length;
        session.push(...notDueShuffled.slice(0, remaining));
      }

      setSessionExercises(session);

      // The filler part only (useful for UI explanation)
      const fillerCount = Math.max(0, session.length - Math.min(due.length, sessionSize));
      setNewExercises(session.slice(session.length - fillerCount));
    } catch (error) {
      console.error("Failed to load SRS + exercises:", error);
      const localStore = loadFromStorage();
      setStore(localStore);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const optionsKey = JSON.stringify(options);
    if (optionsKey === prevOptionsRef.current) return;
    prevOptionsRef.current = optionsKey;

    syncSRS();
  }, [user?.id, module, exerciseType, targetDifficulty, sessionSize, fetchLimit]);

  const grade = async (lemmaIdRaw: string, g: SrsGrade) => {
    const lemmaId = normalizeLemmaId(lemmaIdRaw);
    const wordId = lemmaIdToWordId(lemmaId);

    const currentCard = store[lemmaId] ?? initSrsCard(wordId ?? 0);
    const updatedCard = applySm2(currentCard, g);

    setStore((prev) => {
      const next = { ...prev, [lemmaId]: updatedCard };
      saveToStorage(next);
      return next;
    });

    if (user && tokens && wordId !== null) {
      try {
        const backendCard = await ProgressAPI.updateSRSCard(wordId, g);
        setStore((prev) => {
          const next = { ...prev, [lemmaId]: convertBackendCard(backendCard) };
          saveToStorage(next);
          return next;
        });
      } catch (error) {
        console.error("Failed to update SRS card on backend:", error);
      }
    }
  };

  const get = (lemmaId: string) => store[normalizeLemmaId(lemmaId)];

  return {
    exercises,        // candidate pool
    dueExercises,     // due subset within pool
    sessionExercises, // due-first session (size=sessionSize)
    newExercises,     // filler subset used to complete session
    grade,
    get,
    isLoading,
    syncSRS,
    store,
  };
}

export { useSRSWithExercises as useSRS };