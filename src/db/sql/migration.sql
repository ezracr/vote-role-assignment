-- 2.0
-- STEP 1
-- Titles can be empty (tweets)
ALTER TABLE documents ALTER COLUMN title DROP NOT NULL;
-- Store a submission type, can be a PK in a different table with more details about the type
ALTER TABLE documents ADD COLUMN submission_type text;
ALTER TABLE documents ADD COLUMN "is_candidate" boolean DEFAULT false;
UPDATE documents SET "is_candidate" = FALSE;
ALTER TABLE documents ADD COLUMN "message_id" text COLLATE "C";
CREATE INDEX CONCURRENTLY documents_message_id_index ON documents ("message_id");
ALTER TABLE documents DROP CONSTRAINT documents_user_id_link_key;
DELETE FROM documents
WHERE id IN
  (SELECT id FROM
    (SELECT id, ROW_NUMBER() OVER(PARTITION BY link ORDER BY  id) AS row_num FROM documents) t
    WHERE t.row_num > 1
  );
ALTER TABLE documents ADD CONSTRAINT documents_link_key UNIQUE("link");
-- Distinquish regular votes from approvals
ALTER TABLE votes ADD COLUMN is_approval boolean DEFAULT false;
ALTER TABLE votes ADD CONSTRAINT votes_message_id_user_id_is_approval_key UNIQUE("message_id", "user_id", "is_approval");
DROP VIEW votes_full;
CREATE OR REPLACE VIEW votes_full AS
  SELECT votes.*, row_to_json(users.*) "user"
  FROM votes
    LEFT JOIN users ON votes."user_id" = users."id";
UPDATE votes SET "is_approval" = FALSE;
DROP VIEW documents_full;
CREATE OR REPLACE VIEW documents_full AS
  SELECT documents.*, row_to_json(users.*) "user", row_to_json(css.*) "ch_settings"
  FROM documents
    LEFT JOIN users ON documents."user_id" = users."id"
    LEFT JOIN channel_settings css ON documents."ch_sett_id" = css."id";
-- STEP 2 - REDEPLOY
-- STEP 3
ALTER TABLE votes DROP CONSTRAINT votes_message_id_user_id_key;
