"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight, Lightbulb } from "lucide-react";
import Link from "next/link";
import QuizQuestion from "@/components/vocabulary/closest-meaning-exercise/QuizQuestion";
import QuizProgress from "@/components/vocabulary/closest-meaning-exercise/QuizProgress";
import QuizCompletionModal from "@/components/vocabulary/closest-meaning-exercise/QuizCompletionModal";
import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type { QuizProgress as QuizProgressType } from "@/contexts/LearningProgressContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import {
  getVocabularyExercisesAdaptive,
  getLexiconData,
  type VocabularyExerciseItem,
  type LexiconItem,
} from "@/lib/api/exercises";
import {
  isLowFrequencyWord,
  areSimilarWords,
} from "@/utils/PerformanceTracker";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";
import { reportLexicalItemPerformance } from "@/utils/reportPerformance";

interface QuizItem {
  id: string;
  lemma_id: string;
  sentence: string;
  underlinedWord: string;
  correctAnswer: string;
  options: string[];
}

interface QuizAnswer {
  isCorrect: boolean;
  selectedAnswer: string;
  correctAnswer: string;
  word: string;
}

// Helper function to underline a word in a sentence
function underlineWordInSentence(
  sentence: string,
  wordToUnderline: string
): string {
  const escapedWord = wordToUnderline.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(?<=\\s|^)(${escapedWord})(?=\\s|$|[.,!?;:])`,
    "gi"
  );
  return sentence.replace(regex, "<u>$1</u>");
}

// Generate quiz questions from AI service data
async function generateQuizQuestionsFromService(
  vocabExercises: VocabularyExerciseItem[],
  lexiconData: LexiconItem[]
): Promise<QuizItem[]> {
  const lexiconMap = new Map(
    lexiconData.map((item: LexiconItem) => [item.lemma_id, item])
  );

  console.log("📚 Vocab Exercises:", vocabExercises.length);
  console.log("📖 Lexicon Data:", lexiconData.length);

  const quizItems: QuizItem[] = vocabExercises
    .map((vocabItem: VocabularyExerciseItem) => {
      const lexiconEntry = lexiconMap.get(vocabItem.lemma_id);
      if (!lexiconEntry) {
        console.warn(`⚠️ No lexicon entry for: ${vocabItem.lemma_id}`);
        return null;
      }

      const sentence =
        vocabItem.sentence_example_1 || vocabItem.sentence_example_2;
      if (!sentence) {
        console.warn(`⚠️ No sentence for: ${vocabItem.lemma_id}`);
        return null;
      }

      const wordsToConsider = [
        lexiconEntry.lemma,
        ...(lexiconEntry.surface_forms || []),
      ];

      let underlinedWord = lexiconEntry.lemma;
      for (const word of wordsToConsider) {
        const lowerSentence = sentence.toLowerCase();
        const lowerWord = word.toLowerCase();
        const wordRegex = new RegExp(`\\b${lowerWord}\\b`, "i");
        if (wordRegex.test(lowerSentence)) {
          underlinedWord = word;
          break;
        }
      }

      const useDefinitions = Math.random() > 0.5;

      let correctAnswer: string;
      let distractors: string[] = [];

      if (useDefinitions) {
        correctAnswer = lexiconEntry.base_definition;

        const otherLexicons = lexiconData.filter(
          (lex: LexiconItem) => lex.lemma_id !== vocabItem.lemma_id
        );
        const shuffled = otherLexicons.sort(() => Math.random() - 0.5);
        distractors = shuffled
          .slice(0, 3)
          .map((lex: LexiconItem) => lex.base_definition);
      } else {
        const synonyms = lexiconEntry.relations?.synonyms || [];
        if (synonyms.length > 0) {
          correctAnswer = synonyms[0];

          const otherSynonyms: string[] = [];
          lexiconData.forEach((lex: LexiconItem) => {
            if (
              lex.lemma_id !== vocabItem.lemma_id &&
              lex.relations?.synonyms
            ) {
              otherSynonyms.push(...lex.relations.synonyms);
            }
          });

          const shuffledSynonyms = otherSynonyms.sort(
            () => Math.random() - 0.5
          );
          distractors = shuffledSynonyms.slice(0, 3);
        } else {
          correctAnswer = lexiconEntry.base_definition;
          const otherLexicons = lexiconData.filter(
            (lex: LexiconItem) => lex.lemma_id !== vocabItem.lemma_id
          );
          const shuffled = otherLexicons.sort(() => Math.random() - 0.5);
          distractors = shuffled
            .slice(0, 3)
            .map((lex: LexiconItem) => lex.base_definition);
        }
      }

      const allOptions = [correctAnswer, ...distractors].sort(
        () => Math.random() - 0.5
      );

      const underlinedSentence = underlineWordInSentence(
        sentence,
        underlinedWord
      );

      return {
        id: vocabItem.item_id,
        lemma_id: vocabItem.lemma_id,
        sentence: underlinedSentence,
        underlinedWord,
        correctAnswer,
        options: allOptions,
      };
    })
    .filter((item): item is QuizItem => item !== null);

  const shuffled = quizItems.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(10, shuffled.length));
}

export default function ClosestMeaningQuizPage() {
  const { updateProgress, getExerciseProgress } = useVocabularyProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<QuizItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<QuizAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<
    "easy" | "medium" | "hard"
  >("easy");
  const { isLoading: authLoading } = useAuthGuard();

  // ✅ Load quiz items with adaptive difficulty
  useEffect(() => {
    async function loadQuiz() {
      try {
        setIsLoading(true);

        const performanceHistory = getPerformanceHistory("vocabulary", "quiz");
        const exerciseProgress = getExerciseProgress("quiz");

        console.log("📊 Quiz Performance History:", performanceHistory);
        console.log("📈 Quiz Exercise Progress:", exerciseProgress);

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
          if ("lastDifficulty" in exerciseProgress) {
            targetDifficulty =
              (exerciseProgress as QuizProgressType).lastDifficulty || "easy";
          } else {
            targetDifficulty = "easy";
          }
          console.log("🆕 First Session - Using difficulty:", targetDifficulty);
        }

        setCurrentDifficulty(targetDifficulty);

        console.log(
          "🔄 Fetching adaptive quiz exercises with difficulty:",
          targetDifficulty
        );

        const [vocabExercises, lexiconData] = await Promise.all([
          getVocabularyExercisesAdaptive({
            userId: user?.id,
            targetDifficulty,
            limit: 15,
          }),
          getLexiconData(),
        ]);

        console.log("📚 Adaptive Quiz Exercises:", vocabExercises.length);

        const qs = await generateQuizQuestionsFromService(
          vocabExercises,
          lexiconData
        );

        if (qs.length === 0) {
          throw new Error("No quiz items available for this difficulty");
        }

        setQuestions(qs);
        setAnswers(Array(qs.length).fill(null));
        setError(null);
      } catch (err) {
        console.error("❌ Failed to load quiz items:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load quiz items. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadQuiz();
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
      <div className="h-screen bg-purple-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-purple-200">
          <Link
            href="/vocabulary"
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-purple-900">
              Multiple Choice Quiz
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-purple-600 font-semibold">Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || questions.length === 0) {
    return (
      <div className="h-screen bg-purple-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-purple-200">
          <Link
            href="/vocabulary"
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-purple-900">
              Multiple Choice Quiz
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <p className="text-red-600 font-semibold mb-4">
              {error || "No quiz questions available"}
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

  const currentQuiz = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleSelectAnswer = async (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentQuiz.correctAnswer;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        selectedAnswer: answer,
        correctAnswer: currentQuiz.correctAnswer,
        word: currentQuiz.underlinedWord,
      },
    ]);

    // Error pattern features
    const lowFreq = isLowFrequencyWord(currentQuiz.underlinedWord);
    const similarChoiceError =
      !isCorrect &&
      currentQuiz.options.some((opt) =>
        areSimilarWords(opt, currentQuiz.correctAnswer)
      );

    const score = isCorrect ? 100 : 0;

    // ✅ Report lexical performance
    try {
      await reportLexicalItemPerformance({
        module: "vocabulary",
        exerciseType: "quiz",
        lemmaId: currentQuiz.lemma_id,
        correctAnswer: currentQuiz.correctAnswer,
        userAnswer: answer,
        difficultyShown: currentDifficulty,
        score,
      });
    } catch (e) {
      console.error("Failed to record lexical performance", e);
    }

    // Update metrics with CURRENT difficulty
    addPerformanceMetrics("vocabulary", "quiz", {
      score,
      difficulty: currentDifficulty,
      missedLowFreq: !isCorrect && lowFreq ? 1 : 0,
      similarChoiceErrors: similarChoiceError ? 1 : 0,
      timestamp: new Date().toISOString(),
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      completeQuiz();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const completeQuiz = () => {
    const correctCount = answers.filter((a) => a === true).length;
    const sessionScore = Math.round((correctCount / questions.length) * 100);

    let missedLowFreq = 0;
    let similarChoiceErrors = 0;

    detailedAnswers.forEach((answer) => {
      if (!answer.isCorrect && isLowFrequencyWord(answer.word)) {
        missedLowFreq++;
      }
      if (!answer.isCorrect) {
        similarChoiceErrors++;
      }
    });

    const finalMetrics = {
      difficulty: currentDifficulty,
      score: sessionScore,
      missedLowFreq,
      similarChoiceErrors,
      timestamp: new Date().toISOString(),
    };

    console.log("📊 Quiz Session Completed - Metrics:", finalMetrics);

    addPerformanceMetrics("vocabulary", "quiz", finalMetrics);

    const history = getPerformanceHistory("vocabulary", "quiz");
    const allHistory = [...history, finalMetrics];
    const evaluation = evaluateUserPerformance(allHistory);

    console.log(
      "🎯 Next Quiz Difficulty:",
      evaluation.nextDifficulty,
      "| Error Tags:",
      evaluation.tags
    );

    updateProgress("quiz", {
      status: "completed",
      score: sessionScore,
      completedAt: new Date().toISOString(),
      attempts: (history.length || 0) + 1,
      lastDifficulty: evaluation.nextDifficulty,
      errorTags: evaluation.tags,
    });

    setShowCompletion(true);
  };

  const resetQuiz = async () => {
    try {
      setIsLoading(true);
      const [vocabExercises, lexiconData] = await Promise.all([
        getVocabularyExercisesAdaptive({
          userId: user?.id,
          targetDifficulty: currentDifficulty,
          limit: 15,
        }),
        getLexiconData(),
      ]);
      const qs = await generateQuizQuestionsFromService(
        vocabExercises,
        lexiconData
      );
      setQuestions(qs);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setAnswers(Array(qs.length).fill(null));
      setDetailedAnswers([]);
      setShowCompletion(false);
    } catch (err) {
      console.error("Failed to reload quiz:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-blue-50 overflow-auto flex flex-col scrollbar-blue">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200">
        <Link
          href="/vocabulary"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-blue-900">
            What is its Closest Meaning
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Difficulty:{" "}
            <span className="font-semibold capitalize">
              {currentDifficulty}
            </span>
          </p>
        </div>

        <button
          onClick={resetQuiz}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-start px-4 md:px-8 py-6 space-y-8 max-w-7xl mx-auto w-full">
        <QuizProgress
          currentQuestion={currentQuestion}
          totalQuestions={questions.length}
          answers={answers}
          wordId={currentQuiz.lemma_id}
        />

        {/* Question Component with Animation */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <QuizQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={questions.length}
            sentence={currentQuiz.sentence}
            wordId={currentQuiz.lemma_id}
            options={currentQuiz.options}
            correctAnswer={currentQuiz.correctAnswer}
            selectedAnswer={selectedAnswer}
            onSelectAnswer={handleSelectAnswer}
            showResult={showResult}
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
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
            >
              {isLastQuestion ? "Finish Quiz" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ) : (
          <div className="text-center text-xs text-blue-600">
            💡 Select the correct meaning for the underlined word
          </div>
        )}
      </div>

      <QuizCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length / questions.length) * 100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={questions.length}
        onClose={() => setShowCompletion(false)}
        onRetake={resetQuiz}
      />
    </div>
  );
}
