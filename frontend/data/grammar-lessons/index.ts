// Main index file for all grammar lessons
// Organized by difficulty level and topic for easy access and scalability

import { GrammarLessonCard } from "./types";
import { beginnerFundamentalLessons } from "./beginner-fundamental";
import { beginnerNounsPronounsLessons } from "./beginner-nouns-pronouns";
import { beginnerAdjectivesLessons } from "./beginner-adjectives";
import { beginnerSentenceTypesLessons } from "./beginner-sentence-types";
import { intermediateVerbConjugationLessons } from "./intermediate-verb-conjugation";
import { intermediateComplexStructuresLessons } from "./intermediate-complex-structures";

// Export individual lesson sets for modular usage
export {
  beginnerFundamentalLessons,
  beginnerNounsPronounsLessons,
  beginnerAdjectivesLessons,
  beginnerSentenceTypesLessons,
  intermediateVerbConjugationLessons,
  intermediateComplexStructuresLessons,
};

// Beginner Level Lessons (All combined)
export const beginnerLessons: GrammarLessonCard[] = [
  ...beginnerFundamentalLessons,
  ...beginnerNounsPronounsLessons,
  ...beginnerAdjectivesLessons,
  ...beginnerSentenceTypesLessons,
];

// Intermediate Level Lessons (All combined)
export const intermediateLessons: GrammarLessonCard[] = [
  ...intermediateVerbConjugationLessons,
  ...intermediateComplexStructuresLessons,
];

// All Grammar Lessons Combined
export const allGrammarLessons: GrammarLessonCard[] = [
  ...beginnerLessons,
  ...intermediateLessons,
];

// Get lessons by difficulty
export const getLessonsByDifficulty = (difficulty: string): GrammarLessonCard[] => {
  return allGrammarLessons.filter((lesson) => lesson.difficulty === difficulty);
};

// Get lessons by topic
export const getLessonsByTopic = (topic: string): GrammarLessonCard[] => {
  return allGrammarLessons.filter((lesson) => lesson.topic === topic);
};

// Get lessons by difficulty and topic
export const getLessonsByDifficultyAndTopic = (
  difficulty: string,
  topic: string
): GrammarLessonCard[] => {
  return allGrammarLessons.filter(
    (lesson) => lesson.difficulty === difficulty && lesson.topic === topic
  );
};

// Get random lessons (useful for mixing up the learning)
export const getRandomLessons = (count: number): GrammarLessonCard[] => {
  const shuffled = [...allGrammarLessons].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// Get all topics available
export const getAllTopics = (): string[] => {
  const topics = new Set<string>();
  allGrammarLessons.forEach((lesson) => topics.add(lesson.topic));
  return Array.from(topics).sort();
};

// Get all difficulties available
export const getAllDifficulties = (): string[] => {
  const difficulties = new Set<string>();
  allGrammarLessons.forEach((lesson) => difficulties.add(lesson.difficulty));
  return Array.from(difficulties);
};

// Statistics helper
export const getLessonStatistics = () => {
  return {
    totalLessons: allGrammarLessons.length,
    beginnerLessonsCount: beginnerLessons.length,
    intermediateLessonsCount: intermediateLessons.length,
    topicsCount: getAllTopics().length,
    topics: getAllTopics(),
  };
};
