"use client";

import { motion } from "framer-motion";
import { Check, Lock, Circle } from "lucide-react";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import type {
  GrammarExercise,
  QuizProgress,
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

  // ✅ FIX: Only count quiz exercises for progress calculation
  const quizSteps = steps.filter((s) => !isLessonExercise("grammar", s.key));
  const completedQuizzes = quizSteps.filter(
    (s) =>
      (getExerciseProgress(s.key) as QuizProgress).performanceHistory?.length >
      0
  ).length;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: "0%" }}
            animate={{
              width: `${(completedQuizzes / quizSteps.length) * 100}%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Steps */}
        {steps.map((step) => {
          const progress = getExerciseProgress(step.key);
          const isLesson = isLessonExercise("grammar", step.key);
          const isCompleted = progress.status === "completed";

          // ✅ FIX: Lessons don't have performance history
          const hasStarted = isLesson
            ? isCompleted
            : (progress as QuizProgress).performanceHistory?.length > 0;

          const mastery =
            !isLesson && hasStarted
              ? getExerciseMastery(progress as QuizProgress)
              : null;

          return (
            <div key={step.id} className="flex flex-col items-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                  isCompleted
                    ? "bg-green-500 border-green-500 text-white"
                    : hasStarted
                    ? "bg-green-100 border-green-500 text-green-700"
                    : progress.status === "locked"
                    ? "bg-gray-200 border-gray-300 text-gray-400"
                    : "bg-white border-green-300 text-green-600"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : hasStarted && mastery ? (
                  <span>{mastery.icon}</span>
                ) : progress.status === "locked" ? (
                  <Lock size={16} />
                ) : (
                  <Circle size={16} />
                )}
              </motion.div>
              <p
                className={`mt-2 text-xs font-medium ${
                  isCompleted
                    ? "text-green-700"
                    : hasStarted
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {step.name}
              </p>

              {/* Show lesson completion or mastery badge */}
              {isLesson && isCompleted && (
                <span className="mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                  ✓ Done
                </span>
              )}

              {!isLesson && hasStarted && mastery && (
                <div className="mt-1 flex flex-col items-center gap-1">
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
