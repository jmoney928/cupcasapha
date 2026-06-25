"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "leaf" | "outline" | "cream" | "dark";
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-coral text-cream shadow-[0_8px_0_0_#c4452a] hover:shadow-[0_5px_0_0_#c4452a]",
  leaf: "bg-leaf text-cream shadow-[0_8px_0_0_#3f7d28] hover:shadow-[0_5px_0_0_#3f7d28]",
  dark: "bg-espresso text-cream shadow-[0_8px_0_0_#1d120b] hover:shadow-[0_5px_0_0_#1d120b]",
  cream:
    "bg-cream text-espresso shadow-[0_8px_0_0_#d6a878] hover:shadow-[0_5px_0_0_#d6a878]",
  outline:
    "bg-transparent text-espresso border-2 border-espresso hover:bg-espresso hover:text-cream",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
}: ButtonProps) {
  const cls = `btn-pill ${variants[variant]} ${sizes[size]} ${className}`;
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.7s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
  color = "coral",
}: {
  children: ReactNode;
  color?: "coral" | "leaf" | "caramel";
}) {
  const map = {
    coral: "bg-coral/15 text-coral",
    leaf: "bg-leaf/15 text-[#3f7d28]",
    caramel: "bg-caramel/20 text-cocoa",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wide ${map[color]}`}
    >
      {children}
    </span>
  );
}
