"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Lightbulb, MessageCircle } from "lucide-react";
import { getExplanation, ExplainResponse } from "@/lib/api/ai-service";
import AIChatModal from "./AIChatModal";

interface FillBlanksQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  sentence: string;
  choices: string[];
  correctAnswer: string;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  showResult: boolean;
  explanation: string;
  lemmaId?: string;
}

export default function FillBlanksQuestion({
  questionNumber,
  totalQuestions,
  sentence,
  choices,
  correctAnswer,
  selectedAnswer,
  onSelectAnswer,
  showResult,
  explanation: fallbackExplanation,
  lemmaId,
}: FillBlanksQuestionProps) {
  const [explanation, setExplanation] = useState<string>(fallbackExplanation);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [isAIExplanation, setIsAIExplanation] = useState(false);
  const showExplanation =
    showResult && selectedAnswer && selectedAnswer !== correctAnswer;
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Split sentence by blank marker
  const parts = sentence.split("_____");
  const fullSentence = parts.join(correctAnswer);

  useEffect(() => {
    async function loadExplanation() {
      if (!showExplanation) return;

      setIsLoadingExplanation(true);

      try {
        // Try to get AI explanation with timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI timeout")), 5000)
        );

        const aiPromise = getExplanation({
          mode: "fill-blanks",
          word: correctAnswer,
          correct: correctAnswer,
          selected: selectedAnswer || undefined,
          sentence: fullSentence,
        });

        // Race between AI response and timeout
        const aiResponse = await Promise.race<ExplainResponse>([
          aiPromise,
          timeoutPromise,
        ]);

        // Use AI explanation
        setExplanation(aiResponse.explanation);
        setIsAIExplanation(true);
        console.log("✅ AI explaination loaded");
      } catch (aiError) {
        console.log("⚠️ AI unavailable, using fallback explaination");
        // Use fallback explanation
        setExplanation(fallbackExplanation);
        setIsAIExplanation(false);
      } finally {
        setIsLoadingExplanation(false);
      }
    }

    loadExplanation();
  }, [
    showExplanation,
    correctAnswer,
    selectedAnswer,
    fullSentence,
    fallbackExplanation,
  ]);

  const renderExplanation = () => {
    if (!explanation) return null;

    return (
      <div className="prose prose-sm max-w-none">
        <div
          className="text-gray-700 text-sm space-y-2"
          dangerouslySetInnerHTML={{
            __html: explanation
              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
              .replace(/\n/g, "<br />")
              .replace(/^- /gm, "• "),
          }}
        />
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Sentence with Blank */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200 lg:mx-40">
        <div className="text-center">
          <p className="text-lg md:text-2xl text-gray-900 font-medium leading-relaxed">
            {parts[0]}
            <span className="inline-block mx-2 px-4 border-b-4 border-green-400 border-dashed min-w-[120px] text-center">
              {showResult && selectedAnswer ? (
                <span
                  className={
                    selectedAnswer === correctAnswer
                      ? "text-green-600 font-bold"
                      : "text-amber-600 font-bold"
                  }
                >
                  {selectedAnswer}
                </span>
              ) : (
                <span className="text-gray-400 text-sm"></span>
              )}
            </span>
            {parts[1]}
          </p>
        </div>
      </div>

      {/* Instruction */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Fill in the blank with the correct word
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
          className={`w-full ${
            showExplanation ? "lg:flex-[0_0_42%]" : "lg:mx-40"
          }`}
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
                      ? "bg-amber-100 border-amber-500"
                      : isSelected
                      ? "bg-green-50 border-green-400"
                      : "bg-white border-green-200 hover:border-green-400"
                  } ${showResult ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Option Letter */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        showCorrect
                          ? "bg-green-500 text-white"
                          : showWrong
                          ? "bg-amber-500 text-white"
                          : isSelected
                          ? "bg-green-400 text-white"
                          : "bg-green-100 text-green-700"
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
                          isSelected && <X className="w-6 h-6 text-amber-600" />
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
              <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-6 h-full">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-green-100">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-green-900">
                    Explaination
                  </h3>
                </div>
                <div className="text-sm text-gray-800 leading-relaxed">
                  {isLoadingExplanation ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      <p className="text-sm text-gray-600">
                        Loading explaination...
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="mb-3">
                        <span className="font-semibold text-green-700">
                          Correct Answer:
                        </span>{" "}
                        {correctAnswer}
                      </p>
                      {renderExplanation()}

                      {/* AI Chat Button */}
                      <div className="mt-4 pt-4 border-t border-green-100">
                        <button
                          onClick={() => setIsChatOpen(true)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors font-medium"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Ask AI for More Help
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI Chat Modal */}
      <AIChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        sentence={fullSentence}
        correctAnswer={correctAnswer}
        explanation={explanation}
      />
    </div>
  );
}
