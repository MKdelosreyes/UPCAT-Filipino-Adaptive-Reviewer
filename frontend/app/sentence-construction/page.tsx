"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import SentenceConstructionCard from "@/components/SentenceConstructionCard";
import ProgressStepper from "./_progress/ProgressStepper";
import { useSentenceConstructionProgress } from "@/hooks/useSentenceConstructionProgress";

export default function SentenceConstructionPage() {
  const { getSentenceConstructionMastery } = useSentenceConstructionProgress();
  const mastery = getSentenceConstructionMastery();

  const masteryColors = {
    beginner: "bg-gray-100 text-gray-700 border-gray-300",
    developing: "bg-blue-100 text-blue-700 border-blue-300",
    proficient: "bg-blue-100 text-blue-700 border-blue-300",
    advanced: "bg-blue-200 text-blue-800 border-blue-400",
    master: "bg-blue-300 text-blue-900 border-blue-500",
  };

  return (
    <div className="w-full min-h-screen flex items-start justify-center py-4 px-6 md:p-7 bg-gray-50">
      <div className="w-full md:max-w-7xl">
        {/* Top Bar - Back Button & Mastery Display */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          {/* Back Button - Left */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
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
                  Construction Mastery
                </p>
                <p className="text-base font-bold capitalize">
                  {mastery.level}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 text-right max-w-xs">
              {mastery.description} • Focus:{" "}
              <span className="font-semibold capitalize">
                {mastery.difficulty}
              </span>
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-2 text-center">
            Sentence Construction Activities
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Master sentence building through interactive exercises
          </p>

          {/* Progress Stepper */}
          <ProgressStepper />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
          <SentenceConstructionCard
            name="Sentence Ordering"
            description="Drag and drop words to form correct sentences"
            imagePath="/art/sentence-construction-1.png"
            color="bg-blue-50"
            url="/sentence-construction/ordering"
            exerciseType="sentence-ordering"
          />
          <SentenceConstructionCard
            name="Choose the Best Sentence"
            description="Evaluate overall sentence quality and naturalness"
            imagePath="/art/sentence-construction-2.png"
            color="bg-blue-50"
            url="/sentence-construction/choose-sentence"
            exerciseType="choose-sentence"
          />
        </div>
      </div>
    </div>
  );
}
