# GitPulse production operations

The public explorer is read-only. `/api/repos` returns an explicit product-data projection, never sync diagnostics, credentials or ETags. A failed refresh preserves existing repository payloads and history. Pulse, the four categories and Spotlight use the existing scoring implementation.

## Administrator access

`/admin` starts Sites' dispatch-owned Sign in with ChatGPT flow. Every admin page and API request is authorized on the server against `ADMIN_USER_IDS` (preferred) or `ADMIN_EMAILS`. The dispatcher supplies verified identity headers; these are trusted only behind Sites dispatch. A migration to a different host MUST replace this identity adapter with that host's verified session/JWT authentication before serving admin routes. Never trust arbitrary client identity headers on a directly exposed origin.

Browser writes also require the same Origin. Origin is CSRF protection, never the authentication mechanism. Optional `ADMIN_SYNC_SECRET` grants machine administrator access via Bearer authorization; it must have at least 32 random characters. The independent `SYNC_CRON_SECRET` authorizes only the cron endpoint. Neither secret is embedded in HTML, client code, URLs, cookies or diagnostic responses. No app-owned password or browser secret input is used.

## Collection jobs

Admin `POST /api/admin/sync`, legacy `POST /api/sync` and scheduler `POST /api/cron/sync` all enter the same durable job runner. It calls the existing collector without replacing its queue, incremental histories, ETags, caches or error handling. An atomic D1 lease protects the complete invocation, including every batch. A second caller receives 409 while busy. Completed jobs default to a 15-minute configurable cooldown; calls within one second are also rate limited. The `production-job` row in the existing `sync_control` table stores job state independently of repository history. No schema reset or data backfill is required.

202 means more batches remain. Continue with `{ "jobId": "<returned id>" }`; successful completion returns 200 and `done: true`. On 429 or `paused: true`, observe `Retry-After` / `retryAt` and stop until permitted. A disconnected caller leaves durable progress; after its five-minute lease expires a new invocation resumes. Completed job IDs are idempotent. Unknown exceptions become `unknown_error` at the job level; classified GitHub failures retain their original types in admin diagnostics.

## Scheduling: not registered

The current Sites integration exposes no native Worker cron-registration operation. ChatGPT task reminders are not a durable HTTP cron service and have not been presented as one. No native scheduled handler, browser timer, page visit or simulated schedule is used to claim daily execution.

`SYNC_SCHEDULE_UTC` is the intended daily UTC time (default 09:00); changing it does not register or reschedule a remote service. This source tree includes a GitHub Actions workflow at `.github/workflows/gitpulse-sync.yml`; enable it only after configuring `GITPULSE_SCHEDULER_ENABLED`, `GITPULSE_ORIGIN`, and the server-side `SYNC_CRON_SECRET`. The runner follows continuation IDs, stops on rate limits and prints only safe result summaries.\n\nFor stateless external schedulers, use `POST /api/cron/tick` with the same Bearer secret. The tick endpoint inspects durable job state itself: it starts a new cycle when appropriate, resumes an unfinished cycle without the caller carrying a `jobId`, and turns cooldown/concurrency windows into successful no-op responses. This makes it safe for a simple scheduler to call several times in a bounded window (for example every five minutes for 30-45 minutes around the intended daily collection time) until the durable sync finishes. The existing `/api/cron/sync` continuation protocol remains available for stateful callers such as the GitHub runner.

## Validation

Run `node --experimental-strip-types --test tests/*.test.ts`, TypeScript no-emit checking and the production build. Test anonymous and non-admin writes, forged identity headers through the real dispatch, administrator access, overlapping admin/cron requests, cooldown and public projection. Retain all applied migrations unchanged.

No production runtime export, credential, personal allowlist or database snapshot belongs in the source repository. `.env.example` contains variable names with empty values only. Keep the existing source hosting and production deployment flow; configure a separate deployment when publishing this source copy.
