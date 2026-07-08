CREATE TABLE IF NOT EXISTS payments
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    paymentNumber TEXT NOT NULL UNIQUE,

    orderId INTEGER NOT NULL,

    customerId INTEGER NOT NULL,

    paymentDate TEXT NOT NULL,

    paymentMethod TEXT NOT NULL,

    amount REAL NOT NULL,

    transactionId TEXT,

    referenceNumber TEXT,

    remarks TEXT,

    createdAt TEXT NOT NULL,

    updatedAt TEXT NOT NULL,

    FOREIGN KEY(orderId)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    FOREIGN KEY(customerId)
        REFERENCES customers(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_order
ON payments(orderId);

CREATE INDEX IF NOT EXISTS idx_payments_customer
ON payments(customerId);

CREATE INDEX IF NOT EXISTS idx_payments_method
ON payments(paymentMethod);

CREATE INDEX IF NOT EXISTS idx_payments_date
ON payments(paymentDate);
