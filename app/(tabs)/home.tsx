import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import alertColors from "@/styles/colors/alertColors";
import { baseColors } from "@/styles/colors/baseColors";
import { useReadContract, useActiveAccount } from "thirdweb/react";
import { parkingFeeContract } from "@/constants/thirdweb";
import carpark from "../../assets/images/carpark.png";
import notification from "../../assets/images/notification.png";
import background from "../../assets/images/background.png";

export default function HomeScreen() {
  const account = useActiveAccount();
  const { data, isPending } = useReadContract({
    contract: parkingFeeContract,
    method:
      "function paymentHistories(address, uint256) view returns (string vehicleNumber, string userName, uint256 parkingHours, uint256 amountPaid, uint256 timestamp)",
    params: [account?.address || "0x0", 0],
  });

  // 1) Destructure the returned tuple
  const entry      = data || [];
  const vehicleNum = entry[0] ?? "-";
  const user       = entry[1] ?? "-";
  const hours      = entry[2]?.toString() ?? "-";
  const amount     = entry[3]?.toString() ?? "-";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome Back, mike!</Text>
        <TouchableOpacity style={styles.notificationIcon}>
          <Image source={notification} style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* Current Parking Card */}
      <View style={styles.currentCard}>
        <Image source={background} style={styles.background} />
        <View style={styles.cardContent}>
          {isPending ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <View style={styles.cardHeader}>
                <Image source={carpark} style={styles.carparkIcon} />
                <Text style={styles.cardTitle}>{vehicleNum}</Text>
              </View>
              <Text style={styles.cardText}>User: {user}</Text>
              <Text style={styles.cardText}>Parked Time: {hours} hrs</Text>
              <Text style={styles.cardText}>Amount Paid: {amount} ETH</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardTotal}>Total: {amount} ETH</Text>
                <TouchableOpacity style={styles.historyButton}>
                  <Text style={styles.historyButtonText}>View History</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

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
  container: {
    flex: 1,
    backgroundColor: "#1A1B22",
  },
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
  greeting: {
    fontSize: 20,
    color: baseColors.white,
    fontWeight: "bold",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 23,
    backgroundColor: baseColors.primaryGreen,
    justifyContent: "center",
    alignItems: "center",
    opacity: 1,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
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
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  carparkIcon: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    color: baseColors.white,
    fontWeight: "bold",
  },
  cardText: {
    fontSize: 14,
    color: baseColors.white,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  cardTotal: {
    fontSize: 16,
    color: baseColors.primaryGreen,
    fontWeight: "bold",
  },
  historyButton: {
    backgroundColor: baseColors.primaryGreen,
    padding: 8,
    borderRadius: 4,
  },
  historyButtonText: {
    color: baseColors.white,
    fontSize: 12,
  },
  violationCard: {
    backgroundColor: "#D8315B1A",
    borderRadius: 8,
    padding: 12,
    borderColor: alertColors.error,
    borderWidth: 1,
  },
  violationTitle: {
    fontSize: 18,
    color: alertColors.error,
    fontWeight: "bold",
  },
  violationDescription: {
    fontSize: 14,
    color: baseColors.white,
    marginVertical: 4,
  },
  violationTotal: {
    fontSize: 16,
    color: alertColors.error,
    fontWeight: "bold",
  },
});