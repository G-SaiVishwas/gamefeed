"use client";

import { useCallback, useState } from "react";
import type { WaitlistEntry } from "@/lib/waitlist/types";

const STORAGE_KEY = "gamefeed_admin_token";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString();
}

function exportCsv(entries: WaitlistEntry[]) {
  const header = "Name,Email,Signed Up\n";
  const rows = entries
    .map((e) => `"${e.name.replace(/"/g, '""')}","${e.email}",${formatDate(e.createdAt)}`)
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gamefeed-waitlist-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchEntries = useCallback(async (authToken: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid admin password.");
        const data = await res.json();
        throw new Error(data.error ?? "Failed to load waitlist.");
      }
      const data = await res.json();
      setEntries(data.entries);
      setAuthed(true);
      sessionStorage.setItem(STORAGE_KEY, authToken);
      setToken(authToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEntries(token);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
    setToken("");
    setEntries([]);
  };

  return (
    <div className="aurora-bg min-h-screen px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-400">
            Admin
          </p>
          <h1
            className="text-2xl font-bold tracking-tight neon-text"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Waitlist Signups
          </h1>
          <p className="mt-2 text-sm text-white/40">
            View and export everyone who joined the waitlist.
          </p>
        </div>

        {!authed ? (
          <form onSubmit={handleLogin} className="glass-card neon-ring max-w-sm rounded-2xl p-6">
            <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40">
              Admin Password
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter ADMIN_SECRET"
              className="mb-4 w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-indigo-500/40"
            />
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !token}
              className="neon-glow-indigo w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "Loading..." : "Access Waitlist"}
            </button>
          </form>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="font-mono text-sm text-white/50">
                {entries.length} signup{entries.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchEntries(token)}
                  className="glass-card rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white"
                >
                  Refresh
                </button>
                <button
                  onClick={() => exportCsv(entries)}
                  disabled={entries.length === 0}
                  className="glass-card rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white disabled:opacity-40"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/40 hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>

            {entries.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center text-white/30">
                No signups yet.
              </div>
            ) : (
              <div className="glass-card overflow-hidden rounded-2xl">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/8 text-[10px] uppercase tracking-widest text-white/35">
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Signed Up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="border-b border-white/5 hover:bg-white/2">
                        <td className="px-5 py-3 font-medium text-white/80">{entry.name}</td>
                        <td className="px-5 py-3 font-mono text-white/60">{entry.email}</td>
                        <td className="px-5 py-3 font-mono text-xs text-white/35">
                          {formatDate(entry.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
