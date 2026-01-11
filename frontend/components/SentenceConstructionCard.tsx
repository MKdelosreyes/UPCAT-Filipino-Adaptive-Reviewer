"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSentenceConstructionProgress } from "@/hooks/useSentenceConstructionProgress";
import type { SentenceExercise } from "@/contexts/LearningProgressContext";
import { CheckCircle, Play, Sparkles } from "lucide-react";

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
  const {
    progress,
    canAccessExercise,
    getNextRecommended,
    getExerciseMastery,
  } = useSentenceConstructionProgress();

  const exerciseProgress = progress[exerciseType];
  const isAccessible = canAccessExercise(exerciseType);
  const isCompleted = exerciseProgress.status === "completed";
  const isRecommended = getNextRecommended() === exerciseType;

  const exerciseMastery = getExerciseMastery(exerciseProgress);

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link href={url} className="block">
          <div
            className={`relative rounded-3xl shadow-lg overflow-hidden border-2 transition-all ${
              isCompleted
                ? "border-orange-300 bg-orange-50"
                : isRecommended
                ? "border-orange-500 ring-4 ring-orange-300"
                : "border-orange-200 hover:border-orange-400"
            } ${color}`}
          >
            {/* Status Badge */}
            <div className="absolute top-3 right-3 z-10">
              {isRecommended ? (
                <div className="bg-orange-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold shadow-md">
                  <Sparkles className="w-3 h-3" />
                  Next
                </div>
              ) : isCompleted ? (
                <div className="bg-orange-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                  <CheckCircle className="w-3 h-3" />
                  Completed
                </div>
              ) : (
                <div className="bg-orange-600 text-white px-3 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
                  <Play className="w-3 h-3" />
                  Start
                </div>
              )}
            </div>

            {/* Image */}
            <div className="relative h-40 w-full bg-white/50">
              <Image
                src={imagePath}
                alt={name}
                fill
                className="object-contain p-4"
                priority
              />
            </div>

            {/* Content */}
            <div className="p-5 bg-white/80 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-orange-900 mb-2">{name}</h3>
              <p className="text-sm text-gray-700 mb-3">{description}</p>

              {/* Progress Info */}
              <div className="text-xs">
                {exerciseMastery && exerciseProgress.attempts > 0 ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{exerciseMastery.icon}</span>
                      <div>
                        <p className="font-semibold text-orange-700 capitalize">
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
                    <div className="text-right">
                      <p className="text-gray-600">
                        {exerciseProgress.attempts} attempt
                        {exerciseProgress.attempts > 1 ? "s" : ""}
                      </p>
                      {exerciseProgress.score !== null && (
                        <p className="font-semibold text-orange-700">
                          Best: {exerciseProgress.score}%
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-700">
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
