import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import type { Drink } from "@/interface/IDrink";

const DrinkMenu: React.FC = () => {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFavorites, setShowFavorites] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDrinks = async () => {
      try {
        const [drinkData, favoriteData] = await Promise.all([
          api.get<Drink[]>("/drinks/drinks/available"),
          api.get<Drink[]>("/favorite_drinks/"),
        ]);

        setDrinks(drinkData);
        setFavorites(favoriteData.map((d) => d.id));
      } catch (error) {
        console.error("Błąd pobierania drinków lub ulubionych:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrinks();
  }, []);

  const toggleFavorite = async (drinkId: number) => {
    try {
      if (favorites.includes(drinkId)) {
        await api.delete(`/favorite_drinks/${drinkId}`);
        setFavorites((prev) => prev.filter((id) => id !== drinkId));
      } else {
        await api.post(`/favorite_drinks/${drinkId}`);
        setFavorites((prev) => [...prev, drinkId]);
      }
    } catch (error) {
      console.error("Błąd zmiany ulubionego drinka:", error);
    }
  };

  // Filtruj drinki jeśli aktywny filtr ulubionych
  const filteredDrinks = showFavorites
    ? drinks.filter((d) => favorites.includes(d.id))
    : drinks;

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-6 p-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-[250px] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-10">
      {/* Pasek z przyciskiem */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-contrast">Menu drinków</h1>
        <Button
          variant="outline"
          className="text-contrast border-contrast bg-white/40 hover:text-white"
          onClick={() => setShowFavorites((prev) => !prev)}
        >
          {showFavorites ? "Wszystkie" : "Ulubione ❤️"}
        </Button>
      </div>

      {/* Lista drinków */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDrinks.map((drink) => (
          <div
            key={drink.id}
            onClick={() =>
              navigate(`/main/drinks/${drink.id}`, { state: { drink } })
            }
            className="relative h-[250px] rounded-2xl overflow-hidden shadow-md 
            cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
          >
            {/* Zdjęcie */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${
                  drink.image_url || "/placeholder.jpg"
                })`,
              }}
            />

            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black bg-opacity-30 
              hover:bg-opacity-40 transition-all duration-300"
            />

            {/* Nazwa */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center z-20">
              <span
                className="text-contrast text-xl font-semibold bg-white/80 px-4 py-1 
                rounded-full shadow-sm backdrop-blur-sm"
              >
                {drink.name}
              </span>
            </div>

            {/* Serduszko */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(drink.id);
              }}
              className="absolute top-3 right-3 z-30"
            >
              <Heart
                className={`w-7 h-7 transition-colors duration-300 ${
                  favorites.includes(drink.id)
                    ? "fill-red-500 text-red-500"
                    : "text-white opacity-70 hover:opacity-100"
                }`}
              />
            </button>
          </div>
        ))}

        {filteredDrinks.length === 0 && (
          <div className="col-span-full text-center text-contrast font-medium">
            {showFavorites
              ? "Nie masz jeszcze ulubionych drinków ❤️"
              : "Brak dostępnych drinków do wykonania 🍸"}
          </div>
        )}
      </div>
    </div>
  );
};

export default DrinkMenu;
