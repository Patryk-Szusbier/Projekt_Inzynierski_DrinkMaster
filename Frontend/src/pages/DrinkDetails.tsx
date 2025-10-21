import { Button } from "@/components/ui/button";
import Photos from "../assets/margarita.jpg";

interface DrinkDetailsProps {
  name: string;
  ingredients: string[];
}

const DrinkDetails: React.FC<DrinkDetailsProps> = ({ name, ingredients }) => {
  return (
    <>
      {/* Tło - zdjęcie z przycięciem */}
      <div
        className="absolute w-full h-full"
        style={{
          backgroundImage: `url(${Photos})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          transform: "translateX(-25%)",
          clipPath: "polygon(0 0, 93% 0, 37% 100%, 0% 100%)",
          zIndex: 10,
        }}
      />

      {/* Skośna linia */}
      <div className="absolute left-25 bottom-0 w-[800px] h-[3px] bg-main rotate-313 origin-bottom-left z-20" />

      {/* Prawa strona – nazwa i skład */}
      <div className="absolute right-8 top-[80px] flex flex-col space-y-3 w-[300px]">
        {/* Nazwa z liniami */}
        <div className="flex items-center justify-center w-full">
          <div className="grow h-[2px] bg-main mr-3" />
          <span className="text-lg font-semibold whitespace-nowrap text-center">
            {name}
          </span>
          <div className="grow h-[2px] bg-main ml-3" />
        </div>

        {/* Skład */}
        <div className="text-base mt-4 font-medium text-center">Skład:</div>
        <ul className="list-none space-y-1 text-gray-700 text-left">
          {ingredients.map((item, index) => (
            <li key={index}> {item}</li>
          ))}
        </ul>
      </div>

      {/* Przycisk w prawym dolnym rogu */}
      <div className="absolute bottom-8 right-12 z-30">
        <Button variant="outline">Miksuj</Button>
      </div>
    </>
  );
};

export default DrinkDetails;
