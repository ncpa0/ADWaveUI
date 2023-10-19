import { build } from "@ncpa0cpl/nodepack";
import path from "node:path";
import { fileURLToPath } from "url";
import { getCssLoaderPlugin } from "./css-loader.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = (...fpath) => path.resolve(__dirname, "..", ...fpath);

const isDev = process.argv.includes("--dev");
const watch = process.argv.includes("--watch");

async function main() {
  /**
   * @type {import("@ncpa0cpl/nodepack").BuildConfig}
   */
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
    },
  };

  await build(bldOptions);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
