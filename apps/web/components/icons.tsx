import { LucideProps } from "lucide-react";

export function IconWrapper({
  children,
  className,
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center justify-center ${
        glow ? "glow-primary" : ""
      } ${className || ""}`}
    >
      {children}
    </div>
  );
}

export function GlowIcon({
  Icon,
  className,
  glowColor = "primary",
  ...props
}: {
  Icon: React.ComponentType<LucideProps>;
  className?: string;
  glowColor?: "primary" | "secondary" | "accent";
} & LucideProps) {
  const glowClass = `glow-${glowColor}`;

  return (
    <div className={`inline-flex ${glowClass}`}>
      <Icon className={className} {...props} />
    </div>
  );
}

interface AnimatedIconProps extends LucideProps {
  Icon: React.ComponentType<LucideProps>;
  animation?: "pulse" | "spin" | "bounce";
  className?: string;
}

export function AnimatedIcon({
  Icon,
  animation = "pulse",
  className,
  ...props
}: AnimatedIconProps) {
  const animationClass =
    animation === "pulse"
      ? "animate-pulse"
      : animation === "spin"
      ? "animate-spin"
      : "animate-bounce";

  return <Icon className={`${animationClass} ${className || ""}`} {...props} />;
}
