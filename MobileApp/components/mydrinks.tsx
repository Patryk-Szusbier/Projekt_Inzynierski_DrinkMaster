import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import type { Drink } from "@/interface/iDrink";
import { apiDeleteDrink, apiGetMyDrinks } from "@/lib/api";
import { getToken } from "@/lib/authStorage";
import { buildApiUrl } from "@/lib/serverDiscovery";

export default function MyDrinksMenu() {
  const router = useRouter();

  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const token = await getToken();
      if (!token) return;

      const myDrinks = await apiGetMyDrinks(token);
      setDrinks(myDrinks);
    } catch (e) {
      console.error("Błąd pobierania moich drinków:", e);
    } finally {
      setLoading(false);
    }
  }

  const confirmDelete = (drinkId: number) => {
    Alert.alert(
      "Usunac recepture?",
      "Ta akcja jest nieodwracalna.",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usun",
          style: "destructive",
          onPress: () => handleDelete(drinkId),
        },
      ]
    );
  };

  async function handleDelete(drinkId: number) {
    try {
      const token = await getToken();
      if (!token) return;

      await apiDeleteDrink(token, drinkId);
      setDrinks((prev) => prev.filter((d) => d.id !== drinkId));
    } catch (e) {
      console.error("Blad usuwania receptury:", e);
    }
  }

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
      <Text style={styles.title}>Moje receptury</Text>

      {/* Lista */}
      <FlatList
        data={drinks}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginBottom: GAP,
        }}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/drinks/edit/[id]",
                params: { id: item.id.toString() },
              })
            }
          >
            <Image
              source={{
                uri: buildApiUrl(`/drinkPhotos/${item.image_url}`),
              }}
              style={styles.image}
            />
            <View style={styles.overlay} />

            {/* Nazwa */}
            <Text style={styles.name}>{item.name}</Text>

            {/* Przycisk edycji */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => confirmDelete(item.id)}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Nie stworzyłeś jeszcze żadnych receptur 🍸
          </Text>
        }
      />
    </View>
  );
}

// Stałe do wyliczania kwadratów
const SCREEN_WIDTH = Dimensions.get("window").width;
const NUM_COLUMNS = 2;
const GAP = 42;
const CONTAINER_PADDING = 12;
const CARD_SIZE = (SCREEN_WIDTH - CONTAINER_PADDING * 2 - GAP) / NUM_COLUMNS;

const MAIN_COLOR = "#9DC08B";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: CONTAINER_PADDING,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#40513B",
    marginBottom: 16,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 20,
    overflow: "hidden",
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
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 3,
    borderRadius: 14,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#40513B",
    fontSize: 16,
  },
});
