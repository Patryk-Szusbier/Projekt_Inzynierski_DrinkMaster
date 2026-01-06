import React from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../../components/Auth/AuthContext";
import MyDrinksMenu from "@/components/mydrinks";

export default function ProfilePage() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={style.container}>
      <Text style={style.title}>Profile Page</Text>

      <TouchableOpacity style={style.button} onPress={handleLogout}>
        <Text style={style.buttonText}>Wyloguj</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: "#40513B",
  },
  button: {
    backgroundColor: "#9DC08B",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
