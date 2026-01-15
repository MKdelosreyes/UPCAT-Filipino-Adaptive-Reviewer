"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import AntonymQuestion from "@/components/vocabulary/antonym-exercise/AntonymQuestion";
import AntonymProgress from "@/components/vocabulary/antonym-exercise/AntonymProgress";
import AntonymCompletionModal from "@/components/vocabulary/antonym-exercise/AntonymCompletionModal";
import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type { QuizProgress } from "@/contexts/LearningProgressContext";
import { useAuth } from "@/contexts/AuthContext";
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
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useSRSWithExercises } from "@/hooks/useSRS";
import { SRS_GRADES } from "@/utils/srs";

interface AntonymItem {
  id: string;
  lemma_id: string;
  sentence: string;
  underlinedWord: string;
  correctAnswer: string;
  options: string[];
}

interface AntonymAnswer {
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

// Generate antonym questions from AI service data
async function generateAntonymQuestionsFromService(
  vocabExercises: VocabularyExerciseItem[],
  lexiconData: LexiconItem[]
): Promise<AntonymItem[]> {
  const lexiconMap = new Map(
    lexiconData.map((item: LexiconItem) => [item.lemma_id, item])
  );

  console.log("📚 Vocab Exercises:", vocabExercises.length);
  console.log("📖 Lexicon Data:", lexiconData.length);

  const itemsWithAntonyms = vocabExercises.filter((vocabItem) => {
    const lexiconEntry = lexiconMap.get(vocabItem.lemma_id);
    return (
      lexiconEntry &&
      lexiconEntry.relations?.antonyms &&
      lexiconEntry.relations.antonyms.length > 0
    );
  });

  console.log("🔄 Items with antonyms:", itemsWithAntonyms.length);

  const antonymItems: AntonymItem[] = itemsWithAntonyms
    .map((vocabItem: VocabularyExerciseItem) => {
      const lexiconEntry = lexiconMap.get(vocabItem.lemma_id);
      if (!lexiconEntry) return null;

      const sentence =
        vocabItem.sentence_example_1 || vocabItem.sentence_example_2;
      if (!sentence) return null;

      const antonyms = lexiconEntry.relations?.antonyms || [];
      if (antonyms.length === 0) return null;

      const correctAnswer = antonyms[0];

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

      const distractors: string[] = [];

      const otherLexicons = lexiconData.filter(
        (lex: LexiconItem) =>
          lex.lemma_id !== vocabItem.lemma_id &&
          lex.lemma !== correctAnswer &&
          !antonyms.includes(lex.lemma)
      );
      const shuffledLexicons = otherLexicons.sort(() => Math.random() - 0.5);

      for (let i = 0; i < 2 && i < shuffledLexicons.length; i++) {
        distractors.push(shuffledLexicons[i].lemma);
      }

      const otherSynonyms: string[] = [];
      lexiconData.forEach((lex: LexiconItem) => {
        if (lex.lemma_id !== vocabItem.lemma_id && lex.relations?.synonyms) {
          otherSynonyms.push(
            ...lex.relations.synonyms.filter(
              (syn) => syn !== correctAnswer && !antonyms.includes(syn)
            )
          );
        }
      });

      const shuffledSynonyms = otherSynonyms.sort(() => Math.random() - 0.5);
      if (shuffledSynonyms.length > 0 && distractors.length < 3) {
        distractors.push(shuffledSynonyms[0]);
      }

      const uniqueDistractors = Array.from(new Set(distractors)).slice(0, 3);
      while (uniqueDistractors.length < 3 && shuffledLexicons.length > 0) {
        const randomLex =
          shuffledLexicons[Math.floor(Math.random() * shuffledLexicons.length)];
        if (
          !uniqueDistractors.includes(randomLex.lemma) &&
          randomLex.lemma !== correctAnswer
        ) {
          uniqueDistractors.push(randomLex.lemma);
        }
      }

      const allOptions = [correctAnswer, ...uniqueDistractors].sort(
        () => Math.random() - 0.5
      );

      const sentenceWithUnderline = underlineWordInSentence(
        sentence,
        underlinedWord
      );

      return {
        id: vocabItem.item_id,
        lemma_id: vocabItem.lemma_id,
        sentence: sentenceWithUnderline,
        underlinedWord,
        correctAnswer,
        options: allOptions,
      };
    })
    .filter((item): item is AntonymItem => item !== null);

  const shuffled = antonymItems.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(10, shuffled.length));
}

export default function AntonymExercisePage() {
  const { updateProgress, getExerciseProgress } = useVocabularyProgress();
  const { addPerformanceMetrics, getPerformanceHistory } =
    useLearningProgress();
  const { user } = useAuth();

  const { grade: gradeSRS } = useSRSWithExercises({
    module: "vocabulary",
    targetDifficulty: "easy",
    limit: 15,
  });

  const [questions, setQuestions] = useState<AntonymItem[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [detailedAnswers, setDetailedAnswers] = useState<AntonymAnswer[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<
    "easy" | "medium" | "hard"
  >("easy");
  const { isLoading: authLoading } = useAuthGuard();

  useEffect(() => {
    async function loadQuestions() {
      try {
        setIsLoading(true);

        const performanceHistory = getPerformanceHistory(
          "vocabulary",
          "antonym"
        );
        const exerciseProgress = getExerciseProgress("antonym");

        console.log("📊 Antonym Performance History:", performanceHistory);
        console.log("📈 Antonym Exercise Progress:", exerciseProgress);

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
              (exerciseProgress as QuizProgress).lastDifficulty || "easy";
          } else {
            targetDifficulty = "easy";
          }
          console.log("🆕 First Session - Using difficulty:", targetDifficulty);
        }

        setCurrentDifficulty(targetDifficulty);

        console.log(
          "🔄 Fetching adaptive antonym exercises with difficulty:",
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

        console.log("📚 Adaptive Antonym Exercises:", vocabExercises.length);

        const qs = await generateAntonymQuestionsFromService(
          vocabExercises,
          lexiconData
        );

        if (qs.length === 0) {
          throw new Error("No antonym items available for this difficulty");
        }

        setQuestions(qs);
        setAnswers(Array(qs.length).fill(null));
        setError(null);
      } catch (err) {
        console.error("❌ Failed to load antonym items:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load antonym items. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadQuestions();
  }, [user?.id]);

  if (authLoading) {
    return (
      <div className="h-screen bg-yellow-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
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
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-red-900">
              Antonym Exercise
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-yellow-600 font-semibold">Loading exercise...</p>
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
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-red-900">
              Antonym Exercise
            </h1>
          </div>

          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <p className="text-yellow-600 font-semibold mb-4">
              {error || "No antonym questions available"}
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

  const currentAntonym = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleSelectAnswer = async (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === currentAntonym.correctAnswer;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = isCorrect;
    setAnswers(newAnswers);

    setDetailedAnswers([
      ...detailedAnswers,
      {
        isCorrect,
        selectedAnswer: answer,
        correctAnswer: currentAntonym.correctAnswer,
        word: currentAntonym.underlinedWord,
      },
    ]);

    // Error pattern features
    const lowFreq = isLowFrequencyWord(currentAntonym.underlinedWord);
    const score = isCorrect ? 100 : 0;

    try {
      await reportLexicalItemPerformance({
        module: "vocabulary",
        exerciseType: "antonym",
        lemmaId: currentAntonym.lemma_id,
        correctAnswer: currentAntonym.correctAnswer,
        userAnswer: answer,
        difficultyShown: currentDifficulty,
        score,
      });
    } catch (e) {
      console.error("Failed to record antonym lexical performance", e);
    }

    const srsGrade = isCorrect ? SRS_GRADES.PERFECT : SRS_GRADES.HARD;
    await gradeSRS(currentAntonym.lemma_id, srsGrade);

    // Update metrics with CURRENT difficulty
    addPerformanceMetrics("vocabulary", "antonym", {
      score,
      difficulty: currentDifficulty,
      missedLowFreq: !isCorrect && lowFreq ? 1 : 0,
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

    console.log("📊 Antonym Session Completed - Metrics:", finalMetrics);

    addPerformanceMetrics("vocabulary", "antonym", finalMetrics);

    const history = getPerformanceHistory("vocabulary", "antonym");
    const allHistory = [...history, finalMetrics];
    const evaluation = evaluateUserPerformance(allHistory);

    console.log(
      "🎯 Next Antonym Difficulty:",
      evaluation.nextDifficulty,
      "| Error Tags:",
      evaluation.tags
    );

    updateProgress("antonym", {
      status: "in-progress",
      score: sessionScore,
      completedAt: new Date().toISOString(),
      attempts: (history.length || 0) + 1,
      lastDifficulty: evaluation.nextDifficulty,
      errorTags: evaluation.tags,
    });

    setShowCompletion(true);
  };

  const resetExercise = async () => {
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
      const qs = await generateAntonymQuestionsFromService(
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
      console.error("Failed to reload exercise:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-yellow-50 overflow-auto flex flex-col scrollbar-yellow">
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
          <h1 className="text-xl md:text-2xl font-bold text-yellow-900">
            Antonym Exercise
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
      <div className="flex-1 flex flex-col justify-start px-4 md:px-8 py-6 space-y-8 max-w-7xl mx-auto w-full">
        <AntonymProgress
          currentQuestion={currentQuestion}
          totalQuestions={questions.length}
          answers={answers}
          id={currentAntonym.lemma_id}
        />

        {/* Question Component with Animation */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <AntonymQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={questions.length}
            sentence={currentAntonym.sentence}
            wordId={currentAntonym.lemma_id}
            options={currentAntonym.options}
            correctAnswer={currentAntonym.correctAnswer}
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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors"
            >
              {isLastQuestion ? "Finish Exercise" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </div>

      <AntonymCompletionModal
        isOpen={showCompletion}
        score={Math.round(
          (answers.filter((a) => a === true).length / questions.length) * 100
        )}
        correctCount={answers.filter((a) => a === true).length}
        totalQuestions={questions.length}
        onClose={() => setShowCompletion(false)}
      />
    </div>
  );
}
