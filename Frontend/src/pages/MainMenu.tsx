import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MdLogout } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import type { User } from "@/interface/IUser";

const tiles = [
  { label: "Menu", emoji: "🍹", path: "/main/drinks" },
  { label: "Opcje", emoji: "⚙️", path: "/main/option" },
  { label: "Dodaj", emoji: "➕", path: "/main/add" },
];

const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
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
        <span className="text-contrast text-lg font-semibold">
          {user?.username}
        </span>
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            variant="outline"
            className="w-12 h-12 rounded-full border-3  border-main bg-main/80"
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
            onClick={() => navigate(item.path)}
            onTouchStart={() => setActive(true)}
            onTouchEnd={() => setActive(false)}
            className={`
             w-64 h-64 border-2 border-b-4 border-r-3 border-contrast bg-main rounded-3xl 
             flex flex-col items-center justify-center
             transition-all duration-50
             shadow-sm cursor-pointer select-none
             ${active ? "bg-acent/50 shadow-md" : ""}
           `}
          >
            <span className="text-4xl mb-2">{item.emoji}</span>
            <span className="text-xl text-white font-semibold">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MainMenu;
