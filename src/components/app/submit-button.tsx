"use client";

import { useFormStatus } from "react-dom";
import { btnCls, type BtnVariant } from "./ui";

export function SubmitButton({ children, variant = "primary", size = "md", className = "", confirm }: { children: React.ReactNode; variant?: BtnVariant; size?: "sm" | "md"; className?: string; confirm?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${btnCls(variant, size)} ${className}`}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
