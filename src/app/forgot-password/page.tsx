import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { ForgotForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      image="/products/8750998.jpg"
      quote="Good style is a system, not a secret."
      quoteMeta="The WearWise studio"
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter the email on your account and we'll generate a secure reset link, valid for 30 minutes."
    >
      <ForgotForm />
    </AuthLayout>
  );
}
