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

export type Document = {
  id: string;
  author_id: string;
  author_tag: string;
  link: string;
  title: string;
  ch_sett_id: string;
}

export type Vote = {
  id: string;
  message_id: string;
  user_id: string;
  user_tag: string;
}
