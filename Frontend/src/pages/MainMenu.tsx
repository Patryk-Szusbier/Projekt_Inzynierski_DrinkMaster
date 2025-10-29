import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MdLogout } from "react-icons/md";
interface MainMenuProps {
  username: string;
}

const MainMenu: React.FC<MainMenuProps> = ({ username }) => {
  const tiles = [
    { label: "Menu", emoji: "🍹" },
    { label: "Ustawienia", emoji: "⚙️" },
    { label: "Dodaj", emoji: "➕" },
  ];

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Pasek użytkownika */}
      <div className="absolute top-6 right-8 flex items-center space-x-3">
        <span className="text-contrast font-semibold">{username}</span>
        <Button
          variant="outline"
          className="w-10 h-10 rounded-full border-2 text-accent border-main bg-main/80"
        >
          <MdLogout />
        </Button>
      </div>

      {/* Sekcja kafelków */}
      <div className="flex space-x-10">
        {tiles.map((item) => (
          <motion.div
            key={item.label}
            whileTap={{ scale: 0.9 }}
            className="w-48 h-48 border-2 border-contrast text-accent bg-main rounded-3xl 
                       flex flex-col items-center justify-center 
                       hover:bg-main/50 transition-all duration-50
                       shadow-sm hover:shadow-md cursor-pointer select-none"
          >
            <span className="text-4xl mb-2">{item.emoji}</span>
            <span className="text-lg font-semibold ">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MainMenu;
