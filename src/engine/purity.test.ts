/** Enforces CLAUDE.md architecture rule 1: the engine is pure and depends on nothing. */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dir = new URL("./", import.meta.url);
const sources = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));

describe("engine purity", () => {
  it.each(sources)("%s imports only other engine files and uses no hidden randomness", (file) => {
    const source = readFileSync(new URL(file, dir), "utf8");
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""); // drop comments
    const imports = [...code.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
    for (const spec of imports) expect(spec, `${file} imports ${spec}`).toMatch(/^\.\//);
    // Bare globals only: `input.window.weeks` is a field, not the browser's window.
    expect(code).not.toMatch(/Math\.random|Date\.now|new Date\(|(?<![.\w])(window|document)\./);
  });
});
