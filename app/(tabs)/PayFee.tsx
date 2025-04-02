// components/PayFee.tsx
import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet } from "react-native";
import { parkingFeeContract } from "@/constants/thirdweb";

export default function PayFee() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [status, setStatus] = useState("");

  const handlePayFee = async () => {
    try {
      const tx = await parkingFeeContract.call("payFee", vehicleNumber);
      setStatus(`Fee paid! Tx Hash: ${tx.transactionHash}`);
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Vehicle Number"
        value={vehicleNumber}
        onChangeText={setVehicleNumber}
        style={styles.input}
      />
      <Button title="Pay Fee" onPress={handlePayFee} />
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 8, marginVertical: 8 },
  status: { marginTop: 16, fontWeight: "bold" },
});