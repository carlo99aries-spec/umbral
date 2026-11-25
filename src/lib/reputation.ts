/**
 * Umbral reputation engine — pure functions, no I/O.
 *
 * The mechanic, in one paragraph:
 *
 *   Your score is a time-decayed, influence-weighted average of the stars
 *   other people gave you. It is NOT a plain average. Two forces distort it,
 *   and both distortions are the point:
 *
 *   1. Influence asymmetry — a rating from someone with a high score counts
 *      more than the same stars from someone with a low score. Fall, and your
 *      own opinion of others becomes worth less. That is the trap.
 *
 *   2. Time decay — old ratings fade with a half-life. You cannot rest on a
 *      good history; you have to keep being liked.
 *
 * A Bayesian prior keeps brand-new accounts near the middle instead of
 * letting a single 5-star rating mint a 5.00 account.
 */

/** Tunable constants. Change these and re-run `npm test`. */
export const REPUTATION_CONFIG = {
  /** Neutral score a new account starts from. */
  priorScore: 3.5,
  /** How many "average" ratings the prior is worth. Higher = slower to move. */
  priorWeight: 3.0,
  /** Days for a rating's influence to halve. */
  halfLifeDays: 90,
  /** Influence multiplier bounds. */
  minRaterWeight: 0.05,
  maxRaterWeight: 2.0,
  /** Exponent of the influence curve. 1 = linear, >1 = elitist. */
  influenceExponent: 1.6,
  /** Score used as the "neutral" rater when we have no history for them. */
  neutralRaterScore: 3.5,
  /** Multiplier applied to both sides of a detected reciprocal pair. */
  reciprocityPenalty: 0.35,
  /** Window (hours) used to detect "I rate you, you rate me back". */
  reciprocalWindowHours: 24,
  /** Ratings older than this are ignored entirely. */
  maxAgeDays: 730,
} as const;

export type TierName = "PLATINUM" | "GOLD" | "SILVER" | "BRONZE" | "RESTRICTED";

export interface Tier {
  name: TierName;
  label: string;
  minScore: number;
  /** Minimum number of ratings before this tier becomes reachable. */
  minRatings: number;
  /** Interaction codes a member of this tier may issue per day. */
  dailyCodes: number;
  /** What this score unlocks. The gate is the engine of anxiety. */
  privileges: string[];
  blurb: string;
}

/**
 * Tiers are hard gates, not vanity badges. Ordered from highest to lowest.
 */
export const TIERS: Tier[] = [
  {
    name: "PLATINUM",
    label: "Platino",
    minScore: 4.5,
    minRatings: 25,
    dailyCodes: 15,
    privileges: [
      "Acceso a eventos y listas de espera prioritarias",
      "Vuelos y reservas sin restricciones",
      "Perfil destacado en búsquedas",
    ],
    blurb: "La cima. Todos te sonríen y nadie te lo dice.",
  },
  {
    name: "GOLD",
    label: "Oro",
    minScore: 4.2,
    minRatings: 15,
    dailyCodes: 8,
    privileges: [
      "Reservas en restaurantes y hospedaje",
      "Perfil destacado en búsquedas",
    ],
    blurb: "Estás dentro. Solo no te descuides.",
  },
  {
    name: "SILVER",
    label: "Plata",
    minScore: 3.8,
    minRatings: 8,
    dailyCodes: 5,
    privileges: [
      "Acceso general a la red",
    ],
    blurb: "Funcionas. Con esfuerzo, subes.",
  },
  {
    name: "BRONZE",
    label: "Bronce",
    minScore: 3.0,
    minRatings: 0,
    dailyCodes: 3,
    privileges: [
      "Acceso a la red pública",
    ],
    blurb: "Existes, pero el sistema te mira de reojo.",
  },
  {
    name: "RESTRICTED",
    label: "Restringido",
    minScore: 0,
    minRatings: 0,
    // One a day on purpose: below 3.00 the system throttles you, but a total
    // lock would leave no way back up. A trap needs a door to be a critique
    // instead of a death sentence.
    dailyCodes: 1,
    privileges: [
      "Solo lectura: no puedes calificar a otros",
      "Tu perfil no aparece en búsquedas",
    ],
    blurb: "Por debajo de 3.0 el sistema te aparta, sin avisar.",
  },
];

/** Weight a single rater's opinion carries, based on their own score. */
export function raterWeight(raterScore: number | null | undefined): number {
  const cfg = REPUTATION_CONFIG;
  const score = clamp(raterScore ?? cfg.neutralRaterScore, 1, 5);
  const raw = Math.pow(score / cfg.neutralRaterScore, cfg.influenceExponent);
  return clamp(raw, cfg.minRaterWeight, cfg.maxRaterWeight);
}

/** Exponential decay factor for a rating of `ageDays` days. 1 = fresh, 0 = gone. */
export function timeDecay(ageDays: number): number {
  const cfg = REPUTATION_CONFIG;
  if (!Number.isFinite(ageDays) || ageDays < 0) return 0;
  if (ageDays > cfg.maxAgeDays) return 0;
  return Math.pow(0.5, ageDays / cfg.halfLifeDays);
}

export interface RatingInput {
  stars: number;
  /** Rater's own score at the time. null = unknown, treated as neutral. */
  raterScore?: number | null;
  createdAt: Date;
  /** True when this rating was part of a detected reciprocal pair. */
  reciprocal?: boolean;
  /** ID of the collusion cluster this rating belongs to. */
  clusterId?: string;
}

export interface ScoreResult {
  /** Weighted, decayed, prior-adjusted score. 0..5, 2 decimals of intent. */
  score: number;
  /** 0..1 — how much evidence backs this number. */
  confidence: number;
  /** Number of ratings that still carry weight. */
  sampleSize: number;
  /** Sum of effective weights (after decay and penalties). */
  effectiveWeight: number;
  /** Per-rating breakdown, useful for the UI and for auditing the algorithm. */
  breakdown: Array<{
    stars: number;
    raterScore: number;
    ageDays: number;
    weight: number;
    decay: number;
    reciprocal: boolean;
    clusterId?: string;
    contribution: number;
  }>;
}

/**
 * Compute a subject's score from their received ratings.
 *
 *   score = (priorScore*priorWeight + Σ wᵢ·decayᵢ·rᵢ·starsᵢ)
 *         / (priorWeight          + Σ wᵢ·decayᵢ·rᵢ)
 *
 * where rᵢ = 1 for normal ratings, `reciprocityPenalty` for reciprocal pairs.
 */
export function computeScore(ratings: RatingInput[], now: Date = new Date()): ScoreResult {
  const cfg = REPUTATION_CONFIG;

  let weightedSum = 0;
  let weightTotal = 0;
  let sampleSize = 0;
  const breakdown: ScoreResult["breakdown"] = [];

  for (const rating of ratings) {
    const stars = clamp(rating.stars, 1, 5);
    const rs = clamp(rating.raterScore ?? cfg.neutralRaterScore, 1, 5);
    const ageDays = Math.max(0, (now.getTime() - rating.createdAt.getTime()) / 86_400_000);
    const decay = timeDecay(ageDays);

    if (decay <= 0) continue;

    const penalty = (rating.reciprocal || rating.clusterId) ? cfg.reciprocityPenalty : 1;
    const w = raterWeight(rs) * decay * penalty;
    const contribution = w * stars;

    weightedSum += contribution;
    weightTotal += w;
    sampleSize += 1;
    breakdown.push({
      stars,
      raterScore: round(rs, 2),
      ageDays: round(ageDays, 1),
      weight: round(w, 4),
      decay: round(decay, 4),
      reciprocal: Boolean(rating.reciprocal),
      clusterId: rating.clusterId,
      contribution: round(contribution, 4),
    });
  }

  const denominator = cfg.priorWeight + weightTotal;
  const score = (cfg.priorScore * cfg.priorWeight + weightedSum) / denominator;

  return {
    score: round(clamp(score, 1, 5), 2),
    confidence: round(weightTotal / denominator, 3),
    sampleSize,
    effectiveWeight: round(weightTotal, 3),
    breakdown,
  };
}

export interface LiveRatingInput extends RatingInput {
  raterId: string;
}

/**
 * v0.2 — influence follows the rater's *current* standing.
 *
 * Each rater's own score is recomputed from their history and replaces the
 * snapshot stored on the rating. That is the episode's real cruelty: when you
 * fall, your opinion of everyone else is worth less, and their numbers move
 * without a single new rating being written.
 *
 * Deliberately one level deep. A rater's history is itself scored with plain
 * snapshots, which stops recursion (A rates B, B rates A) and keeps the cost
 * at two queries instead of a graph walk.
 */
export function computeScoreWithLiveRaters(
  ratings: LiveRatingInput[],
  raterHistories: Record<string, RatingInput[]>,
  now: Date = new Date(),
): ScoreResult {
  const resolved: RatingInput[] = ratings.map((rating) => {
    const history = raterHistories[rating.raterId];
    const liveScore =
      history && history.length > 0
        ? computeScore(history, now).score
        : (rating.raterScore ?? REPUTATION_CONFIG.neutralRaterScore);

    return {
      stars: rating.stars,
      raterScore: liveScore,
      createdAt: rating.createdAt,
      reciprocal: rating.reciprocal,
    };
  });

  return computeScore(resolved, now);
}

/**
 * Resolve the tier for a score + sample size.
 * A high score with too few ratings cannot reach a high tier — you have to
 * have been seen by enough people.
 */
export function resolveTier(score: number, sampleSize: number): Tier {
  const ordered = [...TIERS].sort((a, b) => b.minScore - a.minScore);
  for (const tier of ordered) {
    if (score >= tier.minScore && sampleSize >= tier.minRatings) return tier;
  }
  // Below every floor.
  return TIERS[TIERS.length - 1];
}

/** The tier immediately above the current one, or null if already at the top. */
export function nextTier(current: TierName): Tier | null {
  const idx = TIERS.findIndex((t) => t.name === current);
  if (idx <= 0) return null;
  return TIERS[idx - 1];
}

/** How many points short of the next tier, and how many ratings are missing. */
export function tierProgress(
  score: number,
  sampleSize: number,
): { next: Tier; pointsNeeded: number; ratingsNeeded: number } | null {
  const current = resolveTier(score, sampleSize);
  const next = nextTier(current.name);
  if (!next) return null;
  return {
    next,
    pointsNeeded: round(Math.max(0, next.minScore - score), 2),
    ratingsNeeded: Math.max(0, next.minRatings - sampleSize),
  };
}

/**
 * Detect reciprocal pairs among a subject's ratings.
 *
 * A pair (A→B, B→A) is "reciprocal" when both ratings are >= 4.5 and landed
 * within `reciprocalWindowHours` of each other. Those inflate scores without
 * any real signal, so both sides get penalised.
 *
 * `given` are the ratings the subject wrote; `received` are the ones they got.
 */
export function detectReciprocal(
  received: Array<{ id: string; raterId: string; stars: number; createdAt: Date }>,
  given: Array<{ subjectId: string; stars: number; createdAt: Date }>,
): Set<string> {
  const cfg = REPUTATION_CONFIG;
  const windowMs = cfg.reciprocalWindowHours * 3_600_000;
  const flagged = new Set<string>();

  for (const r of received) {
    if (r.stars < 4.5) continue;
    for (const g of given) {
      if (g.subjectId !== r.raterId || g.stars < 4.5) continue;
      if (Math.abs(g.createdAt.getTime() - r.createdAt.getTime()) <= windowMs) {
        flagged.add(r.id);
        break;
      }
    }
  }
  return flagged;
}

/** Tier thresholds as a display-friendly list. */
export function tierTable(): Array<{ name: string; label: string; minScore: number; minRatings: number }> {
  return TIERS.map((t) => ({
    name: t.name,
    label: t.label,
    minScore: t.minScore,
    minRatings: t.minRatings,
  }));
}

// ---------------------------------------------------------------- helpers

export function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function round(n: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}


/**
 * Detect collusion clusters (rings and farms) among all ratings.
 *
 * Builds a directed graph of rater -> subject for ratings >= 4.5.
 * Finds Strongly Connected Components (SCCs).
 * If an SCC (size >= 3) has an internal edge share > 0.8, it's flagged as a cluster.
 * Returns a map of ratingId -> clusterId.
 */
export function detectClusters(
  ratings: Array<{ id: string; raterId: string; subjectId: string; stars: number }>
): Map<string, string> {
  const nodes = new Set<string>();
  const adj = new Map<string, string[]>();
  const outDegree = new Map<string, number>();
  const ratingMap = new Map<string, Array<{id: string, to: string}>>();

  for (const r of ratings) {
    if (r.stars < 4.5) continue;
    nodes.add(r.raterId);
    nodes.add(r.subjectId);
    
    if (!adj.has(r.raterId)) adj.set(r.raterId, []);
    adj.get(r.raterId)!.push(r.subjectId);
    
    outDegree.set(r.raterId, (outDegree.get(r.raterId) || 0) + 1);
    
    if (!ratingMap.has(r.raterId)) ratingMap.set(r.raterId, []);
    ratingMap.get(r.raterId)!.push({ id: r.id, to: r.subjectId });
  }

  let index = 0;
  const indices = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const sccs: string[][] = [];

  function strongconnect(v: string) {
    indices.set(v, index);
    lowlink.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    for (const w of (adj.get(v) || [])) {
      if (!indices.has(w)) {
        strongconnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
      }
    }

    if (lowlink.get(v) === indices.get(v)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      sccs.push(scc);
    }
  }

  for (const v of nodes) {
    if (!indices.has(v)) {
      strongconnect(v);
    }
  }

  const flagged = new Map<string, string>();

  for (let i = 0; i < sccs.length; i++) {
    const scc = sccs[i];
    if (scc.length < 3) continue;

    const sccSet = new Set(scc);
    let internalEdges = 0;
    let totalOutEdges = 0;

    for (const u of scc) {
      totalOutEdges += (outDegree.get(u) || 0);
      for (const v of (adj.get(u) || [])) {
        if (sccSet.has(v)) internalEdges++;
      }
    }

    if (totalOutEdges > 0 && (internalEdges / totalOutEdges) > 0.8) {
      const clusterId = `cluster-${i}`;
      for (const u of scc) {
        for (const edge of (ratingMap.get(u) || [])) {
          if (sccSet.has(edge.to)) {
            flagged.set(edge.id, clusterId);
          }
        }
      }
    }
  }

  return flagged;
}
