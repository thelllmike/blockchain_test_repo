// components/VehicleDashboard.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { parkingFeeContract } from "@/constants/thirdweb";

export default function VehicleDashboard({ userAddress }: { userAddress: string }) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const fetchVehicles = async () => {
    try {
      const vehiclesData = await parkingFeeContract.call("getVehicleInfo", userAddress);
      setVehicles(vehiclesData);
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  useEffect(() => {
    if (userAddress) {
      fetchVehicles();
    }
  }, [userAddress]);

  return (
    <View style={styles.container}>
      <Button title="Refresh Vehicles" onPress={fetchVehicles} />
      {vehicles.map((v, index) => (
        <View key={index} style={styles.vehicleCard}>
          <Text>Vehicle: {v.vehicleNumber}</Text>
          <Text>User: {v.userName}</Text>
          <Text>Parking Hours: {v.parkingHours}</Text>
          <Text>Total Fee: {v.totalFee}</Text>
        </View>
      ))}
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  vehicleCard: { borderWidth: 1, borderColor: "#ccc", padding: 12, marginVertical: 8 },
  status: { marginTop: 16, fontWeight: "bold" },
});