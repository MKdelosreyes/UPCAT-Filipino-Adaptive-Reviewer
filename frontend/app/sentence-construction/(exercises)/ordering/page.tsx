"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import OrderingQuestion from "@/components/sentence-construction/sentence-ordering-exercise/OrderingQuestion";
import OrderingProgress from "@/components/sentence-construction/sentence-ordering-exercise/OrderingProgress";
import OrderingCompletionModal from "@/components/sentence-construction/sentence-ordering-exercise/OrderingCompletionModal";
import { useSentenceConstructionProgress } from "@/hooks/useSentenceConstructionProgress";
import {
  useLearningProgress,
  QuizProgress,
} from "@/contexts/LearningProgressContext";
import { useSRSWithExercises } from "@/hooks/useSRS";
import { reportLexicalItemPerformance } from "@/utils/reportPerformance";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";
import type { SentenceConstructionExerciseItem } from "@/lib/api/exercises";
import { updateExerciseProgress } from "@/lib/api/progress";
import { SRS_GRADES } from "@/utils/srs";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";

interface OrderingAnswer {
  isCorrect: boolean;
  userSentence: string;
  correctSentence: string;
  lemmaId: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function SentenceOrderingPage() {
  const { updateProgress, getExerciseProgress } =
    useSentenceConstructionProgress();
  const { getPerformanceHistory } = useLearningProgress();
  const history = getPerformanceHistory(
    "sentence-construction",
    "sentence-ordering",
  );
  const fallbackDifficulty =
    history.length > 0 ? history[history.length - 1].difficulty : "easy";

  const { user } = useAuth();
  const { isLoading: authLoading } = useAuthGuard();

  const exerciseProgress = getExerciseProgress("sentence-ordering");
  const difficultyToServe =
    "lastDifficulty" in exerciseProgress
      ? ((exerciseProgress as QuizProgress).lastDifficulty ??
        fallbackDifficulty)
      : fallbackDifficulty;
  const [currentDifficulty] = useState(difficultyToServe);

  const {
    dueExercises,
    newExercises,
    sessionExercises,
    grade: gradeSRS,
    isLoading: srsLoading,
  } = useSRSWithExercises({
    module: "sentence-construction",
    exerciseType: "sentence-ordering",
    targetDifficulty: difficultyToServe,
    sessionSize: 10,
    fetchLimit: 20,
  });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<OrderingAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    if (sessionExercises.length > 0) {
      setAnswers(Array(sessionExercises.length).fill(null));
    }
  }, [sessionExercises.length]);

  if (authLoading || srsLoading) {
    return (
      <div className="h-screen bg-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (sessionExercises.length === 0) {
    return (
      <div className="h-screen bg-blue-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200">
          <Link
            href="/sentence-construction"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-blue-900">
              Sentence Ordering
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          {srsLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          ) : (
            <div className="text-center">
              <p className="text-lg text-blue-900 mb-2">
                🎉 No items available right now!
              </p>
              <p className="text-sm text-blue-600">
                Come back later for more practice.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentExercise = sessionExercises[
    currentQuestion
  ] as SentenceConstructionExerciseItem;
  const isLastQuestion = currentQuestion === sessionExercises.length - 1;

  const shuffledWords = useMemo(() => {
    if (!currentExercise?.orderingCorrectSentence) return [];
    return shuffleArray(currentExercise.orderingCorrectSentence.split(" "));
  }, [currentExercise.lemma_id, currentExercise?.orderingCorrectSentence]);

  // Report performance + Grade SRS
  const handleSubmit = async (userSentence: string, correct: boolean) => {
    setIsCorrect(correct);
    setShowResult(true);

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = correct;
    setAnswers(newAnswers);

    // Store detailed answer for analysis
    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect: correct,
        userSentence,
        correctSentence: currentExercise.orderingCorrectSentence,
        lemmaId: currentExercise.lemma_id,
      },
    ]);

    try {
      await reportLexicalItemPerformance({
        module: "sentence-construction",
        exerciseType: "sentence-ordering",
        lemmaId: currentExercise.lemma_id,
        correctAnswer: currentExercise.orderingCorrectSentence,
        userAnswer: userSentence,
        difficultyShown: currentDifficulty,
        score: correct ? 100 : 0,
      });
    } catch (e) {
      console.error("Failed to record lexical performance", e);
    }

    const srsGrade = correct ? SRS_GRADES.PERFECT : SRS_GRADES.HARD;
    await gradeSRS(currentExercise.lemma_id, srsGrade);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      void completeExercise();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setShowResult(false);
      setIsCorrect(null);
    }
  };

  const completeExercise = async () => {
    const correctCount = answers.filter((a) => a === true).length;
    const score = Math.round((correctCount / sessionExercises.length) * 100);

    // Calculate performance metrics
    let missedLowFreq = 0;
    let similarChoiceErrors = 0;

    detailedAnswers.forEach((answer) => {
      if (!answer.isCorrect) {
        similarChoiceErrors++;
      }
    });

    const thisSession = {
      difficulty: currentDifficulty,
      score,
      missedLowFreq,
      similarChoiceErrors,
      timestamp: new Date().toISOString(),
    };

    const evaluation = evaluateUserPerformance([...history, thisSession]);

    await updateExerciseProgress("sentence-construction", "sentence-ordering", {
      status: "in-progress",
      score,
      completedAt: new Date().toISOString(),
      lastDifficulty: evaluation.nextDifficulty,
      performanceMetrics: {
        difficulty: currentDifficulty,
        score,
        missedLowFreq,
        similarChoiceErrors,
        errorTags: evaluation.tags,
      },
    });

    console.log(
      "🎯 Next Sentence Ordering Difficulty:",
      evaluation.nextDifficulty,
      "| Error Tags:",
      evaluation.tags,
    );

    // Update progress with evaluation results
    await updateProgress("sentence-ordering", {
      status: "in-progress",
      score,
      completedAt: new Date().toISOString(),
      lastDifficulty: evaluation.nextDifficulty,
      errorTags: evaluation.tags,
    });

    setShowCompletion(true);
  };

  const resetExercise = () => {
    // Reset all local state to restart current exercises
    setCurrentQuestion(0);
    setShowResult(false);
    setAnswers(Array(sessionExercises.length).fill(null));
    setDetailedAnswers([]);
    setShowCompletion(false);
    setIsCorrect(null);
  };

  return (
    <div className="h-screen bg-blue-50 overflow-auto flex flex-col scrollbar-blue">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200">
        <Link
          href="/sentence-construction"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-blue-900">
            Sentence Ordering
          </h1>
          {/* <p className="text-xs text-blue-600 mt-1">
            {dueExercises.length} exercises due for review
          </p> */}
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
      <div className="flex-1 flex flex-col justify-start px-4 md:px-8 py-6 space-y-5 max-w-7xl mx-auto w-full">
        <OrderingProgress
          currentQuestion={currentQuestion}
          totalQuestions={sessionExercises.length}
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
          <OrderingQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={sessionExercises.length}
            words={shuffledWords}
            correctSentence={currentExercise.orderingCorrectSentence}
            onSubmit={handleSubmit}
            showResult={showResult}
            isCorrect={isCorrect}
            explanation={currentExercise.explanation}
          />
        </motion.div>

        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
            >
              {isLastQuestion ? "Finish Exercise" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </div>

      <OrderingCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length / sessionExercises.length) *
            100,
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={sessionExercises.length}
        onClose={() => setShowCompletion(false)}
        onRetake={resetExercise}
      />
    </div>
  );
}
