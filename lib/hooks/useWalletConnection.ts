"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useManager, useWallet } from "@cosmos-kit/react-lite";
import { CHAIN_NAME } from "@/lib/constants/chain";
import { WalletEntry, WALLET_REGISTRY } from "@/lib/wallets/registry";
import { WalletErrorType, classifyWalletError } from "@/lib/wallets/errors";
import { connectWithTimeout } from "@/lib/wallets/connect-with-timeout";
import { useTwilight } from "@/lib/providers/twilight";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConnectionState =
  | { view: "idle" }
  | { view: "connecting"; wallet: WalletEntry }
  | { view: "qr"; wallet: WalletEntry; qrUri: string }
  | { view: "error"; wallet: WalletEntry; errorType: WalletErrorType }
  | { view: "not_installed"; wallet: WalletEntry };

export interface UseWalletConnectionReturn {
  state: ConnectionState;
  connect: (wallet: WalletEntry) => Promise<void>;
  disconnect: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
  address: string | undefined;
  isConnected: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWalletConnection(): UseWalletConnectionReturn {
  const { status, mainWallet } = useWallet();
  const { getWalletRepo } = useManager();
  const { hasInit, setHasInit } = useTwilight();

  const [state, setState] = useState<ConnectionState>({ view: "idle" });
  const lastWalletRef = useRef<WalletEntry | null>(null);
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derived state
  const isConnected = status === "Connected";
  const chainWallet = mainWallet?.getChainWallet(CHAIN_NAME);
  const address = chainWallet?.address;

  // Clean up QR polling on unmount
  useEffect(() => {
    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, []);

  // Auto-disconnect stale mobile wallet sessions on page refresh.
  // WalletConnect sessions don't survive refresh, so cosmos-kit reports
  // a false "Connected" with a cached address. Detect and disconnect once.
  const hasCheckedStaleRef = useRef(false);
  useEffect(() => {
    if (hasCheckedStaleRef.current) return;
    if (!mainWallet || status !== "Connected") return;

    hasCheckedStaleRef.current = true;

    const walletName = mainWallet.walletName;
    const isMobileWallet = WALLET_REGISTRY.some(
      (w) => w.id === walletName && w.platform === "mobile"
    );

    if (isMobileWallet) {
      mainWallet
        .disconnect(false, { walletconnect: { removeAllPairings: true } })
        .catch((err) =>
          console.error("Failed to disconnect stale mobile session:", err)
        );
    }
  }, [mainWallet, status]);

  // Auto-reset to idle when connection fully succeeds (status + address)
  useEffect(() => {
    if (isConnected && address && state.view !== "idle") {
      setState({ view: "idle" });
    }
  }, [isConnected, address, state.view]);

  // ------------------------------------------
  // Connect
  // ------------------------------------------
  const connect = useCallback(
    async (wallet: WalletEntry) => {
      // Cancel any in-flight connection (QR poll, etc.)
      if (qrPollRef.current) {
        clearInterval(qrPollRef.current);
        qrPollRef.current = null;
      }

      lastWalletRef.current = wallet;

      // Mark first-time initialization
      if (!hasInit) {
        setHasInit("true");
      }

      // Get the chain wallet for this specific wallet provider
      let walletRepo;
      try {
        walletRepo = getWalletRepo(CHAIN_NAME);
      } catch {
        setState({
          view: "error",
          wallet,
          errorType: "unknown",
        });
        return;
      }

      const targetChainWallet = walletRepo.getWallet(wallet.id);

      if (!targetChainWallet) {
        setState({ view: "not_installed", wallet });
        return;
      }

      setState({ view: "connecting", wallet });

      try {
        if (wallet.platform === "mobile") {
          // For mobile wallets, start connect and poll for QR URI
          const connectPromise = connectWithTimeout(
            () => targetChainWallet.connect(true),
            30_000 // longer timeout for mobile/QR flow
          );

          // Poll for QR URL while connecting
          qrPollRef.current = setInterval(() => {
            const qrData = targetChainWallet.qrUrl;
            if (qrData?.data) {
              setState((prev) => {
                if (prev.view === "connecting" || prev.view === "qr") {
                  return { view: "qr", wallet, qrUri: qrData.data! };
                }
                return prev;
              });
            }
          }, 200);

          await connectPromise;

          if (qrPollRef.current) {
            clearInterval(qrPollRef.current);
            qrPollRef.current = null;
          }
        } else {
          // Extension or snap — straightforward connect
          await connectWithTimeout(() => targetChainWallet.connect(true));
        }

        // Verify we got an address
        if (!targetChainWallet.address) {
          setState({ view: "not_installed", wallet });
          return;
        }

        // Success — state will auto-reset via the useEffect above
      } catch (err) {
        if (qrPollRef.current) {
          clearInterval(qrPollRef.current);
          qrPollRef.current = null;
        }

        const errorType = classifyWalletError(err);

        if (errorType === "not_installed") {
          setState({ view: "not_installed", wallet });
        } else {
          setState({ view: "error", wallet, errorType });
        }
      }
    },
    [getWalletRepo, hasInit, setHasInit]
  );

  // ------------------------------------------
  // Disconnect
  // ------------------------------------------
  const disconnect = useCallback(async () => {
    try {
      await mainWallet?.disconnect(false, {
        walletconnect: { removeAllPairings: true },
      });
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
    setState({ view: "idle" });
    lastWalletRef.current = null;
  }, [mainWallet]);

  // ------------------------------------------
  // Retry (re-connect with last wallet)
  // ------------------------------------------
  const retry = useCallback(async () => {
    if (lastWalletRef.current) {
      await connect(lastWalletRef.current);
    }
  }, [connect]);

  // ------------------------------------------
  // Reset (back to idle)
  // ------------------------------------------
  const reset = useCallback(() => {
    if (qrPollRef.current) {
      clearInterval(qrPollRef.current);
      qrPollRef.current = null;
    }
    setState({ view: "idle" });
  }, []);

  return {
    state,
    connect,
    disconnect,
    retry,
    reset,
    address,
    isConnected,
  };
}
