"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import type {
  ReadingExercise,
  QuizProgress,
} from "@/contexts/LearningProgressContext";
import { Play, TrendingUp, Clock } from "lucide-react";

interface ReadingCardProps {
  name: string;
  description: string;
  imagePath: string;
  color: string;
  url: string;
  exerciseType: ReadingExercise;
}

export default function ReadingCard({
  name,
  description,
  imagePath,
  color = "bg-white",
  url,
  exerciseType,
}: ReadingCardProps) {
  const { progress, getExerciseMastery } = useReadingProgress();

  const exerciseProgress = progress[exerciseType];
  const hasStarted = (exerciseProgress as QuizProgress).attempts > 0;

  const exerciseMastery = hasStarted
    ? getExerciseMastery(exerciseProgress as QuizProgress)
    : null;

  // Calculate last attempted date
  const getLastAttempted = (): string | null => {
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
              hasStarted
                ? "border-purple-400 bg-purple-50"
                : "border-purple-200 hover:border-purple-400"
            } ${color}`}
          >
            {/* Mastery Badge - Top Right */}
            {exerciseMastery && (
              <div className="absolute top-3 right-3 z-10">
                <div className="bg-purple-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                  <span>{exerciseMastery.icon}</span>
                  <span className="capitalize">{exerciseMastery.level}</span>
                </div>
              </div>
            )}

            {/* Image */}
            <div className="relative h-40 w-full bg-white/50">
              <Image
                src={imagePath || "/art/reading-icon.png"}
                alt={name}
                fill
                className="object-contain p-4"
                priority
              />
            </div>

            {/* Content */}
            <div className="p-5 bg-white/80 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-purple-900 mb-2">{name}</h3>
              <p className="text-sm text-gray-700 mb-3">{description}</p>

              {/* Progress Info */}
              <div className="text-xs space-y-2">
                {hasStarted && exerciseMastery ? (
                  // Quiz Progress Display
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <div>
                          <p className="font-semibold text-purple-700">
                            Avg: {exerciseMastery.avgScore}%
                          </p>
                          <p className="text-gray-600 text-xs capitalize">
                            {exerciseMastery.difficulty} difficulty
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {(exerciseProgress as QuizProgress).score !== null && (
                          <p className="font-semibold text-purple-700">
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
                  // Not Started
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-semibold text-purple-700">
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

