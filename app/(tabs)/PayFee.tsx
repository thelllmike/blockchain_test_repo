// components/PayFee.tsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { parkingFeeContract } from "@/constants/thirdweb";

export default function PayFee() {
  const { mutate: sendTransaction, isLoading, error } = useSendTransaction();
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [status, setStatus] = useState("");

  const onClick = () => {
    if (!vehicleNumber.trim()) {
      setStatus("Please enter a valid vehicle number.");
      return;
    }

    // Prepare the contract call for "payFee"
    const transaction = prepareContractCall({
      contract: parkingFeeContract,
      method: "function payFee(string)",
      params: [vehicleNumber],
    });

    // Send the transaction
    sendTransaction(transaction, {
      onSuccess: (data) => {
        setStatus(`Fee paid successfully! Tx Hash: ${data.transactionHash}`);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay Fee</Text>
      <TextInput
        placeholder="Vehicle Number"
        placeholderTextColor="#aaa"
        value={vehicleNumber}
        onChangeText={setVehicleNumber}
        style={styles.input}
      />
      {isLoading ? (
        <ActivityIndicator size="large" color="#ffffff" />
      ) : (
        <Button title="Pay Fee" onPress={onClick} color="#ffffff" />
      )}
      {status ? (
        <Text style={[styles.status, status.startsWith("Error") && styles.error]}>
          {status}
        </Text>
      ) : null}
      {error && <Text style={styles.error}>Error: {error.message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#000", // black background for contrast
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#fff", // white text
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginVertical: 8,
    color: "#fff", // input text color
  },
  status: {
    marginTop: 16,
    fontWeight: "bold",
    color: "#fff", // white status text
  },
  error: {
    color: "red",
  },
});