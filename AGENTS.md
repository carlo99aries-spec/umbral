# AGENTS.md

Instructions for AI coding agents (and humans pairing with one) working on this repository. Read `README.md` for what the project is and `ETHICS.md` before touching anything user-facing.

## Repository map

| Path | What lives there | Safe to edit? |
|---|---|---|
| `src/lib/reputation.ts` | The scoring engine. Pure functions, no I/O. | **Carefully** — tests required |
| `tests/reputation.test.ts` | 28 tests over the engine | Add freely, never delete an assertion to make CI pass |
| `src/lib/profile.ts` | Loads a profile and computes its score | Yes |
| `src/lib/actions.ts` | Server actions (signup, login, rate, codes, reports) | Yes |
| `src/lib/auth.ts` | Sessions, password hashing, handle normalisation | Carefully |
| `src/app/**` | Next.js App Router pages and the public API | Yes |
| `prisma/schema.prisma` | Data model | Carefully — needs a migration note in the PR |
| `scripts/seed.ts` | Reproducible demo population | Yes |

## Setup

```bash
npm install
cp .env.example .env
npm run db:push
npm run seed
```

## Verify before you claim done

```bash
npm test           # must be green
npm run typecheck  # must be silent
npm run build      # must succeed
```

A change that does not pass all three is not finished. Never report success without having run them.

## Invariants — do not break these

1. **The engine stays pure.** No `prisma`, no `fetch`, no `Date.now()` inside `reputation.ts` except via the `now` parameter. It must remain testable without a database.
2. **Scores are computed on read.** Do not add a stored `score` column unless you also add a rebuild path and a version tag.
3. **Raters stay anonymous** to the rated person and in every public API response. A rating's `raterScore` is public; the rater's identity is not.
4. **No public leaderboard.** No "top users", no trending, no ranking page. This is an ethics rule, not a style preference.
5. **Every engine constant change comes with a test** that demonstrates the behavioural difference.
6. **No new runtime dependency** without a one-line justification in the PR body.

## Changing the algorithm

1. Write a failing test in `tests/reputation.test.ts` that captures the new intended behaviour.
2. Change `REPUTATION_CONFIG` or the function.
3. Make the test pass; keep all previous tests passing unless the PR explicitly argues one is now wrong.
4. Bump `algorithm.version` in `src/app/api/v1/score/[handle]/route.ts`.
5. Explain the user-visible effect in one paragraph, in the PR body.

## Conventions

- TypeScript strict. No `any` in new code; use `unknown` + narrow.
- Server Components by default; `"use client"` only when state or events are needed.
- Server Actions live in `src/lib/actions.ts` and return `ActionState`.
- Copy (UI text) is **Spanish**. Code, comments, docs and commit messages are **English**.
- Commits: `type(scope): imperative summary` — `feat(reputation): add cluster detection`.
- Keep diffs small and reviewable. One concern per PR.

## What to do when blocked

Do not invent a database, a service, or a credential. If something needs a decision about product or ethics, open a draft PR with the question in the body, or file an issue tagged `needs-decision`. Guessing at ethics is worse than pausing.

## If you are an agent opening a PR

State in the PR body:

- what you ran (`npm test`, `npm run typecheck`, `npm run build`) and the result;
- which invariant from this file your change touches, if any;
- anything you could not verify.

That is enough. Do not paste the whole transcript.
