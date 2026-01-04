import { apiClient } from "../client/aiServiceClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface PerformanceMetrics {
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  missed_low_freq: number;
  similar_choice_errors: number;
  error_tags: string[];
  timestamp: string;
}

export interface ExerciseProgress {
  id: number;
  exercise_type: string;
  status: string;
  attempts: number;
  best_score: number | null;
  last_score: number | null;
  last_difficulty: string;
  first_attempt_at: string | null;
  last_completed_at: string | null;
  performance_history: PerformanceMetrics[];
}

export interface ModuleProgress {
  id: number;
  module: string;
  completion_percentage: number;
  last_accessed_at: string | null;
  mastery_level: string;
  current_difficulty: string;
  exercises: ExerciseProgress[];
}

// Get authentication token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const tokens = localStorage.getItem('tokens');
  if (!tokens) return null;
  try {
    const parsed = JSON.parse(tokens);
    return parsed.access;
  } catch {
    return null;
  }
}

// Fetch with auth
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || response.statusText);
  }

  return response.json();
}

// API Functions
export async function getAllProgress(): Promise<ModuleProgress[]> {
  const response = await apiClient.get('/progress/all/');
  return response.data;
}

export async function getModuleProgress(module: string): Promise<ModuleProgress> {
  const response = await apiClient.get(`/progress/${module}/`);
  return response.data;
}

export async function updateExerciseProgress(
  module: string,
  exercise: string,
  data: {
    status?: string;
    score?: number;
    attempts?: number;
    completedAt?: string;
    lastDifficulty?: string;
    performanceMetrics?: {
      difficulty: string;
      score: number;
      missedLowFreq: number;
      similarChoiceErrors: number;
      errorTags: string[];
    };
  }
): Promise<ExerciseProgress> {
  const response = await apiClient.post(`/progress/${module}/${exercise}/update/`, data);
  return response.data;
}

export async function getPerformanceHistory(
  module: string,
  exercise: string
): Promise<PerformanceMetrics[]> {
  const response = await apiClient.get(`/progress/${module}/${exercise}/history/`);
  return response.data;
}

export async function resetProgress(module?: string): Promise<{ message: string }> {
  const url = module ? `/progress/${module}/reset/` : `/progress/reset/all/`;
  const response = await apiClient.delete(url);
  return response.data;
}

// ============================================================
// SRS API Functions
// ============================================================

export interface SRSCard {
  id: number;
  word_id: number;
  repetitions: number;
  easiness_factor: number;
  interval: number;
  next_review: string;
  created_at: string;
  last_reviewed: string;
}

export async function getAllSRSCards(): Promise<{
  all_cards: SRSCard[];
  due_cards: SRSCard[];
  due_count: number;
  total_count: number;
}> {
  const response = await apiClient.get('/progress/srs/all/');
  return response.data;
}

export async function getDueSRSCards(): Promise<{
  cards: SRSCard[];
  count: number;
}> {
  const response = await apiClient.get('/progress/srs/due/');
  return response.data;
}

export async function updateSRSCard(
  wordId: number,
  grade: number
): Promise<SRSCard> {
  const response = await apiClient.post(`/progress/srs/${wordId}/update/`, { grade });
  return response.data;
}

export async function resetSRSCard(wordId: number): Promise<{ message: string }> {
  const response = await apiClient.delete(`/progress/srs/${wordId}/reset/`);
  return response.data;
}

// ============================================================
// Review Deck API Functions
// ============================================================

export interface ReviewDeckCard {
  id: number;
  word_id: number;
  added_at: string;
  last_reviewed: string | null;
  times_reviewed: number;
}

export async function getReviewDeck(): Promise<{
  cards: ReviewDeckCard[];
  count: number;
}> {
  const response = await apiClient.get('/progress/review-deck/');
  return response.data;
}

export async function addToReviewDeck(wordId: number): Promise<{
  card: ReviewDeckCard;
  created: boolean;
}> {
  const response = await apiClient.post(`/progress/review-deck/${wordId}/add/`);
  return response.data;
}

export async function removeFromReviewDeck(wordId: number): Promise<{
  message: string;
  deleted: boolean;
}> {
  const response = await apiClient.delete(`/progress/review-deck/${wordId}/remove/`);
  return response.data;
}

export async function updateReviewDeckItem(
  wordId: number
): Promise<ReviewDeckCard> {
  const response = await apiClient.post(`/progress/review-deck/${wordId}/update/`);
  return response.data;
}

export async function clearReviewDeck(): Promise<{
  message: string;
  deleted_count: number;
}> {
  const response = await apiClient.delete('/progress/review-deck/clear/');
  return response.data;
}

export type ModuleSlug = "vocabulary" | "grammar" | "sentence-construction";
export type ExerciseType = "flashcards" | "quiz" | "antonym" | "lesson-cards" | "error-identification" | "complete-sentence";

// This matches LexicalPerformanceEventSerializer on the backend
export interface LexicalPerformanceEvent {
  module: ModuleSlug;
  exercise_type: ExerciseType;
  lemma_id: string;                // from ai-service item
  correct: boolean;
  is_near_miss?: boolean;
  is_confusable_error?: boolean;
  score?: number;                  // 0–100; can be per-item or per-set
  difficulty_shown?: "easy" | "medium" | "hard";
}

/**
 * Send a single lexical performance event to backend.
 * Backend endpoint: POST /api/progress/performance-event/
 */
export async function recordLexicalPerformance(
  event: LexicalPerformanceEvent
): Promise<{ message: string }> {
  const response = await apiClient.post('/progress/performance-event/', event);
  return response.data;
}