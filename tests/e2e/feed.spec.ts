import { test, expect } from "@playwright/test";
import { newUser, publishPost } from "./helpers";

test.describe("Feed: publicar y calificar publicaciones", () => {
  test("en anónimo no hay compositor y sí una invitación a entrar", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('textarea[name="caption"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Crear cuenta" }).first()).toBeVisible();
    await expect(page.getByText(/Cada interacción termina en una calificación/)).toBeVisible();
  });

  test("publicar muestra la tarjeta con autor, puntaje y estrellas", async ({ browser }) => {
    const u = await newUser(browser, "post");
    const caption = `Primera publicación QA ${Date.now()}`;

    await publishPost(u.page, caption);

    const card = u.page.locator("article", { hasText: caption });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText(u.handle);
    await expect(card).toContainText("3.5");
    await expect(card.getByText("sin votos")).toBeVisible();

    await u.close();
  });

  test("publicar vacío no crea nada", async ({ browser }) => {
    const u = await newUser(browser, "vacio");
    await u.page.goto("/");

    const before = await u.page.locator("article").count();
    await u.page.click('button:has-text("Publicar")');
    await u.page.waitForTimeout(1500);
    const after = await u.page.locator("article").count();

    expect(after).toBe(before);
    await u.close();
  });

  test("el texto se escapa: una etiqueta HTML no se ejecuta ni se interpreta", async ({
    browser,
  }) => {
    const u = await newUser(browser, "xss");
    // Unique per run: the feed keeps earlier posts and this caption must select
    // exactly one card, not every copy from previous runs.
    const marker = `no soy negrita ${Date.now()}`;
    const payload = `<b>${marker}</b>`;
    let dialogOpened = false;
    u.page.on("dialog", async (d) => {
      dialogOpened = true;
      await d.dismiss();
    });

    await publishPost(u.page, payload);

    const card = u.page.locator("article", { hasText: marker });
    await expect(card).toHaveCount(1);
    await expect(card.locator("b")).toHaveCount(0);
    expect(dialogOpened).toBe(false);

    await u.close();
  });

  test("otra persona califica una publicación y el promedio se actualiza", async ({ browser }) => {
    const author = await newUser(browser, "autor");
    const caption = `Publicación calificable ${Date.now()}`;
    await publishPost(author.page, caption);

    const rater = await newUser(browser, "vota");
    await rater.page.goto("/");
    const card = rater.page.locator("article", { hasText: caption });
    await expect(card).toHaveCount(1);

    await card.getByRole("button", { name: "3 estrellas" }).click();
    await expect(card.getByText("3.0 · 1")).toBeVisible();

    await author.close();
    await rater.close();
  });

  test("volver a calificar reemplaza el voto, no lo suma", async ({ browser }) => {
    const author = await newUser(browser, "autor2");
    const caption = `Publicación revotada ${Date.now()}`;
    await publishPost(author.page, caption);

    const rater = await newUser(browser, "vota2");
    await rater.page.goto("/");
    const card = rater.page.locator("article", { hasText: caption });

    await card.getByRole("button", { name: "2 estrellas" }).click();
    await expect(card.getByText("2.0 · 1")).toBeVisible();

    await card.getByRole("button", { name: "5 estrellas" }).click();
    await expect(card.getByText("5.0 · 1")).toBeVisible();

    await author.close();
    await rater.close();
  });

  test("nadie puede calificar su propia publicación", async ({ browser }) => {
    const u = await newUser(browser, "propio");
    const caption = `Mi propia publicación ${Date.now()}`;
    await publishPost(u.page, caption);

    const card = u.page.locator("article", { hasText: caption });
    await expect(card.getByRole("button", { name: /estrellas/ })).toHaveCount(0);
    // The author is logged in, so the anonymous prompt would be a lie.
    await expect(card.getByText("Entra para calificar")).toHaveCount(0);
    await expect(card.getByText("Tu publicación")).toBeVisible();

    await u.close();
  });

  test("una imagen por enlace se renderiza; un enlace inválido se ignora", async ({ browser }) => {
    const u = await newUser(browser, "img");
    const caption = `Con imagen ${Date.now()}`;

    await u.page.goto("/");
    await u.page.fill('textarea[name="caption"]', caption);
    await u.page.fill(
      'input[name="imageUrl"]',
      "https://upload.wikimedia.org/wikipedia/commons/a/a5/Red_Kitten_01.jpg",
    );
    await u.page.click('button:has-text("Publicar")');

    const card = u.page.locator("article", { hasText: caption });
    await expect(card.locator("img")).toHaveCount(1);

    // javascript: y texto plano no deben convertirse en src
    const caption2 = `Con enlace malo ${Date.now()}`;
    await u.page.goto("/");
    await u.page.fill('textarea[name="caption"]', caption2);
    await u.page.fill('input[name="imageUrl"]', "javascript:alert(1)");
    await u.page.click('button:has-text("Publicar")');

    const card2 = u.page.locator("article", { hasText: caption2 });
    await expect(card2.locator("img")).toHaveCount(0);

    await u.close();
  });
});
