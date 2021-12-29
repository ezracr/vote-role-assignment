export type Setting = {
  id: string;
  data: SettingsData;
}

export type SettingsData = {
  allowed_to_vote_roles: string[];
  awarded_role: string;
  voting_threshold: number;
  title: string;
}
