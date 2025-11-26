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
        const [drinksData, favoriteData] = await Promise.all([
          api.get<Drink[]>("/drinks/available"),
          api.get<Drink[]>("/favorite_drinks/"),
        ]);

        setDrinks(drinksData);
        setFavorites(favoriteData.map((d: Drink) => d.id));
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

  const filteredDrinks = showFavorites
    ? drinks.filter((d) => favorites.includes(d.id))
    : drinks;

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-10 p-12">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-full h-[300px] rounded-3xl" />
        ))}
      </div>
    );
  }
  return (
    <div className="p-12 ">
      {/* Pasek z przyciskiem */}
      <div className="fixed flex justify-between w-screen items-center mb-2 ">
        <h1 className="text-3xl font-semibold text-contrast">
          Wybierz swój napój:
        </h1>
        <Button
          variant="outline"
          className="text-contrast border-contrast bg-white/40 hover:text-white mx-20 px-4 py-2 text-lg"
          onClick={() => setShowFavorites((prev) => !prev)}
        >
          {showFavorites ? "Wszystkie" : "Ulubione ❤️"}
        </Button>
      </div>

      {/* Lista drinków */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-16">
        {filteredDrinks.map((drink) => (
          <div
            key={drink.id}
            onClick={() =>
              navigate(`/main/drinks/${drink.id}`, { state: { drink } })
            }
            className="relative h-[300px] rounded-3xl overflow-hidden shadow-lg 
            cursor-pointer transition-transform duration-300 hover:scale-[1.05] hover:shadow-2xl"
          >
            {/* Zdjęcie */}
            <img
              src={`${import.meta.env.VITE_API_URL}/drinkPhotos/${
                drink.image_url
              }`}
              alt={drink.name}
              className="w-full h-full object-cover"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/25 bg-opacity-25 hover:bg-opacity-35 transition-all duration-300" />
            {}
            {/* Nazwa */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center z-20">
              <span
                className="text-contrast text-xl font-semibold bg-white/80 px-2 py-2 
                rounded-full shadow-md backdrop-blur-sm"
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
              className="absolute top-4 right-4 z-30"
            >
              <Heart
                className={`w-8 h-8 transition-colors duration-300 ${
                  favorites.includes(drink.id)
                    ? "fill-red-500 text-red-500"
                    : "text-white opacity-70 hover:opacity-100"
                }`}
              />
            </button>
          </div>
        ))}

        {filteredDrinks.length === 0 && (
          <div className="col-span-full text-center text-contrast font-medium text-lg">
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
