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
  // HALLAZGO: la app muestra user.bio pero no existe ninguna pantalla ni
  // acción para editarlo (nombre, bio o avatar). Se deja como fixme para que
  // el hueco quede registrado en la suite en lugar de perderse en un informe.
  test.fixme("el usuario puede editar su nombre y su bio", async ({ browser }) => {
    const u = await newUser(browser, "edita");
    await u.page.goto("/settings");
    await u.page.fill('input[name="displayName"]', "Nombre Nuevo");
    await u.page.fill('textarea[name="bio"]', "Biografía nueva");
    await u.page.click('button:has-text("Guardar")');
    await expect(u.page.getByText("Nombre Nuevo")).toBeVisible();
    await expect(u.page.getByText("Biografía nueva")).toBeVisible();
    await u.close();
  });
});
