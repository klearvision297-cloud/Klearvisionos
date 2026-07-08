CREATE TABLE IF NOT EXISTS orders
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    orderNumber TEXT NOT NULL UNIQUE,

    customerId INTEGER NOT NULL,

    prescriptionId INTEGER,

    orderDate TEXT NOT NULL,

    deliveryDate TEXT,

    deliveryStatus TEXT NOT NULL DEFAULT 'Pending',

    frameBrand TEXT,
    frameModel TEXT,
    frameColor TEXT,

    framePrice REAL NOT NULL DEFAULT 0,

    lensCompany TEXT,
    lensType TEXT,
    lensIndex TEXT,
    lensCoating TEXT,

    lensPrice REAL NOT NULL DEFAULT 0,

    fittingCharge REAL NOT NULL DEFAULT 0,

    discount REAL NOT NULL DEFAULT 0,

    totalAmount REAL NOT NULL,

    advancePaid REAL NOT NULL DEFAULT 0,

    balanceAmount REAL NOT NULL,

    paymentStatus TEXT NOT NULL DEFAULT 'Pending',

    warranty TEXT,

    remarks TEXT,

    createdAt TEXT NOT NULL,

    updatedAt TEXT NOT NULL,

    FOREIGN KEY(customerId)
        REFERENCES customers(id)
        ON DELETE CASCADE,

    FOREIGN KEY(prescriptionId)
        REFERENCES prescriptions(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_customer
ON orders(customerId);

CREATE INDEX IF NOT EXISTS idx_orders_number
ON orders(orderNumber);

CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(deliveryStatus);

CREATE INDEX IF NOT EXISTS idx_orders_payment
ON orders(paymentStatus);
