import { NextResponse } from "next/server";
import { loadProfile } from "@/lib/profile";
import { REPUTATION_CONFIG, resolveTier, tierProgress } from "@/lib/reputation";

export const dynamic = "force-dynamic";

/**
 * Public, unauthenticated read of a computed score.
 *
 *   GET /api/v1/score/:handle
 *
 * Deliberately anonymous-ratings only: we expose the aggregate and the tier,
 * never who voted. Agents and clients can read a reputation without scraping
 * the UI.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  const profile = await loadProfile(handle);

  if (!profile) {
    return NextResponse.json(
      { error: "not_found", message: `No existe el perfil @${handle}` },
      { status: 404 },
    );
  }

  const { user, score, tier, progress } = profile;

  return NextResponse.json(
    {
      handle: user.handle,
      displayName: user.displayName,
      score: score.score,
      tier: tier.name,
      tierLabel: tier.label,
      confidence: score.confidence,
      sampleSize: score.sampleSize,
      effectiveWeight: score.effectiveWeight,
      next:
        progress === null
          ? null
          : {
              tier: progress.next.name,
              pointsNeeded: progress.pointsNeeded,
              ratingsNeeded: progress.ratingsNeeded,
            },
      algorithm: {
        version: "1.0.0",
        priorScore: REPUTATION_CONFIG.priorScore,
        priorWeight: REPUTATION_CONFIG.priorWeight,
        halfLifeDays: REPUTATION_CONFIG.halfLifeDays,
        influenceExponent: REPUTATION_CONFIG.influenceExponent,
        reciprocityPenalty: REPUTATION_CONFIG.reciprocityPenalty,
      },
      computedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
