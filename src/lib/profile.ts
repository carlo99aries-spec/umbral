import type { Rating, User } from "@prisma/client";
import { prisma } from "./db";
import {
  REPUTATION_CONFIG,
  computeScore,
  computeScoreWithLiveRaters,
  detectReciprocal,
  resolveTier,
  round,
  tierProgress,
  type RatingInput,
  type ScoreResult,
  type Tier,
} from "./reputation";

export interface ProfileView {
  user: User;
  score: ScoreResult;
  tier: Tier;
  progress: ReturnType<typeof tierProgress>;
  /**
   * Ratings received, newest first, with reciprocity resolved and `delta`:
   * how much that single rating contributes to the current score (leave-one-out).
   */
  ratings: Array<Rating & { reciprocal: boolean; delta: number }>;
  /** Mean of stars received on posts. Content signal only — never reputation. */
  aura: number | null;
  auraCount: number;
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

  // v0.2: pull each rater's own history so their influence is computed from
  // their *current* score, not the snapshot taken when they rated.
  const raterIds = Array.from(new Set(ratings.map((r) => r.raterId)));
  const raterRows = raterIds.length
    ? await prisma.rating.findMany({
        where: { subjectId: { in: raterIds } },
        select: {
          subjectId: true,
          stars: true,
          raterScore: true,
          createdAt: true,
          reciprocal: true,
        },
      })
    : [];

  const raterHistories: Record<string, RatingInput[]> = {};
  for (const row of raterRows) {
    (raterHistories[row.subjectId] ??= []).push({
      stars: row.stars,
      raterScore: row.raterScore,
      createdAt: row.createdAt,
      reciprocal: row.reciprocal,
    });
  }

  const score = computeScoreWithLiveRaters(
    ratings.map((r) => ({
      raterId: r.raterId,
      stars: r.stars,
      raterScore: r.raterScore,
      createdAt: r.createdAt,
      reciprocal: r.reciprocal,
    })),
    raterHistories,
  );

  const tier = resolveTier(score.score, score.sampleSize);

  // Leave-one-out: what did each rating actually contribute? Bounded to the
  // 20 most recent so a long history cannot turn this into O(n²) work.
  const decorated = ratings.map((rating, index) => {
    if (index >= 20) return { ...rating, delta: 0 };
    const others = ratings
      .filter((r) => r.id !== rating.id)
      .map((r) => ({
        raterId: r.raterId,
        stars: r.stars,
        raterScore: r.raterScore,
        createdAt: r.createdAt,
        reciprocal: r.reciprocal,
      }));
    const without = computeScoreWithLiveRaters(others, raterHistories).score;
    return { ...rating, delta: round(score.score - without, 2) };
  });

  // Content signal only. Deliberately a Prisma aggregate, not raw SQL: the
  // previous `$queryRaw` used unquoted camelCase columns, which Postgres folds
  // to lowercase (postid) and rejected at runtime while SQLite accepted it.
  // Typed aggregates are portable and cannot drift with the schema.
  const auraAgg = await prisma.postRating.aggregate({
    where: { post: { authorId: user.id } },
    _avg: { stars: true },
    _count: { _all: true },
  });

  return {
    user,
    score,
    tier,
    progress: tierProgress(score.score, score.sampleSize),
    ratings: decorated,
    aura: auraAgg._avg.stars == null ? null : round(auraAgg._avg.stars, 1),
    auraCount: auraAgg._count._all,
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
