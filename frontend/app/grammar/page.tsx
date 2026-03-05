"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import GrammarCard from "@/components/GrammarCard";
import ProgressStepper from "./_progress/ProgressStepper";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function GrammarPage() {
  const { getGrammarMastery } = useGrammarProgress();
  const mastery = getGrammarMastery();
  const { isLoading: authLoading } = useAuthGuard();

  const masteryColors = {
    beginner: "bg-gray-100 text-gray-700 border-gray-300",
    developing: "bg-green-100 text-green-700 border-green-300",
    proficient: "bg-green-100 text-green-700 border-green-300",
    advanced: "bg-green-200 text-green-800 border-green-400",
    master: "bg-green-300 text-green-900 border-green-500",
  };

  const cards = useMemo(
    () => [
      {
        name: "Lesson Cards",
        description: "Learn proper sentence structure through lessons",
        imagePath: "/art/grammar-1.png",
        color: "bg-purple-50",
        url: "/grammar/lesson-cards",
        exerciseType: "lesson-cards" as const,
      },
      {
        name: "Error Identification",
        description: "Identify grammatical errors in sentences",
        imagePath: "/art/grammar-2.png",
        color: "bg-green-50",
        url: "/grammar/error-identification",
        exerciseType: "error-identification" as const,
      },
      {
        name: "Fill the Blank",
        description: "Fill the blank with the correct word",
        imagePath: "/art/grammar-3.png",
        color: "bg-green-50",
        url: "/grammar/fill-blanks",
        exerciseType: "fill-blanks" as const,
      },
    ],
    [],
  );

  // Active card "focus" (based on which card is closest to the center)
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rafRef = useRef<number | null>(null);
  const [activeCard, setActiveCard] = useState(0);

  const updateActiveCard = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const center = scroller.scrollLeft + scroller.clientWidth / 2;

    let bestIndex = 0;
    let bestDist = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(center - elCenter);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    });

    setActiveCard(bestIndex);
  };

  const onScrollCards = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateActiveCard);
  };

  useEffect(() => {
    updateActiveCard();
    const onResize = () => updateActiveCard();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-start justify-center px-4 py-4 sm:px-6 sm:py-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-7xl">
        {/* Top Bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4 sm:mb-6">
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-1.5">
            <div
              className={[
                "w-full sm:w-auto",
                "flex items-center justify-center md:justify-start gap-3",
                "px-3 py-2 sm:px-4 rounded-2xl border-2 shadow-sm",
                masteryColors[mastery.level],
              ].join(" ")}
            >
              <span className="text-lg sm:text-xl shrink-0">
                {mastery.icon}
              </span>
              <div className="text-center md:text-left">
                <p className="text-[11px] sm:text-xs font-medium opacity-75">
                  Grammar Mastery
                </p>
                <p className="text-sm sm:text-base font-bold capitalize">
                  {mastery.level}
                </p>
              </div>
            </div>

            <p className="text-[11px] sm:text-xs text-gray-600 text-center md:text-right max-w-md leading-snug">
              {mastery.description} • Focus:{" "}
              <span className="font-semibold capitalize">
                {mastery.difficulty}
              </span>
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-700 mb-1 sm:mb-2 text-center">
            Grammar Activities
          </h1>
          <p className="text-sm sm:text-base text-center text-gray-600 mb-3 sm:mb-6">
            Master Filipino grammar through targeted practice
          </p>

          <div className="w-full">
            <ProgressStepper />
          </div>
        </div>

        {/* Cards: horizontal on mobile, grid on sm+ */}
        <div
          ref={scrollerRef}
          onScroll={onScrollCards}
          aria-label="Grammar activities"
          className="
            mt-4
            -mx-4 px-6 py-3
            flex gap-4 overflow-x-auto
            snap-x snap-mandatory scroll-px-4
            sm:mt-0 sm:mx-0 sm:px-0 sm:py-0
            sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 lg:gap-6
            sm:overflow-visible
            sm:auto-rows-fr
          "
        >
          {cards.map((c, i) => (
            <div
              key={c.url}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={[
                "snap-center shrink-0 min-w-[270px] w-[78%] sm:w-auto",
                "h-full sm:h-[150px] min-h-[300px] sm:min-h-0",
                "transition-transform duration-200 ease-out will-change-transform",
                i === activeCard
                  ? "scale-[1.03] opacity-100 z-10"
                  : "scale-[0.92] opacity-85 z-0",
                "sm:scale-100 sm:opacity-100 sm:z-0",
                i === activeCard
                  ? "ring-2 ring-green-300 shadow-2xl rounded-3xl"
                  : "ring-0 shadow-none",
                "sm:ring-0 sm:shadow-none",
              ].join(" ")}
            >
              <GrammarCard {...c} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
