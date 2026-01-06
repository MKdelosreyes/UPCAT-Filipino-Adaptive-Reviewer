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

      // Only count QUIZ exercises (exclude lessons)
      const quizExercises = exercises.filter(
        (ex) => !isLessonExercise(module, ex)
      );

      // Count completed QUIZ exercises only
      let completedQuizzes = 0;
      const scores: number[] = [];

      if (module === "vocabulary") {
        const vocab = moduleData as VocabularyProgress;
        if (vocab.quiz.status === "completed") completedQuizzes++;
        if (vocab.antonym.status === "completed") completedQuizzes++;

        if (vocab.quiz.score !== null) scores.push(vocab.quiz.score);
        if (vocab.antonym.score !== null) scores.push(vocab.antonym.score);
      } else if (module === "grammar") {
        const grammar = moduleData as GrammarProgress;
        if (grammar["error-identification"].status === "completed")
          completedQuizzes++;
        if (grammar["fill-blanks"].status === "completed") completedQuizzes++;

        if (grammar["error-identification"].score !== null)
          scores.push(grammar["error-identification"].score);
        if (grammar["fill-blanks"].score !== null)
          scores.push(grammar["fill-blanks"].score);
      } else if (module === "sentence-construction") {
        const sentence = moduleData as SentenceProgress;
        if (sentence["complete-sentence"].status === "completed")
          completedQuizzes++;
        if (sentence["sentence-ordering"].status === "completed")
          completedQuizzes++;

        if (sentence["complete-sentence"].score !== null)
          scores.push(sentence["complete-sentence"].score);
        if (sentence["sentence-ordering"].score !== null)
          scores.push(sentence["sentence-ordering"].score);
      } else if (module === "reading-comprehension") {
        const reading = moduleData as ReadingProgress;
        if (reading["passage-questions"].status === "completed")
          completedQuizzes++;
        if (reading.comprehension.status === "completed") completedQuizzes++;

        if (reading["passage-questions"].score !== null)
          scores.push(reading["passage-questions"].score);
        if (reading.comprehension.score !== null)
          scores.push(reading.comprehension.score);
      }

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
        .filter((ex) => !isLessonExercise(module, ex))
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
        completedExercises: completedQuizzes,
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

  // Analyze skill areas - only use quiz exercises
  const skillAreas = useMemo((): SkillArea[] => {
    const skills: SkillArea[] = [];

    // Vocabulary skills - only count quiz exercises
    const vocabData = progress.vocabulary;
    const vocabScores = [vocabData.quiz.score, vocabData.antonym.score].filter(
      (s): s is number => s !== null
    );
    const vocabAvg =
      vocabScores.length > 0
        ? vocabScores.reduce((a, b) => a + b, 0) / vocabScores.length
        : 0;

    const vocabCompleted = [vocabData.quiz, vocabData.antonym].filter(
      (ex) => ex.status === "completed"
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
          : "Practice more with vocabulary exercises",
        `${vocabCompleted}/2 quiz exercises completed`,
      ],
      exerciseCount: vocabCompleted,
      recentScore: vocabScores[vocabScores.length - 1] || null,
    });

    // Grammar skills - only count quiz exercises
    const grammarData = progress.grammar;
    const grammarScores = [
      grammarData["error-identification"].score,
      grammarData["fill-blanks"].score,
    ].filter((s): s is number => s !== null);
    const grammarAvg =
      grammarScores.length > 0
        ? grammarScores.reduce((a, b) => a + b, 0) / grammarScores.length
        : 0;

    const grammarCompleted = [
      grammarData["error-identification"],
      grammarData["fill-blanks"],
    ].filter((ex) => ex.status === "completed").length;

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
          : "Focus on grammar rules",
        `${grammarCompleted}/2 quiz exercises completed`,
      ],
      exerciseCount: grammarCompleted,
      recentScore: grammarScores[grammarScores.length - 1] || null,
    });

    // Sentence construction skills
    const sentenceData = progress["sentence-construction"];
    const sentenceScores = [
      sentenceData["complete-sentence"].score,
      sentenceData["sentence-ordering"].score,
    ].filter((s): s is number => s !== null);
    const sentenceAvg =
      sentenceScores.length > 0
        ? sentenceScores.reduce((a, b) => a + b, 0) / sentenceScores.length
        : 0;

    const sentenceCompleted = [
      sentenceData["complete-sentence"],
      sentenceData["sentence-ordering"],
    ].filter((ex) => ex.status === "completed").length;

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
          : "Practice building sentences",
        `${sentenceCompleted}/2 quiz exercises completed`,
      ],
      exerciseCount: sentenceCompleted,
      recentScore: sentenceScores[sentenceScores.length - 1] || null,
    });

    // Reading comprehension
    const readingData = progress["reading-comprehension"];
    const readingScores = [
      readingData["passage-questions"].score,
      readingData.comprehension.score,
    ].filter((s): s is number => s !== null);
    const readingAvg =
      readingScores.length > 0
        ? readingScores.reduce((a, b) => a + b, 0) / readingScores.length
        : 0;

    const readingCompleted = [
      readingData["passage-questions"],
      readingData.comprehension,
    ].filter((ex) => ex.status === "completed").length;

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
          : "Practice reading more passages",
        `${readingCompleted}/2 quiz exercises completed`,
      ],
      exerciseCount: readingCompleted,
      recentScore: readingScores[readingScores.length - 1] || null,
    });

    return skills.sort((a, b) => b.strength - a.strength);
  }, [progress]);

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
      current: daysDiff === 0 ? 1 : 0,
      longest: 1,
      lastStudyDate: allDates[0].toISOString(),
    };
  }, [progress]);

  // Analyze learning patterns - only from quiz exercises
  const learningPatterns = useMemo((): LearningPattern => {
    const modules: ModuleType[] = [
      "vocabulary",
      "grammar",
      "sentence-construction",
      "reading-comprehension",
    ];

    // Only get history from quiz exercises
    const allHistory = modules.flatMap((module) => {
      const exercises = getModuleExercises(module).filter(
        (ex) => !isLessonExercise(module, ex)
      );
      return exercises.flatMap((ex) => getPerformanceHistory(module, ex));
    });

    const averageAccuracy =
      allHistory.length > 0
        ? Math.round(
            allHistory.reduce((sum, h) => sum + h.score, 0) / allHistory.length
          )
        : 0;

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

    const strongAreas: string[] = [];
    // adding optional chaining to safely check strength
    if (
      (skillAreas.find((s) => s.skill === "Word Recognition")?.strength ?? 0) >=
      75
    ) {
      strongAreas.push("Vocabulary");
    }
    if (
      (skillAreas.find((s) => s.skill === "Grammar Accuracy")?.strength ?? 0) >=
      75
    ) {
      strongAreas.push("Grammar");
    }
    if (
      (skillAreas.find((s) => s.skill === "Sentence Building")?.strength ??
        0) >= 75
    ) {
      strongAreas.push("Sentence Construction");
    }
    if (
      (skillAreas.find((s) => s.skill === "Reading Understanding")?.strength ??
        0) >= 75
    ) {
      strongAreas.push("Reading Comprehension");
    }

    // Count total attempts from quiz exercises only
    let totalAttempts = 0;
    if (progress.vocabulary.quiz)
      totalAttempts += progress.vocabulary.quiz.attempts;
    if (progress.vocabulary.antonym)
      totalAttempts += progress.vocabulary.antonym.attempts;
    if (progress.grammar["error-identification"])
      totalAttempts += progress.grammar["error-identification"].attempts;
    if (progress.grammar["fill-blanks"])
      totalAttempts += progress.grammar["fill-blanks"].attempts;
    if (progress["sentence-construction"]["complete-sentence"])
      totalAttempts +=
        progress["sentence-construction"]["complete-sentence"].attempts;
    if (progress["sentence-construction"]["sentence-ordering"])
      totalAttempts +=
        progress["sentence-construction"]["sentence-ordering"].attempts;
    if (progress["reading-comprehension"]["passage-questions"])
      totalAttempts +=
        progress["reading-comprehension"]["passage-questions"].attempts;
    if (progress["reading-comprehension"].comprehension)
      totalAttempts += progress["reading-comprehension"].comprehension.attempts;

    const daysSinceStart = 30;
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
