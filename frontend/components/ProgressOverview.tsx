"use client";

import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Target,
  Zap,
} from "lucide-react";
import { useLearningProgress } from "@/contexts/LearningProgressContext";

export default function ProgressOverview() {
  const { moduleInsights, studyStreak, learningPatterns } =
    useDashboardAnalytics();
  const { getOverallProgress, isLoading } = useLearningProgress();

  const overallProgress = getOverallProgress();

  const colorMap: Record<string, string> = {
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    green: "bg-green-100 text-green-800 border-green-300",
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    pink: "bg-pink-100 text-pink-800 border-pink-300",
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<
      string,
      { bg: string; border: string; text: string; progress: string }
    > = {
      yellow: {
        bg: "bg-yellow-100",
        border: "border-yellow-300",
        text: "text-yellow-800",
        progress: "bg-yellow-500",
      },
      green: {
        bg: "bg-green-100",
        border: "border-green-300",
        text: "text-green-800",
        progress: "bg-green-500",
      },
      blue: {
        bg: "bg-blue-100",
        border: "border-blue-300",
        text: "text-blue-800",
        progress: "bg-blue-500",
      },
      pink: {
        bg: "bg-pink-100",
        border: "border-pink-300",
        text: "text-pink-800",
        progress: "bg-pink-500",
      },
    };
    return colorMap[color] || colorMap.blue;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 w-full">
        {/* Skeleton Header */}
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>

        {/* Skeleton Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>

        {/* Skeleton Module Progress */}
        <div className="space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div>
        <h3 className="font-bold text-lg text-gray-800 mb-1">Your Progress</h3>
        <p className="text-xs text-gray-600">Track your learning journey</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {/* Study Streak */}
        <div className="bg-white border-2 border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <p className="text-xs font-semibold text-gray-700">Study Streak</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {studyStreak.current} <span className="text-sm">days</span>
          </p>
        </div>

        {/* Accuracy */}
        <div className="bg-white border-2 border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-green-500" />
            <p className="text-xs font-semibold text-gray-700">Avg. Score</p>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {learningPatterns.averageAccuracy}%
          </p>
        </div>
      </div>

      {/* Module Progress */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm text-gray-700">Module Progress</h4>
        {moduleInsights.map((module) => {
          const colors = getColorClasses(module.color);

          return (
            <div
              key={module.module}
              className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        module.color === "yellow"
                          ? "#eab308"
                          : module.color === "green"
                          ? "#22c55e"
                          : module.color === "blue"
                          ? "#3b82f6"
                          : "#ec4899",
                    }}
                  />
                  <span className="text-sm font-semibold text-gray-800">
                    {module.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {module.trend === "improving" && (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  )}
                  {module.trend === "declining" && (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  {module.trend === "stable" && (
                    <Minus className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm font-bold text-gray-700">
                    {module.progress}%
                  </span>
                </div>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${module.progress}%`,
                    backgroundColor:
                      module.color === "yellow"
                        ? "#eab308"
                        : module.color === "green"
                        ? "#22c55e"
                        : module.color === "blue"
                        ? "#3b82f6"
                        : "#ec4899",
                  }}
                />
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  {module.completedExercises}/{module.totalExercises} exercises
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-medium border ${colors.bg} ${colors.border} ${colors.text}`}
                >
                  {module.mastery}
                </span>
              </div>

              {module.averageScore > 0 && (
                <div className="mt-2 text-xs text-gray-600">
                  Average Score:{" "}
                  <span className="font-semibold">{module.averageScore}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
