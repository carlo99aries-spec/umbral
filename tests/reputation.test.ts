import { describe, expect, it } from "vitest";
import {
  REPUTATION_CONFIG,
  TIERS,
  computeScore,
  detectReciprocal,
  nextTier,
  raterWeight,
  resolveTier,
  timeDecay,
  tierProgress,
} from "../src/lib/reputation";

/** Helper: build N ratings of the same value, all from a rater with `raterScore`. */
function bulk(
  n: number,
  stars: number,
  raterScore: number | null,
  ageDays = 0,
  now = new Date("2026-01-01T00:00:00Z"),
) {
  return Array.from({ length: n }, () => ({
    stars,
    raterScore,
    createdAt: new Date(now.getTime() - ageDays * 86_400_000),
  }));
}

const NOW = new Date("2026-01-01T00:00:00Z");

describe("raterWeight", () => {
  it("gives a neutral rater a weight of exactly 1", () => {
    expect(raterWeight(3.5)).toBeCloseTo(1, 6);
  });

  it("makes high scorers count more than low scorers", () => {
    const high = raterWeight(4.8);
    const mid = raterWeight(3.5);
    const low = raterWeight(2.5);
    expect(high).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(low);
    expect(high / low).toBeGreaterThan(2);
  });

  it("treats a missing rater score as neutral", () => {
    expect(raterWeight(null)).toBeCloseTo(raterWeight(3.5), 10);
    expect(raterWeight(undefined)).toBeCloseTo(1, 6);
  });

  it("clamps absurd inputs", () => {
    expect(raterWeight(99)).toBeLessThanOrEqual(REPUTATION_CONFIG.maxRaterWeight);
    expect(raterWeight(-99)).toBeGreaterThanOrEqual(REPUTATION_CONFIG.minRaterWeight);
    expect(raterWeight(4.8)).toBeLessThanOrEqual(REPUTATION_CONFIG.maxRaterWeight);
  });
});

describe("timeDecay", () => {
  it("is 1 at age zero", () => {
    expect(timeDecay(0)).toBe(1);
  });

  it("halves at exactly one half-life", () => {
    expect(timeDecay(REPUTATION_CONFIG.halfLifeDays)).toBeCloseTo(0.5, 10);
    expect(timeDecay(REPUTATION_CONFIG.halfLifeDays * 2)).toBeCloseTo(0.25, 10);
  });

  it("is zero beyond the max age", () => {
    expect(timeDecay(REPUTATION_CONFIG.maxAgeDays + 1)).toBe(0);
  });

  it("is zero for negative or non-finite ages", () => {
    expect(timeDecay(-5)).toBe(0);
    expect(timeDecay(Number.NaN)).toBe(0);
  });
});

describe("computeScore", () => {
  it("returns the prior for an account with no ratings", () => {
    const r = computeScore([], NOW);
    expect(r.score).toBe(REPUTATION_CONFIG.priorScore);
    expect(r.confidence).toBe(0);
    expect(r.sampleSize).toBe(0);
  });

  it("lets a single 5-star rating move the score only a little", () => {
    const r = computeScore(bulk(1, 5, 3.5, 0, NOW), NOW);
    expect(r.score).toBeGreaterThan(3.5);
    expect(r.score).toBeLessThan(4.0); // prior dominates
    expect(r.confidence).toBeLessThan(0.3);
  });

  it("converges toward the received value as evidence accumulates", () => {
    const few = computeScore(bulk(3, 5, 3.5, 0, NOW), NOW);
    const many = computeScore(bulk(60, 5, 3.5, 0, NOW), NOW);
    expect(many.score).toBeGreaterThan(few.score);
    expect(many.score).toBeGreaterThan(4.8);
    expect(many.confidence).toBeGreaterThan(0.9);
  });

  it("a high-score rater lifts you more than a low-score rater with the same stars", () => {
    const fromElite = computeScore(bulk(10, 5, 4.9, 0, NOW), NOW);
    const fromLow = computeScore(bulk(10, 5, 2.2, 0, NOW), NOW);
    expect(fromElite.score).toBeGreaterThan(fromLow.score);
  });

  it("a low-score rater drags you down harder when the stars are bad", () => {
    // 2 stars from a 2.0 rater should hurt less than 2 stars from a 4.8 rater?
    // No — hostility from a high-status person is worth more. That is the model.
    const badFromElite = computeScore(bulk(10, 1, 4.9, 0, NOW), NOW);
    const badFromLow = computeScore(bulk(10, 1, 2.0, 0, NOW), NOW);
    expect(badFromElite.score).toBeLessThan(badFromLow.score);
  });

  it("decays old ratings: fresh 5s beat stale 5s", () => {
    const fresh = computeScore(bulk(10, 5, 3.5, 0, NOW), NOW);
    const stale = computeScore(bulk(10, 5, 3.5, 400, NOW), NOW);
    expect(fresh.score).toBeGreaterThan(stale.score);
  });

  it("ignores ratings older than the max age", () => {
    const ancient = computeScore(bulk(50, 1, 3.5, REPUTATION_CONFIG.maxAgeDays + 10, NOW), NOW);
    expect(ancient.sampleSize).toBe(0);
    expect(ancient.score).toBe(REPUTATION_CONFIG.priorScore);
  });

  it("penalises reciprocal ratings", () => {
    const honest = computeScore(
      Array.from({ length: 10 }, (_, i) => ({
        stars: 5,
        raterScore: 4.5,
        createdAt: new Date(NOW.getTime() - i * 1000),
        reciprocal: false,
      })),
      NOW,
    );
    const farmed = computeScore(
      Array.from({ length: 10 }, (_, i) => ({
        stars: 5,
        raterScore: 4.5,
        createdAt: new Date(NOW.getTime() - i * 1000),
        reciprocal: true,
      })),
      NOW,
    );
    expect(farmed.score).toBeLessThan(honest.score);
    expect(farmed.effectiveWeight).toBeLessThan(honest.effectiveWeight);
  });

  it("never returns a score outside 1..5", () => {
    const absurdHigh = computeScore(bulk(500, 5, 5, 0, NOW), NOW);
    const absurdLow = computeScore(bulk(500, 1, 5, 0, NOW), NOW);
    expect(absurdHigh.score).toBeLessThanOrEqual(5);
    expect(absurdLow.score).toBeGreaterThanOrEqual(1);
  });

  it("produces a breakdown with one row per counted rating", () => {
    const r = computeScore(bulk(7, 4, 4, 0, NOW), NOW);
    expect(r.breakdown).toHaveLength(7);
    expect(r.breakdown[0]).toHaveProperty("contribution");
  });
});

describe("resolveTier", () => {
  it("starts everyone at BRONZE", () => {
    expect(resolveTier(REPUTATION_CONFIG.priorScore, 0).name).toBe("BRONZE");
  });

  it("gates high tiers behind a minimum number of ratings", () => {
    // 4.9 with only 3 ratings is not PLATINUM.
    expect(resolveTier(4.9, 3).name).not.toBe("PLATINUM");
    expect(resolveTier(4.9, TIERS[0].minRatings).name).toBe("PLATINUM");
  });

  it("sends sub-3.0 accounts to RESTRICTED", () => {
    expect(resolveTier(2.4, 40).name).toBe("RESTRICTED");
  });

  it("walks the ladder correctly", () => {
    expect(resolveTier(3.9, 10).name).toBe("SILVER");
    expect(resolveTier(4.25, 20).name).toBe("GOLD");
    expect(resolveTier(4.6, 30).name).toBe("PLATINUM");
  });
});

describe("nextTier / tierProgress", () => {
  it("reports the climb to the next gate", () => {
    const p = tierProgress(4.31, 18);
    expect(p).not.toBeNull();
    expect(p!.next.name).toBe("PLATINUM");
    expect(p!.pointsNeeded).toBeCloseTo(0.19, 2);
    expect(p!.ratingsNeeded).toBe(7);
  });

  it("returns null at the top", () => {
    expect(nextTier("PLATINUM")).toBeNull();
    expect(tierProgress(4.9, 100)).toBeNull();
  });
});

describe("detectReciprocal", () => {
  const t0 = new Date("2026-01-01T00:00:00Z");

  it("flags a mutual 5-star pair inside the window", () => {
    const received = [{ id: "r1", raterId: "u2", stars: 5, createdAt: t0 }];
    const given = [
      { subjectId: "u2", stars: 5, createdAt: new Date(t0.getTime() + 60 * 60 * 1000) },
    ];
    expect(detectReciprocal(received, given).has("r1")).toBe(true);
  });

  it("does not flag a mutual pair outside the window", () => {
    const received = [{ id: "r1", raterId: "u2", stars: 5, createdAt: t0 }];
    const given = [
      { subjectId: "u2", stars: 5, createdAt: new Date(t0.getTime() + 48 * 3600_000) },
    ];
    expect(detectReciprocal(received, given).size).toBe(0);
  });

  it("does not flag low-star exchanges", () => {
    const received = [{ id: "r1", raterId: "u2", stars: 3, createdAt: t0 }];
    const given = [{ subjectId: "u2", stars: 3, createdAt: t0 }];
    expect(detectReciprocal(received, given).size).toBe(0);
  });

  it("ignores one-directional ratings", () => {
    const received = [{ id: "r1", raterId: "u2", stars: 5, createdAt: t0 }];
    const given = [{ subjectId: "u9", stars: 5, createdAt: t0 }];
    expect(detectReciprocal(received, given).size).toBe(0);
  });
});
