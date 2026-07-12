-- Workflow #8: receiving and quality inspection stay on the canonical Optical Job.
-- inspectionNotes stores the completed checklist and optional inspector remarks as JSON.
ALTER TABLE optical_jobs ADD COLUMN qcCompletedAt TEXT;

CREATE INDEX IF NOT EXISTS idx_optical_jobs_lab_receiving
ON optical_jobs(workflowType, status, receivedAt DESC);
