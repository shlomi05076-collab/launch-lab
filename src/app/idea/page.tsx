import type { Metadata } from "next";
import { IdeaFlow } from "@/components/idea/IdeaFlow";

export const metadata: Metadata = {
  title: "Test my idea",
  description:
    "Seven plain questions, then what would have to be true for your idea to earn back its marketing spend.",
};

export default function IdeaPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <IdeaFlow />
    </div>
  );
}
