#!/usr/bin/env bash
# Smoke test: hits public + auth routes and asserts they return sane statuses.
# Run against the local dev server: scripts/smoke.sh
set -u
BASE="${BASE:-http://localhost:8080}"
fail=0
check() {
  local path="$1"; local expect_re="$2"; local note="${3:-}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path")
  if [[ "$code" =~ $expect_re ]]; then
    printf "  ok   %-45s %s  %s\n" "$path" "$code" "$note"
  else
    printf "  FAIL %-45s %s (want %s) %s\n" "$path" "$code" "$expect_re" "$note"
    fail=$((fail+1))
  fi
}

echo "→ Public marketing & tenant routing"
check "/" "200|307" "marketing root"
check "/?school=unknown-slug" "200|404" "unknown tenant slug"
check "/login" "200|307" "login page"
check "/auth" "200" "auth page"
check "/super-admin-bootstrap" "200" "bootstrap"

echo "→ CMS empty-state pages (anonymous request, should still render or redirect)"
for slug in unknown-slug demo test; do
  check "/?school=$slug" "200|404" "tenant=$slug"
done

echo "→ Protected dashboards (expect redirect to /auth or 200 client-rendered)"
for path in \
  /admin/dashboard /admin/students /admin/teachers /admin/cms \
  /admin/settings /admin/fees \
  /teacher/dashboard /teacher/attendance \
  /student/dashboard /student/attendance \
  /parent/dashboard /bursar/dashboard /hq/dashboard \
  /super-admin/dashboard
do
  check "$path" "200|307|401" ""
done

echo "→ Webhook endpoint signature gate"
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H 'content-type: application/json' \
  -d '{"event":"charge.success","data":{"reference":"x"}}' "$BASE/api/public/webhooks/paystack")
if [[ "$code" == "401" || "$code" == "503" ]]; then
  echo "  ok   /api/public/webhooks/paystack  $code  (rejected unsigned)"
else
  echo "  FAIL /api/public/webhooks/paystack  $code  (want 401 or 503)"; fail=$((fail+1))
fi

echo
if [[ $fail -gt 0 ]]; then
  echo "✗ $fail check(s) failed"; exit 1
fi
echo "✓ all smoke checks passed"
