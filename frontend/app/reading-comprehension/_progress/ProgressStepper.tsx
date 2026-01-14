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
    (step) => (progress[step.id] as QuizProgress).performanceHistory?.length > 0
  ).length;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-1/4 right-1/4 h-1 bg-gray-200 -z-10 hidden md:block">
          <div
            className="h-full bg-purple-600 transition-all duration-500"
            style={{
              width: `${(completedExercises / steps.length) * 100}%`,
            }}
          />
        </div>

        {steps.map((step) => {
          const exerciseProgress = progress[step.id];
          const hasStarted = exerciseProgress.performanceHistory?.length > 0;
          const mastery = hasStarted
            ? getExerciseMastery(exerciseProgress)
            : null;

          return (
            <div key={step.id} className="flex flex-col items-center relative">
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                  hasStarted
                    ? "bg-purple-600 text-white"
                    : "bg-purple-100 text-purple-600 border-2 border-purple-300"
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
                      hasStarted ? "text-purple-900" : "text-gray-600"
                    }`}
                  >
                    {step.label}
                  </span>

              {/* Mastery Badge */}
              {hasStarted && mastery && (
                <div className="mt-1 flex flex-col items-center gap-1">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                    {mastery.level}
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                    {mastery.difficulty}
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