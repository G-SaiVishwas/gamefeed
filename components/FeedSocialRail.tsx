"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatSocialCount, getSiteUrl, getSocialStats } from "@/lib/social/utils";

interface FeedSocialRailProps {
  slideId: string;
}

export default function FeedSocialRail({ slideId }: FeedSocialRailProps) {
  const stats = useMemo(() => getSocialStats(slideId), [slideId]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(stats.likes);
  const [shared, setShared] = useState(false);

  const handleLike = () => {
    setLiked((prev) => {
      setLikeCount((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
  };

  const handleShare = async () => {
    const url = getSiteUrl();
    try {
      if (navigator.share) {
        await navigator.share({
          title: "GameFeed",
          text: "Scroll games instead of videos",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <div className="pointer-events-auto absolute right-3 bottom-28 z-40 flex flex-col items-center gap-5">
      {/* Like */}
      <button type="button" onClick={handleLike} className="flex flex-col items-center gap-1">
        <motion.div whileTap={{ scale: 0.85 }}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill={liked ? "#ec4899" : "none"}
            className={liked ? "drop-shadow-[0_0_4px_rgba(236,72,153,0.4)]" : ""}
          >
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              stroke={liked ? "#ec4899" : "#2b2b3a"}
              strokeWidth="1.5"
            />
          </svg>
        </motion.div>
        <span className="text-[11px] font-semibold text-[#2b2b3a] drop-shadow-sm">
          {formatSocialCount(likeCount)}
        </span>
      </button>

      {/* Comments (visual only) */}
      <div className="flex flex-col items-center gap-1">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-[#2b2b3a] drop-shadow-sm">
          <path
            d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[11px] font-semibold text-[#2b2b3a] drop-shadow-sm">
          {formatSocialCount(stats.comments)}
        </span>
      </div>

      {/* Share */}
      <button type="button" onClick={handleShare} className="flex flex-col items-center gap-1">
        <motion.div whileTap={{ scale: 0.85 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-[#2b2b3a]">
            <path
              d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
        <span className="text-[11px] font-semibold text-[#2b2b3a] drop-shadow-sm">
          {shared ? "Copied!" : "Share"}
        </span>
      </button>
    </div>
  );
}
