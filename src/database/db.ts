import Database from "better-sqlite3";
import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  const databaseDirectory = path.join(
    app.getPath("userData"),
    "database"
  );

  if (!fs.existsSync(databaseDirectory)) {
    fs.mkdirSync(databaseDirectory, { recursive: true });
  }

  const databasePath = path.join(
    databaseDirectory,
    "klearvision.db"
  );

  const database = new (Database as unknown as { new(path: string): Database.Database })(databasePath);
  db = database;

  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");

  console.log("✅ SQLite Connected");
  console.log("📁 Database:", databasePath);

  return database;
}
