"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Lightbulb, MessageCircle } from "lucide-react";
import { getLexiconData, LexiconItem } from "@/lib/api/exercises";
import { getExplanation, ExplainResponse } from "@/lib/api/ai-service";
import AIChatModal from "./AIChatModal";

interface QuizQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  sentence: string;
  wordId: string;
  options: string[];
  correctAnswer: string;
  selectedAnswer: string | null;
  onSelectAnswer: (answer: string) => void;
  showResult: boolean;
}

export default function QuizQuestion({
  questionNumber,
  totalQuestions,
  sentence,
  wordId,
  options,
  correctAnswer,
  selectedAnswer,
  onSelectAnswer,
  showResult,
}: QuizQuestionProps) {
  const [explanation, setExplanation] = useState<string>("");
  const [lexiconData, setLexiconData] = useState<LexiconItem | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [isAIExplanation, setIsAIExplanation] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const showExplanation =
    showResult && selectedAnswer && selectedAnswer !== correctAnswer;

  // Extract the underlined word for AI explanation
  const underlinedWordMatch = sentence.match(/<u>(.*?)<\/u>/);
  const underlinedWord = underlinedWordMatch ? underlinedWordMatch[1] : "";

  // Load explanation when wrong answer is selected
  useEffect(() => {
    async function loadExplanation() {
      if (!showExplanation) return;

      setIsLoadingExplanation(true);

      try {
        // First, get lexicon data
        const allLexicon = await getLexiconData();
        const entry = allLexicon.find((item) => item.lemma_id === wordId);

        if (entry) {
          setLexiconData(entry);

          // Try to get AI explanation with timeout
          try {
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("AI timeout")), 5000),
            );

            const aiPromise = getExplanation({
              mode: "quiz",
              word: underlinedWord,
              correct: correctAnswer,
              selected: selectedAnswer,
            });

            // Race between AI response and timeout
            const aiResponse = await Promise.race<ExplainResponse>([
              aiPromise,
              timeoutPromise,
            ]);

            // Use AI explanation
            setExplanation(aiResponse.explanation);
            setIsAIExplanation(true);
            console.log("✅ AI explanation loaded");
            return;
          } catch (aiError) {
            console.log("⚠️ AI unavailable, using simple explanation");
          }

          // Fallback to simple explanation
          const simpleExplanation = buildSimpleExplanation(
            correctAnswer,
            entry.base_definition,
            entry.relations?.synonyms || [],
          );
          setExplanation(simpleExplanation);
          setIsAIExplanation(false);
        }
      } catch (error) {
        console.error("Failed to load explanation:", error);
        setExplanation(
          "Unable to load explanation. Please try again or click the 'Explain' button below for help.",
        );
        setIsAIExplanation(false);
      } finally {
        setIsLoadingExplanation(false);
      }
    }

    loadExplanation();
  }, [showExplanation, wordId, underlinedWord, correctAnswer, selectedAnswer]);

  const buildSimpleExplanation = (
    correct: string,
    meaning: string,
    synonyms: string[],
  ): string => {
    let explanation = `**Correct Answer:** ${correct}\n\n`;
    explanation += `**Meaning:** ${meaning}\n\n`;

    if (synonyms && synonyms.length > 0) {
      explanation += `**Synonyms:** ${synonyms.join(", ")}`;
    }

    return explanation;
  };

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
      {/* Question Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xs md:text-sm text-gray-600">
          Ano ang pinakamalapit sa kahulugan ng salitang may{" "}
          <u className="decoration-yellow-800 decoration-2">salungguhit</u>?
        </h2>
        <div className="bg-yellow-100 rounded-xl py-6 border-2 border-yellow-300">
          <p
            className="text-lg md:text-xl text-yellow-800 font-bold leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sentence }}
          />
        </div>
      </div>

      {/* Options and Explanation Side by Side */}
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
        {/* Options Container */}
        <motion.div
          animate={{
            flex: showExplanation ? "0 0 42%" : "1 1 100%",
          }}
          transition={{ duration: 0.3 }}
          className={`w-full ${
            showExplanation ? "lg:flex-[0_0_42%]" : "lg:mx-60"
          }`}
        >
          <div className="grid grid-cols-1 gap-3">
            {options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === correctAnswer;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;

              return (
                <motion.button
                  key={index}
                  whileHover={!showResult ? { scale: 1.02 } : {}}
                  whileTap={!showResult ? { scale: 0.98 } : {}}
                  onClick={() => !showResult && onSelectAnswer(option)}
                  disabled={showResult}
                  className={`relative p-4 rounded-xl border-3 text-left transition-all duration-300 ${
                    showCorrect
                      ? "bg-green-100 border-green-500"
                      : showWrong
                        ? "bg-red-100 border-red-500"
                        : isSelected
                          ? "bg-yellow-500 text-white"
                          : "bg-yellow-100 text-yellow-700"
                  }`}
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
                              ? "bg-yellow-500 text-white"
                              : "bg-yellow-200 text-yellow-700"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>

                    {/* Option Text */}
                    <div className="flex-1 text-sm md:text-base text-gray-800 font-medium">
                      {option}
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
              <div className="bg-white rounded-2xl shadow-lg border-2 border-yellow-200 p-6 h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-yellow-100">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-bold text-yellow-900">
                    Explanation
                  </h3>
                  {isAIExplanation && (
                    <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      AI-Powered
                    </span>
                  )}
                </div>

                {/* Explanation Content */}
                <div className="flex-1 mb-4">
                  {isLoadingExplanation ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
                      <p className="text-sm text-gray-600">
                        Loading explanation...
                      </p>
                    </div>
                  ) : (
                    <>
                      {renderExplanation()}
                      {/* Explain Button */}
                      <div className="mt-4 pt-4 border-t border-yellow-100">
                        <button
                          onClick={() => setShowChatModal(true)}
                          className="w-full flex items-center justify-center gap-2 border bg-yellow-50 hover:bg-yellow-100 text-yellow-800 font-semibold py-3 px-6 rounded-lg transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Ask AI for More Help</span>
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
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        word={underlinedWord}
        correctAnswer={correctAnswer}
        lexiconData={lexiconData}
      />
    </div>
  );
}
