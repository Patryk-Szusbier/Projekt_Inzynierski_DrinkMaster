// src/routes/Routes.tsx
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MainMenu from "./pages/MainMenu";
import MachineSlots from "./pages/Options/MachineSlots";
import DefaultLayout from "./pages/Default/DefaultLayout";

// Funkcja sprawdzająca, czy użytkownik jest zalogowany
const isLoggedIn = () => !!localStorage.getItem("token");

// Public route – dostępne tylko dla niezalogowanych
const PublicRoute = () => {
  return isLoggedIn() ? <Navigate to="/main" /> : <Outlet />;
};

// Protected route – dostępne tylko dla zalogowanych
const ProtectedRoute = () => {
  return isLoggedIn() ? <Outlet /> : <Navigate to="/login" />;
};

const RoutesConfig = () => {
  return (
    <>
      <Routes>
        {/* Publiczne strony */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Chronione strony */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DefaultLayout />}>
            <Route path="/main" element={<MainMenu />} />
            <Route path="/main/option" element={<MachineSlots />} />
          </Route>
        </Route>
        {/* Domyślne przekierowanie */}
        <Route
          path="*"
          element={<Navigate to={isLoggedIn() ? "/main" : "/login"} />}
        />
      </Routes>
    </>
  );
};

export default RoutesConfig;
