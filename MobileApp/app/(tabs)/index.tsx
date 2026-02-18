import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import type { Drink } from "@/interface/iDrink";
import {
  apiGetAvailableDrinks,
  apiGetFavoriteDrinks,
  apiAddFavoriteDrink,
  apiRemoveFavoriteDrink,
} from "@/lib/api";
import { getToken } from "@/lib/authStorage";

export default function DrinkMenu() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();

  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFavorites, setShowFavorites] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      const token = await getToken();
      if (!token) return;

      const [allDrinks, favDrinks] = await Promise.all([
        apiGetAvailableDrinks(token),
        apiGetFavoriteDrinks(token),
      ]);

      setDrinks(allDrinks);
      setFavorites(favDrinks.map((d) => d.id));
    } catch (e) {
      console.error("Błąd pobierania drinków:", e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(drinkId: number) {
    try {
      const token = await getToken();
      if (!token) return;

      if (favorites.includes(drinkId)) {
        await apiRemoveFavoriteDrink(token, drinkId);
        setFavorites((prev) => prev.filter((id) => id !== drinkId));
      } else {
        await apiAddFavoriteDrink(token, drinkId);
        setFavorites((prev) => [...prev, drinkId]);
      }
    } catch (e) {
      console.error("Błąd zmiany ulubionego drinka:", e);
    }
  }

  const filteredDrinks = showFavorites
    ? drinks.filter((d) => favorites.includes(d.id))
    : drinks;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={MAIN_COLOR} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Wybierz swój napój</Text>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFavorites((v) => !v)}
        >
          <Text style={styles.filterText}>
            {showFavorites ? "Wszystkie" : "Ulubione ❤️"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <FlatList
        data={filteredDrinks}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 80 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/drinks/[id]",
                params: { id: item.id.toString() },
              })
            }
          >
            <Image
              source={{
                uri: `${process.env.EXPO_PUBLIC_API_URL}/drinkPhotos/${item.image_url}`,
              }}
              style={styles.image}
            />

            <View style={styles.overlay} />

            <Text style={styles.name}>{item.name}</Text>

            <TouchableOpacity
              style={styles.heart}
              onPress={() => toggleFavorite(item.id)}
            >
              <Ionicons
                name={favorites.includes(item.id) ? "heart" : "heart-outline"}
                size={26}
                color={favorites.includes(item.id) ? "red" : "#fff"}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {showFavorites
              ? "Nie masz jeszcze ulubionych drinków ❤️"
              : "Brak dostępnych drinków 🍸"}
          </Text>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: tabBarHeight + 16 }]}
        onPress={() => router.push("/drinks/create")}
        accessibilityLabel="Dodaj nowa recepture"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const MAIN_COLOR = "#9DC08B";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDF1D6",
    paddingHorizontal: 12,
    paddingTop: 40,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#40513B",
  },
  filterButton: {
    borderWidth: 1,
    borderColor: MAIN_COLOR,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  filterText: {
    color: MAIN_COLOR,
    fontWeight: "600",
  },
  card: {
    flex: 1,
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  name: {
    position: "absolute",
    bottom: 12,
    left: 8,
    right: 8,
    textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 20,
    paddingVertical: 6,
    fontWeight: "bold",
    color: "#40513B",
  },
  heart: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#40513B",
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: MAIN_COLOR,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
