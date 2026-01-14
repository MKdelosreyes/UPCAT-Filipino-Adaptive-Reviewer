import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, RotateCcw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface ReadingCompletionModalProps {
  isOpen: boolean;
  score: number;
  correctCount: number;
  totalQuestions: number;
  passageTitle: string;
  onClose: () => void;
  onRetake: () => void;
}

export default function ReadingCompletionModal({
  isOpen,
  score,
  correctCount,
  totalQuestions,
  passageTitle,
  onClose,
  onRetake,
}: ReadingCompletionModalProps) {
  const router = useRouter();

  const getPerformanceMessage = () => {
    if (score >= 90) return "Outstanding! 🌟";
    if (score >= 75) return "Great Job! 🎉";
    if (score >= 60) return "Good Effort! 👍";
    return "Keep Practicing! 💪";
  };

  const getPerformanceColor = () => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-blue-600";
    if (score >= 60) return "text-yellow-600";
    return "text-orange-600";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Trophy Icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-full"
                >
                  <Trophy className="w-16 h-16 text-white" />
                </motion.div>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-center text-blue-900 mb-2">
                Exercise Complete!
              </h2>
              <p className="text-center text-gray-600 mb-6 text-sm">
                "{passageTitle}"
              </p>

              {/* Score */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className={`text-6xl font-bold ${getPerformanceColor()} mb-2`}
                  >
                    {score}%
                  </motion.div>
                  <p className="text-lg font-semibold text-gray-700">
                    {correctCount} out of {totalQuestions} correct
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {getPerformanceMessage()}
                  </p>
                </div>
              </div>

              {/* Performance Bar */}
              <div className="mb-6">
                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className={`absolute h-full rounded-full ${
                      score >= 90
                        ? "bg-gradient-to-r from-green-500 to-emerald-600"
                        : score >= 75
                        ? "bg-gradient-to-r from-blue-500 to-blue-600"
                        : score >= 60
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                        : "bg-gradient-to-r from-orange-500 to-red-500"
                    }`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onRetake}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  Try Another Passage
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/reading-comprehension")}
                  className="w-full bg-white hover:bg-gray-50 text-blue-600 font-bold py-4 px-6 rounded-xl border-2 border-blue-600 flex items-center justify-center gap-2 transition-all"
                >
                  <Home className="w-5 h-5" />
                  Back to Reading Hub
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
