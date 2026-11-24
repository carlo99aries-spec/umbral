import { test, expect } from "@playwright/test";
import { newUser, signupUI, loginUI, uniqueHandle, PASSWORD } from "./helpers";

test.describe("Autenticación y control de acceso", () => {
  test("el alta crea la cuenta y aterriza en su perfil con 3.5 / Bronce", async ({ browser }) => {
    const u = await newUser(browser, "alta");

    await expect(u.page).toHaveURL(new RegExp(`/u/${u.handle}`));
    await expect(u.page.getByRole("heading", { level: 1 })).toContainText("QA");
    await expect(u.page.locator(".score-display").first()).toContainText("3.5");
    await expect(u.page.getByText("Bronce", { exact: true }).first()).toBeVisible();
    await expect(u.page.getByText(`@${u.handle}`).first()).toBeVisible();

    await u.close();
  });

  test("un usuario duplicado se rechaza con mensaje claro", async ({ browser }) => {
    const u = await newUser(browser, "dup");
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto("/signup");
    await page.fill('input[name="displayName"]', "Otra Persona");
    await page.fill('input[name="handle"]', u.handle);
    await page.fill('input[name="email"]', `otro-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.getByText("Ese nombre de usuario ya está tomado")).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);

    await ctx.close();
    await u.close();
  });

  test("un correo duplicado se rechaza con su propio mensaje", async ({ browser }) => {
    const u = await newUser(browser, "mail");
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto("/signup");
    await page.fill('input[name="displayName"]', "Otra Persona");
    await page.fill('input[name="handle"]', uniqueHandle("otro"));
    await page.fill('input[name="email"]', u.email);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.getByText("Ya existe una cuenta con ese correo")).toBeVisible();

    await ctx.close();
    await u.close();
  });

  test("una contraseña corta se rechaza con el mínimo explícito", async ({ page }) => {
    await page.goto("/signup");
    await page.fill('input[name="displayName"]', "Corta Clave");
    await page.fill('input[name="handle"]', uniqueHandle("corta"));
    await page.fill('input[name="email"]', `corta-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', "1234");
    await page.click('button[type="submit"]');

    await expect(page.getByText("La contraseña debe tener al menos 8 caracteres")).toBeVisible();
  });

  test("credenciales incorrectas dan un error que no revela si la cuenta existe", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill('input[name="identifier"]', "no-existe-jamas");
    await page.fill('input[name="password"]', "loquesea123");
    await page.click('button[type="submit"]');

    await expect(page.getByText("Usuario o contraseña incorrectos")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("el login con credenciales válidas entra al perfil", async ({ browser }) => {
    const u = await newUser(browser, "login");
    await u.context.clearCookies();

    await loginUI(u.page, u.handle);
    await expect(u.page).toHaveURL(new RegExp(`/u/${u.handle}`));

    // también por correo
    await u.context.clearCookies();
    await loginUI(u.page, u.email);
    await expect(u.page).toHaveURL(new RegExp(`/u/${u.handle}`));

    await u.close();
  });

  test("salir cierra la sesión y vuelve al estado anónimo", async ({ browser }) => {
    const u = await newUser(browser, "salir");
    await u.page.goto("/");
    await expect(u.page.locator('textarea[name="caption"]')).toBeVisible();

    await u.page.click('button:has-text("Salir")');
    await u.page.waitForURL("**/");

    await expect(u.page.getByRole("link", { name: "Crear cuenta" }).first()).toBeVisible();
    await expect(u.page.locator('textarea[name="caption"]')).toHaveCount(0);

    // y ya no puede volver a una ruta privada
    await u.page.goto("/settings");
    await expect(u.page).toHaveURL(/\/login/);

    await u.close();
  });

  for (const path of ["/settings", "/alertas", "/cerca", "/en-persona", "/perfil"]) {
    test(`la ruta privada ${path} exige sesión`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("el enlace de calificación exige sesión y conserva el destino", async ({ page }) => {
    await page.goto("/rate/abcdef1234");
    await expect(page).toHaveURL(/\/login\?next=%2Frate%2Fabcdef1234|\/login\?next=\/rate/);
  });

  test("un perfil inexistente devuelve 404", async ({ page }) => {
    const res = await page.goto(`/u/no-existe-${Date.now()}`);
    expect(res?.status()).toBe(404);
  });
});
