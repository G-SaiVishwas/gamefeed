import { Redis } from "@upstash/redis";
import type { WaitlistEntry } from "./types";

const WAITLIST_KEY = "gamefeed:waitlist";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function isWaitlistStorageConfigured(): boolean {
  return getRedis() !== null;
}

export async function addWaitlistEntry(
  name: string,
  email: string
): Promise<{ entry?: WaitlistEntry; duplicate: boolean }> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Waitlist storage is not configured");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await getWaitlistEntries();

  if (existing.some((e) => e.email.toLowerCase() === normalizedEmail)) {
    return { duplicate: true };
  }

  const entry: WaitlistEntry = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    createdAt: Date.now(),
  };

  await redis.lpush(WAITLIST_KEY, JSON.stringify(entry));
  return { entry, duplicate: false };
}

export async function getWaitlistEntries(): Promise<WaitlistEntry[]> {
  const redis = getRedis();
  if (!redis) return [];

  const raw = await redis.lrange(WAITLIST_KEY, 0, -1);
  if (!raw || raw.length === 0) return [];

  return raw
    .map((item) => {
      if (typeof item === "string") return JSON.parse(item) as WaitlistEntry;
      return item as WaitlistEntry;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}
