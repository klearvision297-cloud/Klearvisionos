-- Lens catalogue fields are product definitions only. They deliberately have no
-- inventory or stock-history relationship.
ALTER TABLE lens_series ADD COLUMN category TEXT;
ALTER TABLE lens_series ADD COLUMN tintName TEXT;
ALTER TABLE lens_series ADD COLUMN lastUsedAt TEXT;

CREATE INDEX IF NOT EXISTS idx_lens_series_catalogue
ON lens_series(isActive, category, brand, lastUsedAt DESC);

-- A prescription invoice may contain a catalogue lens line. Inventory lines
-- remain linked to inventory; lens lines link only to lens_series.
CREATE TABLE order_items_prescription (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId INTEGER NOT NULL,
  inventoryId INTEGER,
  lensSeriesId INTEGER,
  itemCode TEXT NOT NULL,
  itemType TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  model TEXT,
  color TEXT,
  size TEXT,
  barcode TEXT,
  hsnCode TEXT,
  gstRate REAL NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  purchasePrice REAL NOT NULL DEFAULT 0,
  sellingPrice REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  remarks TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  CHECK ((inventoryId IS NOT NULL AND lensSeriesId IS NULL) OR (inventoryId IS NULL AND lensSeriesId IS NOT NULL)),
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (inventoryId) REFERENCES inventory(id) ON DELETE RESTRICT,
  FOREIGN KEY (lensSeriesId) REFERENCES lens_series(id) ON DELETE RESTRICT
);

INSERT INTO order_items_prescription (
  id, orderId, inventoryId, itemCode, itemType, brand, category, model, color,
  size, barcode, hsnCode, gstRate, quantity, purchasePrice, sellingPrice,
  discount, total, remarks, createdAt, updatedAt
)
SELECT id, orderId, inventoryId, itemCode, itemType, brand, category, model, color,
  size, barcode, hsnCode, gstRate, quantity, purchasePrice, sellingPrice,
  discount, total, remarks, createdAt, updatedAt
FROM order_items;

DROP TABLE order_items;
ALTER TABLE order_items_prescription RENAME TO order_items;
CREATE INDEX idx_order_items_order ON order_items(orderId);
CREATE INDEX idx_order_items_inventory ON order_items(inventoryId);
CREATE INDEX idx_order_items_lens_series ON order_items(lensSeriesId);
CREATE INDEX idx_order_items_itemCode ON order_items(itemCode);
CREATE INDEX idx_order_items_barcode ON order_items(barcode);
