import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Ingredient } from "@/interface/IDrink";
import type { Slot } from "@/interface/ISlot";

const MachineSlots: React.FC = () => {
  const [alcohols, setAlcohols] = useState<Ingredient[]>([]);
  const [mixers, setMixers] = useState<Ingredient[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const formatTypeForBackend = (type: "ALCOHOL" | "MIXER") =>
    type.toLowerCase();
  useEffect(() => {
    const fetchData = async () => {
      const [alc, mix, machineSlots] = await Promise.all([
        api.get<Ingredient[]>("/ingredients/alcohols"),
        api.get<Ingredient[]>("/ingredients/mixers"),
        api.get<Slot[]>("/ingredients/machine_slots"),
      ]);

      const sortedSlots = [...machineSlots].sort(
        (a, b) => a.slot_number - b.slot_number
      );

      setAlcohols(alc);
      setMixers(mix);
      setSlots(sortedSlots);
    };

    fetchData();
  }, []);

  const handleTypeChange = (slotIndex: number, type: "alcohol" | "mixer") => {
    const updatedSlots = [...slots];
    updatedSlots[slotIndex] = {
      ...updatedSlots[slotIndex],
      ingredient_type: type,
      ingredient_id: null,
    };
    setSlots(updatedSlots);
  };

  const handleIngredientChange = (slotIndex: number, ingredientId: number) => {
    const updatedSlots = [...slots];
    updatedSlots[slotIndex] = {
      ...updatedSlots[slotIndex],
      ingredient_id: ingredientId,
    };
    setSlots(updatedSlots);
  };

  const handleSaveSlot = async (slot: Slot) => {
    if (!slot.ingredient_type || !slot.ingredient_id) {
      alert("Wybierz typ i składnik przed zapisaniem!");
      return;
    }

    try {
      const payload = {
        ingredient_type: formatTypeForBackend(
          slot.ingredient_type as "ALCOHOL" | "MIXER"
        ),
        ingredient_id: slot.ingredient_id,
        volume_ml: slot.volume_ml ?? 0,
        active: slot.active ?? true,
      };
      console.log(payload);
      await api.put(`/ingredients/machine_slots/${slot.slot_number}`, payload);
      alert(`Slot ${slot.slot_number} zapisany!`);
    } catch (err) {
      console.error(err);
      alert(`Błąd przy zapisie slotu ${slot.slot_number}`);
    }
  };

  return (
    <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
      {/* Sloty 1-6 */}
      <div>
        <h2 className="font-bold mb-4 text-contrast text-xl">
          Sloty 1-6 (Alkohol lub Mixer)
        </h2>
        <div className="space-y-4">
          {slots.slice(0, 6).map((slot, i) => {
            const currentType = slot.ingredient_type?.toUpperCase() as
              | "ALCOHOL"
              | "MIXER"
              | undefined;

            const ingredients =
              currentType === "ALCOHOL"
                ? alcohols
                : currentType === "MIXER"
                ? mixers
                : [];

            return (
              <div
                key={slot.slot_number}
                className="flex items-center p-4 bg-back rounded-xl shadow-md space-x-4"
              >
                <span className="w-20 font-semibold">{slot.slot_number}</span>

                {/* Select typu */}
                <Select
                  value={currentType || ""}
                  onValueChange={(val) =>
                    handleTypeChange(i, val as "alcohol" | "mixer")
                  }
                >
                  <SelectTrigger className="w-32 bg-white text-contrast">
                    <SelectValue placeholder="-- Typ --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALCOHOL">Alkohol</SelectItem>
                    <SelectItem value="MIXER">Mixer</SelectItem>
                  </SelectContent>
                </Select>

                {/* Select składnika */}
                <Select
                  value={slot.ingredient_id?.toString() || ""}
                  onValueChange={(val) =>
                    handleIngredientChange(i, Number(val))
                  }
                  disabled={!currentType}
                >
                  <SelectTrigger className="w-48 bg-white text-contrast">
                    <SelectValue placeholder="-- Składnik --" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients
                      .filter(
                        (ing) =>
                          ing.name === "Brak" ||
                          !slots.some(
                            (s, idx) =>
                              idx !== i &&
                              s.ingredient_id === ing.id &&
                              s.ingredient_type?.toUpperCase() === currentType
                          )
                      )
                      .map((ing) => (
                        <SelectItem key={ing.id} value={ing.id.toString()}>
                          {ing.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => handleSaveSlot(slot)}
                  disabled={!slot.ingredient_type || !slot.ingredient_id}
                >
                  Zapisz
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sloty 7-10 (tylko Mixery) */}
      <div>
        <h2 className="font-bold mb-4 text-contrast text-xl">
          Sloty 7-10 (Tylko Mixery)
        </h2>
        <div className="space-y-4">
          {slots.slice(6, 10).map((slot, i) => (
            <div
              key={slot.slot_number}
              className="flex items-center p-4 bg-back rounded-xl shadow-md space-x-4"
            >
              <span className="w-20 font-semibold">{slot.slot_number}</span>

              <Select
                value={slot.ingredient_id?.toString() || ""}
                onValueChange={(val) =>
                  handleIngredientChange(i + 6, Number(val))
                }
              >
                <SelectTrigger className="w-48 bg-white text-contrast">
                  <SelectValue placeholder="-- Składnik --" />
                </SelectTrigger>
                <SelectContent>
                  {mixers
                    .filter(
                      (m) =>
                        m.name === "Brak" ||
                        !slots.some(
                          (s, idx) =>
                            idx !== i + 6 &&
                            s.ingredient_id === m.id &&
                            s.ingredient_type?.toUpperCase() === "MIXER"
                        )
                    )
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Button
                onClick={() => handleSaveSlot(slot)}
                disabled={!slot.ingredient_id}
              >
                Zapisz
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MachineSlots;
