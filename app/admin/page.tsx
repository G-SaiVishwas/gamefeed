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
    <div className="aurora-bg min-h-screen overflow-y-auto px-4 py-10 text-[#2b2b3a] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#3b82f6]">
            Admin
          </p>
          <h1
            className="text-2xl font-bold tracking-tight text-[#2b2b3a]"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Waitlist Signups
          </h1>
          <p className="mt-2 text-sm text-[#2b2b3a]/60">
            View and export everyone who joined the waitlist.
          </p>
        </div>

        {!authed ? (
          <form onSubmit={handleLogin} className="glass-card max-w-sm rounded-2xl p-6">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#2b2b3a]/50">
              Admin Password
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter ADMIN_SECRET"
              className="mb-4 w-full rounded-xl border-2 border-[#2b2b3a]/20 bg-white px-4 py-3 text-sm text-[#2b2b3a] placeholder:text-[#2b2b3a]/35 outline-none focus:border-[#3b82f6]"
            />
            {error && <p className="mb-3 text-sm font-medium text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full rounded-xl border-2 border-[#2b2b3a] bg-gradient-to-r from-sky-400 to-blue-500 py-3 text-sm font-semibold text-white shadow-[3px_3px_0_#2b2b3a] disabled:opacity-50"
            >
              {loading ? "Loading..." : "Access Waitlist"}
            </button>
          </form>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-sm font-semibold text-[#2b2b3a]/70">
                {entries.length} signup{entries.length !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => fetchEntries(token)}
                  className="rounded-lg border-2 border-[#2b2b3a] bg-white px-4 py-2 text-sm font-semibold text-[#2b2b3a] shadow-[2px_2px_0_#2b2b3a]"
                >
                  Refresh
                </button>
                <button
                  onClick={() => exportCsv(entries)}
                  disabled={entries.length === 0}
                  className="rounded-lg border-2 border-[#2b2b3a] bg-white px-4 py-2 text-sm font-semibold text-[#2b2b3a] shadow-[2px_2px_0_#2b2b3a] disabled:opacity-40"
                >
                  Export CSV
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border-2 border-[#2b2b3a]/25 bg-white/80 px-4 py-2 text-sm font-medium text-[#2b2b3a]/70"
                >
                  Logout
                </button>
              </div>
            </div>

            {entries.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center text-[#2b2b3a]/45">
                No signups yet.
              </div>
            ) : (
              <div className="glass-card overflow-hidden rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="border-b-2 border-[#2b2b3a]/10 bg-[#fdf6e3]/80 text-[10px] uppercase tracking-widest text-[#2b2b3a]/50">
                        <th className="px-5 py-3 font-semibold">Name</th>
                        <th className="px-5 py-3 font-semibold">Email</th>
                        <th className="px-5 py-3 font-semibold">Signed Up</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b border-[#2b2b3a]/8 hover:bg-[#fdf6e3]/50"
                        >
                          <td className="px-5 py-3 font-semibold text-[#2b2b3a]">{entry.name}</td>
                          <td className="px-5 py-3 font-mono text-[#2b2b3a]/75">{entry.email}</td>
                          <td className="px-5 py-3 font-mono text-xs text-[#2b2b3a]/55">
                            {formatDate(entry.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
