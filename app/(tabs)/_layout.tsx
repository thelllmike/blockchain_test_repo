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
      {/* 1) Home */}
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

      {/* 3) Wallet */}
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

      {/* 4) Slots */}
      <Tabs.Screen
        name="Slot"
        options={{
          title: "Slots",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              // using Ionicons grid icon to represent parking slots
              name={focused ? "grid" : "grid-outline"}
              color={color}
            />
          ),
        }}
      />

      {/* 5) Vehicle Dashboard */}
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