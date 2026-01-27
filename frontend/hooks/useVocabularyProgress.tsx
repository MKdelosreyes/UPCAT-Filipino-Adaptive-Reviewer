"use client";

import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type {
  LessonProgress,
  QuizProgress,
  VocabularyExercise,
  VocabularyProgress,
} from "@/contexts/LearningProgressContext";

export type MasteryLevel =
  | "beginner"
  | "developing"
  | "proficient"
  | "advanced"
  | "master";

export interface VocabularyMastery {
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

export function useVocabularyProgress() {
  const {
    progress,
    updateLessonProgress,
    updateQuizProgress,
    getModuleProgress,
    // getNextRecommended,
    canAccessExercise,
    isLessonExercise,
  } = useLearningProgress();

  const getVocabularyMastery = (): VocabularyMastery => {
    const vocab = progress.vocabulary as VocabularyProgress;

    const allHistory = [
      ...vocab.quiz.performanceHistory,
      ...vocab.antonym.performanceHistory,
    ];

    if (allHistory.length === 0) {
      return {
        level: "beginner",
        difficulty: "easy",
        description: "Start your vocabulary journey",
        icon: "🌱",
      };
    }

    const difficulties = [
      vocab.quiz.lastDifficulty,
      vocab.antonym.lastDifficulty,
    ];

    const currentDiff = difficulties.reduce(
      (max, diff) => {
        if (diff === "hard") return "hard";
        if (diff === "medium" && max !== "hard") return "medium";
        return max;
      },
      "easy" as "easy" | "medium" | "hard",
    );

    const sessionsAtDiff = allHistory.filter(
      (h) => h.difficulty === currentDiff,
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
        description: "Vocabulary master! Exceptional performance",
        icon: "👑",
      };
    }

    if (currentDiff === "hard" && sessionsAtDiff >= 3) {
      return {
        level: "advanced",
        difficulty: "hard",
        description: "Tackling advanced vocabulary with confidence",
        icon: "🏆",
      };
    }

    if (currentDiff === "medium" && sessionsAtDiff >= 3 && avgScore >= 75) {
      return {
        level: "proficient",
        difficulty: "medium",
        description: "Building strong vocabulary foundations",
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
      (h) => h.difficulty === currentDiff,
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

  const getQuizProgress = (exercise: "quiz" | "antonym"): QuizProgress => {
    return progress.vocabulary[exercise];
  };

  const getLessonProgress = (exercise: "flashcards"): LessonProgress => {
    return progress.vocabulary[exercise];
  };

  const getExerciseProgress = (
    exercise: VocabularyExercise,
  ): LessonProgress | QuizProgress => {
    return progress.vocabulary[exercise];
  };

  return {
    progress: progress.vocabulary,
    updateProgress: (
      exercise: VocabularyExercise,
      data: Partial<LessonProgress> | Partial<QuizProgress>,
    ) => {
      if (exercise === "flashcards") {
        return updateLessonProgress(
          "vocabulary",
          exercise,
          data as Partial<LessonProgress>,
        );
      } else {
        return updateQuizProgress(
          "vocabulary",
          exercise,
          data as Partial<QuizProgress>,
        );
      }
    },

    getOverallProgress: () => getModuleProgress("vocabulary"),
    // getNextRecommended: () => getNextRecommended("vocabulary"),
    canAccessExercise: (exercise: VocabularyExercise) =>
      canAccessExercise("vocabulary", exercise),
    getVocabularyMastery,
    getExerciseMastery,
    getExerciseProgress,
    getQuizProgress,
    getLessonProgress,
    isLessonExercise: (exercise: VocabularyExercise) =>
      isLessonExercise("vocabulary", exercise),
  };
}
