"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import FillBlanksQuestion from "@/components/grammar/fill-the-blanks/FillBlanksQuestion";
import FillBlanksProgress from "@/components/grammar/fill-the-blanks/FillBlanksProgress";
import FillBlanksCompletionModal from "@/components/grammar/fill-the-blanks/FillBlanksCompletionModal";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import {
  useLearningProgress,
  QuizProgress,
} from "@/contexts/LearningProgressContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useSRSWithExercises } from "@/hooks/useSRS";
import { SRS_GRADES } from "@/utils/srs";
import {
  getLexiconData,
  GrammarExerciseItem,
  LexiconItem,
} from "@/lib/api/exercises";
import { updateExerciseProgress } from "@/lib/api/progress";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";
import { reportLexicalItemPerformance } from "@/utils/reportPerformance";
import {
  makeUserScopedStorageKey,
  usePersistedQuizSession,
} from "@/hooks/usePersistedQuizSession";
import { useMotivationalQuote } from "@/hooks/useMotivationalQuote";

interface FillBlanksAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  sentence: string;
  lemmaId: string;
}

interface ProcessedFillBlanksItem {
  item_id: string;
  lemma_id: string;
  sentence: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
}

type PersistedFillBlanksSessionV1 = {
  fillBlanksQuestions: ProcessedFillBlanksItem[];
  currentQuestion: number;
  selectedAnswer: string | null;
  showResult: boolean;
  answers: (boolean | null)[];
  detailedAnswers: FillBlanksAnswer[];
  currentDifficulty: "easy" | "medium" | "hard";
};

// Generate distractors from surface forms
function generateDistractorsFromSurfaceForms(
  lemmaId: string,
  correctAnswer: string,
  lexiconMap: Map<string, LexiconItem>,
): string[] | null {
  const lexiconEntry = lexiconMap.get(lemmaId);

  if (!lexiconEntry) {
    console.warn(`No lexicon entry found for lemma_id: ${lemmaId}`);
    return null;
  }

  const allWords = [lexiconEntry.lemma, ...(lexiconEntry.surface_forms || [])];
  const uniqueWords = Array.from(
    new Set(
      allWords
        .map((word) => word.toLowerCase())
        .filter((word) => word !== correctAnswer.toLowerCase()),
    ),
  ).map((lowerWord) => {
    return allWords.find((w) => w.toLowerCase() === lowerWord) || lowerWord;
  });

  if (uniqueWords.length < 2) {
    console.warn(
      `Insufficient surface forms for lemma_id ${lemmaId}. Need at least 2, got ${uniqueWords.length}. Skipping.`,
    );
    return null;
  }

  const shuffled = uniqueWords.sort(() => Math.random() - 0.5);
  const distractorCount = Math.min(3, uniqueWords.length);
  const distractors = shuffled.slice(0, distractorCount);

  return distractors;
}

// Convert grammar items to fill-in-the-blanks format
function convertToFillBlanksFormat(
  items: GrammarExerciseItem[],
  lexiconMap: Map<string, LexiconItem>,
): ProcessedFillBlanksItem[] {
  const processedItems: ProcessedFillBlanksItem[] = [];

  for (const item of items) {
    const correctAnswer = item.fillCorrectAnswer;
    const distractors = generateDistractorsFromSurfaceForms(
      item.lemma_id,
      correctAnswer,
      lexiconMap,
    );

    if (!distractors || distractors.length < 2) {
      continue;
    }

    const choices = [correctAnswer, ...distractors].sort(
      () => Math.random() - 0.5,
    );

    processedItems.push({
      item_id: item.item_id,
      lemma_id: item.lemma_id,
      sentence: item.fill_sentence,
      choices,
      correct_answer: correctAnswer,
      explanation: item.fill_explanation,
    });
  }

  return processedItems;
}

export default function GrammarFillBlanksPage() {
  const { updateProgress, getExerciseProgress } = useGrammarProgress();
  const { getPerformanceHistory } = useLearningProgress();
  const history = getPerformanceHistory("grammar", "fill-blanks");
  const fallbackDifficulty =
    history.length > 0 ? history[history.length - 1].difficulty : "easy";

  const { user } = useAuth();
  const { isLoading: authLoading } = useAuthGuard();

  const exerciseProgress = getExerciseProgress("fill-blanks");
  const difficultyToServe =
    "lastDifficulty" in exerciseProgress
      ? ((exerciseProgress as QuizProgress).lastDifficulty ??
        fallbackDifficulty)
      : fallbackDifficulty;

  const [currentDifficulty, setCurrentDifficulty] = useState<
    "easy" | "medium" | "hard"
  >(difficultyToServe);

  const {
    sessionExercises,
    grade: gradeSRS,
    isLoading: srsLoading,
  } = useSRSWithExercises({
    module: "grammar",
    exerciseType: "fill-blanks",
    targetDifficulty: difficultyToServe,
    sessionSize: 10,
    fetchLimit: 20,
  });

  const [fillBlanksQuestions, setFillBlanksQuestions] = useState<
    ProcessedFillBlanksItem[]
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<FillBlanksAnswer[]>(
    [],
  );
  const [showCompletion, setShowCompletion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [finalScore, setFinalScore] = useState(0);
  const [finalCorrectCount, setFinalCorrectCount] = useState(0);

  const [isFinishing, setIsFinishing] = useState(false);

  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  const loadingQuote = useMotivationalQuote(
    authLoading || srsLoading || isLoadingQuestions,
    3000,
  );

  const sessionStorageKey = authLoading
    ? null
    : makeUserScopedStorageKey(user, "far:quizSession:grammar:fill-blanks");

  const { didRestore, clear: clearSession } =
    usePersistedQuizSession<PersistedFillBlanksSessionV1>({
      key: sessionStorageKey,
      version: 1,
      restoreWhen: !authLoading && !srsLoading,
      persistWhen: !authLoading && !srsLoading && !isLoadingQuestions,
      isComplete: showCompletion,
      clearOnComplete: true,
      hasDataToPersist: fillBlanksQuestions.length > 0 && !error,
      snapshot: () => ({
        fillBlanksQuestions,
        currentQuestion,
        selectedAnswer,
        showResult,
        answers,
        detailedAnswers,
        currentDifficulty,
      }),
      restore: (payload) => {
        setFillBlanksQuestions(payload.fillBlanksQuestions);
        setCurrentQuestion(payload.currentQuestion);
        setSelectedAnswer(payload.selectedAnswer);
        setShowResult(payload.showResult);
        setAnswers(payload.answers);
        setDetailedAnswers(payload.detailedAnswers);
        setCurrentDifficulty(payload.currentDifficulty);

        setError(null);
        setShowCompletion(false);
        setIsLoadingQuestions(false);
      },
      validate: (p: any): p is PersistedFillBlanksSessionV1 => {
        if (!p || typeof p !== "object") return false;

        if (
          !Array.isArray(p.fillBlanksQuestions) ||
          p.fillBlanksQuestions.length === 0
        )
          return false;
        if (!Number.isInteger(p.currentQuestion) || p.currentQuestion < 0)
          return false;
        if (
          !(p.selectedAnswer === null || typeof p.selectedAnswer === "string")
        )
          return false;
        if (typeof p.showResult !== "boolean") return false;
        if (!Array.isArray(p.answers)) return false;
        if (!Array.isArray(p.detailedAnswers)) return false;
        if (!["easy", "medium", "hard"].includes(p.currentDifficulty))
          return false;

        if (p.answers.length !== p.fillBlanksQuestions.length) return false;
        if (p.currentQuestion >= p.fillBlanksQuestions.length) return false;

        const q0 = p.fillBlanksQuestions[0];
        if (
          !q0 ||
          typeof q0 !== "object" ||
          typeof q0.item_id !== "string" ||
          typeof q0.lemma_id !== "string" ||
          typeof q0.sentence !== "string" ||
          !Array.isArray(q0.choices) ||
          typeof q0.correct_answer !== "string" ||
          typeof q0.explanation !== "string"
        ) {
          return false;
        }

        return true;
      },
    });

  const hasSeededQuestionsRef = useRef(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      if (didRestore) return;
      if (srsLoading) return;
      if (isCompleting || showCompletion) return;

      // ✅ only seed once (avoid resetting to Q1 when difficulty/progress changes)
      if (hasSeededQuestionsRef.current) return;

      if (!sessionExercises || sessionExercises.length === 0) return;

      try {
        setIsLoadingQuestions(true);

        const lexiconData = await getLexiconData();
        const lexiconMap = new Map(
          lexiconData.map((item: LexiconItem) => [item.lemma_id, item]),
        );

        const processedItems = convertToFillBlanksFormat(
          sessionExercises as GrammarExerciseItem[],
          lexiconMap,
        );

        if (processedItems.length === 0) {
          setError("No exercises available");
          return;
        }

        // mark seeded BEFORE setting state to avoid any rapid double-run
        hasSeededQuestionsRef.current = true;

        setFillBlanksQuestions(processedItems);
        setAnswers(Array(processedItems.length).fill(null));
        setDetailedAnswers([]);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setError(null);
      } catch (err) {
        console.error("❌ Failed to load exercises:", err);
        setError("Failed to load exercises");
      } finally {
        setIsLoadingQuestions(false);
      }
    }

    loadQuestions();
  }, [didRestore, srsLoading, sessionExercises, isCompleting, showCompletion]);

  if (authLoading || srsLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 flex items-center justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-amber-200/30 rounded-full blur-3xl"></div>

        <div className="text-center px-6 max-w-3xl w-full relative z-10">
          {/* Quote with handwriting font */}
          <div className="mb-8">
            <p
              className="text-3xl md:text-5xl font-bold text-yellow-700 leading-relaxed"
              style={{
                fontFamily: "'Caveat', 'Kalam', cursive",
                textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {loadingQuote?.text ? `"${loadingQuote.text}"` : "Loading..."}
            </p>

            {loadingQuote?.author && (
              <p
                className="mt-4 text-xl md:text-2xl text-yellow-700/80"
                style={{ fontFamily: "'Caveat', 'Kalam', cursive" }}
              >
                — {loadingQuote.author}
              </p>
            )}
          </div>

          {/* Animated ellipses */}
          <div className="flex items-center justify-center gap-2">
            {/* <span className="text-sm font-semibold text-yellow-700 tracking-wide">
              Preparing your exercise
            </span> */}
            <span className="flex gap-1">
              <span className="animate-bounce animation-delay-10 text-yellow-600">
                .
              </span>
              <span className="animate-bounce animation-delay-200 text-yellow-600">
                .
              </span>
              <span className="animate-bounce animation-delay-400 text-yellow-600">
                .
              </span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoadingQuestions) {
    return (
      <div className="h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 flex items-center justify-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-amber-200/30 rounded-full blur-3xl"></div>

        <div className="text-center px-6 max-w-3xl w-full relative z-10">
          {/* Quote with handwriting font */}
          <div className="mb-8">
            <p
              className="text-3xl md:text-5xl font-bold text-yellow-900 leading-relaxed"
              style={{
                fontFamily: "'Caveat', 'Kalam', cursive",
                textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {loadingQuote?.text ? `"${loadingQuote.text}"` : "Loading..."}
            </p>

            {loadingQuote?.author && (
              <p
                className="mt-4 text-xl md:text-2xl text-yellow-700/80"
                style={{ fontFamily: "'Caveat', 'Kalam', cursive" }}
              >
                — {loadingQuote.author}
              </p>
            )}
          </div>

          {/* Animated ellipses */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-semibold text-yellow-700 tracking-wide">
              Loading exercise
            </span>
            <span className="flex gap-1">
              <span className="animate-bounce animation-delay-0 text-yellow-600">
                .
              </span>
              <span className="animate-bounce animation-delay-150 text-yellow-600">
                .
              </span>
              <span className="animate-bounce animation-delay-300 text-yellow-600">
                .
              </span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Error / empty state
  if (error || fillBlanksQuestions.length === 0) {
    return (
      <div className="h-screen bg-green-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-green-200">
          <Link
            href="/grammar"
            className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-green-900">
              Fill the Blank
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <p className="text-red-600 font-semibold mb-4">
              {error || "No exercises available"}
            </p>
            <button
              onClick={() => {
                clearSession();
                window.location.reload();
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentFillBlanks = fillBlanksQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === fillBlanksQuestions.length - 1;

  const handleSelectAnswer = async (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentFillBlanks.correct_answer;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        selectedAnswer: answer,
        correctAnswer: currentFillBlanks.correct_answer,
        sentence: currentFillBlanks.sentence,
        lemmaId: currentFillBlanks.lemma_id,
      },
    ]);

    try {
      await reportLexicalItemPerformance({
        module: "grammar",
        exerciseType: "fill-blanks",
        lemmaId: currentFillBlanks.lemma_id,
        correctAnswer: currentFillBlanks.correct_answer,
        userAnswer: answer,
        difficultyShown: currentDifficulty,
        score: isCorrect ? 100 : 0,
      });
    } catch (error) {
      console.error("Failed to report performance:", error);
    }

    const srsGrade = isCorrect ? SRS_GRADES.PERFECT : SRS_GRADES.HARD;
    await gradeSRS(currentFillBlanks.lemma_id, srsGrade);
  };

  const handleNext = () => {
    if (isFinishing) return;

    if (isLastQuestion) {
      setIsFinishing(true);
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
    setIsCompleting(true);

    try {
      const correctCount = answers.filter((a) => a === true).length;
      const score = Math.round(
        (correctCount / fillBlanksQuestions.length) * 100,
      );

      setFinalScore(score);
      setFinalCorrectCount(correctCount);

      let missedLowFreq = 0;
      let similarChoiceErrors = 0;
      detailedAnswers.forEach((answer) => {
        if (!answer.isCorrect) similarChoiceErrors++;
      });

      setShowCompletion(true);

      const history = getPerformanceHistory("grammar", "fill-blanks");
      const thisSession = {
        difficulty: currentDifficulty,
        score,
        missedLowFreq,
        similarChoiceErrors,
        timestamp: new Date().toISOString(),
      };

      const evaluation = evaluateUserPerformance([...history, thisSession]);
      await updateExerciseProgress("grammar", "fill-blanks", {
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

      updateProgress("fill-blanks", {
        status: "in-progress",
        score,
        completedAt: new Date().toISOString(),
        lastDifficulty: evaluation.nextDifficulty,
        errorTags: evaluation.tags,
      });
    } finally {
      setIsCompleting(false);
      setIsFinishing(false);
    }
  };

  const resetExercise = () => {
    clearSession();
    hasSeededQuestionsRef.current = false;
    window.location.reload();
  };

  return (
    <div className="h-screen bg-green-50 overflow-auto flex flex-col scrollbar-green">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-green-200">
        <Link
          href="/grammar"
          className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-green-900">
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
      {!showCompletion && currentFillBlanks && (
        <div className="flex-1 flex flex-col justify-start px-4 md:px-8 py-6 space-y-8 max-w-7xl mx-auto w-full">
          <FillBlanksProgress
            currentQuestion={currentQuestion}
            totalQuestions={fillBlanksQuestions.length}
            answers={answers}
          />

          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <FillBlanksQuestion
              questionNumber={currentQuestion + 1}
              totalQuestions={fillBlanksQuestions.length}
              sentence={currentFillBlanks.sentence}
              choices={currentFillBlanks.choices}
              correctAnswer={currentFillBlanks.correct_answer}
              selectedAnswer={selectedAnswer}
              onSelectAnswer={handleSelectAnswer}
              showResult={showResult}
              explanation={currentFillBlanks.explanation}
            />
          </motion.div>

          {showResult ? (
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
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors disabled:cursor-not-allowed"
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
          ) : (
            <div className="text-center text-xs text-green-600">
              {/* 📝 Fill in the blank with the correct word */}
            </div>
          )}
        </div>
      )}

      <FillBlanksCompletionModal
        isOpen={showCompletion}
        score={finalScore}
        correctCount={finalCorrectCount}
        totalQuestions={fillBlanksQuestions.length}
        onClose={() => setShowCompletion(false)}
        onRetake={resetExercise}
      />
    </div>
  );
}
