// components/ParkingSlots.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { baseColors } from "@/styles/colors/baseColors";
import alertColors from "@/styles/colors/alertColors";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { parkingFeeContract } from "@/constants/thirdweb";

export default function ParkingSlots() {
  const account = useActiveAccount();

  // 1️⃣ On-chain: get my registered vehicles
  const {
    data: vehicleInfos,
    isPending: vehicleLoading,
    error: vehicleError,
    refetch: refetchVehicles,
  } = useReadContract({
    contract: parkingFeeContract,
    method:
      "function getVehicleInfo(address _user) view returns ((string vehicleNumber,string userName,address walletAddress,uint256 parkingHours,uint256 totalFee)[])",
    params: [account?.address || "0x0"],
  });
  // just the plate strings
  const myPlates = vehicleInfos?.map((v) => v.vehicleNumber) || [];

  // 2️⃣ REST: fetch all slots
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState(null);

  const fetchSlots = async () => {
    setSlotsLoading(true);
    try {
      const res = await fetch("http://172.179.236.15:8000/slots");
      const json = await res.json();
      setSlots(
        json.map((s) => ({
          id: s.slot_id,
          status: s.status, // "free" or "booked"
          plate: s.parked_vehicle_plate,
        }))
      );
      setSlotsError(null);
    } catch (e) {
      setSlotsError(e.message);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(fetchSlots, []);

  // 3️⃣ State for modals
  const [selected, setSelected] = useState(null);
  const [bookingModal, setBookingModal] = useState(false);
  const [clearModal, setClearModal] = useState(false);

  // For booking: which plate user picked
  const [chosenPlate, setChosenPlate] = useState("");

  // 4️⃣ Book slot
  const [booking, setBooking] = useState(false);
  const bookSlot = async () => {
    if (!chosenPlate) return;
    setBooking(true);
    try {
      await fetch("http://172.179.236.15:8000/slots/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot_id: selected.id, vehicle_plate: chosenPlate }),
      });
      await fetchSlots();
      refetchVehicles();
      closeModals();
    } catch (e) {
      alert("Error booking slot: " + e.message);
    } finally {
      setBooking(false);
    }
  };

  // 5️⃣ Clear slot
  const [clearing, setClearing] = useState(false);
  const clearSlot = async () => {
    setClearing(true);
    try {
      await fetch("http://172.179.236.15:8000/slots/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot_id: selected.id, rate_per_hour: 10 }),
      });
      await fetchSlots();
      refetchVehicles();
      closeModals();
    } catch (e) {
      alert("Error clearing slot: " + e.message);
    } finally {
      setClearing(false);
    }
  };

  const closeModals = () => {
    setSelected(null);
    setBookingModal(false);
    setClearModal(false);
    setChosenPlate("");
  };

  // 6️⃣ Layout calculations
  const columns = 4;
  const spacing = 8;
  const { width } = Dimensions.get("window");
  const itemSize = (width - spacing * (columns + 1)) / columns;

  // 7️⃣ Loading & error
  if (!account) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Connect your wallet to view slots.</Text>
      </View>
    );
  }
  if (vehicleLoading || slotsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={baseColors.primaryGreen} />
      </View>
    );
  }
  if (vehicleError || slotsError) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{vehicleError || slotsError}</Text>
      </View>
    );
  }

  // 8️⃣ Render
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Slots Overview</Text>
      <FlatList
        data={slots}
        keyExtractor={(i) => i.id.toString()}
        numColumns={columns}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          // pick color & label
          let bg =
            item.status === "free"
              ? baseColors.primaryGreen
              : myPlates.includes(item.plate)
              ? baseColors.blue
              : alertColors.error;
          let label =
            item.status === "free"
              ? "FREE"
              : myPlates.includes(item.plate)
              ? `YOU: ${item.plate}`
              : "BOOKED";
          return (
            <TouchableOpacity
              onPress={() => {
                setSelected(item);
                if (item.status === "free") setBookingModal(true);
                else if (myPlates.includes(item.plate)) setClearModal(true);
              }}
              style={[
                styles.slot,
                { width: itemSize, height: itemSize, backgroundColor: bg },
              ]}
            >
              <Text style={styles.slotText}>#{item.id}</Text>
              <Text style={styles.slotSubText}>{label}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Booking Modal */}
      <Modal
        visible={bookingModal}
        transparent
        animationType="fade"
        onRequestClose={closeModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book Slot #{selected?.id}</Text>
            <Text style={styles.modalMessage}>Select your vehicle:</Text>
            {myPlates.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.choice,
                  chosenPlate === p && styles.choiceSelected,
                ]}
                onPress={() => setChosenPlate(p)}
              >
                <Text
                  style={[
                    styles.choiceText,
                    chosenPlate === p && styles.choiceTextSelected,
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.modalButton,
                !chosenPlate && { opacity: 0.6 },
              ]}
              disabled={!chosenPlate || booking}
              onPress={bookSlot}
            >
              {booking ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Confirm Booking</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: alertColors.error }]}
              onPress={closeModals}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Clear Modal */}
      <Modal
        visible={clearModal}
        transparent
        animationType="fade"
        onRequestClose={closeModals}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Clear Slot #{selected?.id}</Text>
            <Text style={styles.modalMessage}>
              Remove vehicle {selected?.plate}?
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, clearing && { opacity: 0.6 }]}
              onPress={clearSlot}
              disabled={clearing}
            >
              {clearing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Clear Slot</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: alertColors.error }]}
              onPress={closeModals}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8, backgroundColor: baseColors.white },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: baseColors.white,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 8,
    color: baseColors.black,
  },
  list: {
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  slot: {
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
  },
  slotText: {
    fontSize: 16,
    fontWeight: "bold",
    color: baseColors.white,
  },
  slotSubText: {
    fontSize: 12,
    color: baseColors.white,
    marginTop: 4,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: baseColors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: baseColors.black,
  },
  modalMessage: {
    fontSize: 14,
    color: baseColors.gray,
    marginBottom: 12,
    textAlign: "center",
  },
  choice: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: baseColors.gray,
    marginVertical: 4,
    width: "100%",
    alignItems: "center",
  },
  choiceSelected: {
    backgroundColor: baseColors.primaryGreen,
    borderColor: baseColors.primaryGreen,
  },
  choiceText: {
    color: baseColors.black,
  },
  choiceTextSelected: {
    color: baseColors.white,
    fontWeight: "bold",
  },
  modalButton: {
    backgroundColor: baseColors.primaryGreen,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  modalButtonText: {
    color: baseColors.white,
    fontSize: 16,
    fontWeight: "bold",
  },

  message: { color: baseColors.gray },
  error: { color: alertColors.error },
});