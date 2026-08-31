import type { LanguageCode } from "../constants/languages";

export interface LanguagePair {
  id: number;
  native_language: LanguageCode;
  learning_language: LanguageCode;
  created_at: string;
  updated_at: string;
}

export interface CreateLanguagePairPayload {
  native_language: LanguageCode;
  learning_language: LanguageCode;
}