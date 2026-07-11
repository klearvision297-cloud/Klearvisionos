CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchaseNumber TEXT NOT NULL UNIQUE,
    supplierId INTEGER NOT NULL,
    invoiceNumber TEXT,
    invoiceDate TEXT NOT NULL,
    purchaseDate TEXT NOT NULL,
    paymentMethod TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'POSTED',
    subtotal REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    gstAmount REAL NOT NULL DEFAULT 0,
    totalAmount REAL NOT NULL DEFAULT 0,
    paidAmount REAL NOT NULL DEFAULT 0,
    balanceAmount REAL NOT NULL DEFAULT 0,
    remarks TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchaseId INTEGER NOT NULL,
    inventoryId INTEGER NOT NULL,
    itemCode TEXT NOT NULL,
    productName TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    purchasePrice REAL NOT NULL CHECK (purchasePrice >= 0),
    gstRate REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    remarks TEXT,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (purchaseId) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (inventoryId) REFERENCES inventory(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_purchases_supplier_date ON purchases(supplierId, purchaseDate DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_number ON purchases(purchaseNumber);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchaseId);

ALTER TABLE stock_history ADD COLUMN referenceType TEXT;
ALTER TABLE stock_history ADD COLUMN referenceNumber TEXT;
ALTER TABLE suppliers ADD COLUMN lastPurchaseDate TEXT;
ALTER TABLE suppliers ADD COLUMN purchaseCount INTEGER NOT NULL DEFAULT 0;
