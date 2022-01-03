export type ChSetting = {
  id: string;
  channel_id: string;
  data: ChSettingsData;
}

export type ChSettingsData = {
  allowed_to_vote_roles?: string[];
  awarded_role: string;
  voting_threshold: number;
  title: string;
}

export type User = {
  id: string;
  tag: string;
}

export type Document = {
  id: string;
  link: string;
  title: string;
  user: User;
  ch_settings: ChSetting;
}

export type Vote = {
  id: string;
  message_id: string;
  in_favor: boolean;
  user: User;
}
