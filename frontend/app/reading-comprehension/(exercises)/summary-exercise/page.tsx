"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, BookOpen, Send } from "lucide-react";
import Link from "next/link";
import ReadingProgress from "@/components/reading-comprehension/ReadingProgress";
import { readingPassages } from "@/data/reading-comprehension-dataset";
import { useReadingProgress } from "@/hooks/useReadingProgress";

export default function SummaryExercisePage() {
  const { updateProgress } = useReadingProgress();
  
  const [currentPassage, setCurrentPassage] = useState<typeof readingPassages[0] | null>(null);
  const [summary, setSummary] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Initialize passage on client side only
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * readingPassages.length);
    const passage = readingPassages[randomIndex];
    setCurrentPassage(passage);
  }, []);

  // Update word count when summary changes
  useEffect(() => {
    const words = summary.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [summary]);

  // Show loading state while initializing
  if (!currentPassage) {
    return (
      <div className="h-screen bg-blue-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200">
          <Link
            href="/reading-comprehension"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-blue-900">
              Summary Exercise
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    if (summary.trim().length === 0) return;
    
    // ✅ Calculate a simple score based on word count
    const targetWords = 50;
    const score = Math.min(100, Math.round((wordCount / targetWords) * 100));
    
    // ✅ Update progress with completion status
    updateProgress("summary-exercise", {
      status: "completed",
      score: score,
      completedAt: new Date().toISOString(),
      attempts: 1,
      lastDifficulty: "easy",
      errorTags: [],
    });
    
    setIsSubmitted(true);
  };

  const resetExercise = () => {
    const randomIndex = Math.floor(Math.random() * readingPassages.length);
    const passage = readingPassages[randomIndex];
    setCurrentPassage(passage);
    setSummary("");
    setIsSubmitted(false);
    setWordCount(0);
  };

  const canSubmit = summary.trim().length > 0 && !isSubmitted;

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200 shadow-sm">
        <Link
          href="/reading-comprehension"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl md:text-2xl font-bold text-blue-900">
              Summary Exercise
            </h1>
          </div>
          <p className="text-xs text-gray-600 mt-1">{currentPassage.title}</p>
        </div>

        <button
          onClick={resetExercise}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">New Passage</span>
        </button>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 md:p-6">
          {/* Left Panel - Reading Passage */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-blue-300 p-6 md:p-8 overflow-y-auto"
          >
            <div className="mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">
                {currentPassage.title}
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                  {currentPassage.difficulty}
                </span>
                <span className="text-xs font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                  {currentPassage.wordCount} words
                </span>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              {currentPassage.text.split("\n\n").map((paragraph, index) => (
                <p
                  key={index}
                  className="text-gray-800 leading-relaxed mb-4 text-justify"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.div>

          {/* Right Panel - Summary Input */}
          <div className="flex flex-col gap-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-blue-300 p-6 md:p-8 h-full flex flex-col"
            >
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-2">
                  Summarize the Passage
                </h2>
                <p className="text-sm text-gray-600">
                  Write a brief summary of what you read. Include the main ideas and key points.
                </p>
              </div>

              {/* Text Area */}
              <div className="flex-1 mb-4">
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  disabled={isSubmitted}
                  placeholder="Start writing your summary here..."
                  className={`w-full h-full p-4 rounded-xl border-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all ${
                    isSubmitted
                      ? "bg-gray-50 border-gray-300 cursor-not-allowed"
                      : "border-blue-200 focus:border-blue-400"
                  }`}
                />
              </div>

              {/* Word Count & Status */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Word count: <span className="font-semibold text-blue-600">{wordCount}</span>
                  </span>
                  {isSubmitted && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-green-600 font-semibold flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Submitted
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Feedback (if submitted) */}
              {isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl mb-4 bg-blue-50 border-2 border-blue-300"
                >
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Great work!
                  </p>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Your summary has been recorded. A good summary captures the main ideas concisely and accurately.
                  </p>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                whileHover={canSubmit ? { scale: 1.02 } : {}}
                whileTap={canSubmit ? { scale: 0.98 } : {}}
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`
                  w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg
                  transition-all duration-200
                  ${
                    canSubmit
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }
                `}
              >
                <Send className="w-5 h-5" />
                Submit Summary
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
