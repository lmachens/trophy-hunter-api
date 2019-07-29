export interface TimelineDTO {
  frames: {
    participantFrames: {
      [participantId: string]: {
        participantId: number;
        position: { x: number; y: number };
        currentGold: number;
        totalGold: number;
        level: number;
        xp: number;
        minionsKilled: number;
        jungleMinionsKilled: number;
        dominionScore: number;
        teamScore: number;
      };
    };
    events: TimelineEvent[];
  }[];
}

export interface TimelineEvent {
  type: string;
  timestamp: number;
  participantId: number;
  itemId: number;
  killerId?: number;
}
