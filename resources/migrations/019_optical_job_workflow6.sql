-- Workflow #6 keeps repair work outside the prescription-invoice workflow.
ALTER TABLE optical_jobs ADD COLUMN assignedLab TEXT;

CREATE TABLE repair_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jobNumber TEXT NOT NULL UNIQUE,
  customerId INTEGER NOT NULL,
  itemReceived TEXT NOT NULL,
  complaint TEXT NOT NULL,
  charges REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'NEW',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE RESTRICT
);

CREATE TABLE repair_job_timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repairJobId INTEGER NOT NULL,
  eventType TEXT NOT NULL,
  description TEXT NOT NULL,
  performedBy TEXT NOT NULL DEFAULT 'System',
  notes TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (repairJobId) REFERENCES repair_jobs(id) ON DELETE CASCADE
);

CREATE INDEX idx_repair_jobs_status_created ON repair_jobs(status, createdAt DESC);
CREATE INDEX idx_repair_jobs_customer ON repair_jobs(customerId, updatedAt DESC);
CREATE INDEX idx_repair_job_timeline_events_job ON repair_job_timeline_events(repairJobId, createdAt DESC);

-- Keep existing repair records usable, but move their operational identity out
-- of the prescription-job table. Their invoice is deliberately not copied.
INSERT INTO repair_jobs (jobNumber, customerId, itemReceived, complaint, charges, status, createdAt, updatedAt)
SELECT
  'REP-LEGACY-' || id,
  customerId,
  'Legacy repair item',
  COALESCE(availabilityOverrideReason, 'Migrated repair job'),
  0,
  CASE WHEN status IN ('DELIVERED', 'CLOSED') THEN 'DELIVERED' ELSE 'NEW' END,
  createdAt,
  updatedAt
FROM optical_jobs
WHERE workflowType = 'REPAIR';

INSERT INTO repair_job_timeline_events (repairJobId, eventType, description, performedBy, createdAt)
SELECT id, 'REPAIR_MIGRATED', 'Migrated from the legacy optical workflow.', 'System', createdAt
FROM repair_jobs
WHERE jobNumber LIKE 'REP-LEGACY-%';

-- Workflow #6 has no lab, fitting, QC, or delivery stage for prescription jobs.
UPDATE optical_jobs
SET status = CASE
  WHEN status IN ('NEW', 'CONFIRMED') THEN 'NEW'
  WHEN status IN ('WAITING_FOR_LENS', 'LAB_PENDING') THEN 'WAITING_FOR_LENS'
  ELSE 'READY_FOR_DISPATCH'
END
WHERE workflowType = 'PRESCRIPTION';
