import { api } from "./api";

export type GameType =
  | "classic"
  | "typing"
  | "sentence"
  | "translation";

export interface TypingEvaluationResponse {
  game_type: "typing";
  flashcard_id: number;
  is_correct: boolean;
}

export interface SentenceChallengeResponse {
  game_type: "sentence";
  flashcard_id: number;
  instruction: string;
  context: string;
}

export interface TranslationChallengeResponse {
  game_type: "translation";
  flashcard_id: number;
  instruction: string;
  source_sentence: string;
}

export interface GameEvaluationResponse {
  game_type: "sentence" | "translation";
  flashcard_id: number;
  is_correct: boolean;
  score: number;
  feedback: string;
  correction: string | null;
}

export function evaluateTyping(
  flashcardId: number,
  answer: string
): Promise<TypingEvaluationResponse> {
  return api.post<TypingEvaluationResponse>(
    "/games/typing/evaluate/",
    {
      flashcard_id: flashcardId,
      answer,
    }
  );
}

export function generateSentence(
  flashcardId: number
): Promise<SentenceChallengeResponse> {
  return api.post<SentenceChallengeResponse>(
    "/games/sentence/generate/",
    {
      flashcard_id: flashcardId,
    }
  );
}

export function evaluateSentence(
  flashcardId: number,
  context: string,
  answer: string
): Promise<GameEvaluationResponse> {
  return api.post<GameEvaluationResponse>(
    "/games/sentence/evaluate/",
    {
      flashcard_id: flashcardId,
      context,
      answer,
    }
  );
}

export function generateTranslation(
  flashcardId: number
): Promise<TranslationChallengeResponse> {
  return api.post<TranslationChallengeResponse>(
    "/games/translation/generate/",
    {
      flashcard_id: flashcardId,
    }
  );
}

export function evaluateTranslation(
  flashcardId: number,
  sourceSentence: string,
  answer: string
): Promise<GameEvaluationResponse> {
  return api.post<GameEvaluationResponse>(
    "/games/translation/evaluate/",
    {
      flashcard_id: flashcardId,
      source_sentence: sourceSentence,
      answer,
    }
  );
}