import toTypescriptAST from "./parse/to-typescript-ast.mjs";
import toJavascriptAST from "./parse/to-javascript-ast.mjs";
import toSwcAST from "./parse/to-swc-ast.js";
import localNpmHelpers from "./resolve/external-module-helpers.js";
import getManifest from "./resolve/get-manifest/index.js";
import resolveAMD from "./resolve/resolve-amd.js";
import resolve from "./resolve/resolve.js";

export default function clearCaches() {
  toTypescriptAST.clearCache();
  toJavascriptAST.clearCache();
  toSwcAST.clearCache();
  localNpmHelpers.clearCache();
  getManifest.clearCache();
  resolveAMD.clearCache();
  resolve.clearCache();
}
