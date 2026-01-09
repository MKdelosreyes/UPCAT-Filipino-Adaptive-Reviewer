"use client";

import { motion } from "framer-motion";

interface CompleteSentenceProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  answers: (boolean | null)[];
}

export default function CompleteSentenceProgress({
  currentQuestion,
  totalQuestions,
  answers,
}: CompleteSentenceProgressProps) {
  const correctCount = answers.filter((a) => a === true).length;
  const progressPercentage = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            Progress
          </span>
        <span className="text-sm font-semibold text-purple-600">
            {currentQuestion + 1} of {totalQuestions}
          </span>
        </div>
        <div className="w-full h-3 bg-purple-100 rounded-full overflow-hidden border border-purple-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
          />
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex gap-2 flex-wrap">
        {answers.map((answer, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
              index === currentQuestion
                ? "ring-2 ring-purple-400 ring-offset-2"
                : ""
            } ${
              answer === null
                ? "bg-gray-200 text-gray-600"
                : answer === true
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
            }`}
          >
            {index + 1}
          </motion.button>
        ))}
      </div>

      {/* Score Display */}
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
        <p className="text-sm text-gray-600">
          Correct: <span className="font-bold text-purple-600">{correctCount}</span> out of{" "}
          <span className="font-bold text-gray-900">{totalQuestions}</span>
        </p>
      </div>
    </div>
  );
}
