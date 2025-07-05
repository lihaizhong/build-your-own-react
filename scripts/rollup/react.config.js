import path from "node:path";
import { getPackageJSON, resolvePkgPath, getBaseRollupPlugins } from "./utils";
import generatePackageJson from "rollup-plugin-generate-package-json";

const { name, module } = getPackageJSON("react");
// react 包的路径
const pkgPath = resolvePkgPath(name);
// react 产物路径
const pkgDistPath = resolvePkgPath(name, true);

export default [
  // react
  {
    input: path.join(pkgPath, module),
    output: {
      file: path.join(pkgDistPath, "index.js"),
      name: "React",
      format: "umd",
    },
    plugins: [
      ...getBaseRollupPlugins(),
      generatePackageJson({
        inputFolder: pkgPath,
        outputFolder: pkgDistPath,
        baseContent: ({ name, description, version }) => ({
          name,
          version,
          description,
          main: "index.js",
        }),
      }),
    ],
  },
  // jsx-runtime
  {
    input: path.join(pkgPath, "src/jsx.ts"),
    output: [
      // jsx-runtime
      {
        file: path.join(pkgDistPath, "jsx-runtime.js"),
        name: "jsx-runtime",
        format: "umd",
      },
      // jsx-dev-runtime
      {
        file: path.join(pkgDistPath, "jsx-dev-runtime.js"),
        name: "jsx-dev-runtime",
        format: "umd",
      },
    ],
    plugins: getBaseRollupPlugins(),
  },
];
