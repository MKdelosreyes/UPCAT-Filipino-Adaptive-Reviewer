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
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useSRSWithExercises } from "@/hooks/useSRS";
import { SRS_GRADES } from "@/utils/srs";
import {
  getGrammarExercisesAdaptive,
  GrammarExerciseItem,
} from "@/lib/api/exercises";
import { updateExerciseProgress } from "@/lib/api/progress";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";
import { reportLexicalItemPerformance } from "@/utils/reportPerformance";
import type { QuizProgress } from "@/contexts/LearningProgressContext";

interface ErrorAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  sentence: string;
  lemmaId: string;
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
  const words = cleanSentence
    .split(/\s+/)
    .map((w) => w.replace(/[.,;:!?'"()]/g, ""))
    .filter((w) => w.length > 0);

  const phrases: string[] = [];
  const correctLower = correctAnswer.toLowerCase().trim();
  const correctWords = correctLower.split(/\s+/);

  // Helper to check if phrase overlaps with correct answer
  const overlapsWithCorrect = (phrase: string): boolean => {
    const phraseLower = phrase.toLowerCase().trim();
    const phraseWords = phraseLower.split(/\s+/);

    // Check if ANY word from phrase exists in correct answer
    return phraseWords.some((pw) => correctWords.includes(pw));
  };

  // Helper to check if two phrases share any words
  const phrasesShareWords = (phrase1: string, phrase2: string): boolean => {
    const words1 = phrase1.toLowerCase().split(/\s+/);
    const words2 = phrase2.toLowerCase().split(/\s+/);

    return words1.some((w) => words2.includes(w));
  };

  // Extract 1-word phrases (only if word length > 2)
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word.length > 2 && !overlapsWithCorrect(word)) {
      phrases.push(word);
    }
  }

  // Extract 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    if (!overlapsWithCorrect(phrase)) {
      phrases.push(phrase);
    }
  }

  // Extract 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    if (!overlapsWithCorrect(phrase)) {
      phrases.push(phrase);
    }
  }

  // Extract 4-word phrases (for longer sentences)
  for (let i = 0; i < words.length - 3; i++) {
    const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]} ${
      words[i + 3]
    }`;
    if (!overlapsWithCorrect(phrase)) {
      phrases.push(phrase);
    }
  }

  // Remove duplicates (case-insensitive)
  const uniquePhrases: string[] = [];
  const seenLower = new Set<string>();

  for (const phrase of phrases) {
    const phraseLower = phrase.toLowerCase();
    if (!seenLower.has(phraseLower)) {
      uniquePhrases.push(phrase);
      seenLower.add(phraseLower);
    }
  }

  return uniquePhrases;
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
      // For "No Error" cases: pick 3 distinct, non-overlapping distractors
      const shuffledPhrases = allPhrases.sort(() => Math.random() - 0.5);
      const distractors: string[] = [];

      // Helper to check word overlap
      const phrasesShareWords = (phrase1: string, phrase2: string): boolean => {
        const words1 = phrase1.toLowerCase().split(/\s+/);
        const words2 = phrase2.toLowerCase().split(/\s+/);
        return words1.some((w) => words2.includes(w));
      };

      // Select non-overlapping phrases (prioritize multi-word phrases)
      // First pass: try to get multi-word phrases
      for (const phrase of shuffledPhrases) {
        if (distractors.length >= 3) break;

        const wordCount = phrase.split(/\s+/).length;

        // Skip if it overlaps with any selected distractor
        const overlaps = distractors.some((existing) =>
          phrasesShareWords(phrase, existing)
        );

        if (!overlaps && wordCount >= 2) {
          distractors.push(phrase);
        }
      }

      // Second pass: fill remaining slots with any non-overlapping phrases
      if (distractors.length < 3) {
        for (const phrase of shuffledPhrases) {
          if (distractors.length >= 3) break;

          const overlaps = distractors.some((existing) =>
            phrasesShareWords(phrase, existing)
          );

          if (!overlaps && !distractors.includes(phrase)) {
            distractors.push(phrase);
          }
        }
      }

      // Fallback options if not enough phrases
      const fallbackOptions = [
        "Hindi Malinaw",
        "Kulang ang Impormasyon",
        "Labis ang Salita",
        "Mali ang Baybay",
        "Kulang ang Bantas",
      ];

      let fallbackIndex = 0;
      while (distractors.length < 3 && fallbackIndex < fallbackOptions.length) {
        const fallback = fallbackOptions[fallbackIndex];
        if (!distractors.includes(fallback)) {
          distractors.push(fallback);
        }
        fallbackIndex++;
      }

      // Shuffle distractors and add "Walang Mali"
      choices = [...distractors.sort(() => Math.random() - 0.5), "Walang Mali"];
    } else {
      // For error cases: pick 2 distinct, non-overlapping distractors
      const shuffledPhrases = allPhrases.sort(() => Math.random() - 0.5);
      const distractors: string[] = [];

      // Helper to check word overlap
      const phrasesShareWords = (phrase1: string, phrase2: string): boolean => {
        const words1 = phrase1.toLowerCase().split(/\s+/);
        const words2 = phrase2.toLowerCase().split(/\s+/);
        return words1.some((w) => words2.includes(w));
      };

      // First pass: prioritize multi-word phrases
      for (const phrase of shuffledPhrases) {
        if (distractors.length >= 2) break;

        const wordCount = phrase.split(/\s+/).length;

        const overlaps = distractors.some((existing) =>
          phrasesShareWords(phrase, existing)
        );

        if (!overlaps && wordCount >= 2) {
          distractors.push(phrase);
        }
      }

      // Second pass: fill remaining slots
      if (distractors.length < 2) {
        for (const phrase of shuffledPhrases) {
          if (distractors.length >= 2) break;

          const overlaps = distractors.some((existing) =>
            phrasesShareWords(phrase, existing)
          );

          if (!overlaps && !distractors.includes(phrase)) {
            distractors.push(phrase);
          }
        }
      }

      // Fallback options
      const fallbackOptions = [
        "Hindi Malinaw",
        "Kulang ang Impormasyon",
        "Mali ang Baybay",
        "Kulang ang Bantas",
        "Labis ang Salita",
      ];

      let fallbackIndex = 0;
      while (distractors.length < 2 && fallbackIndex < fallbackOptions.length) {
        const fallback = fallbackOptions[fallbackIndex];
        if (!distractors.includes(fallback)) {
          distractors.push(fallback);
        }
        fallbackIndex++;
      }

      // Combine correct answer + distractors, then shuffle first 3 choices
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
  const { getPerformanceHistory } = useLearningProgress();
  const { user } = useAuth();
  const { isLoading: authLoading } = useAuthGuard();

  const {
    dueExercises,
    grade: gradeSRS,
    isLoading: srsLoading,
  } = useSRSWithExercises({
    module: "grammar",
    exerciseType: "error_identification",
    targetDifficulty: "easy",
    limit: 15,
  });

  const [errorQuestions, setErrorQuestions] = useState<ProcessedErrorItem[]>(
    []
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<ErrorAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<
    "easy" | "medium" | "hard"
  >("easy");

  useEffect(() => {
    async function loadQuestions() {
      if (srsLoading || dueExercises.length === 0) return;

      try {
        const history = getPerformanceHistory(
          "grammar",
          "error-identification"
        );
        const targetDifficulty =
          history.length > 0 ? history[history.length - 1].difficulty : "easy";

        setCurrentDifficulty(targetDifficulty);

        // Convert due exercises to error format
        const processedItems = convertToErrorFormat(
          dueExercises as GrammarExerciseItem[]
        );

        if (processedItems.length === 0) {
          setError("No exercises available");
          return;
        }

        setErrorQuestions(processedItems);
        setAnswers(Array(processedItems.length).fill(null));
        setError(null);
      } catch (err) {
        console.error("❌ Failed to load exercises:", err);
        setError("Failed to load exercises");
      }
    }

    loadQuestions();
  }, [srsLoading, dueExercises]);

  if (authLoading) {
    return (
      <div className="h-screen bg-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (srsLoading || errorQuestions.length === 0) {
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
              Error Identification
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
                🎉 No exercises due right now!
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
        lemmaId: currentError.lemma_id,
      },
    ]);

    const score = isCorrect ? 100 : 0;

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

    const srsGrade = isCorrect ? SRS_GRADES.PERFECT : SRS_GRADES.HARD;
    await gradeSRS(currentError.lemma_id, srsGrade);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      void completeExercise();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const completeExercise = async () => {
    const correctCount = answers.filter((a) => a === true).length;
    const sessionScore = Math.round(
      (correctCount / errorQuestions.length) * 100
    );

    let similarChoiceErrors = detailedAnswers.filter(
      (a) => !a.isCorrect
    ).length;

    const history = getPerformanceHistory("grammar", "error-identification");
    const thisSession = {
      difficulty: currentDifficulty,
      score: sessionScore,
      missedLowFreq: 0,
      similarChoiceErrors,
      timestamp: new Date().toISOString(),
    };

    const evaluation = evaluateUserPerformance([...history, thisSession]);

    console.log(
      "🎯 Next Error ID Difficulty:",
      evaluation.nextDifficulty,
      "| Error Tags:",
      evaluation.tags
    );

    await updateExerciseProgress("grammar", "error-identification", {
      status: "in-progress",
      score: sessionScore,
      completedAt: new Date().toISOString(),
      lastDifficulty: evaluation.nextDifficulty,
      performanceMetrics: {
        difficulty: currentDifficulty,
        score: sessionScore,
        missedLowFreq: 0,
        similarChoiceErrors,
        errorTags: evaluation.tags,
      },
    });

    updateProgress("error-identification", {
      status: "in-progress",
      score: sessionScore,
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
    <div className="h-screen bg-green-50 overflow-auto flex flex-col scrollbar-green scrollbar-green">
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
            Error Identification
          </h1>
          {/* <p className="text-xs text-gray-500 mt-1">
            Difficulty:{" "}
            <span className="font-semibold capitalize">
              {currentDifficulty}
            </span>{" "}
            | {errorQuestions.length} exercises due
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
              className="flex items-center mt-5 gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
            >
              {isLastQuestion ? "Finish Exercise" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <div className="text-center text-xs text-green-600">
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
