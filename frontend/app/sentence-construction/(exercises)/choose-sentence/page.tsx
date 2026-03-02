"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import ChooseSentenceQuestion from "@/components/sentence-construction/choose-sentence-exercise/ChooseSentenceQuestion";
import ChooseSentenceProgress from "@/components/sentence-construction/choose-sentence-exercise/ChooseSentenceProgress";
import ChooseSentenceCompletionModal from "@/components/sentence-construction/choose-sentence-exercise/ChooseSentenceCompletionModal";
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

interface ChooseSentenceAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  context: string;
  lemmaId: string;
}

type PersistedChooseSentenceSessionV1 = {
  exercises: SentenceConstructionExerciseItem[];
  currentQuestion: number;
  selectedAnswer: string | null;
  showResult: boolean;
  answers: (boolean | null)[];
  detailedAnswers: ChooseSentenceAnswer[];
  showCompletion: boolean;
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

export default function ChooseSentencePage() {
  const { updateProgress, getExerciseProgress } =
    useSentenceConstructionProgress();
  const { getPerformanceHistory } = useLearningProgress();
  const history = getPerformanceHistory(
    "sentence-construction",
    "choose-sentence",
  );
  const fallbackDifficulty =
    history.length > 0 ? history[history.length - 1].difficulty : "easy";

  const { user } = useAuth();
  const { isLoading: authLoading } = useAuthGuard();

  const exerciseProgress = getExerciseProgress("choose-sentence");
  const difficultyToServe =
    "lastDifficulty" in exerciseProgress
      ? ((exerciseProgress as QuizProgress).lastDifficulty ??
        fallbackDifficulty)
      : fallbackDifficulty;

  const [currentDifficulty] = useState(difficultyToServe);

  const {
    sessionExercises,
    grade: gradeSRS,
    isLoading: srsLoading,
  } = useSRSWithExercises({
    module: "sentence-construction",
    exerciseType: "choose-sentence",
    targetDifficulty: difficultyToServe,
    sessionSize: 10,
    fetchLimit: 20,
  });

  const [exercises, setExercises] = useState<
    SentenceConstructionExerciseItem[]
  >([]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<
    ChooseSentenceAnswer[]
  >([]);
  const [showCompletion, setShowCompletion] = useState(false);

  const [isFinishing, setIsFinishing] = useState(false);

  const sessionStorageKey = authLoading
    ? null
    : makeUserScopedStorageKey(
        user,
        "far:quizSession:sentence-construction:choose-sentence",
      );

  const { didRestore, clear: clearSession } =
    usePersistedQuizSession<PersistedChooseSentenceSessionV1>({
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
        selectedAnswer,
        showResult,
        answers,
        detailedAnswers,
        showCompletion,
        currentDifficulty,
      }),
      restore: (payload) => {
        setExercises(payload.exercises);
        setCurrentQuestion(payload.currentQuestion);
        setSelectedAnswer(payload.selectedAnswer);
        setShowResult(payload.showResult);
        setAnswers(payload.answers);
        setDetailedAnswers(payload.detailedAnswers);
        setShowCompletion(payload.showCompletion);
      },
      validate: (p: any): p is PersistedChooseSentenceSessionV1 => {
        if (!p || typeof p !== "object") return false;
        if (!Array.isArray(p.exercises) || p.exercises.length === 0)
          return false;
        if (!Number.isInteger(p.currentQuestion) || p.currentQuestion < 0)
          return false;
        if (
          !(p.selectedAnswer === null || typeof p.selectedAnswer === "string")
        )
          return false;
        if (typeof p.showResult !== "boolean") return false;
        if (
          !Array.isArray(p.answers) ||
          p.answers.length !== p.exercises.length
        )
          return false;
        if (!Array.isArray(p.detailedAnswers)) return false;
        if (typeof p.showCompletion !== "boolean") return false;
        if (!["easy", "medium", "hard"].includes(p.currentDifficulty))
          return false;
        if (p.currentQuestion >= p.exercises.length) return false;

        const e0 = p.exercises[0];
        if (
          !e0 ||
          typeof e0 !== "object" ||
          typeof e0.lemma_id !== "string" ||
          typeof e0.chooseCorrectSentence !== "string" ||
          typeof e0.chooseContext !== "string" ||
          !Array.isArray((e0 as any).distractors)
        ) {
          return false;
        }
        return true;
      },
    });

  // Seed once from SRS unless we restored
  const hasSeededSessionRef = useRef(false);
  useEffect(() => {
    if (didRestore) return;
    if (srsLoading) return;
    if (hasSeededSessionRef.current) return;

    const list = (sessionExercises ?? []) as SentenceConstructionExerciseItem[];
    if (list.length === 0) return;

    hasSeededSessionRef.current = true;

    setExercises(list);
    setAnswers(Array(list.length).fill(null));
    setDetailedAnswers([]);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowCompletion(false);
  }, [didRestore, srsLoading, sessionExercises]);

  // Compute current exercise + choices early (unconditionally) so hooks order doesn't change
  const currentExercise = exercises[currentQuestion];
  const isLastQuestion =
    exercises.length > 0 && currentQuestion === exercises.length - 1;

  const choices = useMemo(() => {
    if (!currentExercise) return [];
    const allChoices = [
      currentExercise.chooseCorrectSentence,
      ...(currentExercise.distractors || []),
    ];
    return shuffleArray(allChoices);
  }, [
    currentExercise?.lemma_id,
    currentExercise?.chooseCorrectSentence,
    currentExercise?.distractors,
  ]);

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
              Choose the Best Sentence
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-blue-900 mb-2">
              🎉 No items available right now!
            </p>
            <p className="text-sm text-blue-600">
              Come back later for more practice.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSelectAnswer = async (answer: string) => {
    if (!currentExercise) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    const correctAnswer = currentExercise.chooseCorrectSentence;
    const isCorrect = answer === correctAnswer;

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        selectedAnswer: answer,
        correctAnswer,
        context: currentExercise.chooseContext,
        lemmaId: currentExercise.lemma_id,
      },
    ]);

    await reportLexicalItemPerformance({
      module: "sentence-construction",
      exerciseType: "choose-sentence",
      lemmaId: currentExercise.lemma_id,
      correctAnswer,
      userAnswer: answer,
      difficultyShown: currentDifficulty,
      score: isCorrect ? 100 : 0,
    });

    const srsGrade = isCorrect ? SRS_GRADES.PERFECT : SRS_GRADES.HARD;
    await gradeSRS(currentExercise.lemma_id, srsGrade);
  };

  const handleNext = () => {
    if (isFinishing) return;

    if (isLastQuestion) {
      void completeExercise();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
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

      detailedAnswers.forEach((a) => {
        if (!a.isCorrect) similarChoiceErrors++;
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

      await updateExerciseProgress("sentence-construction", "choose-sentence", {
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

      await updateProgress("choose-sentence", {
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
    window.location.reload();
  };

  return (
    <div className="h-screen bg-blue-50 overflow-auto flex flex-col scrollbar-blue">
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
            Choose the Best Sentence
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

      <div className="flex-1 flex flex-col justify-start px-4 md:px-8 py-6 space-y-8 max-w-7xl mx-auto w-full">
        <ChooseSentenceProgress
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
          <ChooseSentenceQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={exercises.length}
            context={currentExercise.chooseContext}
            choices={choices}
            correctAnswer={currentExercise.chooseCorrectSentence}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={handleSelectAnswer}
            showResult={showResult}
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

      <ChooseSentenceCompletionModal
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
