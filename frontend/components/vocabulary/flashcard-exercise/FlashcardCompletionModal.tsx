"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Clock, Award, BookOpen } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface CompletionModalProps {
  isOpen: boolean;
  score?: number;
  masteredCount: number;
  totalCards: number;
  onClose: () => void;
}

export default function FlashcardCompletionModal({
  isOpen,
  score,
  masteredCount,
  totalCards,
  onClose,
}: CompletionModalProps) {
  // Calculate review completion percentage (mastered / total)
  const completionRate = Math.round((masteredCount / totalCards) * 100);

  useEffect(() => {
    if (isOpen && completionRate >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, completionRate]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-yellow-600" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Review Complete!
                </h2>
                <p className="text-gray-600">
                  You've reviewed all the vocabulary flashcards.
                </p>
              </div>

              {/* Stats */}
              <div className="space-y-3 bg-yellow-50 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-yellow-600" />
                    Words Reviewed
                  </span>
                  <span className="text-2xl font-bold text-yellow-600">
                    {totalCards}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Marked as Mastered
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {masteredCount}/{totalCards}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Completion Rate
                  </span>
                  <span className="text-xl font-bold text-purple-600">
                    {completionRate}%
                  </span>
                </div>
              </div>

              {/* Performance Message */}
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <p className="text-sm text-yellow-800 font-medium">
                  {completionRate >= 90
                    ? "Excellent! You've mastered most words. Ready for the quiz!"
                    : completionRate >= 70
                    ? "Good job! Keep reviewing to strengthen your memory."
                    : completionRate >= 50
                    ? "Nice work! Review more to build confidence."
                    : "Keep going! Regular practice builds mastery."}
                </p>
              </div>

              {/* Progress Insight */}
              {completionRate < 70 && (
                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-800">
                    💡 Tip: Review flashcards multiple times to move words from
                    "Still Learning" to "Mastered"
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {completionRate >= 70 ? (
                  <Link
                    href="/vocabulary/what-is-its-closest-meaning"
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center"
                  >
                    Continue to Quiz →
                  </Link>
                ) : (
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    Review Again
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Practice More Flashcards
                </button>
                <Link
                  href="/vocabulary"
                  className="w-full text-center text-gray-600 hover:text-gray-800 py-2 text-sm"
                >
                  Back to Vocabulary
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
