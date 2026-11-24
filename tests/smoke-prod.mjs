/**
 * Production smoke test against the live HTTPS domain.
 *
 * Reproduces exactly what broke: rendering a profile, which runs the aura
 * aggregate. A local SQLite run could not catch the Postgres identifier bug,
 * so the only honest verification is against the deployed instance.
 *
 *   node tests/smoke-prod.mjs
 *
 * Creates two throwaway accounts on purpose and prints their handles so the
 * caller can purge them afterwards.
 */
import { chromium } from "@playwright/test";

const BASE = process.env.PROD_BASE_URL ?? "https://umbral.179-197-87-25.sslip.io";
const stamp = Date.now().toString(36);
const A = { handle: `prodqa${stamp}a`, email: `prodqa${stamp}a@example.com`, password: "prod-qa-12345" };
const B = { handle: `prodqa${stamp}b`, email: `prodqa${stamp}b@example.com`, password: "prod-qa-12345" };

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function signup(browser, user) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/signup`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="displayName"]', `Prod QA ${user.handle}`);
  await page.fill('input[name="handle"]', user.handle);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/u/${user.handle}`, { timeout: 60000 });
  return { ctx, page };
}

const browser = await chromium.launch({ channel: "chrome", headless: true });

try {
  // 1. The exact failing case: signup lands on a profile, which runs the aura query.
  const a = await signup(browser, A);
  const profileHtml = await a.page.content();

  check("el perfil carga sin excepción de servidor", !/Application error/i.test(profileHtml));
  check("el puntaje inicial es 3.5", (await a.page.locator(".score-display").first().textContent())?.includes("3.5"));
  check("la tarjeta de aura se renderiza (consulta Agregada)", profileHtml.includes("aura de contenido"));
  check("sin publicaciones, el aura está vacía", profileHtml.includes("sin publicaciones"));

  // 2. Publish, then have a second account rate it.
  const caption = `Smoke producción ${stamp}`;
  await a.page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await a.page.fill('textarea[name="caption"]', caption);
  await a.page.click('button:has-text("Publicar")');
  await a.page.waitForSelector(`article:has-text("${caption}")`, { timeout: 60000 });
  check("publicar funciona en producción", true);

  const b = await signup(browser, B);
  await b.page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  const card = b.page.locator("article", { hasText: caption });
  await card.waitFor({ timeout: 60000 });
  await card.getByRole("button", { name: "4 estrellas" }).click();
  await card.getByText("4.0 · 1").waitFor({ timeout: 60000 });
  check("calificar una publicación funciona", true);

  // 3. Aura now has a value, and the profile still renders (the fixed query).
  await a.page.goto(`${BASE}/u/${A.handle}`, { waitUntil: "domcontentloaded" });
  const afterHtml = await a.page.content();
  check("el perfil sigue cargando tras recibir aura", !/Application error/i.test(afterHtml));
  check("el aura se movió a 4.0", afterHtml.includes("4.0") && afterHtml.includes("1 votos"));

  // 5. Profile editing: name, bio and avatar hue are owned by the user.
  await a.page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
  await a.page.fill('input[name="displayName"]', "Prod QA Editado");
  await a.page.fill('textarea[name="bio"]', "Bio verificada en producción");
  await a.page.click('button:has-text("Guardar cambios")');
  // isVisible() does not wait; the server action settles after the click.
  let saved = true;
  try {
    await a.page.getByText("Perfil actualizado").waitFor({ timeout: 20000 });
  } catch {
    saved = false;
  }
  check("guardar el perfil confirma el cambio", saved);

  await a.page.goto(`${BASE}/u/${A.handle}`, { waitUntil: "domcontentloaded" });
  const editedHtml = await a.page.content();
  check("el nombre nuevo se ve en el perfil", editedHtml.includes("Prod QA Editado"));
  check("la bio nueva se ve en el perfil", editedHtml.includes("Bio verificada en producción"));

  // 6. QR endpoint on the real domain.
  const qr = await a.page.request.get(
    `${BASE}/api/qr?data=${encodeURIComponent(`${BASE}/rate/abc123`)}`,
  );
  check("el endpoint QR sirve PNG", qr.ok() && (qr.headers()["content-type"] ?? "").includes("image/png"));

  // 7. Public API contract.
  const api = await a.page.request.get(`${BASE}/api/v1/score/${A.handle}`);
  const body = api.ok() ? await api.json() : null;
  check("la API pública responde 200", api.ok());
  check("la API declara el algoritmo 1.1.0", body?.algorithm?.version === "1.1.0");

  await b.ctx.close();
  await a.ctx.close();
} catch (err) {
  check("ejecución completa sin excepción", false, err.message.split("\n")[0]);
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log("\n" + "=".repeat(60));
console.log(`RESULTADO: ${results.length - failed.length}/${results.length} en verde`);
console.log(`Usuarios de prueba creados: ${A.handle}, ${B.handle}`);
if (failed.length) {
  console.log("FALLOS:");
  for (const f of failed) console.log(`  - ${f.name} ${f.detail}`);
  process.exitCode = 1;
}
