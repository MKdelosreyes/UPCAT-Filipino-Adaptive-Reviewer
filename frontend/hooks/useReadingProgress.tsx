"use client";

import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type {
  ExerciseProgress as BaseExerciseProgress,
  ExerciseStatus,
} from "@/contexts/LearningProgressContext";

interface ReadingProgress {
  status: ExerciseStatus;
  score?: number | null;
  completedAt?: string | null;
  attempts?: number;
  passagesRead?: number;
}

export type ReadingMasteryLevel =
  | "beginner"
  | "developing"
  | "proficient"
  | "advanced"
  | "master";

interface ReadingMastery {
  level: ReadingMasteryLevel;
  icon: string;
  description: string;
  comprehensionScore: number;
}

export function useReadingProgress() {
  const { progress, updateProgress: updateLearningProgress } =
    useLearningProgress();

  const getReadingProgress = (): ReadingProgress => {
    const readingProgress = progress["reading-comprehension"]?.flashcards || {
      status: "not-started",
      score: null,
      completedAt: null,
      attempts: 0,
      performanceHistory: [],
    };

    return {
      status: readingProgress.status,
      score: readingProgress.score,
      completedAt: readingProgress.completedAt,
      attempts: readingProgress.attempts || 0,
      passagesRead: readingProgress.attempts || 0,
    };
  };

  const updateProgress = (data: Partial<BaseExerciseProgress>) => {
    updateLearningProgress("reading-comprehension", "flashcards", data);
  };

  const getReadingMastery = (): ReadingMastery => {
    const reading = progress["reading-comprehension"]?.flashcards;
    if (!reading) {
      return {
        level: "beginner",
        icon: "📖",
        description: "Begin your reading journey",
        comprehensionScore: 0,
      };
    }

    const history = reading.performanceHistory || [];
    const avgScore =
      history.length > 0
        ? history.reduce((sum: number, h: any) => sum + h.score, 0) /
          history.length
        : 0;

    const passagesRead = reading.attempts || 0;

    let level: ReadingMasteryLevel = "beginner";
    let icon = "📖";
    let description = "Begin your reading journey";

    if (passagesRead >= 10 && avgScore >= 90) {
      level = "master";
      icon = "🎓";
      description = "Master of comprehension - exceptional understanding";
    } else if (passagesRead >= 7 && avgScore >= 80) {
      level = "advanced";
      icon = "🏆";
      description = "Advanced reader with strong analytical skills";
    } else if (passagesRead >= 5 && avgScore >= 70) {
      level = "proficient";
      icon = "⭐";
      description = "Proficient reader making great progress";
    } else if (passagesRead >= 2 || avgScore >= 60) {
      level = "developing";
      icon = "🌱";
      description = "Developing comprehension skills steadily";
    }

    return {
      level,
      icon,
      description,
      comprehensionScore: Math.round(avgScore),
    };
  };

  return {
    getReadingProgress,
    updateProgress,
    getReadingMastery,
  };
}
