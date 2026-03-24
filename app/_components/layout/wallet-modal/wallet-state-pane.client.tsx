"use client";

import { useEffect, useState } from "react";
import { ConnectionState } from "@/lib/hooks/useWalletConnection";
import { getErrorMessage } from "@/lib/wallets/errors";
import NextImage from "@/components/next-image";
import Button from "@/components/button";
import { AlertCircle, Chrome, Loader2, Shield, Wallet } from "lucide-react";
import Link from "next/link";
import WalletQRCode from "./wallet-qr-code.client";

interface WalletStatePaneProps {
  state: ConnectionState;
  onRetry: () => void;
  onReset: () => void;
}

export default function WalletStatePane({
  state,
  onRetry,
  onReset,
}: WalletStatePaneProps) {
  // "Taking too long?" hint after 5s in connecting state
  const [showSlowHint, setShowSlowHint] = useState(false);

  useEffect(() => {
    if (state.view !== "connecting") {
      setShowSlowHint(false);
      return;
    }

    const timer = setTimeout(() => setShowSlowHint(true), 5_000);
    return () => clearTimeout(timer);
  }, [state.view]);

  // ── Idle ──
  if (state.view === "idle") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="rounded-xl bg-primary/[0.06] p-4">
          <Wallet className="h-8 w-8 text-primary/40" />
        </div>
        <p className="text-sm text-primary-accent">
          Select a wallet to get started
        </p>
      </div>
    );
  }

  // ── Connecting (extension/snap) ──
  if (state.view === "connecting") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="relative">
          <div className="rounded-2xl bg-primary/[0.06] p-3">
            <NextImage
              src={state.wallet.logo}
              alt={state.wallet.name}
              width={48}
              height={48}
              className="rounded-lg"
            />
          </div>
          <Loader2 className="absolute -bottom-1 -right-1 h-5 w-5 animate-spin text-theme" />
        </div>
        <div>
          <p className="text-sm font-medium">Approve in {state.wallet.name}</p>
          <p className="mt-1 text-xs text-primary-accent">
            Open the {state.wallet.name}{" "}
            {state.wallet.platform === "snap" ? "snap" : "extension"} to
            continue
          </p>
        </div>
        {showSlowHint && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-primary-accent/60 underline transition-colors hover:text-primary-accent"
          >
            Taking too long? Go back
          </button>
        )}
      </div>
    );
  }

  // ── QR code (mobile wallets) ──
  if (state.view === "qr") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <WalletQRCode uri={state.qrUri} logoSrc={state.wallet.logo} />
        <div>
          <p className="text-sm font-medium">Scan with {state.wallet.name}</p>
          <p className="mt-1 text-xs text-primary-accent">
            Open {state.wallet.name} and scan the QR code to connect
          </p>
        </div>
      </div>
    );
  }

  // ── Not installed ──
  if (state.view === "not_installed") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="rounded-2xl bg-primary/[0.06] p-3">
          <NextImage
            src={state.wallet.logo}
            alt={state.wallet.name}
            width={48}
            height={48}
            className="rounded-lg"
          />
        </div>
        <div>
          <p className="text-sm font-medium">{state.wallet.name} not found</p>
          <p className="mt-1 text-xs text-primary-accent">
            Install the {state.wallet.name} extension to continue
          </p>
        </div>
        {state.wallet.downloadLinks && state.wallet.downloadLinks.length > 0 ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              {state.wallet.downloadLinks.map((link) => (
                <Button
                  key={link.browser}
                  asChild
                  size="small"
                  className="gap-1.5 text-xs"
                >
                  <Link href={link.url} target="_blank">
                    {link.browser === "chrome" && (
                      <Chrome className="h-3.5 w-3.5" />
                    )}
                    {link.browser === "brave" && (
                      <Shield className="h-3.5 w-3.5" />
                    )}
                    {link.browser === "chrome" ? "Chrome" : "Brave"}
                  </Link>
                </Button>
              ))}
            </div>
            <Button
              variant="ui"
              size="small"
              onClick={onReset}
              className="text-xs"
            >
              Go back
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            {state.wallet.downloadUrl && (
              <Button asChild size="small" className="text-xs">
                <Link href={state.wallet.downloadUrl} target="_blank">
                  Install {state.wallet.name}
                </Link>
              </Button>
            )}
            <Button
              variant="ui"
              size="small"
              onClick={onReset}
              className="text-xs"
            >
              Go back
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Error ──
  if (state.view === "error") {
    const { title, description } = getErrorMessage(
      state.errorType,
      state.wallet.name
    );

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="rounded-xl bg-red/10 p-3">
          <AlertCircle className="h-7 w-7 text-red" />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-xs text-primary-accent">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button size="small" onClick={onRetry} className="text-xs">
            Try Again
          </Button>
          <Button
            variant="ui"
            size="small"
            onClick={onReset}
            className="text-xs"
          >
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
