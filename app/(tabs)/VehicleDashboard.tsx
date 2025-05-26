// components/VehicleDashboard.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import {
  useActiveAccount,
  useReadContract,
  useSendTransaction,
} from "thirdweb/react";
import { parkingFeeContract } from "@/constants/thirdweb";
import { prepareContractCall } from "thirdweb";
import { shortenAddress } from "thirdweb/utils";
import profile from "@/assets/images/profile.png";

export default function VehicleDashboard() {
  const account = useActiveAccount();
  const {
    mutate: sendTransaction,
    isLoading: txLoading,
    error: txError,
  } = useSendTransaction();

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [userName, setUserName] = useState("");
  const [status, setStatus] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  const {
    data,
    isPending: isFetching,
    error: fetchError,
    refetch,
  } = useReadContract({
    contract: parkingFeeContract,
    method:
      "function getVehicleInfo(address) view returns ((string vehicleNumber,string userName,address walletAddress,uint256 parkingHours,uint256 totalFee,uint256 violationFee)[])",
    params: [account?.address || "0x0"],
  });

  // Optional: auto-poll every 30s
  useEffect(() => {
    const id = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(id);
  }, [refetch]);

  const handleRegister = () => {
    if (!vehicleNumber.trim() || !userName.trim()) {
      setStatus("Please enter both vehicle number and user name.");
      return;
    }
    const tx = prepareContractCall({
      contract: parkingFeeContract,
      method: "function registerVehicle(string,string)",
      params: [vehicleNumber, userName],
    });
    sendTransaction(tx, {
      onSuccess: async () => {
        setStatus("✅ Vehicle registered!");
        setVehicleNumber("");
        setUserName("");
        setIsRegistered(true);
        await refetch();
      },
      onError: (err) => {
        setStatus(
          err?.code === 4001
            ? "🚫 Transaction rejected."
            : `Error: ${err.message}`
        );
      },
    });
  };

  const handlePayAll = (vehNum: string) => {
    const tx = prepareContractCall({
      contract: parkingFeeContract,
      method: "function payFee(string)",
      params: [vehNum],
    });
    sendTransaction(tx, {
      onSuccess: async () => {
        setStatus(`✅ Fees paid for ${vehNum}`);
        await refetch();
      },
      onError: (err) => {
        setStatus(
          err?.code === 4001
            ? "🚫 Payment rejected."
            : `Error: ${err.message}`
        );
      },
    });
  };

  if (!account) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.message}>
          Please connect your wallet to view your vehicles.
        </Text>
      </View>
    );
  }

  if (isFetching && !data) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={[styles.message, styles.error]}>
          Error fetching info: {fetchError.message}
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => refetch()}>
          {/* <Text style={styles.refreshText}>Try Again</Text> */}
        </TouchableOpacity>
      </View>
    );
  }

  const showForm = !data || data.length === 0;

  return (
    <View style={styles.container}>
      {/* Manual Refresh Button */}
      {/* {!showForm && (
        <TouchableOpacity
          style={[styles.refreshButton, isFetching && styles.disabled]}
          onPress={() => refetch()}
          disabled={isFetching}
        >
          <Text style={styles.refreshText}>
            {isFetching ? "Refreshing…" : "Refresh"}
          </Text>
        </TouchableOpacity>
      )} */}

      {showForm && !isRegistered ? (
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
          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleRegister}
            disabled={txLoading}
          >
            <Text style={styles.updateButtonText}>
              {txLoading ? "Registering…" : "Register"}
            </Text>
          </TouchableOpacity>
          {!!status && <Text style={styles.status}>{status}</Text>}
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.centeredList}
          data={data}
          keyExtractor={(_, i) => i.toString()}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />
          }
          renderItem={({ item }) => (
            <View style={styles.profileCard}>
              <View style={styles.imageWrapper}>
                <Image source={profile} style={styles.profileImage} />
              </View>
              <Text style={styles.userName}>{item.userName}</Text>
              <Text style={styles.userDetails}>
                {item.vehicleNumber} – {shortenAddress(item.walletAddress)}
              </Text>
              <View style={styles.infoBox}>
                <Text style={styles.label}>Parking Hours</Text>
                <Text style={styles.value}>
                  {item.parkingHours.toString()}
                </Text>
                <Text style={styles.label}>Total Fee (LKR)</Text>
                <Text style={styles.value}>{item.totalFee.toString()}</Text>
                <Text style={styles.label}>Violation Fee (LKR)</Text>
                <Text style={styles.value}>
                  {item.violationFee.toString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.payButton}
                onPress={() => handlePayAll(item.vehicleNumber)}
                disabled={txLoading}
              >
                {/* <Text style={styles.payButtonText}>
                  {txLoading ? "Processing…" : "Pay All Fees"}
                </Text> */}
              </TouchableOpacity>
              {/* {!!status && <Text style={styles.status}>{status}</Text>} */}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F0F", padding: 16 },
  centeredContainer: {
    flex: 1,
    backgroundColor: "#0B0F0F",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  centeredList: { paddingBottom: 24 },
  message: { fontSize: 16, color: "#fff", textAlign: "center" },
  error: { color: "red", marginBottom: 12 },

  refreshButton: {
    alignSelf: "flex-end",
    marginBottom: 12,
    backgroundColor: "#00FF9D",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  refreshText: { color: "#0B0F0F", fontWeight: "bold" },
  disabled: { opacity: 0.6 },

  profileCard: {
    backgroundColor: "#0F2E23",
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  imageWrapper: {
    borderWidth: 4,
    borderColor: "#00FF9D",
    borderRadius: 100,
    padding: 6,
  },
  profileImage: { width: 80, height: 80, borderRadius: 40 },
  userName: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  userDetails: { fontSize: 14, color: "#A0A0A0", marginBottom: 12 },

  infoBox: {
    width: "100%",
    backgroundColor: "#0B0F0F",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  label: { color: "#ccc", fontSize: 14, marginTop: 8 },
  value: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  registerCard: {
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
  },
  updateButtonText: { color: "#00FF9D", fontSize: 16, fontWeight: "bold" },

  payButton: {
    marginTop: 12,
    backgroundColor: "#00FF9D",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  payButtonText: { color: "#0B0F0F", fontSize: 16, fontWeight: "bold" },

  status: { color: "#fff", fontSize: 14, marginTop: 8 },
});