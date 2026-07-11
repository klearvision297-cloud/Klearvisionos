-- Invoice cancellation is an immutable business event; orders remain the source of truth.
CREATE TABLE IF NOT EXISTS invoice_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId INTEGER NOT NULL,
  eventType TEXT NOT NULL,
  notes TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY(orderId) REFERENCES orders(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_invoice_events_order ON invoice_events(orderId, createdAt DESC);
