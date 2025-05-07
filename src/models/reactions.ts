
import { ReactNode } from "react";

export type Reaction = {
  emoji: ReactNode;
  comment: string;
  timestamp?: number;
};

export type CollectedReactions = {
  reactions: Reaction[];
  totalCount: number;
};
