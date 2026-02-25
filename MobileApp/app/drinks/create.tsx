import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Switch,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import type { MediaType } from "expo-image-picker";
import type { DrinkIngredient, IngredientType } from "@/interface/iDrink";
import type { Alcohol, Mixers } from "@/interface/IIngredientl";
import { getToken } from "@/lib/authStorage";
import { apiCreateDrink } from "@/lib/api";
import { buildApiUrl } from "@/lib/serverDiscovery";

export default function CreateDrink() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
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
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
      const [alcoholList, mixerList] = await Promise.all([
        fetch(buildApiUrl("/ingredients/alcohols")).then(
          (r) => r.json()
        ) as Promise<Alcohol[]>,
        fetch(buildApiUrl("/ingredients/mixers")).then(
          (r) => r.json()
        ) as Promise<Mixers[]>,
      ]);

      setAlcohols(alcoholList);
      setMixers(mixerList);
    } catch (e) {
      console.error("Blad pobierania skladnikow:", e);
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    const defaultType: IngredientType = alcohols.length ? "alcohol" : "mixer";
    const defaultId =
      defaultType === "alcohol" ? alcohols[0]?.id || 0 : mixers[0]?.id || 0;

    if (!defaultId) return;

    setIngredients((prev) => [
      ...prev,
      {
        id: 0,
        drink_id: 0,
        ingredient_type: defaultType,
        ingredient_id: defaultId,
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

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const mediaTypes: MediaType[] = ["images"];
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const name = asset.fileName || "photo.jpg";
    const type = asset.mimeType || "image/jpeg";

    setImage({
      uri: asset.uri,
      name,
      type,
    });
  };

  const clearImage = () => {
    setImage(null);
  };
  const saveDrink = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    try {
      const token = await getToken();
      if (!token) return;

      await apiCreateDrink(token, {
        name: trimmedName,
        description: description.trim() || undefined,
        ingredients,
        image,
        is_public: isPublic,
      });

      router.back();
    } catch (e) {
      console.error("Blad zapisu drinka:", e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#9DC08B" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dodaj receptury</Text>
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

      <Text style={styles.label}>Zdjecie:</Text>
      {image ? (
        <Image source={{ uri: image.uri }} style={styles.preview} />
      ) : null}
      <View style={styles.photoRow}>
        <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
          <Text style={{ color: "#fff" }}>
            {image ? "Zmien zdjecie" : "Dodaj zdjecie"}
          </Text>
        </TouchableOpacity>
        {image ? (
          <TouchableOpacity style={styles.photoBtnGhost} onPress={clearImage}>
            <Text style={styles.photoGhostText}>Usun</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.label}>Skladniki:</Text>
      {ingredients.map((ing, index) => (
        <View key={index} style={styles.ingredientRow}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={ing.ingredient_type}
              onValueChange={(val: IngredientType) => {
                updateIngredient(index, "ingredient_type", val);
                const firstId =
                  val === "alcohol" ? alcohols[0]?.id || 0 : mixers[0]?.id || 0;
                updateIngredient(index, "ingredient_id", firstId);
              }}
              mode="dropdown"
            >
              <Picker.Item label="Alcohol" value="alcohol" />
              <Picker.Item label="Mixer" value="mixer" />
            </Picker>
          </View>

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

          <TextInput
            style={[styles.input, { width: 60 }]}
            keyboardType="numeric"
            value={ing.amount_ml.toString()}
            onChangeText={(val) =>
              updateIngredient(index, "amount_ml", parseInt(val) || 0)
            }
          />

          <TouchableOpacity
            onPress={() => removeIngredient(index)}
            style={styles.removeBtn}
          >
            <Text style={{ color: "red" }}>X</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={addIngredient}>
        <Text style={{ color: "#fff" }}>Dodaj skladnik</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveBtn} onPress={saveDrink}>
        <Text style={{ color: "#fff" }}>Zapisz</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginBottom: 18,
    marginTop: 20,
    backgroundColor: "#EDF1D6",
  },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  label: { fontWeight: "bold", marginTop: 12, marginBottom: 4 },
  title: { fontWeight: "bold", fontSize: 28, color: "#9DC08B" },
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
  removeBtn: { padding: 8 },
  addBtn: {
    backgroundColor: "#9DC08B",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
    alignSelf: "center",
  },
  saveBtn: {
    backgroundColor: "#40513B",
    padding: 14,
    margin: 20,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  photoBtnGhost: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#9DC08B",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  photoGhostText: {
    color: "#40513B",
    fontWeight: "600",
  },
  photoBtn: {
    backgroundColor: "#9DC08B",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginTop: 8,
  },
});
