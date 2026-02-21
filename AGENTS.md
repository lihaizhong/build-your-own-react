# AGENTS.md - AI Agent 项目指南

## 项目概述

这是一个 **从零实现 React 核心功能** 的学习项目，旨在深入理解 React 的工作原理。项目模拟 React 18+ 的架构设计，计划实现 Fiber 架构、Hooks 机制、协调算法等核心概念。

### 项目目标

- 实现 React 核心包（react、react-dom、react-reconciler）
- 理解 Fiber 架构的工作原理
- 实现 useState 等 Hooks
- 实现协调算法和调度机制

### 当前状态

> **注意**：项目处于规划阶段，`packages/` 目录暂未实现代码。核心代码将按文档教程逐步实现。

## 技术栈

- **语言**: TypeScript 5.9+
- **包管理器**: pnpm (monorepo 架构)
- **构建工具**: Vite 7.x
- **测试框架**: Vitest 4.x + Testing Library
- **代码规范**: ESLint 10.x + Prettier 3.x
- **提交规范**: Commitlint 20.x + Husky 9.x

## 项目结构

```
build-your-own-react/
├── packages/                    # monorepo 包目录（待实现）
│   ├── react/                   # React 核心 API
│   │   ├── index.ts             # 入口文件
│   │   └── src/
│   │       ├── jsx.ts           # JSX 转换实现
│   │       ├── jsx-dev-runtime.ts
│   │       └── currentDispatcher.ts
│   │
│   ├── react-dom/               # 浏览器环境渲染器
│   │   └── src/
│   │       ├── hostConfig.ts    # 宿主环境配置
│   │       └── root.ts          # createRoot 实现
│   │
│   ├── react-reconciler/        # 协调器（核心逻辑）
│   │   └── src/
│   │       ├── fiber.ts         # Fiber 节点定义
│   │       ├── fiberFlags.ts    # 副作用标记
│   │       ├── fiberHooks.ts    # Hooks 实现
│   │       ├── fiberReconciler.ts
│   │       ├── beginWork.ts     # 递阶段
│   │       ├── completeWork.ts  # 归阶段
│   │       ├── workLoop.ts      # 工作循环
│   │       ├── workTags.ts      # 工作单元类型
│   │       └── updateQueue.ts   # 更新队列
│   │
│   └── shared/                  # 共享模块
│       ├── ReactTypes.ts
│       ├── ReactSymbols.ts
│       └── internals.ts
│
├── docs/                        # React 学习指南
│   ├── README.md                # 学习路线图
│   └── tutorial/                # 教程文档
│       ├── 01-jsx.md            # JSX 转换详解
│       ├── 02-fiber.md          # Fiber 架构详解
│       ├── 03-reconciliation.md # 协调算法详解
│       ├── 04-hooks.md          # Hooks 实现原理
│       ├── 05-scheduler.md      # 调度器详解
│       └── 06-events.md         # 事件系统详解
│
├── vite.config.ts               # Vite 构建配置
├── vitest.config.ts             # Vitest 测试配置
├── vitest.setup.ts              # 测试环境设置
├── eslint.config.js             # ESLint 配置（扁平配置）
├── .prettierrc                  # Prettier 配置
├── package.json
├── pnpm-workspace.yaml          # pnpm 工作空间配置
├── tsconfig.json
└── commitlint.config.mjs        # 提交信息规范配置
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发
pnpm dev              # 启动开发服务器 (端口 3000)
pnpm build            # 构建项目
pnpm preview          # 预览构建结果

# 测试
pnpm test             # 运行测试（监听模式）
pnpm test:run         # 运行测试（单次）
pnpm test:coverage    # 生成覆盖率报告
pnpm test:ui          # Vitest 可视化界面

# 代码检查
pnpm lint             # ESLint 检查
pnpm lint:fix         # ESLint 自动修复
pnpm format           # Prettier 格式化
pnpm format:check     # Prettier 检查
pnpm typecheck        # TypeScript 类型检查
```

## 核心概念

### 1. Fiber 架构

Fiber 是 React 16+ 引入的新协调算法，核心数据结构是 `FiberNode`：

```typescript
class FiberNode {
  tag: WorkTag;           // 工作单元类型
  key: Key;               // 节点 key
  type: any;              // 节点类型
  stateNode: any;         // 对应的 DOM 节点或组件实例
  
  // 树状结构
  return: FiberNode | null;   // 父节点
  child: FiberNode | null;    // 第一个子节点
  sibling: FiberNode | null;  // 下一个兄弟节点
  
  // 工作单元
  pendingProps: Props;    // 待处理属性
  memoizedProps: Props;   // 已处理属性
  memoizedState: any;     // 状态
  alternate: FiberNode;   // 双缓冲机制的备份节点
  
  // 副作用
  flags: Flags;           // 副作用标记
  updateQueue: unknown;   // 更新队列
}
```

**双缓冲机制**：`current` 和 `workInProgress` 两棵 Fiber 树交替使用，实现无闪烁更新。

### 2. 工作循环 (workLoop)

```
renderRoot
    ↓
prepareFreshStack (初始化 workInProgress)
    ↓
workLoop
    ↓
performUnitOfWork (深度优先遍历)
    ├── beginWork (向下递归，处理子节点)
    └── completeWork (向上归并，处理副作用)
```

### 3. 工作单元类型 (WorkTag)

| 类型 | 值 | 说明 |
|------|-----|------|
| FunctionComponent | 0 | 函数组件 |
| HostRoot | 3 | 根节点 |
| HostComponent | 5 | 原生 DOM 元素 |
| HostText | 6 | 文本节点 |

### 4. 副作用标记 (Flags)

```typescript
NoFlags = 0b00000000        // 无副作用
PerformedWork = 0b00000001  // 执行工作
Placement = 0b00000010      // 插入
Update = 0b00000100         // 更新
Deletion = 0b00001000       // 删除
```

### 5. Hooks 实现

Hooks 通过链表结构存储在 Fiber 节点的 `memoizedState` 属性中：

```typescript
interface Hook {
  memoizedState: any;     // Hook 状态
  queue: any;             // 更新队列
  next: Hook | null;      // 下一个 Hook
}
```

**useState 实现要点**：
- Mount 阶段：创建 Hook，初始化状态
- Update 阶段：从 updateQueue 中取出更新，计算新状态
- dispatch 触发更新：调用 `scheduleUpdateOnFiber` 调度更新

## 配置文件说明

### Vite 配置 (vite.config.ts)

```typescript
export default defineConfig({
  plugins: [react()],
  server: { port: 3000, open: true },
  build: {
    lib: {
      entry: resolve(__dirname, 'packages/react/index.ts'),
      name: 'React',
      fileName: (format) => `react.${format}.js`,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'packages'),
      'lihzsky-react': resolve(__dirname, 'packages/react/index.ts'),
      'lihzsky-react-dom': resolve(__dirname, 'packages/react-dom/index.ts'),
      'lihzsky-react-reconciler': resolve(__dirname, 'packages/react-reconciler/index.ts'),
      'lihzsky-shared': resolve(__dirname, 'packages/shared/index.ts'),
      hostConfig: resolve(__dirname, 'packages/react-dom/src/hostConfig.ts'),
    },
  },
  esbuild: { jsx: 'automatic' },
});
```

### Vitest 配置 (vitest.config.ts)

- 测试环境: jsdom
- 覆盖率: v8 provider
- 全局 API: 开启
- 设置文件: vitest.setup.ts
- 测试文件匹配: `packages/**/*.{test,spec}.{ts,tsx}`

### ESLint 配置 (eslint.config.js)

使用 ESLint 10.x 扁平配置：
- `typescript-eslint`：TypeScript 支持
- `eslint-plugin-prettier`：Prettier 集成
- 忽略目录: `dist/`, `node_modules/`, `coverage/`

### Prettier 配置 (.prettierrc)

```json
{
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": true,
  "singleQuote": true,
  "semi": true,
  "trailingComma": "none",
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### pnpm 工作空间 (pnpm-workspace.yaml)

```yaml
packages:
  - packages/**

onlyBuiltDependencies:
  - esbuild
```

## 包间依赖关系

```
react-dom
    ├── react (peer)
    └── react-reconciler
        ├── react (内部共享)
        └── shared

react
    └── shared
```

## 路径别名

包导入使用 `lihzsky-` 前缀：
- `lihzsky-react`
- `lihzsky-react-dom`
- `lihzsky-react-reconciler`
- `lihzsky-shared`
- `hostConfig` (特殊路径，用于宿主环境配置)

## 学习资源

### 项目文档 (docs/)

| 文档 | 内容 |
|------|------|
| [README.md](docs/README.md) | 学习路线图、核心概念速查、常见问题 |
| [01-jsx.md](docs/tutorial/01-jsx.md) | JSX 编译、ReactElement、key/ref |
| [02-fiber.md](docs/tutorial/02-fiber.md) | FiberNode、双缓冲、树遍历 |
| [03-reconciliation.md](docs/tutorial/03-reconciliation.md) | beginWork/completeWork、Diff 算法 |
| [04-hooks.md](docs/tutorial/04-hooks.md) | Hook 链表、Dispatcher、闭包陷阱 |
| [05-scheduler.md](docs/tutorial/05-scheduler.md) | 时间切片、优先级、MessageChannel |
| [06-events.md](docs/tutorial/06-events.md) | 合成事件、事件委托 |

### 外部资源

- [React 官方文档](https://react.dev/)
- [React GitHub 仓库](https://github.com/facebook/react)
- [React 技术揭秘](https://react.iamkasong.com/) - 卡颂
- [自顶向下学 React 源码](https://ke.segmentfault.com/course/1650000023864436)
- [手写 React 源码](https://wangfuyou.com/my-react/)

## 注意事项

1. **Hooks 规则**：Hooks 只能在函数组件中调用，通过 `currentDispatcher` 上下文判断
2. **双缓冲**：`current` 和 `workInProgress` 指针交替指向两棵 Fiber 树
3. **深度优先遍历**：beginWork 向下，completeWork 向上
4. **更新队列**：使用环形链表存储待处理的更新
5. **开发服务器端口**：默认 3000，可在 vite.config.ts 中修改

## 实现计划

### 第一阶段：基础架构
- [x] 创建项目结构
- [x] 配置 TypeScript、Vite、ESLint、Vitest
- [ ] 实现 JSX 转换

### 第二阶段：Fiber 核心
- [ ] 实现 Fiber 数据结构
- [ ] 实现工作循环
- [ ] 实现 DFS 遍历

### 第三阶段：协调与渲染
- [ ] 实现 beginWork (递阶段)
- [ ] 实现 completeWork (归阶段)
- [ ] 实现 commitRoot
- [ ] 实现 hostConfig

### 第四阶段：状态管理
- [ ] 实现 useState
- [ ] 实现 Hook 链表结构
- [ ] 实现 UpdateQueue

### 第五阶段：优化与扩展
- [ ] 实现调度器 (scheduler)
- [ ] 实现事件系统
- [ ] 实现更多 Hooks (useEffect, useMemo, useCallback 等)
- [ ] 并发模式支持
