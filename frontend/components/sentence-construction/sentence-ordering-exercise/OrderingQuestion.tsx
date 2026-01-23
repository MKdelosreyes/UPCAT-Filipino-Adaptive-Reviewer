"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Lightbulb, RotateCcw } from "lucide-react";
import { useState } from "react";
import { getExplanation } from "@/lib/api/ai-service";

interface OrderingQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  words: string[];
  correctSentence: string;
  onSubmit: (userSentence: string, isCorrect: boolean) => void;
  showResult: boolean;
  isCorrect: boolean | null;
  explanation: string;
}

export default function OrderingQuestion({
  questionNumber,
  totalQuestions,
  words,
  correctSentence,
  onSubmit,
  showResult,
  isCorrect,
  explanation,
}: OrderingQuestionProps) {
  const [wordOrder, setWordOrder] = useState<string[]>([...words]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...wordOrder];
    const draggedWord = newOrder[draggedIndex];

    // Remove dragged word
    newOrder.splice(draggedIndex, 1);
    // Insert at new position
    newOrder.splice(index, 0, draggedWord);

    setWordOrder(newOrder);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSubmit = () => {
    const userSentence = wordOrder.join(" ");
    const correct = userSentence === correctSentence;
    setHasSubmitted(true);
    onSubmit(userSentence, correct);

    // Fetch AI explanation if answer is wrong
    if (!correct) {
      fetchAIExplanation(userSentence);
    }
  };

  const fetchAIExplanation = async (userSentence: string) => {
    setLoadingExplanation(true);
    try {
      const data = await getExplanation({
        mode: "sentence-ordering",
        word: "",
        correct: correctSentence,
        selected: userSentence,
        explanation: explanation,
      });

      setAiExplanation(data.explanation);
    } catch (error) {
      console.error("Error fetching AI explanation:", error);
      setAiExplanation(
        "Pasensya na, may problema sa pagkuha ng AI explanation."
      );
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleReset = () => {
    setWordOrder([...words]);
    setHasSubmitted(false);
    setAiExplanation("");
    setLoadingExplanation(false);
  };

  const showExplanation = showResult && !isCorrect;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Simple Instruction */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Arrange the words in correct order
        </h2>
        <p className="text-sm text-gray-600">I-drag at i-drop para ayusin</p>
      </div>

      {/* Word Arrangement Area */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-blue-200">
        {/* Draggable Words Container */}
        <div className="flex flex-wrap gap-3 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 min-h-[120px]">
          {wordOrder.map((word, index) => (
            <motion.div
              key={`${word}-${index}`}
              draggable={!showResult}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              whileHover={!showResult ? { scale: 1.05, cursor: "grab" } : {}}
              whileTap={!showResult ? { scale: 0.95, cursor: "grabbing" } : {}}
              className={`relative px-5 py-3 rounded-lg font-medium text-sm md:text-lg transition-all select-none ${
                showResult
                  ? isCorrect
                    ? "bg-green-100 border-2 border-green-400 text-green-900"
                    : "bg-amber-100 border-2 border-amber-400 text-amber-900"
                  : draggedIndex === index
                  ? "bg-blue-200 border-2 border-blue-500 text-blue-900 shadow-lg"
                  : "bg-white border-2 border-blue-300 text-gray-900 shadow-sm hover:shadow-md hover:border-blue-400"
              }`}
            >
              <span>{word}</span>
              {!showResult && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Result Display */}
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            {/* Status Badge */}
            <div className="flex items-center justify-center gap-3">
              {isCorrect ? (
                <div className="flex items-center gap-2 px-6 py-3 bg-green-100 rounded-full border-2 border-green-400">
                  <Check className="w-6 h-6 text-green-700" />
                  <span className="font-bold text-green-900">
                    Tama! Correct!
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-6 py-3 bg-amber-100 rounded-full border-2 border-amber-400">
                  <X className="w-6 h-6 text-amber-700" />
                  <span className="font-bold text-amber-900">
                    Mali. Incorrect.
                  </span>
                </div>
              )}
            </div>

            {/* Correct Answer Display */}
            {!isCorrect && (
              <div className="p-5 rounded-xl bg-green-50 border-2 border-green-300">
                <p className="text-sm font-semibold text-green-900 mb-2">
                  Correct Answer:
                </p>
                <p className="text-lg font-medium text-green-800">
                  {correctSentence}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* AI Explanation Panel */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6"
          >
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-blue-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Lightbulb className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-blue-900">
                AI Explanation
              </h3>
            </div>

            {loadingExplanation ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {aiExplanation && (
                  <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                      {aiExplanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      {!showResult && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Reset Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className="sm:w-auto w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </motion.button>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={hasSubmitted}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Answer
          </motion.button>
        </div>
      )}
    </div>
  );
}
