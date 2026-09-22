# Security Policy

GitPulse handles server-side GitHub credentials and machine sync secrets. Please avoid opening a public issue for a suspected credential leak, authentication bypass, or other vulnerability that could expose private deployment information.

## Supported version

Security fixes are applied to the current `main` branch.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting feature for this repository when it is available:

**Security → Report a vulnerability**

If private vulnerability reporting is unavailable, contact the repository owner privately rather than posting exploit details in a public issue.

Please include:

- the affected route, file, or component;
- the conditions required to reproduce the issue;
- the observed and expected behavior;
- the likely impact;
- a minimal reproduction that does not contain real tokens or secrets.

## Secret handling

Never include any of the following in an issue, pull request, screenshot, test fixture, or log:

- `GITHUB_TOKEN`
- `SYNC_CRON_SECRET`
- `ADMIN_SYNC_SECRET`
- deployment cookies or authenticated session data
- database snapshots containing private deployment state

If a real credential is accidentally committed or posted publicly, revoke or rotate it immediately. Removing it from the latest commit is not sufficient because Git history may retain the value.

## Scope notes

The public GitPulse explorer is designed to expose repository signal data only. Administrator diagnostics and sync controls are server-authorized and should not be reachable solely by forging browser headers or an Origin header.

The current deployment's administrator identity adapter trusts verified identity headers supplied by the hosting platform. Deployments on other platforms must replace that adapter with the platform's verified session or JWT mechanism before enabling administrator routes.
