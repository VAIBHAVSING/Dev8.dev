const BACKEND = 'https://dev8-dev.onrender.com';
const TEST_ID = `render-test-${Date.now()}`;

async function testAPIs() {
  console.log('🧪 Testing All 4 Workspace APIs');
  console.log('Backend:', BACKEND);
  console.log('Test ID:', TEST_ID);
  console.log('================================\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Health Check');
    const healthRes = await fetch(`${BACKEND}/health`);
    const healthData = await healthRes.json();
    console.log('Status:', healthRes.status);
    console.log('Response:', JSON.stringify(healthData, null, 2));
    console.log('');

    // 2. Create Workspace
    console.log('2️⃣ Create Workspace');
    const createRes = await fetch(`${BACKEND}/api/v1/environments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: TEST_ID,
        userId: 'user_test',
        name: 'Test Workspace',
        cloudProvider: 'AZURE',
        cloudRegion: 'centralindia',
        cpuCores: 2,
        memoryGB: 4,
        storageGB: 20,
        baseImage: 'node'
      })
    });
    const createData = await createRes.json();
    console.log('Status:', createRes.status);
    console.log('Response:', JSON.stringify(createData, null, 2));
    console.log('');

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Start Workspace
    console.log('3️⃣ Start Workspace');
    const startRes = await fetch(`${BACKEND}/api/v1/environments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: TEST_ID,
        cloudRegion: 'centralindia',
        userId: 'user_test',
        name: 'Test Workspace',
        cpuCores: 2,
        memoryGB: 4,
        storageGB: 20,
        baseImage: 'node'
      })
    });
    const startData = await startRes.json();
    console.log('Status:', startRes.status);
    console.log('Response:', JSON.stringify(startData, null, 2));
    console.log('');

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Stop Workspace
    console.log('4️⃣ Stop Workspace');
    const stopRes = await fetch(`${BACKEND}/api/v1/environments/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: TEST_ID,
        cloudRegion: 'centralindia'
      })
    });
    const stopData = await stopRes.json();
    console.log('Status:', stopRes.status);
    console.log('Response:', JSON.stringify(stopData, null, 2));
    console.log('');

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. Delete Workspace
    console.log('5️⃣ Delete Workspace');
    const deleteRes = await fetch(`${BACKEND}/api/v1/environments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: TEST_ID,
        cloudRegion: 'centralindia',
        force: false
      })
    });
    const deleteData = await deleteRes.json();
    console.log('Status:', deleteRes.status);
    console.log('Response:', JSON.stringify(deleteData, null, 2));
    console.log('');

    console.log('================================');
    console.log('✅ All Tests Complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPIs();
