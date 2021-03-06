CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS channel_settings(
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "channel_id" text COLLATE "C" NOT NULL,
  "data" jsonb NOT NULL,
  "created" timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  "is_disabled" boolean DEFAULT false NOT NULL,
  UNIQUE("channel_id")
);

CREATE TABLE IF NOT EXISTS documents(
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "user_id" text COLLATE "C" NOT NULL,
  "link" text NOT NULL,
  "title" text,
  "description" text,
  "created" timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  "ch_sett_id" uuid NOT NULL,
  "submission_type" text,
  "is_candidate" boolean DEFAULT false,
  "message_id" text COLLATE "C",
  "usr_message_id" text COLLATE "C",
  "hash" bit(64),
  UNIQUE("link")
);

CREATE INDEX CONCURRENTLY documents_message_id_index ON documents ("message_id");
CREATE INDEX CONCURRENTLY documents_usr_message_id_index ON documents ("usr_message_id");
CREATE INDEX CONCURRENTLY documents_created_id_index ON documents ("created", "id");

CREATE TABLE IF NOT EXISTS votes(
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "message_id" text COLLATE "C" NOT NULL,
  "user_id" text COLLATE "C" NOT NULL,
  "in_favor" boolean NOT NULL,
  "is_approval" boolean DEFAULT false,
  "created" timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE("message_id", "user_id", "is_approval")
);

CREATE TABLE IF NOT EXISTS users(
  "id" text COLLATE "C" NOT NULL PRIMARY KEY,
  "tag" text NOT NULL,
  "created" timestamp WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE OR REPLACE VIEW documents_full AS
  SELECT documents.*, row_to_json(users.*) "user", row_to_json(css.*) "ch_settings"
  FROM documents
    LEFT JOIN users ON documents."user_id" = users."id"
    LEFT JOIN channel_settings css ON documents."ch_sett_id" = css."id";

CREATE OR REPLACE VIEW votes_full AS
  SELECT votes.*, row_to_json(users.*) "user"
  FROM votes
    LEFT JOIN users ON votes."user_id" = users."id";

ALTER TABLE documents
  ADD CONSTRAINT documents_ch_sett_id_id_fk FOREIGN KEY ("ch_sett_id")
    REFERENCES channel_settings ("id") ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT documents_users_id_fk FOREIGN KEY ("user_id")
    REFERENCES users ("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE votes
  ADD CONSTRAINT votes_users_id_fk FOREIGN KEY ("user_id")
    REFERENCES users ("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

-- todo much slower when using a function instead of inlining in a select query
-- For some reason does not create another worker when queried with this function
-- CREATE OR REPLACE FUNCTION hamming_distance(
--  first bit(64), second bit(64)
-- )
-- RETURNS smallint AS $$
-- BEGIN
-- RETURN
--     length(replace((first # second)::text, '0', ''));
-- END;
-- $$ LANGUAGE plpgsql;
