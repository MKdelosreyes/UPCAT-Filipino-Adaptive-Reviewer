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

<<<<<<< HEAD
export type SentenceExercise =
  | "complete-sentence"
  | "sentence-ordering"
  | "choose-sentence";
=======
export type SentenceExercise = "complete-sentence" | "sentence-ordering";
>>>>>>> c657bb5 (merged with main)
export type ReadingExercise = "passage-questions" | "comprehension";

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

<<<<<<< HEAD
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
=======
export type ExerciseStatus =
  | "locked"
  | "not-started"
  | "in-progress"
  | "completed";
>>>>>>> c657bb5 (merged with main)

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
<<<<<<< HEAD
  "choose-sentence": QuizProgress;
=======
>>>>>>> c657bb5 (merged with main)
  lastAccessedAt: string | null;
}

export interface ReadingProgress {
  "passage-questions": QuizProgress;
  comprehension: QuizProgress;
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
<<<<<<< HEAD
  status: "not-started",
=======
  status: "locked",
>>>>>>> c657bb5 (merged with main)
  score: null,
  completedAt: null,
  attempts: 0,
  lastDifficulty: "easy",
  errorTags: [],
  performanceHistory: [],
};

const createDefaultVocabularyProgress = (): VocabularyProgress => ({
  flashcards: { ...defaultLessonProgress, status: "not-started" },
<<<<<<< HEAD
  quiz: { ...defaultQuizProgress, status: "not-started" },
  antonym: { ...defaultQuizProgress, status: "not-started" },
=======
  quiz: { ...defaultQuizProgress, status: "locked" },
  antonym: { ...defaultQuizProgress, status: "locked" },
>>>>>>> c657bb5 (merged with main)
  lastAccessedAt: null,
});

const createDefaultGrammarProgress = (): GrammarProgress => ({
  "lesson-cards": { ...defaultLessonProgress, status: "not-started" },
<<<<<<< HEAD
  "error-identification": { ...defaultQuizProgress, status: "not-started" },
  "fill-blanks": { ...defaultQuizProgress, status: "not-started" },
=======
  "error-identification": { ...defaultQuizProgress, status: "locked" },
  "fill-blanks": { ...defaultQuizProgress, status: "locked" },
>>>>>>> c657bb5 (merged with main)
  lastAccessedAt: null,
});

const createDefaultSentenceProgress = (): SentenceProgress => ({
  "complete-sentence": { ...defaultQuizProgress, status: "not-started" },
<<<<<<< HEAD
  "sentence-ordering": { ...defaultQuizProgress, status: "not-started" },
  "choose-sentence": { ...defaultQuizProgress, status: "not-started" },
=======
  "sentence-ordering": { ...defaultQuizProgress, status: "locked" },
>>>>>>> c657bb5 (merged with main)
  lastAccessedAt: null,
});

const createDefaultReadingProgress = (): ReadingProgress => ({
  "passage-questions": { ...defaultQuizProgress, status: "not-started" },
<<<<<<< HEAD
  comprehension: { ...defaultQuizProgress, status: "not-started" },
=======
  comprehension: { ...defaultQuizProgress, status: "locked" },
>>>>>>> c657bb5 (merged with main)
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
<<<<<<< HEAD
        exercise === "sentence-ordering" ||
        exercise === "choose-sentence"
=======
        exercise === "sentence-ordering"
>>>>>>> c657bb5 (merged with main)
      ) {
        return sentenceData[exercise];
      }
    } else if (module === "reading-comprehension") {
      const readingData = moduleData as ReadingProgress;
      if (exercise === "passage-questions" || exercise === "comprehension") {
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
<<<<<<< HEAD
=======
      // const moduleProgress = { ...prev[module] };

>>>>>>> c657bb5 (merged with main)
      if (module === "vocabulary" && exercise === "flashcards") {
        const moduleProgress = { ...prev[module] } as VocabularyProgress;

        moduleProgress.flashcards = {
          ...moduleProgress.flashcards,
          ...data,
        };

<<<<<<< HEAD
=======
        if (data.status === "completed") {
          moduleProgress.quiz.status = "not-started";
        }

>>>>>>> c657bb5 (merged with main)
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

<<<<<<< HEAD
=======
        if (data.status === "completed") {
          moduleProgress["error-identification"].status = "not-started";
        }

>>>>>>> c657bb5 (merged with main)
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
<<<<<<< HEAD
=======
      // const moduleProgress = { ...prev[module] };

>>>>>>> c657bb5 (merged with main)
      if (
        module === "vocabulary" &&
        (exercise === "quiz" || exercise === "antonym")
      ) {
        const moduleProgress = { ...prev[module] } as VocabularyProgress;

        moduleProgress[exercise] = {
          ...moduleProgress[exercise],
          ...data,
        };

<<<<<<< HEAD
=======
        if (exercise === "quiz" && data.status === "completed") {
          moduleProgress.antonym.status = "not-started";
        }

>>>>>>> c657bb5 (merged with main)
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

<<<<<<< HEAD
=======
        if (
          exercise === "error-identification" &&
          data.status === "completed"
        ) {
          moduleProgress["fill-blanks"].status = "not-started";
        }

>>>>>>> c657bb5 (merged with main)
        return {
          ...prev,
          [module]: moduleProgress,
        };
      } else if (
        module === "sentence-construction" &&
<<<<<<< HEAD
        (exercise === "complete-sentence" ||
          exercise === "sentence-ordering" ||
          exercise === "choose-sentence")
=======
        (exercise === "complete-sentence" || exercise === "sentence-ordering")
>>>>>>> c657bb5 (merged with main)
      ) {
        const moduleProgress = { ...prev[module] } as SentenceProgress;

        moduleProgress[exercise] = {
          ...moduleProgress[exercise],
          ...data,
        };

<<<<<<< HEAD
=======
        if (exercise === "complete-sentence" && data.status === "completed") {
          moduleProgress["sentence-ordering"].status = "not-started";
        }

>>>>>>> c657bb5 (merged with main)
        return {
          ...prev,
          [module]: moduleProgress,
        };
      } else if (
        module === "reading-comprehension" &&
        (exercise === "passage-questions" || exercise === "comprehension")
      ) {
        const moduleProgress = { ...prev[module] } as ReadingProgress;

        moduleProgress[exercise] = {
          ...moduleProgress[exercise],
          ...data,
        };

<<<<<<< HEAD
=======
        if (exercise === "passage-questions" && data.status === "completed") {
          moduleProgress.comprehension.status = "not-started";
        }

>>>>>>> c657bb5 (merged with main)
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
              score: exercise.last_score,
              completedAt: exercise.last_completed_at,
              attempts: exercise.attempts,
              lastDifficulty: exercise.last_difficulty as any,
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
              score: exercise.last_score,
              completedAt: exercise.last_completed_at,
              attempts: exercise.attempts,
              lastDifficulty: exercise.last_difficulty as any,
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

        frontendProgress.grammar = grammarProgress;
<<<<<<< HEAD
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
              score: exercise.last_score,
              completedAt: exercise.last_completed_at,
              attempts: exercise.attempts,
              lastDifficulty: exercise.last_difficulty as any,
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

        frontendProgress["sentence-construction"] = sentenceProgress;
      }
      // Add similar logic for reading-comprehension
=======
      }
      // Add similar logic for sentence-construction and reading-comprehension
>>>>>>> c657bb5 (merged with main)
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
<<<<<<< HEAD
        return ["complete-sentence", "sentence-ordering", "choose-sentence"];
=======
        return ["complete-sentence", "sentence-ordering"];
>>>>>>> c657bb5 (merged with main)
      case "reading-comprehension":
        return ["passage-questions", "comprehension"];
      default:
        return [];
    }
  };

  const getModuleProgress = (module: ModuleType): number => {
    const exercises = getModuleExercises(module);

<<<<<<< HEAD
    let totalMasteryScore = 0;
    const maxMasteryPerExercise = 5; // master = 5, advanced = 4, etc.

    exercises.forEach((ex) => {
      const exerciseProgress = getExerciseProgressTyped(module, ex);

      if (!exerciseProgress) return;

      if (isLessonExercise(module, ex)) {
        // Lessons: score based on time spent
        const lesson = exerciseProgress as LessonProgress;
        if (lesson.timeSpent >= 600) totalMasteryScore += 5; // 10+ min = max
        else if (lesson.timeSpent >= 300)
          totalMasteryScore += 3; // 5+ min = mid
        else if (lesson.timeSpent > 0) totalMasteryScore += 1; // started
      } else {
        // Quizzes: score based on mastery level
        const quiz = exerciseProgress as QuizProgress;
        if (quiz.performanceHistory.length === 0) return;

        const avgScore =
          quiz.performanceHistory.reduce((sum, h) => sum + h.score, 0) /
          quiz.performanceHistory.length;
        const difficulty = quiz.lastDifficulty;

        if (difficulty === "hard" && avgScore >= 90)
          totalMasteryScore += 5; // master
        else if (difficulty === "hard" && avgScore >= 75)
          totalMasteryScore += 4; // advanced
        else if (difficulty === "medium" && avgScore >= 75)
          totalMasteryScore += 3; // proficient
        else if (avgScore >= 60) totalMasteryScore += 2; // developing
        else totalMasteryScore += 1; // beginner
      }
    });

    const maxPossibleScore = exercises.length * maxMasteryPerExercise;
    return Math.round((totalMasteryScore / maxPossibleScore) * 100);
=======
    const completed = exercises.filter((ex) => {
      const exerciseProgress = getExerciseProgressTyped(module, ex);
      return exerciseProgress?.status === "completed";
    }).length;

    return Math.round((completed / exercises.length) * 100);
>>>>>>> c657bb5 (merged with main)
  };

  const getOverallProgress = (): number => {
    const modules: ModuleType[] = [
      "vocabulary",
      "grammar",
      "sentence-construction",
      "reading-comprehension",
    ];

<<<<<<< HEAD
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

=======
    let totalCompleted = 0;
    let totalExercises = 0;

    modules.forEach((module) => {
      const exercises = getModuleExercises(module);
      totalExercises += exercises.length;

      exercises.forEach((ex) => {
        const exerciseProgress = getExerciseProgressTyped(module, ex);
        if (exerciseProgress?.status === "completed") {
          totalCompleted++;
        }
      });
    });

    return Math.round((totalCompleted / totalExercises) * 100);
  };

  const getNextRecommended = (module: ModuleType): ExerciseType | null => {
    const exercises = getModuleExercises(module);

    for (const ex of exercises) {
      const exerciseProgress = getExerciseProgressTyped(module, ex);
      if (exerciseProgress?.status !== "completed") {
        return ex;
      }
    }

    return null;
  };

>>>>>>> c657bb5 (merged with main)
  const canAccessExercise = (
    module: ModuleType,
    exercise: ExerciseType
  ): boolean => {
<<<<<<< HEAD
    return true;
  };

  const isModuleCompleted = (module: ModuleType): boolean => {
    return getModuleProgress(module) >= 90; // 90%+ mastery = "completed"
=======
    if (isLessonExercise(module, exercise)) {
      return true;
    }

    if (module === "vocabulary") {
      const flashcardsCompleted =
        progress.vocabulary.flashcards.status === "completed";
      if (exercise === "quiz") return flashcardsCompleted;
      if (exercise === "antonym") {
        return (
          flashcardsCompleted && progress.vocabulary.quiz.status === "completed"
        );
      }
    } else if (module === "grammar") {
      const lessonCompleted =
        progress.grammar["lesson-cards"].status === "completed";
      if (exercise === "error-identification") return lessonCompleted;
      if (exercise === "fill-blanks") {
        return (
          lessonCompleted &&
          progress.grammar["error-identification"].status === "completed"
        );
      }
    } else if (module === "sentence-construction") {
      if (exercise === "complete-sentence") return true;
      if (exercise === "sentence-ordering") {
        return (
          progress["sentence-construction"]["complete-sentence"].status ===
          "completed"
        );
      }
    } else if (module === "reading-comprehension") {
      if (exercise === "passage-questions") return true;
      if (exercise === "comprehension") {
        return (
          progress["reading-comprehension"]["passage-questions"].status ===
          "completed"
        );
      }
    }

    return false;
  };

  const isModuleCompleted = (module: ModuleType): boolean => {
    const exercises = getModuleExercises(module);
    return exercises.every((ex) => {
      const exerciseProgress = getExerciseProgressTyped(module, ex);
      return exerciseProgress?.status === "completed";
    });
>>>>>>> c657bb5 (merged with main)
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
        (exercise === "passage-questions" || exercise === "comprehension")
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

  const addPerformanceMetrics = async (
    module: ModuleType,
    exercise: Exclude<
      ExerciseType,
      VocabularyLessonExercise | GrammarLessonExercise
    >,
    metrics: PerformanceMetrics
  ) => {
    setProgress((prev) => {
      // const moduleProgress = { ...prev[module] };

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
        (exercise === "complete-sentence" || exercise === "sentence-ordering")
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
        (exercise === "passage-questions" || exercise === "comprehension")
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
