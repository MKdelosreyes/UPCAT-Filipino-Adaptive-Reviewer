"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import * as ProgressAPI from "@/lib/api/progress";

// Distinguish between lesson and quiz exercises
export type VocabularyLessonExercise = "flashcards";
export type VocabularyQuizExercise = "quiz" | "antonym";
export type VocabularyExercise =
  | VocabularyLessonExercise
  | VocabularyQuizExercise;

export type GrammarLessonExercise = "lesson-cards";
export type GrammarQuizExercise = "error-identification" | "fill-blanks";
export type GrammarExercise = GrammarLessonExercise | GrammarQuizExercise;

export type SentenceExercise =
  | "complete-sentence"
  | "sentence-ordering"
  | "choose-sentence";
export type ReadingExercise = "passage-questions" | "summary-exercise";

export type ExerciseType =
  | VocabularyExercise
  | GrammarExercise
  | SentenceExercise
  | ReadingExercise;

export type ModuleType =
  | "vocabulary"
  | "grammar"
  | "sentence-construction"
  | "reading-comprehension";

export type ExerciseStatus = "not-started" | "in-progress";

// Different interfaces for lessons vs quizzes
export interface LessonProgress {
  status: ExerciseStatus;
  completedAt: string | null;
  timeSpent: number; // in seconds
  cardsReviewed?: number; // for flashcards
  lessonsViewed?: number; // for lesson cards
}

export interface QuizProgress {
  status: ExerciseStatus;
  score: number | null;
  completedAt: string | null;
  attempts: number;
  lastDifficulty: "easy" | "medium" | "hard";
  errorTags: string[];
  performanceHistory: PerformanceMetrics[];
}

export interface PerformanceMetrics {
  difficulty: "easy" | "medium" | "hard";
  score: number;
  missedLowFreq: number;
  similarChoiceErrors: number;
  timestamp: string;
}

// UPDATED: Module progress with lessons + quizzes
export interface VocabularyProgress {
  flashcards: LessonProgress;
  quiz: QuizProgress;
  antonym: QuizProgress;
  lastAccessedAt: string | null;
}

export interface GrammarProgress {
  "lesson-cards": LessonProgress;
  "error-identification": QuizProgress;
  "fill-blanks": QuizProgress;
  lastAccessedAt: string | null;
}

export interface SentenceProgress {
  "complete-sentence": QuizProgress;
  "sentence-ordering": QuizProgress;
  "choose-sentence": QuizProgress;
  lastAccessedAt: string | null;
}

export interface ReadingProgress {
  "passage-questions": QuizProgress;
  "summary-exercise": QuizProgress;
  lastAccessedAt: string | null;
}

export interface AllModulesProgress {
  vocabulary: VocabularyProgress;
  grammar: GrammarProgress;
  "sentence-construction": SentenceProgress;
  "reading-comprehension": ReadingProgress;
  recommendedModule: ModuleType;
  lastCompletedModule: ModuleType | null;
}

const isLessonFinished = (lesson: LessonProgress): boolean => {
  return lesson.timeSpent >= 300;
};

const hasGoodMastery = (quiz: QuizProgress): boolean => {
  if (quiz.performanceHistory.length === 0) return false;

  const recentHistory = quiz.performanceHistory.slice(-5); // Last 5 attempts
  const avgScore =
    recentHistory.reduce((sum, h) => sum + h.score, 0) / recentHistory.length;

  return avgScore >= 80 && quiz.lastDifficulty === "hard";
};

interface LearningProgressContextType {
  progress: AllModulesProgress;
  isLoading: boolean;
  error: string | null;
  studyStreak: {
    current: number;
    longest: number;
    last_study_date: string | null;
  };

  updateLessonProgress: (
    module: ModuleType,
    exercise: VocabularyLessonExercise | GrammarLessonExercise,
    data: Partial<LessonProgress>
  ) => Promise<void>;

  updateQuizProgress: (
    module: ModuleType,
    exercise: Exclude<
      ExerciseType,
      VocabularyLessonExercise | GrammarLessonExercise
    >,
    data: Partial<QuizProgress>
  ) => Promise<void>;

  resetProgress: (module?: ModuleType) => Promise<void>;
  syncProgress: () => Promise<void>;
  getModuleProgress: (module: ModuleType) => number;
  getOverallProgress: () => number;
  getNextRecommended: (module: ModuleType) => ExerciseType | null;
  canAccessExercise: (module: ModuleType, exercise: ExerciseType) => boolean;
  isModuleCompleted: (module: ModuleType) => boolean;
  getRecommendedModule: () => ModuleType;
  markModuleAccessed: (module: ModuleType) => void;
  getModuleRecommendationReason: (module: ModuleType) => string;
  addPerformanceMetrics: (
    module: ModuleType,
    exercise: Exclude<
      ExerciseType,
      VocabularyLessonExercise | GrammarLessonExercise
    >,
    metrics: PerformanceMetrics
  ) => Promise<void>;
  getPerformanceHistory: (
    module: ModuleType,
    exercise: ExerciseType
  ) => PerformanceMetrics[];
  getModuleExercises: (module: ModuleType) => ExerciseType[];
  isLessonExercise: (module: ModuleType, exercise: ExerciseType) => boolean;
}

const defaultLessonProgress: LessonProgress = {
  status: "not-started",
  completedAt: null,
  timeSpent: 0,
};

const defaultQuizProgress: QuizProgress = {
  status: "not-started",
  score: null,
  completedAt: null,
  attempts: 0,
  lastDifficulty: "easy",
  errorTags: [],
  performanceHistory: [],
};

const createDefaultVocabularyProgress = (): VocabularyProgress => ({
  flashcards: { ...defaultLessonProgress, status: "not-started" },
  quiz: { ...defaultQuizProgress, status: "not-started" },
  antonym: { ...defaultQuizProgress, status: "not-started" },
  lastAccessedAt: null,
});

const createDefaultGrammarProgress = (): GrammarProgress => ({
  "lesson-cards": { ...defaultLessonProgress, status: "not-started" },
  "error-identification": { ...defaultQuizProgress, status: "not-started" },
  "fill-blanks": { ...defaultQuizProgress, status: "not-started" },
  lastAccessedAt: null,
});

const createDefaultSentenceProgress = (): SentenceProgress => ({
  "complete-sentence": { ...defaultQuizProgress, status: "not-started" },
  "sentence-ordering": { ...defaultQuizProgress, status: "not-started" },
  "choose-sentence": { ...defaultQuizProgress, status: "not-started" },
  lastAccessedAt: null,
});

const createDefaultReadingProgress = (): ReadingProgress => ({
  "passage-questions": { ...defaultQuizProgress, status: "not-started" },
  "summary-exercise": { ...defaultQuizProgress, status: "not-started" },
  lastAccessedAt: null,
});

const defaultProgress: AllModulesProgress = {
  vocabulary: createDefaultVocabularyProgress(),
  grammar: createDefaultGrammarProgress(),
  "sentence-construction": createDefaultSentenceProgress(),
  "reading-comprehension": createDefaultReadingProgress(),
  recommendedModule: "vocabulary",
  lastCompletedModule: null,
};

const LearningProgressContext = createContext<
  LearningProgressContextType | undefined
>(undefined);

export function LearningProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tokens } = useAuth();
  const [progress, setProgress] = useState<AllModulesProgress>(defaultProgress);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studyStreak, setStudyStreak] = useState({
    current: 0,
    longest: 0,
    last_study_date: null as string | null,
  });

  const isLessonExercise = (
    module: ModuleType,
    exercise: ExerciseType
  ): boolean => {
    if (module === "vocabulary") return exercise === "flashcards";
    if (module === "grammar") return exercise === "lesson-cards";
    return false;
  };

  const getExerciseProgressTyped = (
    module: ModuleType,
    exercise: ExerciseType
  ): LessonProgress | QuizProgress | null => {
    const moduleData = progress[module];

    if (module === "vocabulary") {
      const vocabData = moduleData as VocabularyProgress;
      if (
        exercise === "flashcards" ||
        exercise === "quiz" ||
        exercise === "antonym"
      ) {
        return vocabData[exercise];
      }
    } else if (module === "grammar") {
      const grammarData = moduleData as GrammarProgress;
      if (
        exercise === "lesson-cards" ||
        exercise === "error-identification" ||
        exercise === "fill-blanks"
      ) {
        return grammarData[exercise];
      }
    } else if (module === "sentence-construction") {
      const sentenceData = moduleData as SentenceProgress;
      if (
        exercise === "complete-sentence" ||
        exercise === "sentence-ordering" ||
        exercise === "choose-sentence"
      ) {
        return sentenceData[exercise];
      }
    } else if (module === "reading-comprehension") {
      const readingData = moduleData as ReadingProgress;
      if (exercise === "passage-questions" || exercise === "summary-exercise") {
        return readingData[exercise];
      }
    }

    return null;
  };

  const updateLessonProgress = async (
    module: ModuleType,
    exercise: VocabularyLessonExercise | GrammarLessonExercise,
    data: Partial<LessonProgress>
  ) => {
    setProgress((prev) => {
      if (module === "vocabulary" && exercise === "flashcards") {
        const moduleProgress = { ...prev[module] } as VocabularyProgress;

        moduleProgress.flashcards = {
          ...moduleProgress.flashcards,
          ...data,
        };

        return {
          ...prev,
          [module]: moduleProgress,
        };
      } else if (module === "grammar" && exercise === "lesson-cards") {
        const moduleProgress = { ...prev[module] } as GrammarProgress;

        moduleProgress["lesson-cards"] = {
          ...moduleProgress["lesson-cards"],
          ...data,
        };

        return {
          ...prev,
          [module]: moduleProgress,
        };
      }

      return prev;
    });

    if (user && tokens) {
      try {
        await ProgressAPI.updateExerciseProgress(module, exercise, {
          status: data.status,
          completedAt: data.completedAt ?? undefined,
          timeSpent: data.timeSpent,
          cardsReviewed: data.cardsReviewed,
          lessonsViewed: data.lessonsViewed,
        });
      } catch (err) {
        console.error("Failed to sync lesson progress:", err);
      }
    }
  };

  const updateQuizProgress = async (
    module: ModuleType,
    exercise: Exclude<
      ExerciseType,
      VocabularyLessonExercise | GrammarLessonExercise
    >,
    data: Partial<QuizProgress>
  ) => {
    setProgress((prev) => {
      if (
        module === "vocabulary" &&
        (exercise === "quiz" || exercise === "antonym")
      ) {
        const moduleProgress = { ...prev[module] } as VocabularyProgress;

        moduleProgress[exercise] = {
          ...moduleProgress[exercise],
          ...data,
        };

        return {
          ...prev,
          [module]: moduleProgress,
        };
      } else if (
        module === "grammar" &&
        (exercise === "error-identification" || exercise === "fill-blanks")
      ) {
        const moduleProgress = { ...prev[module] } as GrammarProgress;

        moduleProgress[exercise] = {
          ...moduleProgress[exercise],
          ...data,
        };

        return {
          ...prev,
          [module]: moduleProgress,
        };
      } else if (
        module === "sentence-construction" &&
        (exercise === "complete-sentence" ||
          exercise === "sentence-ordering" ||
          exercise === "choose-sentence")
      ) {
        const moduleProgress = { ...prev[module] } as SentenceProgress;

        moduleProgress[exercise] = {
          ...moduleProgress[exercise],
          ...data,
        };

        return {
          ...prev,
          [module]: moduleProgress,
        };
      } else if (
        module === "reading-comprehension" &&
        (exercise === "passage-questions" || exercise === "summary-exercise")
      ) {
        const moduleProgress = { ...prev[module] } as ReadingProgress;

        moduleProgress[exercise] = {
          ...moduleProgress[exercise],
          ...data,
        };

        return {
          ...prev,
          [module]: moduleProgress,
        };
      }

      return prev;
    });

    if (user && tokens) {
      try {
        await ProgressAPI.updateExerciseProgress(module, exercise, {
          status: data.status,
          score: data.score ?? undefined,
          attempts: data.attempts,
          completedAt: data.completedAt ?? undefined,
          lastDifficulty: data.lastDifficulty,
        });
      } catch (err) {
        console.error("Failed to sync quiz progress:", err);
      }
    }
  };

  const convertBackendToFrontend = (
    backendModules: ProgressAPI.ModuleProgress[]
  ): AllModulesProgress => {
    const frontendProgress = { ...defaultProgress };

    backendModules.forEach((module) => {
      const moduleKey = module.module as ModuleType;

      if (moduleKey === "vocabulary") {
        const vocabProgress: VocabularyProgress =
          createDefaultVocabularyProgress();

        module.exercises.forEach((exercise) => {
          const exType = exercise.exercise_type;

          if (exType === "flashcards") {
            vocabProgress.flashcards = {
              status: exercise.status as ExerciseStatus,
              completedAt: exercise.last_completed_at,
              timeSpent: exercise.time_spent || 0,
              cardsReviewed: exercise.cards_reviewed || undefined,
            };
          } else if (exType === "quiz" || exType === "antonym") {
            vocabProgress[exType] = {
              status: exercise.status as ExerciseStatus,
              score: exercise.best_score,
              completedAt: exercise.last_completed_at,
              attempts: exercise.attempts,
              lastDifficulty: (exercise.last_difficulty || "easy") as any,
              errorTags: [],
              performanceHistory: exercise.performance_history.map((p) => ({
                difficulty: p.difficulty as any,
                score: p.score,
                missedLowFreq: p.missed_low_freq,
                similarChoiceErrors: p.similar_choice_errors,
                timestamp: p.timestamp,
              })),
            };
          }
        });

        vocabProgress.lastAccessedAt = module.last_accessed_at;
        frontendProgress.vocabulary = vocabProgress;
      } else if (moduleKey === "grammar") {
        const grammarProgress: GrammarProgress = createDefaultGrammarProgress();

        module.exercises.forEach((exercise) => {
          const exType = exercise.exercise_type;

          if (exType === "lesson-cards") {
            grammarProgress["lesson-cards"] = {
              status: exercise.status as ExerciseStatus,
              completedAt: exercise.last_completed_at,
              timeSpent: exercise.time_spent || 0,
              lessonsViewed: exercise.lessons_viewed || undefined,
            };
          } else if (
            exType === "error-identification" ||
            exType === "fill-blanks"
          ) {
            grammarProgress[exType] = {
              status: exercise.status as ExerciseStatus,
              score: exercise.best_score,
              completedAt: exercise.last_completed_at,
              attempts: exercise.attempts,
              lastDifficulty: (exercise.last_difficulty || "easy") as any,
              errorTags: [],
              performanceHistory: exercise.performance_history.map((p) => ({
                difficulty: p.difficulty as any,
                score: p.score,
                missedLowFreq: p.missed_low_freq,
                similarChoiceErrors: p.similar_choice_errors,
                timestamp: p.timestamp,
              })),
            };
          }
        });

        grammarProgress.lastAccessedAt = module.last_accessed_at;
        frontendProgress.grammar = grammarProgress;
      } else if (moduleKey === "sentence-construction") {
        const sentenceProgress: SentenceProgress =
          createDefaultSentenceProgress();
        module.exercises.forEach((exercise) => {
          const exType = exercise.exercise_type;

          if (
            exType === "complete-sentence" ||
            exType === "sentence-ordering" ||
            exType === "choose-sentence"
          ) {
            sentenceProgress[exType] = {
              status: exercise.status as ExerciseStatus,
              score: exercise.best_score,
              completedAt: exercise.last_completed_at,
              attempts: exercise.attempts,
              lastDifficulty: (exercise.last_difficulty || "easy") as any,
              errorTags: [],
              performanceHistory: exercise.performance_history.map((p) => ({
                difficulty: p.difficulty as any,
                score: p.score,
                missedLowFreq: p.missed_low_freq,
                similarChoiceErrors: p.similar_choice_errors,
                timestamp: p.timestamp,
              })),
            };
          }
        });

        sentenceProgress.lastAccessedAt = module.last_accessed_at;
        frontendProgress["sentence-construction"] = sentenceProgress;
      } else if (moduleKey === "reading-comprehension") {
        const readingProgress: ReadingProgress = createDefaultReadingProgress();

        module.exercises.forEach((exercise) => {
          const exType = exercise.exercise_type;

          if (exType === "passage-questions" || exType === "summary-exercise") {
            readingProgress[exType] = {
              status: exercise.status as ExerciseStatus,
              score: exercise.best_score,
              completedAt: exercise.last_completed_at,
              attempts: exercise.attempts,
              lastDifficulty: (exercise.last_difficulty || "easy") as any,
              errorTags: [],
              performanceHistory: exercise.performance_history.map((p) => ({
                difficulty: p.difficulty as any,
                score: p.score,
                missedLowFreq: p.missed_low_freq,
                similarChoiceErrors: p.similar_choice_errors,
                timestamp: p.timestamp,
              })),
            };
          }
        });

        readingProgress.lastAccessedAt = module.last_accessed_at;
        frontendProgress["reading-comprehension"] = readingProgress;
      }
    });

    return frontendProgress;
  };

  const syncProgress = async () => {
    if (!user || !tokens) {
      setProgress(defaultProgress);
      setStudyStreak({ current: 0, longest: 0, last_study_date: null });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await ProgressAPI.getAllProgress();
      const convertedProgress = convertBackendToFrontend(response.modules);
      setProgress(convertedProgress);
      setStudyStreak(response.study_streak);

      localStorage.setItem(
        "learning-progress-backup",
        JSON.stringify({
          progress: convertedProgress,
          studyStreak: response.study_streak,
        })
      );
    } catch (err: any) {
      console.error("Failed to load progress from backend:", err);
      setError(err.message);

      const backup = localStorage.getItem("learning-progress-backup");
      if (backup) {
        try {
          const parsed = JSON.parse(backup);
          setProgress(parsed.progress || defaultProgress);
          setStudyStreak(
            parsed.studyStreak || {
              current: 0,
              longest: 0,
              last_study_date: null,
            }
          );
        } catch {
          setProgress(defaultProgress);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncProgress();
  }, [user?.id]);

  const resetProgress = async (module?: ModuleType) => {
    if (user && tokens) {
      try {
        await ProgressAPI.resetProgress(module);
        await syncProgress();
      } catch (err) {
        console.error("Failed to reset progress:", err);
      }
    } else {
      if (module) {
        setProgress((prev) => ({
          ...prev,
          [module]:
            module === "vocabulary"
              ? createDefaultVocabularyProgress()
              : module === "grammar"
              ? createDefaultGrammarProgress()
              : module === "sentence-construction"
              ? createDefaultSentenceProgress()
              : createDefaultReadingProgress(),
        }));
      } else {
        setProgress(defaultProgress);
      }
    }
  };

  const getModuleExercises = (module: ModuleType): ExerciseType[] => {
    switch (module) {
      case "vocabulary":
        return ["flashcards", "quiz", "antonym"];
      case "grammar":
        return ["lesson-cards", "error-identification", "fill-blanks"];
      case "sentence-construction":
        return ["complete-sentence", "sentence-ordering", "choose-sentence"];
      case "reading-comprehension":
        return ["passage-questions", "summary-exercise"];
      default:
        return [];
    }
  };

  const getModuleProgress = (module: ModuleType): number => {
    const exercises = getModuleExercises(module);

    let totalMasteryScore = 0;
    const maxMasteryPerExercise = 5;

    exercises.forEach((ex) => {
      const exerciseProgress = getExerciseProgressTyped(module, ex);

      if (!exerciseProgress) return;

      if (isLessonExercise(module, ex)) {
        // Lessons use completion metrics, not scores
        const lesson = exerciseProgress as LessonProgress;

        if (ex === "flashcards" && lesson.cardsReviewed) {
          const reviewRate = Math.min(1, lesson.cardsReviewed / 50);
          const timeRate = Math.min(1, lesson.timeSpent / 600);
          totalMasteryScore += (reviewRate + timeRate) * 2.5;
        } else if (ex === "lesson-cards" && lesson.lessonsViewed) {
          const viewRate = Math.min(1, lesson.lessonsViewed / 15); // 15 lessons = full mastery
          const timeRate = Math.min(1, lesson.timeSpent / 600);
          totalMasteryScore += (viewRate + timeRate) * 2.5;
        } else if (lesson.timeSpent >= 600) totalMasteryScore += 5;
        else if (lesson.timeSpent >= 300) totalMasteryScore += 3;
        else if (lesson.timeSpent > 0) totalMasteryScore += 1;
      } else {
        const quiz = exerciseProgress as QuizProgress;
        if (quiz.performanceHistory.length === 0) return;

        const avgScore =
          quiz.performanceHistory.reduce((sum, h) => sum + h.score, 0) /
          quiz.performanceHistory.length;
        const difficulty = quiz.lastDifficulty;

        if (difficulty === "hard" && avgScore >= 90) totalMasteryScore += 5;
        else if (difficulty === "hard" && avgScore >= 75)
          totalMasteryScore += 4;
        else if (difficulty === "medium" && avgScore >= 75)
          totalMasteryScore += 3;
        else if (avgScore >= 60) totalMasteryScore += 2;
        else totalMasteryScore += 1;
      }
    });

    const maxPossibleScore = exercises.length * maxMasteryPerExercise;
    return Math.round((totalMasteryScore / maxPossibleScore) * 100);
  };

  const getOverallProgress = (): number => {
    const modules: ModuleType[] = [
      "vocabulary",
      "grammar",
      "sentence-construction",
      "reading-comprehension",
    ];

    const totalProgress = modules.reduce((sum, module) => {
      return sum + getModuleProgress(module);
    }, 0);

    return Math.round(totalProgress / modules.length);
  };

  const getNextRecommended = (module: ModuleType): ExerciseType | null => {
    const exercises = getModuleExercises(module);

    // Find exercise with least attempts
    let leastPracticedEx: ExerciseType | null = null;
    let minAttempts = Infinity;

    exercises.forEach((ex) => {
      const exerciseProgress = getExerciseProgressTyped(module, ex);
      if (!exerciseProgress) return;

      const attempts = isLessonExercise(module, ex)
        ? (exerciseProgress as LessonProgress).timeSpent > 0
          ? 1
          : 0
        : (exerciseProgress as QuizProgress).attempts;

      if (attempts < minAttempts) {
        minAttempts = attempts;
        leastPracticedEx = ex;
      }
    });

    return leastPracticedEx;
  };

  const canAccessExercise = (
    module: ModuleType,
    exercise: ExerciseType
  ): boolean => {
    return true;
  };

  const isModuleCompleted = (module: ModuleType): boolean => {
    return getModuleProgress(module) >= 90; // 90%+ mastery = "completed"
  };

  const getRecommendedModule = (): ModuleType => {
    return progress.recommendedModule;
  };

  const markModuleAccessed = (module: ModuleType) => {
    setProgress((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        lastAccessedAt: new Date().toISOString(),
      },
    }));
  };

  const getModuleRecommendationReason = (module: ModuleType): string => {
    const moduleProgress = getModuleProgress(module);

    if (moduleProgress >= 90) {
      return "✓ Mastered";
    } else if (moduleProgress >= 70) {
      return "⭐ Strong Progress";
    } else if (moduleProgress >= 40) {
      return "📊 In Progress";
    } else if (moduleProgress > 0) {
      return "🔧 Getting Started";
    } else {
      return "🌱 Not Started";
    }
  };

  const addPerformanceMetrics = async (
    module: ModuleType,
    exercise: Exclude<
      ExerciseType,
      VocabularyLessonExercise | GrammarLessonExercise
    >,
    metrics: PerformanceMetrics
  ) => {
    setProgress((prev) => {
      if (
        module === "vocabulary" &&
        (exercise === "quiz" || exercise === "antonym")
      ) {
        const moduleProgress = { ...prev[module] } as VocabularyProgress;
        const quizProgress = moduleProgress[exercise];

        quizProgress.performanceHistory = [
          ...quizProgress.performanceHistory,
          metrics,
        ];
        quizProgress.lastDifficulty = metrics.difficulty;

        return {
          ...prev,
          [module]: moduleProgress,
        };
      } else if (
        module === "grammar" &&
        (exercise === "error-identification" || exercise === "fill-blanks")
      ) {
        const moduleProgress = { ...prev[module] } as GrammarProgress;
        const quizProgress = moduleProgress[exercise];

        quizProgress.performanceHistory = [
          ...quizProgress.performanceHistory,
          metrics,
        ];
        quizProgress.lastDifficulty = metrics.difficulty;

        return {
          ...prev,
          [module]: moduleProgress,
        };
      } else if (
        module === "sentence-construction" &&
        (exercise === "complete-sentence" ||
          exercise === "sentence-ordering" ||
          exercise === "choose-sentence")
      ) {
        const moduleProgress = { ...prev[module] } as SentenceProgress;
        const quizProgress = moduleProgress[exercise];

        quizProgress.performanceHistory = [
          ...quizProgress.performanceHistory,
          metrics,
        ];
        quizProgress.lastDifficulty = metrics.difficulty;

        return {
          ...prev,
          [module]: moduleProgress,
        };
      } else if (
        module === "reading-comprehension" &&
        (exercise === "passage-questions" || exercise === "summary-exercise")
      ) {
        const moduleProgress = { ...prev[module] } as ReadingProgress;
        const quizProgress = moduleProgress[exercise];

        quizProgress.performanceHistory = [
          ...quizProgress.performanceHistory,
          metrics,
        ];
        quizProgress.lastDifficulty = metrics.difficulty;

        return {
          ...prev,
          [module]: moduleProgress,
        };
      }

      return prev;
    });

    if (user && tokens) {
      try {
        await ProgressAPI.updateExerciseProgress(module, exercise, {
          lastDifficulty: metrics.difficulty,
          performanceMetrics: {
            difficulty: metrics.difficulty,
            score: metrics.score,
            missedLowFreq: metrics.missedLowFreq,
            similarChoiceErrors: metrics.similarChoiceErrors,
            errorTags: [],
          },
        });
      } catch (err) {
        console.error("Failed to add performance metrics:", err);
      }
    }
  };

  const getPerformanceHistory = (
    module: ModuleType,
    exercise: ExerciseType
  ): PerformanceMetrics[] => {
    const exerciseProgress = getExerciseProgressTyped(module, exercise);

    if (exerciseProgress && "performanceHistory" in exerciseProgress) {
      return (exerciseProgress as QuizProgress).performanceHistory || [];
    }

    return [];
  };

  return (
    <LearningProgressContext.Provider
      value={{
        progress,
        isLoading,
        error,
        studyStreak,
        updateLessonProgress,
        updateQuizProgress,
        resetProgress,
        syncProgress,
        getModuleProgress,
        getOverallProgress,
        getNextRecommended,
        canAccessExercise,
        isModuleCompleted,
        getRecommendedModule,
        markModuleAccessed,
        getModuleRecommendationReason,
        addPerformanceMetrics,
        getPerformanceHistory,
        getModuleExercises,
        isLessonExercise,
      }}
    >
      {children}
    </LearningProgressContext.Provider>
  );
}

export function useLearningProgress() {
  const context = useContext(LearningProgressContext);
  if (!context) {
    throw new Error(
      "useLearningProgress must be used within LearningProgressProvider"
    );
  }
  return context;
}
