# Pulse Score

Pulse Score is GitPulse's cohort-relative momentum score.

It is intentionally not a measure of repository quality, long-term importance, or the probability that a project will become popular. It answers a narrower question:

> Among the repositories GitPulse is currently tracking at a similar age, which ones are showing stronger recent momentum?

## Inputs

The current score combines five signals.

| Signal | Weight | Description |
| --- | ---: | --- |
| Latest complete day velocity | 35% | Stars added in the newest complete daily bucket. |
| Seven-day velocity | 25% | Stars added across the latest seven complete daily buckets. |
| Acceleration | 20% | Latest complete day divided by the mean of the preceding seven complete days. |
| Relative seven-day growth | 10% | Seven-day growth relative to the repository's pre-window star base. |
| Recent push activity | 10% | Recency signal derived from the repository's latest push time. |

## Age cohorts

Repositories are only compared with tracked peers in the same repository-age cohort:

- 0–7 days
- 8–30 days
- 31–180 days
- 181+ days

This prevents a repository created yesterday from being compared directly with a mature project that has existed for years.

## Percentiles

Each signal is converted to a midrank percentile within the cohort.

Midrank handling means tied values receive the same percentile contribution rather than being arbitrarily ordered.

A cohort needs at least three repositories with valid history before Pulse is calculated.

## Missing data

GitPulse does not infer missing history as zero.

A repository can therefore appear with no numeric Pulse Score when:

- not enough complete daily history exists;
- the current history is stale;
- the previous seven-day baseline is zero, making acceleration undefined;
- the cohort does not contain enough valid peers.

Previously valid history is preserved if a later refresh fails.

## Star history

GitPulse stores calendar-day buckets returned by the configured GitHub history source.

These buckets are not described as rolling 24-hour star counts. A separate snapshot-based net 24-hour value may be shown when a sufficiently close historical snapshot exists.

## Important limitations

Pulse Score is relative to the repositories GitPulse currently tracks. It is **not** a percentile over all of GitHub.

Small cohorts can make the score directionally useful while still being statistically noisy.

Star growth is only one signal of open-source activity. GitPulse currently does not claim to measure code quality, maintainer health, user retention, funding, adoption, security, or long-term project viability.

## Implementation

The scoring implementation lives in:

```text
lib/scoring.ts
```

Collector and history behavior live primarily in:

```text
lib/sync-engine.ts
lib/history-cache.ts
lib/history.ts
```

Changes to weights, cohorts, validity rules, or missing-data behavior should be accompanied by deterministic tests in `tests/`.
