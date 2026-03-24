const DEEP_LINK_MAP: Record<string, (url: string) => string> = {
  "keplr-mobile": (url) =>
    `https://deeplink.keplr.app?url=${encodeURIComponent(url)}`,
  "leap-cosmos-mobile": (url) =>
    `https://deeplink.leapwallet.io?url=${encodeURIComponent(url)}`,
  "cosmostation-mobile": (url) =>
    `https://app.cosmostation.io/dapp?url=${encodeURIComponent(url)}`,
};

/**
 * Get a deep link URL that opens `targetUrl` inside the wallet's in-app browser.
 * Returns null for wallet IDs that don't support deep linking.
 */
export function getWalletDeepLink(
  walletId: string,
  targetUrl: string
): string | null {
  const builder = DEEP_LINK_MAP[walletId];
  return builder ? builder(targetUrl) : null;
}
