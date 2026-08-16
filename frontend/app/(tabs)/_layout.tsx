import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

import { COLORS, FONTS } from "@/src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.onSurface,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.surfaceSecondary,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.display,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Arcade",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Ranking",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "trophy" : "trophy-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
