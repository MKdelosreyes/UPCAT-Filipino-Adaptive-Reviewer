"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ReadingCard from "@/components/ReadingCard";
import ProgressStepper from "./_progress/ProgressStepper";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { readingPassages } from "@/data/reading-comprehension-dataset";

export default function ReadingComprehensionPage() {
  const { getReadingMastery } = useReadingProgress();
  const mastery = getReadingMastery();

  const masteryColors: Record<typeof mastery.level, string> = {
    beginner: "bg-gray-100 text-gray-700 border-gray-300",
    developing: "bg-purple-100 text-purple-700 border-purple-300",
    proficient: "bg-purple-100 text-purple-700 border-purple-300",
    advanced: "bg-purple-200 text-purple-800 border-purple-400",
    master: "bg-purple-300 text-purple-900 border-purple-500",
  };

  return (
    <div className="w-full min-h-screen flex items-start justify-center py-4 px-6 md:p-7 bg-gray-50">
      <div className="w-full md:max-w-7xl">
        {/* Top Bar - Back Button & Mastery Display */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          {/* Back Button - Left */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Mastery Display - Right */}
          <div className="flex flex-col items-end gap-2">
            <div
              className={`flex items-center gap-3 px-4 py-2 rounded-full border-2 shadow-sm ${
                masteryColors[mastery.level]
              }`}
            >
              <span className="text-xl">{mastery.icon}</span>
              <div className="text-left">
                <p className="text-xs font-medium opacity-75">
                  Reading Mastery
                </p>
                <p className="text-base font-bold capitalize">
                  {mastery.level}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 text-right max-w-xs">
              {mastery.description}
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-purple-900 mb-2 text-center">
            Reading Comprehension
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Develop critical reading and analysis skills through Filipino texts
          </p>

          {/* Progress Stepper */}
          <ProgressStepper />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
          <ReadingCard
            name="Reading Passages"
            description="Read passages and answer comprehension questions"
            imagePath="/art/reading-comprehension-1.png"
            color="bg-purple-50"
            url="/reading-comprehension/reading-exercise"
            exerciseType="passage-questions"
          />
          
          <ReadingCard
            name="Summarization"
            description="Write comprehensive summaries of reading passages"
            imagePath="/art/reading-comprehension-2.png"
            color="bg-purple-50"
            url="/reading-comprehension/summary-exercise"
            exerciseType="summary-exercise"
          />
        </div>
      </div>
    </div>
  );
}
