CREATE TABLE IF NOT EXISTS customers
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    customerCode TEXT NOT NULL UNIQUE,

    name TEXT NOT NULL,

    mobile TEXT NOT NULL,

    whatsapp TEXT,

    email TEXT,

    gender TEXT,

    dateOfBirth TEXT,

    address TEXT,

    city TEXT,

    state TEXT,

    pincode TEXT,

    reference TEXT,

    eyeTestDone INTEGER NOT NULL DEFAULT 0,

    remarks TEXT,

    totalOrders INTEGER NOT NULL DEFAULT 0,

    totalSpent REAL NOT NULL DEFAULT 0,

    createdAt TEXT NOT NULL,

    updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_name
ON customers(name);

CREATE INDEX IF NOT EXISTS idx_customer_mobile
ON customers(mobile);

CREATE INDEX IF NOT EXISTS idx_customer_code
ON customers(customerCode);
