import type { Alcohol, Mixers, TypeMixer } from "@/interface/IIngredientl";
import React, { useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";

interface FormData {
  type: "alcohol" | "mixer";
  name: string;
  abv?: number;
  volume_ml?: number;
  mixerType?: TypeMixer;
}

export default function AddComponent() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({ type: "alcohol", name: "" });

  const isAlcohol = form.type === "alcohol";

  const updateType = (value: "alcohol" | "mixer") =>
    setForm((prev) => ({ ...prev, type: value }));
  const updateName = (value: string) =>
    setForm((prev) => ({ ...prev, name: value }));
  const updateAbv = (value: string) =>
    setForm((prev) => ({ ...prev, abv: value ? Number(value) : undefined }));
  const updateVolume = (value: string) =>
    setForm((prev) => ({
      ...prev,
      volume_ml: value ? Number(value) : undefined,
    }));
  const updateMixerType = (value: TypeMixer) =>
    setForm((prev) => ({ ...prev, mixerType: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint =
        form.type === "alcohol"
          ? "/ingredients/alcohols"
          : "/ingredients/mixers";

      if (isAlcohol) {
        const payload: Omit<Alcohol, "id"> = {
          name: form.name,
          available: true,
          volume_ml: form.volume_ml ?? 0,
          abv: form.abv ?? 0,
        };
        await api.post(endpoint, payload, { silentError: true });
      } else {
        const payload: Omit<Mixers, "id"> = {
          name: form.name,
          available: true,
          volume_ml: form.volume_ml ?? 0,
          type: form.mixerType ?? "other",
        };
        await api.post(endpoint, payload, { silentError: true });
      }

      toast.success("Składnik dodany poprawnie!");
      setForm({ type: "alcohol", name: "" });
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się dodać składnika.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-back text-contrast shadow-xl rounded-2xl border border-acent">
      <h2 className="text-2xl font-semibold text-center mb-6">
        Dodaj składnik
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Typ składnika */}
        <div>
          <label className="font-medium">Typ składnika</label>
          <select
            value={form.type}
            onChange={(e) => updateType(e.target.value as "alcohol" | "mixer")}
            className="w-full p-2 mt-1 border rounded border-acent"
          >
            <option value="alcohol">Alkochol</option>
            <option value="mixer">Dodatek</option>
          </select>
        </div>

        {/* Nazwa */}
        <div>
          <label className="font-medium">Nazwa</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateName(e.target.value)}
            className="w-full border p-2 rounded mt-1 text-contrast border-acent"
            placeholder="np. Vodka, Lime Juice"
            required
          />
        </div>

        {/* ABV */}
        {isAlcohol && (
          <div>
            <label className="font-medium">Zawartość alkoholu (% ABV)</label>
            <input
              type="number"
              step="0.1"
              value={form.abv ?? ""}
              onChange={(e) => updateAbv(e.target.value)}
              className="w-full border p-2 rounded mt-1 border-acent text-contrast"
              placeholder="np. 40"
            />
          </div>
        )}

        {/* Mixer type */}
        {!isAlcohol && (
          <div>
            <label className="font-medium">Typ dodatku</label>
            <select
              value={form.mixerType ?? "other"}
              onChange={(e) => updateMixerType(e.target.value as TypeMixer)}
              className="w-full border p-2 rounded mt-1 border-acent text-contrast"
            >
              <option value="other">Inny</option>
              <option value="juice">Sok</option>
              <option value="soda">Napój gazowany</option>
              <option value="syrup">Syrop</option>
            </select>
          </div>
        )}

        {/* Ilość ML */}
        <div>
          <label className="font-medium">Domyślna ilość (ml)</label>
          <input
            type="number"
            value={form.volume_ml ?? ""}
            onChange={(e) => updateVolume(e.target.value)}
            className="w-full border p-2 rounded mt-1 border-acent text-contrast"
            placeholder="np. 700"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-2 bg-main text-back rounded-xl shadow hover:opacity-90 transition"
          disabled={loading}
        >
          {loading ? "Zapisuję..." : "Dodaj"}
        </button>
      </form>
    </div>
  );
}
