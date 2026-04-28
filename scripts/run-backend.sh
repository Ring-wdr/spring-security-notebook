#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${REPO_ROOT}/backend"
ENV_FILE="${REPO_ROOT}/.env"
DEV=0
SKIP_INFRA=0
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dev)
      DEV=1
      shift
      ;;
    --skip-infra)
      SKIP_INFRA=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --env-file)
      if [[ $# -lt 2 ]]; then
        echo "--env-file requires a path" >&2
        exit 1
      fi
      ENV_FILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: bash scripts/run-backend.sh [--dev] [--skip-infra] [--dry-run] [--env-file PATH]" >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Environment file not found: ${ENV_FILE}" >&2
  exit 1
fi

trim() {
  printf '%s' "$1" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'
}

import_env_file() {
  local path="$1"
  local line trimmed name value first_char last_char

  while IFS= read -r line || [[ -n "${line}" ]]; do
    trimmed="$(trim "${line}")"

    if [[ -z "${trimmed}" || "${trimmed}" == \#* ]]; then
      continue
    fi

    if [[ "${trimmed}" != *"="* ]]; then
      continue
    fi

    name="$(trim "${trimmed%%=*}")"
    value="$(trim "${trimmed#*=}")"

    if [[ ${#value} -ge 2 ]]; then
      first_char="${value:0:1}"
      last_char="${value: -1}"
      if [[ ("${first_char}" == '"' && "${last_char}" == '"') || ("${first_char}" == "'" && "${last_char}" == "'") ]]; then
        value="${value:1:${#value}-2}"
      fi
    fi

    export "${name}=${value}"
  done < "${path}"
}

import_env_file "${ENV_FILE}"

if [[ -z "${APP_JWT_SECRET:-}" ]]; then
  echo "APP_JWT_SECRET is missing. Set it in ${ENV_FILE}." >&2
  exit 1
fi

if [[ ${#APP_JWT_SECRET} -lt 32 ]]; then
  echo "APP_JWT_SECRET must be at least 32 characters for JWT HMAC security." >&2
  exit 1
fi

if [[ ${DEV} -eq 1 ]]; then
  export SPRING_PROFILES_ACTIVE=dev
fi

echo "Loaded environment from ${ENV_FILE}"
echo "Backend directory: ${BACKEND_DIR}"
if [[ ${DEV} -eq 1 ]]; then
  echo "Spring profile: dev"
fi

if [[ ${DRY_RUN} -eq 1 ]]; then
  echo "Dry run enabled. No commands were executed."
  exit 0
fi

if [[ ${SKIP_INFRA} -eq 0 ]]; then
  echo "Starting local infrastructure with docker compose..."
  docker compose --project-directory "${REPO_ROOT}" -f "${REPO_ROOT}/compose.yaml" up -d --wait
fi

cd "${BACKEND_DIR}"
echo "Starting Spring Boot backend..."
./mvnw spring-boot:run
