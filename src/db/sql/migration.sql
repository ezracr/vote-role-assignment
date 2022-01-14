-- 2.0
-- Title can be non empty (tweets)
ALTER TABLE documents ALTER COLUMN title DROP NOT NULL;
-- Store a submission type, can be a PK in a different table with more details about the type
ALTER TABLE documents ADD COLUMN submission_type text;
-- Distinquish regular votes from approvals
ALTER TABLE votes ADD COLUMN is_approval boolean DEFAULT false;
ALTER TABLE votes DROP CONSTRAINT votes_message_id_user_id_key;
ALTER TABLE votes ADD CONSTRAINT votes_message_id_user_id_is_approval_key UNIQUE("message_id", "user_id", "is_approval");
DROP VIEW votes_full;
CREATE OR REPLACE VIEW votes_full AS
  SELECT votes.*, row_to_json(users.*) "user"
  FROM votes
    LEFT JOIN users ON votes."user_id" = users."id";
UPDATE votes SET "is_approval" = FALSE;
DROP VIEW documents;
CREATE OR REPLACE VIEW documents_full AS
  SELECT documents.*, row_to_json(users.*) "user", row_to_json(css.*) "ch_settings"
  FROM documents
    LEFT JOIN users ON documents."user_id" = users."id"
    LEFT JOIN channel_settings css ON documents."ch_sett_id" = css."id";
