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

### Reconciler 的工作流程

1. **遍历 Fiber 树**: React 使用 **深度优先搜索算法** 来遍历 Fiber 树，首先会从 Fiber 树的根节点开始遍历，遍历整个 Fiber 树的结构。
2. **比较新旧节点**: 对于每个 Fiber 节点，`Reconciler` 会比较新节点（即新的 React Element）和旧节点（即现有的 FiberNode）之间的差异，比较的内容包括：节点类型、属性、子节点等。
3. **生成更新计划**: 根据比较结果，`Reconciler` 会生成一个更新计划，用于确定需要进行的操作，更新计划通常包含*哪些节点需要更新*、*哪些节点需要插入到 DOM 中*、*哪些节点需要删除*等信息。
4. **打标记**: 为了记录不同节点的操作，React 会为不同节点打上不同的标记。
5. **更新 Fiber 节点**: 根据生成的更新计划和标记，`Reconciler` 会更新对应的 Fiber 节点，以反映组件的最新状态。更新操作可能包含*更新节点的状态*、*更新节点的属性*、*调用生命周期方法*等。
6. **递归处理子节点**: 对于每个节点的子节点，React 会递归的重复进行上述的比较和操作，以确保整个组件树都得到了正确的处理。

当整个 React Element 都比较完成之后，会生成一颗新的 Fiber 树，此时，一共存在两颗 Fiber 树：

- **current**: 与视图中真实 UI 对应的 Fiber 树，当 React 开始新的一轮渲染时，会使用 `current` 作为参考来比较新的 Fiber 树 与 旧的 Fiber 树之间的差异，决定如何更新 UI。
- **workInProgress**: 触发更新后，正在 `Reconciler` 中处理的 Fiber 树，一旦 `workInProgress` 更新完成，它将会被提交为新的 `current`，成为下一次渲染的参考树。并清空旧的 `current` 树。

### Reconciler 的更新机制

1. **触发更新（Update Trigger）**: 更新可以由组件的状态变化、属性变化、父组件的重新渲染、用户事件触发等触发。
2. **调度阶段（Scheduler Phase）**: 调度器根据更新任务的优先级，将更新任务添加到相应的更新队列中，这个阶段决定了何时以及以何种优先级执行更新任务。
3. **协调阶段（Reconciliation Phase）**: 也可以称为 **Render Phase**，`Reconciler` 负责构建 Fiber 树，处理新旧虚拟 DOM 树之间的差异，生成更新计划，确定需要更新的操作。
4. **提交阶段（Commit Phase）**: 提交阶段将更新到实际的 DOM 中，React 执行 DOM 操作，反映组件树的最新状态。

## 扩展

- `rollup-plugin-generate-package-json`: 用于生成 `package.json` 文件。
- `rollup-plugin-typescript2`: 用于编译 TypeScript 代码。
- `rollup-plugin-commonjs`: 用于将 `CommonJS` 模块转换为 `ES` 模块，以便在 Rollup 中进行打包。（Rollup 默认只支持 `ES` 模块）
- `rimraf`: 用于删除之间的打包产物。

## 参考

- [自顶向下学 React 源码](https://ke.segmentfault.com/course/1650000023864436/section/1500000023864578)
- `推荐` [手写 React 源码](https://wangfuyou.com/my-react/)
