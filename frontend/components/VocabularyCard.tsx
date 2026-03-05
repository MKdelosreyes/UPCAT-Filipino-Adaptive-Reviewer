"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type {
  VocabularyExercise,
  QuizProgress,
  LessonProgress,
} from "@/contexts/LearningProgressContext";
import { Play, BookOpen, TrendingUp, Clock } from "lucide-react";

interface VocabularyCardProps {
  name: string;
  description: string;
  imagePath?: string;
  color?: string;
  url: string;
  exerciseType: VocabularyExercise;
}

export default function VocabularyCard({
  name,
  description,
  imagePath,
  color = "bg-white",
  url,
  exerciseType,
}: VocabularyCardProps) {
  const { progress, getExerciseMastery, isLessonExercise } =
    useVocabularyProgress();
  const { isLoading: progressLoading } = useLearningProgress();

  const exerciseProgress = progress[exerciseType];
  const isLesson = isLessonExercise(exerciseType);
  const hasStarted = isLesson
    ? (exerciseProgress as LessonProgress).timeSpent > 0
    : (exerciseProgress as QuizProgress).attempts > 0;

  const exerciseMastery =
    !isLesson && hasStarted
      ? getExerciseMastery(exerciseProgress as QuizProgress)
      : null;

  const getLastAttempted = (): string | null => {
    if (isLesson) return null;
    const quiz = exerciseProgress as QuizProgress;

    if (!quiz.completedAt) return null;

    const date = new Date(quiz.completedAt);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const lastAttempted = getLastAttempted();

  return (
    <div className="relative h-full">
      <motion.div
        className="h-full"
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link href={url} className="block h-full">
          <div
            className={`relative h-full rounded-3xl shadow-lg overflow-hidden border-2 transition-all flex flex-col ${
              isLesson
                ? "border-yellow-600 ring-4 ring-yellow-300"
                : hasStarted
                  ? "border-yellow-400 bg-yellow-50"
                  : "border-yellow-200 hover:border-yellow-400"
            } ${color}`}
          >
            {/* Lesson Badge - Top Left */}
            {isLesson && (
              <div className="absolute top-3 left-3 z-10">
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold border border-green-300">
                  <BookOpen className="w-3 h-3" />
                  Lesson
                </div>
              </div>
            )}

            {/* Mastery Badge - Top Right */}
            {!isLesson && exerciseMastery && (
              <div className="absolute top-3 right-3 z-10">
                <div className="bg-yellow-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                  <span>{exerciseMastery.icon}</span>
                  <span className="capitalize">{exerciseMastery.level}</span>
                </div>
              </div>
            )}

            {/* Image (fixed height) */}
            <div className="relative h-40 max-sm:h-35 w-full bg-white/50 shrink-0">
              <Image
                src={imagePath || "/art/flashcards-icon.png"}
                alt={name}
                fill
                className="object-contain p-4"
                priority
              />
            </div>

            {/* Content (flexes to fill remaining height) */}
            <div className="p-5 bg-white/80 backdrop-blur-sm flex-1 flex flex-col">
              <h3 className="text-xl max-sm:text-lg font-bold text-yellow-600 mb-1">
                {name}
              </h3>

              {/* Make description take consistent space */}
              <p className="text-sm max-sm:text-xs text-gray-700 mb-1 leading-snug min-h-[40px]">
                {description}
              </p>

              {/* Progress Info pinned toward the bottom */}
              <div className="text-xs space-y-2 mt-auto">
                {progressLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-40" />
                    <div className="h-3 bg-gray-200 rounded w-28" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                  </div>
                ) : isLesson ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-700">
                          Study Mode
                        </span>
                      </div>
                      {hasStarted && (
                        <span className="text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.floor(
                            (exerciseProgress as LessonProgress).timeSpent / 60,
                          )}
                          m
                        </span>
                      )}
                    </div>
                    {!hasStarted && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Play className="w-4 h-4" />
                        Start learning vocabulary
                      </p>
                    )}
                  </div>
                ) : hasStarted && exerciseMastery ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-yellow-600" />
                        <div>
                          <p className="font-semibold text-yellow-700">
                            Avg: {exerciseMastery.avgScore}%
                          </p>
                          <p className="text-gray-600 text-xs capitalize">
                            {exerciseMastery.difficulty} difficulty
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {(exerciseProgress as QuizProgress).score !== null && (
                          <p className="font-semibold text-yellow-700">
                            Best: {(exerciseProgress as QuizProgress).score}%
                          </p>
                        )}
                        <p className="text-gray-600">
                          {(exerciseProgress as QuizProgress).attempts} attempt
                          {(exerciseProgress as QuizProgress).attempts > 1
                            ? "s"
                            : ""}
                        </p>
                      </div>
                    </div>
                    {lastAttempted && (
                      <p className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last: {lastAttempted}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-yellow-700">
                        Ready to Start
                      </p>
                      <p className="text-gray-600">Begin practicing</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
