import { minify } from "csso";
import fs from "fs/promises";
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
 * @param {string} stylesheet
 */
const injectorSnippet = (stylesheet) => {
  return /* js */ `
const stylesheet = ${stylesheet};
const exports = {
    css: stylesheet,
    element: null,
};
(function () {
    if(typeof window !== "undefined") {
        const head = document.head;
        const style = document.createElement("style");
        style.appendChild(document.createTextNode(stylesheet));
        head.appendChild(style);
        exports.element = style;
    }
})();

export {
  exports as default,
}
`.trim();
};

/**
 * @returns {import("esbuild").Plugin}
 */
export const getCssLoaderPlugin = () => {
  return {
    name: "css-autoloader",
    setup(build) {
      build.onLoad({ filter: /\.css$/ }, async (args) => {
        const contents = await fs.readFile(args.path, "utf8");
        const stringified = JSON.stringify(
          minifyCss(contents, path.basename(args.path)),
        );
        return {
          contents: injectorSnippet(stringified),
          loader: "js",
        };
      });
    },
  };
};
