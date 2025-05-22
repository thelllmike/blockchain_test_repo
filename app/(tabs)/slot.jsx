import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import { baseColors } from "@/styles/colors/baseColors";
import alertColors from "@/styles/colors/alertColors";

export default function ParkingSlots() {
  const [slots, setSlots] = useState(
    Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      status: i === 0 ? "occupied" : "free", // demo: slot 1 occupied
      vehicleNumber: i === 0 ? "ABCD" : "",
    }))
  );
  const [selected, setSelected] = useState(null);

  // Layout constants
  const columns = 4;
  const spacing = 8;
  const { width } = Dimensions.get("window");
  const itemSize = (width - spacing * (columns + 1)) / columns;

  const onPressSlot = (slot) => {
    setSelected(slot);
  };

  const clearSlot = () => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === selected.id
          ? { ...s, status: "free", vehicleNumber: "" }
          : s
      )
    );
    setSelected(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Slots Overview</Text>
      <FlatList
        data={slots}
        keyExtractor={(item) => item.id.toString()}
        numColumns={columns}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.slot,
              {
                width: itemSize,
                height: itemSize,
                margin: spacing / 2,
                backgroundColor:
                  item.status === "free"
                    ? baseColors.primaryGreen
                    : alertColors.error,
              },
            ]}
            onPress={() => onPressSlot(item)}
          >
            <Text style={styles.slotText}>#{item.id}</Text>
            <Text style={styles.slotSubText}>
              {item.status === "free" ? "FREE" : `PARKED ${item.vehicleNumber}`}
            </Text>
          </TouchableOpacity>
        )}
      />

      {selected && (
        <Modal
          transparent
          animationType="fade"
          visible={true}
          onRequestClose={() => setSelected(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Slot #{selected.id}</Text>
              {selected.status === "occupied" ? (
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={clearSlot}
                >
                  <Text style={styles.modalButtonText}>Clear Slot</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.modalMessage}>This slot is already free.</Text>
              )}
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: alertColors.error },
                ]}
                onPress={() => setSelected(null)}
              >
                <Text style={styles.modalButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: baseColors.blue,
    padding: 8,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: baseColors.white,
    marginBottom: 8,
  },
  list: {
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  slot: {
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: baseColors.white,
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: baseColors.primaryGreen,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  modalButtonText: {
    color: baseColors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  modalMessage: {
    color: baseColors.white,
    fontSize: 14,
    marginVertical: 8,
  },
});