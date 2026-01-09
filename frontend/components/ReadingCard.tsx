"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, CheckCircle2 } from "lucide-react";

interface ReadingCardProps {
  name: string;
  description: string;
  imagePath: string;
  color: string;
  url: string;
  passageCount?: number;
}

export default function ReadingCard({
  name,
  description,
  imagePath,
  color,
  url,
  passageCount = 0,
}: ReadingCardProps) {
  return (
    <Link href={url} className="group block">
      <motion.div
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`relative flex flex-col items-center justify-between gap-4 p-6 border-4 border-blue-300 ${color} rounded-2xl shadow-lg hover:shadow-2xl hover:border-blue-500 transition-all duration-300 h-full min-h-[16rem]`}
      >
        {/* Badge - Top Right */}
        {passageCount > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
            <BookOpen size={14} />
            <span>{passageCount} Passages</span>
          </div>
        )}

        {/* Icon */}
        <div className="relative w-20 h-20 mt-4">
          <Image
            src={imagePath}
            alt={name}
            fill
            className="object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="text-center flex-1 flex flex-col justify-center">
          <h3 className="text-lg font-bold text-blue-900 mb-2 group-hover:text-blue-600 transition-colors">
            {name}
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {description}
          </p>
        </div>

        {/* CTA */}
        <div className="w-full">
          <div className="bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold text-center group-hover:bg-blue-700 transition-colors shadow-md">
            Start Reading
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
