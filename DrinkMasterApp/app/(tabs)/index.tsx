import React from "react";
import { Text, View, StyleSheet } from "react-native";

function DrinksPage() {
  return (
    <View style={style.container}>
      <Text>Drink Page</Text>
    </View>
  );
}

export default DrinksPage;

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
