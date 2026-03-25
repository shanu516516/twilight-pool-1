"use client";

import { useMemo } from "react";
import cn from "@/lib/cn";
import { categorizeWallets } from "@/lib/wallets/detect";
import { WalletEntry } from "@/lib/wallets/registry";
import { getWalletDeepLink } from "@/lib/wallets/deep-links";
import { isMobileBrowser } from "@/lib/utils/is-mobile";
import { ConnectionState } from "@/lib/hooks/useWalletConnection";
import NextImage from "@/components/next-image";
import Button from "@/components/button";
import {
  ChevronRight,
  Loader2,
  Smartphone,
  Link as LinkIcon,
} from "lucide-react";

interface WalletListProps {
  state: ConnectionState;
  onSelect: (wallet: WalletEntry) => void;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="px-1 pb-1 pt-3 text-[10px] font-medium uppercase tracking-wider text-primary-accent/50 first:pt-0">
      {label}
    </p>
  );
}

function WalletRow({
  wallet,
  isActive,
  isConnecting,
  onClick,
}: {
  wallet: WalletEntry;
  isActive: boolean;
  isConnecting: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
        isActive
          ? "bg-primary/[0.06] ring-1 ring-primary/20"
          : "hover:bg-primary/[0.04]",
        isConnecting && "pointer-events-none opacity-70"
      )}
      onClick={onClick}
      disabled={isConnecting}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06]">
        <NextImage
          src={wallet.logo}
          alt={wallet.name}
          width={24}
          height={24}
          className="rounded-sm"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{wallet.name}</span>
        {wallet.platform === "snap" && (
          <span className="text-[10px] text-primary-accent/50">
            Cosmos Snap
          </span>
        )}
      </div>

      {isActive && isConnecting ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-theme" />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-primary-accent/30 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary-accent/60" />
      )}
    </button>
  );
}

function MobileWalletCard({
  wallet,
  isActive,
  isConnecting,
  onSelect,
}: {
  wallet: WalletEntry;
  isActive: boolean;
  isConnecting: boolean;
  onSelect: () => void;
}) {
  const deepLinkUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    return getWalletDeepLink(wallet.id, window.location.origin + "/add-chain");
  }, [wallet.id]);

  const shortName = wallet.name.replace(" Mobile", "");

  return (
    <div className="border-outline/50 rounded-lg border p-3">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06]">
          <NextImage
            src={wallet.logo}
            alt={wallet.name}
            width={24}
            height={24}
            className="rounded-sm"
          />
        </div>
        <span className="text-sm font-medium">{wallet.name}</span>
      </div>

      {deepLinkUrl && (
        <Button asChild size="small" className="mb-2 w-full gap-1.5 text-xs">
          <a href={deepLinkUrl}>
            <Smartphone className="h-3.5 w-3.5" />
            Open in {shortName}
          </a>
        </Button>
      )}

      {wallet.supportsWalletConnect && (
        <Button
          variant="ui"
          size="small"
          className="w-full gap-1.5 text-xs"
          onClick={onSelect}
          disabled={isConnecting}
        >
          {isActive && isConnecting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LinkIcon className="h-3.5 w-3.5" />
          )}
          Connect via WalletConnect
        </Button>
      )}
    </div>
  );
}

export default function WalletList({ state, onSelect }: WalletListProps) {
  const categories = useMemo(() => categorizeWallets(), []);
  const isMobile = useMemo(() => isMobileBrowser(), []);

  const activeWalletId = state.view !== "idle" ? state.wallet.id : null;
  const isConnecting = state.view === "connecting" || state.view === "qr";

  const hasInstalled = categories.installed.length > 0;
  const hasMobile = categories.mobile.length > 0;
  const hasOther = categories.other.length > 0;

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto p-3">
      {hasInstalled && (
        <>
          {(hasMobile || hasOther) && <SectionHeader label="Installed" />}
          {categories.installed.map((w) => (
            <WalletRow
              key={w.id}
              wallet={w}
              isActive={activeWalletId === w.id}
              isConnecting={isConnecting && activeWalletId === w.id}
              onClick={() => onSelect(w)}
            />
          ))}
        </>
      )}

      {hasMobile && (
        <>
          {!isMobile && (hasInstalled || hasOther) && (
            <SectionHeader label="Mobile" />
          )}
          <div className={cn(isMobile && "flex flex-col gap-2")}>
            {categories.mobile.map((w) =>
              isMobile ? (
                <MobileWalletCard
                  key={w.id}
                  wallet={w}
                  isActive={activeWalletId === w.id}
                  isConnecting={isConnecting && activeWalletId === w.id}
                  onSelect={() => onSelect(w)}
                />
              ) : (
                <WalletRow
                  key={w.id}
                  wallet={w}
                  isActive={activeWalletId === w.id}
                  isConnecting={isConnecting && activeWalletId === w.id}
                  onClick={() => onSelect(w)}
                />
              )
            )}
          </div>
        </>
      )}

      {hasOther && (
        <>
          {(hasInstalled || hasMobile) && <SectionHeader label="Other" />}
          {categories.other.map((w) => (
            <WalletRow
              key={w.id}
              wallet={w}
              isActive={activeWalletId === w.id}
              isConnecting={isConnecting && activeWalletId === w.id}
              onClick={() => onSelect(w)}
            />
          ))}
        </>
      )}

      {!hasInstalled && !hasMobile && !hasOther && (
        <p className="py-6 text-center text-sm text-primary-accent">
          No wallets available
        </p>
      )}
    </div>
  );
}
