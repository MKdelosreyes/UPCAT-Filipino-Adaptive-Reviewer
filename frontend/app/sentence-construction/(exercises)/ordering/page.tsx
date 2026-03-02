"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight, Loader2 } from "lucide-react";
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
import {
  makeUserScopedStorageKey,
  usePersistedQuizSession,
} from "@/hooks/usePersistedQuizSession";
import { set } from "zod";

interface OrderingAnswer {
  isCorrect: boolean;
  userSentence: string;
  correctSentence: string;
  lemmaId: string;
}

type PersistedSentenceOrderingSessionV1 = {
  exercises: SentenceConstructionExerciseItem[];
  currentQuestion: number;
  showResult: boolean;
  answers: (boolean | null)[];
  detailedAnswers: OrderingAnswer[];
  showCompletion: boolean;
  isCorrect: boolean | null;
  currentDifficulty: "easy" | "medium" | "hard";
};

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

  const [exercises, setExercises] = useState<
    SentenceConstructionExerciseItem[]
  >([]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<OrderingAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [isFinishing, setIsFinishing] = useState(false);

  const sessionStorageKey = authLoading
    ? null
    : makeUserScopedStorageKey(
        user,
        "far:quizSession:sentence-construction:sentence-ordering",
      );

  const { didRestore, clear: clearSession } =
    usePersistedQuizSession<PersistedSentenceOrderingSessionV1>({
      key: sessionStorageKey,
      version: 1,
      restoreWhen: !authLoading && !srsLoading,
      persistWhen: !authLoading && !srsLoading,
      isComplete: showCompletion,
      clearOnComplete: true,
      hasDataToPersist: exercises.length > 0,
      snapshot: () => ({
        exercises,
        currentQuestion,
        showResult,
        answers,
        detailedAnswers,
        showCompletion,
        isCorrect,
        currentDifficulty,
      }),
      restore: (payload) => {
        setExercises(payload.exercises);
        setCurrentQuestion(payload.currentQuestion);
        setShowResult(payload.showResult);
        setAnswers(payload.answers);
        setDetailedAnswers(payload.detailedAnswers);
        setShowCompletion(payload.showCompletion);
        setIsCorrect(payload.isCorrect);
      },
      validate: (p: any): p is PersistedSentenceOrderingSessionV1 => {
        if (!p || typeof p !== "object") return false;
        if (!Array.isArray(p.exercises) || p.exercises.length === 0)
          return false;
        if (!Number.isInteger(p.currentQuestion) || p.currentQuestion < 0)
          return false;
        if (typeof p.showResult !== "boolean") return false;
        if (!Array.isArray(p.answers)) return false;
        if (!Array.isArray(p.detailedAnswers)) return false;
        if (typeof p.showCompletion !== "boolean") return false;
        if (!(p.isCorrect === null || typeof p.isCorrect === "boolean"))
          return false;
        if (!["easy", "medium", "hard"].includes(p.currentDifficulty))
          return false;

        if (p.currentQuestion >= p.exercises.length) return false;
        if (p.answers.length !== p.exercises.length) return false;

        // light shape check
        const e0 = p.exercises[0];
        if (
          !e0 ||
          typeof e0 !== "object" ||
          typeof e0.lemma_id !== "string" ||
          typeof e0.orderingCorrectSentence !== "string"
        ) {
          return false;
        }

        return true;
      },
    });

  const hasSeededSessionRef = useRef(false);

  // Initialize exercises from SRS only if we didn't restore
  useEffect(() => {
    if (didRestore) return;
    if (srsLoading) return;

    if (hasSeededSessionRef.current) return;

    const list = (sessionExercises ?? []) as SentenceConstructionExerciseItem[];
    if (list.length === 0) return;

    hasSeededSessionRef.current = true;

    setExercises(list);
    setAnswers(Array(list.length).fill(null));
    setCurrentQuestion(0);
    setShowResult(false);
    setDetailedAnswers([]);
    setShowCompletion(false);
    setIsCorrect(null);
  }, [didRestore, srsLoading, sessionExercises]);

  const currentExercise = exercises[currentQuestion];
  const isLastQuestion = currentQuestion === Math.max(0, exercises.length - 1);

  const shuffledWords = useMemo(() => {
    const sentence = currentExercise?.orderingCorrectSentence;
    if (!sentence) return [];
    return shuffleArray(sentence.split(" "));
  }, [currentExercise?.lemma_id, currentExercise?.orderingCorrectSentence]);

  if (authLoading || srsLoading) {
    return (
      <div className="h-screen bg-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (exercises.length === 0) {
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

  // Report performance + Grade SRS
  const handleSubmit = async (userSentence: string, correct: boolean) => {
    setIsCorrect(correct);
    setShowResult(true);

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = correct;
    setAnswers(newAnswers);

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
    if (isFinishing) return;

    if (isLastQuestion) {
      void completeExercise();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setShowResult(false);
      setIsCorrect(null);
    }
  };

  const completeExercise = async () => {
    if (isFinishing) return;
    setIsFinishing(true);

    try {
      const correctCount = answers.filter((a) => a === true).length;
      const score = Math.round((correctCount / exercises.length) * 100);

      let missedLowFreq = 0;
      let similarChoiceErrors = 0;

      detailedAnswers.forEach((answer) => {
        if (!answer.isCorrect) similarChoiceErrors++;
      });

      setShowCompletion(true);

      const thisSession = {
        difficulty: currentDifficulty,
        score,
        missedLowFreq,
        similarChoiceErrors,
        timestamp: new Date().toISOString(),
      };

      const evaluation = evaluateUserPerformance([...history, thisSession]);

      await updateExerciseProgress(
        "sentence-construction",
        "sentence-ordering",
        {
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
        },
      );

      await updateProgress("sentence-ordering", {
        status: "in-progress",
        score,
        completedAt: new Date().toISOString(),
        lastDifficulty: evaluation.nextDifficulty,
        errorTags: evaluation.tags,
      });
    } finally {
      setIsFinishing(false);
    }
  };

  const resetExercise = () => {
    clearSession();

    hasSeededSessionRef.current = false;

    setExercises([]);

    setCurrentQuestion(0);
    setShowResult(false);
    setAnswers(Array(exercises.length).fill(null));
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
          totalQuestions={exercises.length}
          answers={answers}
        />

        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <OrderingQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={exercises.length}
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
              whileHover={{ scale: isFinishing ? 1 : 1.05 }}
              whileTap={{ scale: isFinishing ? 1 : 0.95 }}
              onClick={handleNext}
              disabled={isFinishing}
              aria-busy={isFinishing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors disabled:cursor-not-allowed"
            >
              {isFinishing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Finishing...
                </>
              ) : (
                <>
                  {isLastQuestion ? "Finish Exercise" : "Next Question"}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>

      <OrderingCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length / exercises.length) * 100,
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={exercises.length}
        onClose={() => setShowCompletion(false)}
        onRetake={resetExercise}
      />
    </div>
  );
}
