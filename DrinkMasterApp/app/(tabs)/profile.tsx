import React, { useCallback, useEffect, useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../../components/Auth/AuthContext";
import MyDrinksMenu from "@/components/mydrinks";
import { apiGetMyDrinks, apiMe } from "@/lib/api";
import { getToken } from "@/lib/authStorage";
import { useIsFocused } from "@react-navigation/native";

type UserInfo = {
  username: string;
  created_at?: string;
  email?: string | null;
  role?: string;
};

export default function ProfilePage() {
  const { logout } = useAuth();
  const isFocused = useIsFocused();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [recipeCount, setRecipeCount] = useState<number | null>(null);

  const handleLogout = async () => {
    await logout();
  };

  const loadProfile = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [me, myDrinks] = await Promise.all([
        apiMe(token),
        apiGetMyDrinks(token),
      ]);

      setUserInfo({
        username: me.username,
        created_at: me.created_at,
        email: me.email,
        role: me.role,
      });
      setRecipeCount(myDrinks.length);
    } catch (e) {
      console.error("Blad pobierania profilu:", e);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadProfile();
    }
  }, [isFocused, loadProfile]);

  const formatJoinDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("pl-PL");
  };

  return (
    <View style={style.container}>
      <View style={style.header}>
        <View>
          <Text style={style.headerTitle}>Profil</Text>
          <Text style={style.headerSubtitle}>Twoje dane i receptury</Text>
        </View>
        <TouchableOpacity style={style.logoutButton} onPress={handleLogout}>
          <Text style={style.logoutText}>Wyloguj</Text>
        </TouchableOpacity>
      </View>

      <View style={style.profileCard}>
        <Text style={style.cardTitle}>Dane uzytkownika</Text>
        <View style={style.cardRow}>
          <Text style={style.cardLabel}>Username</Text>
          <Text style={style.cardValue}>{userInfo?.username || "-"}</Text>
        </View>
        <View style={style.cardRow}>
          <Text style={style.cardLabel}>Email</Text>
          <Text style={style.cardValue}>{userInfo?.email || "-"}</Text>
        </View>
        <View style={style.cardRow}>
          <Text style={style.cardLabel}>Rola</Text>
          <Text style={style.cardValue}>{userInfo?.role || "-"}</Text>
        </View>
        <View style={style.cardRow}>
          <Text style={style.cardLabel}>Data dolaczenia</Text>
          <Text style={style.cardValue}>
            {formatJoinDate(userInfo?.created_at)}
          </Text>
        </View>
        <View style={style.cardRow}>
          <Text style={style.cardLabel}>Moje receptury</Text>
          <Text style={style.cardValue}>
            {recipeCount !== null ? recipeCount : "-"}
          </Text>
        </View>
      </View>

      <MyDrinksMenu />
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#EDF1D6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#40513B",
  },
  headerSubtitle: {
    marginTop: 2,
    color: "#60715C",
  },
  logoutButton: {
    backgroundColor: "#40513B",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E3E8D0",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#40513B",
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1E4",
  },
  cardLabel: {
    color: "#40513B",
    fontWeight: "600",
  },
  cardValue: {
    color: "#40513B",
  },
});
