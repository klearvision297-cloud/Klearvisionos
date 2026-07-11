ALTER TABLE suppliers ADD COLUMN supplierName TEXT NOT NULL DEFAULT '';
ALTER TABLE suppliers ADD COLUMN gstin TEXT;
ALTER TABLE suppliers ADD COLUMN phone TEXT NOT NULL DEFAULT '';
ALTER TABLE suppliers ADD COLUMN openingBalance REAL NOT NULL DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN outstandingBalance REAL NOT NULL DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN paymentTerms TEXT;

UPDATE suppliers
SET supplierName = COALESCE(NULLIF(supplierName, ''), companyName),
    gstin = COALESCE(NULLIF(gstin, ''), gstNumber),
    phone = COALESCE(NULLIF(phone, ''), mobile, '')
WHERE supplierName IS NULL
   OR supplierName = ''
   OR gstin IS NULL
   OR gstin = ''
   OR phone IS NULL
   OR phone = '';

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(supplierName);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(companyName);
CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone);
CREATE INDEX IF NOT EXISTS idx_suppliers_gstin ON suppliers(gstin);
