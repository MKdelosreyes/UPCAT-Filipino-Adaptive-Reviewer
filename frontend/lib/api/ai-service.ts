import {aiServiceClient, apiClient} from '../client/aiServiceClient';

/**
 * AI Service API Client
 * Connects frontend to FastAPI AI service
 */

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';

// Types
export interface ExplainRequest {
  mode: "quiz" | "fill-blanks";
  word: string;
  correct: string;
  selected?: string;
}

export interface ExplainResponse {
  explanation: string;
}

export interface TipsRequest {
  score: number;
  missedLowFreq: number;
  similarChoiceErrors: number;
  lastDifficulty: "easy" | "medium" | "hard";
  module: string;
}

export interface TipsResponse {
  tips: string;
}

export interface RedefineRequest {
  word: string;
  baseMeaning: string;
  example: string;
}

export interface RedefineResponse {
  content: string;
}

export interface ConfusablesRequest {
  word: string;
  topK?: number;
}

export interface ConfusableWord {
  word: string;
  meaning: string;
  example: string;
}

export interface ConfusablesResponse {
  results: ConfusableWord[];
}

// API Functions
export async function getExplanation(
  request: ExplainRequest
): Promise<ExplainResponse> {
  const response = await aiServiceClient.post('/explain', request);
  return response.data;
}

export async function getTips(
  request: TipsRequest
): Promise<TipsResponse> {
  const response = await aiServiceClient.post('/tips', request);
  return response.data;
}

export async function redefineWord(
  request: RedefineRequest
): Promise<RedefineResponse> {
  const response = await aiServiceClient.post('/redefine', request);
  return response.data;
}

export async function getConfusables(
  request: ConfusablesRequest
): Promise<ConfusablesResponse> {
  const response = await aiServiceClient.post('/confusables', request);
  return response.data;
}

// Health check
export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const response = await aiServiceClient.get('/');
    return response.status === 200;
  } catch {
    return false;
  }
}