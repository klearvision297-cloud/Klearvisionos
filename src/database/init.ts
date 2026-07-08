import { getDatabase } from "./db";

export function initializeDatabase() {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      customerCode TEXT UNIQUE,

      name TEXT NOT NULL,

      mobile TEXT NOT NULL,

      whatsapp TEXT,

      address TEXT,

      gender TEXT,

      dob TEXT,

      createdAt TEXT,

      updatedAt TEXT
    );
  `);

  console.log("✅ Database initialized.");
}
