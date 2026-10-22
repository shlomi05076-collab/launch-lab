import type { IdeaAnswers } from "@/guided/answers";

export type StepProps = {
  answers: IdeaAnswers;
  update: (patch: Partial<IdeaAnswers>) => void;
};
