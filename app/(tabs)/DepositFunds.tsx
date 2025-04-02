// components/DepositFunds.tsx
import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet } from "react-native";
import { parkingFeeContract } from "@/constants/thirdweb";

export default function DepositFunds() {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");

  const handleDeposit = async () => {
    try {
      // Convert the amount to a BigInt or number of Wei as needed
      const depositAmount = parseInt(amount, 10);
      const tx = await parkingFeeContract.call("depositBalance", {
        value: depositAmount,
      });
      setStatus(`Deposit successful! Tx Hash: ${tx.transactionHash}`);
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Amount in Wei"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
        keyboardType="numeric"
      />
      <Button title="Deposit Funds" onPress={handleDeposit} />
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 8, marginVertical: 8 },
  status: { marginTop: 16, fontWeight: "bold" },
});