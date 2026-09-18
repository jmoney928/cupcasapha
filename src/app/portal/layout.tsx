import Link from "next/link";
import type { Metadata } from "next";
import { Mark } from "@/components/brand";
import { TabBar, SideNav, type NavItem } from "@/components/app/nav";
import { CafeSwitcher } from "@/components/app/cafe-switcher";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: { default: "Portal", template: "%s · Cup Casa portal" }, robots: { index: false } };

const items: NavItem[] = [
  { href: "/portal", label: "Stock", icon: "🥤", exact: true },
  { href: "/portal/reorders", label: "Reorders", icon: "🔁" },
  { href: "/portal/orders", label: "Orders", icon: "📦" },
  { href: "/portal/settings", label: "Settings", icon: "⚙️" },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { profile, supabase, user } = await requireRole("client");
  const { data: memberships } = await supabase.from("cafe_members").select("cafe:cafes(id, name)").eq("user_id", user.id);
  const cafes = (memberships ?? []).map((m) => m.cafe as { id: string; name: string }).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
  const { cookies } = await import("next/headers");
  const current = (await cookies()).get("cc_cafe")?.value;
  const currentId = cafes.find((c) => c.id === current)?.id ?? cafes[0]?.id ?? "";

  return (
    <div className="min-h-dvh pb-20 md:pb-8">
      <header className="sticky top-0 z-20 border-b bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/portal" aria-label="Portal home"><Mark className="h-7 w-auto" /></Link>
            {cafes.length > 0 && <CafeSwitcher cafes={cafes} currentId={currentId} />}
          </div>
          <div className="flex items-center gap-3">
            <SideNav items={items} variant="top" />
            <form action="/auth/signout" method="post">
              <button className="text-xs font-bold text-cocoa underline-offset-2 hover:underline" title={profile.email ?? ""}>Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
      <TabBar items={items} />
    </div>
  );
}
