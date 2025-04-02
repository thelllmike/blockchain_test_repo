import { Image, StyleSheet, View, useColorScheme } from "react-native";

import { ParallaxScrollView } from "@/components/ParallaxScrollView";
import { ThemedButton } from "@/components/ThemedButton";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { chain, client } from "@/constants/thirdweb";
import { useEffect, useState } from "react";
import { createAuth } from "thirdweb/auth";
import { baseSepolia, ethereum } from "thirdweb/chains";
import {
	ConnectButton,
	ConnectEmbed,
	useActiveAccount,
	useActiveWallet,
	useConnect,
	useDisconnect,
} from "thirdweb/react";
import { shortenAddress } from "thirdweb/utils";
import { createWallet } from "thirdweb/wallets";
import {
	getUserEmail,
	
} from "thirdweb/wallets/in-app";

const wallets = [

	createWallet("io.metamask"),
	createWallet("com.coinbase.wallet", {
		appMetadata: {
			name: "Thirdweb RN Demo",
		},
		mobileConfig: {
			callbackURL: "com.thirdweb.demo://",
		},
		walletConfig: {
			options: "smartWalletOnly",
		},
	}),
	createWallet("me.rainbow"),
	createWallet("com.trustwallet.app"),
	createWallet("io.zerion.wallet"),
];

const thirdwebAuth = createAuth({
	domain: "localhost:3000",
	client,
});

// fake login state, this should be returned from the backend
let isLoggedIn = false;

export default function HomeScreen() {
	const account = useActiveAccount();
	const theme = useColorScheme();
	return (
		<ParallaxScrollView
			headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
			headerImage={
				<Image
					source={require("@/assets/images/title.png")}
					style={styles.reactLogo}
				/>
			}
		>
			<ThemedView style={styles.titleContainer}>
				<ThemedText type="title">Connecting Wallets</ThemedText>
			</ThemedView>
		
			<ConnectButton
				client={client}
				theme={theme || "dark"}
				wallets={wallets}
				chain={baseSepolia}
			/>
			
			
			<View style={{ height: 16 }} />
			
			<ConnectEmbed
				client={client}
				theme={theme || "dark"}
				chain={ethereum}
				wallets={wallets}
				auth={{
					async doLogin(params) {
						// fake delay
						await new Promise((resolve) => setTimeout(resolve, 2000));
						const verifiedPayload = await thirdwebAuth.verifyPayload(params);
						isLoggedIn = verifiedPayload.valid;
					},
					async doLogout() {
						isLoggedIn = false;
					},
					async getLoginPayload(params) {
						return thirdwebAuth.generatePayload(params);
					},
					async isLoggedIn(address) {
						return isLoggedIn;
					},
				}}
			/>
			
			<View style={{ height: 16 }} />
			
			{/* <CustomConnectUI /> */}
		</ParallaxScrollView>
	);
}

const CustomConnectUI = () => {
	const wallet = useActiveWallet();
	const account = useActiveAccount();
	const [email, setEmail] = useState<string | undefined>();
	const { disconnect } = useDisconnect();
	useEffect(() => {
		if (wallet && wallet.id === "inApp") {
			getUserEmail({ client }).then(setEmail);
		}
	}, [wallet]);

	return wallet && account ? (
		<View>
			<ThemedText>Connected as {shortenAddress(account.address)}</ThemedText>
			{email && <ThemedText type="subtext">{email}</ThemedText>}
			<View style={{ height: 16 }} />
			<ThemedButton onPress={() => disconnect(wallet)} title="Disconnect" />
		</View>
	) : (
		<>
			{/* <ConnectWithGoogle /> */}
			<ConnectWithMetaMask />
			{/* <ConnectWithPasskey /> */}
		</>
	);
};


const ConnectWithMetaMask = () => {
	const { connect, isConnecting } = useConnect();
	return (
		<ThemedButton
			title="Connect with MetaMask"
			variant="secondary"
			loading={isConnecting}
			loadingTitle="Connecting..."
			onPress={() => {
				connect(async () => {
					const w = createWallet("io.metamask");
					await w.connect({
						client,
					});
					return w;
				});
			}}
		/>
	);
};



const styles = StyleSheet.create({
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	stepContainer: {
		gap: 8,
		marginBottom: 8,
	},
	reactLogo: {
		height: "100%",
		width: "100%",
		bottom: 0,
		left: 0,
		position: "absolute",
	},
	rowContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 24,
		justifyContent: "space-evenly",
	},
	tableContainer: {
		width: "100%",
	},
	tableRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 4,
	},
	leftColumn: {
		flex: 1,
		textAlign: "left",
	},
	rightColumn: {
		flex: 1,
		textAlign: "right",
	},
});
