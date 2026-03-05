"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSentenceConstructionProgress } from "@/hooks/useSentenceConstructionProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type { SentenceExercise } from "@/contexts/LearningProgressContext";
import { Play, TrendingUp, Clock } from "lucide-react";

interface SentenceConstructionCardProps {
  name: string;
  description: string;
  imagePath: string;
  color?: string;
  url: string;
  exerciseType: SentenceExercise;
}

export default function SentenceConstructionCard({
  name,
  description,
  imagePath,
  color = "bg-white",
  url,
  exerciseType,
}: SentenceConstructionCardProps) {
  const { progress, getExerciseMastery } = useSentenceConstructionProgress();
  const { isLoading: progressLoading } = useLearningProgress();

  const exerciseProgress = progress[exerciseType];
  const hasStarted = exerciseProgress.attempts > 0;
  const exerciseMastery = hasStarted
    ? getExerciseMastery(exerciseProgress)
    : null;

  const getLastAttempted = (): string | null => {
    const candidates: string[] = [];

    if (exerciseProgress.completedAt)
      candidates.push(exerciseProgress.completedAt);

    const hist = exerciseProgress.performanceHistory;
    if (hist.length > 0) {
      const lastHistTs = hist[hist.length - 1]?.timestamp;
      if (lastHistTs) candidates.push(lastHistTs);
    }

    if (candidates.length === 0) return null;

    const newestIso = candidates.reduce((best, cur) => {
      return new Date(cur).getTime() > new Date(best).getTime() ? cur : best;
    });

    const date = new Date(newestIso);
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
              hasStarted
                ? "border-blue-400 bg-blue-50"
                : "border-blue-200 hover:border-blue-400"
            } ${color}`}
          >
            {/* Mastery Badge */}
            {exerciseMastery && (
              <div className="absolute top-3 right-3 z-10">
                <div className="bg-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                  <span>{exerciseMastery.icon}</span>
                  <span className="capitalize">{exerciseMastery.level}</span>
                </div>
              </div>
            )}

            {/* Image (fixed height) */}
            <div className="relative h-40 max-sm:h-35 w-full bg-white/50 shrink-0">
              <Image
                src={imagePath}
                alt={name}
                fill
                className="object-contain p-4"
                priority
              />
            </div>

            {/* Content (fills remaining height) */}
            <div className="p-5 bg-white/80 backdrop-blur-sm flex-1 flex flex-col">
              <h3 className="text-xl max-sm:text-lg font-bold text-blue-900 mb-1">
                {name}
              </h3>

              <p className="text-sm max-sm:text-xs text-gray-700 mb-1 leading-snug min-h-[40px]">
                {description}
              </p>

              {/* Progress Info pinned to bottom */}
              <div className="text-xs space-y-2 mt-auto">
                {progressLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-40" />
                    <div className="h-3 bg-gray-200 rounded w-28" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                  </div>
                ) : hasStarted && exerciseMastery ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="font-semibold text-blue-700">
                            Avg: {exerciseMastery.avgScore}%
                          </p>
                          <p className="text-gray-600 text-xs capitalize">
                            {exerciseMastery.difficulty} difficulty
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {exerciseProgress.score !== null && (
                          <p className="font-semibold text-blue-700">
                            Best: {exerciseProgress.score}%
                          </p>
                        )}
                        <p className="text-gray-600">
                          {exerciseProgress.attempts} attempt
                          {exerciseProgress.attempts > 1 ? "s" : ""}
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
                    <Play className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-blue-700">
                        Ready to Start
                      </p>
                      <p className="text-gray-600">
                        Build and organize sentences
                      </p>
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
