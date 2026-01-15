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

interface UserOut {
  id: number;
  username: string;
  email: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");
    if (password !== confirmPassword) {
      setError("Hasla nie sa takie same");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<UserOut>("/users/register", {
        username,
        email,
        password,
      });

      console.log("Uzytkownik zarejestrowany:", response);
      navigate("/login");
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.detail ||
            "Wystapil blad przy rejestracji"
        );
      } else {
        setError("Wystapil nieznany blad");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute bottom-0 w-screen h-[5px] bg-main origin-bottom-left"
        style={{ transform: "rotate(-47deg)", left: "25vh", opacity: 0.5 }}
      />

      <Card className="relative z-20 w-[360px] shadow-md bg-white border border-main/30 rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-center w-full">
            <div className="grow h-0.5 bg-main mr-3" />
            <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">
              Rejestracja
            </h2>
            <div className="grow h-0.5 bg-main ml-3" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-gray-700">
              Username
            </Label>
            <Input
              id="username"
              placeholder="Twoj login"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 border-gray-300 focus:border-main focus:ring-main"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-gray-700">
              Email
            </Label>
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
            <Label htmlFor="password" className="text-gray-700">
              Haslo
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 border-gray-300 focus:border-main focus:ring-main"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-gray-700">
              Powtorz haslo
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="********"
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
            {loading ? "Rejestracja..." : "Zarejestruj sie"}
          </Button>
          <Button
            variant="outline"
            className="w-full border-main text-main hover:bg-main/10"
            onClick={() => navigate("/login")}
          >
            Mam juz konto
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
