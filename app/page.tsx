import FeedContainer from "@/components/FeedContainer";
import PhoneFrame from "@/components/PhoneFrame";

export default function Home() {
  return (
    <div className="feed-locked">
      <PhoneFrame>
        <FeedContainer />
      </PhoneFrame>
    </div>
  );
}
