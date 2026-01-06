import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Switch } from "react-native";
import type {
  Drink,
  DrinkIngredient,
  IngredientType,
} from "@/interface/iDrink";
import type { Alcohol, Mixers } from "@/interface/IIngredientl";
import { getToken } from "@/lib/authStorage";
import api, { apiGetDrinkById, apiUpdateDrink } from "@/lib/api";

export default function EditDrink() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [drink, setDrink] = useState<Drink | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<DrinkIngredient[]>([]);
  const [alcohols, setAlcohols] = useState<Alcohol[]>([]);
  const [mixers, setMixers] = useState<Mixers[]>([]);
  const [image, setImage] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      // Pobranie jednego drinka po ID
      const data = (await apiGetDrinkById(Number(id), token)) as Drink;
      setDrink(data);
      setName(data.name);
      setDescription(data.description || "");
      setIngredients(data.ingredients);
      setIsPublic(Boolean(data.is_public)); // <- tu poprawka

      // Pobranie składników
      const [alcoholList, mixerList] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/ingredients/alcohols`).then(
          (r) => r.json()
        ) as Promise<Alcohol[]>,
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/ingredients/mixers`).then(
          (r) => r.json()
        ) as Promise<Mixers[]>,
      ]);

      setAlcohols(alcoholList);
      setMixers(mixerList);
    } catch (e) {
      console.error("Błąd pobierania drinka:", e);
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        id: 0,
        drink_id: drink?.id || 0,
        ingredient_type: "alcohol",
        ingredient_id: alcohols[0]?.id || 0,
        amount_ml: 50,
      },
    ]);
  };

  const updateIngredient = (
    index: number,
    key: keyof DrinkIngredient,
    value: any
  ) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const saveDrink = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      await apiUpdateDrink(Number(id), token, {
        name,
        description,
        ingredients,
        image,
        is_public: isPublic,
      });

      router.back();
    } catch (e) {
      console.error("Błąd zapisu drinka:", e);
    }
  };

  if (loading || !drink) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#9DC08B" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Nazwa:</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Opis:</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Text style={styles.label}>Publiczny:</Text>
      <Switch
        value={isPublic}
        onValueChange={setIsPublic}
        trackColor={{ false: "#767577", true: "#9DC08B" }}
        thumbColor={isPublic ? "#40513B" : "#f4f3f4"}
      />
      <Text style={styles.label}>Składniki:</Text>
      {ingredients.map((ing, index) => (
        <View key={index} style={styles.ingredientRow}>
          {/* Typ składnika */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={ing.ingredient_type}
              onValueChange={(val: IngredientType) => {
                updateIngredient(index, "ingredient_type", val);
                // reset ingredient_id przy zmianie typu
                const firstId =
                  val === "alcohol" ? alcohols[0]?.id || 0 : mixers[0]?.id || 0;
                updateIngredient(index, "ingredient_id", firstId);
              }}
              mode="dropdown" // wymusza dropdown zamiast wheel
            >
              <Picker.Item label="Alcohol" value="alcohol" />
              <Picker.Item label="Mixer" value="mixer" />
            </Picker>
          </View>

          {/* Wybór konkretnego składnika */}
          <View style={styles.pickerContainer2}>
            <Picker
              selectedValue={ing.ingredient_id}
              onValueChange={(val: number) =>
                updateIngredient(index, "ingredient_id", val)
              }
              mode="dropdown"
            >
              {(ing.ingredient_type === "alcohol" ? alcohols : mixers).map(
                (i) => (
                  <Picker.Item key={i.id} label={i.name} value={i.id!} />
                )
              )}
            </Picker>
          </View>

          {/* Ilość ml */}
          <TextInput
            style={[styles.input, { width: 60 }]}
            keyboardType="numeric"
            value={ing.amount_ml.toString()}
            onChangeText={(val) =>
              updateIngredient(index, "amount_ml", parseInt(val) || 0)
            }
          />

          {/* Usuń składnik */}
          <TouchableOpacity
            onPress={() => removeIngredient(index)}
            style={styles.removeBtn}
          >
            <Text style={{ color: "red" }}>X</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={addIngredient}>
        <Text style={{ color: "#fff" }}>Dodaj składnik</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={saveDrink}>
        <Text style={{ color: "#fff" }}>Zapisz</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#EDF1D6" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  label: { fontWeight: "bold", marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#9DC08B",
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 40,
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },

  pickerContainer: {
    borderWidth: 1,
    borderColor: "#9DC08B",
    borderRadius: 8,
    overflow: "hidden",
    height: 40,
    width: 120,
    minWidth: 100,
    justifyContent: "center",
  },
  pickerContainer2: {
    borderWidth: 1,
    borderColor: "#9DC08B",
    borderRadius: 8,
    overflow: "hidden",
    height: 40,
    width: 160,
    minWidth: 100,
    justifyContent: "center",
  },

  picker: { height: 40, flex: 1 },
  removeBtn: { padding: 8 },
  addBtn: {
    backgroundColor: "#9DC08B",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },
  saveBtn: {
    backgroundColor: "#40513B",
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
  },
});
