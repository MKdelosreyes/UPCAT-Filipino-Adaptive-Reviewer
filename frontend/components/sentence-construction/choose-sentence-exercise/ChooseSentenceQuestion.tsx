"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Lightbulb } from "lucide-react";
import { useState, useEffect } from "react";
import { getExplanation } from "@/lib/api/ai-service";

interface ChooseSentenceQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  context: string;
  choices: string[];
  correctAnswer: string;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  showResult: boolean;
  explanation: string;
}

export default function ChooseSentenceQuestion({
  questionNumber,
  totalQuestions,
  context,
  choices,
  correctAnswer,
  selectedAnswer,
  onSelectAnswer,
  showResult,
  explanation,
}: ChooseSentenceQuestionProps) {
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const showExplanation =
    showResult && selectedAnswer && selectedAnswer !== correctAnswer;

  useEffect(() => {
    if (showExplanation && !aiExplanation) {
      fetchAIExplanation();
    }
  }, [showExplanation]);

  const fetchAIExplanation = async () => {
    if (!selectedAnswer) return;

    setLoadingExplanation(true);
    try {
      const data = await getExplanation({
        mode: "choose-sentence",
        word: "",
        correct: correctAnswer,
        selected: selectedAnswer,
        sentence: context,
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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Context */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
        <div className="text-center">
          <p className="text-lg md:text-2xl text-gray-900 font-medium leading-relaxed">
            {context}
          </p>
        </div>
      </div>

      {/* Instruction */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Piliin ang pinakamainam na pangungusap na tumutugma sa konteksto
        </p>
      </div>

      {/* Options and Explanation Side by Side */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Options Container */}
        <motion.div
          animate={{
            flex: showExplanation ? "0 0 42%" : "1 1 100%",
          }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <div className="grid grid-cols-1 gap-3">
            {choices.map((choice, index) => {
              const isSelected = selectedAnswer === choice;
              const isCorrect = choice === correctAnswer;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;

              return (
                <motion.button
                  key={index}
                  whileHover={!showResult ? { scale: 1.02 } : {}}
                  whileTap={!showResult ? { scale: 0.98 } : {}}
                  onClick={() => !showResult && onSelectAnswer(choice)}
                  disabled={showResult}
                  className={`relative p-4 rounded-xl border-3 text-left transition-all duration-300 ${
                    showCorrect
                      ? "bg-green-100 border-green-500"
                      : showWrong
                      ? "bg-red-100 border-red-500"
                      : isSelected
                      ? "bg-blue-50 border-blue-400"
                      : "bg-white border-blue-200 hover:border-blue-400"
                  } ${showResult ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Option Letter */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        showCorrect
                          ? "bg-green-500 text-white"
                          : showWrong
                          ? "bg-red-500 text-white"
                          : isSelected
                          ? "bg-blue-400 text-white"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>

                    {/* Option Text */}
                    <div className="flex-1 text-sm md:text-base text-gray-800 font-medium">
                      {choice}
                    </div>

                    {/* Result Icon */}
                    {showResult && (
                      <div className="flex-shrink-0">
                        {isCorrect ? (
                          <Check className="w-6 h-6 text-green-600" />
                        ) : (
                          isSelected && <X className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Explanation - slides in from right */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, x: 100, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: 100, width: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full lg:flex-[0_0_55%]"
            >
              <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6 h-full">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-100">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-blue-900">
                    Explanation
                  </h3>
                </div>
                {loadingExplanation ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-800 leading-relaxed space-y-3">
                    <p className="mb-3">
                      <span className="font-semibold text-blue-700">
                        Correct Answer:
                      </span>{" "}
                      {correctAnswer}
                    </p>
                    {aiExplanation && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-gray-700 whitespace-pre-line">
                          {aiExplanation}
                        </p>
                      </div>
                    )}
                    {explanation && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2 font-medium">
                          Additional Context:
                        </p>
                        <p className="text-gray-600 text-sm">{explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
