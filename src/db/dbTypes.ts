export type ChSetting = {
  id: string;
  data: ChSettingsData;
}

export type ChSettingsData = {
  allowed_to_vote_roles?: string[];
  awarded_role: string;
  voting_threshold: number;
  title: string;
}
