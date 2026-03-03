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

export default function RecommendedPathIndicator({
  activeModule,
}: {
  activeModule?: ModuleType;
}) {
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
    exercise: ExerciseType,
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
        // exercise === "complete-sentence" ||
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

  const getModuleStatus = (module: ModuleType) => {
    const isCompleted = isModuleCompleted(module); // Uses mastery >= 90%
    const isRecommended = recommended === module;
    const nextExercise = getNextRecommended(module);
    const exercises = getModuleExercises(module);
    const mastery = getModuleMastery(module);

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

    const lessons = exercises.filter((ex) => isLessonExercise(module, ex));
    const quizzes = exercises.filter((ex) => !isLessonExercise(module, ex));

    const completedLessons = lessons.filter((ex) => {
      const exerciseProgress = getExerciseProgress(module, ex);
      return (
        exerciseProgress && (exerciseProgress as LessonProgress).timeSpent > 0
      );
    }).length;

    const completedQuizzes = quizzes.filter((ex) => {
      const exerciseProgress = getExerciseProgress(module, ex);
      return (
        exerciseProgress &&
        (exerciseProgress as QuizProgress).performanceHistory?.length > 0
      );
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

  // Get module-specific colors for circles only
  const getModuleCircleColors = (
    module: ModuleType,
    isCompleted: boolean,
    isRecommended: boolean,
    hasProgress: boolean,
  ) => {
    const colorMap = {
      vocabulary: {
        recommended:
          "bg-yellow-600 text-white shadow-xl ring-4 ring-yellow-300",
        inProgress: "bg-yellow-100 text-yellow-600 border-2 border-yellow-400",
      },
      grammar: {
        recommended: "bg-green-600 text-white shadow-xl ring-4 ring-green-300",
        inProgress: "bg-green-100 text-green-600 border-2 border-green-400",
      },
      "sentence-construction": {
        recommended: "bg-blue-600 text-white shadow-xl ring-4 ring-blue-300",
        inProgress: "bg-blue-100 text-blue-600 border-2 border-blue-400",
      },
      "reading-comprehension": {
        recommended:
          "bg-purple-600 text-white shadow-xl ring-4 ring-purple-300",
        inProgress: "bg-purple-100 text-purple-600 border-2 border-purple-400",
      },
    };

    if (isCompleted) {
      return "bg-green-500 text-white shadow-lg";
    }
    if (isRecommended) {
      return colorMap[module].recommended + " animate-pulse";
    }
    if (hasProgress) {
      return colorMap[module].inProgress;
    }
    return "bg-gray-200 text-gray-400 border-2 border-gray-300";
  };

  // Get module-specific colors for text
  const getModuleTextColors = (
    module: ModuleType,
    isCompleted: boolean,
    isRecommended: boolean,
    hasProgress: boolean,
  ) => {
    const colorMap = {
      vocabulary: {
        recommended: "text-yellow-400",
        inProgress: "text-yellow-300",
      },
      grammar: {
        recommended: "text-green-700",
        inProgress: "text-green-600",
      },
      "sentence-construction": {
        recommended: "text-blue-700",
        inProgress: "text-blue-600",
      },
      "reading-comprehension": {
        recommended: "text-purple-700",
        inProgress: "text-purple-600",
      },
    };

    if (isCompleted) {
      return "text-green-700";
    }
    if (isRecommended) {
      return colorMap[module].recommended;
    }
    if (hasProgress) {
      return colorMap[module].inProgress;
    }
    return "text-gray-500";
  };

  // Background gradient mapping per module
  const bgMap: Record<ModuleType, string> = {
    vocabulary: "from-yellow-50 via-yellow-50 to-yellow-50",
    grammar: "from-green-50 via-green-50 to-green-50",
    "sentence-construction": "from-blue-50 via-blue-50 to-blue-50",
    "reading-comprehension": "from-purple-50 via-purple-50 to-purple-50",
  };

  const active = activeModule || "vocabulary";
  const bgGradient = bgMap[active] ?? "from-blue-50 via-indigo-50 to-purple-50";

  // Border and header color mapping per module
  const borderMap: Record<ModuleType, string> = {
    vocabulary: "border-yellow-200",
    grammar: "border-green-200",
    "sentence-construction": "border-blue-200",
    "reading-comprehension": "border-purple-200",
  };

  const headerTextMap: Record<ModuleType, string> = {
    vocabulary: "text-yellow-900",
    grammar: "text-green-900",
    "sentence-construction": "text-blue-900",
    "reading-comprehension": "text-purple-900",
  };

  const borderClass = borderMap[active] ?? "border-blue-200";
  const headerTextClass = headerTextMap[active] ?? "text-blue-900";
  const smallBorderClass = borderClass;

  // Arrow color mapping for recommended state
  const arrowColorMap: Record<ModuleType, string> = {
    vocabulary: "text-yellow-600",
    grammar: "text-green-600",
    "sentence-construction": "text-blue-600",
    "reading-comprehension": "text-purple-600",
  };

  const recommendedArrowClass = arrowColorMap[active] ?? "text-blue-600";

  if (isLoading) {
    return (
      <div
        className={`w-full bg-gradient-to-r ${bgGradient} rounded-xl p-4 shadow-md ${borderClass}`}
      >
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
    <div
      className={`w-full bg-gradient-to-r ${bgGradient} rounded-xl p-3 sm:p-4 shadow-md ${borderClass}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h3
          className={`text-sm font-bold ${headerTextClass} flex items-center gap-2`}
        >
          Learning Path
        </h3>
      </div>

      {/* Horizontal Stepper */}
      <div className="relative -mx-2 px-2 overflow-x-auto scrollbar-hide">
        <div className="relative min-w-[420px] sm:min-w-0">
          {/* Progress Line */}
          <div className="absolute top-5 sm:top-6 left-0 right-0 h-1 bg-gray-200 -z-10">
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
        </div>

        {/* Module Steps */}
        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
          {steps.map((module, index) => {
            const status = getModuleStatus(module);

            return (
              <div
                key={module}
                className="flex flex-col items-center flex-1 relative"
              >
                {/* Module Circle */}
                <div
                  className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold transition-all duration-300 z-10 ${getModuleCircleColors(
                    module,
                    status.isCompleted,
                    status.isRecommended,
                    status.completedCount > 0,
                  )}`}
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

                  {status.isRecommended && !status.isCompleted && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 rounded-full w-5 h-5 flex items-center justify-center">
                      <Sparkles size={12} />
                    </div>
                  )}
                </div>

                {/* Module Name */}
                <div className="mt-1.5 sm:mt-2 text-center">
                  <p
                    className={`text-[11px] sm:text-xs font-semibold leading-tight ${getModuleTextColors(
                      module,
                      status.isCompleted,
                      status.isRecommended,
                      status.completedCount > 0,
                    )}`}
                  >
                    {moduleNames[module]}
                  </p>

                  {/* Progress Counts (hide lessons on mobile to reduce clutter) */}
                  <div className="flex items-center justify-center gap-2 mt-1 text-[9px] sm:text-[10px] text-gray-600">
                    {status.totalLessons > 0 && (
                      <div
                        className={`hidden sm:flex items-center gap-0.5 ${
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

                  {/* Mastery Badge (hide on xs, show on sm+) */}
                  {!status.isCompleted &&
                    status.completedCount > 0 &&
                    !status.isRecommended &&
                    status.mastery.level !== "beginner" && (
                      <div className="mt-1 hidden sm:inline-flex text-[9px] font-semibold px-1.5 py-0.5 rounded-full items-center gap-0.5 bg-blue-50 text-blue-700 border border-blue-200">
                        <span className="capitalize">
                          {status.mastery.level}
                        </span>
                      </div>
                    )}
                </div>

                {/* Arrow Between Steps */}
                {index < steps.length - 1 && (
                  <ArrowRight
                    size={14}
                    className={`absolute -right-2 sm:-right-3 top-4 sm:top-5 ${
                      status.isCompleted
                        ? "text-green-500"
                        : status.isRecommended
                          ? recommendedArrowClass
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
      <div
        className={`mt-3 pt-3 border-t ${smallBorderClass} flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-600`}
      >
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
