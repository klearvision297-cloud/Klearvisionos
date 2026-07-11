ALTER TABLE job_timeline_events ADD COLUMN performedBy TEXT NOT NULL DEFAULT 'System';
ALTER TABLE job_timeline_events ADD COLUMN notes TEXT;
