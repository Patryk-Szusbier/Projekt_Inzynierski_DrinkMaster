import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const Login: React.FC = () => {
  return (
    <div className="w-screen h-screen flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute bottom-0 w-[800px] h-[3px] bg-main origin-bottom-left"
        style={{ transform: "rotate(-47deg)", left: "25px", opacity: 0.6 }}
      />

      {/* Karta logowania */}
      <Card className="relative z-20 w-[360px] shadow-md bg-white border border-main/30 rounded-2xl">
        <CardHeader>
          {/* Tytuł z liniami */}
          <div className="flex items-center justify-center w-full">
            <div className="grow h-[2px] bg-main mr-3" />
            <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">
              Logowanie
            </h2>
            <div className="grow h-[2px] bg-main ml-3" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-gray-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@mail.com"
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
              className="mt-1 border-gray-300 focus:border-main focus:ring-main"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button className="w-full bg-main text-white hover:bg-main/90 transition-colors">
            Zaloguj się
          </Button>
          <Button
            variant="outline"
            className="w-full border-main text-main hover:bg-main/10"
          >
            Utwórz konto
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
