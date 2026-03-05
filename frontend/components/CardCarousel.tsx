"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { useSwipeable } from "react-swipeable";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ClassroomCard from "./ClassroomCard";
import { ModuleType } from "@/contexts/LearningProgressContext";

const CARD_GAP_DESKTOP = 32;
const CARD_GAP_MOBILE = 16;

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
  onIndexChange?: (index: number) => void;
}

const CardCarousel = ({
  skill_cards = [],
  onIndexChange,
}: CardCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  // Get colors based on current module
  const getModuleColors = (moduleType: ModuleType) => {
    const colorMap = {
      vocabulary: {
        bg: "bg-yellow-600",
        hover: "hover:bg-yellow-700",
        active: "bg-yellow-800",
        text: "text-yellow-600",
        dot: "bg-yellow-600",
      },
      grammar: {
        bg: "bg-green-600",
        hover: "hover:bg-green-700",
        active: "bg-green-800",
        text: "text-green-600",
        dot: "bg-green-600",
      },
      "sentence-construction": {
        bg: "bg-blue-600",
        hover: "hover:bg-blue-700",
        active: "bg-blue-800",
        text: "text-blue-600",
        dot: "bg-blue-600",
      },
      "reading-comprehension": {
        bg: "bg-purple-600",
        hover: "hover:bg-purple-700",
        active: "bg-purple-800",
        text: "text-purple-600",
        dot: "bg-purple-600",
      },
    };
    return colorMap[moduleType] || colorMap.vocabulary;
  };

  const currentColors =
    skill_cards.length > 0
      ? getModuleColors(skill_cards[currentIndex].moduleType)
      : getModuleColors("vocabulary");

  // Detect mobile and container width
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);

      // Use container width if available, otherwise use window width
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      } else {
        setContainerWidth(width);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Also observe container resize
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  // Get dynamic card width based on screen size
  const getCardWidth = useCallback(() => {
    if (isMobile) {
      // On mobile, use 70% of container width, min 200px, max 280px
      const calculatedWidth = containerWidth * 0.75;
      return Math.max(200, Math.min(calculatedWidth, 280));
    }
    // Desktop: fixed width
    return 352;
  }, [isMobile, containerWidth]);

  const getCardGap = useCallback(() => {
    return isMobile ? CARD_GAP_MOBILE : CARD_GAP_DESKTOP;
  }, [isMobile]);

  const cardWidth = getCardWidth();
  const cardGap = getCardGap();

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
    if (skill_cards.length === 0) return;

    const totalWidth =
      skill_cards.length * cardWidth + (skill_cards.length - 1) * cardGap;

    // Center active card based on total row width
    const offset = totalWidth / 2 - cardWidth / 2;
    const targetX = offset - currentIndex * (cardWidth + cardGap);

    const controls = animate(x, targetX, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });

    return () => controls.stop();
  }, [currentIndex, x, cardWidth, containerWidth, cardGap, skill_cards.length]);

  // Notify parent about current index
  useEffect(() => {
    try {
      onIndexChange?.(currentIndex);
    } catch (e) {
      // noop
    }
  }, [currentIndex, onIndexChange]);

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
    delta: 30, // Lower delta for more responsive swipes on mobile
  });

  // Merge refs: combine containerRef with swipeable ref
  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Update our containerRef
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node;
      // Call swipeable's ref callback if it exists
      if (swipeHandlers.ref) {
        (swipeHandlers.ref as React.RefCallback<HTMLDivElement>)(node);
      }
    },
    [swipeHandlers.ref],
  );

  if (skill_cards.length === 0) {
    return (
      <div className="relative flex items-center justify-center h-full w-full">
        <p className="text-gray-500 text-xl">No cards available</p>
      </div>
    );
  }

  // Destructure ref out and spread the rest
  const { ref: _swipeRef, ...swipeHandlersWithoutRef } = swipeHandlers;

  return (
    <div
      ref={mergedRef}
      className="relative flex items-center justify-center h-full w-full overflow-hidden touch-pan-y"
      {...swipeHandlersWithoutRef}
    >
      {/* Left Fade Shadow - smaller on mobile */}
      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 md:w-24 z-10 bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none" />

      {/* Right Fade Shadow - smaller on mobile */}
      <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 md:w-24 z-10 bg-gradient-to-l from-white via-white/50 to-transparent pointer-events-none" />

      {/* Left Navigation - positioned better for mobile */}
      <div className="absolute left-1 sm:left-2 md:left-4 z-20">
        {currentIndex === 0 ? (
          <div
            className={`${currentColors.text} text-[10px] sm:text-xs md:text-sm font-medium opacity-50 hidden sm:block`}
          >
            First
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              prevCard();
            }}
            className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${currentColors.bg} text-white rounded-full ${currentColors.hover} active:${currentColors.active} transition-all duration-300 shadow-lg touch-manipulation`}
            aria-label="Previous card"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </motion.button>
        )}
      </div>

      {/* Cards Container */}
      <div className="w-full h-full flex items-center justify-center">
        <motion.div
          className="flex items-center"
          style={{
            x,
            gap: cardGap,
          }}
        >
          {skill_cards.map((card, index) => {
            const isActive = index === currentIndex;
            const distance = Math.abs(index - currentIndex);
            const shouldBlur = !isActive && !isMobile;

            return (
              <motion.div
                key={index}
                className="flex-shrink-0"
                style={{
                  width: cardWidth,
                  minWidth: cardWidth,
                }}
                animate={{
                  scale: isActive ? 1 : 0.9,
                  opacity: isActive ? 1 : isMobile ? 0.7 : 0.5,
                  y: isActive ? 0 : isMobile ? 4 : 16,
                  filter: shouldBlur
                    ? `blur(${Math.min(distance * 2, 4)}px)`
                    : "blur(0px)",
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
                  isFocused={isActive}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Right Navigation - positioned better for mobile */}
      <div className="absolute right-1 sm:right-2 md:right-4 z-20">
        {currentIndex === skill_cards.length - 1 ? (
          <div
            className={`${currentColors.text} text-[10px] sm:text-xs md:text-sm font-medium opacity-50 hidden sm:block`}
          >
            Last
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              nextCard();
            }}
            className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${currentColors.bg} text-white rounded-full ${currentColors.hover} active:${currentColors.active} transition-all duration-300 shadow-lg touch-manipulation`}
            aria-label="Next card"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </motion.button>
        )}
      </div>

      {/* Pagination Dots - adjusted for mobile */}
      <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-1.5 sm:gap-2">
        {skill_cards.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(index);
            }}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 touch-manipulation ${
              index === currentIndex
                ? `${currentColors.dot} w-4 sm:w-6`
                : "bg-gray-300 hover:bg-gray-400 w-1.5 sm:w-2"
            }`}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default CardCarousel;
