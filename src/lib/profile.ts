import type { Rating, User } from "@prisma/client";
import { prisma } from "./db";
import {
  REPUTATION_CONFIG,
  computeScore,
  detectReciprocal,
  resolveTier,
  tierProgress,
  type ScoreResult,
  type Tier,
} from "./reputation";

export interface ProfileView {
  user: User;
  score: ScoreResult;
  tier: Tier;
  progress: ReturnType<typeof tierProgress>;
  /** Ratings received, newest first, with reciprocity resolved. */
  ratings: Array<Rating & { reciprocal: boolean }>;
}

/**
 * Load everything the profile page and the public API need.
 *
 * Scores are computed on read rather than stored, so the number is always
 * consistent with the raw evidence. If this ever becomes a hot path, add a
 * cached `scoreVersion` column — do not denormalise without a rebuild job.
 */
export async function loadProfile(handle: string): Promise<ProfileView | null> {
  const user = await prisma.user.findUnique({
    where: { handle: handle.toLowerCase() },
  });
  if (!user) return null;

  const [received, given] = await Promise.all([
    prisma.rating.findMany({
      where: { subjectId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.rating.findMany({
      where: { raterId: user.id },
      select: { subjectId: true, stars: true, createdAt: true },
    }),
  ]);

  const reciprocalIds = detectReciprocal(received, given);
  const ratings = received.map((r) => ({
    ...r,
    reciprocal: r.reciprocal || reciprocalIds.has(r.id),
  }));

  const score = computeScore(
    ratings.map((r) => ({
      stars: r.stars,
      raterScore: r.raterScore,
      createdAt: r.createdAt,
      reciprocal: r.reciprocal,
    })),
  );

  const tier = resolveTier(score.score, score.sampleSize);

  return {
    user,
    score,
    tier,
    progress: tierProgress(score.score, score.sampleSize),
    ratings,
  };
}

/** Score snapshot for a rater, cheap enough to call during a rating write. */
export async function raterScoreSnapshot(raterId: string): Promise<number> {
  const received = await prisma.rating.findMany({
    where: { subjectId: raterId },
    select: { stars: true, raterScore: true, createdAt: true, reciprocal: true },
  });
  return computeScore(received).score;
}

/** Would this rating close a reciprocal pair? Mirrors detectReciprocal's rule. */
export async function isReciprocalPair(
  raterId: string,
  subjectId: string,
  stars: number,
): Promise<boolean> {
  if (stars < 4.5) return false;

  const windowMs = REPUTATION_CONFIG.reciprocalWindowHours * 3_600_000;
  const counter = await prisma.rating.findFirst({
    where: {
      raterId: subjectId,
      subjectId: raterId,
      stars: { gte: 4.5 },
      createdAt: { gte: new Date(Date.now() - windowMs) },
    },
  });

  return Boolean(counter);
}
