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
  mobileMinimalView?: boolean;
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
  mobileMinimalView = false,
}: ClassroomCardProps) => {
  const { isModuleCompleted, getRecommendedModule, markModuleAccessed } =
    useLearningProgress();

  const { getModuleMastery } = useDashboardInsights();

  const completed = isModuleCompleted(moduleType);
  const isRecommended = getRecommendedModule() === moduleType;
  const mastery = getModuleMastery(moduleType);

  // Emoji mapping for mobile
  const getModuleEmoji = () => {
    const emojiMap = {
      vocabulary: "📚",
      grammar: "✏️",
      "sentence-construction": "🔗",
      "reading-comprehension": "👁️",
    };
    return emojiMap[moduleType] || "📚";
  };
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
        recommendationText={getRecommendationText()}
        className={`p-0 overflow-hidden relative justify-end w-full h-48 md:h-52 transition-all duration-300 ${
          isFocused
            ? `ring-2 md:ring-4 ${moduleColors.ring} ring-offset-2 md:ring-offset-4 ring-offset-white shadow-xl md:shadow-2xl ${moduleColors.shadow} scale-[1.02] md:scale-105`
            : ""
        }`}
      >
        {/* Recommended Badge */}
        {isRecommended && !completed && !mobileMinimalView && (
          <div
            className={`absolute top-2 left-2 md:top-3 md:left-3 z-30 flex items-center gap-1 bg-gradient-to-r ${moduleColors.badge} text-white px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-bold shadow-xl md:shadow-2xl animate-pulse border border-white md:border-2`}
          >
            <Sparkles size={14} className="animate-spin" />
            <span className="hidden xs:inline">RECOMMENDED</span>
            <span className="xs:hidden">NEXT</span>
          </div>
        )}

        {/* Image Background - Hidden on mobile, show emoji instead */}
        <div className="absolute inset-0 hidden md:block">
          <Image
            src={imagePath}
            alt={`${title} Artwork`}
            fill
            sizes="(max-width: 768px) 85vw, 352px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={isRecommended}
          />
        </div>


        {/* Gradient Overlay - Hidden on mobile since we use colored bg */}
        <div
          className={`absolute inset-0 hidden md:block bg-gradient-to-t ${
            mobileMinimalView
              ? "from-black/60 via-black/20 to-transparent"
              : isFocused
              ? `${moduleColors.gradient} to-transparent`
              : "from-black/30 via-black/10 to-transparent"
          }`}
        />

        {/* Mobile Minimal View - Title Only */}
        {mobileMinimalView && (
          <div className="relative z-10 p-3 h-full flex flex-col justify-end">
            <h3 className="text-white font-bold text-lg md:text-xl">
              {title}
            </h3>
          </div>
        )}

        {/* Recommendation/Mastery Text (Bottom) - Hidden in mobile minimal view and on mobile */}
        {!mobileMinimalView && (
          <div className="relative z-10 p-2 md:p-0 hidden md:block">
            <p
              className={`text-xs md:text-sm ${moduleColors.text} mt-1 md:mt-2 ${moduleColors.textHover} transition-colors font-medium`}
            >
              {getRecommendationText()}
            </p>
          </div>
        )}
      </DashboardCard>
    </Link>
  );
};

export default ClassroomCard;
