ALTER TABLE inventory ADD COLUMN reservedStock INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS lens_series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand TEXT NOT NULL,
  series TEXT NOT NULL,
  design TEXT,
  material TEXT,
  lensIndex TEXT,
  blueCut INTEGER NOT NULL DEFAULT 0,
  photochromic INTEGER NOT NULL DEFAULT 0,
  progressive INTEGER NOT NULL DEFAULT 0,
  bifocal INTEGER NOT NULL DEFAULT 0,
  officeLens INTEGER NOT NULL DEFAULT 0,
  warrantyMonths INTEGER,
  supplierId INTEGER,
  defaultCost REAL NOT NULL DEFAULT 0,
  defaultSellingPrice REAL NOT NULL DEFAULT 0,
  availabilityProfileId INTEGER,
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE(brand, series),
  FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS stock_availability_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  rulesJson TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prescription_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prescriptionId INTEGER NOT NULL,
  versionNumber INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'IN_HOUSE',
  rightHeight TEXT,
  rightPrism TEXT,
  leftHeight TEXT,
  leftPrism TEXT,
  distanceNotes TEXT,
  nearNotes TEXT,
  doctorNotes TEXT,
  attachmentPath TEXT,
  createdAt TEXT NOT NULL,
  UNIQUE(prescriptionId, versionNumber),
  FOREIGN KEY (prescriptionId) REFERENCES prescriptions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS optical_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jobNumber TEXT NOT NULL UNIQUE,
  orderId INTEGER NOT NULL UNIQUE,
  customerId INTEGER NOT NULL,
  prescriptionId INTEGER,
  prescriptionVersionId INTEGER,
  frameInventoryId INTEGER,
  lensSeriesId INTEGER,
  workflowType TEXT NOT NULL DEFAULT 'PRESCRIPTION',
  availabilityDecision TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED',
  availabilityOverrideReason TEXT,
  status TEXT NOT NULL DEFAULT 'CONFIRMED',
  branchId INTEGER,
  expectedDeliveryDate TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (prescriptionId) REFERENCES prescriptions(id) ON DELETE SET NULL,
  FOREIGN KEY (frameInventoryId) REFERENCES inventory(id) ON DELETE SET NULL,
  FOREIGN KEY (lensSeriesId) REFERENCES lens_series(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS job_timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jobId INTEGER NOT NULL,
  eventType TEXT NOT NULL,
  description TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (jobId) REFERENCES optical_jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stock_reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventoryId INTEGER NOT NULL,
  jobId INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  createdAt TEXT NOT NULL,
  releasedAt TEXT,
  UNIQUE(inventoryId, jobId),
  FOREIGN KEY (inventoryId) REFERENCES inventory(id) ON DELETE CASCADE,
  FOREIGN KEY (jobId) REFERENCES optical_jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lab_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  labOrderNumber TEXT NOT NULL UNIQUE,
  jobId INTEGER NOT NULL UNIQUE,
  supplierId INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  specialInstructions TEXT,
  expectedDate TEXT,
  receivedAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (jobId) REFERENCES optical_jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  referenceType TEXT,
  referenceId INTEGER,
  dueAt TEXT,
  readAt TEXT,
  createdAt TEXT NOT NULL
);
