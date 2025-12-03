#!/bin/bash

# Test script for all 4 workspace operations with tunnel backend
# Make sure the tunnel is running at https://tunnel.vaibhavsing.me

TUNNEL_URL="https://dev8-dev.onrender.com"
TEST_WORKSPACE_ID="test-$(date +%s)"

echo "🧪 Testing Dev8 Workspace APIs with Tunnel Backend"
echo "=================================================="
echo ""

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$TUNNEL_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Health check passed"
  echo "Response: $BODY"
else
  echo "❌ Health check failed (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
  exit 1
fi
echo ""

# Test 2: Create Workspace
echo "2️⃣ Testing Create Workspace..."
CREATE_PAYLOAD='{
  "workspaceId": "'$TEST_WORKSPACE_ID'",
  "userId": "user_test",
  "name": "Test Workspace",
  "cloudProvider": "AZURE",
  "cloudRegion": "centralindia",
  "cpuCores": 2,
  "memoryGB": 4,
  "storageGB": 20,
  "baseImage": "node"
}'

CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$TUNNEL_URL/api/v1/environments" \
  -H "Content-Type: application/json" \
  -d "$CREATE_PAYLOAD")

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
BODY=$(echo "$CREATE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo "✅ Create workspace passed"
  echo "Response: $BODY"
else
  echo "❌ Create workspace failed (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
  # Don't exit - try other operations anyway
fi
echo ""

# Wait a bit for creation to complete
echo "⏳ Waiting 5 seconds for workspace creation..."
sleep 5
echo ""

# Test 3: Start Workspace
echo "3️⃣ Testing Start Workspace..."
START_PAYLOAD='{
  "workspaceId": "'$TEST_WORKSPACE_ID'",
  "cloudRegion": "centralindia",
  "userId": "user_test",
  "name": "Test Workspace",
  "cpuCores": 2,
  "memoryGB": 4,
  "storageGB": 20,
  "baseImage": "node"
}'

START_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$TUNNEL_URL/api/v1/environments/start" \
  -H "Content-Type: application/json" \
  -d "$START_PAYLOAD")

HTTP_CODE=$(echo "$START_RESPONSE" | tail -n1)
BODY=$(echo "$START_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Start workspace passed"
  echo "Response: $BODY"
else
  echo "❌ Start workspace failed (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
fi
echo ""

# Wait a bit
echo "⏳ Waiting 3 seconds..."
sleep 3
echo ""

# Test 4: Stop Workspace
echo "4️⃣ Testing Stop Workspace..."
STOP_PAYLOAD='{
  "workspaceId": "'$TEST_WORKSPACE_ID'",
  "cloudRegion": "centralindia"
}'

STOP_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$TUNNEL_URL/api/v1/environments/stop" \
  -H "Content-Type: application/json" \
  -d "$STOP_PAYLOAD")

HTTP_CODE=$(echo "$STOP_RESPONSE" | tail -n1)
BODY=$(echo "$STOP_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Stop workspace passed"
  echo "Response: $BODY"
else
  echo "❌ Stop workspace failed (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
fi
echo ""

# Wait a bit
echo "⏳ Waiting 3 seconds..."
sleep 3
echo ""

# Test 5: Delete Workspace
echo "5️⃣ Testing Delete Workspace..."
DELETE_PAYLOAD='{
  "workspaceId": "'$TEST_WORKSPACE_ID'",
  "cloudRegion": "centralindia",
  "force": false
}'

DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X DELETE "$TUNNEL_URL/api/v1/environments" \
  -H "Content-Type: application/json" \
  -d "$DELETE_PAYLOAD")

HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n1)
BODY=$(echo "$DELETE_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Delete workspace passed"
  echo "Response: $BODY"
else
  echo "❌ Delete workspace failed (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
fi
echo ""

echo "=================================================="
echo "✅ All workspace API tests completed!"
echo "Test Workspace ID: $TEST_WORKSPACE_ID"
