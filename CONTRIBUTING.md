# Contributing

Keep scoring changes in `lib/scoring.ts` with deterministic tests. Document changes to weights or cohort boundaries. Never substitute missing history with invented values. Run the scoring tests, type checking, and production build before opening a pull request. Keep secrets out of source control. Add database changes with a new Drizzle migration; do not edit an applied migration.
