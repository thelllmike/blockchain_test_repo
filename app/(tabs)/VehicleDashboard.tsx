// components/VehicleDashboard.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { parkingFeeContract } from "@/constants/thirdweb";
import { shortenAddress } from "thirdweb/utils";

export default function VehicleDashboard() {
  // Get the connected account
  const account = useActiveAccount();

  // Read vehicle info for the connected user
  const { data, isPending, error } = useReadContract({
    contract: parkingFeeContract,
    method:
      "function getVehicleInfo(address _user) view returns ((string vehicleNumber, string userName, address walletAddress, uint256 parkingHours, uint256 totalFee)[])",
    params: [account?.address || "0x0"],
  });

  // If no wallet is connected
  if (!account) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Please connect your wallet to view your vehicles.
        </Text>
      </View>
    );
  }

  // While loading
  if (isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // If there's an error
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.message, styles.error]}>
          Error fetching vehicle info: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Vehicles</Text>
      {data && data.length > 0 ? (
        <FlatList
          data={data}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemText}>
                <Text style={styles.label}>Vehicle Number: </Text>
                {item.vehicleNumber}
              </Text>
              <Text style={styles.itemText}>
                <Text style={styles.label}>User Name: </Text>
                {item.userName}
              </Text>
              <Text style={styles.itemText}>
                <Text style={styles.label}>Wallet Address: </Text>
                {shortenAddress(item.walletAddress)}
              </Text>
              <Text style={styles.itemText}>
                <Text style={styles.label}>Parking Hours: </Text>
                {item.parkingHours.toString()}
              </Text>
              <Text style={styles.itemText}>
                <Text style={styles.label}>Total Fee: </Text>
                {item.totalFee.toString()}
              </Text>
            </View>
          )}
        />
      ) : (
        <Text style={styles.message}>No vehicles registered.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: "#000" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12, color: "#fff" },
  message: { fontSize: 16, marginTop: 16, color: "#fff" },
  error: { color: "red" },
  item: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  itemText: { fontSize: 16, marginVertical: 2, color: "#fff" },
  label: { fontWeight: "bold", color: "#fff" },
});