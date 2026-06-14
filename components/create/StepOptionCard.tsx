"use client";

interface StepOptionCardProps {
  emoji: string;
  label: string;
  description: string;
  selected: boolean;
  accent?: string;
  onSelect: () => void;
}

export default function StepOptionCard({
  emoji,
  label,
  description,
  selected,
  accent = "#3b82f6",
  onSelect,
}: StepOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-xl border-2 px-3 py-3 text-left transition-transform active:scale-[0.98]"
      style={{
        borderColor: selected ? accent : "#2b2b3a",
        background: selected ? `${accent}14` : "#ffffff",
        boxShadow: selected ? `3px 3px 0 ${accent}` : "3px 3px 0 #2b2b3a",
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#2b2b3a]">{label}</p>
          <p className="mt-0.5 text-xs leading-snug text-[#2b2b3a]/65">{description}</p>
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
    </button>
  );
}
