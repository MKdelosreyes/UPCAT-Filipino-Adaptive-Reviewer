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

  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10 hidden md:block">
          <div
            className="h-full bg-yellow-600 transition-all duration-500"
            style={{
              width: `${(completedQuizzes / quizExercises.length) * 100}%`,
            }}
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
              className="flex flex-col items-center relative w-full"
            >
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                  hasStarted
                    ? "bg-yellow-400 text-white"
                    : "bg-yellow-100 text-yellow-600 border-2 border-yellow-300"
                }`}
              >
                {hasStarted && mastery ? (
                  <span>{mastery.icon}</span>
                ) : (
                  <Circle size={16} />
                )}
              </div>

              {/* Label */}
              <span
                className={`mt-2 text-xs md:text-sm font-medium text-center w-full ${
                  hasStarted ? "text-yellow-900" : "text-gray-600"
                }`}
              >
                {step.label}
              </span>

              {/* Mastery Badge */}
              {!isLesson && hasStarted && mastery && (
                <div className="mt-1 flex flex-col items-center gap-1">
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                    {mastery.level}
                  </span>
                  {/* <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                    {mastery.difficulty}
                  </span> */}
                </div>
              )}

              {/* Lesson Badge */}
              {isLesson && hasStarted && (
                <div className="mt-1">
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
