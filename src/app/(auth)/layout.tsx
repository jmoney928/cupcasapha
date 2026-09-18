import Link from "next/link";
import { Logo } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8"><Logo className="h-8 w-auto" priority /></Link>
      <div className="w-full max-w-md rounded-3xl border bg-white/80 p-6 shadow-sm md:p-8">{children}</div>
      <p className="mt-6 text-xs text-cocoa">Café portal &amp; Cup Casa staff access</p>
    </div>
  );
}
