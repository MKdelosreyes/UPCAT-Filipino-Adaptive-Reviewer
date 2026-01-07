"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  Target,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const features = [
    {
      icon: Brain,
      title: "Adaptive Learning",
      description: "Personalized difficulty that grows with your skills",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Assistance",
      description: "Get intelligent explanations and personalized study tips",
      color: "bg-purple-50 text-purple-600",
    },
    {
      icon: Target,
      title: "UPCAT-Focused",
      description: "Exercises designed specifically for UPCAT Filipino section",
      color: "bg-green-50 text-green-600",
    },
    {
      icon: BookOpen,
      title: "Comprehensive Modules",
      description: "Master vocabulary, grammar, and sentence construction",
      color: "bg-yellow-50 text-yellow-600",
    },
  ];

  const stats = [
    { value: "200+", label: "Filipino Words" },
    { value: "5", label: "Practice Exercises" },
    { value: "3", label: "Core Modules" },
    { value: "AI", label: "Powered Learning" },
  ];

  if (!isClient) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-5xl mx-auto"
        >
          {/* Logo/Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg mb-8 border-2 border-blue-200"
          >
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">
              UPCAT Filipino Adaptive Reviewer
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Master Filipino Language with{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Intelligent Adaptive Learning
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Prepare for the University of the Philippines College Admission Test
            with AI-powered personalized training in vocabulary, grammar, and
            sentence construction.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Start Learning Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="flex items-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-full font-semibold text-lg shadow-md hover:shadow-lg border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
            >
              Learn More
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-md border border-gray-100"
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div
        id="features"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Our Adaptive Reviewer?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience intelligent learning that adapts to your pace and
            provides real-time feedback
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4`}
              >
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Learning Modules Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Learning Modules
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Three specialized modules designed to cover all aspects of UPCAT
            Filipino
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Vocabulary Module */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 shadow-lg border-2 border-yellow-200 hover:shadow-xl transition-all duration-300"
          >
            <div className="bg-yellow-200 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-yellow-700" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Vocabulary Mastery
            </h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Build and strengthen your Filipino vocabulary through:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span>Interactive flashcards</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span>Closest meaning quizzes</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span>Antonym identification</span>
              </li>
            </ul>
            <Link
              href="/vocabulary"
              className="inline-flex items-center gap-2 text-yellow-700 font-semibold hover:text-yellow-800 transition-colors"
            >
              Explore Vocabulary <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Grammar Module */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 shadow-lg border-2 border-green-200 hover:shadow-xl transition-all duration-300"
          >
            <div className="bg-green-200 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-green-700" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Grammar Proficiency
            </h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Master Filipino grammar rules through:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Structured lesson cards</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Error identification exercises</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Fill-in-the-blank practice</span>
              </li>
            </ul>
            <Link
              href="/grammar"
              className="inline-flex items-center gap-2 text-green-700 font-semibold hover:text-green-800 transition-colors"
            >
              Explore Grammar <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Sentence Construction Module */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-lg border-2 border-blue-200 hover:shadow-xl transition-all duration-300"
          >
            <div className="bg-blue-200 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-blue-700" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Sentence Construction
            </h3>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Develop sentence building skills through:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Drag-and-drop sentence ordering</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>AI-reviewed sentence writing</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Real-time feedback</span>
              </li>
            </ul>
            <Link
              href="/sentence-construction"
              className="inline-flex items-center gap-2 text-blue-700 font-semibold hover:text-blue-800 transition-colors"
            >
              Explore Construction <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center shadow-2xl max-w-5xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Master Filipino for UPCAT?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Start your personalized learning journey today with AI-powered
            adaptive training
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Begin Your Journey
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200">
        <div className="text-center text-gray-600 text-sm">
          <p className="mb-2">
            © 2026 UPCAT Filipino Adaptive Reviewer. Developed as part of BSCS-4
            Special Problem.
          </p>
          <p className="text-xs text-gray-500">
            An educational project to help students prepare for the University
            of the Philippines College Admission Test
          </p>
        </div>
      </footer>
    </div>
  );
}
