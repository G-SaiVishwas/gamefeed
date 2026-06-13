"use client";

interface PhoneFrameProps {
  children: React.ReactNode;
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="aurora-bg flex h-[100dvh] w-full items-center justify-center">
      {/* Desktop: phone mockup */}
      <div className="relative hidden md:block">
        {/* Ambient glow behind device */}
        <div className="absolute -inset-8 rounded-[4rem] bg-indigo-600/10 blur-3xl" />
        <div className="absolute -inset-4 rounded-[3.5rem] bg-violet-600/8 blur-2xl" />

        {/* Device bezel */}
        <div
          className="relative rounded-[3rem] p-3"
          style={{
            background: "linear-gradient(145deg, #2a2a38 0%, #1a1a24 50%, #0f0f16 100%)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.08), 0 25px 80px rgba(0,0,0,0.6), 0 0 120px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {/* Side buttons (decorative) */}
          <div className="absolute -left-[3px] top-28 h-12 w-[3px] rounded-l-sm bg-[#2a2a38]" />
          <div className="absolute -left-[3px] top-44 h-16 w-[3px] rounded-l-sm bg-[#2a2a38]" />
          <div className="absolute -right-[3px] top-36 h-20 w-[3px] rounded-r-sm bg-[#2a2a38]" />

          {/* Screen area */}
          <div
            className="relative overflow-hidden rounded-[2.25rem] bg-[#06060a]"
            style={{
              height: "min(92dvh, 880px)",
              aspectRatio: "9 / 19.5",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
            }}
          >
            {/* Dynamic island */}
            <div className="pointer-events-none absolute left-1/2 top-3 z-50 -translate-x-1/2">
              <div
                className="h-[26px] w-[100px] rounded-full"
                style={{
                  background: "#000",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.06)",
                }}
              />
            </div>

            {/* Screen content */}
            <div className="relative h-full w-full overflow-hidden">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: edge-to-edge */}
      <div className="relative h-[100dvh] w-full overflow-hidden md:hidden">
        {children}
      </div>
    </div>
  );
}
