import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import { getDatabase } from "../database/db";

function getMigrationDirectory() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "migrations");
  }

  return path.join(process.cwd(), "resources", "migrations");
}

export function runMigrations() {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      executedAt TEXT NOT NULL
    );
  `);

  const migrationFolder = getMigrationDirectory();

  console.log("📂 Migration Folder:", migrationFolder);

  if (!fs.existsSync(migrationFolder)) {
    throw new Error(
      `Migration folder not found: ${migrationFolder}`
    );
  }

  const executed = db
    .prepare("SELECT filename FROM migrations")
    .all() as { filename: string }[];

  const executedFiles = new Set(
    executed.map((m) => m.filename)
  );

  const migrationFiles = fs
    .readdirSync(migrationFolder)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log("");
  console.log("========== DATABASE MIGRATIONS ==========");

  for (const file of migrationFiles) {
    if (executedFiles.has(file)) {
      console.log(`✓ ${file}`);
      continue;
    }

    console.log(`▶ Running ${file}`);

    const sql = fs.readFileSync(
      path.join(migrationFolder, file),
      "utf8"
    );

    db.exec(sql);

    db.prepare(`
      INSERT INTO migrations
      (filename, executedAt)
      VALUES (?, ?)
    `).run(
      file,
      new Date().toISOString()
    );

    console.log(`✅ Applied ${file}`);
  }

  console.log("=========================================");
}
