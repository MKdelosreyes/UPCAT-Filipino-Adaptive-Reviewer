"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
<<<<<<< HEAD
import { Play, BookOpen, TrendingUp, Clock } from "lucide-react";
=======
import { Lock, CheckCircle, Play, Sparkles, BookOpen } from "lucide-react";
>>>>>>> c657bb5 (merged with main)
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import type {
  GrammarExercise,
  QuizProgress,
<<<<<<< HEAD
  LessonProgress,
} from "@/contexts/LearningProgressContext";
=======
} from "@/contexts/LearningProgressContext";
import { useState } from "react";
>>>>>>> c657bb5 (merged with main)

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
<<<<<<< HEAD
  const { getExerciseProgress, getExerciseMastery, isLessonExercise } =
    useGrammarProgress();

  const exerciseProgress = getExerciseProgress(exerciseType);
  const isLesson = isLessonExercise(exerciseType);
  const hasStarted = isLesson
    ? (exerciseProgress as LessonProgress).timeSpent > 0
    : (exerciseProgress as QuizProgress).attempts > 0;
=======
  const {
    getExerciseProgress,
    canAccessExercise,
    getNextRecommended,
    getExerciseMastery,
    isLessonExercise,
  } = useGrammarProgress();
  const [showWarning, setShowWarning] = useState(false);

  const exerciseProgress = getExerciseProgress(exerciseType);
  const isLocked = !canAccessExercise(exerciseType);
  const isCompleted = exerciseProgress.status === "completed";
  const isRecommended = getNextRecommended() === exerciseType;

  // ✅ FIX: Only get mastery for quiz exercises
  const isLesson = isLessonExercise(exerciseType);
  const exerciseMastery = !isLesson
    ? getExerciseMastery(exerciseProgress as QuizProgress)
    : null;
>>>>>>> c657bb5 (merged with main)

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

<<<<<<< HEAD
  const lastAttempted = getLastAttempted();

=======
>>>>>>> c657bb5 (merged with main)
  return (
    <div className="relative">
      <motion.div
        whileHover={!isLocked ? { scale: 1.03, y: -4 } : {}}
        whileTap={!isLocked ? { scale: 0.98 } : {}}
      >
<<<<<<< HEAD
        <motion.div
          whileHover={isLocked ? {} : { scale: 1.05, y: -5 }}
          whileTap={isLocked ? {} : { scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`relative flex flex-col items-center justify-between gap-4 p-6 border-4 ${
            isRecommended
              ? "border-green-500 ring-4 ring-green-300"
              : isCompleted
              ? "border-green-200"
              : isLocked
              ? "border-gray-300"
              : "border-green-300"
          } ${color} rounded-2xl shadow-lg hover:shadow-2xl ${
            !isLocked && "hover:border-green-500"
          } transition-all duration-300 h-full min-h-[16rem] ${
            isLocked ? "opacity-60" : ""
          }`}
        >
          {/* Status Badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isRecommended && (
              <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-md">
                <Sparkles size={14} />
                <span>Next</span>
=======
        <Link
          href={isLocked ? "#" : url}
          className={`block ${isLocked ? "pointer-events-none" : ""}`}
          onClick={handleClick}
        >
          <div
            className={`relative rounded-3xl shadow-lg overflow-hidden border-2 transition-all ${
              isLocked
                ? "border-gray-300 bg-gray-100 opacity-60"
                : isCompleted
                ? "border-green-300 bg-green-50"
                : isRecommended
                ? "border-green-500 ring-4 ring-green-300"
                : "border-green-200 hover:border-green-400"
            } ${color}`}
          >
            {/* Status Badge */}
            <div className="absolute top-3 right-3 z-10">
              {isLocked ? (
                <div className="bg-gray-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                  <Lock className="w-3 h-3" />
                  Locked
                </div>
              ) : isRecommended ? (
                <div className="bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold shadow-md">
                  <Sparkles className="w-3 h-3" />
                  Next
                </div>
              ) : isCompleted ? (
                <div className="bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                  <CheckCircle className="w-3 h-3" />
                  Completed
                </div>
              ) : (
                <div className="bg-green-600 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                  <Play className="w-3 h-3" />
                  Start
                </div>
              )}
            </div>

            {/* ✅ NEW: Lesson Badge */}
            {isLesson && (
              <div className="absolute top-3 left-3 z-10">
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold border border-green-300">
                  <BookOpen className="w-3 h-3" />
                  Lesson
                </div>
>>>>>>> c657bb5 (merged with main)
              </div>
            )}

<<<<<<< HEAD
          {/* Mastery Badges - Top Right */}
          {!isLocked && exerciseMastery.sessionsAtDifficulty > 0 && (
            <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
              {/* Mastery Level */}
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                  masteryColors[exerciseMastery.level]
                }`}
              >
                <span>{exerciseMastery.icon}</span>
                <span className="capitalize">{exerciseMastery.level}</span>
              </div>

              {/* Difficulty */}
              <div
                className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                  difficultyColors[exerciseMastery.difficulty]
                }`}
              >
                <span className="capitalize">{exerciseMastery.difficulty}</span>
              </div>

              {/* Session Count */}
              <div className="bg-white text-green-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-green-200">
                {exerciseMastery.sessionsAtDifficulty} session
                {exerciseMastery.sessionsAtDifficulty !== 1 ? "s" : ""}
              </div>
=======
            {/* Image */}
            <div className="relative h-40 w-full bg-white/50">
              <Image
                src={imagePath}
                alt={name}
                fill
                className="object-contain p-4"
                priority
              />
>>>>>>> c657bb5 (merged with main)
            </div>

<<<<<<< HEAD
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
          <div className="flex flex-col items-center text-center gap-2 flex-grow justify-end">
            <h3
              className={`text-lg md:text-xl font-bold transition-colors ${
                isLocked
                  ? "text-gray-500"
                  : "text-green-900 group-hover:text-green-600"
              }`}
            >
              {name}
            </h3>
            <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
              {description}
            </p>
          </div>

          {/* Hover indicator */}
          {!isLocked && (
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
=======
            {/* Content */}
            <div className="p-5 bg-white/80 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-green-900 mb-2">{name}</h3>
              <p className="text-sm text-gray-700 mb-3">{description}</p>

              {/* Progress Info */}
              {!isLocked && (
                <div className="text-xs">
                  {/* ✅ FIX: Different display for lessons vs quizzes */}
                  {isLesson ? (
                    // Lesson Progress Display
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-700">
                          {isCompleted ? "✓ Lesson Completed" : "Study Mode"}
                        </p>
                        <p className="text-gray-600">
                          No scoring • Learn at your pace
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Quiz Progress Display
                    exerciseMastery && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {exerciseMastery.icon}
                          </span>
                          <div>
                            <p className="font-semibold text-green-700 capitalize">
                              {exerciseMastery.level}
                            </p>
                            <p className="text-gray-600">
                              Avg: {exerciseMastery.avgScore}% •{" "}
                              <span className="capitalize">
                                {exerciseMastery.difficulty}
                              </span>
                            </p>
                          </div>
                        </div>
                        {(exerciseProgress as QuizProgress).attempts > 0 && (
                          <div className="text-right">
                            <p className="text-gray-600">
                              {(exerciseProgress as QuizProgress).attempts}{" "}
                              attempt
                              {(exerciseProgress as QuizProgress).attempts > 1
                                ? "s"
                                : ""}
                            </p>
                            {(exerciseProgress as QuizProgress).score !==
                              null && (
                              <p className="font-semibold text-green-700">
                                Best: {(exerciseProgress as QuizProgress).score}
                                %
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
>>>>>>> c657bb5 (merged with main)
            </div>
          </div>
        </Link>
      </motion.div>
<<<<<<< HEAD
=======

      {/* Warning Message */}
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute -bottom-16 left-0 right-0 bg-red-500 text-white text-sm p-3 rounded-lg shadow-lg text-center z-50"
        >
          Complete previous exercises first! 🔒
        </motion.div>
      )}
>>>>>>> c657bb5 (merged with main)
    </div>
  );
}
