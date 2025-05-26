// components/PayFeeScreen.jsx
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

  // success animation
  const [modalScale] = useState(new Animated.Value(0));
  const [showSuccess, setShowSuccess] = useState(false);

  // PayPal
  const [showPayPal, setShowPayPal] = useState(false);
  const [payPalHtml, setPayPalHtml] = useState("");
  const webviewRef = useRef(null);

  // Card
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardDetails, setCardDetails] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);

  // Points
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [pointsPayAmount, setPointsPayAmount] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [payPointsLoading, setPayPointsLoading] = useState(false);

  // Cash
  const [showCashModal, setShowCashModal] = useState(false);

  // Fetch saved card once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/payments/users/${USER_ID}/cards`);
        const data = await res.json();
        setCardDetails(data[0] || null);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // Fetch current points balance whenever modal opens
  useEffect(() => {
    if (!showPointsModal) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/payments/users/${USER_ID}/topup/points`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 0 }),
        });
        const json = await res.json();
        setPointsBalance(json.points_balance);
      } catch (e) {
        console.error("Fetch points failed", e);
      }
    })();
  }, [showPointsModal]);

  // Success animation
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

  // Wallet payment
  const payWithWallet = () => {
    if (!vehicleNumber.trim()) return setStatus("Enter a vehicle number.");
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

  // PayPal
  const payWithPayPal = () => {
    if (!vehicleNumber.trim()) return setStatus("Enter a vehicle number.");
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
            onApprove:(d,a)=>a.order.capture().then(()=>{
              window.ReactNativeWebView.postMessage(JSON.stringify({status:'success',orderID:d.orderID}));
            }),
            onCancel:()=>window.ReactNativeWebView.postMessage(JSON.stringify({status:'cancel'})),
            onError:(e)=>window.ReactNativeWebView.postMessage(JSON.stringify({status:'error',error:e.toString()}))
          }).render('#paypal-button-container');
        </script>
      </body></html>`;
    setPayPalHtml(html);
    setShowPayPal(true);
  };
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

  // Top-up points
  const topUpPoints = async () => {
    if (!topUpAmount) return Alert.alert("Enter an amount");
    setTopUpLoading(true);
    try {
      const res = await fetch(`${API_BASE}/payments/users/${USER_ID}/topup/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(topUpAmount) }),
      });
      const json = await res.json();
      setPointsBalance(json.points_balance);
      setTopUpAmount("");
    } catch (e) {
      Alert.alert("Top-up failed", e.message);
    } finally {
      setTopUpLoading(false);
    }
  };

  // Pay with points
  const payWithPoints = async () => {
    if (!vehicleNumber.trim()) return Alert.alert("Enter vehicle number");
    if (!pointsPayAmount) return Alert.alert("Enter pay amount");
    setPayPointsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/payments/users/${USER_ID}/pay/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_number: vehicleNumber,
          amount: parseFloat(pointsPayAmount),
          card_id: 0,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        animateSuccess();
        setStatus(`Points ✓ Paid ${pointsPayAmount}`);
        setShowPointsModal(false);
      } else {
        Alert.alert("Payment failed", json.message || "Unknown");
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setPayPointsLoading(false);
    }
  };

  // Cash-at-gate
  const onProceed = () => {
    if (!selected) return;
    switch (selected) {
      case "cash":
        setShowCashModal(true);
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

  // Save card payment
  const saveCardPayment = async () => {
    if (!vehicleNumber.trim()) return Alert.alert("Enter a vehicle number.");
    if (!cardDetails) return Alert.alert("No card found.");
    setCardLoading(true);
    try {
      const res = await fetch(`${API_BASE}/payments/users/${USER_ID}/pay/card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          vehicle_number: vehicleNumber,
          amount: 0.001,
          card_id: cardDetails.id,
        }),
      });
      const body = await res.json();
      if (res.ok) {
        animateSuccess();
        setStatus(`Card ✓ ****${cardDetails.last4}`);
        setShowCardModal(false);
      } else {
        Alert.alert("Failed", body.message || "Unknown");
      }
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setCardLoading(false);
    }
  };

  // unified loading overlay
  const transactionLoading = walletLoading || cardLoading;

  // PayPal flow
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

  // payment methods
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
      {/* processing overlay */}
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

      {/* Success */}
      <Modal transparent visible={showSuccess}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[styles.successCircle, { transform: [{ scale: modalScale }] }]}
          >
            <Text style={styles.check}>✓</Text>
          </Animated.View>
        </View>
      </Modal>

      {/* Cash-at-gate Modal */}
      <Modal transparent visible={showCashModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.cardModalContainer}>
            <Text style={styles.cardModalTitle}>Pay at Gate</Text>
            <Text style={styles.modalMessage}>Please pay your fee at the gate.</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                setShowCashModal(false);
                animateSuccess();
                setStatus("Pay at gate");
              }}
            >
              <Text style={styles.saveText}>OK</Text>
            </TouchableOpacity>
          </View>
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
                  disabled={cardLoading}
                >
                  {cardLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Pay Now</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.modalMessage}>No saved card found.</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Points Modal */}
      <Modal transparent visible={showPointsModal} animationType="slide">
        <View style={styles.cardModalOverlay}>
          <View style={styles.cardModalContainer}>
            <Text style={styles.cardModalTitle}>Points Balance</Text>
            <Text style={[styles.cardInput, { textAlign: "center" }]}>
              {pointsBalance.toFixed(2)}
            </Text>

            {/* Top-up */}
            <TextInput
              placeholder="Top-up amount"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              style={styles.cardInput}
              value={topUpAmount}
              onChangeText={setTopUpAmount}
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={topUpPoints}
              disabled={topUpLoading}
            >
              {topUpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Top Up</Text>}
            </TouchableOpacity>

            {/* Separator */}
            <View style={{ height: 1, backgroundColor: "#333", width: "100%", marginVertical: 12 }} />

            {/* Pay with points */}
            <TextInput
              placeholder="Pay amount"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              style={styles.cardInput}
              value={pointsPayAmount}
              onChangeText={setPointsPayAmount}
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={payWithPoints}
              disabled={payPointsLoading}
            >
              {payPointsLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Pay Now</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowPointsModal(false)} style={{ marginTop: 8 }}>
              <Text style={[styles.saveText, { color: "#fff" }]}>Close</Text>
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

  // Card & Points Modal
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
  modalMessage: {
    color: "#ccc",
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

  // Points Modal
  pointsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});