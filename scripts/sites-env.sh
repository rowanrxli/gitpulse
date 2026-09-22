#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)";runtime_root="${SITES_RUNTIME_ROOT:-${project_root}/.sites-runtime}"
mkdir -p "${runtime_root}/home" "${runtime_root}/npm-cache" "${runtime_root}/xdg-config" "${runtime_root}/tmp" "${runtime_root}/wrangler/logs"
export SITES_ENV_READY=1 SITES_PROJECT_ROOT="${project_root}" HOME="${runtime_root}/home" XDG_CONFIG_HOME="${runtime_root}/xdg-config" TMPDIR="${runtime_root}/tmp" WRANGLER_WRITE_LOGS=false WRANGLER_LOG_PATH="${runtime_root}/wrangler/logs" MINIFLARE_REGISTRY_PATH="${runtime_root}/wrangler/registry"
unset NPM_CONFIG_CACHE npm_config_cache || true;export npm_config_cache="${runtime_root}/npm-cache" npm_config_audit=false npm_config_fund=false npm_config_update_notifier=false
unset npm_config_proxy npm_config_http_proxy npm_config_https_proxy NPM_CONFIG_PROXY NPM_CONFIG_HTTP_PROXY NPM_CONFIG_HTTPS_PROXY || true
if [[ "${1:-}" == "--" ]]; then shift; fi
if [[ "$#" -eq 0 ]]; then echo "usage: scripts/sites-env.sh -- command [args...]" >&2; exit 64; fi
cd "${project_root}";exec "$@"
