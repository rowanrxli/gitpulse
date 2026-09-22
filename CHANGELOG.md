# Changelog

All notable changes to GitPulse are documented here.

## [Unreleased]

### Added

- Private early-discovery candidate pool with bounded GitHub repository search.
- Discovery metadata including first-seen time, stars at discovery, age at discovery, source, and search lane.
- Candidate lifecycle groundwork: newly discovered repositories remain private as `candidate`, then move to `tracking` after history arrives.
- Administrator visibility into candidate counts and the latest discovery pass.
- Public API filtering that keeps candidate and tracking repositories off the radar until an explicit promotion rule is added.

## [0.2.0] - 2026-09-22

### Added

- Public repository radar with Rising, Hidden gems, Newborn, and Accelerating views.
- Transparent cohort-relative Pulse Score.
- Signal Spotlight and repository detail pages.
- Incremental GitHub metadata and star-history collection.
- ETag-aware caching, resumable progress, persisted cooldowns, and stale-data preservation.
- Administrator dashboard with collection status and manual Sync now control.
- Machine-authenticated `POST /api/cron/sync` endpoint.
- Daily GitHub Actions scheduler plus manual workflow dispatch.
- Server-side separation between administrator and cron credentials.
- Cloudflare D1 / SQLite persistence with Drizzle migrations.
- Open-source documentation, scoring documentation, and MIT license.
- Lightweight CI workflow for deterministic collector, history, access-policy, and scoring tests.

### Security

- Public responses exclude credentials, ETags, GitHub quota diagnostics, retry details, and internal job state.
- Sync routes use server-side authorization.
- Cron and administrator machine credentials are separate.
- No production token, secret, hosted database snapshot, or personal deployment credential is included in the repository.

### Notes

Pulse Score is relative to repositories currently tracked by GitPulse. It is not a ranking of all GitHub repositories and does not claim to predict long-term project success.
