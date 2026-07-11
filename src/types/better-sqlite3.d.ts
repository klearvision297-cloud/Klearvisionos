declare module "better-sqlite3" {
  namespace Database {
    interface Statement {
      all(...params: unknown[]): unknown[];
      get(...params: unknown[]): unknown;
      run(...params: unknown[]): unknown;
    }

    class Database {
      constructor(filename: string);
      exec(source: string): this;
      pragma(source: string): unknown;
      prepare(source: string): Statement;
      transaction<T extends (...args: never[]) => unknown>(fn: T): T;
    }
  }

  const Database: {
    new(filename: string): Database.Database;
  };

  export = Database;
}
