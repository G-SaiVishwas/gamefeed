"use client";

import Image from "next/image";
import type { AssetPackOption } from "@/lib/create/steps";

interface AssetPackCardProps {
  pack: AssetPackOption;
  selected: boolean;
  accent?: string;
  onSelect: () => void;
}

export default function AssetPackCard({
  pack,
  selected,
  accent = "#a855f7",
  onSelect,
}: AssetPackCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full overflow-hidden rounded-xl border-2 text-left transition-transform active:scale-[0.98]"
      style={{
        borderColor: selected ? accent : "#2b2b3a",
        background: selected ? `${accent}10` : "#ffffff",
        boxShadow: selected ? `3px 3px 0 ${accent}` : "3px 3px 0 #2b2b3a",
      }}
    >
      <div className="flex items-start gap-3 px-3 pt-3">
        <span className="text-2xl leading-none" aria-hidden>
          {pack.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[#2b2b3a]">{pack.label}</p>
            <span className="rounded-full bg-[#2b2b3a]/8 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#2b2b3a]/55">
              {pack.includes}
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-snug text-[#2b2b3a]/65">{pack.description}</p>
        </div>
        <span
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold"
          style={{
            borderColor: selected ? accent : "#2b2b3a55",
            background: selected ? accent : "transparent",
            color: selected ? "#fff" : "transparent",
          }}
          aria-hidden
        >
          {selected ? "✓" : ""}
        </span>
      </div>

      <div
        className="mx-3 mt-2.5 mb-3 flex items-end justify-center gap-1.5 rounded-lg border border-[#2b2b3a]/10 px-2 py-2.5"
        style={{ background: pack.previewBg }}
      >
        {pack.previews.map((item) => (
          <div
            key={item.src}
            className="flex flex-col items-center gap-0.5"
            title={item.label}
          >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-md bg-white/40 p-0.5">
              <Image
                src={item.src}
                alt={item.label}
                width={40}
                height={40}
                className="h-auto max-h-9 w-auto max-w-9 object-contain"
                unoptimized
              />
            </div>
            <span className="text-[8px] font-medium text-[#2b2b3a]/50">{item.label}</span>
          </div>
        ))}
      </div>
    </button>
  );
}
