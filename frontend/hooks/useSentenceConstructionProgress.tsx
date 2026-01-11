"use client";

import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type {
  QuizProgress,
  SentenceExercise,
} from "@/contexts/LearningProgressContext";

export type MasteryLevel =
  | "beginner"
  | "developing"
  | "proficient"
  | "advanced"
  | "master";

export interface SentenceConstructionMastery {
  level: MasteryLevel;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  icon: string;
}

export interface ExerciseMastery {
  level: MasteryLevel;
  icon: string;
  difficulty: "easy" | "medium" | "hard";
  sessionsAtDifficulty: number;
  avgScore: number;
}

export function useSentenceConstructionProgress() {
  const {
    progress,
    updateQuizProgress,
    getModuleProgress,
    getNextRecommended,
    canAccessExercise,
  } = useLearningProgress();

  const getSentenceConstructionMastery = (): SentenceConstructionMastery => {
    const sentenceConstruction = progress["sentence-construction"];

    const allHistory = [
      ...sentenceConstruction["complete-sentence"].performanceHistory,
      ...sentenceConstruction["sentence-ordering"].performanceHistory,
      ...sentenceConstruction["fill-missing"].performanceHistory,
    ];

    if (allHistory.length === 0) {
      return {
        level: "beginner",
        difficulty: "easy",
        description: "Start building sentences",
        icon: "🌱",
      };
    }

    // Get current difficulty (highest across exercises)
    const difficulties = [
      sentenceConstruction["complete-sentence"].lastDifficulty,
      sentenceConstruction["sentence-ordering"].lastDifficulty,
      sentenceConstruction["fill-missing"].lastDifficulty,
    ];

    const currentDiff = difficulties.reduce((max, diff) => {
      if (diff === "hard") return "hard";
      if (diff === "medium" && max !== "hard") return "medium";
      return max;
    }, "easy" as "easy" | "medium" | "hard");

    // Count sessions at current difficulty
    const sessionsAtDiff = allHistory.filter(
      (h) => h.difficulty === currentDiff
    ).length;

    // Average score at current difficulty
    const scoresAtDiff = allHistory
      .filter((h) => h.difficulty === currentDiff)
      .map((h) => h.score);

    const avgScore =
      scoresAtDiff.length > 0
        ? scoresAtDiff.reduce((a, b) => a + b, 0) / scoresAtDiff.length
        : 0;

    // Determine mastery level
    if (currentDiff === "hard" && sessionsAtDiff >= 5 && avgScore >= 90) {
      return {
        level: "master",
        difficulty: "hard",
        description: "Sentence master! Exceptional construction skills",
        icon: "👑",
      };
    }

    if (currentDiff === "hard" && sessionsAtDiff >= 3) {
      return {
        level: "advanced",
        difficulty: "hard",
        description: "Crafting complex sentences with confidence",
        icon: "🏆",
      };
    }

    if (currentDiff === "medium" && sessionsAtDiff >= 3 && avgScore >= 75) {
      return {
        level: "proficient",
        difficulty: "medium",
        description: "Building strong sentence foundations",
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

  const getExerciseMastery = (exercise: QuizProgress): ExerciseMastery => {
    const currentDiff = exercise.lastDifficulty;
    const history = exercise.performanceHistory.filter(
      (h) => h.difficulty === currentDiff
    );

    const sessionsAtDifficulty = history.length;
    const avgScore =
      history.length > 0
        ? history.reduce((sum, h) => sum + h.score, 0) / history.length
        : 0;

    let level: MasteryLevel = "beginner";
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

  const getExerciseProgress = (exercise: SentenceExercise): QuizProgress => {
    return progress["sentence-construction"][exercise];
  };

  return {
    progress: progress["sentence-construction"],
    updateProgress: (exercise: SentenceExercise, data: Partial<QuizProgress>) =>
      updateQuizProgress("sentence-construction", exercise, data),
    getOverallProgress: () => getModuleProgress("sentence-construction"),
    getNextRecommended: () => getNextRecommended("sentence-construction"),
    canAccessExercise: (exercise: SentenceExercise) =>
      canAccessExercise("sentence-construction", exercise),
    getSentenceConstructionMastery,
    getExerciseMastery,
    getExerciseProgress,
  };
}
