const FALLBACK_SITE_URL = "https://primadonnasocial.com";

/**
 * Canonical public web URL for links that leave the app (auth emails,
 * invite links). Inside the Capacitor Android shell window.location.origin
 * is https://localhost, which would produce dead links — so anything
 * user-shareable must resolve through this helper instead.
 */
export function getPublicSiteUrl(): string {
  const configured = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  if (configured) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    const isLocalShell =
      origin.startsWith("capacitor:") ||
      /^https?:\/\/localhost(:\d+)?$/.test(origin);
    if (!isLocalShell) return origin;
  }
  return FALLBACK_SITE_URL;
}
