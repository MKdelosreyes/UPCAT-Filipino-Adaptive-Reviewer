"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import Flashcard from "@/components/vocabulary/flashcard-exercise/Flashcard";
import FlashcardProgress from "@/components/vocabulary/flashcard-exercise/FlashcardProgress";
import FlashcardCompletionModal from "@/components/vocabulary/flashcard-exercise/FlashcardCompletionModal";
import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { useAuth } from "@/contexts/AuthContext";
import {
  getVocabularyExercisesAdaptive,
  getLexiconData,
  VocabularyExerciseItem,
  LexiconItem,
} from "@/lib/api/exercises";
import { reportLexicalItemPerformance } from "@/utils/reportPerformance";
import { useAuthGuard } from "@/hooks/useAuthGuard";

type CardStatus = "unseen" | "learning" | "mastered";

interface FlashcardData {
  id: string;
  lemma_id: string;
  word: string;
  meaning: string;
  example: string;
}

interface CardState {
  id: string;
  status: CardStatus;
  flips: number;
}

export default function FlashcardsPage() {
  const { updateProgress, getExerciseProgress } = useVocabularyProgress();
  const { user, tokens } = useAuth();

  const [sessionWords, setSessionWords] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);
  const { isLoading: authLoading } = useAuthGuard();

  // ✅ Load flashcards (no difficulty needed - it's a lesson!)
  useEffect(() => {
    async function loadExercises() {
      try {
        setIsLoading(true);

        // ✅ For lessons, we don't need adaptive difficulty
        // Just fetch a set of vocabulary items (can be random or ordered)
        const [vocabExercises, lexiconData] = await Promise.all([
          getVocabularyExercisesAdaptive({
            userId: user?.id,
            targetDifficulty: "easy", // Lessons can start with easier words
            limit: 15,
            accessToken: tokens?.access,
          }),
          getLexiconData(),
        ]);

        console.log("📚 Flashcard Lesson:", vocabExercises.length, "cards");

        const lexiconMap = new Map(
          lexiconData.map((item: LexiconItem) => [item.lemma_id, item])
        );

        const combinedData: FlashcardData[] = vocabExercises
          .map((vocabItem: VocabularyExerciseItem) => {
            const lexiconEntry = lexiconMap.get(vocabItem.lemma_id);
            if (!lexiconEntry) return null;

            return {
              id: vocabItem.item_id,
              lemma_id: vocabItem.lemma_id,
              word: lexiconEntry.lemma,
              meaning: lexiconEntry.base_definition,
              example:
                vocabItem.sentence_example_1 ||
                vocabItem.sentence_example_2 ||
                "No example available",
            };
          })
          .filter((item): item is FlashcardData => item !== null);

        if (combinedData.length === 0) {
          throw new Error("No flashcard data available");
        }

        setSessionWords(combinedData);
        setCardStates(
          combinedData.map((word) => ({
            id: word.id,
            status: "unseen" as CardStatus,
            flips: 0,
          }))
        );
        setError(null);
      } catch (err) {
        console.error("❌ Failed to load flashcards:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load flashcards. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadExercises();
  }, [user?.id, tokens?.access]);

  if (authLoading) {
    return (
      <div className="h-screen bg-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-semibold">Loading flashcards...</p>
          {/* <p className="text-sm text-gray-500 mt-2">Lesson Mode 📚</p> */}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentWord = sessionWords[currentIndex];

  if (!currentWord) {
    return (
      <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-blue-50">
        <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200">
          <Link
            href="/vocabulary"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="text-center flex-1 px-4">
            <h1 className="text-xl md:text-2xl font-bold text-blue-900">
              Flashcards Lesson
            </h1>
          </div>
          <div className="w-20"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-blue-600">Loading session...</div>
        </div>
      </div>
    );
  }

  const masteredCount = cardStates.filter(
    (c) => c.status === "mastered"
  ).length;
  const learningCount = cardStates.filter(
    (c) => c.status === "learning"
  ).length;
  const isLastCard = currentIndex === sessionWords.length - 1;

  const handleFlip = () => {
    if (isProcessing) return;

    const newStates = [...cardStates];
    newStates[currentIndex].flips++;
    setCardStates(newStates);
    setIsFlipped(!isFlipped);
  };

  const handleKnowIt = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // ✅ Report lexical performance for tracking
      await reportLexicalItemPerformance({
        module: "vocabulary",
        exerciseType: "flashcards",
        lemmaId: currentWord.lemma_id,
        correctAnswer: currentWord.word,
        userAnswer: currentWord.word,
        difficultyShown: "easy", // Lessons don't have adaptive difficulty
        score: 100,
      });

      const newStates = [...cardStates];
      newStates[currentIndex].status = "mastered";
      setCardStates(newStates);
      nextCard();
    } catch (error) {
      console.error("Failed to report performance:", error);
      const newStates = [...cardStates];
      newStates[currentIndex].status = "mastered";
      setCardStates(newStates);
      nextCard();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStillLearning = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await reportLexicalItemPerformance({
        module: "vocabulary",
        exerciseType: "flashcards",
        lemmaId: currentWord.lemma_id,
        correctAnswer: currentWord.word,
        userAnswer: "",
        difficultyShown: "easy",
        score: 0,
      });

      const newStates = [...cardStates];
      if (newStates[currentIndex].status === "unseen") {
        newStates[currentIndex].status = "learning";
      }
      setCardStates(newStates);
      nextCard();
    } catch (error) {
      console.error("Failed to report performance:", error);
      const newStates = [...cardStates];
      if (newStates[currentIndex].status === "unseen") {
        newStates[currentIndex].status = "learning";
      }
      setCardStates(newStates);
      nextCard();
    } finally {
      setIsProcessing(false);
    }
  };

  const nextCard = () => {
    if (isLastCard) {
      completeSession();
    } else {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 300);
    }
  };

  const completeSession = () => {
    const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);
    const cardsReviewed = sessionWords.length;

    console.log("✅ Flashcard Lesson Completed:", {
      timeSpent,
      cardsReviewed,
      masteredCount,
    });

    // ✅ Update as LESSON progress (no scoring, no performance metrics)
    updateProgress("flashcards", {
      status: "completed",
      completedAt: new Date().toISOString(),
      timeSpent,
      cardsReviewed,
    });

    setShowCompletion(true);
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStates(
      sessionWords.map((word) => ({
        id: word.id,
        status: "unseen" as CardStatus,
        flips: 0,
      }))
    );
    setShowCompletion(false);
    setIsProcessing(false);
    setSessionStartTime(Date.now());
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-blue-50">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200">
        <Link
          href="/vocabulary"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-blue-900">
            Flashcards Lesson
          </h1>
          <p className="text-xs text-gray-500 mt-1">Study mode</p>
        </div>

        <button
          onClick={resetSession}
          disabled={isProcessing}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 md:px-8 py-4 md:py-6 gap-3 md:gap-4 max-w-4xl mx-auto w-full min-h-0 overflow-y-auto scrollbar-blue md:overflow-hidden">
        {/* Progress */}
        <div className="flex-shrink-0">
          <FlashcardProgress
            current={currentIndex}
            total={sessionWords.length}
            masteredCount={masteredCount}
            learningCount={learningCount}
            wordId={currentWord.lemma_id}
          />
        </div>

        {/* Flashcard */}
        <div className="flex-shrink-0 md:flex-1 flex items-center justify-center md:min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full flex items-center justify-center"
            >
              <Flashcard
                word={currentWord.word}
                meaning={currentWord.meaning}
                example={currentWord.example}
                isFlipped={isFlipped}
                onFlip={handleFlip}
                wordId={currentWord.lemma_id}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Buttons */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-2xl mx-auto w-full">
          <motion.button
            whileHover={!isProcessing ? { scale: 1.05 } : {}}
            whileTap={!isProcessing ? { scale: 0.95 } : {}}
            onClick={handleStillLearning}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-colors border-2 border-orange-300 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
            <span>{isProcessing ? "..." : "Still Learning"}</span>
          </motion.button>

          <motion.button
            whileHover={!isProcessing ? { scale: 1.05 } : {}}
            whileTap={!isProcessing ? { scale: 0.95 } : {}}
            onClick={handleKnowIt}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-colors border-2 border-green-300 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5" />
            <span>
              {isProcessing ? "..." : isLastCard ? "Finish" : "I Know This"}
            </span>
          </motion.button>
        </div>
      </div>

      <FlashcardCompletionModal
        isOpen={showCompletion}
        score={Math.round((masteredCount / sessionWords.length) * 100)}
        masteredCount={masteredCount}
        totalCards={sessionWords.length}
        onClose={() => setShowCompletion(false)}
      />
    </div>
  );
}
