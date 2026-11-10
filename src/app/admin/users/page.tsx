import { getDb } from "@/lib/db";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  const db = getDb();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Community</p>
          <h1 className="display mt-2 text-[clamp(1.8rem,3.2vw,2.6rem)]">Registered users</h1>
          <p className="mt-1 text-sm text-smoke">{db.users.length} accounts · server-side role checks</p>
        </div>
        <Badge tone="dark">{db.users.filter((user) => user.role === "admin").length} admins</Badge>
      </div>

      <div className="mt-6 overflow-x-auto border border-ink/10">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-ink/10 bg-cream text-[9px] uppercase tracking-[0.14em] text-smoke">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Saved looks</th>
              <th className="px-4 py-3 font-medium">AI requests</th>
              <th className="px-4 py-3 font-medium">Style</th>
            </tr>
          </thead>
          <tbody>
            {[...db.users].reverse().map((user) => {
              const looks = db.outfits.filter((outfit) => outfit.userId === user.id).length;
              const requests = db.aiHistory.filter((entry) => entry.userId === user.id).length;
              return (
                <tr key={user.id} className="border-b border-ink/5 text-xs">
                  <td className="px-4 py-3">
                    <p className="text-[12px] font-medium">{user.name}</p>
                    <p className="text-[10px] text-stone">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] ${
                        user.role === "admin" ? "bg-ink text-cream" : "border border-ink/15 text-smoke"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-smoke">
                    {new Date(user.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 tabular">{looks}</td>
                  <td className="px-4 py-3 tabular">{requests}</td>
                  <td className="px-4 py-3 text-[11px] text-smoke">
                    {[user.preferences.style, user.preferences.occasion, user.preferences.audience]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-stone">
        Passwords are stored as salted scrypt hashes and are never displayed. Role changes require
        database access in this demo.
      </p>
    </div>
  );
}
