"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FolderTree,
  LayoutDashboard,
  Link2,
  ShoppingBag,
  Users,
} from "lucide-react";
import { cn } from "@/lib/format";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/affiliate", label: "Affiliate links", icon: Link2 },
  { href: "/admin/taxonomy", label: "Categories & brands", icon: FolderTree },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 px-3 py-2.5 text-[11px] uppercase tracking-[0.12em] transition-colors",
              active ? "bg-ink text-cream" : "text-graphite hover:bg-cream",
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
