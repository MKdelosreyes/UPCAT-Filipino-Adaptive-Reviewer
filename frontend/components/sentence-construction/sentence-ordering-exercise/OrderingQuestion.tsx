"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Lightbulb, RotateCcw } from "lucide-react";
import { useState } from "react";
import { getExplanation } from "@/lib/api/ai-service";

interface OrderingQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  words: string[];
  correctSentence: string;
  onSubmit: (userSentence: string, isCorrect: boolean) => void;
  showResult: boolean;
  isCorrect: boolean | null;
  explanation: string;
}

export default function OrderingQuestion({
  questionNumber,
  totalQuestions,
  words,
  correctSentence,
  onSubmit,
  showResult,
  isCorrect,
  explanation,
}: OrderingQuestionProps) {
  const [availableWords, setAvailableWords] = useState<string[]>([...words]);
  const [droppedWords, setDroppedWords] = useState<(string | null)[]>(
    Array(words.length).fill(null)
  );
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const handleDragStart = (word: string) => {
    setDraggedWord(word);
  };

  const handleDrop = (boxIndex: number) => {
    if (!draggedWord) return;

    const newDroppedWords = [...droppedWords];
    const newAvailableWords = [...availableWords];

    // If box already has a word, return it to available
    if (newDroppedWords[boxIndex]) {
      newAvailableWords.push(newDroppedWords[boxIndex]!);
    }

    // Place the dragged word in the box
    newDroppedWords[boxIndex] = draggedWord;

    // Remove from available words
    const wordIndex = newAvailableWords.indexOf(draggedWord);
    if (wordIndex > -1) {
      newAvailableWords.splice(wordIndex, 1);
    }

    setDroppedWords(newDroppedWords);
    setAvailableWords(newAvailableWords);
    setDraggedWord(null);
  };

  const handleRemoveWord = (boxIndex: number) => {
    const word = droppedWords[boxIndex];
    if (!word) return;

    const newDroppedWords = [...droppedWords];
    newDroppedWords[boxIndex] = null;

    const newAvailableWords = [...availableWords, word];

    setDroppedWords(newDroppedWords);
    setAvailableWords(newAvailableWords);
  };

  const handleSubmit = () => {
    const userSentence = droppedWords.filter(w => w !== null).join(" ");
    const correct = userSentence === correctSentence;
    setHasSubmitted(true);
    onSubmit(userSentence, correct);
    
    // Fetch AI explanation if answer is wrong
    if (!correct) {
      fetchAIExplanation(userSentence);
    }
  };
  
  const fetchAIExplanation = async (userSentence: string) => {
    setLoadingExplanation(true);
    try {
      const data = await getExplanation({
        mode: "sentence-ordering",
        word: "",
        correct: correctSentence,
        selected: userSentence,
        explanation: explanation,
      });
      
      setAiExplanation(data.explanation);
    } catch (error) {
      console.error("Error fetching AI explanation:", error);
      setAiExplanation("Pasensya na, may problema sa pagkuha ng AI explanation.");
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleReset = () => {
    setAvailableWords([...words]);
    setDroppedWords(Array(words.length).fill(null));
    setHasSubmitted(false);
    setAiExplanation("");
    setLoadingExplanation(false);
  };

  const showExplanation = showResult && !isCorrect;
  const canSubmit = droppedWords.every(word => word !== null) && !hasSubmitted;

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex gap-6 items-start">
        {/* Left Panel - Instructions */}
        <div className="w-64 flex-shrink-0">
          <div className="sticky top-4">
            <h2 className="text-lg font-bold text-blue-900 mb-3">
              I-ayos ang mga salita upang makabuo ng wastong pangungusap
            </h2>
            <p className="text-sm text-gray-600">
              Drag words into the boxes to form a correct sentence
            </p>
          </div>
        </div>

        {/* Right Panel - Main Content */}
        <div className="flex-1 space-y-6">
        {/* Drop Zone - Boxes for arranging words */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-blue-900">
              Arrange the words here
            </h3>
            {!showResult && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>

          {/* Drop Boxes Container */}
          <div className="flex flex-wrap gap-2 p-4 bg-blue-50 rounded-xl border-2 border-dashed border-blue-300 min-h-[120px]">
            {droppedWords.map((word, index) => (
              <motion.div
                key={index}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => !showResult && handleDrop(index)}
                className={`relative flex items-center justify-center min-w-[100px] h-14 px-4 rounded-lg border-2 transition-all ${
                  word
                    ? showResult
                      ? isCorrect
                        ? "bg-green-100 border-green-400"
                        : "bg-amber-100 border-amber-400"
                      : "bg-white border-blue-400 shadow-sm"
                    : "bg-white/50 border-blue-200 border-dashed"
                }`}
                whileHover={!showResult && !word ? { scale: 1.05 } : {}}
              >
                {word ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{word}</span>
                    {!showResult && (
                      <button
                        onClick={() => handleRemoveWord(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-blue-400 font-medium">
                    {index + 1}
                  </span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Show result */}
          {showResult && (
            <div className="mt-4 space-y-4">
              {!isCorrect && (
                <div className="p-4 rounded-xl bg-green-50 border-2 border-green-300">
                  <p className="text-sm text-gray-600 mb-1">
                    Correct Answer:
                  </p>
                  <p className="text-lg font-medium text-green-900">
                    {correctSentence}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center gap-2">
                {isCorrect ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="w-6 h-6" />
                    <span className="font-semibold">Tama!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-700">
                    <X className="w-6 h-6" />
                    <span className="font-semibold">Mali</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Available Words - Word Bank */}
        {!showResult && availableWords.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 mb-4">
              Available Words
            </h3>
            <div className="flex flex-wrap gap-3">
              {availableWords.map((word, index) => (
                <motion.div
                  key={`${word}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(word)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-3 bg-blue-100 border-2 border-blue-300 rounded-lg cursor-move hover:bg-blue-200 hover:border-blue-400 transition-all shadow-sm"
                >
                  <span className="font-medium text-gray-900">{word}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Explanation Panel - Now appears below instead of on the right */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-100">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-blue-900">
                    AI Explanation
                  </h3>
                </div>
                
                {loadingExplanation ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-800 leading-relaxed space-y-3">
                    <p className="mb-3">
                      <span className="font-semibold text-green-700">
                        Correct Answer:
                      </span>{" "}
                      {correctSentence}
                    </p>
                    
                    {aiExplanation && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-gray-700 whitespace-pre-line">{aiExplanation}</p>
                      </div>
                    )}
                    
                    {explanation && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2 font-medium">Additional Context:</p>
                        <p className="text-gray-600 text-sm">{explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button - Only show when all boxes are filled */}
        {!showResult && availableWords.length === 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all"
          >
            Submit Answer
          </motion.button>
        )}
        </div>
      </div>
    </div>
  );
}
