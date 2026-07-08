CREATE TABLE IF NOT EXISTS suppliers
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    supplierCode TEXT NOT NULL UNIQUE,

    companyName TEXT NOT NULL,

    contactPerson TEXT,

    mobile TEXT,

    whatsapp TEXT,

    email TEXT,

    gstNumber TEXT,

    address TEXT,

    city TEXT,

    state TEXT,

    pincode TEXT,

    remarks TEXT,

    isActive INTEGER NOT NULL DEFAULT 1,

    createdAt TEXT NOT NULL,

    updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_supplier_name
ON suppliers(companyName);

CREATE INDEX IF NOT EXISTS idx_supplier_mobile
ON suppliers(mobile);
