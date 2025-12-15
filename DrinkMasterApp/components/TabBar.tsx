import { StyleSheet, View } from "react-native";
import { useLinkBuilder, useTheme } from "@react-navigation/native";
import { Text, PlatformPressable } from "@react-navigation/elements";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

export function MyTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { colors } = useTheme();
  const { buildHref } = useLinkBuilder();

  return (
    <View style={style.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];

        const isFocused = state.index === index;

        const Icon = options.tabBarIcon;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const labelText =
          typeof label === "function"
            ? label({
                focused: isFocused,
                color: colors.text,
                position: "below-icon",
                children: route.name,
              })
            : label;
        return (
          <PlatformPressable
            key={route.name}
            href={buildHref(route.name, route.params)}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={style.tabBarItem}
          >
            {Icon && (
              <Icon
                focused={isFocused}
                color={isFocused ? colors.background : colors.text}
                size={18}
              />
            )}

            <Text
              style={{ color: isFocused ? colors.background : colors.text }}
            >
              {labelText}
            </Text>
          </PlatformPressable>
        );
      })}
    </View>
  );
}

const style = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#609966",
    marginHorizontal: 70,
    paddingVertical: 10,
    borderRadius: 35,
    shadowColor: "#609966",
    textShadowOffset: { width: 0, height: 10 },
    shadowRadius: 10,
    shadowOpacity: 0.1,
  },
  tabBarItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
});
