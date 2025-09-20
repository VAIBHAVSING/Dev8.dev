"use client"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Code, Cloud, Shield, Zap, Terminal, GitBranch, Users } from "lucide-react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/3 to-violet-500/5"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/6 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Code className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-foreground">Dev8.dev</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => handleNavigation("/features")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </button>
              <Button variant="outline" size="sm" onClick={() => handleNavigation("/signin")}>
                Sign In
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6">
              <Zap className="mr-1 h-3 w-3" />
              Zero to coding in 30 seconds
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl text-balance">
              Your Development Environment in the <span className="text-primary">Cloud</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground text-pretty max-w-2xl mx-auto">
              Dev8.dev provides instant, containerized development environments with full VS Code experience. Code
              anywhere, anytime, with persistent storage and seamless collaboration.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" className="h-12 px-8" onClick={() => handleNavigation("/signup")}>
                Start Coding Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 bg-transparent"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                View Demo
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-x-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                No setup required
              </div>
              <div className="flex items-center gap-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Free tier available
              </div>
              <div className="flex items-center gap-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Enterprise ready
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary via-violet-500 to-purple-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-violet-400 to-primary opacity-15 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-b from-primary/5 via-violet-500/8 to-primary/10 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">30s</div>
              <div className="text-sm text-muted-foreground">Environment Setup Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Browser Compatible</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Cloud Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-16 sm:py-20 bg-gradient-to-b from-primary/10 via-background to-violet-500/8 relative"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-4 h-4 bg-primary/20 rounded-full animate-bounce delay-300"></div>
          <div className="absolute top-40 right-20 w-6 h-6 bg-violet-500/20 rounded-full animate-bounce delay-700"></div>
          <div className="absolute bottom-40 left-1/4 w-3 h-3 bg-purple-500/20 rounded-full animate-bounce delay-1000"></div>
          <div className="absolute bottom-20 right-1/3 w-5 h-5 bg-primary/20 rounded-full animate-bounce delay-500"></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Everything you need to code in the cloud
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Powerful features designed for modern development workflows
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Terminal className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Browser-Based VS Code</CardTitle>
                  <CardDescription>
                    Full VS Code experience in your browser with all your favorite extensions and themes.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 2 */}
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Cloud className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Instant Environments</CardTitle>
                  <CardDescription>
                    Spin up containerized development environments in seconds with Docker integration.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 3 */}
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Persistent Storage</CardTitle>
                  <CardDescription>
                    Never lose your work with persistent Docker volumes and automatic backups.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 4 */}
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <GitBranch className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Remote SSH Access</CardTitle>
                  <CardDescription>
                    Connect from your desktop VS Code or any SSH client for maximum flexibility.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 5 */}
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Team Collaboration</CardTitle>
                  <CardDescription>
                    Share environments with your team and collaborate in real-time on projects.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Feature 6 */}
              <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Multi-Cloud Ready</CardTitle>
                  <CardDescription>
                    Local-first demo with future support for AWS, GCP, and Azure deployments.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-violet-500/8 via-primary/5 to-background relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              How Dev8.dev Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">Get started in three simple steps</p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
                  1
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Sign Up & Choose Template</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your account and select from pre-configured development templates or start from scratch.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
                  2
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Launch Environment</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your containerized development environment spins up in seconds with VS Code ready to use.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
                  3
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Start Coding</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Begin coding immediately with full VS Code features, extensions, and persistent file storage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-background via-primary/8 to-violet-500/10 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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

      {/* Use Cases Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-violet-500/10 via-primary/6 to-background relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Perfect for Every Developer
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Whether you're a student, freelancer, or enterprise team
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-6xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Students & Learning</CardTitle>
                  <CardDescription>
                    No setup required - jump straight into coding assignments and projects without configuration
                    hassles.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Remote Teams</CardTitle>
                  <CardDescription>
                    Standardized environments ensure everyone works with the same tools and configurations.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Prototyping</CardTitle>
                  <CardDescription>
                    Test ideas rapidly without polluting your local machine with temporary dependencies.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Code Reviews</CardTitle>
                  <CardDescription>
                    Spin up environments for specific branches or pull requests for thorough testing.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Workshops & Training</CardTitle>
                  <CardDescription>
                    Provide consistent environments for coding workshops and technical training sessions.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Legacy Projects</CardTitle>
                  <CardDescription>
                    Isolate older projects with specific dependency versions without affecting your main setup.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-background via-primary/8 to-violet-500/12 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
              Ready to start coding in the cloud?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Join thousands of developers who have already made the switch to cloud-based development.
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-6">
              <Button size="lg" className="h-12 px-8" onClick={() => handleNavigation("/signup")}>
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 bg-transparent"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-gradient-to-b from-violet-500/12 to-muted/20 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
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
                    onClick={() => handleNavigation("/features")}
                    className="hover:text-foreground transition-colors text-left"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation("/signup")}
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