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
        <div className="text-center space-y-8 fade-in">
          <div className="inline-flex items-center space-x-2 rounded-full border border-primary/50 bg-primary/10 px-4 py-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium">Now with AI-powered code completion</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Code in the
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent text-glow-primary">
              Cloud, Deploy Instantly
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            The most powerful cloud development environment. Write, test, and deploy your applications
            with zero configuration. Start coding in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => router.push("/signup")}
              className="bg-gradient-to-r from-primary to-secondary hover:glow-primary text-lg px-8"
            >
              Start Building Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 hover:glow-secondary">
              Watch Demo
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span>Free forever plan</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold">
            Everything you need to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary"> build faster</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete development environment with all the tools you need, accessible from anywhere
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group border-border bg-card/50 backdrop-blur hover:bg-card hover:glow-primary hover-lift transition-all duration-300 cursor-pointer"
              >
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="border-primary/50 bg-gradient-to-br from-card via-primary/5 to-secondary/5 glow-primary">
          <CardHeader className="text-center space-y-6 py-16">
            <CardTitle className="text-4xl md:text-5xl font-bold">
              Ready to start building?
            </CardTitle>
            <CardDescription className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of developers who are already building amazing projects with Dev8.dev
            </CardDescription>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => router.push("/signup")}
                className="bg-gradient-to-r from-primary to-secondary hover:glow-primary text-lg px-8"
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                <Code className="h-5 w-5 text-black" />
              </div>
              <span className="text-lg font-bold">Dev8.dev</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Dev8.dev. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
