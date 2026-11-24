# Umbral

> Every interaction is rated. Your average is the key.

**Umbral** is an open-source social network where every real interaction ends with a 1–5 star rating. Your score is not a plain average — it is a **weighted, time-decayed, collusion-aware** number, and it decides what you can access.

Inspired by *Nosedive* (*Black Mirror*, S3E1). It is not a tribute. It is a working critique you can run locally and argue with.

[![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Tests](https://img.shields.io/badge/tests-28%20passing-brightgreen)](./tests)

---

## Why this exists

Reputation systems already run our lives. Your Uber rating decides whether a driver accepts you. Your credit score decides your rent. Your "engagement" decides what you see. All of them are closed, unauditable, and unarguable.

Umbral takes the most uncomfortable version of that idea — the one everyone remembers from a TV episode — and makes it **transparent**:

- The formula is four lines of code and a test suite.
- Every rating's contribution can be inspected.
- The gates are public and hard-coded.
- Anyone can fork it and prove it's wrong.

That is the point: a social-credit system you can read is a social-credit system you can refuse.

## The engine

```
score = (priorScore·priorWeight + Σ wᵢ · decayᵢ · penaltyᵢ · starsᵢ)
      / (priorWeight          + Σ wᵢ · decayᵢ · penaltyᵢ)
```

| Term | What it does | Default |
|---|---|---|
| `priorScore` / `priorWeight` | New accounts start at 3.50, and one 5★ cannot mint a 5.00 account | `3.5` / `3.0` |
| `wᵢ` = rater influence | `(raterScore / 3.5)^1.6`, clamped to `[0.05, 2.0]`. A 4.8 rater counts ~1.8× a 3.5 rater; a 2.5 rater counts ~0.55× | see `REPUTATION_CONFIG` |
| `decayᵢ` | `0.5^(ageDays / 90)` — history fades, you must keep being liked | 90-day half-life |
| `penaltyᵢ` | `0.35` for reciprocal 5★ pairs within 24 h | `0.35` |

The cruelty is structural, not decorative: **fall, and your own opinion of others is worth less.**

Tiers are hard gates, not badges:

| Tier | Score | Min ratings | Unlocks |
|---|---|---|---|
| Platino | 4.50 | 25 | priority lists, unrestricted access, 10 codes/day |
| Oro | 4.20 | 15 | bookings, 5 codes/day |
| Plata | 3.80 | 8 | general access, 3 codes/day |
| Bronce | 3.00 | 0 | public access, 1 code/day |
| Restringido | <3.00 | 0 | read-only, invisible in search |

## How a rating happens

1. After a real interaction, you generate a **single-use code** valid for 24 hours (`/rate/<code>`).
2. The other person opens the link and rates you 1–5 plus an optional private note.
3. Their vote's weight is fixed by **their own score at that moment**; mutual 5★ exchanges within 24 h are penalized.
4. Rates are limited: one rating per person per 30 days, and daily code allowances by tier.

No code, no rating. You cannot be rated by someone you never met — at least not without them asking you for a code first.

## Features (v0.1 — walking skeleton)

- Email + password auth with server-side sessions (bcrypt, httpOnly cookie)
- Public profiles with computed score, tier, confidence and next-tier progress
- Interaction-code rating flow with single-use/expiry enforcement
- Anonymised rating history with per-vote weight and reciprocity flags
- Tier-gated daily code allowances
- Reporting flow for harassment, impersonation and rating manipulation
- Read-only public API: `GET /api/v1/score/:handle`
- 28 unit tests covering the reputation engine

## Quick start

```bash
git clone https://github.com/carlo99aries-spec/umbral.git
cd umbral
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run db:push
npm run seed              # optional: 8 demo profiles
npm run dev
```

Open <http://localhost:3000>. Demo accounts are seeded with password `umbral-demo`
(`@lacie`, `@naomi`, `@chester`, `@ryan`, `@susan`, `@greg`, `@karen`, `@paul`).

```bash
npm test          # reputation engine
npm run typecheck # tsc --noEmit
npm run build     # production build
```

## Architecture

```
prisma/schema.prisma        User, Session, Rating, InteractionToken, Report
src/lib/reputation.ts       ★ the engine — pure functions, no I/O, fully tested
src/lib/profile.ts          loads a profile and computes its score on read
src/lib/actions.ts          server actions: signup, login, rate, codes, reports
src/app/u/[handle]          public profile
src/app/rate/[code]         rating flow
src/app/settings            account, codes, transparency
src/app/api/v1/score/[h]    public read-only score API
scripts/seed.ts             reproducible demo population
tests/reputation.test.ts    28 tests
```

Scores are computed **on read**, never stored, so the number can never drift from its evidence. If that ever becomes a hot path, add a versioned cache — not a denormalised column without a rebuild job.

## Public API

```bash
curl http://localhost:3000/api/v1/score/naomi
```

```json
{
  "handle": "naomi",
  "score": 4.36,
  "tier": "GOLD",
  "confidence": 0.83,
  "sampleSize": 41,
  "next": { "tier": "PLATINUM", "pointsNeeded": 0.14, "ratingsNeeded": 0 },
  "algorithm": { "version": "1.0.0", "halfLifeDays": 90, "influenceExponent": 1.6 }
}
```

## Roadmap

- [x] **v0.1** walking skeleton — engine, auth, rating flow, tiers, API, tests
- [ ] **v0.2** dynamic influence: recompute rater weights at read time instead of snapshotting at write time
- [ ] **v0.3** web-of-trust graph and collusion clusters (rings, not just pairs)
- [ ] **v0.4** appeals: contest a rating, with a public audit trail
- [ ] **v0.5** algorithm versioning + changelog so score changes are explainable
- [ ] **v0.6** Postgres + one-command deploy (Docker Compose)
- [ ] **v0.7** installable PWA
- [ ] **v1.0** federation (ActivityPub) — because a reputation you can't leave is not a reputation, it's a leash

## Contributing — humans and AI agents

Both are first-class here. Read [`AGENTS.md`](./AGENTS.md) if you are an AI agent or pair-programming with one; read [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the workflow.

Ground rules:

1. **The engine is a contract.** Any change to `src/lib/reputation.ts` needs a test that fails before and passes after.
2. **No dark patterns.** Anything that increases anxiety without increasing information is rejected.
3. **The algorithm is public.** If you change a constant, say why in the PR.
4. **Nothing about a real person leaves this repo.** No scraped data, ever.

## Ethics

Read [`ETHICS.md`](./ETHICS.md). Short version: this is a critique, not a product for scoring real people. It ships with anti-collusion, anonymity and reporting *because a system without them is not a critique — it is a weapon.*

## License

[AGPL-3.0-or-later](./LICENSE). If you run a modified Umbral as a network service, you publish your changes. Same deal as Mastodon.

---

## Estado (ES)

Umbral es una red social experimental de reputación ponderada: cada interacción real termina en una calificación de 1 a 5, y tu promedio —ajustado por quién te califica y por cuándo— decide a qué puertas puedes entrar.

Es software libre, crítico de sí mismo y auditable. El motor de reputación vive en `src/lib/reputation.ts`, tiene 28 pruebas y no cambia sin un commit público.

Rama principal: `main`. Issues abiertos para cualquiera que quiera construir la alternativa.
