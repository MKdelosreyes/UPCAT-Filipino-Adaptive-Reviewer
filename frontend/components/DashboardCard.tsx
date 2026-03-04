import { motion, Variants } from "framer-motion";
import type { ReactNode } from "react";
import type { ModuleType } from "@/contexts/LearningProgressContext";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
  title: string;
  skill: string;
  description: string;
  color: string;
  href?: string;
  moduleType?: ModuleType;
  recommendationText?: string;
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
} as const;

const DashboardCard = ({
  children,
  className = "",
  title,
  skill,
  description,
  color,
  moduleType,
  recommendationText,
}: DashboardCardProps) => {
  // Get colors based on module type
  const getModuleColors = () => {
    if (!moduleType) {
      return { border: 'border-blue-300', borderHover: 'hover:border-blue-500', borderActive: 'active:border-blue-600', hoverBg: 'hover:bg-blue-50', textColor: 'text-blue-600' };
    }
    const colorMap = {
      vocabulary: { border: 'border-yellow-300', borderHover: 'hover:border-yellow-500', borderActive: 'active:border-yellow-600', hoverBg: 'hover:bg-yellow-50', textColor: 'text-yellow-600' },
      grammar: { border: 'border-green-300', borderHover: 'hover:border-green-500', borderActive: 'active:border-green-600', hoverBg: 'hover:bg-green-50', textColor: 'text-green-600' },
      'sentence-construction': { border: 'border-blue-300', borderHover: 'hover:border-blue-500', borderActive: 'active:border-blue-600', hoverBg: 'hover:bg-blue-50', textColor: 'text-blue-600' },
      'reading-comprehension': { border: 'border-purple-300', borderHover: 'hover:border-purple-500', borderActive: 'active:border-purple-600', hoverBg: 'hover:bg-purple-50', textColor: 'text-purple-600' },
    };
    return colorMap[moduleType] || colorMap.vocabulary;
  };

  // Get emoji based on module type
  const getModuleEmoji = () => {
    const emojiMap: Record<string, string> = {
      vocabulary: '📚',
      grammar: '✏️',
      'sentence-construction': '📝',
      'reading-comprehension': '📖',
    };
    return emojiMap[moduleType || 'vocabulary'] || '📚';
  };

  const moduleColors = getModuleColors();
  const emoji = getModuleEmoji();

  return (
    <div className="flex flex-col p-3 md:p-4 border border-gray-200 bg-white shadow-lg md:shadow-xl rounded-2xl md:rounded-3xl w-full">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className={`
        hidden md:flex bg-white border-4 md:border-5 ${moduleColors.border} rounded-2xl md:rounded-3xl
        p-4 md:p-6 flex flex-col h-full
        transition-all duration-300
        ${moduleColors.hoverBg} ${moduleColors.borderHover} ${moduleColors.borderActive}
        ${className}
      `}
      >
        {children}
      </motion.div>
      <div className="flex flex-col gap-2 md:gap-3 p-1.5 md:p-2">
        {/* Mobile: Show emoji */}
        <motion.div className="md:hidden flex justify-center"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <span className="text-4xl">{emoji}</span>
        </motion.div>
        {/* Mobile: Show recommendation text */}
        {recommendationText && (
          <div className="md:hidden">
            <p className={`text-xs font-medium ${moduleColors.textColor}`}>
              {recommendationText}
            </p>
          </div>
        )}
        <div
          className={`py-0.5 md:py-1 px-1.5 md:px-3 text-center text-[0.65rem] md:text-xs font-semibold ${moduleColors.textColor} ${color} rounded-full md:rounded-4xl`}
        >
          {skill}
        </div>
        <div className="text-xs md:text-xs leading-relaxed">{description}</div>
      </div>
    </div>
  );
};

export default DashboardCard;
