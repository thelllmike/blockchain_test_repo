// components/VehicleDashboard.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { parkingFeeContract } from "@/constants/thirdweb";
import { prepareContractCall } from "thirdweb";
import { shortenAddress } from "thirdweb/utils";
import profile from "@/assets/images/profile.png";

export default function VehicleDashboard() {
  const account = useActiveAccount();
  const { mutate: sendTransaction, isLoading: isRegistering, error: registerError } = useSendTransaction();

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [userName, setUserName] = useState("");
  const [status, setStatus] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  const { data, isPending, error, refetch } = useReadContract({
    contract: parkingFeeContract,
    method:
      "function getVehicleInfo(address _user) view returns ((string vehicleNumber, string userName, address walletAddress, uint256 parkingHours, uint256 totalFee)[])",
    params: [account?.address || "0x0"],
  });

  const handleRegister = () => {
    if (!vehicleNumber.trim() || !userName.trim()) {
      setStatus("Please enter both vehicle number and user name.");
      return;
    }

    const transaction = prepareContractCall({
      contract: parkingFeeContract,
      method: "function registerVehicle(string,string)",
      params: [vehicleNumber, userName],
    });

    sendTransaction(transaction, {
      onSuccess: async (data) => {
        setStatus("Vehicle registered successfully!");
        setVehicleNumber("");
        setUserName("");
        setIsRegistered(true);
        await refetch();
      },
      onError: (err) => {
        if (err?.code === 4001) {
          setStatus("Transaction rejected by user.");
        } else {
          setStatus(`Error: ${err.message}`);
        }
      },
    });
  };

  if (!account) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.message}>Please connect your wallet to view your vehicles.</Text>
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
        <Text style={[styles.message, styles.error]}>Error fetching vehicle info: {error.message}</Text>
      </View>
    );
  }

  const showRegistrationForm = !data || data.length === 0;

  return (
    <View style={styles.centeredContainer}>
      {showRegistrationForm && !isRegistered ? (
        <View style={styles.registerCard}>
          <Text style={styles.userName}>Register Your Vehicle</Text>
          <TextInput
            placeholder="Vehicle Number"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
          />
          <TextInput
            placeholder="User Name"
            placeholderTextColor="#ccc"
            style={styles.input}
            value={userName}
            onChangeText={setUserName}
          />
          <TouchableOpacity style={styles.updateButton} onPress={handleRegister} disabled={isRegistering}>
            <Text style={styles.updateButtonText}>{isRegistering ? "Registering..." : "Register"}</Text>
          </TouchableOpacity>
          {!!status && <Text style={styles.status}>{status}</Text>}
        </View>
      ) : (
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
  registerCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#0F2E23",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#0B0F0F",
    borderColor: "#00FF9D",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    marginTop: 16,
  },
  updateButton: {
    marginTop: 24,
    backgroundColor: "#0B0F0F",
    borderColor: "#00FF9D",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#00FF9D",
    fontSize: 16,
    fontWeight: "bold",
  },
  status: {
    color: "#fff",
    fontSize: 14,
    marginTop: 12,
  },
});