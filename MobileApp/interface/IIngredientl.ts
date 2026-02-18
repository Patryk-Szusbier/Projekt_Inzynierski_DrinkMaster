export type TypeMixer = "soda" | "juice" | "syrup" | "other";

export interface Ingredient {
  id: number;
  name: string;
}
export interface Alcohol {
  id?: number;
  name: string;
  abv: number;
  available: boolean;
  volume_ml: number;
}
export interface Mixers {
  id?: number;
  name: string;
  type: TypeMixer;
  available: boolean;
  volume_ml: number;
}
