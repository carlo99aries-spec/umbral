/**
 * Warm up Next's dev compiler before the first assertion.
 *
 * In dev mode the first hit on a route pays the compilation cost. Without
 * this, the first test of the run spends 40-60s compiling and fails on a
 * timeout that has nothing to do with the feature being tested.
 */
const ROUTES = ["/", "/signup", "/login", "/u/naomi", "/about"];

export default async function globalSetup() {
  const base = "http://127.0.0.1:3100";

  // The webServer may still be booting when the setup starts.
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const res = await fetch(`${base}/api/health`);
      if (res.ok) break;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  for (const route of ROUTES) {
    try {
      await fetch(`${base}${route}`, { redirect: "manual" });
    } catch {
      /* warm-up is best effort */
    }
  }
}
