"use client";

import Link from "next/link";
import Image from "next/image";
import DashboardCard from "./DashboardCard";
import {
  useLearningProgress,
  ModuleType,
} from "@/contexts/LearningProgressContext";
import { Check, Circle, Sparkles } from "lucide-react";
import { useDashboardInsights } from "@/hooks/useDashboardInsights";

interface ClassroomCardProps {
  title: string;
  skill: string;
  imagePath: string;
  description: string;
  color: string;
  url: string;
  moduleType: ModuleType;
}

const ClassroomCard = ({
  title,
  skill,
  imagePath,
  description,
  color,
  url,
  moduleType,
}: ClassroomCardProps) => {
  const { isModuleCompleted, getRecommendedModule, markModuleAccessed } =
    useLearningProgress();

  const { getModuleMastery } = useDashboardInsights();

  const completed = isModuleCompleted(moduleType);
  const isRecommended = getRecommendedModule() === moduleType;
  const mastery = getModuleMastery(moduleType);

  // Generate recommendation reason based on mastery
  const getRecommendationText = () => {
    if (completed) {
      return "✓ Completed";
    }
    if (isRecommended) {
      if (mastery.level === "beginner") {
        return "📌 Recommended: Start here";
      }
      return `Recommended: Continue (${mastery.level})`;
    }
    if (mastery.level !== "beginner") {
      return `In Progress: ${mastery.icon} ${mastery.level}`;
    }
    return "Available";
  };

  const handleClick = () => {
    markModuleAccessed(moduleType);
  };

  return (
    <Link
      href={url}
      onClick={handleClick}
      className="flex justify-center items-center group w-full"
    >
      <DashboardCard
        title={title}
        skill={skill}
        description={description}
        color={color}
        className={`p-0 overflow-hidden relative justify-end max-w-4xl w-full min-h-[12rem] transition-all duration-300 ${
          isRecommended && !completed
            ? "ring-4 ring-blue-500 ring-offset-4 ring-offset-white shadow-2xl shadow-blue-500/70 scale-105"
            : ""
        }`}
      >
        {/* Recommended Badge (Top-Left) */}
        {isRecommended && !completed && (
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1 bg-gradient-to-r from-blue-700 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-2xl animate-pulse border-2 border-white">
            <Sparkles size={16} className="animate-spin" />
            <span>RECOMMENDED NEXT</span>
          </div>
        )}

        {/* Mastery Badges (Top-Right) */}
        {/* <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
          {completed ? (
            <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
              <Check size={14} />
              <span>Completed</span>
            </div>
          ) : mastery.level !== "beginner" ? (
            <>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 shadow-lg ${mastery.color}`}
              >
                <span>{mastery.icon}</span>
                <span className="capitalize">{mastery.level}</span>
              </div>

              <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-blue-700 border border-blue-200 shadow-md">
                {mastery.difficulty}
              </div>
            </>
          ) : (
            <Circle size={16} className="text-white/70" />
          )}
        </div> */}

        {/* Image Background */}
        <Image
          src={imagePath}
          alt="Classroom Artwork"
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t ${
            isRecommended && !completed
              ? "from-blue-900/60 via-blue-800/40 to-transparent"
              : "from-black/30 via-black/10 to-transparent"
          }`}
        />

        {/* Recommendation/Mastery Text (Bottom) */}
        <div className="relative z-10">
          <p className="text-sm text-blue-200 mt-2 group-hover:text-blue-100 transition-colors font-medium">
            {getRecommendationText()}
          </p>
        </div>
      </DashboardCard>
    </Link>
  );
};

export default ClassroomCard;
