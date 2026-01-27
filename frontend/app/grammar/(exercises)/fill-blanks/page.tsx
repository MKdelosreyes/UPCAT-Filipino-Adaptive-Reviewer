"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
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
  const [currentDifficulty] = useState(difficultyToServe);

  const {
    dueExercises,
    newExercises,
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

  useEffect(() => {
    async function loadQuestions() {
      if (srsLoading || sessionExercises.length === 0) return;

      try {
        // Fetch lexicon data for distractors
        const lexiconData = await getLexiconData();
        const lexiconMap = new Map(
          lexiconData.map((item: LexiconItem) => [item.lemma_id, item]),
        );

        // Convert due exercises to fill-blanks format
        const processedItems = convertToFillBlanksFormat(
          sessionExercises as GrammarExerciseItem[],
          lexiconMap,
        );

        if (processedItems.length === 0) {
          setError("No exercises available");
          return;
        }

        setFillBlanksQuestions(processedItems);
        setAnswers(Array(processedItems.length).fill(null));
        setError(null);
      } catch (err) {
        console.error("❌ Failed to load exercises:", err);
        setError("Failed to load exercises");
      }
    }

    loadQuestions();
  }, [srsLoading, sessionExercises, difficultyToServe]);

  if (authLoading) {
    return (
      <div className="h-screen bg-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (srsLoading || fillBlanksQuestions.length === 0) {
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
          {srsLoading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          ) : (
            <div className="text-center">
              <p className="text-lg text-green-900 mb-2">
                🎉 No items available right now!
              </p>
              <p className="text-sm text-green-600">
                Come back later for more practice.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentFillBlanks = fillBlanksQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === fillBlanksQuestions.length - 1;

  // Handle answer selection with performance tracking
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
    if (isLastQuestion) {
      void completeExercise();
      return;
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const completeExercise = async () => {
    const correctCount = answers.filter((a) => a === true).length;
    const score = Math.round((correctCount / fillBlanksQuestions.length) * 100);

    setFinalScore(score);
    setFinalCorrectCount(correctCount);

    let missedLowFreq = 0;
    let similarChoiceErrors = 0;

    detailedAnswers.forEach((answer) => {
      if (!answer.isCorrect) {
        similarChoiceErrors++;
      }
    });

    const history = getPerformanceHistory("grammar", "fill-blanks");
    const thisSession = {
      difficulty: currentDifficulty,
      score: score,
      missedLowFreq,
      similarChoiceErrors,
      timestamp: new Date().toISOString(),
    };

    const evaluation = evaluateUserPerformance([...history, thisSession]);

    await updateExerciseProgress("grammar", "fill-blanks", {
      status: "in-progress",
      score: score,
      completedAt: new Date().toISOString(),
      lastDifficulty: evaluation.nextDifficulty,
      performanceMetrics: {
        difficulty: currentDifficulty,
        score: score,
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

    setShowCompletion(true);
  };

  const resetExercise = () => {
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
          {/* <p className="text-xs text-green-600 mt-1">
            Difficulty:{" "}
            <span className="font-semibold capitalize">
              {currentDifficulty}
            </span>{" "}
            | {fillBlanksQuestions.length} exercises due
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
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
              >
                {isLastQuestion ? "Finish Exercise" : "Next Question"}
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          ) : (
            <div className="text-center text-xs text-green-600">
              📝 Fill in the blank with the correct word
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
