"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { track } from "@/lib/analytics";

interface WaitlistSlideProps {
  isActive: boolean;
}

interface Confetti {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  delay: number;
}

const CONFETTI_COLORS = ["#818cf8", "#c084fc", "#67e8f9", "#f472b6", "#facc15"];

export default function WaitlistSlide({ isActive }: WaitlistSlideProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const reachedRef = useRef(false);

  useEffect(() => {
    if (isActive && !reachedRef.current) {
      reachedRef.current = true;
      track("waitlist_reached");
      track("games_reached", { count: 5 });
    }
    if (!isActive) reachedRef.current = false;
  }, [isActive]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to join waitlist");
      }

      track("waitlist_submitted", { name: name.trim(), email: email.trim() });

      setConfetti(
        Array.from({ length: 30 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          rotation: Math.random() * 360,
          delay: Math.random() * 0.5,
        }))
      );

      setSubmitted(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isActive && !submitted) return null;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-6">
      {/* Mesh gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[#06060a]" />
        <div className="absolute top-0 left-1/2 h-[60%] w-[80%] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[80px]" />
        <div className="absolute bottom-0 right-0 h-[50%] w-[60%] rounded-full bg-violet-600/10 blur-[60px]" />
        <div className="absolute top-1/3 left-0 h-[40%] w-[50%] rounded-full bg-cyan-500/8 blur-[50px]" />
      </div>

      {/* Confetti burst */}
      <AnimatePresence>
        {submitted &&
          confetti.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 1, scale: 0, x: "50vw", y: "50vh" }}
              animate={{
                opacity: [1, 1, 0],
                scale: [0, 1, 0.5],
                x: `${c.x}vw`,
                y: `${c.y}vh`,
                rotate: c.rotation + 360,
              }}
              transition={{ duration: 1.5, delay: c.delay, ease: "easeOut" }}
              className="pointer-events-none absolute h-2 w-2 rounded-sm"
              style={{ background: c.color, boxShadow: `0 0 6px ${c.color}` }}
            />
          ))}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card neon-ring relative z-10 w-full max-w-[280px] rounded-3xl p-6"
          >
            <h1
              className="mb-2 text-center text-2xl font-bold leading-tight tracking-tight text-white"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Would you scroll games instead of videos?
            </h1>
            <p className="mb-8 text-center text-sm leading-relaxed text-white/40">
              We&apos;re exploring a future where gameplay becomes content.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-indigo-500/40 focus:bg-white/6 focus:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-all focus:border-indigo-500/40 focus:bg-white/6 focus:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
              />
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="neon-glow-indigo mt-1 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Joining..." : "Join Waitlist"}
              </motion.button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: "rgba(99,102,241,0.15)",
                boxShadow: "0 0 30px rgba(99,102,241,0.3)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-indigo-400">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
            <h2
              className="mb-2 text-2xl font-bold tracking-tight text-white neon-text"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              You&apos;re in.
            </h2>
            <p className="text-sm text-white/40">
              We&apos;ll let you know when more games arrive.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
