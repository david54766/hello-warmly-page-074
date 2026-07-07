import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.primadonnasocial.community",
  appName: "Prima Donna",
  webDir: "dist/client",
  backgroundColor: "#ffffff",
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      // Hidden explicitly from NativeBootstrap once React has mounted, so
      // the user never sees an unstyled flash while the bundle parses.
      launchAutoHide: false,
      backgroundColor: "#ffffff",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#ffffff",
      overlaysWebView: false,
    },
  },
};

export default config;
