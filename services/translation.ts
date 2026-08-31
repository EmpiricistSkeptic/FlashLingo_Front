import { api } from "./api";
import type { TranslationRequest, TranslationResult } from "../types/translation";

// Frontend never sends native_language/learning_language directly — only
// language_pair_id. The backend resolves the LanguagePair (scoped to the
// current user via get_object_or_404) and derives both languages from it
// before calling DeepSeekService. Passing an id that doesn't belong to
// the current user returns a 404, which surfaces as ApiClientError.
export function previewTranslation(
  payload: TranslationRequest
): Promise<TranslationResult> {
  return api.post<TranslationResult>("/translation/preview/", payload);
}