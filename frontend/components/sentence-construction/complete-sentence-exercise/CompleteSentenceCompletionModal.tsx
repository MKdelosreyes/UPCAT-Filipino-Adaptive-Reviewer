"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Award, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

interface CompleteSentenceCompletionModalProps {
  isOpen: boolean;
  score: number;
  correctCount: number;
  totalQuestions: number;
  onClose: () => void;
  onRetake: () => void;
}

export default function CompleteSentenceCompletionModal({
  isOpen,
  score,
  correctCount,
  totalQuestions,
  onRetake,
}: CompleteSentenceCompletionModalProps) {
  const getPerformanceMessage = () => {
    if (score >= 80) {
      return "Napakagaling! Excellent work!";
    } else if (score >= 60) {
      return "Maganda! Keep practicing!";
    } else {
      return "Good start! Practice more to improve!";
    }
  };

  const getPerformanceEmoji = () => {
    if (score >= 80) {
      return "🎉";
    } else if (score >= 60) {
      return "👏";
    } else {
      return "💪";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            {/* Header */}
            <div className="text-center space-y-4 mb-6">
              <div className="flex justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="text-6xl"
                >
                  {getPerformanceEmoji()}
                </motion.div>
              </div>

              <h2 className="text-3xl font-bold text-gray-900">
                Exercise Complete!
              </h2>

              <p className="text-lg text-gray-600">
                {getPerformanceMessage()}
              </p>
            </div>

            {/* Score Display */}
            <div className="space-y-6 mb-8">
              {/* Score Circle */}
              <div className="flex justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="96"
                      cy="96"
                      r="90"
                      stroke="#e9d5ff"
                      strokeWidth="8"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <motion.circle
                      initial={{ strokeDashoffset: 565 }}
                      animate={{ strokeDashoffset: 565 - (565 * score) / 100 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      cx="96"
                      cy="96"
                      r="90"
                      stroke="#a855f7"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray="565"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold text-purple-600">
                      {score}%
                    </div>
                    <div className="text-sm text-gray-600">Score</div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="space-y-3 text-center">
                <div className="flex justify-around">
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-green-600">
                      {correctCount}
                    </p>
                    <p className="text-xs text-gray-600">Correct</p>
                  </div>
                  <div className="h-12 w-px bg-gray-300"></div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-red-600">
                      {totalQuestions - correctCount}
                    </p>
                    <p className="text-xs text-gray-600">Incorrect</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 flex flex-col">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onRetake}
                className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-lg"
              >
                <RotateCcw className="w-5 h-5" />
                Retake Exercise
              </motion.button>

              <Link
                href="/sentence-construction"
                className="flex items-center justify-center gap-2 w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-4 px-6 rounded-xl transition-colors"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
