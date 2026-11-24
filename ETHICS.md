# Ethics

Umbral reproduces, on purpose, a mechanism that has already hurt real people. This document says out loud what that mechanism does, what we shipped to blunt it, and where the line is.

**Read this before you deploy it anywhere.**

---

## 1. What Umbral is

- A **functional critique** of opaque reputation systems, built as working software.
- A **public, auditable** implementation of weighted social scoring.
- A **sandbox** for arguing about incentives: influence asymmetry, decay, reciprocity, gates.

## 2. What Umbral is not

- Not a service for scoring real people at scale.
- Not a credit, lending, hiring, housing, insurance, immigration or law-enforcement signal.
- Not a "trust and safety" product for third parties.
- Not a place to publish information about people who did not consent.

If you fork Umbral to decide who gets a loan, a job or a room, you are using a tool built to expose that logic against the people it was meant to protect. That is on you, and it is outside the intent of this project.

## 3. Known harms of reputation systems

These are documented, not hypothetical:

1. **Chilling effect.** When every interaction is scored, people stop saying true things. Public discourse flattens.
2. **Compounding disadvantage.** Scores track existing social capital. People already marginalised get rated lower for reasons unrelated to conduct, then lose access, then get rated lower.
3. **Harassment amplification.** A coordinated group can tank a target's score with little effort. Downward mobility is fast; recovery is slow.
4. **Anxiety and mental health cost.** A visible, moving number creates pressure that does not stop when you close the app.
5. **Gaming.** Where there is a score, there are farms. Then the score stops measuring anything except willingness to farm.
6. **Opacity.** Real systems hide their weights. That is what makes them unchallengeable.

## 4. What v0.1 actually does about it

| Harm | Mitigation shipped | Where |
|---|---|---|
| Harassment / brigading | One rating per person per 30 days; you must be given a single-use code by the target | `src/lib/actions.ts` |
| Collusion / farms | Reciprocal 5★ pairs within 24 h carry 0.35× weight and are flagged in the UI | `src/lib/reputation.ts` |
| Punishing newcomers | Bayesian prior (3.50, weight 3.0) prevents single votes from defining an account | `REPUTATION_CONFIG` |
| Permanent records | Ratings decay with a 90-day half-life and vanish after 2 years | `timeDecay()` |
| Retaliation | Raters are anonymous in the UI and API; you never see who scored you | `profile.ts`, `/api/v1/score` |
| Abuse reporting | Any profile can be reported; reports are stored, not auto-actioned | `Report` model, `ReportForm` |
| Ranking pressure | **No public leaderboard.** There is no "top users" page by design | — |
| Opaque algorithm | Formula, constants and tests are in the repo; the API echoes the algorithm version | `reputation.ts` |

Not fixed, and worth saying plainly:

- **Score visibility is still coercive.** Seeing your own number move is the anxiety. We kept it because removing it removes the object of critique.
- **Gates are still exclusion.** Tiers limit what you can do. That is the mechanic, not a bug.
- **Collusion detection is pairwise.** Rings of three or more are a v0.3 problem.
- **No appeals yet.** If someone tanks you unfairly, your options are reporting and time.

## 5. Data

- Stored: handle, display name, email, bcrypt password hash, bio, ratings (stars, weights, timestamps), interaction codes, reports.
- **Not** stored: geolocation, contacts, device fingerprints, advertising identifiers, IP addresses beyond what the server logs by default.
- Private rating notes are **not** shown publicly; they exist for moderation only.
- Raters are anonymous to the rated person and in the public API.
- Deletion: deleting an account cascades to its sessions and the ratings it received. Ratings it *gave* are anonymised by cascade. There is no "soft delete" that keeps the score alive.

If you run an instance, publish your own retention policy. Do not run this without one.

## 6. Rules for contributors

A change is rejected if it:

- adds a public leaderboard, ranking page, or "who's trending" surface;
- exposes raters' identities to the rated person;
- introduces advertising, tracking pixels or third-party analytics;
- adds a privilege gate below 3.00 without a written justification in the PR;
- makes the algorithm less explainable than it is today;
- includes data about real people who did not consent.

A change is welcome if it:

- makes manipulation harder without making the system less legible;
- gives users more control over their own data;
- adds an appeal or contest mechanism;
- documents a new failure mode honestly.

## 7. Reporting misuse

If you find a deployment of Umbral being used to score real people in a way that causes harm — employment, housing, credit, harassment at scale — open an issue titled `[MISUSE]` in this repository with the deployment URL. We will publish it, not hide it.

Security issues go to [`SECURITY.md`](./SECURITY.md), never a public issue.

---

*The uncomfortable part is the point. A reputation system that feels fine is the one you should worry about.*
