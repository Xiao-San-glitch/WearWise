"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "General enquiry", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not send your message.");
        return;
      }
      setStatus("sent");
      setMessage(data.message ?? "Thanks — message received.");
      setForm({ name: "", email: "", subject: "General enquiry", message: "" });
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="border border-emerald-200 bg-emerald-50 p-6">
        <p className="flex items-center gap-2 text-sm text-emerald-900">
          <Check className="h-4 w-4" /> {message}
        </p>
        <button onClick={() => setStatus("idle")} className="mt-4 text-[11px] uppercase tracking-[0.12em] underline underline-offset-2">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {status === "error" && (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">Your name</span>
          <input
            className="input"
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Ananya Sharma"
          />
        </label>
        <label>
          <span className="field-label">Email</span>
          <input
            className="input"
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="you@example.com"
          />
        </label>
      </div>
      <label className="block">
        <span className="field-label">Subject</span>
        <select
          className="input"
          value={form.subject}
          onChange={(event) => setForm({ ...form, subject: event.target.value })}
        >
          <option>General enquiry</option>
          <option>Styling question</option>
          <option>Brand partnership</option>
          <option>Affiliate programme</option>
          <option>Report an issue</option>
        </select>
      </label>
      <label className="block">
        <span className="field-label">Message</span>
        <textarea
          className="input resize-none"
          rows={5}
          required
          minLength={10}
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          placeholder="Tell us what you need — the more detail, the better we can help."
        />
      </label>
      <button type="submit" className="btn-primary" disabled={status === "sending"}>
        {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send message"}
      </button>
      <p className="text-[10px] leading-relaxed text-stone">
        We store your message securely and use it only to reply. See our{" "}
        <a href="/privacy" className="underline underline-offset-2">privacy policy</a>.
      </p>
    </form>
  );
}
