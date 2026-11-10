import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AuthLayout } from "@/components/auth-layout";
import { SignupForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) redirect("/account");

  return (
    <AuthLayout
      image="/products/291762.jpg"
      quote="Your style. Your budget. Your AI stylist."
      quoteMeta="WearWise AI"
      eyebrow="Join WearWise"
      title="Create your account"
      subtitle="Free personal styling, saved outfits and a wishlist that follows you between devices."
    >
      <SignupForm />
    </AuthLayout>
  );
}
