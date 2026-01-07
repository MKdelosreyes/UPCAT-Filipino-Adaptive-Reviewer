import { motion, Variants } from "framer-motion";
import type { ReactNode } from "react";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
  title: string;
  skill: string;
  description: string;
  color: string;
  href?: string;
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
}: DashboardCardProps) => {
  return (
    <div className="flex flex-col p-3 md:p-4 border border-gray-200 bg-white shadow-lg md:shadow-xl rounded-2xl md:rounded-3xl w-full">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className={`
        bg-white border-4 md:border-5 border-blue-300 rounded-2xl md:rounded-3xl
        p-4 md:p-6 flex flex-col h-full
        transition-all duration-300
        hover:bg-blue-50 hover:border-blue-500 active:border-blue-600
        ${className}
      `}
      >
        {children}
      </motion.div>
      <div className="flex flex-col gap-2 md:gap-3 p-1.5 md:p-2">
        <div
          className={`py-0.5 md:py-1 w-fit px-2 md:px-3 text-center text-xs font-semibold text-blue-600 ${color} rounded-full md:rounded-4xl`}
        >
          {skill}
        </div>
        <div className="text-xs md:text-xs leading-relaxed">{description}</div>
      </div>
    </div>
  );
};

export default DashboardCard;
