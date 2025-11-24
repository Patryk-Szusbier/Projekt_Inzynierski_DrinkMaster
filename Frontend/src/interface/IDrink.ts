export type IngredientType = "alcohol" | "mixer";

export interface DrinkIngredient {
  id: number;
  drink_id: number;
  ingredient_type: IngredientType;
  ingredient_id: number;
  amount_ml: number;
  order_index?: number;
  note?: string;
}

export interface Drink {
  id: number;
  name: string;
  description?: string;
  author_id: number;
  is_public: boolean;
  image_url?: string;
  ingredients: DrinkIngredient[];
}
