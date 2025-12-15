import React from "react";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../../components/Auth/AuthContext"; // upewnij się, że ścieżka jest poprawna

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
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
