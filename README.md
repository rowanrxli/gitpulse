![GitPulse dashboard](docs/assets/gitpulse-home.webp)

<div align="center">

# GitPulse

### Discover what’s next.

**An open-source GitHub radar for finding promising repositories before everyone else does.**

[Live GitPulse](https://gitpulse-radar.zl02903-5-8218.chatgpt.site) · [How Pulse works](docs/pulse-algorithm.md) · [Early discovery](docs/early-discovery.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md)

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/rowanrxli/gitpulse/gitpulse-sync.yml?branch=main&label=daily%20sync)
![CI](https://img.shields.io/github/actions/workflow/status/rowanrxli/gitpulse/ci.yml?branch=main&label=tests)
![GitHub License](https://img.shields.io/github/license/rowanrxli/gitpulse)
![GitHub Repo stars](https://img.shields.io/github/stars/rowanrxli/gitpulse?style=flat)

</div>

---

GitHub already tells you what is popular. GitPulse is built to surface **momentum**: repositories that are growing quickly, accelerating, or showing unusual activity relative to projects at a similar age.

Instead of ranking only by total stars, GitPulse combines recent star velocity, acceleration, relative growth, and activity into a transparent **Pulse Score**.

## What you can explore

- **Rising** — repositories with strong current momentum.
- **Hidden gems** — smaller projects showing outsized signal.
- **Newborn** — very young repositories worth watching early.
- **Accelerating** — projects whose latest growth is moving above their recent baseline.
- **Signal Spotlight** — one repository with especially interesting momentum.
- **Repository detail pages** — star momentum, cohort context, Pulse components, recent activity, and deterministic **Why it’s rising** explanations.

The public explorer is read-only. Collection controls, rate-limit diagnostics, job state, and server details stay behind the administrator surface.

## Pulse Score

Pulse is designed to answer a narrower question than “what is the biggest repository?”:

> **Which tracked repositories are gaining meaningful momentum right now?**

The current score is cohort-relative and uses:

| Signal | Weight |
| --- | ---: |
| Latest complete day velocity | 35% |
| Seven-day velocity | 25% |
| Acceleration vs. previous seven-day baseline | 20% |
| Relative seven-day growth | 10% |
| Recent push activity | 10% |

Repositories are compared with tracked peers in the same age cohort:

`0–7 days` · `8–30 days` · `31–180 days` · `181+ days`

A cohort needs enough valid history before a numeric score is shown. Missing history stays unknown — it is never silently converted into zero growth.

See **[docs/pulse-algorithm.md](docs/pulse-algorithm.md)** for the scoring details and limitations.

## Architecture

```text
                         GitHub API
                            │
                            ▼
                    incremental collector
                 cache · ETags · cooldowns
                            │
                            ▼
                     Cloudflare D1
                    history + job state
                     │             │
          ┌──────────┘             └──────────┐
          ▼                                   ▼
     Pulse engine                        /api/repos
          │                                   │
          ▼                                   ▼
  Rising / Gems / Newborn                Public explorer
  Accelerating / Spotlight

Admin /admin ───────► /api/admin/sync ───────┐
                                              ├─► same collector
GitHub Actions ─────► /api/cron/sync ────────┘
                      Bearer secret
```

Manual and scheduled refreshes enter the same durable collector. The job runner uses single-flight protection, cooldowns, continuation IDs, persisted progress, and stale-data preservation so an interrupted update does not wipe previously valid observations.

## Features

- Read-only public GitHub radar with search, language filters, growth windows, and detail pages.
- Transparent Pulse Score with age-cohort comparison.
- Incremental metadata and star-history collection.
- Private early-discovery candidate pool that scans for young and recently active smaller repositories without exposing them publicly before promotion.
- ETag-aware caching and resumable progress.
- GitHub primary and secondary rate-limit handling.
- Previously valid history remains available when a refresh fails.
- Protected administrator dashboard with **Sync now** and diagnostics.
- Protected machine endpoint for scheduled sync.
- Cloudflare D1 / SQLite persistence with Drizzle migrations.
- GitHub Actions scheduler with manual `workflow_dispatch`.

## Daily sync

The official deployment can be refreshed through:

```http
POST /api/cron/sync
Authorization: Bearer <SYNC_CRON_SECRET>
```

The repository includes `.github/workflows/gitpulse-sync.yml`.

To enable it for your own deployment, configure:

| GitHub Actions setting | Type | Value |
| --- | --- | --- |
| `GITPULSE_SCHEDULER_ENABLED` | Repository variable | `true` |
| `GITPULSE_ORIGIN` | Repository variable | Your deployed HTTPS origin |
| `SYNC_CRON_SECRET` | Repository secret | Same secret configured on the server |

The checked-in schedule defaults to **09:00 UTC daily** and can also be triggered manually from GitHub Actions.

No real token or secret is stored in this repository.

## Local development

Prerequisites:

- Node.js **22.13+**
- pnpm **11.25**

```sh
cp .env.example .env
pnpm install
pnpm dev
```

Run tests and checks:

```sh
node --experimental-strip-types --test tests/*.test.ts
pnpm lint
pnpm build
```

After a build, the local Cloudflare/D1 server can be started with:

```sh
pnpm start
```

The local Sites adapter provides a loopback-only development identity. It is not suitable as production authentication.

### Local D1 migration

After `pnpm build` creates `dist/server/wrangler.json`:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js \
  d1 execute DB --local --config dist/server/wrangler.json \
  --persist-to .wrangler/state --file drizzle/0000_messy_captain_britain.sql
```

Apply later migration files once, in filename order.

## Environment variables

`.env.example` contains names only. Keep actual values in local untracked files or the deployment platform's server-side secret store.

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | Authenticated GitHub API access; server-only. |
| `ADMIN_USER_IDS` | Comma-separated verified platform user IDs allowed into `/admin`. |
| `ADMIN_EMAILS` | Fallback verified-email allowlist for administrators. |
| `ADMIN_SYNC_SECRET` | Optional machine credential for administrator sync access. |
| `SYNC_CRON_SECRET` | Least-privilege credential for `POST /api/cron/sync`. |
| `SYNC_COOLDOWN_SECONDS` | Minimum delay between successful collection jobs. |
| `SYNC_SCHEDULE_UTC` | Intended daily schedule time. |
| `GITPULSE_ORIGIN` | Deployed HTTPS origin used by the scheduler script. |

Never commit `.env`, GitHub tokens, cron secrets, database snapshots, or platform credentials.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Repository radar |
| `/repo/:owner/:name` | Public | Repository detail |
| `/admin` | Admin | Collection status and controls |
| `GET /api/admin/status` | Admin | Diagnostics and job state |
| `POST /api/admin/sync` | Admin | Manual refresh |
| `POST /api/cron/sync` | Machine secret | Scheduled refresh |
| `POST /api/sync` | Admin | Compatibility alias |

The public API projection intentionally excludes credentials, ETags, GitHub quota diagnostics, retry details, and internal job state.

## Project structure

```text
app/                 Pages and API routes
components/          Public explorer and admin UI
db/                  Drizzle schema
drizzle/             Ordered D1 / SQLite migrations
lib/                 GitHub client, collector, scoring, jobs, storage
scripts/             Runtime helpers and external sync runner
tests/               Access, history, scoring, and collector tests
.github/workflows/   Scheduled GitHub Actions workflow
docs/                Algorithm and project documentation
```

## Deployment notes

The published version currently uses the Sites/Vinext runtime with a Cloudflare D1 binding named `DB`.

`.openai/hosting.json` intentionally contains a placeholder project ID. Hosted data and deployment secrets are not part of this source repository.

`app/chatgpt-auth.ts` consumes verified identity headers supplied by the current hosting environment. If you deploy GitPulse somewhere else, replace that adapter with the target host's verified session or JWT integration before enabling administrator routes.

## Roadmap

- [x] Add a private, bounded candidate-discovery pass beyond the original watchset.
- [ ] Promote evidence-backed early signals from the private pool to the public radar.
- [x] Add deterministic “Why it’s rising” explanations and administrator-only early-signal previews.
- [ ] Promote evidence-backed candidates and use them to power a Daily Radar view.
- [ ] Improve category explanations and per-signal context.
- [ ] Add richer historical comparisons without hiding missing data.
- [ ] Make self-hosting outside the current Sites runtime simpler.
- [ ] Add more contributor-facing documentation and test fixtures.

## Contributing

Contributions are welcome. For scoring changes, keep the algorithm deterministic, document weight or cohort changes, and add tests.

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [CHANGELOG.md](CHANGELOG.md), [SYNC.md](SYNC.md), and [PRODUCTION.md](PRODUCTION.md).

## License

GitPulse is released under the [MIT License](LICENSE).

---

<div align="center">

**Less noise. More signal.**

</div>
