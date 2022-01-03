CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS channel_settings(
  "id" text PRIMARY KEY COLLATE "C",
  "data" jsonb,
  "created" timestamp WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS documents(
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "user_id" text COLLATE "C" NOT NULL,
  "link" text NOT NULL,
  "title" text,
  "created" timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  "ch_sett_id" text COLLATE "C",
  UNIQUE("user_id", "link")
);

CREATE TABLE IF NOT EXISTS votes(
  "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  "message_id" text COLLATE "C" NOT NULL,
  "user_id" text COLLATE "C" NOT NULL,
  "in_favor" boolean NOT NULL,
  "created" timestamp WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE("message_id", "user_id")
);

CREATE TABLE IF NOT EXISTS users(
  "id" text COLLATE "C" NOT NULL PRIMARY KEY,
  "tag" text NOT NULL,
  "created" timestamp WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE OR REPLACE VIEW documents_full AS
  SELECT documents.*, row_to_json(users.*) "user"
  FROM documents
    LEFT JOIN users ON documents."user_id" = users."id";

CREATE OR REPLACE VIEW votes_full AS
  SELECT votes.*, row_to_json(users.*) "user"
  FROM votes
    LEFT JOIN users ON votes."user_id" = users."id";

ALTER TABLE documents
  -- ADD CONSTRAINT documents_ch_sett_id_id_fk FOREIGN KEY ("ch_sett_id")
  --   REFERENCES channel_settings ("id") ON UPDATE RESTRICT ON DELETE CASCADE,
  ADD CONSTRAINT documents_users_id_fk FOREIGN KEY ("user_id")
    REFERENCES users ("id") ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE votes
  ADD CONSTRAINT votes_users_id_fk FOREIGN KEY ("user_id")
    REFERENCES users ("id") ON UPDATE RESTRICT ON DELETE RESTRICT;
