"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GlowMenuItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface GlowMenuProps {
  items: GlowMenuItem[];
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function GlowMenu({ items, className, orientation = "horizontal" }: GlowMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <nav
      className={cn(
        "relative flex rounded-lg border border-border bg-card/50 backdrop-blur-sm p-1",
        orientation === "vertical" ? "flex-col" : "flex-row",
        className
      )}
    >
      {items.map((item, index) => {
        const isActive = activeIndex === index;
        const isHovered = hoverIndex === index;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setActiveIndex(index)}
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
            className={cn(
              "relative z-10 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-300",
              orientation === "vertical" ? "w-full" : "flex-1 justify-center",
              isActive
                ? "text-primary"
                : isHovered
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {/* Glow Effect */}
            {(isActive || isHovered) && (
              <div
                className={cn(
                  "absolute inset-0 -z-10 rounded-md transition-all duration-300",
                  isActive
                    ? "bg-primary/20 glow-primary"
                    : "bg-muted"
                )}
              />
            )}

            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
            <span>{item.label}</span>

            {/* Active Indicator */}
            {isActive && (
              <div
                className={cn(
                  "absolute bg-primary",
                  orientation === "vertical"
                    ? "left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full"
                    : "bottom-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full"
                )}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

interface FloatingGlowMenuProps {
  items: GlowMenuItem[];
  className?: string;
}

export function FloatingGlowMenu({ items, className }: FloatingGlowMenuProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-border bg-card/80 backdrop-blur-md px-2 py-1.5 shadow-lg",
        className
      )}
    >
      {items.map((item, index) => (
        <Link
          key={item.href}
          href={item.href}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
            hoveredIndex === index
              ? "bg-primary/20 text-primary scale-110 glow-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item.icon}

          {/* Tooltip */}
          {hoveredIndex === index && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-lg border border-border animate-in fade-in slide-in-from-bottom-2">
              {item.label}
              <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-popover border-r border-b border-border" />
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
