// app/_layout.tsx (or TabLayout.tsx)
import { Tabs } from "expo-router";
import React from "react";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
      }}
    >
      {/* 1) Home (read.tsx) */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "home" : "home-outline"}
              color={color}
            />
          ),
        }}
      />

      {/* 2) Pay Fee */}
      <Tabs.Screen
        name="PayFee"
        options={{
          title: "Pay Fee",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "card" : "card-outline"}
              color={color}
            />
          ),
        }}
      />

      {/* 3) Wallet (index.tsx) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "wallet" : "wallet-outline"}
              color={color}
            />
          ),
        }}
      />

      {/* 4) Vehicle Dashboard */}
      <Tabs.Screen
        name="VehicleDashboard"
        options={{
          title: "Vehicle",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "car" : "car-outline"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}