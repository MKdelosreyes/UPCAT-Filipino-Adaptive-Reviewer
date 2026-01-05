"use client";

import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { Lock, Circle, CheckCircle2 } from "lucide-react";
import type {
  VocabularyExercise,
  QuizProgress,
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

  // ✅ FIX: Only count QUIZ exercises for performance history
  const quizExercises = steps.filter((step) => !isLessonExercise(step.id));
  const completedQuizzes = quizExercises.filter(
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
              width: `${(completedQuizzes / quizExercises.length) * 100}%`,
            }}
          />
        </div>

        {steps.map((step) => {
          const exerciseProgress = progress[step.id];
          const isLesson = isLessonExercise(step.id);

          // ✅ FIX: Lessons don't have performanceHistory
          const hasStarted = isLesson
            ? exerciseProgress.status === "completed"
            : (exerciseProgress as QuizProgress).performanceHistory?.length > 0;

          const isAvailable =
            exerciseProgress.status === "not-started" ||
            exerciseProgress.status === "in-progress" ||
            exerciseProgress.status === "completed";
          const isLocked = exerciseProgress.status === "locked";

          const mastery =
            !isLesson && hasStarted
              ? getExerciseMastery(exerciseProgress as QuizProgress)
              : null;

          return (
            <div key={step.id} className="flex flex-col items-center relative">
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                  exerciseProgress.status === "completed"
                    ? "bg-green-500 text-white"
                    : hasStarted
                    ? "bg-blue-600 text-white"
                    : isAvailable
                    ? "bg-blue-100 text-blue-600 border-2 border-blue-600"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {exerciseProgress.status === "completed" ? (
                  <CheckCircle2 size={20} />
                ) : hasStarted && mastery ? (
                  <span>{mastery.icon}</span>
                ) : isLocked ? (
                  <Lock size={16} />
                ) : (
                  <Circle size={16} />
                )}
              </div>

              {/* Label */}
              <span
                className={`mt-2 text-xs md:text-sm font-medium text-center max-w-[80px] ${
                  hasStarted || isAvailable ? "text-blue-900" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>

              {/* Lesson Badge or Mastery Badge */}
              {isLesson && exerciseProgress.status === "completed" && (
                <div className="mt-1">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                    ✓ Lesson Done
                  </span>
                </div>
              )}

              {!isLesson && hasStarted && mastery && (
                <div className="mt-1 flex flex-col items-center gap-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                    {mastery.level}
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold capitalize">
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
