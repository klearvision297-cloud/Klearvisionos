CREATE TABLE IF NOT EXISTS stock_history
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    inventoryId INTEGER NOT NULL,

    changeType TEXT NOT NULL,

    previousStock INTEGER NOT NULL,

    newStock INTEGER NOT NULL,

    difference INTEGER NOT NULL,

    reason TEXT,

    remarks TEXT,

    createdAt TEXT NOT NULL,

    FOREIGN KEY (inventoryId)
        REFERENCES inventory(id)
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_stock_history_inventory
ON stock_history(inventoryId);

CREATE INDEX IF NOT EXISTS idx_stock_history_created_at
ON stock_history(createdAt);
