// PayFeeScreen.jsx
import React, { useState, useRef } from "react";
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
  Platform,
  Image,
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

export default function PayFeeScreen() {
  const {
    mutate: sendTransaction,
    isLoading: walletLoading,
    error: walletError,
  } = useSendTransaction();
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const modalScale = useRef(new Animated.Value(0)).current;
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  const [payPalHtml, setPayPalHtml] = useState("");
  const webviewRef = useRef(null);

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
            onApprove:(d,a)=>a.order.capture().then(details=>window.ReactNativeWebView.postMessage(JSON.stringify({status:'success',orderID:d.orderID}))),
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
    if (msg.status === 'success') {
      animateSuccess();
      setStatus(`PayPal ✓ Order ${msg.orderID}`);
    } else if (msg.status === 'cancel') setStatus('PayPal canceled');
    else setStatus(`PayPal error: ${msg.error}`);
  };

  const animateSuccess = () => {
    setShowSuccess(true);
    modalScale.setValue(0);
    Animated.timing(modalScale, { toValue:1, duration:600, easing:Easing.bounce, useNativeDriver:true }).start(() =>
      setTimeout(() => setShowSuccess(false), 1500)
    );
  };

  const onProceed = () => {
    if (!selected) return;
    switch (selected) {
      case 'cash':   animateSuccess(); setStatus('PaidCash ✓'); break;
      case 'card':   payWithWallet(); break;
      case 'crypto': payWithWallet(); break;
      case 'paypal': payWithPayPal(); break;
      case 'points': animateSuccess(); setStatus('PaidPoints ✓'); break;
    }
  };

  if (showPayPal) {
    return (
      <SafeAreaView style={styles.webviewContainer}>
        <WebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html:payPalHtml, baseUrl:'https://www.paypal.com' }}
          javaScriptEnabled
          onMessage={onWebViewMsg}
          startInLoadingState
          renderLoading={() => <ActivityIndicator style={styles.webview} color='#000'/>}
          mixedContentMode='always'
          style={styles.webview}
        />
      </SafeAreaView>
    );
  }

  const methods = [
    {id:'cash',   label:'Cash',   icon:cashIcon},
    {id:'card',   label:'Card',   icon:visaIcon},
    {id:'crypto', label:'Crypto', icon:cryptoIcon},
    {id:'paypal', label:'PayPal', icon:paypalIcon},
    {id:'points', label:'Points 0.00', icon:pointsIcon},
  ];
  const {width} = Dimensions.get('window');
  const boxSize = (width - 48) / 2;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pay Parking Fee</Text>
      <TextInput
        placeholder='Vehicle Number'
        placeholderTextColor='#aaa'
        value={vehicleNumber}
        onChangeText={setVehicleNumber}
        style={styles.input}
      />
      <View style={styles.grid}>
        {methods.map(m=> (
          <TouchableOpacity
            key={m.id}
            style={[styles.methodBox, {width:boxSize,height:boxSize}, selected===m.id && styles.methodSelected]}
            onPress={()=>setSelected(m.id)}
          >
            <Image source={m.icon} style={styles.icon}/>
            <Text style={styles.methodLabel}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={[styles.proceedBtn, !selected && styles.disabled]} onPress={onProceed} disabled={!selected}>
        <Text style={styles.proceedText}>Proceed</Text>
      </TouchableOpacity>
      {!!status && <Text style={styles.status}>{status}</Text>}
      {walletError && <Text style={styles.error}>Error: {walletError.message}</Text>}
      <Modal transparent visible={showSuccess}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.successCircle,{transform:[{scale:modalScale}]}]}>
            <Text style={styles.check}>✓</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  webviewContainer:{flex:1,backgroundColor:'#fff'},
  webview:{flex:1},
  container:{flex:1,backgroundColor:'#1A1B22',padding:16},
  title:{fontSize:20,fontWeight:'bold',color:'#fff',marginBottom:12},
  input:{backgroundColor:'#111D13',borderRadius:8,padding:12,color:'#fff',marginBottom:16},
  grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},
  methodBox:{backgroundColor:'#2A2C33',borderRadius:8,marginBottom:16,justifyContent:'center',alignItems:'center'},
  methodSelected:{borderWidth:2,borderColor:baseColors.primaryGreen},
  icon:{width:32,height:32,marginBottom:8},
  methodLabel:{color:'#fff',fontSize:14},
  proceedBtn:{backgroundColor:baseColors.primaryGreen,padding:16,borderRadius:8,alignItems:'center'},
  disabled:{opacity:0.6},
  proceedText:{color:'#fff',fontSize:16,fontWeight:'bold'},
  status:{color:'#fff',marginTop:12,textAlign:'center'},
  error:{color:'#ff5555',marginTop:8},
  modalOverlay:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center'},
  successCircle:{width:160,height:160,borderRadius:80,backgroundColor:'#fff',justifyContent:'center',alignItems:'center',elevation:10},
  check:{fontSize:64,color:baseColors.primaryGreen},
});