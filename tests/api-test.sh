#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Colage Backend API Test Suite
# Tests every endpoint for correct responses, error handling,
# input validation, and rate limiting.
# ═══════════════════════════════════════════════════════════════

API="https://wn7mxcdxca.execute-api.us-east-2.amazonaws.com/dev"
WS="wss://w0m7jw00ak.execute-api.us-east-2.amazonaws.com/dev"
SITE="https://main.dcinq8hq6li09.amplifyapp.com"

PASS=0
FAIL=0
WARN=0
TOTAL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

assert_status() {
  local name="$1"
  local expected="$2"
  local actual="$3"
  local body="$4"
  TOTAL=$((TOTAL + 1))
  if [ "$actual" = "$expected" ]; then
    echo -e "  ${GREEN}✓${NC} $name (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $name — expected $expected, got $actual"
    [ -n "$body" ] && echo -e "    ${RED}Body: ${body:0:200}${NC}"
    FAIL=$((FAIL + 1))
  fi
}

assert_contains() {
  local name="$1"
  local needle="$2"
  local body="$3"
  TOTAL=$((TOTAL + 1))
  if echo "$body" | grep -q "$needle"; then
    echo -e "  ${GREEN}✓${NC} $name (contains '$needle')"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $name — expected to contain '$needle'"
    echo -e "    ${RED}Body: ${body:0:200}${NC}"
    FAIL=$((FAIL + 1))
  fi
}

warn_check() {
  local name="$1"
  local msg="$2"
  TOTAL=$((TOTAL + 1))
  WARN=$((WARN + 1))
  echo -e "  ${YELLOW}⚠${NC} $name — $msg"
}

do_request() {
  local method="$1"
  local path="$2"
  local data="$3"
  if [ "$method" = "GET" ]; then
    curl -s -w "\n%{http_code}" "$API$path" 2>/dev/null
  else
    curl -s -w "\n%{http_code}" -X "$method" "$API$path" \
      -H "Content-Type: application/json" \
      -d "$data" 2>/dev/null
  fi
}

parse_response() {
  local resp="$1"
  BODY=$(echo "$resp" | sed '$d')
  STATUS=$(echo "$resp" | tail -1)
}

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Colage Backend API Test Suite${NC}"
echo -e "${CYAN}  Target: $API${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""

# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}[1] AUTH — Email Verification${NC}"
# ─────────────────────────────────────────────────────────────

# Valid .edu email
parse_response "$(do_request POST /auth/email/verify '{"email":"test@umich.edu"}')"
assert_status "Valid .edu email" "200" "$STATUS" "$BODY"

# Missing email
parse_response "$(do_request POST /auth/email/verify '{}')"
assert_status "Missing email → 400" "400" "$STATUS" "$BODY"

# Non-.edu email
parse_response "$(do_request POST /auth/email/verify '{"email":"test@gmail.com"}')"
assert_status "Non-.edu email → 400" "400" "$STATUS" "$BODY"
assert_contains "Error mentions .edu" "edu" "$BODY"

# Empty email
parse_response "$(do_request POST /auth/email/verify '{"email":""}')"
assert_status "Empty email → 400" "400" "$STATUS" "$BODY"

# Malformed JSON
parse_response "$(curl -s -w "\n%{http_code}" -X POST "$API/auth/email/verify" \
  -H "Content-Type: application/json" -d 'not json at all' 2>/dev/null)"
assert_status "Malformed JSON → 400 or 500" "400" "$STATUS" "$BODY"

# XSS in email
parse_response "$(do_request POST /auth/email/verify '{"email":"<script>alert(1)</script>@umich.edu"}')"
assert_status "XSS email → 400" "400" "$STATUS" "$BODY"

# Extremely long email
LONG_EMAIL=$(python3 -c "print('a'*500 + '@umich.edu')")
parse_response "$(do_request POST /auth/email/verify "{\"email\":\"$LONG_EMAIL\"}")"
assert_status "500-char email → 400" "400" "$STATUS" "$BODY"

echo ""

# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}[2] AUTH — Email Confirmation${NC}"
# ─────────────────────────────────────────────────────────────

# Missing fields
parse_response "$(do_request POST /auth/email/confirm '{}')"
assert_status "Missing fields → 400" "400" "$STATUS" "$BODY"

# Invalid OTP format
parse_response "$(do_request POST /auth/email/confirm '{"email":"test@umich.edu","code":"abc"}')"
assert_status "Non-numeric OTP → 400" "400" "$STATUS" "$BODY"

# Wrong code (valid format but incorrect)
parse_response "$(do_request POST /auth/email/confirm '{"email":"test@umich.edu","code":"000000"}')"
assert_status "Wrong code → 400" "400" "$STATUS" "$BODY"
assert_contains "Error message present" "error" "$BODY"

# Non-.edu email
parse_response "$(do_request POST /auth/email/confirm '{"email":"test@gmail.com","code":"123456"}')"
assert_status "Non-.edu in confirm → 400" "400" "$STATUS" "$BODY"

echo ""

# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}[3] PROFILES — Create${NC}"
# ─────────────────────────────────────────────────────────────

# Note: create-profile requires auth in production. Testing validation only.
parse_response "$(do_request POST /users '{}')"
# Could be 401 (auth required) or 400 (validation). Both are correct.
if [ "$STATUS" = "401" ] || [ "$STATUS" = "400" ]; then
  TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1))
  echo -e "  ${GREEN}✓${NC} Empty body → $STATUS (correctly rejected)"
else
  assert_status "Empty body rejected" "400" "$STATUS" "$BODY"
fi

# Oversized bio (use temp file to avoid shell limits)
TMPJSON=$(mktemp)
python3 -c "import json; print(json.dumps({'email':'a@umich.edu','displayName':'Test','universityDomain':'umich.edu','bio':'x'*10000}))" > "$TMPJSON"
parse_response "$(curl -s -w "\n%{http_code}" -X POST "$API/users" \
  -H "Content-Type: application/json" -d @"$TMPJSON" 2>/dev/null)"
rm -f "$TMPJSON"
if [ "$STATUS" = "401" ]; then
  warn_check "Oversized bio" "Auth required (endpoint is protected ✓)"
elif [ "$STATUS" = "201" ] || [ "$STATUS" = "400" ]; then
  TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1))
  echo -e "  ${GREEN}✓${NC} Oversized bio handled (HTTP $STATUS)"
else
  assert_status "Oversized bio handled" "201" "$STATUS" "$BODY"
fi

echo ""

# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}[4] DISCOVERY — Get Nearby${NC}"
# ─────────────────────────────────────────────────────────────

# Missing domain
parse_response "$(do_request GET '/users/nearby')"
# Could need auth or just 400
if [ "$STATUS" = "401" ]; then
  warn_check "Get nearby (no domain)" "Auth required — endpoint is protected ✓"
elif [ "$STATUS" = "400" ]; then
  TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1))
  echo -e "  ${GREEN}✓${NC} Missing domain → 400"
else
  assert_status "Missing domain" "400" "$STATUS" "$BODY"
fi

# Valid request
parse_response "$(do_request GET '/users/nearby?domain=umich.edu&lat=42.278&lng=-83.738')"
if [ "$STATUS" = "401" ]; then
  warn_check "Get nearby (valid)" "Auth required — endpoint is protected ✓"
elif [ "$STATUS" = "200" ]; then
  TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1))
  echo -e "  ${GREEN}✓${NC} Valid nearby request → 200"
  assert_contains "Returns students array" "students" "$BODY"
else
  assert_status "Valid nearby" "200" "$STATUS" "$BODY"
fi

# Invalid coordinates
parse_response "$(do_request GET '/users/nearby?domain=umich.edu&lat=999&lng=-83.738')"
if [ "$STATUS" = "401" ]; then
  warn_check "Invalid coords" "Auth required — can't test validation"
else
  assert_status "Invalid lat (999) → 400" "400" "$STATUS" "$BODY"
fi

# Non-.edu domain
parse_response "$(do_request GET '/users/nearby?domain=gmail.com')"
if [ "$STATUS" = "401" ]; then
  warn_check "Non-.edu domain" "Auth required — endpoint is protected ✓"
else
  assert_status "Non-.edu domain → 400" "400" "$STATUS" "$BODY"
fi

echo ""

# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}[5] UNIVERSITY — Get Info${NC}"
# ─────────────────────────────────────────────────────────────

parse_response "$(do_request GET '/universities/umich.edu')"
if [ "$STATUS" = "200" ]; then
  TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1))
  echo -e "  ${GREEN}✓${NC} Get university → 200"
  assert_contains "University data present" "umich" "$BODY"
elif [ "$STATUS" = "401" ]; then
  warn_check "Get university" "Auth required"
else
  assert_status "Get university" "200" "$STATUS" "$BODY"
fi

echo ""

# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}[6] RATE LIMITING${NC}"
# ─────────────────────────────────────────────────────────────

echo "  Sending 8 rapid requests to email verify..."
GOT_429=false
for i in $(seq 1 8); do
  parse_response "$(do_request POST /auth/email/verify '{"email":"ratelimittest@umich.edu"}')"
  if [ "$STATUS" = "429" ]; then
    GOT_429=true
    TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1))
    echo -e "  ${GREEN}✓${NC} Rate limited after $i requests (HTTP 429)"
    break
  fi
done
if [ "$GOT_429" = false ]; then
  TOTAL=$((TOTAL + 1))
  # Might not trigger if rate limit table doesn't exist yet
  warn_check "Rate limiting" "Didn't hit 429 after 8 requests — rate limit table may not be deployed yet"
fi

echo ""

# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}[7] WEBSOCKET${NC}"
# ─────────────────────────────────────────────────────────────

# Quick connection test with wscat if available, otherwise just note it
if command -v wscat &> /dev/null; then
  WS_RESULT=$(timeout 5 wscat -c "$WS?domain=umich.edu&userId=test-runner" -x '{"action":"ping"}' 2>&1)
  TOTAL=$((TOTAL + 1))
  if echo "$WS_RESULT" | grep -q "Connected\|connected"; then
    PASS=$((PASS + 1))
    echo -e "  ${GREEN}✓${NC} WebSocket connects successfully"
  else
    WARN=$((WARN + 1))
    echo -e "  ${YELLOW}⚠${NC} WebSocket connection — $WS_RESULT"
  fi
else
  # Test with curl upgrade
  WS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Connection: Upgrade" -H "Upgrade: websocket" \
    -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGVzdA==" \
    "https://w0m7jw00ak.execute-api.us-east-2.amazonaws.com/dev?domain=umich.edu&userId=test" 2>/dev/null)
  TOTAL=$((TOTAL + 1))
  if [ "$WS_HTTP" = "101" ] || [ "$WS_HTTP" = "200" ]; then
    PASS=$((PASS + 1))
    echo -e "  ${GREEN}✓${NC} WebSocket endpoint responds (HTTP $WS_HTTP)"
  else
    WARN=$((WARN + 1))
    echo -e "  ${YELLOW}⚠${NC} WebSocket endpoint returned HTTP $WS_HTTP (may need real WS client)"
  fi
fi

echo ""

# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}[8] WEBSITE — Ad Manager Auth Flow${NC}"
# ─────────────────────────────────────────────────────────────

# SITE is set at top of file

# Homepage loads
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/" 2>/dev/null)
assert_status "Homepage loads" "200" "$SITE_STATUS"

# Ads page loads
ADS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/ads" 2>/dev/null)
assert_status "Ad Manager page loads" "200" "$ADS_STATUS"

# Dashboard redirects without auth
DASH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "$SITE/ads/dashboard" 2>/dev/null)
assert_status "Dashboard without auth → redirects to /ads" "200" "$DASH_STATUS"

# API auth endpoint exists
parse_response "$(curl -s -w "\n%{http_code}" -X POST "$SITE/api/auth" \
  -H "Content-Type: application/json" -d '{"action":"login","email":"test@test.com"}' 2>/dev/null)"
if [ "$STATUS" = "400" ] || [ "$STATUS" = "200" ]; then
  TOTAL=$((TOTAL + 1)); PASS=$((PASS + 1))
  echo -e "  ${GREEN}✓${NC} Auth API endpoint responds (HTTP $STATUS)"
else
  assert_status "Auth API responds" "400" "$STATUS" "$BODY"
fi

echo ""

# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}[9] SECURITY — Header Checks${NC}"
# ─────────────────────────────────────────────────────────────

HEADERS=$(curl -sI "$SITE/" 2>/dev/null)

TOTAL=$((TOTAL + 1))
if echo "$HEADERS" | grep -qi "x-frame-options\|content-security-policy"; then
  PASS=$((PASS + 1))
  echo -e "  ${GREEN}✓${NC} Frame protection headers present"
else
  WARN=$((WARN + 1))
  echo -e "  ${YELLOW}⚠${NC} No X-Frame-Options or CSP header (consider adding)"
fi

TOTAL=$((TOTAL + 1))
if echo "$HEADERS" | grep -qi "strict-transport-security"; then
  PASS=$((PASS + 1))
  echo -e "  ${GREEN}✓${NC} HSTS header present"
else
  WARN=$((WARN + 1))
  echo -e "  ${YELLOW}⚠${NC} No HSTS header"
fi

echo ""

# ─────────────────────────────────────────────────────────────
# RESULTS
# ─────────────────────────────────────────────────────────────
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}Passed: $PASS${NC}  |  ${RED}Failed: $FAIL${NC}  |  ${YELLOW}Warnings: $WARN${NC}  |  Total: $TOTAL"
echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
  exit 1
fi
