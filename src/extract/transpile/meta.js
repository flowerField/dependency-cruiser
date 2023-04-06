const meta = require("../../../src/meta.js");
const swc = require("../parse/to-swc-ast.js");
const javaScriptWrap = require("./javascript-wrap");
const typeScriptWrap = require("./typescript-wrap.js");
const liveScriptWrap = require("./livescript-wrap");
const coffeeWrap = require("./coffeescript-wrap");
const vueWrap = require("./vue-template-wrap");
const babelWrap = require("./babel-wrap");
const svelteDingus = require("./svelte-wrap");

const typeScriptVanillaWrap = typeScriptWrap();
const typeScriptESMWrap = typeScriptWrap("esm");
const typeScriptTsxWrap = typeScriptWrap("tsx");
const coffeeVanillaWrap = coffeeWrap();
const litCoffeeWrap = coffeeWrap(true);
const svelteWrap = svelteDingus(typeScriptVanillaWrap);

const EXTENSION2WRAPPER = {
  ".js": javaScriptWrap,
  ".cjs": javaScriptWrap,
  ".mjs": javaScriptWrap,
  ".jsx": javaScriptWrap,
  ".ts": typeScriptVanillaWrap,
  ".tsx": typeScriptTsxWrap,
  ".d.ts": typeScriptVanillaWrap,
  ".cts": typeScriptVanillaWrap,
  ".d.cts": typeScriptVanillaWrap,
  ".mts": typeScriptESMWrap,
  ".d.mts": typeScriptESMWrap,
  ".vue": vueWrap,
  ".svelte": svelteWrap,
  ".ls": liveScriptWrap,
  ".coffee": coffeeVanillaWrap,
  ".litcoffee": litCoffeeWrap,
  ".coffee.md": litCoffeeWrap,
  ".csx": coffeeVanillaWrap,
  ".cjsx": coffeeVanillaWrap,
};

const TRANSPILER2WRAPPER = {
  babel: babelWrap,
  javascript: javaScriptWrap,
  "coffee-script": coffeeVanillaWrap,
  coffeescript: coffeeVanillaWrap,
  livescript: liveScriptWrap,
  svelte: svelteWrap,
  swc,
  typescript: typeScriptVanillaWrap,
  "vue-template-compiler": vueWrap,
  "@vue/compiler-sfc": vueWrap,
};

const BABELEABLE_EXTENSIONS = [
  ".js",
  ".cjs",
  ".mjs",
  ".jsx",
  ".ts",
  ".tsx",
  ".d.ts",
];

const EXTENSIONS_PER_PARSER = {
  swc: [".js", ".cjs", ".mjs", ".jsx", ".ts", ".tsx", ".d.ts"],
  // tsc: [".js", ".cjs", ".mjs", ".jsx", ".ts", ".tsx", ".d.ts"],
  // acorn: [".js", ".cjs", ".mjs", ".jsx"],
};

function extensionIsAvailable(pExtension) {
  return (
    EXTENSION2WRAPPER[pExtension].isAvailable() ||
    // should eventually also check whether swc is enabled as a parser?
    (swc.isAvailable() && EXTENSIONS_PER_PARSER.swc.includes(pExtension))
  );
}

/**
 * returns the babel wrapper if there's a babelConfig in the transpiler
 * options for babeleable extensions (javascript and typescript - currently
 * not configurable)
 *
 * returns the wrapper module configured for the extension pExtension if
 * not.
 *
 * returns the javascript wrapper if there's no wrapper module configured
 * for the extension.
 *
 * @param {string}  pExtension the extension (e.g. ".ts", ".js", ".litcoffee")
 * @param {any} pTranspilerOptions
 * @returns {module} the module
 */
module.exports.getWrapper = (pExtension, pTranspilerOptions) => {
  if (
    Object.keys(pTranspilerOptions?.babelConfig ?? {}).length > 0 &&
    BABELEABLE_EXTENSIONS.includes(pExtension)
  ) {
    return babelWrap;
  }
  return EXTENSION2WRAPPER[pExtension] || javaScriptWrap;
};

/**
 * all supported extensions and whether or not it is supported
 * in the current environment
 *
 * @type {IAvailableExtension[]}
 */
module.exports.allExtensions = Object.keys(EXTENSION2WRAPPER).map(
  (pExtension) => ({
    extension: pExtension,
    available: extensionIsAvailable(pExtension),
  })
);

/**
 * an array of extensions that are 'scannable' (have a valid transpiler
 * available for) in the current environment.
 *
 * @type {string[]}
 */
module.exports.scannableExtensions =
  Object.keys(EXTENSION2WRAPPER).filter(extensionIsAvailable);

/**
 * returns an array of supported transpilers, with for each transpiler:
 * - the version (range) supported
 * - whether or not it is available in the current environment
 *
 * @return {IAvailableTranspiler[]} an array of supported transpilers
 */
module.exports.getAvailableTranspilers = () =>
  Object.keys(meta.supportedTranspilers).map((pTranspiler) => ({
    name: pTranspiler,
    version: meta.supportedTranspilers[pTranspiler],
    available: TRANSPILER2WRAPPER[pTranspiler].isAvailable(),
  }));

/* eslint security/detect-object-injection : 0*/
