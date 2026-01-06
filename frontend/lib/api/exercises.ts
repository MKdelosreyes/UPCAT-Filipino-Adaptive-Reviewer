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
  const body = {
    user_id: params.userId ?? null,
    target_difficulty: params.targetDifficulty ?? null,
    limit: params.limit ?? 15,
  };

  const response = await aiServiceClient.post('/exercises/vocabulary', body);
  return response.data.exercises || [];
}

// export async function getGrammarExercises(): Promise<GrammarExerciseItem[]> {
//   const response = await aiServiceClient.get('/exercises/grammar');
//   return response.data.exercises || [];
// }

export async function getGrammarExercisesAdaptive(params: {
  userId?: string;
  targetDifficulty?: "easy" | "medium" | "hard";
  exerciseType?: "error_identification" | "fill-blanks";
  limit?: number;
  accessToken?: string;
} = {}): Promise<GrammarExerciseItem[]> {
  const body = {
    user_id: params.userId ?? null,
    target_difficulty: params.targetDifficulty ?? null,
    exercise_type: params.exerciseType ?? null,
    limit: params.limit ?? 15,
  };

  const response = await aiServiceClient.post('/exercises/grammar', body);
  return response.data.exercises || [];
}

export async function getLexiconData(): Promise<LexiconItem[]> {
  const response = await aiServiceClient.get('/exercises/lexicon');
  return response.data.exercises || [];
}