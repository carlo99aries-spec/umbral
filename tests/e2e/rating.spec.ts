import { test, expect } from "@playwright/test";
import { newUser, generateToken, codeFromPath } from "./helpers";

test.describe("Generación de QR", () => {
  test("el endpoint devuelve un PNG real", async ({ request }) => {
    const res = await request.get(
      "/api/qr?data=" + encodeURIComponent("https://umbral.test/rate/abc123"),
    );
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");

    const body = await res.body();
    // PNG magic number
    expect(body.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(body.length).toBeGreaterThan(500);
  });

  test("sin datos y con datos enormes responde 400", async ({ request }) => {
    expect((await request.get("/api/qr?data=")).status()).toBe(400);
    const huge = "a".repeat(600);
    expect((await request.get("/api/qr?data=" + huge)).status()).toBe(400);
  });

  test("generar un código muestra enlace, QR cargado y WhatsApp", async ({ browser }) => {
    const u = await newUser(browser, "qr");

    await u.page.goto("/settings");
    await u.page.fill('input[name="note"]', "mesa 4");
    await u.page.click('button:has-text("Generar código")');

    const codeEl = u.page.locator("code", { hasText: "/rate/" }).first();
    await expect(codeEl).toBeVisible();

    const img = u.page.locator('img[alt="Código QR para calificar"]');
    await expect(img).toBeVisible();
    await expect
      .poll(async () => img.evaluate((el) => (el as HTMLImageElement).naturalWidth), {
        timeout: 15_000,
      })
      .toBeGreaterThan(0);

    const wa = u.page.getByRole("link", { name: "Enviar por WhatsApp" });
    const href = await wa.getAttribute("href");
    expect(href).toContain("wa.me");
    expect(decodeURIComponent(href ?? "")).toContain("/rate/");

    await u.close();
  });

  test("el nivel Bronce corta en 3 códigos al día", async ({ browser }) => {
    const u = await newUser(browser, "limite");
    await u.page.goto("/settings");

    for (let i = 0; i < 3; i++) {
      await u.page.fill('input[name="note"]', `código ${i}`);
      await u.page.click('button:has-text("Generar código")');
      await expect(u.page.locator("code", { hasText: "/rate/" })).toHaveCount(i + 1, {
        timeout: 20_000,
      });
    }

    await u.page.fill('input[name="note"]', "cuarto");
    await u.page.click('button:has-text("Generar código")');
    await expect(u.page.getByText(/Tu nivel permite 3 código\(s\)/)).toBeVisible();

    await u.close();
  });
});

test.describe("Calificar en persona", () => {
  test("la pestaña NFC explica por qué no puede funcionar", async ({ browser }) => {
    const u = await newUser(browser, "nfc");
    await u.page.goto("/en-persona");

    await u.page.click('button:has-text("Acercar (NFC)")');
    await expect(
      u.page.getByText(/NFC|Acercar dos teléfonos no funciona en un navegador/).first(),
    ).toBeVisible();
    await expect(u.page.getByText(/iOS|Android/).first()).toBeVisible();

    await u.close();
  });

  test("un código inexistente se rechaza antes de pedir estrellas", async ({ browser }) => {
    const u = await newUser(browser, "malo");
    await u.page.goto("/en-persona");

    await u.page.fill('input[placeholder*="abc123"]', "zzzz999999");
    await u.page.click('button:has-text("Conectar")');
    await expect(u.page.getByText("Ese código no existe")).toBeVisible();

    await u.close();
  });

  test("tu propio código no sirve para calificarte", async ({ browser }) => {
    const u = await newUser(browser, "yomismo");
    const path = await generateToken(u.page, "propio");

    await u.page.goto("/en-persona");
    await u.page.fill('input[placeholder*="abc123"]', codeFromPath(path));
    await u.page.click('button:has-text("Conectar")');
    await expect(u.page.getByText("Ese código es tuyo")).toBeVisible();

    await u.close();
  });

  test("flujo completo: conectar, calificar y ver el puntaje nuevo con su delta", async ({
    browser,
  }) => {
    const author = await newUser(browser, "receptor");
    const path = await generateToken(author.page, "café de la esquina");
    const code = codeFromPath(path);

    const rater = await newUser(browser, "emisor");
    await rater.page.goto("/en-persona");
    await rater.page.fill('input[placeholder*="abc123"]', code);
    await rater.page.click('button:has-text("Conectar")');

    // Paso 2: la identidad correcta y su puntaje actual
    await expect(rater.page.getByText("Conexión establecida")).toBeVisible();
    await expect(rater.page.getByText(author.handle, { exact: false })).toBeVisible();
    await expect(rater.page.getByText(/Puntaje actual 3\.5/)).toBeVisible();

    await rater.page.getByRole("button", { name: "5 estrellas" }).click();
    await expect(rater.page.getByText("Excelente")).toBeVisible();

    await rater.page.click('button:has-text("Enviar calificación")');

    // Paso 3: confirmación con número nuevo y delta
    await expect(rater.page.getByText("Calificación enviada")).toBeVisible();
    await expect(rater.page.getByText(/en su puntaje/)).toBeVisible();
    await expect(rater.page.locator(".score-display")).toContainText(/\d\.\d/);

    // Y el receptor lo ve reflejado en su perfil
    await author.page.goto(`/u/${author.handle}`);
    await expect(
      author.page.locator('span[title="Cuánto movió tu puntaje esta calificación"]'),
    ).toHaveCount(1);

    await author.close();
    await rater.close();
  });

  test("un código usado no se puede reutilizar", async ({ browser }) => {
    const author = await newUser(browser, "unico");
    const path = await generateToken(author.page, "una sola vez");
    const code = codeFromPath(path);

    const rater = await newUser(browser, "usuario1");
    await rater.page.goto("/en-persona");
    await rater.page.fill('input[placeholder*="abc123"]', code);
    await rater.page.click('button:has-text("Conectar")');
    await rater.page.getByRole("button", { name: "4 estrellas" }).click();
    await rater.page.click('button:has-text("Enviar calificación")');
    await expect(rater.page.getByText("Calificación enviada")).toBeVisible();

    // Otra persona intenta el mismo código
    const other = await newUser(browser, "usuario2");
    await other.page.goto("/en-persona");
    await other.page.fill('input[placeholder*="abc123"]', code);
    await other.page.click('button:has-text("Conectar")');
    await expect(other.page.getByText("Ese código ya se usó")).toBeVisible();

    await author.close();
    await rater.close();
    await other.close();
  });

  test("la regla de una calificación por persona cada 30 días se respeta", async ({ browser }) => {
    const author = await newUser(browser, "mensual");
    const first = codeFromPath(await generateToken(author.page, "primera"));
    const second = codeFromPath(await generateToken(author.page, "segunda"));

    const rater = await newUser(browser, "insistente");

    await rater.page.goto("/en-persona");
    await rater.page.fill('input[placeholder*="abc123"]', first);
    await rater.page.click('button:has-text("Conectar")');
    await rater.page.getByRole("button", { name: "4 estrellas" }).click();
    await rater.page.click('button:has-text("Enviar calificación")');
    await expect(rater.page.getByText("Calificación enviada")).toBeVisible();

    await rater.page.click('button:has-text("Calificar a otra persona")');
    await rater.page.fill('input[placeholder*="abc123"]', second);
    await rater.page.click('button:has-text("Conectar")');
    await expect(rater.page.getByText("Ya calificaste a esta persona este mes")).toBeVisible();

    await author.close();
    await rater.close();
  });
});
