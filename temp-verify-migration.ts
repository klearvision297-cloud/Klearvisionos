import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Module from "node:module";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "klear-vision-migrate-"));
const originalLoad = Module._load;

Module._load = function (request: string, parent: NodeModule, isMain: boolean) {
  if (request === "electron") {
    return {
      app: {
        isPackaged: false,
        getPath: (name: string) => (name === "userData" ? tempRoot : tempRoot),
      },
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

(async () => {
  const { runMigrations } = await import("./src/database/migrate.ts");
  runMigrations();
})();
