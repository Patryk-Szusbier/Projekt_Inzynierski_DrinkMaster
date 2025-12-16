import axios from "axios";
import type { Drink } from "@/interface/iDrink";
import { User } from "@/interface/IUser";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("EXPO_PUBLIC_API_URL is not defined");
}

// Tworzymy instancję axios z baseURL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================= AUTH ================= */

export async function apiLogin(username: string, password: string) {
  const body = new URLSearchParams();
  body.append("username", username);
  body.append("password", password);

  const { data } = await api.post<{ access_token: string }>(
    "/users/login",
    body.toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  return data;
}

export async function apiRegister(
  username: string,
  email: string,
  password: string
) {
  const { data } = await api.post("/users/register", {
    username,
    email,
    password,
  });

  return data; // typ zdefiniowany przez backend
}

export async function apiMe(token: string) {
  const { data } = await api.get<User>("/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
}

/* ================= DRINKS ================= */

export async function apiGetAvailableDrinks(token: string): Promise<Drink[]> {
  const { data } = await api.get<Drink[]>("/drinks/available", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
}

export async function apiGetFavoriteDrinks(token: string): Promise<Drink[]> {
  const { data } = await api.get<Drink[]>("/favorite_drinks", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
}

export async function apiAddFavoriteDrink(token: string, drinkId: number) {
  await api.post(
    `/favorite_drinks/${drinkId}`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

export async function apiRemoveFavoriteDrink(token: string, drinkId: number) {
  await api.delete(`/favorite_drinks/${drinkId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/* ================= INGREDIENTS ================= */

interface Ingredient {
  id: number;
  name: string;
}

export async function apiFetchIngredients(
  alcoholIds: number[],
  mixerIds: number[]
): Promise<{
  alcohols: Record<number, string>;
  mixers: Record<number, string>;
}> {
  const [alcohols, mixers]: [Ingredient[], Ingredient[]] = await Promise.all([
    alcoholIds.length
      ? api
          .get<Ingredient[]>(
            `/ingredients/alcohols?ids=${alcoholIds.join(",")}`
          )
          .then((res) => res.data)
      : Promise.resolve([] as Ingredient[]),
    mixerIds.length
      ? api
          .get<Ingredient[]>(`/ingredients/mixers?ids=${mixerIds.join(",")}`)
          .then((res) => res.data)
      : Promise.resolve([] as Ingredient[]),
  ]);

  return {
    alcohols: Object.fromEntries(alcohols.map((a) => [a.id, a.name])),
    mixers: Object.fromEntries(mixers.map((m) => [m.id, m.name])),
  };
}

export default api;
