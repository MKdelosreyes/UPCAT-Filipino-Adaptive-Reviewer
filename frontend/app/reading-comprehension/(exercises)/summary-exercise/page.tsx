"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Send } from "lucide-react";
import Link from "next/link";
import ReadingProgress from "@/components/reading-comprehension/ReadingProgress";
import { readingPassages } from "@/data/reading-comprehension-dataset";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { checkSummary, type SummaryCheckResponse } from "@/lib/api/ai-service";

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function SummaryExercisePage() {
  const { updateProgress } = useReadingProgress();
  
  const [passages, setPassages] = useState<typeof readingPassages>([]);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [summary, setSummary] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [feedbacks, setFeedbacks] = useState<(SummaryCheckResponse | null)[]>([null, null, null]);
  const [allScores, setAllScores] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showingFeedback, setShowingFeedback] = useState(false);

  // Initialize passages on client side only
  useEffect(() => {
    const shuffledPassages = shuffleArray(readingPassages);
    const selectedPassages = shuffledPassages.slice(0, 3);
    setPassages(selectedPassages);
  }, []);

  // Update word count when summary changes
  useEffect(() => {
    const words = summary.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [summary]);

  // Show loading state while initializing
  if (passages.length === 0) {
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

  const handleSubmit = async () => {
    if (summary.trim().length === 0) return;
    
    setIsChecking(true);
    setError(null);
    
    try {
      const currentPassage = passages[currentPassageIndex];
      
      // ✅ Call AI service to check summary
      const result = await checkSummary({
        passage_text: currentPassage.text,
        user_summary: summary,
        passage_title: currentPassage.title,
      });
      
      // Store feedback for this passage
      const newFeedbacks = [...feedbacks];
      newFeedbacks[currentPassageIndex] = result;
      setFeedbacks(newFeedbacks);
      
      // Store score
      const newScores = [...allScores, result.overall_score];
      setAllScores(newScores);
      
      setIsSubmitted(true);
      setShowingFeedback(true);
      
    } catch (err) {
      console.error("Failed to check summary:", err);
      setError("Failed to evaluate summary. Please try again.");
      
      // Fallback: basic word count score
      const targetWords = 50;
      const score = Math.min(100, Math.round((wordCount / targetWords) * 100));
      
      const newScores = [...allScores, score];
      setAllScores(newScores);
      
      setIsSubmitted(true);
      setShowingFeedback(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleNextPassage = () => {
    if (currentPassageIndex < passages.length - 1) {
      // Move to next passage
      setCurrentPassageIndex(prev => prev + 1);
      setSummary("");
      setIsSubmitted(false);
      setWordCount(0);
      setError(null);
      setShowingFeedback(false);
    } else {
      // All passages complete - mark as finished
      const avgScore = Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length);
      
      updateProgress("summary-exercise", {
        status: "in-progress",
        score: avgScore,
        completedAt: new Date().toISOString(),
        attempts: 1,
        lastDifficulty: "easy",
        errorTags: [],
      });
      
      // Show completion state
      setShowingFeedback(true);
    }
  };

  const resetExercise = () => {
    const shuffledPassages = shuffleArray(readingPassages);
    const selectedPassages = shuffledPassages.slice(0, 3);
    setPassages(selectedPassages);
    setCurrentPassageIndex(0);
    setSummary("");
    setIsSubmitted(false);
    setWordCount(0);
    setFeedbacks([null, null, null]);
    setAllScores([]);
    setError(null);
    setShowingFeedback(false);
  };

  const canSubmit = summary.trim().length > 0 && !isSubmitted && !isChecking;
  const currentPassage = passages[currentPassageIndex];
  const currentFeedback = feedbacks[currentPassageIndex];
  const isLastPassage = currentPassageIndex === passages.length - 1;
  const allComplete = isSubmitted && isLastPassage;

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
          <p className="text-xs text-gray-600 mt-1">
            {currentPassage.title} • Passage {currentPassageIndex + 1} of {passages.length}
          </p>
        </div>

        <div className="w-20"></div>
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
            {/* Progress Indicator */}
            <div className="bg-white rounded-xl shadow-md border-2 border-blue-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-900">
                  Overall Progress
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {allScores.length} / {passages.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(allScores.length / passages.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Passage {currentPassageIndex + 1} of {passages.length}
                {allScores.length > 0 && ` • Average Score: ${Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)}%`}
              </p>
            </div>

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
                  {isSubmitted && currentFeedback && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-green-600 font-semibold flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Score: {currentFeedback.overall_score}%
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl mb-4 bg-red-50 border-2 border-red-300"
                >
                  <p className="text-sm text-red-700">{error}</p>
                </motion.div>
              )}

              {/* AI Feedback (if submitted and available) */}
              {isSubmitted && currentFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 mb-4 max-h-96 overflow-y-auto"
                >
                  {/* Overall Feedback */}
                  <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-300">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      Overall Feedback
                    </p>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      {currentFeedback.feedback}
                    </p>
                  </div>

                  {/* Detailed Scores */}
                  <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-300">
                    <p className="text-sm font-semibold text-purple-900 mb-3">
                      Detailed Scores
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(currentFeedback.detailed_scores).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs text-purple-700 capitalize">
                            {key}:
                          </span>
                          <span className="text-sm font-bold text-purple-900">
                            {value}%
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-700">
                          Key Points: {currentFeedback.key_points_covered}/{currentFeedback.key_points_total}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths */}
                  {currentFeedback.strengths.length > 0 && (
                    <div className="p-4 rounded-xl bg-green-50 border-2 border-green-300">
                      <p className="text-sm font-semibold text-green-900 mb-2">
                        ✨ Strengths
                      </p>
                      <ul className="space-y-1">
                        {currentFeedback.strengths.map((strength, idx) => (
                          <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                            <span className="text-green-600">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Areas for Improvement */}
                  {currentFeedback.improvements.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300">
                      <p className="text-sm font-semibold text-amber-900 mb-2">
                        📈 Areas for Improvement
                      </p>
                      <ul className="space-y-1">
                        {currentFeedback.improvements.map((improvement, idx) => (
                          <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                            <span className="text-amber-600">•</span>
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Submit/Next Button */}
              {!isSubmitted ? (
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
                  {isChecking ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Checking Summary...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Summary
                    </>
                  )}
                </motion.button>
              ) : (
                <div className="space-y-3">
                  {!isLastPassage && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNextPassage}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200"
                    >
                      Next Passage
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  )}
                  
                  {allComplete && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300"
                    >
                      <p className="text-center text-lg font-bold text-green-900 mb-2">
                        🎉 All Passages Complete!
                      </p>
                      <p className="text-center text-sm text-green-800 mb-3">
                        Final Average Score: {Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)}%
                      </p>
                      <button
                        onClick={resetExercise}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Start New Exercise
                      </button>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
