"use client";

import { useReadingProgress } from "@/hooks/useReadingProgress";
import { Circle } from "lucide-react";
import type {
  ReadingExercise,
  QuizProgress,
} from "@/contexts/LearningProgressContext";

const steps: Array<{ id: ReadingExercise; label: string; number: number }> = [
  { id: "passage-questions", label: "Reading Passages", number: 1 },
  { id: "summary-exercise", label: "Summarization", number: 2 },
];

export default function ReadingProgressStepper() {
  const { progress, getExerciseMastery } = useReadingProgress();

  const completedExercises = steps.filter(
    (step) =>
      (progress[step.id] as QuizProgress).performanceHistory?.length > 0,
  ).length;

  const percent =
    steps.length === 0 ? 0 : (completedExercises / steps.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative grid grid-cols-2 gap-2 sm:gap-4 md:gap-6">
        {/* Progress line visible on mobile too */}
        <div className="absolute top-4 sm:top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
          <div
            className="h-full bg-purple-600 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        {steps.map((step) => {
          const exerciseProgress = progress[step.id];
          const hasStarted = exerciseProgress.performanceHistory?.length > 0;
          const mastery = hasStarted
            ? getExerciseMastery(exerciseProgress)
            : null;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative w-full px-1"
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold transition-all duration-300 ${
                  hasStarted
                    ? "bg-purple-600 text-white"
                    : "bg-purple-100 text-purple-600 border-2 border-purple-300"
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
                  hasStarted ? "text-purple-900" : "text-gray-600"
                }`}
              >
                {step.label}
              </span>

              {/* Hide extra badges on very small screens to keep it compact */}
              {hasStarted && mastery && (
                <div className="mt-1 hidden sm:flex flex-col items-center gap-1">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold capitalize">
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
