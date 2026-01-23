"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import ChooseSentenceQuestion from "@/components/sentence-construction/choose-sentence-exercise/ChooseSentenceQuestion";
import ChooseSentenceProgress from "@/components/sentence-construction/choose-sentence-exercise/ChooseSentenceProgress";
import ChooseSentenceCompletionModal from "@/components/sentence-construction/choose-sentence-exercise/ChooseSentenceCompletionModal";
import { useSentenceConstructionProgress } from "@/hooks/useSentenceConstructionProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import { useSRSWithExercises } from "@/hooks/useSRS";
import { reportLexicalItemPerformance } from "@/utils/reportPerformance";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";
import type { SentenceConstructionExerciseItem } from "@/lib/api/exercises";
import { SRS_GRADES } from "@/utils/srs";

interface ChooseSentenceAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  context: string;
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

export default function ChooseSentencePage() {
  const { updateProgress } = useSentenceConstructionProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();

  const {
    dueExercises,
    grade: gradeSRS,
    isLoading: srsLoading,
  } = useSRSWithExercises({
    module: "sentence-construction",
    exerciseType: "choose",
    targetDifficulty: "easy",
    limit: 10,
  });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<
    ChooseSentenceAnswer[]
  >([]);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    if (dueExercises.length > 0) {
      setAnswers(Array(dueExercises.length).fill(null));
    }
  }, [dueExercises.length]);

  // Compute choices early (unconditionally) so hooks order doesn't change
  const choices = useMemo(() => {
    if (dueExercises.length === 0) return [];
    const currentExercise = dueExercises[
      currentQuestion
    ] as SentenceConstructionExerciseItem;
    const allChoices = [
      currentExercise.chooseCorrectSentence,
      ...currentExercise.distractors,
    ];
    return shuffleArray(allChoices);
  }, [dueExercises, currentQuestion]);

  if (srsLoading || dueExercises.length === 0) {
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
          {srsLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          ) : (
            <div className="text-center">
              <p className="text-lg text-blue-900 mb-2">
                🎉 No exercises due right now!
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

  const currentExercise = dueExercises[
    currentQuestion
  ] as SentenceConstructionExerciseItem;
  const isLastQuestion = currentQuestion === dueExercises.length - 1;

  const handleSelectAnswer = async (answer: string) => {
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
      exerciseType: "quiz",
      lemmaId: currentExercise.lemma_id,
      correctAnswer,
      userAnswer: answer,
      difficultyShown: "medium",
      score: isCorrect ? 100 : 0,
    });

    const srsGrade = isCorrect ? SRS_GRADES.PERFECT : SRS_GRADES.HARD;
    await gradeSRS(currentExercise.lemma_id, srsGrade);
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

  const completeExercise = async () => {
    const correctCount = answers.filter((a) => a === true).length;
    const score = Math.round((correctCount / dueExercises.length) * 100);

    let missedLowFreq = 0;
    let similarChoiceErrors = 0;

    detailedAnswers.forEach((answer) => {
      if (!answer.isCorrect) {
        similarChoiceErrors++;
      }
    });

    const history = getPerformanceHistory(
      "sentence-construction",
      "choose-sentence"
    );
    const currentDifficulty =
      history.length > 0 ? history[history.length - 1].difficulty : "easy";

    const metrics = {
      difficulty: currentDifficulty,
      score,
      missedLowFreq,
      similarChoiceErrors,
      timestamp: new Date().toISOString(),
    };

    console.log("📊 Choose Sentence Session Completed - Metrics:", metrics);

    await addPerformanceMetrics(
      "sentence-construction",
      "choose-sentence",
      metrics
    );

    const allHistory = [...history, metrics];
    const evaluation = evaluateUserPerformance(allHistory);

    console.log(
      "🎯 Next Choose Sentence Difficulty:",
      evaluation.nextDifficulty,
      "| Error Tags:",
      evaluation.tags
    );

    await updateProgress("choose-sentence", {
      status: "in-progress",
      score,
      completedAt: new Date().toISOString(),
      attempts: (history.length || 0) + 1,
      lastDifficulty: evaluation.nextDifficulty,
      errorTags: evaluation.tags,
    });

    setShowCompletion(true);
  };

  const resetExercise = () => {
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

      <div className="flex-1 flex flex-col justify-start px-4 md:px-8 py-6 space-y-8 max-w-7xl mx-auto w-full">
        <ChooseSentenceProgress
          currentQuestion={currentQuestion}
          totalQuestions={dueExercises.length}
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
            totalQuestions={dueExercises.length}
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

      <ChooseSentenceCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length / dueExercises.length) * 100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={dueExercises.length}
        onClose={() => setShowCompletion(false)}
        onRetake={resetExercise}
      />
    </div>
  );
}
