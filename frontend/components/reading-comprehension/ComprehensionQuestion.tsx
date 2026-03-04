import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import { getExplanation, ExplainResponse } from "@/lib/api/ai-service";

interface ComprehensionQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  questionType: string;
  choices: string[];
  correctAnswer: number;
  selectedAnswer: number | null;
  onSelectAnswer: (answerIndex: number) => void;
  showResult: boolean;
  explanation: string;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  passageTitle: string;
}

export default function ComprehensionQuestion({
  questionNumber,
  totalQuestions,
  question,
  questionType,
  choices,
  correctAnswer,
  selectedAnswer,
  onSelectAnswer,
  showResult,
  explanation: fallbackExplanation,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  passageTitle,
}: ComprehensionQuestionProps) {
  const [explanation, setExplanation] = useState<string>(fallbackExplanation);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [isAIExplanation, setIsAIExplanation] = useState(false);

  const showExplanation =
    showResult && selectedAnswer !== null && selectedAnswer !== correctAnswer;

  useEffect(() => {
    async function loadExplanation() {
      if (!showExplanation) return;

      setIsLoadingExplanation(true);

      try {
        console.log("🔄 Fetching AI explanation for reading comprehension...");

        // Try to get AI explanation with timeout (increased to 10 seconds)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("AI timeout")), 10000),
        );

        const requestData = {
          mode: "reading-comprehension" as const,
          word: question,
          correct: choices[correctAnswer],
          selected:
            selectedAnswer !== null ? choices[selectedAnswer] : undefined,
          sentence: passageTitle,
          explanation: fallbackExplanation,
        };

        console.log("📤 Request data:", requestData);

        const aiPromise = getExplanation(requestData);

        // Race between AI response and timeout
        const aiResponse = await Promise.race<ExplainResponse>([
          aiPromise,
          timeoutPromise,
        ]);

        console.log("📥 AI Response received:", aiResponse);

        if (aiResponse && aiResponse.explanation) {
          setExplanation(aiResponse.explanation);
          setIsAIExplanation(true);
          console.log("✅ AI explanation loaded for reading comprehension");
        } else {
          console.warn("⚠️ AI response empty, using fallback");
          setExplanation(fallbackExplanation);
          setIsAIExplanation(false);
        }
      } catch (aiError) {
        console.error("❌ AI explanation failed:", aiError);
        console.log("📝 Request details:", {
          mode: "reading-comprehension",
          question,
          correct: choices[correctAnswer],
          selected:
            selectedAnswer !== null ? choices[selectedAnswer] : undefined,
          passageTitle,
        });
        console.log("⚠️ Using fallback explanation");
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
    question,
    choices,
    correctAnswer,
    selectedAnswer,
    passageTitle,
    fallbackExplanation,
  ]);
  const getQuestionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      main_idea: "Main Idea",
      detail: "Detail",
      inference: "Inference",
      cause_effect: "Cause & Effect",
      author_purpose: "Author's Purpose",
      theme: "Theme",
    };
    return typeMap[type] || type;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-300 p-6 md:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
            {getQuestionTypeLabel(questionType)}
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-purple-900 leading-relaxed">
          {question}
        </h2>
      </div>

      {/* Choices */}
      <div className="space-y-3 mb-6 flex-1">
        {choices.map((choice, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrect = index === correctAnswer;
          const shouldShowCorrect = showResult && isCorrect;
          const shouldShowIncorrect = showResult && isSelected && !isCorrect;

          return (
            <motion.button
              key={index}
              whileHover={!showResult ? { scale: 1.02 } : {}}
              whileTap={!showResult ? { scale: 0.98 } : {}}
              onClick={() => !showResult && onSelectAnswer(index)}
              disabled={showResult}
              className={`
                w-full p-4 rounded-xl text-left font-medium
                transition-all duration-200 border-2
                ${
                  shouldShowCorrect
                    ? "bg-green-50 border-green-500 text-green-900"
                    : shouldShowIncorrect
                      ? "bg-amber-50 border-amber-500 text-amber-900"
                      : isSelected
                        ? "bg-purple-100 border-purple-500 text-purple-900"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-purple-50 hover:border-purple-300"
                }
                ${showResult ? "cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <div className="flex items-center justify-between">
                <span className="flex-1 pr-4">{choice}</span>
                {shouldShowCorrect && (
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                )}
                {shouldShowIncorrect && (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Explanation - Only show when user is WRONG */}
      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-xl mb-6 bg-amber-50 border-2 border-amber-300"
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-bold text-amber-900">
              Why you were wrong:
            </p>
          </div>
          {isLoadingExplanation ? (
            <div className="flex items-center gap-2 py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
              <p className="text-sm text-amber-700 italic">
                Generating explanation...
              </p>
            </div>
          ) : (
            <div
              className="text-sm text-amber-800 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: explanation
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\n/g, "<br />")
                  .replace(/^- /gm, "• "),
              }}
            />
          )}
        </motion.div>
      )}

      {/* Navigation Arrows */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t-2 border-purple-100">
        <motion.button
          whileHover={canGoPrevious ? { scale: 1.05 } : {}}
          whileTap={canGoPrevious ? { scale: 0.95 } : {}}
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={`
            flex items-center gap-2 px-4 py-3 rounded-xl font-semibold
            transition-all duration-200
            ${
              canGoPrevious
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </motion.button>

        <div className="text-center">
          <p className="text-xs text-purple-600 font-medium">
            {showResult ? "Answered" : "Select an answer"}
          </p>
        </div>

        <motion.button
          whileHover={canGoNext ? { scale: 1.05 } : {}}
          whileTap={canGoNext ? { scale: 0.95 } : {}}
          onClick={onNext}
          disabled={!canGoNext}
          className={`
            flex items-center gap-2 px-4 py-3 rounded-xl font-semibold
            transition-all duration-200
            ${
              canGoNext
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
