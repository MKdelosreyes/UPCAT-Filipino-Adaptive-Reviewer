"use client";

import { Check, X, Lightbulb } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface CompleteSentenceQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  incompletePhrase: string;
  correctCompletions: string[];
  onSubmit: (userCompletion: string, isCorrect: boolean) => void;
  showResult: boolean;
  isCorrect: boolean | null;
  explanation: string;
}

export default function CompleteSentenceQuestion({
  questionNumber,
  totalQuestions,
  incompletePhrase,
  correctCompletions,
  onSubmit,
  showResult,
  isCorrect,
  explanation,
}: CompleteSentenceQuestionProps) {
  const [userInput, setUserInput] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!userInput.trim()) {
      return;
    }

    const trimmedInput = userInput.trim();
    // Check if user's input matches any correct completion (case-insensitive)
    const correct = correctCompletions.some(
      (completion) =>
        completion.toLowerCase() === trimmedInput.toLowerCase()
    );

    setHasSubmitted(true);
    onSubmit(trimmedInput, correct);
  };

  const handleClear = () => {
    setUserInput("");
    setHasSubmitted(false);
  };

  const showExplanation = showResult && !isCorrect;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Instruction */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-purple-900">
          Kumpletuhin ang Pangungusap
        </h2>
        <p className="text-sm text-gray-600">
          Complete the sentence with an appropriate ending
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Input Area */}
        <motion.div
          animate={{
            flex: showExplanation ? "0 0 42%" : "1 1 100%",
          }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          <div className="space-y-6">
            {/* Incomplete Phrase Display */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-purple-900">
                  Question {questionNumber} of {totalQuestions}
                </h3>

                <div className="space-y-3">
                  <p className="text-gray-600 text-sm">
                    Complete the following sentence:
                  </p>

                  {/* Display incomplete phrase with input */}
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-lg text-gray-800">
                      <span className="font-semibold text-purple-900">
                        {incompletePhrase}
                      </span>
                    </p>
                  </div>

                  {!showResult ? (
                    <>
                      {/* Text Input for Completion */}
                      <div className="space-y-3">
                        <textarea
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          placeholder="Type your completion here..."
                          className="w-full p-4 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 resize-none bg-white"
                          rows={3}
                          disabled={showResult}
                        />
                        <button
                          onClick={handleSubmit}
                          disabled={!userInput.trim()}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md"
                        >
                          Check Answer
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Result Display */}
                      <div
                        className={`p-4 rounded-xl border-2 ${
                          isCorrect
                            ? "bg-green-50 border-green-300"
                            : "bg-red-50 border-red-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {isCorrect ? (
                              <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
                            ) : (
                              <X className="w-6 h-6 text-red-600 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 mb-1">
                              {isCorrect
                                ? "Tama! Maganda ang iyong sagot."
                                : "Hindi tama. Subukan ulit."}
                            </p>
                            <p className="text-gray-700 italic">
                              "{userInput}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {!isCorrect && (
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                          <p className="text-sm font-semibold text-purple-900 mb-2">
                            Mga Tamang Sagot:
                          </p>
                          <ul className="space-y-1">
                            {correctCompletions.map((completion, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-purple-800 flex items-center gap-2"
                              >
                                <span className="text-green-600">✓</span>
                                {completion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <button
                        onClick={handleClear}
                        className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl transition-colors"
                      >
                        Try Again
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Explanation Panel */}
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 w-full"
          >
            <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200 sticky top-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-purple-900 mb-2">
                    Paliwanag (Explanation)
                  </h4>
                  <p className="text-sm text-purple-800 leading-relaxed">
                    {explanation}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
