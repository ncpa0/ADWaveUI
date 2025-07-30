import { minify } from "csso";
import fs from "fs";
import path from "path";

/**
 * @param {string} stylesheet
 * @param {string} filename
 */
const minifyCss = (stylesheet, filename) => {
  return minify(stylesheet, {
    filename,
  }).css;
};

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
        const stringified = minifyCss(contents, path.basename(args.path));
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
              fs.writeFileSync(outPath, styles);
            }
          }
        } catch (err) {
          console.error(err);
        }
      });
    },
  };
};
