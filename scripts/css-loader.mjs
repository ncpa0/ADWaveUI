import { buildSync } from "esbuild";
import fs from "fs";
import { transform } from "lightningcss";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = (...fpath) => path.resolve(__dirname, "..", ...fpath);

export let { outputFiles: [{ text: sharedCss }] } = buildSync({
  bundle: true,
  entryPoints: [p("scripts/shared.css")],
  write: false,
});

let { code } = transform({
  filename: "shared.css",
  code: Buffer.from(sharedCss),
  minify: true,
  sourceMap: false,
});

sharedCss = code.toString();

/**
 * @param {string} inDir
 * @param {string} outDir
 * @param {(file: string, stylesheet: string) => void} onStyle
 * @returns {import("esbuild").Plugin}
 */
export const getCssLoaderPlugin = (srcRoot, outRoot, onStyle) => {
  const styleSheets = {};

  return {
    name: "css-autoloader",
    setup(build) {
      build.onLoad({ filter: /\.css$/ }, (args) => {
        const contents = fs.readFileSync(args.path, "utf8");
        let { code } = transform({
          filename: path.basename(args.path),
          code: Buffer.from(contents),
          minify: true,
          sourceMap: false,
        });
        const stringified = code;
        const relPath = path.relative(srcRoot, args.path);
        onStyle(relPath, stringified);
        styleSheets[relPath] = stringified;

        return { loader: "empty", contents: "" };
      });

      build.onEnd(() => {
        try {
          for (const [relPath, styles] of Object.entries(styleSheets)) {
            const outPath = path.join(outRoot, relPath);
            if (fs.existsSync(path.dirname(outPath))) {
              fs.writeFileSync(outPath, sharedCss + "\n" + styles);
            }
          }
        } catch (err) {
          console.error(err);
        }
      });
    },
  };
};
