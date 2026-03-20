import ts from "typescript";
import { globSync } from "glob";
import path from "node:path";

const entrypoints = globSync("dist/**/*.d.ts");

if (entrypoints.length === 0) {
  console.error("No declaration files found under dist/");
  process.exit(1);
}

const program = ts.createProgram(entrypoints, {
  skipLibCheck: false,
  noEmit: true,
});

const distRoot = path.resolve("dist") + path.sep;
const diagnostics = ts
  .getPreEmitDiagnostics(program)
  .filter((diagnostic) => {
    if (!diagnostic.file?.fileName) return false;
    return path.resolve(diagnostic.file.fileName).startsWith(distRoot);
  });

if (diagnostics.length > 0) {
  const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => "\n",
  });
  console.error(formatted);
  process.exit(1);
}

console.log(`Declaration check passed for ${entrypoints.length} files`);
