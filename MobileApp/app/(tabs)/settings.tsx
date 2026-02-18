import React, { useCallback, useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { apiChangePassword, apiMe, apiUpdateMe } from "@/lib/api";
import { getToken } from "@/lib/authStorage";
import { useIsFocused } from "@react-navigation/native";

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [initialUsername, setInitialUsername] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [openSection, setOpenSection] = useState<"profile" | "password" | null>(
    "profile"
  );
  const isFocused = useIsFocused();

  const loadProfile = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const me = await apiMe(token);
      setUsername(me.username || "");
      setEmail(me.email || "");
      setInitialUsername(me.username || "");
      setInitialEmail(me.email || "");
    } catch (e) {
      console.error("Blad pobierania profilu:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadProfile();
    }
  }, [isFocused, loadProfile]);

  const saveProfile = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const trimmedUsername = username.trim();
      const trimmedEmail = email.trim();
      const payload: { username?: string; email?: string | null } = {};

      if (trimmedUsername && trimmedUsername !== initialUsername) {
        payload.username = trimmedUsername;
      }
      if (trimmedEmail !== initialEmail) {
        payload.email = trimmedEmail ? trimmedEmail : null;
      }

      if (!payload.username && payload.email === undefined) {
        setProfileMessage("Brak zmian do zapisu.");
        return;
      }

      const updated = await apiUpdateMe(token, payload);
      setInitialUsername(updated.username || "");
      setInitialEmail(updated.email || "");
      setProfileMessage("Zapisano zmiany profilu.");
    } catch (e: any) {
      const detail =
        e?.response?.data?.detail ||
        e?.message ||
        "Nie udalo sie zapisac zmian.";
      console.error("Blad zapisu profilu:", e);
      setProfileMessage(String(detail));
    }
  };

  const savePassword = async () => {
    try {
      if (!currentPassword || !newPassword) {
        setPasswordMessage("Wypelnij oba pola hasla.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordMessage("Nowe hasla nie sa takie same.");
        return;
      }

      const token = await getToken();
      if (!token) return;

      await apiChangePassword(token, {
        current_password: currentPassword,
        new_password: newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Haslo zostalo zmienione.");
    } catch (e: any) {
      const detail =
        e?.response?.data?.detail ||
        e?.message ||
        "Nie udalo sie zmienic hasla.";
      console.error("Blad zmiany hasla:", e);
      setPasswordMessage(String(detail));
    }
  };

  if (loading) {
    return (
      <View style={style.loader}>
        <ActivityIndicator size="large" color="#9DC08B" />
      </View>
    );
  }

  return (
    <View style={style.container}>
      <Text style={style.title}>Ustawienia</Text>

      <View style={style.card}>
        <TouchableOpacity
          style={style.accordionHeader}
          onPress={() =>
            setOpenSection((prev) => (prev === "profile" ? null : "profile"))
          }
        >
          <Text style={style.cardTitle}>Profil</Text>
          <Text style={style.accordionIcon}>
            {openSection === "profile" ? "^" : "v"}
          </Text>
        </TouchableOpacity>
        {openSection === "profile" ? (
          <View style={style.accordionBody}>
            <Text style={style.label}>Username</Text>
            <TextInput
              style={style.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <Text style={style.label}>Email</Text>
            <TextInput
              style={style.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {profileMessage ? (
              <Text style={style.message}>{profileMessage}</Text>
            ) : null}
            <TouchableOpacity style={style.primaryButton} onPress={saveProfile}>
              <Text style={style.primaryButtonText}>Zapisz profil</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <View style={style.card}>
        <TouchableOpacity
          style={style.accordionHeader}
          onPress={() =>
            setOpenSection((prev) => (prev === "password" ? null : "password"))
          }
        >
          <Text style={style.cardTitle}>Zmiana hasla</Text>
          <Text style={style.accordionIcon}>
            {openSection === "password" ? "^" : "v"}
          </Text>
        </TouchableOpacity>
        {openSection === "password" ? (
          <View style={style.accordionBody}>
            <Text style={style.label}>Obecne haslo</Text>
            <TextInput
              style={style.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <Text style={style.label}>Nowe haslo</Text>
            <TextInput
              style={style.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <Text style={style.label}>Powtorz nowe haslo</Text>
            <TextInput
              style={style.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            {passwordMessage ? (
              <Text style={style.message}>{passwordMessage}</Text>
            ) : null}
            <TouchableOpacity
              style={style.primaryButton}
              onPress={savePassword}
            >
              <Text style={style.primaryButtonText}>Zmien haslo</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default SettingsPage;

const style = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#EDF1D6",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#40513B",
    marginBottom: 16,
  },
  card: {
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
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accordionIcon: {
    color: "#40513B",
    fontSize: 16,
    fontWeight: "700",
  },
  accordionBody: {
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#40513B",
    marginBottom: 8,
  },
  label: {
    color: "#40513B",
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#9DC08B",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: "#fff",
  },
  message: {
    marginTop: 8,
    color: "#40513B",
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: "#40513B",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
