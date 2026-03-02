"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  RotateCcw,
  ChevronRight,
  Lightbulb,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import QuizQuestion from "@/components/vocabulary/closest-meaning-exercise/QuizQuestion";
import QuizProgress from "@/components/vocabulary/closest-meaning-exercise/QuizProgress";
import QuizCompletionModal from "@/components/vocabulary/closest-meaning-exercise/QuizCompletionModal";
import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import {
  underlineWordInSentence,
  sentenceContainsWord,
} from "@/utils/textFormatting";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useSRSWithExercises } from "@/hooks/useSRS";
import { SRS_GRADES } from "@/utils/srs";
import {
  getVocabularyExercisesAdaptive,
  getLexiconData,
  type VocabularyExerciseItem,
  type LexiconItem,
} from "@/lib/api/exercises";
import { updateExerciseProgress } from "@/lib/api/progress";
import {
  isLowFrequencyWord,
  areSimilarWords,
} from "@/utils/PerformanceTracker";
import { evaluateUserPerformance } from "@/rules/evaluateUserPerformance";
import { reportLexicalItemPerformance } from "@/utils/reportPerformance";
import type { QuizProgress as QuizProgressType } from "@/contexts/LearningProgressContext";
import {
  makeUserScopedStorageKey,
  usePersistedQuizSession,
} from "@/hooks/usePersistedQuizSession";

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

type PersistedClosestMeaningSessionV1 = {
  questions: QuizItem[];
  currentQuestion: number;
  selectedAnswer: string | null;
  showResult: boolean;
  answers: (boolean | null)[];
  detailedAnswers: QuizAnswer[];
  currentDifficulty: "easy" | "medium" | "hard";
};

// Generate quiz questions from AI service data
async function generateQuizQuestionsFromService(
  sessionExercises: VocabularyExerciseItem[],
  lexiconData: LexiconItem[],
): Promise<QuizItem[]> {
  const lexiconMap = new Map(
    lexiconData.map((item: LexiconItem) => [item.lemma_id, item]),
  );

  console.log("📚 Vocab Exercises:", sessionExercises.length);
  console.log("📖 Lexicon Data:", lexiconData.length);

  const quizItems: QuizItem[] = sessionExercises
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
        if (sentenceContainsWord(sentence, word)) {
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
          (lex: LexiconItem) => lex.lemma_id !== vocabItem.lemma_id,
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
            () => Math.random() - 0.5,
          );
          distractors = shuffledSynonyms.slice(0, 3);
        } else {
          correctAnswer = lexiconEntry.base_definition;
          const otherLexicons = lexiconData.filter(
            (lex: LexiconItem) => lex.lemma_id !== vocabItem.lemma_id,
          );
          const shuffled = otherLexicons.sort(() => Math.random() - 0.5);
          distractors = shuffled
            .slice(0, 3)
            .map((lex: LexiconItem) => lex.base_definition);
        }
      }

      const allOptions = [correctAnswer, ...distractors].sort(
        () => Math.random() - 0.5,
      );

      const underlinedSentence = underlineWordInSentence(
        sentence,
        underlinedWord,
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
  const { getPerformanceHistory } = useLearningProgress();
  const history = getPerformanceHistory("vocabulary", "quiz");
  const fallbackDifficulty =
    history.length > 0 ? history[history.length - 1].difficulty : "easy";

  const { user } = useAuth();
  const { isLoading: authLoading } = useAuthGuard();

  const exerciseProgress = getExerciseProgress("quiz");
  const difficultyToServe =
    "lastDifficulty" in exerciseProgress
      ? ((exerciseProgress as QuizProgressType).lastDifficulty ??
        fallbackDifficulty)
      : fallbackDifficulty;

  const {
    sessionExercises,
    grade: gradeSRS,
    isLoading: srsLoading,
  } = useSRSWithExercises({
    module: "vocabulary",
    targetDifficulty: difficultyToServe,
    sessionSize: 10,
    fetchLimit: 40,
  });

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
  const [isFinishing, setIsFinishing] = useState(false);

  const sessionStorageKey = authLoading
    ? null
    : makeUserScopedStorageKey(
        user,
        "far:quizSession:vocabulary:closest-meaning",
      );

  const { didRestore, clear: clearSession } =
    usePersistedQuizSession<PersistedClosestMeaningSessionV1>({
      key: sessionStorageKey,
      version: 1,
      restoreWhen: !authLoading && !srsLoading,
      persistWhen: !authLoading && !srsLoading,
      isComplete: showCompletion,
      clearOnComplete: true,
      hasDataToPersist: questions.length > 0 && !isLoading && !error,
      snapshot: () => ({
        questions,
        currentQuestion,
        selectedAnswer,
        showResult,
        answers,
        detailedAnswers,
        currentDifficulty,
      }),
      restore: (payload) => {
        setQuestions(payload.questions);
        setCurrentQuestion(payload.currentQuestion);
        setSelectedAnswer(payload.selectedAnswer);
        setShowResult(payload.showResult);
        setAnswers(payload.answers);
        setDetailedAnswers(payload.detailedAnswers);
        setCurrentDifficulty(payload.currentDifficulty);
        setError(null);
        setIsLoading(false);
        setShowCompletion(false);
      },
      validate: (p: any): p is PersistedClosestMeaningSessionV1 => {
        if (!p || typeof p !== "object") return false;
        if (!Array.isArray(p.questions)) return false;
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
        if (p.questions.length === 0) return false;
        if (p.answers.length !== p.questions.length) return false;
        if (p.currentQuestion >= p.questions.length) return false;
        return true;
      },
    });

  useEffect(() => {
    async function loadQuiz() {
      if (didRestore) return;
      if (srsLoading) return;
      if (!sessionExercises || sessionExercises.length === 0) return;

      try {
        setIsLoading(true);

        setCurrentDifficulty(difficultyToServe);

        const lexiconData = await getLexiconData();

        const qs = await generateQuizQuestionsFromService(
          sessionExercises as VocabularyExerciseItem[],
          lexiconData,
        );

        if (qs.length === 0) {
          throw new Error("No quiz items available for this session");
        }

        setQuestions(qs);
        setAnswers(Array(qs.length).fill(null));
        setDetailedAnswers([]);
        setCurrentQuestion(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setError(null);
      } catch (err) {
        console.error("❌ Failed to load quiz items:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load quiz items. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadQuiz();
  }, [didRestore, srsLoading, sessionExercises, difficultyToServe]);

  if (authLoading || srsLoading) {
    return (
      <div className="h-screen bg-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen bg-yellow-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-yellow-200">
          <Link
            href="/vocabulary"
            className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-yellow-700">
              What is its Closest Meaning
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-yellow-600 font-semibold">Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || questions.length === 0) {
    return (
      <div className="h-screen bg-yellow-50 flex flex-col">
        <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-yellow-200">
          <Link
            href="/vocabulary"
            className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-yellow-700">
              What is its Closest Meaning
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
              onClick={() => {
                clearSession();
                window.location.reload();
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
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

    const score = isCorrect ? 100 : 0;

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

    const srsGrade = isCorrect ? SRS_GRADES.PERFECT : SRS_GRADES.HARD;
    await gradeSRS(currentQuiz.lemma_id, srsGrade);
  };

  const handleNext = () => {
    if (isFinishing) return;
    if (isLastQuestion) {
      setIsFinishing(true);
      void completeQuiz();
    } else {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const completeQuiz = async () => {
    try {
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

      const history = getPerformanceHistory("vocabulary", "quiz");
      const thisSession = {
        difficulty: currentDifficulty,
        score: sessionScore,
        missedLowFreq,
        similarChoiceErrors,
        timestamp: new Date().toISOString(),
      };

      const evaluation = evaluateUserPerformance([...history, thisSession]);

      console.log(
        "🎯 Next Quiz Difficulty:",
        evaluation.nextDifficulty,
        "| Error Tags:",
        evaluation.tags,
      );

      await updateExerciseProgress("vocabulary", "quiz", {
        status: "in-progress",
        score: sessionScore,
        completedAt: new Date().toISOString(),
        lastDifficulty: evaluation.nextDifficulty,
        performanceMetrics: {
          difficulty: currentDifficulty,
          score: sessionScore,
          missedLowFreq,
          similarChoiceErrors,
          errorTags: evaluation.tags,
        },
      });

      updateProgress("quiz", {
        status: "in-progress",
        score: sessionScore,
        completedAt: new Date().toISOString(),
        lastDifficulty: evaluation.nextDifficulty,
        errorTags: evaluation.tags,
      });

      setShowCompletion(true);
    } finally {
      setIsFinishing(false);
    }
  };

  const resetQuiz = async () => {
    clearSession();
    try {
      setIsLoading(true);
      const lexiconData = await getLexiconData();

      const qs = await generateQuizQuestionsFromService(
        sessionExercises as VocabularyExerciseItem[],
        lexiconData,
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
    <div className="h-screen bg-white overflow-auto flex flex-col scrollbar-yellow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-yellow-200">
        <Link
          href="/vocabulary"
          className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-yellow-700">
            What is its Closest Meaning
          </h1>
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
              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors disabled:cursor-not-allowed"
            >
              {isFinishing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Finishing...
                </>
              ) : (
                <>
                  {isLastQuestion ? "Finish Quiz" : "Next Question"}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </div>

      <QuizCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length / questions.length) * 100,
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={questions.length}
        onClose={() => setShowCompletion(false)}
        onRetake={resetQuiz}
      />
    </div>
  );
}
