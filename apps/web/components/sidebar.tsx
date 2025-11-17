"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Cloud,
  LayoutDashboard,
  Boxes,
  Bot,
  Settings,
  CreditCard,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Workspaces", href: "/workspaces", icon: Boxes },
  { title: "Ai Agents", href: "/ai-agents", icon: Bot },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Billing/Usage", href: "/billing-usage", icon: CreditCard },
  { title: "Reporting", href: "/reporting", icon: BarChart3 },
];

// No bottom nav items for this sidebar design
const bottomNavItems: NavItem[] = [];

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-20" : "w-64",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo/Brand */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary glow-primary">
                <Cloud className="h-5 w-5 text-black" />
              </div>
              <span className="text-xl font-bold text-glow-primary">CloudIDEX</span>
            </Link>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary glow-primary mx-auto">
              <Cloud className="h-5 w-5 text-black" />
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:glow-primary transition-all"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/20 text-primary glow-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center"
                )}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && (
                  <span className="absolute left-full ml-6 hidden w-auto min-w-max rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground group-hover:block border border-border shadow-lg">
                    {item.title}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation - intentionally left minimal to match design */}
        {bottomNavItems.length > 0 && (
          <div className="border-t border-border p-3 space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/20 text-primary glow-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center"
                  )}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary")} />
                  {!collapsed && <span className="flex-1">{item.title}</span>}
                  {collapsed && (
                    <span className="absolute left-full ml-6 hidden w-auto min-w-max rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground group-hover:block border border-border shadow-lg">
                      {item.title}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
