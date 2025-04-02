// components/RegisterVehicle.tsx
import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator } from "react-native";
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { parkingFeeContract } from "@/constants/thirdweb";

export default function RegisterVehicle() {
  const { mutate: sendTransaction, isLoading, error } = useSendTransaction();
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [userName, setUserName] = useState("");
  const [status, setStatus] = useState("");

  const onClick = () => {
    // Validate inputs
    if (!vehicleNumber.trim() || !userName.trim()) {
      setStatus("Please enter both vehicle number and user name.");
      return;
    }

    // Prepare the contract call for "registerVehicle"
    const transaction = prepareContractCall({
      contract: parkingFeeContract,
      method: "function registerVehicle(string,string)",
      params: [vehicleNumber, userName],
    });

    // Send the transaction using useSendTransaction hook
    sendTransaction(transaction, {
      onSuccess: (data) => {
        setStatus(`Vehicle registered successfully! Tx Hash: ${data.transactionHash}`);
      },
      onError: (err) => {
        // Handle user rejection (error code 4001) or other errors
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
      <Text style={styles.title}>Register Your Vehicle</Text>
      <TextInput
        placeholder="Vehicle Number"
        value={vehicleNumber}
        onChangeText={setVehicleNumber}
        style={styles.input}
      />
      <TextInput
        placeholder="User Name"
        value={userName}
        onChangeText={setUserName}
        style={styles.input}
      />
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Register Vehicle" onPress={onClick} />
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
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 8, marginVertical: 8 },
  status: { marginTop: 16, fontWeight: "bold" },
  error: { color: "red" },
});