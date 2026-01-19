"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, X, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useAuthGuard } from "@/hooks/useAuthGuard";

import { grammarLessonCards } from "@/data/grammar-lesson-cards";

type CardStatus = "unseen" | "learning" | "mastered";

interface LessonCard {
  id: string;
  ruleName: string;
  description: string;
  example: string;
  explanation: string;
  difficulty: string;
}

interface CardState {
  id: string;
  status: CardStatus;
  flips: number;
}

interface LessonCardsCompletionModalProps {
  isOpen: boolean;
  score: number;
  masteredCount: number;
  totalCards: number;
  onClose: () => void;
}

const LessonCardsCompletionModal: React.FC<LessonCardsCompletionModalProps> = ({
  isOpen,
  score,
  masteredCount,
  totalCards,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-blue-700 mb-2">Great Job! 🎉</h2>
        <p className="text-gray-600 mb-6">
          You&apos;ve completed the lesson cards!
        </p>

        <div className="bg-blue-50 rounded-xl p-4 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-semibold">Total Cards:</span>
            <span className="text-2xl font-bold text-blue-700">{totalCards}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-semibold">Mastered:</span>
            <span className="text-2xl font-bold text-green-600">
              {masteredCount}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-semibold">Accuracy:</span>
            <span className="text-2xl font-bold text-blue-700">{score}%</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
        >
          Back to Grammar
        </button>
      </motion.div>
    </motion.div>
  );
};

const LessonCard: React.FC<{
  card: LessonCard;
  isFlipped: boolean;
  onFlip: () => void;
  cardId: string;
}> = ({ card, isFlipped, onFlip, cardId }) => {
  return (
    <motion.div
      onClick={onFlip}
      className="relative w-full h-[550px] cursor-pointer perspective"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <AnimatePresence mode="wait">
        {!isFlipped ? (
          <motion.div
            key={`front-${cardId}`}
            initial={{ opacity: 0, rotateY: -90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: 90 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-linear-to-br from-blue-100 to-blue-50 rounded-3xl p-10 flex flex-col justify-center items-center border-4 border-blue-300 shadow-lg"
          >
            <h3 className="text-4xl font-bold text-blue-700 mb-6 text-center">
              {card.ruleName}
            </h3>
            <p className="text-base text-blue-500 font-semibold">
              Tap to reveal
            </p>
            <div className="mt-8 inline-block bg-blue-200 px-5 py-3 rounded-full">
              <span className="text-sm font-bold text-blue-800">
                {card.difficulty}
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`back-${cardId}`}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-linear-to-br from-blue-500 to-blue-600 rounded-3xl p-10 flex flex-col justify-between border-4 border-blue-700 shadow-lg text-white overflow-y-auto"
          >
            <div>
              <p className="text-sm font-semibold text-blue-100 mb-3">
                DESCRIPTION
              </p>
              <p className="text-lg mb-7 leading-relaxed">
                {card.description}
              </p>

              <p className="text-sm font-semibold text-blue-100 mb-3">EXAMPLE</p>
              <p className="text-xl font-bold mb-6 bg-blue-700 p-4 rounded-lg">
                {card.example}
              </p>

              <p className="text-sm font-semibold text-blue-100 mb-3">
                EXPLANATION
              </p>
              <p className="text-base leading-relaxed">{card.explanation}</p>
            </div>
            <p className="text-sm text-blue-100 text-center mt-6">
              Tap to hide
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const LessonCardsProgress: React.FC<{
  current: number;
  total: number;
  masteredCount: number;
  learningCount: number;
  ruleName: string;
}> = ({ current, total, masteredCount, learningCount, ruleName }) => {
  const progressPercent = ((current + 1) / total) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-blue-700">{ruleName}</h3>
        <span className="text-sm font-semibold text-gray-600">
          {current + 1} / {total}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="bg-blue-600 h-2 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-gray-700">
            Mastered: <span className="font-bold">{masteredCount}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full" />
          <span className="text-gray-700">
            Learning: <span className="font-bold">{learningCount}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default function LessonCardsPage() {
  const { updateProgress } = useGrammarProgress();
  const { isLoading: authLoading } = useAuthGuard();

  const [deck, setDeck] = useState<LessonCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStartTime] = useState<number>(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);

  const deckInitializedRef = useRef(false);

  useEffect(() => {
    const loadLessonCards = async () => {
      if (deckInitializedRef.current) return;

      try {
        // Shuffle and select cards
        const shuffled = [...grammarLessonCards].sort(
          () => Math.random() - 0.5
        );
        const selected = shuffled.slice(
          0,
          Math.min(15, grammarLessonCards.length)
        );

        if (selected.length === 0) {
          setError("No lesson cards available");
          return;
        }

        setDeck(selected);
        setCardStates(
          selected.map((card) => ({
            id: card.id,
            status: "unseen",
            flips: 0,
          }))
        );

        deckInitializedRef.current = true;
        setError(null);
      } catch (err) {
        console.error("Failed to load lesson cards:", err);
        setError("Failed to load lesson cards");
      }
    };

    loadLessonCards();
  }, []);

  if (authLoading || !deckInitializedRef.current) {
    return (
      <div className="h-screen bg-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || deck.length === 0) {
    return (
      <div className="h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <p className="text-blue-900 font-semibold mb-2">
            {error || "🎉 No lesson cards available!"}
          </p>
          <p className="text-sm text-blue-600 mb-4">
            Come back later for more grammar lessons.
          </p>
          <Link
            href="/grammar"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Grammar
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = deck[currentIndex];
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

  const handleMastered = async () => {
    if (isProcessing) return;

    const targetIndex = currentIndex;
    setIsProcessing(true);

    try {
      setCardStates((prev) => {
        const next = [...prev];
        if (next[targetIndex])
          next[targetIndex] = { ...next[targetIndex], status: "mastered" };
        return next;
      });

      advanceFrom(targetIndex);
    } catch (error) {
      console.error("Failed to process card:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStillLearning = async () => {
    if (isProcessing) return;

    const targetIndex = currentIndex;
    setIsProcessing(true);

    try {
      setCardStates((prev) => {
        const next = [...prev];
        if (next[targetIndex] && next[targetIndex].status === "unseen") {
          next[targetIndex] = { ...next[targetIndex], status: "learning" };
        }
        return next;
      });

      advanceFrom(targetIndex);
    } catch (error) {
      console.error("Failed to process card:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const completeSession = () => {
    const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);

    updateProgress("lesson-cards", {
      status: "in-progress",
      completedAt: new Date().toISOString(),
      timeSpent,
      cardsReviewed: deck.length,
    });

    setShowCompletion(true);
  };

  const resetSession = () => {
    window.location.reload();
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-blue-50">
      <div className="shrink-0 flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-blue-200">
        <Link
          href="/grammar"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-blue-700">
            Grammar Lesson Cards
          </h1>
          <p className="text-xs text-gray-500 mt-1">Study mode</p>
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
        <div className="shrink-0">
          <LessonCardsProgress
            current={currentIndex}
            total={deck.length}
            masteredCount={masteredCount}
            learningCount={learningCount}
            ruleName={currentCard.ruleName}
          />
        </div>

        <div className="shrink-0 md:flex-1 flex items-center justify-center md:min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full flex items-center justify-center"
            >
              <LessonCard
                card={currentCard}
                isFlipped={isFlipped}
                onFlip={handleFlip}
                cardId={currentCard.id}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-2xl mx-auto w-full">
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
            onClick={handleMastered}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 font-bold py-3 px-8 rounded-xl shadow-lg transition-colors border-2 border-green-300 flex-1 disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5" />
            <span>
              {isProcessing
                ? "Processing..."
                : isLastCard
                ? "Finish"
                : "I Understand"}
            </span>
          </motion.button>
        </div>
      </div>

      <LessonCardsCompletionModal
        isOpen={showCompletion}
        score={Math.round((masteredCount / deck.length) * 100)}
        masteredCount={masteredCount}
        totalCards={deck.length}
        onClose={() => setShowCompletion(false)}
      />
    </div>
  );
}