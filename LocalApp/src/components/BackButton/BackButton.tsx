import React from "react";
import { useNavigate } from "react-router-dom";

const BackButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center rounded-md
                 bg-back/80 hover:bg-back text-contrast
                 border-2 border-main shadow-md transition-colors"
    >
      &lt;
    </button>
  );
};

export default BackButton;
