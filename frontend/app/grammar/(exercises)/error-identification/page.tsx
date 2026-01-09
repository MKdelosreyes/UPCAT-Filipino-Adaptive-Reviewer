"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import ErrorQuestion from "@/components/grammar/error-identification/ErrorQuestion";
import ErrorProgress from "@/components/grammar/error-identification/ErrorProgress";
import ErrorCompletionModal from "@/components/grammar/error-identification/ErrorCompletionModal";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  getGrammarExercisesAdaptive,
  GrammarExerciseItem,
} from "@/lib/api/exercises";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";
import { reportLexicalItemPerformance } from "@/utils/reportPerformance";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import type { QuizProgress } from "@/contexts/LearningProgressContext";

interface ErrorAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  sentence: string;
}

interface ProcessedErrorItem {
  item_id: string;
  lemma_id: string;
  sentence: string;
  question: string;
  choices: string[];
  correct_answer: string;
  explanation: string;
}

// Helper function to extract phrases from sentence for distractor generation
function extractPhrasesFromSentence(
  sentence: string,
  correctAnswer: string
): string[] {
  const cleanSentence = sentence.replace(/<[^>]*>/g, "");
  const words = cleanSentence.split(/\s+/).filter((w) => w.length > 0);
  const phrases: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word1 = words[i].replace(/[.,;:!?'"()]/g, "");
    if (word1.length > 2) {
      phrases.push(word1);
    }

    if (i < words.length - 1) {
      const word2 = words[i + 1].replace(/[.,;:!?'"()]/g, "");
      phrases.push(`${word1} ${word2}`);
    }

    if (i < words.length - 2) {
      const word2 = words[i + 1].replace(/[.,;:!?'"()]/g, "");
      const word3 = words[i + 2].replace(/[.,;:!?'"()]/g, "");
      phrases.push(`${word1} ${word2} ${word3}`);
    }
  }

  const filtered = phrases.filter((phrase) => {
    const lowerPhrase = phrase.toLowerCase();
    const lowerCorrect = correctAnswer.toLowerCase();

    return (
      lowerPhrase !== lowerCorrect &&
      !lowerPhrase.includes(lowerCorrect) &&
      !lowerCorrect.includes(lowerPhrase)
    );
  });

  return Array.from(new Set(filtered));
}

// Convert grammar items to error identification format
function convertToErrorFormat(
  items: GrammarExerciseItem[]
): ProcessedErrorItem[] {
  return items.map((item) => {
    const correctAnswer = item.errorCorrectAnswer;
    const isNoError = correctAnswer.toLowerCase() === "no error";

    const allPhrases = extractPhrasesFromSentence(
      item.error_sentence,
      correctAnswer
    );

    let choices: string[];

    if (isNoError) {
      const shuffledPhrases = allPhrases.sort(() => Math.random() - 0.5);
      let distractors = shuffledPhrases.slice(0, 3);

      const fallbackOptions = [
        "Hindi Malinaw",
        "Kulang ang Impormasyon",
        "Labis ang Salita",
      ];
      let fallbackIndex = 0;

      while (distractors.length < 3 && fallbackIndex < fallbackOptions.length) {
        const fallback = fallbackOptions[fallbackIndex];
        if (!distractors.includes(fallback)) {
          distractors.push(fallback);
        }
        fallbackIndex++;
      }

      distractors = distractors.sort(() => Math.random() - 0.5);
      choices = [...distractors, "Walang Mali"];
    } else {
      const shuffledPhrases = allPhrases.sort(() => Math.random() - 0.5);
      let distractors = shuffledPhrases.slice(0, 2);

      const fallbackOptions = ["Hindi Malinaw", "Kulang ang Impormasyon"];
      let fallbackIndex = 0;

      while (distractors.length < 2 && fallbackIndex < fallbackOptions.length) {
        const fallback = fallbackOptions[fallbackIndex];
        if (!distractors.includes(fallback)) {
          distractors.push(fallback);
        }
        fallbackIndex++;
      }

      const firstThreeChoices = [correctAnswer, ...distractors].sort(
        () => Math.random() - 0.5
      );
      choices = [...firstThreeChoices, "Walang Mali"];
    }

    return {
      item_id: item.item_id,
      lemma_id: item.lemma_id,
      sentence: item.error_sentence,
      question: "Alin sa mga sumusunod ang may mali sa pangungusap?",
      choices,
      correct_answer: isNoError ? "Walang Mali" : correctAnswer,
      explanation: item.error_explanation,
    };
  });
}

export default function ErrorIdentificationPage() {
  const { updateProgress, getExerciseProgress } = useGrammarProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();
  const { user } = useAuth();

  const [errorQuestions, setErrorQuestions] = useState<ProcessedErrorItem[]>(
    []
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<ErrorAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<
    "easy" | "medium" | "hard"
  >("easy");
  const { isLoading: authLoading } = useAuthGuard();

  // ✅ Load questions with adaptive difficulty
  useEffect(() => {
    async function loadQuestions() {
      try {
        setIsLoading(true);

        // ✅ 1. Get performance history and progress
        const performanceHistory = getPerformanceHistory(
          "grammar",
          "error-identification"
        );
        const exerciseProgress = getExerciseProgress("error-identification");

        console.log("📊 Error ID Performance History:", performanceHistory);
        console.log("📈 Error ID Exercise Progress:", exerciseProgress);

        // ✅ 2. Determine target difficulty
        let targetDifficulty: "easy" | "medium" | "hard" = "easy";

        if (performanceHistory.length > 0) {
          const evaluation = evaluateUserPerformance(performanceHistory);
          targetDifficulty = evaluation.nextDifficulty;
          console.log(
            "🎯 Evaluated Target Difficulty:",
            targetDifficulty,
            "| Tags:",
            evaluation.tags
          );
        } else {
          // Type guard to check if it's QuizProgress
          if ("lastDifficulty" in exerciseProgress) {
            targetDifficulty =
              (exerciseProgress as QuizProgress).lastDifficulty || "easy";
          } else {
            targetDifficulty = "easy";
          }
          console.log("🆕 First Session - Using difficulty:", targetDifficulty);
        }

        setCurrentDifficulty(targetDifficulty);

        // ✅ 3. Fetch adaptive grammar exercises
        console.log(
          "🔄 Fetching adaptive error identification exercises with difficulty:",
          targetDifficulty
        );

        console.log("🔍 User ID:", user?.id);
        console.log("🔍 User ID type:", typeof user?.id);
        console.log("🔍 Target difficulty:", targetDifficulty);

        const exercises = await getGrammarExercisesAdaptive({
          userId: user?.id,
          targetDifficulty,
          exerciseType: "error_identification",
          limit: 15,
        });

        console.log("📚 Adaptive Error ID Exercises:", exercises.length);

        if (exercises.length === 0) {
          throw new Error("No grammar exercises available for this difficulty");
        }

        // ✅ 4. Convert to error format
        const processedItems = convertToErrorFormat(exercises);
        const shuffled = [...processedItems].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(10, shuffled.length));

        setErrorQuestions(selected);
        setAnswers(Array(selected.length).fill(null));
        setError(null);
      } catch (err) {
        console.error("❌ Failed to load exercises:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load exercises. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestions();
  }, [user?.id]);

  if (authLoading) {
    return (
      <div className="h-screen bg-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-red-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-red-200">
          <Link
            href="/grammar"
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-red-900">
              Error Identification
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Difficulty:{" "}
              <span className="font-semibold capitalize">
                {currentDifficulty}
              </span>
            </p>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-red-600 font-semibold">Loading exercises...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || errorQuestions.length === 0) {
    return (
      <div className="h-screen bg-red-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-red-200">
          <Link
            href="/grammar"
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-red-900">
              Error Identification
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
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentError = errorQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === errorQuestions.length - 1;

  const handleSelectAnswer = async (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentError.correct_answer;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        selectedAnswer: answer,
        correctAnswer: currentError.correct_answer,
        sentence: currentError.sentence,
      },
    ]);

    const score = isCorrect ? 100 : 0;

    // ✅ Report lexical performance
    try {
      await reportLexicalItemPerformance({
        module: "grammar",
        exerciseType: "error-identification",
        lemmaId: currentError.lemma_id,
        correctAnswer: currentError.correct_answer,
        userAnswer: answer,
        difficultyShown: currentDifficulty,
        score,
      });
    } catch (e) {
      console.error("Failed to record grammar performance", e);
    }

    // Update metrics with CURRENT difficulty
    addPerformanceMetrics("grammar", "error-identification", {
      score,
      difficulty: currentDifficulty,
      missedLowFreq: 0,
      similarChoiceErrors: !isCorrect ? 1 : 0,
      timestamp: new Date().toISOString(),
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      completeExercise();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const completeExercise = () => {
    const correctCount = answers.filter((a) => a === true).length;
    const sessionScore = Math.round(
      (correctCount / errorQuestions.length) * 100
    );

    let similarChoiceErrors = detailedAnswers.filter(
      (a) => !a.isCorrect
    ).length;

    const finalMetrics = {
      difficulty: currentDifficulty,
      score: sessionScore,
      missedLowFreq: 0,
      similarChoiceErrors,
      timestamp: new Date().toISOString(),
    };

    console.log("📊 Error ID Session Completed - Metrics:", finalMetrics);

    addPerformanceMetrics("grammar", "error-identification", finalMetrics);

    const history = getPerformanceHistory("grammar", "error-identification");
    const allHistory = [...history, finalMetrics];
    const evaluation = evaluateUserPerformance(allHistory);

    console.log(
      "🎯 Next Error ID Difficulty:",
      evaluation.nextDifficulty,
      "| Error Tags:",
      evaluation.tags
    );

    updateProgress("error-identification", {
      status: "in-progress",
      score: sessionScore,
      completedAt: new Date().toISOString(),
      lastDifficulty: evaluation.nextDifficulty,
      errorTags: evaluation.tags,
    });

    setShowCompletion(true);
  };

  const resetExercise = async () => {
    try {
      setIsLoading(true);
      const exercises = await getGrammarExercisesAdaptive({
        userId: user?.id,
        targetDifficulty: currentDifficulty,
        exerciseType: "error_identification",
        limit: 15,
      });
      const processedItems = convertToErrorFormat(exercises);
      const shuffled = [...processedItems].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(10, shuffled.length));

      setErrorQuestions(selected);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setAnswers(Array(selected.length).fill(null));
      setDetailedAnswers([]);
      setShowCompletion(false);
    } catch (err) {
      console.error("Failed to reload exercises:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-red-50 overflow-auto flex flex-col scrollbar-red scrollbar-purple">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-red-200">
        <Link
          href="/grammar"
          className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-red-900">
            Error Identification
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Difficulty:{" "}
            <span className="font-semibold capitalize">
              {currentDifficulty}
            </span>
          </p>
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
      <div className="flex-1 flex flex-col justify-start px-4 md:px-8 py-6 space-y-1 max-w-7xl mx-auto w-full">
        <ErrorProgress
          currentQuestion={currentQuestion}
          totalQuestions={errorQuestions.length}
          answers={answers}
        />

        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <ErrorQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={errorQuestions.length}
            sentence={currentError.sentence}
            question={currentError.question}
            choices={currentError.choices}
            correctAnswer={currentError.correct_answer}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={handleSelectAnswer}
            showResult={showResult}
            explanation={currentError.explanation}
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
              className="flex items-center mt-5 gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
            >
              {isLastQuestion ? "Finish Exercise" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <div className="text-center text-xs text-red-600">
            🔍 Identify the part of the sentence that contains a grammatical
            error
          </div>
        )}
      </div>

      <ErrorCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length / errorQuestions.length) *
            100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={errorQuestions.length}
        onClose={() => setShowCompletion(false)}
        onRetake={resetExercise}
      />
    </div>
  );
}
