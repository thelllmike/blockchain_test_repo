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
  const account = useActiveAccount();

  const { data, isPending, error } = useReadContract({
    contract: parkingFeeContract,
    method:
      "function getVehicleInfo(address _user) view returns ((string vehicleNumber, string userName, address walletAddress, uint256 parkingHours, uint256 totalFee)[])",
    params: [account?.address || "0x0"],
  });

  if (!account) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.message}>
          Please connect your wallet to view your vehicles.
        </Text>
      </View>
    );
  }

  if (isPending) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={[styles.message, styles.error]}>
          Error fetching vehicle info: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.centeredContainer}>
      {data && data.length > 0 ? (
        <FlatList
          contentContainerStyle={styles.centeredList}
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
  centeredContainer: {
    flex: 1,
    backgroundColor: "#0B0F0F",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  centeredList: {
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1,
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
    padding: 32,
    borderRadius: 20,
    width: 320,
    alignItems: "center",
    marginBottom: 24,
  },
  imageWrapper: {
    borderWidth: 4,
    borderColor: "#00FF9D",
    borderRadius: 100,
    padding: 6,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: "cover",
  },
  userName: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  userDetails: {
    fontSize: 16,
    color: "#A0A0A0",
    marginBottom: 20,
  },
  infoBox: {
    width: "100%",
    backgroundColor: "#0B0F0F",
    borderRadius: 16,
    padding: 24,
  },
  label: {
    color: "#ccc",
    fontSize: 16,
    marginTop: 10,
  },
  value: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
