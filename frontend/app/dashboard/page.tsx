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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"progress" | "skills">("progress");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { user, isLoading: authLoading } = useAuthGuard();
  const { isLoading: progressLoading } = useLearningProgress();

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
        <div
          className={`${
            isPanelOpen ? "hidden lg:flex" : "flex"
          } flex-col flex-[2] h-full bg-white rounded-2xl overflow-hidden border-7 border-blue-300`}
        >
          {progressLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">
                  Loading your learning path...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-auto z-30 bg-white md:mx-3 md:mt-3 px-3 pt-3">
                <RecommendedPathIndicator />
              </div>
              <CardCarousel skill_cards={cards} />
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
                    className={`flex w-[50%] mr-[-5px] h-full font-semibold text-xs p-3 text-center items-center justify-center rounded-tl-2xl rounded-tr-4xl transition-all border-t border-x border-gray-300 ${
                      activeTab === "progress"
                        ? "z-10 bg-white"
                        : "bg-gray-300 text-gray-600 shadow-[inset_0_-8px_12px_-8px_rgba(0,0,0,0.15)]"
                    }`}
                  >
                    Progress Tracker
                  </button>
                  <button
                    onClick={() => setActiveTab("skills")}
                    className={`flex w-[50%] ml-[-5px] h-full font-semibold text-xs p-3 text-center items-center justify-center rounded-tr-2xl rounded-tl-4xl transition-all border-t border-x border-gray-300 ${
                      activeTab === "skills"
                        ? "z-10 bg-white"
                        : "bg-gray-300 text-gray-600 shadow-[inset_0_-8px_12px_-8px_rgba(0,0,0,0.15)]"
                    }`}
                  >
                    Skill Analysis
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex w-full flex-1 bg-white rounded-b-2xl p-5 overflow-y-auto border-b border-x border-gray-300 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {progressLoading ? (
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
                        <p className="text-gray-600 text-sm font-medium">
                          Loading analytics...
                        </p>
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
