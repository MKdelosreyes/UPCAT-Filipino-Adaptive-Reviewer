"use client";

import { Circle } from "lucide-react";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import type {
  GrammarExercise,
  QuizProgress,
  LessonProgress,
} from "@/contexts/LearningProgressContext";
import { useLearningProgress } from "@/contexts/LearningProgressContext";

const steps: Array<{ id: number; name: string; key: GrammarExercise }> = [
  { id: 1, name: "Lesson", key: "lesson-cards" },
  { id: 2, name: "Error ID", key: "error-identification" },
  { id: 3, name: "Fill Blanks", key: "fill-blanks" },
];

export default function GrammarProgressStepper() {
  const { getExerciseProgress, getExerciseMastery } = useGrammarProgress();
  const { isLessonExercise } = useLearningProgress();

  const quizSteps = steps.filter((s) => !isLessonExercise("grammar", s.key));
  const completedQuizzes = quizSteps.filter(
    (s) =>
      (getExerciseProgress(s.key) as QuizProgress).performanceHistory?.length >
      0,
  ).length;

  const percent =
    quizSteps.length === 0 ? 0 : (completedQuizzes / quizSteps.length) * 100;

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="relative grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
        {/* Progress Line (visible on mobile too) */}
        <div className="absolute top-4 sm:top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
          <div
            className="h-full bg-green-600 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        {steps.map((step) => {
          const progress = getExerciseProgress(step.key);
          const isLesson = isLessonExercise("grammar", step.key);

          const hasStarted = isLesson
            ? (progress as LessonProgress).timeSpent > 0
            : (progress as QuizProgress).performanceHistory?.length > 0;

          const mastery =
            !isLesson && hasStarted
              ? getExerciseMastery(progress as QuizProgress)
              : null;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative w-full px-1"
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold transition-all duration-300 ${
                  hasStarted
                    ? "bg-green-700 text-white"
                    : "bg-green-50 text-green-700 border-2 border-green-300"
                }`}
              >
                {hasStarted && mastery ? (
                  <span>{mastery.icon}</span>
                ) : (
                  <Circle size={14} />
                )}
              </div>

              <span
                className={`mt-1 sm:mt-2 text-[10px] sm:text-xs md:text-sm leading-tight font-medium text-center w-full ${
                  hasStarted ? "text-green-900" : "text-gray-600"
                }`}
              >
                {step.name}
              </span>

              {/* Hide badges on very small screens to keep it compact */}
              {isLesson && hasStarted && (
                <div className="mt-1 hidden sm:block">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                    {Math.floor((progress as LessonProgress).timeSpent / 60)}m
                  </span>
                </div>
              )}

              {!isLesson && hasStarted && mastery && (
                <div className="mt-1 hidden sm:flex flex-col items-center gap-1">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                    {mastery.level}
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
