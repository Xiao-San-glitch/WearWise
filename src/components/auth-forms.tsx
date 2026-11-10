"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  name,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  name?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="input"
      />
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="input pr-12"
        />
        <button
          type="button"
          onClick={() => setVisible((state) => !state)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700" role="alert">
      {children}
    </p>
  );
}

export function LoginForm({ next }: { next?: string } = {}) {
  const router = useRouter();
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to sign in.");
        setLoading(false);
        return;
      }
      router.push(destination);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  function fill(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  }

  return (
    <div>
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorNote>{error}</ErrorNote>}
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
        <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" placeholder="Your password" />
        <div className="flex items-center justify-between text-[11px]">
          <Link href="/forgot-password" className="text-smoke underline underline-offset-2 hover:text-ink">
            Forgot password?
          </Link>
          <Link href="/signup" className="text-smoke hover:text-ink">
            New here? Create an account
          </Link>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-3.5 w-3.5" /></>}
        </button>
      </form>

      <div className="mt-8 border border-ink/10 bg-cream/70 p-4">
        <p className="text-[10px] uppercase tracking-[0.16em] text-smoke">Demo access</p>
        <div className="mt-3 space-y-2">
          <button
            onClick={() => fill("demo@wearwise.ai", "Demo@12345")}
            className="flex w-full items-center justify-between border border-ink/10 bg-paper px-3 py-2 text-left text-xs hover:border-ink"
          >
            <span>
              <span className="block font-medium">Customer</span>
              <span className="text-[11px] text-smoke">demo@wearwise.ai · Demo@12345</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-smoke">Fill</span>
          </button>
          <button
            onClick={() => fill("admin@wearwise.ai", "Admin@12345")}
            className="flex w-full items-center justify-between border border-ink/10 bg-paper px-3 py-2 text-left text-xs hover:border-ink"
          >
            <span>
              <span className="block font-medium">Admin</span>
              <span className="text-[11px] text-smoke">admin@wearwise.ai · Admin@12345</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-smoke">Fill</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to create your account.");
        setLoading(false);
        return;
      }
      router.push("/account");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <ErrorNote>{error}</ErrorNote>}
      <Field label="Full name" value={name} onChange={setName} placeholder="Ananya Sharma" autoComplete="name" />
      <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
      <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters" />
      <div className="space-y-2 pt-1">
        {[
          ["At least 8 characters", password.length >= 8],
          ["One letter and one number", /[a-zA-Z]/.test(password) && /\d/.test(password)],
        ].map(([label, met]) => (
          <p key={String(label)} className="flex items-center gap-2 text-[11px] text-smoke">
            <Check className={`h-3 w-3 ${met ? "text-emerald-700" : "text-stone"}`} /> {label}
          </p>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-stone">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2">Terms</Link> and{" "}
        <Link href="/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
      </p>
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="h-3.5 w-3.5" /></>}
      </button>
      <p className="text-center text-[11px] text-smoke">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-2 hover:text-ink">Sign in</Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setResetUrl("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { message?: string; resetUrl?: string; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to create a reset link.");
        return;
      }
      setMessage(data.message ?? "Check your inbox.");
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <ErrorNote>{error}</ErrorNote>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate reset link"}
        </button>
      </form>

      {message && (
        <div className="border border-ink/10 bg-cream/70 p-4 text-xs leading-relaxed text-graphite">
          <p>{message}</p>
          {resetUrl && (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-smoke">
                Development mode · reset link
              </p>
              <Link
                href={resetUrl.replace(/^https?:\/\/[^/]+/, "")}
                className="mt-1 block break-all text-[11px] underline underline-offset-2"
              >
                {resetUrl}
              </Link>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-[11px] text-smoke">
        <Link href="/login" className="underline underline-offset-2 hover:text-ink">Back to sign in</Link>
      </p>
    </div>
  );
}

export function ResetForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to reset your password.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token || !email) {
    return (
      <div className="border border-ink/10 bg-cream/70 p-5 text-sm text-graphite">
        This reset link is incomplete.{" "}
        <Link href="/forgot-password" className="underline underline-offset-2">
          Request a new one
        </Link>
        .
      </div>
    );
  }

  if (done) {
    return (
      <div className="border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
        Password updated. Taking you to sign in…
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <ErrorNote>{error}</ErrorNote>}
      <div>
        <p className="field-label">Account</p>
        <p className="text-sm text-graphite">{email}</p>
      </div>
      <PasswordField label="New password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters" />
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set new password"}
      </button>
    </form>
  );
}
