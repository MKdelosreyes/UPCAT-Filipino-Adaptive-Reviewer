import {aiServiceClient} from '../client/aiServiceClient';

export interface VocabularyExerciseItem {
  item_id: string;
  lemma_id: string;
  sentence_example_1: string;
  sentence_example_2: string;
}

export interface LexiconItem {
  lemma_id: string;
  lemma: string;
  base_definition: string;
  surface_forms: string[];
  relations: {
    synonyms: string[];
    antonyms: string[];
  };
}

export interface GrammarExerciseItem {
  item_id: string;
  lemma_id: string;
  error_sentence: string;
  errorCorrectAnswer: string;
  fill_sentence: string;
  fillCorrectAnswer: string;
  error_explanation: string;
  fill_explanation: string;
  exercise_type: "error-identification" | "fill-blanks";
}

export interface SentenceConstructionExerciseItem {
  item_id: string;
  lemma_id: string;
  
  // Sentence Ordering fields
  orderingCorrectSentence: string;
  
  // Choose Sentence fields
  chooseContext: string;
  chooseCorrectSentence: string;
  distractors: string[];
  explanation: string;
  
  // Complete Sentence fields
  incompletePhrase: string;
  completeContext: string;
  sampleCompletions: string;
}

export type ExerciseType = 
  | "error-identification" 
  | "fill-blanks" 
  | "sentence-ordering" 
  | "choose-sentence" 
  | "complete-sentence"
  | "antonym"
  | "quiz";

export interface ReadingPassage {
  passage_id: string;
  title: string;
  text: string;
  difficulty: "easy" | "medium" | "hard";
  wordCount: number;
  mainIdea: string;
  comprehensionQuestions: {
    id: string;
    question: string;
    type: string;
    choices: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

export async function getLexiconData(): Promise<LexiconItem[]> {
  const response = await aiServiceClient.get('/exercises/lexicon');
  return response.data.exercises || [];
}

export async function getVocabularyExercises(): Promise<VocabularyExerciseItem[]> {
  const response = await aiServiceClient.get('/exercises/vocabulary');
  return response.data.exercises || [];
}

export async function getVocabularyExercisesAdaptive(params: {
  userId?: string;
  targetDifficulty?: "easy" | "medium" | "hard";
  limit?: number;
  accessToken?: string;
} = {}): Promise<VocabularyExerciseItem[]> {
  const userId = params.userId ? parseInt(String(params.userId)) : null;

  const body = {
    user_id: userId,
    target_difficulty: params.targetDifficulty || null,
    limit: params.limit || 15,
  };

  const headers =
    params.accessToken
      ? { Authorization: `Bearer ${params.accessToken}` }
      : undefined;

  const response = await aiServiceClient.post("/exercises/vocabulary", body, {
    headers,
  });

  return response.data.exercises || [];
}

export async function getGrammarExercisesAdaptive(params: {
  userId?: string;
  targetDifficulty?: "easy" | "medium" | "hard";
  exerciseType?: "error-identification" | "fill-blanks";
  limit?: number;
  accessToken?: string;
} = {}): Promise<GrammarExerciseItem[]> {
  const userId = params.userId ? parseInt(String(params.userId)) : null;

  const body = {
    user_id: userId,
    target_difficulty: params.targetDifficulty || null,
    exercise_type: params.exerciseType || null,
    limit: params.limit || 15,
  };

  const headers =
    params.accessToken
      ? { Authorization: `Bearer ${params.accessToken}` }
      : undefined;

  const response = await aiServiceClient.post("/exercises/grammar", body, {
    headers,
  });

  return response.data.exercises || [];
}

export async function getSentenceConstructionExercisesAdaptive(params: {
  userId?: string;
  targetDifficulty?: "easy" | "medium" | "hard";
  exerciseType?: "sentence-ordering" | "choose-sentence" | "complete-sentence";
  limit?: number;
  accessToken?: string;
} = {}): Promise<SentenceConstructionExerciseItem[]> {
  const userId = params.userId ? parseInt(String(params.userId)) : null;

  const body = {
    user_id: userId,
    target_difficulty: params.targetDifficulty || null,
    exercise_type: params.exerciseType || null,
    limit: params.limit || 15,
  };

  const headers =
    params.accessToken
      ? { Authorization: `Bearer ${params.accessToken}` }
      : undefined;

  const response = await aiServiceClient.post(
    "/exercises/sentence-construction",
    body,
    { headers }
  );

  return response.data.exercises || [];
}

export async function getReadingComprehensionExercisesAdaptive(params: {
  userId?: string;
  targetDifficulty?: "easy" | "medium" | "hard";
  limit?: number;
  accessToken?: string;
} = {}): Promise<ReadingPassage[]> {
  const userId = params.userId ? parseInt(String(params.userId)) : null;

  const body = {
    user_id: userId,
    target_difficulty: params.targetDifficulty || null,
    limit: params.limit || 3,
  };

  const headers =
    params.accessToken
      ? { Authorization: `Bearer ${params.accessToken}` }
      : undefined;

  const response = await aiServiceClient.post(
    "/exercises/reading-comprehension",
    body,
    { headers }
  );

  return response.data.passages || [];
}