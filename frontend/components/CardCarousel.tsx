"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ClassroomCard from "./ClassroomCard";
import { ModuleType } from "@/contexts/LearningProgressContext";

// Responsive card widths
const CARD_WIDTH_DESKTOP = 352;
const CARD_WIDTH_MOBILE = 280;
const CARD_GAP = 32;

interface Card {
  title: string;
  skill: string;
  imagePath: string;
  description: string;
  color: string;
  url: string;
  moduleType: ModuleType;
}

interface CardCarouselProps {
  skill_cards?: Card[];
}

const CardCarousel = ({ skill_cards = [] }: CardCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const x = useMotionValue(0);

  // Detect mobile and container width
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setContainerWidth(width);
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Get dynamic card width based on screen size
  const getCardWidth = useCallback(() => {
    if (isMobile) {
      // On mobile, use 85% of screen width with a max of 320px
      return Math.min(containerWidth * 0.85, 320);
    }
    return CARD_WIDTH_DESKTOP;
  }, [isMobile, containerWidth]);

  const cardWidth = getCardWidth();

  // Navigation functions with bounds checking
  const nextCard = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, skill_cards.length - 1));
  }, [skill_cards.length]);

  const prevCard = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Animate to current card position
  useEffect(() => {
    if (containerWidth === 0) return;

    const offset = containerWidth / 2 - cardWidth / 2;
    const targetX = -currentIndex * (cardWidth + CARD_GAP) + offset;

    const controls = animate(x, targetX, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });

    return () => controls.stop();
  }, [currentIndex, x, cardWidth, containerWidth]);

  // Swipe handlers with better mobile support
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentIndex < skill_cards.length - 1) {
        nextCard();
      }
    },
    onSwipedRight: () => {
      if (currentIndex > 0) {
        prevCard();
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
    trackTouch: true,
    delta: 50,
  });

  if (skill_cards.length === 0) {
    return (
      <div className="relative flex items-center justify-center h-full w-full">
        <p className="text-gray-500 text-xl">No cards available</p>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center justify-center h-full w-full overflow-hidden touch-pan-y"
      {...swipeHandlers}
    >
      {/* Left Fade Shadow */}
      <div className="absolute left-0 top-0 bottom-0 w-12 md:w-24 z-10 bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none" />

      {/* Right Fade Shadow */}
      <div className="absolute right-0 top-0 bottom-0 w-12 md:w-24 z-10 bg-gradient-to-l from-white via-white/50 to-transparent pointer-events-none" />

      {/* Left Navigation */}
      <div className="absolute left-2 md:left-4 z-20">
        {currentIndex === 0 ? (
          <div className="text-blue-600 text-xs md:text-sm font-medium opacity-50">
            First card
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              prevCard();
            }}
            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 active:bg-blue-800 transition-all duration-300 shadow-lg touch-manipulation"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
        )}
      </div>

      {/* Cards Container */}
      <div className="w-full h-full flex items-center justify-center px-2 md:px-0">
        <motion.div
          className="flex items-center"
          style={{
            x,
            gap: CARD_GAP,
          }}
        >
          {skill_cards.map((card, index) => {
            const isActive = index === currentIndex;
            const distance = Math.abs(index - currentIndex);

            return (
              <motion.div
                key={index}
                className="flex-shrink-0"
                style={{
                  width: cardWidth,
                  minWidth: cardWidth,
                }}
                animate={{
                  scale: isActive
                    ? isMobile
                      ? 1
                      : 1.1
                    : isMobile
                    ? 0.8
                    : 0.85,
                  opacity: isActive ? 1 : isMobile ? 0.3 : 0.5,
                  y: isActive ? 0 : isMobile ? 10 : 20,
                  filter: isActive ? "blur(0px)" : `blur(${distance * 2}px)`,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
              >
                <ClassroomCard
                  title={card.title}
                  skill={card.skill}
                  imagePath={card.imagePath}
                  description={card.description}
                  color={card.color}
                  url={card.url}
                  moduleType={card.moduleType}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Right Navigation */}
      <div className="absolute right-2 md:right-4 z-20">
        {currentIndex === skill_cards.length - 1 ? (
          <div className="text-blue-600 text-xs md:text-sm font-medium opacity-50">
            Last card
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              nextCard();
            }}
            className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 active:bg-blue-800 transition-all duration-300 shadow-lg touch-manipulation"
            aria-label="Next card"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
        )}
      </div>

      {/* Pagination Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        {skill_cards.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(index);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 touch-manipulation ${
              index === currentIndex
                ? "bg-blue-600 w-6"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default CardCarousel;
