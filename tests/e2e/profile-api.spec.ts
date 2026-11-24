import { test, expect } from "@playwright/test";
import { newUser, publishPost } from "./helpers";

test.describe("Perfil: puntaje, meta y deltas", () => {
  test("el perfil nuevo muestra 3.5, su meta y lo que se desbloquea", async ({ browser }) => {
    const u = await newUser(browser, "perfil");

    await expect(u.page.locator(".score-display").first()).toContainText("3.5");
    await expect(u.page.getByText(/Hacia .*Plata/)).toBeVisible();
    await expect(u.page.getByText(/faltan 0\.30/)).toBeVisible();
    await expect(u.page.getByText("Se desbloquea en")).toBeVisible();
    await expect(u.page.getByText(/códigos de interacción al día/)).toBeVisible();

    await u.close();
  });

  test("sin publicaciones el aura está vacía, no en cero", async ({ browser }) => {
    const u = await newUser(browser, "aura0");
    await expect(u.page.getByText("aura de contenido")).toBeVisible();
    await expect(u.page.getByText("sin publicaciones")).toBeVisible();

    await u.close();
  });

  test("el aura sí se mueve cuando califican una publicación", async ({ browser }) => {
    const author = await newUser(browser, "aura1");
    const caption = `Aura medible ${Date.now()}`;
    await publishPost(author.page, caption);

    const rater = await newUser(browser, "aurero");
    await rater.page.goto("/");
    await rater.page
      .locator("article", { hasText: caption })
      .getByRole("button", { name: "4 estrellas" })
      .click();
    await expect(rater.page.locator("article", { hasText: caption })).toContainText("4.0 · 1");

    await author.page.goto(`/u/${author.handle}`);
    await expect(author.page.getByText("aura de contenido")).toBeVisible();
    await expect(author.page.getByText("1 votos")).toBeVisible();

    await author.close();
    await rater.close();
  });
});

test.describe("API pública", () => {
  test("health responde y confirma la base", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe("up");
  });

  test("el contrato de score es estable y declara el algoritmo 1.1.0", async ({
    browser,
    request,
  }) => {
    const u = await newUser(browser, "api");

    const res = await request.get(`/api/v1/score/${u.handle}`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.handle).toBe(u.handle);
    expect(typeof body.displayName).toBe("string");
    expect(body.score).toBeCloseTo(3.5, 2);
    expect(body.tier).toBe("BRONZE");
    expect(body.tierLabel).toBe("Bronce");
    expect(body.algorithm.version).toBe("1.1.0");
    expect(body.algorithm.influence).toBe("live");
    expect(body.algorithm.halfLifeDays).toBeGreaterThan(0);
    expect(body.computedAt).toBeTruthy();

    await u.close();
  });

  test("un handle inexistente devuelve 404 con JSON", async ({ request }) => {
    const res = await request.get(`/api/v1/score/nadie-${Date.now()}`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test("no expone correo ni hash de contraseña", async ({ browser, request }) => {
    const u = await newUser(browser, "priv");
    const res = await request.get(`/api/v1/score/${u.handle}`);
    const raw = await res.text();

    expect(raw).not.toContain(u.email);
    expect(raw.toLowerCase()).not.toContain("passwordhash");
    expect(raw).not.toContain("$2a$");
    expect(raw).not.toContain("$2b$");

    await u.close();
  });
});

test.describe("Edición de perfil", () => {
  test("el usuario puede editar su nombre, su bio y su color", async ({ browser }) => {
    const u = await newUser(browser, "edita");
    await u.page.goto("/settings");

    await u.page.fill('input[name="displayName"]', "Nombre Nuevo");
    await u.page.fill('textarea[name="bio"]', "Biografía nueva");
    // Range inputs reject fill(); set the value and let React see the input.
    await u.page.locator('input[name="avatarHue"]').evaluate((el) => {
      const input = el as HTMLInputElement;
      input.value = "120";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await u.page.click('button:has-text("Guardar cambios")');
    await expect(u.page.getByText("Perfil actualizado")).toBeVisible();

    // It persists: a fresh load of the settings carries the new values back.
    await u.page.reload();
    await expect(u.page.locator('input[name="displayName"]')).toHaveValue("Nombre Nuevo");
    await expect(u.page.locator('input[name="avatarHue"]')).toHaveValue("120");

    // And it is what strangers see on the public profile.
    await u.page.goto(`/u/${u.handle}`);
    await expect(u.page.getByRole("heading", { level: 1 })).toHaveText("Nombre Nuevo");
    await expect(u.page.getByText("Biografía nueva")).toBeVisible();

    await u.close();
  });

  test("un nombre demasiado corto se rechaza con su mensaje", async ({ browser }) => {
    const u = await newUser(browser, "corto");
    await u.page.goto("/settings");

    await u.page.fill('input[name="displayName"]', "A");
    await u.page.click('button:has-text("Guardar cambios")');

    await expect(u.page.getByText(/al menos 2 caracteres/)).toBeVisible();
    // The stored name is untouched.
    await u.page.goto(`/u/${u.handle}`);
    await expect(u.page.getByRole("heading", { level: 1 })).toContainText("QA");

    await u.close();
  });
});
