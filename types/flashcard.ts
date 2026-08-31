// Confirmed against spaced_repetition.py: only three statuses exist.
// There's no separate "relearning" state — a lapsed "learned" card drops
// straight back into "learning" and re-runs the learning-step sequence.
export type FlashcardStatus = "new" | "learning" | "learned";

export interface Flashcard {
  id: number;
  categories: number[];
  text: string;
  translations: string[];
  examples: string[];
  status: FlashcardStatus;
  next_review: string | null;
  review_count: number;
  created_at: string;
  updated_at: string;
}

// text/translations/examples are the only writable fields — everything
// else (status, scheduling, categories) is server-controlled.
export interface CreateFlashcardPayload {
  text: string;
  translations: string[];
  examples: string[];
}

// Lean scheduling view returned by /review/ and /due/ (FlashcardStateSerializer)
export interface FlashcardState {
  id: number;
  text: string;
  status: FlashcardStatus;
  ease_factor: number;
  interval: number;
  repetitions: number;
  learning_step: number;
  review_count: number;
  next_review: string | null;
}

export type ReviewResult = "again" | "hard" | "good" | "easy";

// Matches the ?type= query param on GET /flashcards/study/
export type StudyMode = "new" | "due";

export interface FlashcardReviewResponse extends FlashcardState {
  result: ReviewResult;
}

export interface DueFlashcardsResponse {
  due: FlashcardState[];
  new: FlashcardState[];
}