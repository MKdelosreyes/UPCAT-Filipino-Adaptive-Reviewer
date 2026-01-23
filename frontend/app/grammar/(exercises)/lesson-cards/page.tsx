"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Award,
  BookOpen,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
} from "framer-motion";
import { useSwipeable } from "react-swipeable";
import confetti from "canvas-confetti";

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
  viewedCount: number; // Changed from masteredCount
  totalCards: number;
  onClose: () => void;
}

const LessonCardsCompletionModal: React.FC<LessonCardsCompletionModalProps> = ({
  isOpen,
  viewedCount,
  totalCards,
  onClose,
}) => {
  const completionRate = Math.round((viewedCount / totalCards) * 100);

  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-blue-600" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Lessons Complete!
                </h2>
                <p className="text-gray-600">
                  You've reviewed all the grammar rules.
                </p>
              </div>

              {/* Stats */}
              <div className="space-y-3 bg-blue-50 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Grammar Rules
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {totalCards}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Cards Reviewed
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    {viewedCount}/{totalCards}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Progress
                  </span>
                  <span className="text-xl font-bold text-purple-600">
                    {completionRate}%
                  </span>
                </div>
              </div>

              {/* Performance Message */}
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800 font-medium">
                  {completionRate >= 100
                    ? "Perfect! You've reviewed every rule. Time to practice!"
                    : completionRate >= 70
                    ? "Great! You've covered most grammar concepts."
                    : "Good start! Review more to understand all rules."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/grammar/error-identification"
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center"
                >
                  Practice Grammar Exercises →
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Review Again
                </button>
                <Link
                  href="/grammar"
                  className="w-full text-center text-gray-600 hover:text-gray-800 py-2 text-sm"
                >
                  Back to Grammar
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
      className="relative w-full max-w-2xl mx-auto h-[450px] cursor-pointer perspective scrollbar-hide"
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
            className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-50 rounded-3xl p-10 flex flex-col justify-center items-center border-4 border-blue-300 shadow-lg"
          >
            <h3 className="text-4xl font-bold text-blue-700 mb-6 text-center">
              {card.ruleName}
            </h3>
            <p className="text-base text-blue-500 font-semibold">
              Tap to reveal
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`back-${cardId}`}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 md:p-8 flex flex-col justify-between border-4 border-blue-700 shadow-lg text-white overflow-y-auto scrollbar-blue scrollbar-thin"
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs md:text-sm font-semibold text-blue-100 mb-2">
                  DESCRIPTION
                </p>
                <p className="text-sm md:text-base leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div>
                <p className="text-xs md:text-sm font-semibold text-blue-100 mb-2">
                  EXAMPLE
                </p>
                <p className="text-base md:text-lg font-bold bg-blue-700 p-3 rounded-lg">
                  {card.example}
                </p>
              </div>

              <div>
                <p className="text-xs md:text-sm font-semibold text-blue-100 mb-2">
                  EXPLANATION
                </p>
                <p className="text-sm md:text-base leading-relaxed">
                  {card.explanation}
                </p>
              </div>
            </div>
            <p className="text-xs text-blue-100 text-center mt-4">
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
  ruleName: string;
}> = ({ current, total, ruleName }) => {
  const progressPercent = ((current + 1) / total) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-blue-500/75">{ruleName}</h3>
        <span className="text-sm font-semibold text-gray-600">
          {current + 1} / {total}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full "
          initial={{ width: "0%" }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
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
  const [viewedCards, setViewedCards] = useState<Set<number>>(new Set([0]));

  const deckInitializedRef = useRef(false);

  useEffect(() => {
    const loadLessonCards = async () => {
      if (deckInitializedRef.current) return;

      try {
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

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentIndex < deck.length - 1) {
        handleNext();
      }
    },
    onSwipedRight: () => {
      if (currentIndex > 0) {
        handlePrevious();
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
    trackTouch: true,
    delta: 50,
  });

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
  const isFirstCard = currentIndex === 0;
  const isLastCard = currentIndex === deck.length - 1;

  const handleFlip = () => {
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

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex - 1);
      setViewedCards((prev) => new Set(prev).add(currentIndex - 1));
    }
  };

  const handleNext = () => {
    if (currentIndex < deck.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(currentIndex + 1);
      setViewedCards((prev) => new Set(prev).add(currentIndex + 1));
    }
  };

  const handleFinish = () => {
    const timeSpent = Math.floor((Date.now() - sessionStartTime) / 1000);

    updateProgress("lesson-cards", {
      status: "in-progress",
      completedAt: new Date().toISOString(),
      timeSpent,
      lessonsViewed: viewedCards.size,
    });

    setShowCompletion(true);
  };

  const resetSession = () => {
    window.location.reload();
  };

  return (
    <div
      className="h-screen flex flex-col bg-blue-50 overflow-hidden"
      {...swipeHandlers}
    >
      {/* Header */}
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
          className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden md:inline">Reset</span>
        </button>
      </div>

      {/* Main Content with Carousel Navigation */}
      <div className="flex-1 flex flex-col px-4 md:px-8 py-4 md:py-6 gap-3 md:gap-4 md:max-w-5xl mx-auto w-full min-h-0 overflow-y-auto md:overflow-hidden">
        {/* Progress Section */}
        <div className="shrink-0">
          <LessonCardsProgress
            current={currentIndex}
            total={deck.length}
            ruleName={currentCard.ruleName}
          />
        </div>

        {/* Carousel Section */}
        <div className="flex-1 relative flex items-center justify-center min-h-0">
          {/* Left Fade Shadow */}
          <div className="absolute left-0 top-0 bottom-0 w-12 md:w-24 z-10 bg-gradient-to-r from-blue-50 via-blue-50/50 to-transparent pointer-events-none" />

          {/* Right Fade Shadow */}
          <div className="absolute right-0 top-0 bottom-0 w-12 md:w-24 z-10 bg-gradient-to-l from-blue-50 via-blue-50/50 to-transparent pointer-events-none" />

          {/* Left Navigation */}
          <div className="absolute left-2 md:left-4 z-20">
            {isFirstCard ? (
              <div className="text-blue-600 text-xs md:text-sm font-medium opacity-50">
                First card
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrevious}
                className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-blue-600/50 text-white rounded-full hover:bg-blue-700 active:bg-blue-800 transition-all duration-300 shadow-lg"
                aria-label="Previous card"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </motion.button>
            )}
          </div>

          {/* Card */}
          <div className="w-full h-full flex items-center justify-center px-2 md:px-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="w-full max-h-[500px] flex items-center justify-center"
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

          {/* Right Navigation */}
          <div className="absolute right-2 md:right-4 z-20">
            {isLastCard ? (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFinish}
                className="flex items-center justify-center px-4 py-2 md:px-6 md:py-3 bg-blue-100 border-3 border-blue-500 text-blue-600 rounded-full hover:bg-blue-700 hover:text-white active:bg-blue-800 transition-all duration-300 shadow-lg font-bold text-sm md:text-base"
                aria-label="Finish session"
              >
                Finish
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-blue-600/50 text-white rounded-full hover:bg-blue-700 active:bg-blue-800 transition-all duration-300 shadow-lg"
                aria-label="Next card"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="shrink-0 flex justify-center gap-2 pb-2">
          {deck.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex(index);
                setViewedCards((prev) => new Set(prev).add(index));
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-blue-600 w-6"
                  : viewedCards.has(index)
                  ? "bg-blue-300 w-2"
                  : "bg-gray-300 w-2"
              } hover:bg-blue-400`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <LessonCardsCompletionModal
        isOpen={showCompletion}
        viewedCount={viewedCards.size}
        totalCards={deck.length}
        onClose={() => setShowCompletion(false)}
      />
    </div>
  );
}
