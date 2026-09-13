ALTER TABLE source_sync_runs ADD COLUMN sync_mode TEXT NOT NULL DEFAULT 'incremental';
ALTER TABLE source_sync_runs ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'idle';
ALTER TABLE source_sync_runs ADD COLUMN next_page INTEGER NOT NULL DEFAULT 1;
ALTER TABLE source_sync_runs ADD COLUMN page_count INTEGER;
ALTER TABLE source_sync_runs ADD COLUMN total_items INTEGER;
ALTER TABLE source_sync_runs ADD COLUMN items_synced_total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE source_sync_runs ADD COLUMN last_batch_at TEXT;
