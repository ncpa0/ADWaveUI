import { build } from "@ncpa0cpl/nodepack";
import { walk } from "node-os-walk";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "url";
import { getCssLoaderPlugin } from "./css-loader.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = (...fpath) => path.resolve(__dirname, "..", ...fpath);

const isDev = process.argv.includes("--dev");
const watch = process.argv.includes("--watch");

async function removeJsxteTypeImports() {
  const ops = [];
  const regx = /import\s+\{[^}]+\}\s+from\s+['"]jsxte(-wc){0,1}['"];/g;

  for await (const [root, _, files] of walk(p("dist/types"))) {
    for (const f of files) {
      if (f.name.endsWith(".d.ts")) {
        const filepath = path.join(root, f.name);
        ops.push(
          fs.readFile(filepath, "utf-8").then((fileData) => {
            if (regx.test(fileData)) {
              const newData = fileData.replace(regx, "").trimStart();
              return fs.writeFile(filepath, newData);
            }
          }),
        );
      }
    }
  }

  return Promise.all(ops);
}

function onBundleBuildComplete() {
  fs.rename(p("dist/bundle/esm/index.mjs"), p("dist/bundle/index.js"));
  fs.rm(p("dist/bundle/esm"), {
    recursive: true,
  }).catch(() => {});
}

async function main() {
  /** @type {import("@ncpa0cpl/nodepack").BuildConfig} */
  const bldOptions = {
    tsConfig: p("tsconfig.json"),
    srcDir: p("src"),
    outDir: p("dist"),
    entrypoint: p("src/index.ts"),
    target: "ESNext",
    formats: ["esm"],
    esDecorators: true,
    bundle: false,
    watch: watch,
    declarations: true,
    extMapping: {
      ".css": ".style.mjs",
    },
    esbuildOptions: {
      keepNames: true,
      sourcemap: isDev ? "inline" : false,
      plugins: [getCssLoaderPlugin()],
      jsxImportSource: "@ncpa0cpl/vanilla-jsx",
    },
  };

  /** @type {import("@ncpa0cpl/nodepack").BuildConfig} */
  const bundleOptions = {
    ...bldOptions,
    declarations: false,
    entrypoint: p("src/index.ts"),
    bundle: true,
    outDir: p("dist/bundle"),
    onBuildComplete: onBundleBuildComplete,
    // external: [
    //   "@ncpa0cpl/vanilla-jsx",
    //   "@ncpa0cpl/vanilla-jsx/signals",
    //   "@ncpa0cpl/vanilla-jsx/jsx-runtime",
    // ],
  };

  const buildBase = () => build(bldOptions);
  const buildBundle = () =>
    build(bundleOptions).then(() => onBundleBuildComplete());

  await Promise.all([buildBase(), buildBundle()]);
  await removeJsxteTypeImports();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
