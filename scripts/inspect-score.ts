/**
 * Diagnóstico: compara el score calculado con los snapshots guardados en cada
 * calificación contra el score calculado con la influencia viva (v0.2).
 *
 *   npm run inspect -- naomi chester paul
 *
 * Sirve para ver, sin abrir la app, cuánto mueve el algoritmo nuevo a cada
 * perfil. Si un delta es grande, es que sus votantes cambiaron de nivel.
 */
import { PrismaClient } from "@prisma/client";
import {
  computeScore,
  computeScoreWithLiveRaters,
  resolveTier,
  type RatingInput,
} from "../src/lib/reputation";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const handles = args.length > 0 ? args : ["naomi"];

  for (const handle of handles) {
    const user = await prisma.user.findUnique({ where: { handle } });
    if (!user) {
      console.log(`@${handle.padEnd(9)} no existe`);
      continue;
    }

    const received = await prisma.rating.findMany({ where: { subjectId: user.id } });
    const raterIds = Array.from(new Set(received.map((r) => r.raterId)));

    const raterRows = raterIds.length
      ? await prisma.rating.findMany({ where: { subjectId: { in: raterIds } } })
      : [];

    const histories: Record<string, RatingInput[]> = {};
    for (const row of raterRows) {
      (histories[row.subjectId] ??= []).push({
        stars: row.stars,
        raterScore: row.raterScore,
        createdAt: row.createdAt,
        reciprocal: row.reciprocal,
      });
    }

    const snapshot = computeScore(received);
    const live = computeScoreWithLiveRaters(
      received.map((r) => ({
        raterId: r.raterId,
        stars: r.stars,
        raterScore: r.raterScore,
        createdAt: r.createdAt,
        reciprocal: r.reciprocal,
      })),
      histories,
    );

    const delta = live.score - snapshot.score;
    const snapTier = resolveTier(snapshot.score, snapshot.sampleSize);
    const liveTier = resolveTier(live.score, live.sampleSize);

    console.log(
      `@${handle.padEnd(9)} snapshot ${snapshot.score.toFixed(2)} (${snapTier.label.padEnd(10)})` +
        `  ->  live ${live.score.toFixed(2)} (${liveTier.label.padEnd(10)})` +
        `  Δ ${delta >= 0 ? "+" : ""}${delta.toFixed(2)}` +
        `  · ${live.sampleSize} calif.`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
