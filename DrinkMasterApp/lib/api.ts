import axios from "axios";
import type { Drink, DrinkIngredient } from "@/interface/iDrink";
import { User } from "@/interface/IUser";
import { buildApiUrl, getApiBaseUrl } from "@/lib/serverDiscovery";

const api = axios.create({
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const baseURL = getApiBaseUrl();
  if (!baseURL) {
    throw new Error("API base URL is not configured");
  }
  config.baseURL = baseURL;
  return config;
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

export async function apiUpdateMe(
  token: string,
  payload: { username?: string; email?: string | null }
) {
  const { data } = await api.put<User>("/users/me", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return data;
}

export async function apiChangePassword(
  token: string,
  payload: { current_password: string; new_password: string }
) {
  const { data } = await api.put<{ detail: string }>(
    "/users/me/password",
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

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
export async function apiGetMyDrinks(token: string) {
  const res = await fetch(buildApiUrl("/drinks/my"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Nie udało się pobrać moich drinków");
  }

  return res.json();
}
/* ================= DRINKS ================= */

export async function apiGetDrinkById(drinkId: number, token: string) {
  const { data } = await api.get(`/drinks/${drinkId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data; // typ Drink
}

export async function apiUpdateDrink(
  drinkId: number,
  token: string,
  data: {
    name: string;
    description?: string;
    ingredients: DrinkIngredient[];
    image?: any; // opcjonalnie plik do uploadu
    is_public?: boolean; // dodane
  }
) {
  const formData = new FormData();
  formData.append("name", data.name);
  if (data.description) formData.append("description", data.description);
  formData.append("ingredients", JSON.stringify(data.ingredients));
  if (data.is_public !== undefined) {
    formData.append("is_public", data.is_public ? "true" : "false");
  }
  if (data.image) {
    formData.append("image", {
      uri: data.image.uri,
      type: data.image.type || "image/jpeg",
      name: data.image.name || "photo.jpg",
    } as any);
  }

  const { data: updated } = await api.put(`/drinks/${drinkId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return updated; // typ Drink
}

export async function apiCreateDrink(
  token: string,
  data: {
    name: string;
    description?: string;
    ingredients: DrinkIngredient[];
    image?: any;
    is_public?: boolean;
  }
) {
  const formData = new FormData();
  formData.append("name", data.name);
  if (data.description) formData.append("description", data.description);
  formData.append("ingredients", JSON.stringify(data.ingredients));
  if (data.is_public !== undefined) {
    formData.append("is_public", data.is_public ? "true" : "false");
  }
  if (data.image) {
    formData.append("image", {
      uri: data.image.uri,
      type: data.image.type || "image/jpeg",
      name: data.image.name || "photo.jpg",
    } as any);
  }

  const res = await fetch(buildApiUrl("/drinks/"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create drink failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function apiDeleteDrink(token: string, drinkId: number) {
  await api.delete(`/drinks/${drinkId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default api;
