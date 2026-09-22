# Early discovery

GitPulse is designed to find unusual open-source momentum before total star count becomes the obvious signal.

The early-discovery layer is intentionally separate from the public Pulse Score. Pulse needs a longer history window and enough same-age peers for cohort ranking. Early discovery is allowed to work with a shorter observation window, but it uses explicit thresholds and never invents missing data.

## Candidate lifecycle

New repositories found by the bounded GitHub search pass are stored privately:

`candidate -> tracking -> surfaced / rejected`

- **candidate** — first seen by GitPulse; discovery time, stars, repository age, source, and search lane are recorded.
- **tracking** — at least some current star history has been collected.
- **surfaced** — reserved for a later explicit promotion step.
- **rejected** — reserved for candidates that no longer meet the product's tracking criteria.

Candidate and tracking repositories are excluded from the public `/api/repos` projection.

## Discovery lanes

The current discovery pass searches two bounded lanes:

1. **newborn** — repositories created in the last 21 days with 20 to 5,000 stars.
2. **active-small** — repositories created in the last 180 days, pushed in the last 3 days, and still between 20 and 5,000 stars.

Forks and archived repositories are excluded. A run scans a small first page only, adds at most 30 unseen repositories, and caps the hidden candidate pool at 180.

## Early-signal labels

These labels are deterministic preview rules. They are visible only to administrators for now.

### EARLY BREAKOUT

Requires:

- current star history;
- a push within the last 7 days;
- repository age <= 14 days;
- at least 3 complete daily buckets;
- latest complete day >= 50 stars;
- latest 3 complete days >= 100 stars;
- recent relative growth >= 20%.

### ACCELERATING

Requires:

- current star history;
- a push within the last 7 days;
- an available prior daily baseline;
- latest-day acceleration >= 2x;
- latest complete day >= 30 stars;
- latest 3 complete days >= 60 stars.

### EMERGING

Requires:

- current star history;
- a push within the last 7 days;
- repository age <= 30 days;
- at least 3 complete daily buckets;
- latest 3 complete days >= 50 stars;
- recent relative growth >= 15%.

Anything else remains **WATCHING**.

These are not predictions of long-term quality or success. They are filters for unusual near-term momentum.

## Why it's rising

Public repository detail pages use the same transparent philosophy. GitPulse explains observable facts such as:

- latest complete-day star additions;
- 7-day star additions;
- acceleration versus the recent baseline;
- repository age;
- relative growth;
- same-age cohort velocity when enough peers exist.

The explanation is generated deterministically from collected metrics. It does not use an LLM and does not add a second hidden score.

## What comes next

The current release intentionally stops before automatic promotion. The private candidate pool should accumulate real observations first. Once the preview rules prove useful, an explicit promotion policy can move evidence-backed candidates to the public radar and later power Daily Radar.
