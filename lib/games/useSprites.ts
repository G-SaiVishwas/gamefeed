"use client";

import { useEffect, useMemo, useState } from "react";

export function useSprites(urls: Record<string, string>): Record<string, HTMLImageElement> | null {
  const key = useMemo(() => JSON.stringify(urls), [urls]);
  const [sprites, setSprites] = useState<Record<string, HTMLImageElement> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const entries = Object.entries(urls);

    Promise.all(
      entries.map(
        ([name, src]) =>
          new Promise<[string, HTMLImageElement]>((resolve) => {
            const img = new Image();
            img.onload = () => resolve([name, img]);
            img.onerror = () => resolve([name, img]);
            img.src = src;
          })
      )
    ).then((loaded) => {
      if (cancelled) return;
      setSprites(Object.fromEntries(loaded));
    });

    return () => {
      cancelled = true;
    };
  }, [key, urls]);

  return sprites;
}
