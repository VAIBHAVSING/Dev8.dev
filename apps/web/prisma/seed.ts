import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Comprehensive template data with popular development environments
  const templates = [
    {
      name: "node",
      displayName: "Node.js",
      description:
        "JavaScript and TypeScript development with Node.js LTS, npm, pnpm, and common tools",
      baseImage: "dev8mvpregistry.azurecr.io/vscode-node:latest",
      defaultCPU: 2,
      defaultMemory: 4,
      defaultStorage: 20,
      category: "language",
      tags: ["nodejs", "javascript", "typescript", "backend"],
      icon: "nodejs",
      isPopular: true,
      isActive: true,
      defaultPorts: [
        { port: 3000, protocol: "http", description: "Application" },
        { port: 5173, protocol: "http", description: "Vite Dev Server" },
      ],
      defaultEnvVars: {
        NODE_ENV: "development",
        NPM_CONFIG_LOGLEVEL: "info",
      },
      extensions: [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-typescript-next",
      ],
    },
    {
      name: "python",
      displayName: "Python",
      description:
        "Python 3.11 development environment with pip, poetry, and data science libraries",
      baseImage: "dev8mvpregistry.azurecr.io/vscode-python:latest",
      defaultCPU: 2,
      defaultMemory: 4,
      defaultStorage: 20,
      category: "language",
      tags: ["python", "data-science", "backend", "ml"],
      icon: "python",
      isPopular: true,
      isActive: true,
      defaultPorts: [
        { port: 8000, protocol: "http", description: "Django/FastAPI" },
        { port: 5000, protocol: "http", description: "Flask" },
        { port: 8888, protocol: "http", description: "Jupyter" },
      ],
      defaultEnvVars: {
        PYTHONUNBUFFERED: "1",
        PIP_NO_CACHE_DIR: "1",
      },
      extensions: [
        "ms-python.python",
        "ms-python.vscode-pylance",
        "ms-toolsai.jupyter",
      ],
    },
    {
      name: "golang",
      displayName: "Go",
      description:
        "Go 1.21+ development environment with standard toolchain and popular tools",
      baseImage: "dev8mvpregistry.azurecr.io/vscode-go:latest",
      defaultCPU: 2,
      defaultMemory: 4,
      defaultStorage: 20,
      category: "language",
      tags: ["golang", "backend", "microservices"],
      icon: "go",
      isPopular: true,
      isActive: true,
      defaultPorts: [
        { port: 8080, protocol: "http", description: "Application" },
      ],
      defaultEnvVars: {
        GO111MODULE: "on",
        GOPROXY: "https://proxy.golang.org,direct",
      },
      extensions: ["golang.go"],
    },
    {
      name: "rust",
      displayName: "Rust",
      description: "Rust development with cargo, rustup, and essential tools",
      baseImage: "dev8mvpregistry.azurecr.io/vscode-rust:latest",
      defaultCPU: 4,
      defaultMemory: 8,
      defaultStorage: 30,
      category: "language",
      tags: ["rust", "systems", "backend"],
      icon: "rust",
      isPopular: false,
      isActive: true,
      defaultPorts: [
        { port: 8080, protocol: "http", description: "Application" },
      ],
      defaultEnvVars: {
        RUST_BACKTRACE: "1",
      },
      extensions: ["rust-lang.rust-analyzer"],
    },
    {
      name: "java",
      displayName: "Java",
      description: "Java development with JDK 17, Maven, and Gradle",
      baseImage: "dev8mvpregistry.azurecr.io/vscode-java:latest",
      defaultCPU: 4,
      defaultMemory: 8,
      defaultStorage: 30,
      category: "language",
      tags: ["java", "spring", "backend", "enterprise"],
      icon: "java",
      isPopular: true,
      isActive: true,
      defaultPorts: [
        { port: 8080, protocol: "http", description: "Spring Boot" },
        { port: 8081, protocol: "http", description: "Management" },
      ],
      defaultEnvVars: {
        JAVA_HOME: "/usr/lib/jvm/java-17-openjdk",
        MAVEN_OPTS: "-Xmx1024m",
      },
      extensions: ["vscjava.vscode-java-pack", "vmware.vscode-spring-boot"],
    },
    {
      name: "dotnet",
      displayName: ".NET",
      description: ".NET 8 development with C#, F#, and ASP.NET Core",
      baseImage: "dev8mvpregistry.azurecr.io/vscode-dotnet:latest",
      defaultCPU: 2,
      defaultMemory: 4,
      defaultStorage: 25,
      category: "language",
      tags: ["dotnet", "csharp", "backend", "aspnet"],
      icon: "dotnet",
      isPopular: true,
      isActive: true,
      defaultPorts: [
        { port: 5000, protocol: "http", description: "Application" },
        { port: 5001, protocol: "https", description: "Application SSL" },
      ],
      defaultEnvVars: {
        ASPNETCORE_ENVIRONMENT: "Development",
        DOTNET_USE_POLLING_FILE_WATCHER: "true",
      },
      extensions: [
        "ms-dotnettools.csharp",
        "ms-dotnettools.vscode-dotnet-runtime",
      ],
    },
    {
      name: "php",
      displayName: "PHP",
      description: "PHP 8.2 development with Composer and common frameworks",
      baseImage: "dev8mvpregistry.azurecr.io/vscode-php:latest",
      defaultCPU: 2,
      defaultMemory: 4,
      defaultStorage: 20,
      category: "language",
      tags: ["php", "laravel", "symfony", "backend"],
      icon: "php",
      isPopular: false,
      isActive: true,
      defaultPorts: [
        { port: 8000, protocol: "http", description: "PHP Server" },
        { port: 3306, protocol: "tcp", description: "MySQL" },
      ],
      defaultEnvVars: {
        PHP_VERSION: "8.2",
      },
      extensions: ["bmewburn.vscode-intelephense-client"],
    },
    {
      name: "fullstack-react",
      displayName: "Full Stack (React)",
      description: "React + Node.js full stack development environment",
      baseImage: "dev8mvpregistry.azurecr.io/vscode-fullstack-react:latest",
      defaultCPU: 4,
      defaultMemory: 8,
      defaultStorage: 30,
      category: "framework",
      tags: ["react", "nodejs", "fullstack", "frontend"],
      icon: "react",
      isPopular: true,
      isActive: true,
      defaultPorts: [
        { port: 3000, protocol: "http", description: "Frontend" },
        { port: 5000, protocol: "http", description: "Backend API" },
      ],
      defaultEnvVars: {
        NODE_ENV: "development",
        BROWSER: "none",
      },
      extensions: [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "dsznajder.es7-react-js-snippets",
      ],
    },
    {
      name: "docker",
      displayName: "Docker Development",
      description: "Docker and Kubernetes development with compose and kubectl",
      baseImage: "dev8mvpregistry.azurecr.io/vscode-docker:latest",
      defaultCPU: 4,
      defaultMemory: 8,
      defaultStorage: 50,
      category: "devops",
      tags: ["docker", "kubernetes", "devops", "containers"],
      icon: "docker",
      isPopular: false,
      isActive: true,
      defaultPorts: [
        { port: 8080, protocol: "http", description: "Application" },
      ],
      defaultEnvVars: {
        DOCKER_BUILDKIT: "1",
      },
      extensions: [
        "ms-azuretools.vscode-docker",
        "ms-kubernetes-tools.vscode-kubernetes-tools",
      ],
    },
    {
      name: "data-science",
      displayName: "Data Science",
      description:
        "Python data science stack with Jupyter, pandas, numpy, and ML libraries",
      baseImage: "dev8mvpregistry.azurecr.io/vscode-datascience:latest",
      defaultCPU: 4,
      defaultMemory: 16,
      defaultStorage: 50,
      category: "specialized",
      tags: ["python", "data-science", "ml", "jupyter", "ai"],
      icon: "jupyter",
      isPopular: false,
      isActive: true,
      defaultPorts: [
        { port: 8888, protocol: "http", description: "Jupyter Lab" },
        { port: 6006, protocol: "http", description: "TensorBoard" },
      ],
      defaultEnvVars: {
        JUPYTER_ENABLE_LAB: "yes",
        PYTHONUNBUFFERED: "1",
      },
      extensions: [
        "ms-python.python",
        "ms-toolsai.jupyter",
        "ms-toolsai.vscode-jupyter-cell-tags",
      ],
    },
  ];

  console.log("📦 Creating templates...");

  for (const template of templates) {
    const result = await prisma.template.upsert({
      where: { name: template.name },
      update: template,
      create: template,
    });
    console.log(
      `  ✅ ${result.displayName} (${result.isPopular ? "Popular" : "Standard"})`,
    );
  }

  console.log("\n📊 Seed summary:");
  const totalTemplates = await prisma.template.count();
  const popularTemplates = await prisma.template.count({
    where: { isPopular: true },
  });
  console.log(`  📦 Total templates: ${totalTemplates}`);
  console.log(`  ⭐ Popular templates: ${popularTemplates}`);

  console.log("\n✨ Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
