import { createContext, useContext, useEffect, useState } from "react";
import { apiLogin, apiMe } from "../../lib/api";
import { getToken, saveToken, clearToken } from "../../lib/authStorage";
import { useRouter } from "expo-router";
import type { User } from "@/interface/IUser";

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const token = await getToken();
      if (!token) return;

      const me = await apiMe(token);
      setUser(me);
    } catch {
      await clearToken();
    } finally {
      setLoading(false);
    }
  }

  async function login(username: string, password: string) {
    try {
      const { access_token } = await apiLogin(username, password);
      await saveToken(access_token);

      const me = await apiMe(access_token);
      setUser(me);
    } catch (e: any) {
      console.error("Login error:", e);
      throw e;
    }
  }

  async function logout() {
    await clearToken();
    setUser(null);
    router.replace("./login");
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
