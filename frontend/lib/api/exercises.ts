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
  exercise_type: "error_identification" | "fill-blanks";
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
  | "error_identification" 
  | "fill-blanks" 
  | "ordering" 
  | "choose" 
  | "complete";

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

  console.log('Vocabulary request body:', body);

  const response = await aiServiceClient.post('/exercises/vocabulary', body);
  return response.data.exercises || [];
}

export async function getGrammarExercisesAdaptive(params: {
  userId?: string;
  targetDifficulty?: "easy" | "medium" | "hard";
  exerciseType?: "error_identification" | "fill-blanks";
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

  console.log('Grammar request body:', body);

  try {
    const response = await aiServiceClient.post('/exercises/grammar', body);
    console.log('Grammar exercises loaded:', response.data.exercises?.length);
    return response.data.exercises || [];
  } catch (error: any) {
    console.error('Grammar exercises error:', error.response?.data || error.message);
    throw error;
  }
}

export async function getSentenceConstructionExercisesAdaptive(params: {
  userId?: string;
  targetDifficulty?: "easy" | "medium" | "hard";
  exerciseType?: "ordering" | "choose" | "complete";
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

  console.log('Sentence Construction request body:', body);

  try {
    const response = await aiServiceClient.post('/exercises/sentence-construction', body);
    console.log('Sentence Construction exercises loaded:', response.data.exercises?.length);
    return response.data.exercises || [];
  } catch (error: any) {
    console.error('Sentence Construction exercises error:', error.response?.data || error.message);
    throw error;
  }
}

export async function getLexiconData(): Promise<LexiconItem[]> {
  const response = await aiServiceClient.get('/exercises/lexicon');
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

  console.log('Reading Comprehension request body:', body);

  try {
    const response = await aiServiceClient.post('/exercises/reading-comprehension', body);
    console.log('Reading passages loaded:', response.data.passages?.length);
    return response.data.passages || [];
  } catch (error: any) {
    console.error('Reading comprehension exercises error:', error.response?.data || error.message);
    throw error;
  }
}