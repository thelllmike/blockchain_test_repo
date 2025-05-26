// screens/HomeScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { parkingFeeContract } from "@/constants/thirdweb";
import carpark from "@/assets/images/carpark.png";
import notification from "@/assets/images/notification.png";
import background from "@/assets/images/background.png";

export default function HomeScreen() {
  const account = useActiveAccount();

  // 1) Payment history
  const {
    data: historyRaw,
    isPending: isHistoryLoading,
    error: historyError,
  } = useReadContract({
    contract: parkingFeeContract,
    method:
      "function getPaymentHistory(address) view returns ((string vehicleNumber,string userName,uint256 parkingHours,uint256 amountPaid,uint256 violationFee,uint256 timestamp)[])",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
  });

  // 2) Current vehicle info (including violationFee)
  const {
    data: vehiclesRaw,
    isPending: isVehiclesLoading,
    error: vehiclesError,
  } = useReadContract({
    contract: parkingFeeContract,
    method:
      "function getVehicleInfo(address) view returns ((string vehicleNumber,string userName,address walletAddress,uint256 parkingHours,uint256 totalFee,uint256 violationFee)[])",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
  });

  if (!account) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.message}>🔌 Please connect your wallet</Text>
      </SafeAreaView>
    );
  }

  if (isHistoryLoading || isVehiclesLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#00FF9D" />
      </SafeAreaView>
    );
  }

  if (historyError || vehiclesError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={[styles.message, styles.error]}>
          {historyError?.message || vehiclesError?.message}
        </Text>
      </SafeAreaView>
    );
  }

  // Normalize payment history
  const history = (historyRaw || []).map((entry: any, idx: number) => {
    const veh = entry.vehicleNumber ?? entry[0] ?? "-";
    const user = entry.userName ?? entry[1] ?? "-";
    const hrs =
      typeof entry.parkingHours.toNumber === "function"
        ? entry.parkingHours.toNumber()
        : Number(entry.parkingHours);
    const paid =
      typeof entry.amountPaid.toNumber === "function"
        ? entry.amountPaid.toNumber()
        : Number(entry.amountPaid);
    const tsRaw =
      typeof entry.timestamp.toNumber === "function"
        ? entry.timestamp.toNumber()
        : Number(entry.timestamp);
    const ts = new Date(tsRaw * 1000).toLocaleString();

    return {
      key: idx.toString(),
      vehicleNumber: veh,
      userName: user,
      parkingHours: hrs,
      amountPaid: paid,
      timestamp: ts,
    };
  });

  // Normalize vehicle info
  const vehicles = (vehiclesRaw || []).map((v: any, idx: number) => {
    const veh = v.vehicleNumber ?? v[0] ?? "-";
    const violation =
      typeof v.violationFee.toNumber === "function"
        ? v.violationFee.toNumber()
        : Number(v.violationFee);
    return {
      key: idx.toString(),
      vehicleNumber: veh,
      violationFee: violation,
    };
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome Back, Mike!</Text>
        <TouchableOpacity style={styles.notificationIcon}>
          <Image source={notification} style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* Payment History */}
      {history.length > 0 ? (
        history.map((item) => (
          <View style={styles.currentCard} key={item.key}>
            <Image source={background} style={styles.background} />
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Image source={carpark} style={styles.carparkIcon} />
                <Text style={styles.cardTitle}>{item.vehicleNumber}</Text>
              </View>
              <Text style={styles.cardText}>User: {item.userName}</Text>
              <Text style={styles.cardText}>
                Parked Time: {item.parkingHours} hrs
              </Text>
              <Text style={styles.cardText}>
                Amount Paid: {item.amountPaid} LKR
              </Text>
              <Text style={styles.cardText}>On: {item.timestamp}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardTotal}>
                  Total: {item.amountPaid} LKR
                </Text>
                <TouchableOpacity style={styles.historyButton}>
                  <Text style={styles.historyButtonText}>View History</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.message}>No payment history found.</Text>
      )}

      {/* Violation Fees */}
      <View style={styles.violationContainer}>
        <Text style={styles.violationTitle}>Violation Fees</Text>
        {vehicles.length > 0 ? (
          vehicles.map((v) => (
            <View style={styles.violationCard} key={v.key}>
              <Text style={styles.violationVehicle}>{v.vehicleNumber}</Text>
              <Text style={styles.violationAmount}>
                {v.violationFee} LKR
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.message}>No registered vehicles.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1B22",
  },
  message: { color: "#fff", fontSize: 16, textAlign: "center" },
  error: { color: "#ff5555" },
  container: { flex: 1, backgroundColor: "#1A1B22" },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  greeting: { fontSize: 20, color: "#fff", fontWeight: "bold" },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00FF9D",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: { width: 24, height: 24, resizeMode: "contain" },

  // Payment card styles
  currentCard: {
    backgroundColor: "#111D13",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  background: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.3,
  },
  cardContent: { padding: 16 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  carparkIcon: { width: 40, height: 40, marginRight: 8 },
  cardTitle: { fontSize: 16, color: "#fff", fontWeight: "bold" },
  cardText: { fontSize: 14, color: "#fff" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  cardTotal: { fontSize: 16, color: "#00FF9D", fontWeight: "bold" },
  historyButton: {
    backgroundColor: "#00FF9D",
    padding: 8,
    borderRadius: 4,
  },
  historyButtonText: { color: "#fff", fontSize: 12 },

  // Violation section wrapper
  violationContainer: {
    marginTop: 24,
  },
  violationTitle: {
    fontSize: 18,
    color: "#D8315B",
    fontWeight: "bold",
    marginBottom: 8,
  },
  // Each violation card (same style you provided)
  violationCard: {
    backgroundColor: "#D8315B1A",
    borderRadius: 8,
    padding: 12,
    borderColor: "#D8315B",
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  violationVehicle: { color: "#fff", fontSize: 16 },
  violationAmount: { color: "#D8315B", fontSize: 16, fontWeight: "bold" },
});