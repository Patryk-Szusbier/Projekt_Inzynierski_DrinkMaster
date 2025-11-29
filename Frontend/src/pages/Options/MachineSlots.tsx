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
import type { Ingredient } from "@/interface/IIngredientl";
import type { MachineSlot, MachineFiller } from "@/interface/ISlot";
import { toast } from "sonner";

const MachineSlots: React.FC = () => {
  const [alcohols, setAlcohols] = useState<Ingredient[]>([]);
  const [mixers, setMixers] = useState<Ingredient[]>([]);
  const [slots, setSlots] = useState<MachineSlot[]>([]); // sloty 1–6
  const [fillers, setFillers] = useState<MachineFiller[]>([]); // sloty 7–10

  const formatTypeForBackend = (type: "ALCOHOL" | "MIXER") =>
    type.toLowerCase();

  useEffect(() => {
    const fetchData = async () => {
      const [alc, mix, machineSlots, machineFillers] = await Promise.all([
        api.get<Ingredient[]>("/ingredients/alcohols"),
        api.get<Ingredient[]>("/ingredients/mixers"),
        api.get<MachineSlot[]>("/ingredients/machine_slots"),
        api.get<MachineFiller[]>("/ingredients/machine_fillers"),
      ]);

      setAlcohols(alc);
      setMixers(mix);
      setSlots(machineSlots.sort((a, b) => a.slot_number - b.slot_number));
      setFillers(machineFillers.sort((a, b) => a.slot_number - b.slot_number));
    };

    fetchData();
  }, []);

  // ---- SLOTY 1–6 ----
  const handleTypeChange = (slotIndex: number, type: "alcohol" | "mixer") => {
    const updatedSlots = [...slots];
    updatedSlots[slotIndex] = {
      ...updatedSlots[slotIndex],
      ingredient_type: type,
      ingredient_id: 0,
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

  const handleSaveSlot = async (slot: MachineSlot) => {
    if (!slot.ingredient_type || !slot.ingredient_id) {
      toast.error("Wybierz typ i składnik przed zapisaniem!");
      return;
    }

    try {
      const payload = {
        ingredient_type: formatTypeForBackend(
          slot.ingredient_type.toUpperCase() as "ALCOHOL" | "MIXER"
        ),
        ingredient_id: slot.ingredient_id,
        volume_ml: slot.volume_ml ?? 0,
        active: true,
      };

      await api.put(`/ingredients/machine_slots/${slot.slot_number}`, payload);
      toast.success(`Slot ${slot.slot_number} zapisany!`);
    } catch (err) {
      console.error(err);
      toast.error(`Błąd przy zapisie slotu ${slot.slot_number}`);
    }
  };

  // ---- FILLERY 7–10 ----
  const handleFillerChange = (index: number, ingredientId: number) => {
    const updated = [...fillers];
    updated[index] = {
      ...updated[index],
      mixer_id: ingredientId,
    };
    setFillers(updated);
  };

  const handleSaveFiller = async (filler: MachineFiller) => {
    if (!filler.mixer_id) {
      toast.error("Wybierz mixer przed zapisaniem!");
      return;
    }

    try {
      const payload = {
        mixer_id: filler.mixer_id,
        volume_ml: filler.volume_ml ?? 0,
        active: true,
      };

      await api.put(
        `/ingredients/machine_fillers/${filler.slot_number}`,
        payload
      );
      toast.success(`Slot ${filler.slot_number} zapisany!`);
    } catch (err) {
      console.error(err);
      toast.error(`Błąd przy zapisie slotu ${filler.slot_number}`);
    }
  };

  return (
    <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
      {/* Sloty 1-6 */}
      <div>
        <h2 className="font-bold mb-4 text-contrast text-xl">
          Sloty 1-6 (Dozowniki)
        </h2>

        <div className="space-y-4">
          {slots.map((slot, i) => {
            const currentType = slot.ingredient_type?.toUpperCase() as
              | "ALCOHOL"
              | "MIXER"
              | undefined;

            const ingredients =
              currentType === "ALCOHOL"
                ? alcohols.filter(
                    (a) =>
                      !slots.some(
                        (s, idx) =>
                          idx !== i &&
                          s.ingredient_type === "alcohol" &&
                          s.ingredient_id === a.id
                      )
                  )
                : currentType === "MIXER"
                ? mixers.filter(
                    (m) =>
                      !slots.some(
                        (s, idx) =>
                          idx !== i &&
                          s.ingredient_type === "mixer" &&
                          s.ingredient_id === m.id
                      ) && !fillers.some((f) => f.mixer_id === m.id)
                  )
                : [];

            return (
              <div
                key={slot.slot_number}
                className="flex items-center p-4 bg-back border-r-3 border-r-acent border-b-4 border-b-acent rounded-xl shadow-md space-x-4"
              >
                <span className="w-20 font-semibold">{slot.slot_number}</span>

                <Select
                  value={currentType || ""}
                  onValueChange={(val) =>
                    handleTypeChange(i, val as "alcohol" | "mixer")
                  }
                >
                  <SelectTrigger className="w-32 bg-white border-acent text-contrast">
                    <SelectValue placeholder="-- Typ --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALCOHOL">Alkohol</SelectItem>
                    <SelectItem value="MIXER">Mixer</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={slot.ingredient_id?.toString() || ""}
                  onValueChange={(val) =>
                    handleIngredientChange(i, Number(val))
                  }
                  disabled={!currentType}
                >
                  <SelectTrigger className="w-48 bg-white border-acent text-contrast">
                    <SelectValue placeholder="-- Składnik --" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map((ing) => (
                      <SelectItem key={ing.id} value={ing.id.toString()}>
                        {ing.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => handleSaveSlot(slot)}
                  disabled={!slot.ingredient_type || !slot.ingredient_id}
                  className="bg-contrast "
                >
                  Zapisz
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sloty 7-10 */}
      <div>
        <h2 className="font-bold mb-4 text-contrast text-xl">Sloty 7-10</h2>

        <div className="space-y-4 ">
          {fillers.map((filler, i) => {
            const availableMixers = mixers.filter(
              (m) =>
                !fillers.some((f, idx) => idx !== i && f.mixer_id === m.id) &&
                !slots.some(
                  (s) =>
                    s.ingredient_type === "mixer" && s.ingredient_id === m.id
                )
            );

            return (
              <div
                key={filler.slot_number}
                className="flex items-center p-4 bg-back border-r-3 border-r-acent border-b-4 border-b-acent rounded-xl shadow-md space-x-4"
              >
                <span className="w-20 font-semibold">{filler.slot_number}</span>

                <Select
                  value={filler.mixer_id?.toString() || ""}
                  onValueChange={(val) => handleFillerChange(i, Number(val))}
                >
                  <SelectTrigger className="w-48 bg-white border-acent text-contrast">
                    <SelectValue placeholder="-- Składnik --" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMixers.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => handleSaveFiller(filler)}
                  disabled={!filler.mixer_id}
                  className="bg-contrast"
                >
                  Zapisz
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MachineSlots;
