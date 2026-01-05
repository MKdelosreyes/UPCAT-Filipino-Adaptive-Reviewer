"use client";

import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type {
  ModuleType,
  ExerciseType,
  VocabularyProgress,
  GrammarProgress,
} from "@/contexts/LearningProgressContext";
import { useMemo } from "react";

interface ModuleInsight {
  module: ModuleType;
  name: string;
  color: string;
  progress: number;
  mastery: "beginner" | "intermediate" | "advanced" | "expert";
  trend: "improving" | "stable" | "declining";
  trendValue: number;
  completedExercises: number;
  totalExercises: number;
  averageScore: number;
  lastActivity: string | null;
  recommendation: string;
}

interface SkillArea {
  skill: string;
  icon: string;
  strength: number; // 0-100
  category: "strength" | "developing" | "needs-attention";
  insights: string[];
  exerciseCount: number;
  recentScore: number | null;
}

interface StudyStreak {
  current: number;
  longest: number;
  lastStudyDate: string | null;
}

interface LearningPattern {
  preferredDifficulty: "easy" | "medium" | "hard";
  averageAccuracy: number;
  commonMistakes: string[];
  strongAreas: string[];
  timeOfDay: "morning" | "afternoon" | "evening" | "night" | null;
  studyFrequency: "daily" | "frequent" | "occasional" | "rare";
}

export function useDashboardAnalytics() {
  const {
    progress,
    getModuleProgress,
    getPerformanceHistory,
    getModuleExercises,
  } = useLearningProgress();

  // Calculate module insights
  const moduleInsights = useMemo((): ModuleInsight[] => {
    const modules: ModuleType[] = [
      "vocabulary",
      "grammar",
      "sentence-construction",
      "reading-comprehension",
    ];

    return modules.map((module) => {
      const moduleProgress = getModuleProgress(module);
      const moduleData = progress[module];

      const exercises = getModuleExercises(module);

      // Count completed exercises
      let completed = 0;
      exercises.forEach((ex) => {
        if (module === "vocabulary" && (ex === "quiz" || ex === "antonym")) {
          if ((moduleData as VocabularyProgress)[ex].status === "completed")
            completed++;
        } else if (
          module === "grammar" &&
          (ex === "error-identification" || ex === "fill-blanks")
        ) {
          if ((moduleData as GrammarProgress)[ex].status === "completed")
            completed++;
        }
        // similar checks for other modules
      });

      // Calculate average score
      const scores: number[] = [];
      exercises.forEach((ex) => {
        if (module === "vocabulary" && (ex === "quiz" || ex === "antonym")) {
          const score = (moduleData as VocabularyProgress)[ex].score;
          if (score !== null) scores.push(score);
        } else if (
          module === "grammar" &&
          (ex === "error-identification" || ex === "fill-blanks")
        ) {
          const score = (moduleData as GrammarProgress)[ex].score;
          if (score !== null) scores.push(score);
        }
      });

      const averageScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

      // Determine mastery level
      let mastery: "beginner" | "intermediate" | "advanced" | "expert" =
        "beginner";
      if (moduleProgress >= 90) mastery = "expert";
      else if (moduleProgress >= 70) mastery = "advanced";
      else if (moduleProgress >= 40) mastery = "intermediate";

      // Calculate trend (compare recent vs older performance)
      const allHistory = exercises
        .flatMap((ex) => getPerformanceHistory(module, ex))
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

      let trend: "improving" | "stable" | "declining" = "stable";
      let trendValue = 0;

      if (allHistory.length >= 4) {
        const recent =
          allHistory.slice(0, 2).reduce((sum, h) => sum + h.score, 0) / 2;
        const older =
          allHistory.slice(2, 4).reduce((sum, h) => sum + h.score, 0) / 2;
        const diff = recent - older;
        trendValue = Math.round(diff);

        if (diff > 5) trend = "improving";
        else if (diff < -5) trend = "declining";
      }

      // Generate recommendation
      let recommendation = "";
      if (moduleProgress === 0) {
        recommendation = "Start with the first exercise to begin learning";
      } else if (moduleProgress < 30) {
        recommendation = "Keep practicing to build your foundation";
      } else if (moduleProgress < 70) {
        recommendation = "Great progress! Continue to master this module";
      } else if (moduleProgress < 100) {
        recommendation = "Almost there! Complete remaining exercises";
      } else {
        recommendation = "Completed! Review regularly to maintain mastery";
      }

      // Module names and colors
      const moduleInfo: Record<ModuleType, { name: string; color: string }> = {
        vocabulary: { name: "Vocabulary", color: "yellow" },
        grammar: { name: "Grammar", color: "green" },
        "sentence-construction": {
          name: "Sentence Construction",
          color: "blue",
        },
        "reading-comprehension": {
          name: "Reading Comprehension",
          color: "pink",
        },
      };

      return {
        module,
        name: moduleInfo[module].name,
        color: moduleInfo[module].color,
        progress: moduleProgress,
        mastery,
        trend,
        trendValue,
        completedExercises: completed,
        totalExercises: exercises.length,
        averageScore,
        lastActivity: moduleData.lastAccessedAt,
        recommendation,
      };
    });
  }, [progress, getModuleProgress, getPerformanceHistory, getModuleExercises]);

  // Analyze skill areas
  const skillAreas = useMemo((): SkillArea[] => {
    const skills: SkillArea[] = [];

    // Vocabulary skills
    const vocabData = progress.vocabulary;
    const vocabScores = [vocabData.quiz.score, vocabData.antonym.score].filter(
      (s): s is number => s !== null
    );
    const vocabAvg =
      vocabScores.length > 0
        ? vocabScores.reduce((a, b) => a + b, 0) / vocabScores.length
        : 0;

    skills.push({
      skill: "Word Recognition",
      icon: "", //📚
      strength: vocabAvg,
      category:
        vocabAvg >= 75
          ? "strength"
          : vocabAvg >= 50
          ? "developing"
          : "needs-attention",
      insights: [
        vocabAvg >= 75
          ? "Strong vocabulary foundation"
          : "Practice more with vocabulary exercises",
        `${
          vocabData.quiz.attempts + vocabData.antonym.attempts
        } attempts completed`,
      ],
      exerciseCount: [vocabData.quiz, vocabData.antonym].filter(
        (ex) => ex.status === "completed"
      ).length,
      recentScore: vocabScores[vocabScores.length - 1] || null,
    });

    // Grammar skills
    const grammarData = progress.grammar;
    const grammarScores = [
      grammarData["error-identification"].score,
      grammarData["fill-blanks"].score,
    ].filter((s): s is number => s !== null);
    const grammarAvg =
      grammarScores.length > 0
        ? grammarScores.reduce((a, b) => a + b, 0) / grammarScores.length
        : 0;

    skills.push({
      skill: "Grammar Accuracy",
      icon: "", // ✍️
      strength: grammarAvg,
      category:
        grammarAvg >= 75
          ? "strength"
          : grammarAvg >= 50
          ? "developing"
          : "needs-attention",
      insights: [
        grammarAvg >= 75
          ? "Excellent grammar understanding"
          : "Focus on grammar rules",
        `${
          grammarData["error-identification"].attempts +
          grammarData["fill-blanks"].attempts
        } attempts completed`,
      ],
      exerciseCount: [
        grammarData["error-identification"],
        grammarData["fill-blanks"],
      ].filter((ex) => ex.status === "completed").length,
      recentScore: grammarScores[grammarScores.length - 1] || null,
    });

    // Sentence construction skills
    const sentenceData = progress["sentence-construction"];
    const sentenceScores = [
      sentenceData.flashcards?.score,
      sentenceData.quiz?.score,
    ].filter((s): s is number => s !== null);
    const sentenceAvg =
      sentenceScores.length > 0
        ? sentenceScores.reduce((a, b) => a + b, 0) / sentenceScores.length
        : 0;

    skills.push({
      skill: "Sentence Building",
      icon: "", // 🔧
      strength: sentenceAvg,
      category:
        sentenceAvg >= 75
          ? "strength"
          : sentenceAvg >= 50
          ? "developing"
          : "needs-attention",
      insights: [
        sentenceAvg >= 75
          ? "Great sentence construction skills"
          : "Practice building sentences",
        `Progress: ${getModuleProgress("sentence-construction")}%`,
      ],
      exerciseCount: [sentenceData.flashcards, sentenceData.quiz].filter(
        (ex) => ex?.status === "completed"
      ).length,
      recentScore: sentenceScores[sentenceScores.length - 1] || null,
    });

    // Reading comprehension
    const readingData = progress["reading-comprehension"];
    const readingScores = [
      readingData.flashcards?.score,
      readingData.quiz?.score,
    ].filter((s): s is number => s !== null);
    const readingAvg =
      readingScores.length > 0
        ? readingScores.reduce((a, b) => a + b, 0) / readingScores.length
        : 0;

    skills.push({
      skill: "Reading Understanding",
      icon: "", //📖
      strength: readingAvg,
      category:
        readingAvg >= 75
          ? "strength"
          : readingAvg >= 50
          ? "developing"
          : "needs-attention",
      insights: [
        readingAvg >= 75
          ? "Excellent comprehension skills"
          : "Practice reading more passages",
        `Progress: ${getModuleProgress("reading-comprehension")}%`,
      ],
      exerciseCount: [readingData.flashcards, readingData.quiz].filter(
        (ex) => ex?.status === "completed"
      ).length,
      recentScore: readingScores[readingScores.length - 1] || null,
    });

    return skills.sort((a, b) => b.strength - a.strength);
  }, [progress, getModuleProgress]);

  // Calculate study streak
  const studyStreak = useMemo((): StudyStreak => {
    const modules: ModuleType[] = [
      "vocabulary",
      "grammar",
      "sentence-construction",
      "reading-comprehension",
    ];
    const allDates = modules
      .map((module) => progress[module].lastAccessedAt)
      .filter((date): date is string => date !== null)
      .map((date) => new Date(date))
      .sort((a, b) => b.getTime() - a.getTime());

    if (allDates.length === 0) {
      return { current: 0, longest: 0, lastStudyDate: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastStudy = allDates[0];
    lastStudy.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      current: daysDiff === 0 ? 1 : 0, // Simplified - you can implement full streak tracking
      longest: 1, // Would need to track in backend
      lastStudyDate: allDates[0].toISOString(),
    };
  }, [progress]);

  // Analyze learning patterns
  const learningPatterns = useMemo((): LearningPattern => {
    const modules: ModuleType[] = [
      "vocabulary",
      "grammar",
      "sentence-construction",
      "reading-comprehension",
    ];
    const allHistory = modules.flatMap((module) => {
      const exercises = Object.keys(progress[module]).filter(
        (key) => key !== "lastAccessedAt"
      ) as ExerciseType[];
      return exercises.flatMap((ex) => getPerformanceHistory(module, ex));
    });

    // Calculate average accuracy
    const averageAccuracy =
      allHistory.length > 0
        ? Math.round(
            allHistory.reduce((sum, h) => sum + h.score, 0) / allHistory.length
          )
        : 0;

    // Determine preferred difficulty
    const difficultyCount = {
      easy: allHistory.filter((h) => h.difficulty === "easy").length,
      medium: allHistory.filter((h) => h.difficulty === "medium").length,
      hard: allHistory.filter((h) => h.difficulty === "hard").length,
    };
    const preferredDifficulty =
      (Object.entries(difficultyCount).sort(([, a], [, b]) => b - a)[0]?.[0] as
        | "easy"
        | "medium"
        | "hard") || "easy";

    // Identify common mistakes (from performance metrics)
    const totalMissedLowFreq = allHistory.reduce(
      (sum, h) => sum + h.missedLowFreq,
      0
    );
    const totalSimilarErrors = allHistory.reduce(
      (sum, h) => sum + h.similarChoiceErrors,
      0
    );

    const commonMistakes: string[] = [];
    if (totalMissedLowFreq > 5) commonMistakes.push("Uncommon/rare words");
    if (totalSimilarErrors > 5) commonMistakes.push("Similar-looking words");
    if (averageAccuracy < 60) commonMistakes.push("Core concepts");

    // Identify strong areas
    const strongAreas: string[] = [];
    if (
      skillAreas.find((s) => s.skill === "Word Recognition")?.strength >= 75
    ) {
      strongAreas.push("Vocabulary");
    }
    if (
      skillAreas.find((s) => s.skill === "Grammar Accuracy")?.strength >= 75
    ) {
      strongAreas.push("Grammar");
    }

    // Study frequency
    const daysSinceStart = 30; // You can calculate from first attempt
    const totalAttempts = modules.reduce((sum, module) => {
      const exercises = Object.keys(progress[module]).filter(
        (key) => key !== "lastAccessedAt"
      ) as ExerciseType[];
      return (
        sum +
        exercises.reduce((s, ex) => s + (progress[module][ex].attempts || 0), 0)
      );
    }, 0);

    let studyFrequency: "daily" | "frequent" | "occasional" | "rare" = "rare";
    const attemptsPerDay = totalAttempts / daysSinceStart;
    if (attemptsPerDay >= 1) studyFrequency = "daily";
    else if (attemptsPerDay >= 0.5) studyFrequency = "frequent";
    else if (attemptsPerDay >= 0.2) studyFrequency = "occasional";

    return {
      preferredDifficulty,
      averageAccuracy,
      commonMistakes,
      strongAreas,
      timeOfDay: null, // Would need timestamp tracking
      studyFrequency,
    };
  }, [progress, getPerformanceHistory, skillAreas]);

  return {
    moduleInsights,
    skillAreas,
    studyStreak,
    learningPatterns,
  };
}
