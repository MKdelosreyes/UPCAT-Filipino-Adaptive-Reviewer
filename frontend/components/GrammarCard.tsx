"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, BookOpen, TrendingUp, Clock } from "lucide-react";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import type {
  GrammarExercise,
  QuizProgress,
  LessonProgress,
} from "@/contexts/LearningProgressContext";

interface GrammarCardProps {
  name: string;
  description: string;
  imagePath: string;
  color: string;
  url: string;
  exerciseType: GrammarExercise;
}

export default function GrammarCard({
  name,
  description,
  imagePath,
  color,
  url,
  exerciseType,
}: GrammarCardProps) {
  const { getExerciseProgress, getExerciseMastery, isLessonExercise } =
    useGrammarProgress();

  const exerciseProgress = getExerciseProgress(exerciseType);
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
    if (quiz.performanceHistory.length === 0) return null;

    const lastTimestamp =
      quiz.performanceHistory[quiz.performanceHistory.length - 1].timestamp;
    const date = new Date(lastTimestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const lastAttempted = getLastAttempted();

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link href={url} className="block">
          <div
            className={`relative rounded-3xl shadow-lg overflow-hidden border-2 transition-all ${
              isLesson
                ? "border-green-500 ring-4 ring-green-300"
                : hasStarted
                ? "border-green-400 bg-green-50"
                : "border-green-200 hover:border-green-400"
            } ${color}`}
          >
            {/* Lesson Badge */}
            {isLesson && (
              <div className="absolute top-3 left-3 z-10">
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold border border-green-300">
                  <BookOpen className="w-3 h-3" />
                  Lesson
                </div>
              </div>
            )}

            {/* Mastery Badge */}
            {!isLesson && exerciseMastery && (
              <div className="absolute top-3 right-3 z-10">
                <div className="bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                  <span>{exerciseMastery.icon}</span>
                  <span className="capitalize">{exerciseMastery.level}</span>
                </div>
              </div>
            )}

            {/* Image */}
            <div className="relative h-40 w-full bg-white/50">
              <Image
                src={imagePath || "/art/grammar-icon.png"}
                alt={name}
                fill
                className="object-contain p-4"
                priority
              />
            </div>

            {/* Content */}
            <div className="p-5 bg-white/80 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-green-900 mb-2">{name}</h3>
              <p className="text-sm text-gray-700 mb-3">{description}</p>

              {/* Progress Info */}
              <div className="text-xs space-y-2">
                {isLesson ? (
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
                            (exerciseProgress as LessonProgress).timeSpent / 60
                          )}
                          m
                        </span>
                      )}
                    </div>
                    {!hasStarted && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Play className="w-4 h-4" />
                        Start learning grammar
                      </p>
                    )}
                  </div>
                ) : hasStarted && exerciseMastery ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-700">
                            Avg: {exerciseMastery.avgScore}%
                          </p>
                          <p className="text-gray-600 text-xs capitalize">
                            {exerciseMastery.difficulty} difficulty
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {(exerciseProgress as QuizProgress).score !== null && (
                          <p className="font-semibold text-green-700">
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
                    <Play className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-700">
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
