export type ChSetting = {
  id: string;
  channel_id: string;
  data: ChSettingsData;
  is_disabled: boolean;
}

export type SubmissionType = 'gsheet' | 'gdoc' | 'tweet' | 'ytvideo'

export type ChSettingsData = {
  allowed_to_vote_roles?: string[];
  awarded_role: string;
  voting_threshold?: number;
  title: string;
  submission_types?: SubmissionType[];
  approver_roles?: string[];
  approver_users?: string[];
  approval_threshold?: number;
  submission_threshold?: number;
  message_color?: string;
  submitter_roles?: string[];
}

export type User = {
  id: string;
  tag: string;
}

export type Submission = {
  id: string;
  link: string;
  title: string | null;
  user: User;
  ch_settings: ChSetting;
  submission_type: SubmissionType;
  is_candidate: boolean;
  message_id: string | null;
  usr_message_id: string | null;
}

export type Vote = {
  id: string;
  message_id: string;
  in_favor: boolean;
  user: User;
  is_approval?: boolean;
}
