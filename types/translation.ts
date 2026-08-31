export interface TranslationRequest {
  text: string;
  language_pair_id: number;
}

export interface TranslationResult {
  text: string;
  corrected_text: string | null;
  translations: string[];
  examples: string[];
}