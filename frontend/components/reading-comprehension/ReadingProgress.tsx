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
      <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-blue-900">Progress</span>
          <span className="text-sm text-blue-600">
            {currentQuestion + 1} / {totalQuestions}
          </span>
        </div>

        <div className="relative h-3 bg-blue-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.3 }}
            className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
