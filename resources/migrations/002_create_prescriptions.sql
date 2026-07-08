CREATE TABLE IF NOT EXISTS prescriptions
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    customerId INTEGER NOT NULL,

    prescriptionNumber TEXT NOT NULL UNIQUE,

    examinationDate TEXT NOT NULL,

    doctorName TEXT,

    rightSphere TEXT,
    rightCylinder TEXT,
    rightAxis TEXT,
    rightAdd TEXT,
    rightPD TEXT,

    leftSphere TEXT,
    leftCylinder TEXT,
    leftAxis TEXT,
    leftAdd TEXT,
    leftPD TEXT,

    nearRightSphere TEXT,
    nearRightCylinder TEXT,
    nearRightAxis TEXT,

    nearLeftSphere TEXT,
    nearLeftCylinder TEXT,
    nearLeftAxis TEXT,

    ipd TEXT,

    diagnosis TEXT,

    remarks TEXT,

    createdAt TEXT NOT NULL,

    updatedAt TEXT NOT NULL,

    FOREIGN KEY(customerId)
        REFERENCES customers(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_prescription_customer
ON prescriptions(customerId);

CREATE INDEX IF NOT EXISTS idx_prescription_number
ON prescriptions(prescriptionNumber);
