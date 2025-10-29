import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AxiosError } from "axios";

// Typ odpowiedzi z backendu (przykładowy)
interface UserOut {
  id: number;
  username: string;
  email: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");
    if (password !== confirmPassword) {
      setError("Hasła nie są takie same");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<UserOut>("/users/register", {
        username: name,
        email,
        password,
      });

      console.log("Użytkownik zarejestrowany:", response);
      navigate("/login"); // po rejestracji przekierowanie do logowania
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.detail || "Wystąpił błąd przy rejestracji"
        );
      } else {
        setError("Wystąpił nieznany błąd");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center relative overflow-hidden text-contrast">
      {/* Dekoracyjna linia */}
      <div
        className="absolute bottom-0 w-[900px] h-[3px] bg-main origin-bottom-left"
        style={{ transform: "rotate(-37deg)", left: "25px", opacity: 0.4 }}
      />

      <Card className="relative z-20 w-[380px] shadow-md bg-white border border-main/30 rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-center w-full">
            <div className="grow h-[2px] bg-main mr-3" />
            <h2 className="text-2xl font-bold whitespace-nowrap">
              Rejestracja
            </h2>
            <div className="grow h-[2px] bg-main ml-3" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Imię i nazwisko</Label>
            <Input
              id="name"
              placeholder="Jan Kowalski"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 border-gray-300 focus:border-main focus:ring-main"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 border-gray-300 focus:border-main focus:ring-main"
            />
          </div>

          <div>
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 border-gray-300 focus:border-main focus:ring-main"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Powtórz hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 border-gray-300 focus:border-main focus:ring-main"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button
            className="w-full bg-main text-white hover:bg-main/90 transition-colors"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Rejestracja..." : "Zarejestruj się"}
          </Button>
          <Button
            variant="outline"
            className="w-full border-main text-main hover:bg-main/10"
            onClick={() => navigate("/login")}
          >
            Mam już konto
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
