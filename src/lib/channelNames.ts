import type { ChannelId } from "@/engine";

/** Channel names in plain words: as a choice in the guided flow, and inside a sentence. */
export const PLAIN_CHANNELS: Record<ChannelId, { choice: string; inSentence: string }> = {
  paid_search: { choice: "Ads on Google search", inSentence: "Google search ads" },
  paid_social: {
    choice: "Ads on Instagram and Facebook",
    inSentence: "Instagram and Facebook ads",
  },
  linkedin_ads: { choice: "Ads on LinkedIn", inSentence: "LinkedIn ads" },
  newsletter: { choice: "Sponsoring newsletters", inSentence: "a newsletter sponsorship" },
  influencer: {
    choice: "Creators or influencers talking about it",
    inSentence: "a creator post",
  },
  content_seo: {
    choice: "Writing articles people find on Google",
    inSentence: "articles people find on Google",
  },
};
