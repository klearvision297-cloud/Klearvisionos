CREATE TABLE IF NOT EXISTS orders
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    orderNumber TEXT NOT NULL UNIQUE,

    customerId INTEGER NOT NULL,

    prescriptionId INTEGER,

    invoiceType TEXT NOT NULL DEFAULT 'Retail',

    gstMode TEXT NOT NULL DEFAULT 'Included',

    orderStatus TEXT NOT NULL DEFAULT 'Draft',

    paymentStatus TEXT NOT NULL DEFAULT 'Pending',

    orderDate TEXT NOT NULL,

    deliveryDate TEXT,

    subtotal REAL NOT NULL DEFAULT 0,

    discount REAL NOT NULL DEFAULT 0,

    gstAmount REAL NOT NULL DEFAULT 0,

    roundOff REAL NOT NULL DEFAULT 0,

    totalAmount REAL NOT NULL DEFAULT 0,

    paidAmount REAL NOT NULL DEFAULT 0,

    balanceAmount REAL NOT NULL DEFAULT 0,

    remarks TEXT,

    createdAt TEXT NOT NULL,

    updatedAt TEXT NOT NULL,

    FOREIGN KEY (customerId)
        REFERENCES customers(id)
        ON DELETE CASCADE,

    FOREIGN KEY (prescriptionId)
        REFERENCES prescriptions(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_customer
ON orders(customerId);

CREATE INDEX IF NOT EXISTS idx_orders_number
ON orders(orderNumber);

CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(orderStatus);

CREATE INDEX IF NOT EXISTS idx_orders_payment
ON orders(paymentStatus);