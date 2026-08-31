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
// and categories are server-controlled (see CreateFlashcardPayload).
export function updateFlashcard(
  id: number,
  payload: Partial<{ text: string; translations: string[]; examples: string[] }>
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
  return api.post<FlashcardReviewResponse>(`/flashcards/${id}/review/`, { result });
}

// GET /flashcards/study/?category=&type=new|due — one ordered queue for
// exactly one category and one mode. Returns FULL flashcard data (text +
// translations + examples), not just scheduling state — the session
// screen needs the whole card, and fetching it directly here avoids a
// second request to stitch translations/examples back on afterwards.
// This is what the Home "Study" picker and the session screen use — new
// and due are never mixed. category is required by the backend (400
// without it); newLimit defaults higher than the backend's own fallback
// (20) so counts/queues reflect the true number of new cards, not just a
// daily-intro cap.
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

// GET /flashcards/due/ — the older global (cross-category) endpoint.
// Left as-is and unused by the new Home/session flow. Statistics tab
// still calls this for now; revisit once its backend logic is decided.
export function getDueFlashcards(
  categoryId?: number,
  newLimit = 200
): Promise<DueFlashcardsResponse> {
  return api.get<DueFlashcardsResponse>("/flashcards/due/", {
    category: categoryId,
    new_limit: newLimit,
  });
}