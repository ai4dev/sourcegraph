BEGIN;

ALTER TABLE changesets ADD COLUMN IF NOT EXISTS created_by_campaign boolean DEFAULT false NOT NULL;

COMMIT;
