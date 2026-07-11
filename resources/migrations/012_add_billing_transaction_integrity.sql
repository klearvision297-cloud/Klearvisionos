ALTER TABLE orders ADD COLUMN transactionKey TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_transaction_key ON orders(transactionKey) WHERE transactionKey IS NOT NULL;

CREATE TABLE IF NOT EXISTS rx_decision_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jobId INTEGER NOT NULL,
  previousDecision TEXT NOT NULL,
  newDecision TEXT NOT NULL,
  reason TEXT NOT NULL,
  performedBy TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (jobId) REFERENCES optical_jobs(id) ON DELETE RESTRICT
);

CREATE TRIGGER IF NOT EXISTS prevent_rx_override_update
BEFORE UPDATE ON rx_decision_overrides
FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'RX override audit records are immutable');
END;

CREATE TRIGGER IF NOT EXISTS prevent_rx_override_delete
BEFORE DELETE ON rx_decision_overrides
FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'RX override audit records are immutable');
END;