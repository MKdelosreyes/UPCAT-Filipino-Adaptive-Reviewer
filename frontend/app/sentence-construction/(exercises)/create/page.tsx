"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import CompleteSentenceQuestion from "@/components/sentence-construction/complete-sentence-exercise/CompleteSentenceQuestion";
import CompleteSentenceProgress from "@/components/sentence-construction/complete-sentence-exercise/CompleteSentenceProgress";
import CompleteSentenceCompletionModal from "@/components/sentence-construction/complete-sentence-exercise/CompleteSentenceCompletionModal";
import { useSentenceConstructionProgress } from "@/hooks/useSentenceConstructionProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import {
  sentenceConstructionData,
  type CompleteSentenceItem,
} from "@/data/sentence-construction-dataset";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";

interface CompletionAnswer {
  isCorrect: boolean;
  userCompletion: string;
  correctCompletions: string[];
  incompletePhrase: string;
}

export default function CompleteSentencePage() {
  const { updateProgress } = useSentenceConstructionProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const [completeQuestions, setCompleteQuestions] = useState<
    CompleteSentenceItem[]
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<CompletionAnswer[]>(
    []
  );
  const [showCompletion, setShowCompletion] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Initialize questions on client side only
  useEffect(() => {
    setIsClient(true);
    // Type guard to filter only complete_sentence items
    const completeExercises = sentenceConstructionData.filter(
      (item): item is CompleteSentenceItem =>
        item.exerciseType === "complete_sentence"
    );
    const shuffled = [...completeExercises].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));
    setCompleteQuestions(selected);
    setAnswers(Array(selected.length).fill(null));
  }, []);

  // Show loading state while initializing
  if (!isClient || completeQuestions.length === 0) {
    return (
      <div className="h-screen bg-purple-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-purple-200">
          <Link
            href="/sentence-construction"
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-purple-900">
              Complete the Sentence
            </h1>
          </div>
          <div className="w-20"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  const currentComplete = completeQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === completeQuestions.length - 1;

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const correct = currentComplete.correctCompletions.some(
      (completion) => completion.toLowerCase() === answer.toLowerCase()
    );
    setIsCorrect(correct);

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = correct;
    setAnswers(newAnswers);

    // Store detailed answer for analysis
    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect: correct,
        userCompletion: answer,
        correctCompletions: currentComplete.correctCompletions,
        incompletePhrase: currentComplete.incompletePhrase,
      },
    ]);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      completeExercise();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setShowResult(false);
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  };

  const completeExercise = () => {
    const correctCount = answers.filter((a) => a === true).length;
    const score = Math.round((correctCount / completeQuestions.length) * 100);

    // Calculate performance metrics
    let missedLowFreq = 0;
    let similarChoiceErrors = 0;

    detailedAnswers.forEach((answer) => {
      const question = completeQuestions.find(
        (q) => q.incompletePhrase === answer.incompletePhrase
      );
      if (!answer.isCorrect && question?.difficulty === "hard") {
        missedLowFreq++;
      }

      if (!answer.isCorrect) {
        similarChoiceErrors++;
      }
    });

    // Get current difficulty
    const history = getPerformanceHistory(
      "sentence-construction",
      "complete-sentence"
    );
    const currentDifficulty =
      history.length > 0 ? history[history.length - 1].difficulty : "easy";

    // Create performance metrics
    const metrics = {
      difficulty: currentDifficulty,
      score,
      missedLowFreq,
      similarChoiceErrors,
      timestamp: new Date().toISOString(),
    };

    // Add to performance history
    // addPerformanceMetrics("sentence-construction", "complete-sentence", metrics);

    // Evaluate and get next difficulty + tags
    const allHistory = [...history, metrics];
    const evaluation = evaluateUserPerformance(allHistory);

    // Update progress with evaluation results
    // updateProgress("complete-sentence", {
    //   status: "completed",
    //   score,
    //   completedAt: new Date().toISOString(),
    //   attempts: (history.length || 0) + 1,
    //   lastDifficulty: evaluation.nextDifficulty,
    //   errorTags: evaluation.tags,
    // });

    setShowCompletion(true);
  };

  const resetExercise = () => {
    // Type guard to filter only complete_sentence items
    const completeExercises = sentenceConstructionData.filter(
      (item): item is CompleteSentenceItem =>
        item.exerciseType === "complete_sentence"
    );

    const shuffled = [...completeExercises].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    setCompleteQuestions(selected);
    setCurrentQuestion(0);
    setShowResult(false);
    setAnswers(Array(selected.length).fill(null));
    setDetailedAnswers([]);
    setShowCompletion(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  return (
    <div className="h-screen bg-purple-50 overflow-auto flex flex-col scrollbar-purple">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-purple-200">
        <Link
          href="/sentence-construction"
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-purple-900">
            Complete the Sentence
          </h1>
        </div>

        <button
          onClick={resetExercise}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-start px-4 md:px-8 py-6 space-y-8 max-w-7xl mx-auto w-full">
        <CompleteSentenceProgress
          currentQuestion={currentQuestion}
          totalQuestions={completeQuestions.length}
          answers={answers}
        />

        {/* Question Component with Animation */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <CompleteSentenceQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={completeQuestions.length}
            incompletePhrase={currentComplete.incompletePhrase}
            correctCompletions={currentComplete.correctCompletions}
            onSubmit={handleSelectAnswer}
            showResult={showResult}
            isCorrect={isCorrect}
            explanation={currentComplete.explanation}
          />
        </motion.div>

        {showResult ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
            >
              {isLastQuestion ? "Finish Exercise" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <div className="text-center text-xs text-purple-600">
            ✍️ Type your answer and click "Check Answer"
          </div>
        )}
      </div>

      <CompleteSentenceCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length /
            completeQuestions.length) *
            100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={completeQuestions.length}
        onClose={() => setShowCompletion(false)}
        onRetake={resetExercise}
      />
    </div>
  );
}
