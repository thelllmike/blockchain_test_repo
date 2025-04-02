// // components/DepositFunds.tsx
// import React, { useState } from "react";
// import {
//   View,
//   TextInput,
//   Button,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
// } from "react-native";
// import { ethers } from "ethers";
// import { prepareContractCall } from "thirdweb";
// import { useSendTransaction } from "thirdweb/react";
// import { parkingFeeContract } from "@/constants/thirdweb";

// export default function DepositFunds() {
//   const { mutate: sendTransaction, isLoading, error } = useSendTransaction();
//   const [amount, setAmount] = useState("");
//   const [status, setStatus] = useState("");

//   const onClick = () => {
//     console.log("Deposit Funds button clicked");
//     // Validate input: ensure a nonzero value is provided
//     if (!amount.trim() || Number(amount) <= 0) {
//       setStatus("Please enter a valid deposit amount in ETH.");
//       console.log("Invalid amount input:", amount);
//       return;
//     }

//     let valueWei;
//     try {
//       // Convert ETH amount (as string) to Wei using ethers.js
//       valueWei = ethers.utils.parseEther(amount);
//       console.log("Converted ETH to Wei:", valueWei.toString());
//     } catch (err) {
//       console.error("Error converting ETH to Wei:", err);
//       setStatus("Invalid decimal number. Please enter a valid ETH amount.");
//       return;
//     }

//     // Prepare the transaction for the payable depositBalance() function
//     const transaction = prepareContractCall({
//       contract: parkingFeeContract,
//       method: "function depositBalance() payable",
//       params: [],
//     });
//     console.log("Prepared transaction object:", transaction);

//     // Send the transaction while passing the converted Wei value
//     sendTransaction(transaction, {
//       value: valueWei.toString(),
//       onSuccess: (data) => {
//         console.log("Transaction successful:", data);
//         setStatus(`Deposit successful! Tx Hash: ${data.transactionHash}`);
//       },
//       onError: (err) => {
//         console.error("Transaction error:", err);
//         if (err?.code === 4001) {
//           setStatus("Transaction rejected by user.");
//         } else {
//           setStatus(`Error: ${err.message}`);
//         }
//       },
//     });
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Deposit Funds</Text>
//       <TextInput
//         placeholder="Amount in ETH"
//         value={amount}
//         onChangeText={setAmount}
//         style={styles.input}
//         keyboardType="decimal-pad"
//       />
//       {isLoading ? (
//         <ActivityIndicator size="large" color="#0000ff" />
//       ) : (
//         <Button title="Deposit Funds" onPress={onClick} />
//       )}
//       {status ? (
//         <Text style={[styles.status, status.startsWith("Error") && styles.error]}>
//           {status}
//         </Text>
//       ) : null}
//       {error && <Text style={styles.error}>Error: {error.message}</Text>}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { padding: 16 },
//   title: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     padding: 8,
//     marginVertical: 8,
//   },
//   status: { marginTop: 16, fontWeight: "bold" },
//   error: { color: "red" },
// });