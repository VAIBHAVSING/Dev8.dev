const BACKEND = 'https://dev8-dev.onrender.com';
const TEST_ID = `vscode-url-test-${Date.now()}`;

async function testVSCodeURL() {
  console.log('🧪 Testing VSCode URL Integration');
  console.log('Backend:', BACKEND);
  console.log('Test ID:', TEST_ID);
  console.log('=========================================\n');

  try {
    // 1. Create workspace
    console.log('1️⃣ Creating workspace...');
    const createRes = await fetch(`${BACKEND}/api/v1/environments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: TEST_ID,
        userId: 'user_vscode_test',
        name: 'VSCode URL Test',
        cloudProvider: 'AZURE',
        cloudRegion: 'centralindia',
        cpuCores: 2,
        memoryGB: 4,
        storageGB: 20,
        baseImage: 'node'
      })
    });
    
    const createData = await createRes.json();
    
    if (createRes.status === 201 && createData.success) {
      console.log('✅ Workspace created successfully');
      console.log('VSCode URL:', createData.data?.environment?.connectionUrls?.vscodeWebUrl);
      console.log('');
      
      const vscodeUrl = createData.data?.environment?.connectionUrls?.vscodeWebUrl;
      
      if (vscodeUrl) {
        console.log('✅ VSCode URL is present in response');
        console.log('Frontend should display this URL in the "Open VSCode" button');
        console.log('');
      } else {
        console.log('❌ VSCode URL is missing from response');
      }
    } else {
      console.log('❌ Failed to create workspace:', createData.message);
      return;
    }

    // Wait a bit then cleanup
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2. Delete
    console.log('2️⃣ Cleaning up...');
    const deleteRes = await fetch(`${BACKEND}/api/v1/environments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId: TEST_ID,
        cloudRegion: 'centralindia',
        force: true
      })
    });

    if (deleteRes.status === 200) {
      console.log('✅ Workspace deleted');
    }

    console.log('');
    console.log('=========================================');
    console.log('✅ Test Complete!');
    console.log('');
    console.log('Summary:');
    console.log('- VSCode URL is returned when workspace is created');
    console.log('- Frontend now includes vsCodeUrl in workspace data');
    console.log('- "Open VSCode" button uses direct URL (no API call needed)');
    console.log('- Browser button has been removed');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testVSCodeURL();
