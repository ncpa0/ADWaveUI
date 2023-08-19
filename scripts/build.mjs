import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = (...fpath) => path.resolve(__dirname, "..", ...fpath);

const isDev = process.argv.includes("--dev");
const watch = process.argv.includes("--watch");

async function main() {
  /**
   * @type {import("esbuild").BuildOptions}
   */
  const bldOptions = {
    tsconfig: p("tsconfig.json"),
    entryPoints: [p("src/index.ts")],
    outdir: p("dist"),
    bundle: true,
    keepNames: true,
    treeShaking: true,
    minify: !isDev,
    jsxImportSource: "jsxte",
  };

  if (watch) {
    const buildCtx = await esbuild.context(bldOptions);
    await buildCtx.watch();
  } else {
    await esbuild.build(bldOptions);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
