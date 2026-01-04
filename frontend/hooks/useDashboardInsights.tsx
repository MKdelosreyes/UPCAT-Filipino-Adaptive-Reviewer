"use client";

import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type {
  ModuleType,
  ExerciseProgress,
} from "@/contexts/LearningProgressContext";

export type MasteryLevel =
  | "beginner"
  | "developing"
  | "proficient"
  | "advanced"
  | "master";

export interface ModuleMastery {
  level: MasteryLevel;
  difficulty: "easy" | "medium" | "hard";
  icon: string;
  color: string;
}

export function useDashboardInsights() {
  const { progress } = useLearningProgress();

  const getModuleMastery = (module: ModuleType): ModuleMastery => {
    const moduleData = progress[module];

    // Aggregate all exercise histories
    const allHistory = [
      ...moduleData.flashcards.performanceHistory,
      ...moduleData.quiz.performanceHistory,
      ...moduleData["antonym"].performanceHistory,
    ];

    if (allHistory.length === 0) {
      return {
        level: "beginner",
        difficulty: "easy",
        icon: "🌱",
        color: "bg-gray-100 text-gray-700 border-gray-300",
      };
    }

    // Get current difficulty (highest across exercises)
    const difficulties = [
      moduleData.flashcards.lastDifficulty,
      moduleData.quiz.lastDifficulty,
      moduleData["antonym"].lastDifficulty,
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
        icon: "👑",
        color: "bg-yellow-100 text-yellow-700 border-yellow-400",
      };
    }

    if (currentDiff === "hard" && sessionsAtDiff >= 3) {
      return {
        level: "advanced",
        difficulty: "hard",
        icon: "🏆",
        color: "bg-orange-100 text-orange-700 border-orange-300",
      };
    }

    if (currentDiff === "medium" && sessionsAtDiff >= 3 && avgScore >= 75) {
      return {
        level: "proficient",
        difficulty: "medium",
        icon: "⭐",
        color: "bg-blue-100 text-blue-700 border-blue-300",
      };
    }

    if (sessionsAtDiff >= 3 || currentDiff === "medium") {
      return {
        level: "developing",
        difficulty: currentDiff,
        icon: "📘",
        color: "bg-blue-100 text-blue-700 border-blue-300",
      };
    }

    return {
      level: "beginner",
      difficulty: "easy",
      icon: "🌱",
      color: "bg-gray-100 text-gray-700 border-gray-300",
    };
  };

  return {
    getModuleMastery,
  };
}
