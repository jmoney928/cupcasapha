import Link from "next/link";
import type { Metadata } from "next";
import { Mark } from "@/components/brand";
import { SideNav, type NavItem } from "@/components/app/nav";
import { Badge } from "@/components/app/ui";
import { requireStaff } from "@/lib/auth/admin-context";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Cup Casa admin" }, robots: { index: false } };

const staffItems: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "📊", exact: true },
  { href: "/admin/cafes", label: "Cafés", icon: "☕" },
  { href: "/admin/reorders", label: "Reorders", icon: "🔁" },
  { href: "/admin/fulfillment", label: "Fulfillment", icon: "📦" },
  { href: "/admin/sms", label: "SMS inbox", icon: "💬" },
];
const adminItems: NavItem[] = [
  { href: "/admin/products", label: "Products", icon: "🏷️" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/audit", label: "Audit log", icon: "🧾" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireStaff();
  const items = profile.role === "admin" ? [...staffItems, ...adminItems] : staffItems;
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b bg-white/60 md:sticky md:top-0 md:h-dvh md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-3 md:flex-col md:items-start md:gap-4 md:py-5">
          <Link href="/admin" className="flex items-center gap-2"><Mark className="h-7 w-auto" /><span className="font-display text-sm font-extrabold">Admin</span></Link>
          <div className="flex items-center gap-2 text-xs md:order-last">
            <Badge value={profile.role} />
            <span className="hidden max-w-[120px] truncate text-cocoa md:inline" title={profile.email ?? ""}>{profile.full_name || profile.email}</span>
            <form action="/auth/signout" method="post"><button className="font-bold underline-offset-2 hover:underline">Sign out</button></form>
          </div>
        </div>
        <div className="px-3 pb-3 md:px-3">
          <SideNav items={items} />
        </div>
      </aside>
      <main className="min-w-0 px-4 py-5 md:px-8 md:py-7">{children}</main>
    </div>
  );
}
