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
      <Link
        href={isLocked ? "#" : url}
        className={`group block ${isLocked ? "cursor-not-allowed" : ""}`}
        onClick={handleClick}
      >
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
              </div>
            )}
            {isLocked && (
              <div className="flex items-center gap-1 bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                <Lock size={14} />
                <span>Locked</span>
              </div>
            )}
          </div>

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
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
