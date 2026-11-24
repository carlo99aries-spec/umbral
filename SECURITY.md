# Security Policy

## Reporting a vulnerability

Do **not** open a public issue. Send a private report:

- GitHub → **Security** → **Report a vulnerability** (private advisory) on this repository, or
- open an issue titled `[SECURITY] contact request` with no details, and a maintainer will reach out.

Include: affected version/commit, reproduction steps, impact, and whether you believe it is exploitable without an account.

You can expect an acknowledgement within 72 hours. This is a volunteer project; there is no bug bounty.

## In scope

- Authentication and session handling (`src/lib/auth.ts`)
- Authorization on server actions (`src/lib/actions.ts`)
- Rating manipulation: farming, Sybil accounts, code abuse, weight tampering
- Injection, XSS, CSRF, SSRF in the Next.js app
- Exposure of raters' identities or private rating notes
- Anything that lets a user read another user's email, password hash, or sessions

## Out of scope

- The ethics of the product itself — that's a discussion, use an issue.
- Rate limits on a self-hosted demo instance.
- Findings that require a compromised device or leaked password.

## Known limitations (not vulnerabilities)

- Collusion detection is pairwise only; coordinated rings of 3+ accounts can inflate a score. Tracked for v0.3.
- There is no email verification and no password reset flow in v0.1.
- Scores are computed on read; heavy instances should cache.

## For operators

If you deploy Umbral publicly, at minimum:

1. Set `NODE_ENV=production` (enables `Secure` cookies).
2. Use Postgres, not SQLite, and back it up.
3. Put it behind TLS.
4. Publish a retention and deletion policy — see `ETHICS.md` §5.
5. Rate-limit at the proxy. The app's own limits are product rules, not a DoS defence.
