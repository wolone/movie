ALTER TABLE source_sync_runs ADD COLUMN lock_token TEXT;
ALTER TABLE source_sync_runs ADD COLUMN lock_until TEXT;
