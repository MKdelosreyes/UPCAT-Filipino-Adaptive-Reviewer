"use client";

import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type {
  QuizProgress,
  ExerciseStatus,
  ReadingExercise,
  ReadingProgress as ReadingProgressType,
} from "@/contexts/LearningProgressContext";

export type ReadingMasteryLevel =
  | "beginner"
  | "developing"
  | "proficient"
  | "advanced"
  | "master";

export interface ReadingMastery {
  level: ReadingMasteryLevel;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  icon: string;
}

export interface ExerciseMastery {
  level: ReadingMasteryLevel;
  icon: string;
  difficulty: "easy" | "medium" | "hard";
  sessionsAtDifficulty: number;
  avgScore: number;
}

export function useReadingProgress() {
  const {
    progress,
    updateQuizProgress,
    getModuleProgress,
    canAccessExercise: canAccessExerciseContext,
    getNextRecommended: getNextRecommendedContext,
  } = useLearningProgress();

  const getExerciseProgress = (exercise: ReadingExercise): QuizProgress => {
    return (
      progress["reading-comprehension"]?.[exercise] || {
        status: "not-started",
        score: null,
        completedAt: null,
        attempts: 0,
        lastDifficulty: "easy" as const,
        errorTags: [],
        performanceHistory: [],
      }
    );
  };

  const getReadingMastery = (): ReadingMastery => {
    const reading = progress["reading-comprehension"] as ReadingProgressType;

    // ✅ Only use quiz exercises for mastery calculation
    const allHistory = [
      ...reading["passage-questions"].performanceHistory,
      ...reading["summary-exercise"].performanceHistory,
    ];

    if (allHistory.length === 0) {
      return {
        level: "beginner",
        difficulty: "easy",
        description: "Start your reading journey",
        icon: "🌱",
      };
    }

    const difficulties = [
      reading["passage-questions"].lastDifficulty,
      reading["summary-exercise"].lastDifficulty,
    ];

    const currentDiff = difficulties.reduce((max, diff) => {
      if (diff === "hard") return "hard";
      if (diff === "medium" && max !== "hard") return "medium";
      return max;
    }, "easy" as "easy" | "medium" | "hard");

    const sessionsAtDiff = allHistory.filter(
      (h) => h.difficulty === currentDiff
    ).length;

    const scoresAtDiff = allHistory
      .filter((h) => h.difficulty === currentDiff)
      .map((h) => h.score);

    const avgScore =
      scoresAtDiff.length > 0
        ? scoresAtDiff.reduce((a, b) => a + b, 0) / scoresAtDiff.length
        : 0;

    if (currentDiff === "hard" && sessionsAtDiff >= 5 && avgScore >= 90) {
      return {
        level: "master",
        difficulty: "hard",
        description: "Reading comprehension master! Exceptional performance",
        icon: "👑",
      };
    }

    if (currentDiff === "hard" && sessionsAtDiff >= 3) {
      return {
        level: "advanced",
        difficulty: "hard",
        description: "Tackling advanced reading with confidence",
        icon: "🏆",
      };
    }

    if (currentDiff === "medium" && sessionsAtDiff >= 3 && avgScore >= 75) {
      return {
        level: "proficient",
        difficulty: "medium",
        description: "Building strong reading comprehension foundations",
        icon: "⭐",
      };
    }

    if (sessionsAtDiff >= 3 || currentDiff === "medium") {
      return {
        level: "developing",
        difficulty: currentDiff,
        description: "Making steady progress",
        icon: "🔧",
      };
    }

    return {
      level: "beginner",
      difficulty: "easy",
      description: "Just getting started",
      icon: "🐣",
    };
  };

  // ✅ FIX: Only accepts QuizProgress now
  const getExerciseMastery = (
    exerciseProgress: QuizProgress
  ): ExerciseMastery => {
    // ✅ Safety check for performanceHistory
    if (
      !exerciseProgress.performanceHistory ||
      exerciseProgress.performanceHistory.length === 0
    ) {
      return {
        level: "beginner",
        icon: "🐣",
        difficulty: exerciseProgress.lastDifficulty || "easy",
        sessionsAtDifficulty: 0,
        avgScore: 0,
      };
    }

    const currentDiff = exerciseProgress.lastDifficulty;
    const history = exerciseProgress.performanceHistory.filter(
      (h) => h.difficulty === currentDiff
    );

    const sessionsAtDifficulty = history.length;
    const avgScore =
      history.length > 0
        ? history.reduce((sum, h) => sum + h.score, 0) / history.length
        : 0;

    let level: ReadingMasteryLevel = "beginner";
    let icon = "🐣";

    if (currentDiff === "hard" && sessionsAtDifficulty >= 5 && avgScore >= 90) {
      level = "master";
      icon = "👑";
    } else if (currentDiff === "hard" && sessionsAtDifficulty >= 3) {
      level = "advanced";
      icon = "🏆";
    } else if (
      currentDiff === "medium" &&
      sessionsAtDifficulty >= 3 &&
      avgScore >= 75
    ) {
      level = "proficient";
      icon = "⭐";
    } else if (sessionsAtDifficulty >= 3 || currentDiff === "medium") {
      level = "developing";
      icon = "🔧";
    }

    return {
      level,
      icon,
      difficulty: currentDiff,
      sessionsAtDifficulty,
      avgScore: Math.round(avgScore),
    };
  };

  const getQuizProgress = (
    exercise: "passage-questions" | "summary-exercise"
  ): QuizProgress => {
    return progress["reading-comprehension"][exercise];
  };

  return {
    progress: progress["reading-comprehension"],

    // ✅ NEW: Smart update function
    updateProgress: (
      exercise: ReadingExercise,
      data: Partial<QuizProgress>
    ) => {
      return updateQuizProgress(
        "reading-comprehension",
        exercise,
        data as Partial<QuizProgress>
      );
    },

    getOverallProgress: () => getModuleProgress("reading-comprehension"),
    getNextRecommended: () =>
      getNextRecommendedContext("reading-comprehension"),
    canAccessExercise: (exercise: ReadingExercise) =>
      canAccessExerciseContext("reading-comprehension", exercise),
    getReadingMastery,
    getExerciseMastery, // ✅ Now only accepts QuizProgress
    getExerciseProgress,
    getQuizProgress,
  };
}
