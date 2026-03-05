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
  isFocused?: boolean;
}

const ClassroomCard = ({
  title,
  skill,
  imagePath,
  description,
  color,
  url,
  moduleType,
  isFocused = false,
}: ClassroomCardProps) => {
  const { isModuleCompleted, getRecommendedModule, markModuleAccessed } =
    useLearningProgress();

  const { getModuleMastery } = useDashboardInsights();

  const completed = isModuleCompleted(moduleType);
  const isRecommended = getRecommendedModule() === moduleType;
  const mastery = getModuleMastery(moduleType);

  // Get colors based on module type
  const getModuleColors = () => {
    const colorMap = {
      vocabulary: {
        ring: "ring-yellow-500",
        shadow: "shadow-yellow-500/70",
        badge: "from-yellow-700 to-yellow-600",
        gradient: "from-yellow-900/60 via-yellow-800/40",
        text: "text-yellow-200",
        textHover: "group-hover:text-yellow-100",
      },
      grammar: {
        ring: "ring-green-500",
        shadow: "shadow-green-500/70",
        badge: "from-green-700 to-green-600",
        gradient: "from-green-900/60 via-green-800/40",
        text: "text-green-200",
        textHover: "group-hover:text-green-100",
      },
      "sentence-construction": {
        ring: "ring-blue-500",
        shadow: "shadow-blue-500/70",
        badge: "from-blue-700 to-blue-600",
        gradient: "from-blue-900/60 via-blue-800/40",
        text: "text-blue-200",
        textHover: "group-hover:text-blue-100",
      },
      "reading-comprehension": {
        ring: "ring-purple-500",
        shadow: "shadow-purple-500/70",
        badge: "from-purple-700 to-purple-600",
        gradient: "from-purple-900/60 via-purple-800/40",
        text: "text-purple-200",
        textHover: "group-hover:text-purple-100",
      },
    };
    return colorMap[moduleType] || colorMap.vocabulary;
  };

  const moduleColors = getModuleColors();

  // Generate recommendation reason based on mastery
  const getRecommendationText = () => {
    if (completed) {
      return "✓ Completed";
    }
    if (isRecommended) {
      if (mastery.level === "beginner") {
        return "Recommended: Start here";
      }
      return `Recommended: Continue (${mastery.level})`;
    }
    if (mastery.level !== "beginner") {
      return `In Progress: ${mastery.level}`;
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
        moduleType={moduleType}
        className={`p-0 overflow-hidden relative justify-end w-full h-52 sm:h-60 md:h-52 transition-all duration-300 ${
          isFocused
            ? `ring-2 sm:ring-3 md:ring-4 ${moduleColors.ring} ring-offset-2 sm:ring-offset-3 md:ring-offset-4 ring-offset-white shadow-lg sm:shadow-xl md:shadow-2xl ${moduleColors.shadow} scale-[1.01] sm:scale-[1.02] md:scale-105`
            : ""
        }`}
      >
        {/* Recommended Badge - smaller on mobile */}
        {isRecommended && !completed && (
          <div
            className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2 md:top-3 md:left-3 z-30 flex items-center gap-0.5 sm:gap-1 bg-gradient-to-r ${moduleColors.badge} text-white px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-3 md:py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-bold shadow-lg sm:shadow-xl md:shadow-2xl animate-pulse border border-white sm:border-2`}
          >
            <Sparkles
              size={10}
              className="animate-spin sm:w-3 sm:h-3 md:w-4 md:h-4"
            />
            <span className="hidden sm:inline">RECOMMENDED</span>
            <span className="sm:hidden">NEXT</span>
          </div>
        )}

        {/* Image Background */}
        <Image
          src={imagePath}
          alt={`${title} Artwork`}
          fill
          sizes="(max-width: 640px) 70vw, (max-width: 768px) 65vw, 352px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={isRecommended}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t ${
            isFocused
              ? `${moduleColors.gradient} to-transparent`
              : "from-black/30 via-black/10 to-transparent"
          }`}
        />

        {/* Recommendation/Mastery Text (Bottom) - adjusted padding */}
        <div className="relative z-10 p-1.5 sm:p-2 md:p-3">
          <p
            className={`text-[10px] sm:text-xs md:text-sm ${moduleColors.text} mt-0.5 sm:mt-1 md:mt-2 ${moduleColors.textHover} transition-colors font-medium`}
          >
            {getRecommendationText()}
          </p>
        </div>
      </DashboardCard>
    </Link>
  );
};

export default ClassroomCard;
