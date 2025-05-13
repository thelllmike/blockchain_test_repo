// PayFee.jsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { WebView } from "react-native-webview";
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import CryptoJS from "crypto-js";
import { parkingFeeContract } from "@/constants/thirdweb";

const PAYPAL_CLIENT_ID = "AdPbYstY_n0fyZHyyKLNfPLaI6xIJm97ATNJ2WvfoPgXNW8BIsxtdbZIJ4cHz6B--cWF2cAE6f0aLnWg";  // replace with your PayPal client ID

export default function PayFee() {
  // ThirdWeb wallet setup
  const {
    mutate: sendTransaction,
    isLoading: walletLoading,
    error: walletError,
  } = useSendTransaction();

  // Local state
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [status, setStatus] = useState("");
  const [showPayPal, setShowPayPal] = useState(false);
  const [payPalHtml, setPayPalHtml] = useState("");

  // 1) On-chain wallet payment
  const handleWalletPayment = () => {
    if (!vehicleNumber.trim()) {
      setStatus("Please enter a valid vehicle number.");
      return;
    }

    const tx = prepareContractCall({
      contract: parkingFeeContract,
      method: "function payFee(string)",
      params: [vehicleNumber],
    });

    sendTransaction(tx, {
      onSuccess: ({ transactionHash }) => {
        setStatus(`Fee paid! Tx: ${transactionHash}`);
      },
      onError: (err) => {
        setStatus(
          err?.code === 4001
            ? "Transaction rejected by user."
            : `Error: ${err.message}`
        );
      },
    });
  };

  // 2) PayPal payment HTML generator
  const handlePayPalPayment = () => {
    if (!vehicleNumber.trim()) {
      setStatus("Please enter a valid vehicle number.");
      return;
    }
    const amount = "200.00"; // amount as string
    const currency = "USD";  // or your desired currency

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        </head>
        <body style="margin:0;padding:20px;display:flex;justify-content:center;">
          <div id="paypal-button-container"></div>
          <script src="https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${currency}"></script>
          <script>
            paypal.Buttons({
              style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'paypal' },
              createOrder: (data, actions) => {
                return actions.order.create({
                  purchase_units: [{
                    amount: { value: '${amount}' },
                    custom_id: '${vehicleNumber}'
                  }]
                });
              },
              onApprove: (data, actions) => {
                return actions.order.capture().then(details => {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    status: 'success',
                    orderID: data.orderID,
                    purchase: details
                  }));
                });
              },
              onCancel: () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'cancel' }));
              },
              onError: (err) => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'error', error: err.toString() }));
              }
            }).render('#paypal-button-container');
          </script>
        </body>
      </html>
    `;
    setPayPalHtml(html);
    setShowPayPal(true);
  };

  // 3) Render PayPal WebView
  if (showPayPal) {
    return (
      <SafeAreaView style={styles.webviewContainer}>
        <WebView
          originWhitelist={["*"]}
          source={{ html: payPalHtml, baseUrl: "https://www.paypal.com" }}
          javaScriptEnabled
          onMessage={(event) => {
            const msg = JSON.parse(event.nativeEvent.data);
            setShowPayPal(false);
            if (msg.status === "success") {
              setStatus(`PayPal Success! OrderID: ${msg.orderID}`);
            } else if (msg.status === "cancel") {
              setStatus("PayPal payment cancelled.");
            } else {
              setStatus(`PayPal error: ${msg.error}`);
            }
          }}
          startInLoadingState
          renderLoading={() => (
            <ActivityIndicator style={styles.webviewContainer} color="#fff" />
          )}
          style={styles.webviewContainer}
        />
      </SafeAreaView>
    );
  }

  // 4) Default view: form, buttons, status
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay Parking Fee</Text>

      <TextInput
        placeholder="Vehicle Number"
        placeholderTextColor="#666"
        value={vehicleNumber}
        onChangeText={setVehicleNumber}
        style={styles.input}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.walletButton, walletLoading && styles.disabledButton]}
          onPress={handleWalletPayment}
          disabled={walletLoading}
        >
          {walletLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>Pay with Wallet</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.payPalButton}
          onPress={handlePayPalPayment}
        >
          <Text style={styles.buttonText}>Pay with PayPal</Text>
        </TouchableOpacity>
      </View>

      {!!status && <Text style={styles.status}>{status}</Text>}
      {walletError && <Text style={styles.error}>Error: {walletError.message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  webviewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#1A1B22",
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#111D13",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  walletButton: {
    flex: 1,
    backgroundColor: "#00FF9D",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  payPalButton: {
    flex: 1,
    backgroundColor: "#003087",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  status: {
    color: "#fff",
    marginTop: 12,
    textAlign: "center",
  },
  error: {
    color: "#ff5555",
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
});