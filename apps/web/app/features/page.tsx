"use client"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Code,
  Cloud,
  Shield,
  Zap,
  Terminal,
  GitBranch,
  Users,
  Server,
  Database,
  Lock,
  Rocket,
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function FeaturesPage() {
  const router = useRouter()

  const coreFeatures = [
    {
      icon: Terminal,
      title: "Browser-Based VS Code",
      description:
        "Full VS Code experience in your browser with all your favorite extensions, themes, and settings. No installation required.",
      details: [
        "Complete extension marketplace access",
        "Custom themes and settings sync",
        "Integrated terminal with full shell access",
        "Multi-tab editing with split views",
      ],
    },
    {
      icon: Cloud,
      title: "Instant Environments",
      description:
        "Spin up containerized development environments in seconds with Docker integration and pre-configured templates.",
      details: [
        "30-second environment startup",
        "Pre-built language templates",
        "Custom Dockerfile support",
        "Environment versioning and snapshots",
      ],
    },
    {
      icon: Shield,
      title: "Persistent Storage",
      description:
        "Never lose your work with persistent Docker volumes, automatic backups, and seamless file synchronization.",
      details: [
        "Automatic file backup every 5 minutes",
        "Cross-session persistence",
        "Git integration with auto-sync",
        "File history and version control",
      ],
    },
    {
      icon: GitBranch,
      title: "Remote SSH Access",
      description:
        "Connect from your desktop VS Code, terminal, or any SSH client for maximum flexibility and familiar workflows.",
      details: [
        "Desktop VS Code integration",
        "Terminal SSH access",
        "SFTP file transfer support",
        "Port forwarding for local testing",
      ],
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description:
        "Share environments with your team, collaborate in real-time, and manage permissions with enterprise-grade controls.",
      details: [
        "Real-time collaborative editing",
        "Team workspace management",
        "Role-based access control",
        "Shared project templates",
      ],
    },
    {
      icon: Rocket,
      title: "Multi-Cloud Ready",
      description: "Local-first demo with future support for AWS, GCP, Azure, and hybrid cloud deployments.",
      details: [
        "Local development mode",
        "Cloud provider flexibility",
        "Hybrid deployment options",
        "Enterprise scaling capabilities",
      ],
    },
  ]

  const technicalFeatures = [
    {
      icon: Server,
      title: "Docker Integration",
      description: "Full Docker support with custom containers, multi-stage builds, and container orchestration.",
      details: [
        "Custom Dockerfile support",
        "Multi-container environments",
        "Container networking",
        "Resource management",
      ],
    },
    {
      icon: Database,
      title: "Development Databases",
      description: "Integrated database support with PostgreSQL, MySQL, MongoDB, and Redis containers.",
      details: ["One-click database setup", "Database migration tools", "Connection pooling", "Backup and restore"],
    },
    {
      icon: Lock,
      title: "Security & Isolation",
      description: "Enterprise-grade security with container isolation, encrypted connections, and audit logging.",
      details: ["Container sandboxing", "Encrypted data transmission", "Audit trail logging", "Compliance ready"],
    },
    {
      icon: Zap,
      title: "Performance Optimization",
      description: "Optimized for speed with intelligent caching, resource allocation, and network optimization.",
      details: [
        "Intelligent caching layers",
        "Dynamic resource scaling",
        "Network optimization",
        "Performance monitoring",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Code className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold text-foreground">Dev8.dev</span>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Button variant="outline" size="sm" onClick={() => router.push("/signin")}>
                Sign In
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6">
              <Zap className="mr-1 h-3 w-3" />
              Complete Feature Overview
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl text-balance">
              Everything You Need for <span className="text-primary">Cloud Development</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground text-pretty max-w-2xl mx-auto">
              Discover all the powerful features that make Dev8.dev the ultimate cloud-based development platform. From
              instant environments to enterprise-grade security.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" className="h-12 px-8" onClick={() => router.push("/register")}>
                Start Using These Features
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Core Development Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Essential tools and capabilities for modern development workflows
            </p>
          </div>

          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {coreFeatures.map((feature, index) => (
                <Card key={index} className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur">
                  <CardHeader className="pb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                    <div className="mt-4 space-y-2">
                      {feature.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/60"></div>
                          {detail}
                        </div>
                      ))}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technical Features Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Technical Capabilities
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Advanced technical features for professional development teams
            </p>
          </div>

          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
              {technicalFeatures.map((feature, index) => (
                <Card key={index} className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur">
                  <CardHeader className="pb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                    <div className="mt-4 space-y-2">
                      {feature.details.map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/60"></div>
                          {detail}
                        </div>
                      ))}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Built with Modern Technology
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Powered by industry-leading tools and frameworks
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-card border border-border">
                  <span className="text-2xl font-mono font-bold text-primary">D</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">Docker</h3>
                <p className="mt-1 text-xs text-muted-foreground">Containerization</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-card border border-border">
                  <Code className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">Code-Server</h3>
                <p className="mt-1 text-xs text-muted-foreground">VS Code in Browser</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-card border border-border">
                  <span className="text-2xl font-mono font-bold text-primary">N</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">Node.js</h3>
                <p className="mt-1 text-xs text-muted-foreground">Runtime Environment</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-card border border-border">
                  <span className="text-2xl font-mono font-bold text-primary">V</span>
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">Volumes</h3>
                <p className="mt-1 text-xs text-muted-foreground">Persistent Storage</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Ready to experience these features?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Start using Dev8.dev today and transform your development workflow with cloud-based environments.
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-6">
              <Button size="lg" className="h-12 px-8" onClick={() => router.push("/register")}>
                Get Started Free
                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8 bg-transparent" onClick={() => router.push("/")}>
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Code className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold text-foreground">Dev8.dev</span>
              </div>
              <p className="text-muted-foreground text-sm max-w-md">
                The future of development is in the cloud. Start coding instantly with our containerized environments.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button
                    onClick={() => router.push("/features")}
                    className="hover:text-foreground transition-colors text-left"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => router.push("/register")}
                    className="hover:text-foreground transition-colors text-left"
                  >
                    Get Started
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center">
            <p className="text-xs text-muted-foreground">© 2024 Dev8.dev. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
