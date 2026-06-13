export function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function formatSocialCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

export function getSocialStats(slideId: string) {
  const h = hashSeed(slideId);
  return {
    likes: 800 + (h % 42000),
    comments: 12 + (h % 890),
  };
}

export function getSiteUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "https://gamefeed-eosin.vercel.app";
}
