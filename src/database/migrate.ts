import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import { getDatabase } from "./db";

type MigrationRecord = {
  filename: string;
};

type TableColumn = {
  name: string;
};

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

  console.log("Migration folder:", migrationFolder);

  if (!fs.existsSync(migrationFolder)) {
    throw new Error(`Migration folder not found: ${migrationFolder}`);
  }

  const executed = db.prepare("SELECT filename FROM migrations").all() as MigrationRecord[];
  const executedFiles = new Set(executed.map((migration) => migration.filename));
  const migrationFiles = fs.readdirSync(migrationFolder).filter((file) => file.endsWith(".sql")).sort();

  console.log("========== DATABASE MIGRATIONS ==========");

  for (const file of migrationFiles) {
    if (executedFiles.has(file)) {
      console.log(`Applied: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationFolder, file), "utf8");
    assertMigrationOwnsNoTransaction(sql, file);

    console.log(`Running: ${file}`);

    const migrate = db.transaction(() => {
      executeMigrationSql(sql, file);
      db.prepare(`
        INSERT INTO migrations (filename, executedAt)
        VALUES (?, ?)
      `).run(file, new Date().toISOString());
    });

    try {
      migrate();
      console.log(`Applied: ${file}`);
    } catch (error) {
      console.error(`Migration failed: ${file}`);
      throw new Error(`Migration ${file} failed and was rolled back. ${getErrorMessage(error)}`);
    }
  }

  console.log("=========================================");
}

function executeMigrationSql(sql: string, filename: string) {
  const db = getDatabase();

  for (const statement of splitSqlStatements(sql)) {
    const addedColumn = getAddedColumn(statement);

    if (addedColumn && hasColumn(addedColumn.table, addedColumn.column)) {
      console.log(`Reconciled: ${filename} already has ${addedColumn.table}.${addedColumn.column}`);
      continue;
    }

    db.exec(statement);
  }
}

function hasColumn(table: string, column: string) {
  const db = getDatabase();
  const columns = db.prepare(`PRAGMA table_info(${quoteIdentifier(table)})`).all() as TableColumn[];
  return columns.some((item) => item.name.toLowerCase() === column.toLowerCase());
}

function getAddedColumn(statement: string) {
  const match = stripSqlComments(statement).match(
    /^\s*ALTER\s+TABLE\s+([A-Za-z_][A-Za-z0-9_]*)\s+ADD\s+COLUMN\s+([A-Za-z_][A-Za-z0-9_]*)\b/i
  );

  return match ? { table: match[1], column: match[2] } : null;
}

function quoteIdentifier(identifier: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe migration identifier: ${identifier}`);
  }

  return `"${identifier}"`;
}

function assertMigrationOwnsNoTransaction(sql: string, filename: string) {
  const containsTransactionStatement = splitSqlStatements(sql).some((statement) =>
    /^\s*(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE)\b/i.test(stripSqlComments(statement))
  );

  if (containsTransactionStatement) {
    throw new Error(`Migration ${filename} contains transaction control. The migration runner owns transactions.`);
  }
}

function splitSqlStatements(sql: string) {
  const statements: string[] = [];
  let statement = "";
  let quote: "'" | '"' | null = null;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index];
    const nextCharacter = sql[index + 1];

    if (lineComment) {
      statement += character;
      if (character === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      statement += character;
      if (character === "*" && nextCharacter === "/") {
        statement += nextCharacter;
        index += 1;
        blockComment = false;
      }
      continue;
    }

    if (!quote && character === "-" && nextCharacter === "-") {
      statement += character;
      lineComment = true;
      continue;
    }

    if (!quote && character === "/" && nextCharacter === "*") {
      statement += character;
      blockComment = true;
      continue;
    }

    if (quote) {
      statement += character;
      if (character === quote) {
        if (nextCharacter === quote) {
          statement += nextCharacter;
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
      statement += character;
      continue;
    }

    if (character === ";") {
      const candidate = `${statement}${character}`;
      if (isCompleteSqlStatement(candidate)) {
        if (candidate.trim()) statements.push(candidate);
        statement = "";
      } else {
        statement += character;
      }
      continue;
    }

    statement += character;
  }

  if (statement.trim()) statements.push(statement);
  return statements;
}

function isCompleteSqlStatement(statement: string) {
  const trimmed = statement.trim();

  if (!trimmed) {
    return false;
  }

  try {
    getDatabase().prepare(trimmed);
    return true;
  } catch {
    return false;
  }
}

function stripSqlComments(sql: string) {
  return sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--.*$/gm, "");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
