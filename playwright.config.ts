import { defineConfig } from "@playwright/test";
import path from "node:path";
import os from "node:os";

/**
 * Functional QA against real Chrome, on the PRODUCTION build.
 *
 * Two deliberate choices, both learned the hard way:
 *
 * 1. Production server, not `next dev`. Next's dev watcher recompiles on every
 *    file write. Playwright writes reports and artifacts into the project, the
 *    watcher picks them up, and the module graph thrashes hundreds of times per
 *    minute until RSC payloads come back empty ("Unexpected end of JSON input").
 *    A production build has no watcher, so the run is deterministic.
 *
 * 2. Artifacts go to the OS temp dir, outside the watched project. Belt and
 *    braces: even a future dev-mode run cannot pollute the tree.
 *
 * The production session cookie is `secure: true`, which browsers drop over
 * plain HTTP. UMBRAL_ALLOW_INSECURE_COOKIES=1 relaxes that ONLY for this local
 * HTTP run; production over TLS is unchanged.
 */
const ARTIFACTS = path.join(os.tmpdir(), "umbral-qa");

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: path.join(ARTIFACTS, "test-results"),
  reporter: [
    ["list"],
    ["json", { outputFile: path.join(ARTIFACTS, "qa-results.json") }],
    ["html", { outputFolder: path.join(ARTIFACTS, "qa-report"), open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:3100",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    viewport: { width: 420, height: 900 },
    locale: "es-MX",
    timezoneId: "America/Tijuana",
  },
  webServer: {
    command: "npm run build && npm run start -- -p 3100",
    url: "http://127.0.0.1:3100/api/health",
    reuseExistingServer: false,
    timeout: 420_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      UMBRAL_ALLOW_INSECURE_COOKIES: "1",
    },
  },
  projects: [
    {
      name: "chrome",
      use: { channel: "chrome" },
    },
  ],
});
