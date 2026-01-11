"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface ReviewDeckContextType {
  reviewDeck: string[];
  addToReviewDeck: (wordId: string) => void;
  removeFromReviewDeck: (wordId: string) => void;
  isInReviewDeck: (wordId: string) => boolean;
  clearReviewDeck: () => void;
}

const ReviewDeckContext = createContext<ReviewDeckContextType | undefined>(
  undefined
);

export function ReviewDeckProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [reviewDeck, setReviewDeck] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("reviewDeck");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Handle both old number[] format and new string[] format
        setReviewDeck(parsed.map((id: any) => String(id)));
      } catch (error) {
        console.error("Failed to parse review deck:", error);
      }
    }
  }, []);

  // Save to localStorage whenever deck changes
  useEffect(() => {
    localStorage.setItem("reviewDeck", JSON.stringify(reviewDeck));
  }, [reviewDeck]);

  const addToReviewDeck = (wordId: string) => {
    // Changed from number to string
    setReviewDeck((prev) => {
      if (prev.includes(wordId)) return prev;
      return [...prev, wordId];
    });
  };

  const removeFromReviewDeck = (wordId: string) => {
    // Changed from number to string
    setReviewDeck((prev) => prev.filter((id) => id !== wordId));
  };

  const isInReviewDeck = (wordId: string) => {
    // Changed from number to string
    return reviewDeck.includes(wordId);
  };

  const clearReviewDeck = () => {
    setReviewDeck([]);
  };

  return (
    <ReviewDeckContext.Provider
      value={{
        reviewDeck,
        addToReviewDeck,
        removeFromReviewDeck,
        isInReviewDeck,
        clearReviewDeck,
      }}
    >
      {children}
    </ReviewDeckContext.Provider>
  );
}

export function useReviewDeck() {
  const context = useContext(ReviewDeckContext);
  if (context === undefined) {
    throw new Error("useReviewDeck must be used within a ReviewDeckProvider");
  }
  return context;
}
