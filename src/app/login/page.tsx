import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthLayout } from "@/components/auth-layout";
import { LoginForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;
  const user = await getSessionUser();
  if (user) redirect(safeNext ?? "/account");

  return (
    <AuthLayout
      image="/products/31651963.jpg"
      quote="The stylist told me why the drape worked. I've been dressing better ever since."
      quoteMeta="Meera K. · Mumbai"
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Pick up your saved looks, stylist history and wishlist where you left them."
    >
      <LoginForm next={safeNext} />
    </AuthLayout>
  );
}
