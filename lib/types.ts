export const stages = ["installed", "wired", "labelled", "tested"] as const;
export type Stage = typeof stages[number];

export type Device = {
  id: string;
  tag: string;
  kks: string;
  type: string;
  subsystem: string;
  location: string;
  from?: string;
  to?: string;
  notes?: string;
  stages: Record<Stage, boolean>;
  updatedAt?: unknown;
  updatedBy?: string;
};

export const blankStages = (): Record<Stage, boolean> => ({
  installed: false,
  wired: false,
  labelled: false,
  tested: false
});
