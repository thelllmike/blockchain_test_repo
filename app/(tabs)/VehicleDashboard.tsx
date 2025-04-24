// components/VehicleDashboard.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
} from "react-native";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { parkingFeeContract } from "@/constants/thirdweb";
import { shortenAddress } from "thirdweb/utils";
import profile from "@/assets/images/profile.png"; // Dummy profile image

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

  if (!account) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Please connect your wallet to view your vehicles.
        </Text>
      </View>
    );
  }

  if (isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

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
            <View style={styles.profileCard}>
              <View style={styles.imageWrapper}>
                <Image source={profile} style={styles.profileImage} />
              </View>
              <Text style={styles.userName}>{item.userName}</Text>
              <Text style={styles.userDetails}>{item.vehicleNumber} - {shortenAddress(item.walletAddress)}</Text>
              <View style={styles.infoBox}>
                <Text style={styles.label}>Parking Hours</Text>
                <Text style={styles.value}>{item.parkingHours.toString()}</Text>
                <Text style={styles.label}>Total Fee</Text>
                <Text style={styles.value}>{item.totalFee.toString()}</Text>
              </View>
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
  container: {
    padding: 16,
    flex: 1,
    backgroundColor: "#0B0F0F",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    marginTop: 16,
    color: "#fff",
  },
  error: {
    color: "red",
  },
  profileCard: {
    backgroundColor: "#0F2E23",
    padding: 20,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  imageWrapper: {
    borderWidth: 3,
    borderColor: "#00FF9D",
    borderRadius: 100,
    padding: 4,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: "cover",
  },
  userName: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  userDetails: {
    fontSize: 14,
    color: "#A0A0A0",
    marginBottom: 16,
  },
  infoBox: {
    width: "100%",
    backgroundColor: "#0B0F0F",
    borderRadius: 12,
    padding: 16,
  },
  label: {
    color: "#ccc",
    fontSize: 14,
    marginTop: 8,
  },
  value: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
