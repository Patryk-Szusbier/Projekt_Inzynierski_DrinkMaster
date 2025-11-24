import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios"; // Twój axios
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { TokenResponse } from "@/interface/ITokenResponse";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const data = await api.post<TokenResponse>("/users/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      localStorage.setItem("token", data.access_token);
      navigate("/main"); // przekierowanie po zalogowaniu
    } catch (err) {
      setError("Nieprawidłowy login lub hasło");
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
              Logowanie
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
              type="text"
              placeholder="Twój login"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 border-gray-300 focus:border-main focus:ring-main"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-700">
              Hasło
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 border-gray-300 focus:border-main focus:ring-main"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button
            className="w-full bg-main text-white hover:bg-main/90 transition-colors"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logowanie..." : "Zaloguj się"}
          </Button>
          <Button
            variant="outline"
            className="w-full border-main text-main hover:bg-main/10"
            onClick={() => navigate("/register")}
          >
            Utwórz konto
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
