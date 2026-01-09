"use client";

import { useLearningProgress } from "@/contexts/LearningProgressContext";
import { useDashboardInsights } from "@/hooks/useDashboardInsights";
import type {
  ModuleType,
  VocabularyProgress,
  GrammarProgress,
  SentenceProgress,
  ReadingProgress,
  ExerciseType,
  LessonProgress,
  QuizProgress,
} from "@/contexts/LearningProgressContext";
import {
  ArrowRight,
  Check,
  BookOpen,
  Trophy,
  Lock,
  Sparkles,
  Loader2,
} from "lucide-react";

const moduleNames = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  "sentence-construction": "Sentence",
  "reading-comprehension": "Reading",
};

const moduleIcons = {
  vocabulary: "📚",
  grammar: "✍️",
  "sentence-construction": "🔧",
  "reading-comprehension": "📖",
};

export default function RecommendedPathIndicator() {
  const {
    progress,
    getRecommendedModule,
    isModuleCompleted,
    getNextRecommended,
    getModuleExercises,
    isLessonExercise,
    isLoading,
  } = useLearningProgress();
  const { getModuleMastery } = useDashboardInsights();

  const recommended = getRecommendedModule();

  const steps: ModuleType[] = [
    "vocabulary",
    "grammar",
    "sentence-construction",
    "reading-comprehension",
  ];

  const getExerciseProgress = (
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

  const getModuleStatus = (module: ModuleType) => {
<<<<<<< HEAD
    const isCompleted = isModuleCompleted(module); // Uses mastery >= 90%
=======
    const isCompleted = isModuleCompleted(module);
>>>>>>> c657bb5 (merged with main)
    const isRecommended = recommended === module;
    const nextExercise = getNextRecommended(module);
    const exercises = getModuleExercises(module);
    const mastery = getModuleMastery(module);

<<<<<<< HEAD
    const completedCount = exercises.filter((ex) => {
      const exerciseProgress = getExerciseProgress(module, ex);
      if (!exerciseProgress) return false;

      // For lessons: check if time spent
      if (isLessonExercise(module, ex)) {
        return (exerciseProgress as LessonProgress).timeSpent > 0;
      }

      // For quizzes: check if has performance history
      return (exerciseProgress as QuizProgress).performanceHistory?.length > 0;
    }).length;

=======
    // ✅ Count completed exercises with proper typing
    const completedCount = exercises.filter((ex) => {
      const exerciseProgress = getExerciseProgress(module, ex);
      return exerciseProgress?.status === "completed";
    }).length;

    // ✅ Separate lessons from quizzes
>>>>>>> c657bb5 (merged with main)
    const lessons = exercises.filter((ex) => isLessonExercise(module, ex));
    const quizzes = exercises.filter((ex) => !isLessonExercise(module, ex));

    const completedLessons = lessons.filter((ex) => {
      const exerciseProgress = getExerciseProgress(module, ex);
<<<<<<< HEAD
      return (
        exerciseProgress && (exerciseProgress as LessonProgress).timeSpent > 0
      );
=======
      return exerciseProgress?.status === "completed";
>>>>>>> c657bb5 (merged with main)
    }).length;

    const completedQuizzes = quizzes.filter((ex) => {
      const exerciseProgress = getExerciseProgress(module, ex);
<<<<<<< HEAD
      return (
        exerciseProgress &&
        (exerciseProgress as QuizProgress).performanceHistory?.length > 0
      );
=======
      return exerciseProgress?.status === "completed";
>>>>>>> c657bb5 (merged with main)
    }).length;

    return {
      isCompleted,
      isRecommended,
      nextExercise,
      completedCount,
      totalCount: exercises.length,
      completedLessons,
      totalLessons: lessons.length,
      completedQuizzes,
      totalQuizzes: quizzes.length,
      mastery,
      isNextLesson: nextExercise
        ? isLessonExercise(module, nextExercise)
        : false,
    };
  };

  if (isLoading) {
    return (
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-4 shadow-md border border-blue-200">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">
              Loading your path...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-4 shadow-md border border-blue-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
          Learning Path
        </h3>
      </div>

      {/* Horizontal Stepper */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 -z-10">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
            style={{
              width: `${
                (steps.findIndex((s) => s === recommended) /
                  (steps.length - 1)) *
                100
              }%`,
            }}
          />
        </div>

        {/* Module Steps */}
        <div className="flex items-start justify-between gap-2">
          {steps.map((module, index) => {
            const status = getModuleStatus(module);

            return (
              <div
                key={module}
                className="flex flex-col items-center flex-1 relative"
              >
                {/* Module Circle */}
                <div
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 z-10 ${
                    status.isCompleted
                      ? "bg-green-500 text-white shadow-lg"
                      : status.isRecommended
                      ? "bg-blue-600 text-white shadow-xl ring-4 ring-blue-300 animate-pulse"
                      : status.completedCount > 0
                      ? "bg-blue-100 text-blue-600 border-2 border-blue-400"
                      : "bg-gray-200 text-gray-400 border-2 border-gray-300"
                  }`}
                >
                  {status.isCompleted ? (
                    <Check size={18} />
                  ) : status.isRecommended ? (
                    <Sparkles size={18} />
                  ) : status.completedCount === 0 ? (
                    <Lock size={16} />
                  ) : (
                    <span className="text-base">{moduleIcons[module]}</span>
                  )}

                  {/* Recommended Sparkle Badge */}
                  {status.isRecommended && !status.isCompleted && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 rounded-full w-5 h-5 flex items-center justify-center">
                      <Sparkles size={12} />
                    </div>
                  )}
                </div>

                {/* Module Name */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-semibold leading-tight ${
                      status.isRecommended
                        ? "text-blue-700"
                        : status.isCompleted
                        ? "text-green-700"
                        : status.completedCount > 0
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    {moduleNames[module]}
                  </p>

                  {/* Progress Counts */}
                  <div className="flex items-center justify-center gap-2 mt-1 text-[10px] text-gray-600">
                    {status.totalLessons > 0 && (
                      <div
                        className={`flex items-center gap-0.5 ${
                          status.completedLessons === status.totalLessons
                            ? "text-green-600"
                            : ""
                        }`}
                      >
                        <BookOpen size={10} />
                        <span>
                          {status.completedLessons}/{status.totalLessons}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex items-center gap-0.5 ${
                        status.completedQuizzes === status.totalQuizzes
                          ? "text-green-600"
                          : ""
                      }`}
                    >
                      <Trophy size={10} />
                      <span>
                        {status.completedQuizzes}/{status.totalQuizzes}
                      </span>
                    </div>
                  </div>

                  {/* Next Action Badge */}
                  {status.isRecommended && !status.isCompleted && (
                    <div
                      className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        status.isNextLesson
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {status.isNextLesson ? (
                        <>
                          <BookOpen size={8} />
                          <span>Study</span>
                        </>
                      ) : (
                        <>
                          <Trophy size={8} />
                          <span>Quiz</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Mastery Badge */}
                  {!status.isCompleted &&
                    status.completedCount > 0 &&
                    !status.isRecommended &&
                    status.mastery.level !== "beginner" && (
                      <div className="mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 border border-blue-200">
<<<<<<< HEAD
=======
                        {/* <span>{status.mastery.icon}</span> */}
>>>>>>> c657bb5 (merged with main)
                        <span className="capitalize">
                          {status.mastery.level}
                        </span>
                      </div>
                    )}
                </div>

                {/* Arrow Between Steps */}
                {index < steps.length - 1 && (
                  <ArrowRight
                    size={16}
                    className={`absolute -right-3 top-5 ${
                      status.isCompleted
                        ? "text-green-500"
                        : status.isRecommended
                        ? "text-blue-600"
                        : "text-gray-300"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact Legend */}
      <div className="mt-3 pt-3 border-t border-blue-200 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-600">
        <div className="flex items-center gap-1">
          <BookOpen size={10} className="text-green-600" />
          <span>Lessons</span>
        </div>
        <div className="flex items-center gap-1">
          <Trophy size={10} className="text-yellow-600" />
          <span>Quizzes</span>
        </div>
        <div className="flex items-center gap-1">
          <Sparkles size={10} className="text-blue-600" />
          <span>Next</span>
        </div>
        <div className="flex items-center gap-1">
          <Check size={10} className="text-green-600" />
          <span>Done</span>
        </div>
      </div>
    </div>
  );
}
