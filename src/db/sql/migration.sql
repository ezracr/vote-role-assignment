-- 2.0
-- Store a submission type, can be a PK in a different table with more details about the type
ALTER TABLE documents ADD COLUMN submission_type text;
-- Title can be non empty (tweets)
ALTER TABLE documents ALTER COLUMN title DROP NOT NULL;
