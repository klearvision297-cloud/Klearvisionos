-- Workflow #7: the Optical Job is the sole lab-dispatch record.
-- All lab-order operational fields were migrated to optical_jobs in migration 014.
DROP TABLE IF EXISTS lab_orders;

CREATE INDEX IF NOT EXISTS idx_optical_jobs_lab_dispatch
ON optical_jobs(workflowType, status, assignedLab, createdAt DESC);
