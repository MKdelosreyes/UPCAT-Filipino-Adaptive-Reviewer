"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, RotateCcw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Flashcard from "@/components/vocabulary/flashcard-exercise/Flashcard";
import FlashcardProgress from "@/components/vocabulary/flashcard-exercise/FlashcardProgress";
import FlashcardCompletionModal from "@/components/vocabulary/flashcard-exercise/FlashcardCompletionModal";

import { useVocabularyProgress } from "@/hooks/useVocabularyProgress";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useSRS } from "@/hooks/useSRS";
import { SRS_GRADES } from "@/utils/srs";

import {
  getVocabularyExercisesAdaptive,
  getLexiconData,
  VocabularyExerciseItem,
  LexiconItem,
} from "@/lib/api/exercises";

import { reportLexicalItemPerformance } from "@/utils/reportPerformance";

type CardStatus = "unseen" | "learning" | "mastered";

interface FlashcardData {
  id: string;
  lemma_id: string;
  word: string;
  meaning: string;
  example: string;
  numericId: number;
}

interface CardState {
  id: string;
  status: CardStatus;
  flips: number;
}

export default function FlashcardsPage() {
  const { updateProgress } = useVocabularyProgress();
  const { user, tokens } = useAuth();
  const { isLoading: authLoading } = useAuthGuard();

  const [sessionWords, setSessionWords] = useState<FlashcardData[]>([]);
  const [deck, setDeck] = useState<FlashcardData[]>([]);
  const deckInitializedRef = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);

  // SRS - use the exercises-based hook
  const {
    exercises: srsExercises,
    dueExercises,
    grade,
    isLoading: srsLoading,
    store: srsStore,
  } = useSRS({
    module: "vocabulary",
    targetDifficulty: "easy",
    limit: 15,
  });

  // Calculate due IDs from the SRS store
  const dueIds = useMemo(() => {
    const now = new Date();
    return Object.entries(srsStore)
      .filter(([_, card]) => new Date(card.due) <= now)
      .map(([id]) => parseInt(id, 10))
      .filter((id) => !isNaN(id));
  }, [srsStore]);

  // Load flashcards
  useEffect(() => {
    async function loadExercises() {
      try {
        setIsLoading(true);

        const [vocabExercises, lexiconData] = await Promise.all([
          getVocabularyExercisesAdaptive({
            userId: user?.id,
            targetDifficulty: "easy",
            limit: 15,
            accessToken: tokens?.access,
          }),
          getLexiconData(),
        ]);

        const lexiconMap = new Map(
          lexiconData.map((item: LexiconItem) => [item.lemma_id, item])
        );

        const combinedData: FlashcardData[] = vocabExercises
          .map((vocabItem: VocabularyExerciseItem) => {
            const lexiconEntry = lexiconMap.get(vocabItem.lemma_id);
            if (!lexiconEntry) return null;

            const numericId =
              parseInt(vocabItem.lemma_id.replace(/\D/g, ""), 10) ||
              parseInt(vocabItem.item_id.replace(/\D/g, ""), 10);

            if (!numericId) return null;

            return {
              id: vocabItem.item_id,
              lemma_id: vocabItem.lemma_id,
              word: lexiconEntry.lemma,
              meaning: lexiconEntry.base_definition,
              example:
                vocabItem.sentence_example_1 ||
                vocabItem.sentence_example_2 ||
                "No example available",
              numericId,
            };
          })
          .filter((item): item is FlashcardData => item !== null);

        if (combinedData.length === 0)
          throw new Error("No flashcard data available");

        setSessionWords(combinedData);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load flashcards."
        );
      } finally {
        setIsLoading(false);
      }
    }

    deckInitializedRef.current = false;
    setDeck([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStates([]);
    setShowCompletion(false);
    setIsProcessing(false);

    loadExercises();
  }, [user?.id, tokens?.access]);

  // Initialize deck ONCE (freeze order) after SRS has loaded
  useEffect(() => {
    if (deckInitializedRef.current) return;
    if (sessionWords.length === 0) return;
    if (srsLoading) return;

    const dueSet = new Set(dueIds);
    const initialDeck = [...sessionWords].sort((a, b) => {
      const aDue = dueSet.has(a.numericId) ? 1 : 0;
      const bDue = dueSet.has(b.numericId) ? 1 : 0;
      return bDue - aDue;
    });

    setDeck(initialDeck);
    setCardStates(
      initialDeck.map((w) => ({
        id: w.id,
        status: "unseen",
        flips: 0,
      }))
    );

    deckInitializedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionWords, srsLoading]);

  if (authLoading) {
    return (
      <div className="h-screen bg-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  if (isLoading || srsLoading || !deckInitializedRef.current) {
    return (
      <div className="h-screen bg-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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

  const currentWord = deck[currentIndex];
  const isLastCard = currentIndex === deck.length - 1;

  const masteredCount = cardStates.filter(
    (c) => c.status === "mastered"
  ).length;
  const learningCount = cardStates.filter(
    (c) => c.status === "learning"
  ).length;

  const handleFlip = () => {
    if (isProcessing) return;
    setCardStates((prev) => {
      const next = [...prev];
      if (next[currentIndex])
        next[currentIndex] = {
          ...next[currentIndex],
          flips: next[currentIndex].flips + 1,
        };
      return next;
    });
    setIsFlipped((v) => !v);
  };

  const advanceFrom = (targetIndex: number) => {
    if (targetIndex === deck.length - 1) {
      completeSession();
      return;
    }
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(targetIndex + 1), 200);
  };

  const handleKnowIt = async () => {
    if (isProcessing) return;

    const targetIndex = currentIndex;
    const targetWord = deck[targetIndex];
    if (!targetWord) return;

    console.log("[SRS VERIFY]", {
      word: targetWord.word,
      lemma_id: targetWord.lemma_id,
      item_id: targetWord.id,
      numericId_used_as_word_id: targetWord.numericId,
    });

    setIsProcessing(true);
    try {
      await grade(targetWord.lemma_id, SRS_GRADES.CORRECT);

      await reportLexicalItemPerformance({
        module: "vocabulary",
        exerciseType: "flashcards",
        lemmaId: targetWord.lemma_id,
        correctAnswer: targetWord.word,
        userAnswer: targetWord.word,
        difficultyShown: "easy",
        score: 100,
      });

      setCardStates((prev) => {
        const next = [...prev];
        if (next[targetIndex])
          next[targetIndex] = { ...next[targetIndex], status: "mastered" };
        return next;
      });

      advanceFrom(targetIndex);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStillLearning = async () => {
    if (isProcessing) return;

    const targetIndex = currentIndex;
    const targetWord = deck[targetIndex];
    if (!targetWord) return;

    setIsProcessing(true);
    try {
      await grade(targetWord.lemma_id, SRS_GRADES.HARD);

      await reportLexicalItemPerformance({
        module: "vocabulary",
        exerciseType: "flashcards",
        lemmaId: targetWord.lemma_id,
        correctAnswer: targetWord.word,
        userAnswer: "",
        difficultyShown: "easy",
        score: 0,
      });

      setCardStates((prev) => {
        const next = [...prev];
        if (next[targetIndex] && next[targetIndex].status === "unseen") {
          next[targetIndex] = { ...next[targetIndex], status: "learning" };
        }
        return next;
      });

      advanceFrom(targetIndex);
    } finally {
      setIsProcessing(false);
    }
  };

  const completeSession = () => {
    const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);

    updateProgress("flashcards", {
      status: "in-progress",
      completedAt: new Date().toISOString(),
      timeSpent,
      cardsReviewed: deck.length,
    });

    setShowCompletion(true);
  };

  const resetSession = () => {
    deckInitializedRef.current = false;
    setDeck([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStates([]);
    setShowCompletion(false);
    setIsProcessing(false);
    setSessionStartTime(Date.now());
  };

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
          <p className="text-xs text-gray-500 mt-1">
            {dueIds.length} due (live count)
          </p>
        </div>

        <button
          onClick={resetSession}
          disabled={isProcessing}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col px-4 md:px-8 py-4 md:py-6 gap-3 md:gap-4 max-w-4xl mx-auto w-full min-h-0 overflow-y-auto md:overflow-hidden">
        <div className="flex-shrink-0">
          <FlashcardProgress
            current={currentIndex}
            total={deck.length}
            masteredCount={masteredCount}
            learningCount={learningCount}
            wordId={currentWord.lemma_id}
          />
        </div>

        <div className="flex-shrink-0 md:flex-1 flex items-center justify-center md:min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentWord.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
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

        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-2xl mx-auto w-full">
          <motion.button
            whileHover={!isProcessing ? { scale: 1.02 } : {}}
            whileTap={!isProcessing ? { scale: 0.98 } : {}}
            onClick={handleStillLearning}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-colors border-2 border-orange-300 flex-1 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
            <span>{isProcessing ? "Processing..." : "Still Learning"}</span>
          </motion.button>

          <motion.button
            whileHover={!isProcessing ? { scale: 1.02 } : {}}
            whileTap={!isProcessing ? { scale: 0.98 } : {}}
            onClick={handleKnowIt}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-colors border-2 border-green-300 flex-1 disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5" />
            <span>
              {isProcessing
                ? "Processing..."
                : isLastCard
                ? "Finish"
                : "I Know This"}
            </span>
          </motion.button>
        </div>
      </div>

      <FlashcardCompletionModal
        isOpen={showCompletion}
        score={Math.round((masteredCount / deck.length) * 100)}
        masteredCount={masteredCount}
        totalCards={deck.length}
        onClose={() => setShowCompletion(false)}
      />
    </div>
  );
}
