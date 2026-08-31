import { api } from "./api";
import type { LanguagePair, CreateLanguagePairPayload } from "../types/languagePair";

export function listLanguagePairs(): Promise<LanguagePair[]> {
  return api.get<LanguagePair[]>("/language-pairs/");
}

export function getLanguagePair(id: number): Promise<LanguagePair> {
  return api.get<LanguagePair>(`/language-pairs/${id}/`);
}

export function createLanguagePair(
  payload: CreateLanguagePairPayload
): Promise<LanguagePair> {
  return api.post<LanguagePair>("/language-pairs/", payload);
}

// Backend enforces uniqueness on (user, native_language, learning_language) —
// creating a duplicate pair returns a 400 with a non_field_errors message,
// which surfaces through ApiClientError.detail as-is.
export function updateLanguagePair(
  id: number,
  payload: Partial<CreateLanguagePairPayload>
): Promise<LanguagePair> {
  return api.patch<LanguagePair>(`/language-pairs/${id}/`, payload);
}

export function deleteLanguagePair(id: number): Promise<void> {
  return api.delete<void>(`/language-pairs/${id}/`);
}