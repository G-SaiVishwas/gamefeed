"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import StepOptionCard from "@/components/create/StepOptionCard";
import AssetPackCard from "@/components/create/AssetPackCard";
import AgentReveal from "@/components/create/AgentReveal";
import { matchAgent } from "@/lib/create/matchAgent";
import {
  ASSET_PACK_OPTIONS,
  BUILDER_STEPS,
  GOAL_OPTIONS,
  INTERACTION_OPTIONS,
  PACE_OPTIONS,
  SESSION_OPTIONS,
} from "@/lib/create/steps";
import { INITIAL_SELECTIONS, type BuilderSelections } from "@/lib/create/types";

const STEP_ACCENTS = ["#4ade80", "#3b82f6", "#a855f7", "#eab308", "#f97316", "#ec4899"];

function isStepComplete(stepIndex: number, selections: BuilderSelections): boolean {
  switch (stepIndex) {
    case 0:
      return selections.pace !== null;
    case 1:
      return selections.interaction !== null;
    case 2:
      return selections.assetPack !== null;
    case 3:
      return selections.goal !== null;
    case 4:
      return selections.sessionLength !== null;
    case 5:
      return selections.prompt.trim().length >= 12;
    default:
      return false;
  }
}

export default function GameBuilderWizard() {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<BuilderSelections>(INITIAL_SELECTIONS);
  const [revealed, setRevealed] = useState(false);

  const currentStep = BUILDER_STEPS[step];
  const accent = STEP_ACCENTS[step] ?? "#3b82f6";
  const canContinue = isStepComplete(step, selections);
  const isLastStep = step === BUILDER_STEPS.length - 1;

  const match = useMemo(() => matchAgent(selections), [selections]);

  const handleNext = () => {
    if (!canContinue) return;
    if (isLastStep) {
      setRevealed(true);
      return;
    }
    setStep((s) => Math.min(s + 1, BUILDER_STEPS.length - 1));
  };

  const handleBack = () => {
    if (revealed) {
      setRevealed(false);
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const startOver = () => {
    setSelections(INITIAL_SELECTIONS);
    setStep(0);
    setRevealed(false);
  };

  if (revealed) {
    return (
      <AgentReveal
        agent={match.agent}
        confidence={match.confidence}
        reasons={match.reasons}
        selections={selections}
        onStartOver={startOver}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pt-3">
        <div className="mb-3 flex items-center justify-between">
          <Link
            href="/"
            className="text-xs font-semibold text-[#2b2b3a]/50 transition-colors hover:text-[#2b2b3a]"
          >
            ← Feed
          </Link>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#2b2b3a]/40">
            Step {step + 1} of {BUILDER_STEPS.length}
          </span>
        </div>

        <div className="mb-3 flex gap-1">
          {BUILDER_STEPS.map((s, i) => (
            <div
              key={s.id}
              className="h-1.5 flex-1 rounded-full transition-colors duration-300"
              style={{
                background: i <= step ? accent : "rgba(43,43,58,0.12)",
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            <h1
              className="text-xl font-bold text-[#2b2b3a]"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {currentStep.title}
            </h1>
            <p className="mt-1 text-sm text-[#2b2b3a]/75">{currentStep.subtitle}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#2b2b3a]/50">{currentStep.helper}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-2"
          >
            {step === 0 &&
              PACE_OPTIONS.map((opt) => (
                <StepOptionCard
                  key={opt.id}
                  {...opt}
                  accent={accent}
                  selected={selections.pace === opt.id}
                  onSelect={() => setSelections((s) => ({ ...s, pace: opt.id }))}
                />
              ))}

            {step === 1 &&
              INTERACTION_OPTIONS.map((opt) => (
                <StepOptionCard
                  key={opt.id}
                  {...opt}
                  accent={accent}
                  selected={selections.interaction === opt.id}
                  onSelect={() => setSelections((s) => ({ ...s, interaction: opt.id }))}
                />
              ))}

            {step === 2 && (
              <>
                <div className="mb-3 rounded-xl border-2 border-dashed border-[#2b2b3a]/20 bg-white/70 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#2b2b3a]/45">
                    GameFeed asset library
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#2b2b3a]/65">
                    Curated Kenney packs, pre-hosted and ready to drop into your game — the same
                    sprites powering our live feed demos.
                  </p>
                </div>
                {ASSET_PACK_OPTIONS.map((opt) => (
                  <AssetPackCard
                    key={opt.id}
                    pack={opt}
                    accent={accent}
                    selected={selections.assetPack === opt.id}
                    onSelect={() => setSelections((s) => ({ ...s, assetPack: opt.id }))}
                  />
                ))}
              </>
            )}

            {step === 3 &&
              GOAL_OPTIONS.map((opt) => (
                <StepOptionCard
                  key={opt.id}
                  {...opt}
                  accent={accent}
                  selected={selections.goal === opt.id}
                  onSelect={() => setSelections((s) => ({ ...s, goal: opt.id }))}
                />
              ))}

            {step === 4 &&
              SESSION_OPTIONS.map((opt) => (
                <StepOptionCard
                  key={opt.id}
                  {...opt}
                  accent={accent}
                  selected={selections.sessionLength === opt.id}
                  onSelect={() => setSelections((s) => ({ ...s, sessionLength: opt.id }))}
                />
              ))}

            {step === 5 && (
              <div className="space-y-3">
                <div
                  className="rounded-xl border-2 border-[#2b2b3a] bg-white p-3 shadow-[3px_3px_0_#2b2b3a]"
                  style={{ borderColor: accent }}
                >
                  <label htmlFor="game-prompt" className="text-xs font-bold text-[#2b2b3a]/60">
                    Your game idea
                  </label>
                  <textarea
                    id="game-prompt"
                    value={selections.prompt}
                    onChange={(e) => setSelections((s) => ({ ...s, prompt: e.target.value }))}
                    placeholder="e.g. A cozy tap game where fireflies drift across a meadow and you catch them before they fade..."
                    rows={5}
                    className="mt-2 w-full resize-none bg-transparent text-sm leading-relaxed text-[#2b2b3a] outline-none placeholder:text-[#2b2b3a]/35"
                  />
                  <p className="text-right text-[10px] text-[#2b2b3a]/40">
                    {selections.prompt.trim().length}/12 min chars
                  </p>
                </div>

                <div className="rounded-xl bg-white/70 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#2b2b3a]/40">
                    Preview routing
                  </p>
                  <p className="mt-1 text-sm font-bold" style={{ color: match.agent.accent }}>
                    → {match.agent.name}
                  </p>
                  <p className="text-xs text-[#2b2b3a]/55">{match.agent.tagline}</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="shrink-0 flex gap-2 border-t border-[#2b2b3a]/10 bg-[#fdf6e3]/95 px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="flex-1 rounded-xl border-2 border-[#2b2b3a]/25 bg-white py-3 text-sm font-bold text-[#2b2b3a]/60 disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canContinue}
          className="flex-[2] rounded-xl border-2 border-[#2b2b3a] py-3 text-sm font-bold text-[#2b2b3a] shadow-[3px_3px_0_#2b2b3a] disabled:opacity-40"
          style={{ background: canContinue ? accent : "#e5e5e5" }}
        >
          {isLastStep ? "Match my agent" : "Continue"}
        </button>
      </div>
    </div>
  );
}
