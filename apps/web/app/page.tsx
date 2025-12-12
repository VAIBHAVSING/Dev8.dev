"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GlowMenu } from "@/components/glow-menu";
import { useRouter } from "next/navigation";
import {
  Code,
  Zap,
  Shield,
  Cloud,
  Terminal,
  GitBranch,
  Layers,
  Activity,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const menuItems = [
    { label: "Features", href: "#features", icon: <Sparkles className="h-4 w-4" /> },
    { label: "Pricing", href: "#pricing", icon: <Zap className="h-4 w-4" /> },
    { label: "Docs", href: "#docs", icon: <Code className="h-4 w-4" /> },
  ];

  const features = [
    {
      icon: Code,
      title: "Cloud IDE",
      description: "Full-featured code editor with syntax highlighting and IntelliSense",
    },
    {
      icon: Terminal,
      title: "Integrated Terminal",
      description: "Built-in terminal with full shell access and command execution",
    },
    {
      icon: GitBranch,
      title: "Git Integration",
      description: "Seamless version control with GitHub, GitLab, and Bitbucket",
    },
    {
      icon: Zap,
      title: "Instant Deploy",
      description: "Deploy your applications with a single click to the cloud",
    },
    {
      icon: Layers,
      title: "Multi-Language",
      description: "Support for 50+ programming languages and frameworks",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Enterprise-grade security with encrypted connections",
    },
    {
      icon: Cloud,
      title: "Cloud Storage",
      description: "Store and sync your projects across all devices",
    },
    {
      icon: Activity,
      title: "Real-time Collaboration",
      description: "Code together with your team in real-time",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 grid-background opacity-20" />
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl pulse-glow" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/20 rounded-full blur-3xl pulse-glow" style={{ animationDelay: "2s" }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-secondary to-accent glow-primary">
                <Code className="h-6 w-6 text-black" />
              </div>
              <span className="text-2xl font-bold text-glow-primary">Dev8.dev</span>
            </div>

            <div className="hidden md:block">
              <GlowMenu items={menuItems} />
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/signin")}
                className="text-foreground hover:text-primary"
              >
                Sign In
              </Button>
              <Button
                onClick={() => router.push("/signup")}
                className="bg-gradient-to-r from-primary to-secondary hover:glow-primary"
              >
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center space-y-8 fade-in-up">
          <div className="inline-flex items-center space-x-2 rounded-full border border-primary/50 bg-primary/10 px-5 py-2.5 text-sm hover-scale cursor-pointer">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-primary font-semibold">Now with AI-powered code completion</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
            Code in the
            <span className="block mt-2 text-gradient text-glow-primary">
              Cloud, Deploy Instantly
            </span>
          </h1>

          <p className="mx-auto max-w-3xl text-xl md:text-2xl text-muted-foreground leading-relaxed">
            The most powerful cloud development environment. Write, test, and deploy your applications
            with zero configuration. Start coding in <span className="text-primary font-semibold">30 seconds</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Button
              size="lg"
              onClick={() => router.push("/signup")}
              className="bg-gradient-to-r from-primary via-primary to-secondary hover:glow-primary text-lg px-10 py-6 hover-lift group"
            >
              Start Building Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-10 py-6 hover-glow-secondary hover-lift border-border/50"
            >
              Watch Demo
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 pt-8 text-sm md:text-base text-muted-foreground">
            <div className="flex items-center gap-2.5 hover:text-accent transition-colors">
              <div className="h-2.5 w-2.5 rounded-full bg-accent pulse-scale" />
              <span className="font-medium">No credit card required</span>
            </div>
            <div className="flex items-center gap-2.5 hover:text-accent transition-colors">
              <div className="h-2.5 w-2.5 rounded-full bg-accent pulse-scale" style={{ animationDelay: '0.5s' }} />
              <span className="font-medium">Free forever plan</span>
            </div>
            <div className="flex items-center gap-2.5 hover:text-accent transition-colors">
              <div className="h-2.5 w-2.5 rounded-full bg-accent pulse-scale" style={{ animationDelay: '1s' }} />
              <span className="font-medium">5-minute setup</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center space-y-5 mb-20">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-secondary/30 bg-secondary/10 text-sm font-medium text-secondary">
            <Layers className="h-4 w-4" />
            <span>Powerful Features</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            Everything you need to
            <span className="block mt-2 text-gradient"> build faster</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A complete development environment with all the tools you need, accessible from anywhere
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group border-border/50 bg-card/50 backdrop-blur hover:bg-card hover:border-primary/50 hover-lift transition-all duration-300 cursor-pointer overflow-hidden relative"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 mb-5">
                    <Icon className="h-7 w-7 text-primary group-hover:text-primary transition-colors" />
                  </div>
                  <CardTitle className="text-xl font-bold mb-3">{feature.title}</CardTitle>
                  <CardDescription className="text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center space-y-5 mb-20">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-sm font-medium text-accent">
            <Zap className="h-4 w-4" />
            <span>Simple Pricing</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight">
            Pay only for what you
            <span className="block mt-2 text-gradient"> actually use</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Transparent, affordable pricing with no hidden fees. Start free and scale as you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Tier */}
          <Card className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/30 transition-all duration-300 hover-lift">
            <CardHeader className="space-y-6 py-8">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">Starter</CardTitle>
                <CardDescription className="text-base">Perfect for learning and experimentation</CardDescription>
              </div>
              <div className="space-y-1">
                <div className="text-5xl font-bold">Free</div>
                <p className="text-sm text-muted-foreground">Forever</p>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                  </div>
                  <span>5 hours/month runtime</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                  </div>
                  <span>2 CPU / 4GB RAM</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                  </div>
                  <span>10GB storage</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => router.push("/signup")}>
                Get Started
              </Button>
            </CardHeader>
          </Card>

          {/* Pro Tier */}
          <Card className="border-primary/50 bg-gradient-to-br from-card via-primary/5 to-card glow-primary relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
              POPULAR
            </div>
            <CardHeader className="space-y-6 py-8">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">Pro</CardTitle>
                <CardDescription className="text-base">For professional developers</CardDescription>
              </div>
              <div className="space-y-1">
                <div className="text-5xl font-bold text-gradient-primary">$0.05</div>
                <p className="text-sm text-muted-foreground">per hour</p>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <span>Unlimited runtime</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <span>Up to 8 CPU / 32GB RAM</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <span>100GB storage</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <span>Priority support</span>
                </li>
              </ul>
              <Button 
                className="w-full bg-gradient-to-r from-primary to-secondary hover:glow-primary"
                onClick={() => router.push("/signup")}
              >
                Start Pro Trial
              </Button>
            </CardHeader>
          </Card>

          {/* Team Tier */}
          <Card className="border-border/50 bg-card/50 backdrop-blur hover:border-secondary/30 transition-all duration-300 hover-lift">
            <CardHeader className="space-y-6 py-8">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">Team</CardTitle>
                <CardDescription className="text-base">For growing teams and enterprises</CardDescription>
              </div>
              <div className="space-y-1">
                <div className="text-5xl font-bold">Custom</div>
                <p className="text-sm text-muted-foreground">Contact us</p>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-secondary/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-secondary" />
                  </div>
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-secondary/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-secondary" />
                  </div>
                  <span>Team collaboration</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-secondary/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-secondary" />
                  </div>
                  <span>SSO & audit logs</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-secondary/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-secondary" />
                  </div>
                  <span>Dedicated support</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Contact Sales
              </Button>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <Card className="border-primary/50 bg-gradient-to-br from-card via-primary/10 to-secondary/10 glow-primary relative overflow-hidden">
          <div className="absolute inset-0 grid-background opacity-10" />
          <CardHeader className="text-center space-y-8 py-20 relative">
            <div className="space-y-4">
              <CardTitle className="text-4xl md:text-6xl font-bold leading-tight">
                Ready to start building?
              </CardTitle>
              <CardDescription className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Join thousands of developers who are already building amazing projects with Dev8.dev
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
              <Button
                size="lg"
                onClick={() => router.push("/signup")}
                className="bg-gradient-to-r from-primary via-primary to-secondary hover:glow-primary text-lg px-12 py-7 hover-lift group"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-12 py-7 hover-glow-secondary hover-lift">
                View Documentation
              </Button>
            </div>
          </CardHeader>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 py-16">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center space-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary glow-primary">
                  <Code className="h-6 w-6 text-black" />
                </div>
                <span className="text-2xl font-bold text-glow-primary">Dev8.dev</span>
              </div>
              <p className="text-base text-muted-foreground max-w-md leading-relaxed">
                The most powerful cloud development environment. Code from anywhere, deploy instantly, and build amazing things.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Product</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Changelog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Roadmap</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#docs" className="text-muted-foreground hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Guides</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">API Reference</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                © 2025 Dev8.dev. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
