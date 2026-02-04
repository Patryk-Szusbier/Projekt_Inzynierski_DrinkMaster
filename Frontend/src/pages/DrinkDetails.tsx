import { Button } from "@/components/ui/button";
import type { Drink } from "@/interface/IDrink";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";

interface IngredientLookup {
  alcohols: Record<number, string>;
  mixers: Record<number, string>;
}

const DrinkDetails: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const drink: Drink | undefined = state?.drink;

  const [lookup, setLookup] = useState<IngredientLookup>({
    alcohols: {},
    mixers: {},
  });
  const [isMixing, setIsMixing] = useState(false);

  // ⬇️ Pobranie tylko potrzebnych składników
  useEffect(() => {
    const fetchIngredients = async () => {
      if (!drink) return;

      try {
        const alcoholIds = drink.ingredients
          .filter((i) => i.ingredient_type === "alcohol")
          .map((i) => i.ingredient_id);

        const mixerIds = drink.ingredients
          .filter((i) => i.ingredient_type === "mixer")
          .map((i) => i.ingredient_id);

        const [alcohols, mixers] = await Promise.all([
          alcoholIds.length
            ? api.get<{ id: number; name: string }[]>(
                `/ingredients/alcohols?ids=${alcoholIds.join(",")}`
              )
            : Promise.resolve([]),
          mixerIds.length
            ? api.get<{ id: number; name: string }[]>(
                `/ingredients/mixers?ids=${mixerIds.join(",")}`
              )
            : Promise.resolve([]),
        ]);

        setLookup({
          alcohols: Object.fromEntries(alcohols.map((a) => [a.id, a.name])),
          mixers: Object.fromEntries(mixers.map((m) => [m.id, m.name])),
        });
      } catch (error) {
        console.error("Błąd pobierania składników", error);
      }
    };

    fetchIngredients();
  }, [drink]);

  if (!drink) {
    return (
      <div className="text-center text-contrast font-medium mt-20">
        Nie znaleziono danych drinka 🥺
      </div>
    );
  }

  const isDoneResponse = (response: unknown) => {
    if (response === "Done") return true;
    if (typeof response !== "object" || response === null) return false;

    const payload = response as {
      status?: string;
      message?: string;
      done?: boolean;
    };

    return (
      payload.done === true ||
      payload.status === "Done" ||
      payload.message === "Done"
    );
  };

  const handleMix = async () => {
    if (!drink || isMixing) return;
    setIsMixing(true);

    try {
      const response = await api.post(
        `/frame/drink_frame/${drink.id}/send`,
        undefined,
        { silentError: true }
      );

      if (isDoneResponse(response)) {
        navigate(-1);
        return;
      }

      toast.error("Brak potwierdzenia 'Done' z urządzenia.");
    } catch (error) {
      console.error("Błąd wysyłania ramki UART", error);
      toast.error("Nie udało się wysłać ramki do urządzenia.");
    } finally {
      setIsMixing(false);
    }
  };

  return (
    <>
      {/* Tło */}
      <div className="relative w-screen h-screen aspect-5/3">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${import.meta.env.VITE_API_URL}/drinkPhotos/${
              drink.image_url
            })`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            clipPath: "polygon(0% 7%, 93% 7%, 40% 100%, 0% 100%)",
            transform: "translateX(-28%) translateY(-5%)",
            zIndex: 30,
          }}
        />
      </div>

      {/* Skośna linia */}
      <div className="absolute left-40 bottom-0 w-screen h-[5px] bg-main rotate-315 origin-bottom-left z-20" />

      {/* Prawa strona */}
      <div className="absolute right-12 top-32 flex flex-col space-y-5 w-[480px] z-10">
        {/* Nazwa */}
        <div className="flex items-center justify-center w-full">
          <div className="grow h-1 bg-main mr-4" />
          <span className="text-4xl font-semibold whitespace-nowrap text-center">
            {drink.name}
          </span>
          <div className="grow h-1 bg-main ml-4" />
        </div>
        <span className="italic text-lg mt-2">{drink.description}</span>
        {/* Skład */}
        <div className="text-2xl font-medium">Skład:</div>
        <ul className="list-none space-y-2 text-left text-xl">
          {drink.ingredients.map((item, i) => {
            const name =
              item.ingredient_type === "alcohol"
                ? lookup.alcohols[item.ingredient_id]
                : lookup.mixers[item.ingredient_id];

            return (
              <li key={i}>
                <b>{name || "?"}</b> – {item.amount_ml}ml
              </li>
            );
          })}
        </ul>
      </div>

      {/* Przycisk */}
      <div className="absolute bottom-44 right-28 z-40">
        <Button
          variant="outline"
          className="px-6 py-2 text-lg"
          onClick={handleMix}
          disabled={isMixing}
        >
          {isMixing ? "Miksuję..." : "Miksuj"}
        </Button>
      </div>
    </>
  );
};

export default DrinkDetails;
