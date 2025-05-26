import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { prepareContractCall } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { parkingFeeContract } from "@/constants/thirdweb";
import { baseColors } from "@/styles/colors/baseColors";

import cashIcon from "@/assets/images/cash.png";
import visaIcon from "@/assets/images/visa.png";
import cryptoIcon from "@/assets/images/crypto.png";
import paypalIcon from "@/assets/images/paypal.png";
import pointsIcon from "@/assets/images/points.png";

const PAYPAL_CLIENT_ID = "AdPbYstY_n0fyZHyyKLNfPLaI6xIJm97ATNJ2WvfoPgXNW8BIsxtdbZIJ4cHz6B--cWF2cAE6f0aLnWg";
const API_BASE = "http://20.64.252.34:8000";
const USER_ID = 1;

export default function PayFeeScreen() {
  // thirdweb wallet hook
  const { mutate: sendTransaction, isLoading: walletLoading, error: walletError } = useSendTransaction();

  // UI state
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [modalScale] = useState(new Animated.Value(0));
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  const [payPalHtml, setPayPalHtml] = useState("");
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardDetails, setCardDetails] = useState(null);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsBalance] = useState(0.0);

  // New loading state for card payments
  const [cardLoading, setCardLoading] = useState(false);

  const webviewRef = useRef(null);

  // fetch saved card on mount
  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        const res = await fetch(`${API_BASE}/payments/users/${USER_ID}/cards`);
        const data = await res.json();
        setCardDetails(data.length ? data[0] : null);
      } catch (error) {
        console.error("Error fetching card details:", error);
      }
    };
    fetchCardDetails();
  }, []);

  // animate the ✓ success circle
  const animateSuccess = () => {
    setShowSuccess(true);
    modalScale.setValue(0);
    Animated.timing(modalScale, {
      toValue: 1,
      duration: 600,
      easing: Easing.bounce,
      useNativeDriver: true,
    }).start(() => setTimeout(() => setShowSuccess(false), 1500));
  };

  // PAY WITH WALLET
  const payWithWallet = () => {
    if (!vehicleNumber.trim()) {
      return setStatus("Enter a vehicle number.");
    }
    const tx = prepareContractCall({
      contract: parkingFeeContract,
      method: "function payFee(string)",
      params: [vehicleNumber],
    });

    sendTransaction(tx, {
      onSuccess: ({ transactionHash }) => {
        animateSuccess();
        setStatus(`Wallet ✓ Tx: ${transactionHash}`);
      },
      onError: (err) => {
        setStatus(err.code === 4001 ? "User denied." : `Error: ${err.message}`);
      },
    });
  };

  // PAY WITH PAYPAL
  const payWithPayPal = () => {
    if (!vehicleNumber.trim()) {
      return setStatus("Enter a vehicle number.");
    }
    const html = `
      <!DOCTYPE html><html><head>
        <meta name='viewport' content='width=device-width, initial-scale=1'/>
        <style>body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#fff}</style>
      </head><body>
        <div id='paypal-button-container'></div>
        <script src='https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD'></script>
        <script>
          paypal.Buttons({
            style:{layout:'vertical',color:'gold',shape:'pill',label:'paypal'},
            createOrder:(d,a)=>a.order.create({purchase_units:[{amount:{value:'200.00'},custom_id:'${vehicleNumber}'}]}),
            onApprove:(d,a)=>a.order.capture().then(details=>
              window.ReactNativeWebView.postMessage(JSON.stringify({status:'success',orderID:d.orderID}))
            ),
            onCancel:()=>window.ReactNativeWebView.postMessage(JSON.stringify({status:'cancel'})),
            onError:(e)=>window.ReactNativeWebView.postMessage(JSON.stringify({status:'error',error:e.toString()}))
          }).render('#paypal-button-container');
        </script>
      </body></html>`;
    setPayPalHtml(html);
    setShowPayPal(true);
  };

  // handle messages from PayPal webview
  const onWebViewMsg = (evt) => {
    const msg = JSON.parse(evt.nativeEvent.data);
    setShowPayPal(false);
    if (msg.status === "success") {
      animateSuccess();
      setStatus(`PayPal ✓ Order ${msg.orderID}`);
    } else if (msg.status === "cancel") {
      setStatus("PayPal canceled");
    } else {
      setStatus(`PayPal error: ${msg.error}`);
    }
  };

  // main "Proceed" dispatcher
  const onProceed = () => {
    if (!selected) return;
    switch (selected) {
      case "cash":
        animateSuccess();
        setStatus("Paid Cash ✓");
        break;
      case "card":
        setShowCardModal(true);
        break;
      case "crypto":
        payWithWallet();
        break;
      case "paypal":
        payWithPayPal();
        break;
      case "points":
        setShowPointsModal(true);
        break;
    }
  };

  // CARD PAYMENT
  const saveCardPayment = async () => {
    if (!vehicleNumber.trim()) {
      return Alert.alert("Error", "Enter a vehicle number.");
    }
    if (!cardDetails) {
      return Alert.alert("Error", "No card details found.");
    }

    setCardLoading(true);
    try {
      const res = await fetch(`${API_BASE}/payments/users/${USER_ID}/pay/card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          vehicle_number: vehicleNumber,
          amount: 0.001, // Replace with real amount
          card_id: cardDetails.id,
        }),
      });
      const body = await res.json();
      if (res.ok) {
        animateSuccess();
        setStatus(`Card payment ✓ (****${cardDetails.last4})`);
        setShowCardModal(false);
      } else {
        Alert.alert("Payment Failed", body.message || "Unknown error.");
      }
    } catch (err) {
      console.error("Error making card payment:", err);
      Alert.alert("Error", "Could not complete payment.");
    } finally {
      setCardLoading(false);
    }
  };

  // If showing PayPal flow, render WebView
  if (showPayPal) {
    return (
      <SafeAreaView style={styles.webviewContainer}>
        <WebView
          ref={webviewRef}
          originWhitelist={["*"]}
          source={{ html: payPalHtml, baseUrl: "https://www.paypal.com" }}
          javaScriptEnabled
          onMessage={onWebViewMsg}
          startInLoadingState
          renderLoading={() => <ActivityIndicator style={styles.webview} />}
          mixedContentMode="always"
          style={styles.webview}
        />
      </SafeAreaView>
    );
  }

  // COMBINED loading flag
  const transactionLoading = walletLoading || cardLoading;

  // PAYMENT METHODS
  const methods = [
    { id: "cash", label: "Cash", icon: cashIcon },
    { id: "card", label: "Card", icon: visaIcon },
    { id: "crypto", label: "Crypto", icon: cryptoIcon },
    { id: "paypal", label: "PayPal", icon: paypalIcon },
    { id: "points", label: "Points", icon: pointsIcon },
  ];
  const { width } = Dimensions.get("window");
  const boxSize = (width - 48) / 2;

  return (
    <View style={styles.container}>
      {/* Processing overlay */}
      <Modal transparent visible={transactionLoading}>
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={baseColors.primaryGreen} />
        </View>
      </Modal>

      <Text style={styles.title}>Pay Parking Fee</Text>
      <TextInput
        placeholder="Vehicle Number"
        placeholderTextColor="#aaa"
        value={vehicleNumber}
        onChangeText={setVehicleNumber}
        style={styles.input}
      />

      <View style={styles.grid}>
        {methods.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[
              styles.methodBox,
              { width: boxSize, height: boxSize },
              selected === m.id && styles.methodSelected,
            ]}
            onPress={() => setSelected(m.id)}
          >
            <Image source={m.icon} style={styles.icon} />
            <Text style={styles.methodLabel}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.proceedBtn, !selected && styles.disabled]}
        onPress={onProceed}
        disabled={!selected}
      >
        <Text style={styles.proceedText}>Proceed</Text>
      </TouchableOpacity>

      {!!status && <Text style={styles.status}>{status}</Text>}
      {walletError && <Text style={styles.error}>Error: {walletError.message}</Text>}

      {/* Success Modal */}
      <Modal transparent visible={showSuccess}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[styles.successCircle, { transform: [{ scale: modalScale }] }]}
          >
            <Text style={styles.check}>✓</Text>
          </Animated.View>
        </View>
      </Modal>

      {/* Card Modal */}
      <Modal transparent visible={showCardModal} animationType="slide">
        <View style={styles.cardModalOverlay}>
          <View style={styles.cardModalContainer}>
            <Text style={styles.cardModalTitle}>Confirm Card Payment</Text>
            <TouchableOpacity
              onPress={() => setShowCardModal(false)}
              style={styles.cardModalClose}
            >
              <Text style={styles.closeText}>←</Text>
            </TouchableOpacity>

            {cardDetails ? (
              <>
                <Text style={styles.cardInput}>Card: **** {cardDetails.last4}</Text>
                <Text style={styles.cardInput}>
                  Expiry: {cardDetails.exp_month}/{cardDetails.exp_year}
                </Text>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveCardPayment}
                >
                  <Text style={styles.saveText}>Pay Now</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={{ color: "#fff" }}>No saved card found.</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Points Modal */}
      <Modal transparent visible={showPointsModal} animationType="slide">
        <View style={styles.pointsOverlay}>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsTitle}>CURRENT POINTS</Text>
            <Text style={styles.pointsValue}>{pointsBalance.toFixed(2)}</Text>
            <TouchableOpacity
              style={styles.topUpButton}
              onPress={() => setShowPointsModal(false)}
            >
              <Text style={styles.topUpText}>Top up my Points</Text>
            </TouchableOpacity>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Your points balance will update within a minute. Please go to
                the Payment screen and tap Points to view the updated balance.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowPointsModal(false)}
              style={{ marginTop: 8 }}
            >
              <Text style={[styles.saveText, { color: "#333" }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  webviewContainer: { flex: 1, backgroundColor: "#fff" },
  webview: { flex: 1 },

  container: { flex: 1, backgroundColor: "#1A1B22", padding: 16 },
  title: { fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 12 },
  input: {
    backgroundColor: "#111D13",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    marginBottom: 16,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  methodBox: {
    backgroundColor: "#2A2C33",
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  methodSelected: {
    borderWidth: 2,
    borderColor: baseColors.primaryGreen,
  },
  icon: { width: 32, height: 32, marginBottom: 8 },
  methodLabel: { color: "#fff", fontSize: 14 },

  proceedBtn: {
    backgroundColor: baseColors.primaryGreen,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  proceedText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  status: { color: "#fff", marginTop: 12, textAlign: "center" },
  error: { color: "#ff5555", marginTop: 8 },

  // Processing Overlay
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  check: { fontSize: 64, color: baseColors.primaryGreen },

  // Card Modal Styles
  cardModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardModalContainer: {
    width: "90%",
    backgroundColor: "#111D13",
    borderRadius: 12,
    padding: 16,
  },
  cardModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  cardModalClose: { position: "absolute", top: 16, left: 16 },
  closeText: { color: "#fff", fontSize: 18 },
  cardInput: {
    backgroundColor: "#2A2C33",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: baseColors.primaryGreen,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  // Points Modal Styles
  pointsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pointsContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  pointsTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  pointsValue: { fontSize: 36, fontWeight: "bold", marginBottom: 16 },
  topUpButton: {
    backgroundColor: baseColors.primaryGreen,
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  topUpText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  infoBox: {
    backgroundColor: "#FDEDEC",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoText: { color: "#C0392B", textAlign: "center" },
});