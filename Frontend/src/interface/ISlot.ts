export interface Slot {
  slot_number: number;
  ingredient_type: "alcohol" | "mixer" | null;
  ingredient_id: number | null;
  volume_ml: number;
  active: boolean;
}
