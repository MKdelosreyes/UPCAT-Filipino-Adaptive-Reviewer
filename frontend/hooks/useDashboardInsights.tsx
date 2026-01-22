"use client";

import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type {
  ModuleType,
  VocabularyProgress,
  GrammarProgress,
  SentenceProgress,
  ReadingProgress,
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

    let allHistory: Array<{
      difficulty: "easy" | "medium" | "hard";
      score: number;
      missedLowFreq: number;
      similarChoiceErrors: number;
      timestamp: string;
    }> = [];

    if (module === "vocabulary") {
      const vocab = moduleData as VocabularyProgress;
      allHistory = [
        ...vocab.quiz.performanceHistory,
        ...vocab.antonym.performanceHistory,
      ];
    } else if (module === "grammar") {
      const grammar = moduleData as GrammarProgress;
      allHistory = [
        ...grammar["error-identification"].performanceHistory,
        ...grammar["fill-blanks"].performanceHistory,
      ];
    } else if (module === "sentence-construction") {
      const sentence = moduleData as SentenceProgress;

      allHistory = [
        ...sentence["complete-sentence"].performanceHistory,
        ...sentence["sentence-ordering"].performanceHistory,
        ...sentence["choose-sentence"].performanceHistory,
      ];
    } else if (module === "reading-comprehension") {
      const reading = moduleData as ReadingProgress;
      allHistory = [
        ...reading["passage-questions"].performanceHistory,
        ...reading["summary-exercise"].performanceHistory,
      ];
    }

    if (allHistory.length === 0) {
      return {
        level: "beginner",
        difficulty: "easy",
        icon: "🌱",
        color: "bg-gray-100 text-gray-700 border-gray-300",
      };
    }

    // Get current difficulty (highest across exercises)
    let difficulties: Array<"easy" | "medium" | "hard"> = [];

    if (module === "vocabulary") {
      const vocab = moduleData as VocabularyProgress;
      difficulties = [vocab.quiz.lastDifficulty, vocab.antonym.lastDifficulty];
    } else if (module === "grammar") {
      const grammar = moduleData as GrammarProgress;
      difficulties = [
        grammar["error-identification"].lastDifficulty,
        grammar["fill-blanks"].lastDifficulty,
      ];
    } else if (module === "sentence-construction") {
      const sentence = moduleData as SentenceProgress;

      difficulties = [
        sentence["complete-sentence"].lastDifficulty,
        sentence["sentence-ordering"].lastDifficulty,
        sentence["choose-sentence"].lastDifficulty,
      ];
    } else if (module === "reading-comprehension") {
      const reading = moduleData as ReadingProgress;
      difficulties = [
        reading["passage-questions"].lastDifficulty,
        reading["summary-exercise"].lastDifficulty,
      ];
    }

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
        color: "bg-blue-100 text-blue-700 border-blue-300",
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
        color: "bg-green-100 text-green-700 border-green-300",
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
