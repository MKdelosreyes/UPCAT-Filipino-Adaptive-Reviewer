"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import SentenceQuestion from "@/components/grammar/sentence-correction/SentenceQuestion";
import SentenceProgress from "@/components/grammar/sentence-correction/SentenceProgress";
import SentenceCompletionModal from "@/components/grammar/sentence-correction/SentenceCompletionModal";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { grammarData } from "@/data/grammar-dataset";

interface SentenceAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  sentence: string;
}

export default function LessonCardsPage() {
  const { updateProgress } = useGrammarProgress();

  const [sentenceQuestions, setSentenceQuestions] = useState<
    typeof grammarData
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<SentenceAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());

  // Initialize questions on client side only
  useEffect(() => {
    setIsClient(true);
    const sentenceExercises = grammarData.filter(
      (item) => item.exerciseType === "sentence_correction"
    );
    const shuffled = [...sentenceExercises].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    setSentenceQuestions(selected);
    setAnswers(Array(selected.length).fill(null));
  }, []);

  // Show loading state while initializing
  if (!isClient || sentenceQuestions.length === 0) {
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
              Grammar Lesson Cards
            </h1>
            <p className="text-xs text-gray-500 mt-1">Study mode</p>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  const currentSentence = sentenceQuestions[currentQuestion];
  const isLastQuestion = currentQuestion === sentenceQuestions.length - 1;

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentSentence.correctAnswer;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    // Store detailed answer for analysis
    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        selectedAnswer: answer,
        correctAnswer: currentSentence.correctAnswer,
        sentence: currentSentence.sentence,
      },
    ]);
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
    const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
    const correctCount = answers.filter((a) => a === true).length;

    console.log("✅ Grammar Lesson Completed:", {
      timeSpent,
      lessonsViewed: sentenceQuestions.length,
      correctCount,
    });

    updateProgress("lesson-cards", {
      status: "in-progress",
      completedAt: new Date().toISOString(),
      timeSpent,
      lessonsViewed: sentenceQuestions.length,
    });

    setShowCompletion(true);
  };

  const resetExercise = () => {
    const sentenceExercises = grammarData.filter(
      (item) => item.exerciseType === "sentence_correction"
    );
    const shuffled = [...sentenceExercises].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    setSentenceQuestions(selected);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers(Array(selected.length).fill(null));
    setDetailedAnswers([]);
    setShowCompletion(false);
    setSessionStartTime(Date.now());
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
            Grammar Lesson Cards
          </h1>
          <p className="text-xs text-gray-500 mt-1">Study mode</p>
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
        <SentenceProgress
          currentQuestion={currentQuestion}
          totalQuestions={sentenceQuestions.length}
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
          <SentenceQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={sentenceQuestions.length}
            sentence={currentSentence.sentence}
            prompt={currentSentence.prompt || "Which is the correct version?"}
            choices={currentSentence.choices}
            correctAnswer={currentSentence.correctAnswer}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={handleSelectAnswer}
            showResult={showResult}
            explanation={currentSentence.explanation || ""}
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
              {isLastQuestion ? "Finish Lesson" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <div className="text-center text-xs text-green-600">
            📚 Study the correct grammar patterns
          </div>
        )}
      </div>

      <SentenceCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length /
            sentenceQuestions.length) *
            100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={sentenceQuestions.length}
        onClose={() => setShowCompletion(false)}
        onRetake={resetExercise}
      />
    </div>
  );
}
