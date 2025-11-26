import type { IngredientType } from "./IDrink";

export interface MachineSlot {
  id: number;
  slot_number: number;
  ingredient_type: IngredientType;
  ingredient_id: number;
  volume_ml: number;
  active: boolean;
}
export interface MachineFiller {
  id: number;
  slot_number: number;
  mixer_id: number;
  volume_ml: number;
  active: boolean;
}
