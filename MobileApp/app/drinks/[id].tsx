import { useEffect, useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Drink, DrinkIngredient } from "../../interface/iDrink";
import { apiFetchIngredients } from "../../lib/api";

interface IngredientLookup {
  alcohols: Record<number, string>;
  mixers: Record<number, string>;
}

export default function DrinkDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [drink, setDrink] = useState<Drink | null>(null);
  const [lookup, setLookup] = useState<IngredientLookup>({
    alcohols: {},
    mixers: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrink = async () => {
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/drinks/${id}`
        );
        if (!res.ok) throw new Error("Nie udało się pobrać drinka");
        const data: Drink = await res.json();
        setDrink(data);

        const alcoholIds = data.ingredients
          .filter((i) => i.ingredient_type === "alcohol")
          .map((i) => i.ingredient_id);
        const mixerIds = data.ingredients
          .filter((i) => i.ingredient_type === "mixer")
          .map((i) => i.ingredient_id);

        const lookupData = await apiFetchIngredients(alcoholIds, mixerIds);
        setLookup(lookupData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDrink();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Ładowanie...</Text>
      </View>
    );
  }

  if (!drink) {
    return (
      <View style={styles.container}>
        <Text>Nie znaleziono drinka 🥺</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Przyciski cofania – nad obrazkiem */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>

      {/* Obraz drinka */}
      {drink.image_url && (
        <ImageBackground
          source={{
            uri: `${process.env.EXPO_PUBLIC_API_URL}/drinkPhotos/${drink.image_url}`,
          }}
          style={styles.image}
          imageStyle={{ borderRadius: 20 }}
        />
      )}

      {/* Nazwa i opis */}
      <View style={styles.header}>
        <Text style={styles.name}>{drink.name}</Text>
        {drink.description && (
          <Text style={styles.description}>{drink.description}</Text>
        )}
      </View>

      {/* Skład */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skład:</Text>
        {drink.ingredients.map((item: DrinkIngredient, i: number) => {
          const name =
            item.ingredient_type === "alcohol"
              ? lookup.alcohols[item.ingredient_id]
              : lookup.mixers[item.ingredient_id];
          return (
            <Text key={i} style={styles.ingredient}>
              <Text style={{ fontWeight: "bold" }}>{name || "?"}</Text> –{" "}
              {item.amount_ml}ml
            </Text>
          );
        })}
      </View>

      {/* Przycisk Miksuj */}
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Miksuj</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: 16,
    backgroundColor: "#EDF1D6",
  },
  // Pasek cofania – nad obrazkiem
  topBar: {
    position: "absolute",
    top: 6,
    left: 6,
    zIndex: 10,
  },
  backButton: {
    backgroundColor: "#609966",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    opacity: 0.9,
  },
  backButtonText: {
    fontWeight: "bold",
    fontSize: 30,
    color: "#fff",
  },
  // Obraz drinka
  image: {
    width: "100%",
    height: 300,
    marginTop: 70,
    marginBottom: 16,
    borderRadius: 20,
  },
  // Nagłówek z nazwą i opisem
  header: {
    marginBottom: 16,
  },
  name: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#40513B",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
    color: "#40513B",
  },
  // Sekcja składników
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: "#40513B",
  },
  ingredient: {
    fontSize: 16,
    marginBottom: 4,
    color: "#40513B",
  },
  // Przycisk Miksuj
  button: {
    backgroundColor: "#9DC08B",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    marginHorizontal: 30,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
