import BackButton from "@/components/BackButton/BackButton";
import React from "react";
import { Outlet, useLocation } from "react-router-dom";

const DefaultLayout: React.FC = () => {
  const location = useLocation();
  const isMainRoute = location.pathname === "/main";

  return (
    <div className="relative w-screen h-screen text-contrast bg-linear-to-br from-back to-main">
      {!isMainRoute && (
        <div className="fixed top-0 left-0 w-full h-20 bg-contrast/10 backdrop-blur-lg z-20 flex items-center px-4">
          <BackButton />
        </div>
      )}

      <main
        className={`${
          !isMainRoute ? "pt-8" : ""
        } relative z-10 overflow-y-auto max-h-screen`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default DefaultLayout;
