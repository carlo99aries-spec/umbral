import { expect, type Browser, type Page } from "@playwright/test";

export const PASSWORD = "umbral-qa-123";

export function uniqueHandle(prefix = "qa"): string {
  const stamp = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${prefix}${stamp}${rand}`.toLowerCase().slice(0, 20);
}

export async function signupUI(
  page: Page,
  opts: { handle: string; name?: string; email?: string; password?: string },
) {
  await page.goto("/signup");
  await page.fill('input[name="displayName"]', opts.name ?? `QA ${opts.handle}`);
  await page.fill('input[name="handle"]', opts.handle);
  await page.fill('input[name="email"]', opts.email ?? `${opts.handle}@example.com`);
  await page.fill('input[name="password"]', opts.password ?? PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`**/u/${opts.handle}`, { timeout: 90_000 });
}

export async function loginUI(page: Page, identifier: string, password = PASSWORD) {
  await page.goto("/login");
  await page.fill('input[name="identifier"]', identifier);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/u\//, { timeout: 90_000 });
}

/** A fresh browser context with a brand-new, logged-in user. */
export async function newUser(browser: Browser, prefix = "qa") {
  const context = await browser.newContext();
  const page = await context.newPage();
  const handle = uniqueHandle(prefix);
  const email = `${handle}@example.com`;

  await signupUI(page, { handle, email });

  return {
    context,
    page,
    handle,
    email,
    password: PASSWORD,
    async close() {
      await context.close();
    },
    async relogin() {
      await context.clearCookies();
      await loginUI(page, handle, PASSWORD);
    },
  };
}

/** Publish a post from the feed composer and wait for it to render. */
export async function publishPost(page: Page, caption: string, imageUrl = "") {
  await page.goto("/");
  await page.fill('textarea[name="caption"]', caption);
  if (imageUrl) await page.fill('input[name="imageUrl"]', imageUrl);
  await page.click('button:has-text("Publicar")');
  await expect(page.getByText(caption, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
}

/** Generate an interaction code from /settings and return the path. */
export async function generateToken(page: Page, note = "qa"): Promise<string> {
  await page.goto("/settings");

  // The settings page already lists previously issued codes, so "a code is
  // visible" is true before we even click. Snapshot the existing ones and wait
  // for a genuinely new one instead of racing the list.
  const before = await page.locator("code", { hasText: "/rate/" }).allTextContents();

  await page.fill('input[name="note"]', note);
  await page.click('button:has-text("Generar código")');

  let fresh = "";
  await expect
    .poll(
      async () => {
        const now = await page.locator("code", { hasText: "/rate/" }).allTextContents();
        fresh = now.find((t) => !before.includes(t)) ?? "";
        return fresh;
      },
      { timeout: 30_000 },
    )
    .not.toBe("");

  const match = fresh.match(/\/rate\/([a-z0-9]+)/i);
  if (!match) throw new Error(`No code found in "${fresh}"`);
  return `/rate/${match[1]}`;
}

export function codeFromPath(path: string): string {
  return path.split("/").pop() as string;
}
