import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { WifiOff, RefreshCw } from "lucide-react";

/**
 * Native-shell glue for the Capacitor Android app. Renders nothing on the
 * web — every native call is gated behind Capacitor.isNativePlatform().
 *
 * - Android back button: navigate back in-app; minimize the app at the root.
 * - Splash screen: hidden once React has mounted (launchAutoHide is false).
 * - Status bar: light background with dark icons to match the app theme.
 * - Offline overlay: friendly full-screen message while the device has no
 *   network, so users don't stare at silently failing requests.
 */
export function NativeBootstrap() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    // The Android WebView briefly reports onLine=false while the app shell
    // boots, sometimes without a follow-up "online" event — so sync from the
    // current value here instead of trusting the value at first render.
    setOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let removeBack: (() => void) | undefined;

    (async () => {
      const [{ App }, { SplashScreen }, { StatusBar, Style }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/splash-screen"),
        import("@capacitor/status-bar"),
      ]);

      const sub = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else App.minimizeApp();
      });
      removeBack = () => sub.remove();

      try {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: "#ffffff" });
      } catch {
        // Not fatal — some devices/webviews reject style changes.
      }

      await SplashScreen.hide();
    })();

    return () => removeBack?.();
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center px-6">
      <div className="max-w-sm text-center space-y-4">
        <div className="mx-auto size-14 rounded-2xl bg-muted text-muted-foreground grid place-items-center">
          <WifiOff className="size-7" />
        </div>
        <h2 className="text-lg font-semibold">You're offline</h2>
        <p className="text-sm text-muted-foreground">
          Prima Donna Social needs an internet connection. Check your network
          and try again.
        </p>
        <button
          onClick={() => {
            if (navigator.onLine) setOffline(false);
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          <RefreshCw className="size-4" /> Try again
        </button>
      </div>
    </div>
  );
}
