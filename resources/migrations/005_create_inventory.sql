CREATE TABLE IF NOT EXISTS inventory
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    itemCode TEXT NOT NULL UNIQUE,

    itemType TEXT NOT NULL,

    brand TEXT,

    category TEXT,

    model TEXT,

    color TEXT,

    size TEXT,

    barcode TEXT,

    purchasePrice REAL NOT NULL DEFAULT 0,

    sellingPrice REAL NOT NULL DEFAULT 0,

    openingStock INTEGER NOT NULL DEFAULT 0,

    currentStock INTEGER NOT NULL DEFAULT 0,

    minimumStock INTEGER NOT NULL DEFAULT 0,

    unit TEXT NOT NULL DEFAULT 'PCS',

    supplierId INTEGER,

    isActive INTEGER NOT NULL DEFAULT 1,

    remarks TEXT,

    createdAt TEXT NOT NULL,

    updatedAt TEXT NOT NULL,

    FOREIGN KEY (supplierId)
        REFERENCES suppliers(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_code
ON inventory(itemCode);

CREATE INDEX IF NOT EXISTS idx_inventory_brand
ON inventory(brand);

CREATE INDEX IF NOT EXISTS idx_inventory_type
ON inventory(itemType);

CREATE INDEX IF NOT EXISTS idx_inventory_barcode
ON inventory(barcode);
