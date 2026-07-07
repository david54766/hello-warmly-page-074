// Cross-platform wrapper for the Capacitor web build: sets MOBILE_BUILD=1
// (see vite.config.ts) and runs the production build. Output: dist/client.
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["vite", "build"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, MOBILE_BUILD: "1" },
});

process.exit(result.status ?? 1);
