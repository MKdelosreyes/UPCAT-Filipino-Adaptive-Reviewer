import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

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
  explanation,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
}: ComprehensionQuestionProps) {
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
    <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-300 p-6 md:p-8 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
            {getQuestionTypeLabel(questionType)}
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-blue-900 leading-relaxed">
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
                    ? "bg-red-50 border-red-500 text-red-900"
                    : isSelected
                    ? "bg-blue-100 border-blue-500 text-blue-900"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
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

      {/* Explanation */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl mb-6 ${
            selectedAnswer === correctAnswer
              ? "bg-green-50 border-2 border-green-300"
              : "bg-blue-50 border-2 border-blue-300"
          }`}
        >
          <p className="text-sm font-semibold text-blue-900 mb-1">
            Explanation:
          </p>
          <p className="text-sm text-blue-800 leading-relaxed">{explanation}</p>
        </motion.div>
      )}

      {/* Navigation Arrows */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t-2 border-blue-100">
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
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </motion.button>

        <div className="text-center">
          <p className="text-xs text-blue-600 font-medium">
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
                ? "bg-blue-600 hover:bg-blue-700 text-white"
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
