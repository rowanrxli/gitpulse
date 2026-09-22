# GitPulse

GitPulse is a GitHub repository radar for finding early momentum with less
noise. The public explorer keeps the production visual language and signals:
Rising, Hidden gems, Newborn, Accelerating, Pulse Score, and Signal Spotlight.

This repository is a source-only distribution of the production application.
It contains no hosted database contents, GitHub token, administrator secret,
API key, or personal credential. The published Site is not changed by using
this copy.

## Features

- Read-only public explorer with search, language filters, time windows, and
  repository detail pages.
- Transparent Pulse Score calculations and the four signal categories.
- Incremental GitHub collection with bounded concurrency, cached history,
  ETag support, resumable progress, rate-limit handling, and stale-data
  preservation.
- Cloudflare D1/SQLite storage with Drizzle schema and immutable migrations.
- Protected `/admin` dashboard with status, diagnostics, and **Sync now**.
- Protected machine endpoint, `POST /api/cron/sync`, for an external daily
  scheduler. Single-flight, cooldown, and server-side rate limiting are shared
  by manual and scheduled syncs.

## Local development

Prerequisites: Node.js 22.13 or newer and pnpm 11.25 (the version in
`package.json`).

```sh
cp .env.example .env
pnpm install
pnpm dev
```

The local Sites adapter provides a loopback-only development identity. It is
not an authentication mechanism for a deployed application. To run the local
Cloudflare/D1 server after a build:

```sh
pnpm build
pnpm start
```

Run the tests and checks with:

```sh
node --experimental-strip-types --test tests/*.test.ts
pnpm lint
pnpm build
```

The first local D1 migration can be applied with Wrangler after `pnpm build`
creates `dist/server/wrangler.json`:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js \
  d1 execute DB --local --config dist/server/wrangler.json \
  --persist-to .wrangler/state --file drizzle/0000_messy_captain_britain.sql
```

Apply later migration files once, in filename order. Do not commit `.env`,
`.wrangler/`, build output, or local runtime state.

## Server environment

`.env.example` intentionally contains names only. Put actual values in local
untracked `.env` files or in the deployment's server-side secret store.

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | Optional authenticated GitHub API access; server-only. |
| `ADMIN_USER_IDS` | Comma-separated verified platform user IDs allowed into `/admin`. |
| `ADMIN_EMAILS` | Fallback verified-email allowlist for administrators. |
| `ADMIN_SYNC_SECRET` | Optional server-only bearer credential for administrator sync access. |
| `SYNC_CRON_SECRET` | Least-privilege bearer credential for `POST /api/cron/sync`. |
| `SYNC_COOLDOWN_SECONDS` | Minimum delay between successful collection jobs. |
| `SYNC_SCHEDULE_UTC` | Documentation/configuration value for the intended daily run time. |
| `GITPULSE_ORIGIN` | Deployed HTTPS origin used by the scheduler script. |

Never place any of these values in a browser setting, source file, workflow,
HTML response, or log. In particular, the GitHub token and cron secret are
read only by server-side code.

## Daily sync with GitHub Actions

The repository includes a safe, disabled template at
`.github/workflows/gitpulse-sync.yml`. It does not contain a secret. To enable
it in your own repository, configure:

1. repository variable `GITPULSE_SCHEDULER_ENABLED=true`;
2. repository variable `GITPULSE_ORIGIN` with the deployed HTTPS origin; and
3. repository secret `SYNC_CRON_SECRET` with the same value configured on the
   server.

The workflow defaults to 09:00 UTC and can be changed in the workflow file.
It calls `scripts/run-sync.mjs`, which sends:

```http
POST /api/cron/sync
Authorization: Bearer <SYNC_CRON_SECRET>
```

The endpoint does not require a ChatGPT user login. An invalid or missing
credential is rejected server-side. A run that is already active is reused or
rejected according to the saved single-flight job state; it never starts a
second concurrent collector.

The hosting platform used for the published version does not provide a
portable repository-level cron declaration in this source tree. The checked-in
workflow is therefore an external scheduler configuration, not a claim that a
platform-native timer is active.

## Routes

- `/` — public explorer.
- `/repo/:owner/:name` — public repository detail view.
- `/admin` — administrator dashboard; server-side identity/allowlist check.
- `GET /api/admin/status` — administrator-only diagnostics and job state.
- `POST /api/admin/sync` — administrator-only manual sync.
- `POST /api/cron/sync` — machine-authenticated scheduled sync.
- `POST /api/sync` — protected compatibility alias for the admin sync route.

The public page intentionally does not expose tokens, quota headers, HTTP
errors, retry times, or collector diagnostics. Those remain available only to
authorized administrators and server logs.

## Project structure

```text
app/                 Pages, API routes, and platform identity adapter
components/          Public explorer and administrator UI
db/                  Drizzle schema
drizzle/             Ordered D1/SQLite migrations and migration metadata
lib/                 GitHub client, collector, jobs, storage, and scoring
scripts/              Framework, environment, and external-sync helpers
tests/                Collector, history, access-policy, and scoring tests
.github/workflows/    Disabled GitHub Actions scheduler template
```

The score implementation in `lib/scoring.ts` and the stored history model are
kept intact. Unknown or insufficient history remains unknown and is never
converted into zero growth.

## ChatGPT Sites portability

The published deployment uses a Cloudflare D1 binding named `DB` and the
Sites/Vinext runtime. `.openai/hosting.json` contains a placeholder project ID;
replace it only when configuring your own Sites project. Hosted D1 data and
the Sites environment secrets are deliberately not part of this repository.

`app/chatgpt-auth.ts` consumes the verified identity headers supplied by Sites,
while the local Vite plugin supplies a loopback-only mock identity for
development. If you deploy to Vercel, Cloudflare, or another host, replace that
adapter with the host's verified session/JWT integration before enabling
administrator routes. Keep the collector and all secrets server-side.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md), [PRODUCTION.md](PRODUCTION.md), and
[SYNC.md](SYNC.md) for operational details. GitPulse is released under the
[MIT License](LICENSE).
