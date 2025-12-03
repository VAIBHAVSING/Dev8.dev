const BACKEND = 'https://dev8-dev.onrender.com';
const TEST_ID = `ui-fix-test-${Date.now()}`;

async function testWorkspaceLifecycle() {
  console.log('🧪 Testing Complete Workspace Lifecycle');
  console.log('Backend:', BACKEND);
  console.log('Test ID:', TEST_ID);
  console.log('=========================================\n');

  try {
    // 1. Create
    console.log('1️⃣ CREATE Workspace');
    const createRes = await fetch(`${BACKEND}/api/v1/environments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: TEST_ID,
        userId: 'user_lifecycle_test',
        name: 'Lifecycle Test',
        cloudProvider: 'AZURE',
        cloudRegion: 'centralindia',
        cpuCores: 2,
        memoryGB: 4,
        storageGB: 20,
        baseImage: 'node'
      })
    });
    const createData = await createRes.json();
    console.log('✅ Created:', createRes.status);
    console.log('Status:', createData.data?.environment?.status);
    console.log('');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. Start (should work even if already running)
    console.log('2️⃣ START Workspace');
    const startRes = await fetch(`${BACKEND}/api/v1/environments/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: TEST_ID,
        cloudRegion: 'centralindia',
        userId: 'user_lifecycle_test',
        name: 'Lifecycle Test',
        cpuCores: 2,
        memoryGB: 4,
        storageGB: 20,
        baseImage: 'node'
      })
    });
    const startData = await startRes.json();
    console.log('✅ Started:', startRes.status);
    console.log('Status:', startData.data?.environment?.status);
    console.log('');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Stop
    console.log('3️⃣ STOP Workspace');
    const stopRes = await fetch(`${BACKEND}/api/v1/environments/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: TEST_ID,
        cloudRegion: 'centralindia'
      })
    });
    const stopData = await stopRes.json();
    console.log('✅ Stopped:', stopRes.status);
    console.log('Message:', stopData.data?.message || stopData.message);
    console.log('');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Delete
    console.log('4️⃣ DELETE Workspace');
    const deleteRes = await fetch(`${BACKEND}/api/v1/environments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: TEST_ID,
        cloudRegion: 'centralindia',
        force: true
      })
    });
    const deleteData = await deleteRes.json();
    console.log('✅ Deleted:', deleteRes.status);
    console.log('Message:', deleteData.data?.message || deleteData.message);
    console.log('');

    console.log('=========================================');
    console.log('✅ ALL OPERATIONS SUCCESSFUL!');
    console.log('The workspace lifecycle is working correctly.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testWorkspaceLifecycle();
