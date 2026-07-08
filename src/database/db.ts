import Database from "better-sqlite3";
import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

let database: Database.Database;

export function getDatabase() {
  if (database) return database;

  const dbFolder = path.join(app.getPath("userData"), "database");

  if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
  }

  const dbPath = path.join(dbFolder, "klearvision.db");

  database = new Database(dbPath);

  database.pragma("journal_mode = WAL");

  return database;
}
