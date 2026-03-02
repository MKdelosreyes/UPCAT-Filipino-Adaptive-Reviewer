"use client";

import { useSentenceConstructionProgress } from "@/hooks/useSentenceConstructionProgress";
import { Circle } from "lucide-react";
import type {
  SentenceExercise,
  QuizProgress,
} from "@/contexts/LearningProgressContext";

const steps: Array<{ id: SentenceExercise; label: string; number: number }> = [
  { id: "sentence-ordering", label: "Sentence Ordering", number: 1 },
  { id: "choose-sentence", label: "Choose the Best Sentence", number: 2 },
];

export default function SentenceConstructionProgressStepper() {
  const { progress, getExerciseMastery } = useSentenceConstructionProgress();

  const completedExercises = steps.filter(
    (step) =>
      (progress[step.id] as QuizProgress).performanceHistory?.length > 0,
  ).length;

  const percent =
    steps.length === 0 ? 0 : (completedExercises / steps.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative grid grid-cols-2 gap-2 sm:gap-4 md:gap-6">
        {/* Progress Line (also visible on mobile) */}
        <div className="absolute top-4 sm:top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
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
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-600 border-2 border-blue-300"
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
                  hasStarted ? "text-blue-900" : "text-gray-600"
                }`}
              >
                {step.label}
              </span>

              {/* Badge hidden on very small screens to stay compact */}
              {hasStarted && mastery && (
                <div className="mt-1 hidden sm:flex flex-col items-center gap-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold capitalize">
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
