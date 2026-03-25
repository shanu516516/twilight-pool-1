import { ChainWalletBase } from "@cosmos-kit/core";

/**
 * Build an ADR-036 signDoc for signAmino fallback.
 * This produces a deterministic signature for the same message,
 * compatible with wallets that don't support signArbitrary.
 */
function buildAdr036SignDoc(signer: string, message: string) {
  const msgBytes = Buffer.from(message).toString("base64");
  return {
    chain_id: "nyks",
    account_number: "0",
    sequence: "0",
    fee: { gas: "0", amount: [] },
    msgs: [
      {
        type: "sign/MsgSignData",
        value: {
          signer,
          data: msgBytes,
        },
      },
    ],
    memo: "",
  };
}

async function signWithLeapAmino(
  twAddress: string,
  message: string
): Promise<string[]> {
  if (typeof window === "undefined") return ["", ""];

  const leap = (window as unknown as Record<string, unknown>).leap as
    | {
        signAmino?: (
          chainId: string,
          signer: string,
          signDoc: ReturnType<typeof buildAdr036SignDoc>
        ) => Promise<{
          signature: { pub_key: { value: string }; signature: string };
        }>;
      }
    | undefined;

  if (!leap?.signAmino) return ["", ""];

  try {
    const signDoc = buildAdr036SignDoc(twAddress, message);
    const result = await leap.signAmino("nyks", twAddress, signDoc);
    return [result.signature.pub_key.value, result.signature.signature];
  } catch (err) {
    console.error("Leap signAmino fallback failed:", err);
    return ["", ""];
  }
}

function isLeapInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const leap = (window as unknown as Record<string, { mode?: string }>).leap;
  return leap?.mode === "mobile-web";
}

async function generateSignMessage(
  chainWallet: ChainWalletBase,
  twAddress: string,
  message: string
) {
  // Leap in-app browser: skip signArbitrary, go straight to signAmino
  if (isLeapInAppBrowser()) {
    return signWithLeapAmino(twAddress, message);
  }

  const client = chainWallet.client;

  if (client?.signArbitrary) {
    try {
      const { pub_key, signature } = await client.signArbitrary(
        "nyks",
        twAddress,
        message
      );
      return [pub_key, signature];
    } catch (err) {
      console.error("signArbitrary failed:", err);
    }
  }

  return ["", ""];
}

async function getBlockHeight(chainWallet: ChainWalletBase) {
  if (!chainWallet) return 0;

  try {
    const stargateClient = await chainWallet.getStargateClient();
    const height = await stargateClient.getHeight();
    return height;
  } catch (err) {
    console.error(err);
    return 0;
  }
}

export { generateSignMessage, getBlockHeight };
