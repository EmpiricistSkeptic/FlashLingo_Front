import { api } from "./api";
import type { Category, CreateCategoryPayload } from "../types/category";
import type { Flashcard, CreateFlashcardPayload } from "../types/flashcard";

// Pass a language_pair id to scope the list to one pair; omit it to get
// the user's full flat list of categories across all pairs.
export function listCategories(languagePairId?: number): Promise<Category[]> {
  return api.get<Category[]>("/category/", { language_pair: languagePairId });
}

export function getCategory(id: number): Promise<Category> {
  return api.get<Category>(`/category/${id}/`);
}

// language_pair is required in the payload — the backend rejects a
// language_pair that doesn't belong to the current user with a 400.
export function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  return api.post<Category>("/category/", payload);
}

export function updateCategory(
  id: number,
  payload: Partial<CreateCategoryPayload>
): Promise<Category> {
  return api.patch<Category>(`/category/${id}/`, payload);
}

export function deleteCategory(id: number): Promise<void> {
  return api.delete<void>(`/category/${id}/`);
}

// GET /category/{id}/flashcards/ — flashcards belonging to this category
export function listCategoryFlashcards(categoryId: number): Promise<Flashcard[]> {
  return api.get<Flashcard[]>(`/category/${categoryId}/flashcards/`);
}

// POST /category/{id}/flashcards/ — this is currently the only way to
// create a flashcard; there's no bare POST /flashcards/. The new card is
// created and immediately attached to this category on the backend.
export function createFlashcardInCategory(
  categoryId: number,
  payload: CreateFlashcardPayload
): Promise<Flashcard> {
  return api.post<Flashcard>(`/category/${categoryId}/flashcards/`, payload);
}