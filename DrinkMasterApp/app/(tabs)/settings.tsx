import React from "react";
import { Text, View, StyleSheet } from "react-native";
function SettingsPage() {
  return (
    <View style={style.container}>
      <Text>Settings Page</Text>
    </View>
  );
}

export default SettingsPage;

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
