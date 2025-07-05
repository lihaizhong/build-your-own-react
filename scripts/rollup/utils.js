import path from "node:path";
import fs from "node:fs";
import ts from "rollup-plugin-typescript2";
import cjs from "rollup-plugin-commonjs";

const pkgPath = path.resolve(__dirname, "../../packages");
const distPath = path.resolve(__dirname, "../../dist/node_modules");

export function resolvePkgPath(pkgName, isDist) {
  if (isDist) {
    return `${distPath}/${pkgName}`;
  }

  return `${pkgPath}/${pkgName}`;
}

export function getPackageJSON(pkgName) {
  const packageJsonPath = `${resolvePkgPath(pkgName)}/package.json`;
  const str = fs.readFileSync(packageJsonPath, {
    encoding: "utf-8",
  });

  return JSON.parse(str);
}

export function getBaseRollupPlugins({ typescript = {} } = {}) {
  return [cjs(), ts(typescript)];
}
