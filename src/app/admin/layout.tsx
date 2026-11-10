import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Shield } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { SignOutButton } from "@/components/account-forms";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/account");

  return (
    <div>
      <div className="border-b border-ink/10 bg-ink text-cream">
        <div className="container-ww flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em]">
            <Shield className="h-3.5 w-3.5" /> Admin studio · server-verified access
          </div>
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.12em] text-cream/60">
            <span>{user.email}</span>
            <Link href="/" className="flex items-center gap-1 hover:text-cream">
              Storefront <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="container-ww py-9">
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside>
            <AdminNav />
            <div className="mt-6 hidden border border-ink/10 p-4 lg:block">
              <p className="text-[10px] uppercase tracking-[0.14em] text-smoke">Signed in as</p>
              <p className="mt-1 text-sm">{user.name}</p>
              <div className="mt-4">
                <SignOutButton />
              </div>
            </div>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
