"use client";

import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type {
  LessonProgress,
  QuizProgress,
  GrammarExercise,
  GrammarProgress,
} from "@/contexts/LearningProgressContext";

export type MasteryLevel =
  | "beginner"
  | "developing"
  | "proficient"
  | "advanced"
  | "master";

export interface GrammarMastery {
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

export function useGrammarProgress() {
  const {
    progress,
    updateLessonProgress,
    updateQuizProgress,
    getModuleProgress,
    // getNextRecommended,
    canAccessExercise,
    isLessonExercise,
  } = useLearningProgress();

  const getGrammarMastery = (): GrammarMastery => {
    const grammar = progress.grammar as GrammarProgress;

    const allHistory = [
      ...grammar["error-identification"].performanceHistory,
      ...grammar["fill-blanks"].performanceHistory,
    ];

    if (allHistory.length === 0) {
      return {
        level: "beginner",
        difficulty: "easy",
        description: "Start your grammar journey",
        icon: "🌱",
      };
    }

    const difficulties = [
      grammar["error-identification"].lastDifficulty,
      grammar["fill-blanks"].lastDifficulty,
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
        description: "Grammar master! Exceptional performance",
        icon: "👑",
      };
    }

    if (currentDiff === "hard" && sessionsAtDiff >= 3) {
      return {
        level: "advanced",
        difficulty: "hard",
        description: "Tackling advanced grammar with confidence",
        icon: "🏆",
      };
    }

    if (currentDiff === "medium" && sessionsAtDiff >= 3 && avgScore >= 75) {
      return {
        level: "proficient",
        difficulty: "medium",
        description: "Building strong grammar foundations",
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
    if (
      !exercise.performanceHistory ||
      exercise.performanceHistory.length === 0
    ) {
      return {
        level: "beginner",
        icon: "🐣",
        difficulty: exercise.lastDifficulty || "easy",
        sessionsAtDifficulty: 0,
        avgScore: 0,
      };
    }

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

  const getExerciseProgress = (
    exercise: GrammarExercise
  ): LessonProgress | QuizProgress => {
    return progress.grammar[exercise];
  };

  return {
    progress: progress.grammar,

    updateProgress: (
      exercise: GrammarExercise,
      data: Partial<LessonProgress> | Partial<QuizProgress>
    ) => {
      if (exercise === "lesson-cards") {
        return updateLessonProgress(
          "grammar",
          exercise,
          data as Partial<LessonProgress>
        );
      } else {
        return updateQuizProgress(
          "grammar",
          exercise,
          data as Partial<QuizProgress>
        );
      }
    },

    getOverallProgress: () => getModuleProgress("grammar"),
    // getNextRecommended: () => getNextRecommended("grammar"),
    canAccessExercise: (exercise: GrammarExercise) =>
      canAccessExercise("grammar", exercise),
    getGrammarMastery,
    getExerciseMastery,
    getExerciseProgress,
    isLessonExercise: (exercise: GrammarExercise) =>
      isLessonExercise("grammar", exercise),
  };
}
