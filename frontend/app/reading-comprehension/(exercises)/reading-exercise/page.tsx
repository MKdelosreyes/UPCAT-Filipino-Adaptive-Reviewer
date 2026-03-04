"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, RotateCcw } from "lucide-react";
import Link from "next/link";
import ComprehensionQuestion from "@/components/reading-comprehension/ComprehensionQuestion";
import ReadingCompletionModal from "@/components/reading-comprehension/ReadingCompletionModal";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type { QuizProgress } from "@/contexts/LearningProgressContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  getReadingComprehensionExercisesAdaptive,
  type ReadingPassage,
} from "@/lib/api/exercises";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";
import { reportLexicalItemPerformance } from "@/utils/reportPerformance";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useMotivationalQuote } from "@/hooks/useMotivationalQuote";

interface QuestionAnswer {
  isCorrect: boolean;
  selectedAnswer: number;
  correctAnswer: number;
  questionId: string;
}

interface ShuffledQuestion {
  id: string;
  question: string;
  type: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ReadingExercisePage() {
  const { updateProgress, getExerciseProgress } = useReadingProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();
  const { user } = useAuth();
  const { isLoading: authLoading } = useAuthGuard();

  const [passages, setPassages] = useState<ReadingPassage[]>([]);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<
    ShuffledQuestion[]
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<QuestionAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [allAnswers, setAllAnswers] = useState<boolean[]>([]); // Track all answers across all passages
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<
    "easy" | "medium" | "hard"
  >("easy");
  const loadingQuote = useMotivationalQuote(authLoading || isLoading, 5000);
  const [usedPassageIds, setUsedPassageIds] = useState<Set<string>>(new Set());

  // Function to shuffle choices while tracking the correct answer
  const shuffleQuestions = (passage: ReadingPassage) => {
    // Shuffle choices within each question (but keep question order)
    const shuffled = passage.comprehensionQuestions.map((q) => {
      const choicesWithIndex = q.choices.map((choice, index) => ({
        choice,
        originalIndex: index,
      }));
      const shuffledChoices = shuffleArray(choicesWithIndex);
      const newCorrectAnswer = shuffledChoices.findIndex(
        (item) => item.originalIndex === q.correctAnswer,
      );

      return {
        id: q.id,
        question: q.question,
        type: q.type,
        choices: shuffledChoices.map((item) => item.choice),
        correctAnswer: newCorrectAnswer,
        explanation: q.explanation,
      };
    });

    setShuffledQuestions(shuffled);
  };

  // ✅ Load passages with adaptive difficulty
  useEffect(() => {
    async function loadPassages() {
      try {
        setIsLoading(true);

        const performanceHistory = getPerformanceHistory(
          "reading-comprehension",
          "passage-questions",
        );
        const exerciseProgress = getExerciseProgress("passage-questions");

        console.log("📊 Reading Performance History:", performanceHistory);
        console.log("📈 Reading Exercise Progress:", exerciseProgress);

        let targetDifficulty: "easy" | "medium" | "hard" = "easy";

        if (performanceHistory.length > 0) {
          const evaluation = evaluateUserPerformance(performanceHistory);
          targetDifficulty = evaluation.nextDifficulty;
          console.log(
            "🎯 Evaluated Target Difficulty:",
            targetDifficulty,
            "| Tags:",
            evaluation.tags,
          );
        } else {
          if ("lastDifficulty" in exerciseProgress) {
            targetDifficulty =
              (exerciseProgress as QuizProgress).lastDifficulty || "easy";
          } else {
            targetDifficulty = "easy";
          }
          console.log("🆕 First Session - Using difficulty:", targetDifficulty);
        }

        setCurrentDifficulty(targetDifficulty);

        console.log(
          "🔄 Fetching adaptive reading passages with difficulty:",
          targetDifficulty,
        );

        const readingPassages = await getReadingComprehensionExercisesAdaptive({
          userId: user?.id,
          targetDifficulty,
          limit: 3,
        });

        console.log("📚 Adaptive Reading Passages:", readingPassages.length);

        if (readingPassages.length === 0) {
          throw new Error("No reading passages available for this difficulty");
        }

        setPassages(readingPassages);

        // Track passage IDs to avoid duplicates
        setUsedPassageIds((prev) => {
          const newSet = new Set(prev);
          readingPassages.forEach((p) => newSet.add(p.passage_id));
          return newSet;
        });

        // Initialize first passage
        shuffleQuestions(readingPassages[0]);
        setAnswers(
          Array(readingPassages[0].comprehensionQuestions.length).fill(null),
        );
        setError(null);
      } catch (err) {
        console.error("❌ Failed to load reading passages:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load reading passages. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadPassages();
  }, [user?.id]);

  if (authLoading) {
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

  // Show loading state while initializing
  if (isLoading) {
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

  // Show error state
  if (error || passages.length === 0) {
    return (
      <div className="h-screen bg-purple-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-purple-200">
          <Link
            href="/reading-comprehension"
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-purple-900">
              Reading Comprehension
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <p className="text-purple-600 font-semibold mb-4">
              {error || "No reading passages available"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = shuffledQuestions[currentQuestion];
  const isQuestionAnswered = answers[currentQuestion] !== null;

  const handleSelectAnswer = async (answerIndex: number) => {
    if (isQuestionAnswered) return; // Prevent re-answering

    setSelectedAnswer(answerIndex);

    const isCorrect = answerIndex === currentQ.correctAnswer;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    // Store detailed answer for analysis
    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        selectedAnswer: answerIndex,
        correctAnswer: currentQ.correctAnswer,
        questionId: currentQ.id,
      },
    ]);

    const score = isCorrect ? 100 : 0;

    // ✅ Report reading comprehension performance
    try {
      await reportLexicalItemPerformance({
        module: "reading-comprehension",
        exerciseType: "passage-questions",
        lemmaId: currentQ.id,
        correctAnswer: currentQ.correctAnswer.toString(),
        userAnswer: answerIndex.toString(),
        difficultyShown: currentDifficulty,
        score,
      });
    } catch (e) {
      console.error("Failed to record reading comprehension performance", e);
    }

    // Update metrics with CURRENT difficulty
    // addPerformanceMetrics("reading-comprehension", "passage-questions", {
    //   score,
    //   difficulty: currentDifficulty,
    //   timestamp: new Date().toISOString(),
    // });
  };

  const handleNext = () => {
    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(
        answers[currentQuestion + 1] !== null
          ? (detailedAnswers.find(
              (a) => a.questionId === shuffledQuestions[currentQuestion + 1].id,
            )?.selectedAnswer ?? null)
          : null,
      );
    } else {
      // Finished current passage's questions
      // Store all answers from this passage
      const currentPassageAnswers = answers.filter(
        (a): a is boolean => a !== null,
      );
      setAllAnswers([...allAnswers, ...currentPassageAnswers]);

      // Check if there are more passages
      if (currentPassageIndex < passages.length - 1) {
        // Move to next passage
        const nextPassageIndex = currentPassageIndex + 1;
        setCurrentPassageIndex(nextPassageIndex);
        shuffleQuestions(passages[nextPassageIndex]);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setAnswers(
          Array(passages[nextPassageIndex].comprehensionQuestions.length).fill(
            null,
          ),
        );
        setDetailedAnswers([]);
      } else {
        // All passages complete
        completeExercise();
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setSelectedAnswer(
        answers[currentQuestion - 1] !== null
          ? (detailedAnswers.find(
              (a) => a.questionId === shuffledQuestions[currentQuestion - 1].id,
            )?.selectedAnswer ?? null)
          : null,
      );
    }
  };

  const completeExercise = () => {
    // Combine all answers from all passages
    const currentPassageAnswers = answers.filter(
      (a): a is boolean => a !== null,
    );
    const finalAllAnswers = [...allAnswers, ...currentPassageAnswers];

    const correctCount = finalAllAnswers.filter((a) => a === true).length;
    const totalQuestions = finalAllAnswers.length;
    const sessionScore = Math.round((correctCount / totalQuestions) * 100);

    const finalMetrics = {
      difficulty: currentDifficulty,
      score: sessionScore,
      timestamp: new Date().toISOString(),
    };

    console.log("📊 Reading Session Completed - Metrics:", finalMetrics);

    // addPerformanceMetrics("reading-comprehension", "passage-questions", finalMetrics);

    const history = getPerformanceHistory(
      "reading-comprehension",
      "passage-questions",
    );
    const allHistory = [...history, finalMetrics];
    // const evaluation = evaluateUserPerformance(allHistory);

    // console.log(
    //   "🎯 Next Reading Difficulty:",
    //   evaluation.nextDifficulty,
    //   "| Error Tags:",
    //   evaluation.tags
    // );

    // updateProgress("passage-questions", {
    //   status: "in-progress",
    //   score: sessionScore,
    //   completedAt: new Date().toISOString(),
    //   attempts: (history.length || 0) + 1,
    //   lastDifficulty: evaluation.nextDifficulty,
    //   errorTags: evaluation.tags,
    // });

    setShowCompletion(true);
  };

  const resetExercise = async () => {
    try {
      setIsLoading(true);

      // Fetch new passages, excluding ones we've already used
      let readingPassages = await getReadingComprehensionExercisesAdaptive({
        userId: user?.id,
        targetDifficulty: currentDifficulty,
        limit: 10, // Fetch more to filter from
      });

      // Filter out passages we've already seen
      const newPassages = readingPassages.filter(
        (p) => !usedPassageIds.has(p.passage_id),
      );

      // If we've seen all passages at this difficulty, reset the used IDs
      if (newPassages.length < 3) {
        console.log(
          "⚠️ Not enough new passages, resetting used passage tracking",
        );
        setUsedPassageIds(new Set());
        readingPassages = await getReadingComprehensionExercisesAdaptive({
          userId: user?.id,
          targetDifficulty: currentDifficulty,
          limit: 3,
        });
      } else {
        readingPassages = newPassages.slice(0, 3);
      }

      setPassages(readingPassages);

      // Track new passage IDs
      setUsedPassageIds((prev) => {
        const newSet = new Set(prev);
        readingPassages.forEach((p) => newSet.add(p.passage_id));
        return newSet;
      });

      setCurrentPassageIndex(0);
      shuffleQuestions(readingPassages[0]);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setAnswers(
        Array(readingPassages[0].comprehensionQuestions.length).fill(null),
      );
      setDetailedAnswers([]);
      setAllAnswers([]);
      setShowCompletion(false);
    } catch (err) {
      console.error("Failed to reload exercise:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const canGoNext =
    isQuestionAnswered &&
    (currentQuestion < shuffledQuestions.length - 1 ||
      currentPassageIndex < passages.length - 1);
  const canFinish =
    isQuestionAnswered &&
    currentQuestion === shuffledQuestions.length - 1 &&
    currentPassageIndex === passages.length - 1;
  const canGoPrevious = currentQuestion > 0;

  const currentPassage = passages[currentPassageIndex];
  const totalQuestionsCompleted =
    allAnswers.length + answers.filter((a) => a !== null).length;
  const totalQuestions = passages.reduce(
    (sum, p) => sum + p.comprehensionQuestions.length,
    0,
  );

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-purple-200 shadow-sm">
        <Link
          href="/reading-comprehension"
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden md:inline">Back</span>
        </Link>

        <div className="text-center flex-1 px-4">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <h1 className="text-base md:text-2xl font-bold text-purple-900">
              Reading Comprehension
            </h1>
          </div>
          {/* <p className="text-xs text-gray-600 mt-1">
            {currentPassage.title} • Passage {currentPassageIndex + 1} of{" "}
            {passages.length}
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

      {/* Main Content - Split Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 md:p-6">
          {/* Left Panel - Reading Passage */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-purple-300 p-6 md:p-8 overflow-y-auto scrollbar-purple"
          >
            <div className="mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-purple-900 mb-2">
                {currentPassage.title}
              </h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                  {currentPassage.difficulty}
                </span>
                <span className="text-xs font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                  {currentPassage.wordCount} words
                </span>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              {currentPassage.text.split("\n\n").map((paragraph, index) => (
                <p
                  key={index}
                  className="text-gray-800 leading-relaxed mb-4 text-justify"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </motion.div>

          {/* Right Panel - Questions */}
          <div className="flex flex-col gap-4 overflow-y-auto scrollbar-purple">
            {/* Progress Indicator */}
            <div className="bg-white rounded-xl shadow-md border-2 border-purple-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-purple-900">
                  Overall Progress
                </span>
                <span className="text-sm font-bold text-purple-600">
                  {totalQuestionsCompleted} / {totalQuestions}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(totalQuestionsCompleted / totalQuestions) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Passage {currentPassageIndex + 1} of {passages.length} •
                Question {currentQuestion + 1} of {shuffledQuestions.length}
              </p>
            </div>

            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ComprehensionQuestion
                questionNumber={currentQuestion + 1}
                totalQuestions={shuffledQuestions.length}
                question={currentQ.question}
                questionType={currentQ.type}
                choices={currentQ.choices}
                correctAnswer={currentQ.correctAnswer}
                selectedAnswer={selectedAnswer}
                onSelectAnswer={handleSelectAnswer}
                showResult={isQuestionAnswered}
                explanation={currentQ.explanation}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext || canFinish}
                onPrevious={handlePrevious}
                onNext={handleNext}
                passageTitle={currentPassage.title}
              />
            </motion.div>
          </div>
        </div>
      </div>

      <ReadingCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (allAnswers.filter((a) => a === true).length / allAnswers.length) *
            100,
        )}
        correctCount={allAnswers.filter((a) => a === true).length}
        totalQuestions={allAnswers.length}
        passageTitle={`${passages.length} Reading Passages`}
        onClose={() => setShowCompletion(false)}
        onRetake={resetExercise}
      />
    </div>
  );
}
