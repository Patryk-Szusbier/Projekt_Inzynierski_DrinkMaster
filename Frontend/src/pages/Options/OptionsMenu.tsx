import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MdTune, MdWifi } from "react-icons/md";

const tiles = [
  { label: "Sloty maszyny", icon: MdTune, path: "/main/option/slots" },
  { label: "WiFi", icon: MdWifi, path: "/main/option/wifi" },
];

const OptionsMenu: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="flex space-x-10">
        {tiles.map((item) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className="
                w-64 h-64 border-2 border-b-4 border-r-3 border-contrast bg-main rounded-3xl
                flex flex-col items-center justify-center
                transition-all duration-75
                shadow-sm cursor-pointer select-none
              "
            >
              <Icon className="text-5xl text-white mb-3" />
              <span className="text-xl text-white font-semibold">
                {item.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default OptionsMenu;
