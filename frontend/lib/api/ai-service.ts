import {aiServiceClient, apiClient} from '../client/aiServiceClient';

/**
 * AI Service API Client
 * Connects frontend to FastAPI AI service
 */

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';

// Types
export interface ExplainRequest {
  mode: "quiz" | "antonym" | "error-identification" | "fill-blanks" | "complete-sentence" | "reading-comprehension" | "sentence-ordering";
  word: string;
  correct: string;
  selected?: string;
  sentence?: string;
  explanation?: string;
}

export interface ExplainResponse {
  explanation: string;
}

export interface TipsRequest {
  score: number;
  missedLowFreq: number;
  similarChoiceErrors: number;
  lastDifficulty: "easy" | "medium" | "hard";
  module: "vocabulary" | "grammar" | "sentence-construction" | "reading-comprehension";
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

export interface ChatRequest {
  conversation_history: Array<{ role: string; content: string }>;
  word: string;
  correct_answer: string;
  definition?: string;
  example?: string;
  context_type?: "vocabulary" | "grammar";
}

export interface ChatResponse {
  response: string;
}

export interface SummaryCheckRequest {
  passage_text: string;
  user_summary: string;
  main_idea: string;
  passage_title?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface SummaryCheckResponse {
  quality_level: 'needs-work' | 'developing' | 'good' | 'excellent';
  feedback: string;
  strengths: string[];
  improvements: string[];
  coverage_feedback: string;
  clarity_feedback: string;
  completeness_feedback: string;
}

export async function sendChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  const response = await aiServiceClient.post('/chat', request);
  return response.data;
}

// API Functions
export async function getExplanation(
  request: ExplainRequest
): Promise<ExplainResponse> {
  const response = await aiServiceClient.post('/explain', request);
  return response.data;
}

export async function getTips(request: TipsRequest): Promise<TipsResponse> {
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

export async function checkSummary(
  request: SummaryCheckRequest
): Promise<SummaryCheckResponse> {
  const response = await aiServiceClient.post('/summary/check', request);
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