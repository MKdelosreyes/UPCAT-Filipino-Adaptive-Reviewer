"use client";

import { useSentenceConstructionProgress } from "@/hooks/useSentenceConstructionProgress";
import { Circle } from "lucide-react";
import type {
  SentenceExercise,
  QuizProgress,
} from "@/contexts/LearningProgressContext";

const steps: Array<{ id: SentenceExercise; label: string; number: number }> = [
  { id: "complete-sentence", label: "Complete Sentence", number: 1 },
  { id: "sentence-ordering", label: "Sentence Ordering", number: 2 },
  { id: "choose-sentence", label: "Choose the Best Sentence", number: 3 },
];

export default function SentenceConstructionProgressStepper() {
  const { progress, getExerciseMastery } = useSentenceConstructionProgress();

  const completedExercises = steps.filter(
    (step) => (progress[step.id] as QuizProgress).performanceHistory?.length > 0
  ).length;

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
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
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-600 border-2 border-blue-300"
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
                className={`mt-2 text-xs md:text-sm font-medium text-center max-w-[80px] ${
                  hasStarted ? "text-blue-900" : "text-gray-600"
                }`}
              >
                {step.label}
              </span>

              {/* Mastery Badge */}
              {hasStarted && mastery && (
                <div className="mt-1 flex flex-col items-center gap-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                    {mastery.level}
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold capitalize">
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
