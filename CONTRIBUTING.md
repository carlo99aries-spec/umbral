# Contributing

Thanks for wanting to build this. Umbral is meant to be argued with in code.

## Before you start

- Read [`README.md`](./README.md) and [`ETHICS.md`](./ETHICS.md). The ethics file is not decoration — some PRs are rejected for what they add, not how they're written.
- AI agents: read [`AGENTS.md`](./AGENTS.md) too.
- Check open issues and PRs so you don't duplicate work.

## Setup

```bash
git clone https://github.com/carlo99aries-spec/umbral.git
cd umbral
npm install
cp .env.example .env
npm run db:push
npm run seed
npm run dev
```

Demo password: `umbral-demo`.

## Workflow

1. Open an issue first for anything larger than a typo. It saves you a rejected PR.
2. Fork, branch from `main`: `feat/short-description` or `fix/short-description`.
3. Keep the change small. One concern per PR.
4. Run the full check before opening the PR:

```bash
npm test && npm run typecheck && npm run build
```

5. In the PR body: what changed, why, what you ran, and any invariant from `AGENTS.md` you touched.

## Where help is most useful

| Area | Difficulty | Notes |
|---|---|---|
| Collusion cluster detection (v0.3) | Hard | Graph analysis over rater/subject edges. The current pairwise rule is trivially bypassed by three accounts. |
| Appeals flow (v0.4) | Medium | Needs a data model and a public audit trail, not just a button. |
| Postgres + Docker Compose (v0.6) | Medium | The Prisma schema already avoids engine-specific types. |
| Accessibility pass | Easy-medium | Focus states, ARIA on the star picker, colour contrast on tier badges. |
| Spanish copy review | Easy | The UI is Spanish; native speakers welcome. |
| Documentation of failure modes | Easy | Add a row to `ETHICS.md` §4 with evidence. |

## Code style

- TypeScript strict, no `any`.
- Prettier defaults are fine; there is no enforced linter config yet (a `good first issue`).
- Comments explain *why*, not *what*. The reputation engine is commented densely on purpose.

## Commits

```
feat(reputation): penalise reciprocal pairs inside 24h
fix(auth): expire sessions on password change
docs(ethics): document cluster-detection gap
```

## Review standards

A PR merges when:

- tests are green and the change is covered;
- it doesn't violate an invariant in `AGENTS.md`;
- the PR body explains the user-visible effect;
- for engine changes, the behavioural difference is demonstrated by a test.

## Reporting harm

Deployments that use this to score real people in ways that cause harm should be reported with an issue titled `[MISUSE]`. See [`ETHICS.md`](./ETHICS.md) §7.

Security vulnerabilities: [`SECURITY.md`](./SECURITY.md), privately.
