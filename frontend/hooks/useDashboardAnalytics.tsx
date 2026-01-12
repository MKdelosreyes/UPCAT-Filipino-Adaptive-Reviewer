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

  // Check if quiz has been attempted
  const hasAttempted = (quiz: QuizProgress): boolean => {
    return quiz.attempts > 0 || quiz.performanceHistory.length > 0;
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

      // Only count QUIZ exercises (exclude lessons)
      const quizExercises = exercises.filter(
        (ex) => !isLessonExercise(module, ex)
      );

      // Count attempted QUIZ exercises
      let attemptedQuizzes = 0;
      const scores: number[] = [];

      if (module === "vocabulary") {
        const vocab = moduleData as VocabularyProgress;
        // Check attempts
        if (hasAttempted(vocab.quiz)) {
          attemptedQuizzes++;
          if (vocab.quiz.score !== null) scores.push(vocab.quiz.score);
        }
        if (hasAttempted(vocab.antonym)) {
          attemptedQuizzes++;
          if (vocab.antonym.score !== null) scores.push(vocab.antonym.score);
        }
      } else if (module === "grammar") {
        const grammar = moduleData as GrammarProgress;
        if (hasAttempted(grammar["error-identification"])) {
          attemptedQuizzes++;
          if (grammar["error-identification"].score !== null)
            scores.push(grammar["error-identification"].score);
        }
        if (hasAttempted(grammar["fill-blanks"])) {
          attemptedQuizzes++;
          if (grammar["fill-blanks"].score !== null)
            scores.push(grammar["fill-blanks"].score);
        }
      } else if (module === "sentence-construction") {
        const sentence = moduleData as SentenceProgress;

        if (hasAttempted(sentence["complete-sentence"])) {
          attemptedQuizzes++;
          if (sentence["complete-sentence"].score !== null)
            scores.push(sentence["complete-sentence"].score);
        }
        if (hasAttempted(sentence["sentence-ordering"])) {
          attemptedQuizzes++;
          if (sentence["sentence-ordering"].score !== null)
            scores.push(sentence["sentence-ordering"].score);
        }
        if (hasAttempted(sentence["choose-sentence"])) {
          attemptedQuizzes++;
          if (sentence["choose-sentence"].score !== null)
            scores.push(sentence["choose-sentence"].score);
        }
      } else if (module === "reading-comprehension") {
        const reading = moduleData as ReadingProgress;
        if (reading["passage-questions"].status === "completed")
          completedQuizzes++;
        if (reading["summary-exercise"].status === "completed") completedQuizzes++;

        if (reading["passage-questions"].score !== null)
          scores.push(reading["passage-questions"].score);
        if (reading["summary-exercise"].score !== null)
          scores.push(reading["summary-exercise"].score);
      }

      const averageScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

      // Determine mastery level based on module progress (mastery score)
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

  // Analyze skill areas - only use quiz exercises
  const skillAreas = useMemo((): SkillArea[] => {
    const skills: SkillArea[] = [];

    // Vocabulary skills - check attempts
    const vocabData = progress.vocabulary;
    const vocabScores = [vocabData.quiz.score, vocabData.antonym.score].filter(
      (s): s is number => s !== null
    );
    const vocabAvg =
      vocabScores.length > 0
        ? vocabScores.reduce((a, b) => a + b, 0) / vocabScores.length
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
          : "Practice more vocabulary exercises",
        `${vocabAttempted}/2 exercises practiced`,
      ],
      exerciseCount: vocabAttempted,
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
          : "Focus on grammar fundamentals",
        `${grammarAttempted}/2 exercises practiced`,
      ],
      exerciseCount: grammarAttempted,
      recentScore: grammarScores[grammarScores.length - 1] || null,
    });

    // Sentence construction skills - include choose-sentence
    const sentenceData = progress["sentence-construction"];
    const sentenceScores = [
      sentenceData["complete-sentence"].score,
      sentenceData["sentence-ordering"].score,
      sentenceData["choose-sentence"].score,
    ].filter((s): s is number => s !== null);
    const sentenceAvg =
      sentenceScores.length > 0
        ? sentenceScores.reduce((a, b) => a + b, 0) / sentenceScores.length
        : 0;

    const sentenceAttempted = [
      sentenceData["complete-sentence"],
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
          : "Practice sentence construction more",
        `${sentenceAttempted}/3 exercises practiced`, // Changed to /3
      ],
      exerciseCount: sentenceAttempted,
      recentScore: sentenceScores[sentenceScores.length - 1] || null,
    });

    // Reading comprehension
    const readingData = progress["reading-comprehension"];
    const readingScores = [
      readingData["passage-questions"].score,
      readingData["summary-exercise"].score,
    ].filter((s): s is number => s !== null);
    const readingAvg =
      readingScores.length > 0
        ? readingScores.reduce((a, b) => a + b, 0) / readingScores.length
        : 0;

    const readingAttempted = [
      readingData["passage-questions"],
      readingData["summary-exercise"],
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
          : readingAvg >= 50
          ? "Developing reading skills"
          : "Practice reading comprehension more",
        `${readingAttempted}/2 exercises practiced`,
      ],
      exerciseCount: readingAttempted,
      recentScore: readingScores[readingScores.length - 1] || null,
    });

    return skills.sort((a, b) => b.strength - a.strength);
  }, [progress]);

  // Calculate study streak
  const studyStreak = useMemo((): StudyStreak => {
    return {
      current: contextStudyStreak.current,
      longest: contextStudyStreak.longest,
      lastStudyDate: contextStudyStreak.last_study_date,
    };
  }, [contextStudyStreak]);

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
    if (progress["reading-comprehension"]["summary-exercise"].attempts)
      totalAttempts += progress["reading-comprehension"]["summary-exercise"].attempts;

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
