import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed templates
  const templates = [
    {
      name: 'node',
      displayName: 'Node.js',
      description: 'JavaScript and TypeScript development with Node.js LTS, npm, and common tools',
      baseImage: 'dev8mvpregistry.azurecr.io/vscode-node:latest',
      defaultCPU: 2,
      defaultMemory: 4,
    },
    {
      name: 'python',
      displayName: 'Python',
      description: 'Python 3.11 development environment with pip and common libraries',
      baseImage: 'dev8mvpregistry.azurecr.io/vscode-python:latest',
      defaultCPU: 2,
      defaultMemory: 4,
    },
    {
      name: 'golang',
      displayName: 'Go',
      description: 'Go 1.21 development environment with standard toolchain',
      baseImage: 'dev8mvpregistry.azurecr.io/vscode-go:latest',
      defaultCPU: 2,
      defaultMemory: 4,
    },
  ];

  console.log('📦 Creating templates...');
  
  for (const template of templates) {
    const result = await prisma.template.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    });
    console.log(`  ✅ Created/updated template: ${result.displayName}`);
  }

  console.log('✨ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
