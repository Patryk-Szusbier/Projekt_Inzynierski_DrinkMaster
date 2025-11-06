import { Button } from "@/components/ui/button";
import Photos from "../assets/margarita.jpg";
import type { Drink } from "@/interface/IDrink";
import { useLocation, useNavigate } from "react-router-dom";

const DrinkDetails: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const drink: Drink | undefined = state?.drink;

  if (!drink) {
    return (
      <div className="text-center text-contrast font-medium mt-20">
        Nie znaleziono danych drinka 🥺
      </div>
    );
  }

  return (
    <>
      {/* Tło - zdjęcie z przycięciem */}
      <div className="relative w-full max-w-[800px] aspect-5/3">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${drink.image_url || Photos})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            clipPath: "polygon(0 0, 93% 0, 37% 100%, 0% 100%)",
            transform: "translateX(-25%)",
            zIndex: 10,
          }}
        />
      </div>

      {/* Skośna linia */}
      <div className="absolute left-25 bottom-0 w-[800px] h-[3px] bg-main rotate-313 origin-bottom-left z-20" />

      {/* Prawa strona – nazwa i skład */}
      <div className="absolute right-8 top-[80px] flex flex-col space-y-3 w-[300px]">
        {/* Nazwa z liniami */}
        <div className="flex items-center justify-center w-full">
          <div className="grow h-[2px] bg-main mr-3" />
          <span className="text-lg font-semibold whitespace-nowrap text-center">
            {drink.name}
          </span>
          <div className="grow h-[2px] bg-main ml-3" />
        </div>

        {/* Skład */}
        <div className="text-base mt-4 font-medium text-center">Skład:</div>
        <ul className="list-none space-y-1 text-gray-700 text-left">
          {drink.ingredients.map((item, i) => (
            <li key={i}>
              <b>{item.note}</b> – {item.amount_ml}
              ml
            </li>
          ))}
        </ul>
      </div>

      {/* Przycisk */}
      <div className="absolute bottom-24 right-12 z-30">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Miksuj
        </Button>
      </div>
    </>
  );
};

export default DrinkDetails;
