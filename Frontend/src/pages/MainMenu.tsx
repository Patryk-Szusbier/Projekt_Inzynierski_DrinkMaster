import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MdLogout } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import type { User } from "@/interface/IUser";

const tiles = [
  { label: "Menu", emoji: "🍹", path: "/main" },
  { label: "Opcje", emoji: "⚙️", path: "/main/option" },
  { label: "Dodaj", emoji: "➕", path: "/main/add" },
];

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await api.get<User>("/users/me");
        setUser(data);
      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <span>Ładowanie...</span>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Pasek użytkownika */}
      <div className="absolute top-6 right-8 flex items-center space-x-3">
        <span className="text-contrast font-semibold">{user?.username}</span>
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            variant="outline"
            className="w-10 h-10 rounded-full border-3  text-accent border-main bg-main/80"
            onClick={handleLogout}
          >
            <MdLogout />
          </Button>
        </motion.div>
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
            onClick={() => navigate(item.path)}
          >
            <span className="text-4xl mb-2">{item.emoji}</span>
            <span className="text-lg font-semibold">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MainMenu;
