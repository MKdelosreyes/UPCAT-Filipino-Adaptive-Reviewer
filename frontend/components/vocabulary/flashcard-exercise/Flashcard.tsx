"use client";

import { motion } from "framer-motion";
import { Volume2, Sparkles, BookmarkCheck, BookmarkPlus } from "lucide-react";
import { useState } from "react";
import { redefineWord } from "@/lib/api/ai-service";

interface FlashcardProps {
  word: string;
  meaning: string;
  example: string;
  isFlipped: boolean;
  onFlip: () => void;
  wordId: string;
}

interface ParsedEnhancedContent {
  easyDefinition: string;
  formalDefinition: string;
  bilingualGloss: string;
  examples: string[];
}

export default function Flashcard({
  word,
  meaning,
  example,
  isFlipped,
  onFlip,
  wordId,
}: FlashcardProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [enhancedContent, setEnhancedContent] =
    useState<ParsedEnhancedContent | null>(null);
  const [enhancedRaw, setEnhancedRaw] = useState<string | null>(null);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);
  const [enhancementError, setEnhancementError] = useState<string | null>(null);

  const handleFlip = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      onFlip();
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fil-PH";
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const cleanText = (text: string): string => {
    return text.replace(/\*\*/g, "").trim();
  };

  const parseEnhancedContent = (content: string): ParsedEnhancedContent => {
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    let easyDefinition = "";
    let formalDefinition = "";
    let bilingualGloss = "";
    let examples: string[] = [];

    const takeAfterColon = (line: string) => {
      const idx = line.indexOf(":");
      return idx >= 0 ? cleanText(line.slice(idx + 1)) : "";
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (/^easy definition\s*:/i.test(line)) {
        easyDefinition = takeAfterColon(line);
        continue;
      }

      if (
        /^(brief\s+formal\s+definition|formal\s+definition)\s*:/i.test(line)
      ) {
        formalDefinition = takeAfterColon(line);
        continue;
      }

      if (/^bilingual gloss\s*:/i.test(line)) {
        bilingualGloss = takeAfterColon(line);
        continue;
      }

      if (/^example sentences\s*:/i.test(line)) {
        // Collect numbered examples on subsequent lines: "1. ..." "2. ..."
        for (let j = i + 1; j < lines.length; j++) {
          const exLine = lines[j];
          const m = exLine.match(/^\d+\.\s*(.+)$/);
          if (m) {
            examples.push(cleanText(m[1]));
            continue;
          }
          // stop when we hit a new labeled section
          if (/^[A-Za-z][A-Za-z\s]+:\s*/.test(exLine)) break;
        }
      }
    }

    return { easyDefinition, formalDefinition, bilingualGloss, examples };
  };

  const handleImproveDefinition = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingEnhanced(true);
    setEnhancementError(null);

    try {
      console.log("🔄 Requesting enhanced definition from AI service...");

      // Call AI service directly
      const response = await redefineWord({
        word,
        baseMeaning: meaning,
        example,
      });

      console.log("✅ Enhanced definition received");

      const raw = response.content || "";
      setEnhancedRaw(raw);

      if (!raw.trim()) {
        setEnhancementError("No response from AI service. Please try again.");
        return;
      }

      const parsed = parseEnhancedContent(raw);

      const isEmptyParsed =
        !parsed.easyDefinition &&
        !parsed.formalDefinition &&
        !parsed.bilingualGloss &&
        parsed.examples.length === 0;

      if (isEmptyParsed) {
        // Keep raw so user still sees something instead of a blank card
        setEnhancementError(
          "AI response received but could not be parsed. Showing raw output.",
        );
      }

      setEnhancedContent(parsed);
    } catch (error) {
      console.error("❌ Failed to fetch enhanced definition:", error);
      setEnhancementError(
        error instanceof Error
          ? error.message
          : "Failed to enhance definition. Please try again.",
      );
    } finally {
      setIsLoadingEnhanced(false);
    }
  };

  return (
    <div className="perspective-1000 w-full h-full max-w-3xl mx-auto flex items-center justify-center">
      <motion.div
        className="relative w-full h-[450px] md:h-full md:max-h-[600px] cursor-pointer"
        onClick={handleFlip}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front Side - Word */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
          }}
        >
          <div className="w-full h-full bg-yellow-100 rounded-3xl shadow-xl p-6 md:p-8 flex flex-col items-center justify-center border-4 border-yellow-300 overflow-y-auto">
            <div className="text-center space-y-4 md:space-y-6">
              <p className="text-yellow-600 text-sm md:text-base font-semibold">
                Salita / Word
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-900">
                {word}
              </h2>
            </div>
            <p className="absolute bottom-6 text-yellow-500 text-xs md:text-sm animate-pulse">
              Click to see meaning →
            </p>
          </div>
        </div>

        {/* Back Side - Meaning & Example */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="w-full h-full bg-yellow-100 rounded-3xl shadow-xl p-4 md:p-8 flex flex-col items-center justify-between border-4 border-yellow-300 overflow-y-auto scrollbar-thin scrollbar-yellow">
            <div className="text-center space-y-3 md:space-y-4 max-w-xl flex-1 flex flex-col items-center justify-center w-full">
              {enhancedContent ? (
                <div className="w-full flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm md:text-base text-yellow-600 font-semibold">
                      Enhanced Definition
                    </span>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-3 md:p-4 border-2 border-yellow-200 text-center space-y-3 md:space-y-4">
                    {enhancedContent.easyDefinition && (
                      <div>
                        <h4 className="text-xs md:text-sm font-bold text-yellow-700 mb-1">
                          Simple Definition:
                        </h4>
                        <p className="text-yellow-900 text-base md:text-base italic">
                          {enhancedContent.easyDefinition}
                        </p>
                      </div>
                    )}

                    {enhancedContent.formalDefinition && (
                      <div>
                        <p className="text-yellow-900 text-sm font-semibold md:text-base border-b border-yellow-300 pb-3">
                          {enhancedContent.formalDefinition}
                        </p>
                      </div>
                    )}

                    {enhancedContent.examples[0] && (
                      <div className="pt-2">
                        <h4 className="text-xs md:text-sm font-bold text-yellow-700 mb-2">
                          Example:
                        </h4>
                        <p className="text-sm md:text-base text-yellow-900">
                          {enhancedContent.examples[0]}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-yellow-600 text-sm md:text-base font-semibold">
                    Kahulugan / Meaning
                  </p>
                  <h3 className="text-xl md:text-3xl lg:text-3xl font-bold text-yellow-900">
                    {meaning}
                  </h3>

                  <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-yellow-300">
                    <p className="text-yellow-600 text-xs md:text-sm font-semibold mb-2">
                      Halimbawa / Example:
                    </p>
                    <p className="text-yellow-800 text-sm md:text-base lg:text-lg italic">
                      "{example}"
                    </p>
                  </div>
                </>
              )}

              {/* Error Message */}
              {enhancementError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{enhancementError}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2 w-full mt-3 md:mt-4">
              {!enhancedContent && (
                <button
                  onClick={handleImproveDefinition}
                  disabled={isLoadingEnhanced}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 bg-yellow-200 hover:bg-yellow-300 text-yellow-700 rounded-lg text-xs md:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  {isLoadingEnhanced ? "Improving..." : "Improve definition"}
                </button>
              )}

              {enhancedContent &&
                !enhancedContent.easyDefinition &&
                !enhancedContent.formalDefinition &&
                enhancedContent.examples.length === 0 &&
                enhancedRaw && (
                  <pre className="mt-3 text-left text-xs bg-yellow-50 border border-yellow-200 rounded-lg p-2 whitespace-pre-wrap">
                    {enhancedRaw}
                  </pre>
                )}

              <p className="text-yellow-500 text-xs md:text-sm animate-pulse">
                ← Click to flip back
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
