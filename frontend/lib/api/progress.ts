import { apiClient } from "../client/aiServiceClient";
import { backendApiClient } from "../client/backendApiClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
// Background sync timeout (keep relatively low)
const PROGRESS_SYNC_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_PROGRESS_SYNC_TIMEOUT_MS ?? "10000",
);

// Initial load timeout (allow slower backend to still load)
const PROGRESS_SYNC_INITIAL_TIMEOUT_MS = Number(
  process.env.NEXT_PUBLIC_PROGRESS_SYNC_INITIAL_TIMEOUT_MS ?? "30000",
);

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
  
  // Lesson-specific fields
  time_spent: number; 
  cards_reviewed: number | null;
  lessons_viewed: number | null; 
  
  // Quiz-specific fields
  attempts: number;
  best_score: number | null;
  last_score: number | null;
  last_difficulty: string;
  
  // Timestamps
  first_attempt_at: string | null;
  last_completed_at: string | null;
  
  // Performance history
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

export interface AllProgressResponse {
  modules: ModuleProgress[];
  study_streak: {
    current: number;
    longest: number;
    last_study_date: string | null;
  };
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
export async function getAllProgress(opts?: {
  timeoutMs?: number;
  initial?: boolean;
}): Promise<AllProgressResponse> {
  const timeoutMs =
    opts?.timeoutMs ??
    (opts?.initial ? PROGRESS_SYNC_INITIAL_TIMEOUT_MS : PROGRESS_SYNC_TIMEOUT_MS);

  const response = await backendApiClient.get("/progress/all/", { timeout: timeoutMs });
  return response.data;
}

export async function getModuleProgress(module: string): Promise<ModuleProgress> {
  const response = await backendApiClient.get(`/progress/${module}/`);
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
    timeSpent?: number;
    cardsReviewed?: number;
    lessonsViewed?: number;
    performanceMetrics?: {
      difficulty: string;
      score: number;
      missedLowFreq: number;
      similarChoiceErrors: number;
      errorTags: string[];
    };
  }
): Promise<ExerciseProgress> {
  const response = await backendApiClient.post(`/progress/${module}/${exercise}/update/`, data);
  return response.data;
}

export async function getPerformanceHistory(
  module: string,
  exercise: string
): Promise<PerformanceMetrics[]> {
  const response = await backendApiClient.get(`/progress/${module}/${exercise}/history/`);
  return response.data;
}

export async function resetProgress(module?: string): Promise<{ message: string }> {
  const url = module ? `/progress/${module}/reset/` : `/progress/reset/all/`;
  const response = await backendApiClient.delete(url);
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

export async function getAllSRSCards() {
  const response = await backendApiClient.get("/progress/srs/all/");
  return response.data;
}

export async function getDueSRSCards() {
  const response = await backendApiClient.get("/progress/srs/due/");
  return response.data;
}

export async function updateSRSCard(wordId: number, grade: number) {
  const response = await backendApiClient.post(`/progress/srs/${wordId}/update/`, { grade });
  return response.data;
}

export async function resetSRSCard(wordId: number) {
  const response = await backendApiClient.delete(`/progress/srs/${wordId}/reset/`);
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

export async function getReviewDeck() {
  const response = await backendApiClient.get("/progress/review-deck/");
  return response.data;
}

export async function addToReviewDeck(wordId: number) {
  const response = await backendApiClient.post(`/progress/review-deck/${wordId}/add/`);
  return response.data;
}

export async function removeFromReviewDeck(wordId: number) {
  const response = await backendApiClient.delete(`/progress/review-deck/${wordId}/remove/`);
  return response.data;
}

export async function updateReviewDeckItem(wordId: number) {
  const response = await backendApiClient.post(`/progress/review-deck/${wordId}/update/`);
  return response.data;
}

export async function clearReviewDeck() {
  const response = await backendApiClient.delete("/progress/review-deck/clear/");
  return response.data;
}

export type ModuleSlug = "vocabulary" | "grammar" | "sentence-construction" | "reading-comprehension";
export type ExerciseType = "flashcards" | "quiz" | "antonym" | "lesson-cards" | "error-identification" | "fill-blanks" | "sentence-ordering" | "choose-sentence" | "passage-questions" | "summary-exercise";

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
 * Backend endpoint: POST /progress/performance-event/
 */
export async function recordLexicalPerformance(
  event: LexicalPerformanceEvent
): Promise<{ message: string }> {
  const response = await backendApiClient.post("/progress/performance-event/", event);
  return response.data;
}

export async function submitQuizAttempt(
  module: string,
  exercise: string,
  metrics: {
    difficulty: "easy" | "medium" | "hard";
    score: number;
    missedLowFreq?: number;
    similarChoiceErrors?: number;
    errorTags?: string[];
  },
  completedAt?: string
): Promise<ExerciseProgress> {
  const response = await apiClient.post(`/progress/${module}/${exercise}/update/`, {
    status: "in-progress",
    score: metrics.score,
    lastDifficulty: metrics.difficulty,
    completedAt: completedAt ?? new Date().toISOString(),
    performanceMetrics: {
      difficulty: metrics.difficulty,
      score: metrics.score,
      missedLowFreq: metrics.missedLowFreq ?? 0,
      similarChoiceErrors: metrics.similarChoiceErrors ?? 0,
      errorTags: metrics.errorTags ?? [],
    },
  });

  return response.data;
}