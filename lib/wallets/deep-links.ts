function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

interface DeepLinkBuilder {
  ios: (url: string) => string;
  android: (url: string) => string;
}

const DEEP_LINK_MAP: Record<string, DeepLinkBuilder> = {
  "keplr-mobile": {
    ios: (url) => `keplrwallet://web-browser?url=${encodeURIComponent(url)}`,
    android: (url) =>
      `intent://web-browser?url=${encodeURIComponent(url)}#Intent;package=com.chainapsis.keplr;scheme=keplrwallet;end;`,
  },
  "leap-cosmos-mobile": {
    ios: (url) => {
      const base =
        process.env.NEXT_PUBLIC_LEAP_DEEPLINK_URL ||
        "https://leapcosmoswallet.page.link/zgLSwG7GhBjXSjWs9";
      return `${base}?url=${encodeURIComponent(url)}`;
    },
    android: (url) => {
      const base =
        process.env.NEXT_PUBLIC_LEAP_DEEPLINK_URL ||
        "https://leapcosmoswallet.page.link/zgLSwG7GhBjXSjWs9";
      return `${base}?url=${encodeURIComponent(url)}`;
    },
  },
  "cosmostation-mobile": {
    ios: (url) => `cosmostation://browser?url=${encodeURIComponent(url)}`,
    android: (url) => `cosmostation://browser?url=${encodeURIComponent(url)}`,
  },
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
  if (!builder) return null;
  return isAndroid() ? builder.android(targetUrl) : builder.ios(targetUrl);
}
