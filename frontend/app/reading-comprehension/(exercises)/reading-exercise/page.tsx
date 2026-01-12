"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, BookOpen } from "lucide-react";
import Link from "next/link";
import ComprehensionQuestion from "@/components/reading-comprehension/ComprehensionQuestion";
import ReadingProgress from "@/components/reading-comprehension/ReadingProgress";
import ReadingCompletionModal from "@/components/reading-comprehension/ReadingCompletionModal";
import { readingPassages } from "@/data/reading-comprehension-dataset";
import { useReadingProgress } from "@/hooks/useReadingProgress";

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
  const { updateProgress } = useReadingProgress();
  
  const [currentPassage, setCurrentPassage] = useState<typeof readingPassages[0] | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<ShuffledQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<QuestionAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);

  // Function to shuffle choices while tracking the correct answer
  const shuffleQuestions = (passage: typeof readingPassages[0]) => {
    // Shuffle choices within each question (but keep question order)
    const shuffled = passage.comprehensionQuestions.map((q) => {
      const choicesWithIndex = q.choices.map((choice, index) => ({
        choice,
        originalIndex: index,
      }));
      const shuffledChoices = shuffleArray(choicesWithIndex);
      const newCorrectAnswer = shuffledChoices.findIndex(
        (item) => item.originalIndex === q.correctAnswer
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

  // Initialize passage on client side only
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * readingPassages.length);
    const passage = readingPassages[randomIndex];
    setCurrentPassage(passage);
    shuffleQuestions(passage);
    setAnswers(Array(passage.comprehensionQuestions.length).fill(null));
  }, []);

  // Show loading state while initializing
  if (!currentPassage || shuffledQuestions.length === 0) {
    return (
      <div className="h-screen bg-blue-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200">
          <Link
            href="/reading-comprehension"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-blue-900">
              Reading Comprehension
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const currentQ = shuffledQuestions[currentQuestion];
  const isQuestionAnswered = answers[currentQuestion] !== null;

  const handleSelectAnswer = (answerIndex: number) => {
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
  };

  const handleNext = () => {
    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(
        answers[currentQuestion + 1] !== null
          ? detailedAnswers.find(
              (a) =>
                a.questionId ===
                shuffledQuestions[currentQuestion + 1].id
            )?.selectedAnswer ?? null
          : null
      );
    } else {
      // Last question - complete exercise
      completeExercise();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setSelectedAnswer(
        answers[currentQuestion - 1] !== null
          ? detailedAnswers.find(
              (a) =>
                a.questionId ===
                shuffledQuestions[currentQuestion - 1].id
            )?.selectedAnswer ?? null
          : null
      );
    }
  };

  const completeExercise = () => {
    const correctCount = answers.filter((a) => a === true).length;
    const score = Math.round(
      (correctCount / shuffledQuestions.length) * 100
    );

    // ✅ Update progress with completion status
    updateProgress("passage-questions", {
      status: "completed",
      score: score,
      completedAt: new Date().toISOString(),
      attempts: 1,
      lastDifficulty: "easy", // You can make this dynamic later
      errorTags: [],
    });

    setShowCompletion(true);
  };

  const resetExercise = () => {
    const randomIndex = Math.floor(Math.random() * readingPassages.length);
    const passage = readingPassages[randomIndex];
    setCurrentPassage(passage);
    shuffleQuestions(passage);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers(Array(passage.comprehensionQuestions.length).fill(null));
    setDetailedAnswers([]);
    setShowCompletion(false);
  };

  const canGoNext =
    isQuestionAnswered &&
    currentQuestion < shuffledQuestions.length - 1;
  const canFinish =
    isQuestionAnswered &&
    currentQuestion === shuffledQuestions.length - 1;
  const canGoPrevious = currentQuestion > 0;

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200 shadow-sm">
        <Link
          href="/reading-comprehension"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl md:text-2xl font-bold text-blue-900">
              Reading Comprehension
            </h1>
          </div>
          <p className="text-xs text-gray-600 mt-1">{currentPassage.title}</p>
        </div>

        <button
          onClick={resetExercise}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">New Passage</span>
        </button>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 md:p-6">
          {/* Left Panel - Reading Passage */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-blue-300 p-6 md:p-8 overflow-y-auto"
          >
            <div className="mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">
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
          <div className="flex flex-col gap-4 overflow-y-auto">
            {/* <ReadingProgress
              currentQuestion={currentQuestion}
              totalQuestions={shuffledQuestions.length}
              answers={answers}
            /> */}

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
                onNext={canFinish ? completeExercise : handleNext}
              />
            </motion.div>
          </div>
        </div>
      </div>

      <ReadingCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length /
            shuffledQuestions.length) *
            100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={shuffledQuestions.length}
        passageTitle={currentPassage.title}
        onClose={() => setShowCompletion(false)}
        onRetake={resetExercise}
      />
    </div>
  );
}
