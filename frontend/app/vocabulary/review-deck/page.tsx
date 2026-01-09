"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle, RotateCcw, X, Trash2 } from "lucide-react";
import Link from "next/link";
import Flashcard from "@/components/vocabulary/flashcard-exercise/Flashcard";
import FlashcardProgress from "@/components/vocabulary/flashcard-exercise/FlashcardProgress";
import { useReviewDeck } from "@/contexts/ReviewDeckProvider";
import { getLexiconData, type LexiconItem } from "@/lib/api/exercises";
import { reportLexicalItemPerformance } from "@/utils/reportPerformance";

type CardStatus = "unseen" | "learning" | "mastered";

interface ReviewCardData {
  lemma_id: string;
  word: string;
  meaning: string;
  example: string;
}

interface CardState {
  lemma_id: string;
  status: CardStatus;
  flips: number;
}

export default function ReviewDeckPage() {
  const { reviewDeck, removeFromReviewDeck, clearReviewDeck } = useReviewDeck();

  const [reviewWords, setReviewWords] = useState<ReviewCardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load lexicon data for review deck words
  useEffect(() => {
    async function loadReviewWords() {
      if (reviewDeck.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const lexiconData = await getLexiconData();

        // Filter lexicon items that are in the review deck
        const reviewItems: ReviewCardData[] = lexiconData
          .filter((item: LexiconItem) => reviewDeck.includes(item.lemma_id))
          .map((item: LexiconItem) => ({
            lemma_id: item.lemma_id,
            word: item.lemma,
            meaning: item.base_definition,
            example: `Example: ${item.lemma}`, // You can enhance this with real examples
          }));

        setReviewWords(reviewItems);
        setCardStates(
          reviewItems.map((word) => ({
            lemma_id: word.lemma_id,
            status: "unseen" as CardStatus,
            flips: 0,
          }))
        );
        setError(null);
      } catch (err) {
        console.error("❌ Failed to load review deck:", err);
        setError("Failed to load review deck. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadReviewWords();
  }, [reviewDeck]);

  // Empty State
  if (!isLoading && reviewWords.length === 0) {
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
              Review Deck
            </h1>
            <p className="text-xs text-gray-500 mt-1">Review saved words</p>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <div className="text-6xl">📚</div>
            <h2 className="text-2xl font-bold text-gray-700">
              Your Review Deck is Empty
            </h2>
            <p className="text-gray-600 max-w-md">
              Add words from flashcards by clicking the bookmark button to
              review them later!
            </p>
            <Link
              href="/vocabulary/flashcards"
              className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Go to Flashcards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-semibold">Loading review deck...</p>
        </div>
      </div>
    );
  }

  // Error State
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

  const currentWord = reviewWords[currentIndex];
  const masteredCount = cardStates.filter(
    (c) => c.status === "mastered"
  ).length;
  const learningCount = cardStates.filter(
    (c) => c.status === "learning"
  ).length;
  const isLastCard = currentIndex === reviewWords.length - 1;

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
      // Report performance
      await reportLexicalItemPerformance({
        module: "vocabulary",
        exerciseType: "flashcards",
        lemmaId: currentWord.lemma_id,
        correctAnswer: currentWord.word,
        userAnswer: currentWord.word,
        difficultyShown: "easy",
        score: 100,
      });

      // Update card state
      const newStates = [...cardStates];
      newStates[currentIndex].status = "mastered";
      setCardStates(newStates);

      // Remove from review deck
      removeFromReviewDeck(currentWord.lemma_id);

      // Move to next card or finish
      if (isLastCard) {
        // If this was the last card, go back to first unmastered card or show completion
        const remainingCards = newStates.filter((c) => c.status !== "mastered");
        if (remainingCards.length === 0) {
          // All cards mastered
          setCurrentIndex(0);
          setIsFlipped(false);
        } else {
          const nextUnmasteredIndex = newStates.findIndex(
            (c, idx) => idx > currentIndex && c.status !== "mastered"
          );
          if (nextUnmasteredIndex !== -1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentIndex(nextUnmasteredIndex), 300);
          } else {
            setCurrentIndex(0);
            setIsFlipped(false);
          }
        }
      } else {
        nextCard();
      }
    } catch (error) {
      console.error("Failed to report performance:", error);
      // Still proceed with local state update
      const newStates = [...cardStates];
      newStates[currentIndex].status = "mastered";
      setCardStates(newStates);
      removeFromReviewDeck(currentWord.lemma_id);
      nextCard();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStillLearning = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Report performance
      await reportLexicalItemPerformance({
        module: "vocabulary",
        exerciseType: "flashcards",
        lemmaId: currentWord.lemma_id,
        correctAnswer: currentWord.word,
        userAnswer: "",
        difficultyShown: "easy",
        score: 0,
      });

      // Update card state
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
    setIsFlipped(false);
    if (!isLastCard) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 300);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStates(
      reviewWords.map((word) => ({
        lemma_id: word.lemma_id,
        status: "unseen" as CardStatus,
        flips: 0,
      }))
    );
    setIsProcessing(false);
  };

  const handleClearAll = () => {
    if (
      confirm("Are you sure you want to remove all cards from the review deck?")
    ) {
      clearReviewDeck();
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-purple-50">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-8 py-4 bg-white border-b border-purple-200">
        <Link
          href="/vocabulary"
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="text-center flex-1 px-4">
          <h1 className="text-xl md:text-2xl font-bold text-purple-900">
            Review Deck ({reviewWords.length} cards)
          </h1>
          <p className="text-xs text-gray-500 mt-1">Review your saved words</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleClearAll}
            disabled={isProcessing}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear all cards"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Clear</span>
          </button>
          <button
            onClick={handleReset}
            disabled={isProcessing}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden md:inline">Reset</span>
          </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-4 md:px-8 py-4 md:py-6 gap-3 md:gap-4 max-w-4xl mx-auto w-full min-h-0 overflow-y-auto scrollbar-purple md:overflow-hidden">
        {/* Progress */}
        <div className="flex-shrink-0">
          <FlashcardProgress
            current={currentIndex}
            total={reviewWords.length}
            masteredCount={masteredCount}
            learningCount={learningCount}
            wordId={currentWord.lemma_id}
<<<<<<< HEAD
        />
=======
          />
>>>>>>> c657bb5 (merged with main)
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
            <span>{isProcessing ? "..." : "Mastered (Remove)"}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
