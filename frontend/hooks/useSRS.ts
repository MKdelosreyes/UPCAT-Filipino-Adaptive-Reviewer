"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import * as ProgressAPI from "@/lib/api/progress";
import * as ExercisesAPI from "@/lib/api/exercises";
import { initSrsCard, isDue, applySm2, type SrsCardState, type SrsGrade } from "@/utils/srs";

const STORAGE_KEY = "vocab-srs-v1";

type SrsMap = Record<string, SrsCardState>;

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

interface UseSRSOptions {
  module: "vocabulary" | "grammar" | "sentence-construction";
  exerciseType?: ExercisesAPI.ExerciseType;
  targetDifficulty?: "easy" | "medium" | "hard";
  limit?: number;
}

export function useSRSWithExercises(options: UseSRSOptions) {
  const { user, tokens } = useAuth();
  const { module, exerciseType, targetDifficulty, limit = 15 } = options;
  
  const [store, setStore] = useState<SrsMap>({});
  const [exercises, setExercises] = useState<any[]>([]);
  const [dueExercises, setDueExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prevOptionsRef = useRef<string>("");

  const syncSRS = async () => {
    if (!user || !tokens) {
      const localStore = loadFromStorage();
      setStore(localStore);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // 1. Fetch exercises from AI service
      let fetchedExercises: any[] = [];
      
      if (module === "vocabulary") {
        fetchedExercises = await ExercisesAPI.getVocabularyExercisesAdaptive({
          userId: user.id.toString(),
          targetDifficulty,
          limit,
        });
      } else if (module === "grammar") {
        fetchedExercises = await ExercisesAPI.getGrammarExercisesAdaptive({
          userId: user.id.toString(),
          targetDifficulty,
          exerciseType: exerciseType as "error_identification" | "fill-blanks",
          limit,
        });
      } else if (module === "sentence-construction") {
        fetchedExercises = await ExercisesAPI.getSentenceConstructionExercisesAdaptive({
          userId: user.id.toString(),
          targetDifficulty,
          exerciseType: exerciseType as "ordering" | "choose" | "complete",
          limit,
        });
      }

      setExercises(fetchedExercises);

      // 2. Fetch SRS cards from backend
      const response = await ProgressAPI.getAllSRSCards();
      
      const backendStore: SrsMap = {};
      response.all_cards.forEach((card) => {
        backendStore[card.word_id.toString()] = convertBackendCard(card);
      });

      // 3. Initialize SRS cards for exercises that don't have them
      fetchedExercises.forEach((exercise) => {
        const lemmaId = exercise.lemma_id;
        if (!backendStore[lemmaId]) {
          // ✅ FIXED: Convert string lemma_id to number for initSrsCard
          const numericId = parseInt(lemmaId, 10);
          backendStore[lemmaId] = initSrsCard(isNaN(numericId) ? 0 : numericId);
        }
      });

      setStore(backendStore);
      saveToStorage(backendStore);

      // 4. Filter due exercises
      const now = new Date();
      const due = fetchedExercises.filter((ex) => {
        const card = backendStore[ex.lemma_id];
        return card && isDue(card, now);
      });
      setDueExercises(due);

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
  }, [user?.id, module, exerciseType, targetDifficulty, limit]);

  const grade = async (lemmaId: string, g: SrsGrade) => {
    // ✅ FIXED: Convert string lemma_id to number for initSrsCard
    const numericId = parseInt(lemmaId, 10);
    const currentCard = store[lemmaId] ?? initSrsCard(isNaN(numericId) ? 0 : numericId);
    const updatedCard = applySm2(currentCard, g);

    // Optimistic update
    setStore((prev) => {
      const next = { ...prev, [lemmaId]: updatedCard };
      saveToStorage(next);
      return next;
    });

    // Sync to backend
    if (user && tokens) {
      try {
        const wordId = parseInt(lemmaId, 10);
        if (!isNaN(wordId)) {
          const backendCard = await ProgressAPI.updateSRSCard(wordId, g);
          setStore((prev) => ({
            ...prev,
            [lemmaId]: convertBackendCard(backendCard),
          }));
          const updatedStore = { ...store, [lemmaId]: convertBackendCard(backendCard) };
          saveToStorage(updatedStore);
        }
      } catch (error) {
        console.error("Failed to update SRS card on backend:", error);
      }
    }
  };

  const get = (lemmaId: string) => store[lemmaId];

  return {
    exercises,
    dueExercises,
    grade,
    get,
    isLoading,
    syncSRS,
    store,
  };
}

// ✅ ALSO EXPORT AS DEFAULT NAME FOR BACKWARD COMPATIBILITY
export { useSRSWithExercises as useSRS };