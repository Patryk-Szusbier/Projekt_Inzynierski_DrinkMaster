import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MainMenu from "./pages/MainMenu";
import MachineSlots from "./pages/Options/MachineSlots";
import DefaultLayout from "./pages/Default/DefaultLayout";
import DrinkMenu from "./pages/DrinkMenu";
import DrinkDetails from "./pages/DrinkDetails";

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
    <Routes>
      <Route element={<DefaultLayout />}>
        {/* Publiczne tylko dla niezalogowanych */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Chronione strony */}
        <Route element={<ProtectedRoute />}>
          <Route path="/main" element={<DefaultLayout />}>
            <Route index element={<MainMenu />} />
            <Route path="option" element={<MachineSlots />} />
            <Route path="drinks" element={<DrinkMenu />} />
            <Route path="drinks/:id" element={<DrinkDetails />} />
          </Route>
        </Route>

        {/* Domyślne przekierowanie */}
        <Route
          path="*"
          element={<Navigate to={isLoggedIn() ? "/main" : "/login"} />}
        />
      </Route>
    </Routes>
  );
};

export default RoutesConfig;
