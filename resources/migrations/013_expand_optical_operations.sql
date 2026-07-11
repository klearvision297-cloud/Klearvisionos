-- Sprint 2.2: Lens Master and optical operations.
-- Transaction ownership belongs to the migration runner.

ALTER TABLE lens_series ADD COLUMN coating TEXT;
ALTER TABLE lens_series ADD COLUMN singleVision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lens_series ADD COLUMN polarized INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lens_series ADD COLUMN transitions INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lens_series ADD COLUMN aspheric INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lens_series ADD COLUMN digital INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lens_series ADD COLUMN scratchResistant INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lens_series ADD COLUMN antiReflection INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lens_series ADD COLUMN hydrophobic INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lens_series ADD COLUMN uvProtection INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lens_series ADD COLUMN tint INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lens_series ADD COLUMN mirror INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lens_series ADD COLUMN defaultTurnaroundDays INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lens_series ADD COLUMN internalNotes TEXT;

ALTER TABLE stock_availability_profiles ADD COLUMN description TEXT;
ALTER TABLE stock_availability_profiles ADD COLUMN isActive INTEGER NOT NULL DEFAULT 1;

ALTER TABLE suppliers ADD COLUMN turnaroundDays INTEGER NOT NULL DEFAULT 0;

ALTER TABLE optical_jobs ADD COLUMN priority TEXT NOT NULL DEFAULT 'NORMAL';
ALTER TABLE optical_jobs ADD COLUMN expectedDeliveryOverride INTEGER NOT NULL DEFAULT 0;
ALTER TABLE optical_jobs ADD COLUMN frameFittedAt TEXT;
ALTER TABLE optical_jobs ADD COLUMN qualityCheckedAt TEXT;
ALTER TABLE optical_jobs ADD COLUMN customerNotifiedAt TEXT;
ALTER TABLE optical_jobs ADD COLUMN deliveredAt TEXT;
ALTER TABLE optical_jobs ADD COLUMN warrantyUntil TEXT;
ALTER TABLE optical_jobs ADD COLUMN warrantyNotes TEXT;

ALTER TABLE job_timeline_events ADD COLUMN performedBy TEXT NOT NULL DEFAULT 'System';
ALTER TABLE job_timeline_events ADD COLUMN notes TEXT;

ALTER TABLE lab_orders ADD COLUMN dispatchDate TEXT;
ALTER TABLE lab_orders ADD COLUMN courier TEXT;
ALTER TABLE lab_orders ADD COLUMN trackingNumber TEXT;
ALTER TABLE lab_orders ADD COLUMN dispatchRemarks TEXT;
ALTER TABLE lab_orders ADD COLUMN receivedBy TEXT;
ALTER TABLE lab_orders ADD COLUMN inspectionStatus TEXT;
ALTER TABLE lab_orders ADD COLUMN inspectionNotes TEXT;
ALTER TABLE lab_orders ADD COLUMN rejectedReason TEXT;
ALTER TABLE lab_orders ADD COLUMN remakeReason TEXT;
ALTER TABLE lab_orders ADD COLUMN remakeCount INTEGER NOT NULL DEFAULT 0;

ALTER TABLE notifications ADD COLUMN dedupeKey TEXT;

CREATE TABLE IF NOT EXISTS lens_supplier_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lensSeriesId INTEGER NOT NULL,
  supplierId INTEGER NOT NULL,
  isPreferred INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  UNIQUE(lensSeriesId, supplierId),
  FOREIGN KEY (lensSeriesId) REFERENCES lens_series(id) ON DELETE CASCADE,
  FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE RESTRICT
);

INSERT OR IGNORE INTO lens_supplier_mappings (lensSeriesId, supplierId, isPreferred, createdAt)
SELECT id, supplierId, 1, createdAt
FROM lens_series
WHERE supplierId IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lens_supplier_preferred
ON lens_supplier_mappings(lensSeriesId)
WHERE isPreferred = 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe_key
ON notifications(dedupeKey)
WHERE dedupeKey IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lens_series_catalogue
ON lens_series(isActive, brand COLLATE NOCASE, series COLLATE NOCASE);

CREATE INDEX IF NOT EXISTS idx_lens_series_supplier
ON lens_series(supplierId, isActive);

CREATE INDEX IF NOT EXISTS idx_optical_jobs_queue
ON optical_jobs(status, priority, expectedDeliveryDate, updatedAt DESC);

CREATE INDEX IF NOT EXISTS idx_optical_jobs_customer
ON optical_jobs(customerId, updatedAt DESC);

CREATE INDEX IF NOT EXISTS idx_lab_orders_queue
ON lab_orders(supplierId, status, expectedDate);

CREATE INDEX IF NOT EXISTS idx_job_timeline_events_job
ON job_timeline_events(jobId, createdAt DESC);
