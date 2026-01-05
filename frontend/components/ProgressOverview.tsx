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
  const { getOverallProgress } = useLearningProgress();

  const overallProgress = getOverallProgress();

  const colorMap: Record<string, string> = {
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    green: "bg-green-100 text-green-800 border-green-300",
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    pink: "bg-pink-100 text-pink-800 border-pink-300",
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <div>
        <h3 className="font-bold text-lg text-gray-800 mb-1">Your Progress</h3>
        <p className="text-xs text-gray-600">Track your learning journey</p>
      </div>

      {/* Overall Progress Card */}
      {/* <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-600 font-medium">
              Overall Completion
            </p>
            <p className="text-3xl font-bold text-blue-900">
              {overallProgress}%
            </p>
          </div>
          <div className="p-3 bg-white rounded-full">
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="w-full bg-white rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div> */}

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
        {moduleInsights.map((module) => (
          <div
            key={module.module}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full bg-${module.color}-500`}
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

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
              <div
                className={`h-full bg-${module.color}-500 transition-all duration-500`}
                style={{ width: `${module.progress}%` }}
              />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>
                {module.completedExercises}/{module.totalExercises} exercises
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-medium ${
                  colorMap[module.color]
                }`}
              >
                {module.mastery}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
