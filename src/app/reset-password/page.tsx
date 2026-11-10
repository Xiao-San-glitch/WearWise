import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { ResetForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthLayout
      image="/products/13153053.jpg"
      quote="Quiet luxury is just good decisions, repeated."
      quoteMeta="The WearWise studio"
      eyebrow="Almost there"
      title="Set a new password"
      subtitle="Choose something you'll remember. At least 8 characters."
    >
      <ResetForm token={params.token ?? ""} email={params.email ?? ""} />
    </AuthLayout>
  );
}
