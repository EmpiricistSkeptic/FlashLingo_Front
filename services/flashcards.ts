import { api } from "./api";
import type {
  Flashcard,
  ReviewResult,
  FlashcardReviewResponse,
  DueFlashcardsResponse,
  StudyMode,
} from "../types/flashcard";

// No listFlashcards()/createFlashcard() here on purpose — FlashcardViewSet
// only exposes Retrieve/Update/Destroy plus the actions below. Listing/
// creating happens through categories.ts (listCategoryFlashcards /
// createFlashcardInCategory), since every flashcard is created scoped to
// a category.

export function getFlashcard(id: number): Promise<Flashcard> {
  return api.get<Flashcard>(`/flashcards/${id}/`);
}

// Only text/translations/examples are writable — status, scheduling state,
// and categories are server-controlled.
export function updateFlashcard(
  id: number,
  payload: Partial<{
    text: string;
    translations: string[];
    examples: string[];
  }>
): Promise<Flashcard> {
  return api.patch<Flashcard>(`/flashcards/${id}/`, payload);
}

export function deleteFlashcard(id: number): Promise<void> {
  return api.delete<void>(`/flashcards/${id}/`);
}

// POST /flashcards/{id}/review/ — applies one spaced-repetition step and
// returns the card's updated scheduling state.
export function reviewFlashcard(
  id: number,
  result: ReviewResult
): Promise<FlashcardReviewResponse> {
  return api.post<FlashcardReviewResponse>(
    `/flashcards/${id}/review/`,
    { result }
  );
}

// GET /flashcards/study/?category=&type=new|due — one ordered queue for
// exactly one category and one mode.
export function getStudyQueue(
  categoryId: number,
  type: StudyMode,
  newLimit = 200
): Promise<Flashcard[]> {
  return api.get<Flashcard[]>("/flashcards/study/", {
    category: categoryId,
    type,
    new_limit: newLimit,
  });
}

// GET /flashcards/difficult/?language_pair=&limit=
// Returns a dynamic "Tricky Words" study deck based on review history.
// Unlike new/due queues, this deck is scoped to a language pair rather
// than a single category.
export function getDifficultStudyQueue(
  languagePairId: number,
  limit = 20
): Promise<Flashcard[]> {
  return api.get<Flashcard[]>("/flashcards/difficult/", {
    language_pair: languagePairId,
    limit,
  });
}

// GET /flashcards/due/ — the older global (cross-category) endpoint.
// Left as-is and unused by the new Home/session flow.
export function getDueFlashcards(
  categoryId?: number,
  newLimit = 200
): Promise<DueFlashcardsResponse> {
  return api.get<DueFlashcardsResponse>("/flashcards/due/", {
    category: categoryId,
    new_limit: newLimit,
  });
}

