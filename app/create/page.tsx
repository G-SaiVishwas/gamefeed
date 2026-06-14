import PhoneFrame from "@/components/PhoneFrame";
import GameBuilderWizard from "@/components/create/GameBuilderWizard";

export const metadata = {
  title: "Build a Game — GameFeed",
  description: "Guided step-by-step game creation — choose mechanics, assets, and pace before you prompt.",
};

export default function CreatePage() {
  return (
    <div className="feed-locked">
      <PhoneFrame>
        <div className="relative h-full w-full overflow-hidden bg-[#fdf6e3]">
          <GameBuilderWizard />
        </div>
      </PhoneFrame>
    </div>
  );
}
