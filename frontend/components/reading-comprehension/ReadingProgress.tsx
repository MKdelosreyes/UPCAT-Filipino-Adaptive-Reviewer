import { motion } from "framer-motion";

interface ReadingProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  answers: (boolean | null)[];
}

export default function ReadingProgress({
  currentQuestion,
  totalQuestions,
  answers,
}: ReadingProgressProps) {
  const progressPercentage = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-purple-900">Progress</span>
          <span className="text-sm text-purple-600">
            {currentQuestion + 1} / {totalQuestions}
          </span>
        </div>

        <div className="relative h-3 bg-purple-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3 }}
            className="absolute h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
