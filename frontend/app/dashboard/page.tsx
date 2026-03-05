"use client";

import Header from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import CardCarousel from "@/components/CardCarousel";
import { ModuleType } from "@/contexts/LearningProgressContext";
import RecommendedPathIndicator from "@/components/RecommendedPathIndicator";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import ProgressOverview from "@/components/ProgressOverview";
import SkillAnalysis from "@/components/SkillAnalysis";
import { useLearningProgress } from "@/contexts/LearningProgressContext";

interface Card {
  title: string;
  skill: string;
  imagePath: string;
  description: string;
  color: string;
  url: string;
  moduleType: ModuleType;
}

const cards: Card[] = [
  {
    title: "Word Power",
    skill: "Vocabulary",
    imagePath: "/art/vocabulary.png",
    description:
      "Palawakin ang talasalitaan sa pamamagitan ng mabilis at interaktibong pagsasanay.",
    color: "bg-yellow-100",
    url: "/vocabulary",
    moduleType: "vocabulary",
  },
  {
    title: "Grammar Mastery",
    skill: "Grammar Accuracy",
    imagePath: "/art/grammar.png",
    description:
      "Sanayin ang tamang anyo at gamit ng salita para sa mas malinaw na pagsulat.",
    color: "bg-green-100",
    url: "/grammar",
    moduleType: "grammar",
  },
  {
    title: "Build-a-Sentence",
    skill: "Sentence Construction",
    imagePath: "/art/sentence-construction.png",
    description:
      "Ayusin at buuin ang mga pangungusap para sa mas mahusay na pag-unawa at pagpapahayag.",
    color: "bg-blue-100",
    url: "/sentence-construction",
    moduleType: "sentence-construction",
  },
  {
    title: "Read & Understand",
    skill: "Reading Comprehension",
    imagePath: "/art/reading-comprehension.png",
    description:
      "Basahin ang maiikling teksto at sagutin ang tanong para hasain ang comprehension skills.",
    color: "bg-purple-100",
    url: "/reading-comprehension",
    moduleType: "reading-comprehension",
  },
];

function AnalyticsPanelSkeleton({ tab }: { tab: "progress" | "skills" }) {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* Title */}
      <div className="space-y-2">
        <div className="h-6 w-40 bg-gray-200 rounded" />
        <div className="h-3 w-64 bg-gray-200 rounded" />
      </div>

      {/* Quick stats (2 cards) */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="bg-gray-100 border border-gray-200 rounded-lg p-3"
          >
            <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
            <div className="h-7 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Main list */}
      <div className="space-y-3">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-4 w-10 bg-gray-200 rounded" />
            </div>
            <div className="h-2 w-full bg-gray-200 rounded" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-gray-200 rounded" />
              <div className="h-5 w-16 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Skills tab gets a slightly different feel (extra blocks) */}
      {tab === "skills" && (
        <div className="space-y-3">
          <div className="h-4 w-28 bg-gray-200 rounded" />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-36 bg-gray-200 rounded" />
                <div className="h-6 w-12 bg-gray-200 rounded-full" />
              </div>
              <div className="h-2 w-full bg-gray-200 rounded" />
              <div className="h-3 w-56 bg-gray-200 rounded" />
              <div className="h-3 w-44 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"progress" | "skills">("progress");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const { user, isLoading: authLoading } = useAuthGuard();
  const { isLoading: progressLoading, error: progressError } =
    useLearningProgress();

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (authLoading) {
    return (
      <div className="h-screen bg-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="flex m-0 w-full h-screen flex-col">
      {/* Header */}
      <Header />

      <div className="relative min-h-screen mx-2 pt-18 md:pt-20 pb-2 flex flex-row justify-center items-center gap-2">
        {/* Left Side - Module Cards */}
        {/* dynamic border color depends on active carousel card */}
        <div
          className={`${
            isPanelOpen ? "hidden lg:flex" : "flex"
          } flex-col flex-[2] h-full bg-white rounded-2xl overflow-hidden border-7 ${(() => {
            const map: Record<string, string> = {
              vocabulary: "border-yellow-300",
              grammar: "border-green-300",
              "sentence-construction": "border-blue-300",
              "reading-comprehension": "border-purple-300",
            };
            const moduleType = cards[carouselIndex]?.moduleType || "vocabulary";
            return map[moduleType] ?? "border-blue-300";
          })()}`}
        >
          {progressLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 font-xs">
                  Loading your learning path...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-auto z-30 bg-white md:mx-3 md:mt-3 px-3 pt-3 flex-shrink-0">
                <RecommendedPathIndicator
                  activeModule={cards[carouselIndex]?.moduleType}
                />
              </div>
              {/* Give carousel a minimum height on mobile */}
              <div className="flex-1 min-h-[280px] sm:min-h-[520px] md:min-h-[400px]">
                <CardCarousel
                  skill_cards={cards}
                  onIndexChange={setCarouselIndex}
                />
              </div>
            </>
          )}
        </div>

        {/* Toggle Button for Mobile */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="lg:hidden fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all"
          aria-label="Toggle analytics panel"
        >
          {isPanelOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>

        {/* Right Side - Analytics Panel */}
        <AnimatePresence>
          {(isPanelOpen || isDesktop) && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`${
                isPanelOpen ? "fixed inset-0 z-40 pt-18" : "hidden lg:flex"
              } lg:relative lg:flex flex-1 flex-col h-full rounded-2xl`}
            >
              {/* Overlay for mobile */}
              {isPanelOpen && (
                <div
                  onClick={() => setIsPanelOpen(false)}
                  className="lg:hidden absolute inset-0 bg-black/50 -z-10"
                />
              )}

              <div className="flex flex-col h-full bg-gray-200 lg:bg-transparent rounded-2xl p-2 lg:p-0">
                {/* Tab Headers */}
                <div className="flex w-full h-12 flex-row items-center">
                  <button
                    onClick={() => setActiveTab("progress")}
                    className={`flex w-[55%] mr-[-5px] h-full font-semibold text-xs p-3 text-center items-center justify-center rounded-tl-2xl rounded-tr-4xl transition-all border-t border-x border-gray-300 ${
                      activeTab === "progress"
                        ? "z-10 bg-white"
                        : "bg-gray-300 text-gray-600 shadow-[inset_0_-8px_12px_-8px_rgba(0,0,0,0.15)]"
                    }`}
                  >
                    Progress Tracker
                  </button>
                  <button
                    onClick={() => setActiveTab("skills")}
                    className={`flex w-[55%] ml-[-5px] h-full font-semibold text-xs p-3 text-center items-center justify-center rounded-tr-2xl rounded-tl-4xl transition-all border-t border-x border-gray-300 ${
                      activeTab === "skills"
                        ? "z-10 bg-white"
                        : "bg-gray-300 text-gray-600 shadow-[inset_0_-8px_12px_-8px_rgba(0,0,0,0.15)]"
                    }`}
                  >
                    Skill Analysis
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex w-full flex-1 bg-white rounded-b-2xl p-5 overflow-y-auto scrollbar-hide border-b border-x border-gray-300">
                  {progressLoading ? (
                    <AnalyticsPanelSkeleton tab={activeTab} />
                  ) : progressError ? (
                    <div className="w-full">
                      <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-4 text-sm">
                        <p className="font-semibold mb-1">
                          Unable to load analytics
                        </p>
                        <p className="opacity-90">{progressError}</p>
                      </div>
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      {activeTab === "progress" ? (
                        <motion.div
                          key="progress"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="w-full"
                        >
                          <ProgressOverview />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="skills"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="w-full"
                        >
                          <SkillAnalysis />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
