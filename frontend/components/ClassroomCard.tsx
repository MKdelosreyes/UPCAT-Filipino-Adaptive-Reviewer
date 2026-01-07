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
      className="flex justify-center items-center group w-full touch-manipulation"
    >
      <DashboardCard
        title={title}
        skill={skill}
        description={description}
        color={color}
        className={`p-0 overflow-hidden relative justify-end w-full h-48 md:h-52 transition-all duration-300 ${
          isRecommended && !completed
            ? "ring-2 md:ring-4 ring-blue-500 ring-offset-2 md:ring-offset-4 ring-offset-white shadow-xl md:shadow-2xl shadow-blue-500/70 scale-[1.02] md:scale-105"
            : ""
        }`}
      >
        {/* Recommended Badge (Top-Left) */}
        {isRecommended && !completed && (
          <div className="absolute top-2 left-2 md:top-3 md:left-3 z-30 flex items-center gap-1 bg-gradient-to-r from-blue-700 to-blue-600 text-white px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-bold shadow-xl md:shadow-2xl animate-pulse border border-white md:border-2">
            <Sparkles size={14} className="animate-spin" />
            <span className="hidden xs:inline">RECOMMENDED</span>
            <span className="xs:hidden">NEXT</span>
          </div>
        )}

        {/* Image Background */}
        <Image
          src={imagePath}
          alt={`${title} Artwork`}
          fill
          sizes="(max-width: 768px) 85vw, 352px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={isRecommended}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t ${
            isRecommended && !completed
              ? "from-blue-900/60 via-blue-800/40 to-transparent"
              : "from-black/30 via-black/10 to-transparent"
          }`}
        />

        {/* Recommendation/Mastery Text (Bottom) */}
        <div className="relative z-10 p-2 md:p-0">
          <p className="text-xs md:text-sm text-blue-200 mt-1 md:mt-2 group-hover:text-blue-100 transition-colors font-medium">
            {getRecommendationText()}
          </p>
        </div>
      </DashboardCard>
    </Link>
  );
};

export default ClassroomCard;
