import type { User } from "./IUser";

export type IngredientType = "alcohol" | "mixer";
export type MixerType = "soda" | "juice" | "syrup" | "other";

export interface DrinkIngredient {
  id: number;
  drink_id: number;
  ingredient_type: IngredientType;
  ingredient_id: number;
  amount_ml: number;
  order_index?: number;
  note?: string;
  // Pola pomocnicze (jeśli backend je dodaje przez join):
  ingredient_name?: string;
  ingredient_image?: string;
}
export interface Mixer {
  id: number;
  name: string;
  type: MixerType;
  available: boolean;
  volume_ml: number;
}
export interface Drink {
  id: number;
  name: string;
  description?: string;
  author_id: number;
  is_public: boolean;
  image_url?: string;
  author?: User;
  ingredients: DrinkIngredient[];
}
