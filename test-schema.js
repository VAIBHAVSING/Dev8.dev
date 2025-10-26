#!/usr/bin/env node

/**
 * Database Schema Test Script
 * 
 * Tests the new database schema by creating sample data
 * and verifying all relations work correctly.
 * 
 * Run with: node test-schema.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing Database Schema...\n');

  try {
    // Clean up test data first
    console.log('🧹 Cleaning up existing test data...');
    await prisma.backup.deleteMany({ where: { environment: { name: { contains: 'test-' } } } });
    await prisma.workspace.deleteMany({ where: { environment: { name: { contains: 'test-' } } } });
    await prisma.environmentSecret.deleteMany({ where: { environment: { name: { contains: 'test-' } } } });
    await prisma.environmentSSHKey.deleteMany({ where: { environment: { name: { contains: 'test-' } } } });
    await prisma.activityReport.deleteMany({ where: { environment: { name: { contains: 'test-' } } } });
    await prisma.secret.deleteMany({ where: { user: { email: 'test@dev8.dev' } } });
    await prisma.sshKey.deleteMany({ where: { user: { email: 'test@dev8.dev' } } });
    await prisma.environment.deleteMany({ where: { name: { contains: 'test-' } } });
    await prisma.user.deleteMany({ where: { email: 'test@dev8.dev' } });
    console.log('✅ Cleanup complete\n');

    // Test 1: Create User
    console.log('1️⃣  Creating test user...');
    const user = await prisma.user.create({
      data: {
        email: 'test@dev8.dev',
        name: 'Test User',
      },
    });
    console.log(`✅ User created: ${user.email} (${user.id})\n`);

    // Test 2: Create Environment with IDE and Agent
    console.log('2️⃣  Creating environment with VS Code + Copilot...');
    const env1 = await prisma.environment.create({
      data: {
        userId: user.id,
        name: 'test-vscode-copilot',
        ideType: 'VSCODE',
        agentType: 'COPILOT',
        autoStopMinutes: 30,
        autoStopEnabled: true,
        status: 'RUNNING',
      },
    });
    console.log(`✅ Environment created: ${env1.name} (${env1.id})`);
    console.log(`   IDE: ${env1.ideType}, Agent: ${env1.agentType}\n`);

    // Test 3: Create Environment with Jupyter + Claude
    console.log('3️⃣  Creating environment with Jupyter + Claude...');
    const env2 = await prisma.environment.create({
      data: {
        userId: user.id,
        name: 'test-jupyter-claude',
        ideType: 'JUPYTER',
        agentType: 'CLAUDE',
        autoStopMinutes: 60,
        autoStopEnabled: false,
        status: 'RUNNING',
      },
    });
    console.log(`✅ Environment created: ${env2.name} (${env2.id})`);
    console.log(`   IDE: ${env2.ideType}, Agent: ${env2.agentType}\n`);

    // Test 4: Create SSH Keys
    console.log('4️⃣  Creating SSH keys...');
    const sshKey1 = await prisma.sSHKey.create({
      data: {
        userId: user.id,
        name: 'MacBook Pro',
        publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIK... test@macbook',
        fingerprint: 'SHA256:test-fingerprint-1',
        keyType: 'ed25519',
      },
    });
    console.log(`✅ SSH Key created: ${sshKey1.name} (${sshKey1.fingerprint})\n`);

    // Test 5: Associate SSH Key with Environment
    console.log('5️⃣  Associating SSH key with environment...');
    await prisma.environmentSSHKey.create({
      data: {
        environmentId: env1.id,
        sshKeyId: sshKey1.id,
      },
    });
    console.log(`✅ SSH Key linked to environment\n`);

    // Test 6: Create Secrets (Azure Key Vault references)
    console.log('6️⃣  Creating secrets (Key Vault references)...');
    const secret1 = await prisma.secret.create({
      data: {
        userId: user.id,
        name: 'GitHub Token',
        secretType: 'GITHUB_TOKEN',
        description: 'GitHub Personal Access Token for Copilot',
        vaultName: 'dev8-vault',
        secretName: 'github-token-test-user',
        secretVersion: null, // Latest version
      },
    });
    console.log(`✅ Secret created: ${secret1.name} (${secret1.secretType})\n`);

    // Test 7: Associate Secret with Environment
    console.log('7️⃣  Associating secret with environment...');
    await prisma.environmentSecret.create({
      data: {
        environmentId: env1.id,
        secretId: secret1.id,
      },
    });
    console.log(`✅ Secret linked to environment\n`);

    // Test 8: Create Activity Report
    console.log('8️⃣  Creating activity report...');
    const activity = await prisma.activityReport.create({
      data: {
        environmentId: env1.id,
        lastIDEActivity: new Date(),
        lastSSHActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        activeIDEConnections: 1,
        activeSSHConnections: 0,
        cpuUsagePercent: 45.2,
        memoryUsageMB: 2048,
        diskUsageMB: 15000,
        networkRxMB: 125.5,
        networkTxMB: 89.3,
        supervisorVersion: 'v1.0.0',
      },
    });
    console.log(`✅ Activity report created (${activity.id})`);
    console.log(`   CPU: ${activity.cpuUsagePercent}%, Memory: ${activity.memoryUsageMB}MB\n`);

    // Test 9: Create Workspace
    console.log('9️⃣  Creating workspace...');
    const workspace = await prisma.workspace.create({
      data: {
        userId: user.id,
        environmentId: env1.id,
        storagePath: '/workspace',
        storageType: 'azure-blob',
        azureStorageAccount: 'dev8storage',
        azureContainerName: 'workspaces',
        azureBlobPrefix: `user-${user.id}/env-${env1.id}`,
        backupEnabled: true,
        backupRetentionDays: 30,
      },
    });
    console.log(`✅ Workspace created (${workspace.id})`);
    console.log(`   Storage: ${workspace.storageType}\n`);

    // Test 10: Create Backup
    console.log('🔟 Creating pre-shutdown backup...');
    const backup = await prisma.backup.create({
      data: {
        workspaceId: workspace.id,
        environmentId: env1.id,
        trigger: 'PRE_SHUTDOWN',
        status: 'COMPLETED',
        backupPath: `backups/${user.id}/${env1.id}/backup-${Date.now()}.tar.gz`,
        backupSizeMB: 250,
        startedAt: new Date(Date.now() - 10 * 60 * 1000),
        completedAt: new Date(),
      },
    });
    console.log(`✅ Backup created (${backup.id})`);
    console.log(`   Trigger: ${backup.trigger}, Status: ${backup.status}`);
    console.log(`   Size: ${backup.backupSizeMB}MB\n`);

    // Test 11: Query all environments with relations
    console.log('1️⃣1️⃣ Querying environments with all relations...');
    const environments = await prisma.environment.findMany({
      where: {
        userId: user.id,
        name: { contains: 'test-' },
      },
      include: {
        user: true,
        activityReports: true,
        sshKeys: {
          include: {
            sshKey: true,
          },
        },
        secrets: {
          include: {
            secret: true,
          },
        },
        workspace: {
          include: {
            backups: true,
          },
        },
      },
    });
    
    console.log(`✅ Found ${environments.length} environments`);
    environments.forEach((env, i) => {
      console.log(`\n   Environment ${i + 1}:`);
      console.log(`   - Name: ${env.name}`);
      console.log(`   - IDE: ${env.ideType}, Agent: ${env.agentType}`);
      console.log(`   - Auto-stop: ${env.autoStopEnabled ? `${env.autoStopMinutes} min` : 'disabled'}`);
      console.log(`   - Activity Reports: ${env.activityReports.length}`);
      console.log(`   - SSH Keys: ${env.sshKeys.length}`);
      console.log(`   - Secrets: ${env.secrets.length}`);
      console.log(`   - Workspace: ${env.workspace ? 'configured' : 'not configured'}`);
      if (env.workspace) {
        console.log(`   - Backups: ${env.workspace.backups.length}`);
      }
    });

    // Test 12: Test auto-stop query (find idle environments)
    console.log('\n\n1️⃣2️⃣ Testing auto-stop query (find idle environments)...');
    const idleThresholdMinutes = 30;
    const idleThreshold = new Date(Date.now() - idleThresholdMinutes * 60 * 1000);
    
    const idleEnvironments = await prisma.environment.findMany({
      where: {
        status: 'RUNNING',
        autoStopEnabled: true,
        activityReports: {
          some: {
            OR: [
              { lastIDEActivity: { lt: idleThreshold } },
              { lastSSHActivity: { lt: idleThreshold } },
            ],
          },
        },
      },
      include: {
        activityReports: {
          orderBy: { reportedAt: 'desc' },
          take: 1,
        },
      },
    });
    
    console.log(`✅ Found ${idleEnvironments.length} idle environments (threshold: ${idleThresholdMinutes} min)`);

    console.log('\n\n✅ All tests passed! Schema is working correctly! 🎉\n');

    // Summary
    console.log('📊 Test Summary:');
    console.log('   ✅ User creation');
    console.log('   ✅ Environment creation with IDE/Agent');
    console.log('   ✅ SSH key management');
    console.log('   ✅ Secrets management (Key Vault refs)');
    console.log('   ✅ Activity reporting');
    console.log('   ✅ Workspace configuration');
    console.log('   ✅ Backup tracking');
    console.log('   ✅ Complex queries with relations');
    console.log('   ✅ Auto-stop detection query');
    console.log('\n🎉 Database schema validation complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
