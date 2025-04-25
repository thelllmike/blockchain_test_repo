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
  const { data, isPending, error } = useReadContract({
    contract: parkingFeeContract,
    method:
      "function getPaymentHistory(address _user) view returns ((string vehicleNumber, string userName, uint256 parkingHours, uint256 amountPaid, uint256 timestamp)[])",
    params: [account?.address || "0x0000000000000000000000000000000000000000"],
  });

  if (!account) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.message}>🔌 Please connect your wallet</Text>
      </SafeAreaView>
    );
  }
  if (isPending) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#00FF9D" />
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={[styles.message, styles.error]}>Error: {error.message}</Text>
      </SafeAreaView>
    );
  }

  // — Inspect once to see what shape you actually got:
  // console.log("raw history data:", data);

  const history = (data || []).map((entry: any, idx: number) => {
    // either object-shaped...
    const vehicleNumber = entry.vehicleNumber ?? entry[0] ?? "-";
    const userName      = entry.userName      ?? entry[1] ?? "-";
    const rawHours      = entry.parkingHours  ?? entry[2] ?? 0;
    const rawPaid       = entry.amountPaid    ?? entry[3] ?? 0;
    const rawTs         = entry.timestamp     ?? entry[4] ?? 0;

    const parkingHours = typeof rawHours.toNumber === "function"
      ? rawHours.toNumber().toString()
      : String(rawHours);

    const amountPaid = typeof rawPaid.toNumber === "function"
      ? rawPaid.toNumber().toString()
      : String(rawPaid);

    const timestamp = typeof rawTs.toNumber === "function"
      ? new Date(rawTs.toNumber() * 1000).toLocaleString()
      : new Date(Number(rawTs) * 1000).toLocaleString();

    return {
      key: idx.toString(),
      vehicleNumber,
      userName,
      parkingHours,
      amountPaid,
      timestamp,
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
        <Text style={styles.greeting}>Welcome Back, mike!</Text>
        <TouchableOpacity style={styles.notificationIcon}>
          <Image source={notification} style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* One card per history entry */}
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
                Amount Paid: {item.amountPaid} ETH
              </Text>
              <Text style={styles.cardText}>On: {item.timestamp}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardTotal}>
                  Total: {item.amountPaid} ETH
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

      {/* Violation Card */}
      <View style={styles.violationCard}>
        <Text style={styles.violationTitle}>Violation Fees</Text>
        <Text style={styles.violationDescription}>
          You got 3 violations and deducted it by your wallet.
        </Text>
        <Text style={styles.violationTotal}>Total: 0.003 ETH</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1A1B22" },
  message: { color: "#fff", fontSize: 16, textAlign: "center" },
  error: { color: "#ff5555" },
  container: { flex: 1, backgroundColor: "#1A1B22" },
  contentContainer: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  greeting: { fontSize: 20, color: "#fff", fontWeight: "bold" },
  notificationIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#00FF9D", justifyContent: "center", alignItems: "center"
  },
  icon: { width: 24, height: 24, resizeMode: "contain" },
  currentCard: { backgroundColor: "#111D13", borderRadius: 8, overflow: "hidden", marginBottom: 16 },
  background: { position: "absolute", width: "100%", height: "100%", opacity: 0.3 },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  carparkIcon: { width: 40, height: 40, marginRight: 8 },
  cardTitle: { fontSize: 16, color: "#fff", fontWeight: "bold" },
  cardText: { fontSize: 14, color: "#fff" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  cardTotal: { fontSize: 16, color: "#00FF9D", fontWeight: "bold" },
  historyButton: { backgroundColor: "#00FF9D", padding: 8, borderRadius: 4 },
  historyButtonText: { color: "#fff", fontSize: 12 },
  violationCard: { backgroundColor: "#D8315B1A", borderRadius: 8, padding: 12, borderColor: "#D8315B", borderWidth: 1 },
  violationTitle: { fontSize: 18, color: "#D8315B", fontWeight: "bold" },
  violationDescription: { fontSize: 14, color: "#fff", marginVertical: 4 },
  violationTotal: { fontSize: 16, color: "#D8315B", fontWeight: "bold" },
});