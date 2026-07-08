CREATE TABLE IF NOT EXISTS order_items
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    orderId INTEGER NOT NULL,

    inventoryId INTEGER NOT NULL,

    quantity INTEGER NOT NULL DEFAULT 1,

    purchasePrice REAL NOT NULL DEFAULT 0,

    sellingPrice REAL NOT NULL DEFAULT 0,

    discount REAL NOT NULL DEFAULT 0,

    total REAL NOT NULL DEFAULT 0,

    remarks TEXT,

    createdAt TEXT NOT NULL,

    updatedAt TEXT NOT NULL,

    FOREIGN KEY (orderId)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    FOREIGN KEY (inventoryId)
        REFERENCES inventory(id)
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order
ON order_items(orderId);

CREATE INDEX IF NOT EXISTS idx_order_items_inventory
ON order_items(inventoryId);
