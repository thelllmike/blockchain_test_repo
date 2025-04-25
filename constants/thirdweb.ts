// constants/thirdweb.ts
import { createThirdwebClient, getContract } from "thirdweb";
import { defineChain } from "thirdweb/chains";

// Use your clientId here (for testing, hardcoded; for production, use an environment variable)
const clientId = "eaa364fbfd9f542bc5580747f2ff8cf0";

const client = createThirdwebClient({
  clientId,
});

// Define your custom chain using the Sepolia chain ID (11155111)
export const chain = defineChain(11155111);

// Create and export your contract instance using the client, chain, and your contract address.
export const parkingFeeContract = getContract({
  client,
  chain,
  address: "0x86f00375cd8c965c74e0fed57d937371635c9e1a",
});

export { client };