"use client";

import { useLearningProgress } from "@/contexts/LearningProgressContext";
import type {
  ModuleType,
  ExerciseType,
  VocabularyProgress,
  GrammarProgress,
  SentenceProgress,
  ReadingProgress,
  QuizProgress,
  LessonProgress,
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
  strength: number;
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
    isLessonExercise,
    studyStreak: contextStudyStreak,
  } = useLearningProgress();

  const hasAttempted = (quiz: QuizProgress): boolean => {
    return quiz.attempts > 0 && quiz.performanceHistory.length > 0;
  };

  const getBestRecentScore = (quiz: QuizProgress): number | null => {
    if (quiz.performanceHistory.length === 0) return null;

    // Get last 3 attempts and return the best
    const recentAttempts = quiz.performanceHistory.slice(-3);
    return Math.max(...recentAttempts.map((h) => h.score));
  };

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
      const quizExercises = exercises.filter(
        (ex) => !isLessonExercise(module, ex)
      );

      let attemptedQuizzes = 0;
      const scores: number[] = [];

      if (module === "vocabulary") {
        const vocab = moduleData as VocabularyProgress;
        if (hasAttempted(vocab.quiz)) {
          attemptedQuizzes++;
          const bestScore = getBestRecentScore(vocab.quiz);
          if (bestScore !== null) scores.push(bestScore);
        }
        if (hasAttempted(vocab.antonym)) {
          attemptedQuizzes++;
          const bestScore = getBestRecentScore(vocab.antonym);
          if (bestScore !== null) scores.push(bestScore);
        }
      } else if (module === "grammar") {
        const grammar = moduleData as GrammarProgress;
        if (hasAttempted(grammar["error-identification"])) {
          attemptedQuizzes++;
          const bestScore = getBestRecentScore(grammar["error-identification"]);
          if (bestScore !== null) scores.push(bestScore);
        }
        if (hasAttempted(grammar["fill-blanks"])) {
          attemptedQuizzes++;
          const bestScore = getBestRecentScore(grammar["fill-blanks"]);
          if (bestScore !== null) scores.push(bestScore);
        }
      } else if (module === "sentence-construction") {
        const sentence = moduleData as SentenceProgress;
        if (hasAttempted(sentence["sentence-ordering"])) {
          attemptedQuizzes++;
          const bestScore = getBestRecentScore(sentence["sentence-ordering"]);
          if (bestScore !== null) scores.push(bestScore);
        }
        if (hasAttempted(sentence["choose-sentence"])) {
          attemptedQuizzes++;
          const bestScore = getBestRecentScore(sentence["choose-sentence"]);
          if (bestScore !== null) scores.push(bestScore);
        }
      } else if (module === "reading-comprehension") {
        const reading = moduleData as ReadingProgress;
        if (hasAttempted(reading["passage-questions"])) {
          attemptedQuizzes++;
          const bestScore = getBestRecentScore(reading["passage-questions"]);
          if (bestScore !== null) scores.push(bestScore);
        }
        if (hasAttempted(reading["summary-exercise"])) {
          attemptedQuizzes++;
          const bestScore = getBestRecentScore(reading["summary-exercise"]);
          if (bestScore !== null) scores.push(bestScore);
        }
      }

      const averageScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

      let mastery: "beginner" | "intermediate" | "advanced" | "expert" =
        "beginner";
      if (moduleProgress >= 90) mastery = "expert";
      else if (moduleProgress >= 70) mastery = "advanced";
      else if (moduleProgress >= 40) mastery = "intermediate";

      const allHistory = exercises
        .filter((ex) => !isLessonExercise(module, ex))
        .flatMap((ex) => getPerformanceHistory(module, ex))
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

      let trend: "improving" | "stable" | "declining" = "stable";
      let trendValue = 0;

      if (allHistory.length >= 6) {
        const recent =
          allHistory.slice(0, 3).reduce((sum, h) => sum + h.score, 0) / 3;
        const older =
          allHistory.slice(3, 6).reduce((sum, h) => sum + h.score, 0) / 3;
        const diff = recent - older;
        trendValue = Math.round(diff);

        if (diff > 10) trend = "improving";
        else if (diff < -10) trend = "declining";
      }

      // Generate recommendation
      let recommendation = "";
      if (moduleProgress === 0) {
        recommendation = "Start practicing to begin learning";
      } else if (moduleProgress < 30) {
        recommendation = "Keep practicing to build your foundation";
      } else if (moduleProgress < 70) {
        recommendation = "Great progress! Continue practicing regularly";
      } else if (moduleProgress < 90) {
        recommendation = "Excellent work! You're nearly at mastery";
      } else {
        recommendation = "Mastered! Keep practicing to maintain skills";
      }

      const moduleInfo: Record<ModuleType, { name: string; color: string }> = {
        vocabulary: { name: "Vocabulary", color: "yellow" },
        grammar: { name: "Grammar", color: "green" },
        "sentence-construction": {
          name: "Sentence Construction",
          color: "blue",
        },
        "reading-comprehension": {
          name: "Reading Comprehension",
          color: "purple",
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
        completedExercises: attemptedQuizzes,
        totalExercises: quizExercises.length,
        averageScore,
        lastActivity: moduleData.lastAccessedAt,
        recommendation,
      };
    });
  }, [
    progress,
    getModuleProgress,
    getPerformanceHistory,
    getModuleExercises,
    isLessonExercise,
  ]);

  const skillAreas = useMemo((): SkillArea[] => {
    const skills: SkillArea[] = [];

    // Vocabulary skills
    const vocabData = progress.vocabulary;
    const vocabScores = [
      getBestRecentScore(vocabData.quiz),
      getBestRecentScore(vocabData.antonym),
    ].filter((s): s is number => s !== null);

    const vocabAvg =
      vocabScores.length > 0
        ? Math.round(
            vocabScores.reduce((a, b) => a + b, 0) / vocabScores.length
          )
        : 0;

    const vocabAttempted = [vocabData.quiz, vocabData.antonym].filter((ex) =>
      hasAttempted(ex)
    ).length;

    skills.push({
      skill: "Word Recognition",
      icon: "📚",
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
          : vocabAvg >= 50
          ? "Developing vocabulary skills"
          : vocabAttempted === 0
          ? "Start with vocabulary exercises"
          : "Practice more vocabulary exercises",
        `${vocabAttempted}/2 exercises practiced`,
      ],
      exerciseCount: vocabAttempted,
      recentScore: vocabScores[vocabScores.length - 1] || null,
    });

    // Grammar skills
    const grammarData = progress.grammar;
    const grammarScores = [
      getBestRecentScore(grammarData["error-identification"]),
      getBestRecentScore(grammarData["fill-blanks"]),
    ].filter((s): s is number => s !== null);

    const grammarAvg =
      grammarScores.length > 0
        ? Math.round(
            grammarScores.reduce((a, b) => a + b, 0) / grammarScores.length
          )
        : 0;

    const grammarAttempted = [
      grammarData["error-identification"],
      grammarData["fill-blanks"],
    ].filter((ex) => hasAttempted(ex)).length;

    skills.push({
      skill: "Grammar Accuracy",
      icon: "✍️",
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
          : grammarAvg >= 50
          ? "Improving grammar skills"
          : grammarAttempted === 0
          ? "Start with grammar exercises"
          : "Focus on grammar fundamentals",
        `${grammarAttempted}/2 exercises practiced`,
      ],
      exerciseCount: grammarAttempted,
      recentScore: grammarScores[grammarScores.length - 1] || null,
    });

    // Sentence construction skills
    const sentenceData = progress["sentence-construction"];
    const sentenceScores = [
      getBestRecentScore(sentenceData["sentence-ordering"]),
      getBestRecentScore(sentenceData["choose-sentence"]),
    ].filter((s): s is number => s !== null);

    const sentenceAvg =
      sentenceScores.length > 0
        ? Math.round(
            sentenceScores.reduce((a, b) => a + b, 0) / sentenceScores.length
          )
        : 0;

    const sentenceAttempted = [
      sentenceData["sentence-ordering"],
      sentenceData["choose-sentence"],
    ].filter((ex) => hasAttempted(ex)).length;

    skills.push({
      skill: "Sentence Building",
      icon: "🔧",
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
          : sentenceAvg >= 50
          ? "Building sentence skills"
          : sentenceAttempted === 0
          ? "Start with sentence construction"
          : "Practice sentence construction more",
        `${sentenceAttempted}/2 exercises practiced`,
      ],
      exerciseCount: sentenceAttempted,
      recentScore: sentenceScores[sentenceScores.length - 1] || null,
    });

    // Reading comprehension
    const readingData = progress["reading-comprehension"];
    const readingScores = [
      getBestRecentScore(readingData["passage-questions"]),
      getBestRecentScore(readingData["summary-exercise"]),
    ].filter((s): s is number => s !== null);

    const readingAvg =
      readingScores.length > 0
        ? Math.round(
            readingScores.reduce((a, b) => a + b, 0) / readingScores.length
          )
        : 0;

    const readingAttempted = [
      readingData["passage-questions"],
      readingData["summary-exercise"],
    ].filter((ex) => hasAttempted(ex)).length;

    skills.push({
      skill: "Reading Understanding",
      icon: "📖",
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
          : readingAvg >= 50
          ? "Developing reading skills"
          : readingAttempted === 0
          ? "Start with reading exercises"
          : "Practice reading comprehension more",
        `${readingAttempted}/2 exercises practiced`,
      ],
      exerciseCount: readingAttempted,
      recentScore: readingScores[readingScores.length - 1] || null,
    });

    return skills.sort((a, b) => b.strength - a.strength);
  }, [progress]);

  // Study streak (already correct from context)
  const studyStreak = useMemo((): StudyStreak => {
    return {
      current: contextStudyStreak.current,
      longest: contextStudyStreak.longest,
      lastStudyDate: contextStudyStreak.last_study_date,
    };
  }, [contextStudyStreak]);

  const learningPatterns = useMemo((): LearningPattern => {
    const modules: ModuleType[] = [
      "vocabulary",
      "grammar",
      "sentence-construction",
      "reading-comprehension",
    ];

    const allHistory = modules.flatMap((module) => {
      const exercises = getModuleExercises(module).filter(
        (ex) => !isLessonExercise(module, ex)
      );
      return exercises.flatMap((ex) => getPerformanceHistory(module, ex));
    });

    if (allHistory.length === 0) {
      return {
        preferredDifficulty: "easy",
        averageAccuracy: 0,
        commonMistakes: [],
        strongAreas: [],
        timeOfDay: null,
        studyFrequency: "rare",
      };
    }

    const averageAccuracy = Math.round(
      allHistory.reduce((sum, h) => sum + h.score, 0) / allHistory.length
    );

    const difficultyPerformance = {
      easy: { count: 0, totalScore: 0 },
      medium: { count: 0, totalScore: 0 },
      hard: { count: 0, totalScore: 0 },
    };

    allHistory.forEach((h) => {
      difficultyPerformance[h.difficulty].count++;
      difficultyPerformance[h.difficulty].totalScore += h.score;
    });

    // Calculate average score per difficulty
    const difficultyAvgScores = Object.entries(difficultyPerformance).map(
      ([difficulty, data]) => ({
        difficulty: difficulty as "easy" | "medium" | "hard",
        avgScore: data.count > 0 ? data.totalScore / data.count : 0,
        count: data.count,
      })
    );

    // Prefer difficulty where user performs best (score > 70) and has practiced
    const preferredDifficulty =
      difficultyAvgScores
        .filter((d) => d.count >= 3 && d.avgScore >= 70)
        .sort((a, b) => {
          if (Math.abs(a.avgScore - b.avgScore) < 5) {
            const diffOrder = { hard: 3, medium: 2, easy: 1 };
            return diffOrder[b.difficulty] - diffOrder[a.difficulty];
          }
          return b.avgScore - a.avgScore;
        })[0]?.difficulty || "easy";

    const totalMissedLowFreq = allHistory.reduce(
      (sum, h) => sum + h.missedLowFreq,
      0
    );
    const totalSimilarErrors = allHistory.reduce(
      (sum, h) => sum + h.similarChoiceErrors,
      0
    );

    const commonMistakes: string[] = [];

    const totalAttempts = allHistory.length;
    if (totalMissedLowFreq / totalAttempts > 0.3) {
      commonMistakes.push("Uncommon/rare words");
    }
    if (totalSimilarErrors / totalAttempts > 0.3) {
      commonMistakes.push("Similar-looking words");
    }
    if (averageAccuracy < 60 && totalAttempts >= 5) {
      commonMistakes.push("Core concepts need review");
    }

    const strongAreas: string[] = [];

    const wordRecognition = skillAreas.find(
      (s) => s.skill === "Word Recognition"
    );
    if (wordRecognition && wordRecognition.strength >= 75) {
      strongAreas.push("Vocabulary");
    }

    const grammarAccuracy = skillAreas.find(
      (s) => s.skill === "Grammar Accuracy"
    );
    if (grammarAccuracy && grammarAccuracy.strength >= 75) {
      strongAreas.push("Grammar");
    }

    const sentenceBuilding = skillAreas.find(
      (s) => s.skill === "Sentence Building"
    );
    if (sentenceBuilding && sentenceBuilding.strength >= 75) {
      strongAreas.push("Sentence Construction");
    }

    const readingUnderstanding = skillAreas.find(
      (s) => s.skill === "Reading Understanding"
    );
    if (readingUnderstanding && readingUnderstanding.strength >= 75) {
      strongAreas.push("Reading Comprehension");
    }

    // Calculate study frequency based on unique study days and recency
    const uniqueStudyDays = new Set(
      allHistory.map((h) => {
        const date = new Date(h.timestamp);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
    );

    const today = new Date();
    const sortedHistory = allHistory.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const mostRecentAttempt = sortedHistory[0]?.timestamp;
    const oldestAttempt = sortedHistory[sortedHistory.length - 1]?.timestamp;

    let studyFrequency: "daily" | "frequent" | "occasional" | "rare" = "rare";

    if (mostRecentAttempt && oldestAttempt) {
      const daysSinceLastStudy = Math.floor(
        (today.getTime() - new Date(mostRecentAttempt).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const totalDaysInRange = Math.max(
        1,
        Math.ceil(
          (new Date(mostRecentAttempt).getTime() -
            new Date(oldestAttempt).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      );

      const studyDaysCount = uniqueStudyDays.size;
      const studyRatio = studyDaysCount / totalDaysInRange;

      // Consider both study ratio AND recency
      if (daysSinceLastStudy > 7) {
        // Haven't studied in over a week
        studyFrequency = "rare";
      } else if (daysSinceLastStudy > 3) {
        // Haven't studied in 4-7 days
        studyFrequency = studyRatio >= 0.5 ? "occasional" : "rare";
      } else {
        // Studied within last 3 days - check consistency
        if (studyRatio >= 0.7 && studyDaysCount >= 3) {
          studyFrequency = "daily";
        } else if (studyRatio >= 0.4 && studyDaysCount >= 2) {
          studyFrequency = "frequent";
        } else if (studyDaysCount >= 1) {
          studyFrequency = "occasional";
        }
      }
    }

    return {
      preferredDifficulty,
      averageAccuracy,
      commonMistakes,
      strongAreas,
      timeOfDay: null,
      studyFrequency,
    };
  }, [
    progress,
    getPerformanceHistory,
    skillAreas,
    getModuleExercises,
    isLessonExercise,
  ]);

  return {
    moduleInsights,
    skillAreas,
    studyStreak,
    learningPatterns,
  };
}
