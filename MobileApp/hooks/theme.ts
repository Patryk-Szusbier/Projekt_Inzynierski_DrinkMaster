import { DarkTheme, DefaultTheme, Theme } from "@react-navigation/native";

export const LightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#609966", // akcent
    background: "#EDF1D6", // tło aplikacji
    card: "#9DC08B", // tło taba / headera
    text: "#40513B", // tekst
    border: "#9DC08B",
    notification: "#609966",
  },
};

export const DarkThemeCustom: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#609966", // akcent
    background: "#EDF1D6", // tło aplikacji
    card: "#9DC08B", // tło taba / headera
    text: "#40513B", // tekst
    border: "#9DC08B",
    notification: "#609966",
  },
};
