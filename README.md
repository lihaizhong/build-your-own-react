# react learn

## 官方目录结构

- `fixtures`: 用于存放测试用例
- `packages`: 主要部分，包含 scheduler、reconciler 等
- `scripts`: react 构建相关脚本

其中，主要的包在 packages 目录下，主要包含以下模块：

- `react`: 核心 API 所在，如 React.createElement、React.Component 等。
- `react-reconciler`: 协调器。React的核心逻辑所在，在 render 阶段用来构建 Fiber 节点，与宿主环境无关。
- `scheduler`: 调度器相关
- `react-server`: SSR 相关
- `react-interactions`: 与事件（如点击事件）相关
- 各种宿主环境包：
  - `react-dom`: 浏览器环境
  - `react-native-renderer`: 原生环境
  - `react-art`: Canvas & SVG 渲染相关
  - `react-noop-renderer`: 调试或 Fiber 使用
- 辅助包：
  - `shared`: 公用辅助方法，宿主环境无关。
  - `react-is`: 判断类型
  - `react-client`: 流相关
  - `react-fetch`: 数据请求相关
  - `react-refresh`: 热加载相关

## Reconciler 主要做了什么事

1. **接收并解析 React 元素**：Reconciler 接收 JSX 或者 createElement 函数返回的 React 元素，并将其解析成虚拟 DOM 树的结构。
2. **协调更新**：比较新旧虚拟 DOM 树的差异，并确定哪些部分需要更新，并生成更新计划。
3. **构建虚拟 DOM 树**：在组件更新时，根据生成的更新计划，Reconciler 会更新虚拟 DOM 树的结构以反映最新的组件状态。
4. **生成 DOM 更新指令**：将更新后的虚拟 DOM 树转换为真实的 DOM 操作指令，描述了如何将变更应用到实际的 DOM 树上。

### FiberNode 核心字段

- `type`: 节点的类型，可以是原生 DOM 元素、函数组件或类组件等；
- `props`: 节点的属性，包括 DOM 元素的属性、函数组件的 props 等；
- `stateNode`: 节点对应的实际 DOM 节点或组件实例；
- `child`: 指向节点的第一个字节点；
- `sibling`: 指向节点的下一个兄弟节点；
- `return`: 指向节点的父节点；
- `alternate`: 指向节点的备份节点，用于在协调过程中进行比较；
- `effectTag`: 表示节点的副作用类型，如更新、插入、删除等；
- `pendingProps`: 表示节点的新属性，用于在协调过程中进行更新。

## 扩展

- `rollup-plugin-generate-package-json`: 用于生成 `package.json` 文件。
- `rollup-plugin-typescript2`: 用于编译 TypeScript 代码。
- `rollup-plugin-commonjs`: 用于将 `CommonJS` 模块转换为 `ES` 模块，以便在 Rollup 中进行打包。（Rollup 默认只支持 `ES` 模块）
- `rimraf`: 用于删除之间的打包产物。

## 参考

- [自顶向下学 React 源码](https://ke.segmentfault.com/course/1650000023864436/section/1500000023864578)
- `推荐` [手写 React 源码](https://wangfuyou.com/my-react/)
