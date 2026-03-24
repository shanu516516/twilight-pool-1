"use client";

import {
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/dialog";
import {
  ConnectionState,
  UseWalletConnectionReturn,
} from "@/lib/hooks/useWalletConnection";
import WalletList from "./wallet-list.client";
import WalletStatePane from "./wallet-state-pane.client";

interface WalletModalProps {
  state: ConnectionState;
  connect: UseWalletConnectionReturn["connect"];
  retry: UseWalletConnectionReturn["retry"];
  reset: UseWalletConnectionReturn["reset"];
}

export default function WalletModal({
  state,
  connect,
  retry,
  reset,
}: WalletModalProps) {
  return (
    <DialogContent className="max-w-[90vw] gap-0 overflow-hidden p-0 md:max-w-[640px]">
      <DialogTitle className="sr-only">Connect Wallet</DialogTitle>
      <DialogDescription className="sr-only">
        Choose a wallet provider to connect
      </DialogDescription>

      {/* Desktop: split pane */}
      <div className="hidden md:flex md:min-h-[380px]">
        {/* Left — wallet list */}
        <div className="border-border/50 w-[260px] shrink-0 border-r">
          <p className="border-border/50 border-b px-4 py-3 text-sm font-semibold">
            Connect Wallet
          </p>
          <WalletList state={state} onSelect={connect} />
        </div>

        {/* Right — status pane */}
        <div className="flex flex-1 flex-col">
          <WalletStatePane state={state} onRetry={retry} onReset={reset} />
        </div>
      </div>

      {/* Mobile: stacked */}
      <div className="flex flex-col md:hidden">
        <p className="border-border/50 border-b px-4 py-3 text-sm font-semibold">
          Connect Wallet
        </p>
        <WalletList state={state} onSelect={connect} />

        {/* Show state pane below list when not idle */}
        {state.view !== "idle" && (
          <div className="border-border/50 border-t">
            <WalletStatePane state={state} onRetry={retry} onReset={reset} />
          </div>
        )}
      </div>
    </DialogContent>
  );
}
