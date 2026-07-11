-- Phase 2: Optical Job is the canonical owner of operational workflow state.
-- The migration runner wraps this file in a transaction. If notification backfill
-- cannot be completed, the migration aborts before any duplicate columns are removed.

ALTER TABLE optical_jobs ADD COLUMN supplierId INTEGER REFERENCES suppliers(id) ON DELETE SET NULL;
ALTER TABLE optical_jobs ADD COLUMN availabilityProfileId INTEGER REFERENCES stock_availability_profiles(id) ON DELETE SET NULL;
ALTER TABLE optical_jobs ADD COLUMN promisedDeliveryDate TEXT;
ALTER TABLE optical_jobs ADD COLUMN deliveryOverrideReason TEXT;
ALTER TABLE optical_jobs ADD COLUMN dispatchedAt TEXT;
ALTER TABLE optical_jobs ADD COLUMN courier TEXT;
ALTER TABLE optical_jobs ADD COLUMN trackingNumber TEXT;
ALTER TABLE optical_jobs ADD COLUMN dispatchRemarks TEXT;
ALTER TABLE optical_jobs ADD COLUMN receivedAt TEXT;
ALTER TABLE optical_jobs ADD COLUMN receivedBy TEXT;
ALTER TABLE optical_jobs ADD COLUMN inspectionStatus TEXT;
ALTER TABLE optical_jobs ADD COLUMN inspectionNotes TEXT;
ALTER TABLE optical_jobs ADD COLUMN rejectedReason TEXT;
ALTER TABLE optical_jobs ADD COLUMN remakeReason TEXT;
ALTER TABLE optical_jobs ADD COLUMN remakeCount INTEGER NOT NULL DEFAULT 0;

-- Backfill the Optical Job before retiring its duplicate lab-order fields.
UPDATE optical_jobs
SET
  supplierId = COALESCE(
    (SELECT supplierId FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id),
    (SELECT supplierId FROM lens_series WHERE lens_series.id = optical_jobs.lensSeriesId)
  ),
  availabilityProfileId = (
    SELECT availabilityProfileId FROM lens_series WHERE lens_series.id = optical_jobs.lensSeriesId
  ),
  expectedDeliveryDate = COALESCE(
    expectedDeliveryDate,
    (SELECT expectedDate FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id)
  ),
  promisedDeliveryDate = CASE
    WHEN expectedDeliveryOverride = 1 THEN expectedDeliveryDate
    ELSE NULL
  END,
  dispatchedAt = (SELECT dispatchDate FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id),
  courier = (SELECT courier FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id),
  trackingNumber = (SELECT trackingNumber FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id),
  dispatchRemarks = (SELECT dispatchRemarks FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id),
  receivedAt = (SELECT receivedAt FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id),
  receivedBy = (SELECT receivedBy FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id),
  inspectionStatus = (SELECT inspectionStatus FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id),
  inspectionNotes = (SELECT inspectionNotes FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id),
  rejectedReason = (SELECT rejectedReason FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id),
  remakeReason = (SELECT remakeReason FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id),
  remakeCount = COALESCE((SELECT remakeCount FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id), 0);

-- Existing in-progress RX jobs gain the one canonical status used by all screens.
UPDATE optical_jobs
SET status = CASE
  WHEN status = 'WAITING_FOR_LENS' AND EXISTS (SELECT 1 FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id AND lab_orders.status = 'PENDING') THEN 'LAB_PENDING'
  WHEN status = 'WAITING_FOR_LENS' AND EXISTS (SELECT 1 FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id AND lab_orders.status IN ('DISPATCHED', 'ACCEPTED', 'MANUFACTURING', 'READY')) THEN 'DISPATCHED'
  WHEN status = 'WAITING_FOR_LENS' AND EXISTS (SELECT 1 FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id AND lab_orders.status = 'RECEIVED') THEN 'RECEIVED'
  WHEN status = 'WAITING_FOR_LENS' AND EXISTS (SELECT 1 FROM lab_orders WHERE lab_orders.jobId = optical_jobs.id AND lab_orders.status = 'REJECTED') THEN 'ON_HOLD'
  WHEN status = 'WAITING_FOR_LENS' THEN 'LAB_PENDING'
  ELSE status
END;

DROP INDEX IF EXISTS idx_lab_orders_queue;

CREATE TABLE lab_orders_phase2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  labOrderNumber TEXT NOT NULL UNIQUE,
  jobId INTEGER NOT NULL UNIQUE,
  specialInstructions TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (jobId) REFERENCES optical_jobs(id) ON DELETE CASCADE
);

INSERT INTO lab_orders_phase2 (id, labOrderNumber, jobId, specialInstructions, createdAt, updatedAt)
SELECT id, labOrderNumber, jobId, specialInstructions, createdAt, updatedAt
FROM lab_orders;

DROP TABLE lab_orders;
ALTER TABLE lab_orders_phase2 RENAME TO lab_orders;

CREATE INDEX idx_lab_orders_job ON lab_orders(jobId, createdAt DESC);
CREATE INDEX idx_optical_jobs_supplier ON optical_jobs(supplierId, status, updatedAt DESC);

-- Notifications are exclusively Optical Job events. The NOT NULL target table
-- deliberately rejects any legacy row that cannot be mapped to a valid job.
ALTER TABLE notifications ADD COLUMN jobId INTEGER REFERENCES optical_jobs(id) ON DELETE CASCADE;

UPDATE notifications
SET jobId = referenceId
WHERE referenceType = 'JOB'
  AND EXISTS (SELECT 1 FROM optical_jobs WHERE optical_jobs.id = notifications.referenceId);

CREATE TABLE notifications_phase2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jobId INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  dueAt TEXT,
  readAt TEXT,
  dedupeKey TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (jobId) REFERENCES optical_jobs(id) ON DELETE CASCADE
);

INSERT INTO notifications_phase2 (id, jobId, type, title, message, dueAt, readAt, dedupeKey, createdAt)
SELECT id, jobId, type, title, message, dueAt, readAt, dedupeKey, createdAt
FROM notifications;

DROP TABLE notifications;
ALTER TABLE notifications_phase2 RENAME TO notifications;

CREATE UNIQUE INDEX idx_notifications_dedupe_key
ON notifications(dedupeKey)
WHERE dedupeKey IS NOT NULL;

CREATE INDEX idx_notifications_job ON notifications(jobId, readAt, createdAt DESC);
