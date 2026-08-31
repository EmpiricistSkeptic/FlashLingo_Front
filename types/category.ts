export interface Category {
  id: number;
  name: string;
  language_pair: number;
  card_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryPayload {
  name: string;
  language_pair: number;
}