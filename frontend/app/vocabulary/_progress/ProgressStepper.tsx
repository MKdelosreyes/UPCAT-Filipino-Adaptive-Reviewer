"use client";

import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { Circle } from "lucide-react";
import type {
  VocabularyExercise,
  QuizProgress,
  LessonProgress,
} from "@/contexts/LearningProgressContext";

const steps: Array<{ id: VocabularyExercise; label: string; number: number }> =
  [
    { id: "flashcards", label: "Flashcards", number: 1 },
    { id: "quiz", label: "Quiz", number: 2 },
    { id: "antonym", label: "Antonym", number: 3 },
  ];

export default function ProgressStepper() {
  const { progress, getExerciseMastery, isLessonExercise } =
    useVocabularyProgress();

  const quizExercises = steps.filter((step) => !isLessonExercise(step.id));
  const completedQuizzes = quizExercises.filter(
    (step) =>
      (progress[step.id] as QuizProgress).performanceHistory?.length > 0,
  ).length;

  const percent =
    quizExercises.length === 0
      ? 0
      : (completedQuizzes / quizExercises.length) * 100;

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Single-row layout on mobile */}
      <div className="relative grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
        {/* Progress Line (now also works on mobile) */}
        <div className="absolute top-4 sm:top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
          <div
            className="h-full bg-yellow-600 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        {steps.map((step) => {
          const exerciseProgress = progress[step.id];
          const isLesson = isLessonExercise(step.id);

          const hasStarted = isLesson
            ? (exerciseProgress as LessonProgress).timeSpent > 0
            : (exerciseProgress as QuizProgress).performanceHistory?.length > 0;

          const mastery =
            !isLesson && hasStarted
              ? getExerciseMastery(exerciseProgress as QuizProgress)
              : null;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative w-full px-1"
            >
              {/* Circle (slightly smaller on mobile) */}
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold transition-all duration-300 ${
                  hasStarted
                    ? "bg-yellow-400 text-white"
                    : "bg-yellow-100 text-yellow-600 border-2 border-yellow-300"
                }`}
              >
                {hasStarted && mastery ? (
                  <span>{mastery.icon}</span>
                ) : (
                  <Circle size={14} />
                )}
              </div>

              {/* Label (smaller + tighter) */}
              <span
                className={`mt-1 sm:mt-2 text-[10px] sm:text-xs md:text-sm leading-tight font-medium text-center w-full ${
                  hasStarted ? "text-yellow-900" : "text-gray-600"
                }`}
              >
                {step.label}
              </span>

              {/* Badges: hide on very small screens to reduce height */}
              {!isLesson && hasStarted && mastery && (
                <div className="mt-1 hidden sm:flex flex-col items-center gap-1">
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                    {mastery.level}
                  </span>
                </div>
              )}

              {isLesson && hasStarted && (
                <div className="mt-1 hidden sm:block">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                    {Math.floor(
                      (exerciseProgress as LessonProgress).timeSpent / 60,
                    )}
                    m studied
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
