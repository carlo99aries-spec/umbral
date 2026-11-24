/**
 * Seed a small, plausible population so the app is not empty on first run.
 *
 *   npm run seed
 *
 * Creates accounts (password: "umbral-demo") and scatters ratings across them
 * with realistic rater scores, ages and a couple of reciprocal pairs so you can
 * see the penalty in the UI.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeScore, raterWeight } from "../src/lib/reputation";

const prisma = new PrismaClient();

const PEOPLE = [
  { handle: "lacie", displayName: "Lacie Pound", hue: 210, bio: "Quiero estar arriba. Es todo lo que quiero." },
  { handle: "naomi", displayName: "Naomi Jayne", hue: 285, bio: "4.82 y subiendo. Sin esfuerzo, obvio." },
  { handle: "ryan", displayName: "Ryan Miles", hue: 20, bio: "Cada interacción es una oportunidad." },
  { handle: "chester", displayName: "Chester Willoughby", hue: 120, bio: "El sistema es una mierda y aun así te califico." },
  { handle: "susan", displayName: "Susan Davis", hue: 340, bio: "Bienvenida al barrio, cariño." },
  { handle: "greg", displayName: "Greg Spencer", hue: 45, bio: "El mejor amigo que tu número puede comprar." },
  { handle: "karen", displayName: "Karen Pike", hue: 165, bio: "Reservas y eventos. Nivel Platino, como debe ser." },
  { handle: "paul", displayName: "Paul Morris", hue: 260, bio: "Vuelos privados y sonrisas de 5 estrellas." },
];

async function main() {
  const passwordHash = await bcrypt.hash("umbral-demo", 12);

  const users = [];
  for (const p of PEOPLE) {
    const user = await prisma.user.upsert({
      where: { handle: p.handle },
      update: {},
      create: {
        handle: p.handle,
        displayName: p.displayName,
        email: `${p.handle}@umbral.local`,
        passwordHash,
        bio: p.bio,
        avatarHue: p.hue,
      },
    });
    users.push(user);
  }

  // Wipe previous demo ratings so re-running is idempotent.
  await prisma.rating.deleteMany({
    where: { subjectId: { in: users.map((u) => u.id) } },
  });

  const now = Date.now();

  // Each subject gets a target "how well do people receive them" mean and a
  // rating count. The spread is deliberate so the tier ladder is visible:
  //   naomi   -> Platino (high mean, many ratings)
  //   karen   -> Oro
  //   lacie   -> Plata
  //   paul    -> Plata, but with a Platino-level mean and too few ratings:
  //              demonstrates the minimum-ratings gate
  //   ryan    -> Plata
  //   susan   -> Bronce
  //   greg    -> Bronce
  //   chester -> Restringido (<3.00)
  const POPULATION: Record<string, { mean: number; count: number }> = {
    naomi: { mean: 4.86, count: 46 },
    karen: { mean: 4.44, count: 34 },
    lacie: { mean: 4.14, count: 16 },
    paul: { mean: 4.62, count: 9 },
    ryan: { mean: 4.02, count: 30 },
    susan: { mean: 3.64, count: 22 },
    greg: { mean: 3.34, count: 18 },
    chester: { mean: 2.52, count: 26 },
  };

  // Deterministic pseudo-random so seeds are reproducible.
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };

  for (const subject of users) {
    const spec = POPULATION[subject.handle] ?? { mean: 3.5, count: 10 };
    for (let i = 0; i < spec.count; i++) {
      const rater = users[Math.floor(rand() * users.length)];
      if (rater.id === subject.id) continue;

      // Rater's own standing drives both the weight and the stars they hand out.
      const received = await prisma.rating.findMany({
        where: { subjectId: rater.id },
        select: { stars: true, raterScore: true, createdAt: true, reciprocal: true },
      });
      const raterScore = computeScore(received).score;

      // People receive roughly their `mean`, nudged by how generous the rater is.
      const raw = spec.mean + (rand() - 0.5) * 1.3 + (raterScore - 3.5) * 0.25;
      const stars = Math.max(1, Math.min(5, Math.round(raw)));

      const ageDays = Math.floor(rand() * 240);
      await prisma.rating.create({
        data: {
          raterId: rater.id,
          subjectId: subject.id,
          stars,
          raterScore,
          weight: raterWeight(raterScore),
          createdAt: new Date(now - ageDays * 86_400_000),
        },
      });
    }
  }

  // One deliberate reciprocal pair: naomi <-> greg, both 5 stars, minutes apart.
  const naomi = users.find((u) => u.handle === "naomi")!;
  const greg = users.find((u) => u.handle === "greg")!;
  const t = new Date(now - 3 * 3_600_000);

  await prisma.rating.createMany({
    data: [
      { raterId: naomi.id, subjectId: greg.id, stars: 5, raterScore: 4.8, weight: 0.5, reciprocal: true, createdAt: t },
      { raterId: greg.id, subjectId: naomi.id, stars: 5, raterScore: 4.5, weight: 0.5, reciprocal: true, createdAt: new Date(t.getTime() + 60_000) },
    ],
  });

  for (const u of users) {
    const received = await prisma.rating.findMany({
      where: { subjectId: u.id },
      select: { stars: true, raterScore: true, createdAt: true, reciprocal: true },
    });
    const s = computeScore(received);
    console.log(`@${u.handle.padEnd(9)} ${s.score.toFixed(2)}  (${String(s.sampleSize).padStart(2)} calif., conf ${(s.confidence * 100).toFixed(0)}%)`);
  }

  console.log("\nContraseña de todos los usuarios demo: umbral-demo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
