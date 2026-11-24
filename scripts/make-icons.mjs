/**
 * Generates the PWA icon set from src/app/icon.svg.
 *
 *   npm run icons
 *
 * Requires sharp (devDependency). Run once and commit the PNGs.
 */
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const svg = readFileSync(resolve(root, "src/app/icon.svg"));
const outDir = resolve(root, "public/icons");

mkdirSync(outDir, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const { file, size } of targets) {
  await sharp(svg, { density: 600 })
    .resize(size, size, { fit: "contain", background: "#08080b" })
    .png({ compressionLevel: 9 })
    .toFile(resolve(outDir, file));
  console.log(`✓ ${file} (${size}x${size})`);
}

// Maskable: icon inset to 80% on a solid brand background, so Android can crop
// it into any launcher shape without clipping the mark.
const inner = await sharp(svg, { density: 600 }).resize(410, 410, { fit: "contain" }).png().toBuffer();

await sharp({
  create: { width: 512, height: 512, channels: 4, background: "#08080b" },
})
  .composite([{ input: inner, gravity: "center" }])
  .png({ compressionLevel: 9 })
  .toFile(resolve(outDir, "maskable-512.png"));

console.log("✓ maskable-512.png (512x512, 80% safe area)");
