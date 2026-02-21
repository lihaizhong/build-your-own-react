# 01 - JSX 转换

JSX 是 React 的语法扩展，让我们可以用类似 HTML 的语法描述 UI。本节将深入理解 JSX 如何转换为 React 可理解的数据结构。

## JSX 编译过程

### 编译前（JSX）

```tsx
const element = (
  <div id="app">
    <h1>Hello, React!</h1>
    <p>Count: {count}</p>
  </div>
)
```

### 编译后（JavaScript）

```tsx
// React 17+ 的新转换（自动导入）
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime'

const element = _jsxs('div', {
  id: 'app',
  children: [
    _jsx('h1', { children: 'Hello, React!' }),
    _jsxs('p', { children: ['Count: ', count] })
  ]
})
```

### 旧版转换（React 16 及之前）

```tsx
import React from 'react'

const element = React.createElement(
  'div',
  { id: 'app' },
  React.createElement('h1', null, 'Hello, React!'),
  React.createElement('p', null, 'Count: ', count)
)
```

## ReactElement 数据结构

`jsx()` 函数返回一个 `ReactElement` 对象：

```ts
interface ReactElement {
  $$typeof: symbol | number  // 标识这是一个 React 元素
  type: string | Function    // 元素类型（'div' 或组件函数）
  key: string | null         // 列表渲染的 key
  ref: Ref | null            // DOM 引用
  props: Props               // 属性对象（包含 children）
  _owner: Fiber | null       // 创建该元素的组件（内部使用）
  _store: object             // 用于验证（开发模式）
}
```

### 实现示例

```ts
// ReactSymbols.ts
const supportSymbol = typeof Symbol === 'function' && Symbol.for

export const REACT_ELEMENT_TYPE = supportSymbol
  ? Symbol.for('react.element')
  : 0xeac7

// ReactTypes.ts
export type Type = any
export type Key = string | null
export type Ref = any
export type Props = Record<string, any> & { children?: any }

export interface ReactElementType {
  $$typeof: symbol | number
  key: Key
  ref: Ref
  type: Type
  props: Props
  __mark: string  // 自定义标记，用于区分官方 React
}
```

```ts
// jsx.ts
function ReactElement(
  type: Type,
  key: Key,
  ref: Ref,
  props: Props
): ReactElementType {
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    key,
    ref,
    props,
    type,
    __mark: 'my-react-element'
  }
}

export function jsx(
  type: ElementType,
  config: any,
  ...children: any
): ReactElementType {
  let key: Key = null
  let ref: Ref = null
  const props: Props = {}

  // 提取 key 和 ref
  for (const prop in config) {
    const val = config[prop]
    
    if (prop === 'key') {
      if (val !== undefined) {
        key = '' + val  // key 转为字符串
      }
      continue
    }
    
    if (prop === 'ref') {
      if (val !== undefined) {
        ref = val
      }
      continue
    }
    
    // 其他属性放入 props
    if (Object.hasOwn(config, prop)) {
      props[prop] = val
    }
  }

  // 处理 children
  const childrenLength = children.length
  if (childrenLength) {
    // 单个 child 直接赋值，多个 child 用数组
    props.children = childrenLength === 1 ? children[0] : children
  }

  return ReactElement(type, key, ref, props)
}
```

## key 和 ref 的特殊处理

### key

`key` 帮助 React 识别哪些元素改变了（添加、删除、重新排序）。

```tsx
// 正确使用 key
<ul>
  {items.map(item => (
    <li key={item.id}>{item.name}</li>
  ))}
</ul>

// 错误：使用索引作为 key（可能导致问题）
<ul>
  {items.map((item, index) => (
    <li key={index}>{item.name}</li>
  ))}
</ul>
```

**注意**：`key` 不会传递给组件，它只在 React 内部使用。

### ref

`ref` 用于获取 DOM 元素或组件实例的引用。

```tsx
// DOM 元素引用
const inputRef = useRef<HTMLInputElement>(null)
<input ref={inputRef} />

// 类组件实例引用
class MyComponent extends React.Component {
  myMethod() { /* ... */ }
}
<MyComponent ref={componentRef} />

// 函数组件：需要 forwardRef
const MyInput = forwardRef((props, ref) => (
  <input ref={ref} {...props} />
))
```

## children 的处理

JSX 中的子元素会被编译为 `props.children`：

```tsx
// 单个子元素
<div>Hello</div>
// → jsx('div', { children: 'Hello' })
// props.children = 'Hello' (字符串)

// 多个子元素
<div>
  <span>A</span>
  <span>B</span>
</div>
// → jsxs('div', { children: [jsx('span', ...), jsx('span', ...)] })
// props.children = [...] (数组)

// 没有子元素
<div />
// → jsx('div', {})
// props.children = undefined

// 布尔值、null、undefined 会被忽略
<div>{true}{null}{undefined}</div>
// 不会渲染任何内容
```

## jsx vs jsxs

React 17 引入了两种转换函数：

| 函数 | 使用场景 | 性能优化 |
|------|----------|----------|
| `jsx` | 单个子元素或无子元素 | 无需创建数组 |
| `jsxs` | 多个子元素 | 预期数组，避免运行时检查 |

```tsx
// jsx - 单子元素
<div>Hello</div>
// → jsx('div', { children: 'Hello' })

// jsxs - 多子元素
<div><span>A</span><span>B</span></div>
// → jsxs('div', { children: [...] })
```

## 配置 JSX 编译

### Vite / Babel 配置

```js
// vite.config.ts
export default defineConfig({
  esbuild: {
    jsx: 'automatic',  // 使用新的 JSX 转换
    jsxImportSource: 'react'  // 或自定义包名
  }
})
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

### 自定义 JSX 工厂

如果你想用自己的实现：

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "lihzsky-react"  // 使用自定义包
  }
}
```

编译结果：
```tsx
import { jsx as _jsx } from 'lihzsky-react/jsx-runtime'
```

## jsx-dev-runtime

开发环境使用 `jsx-dev-runtime`，提供额外的检查：

```ts
// jsx-dev-runtime.ts
export function jsxDEV(
  type: ElementType,
  config: any,
  ...children: any
): ReactElementType {
  // 开发环境的额外检查
  if (config.key === undefined) {
    console.warn('Missing "key" prop for element in array')
  }
  
  // 更多开发警告...
  
  return jsx(type, config, ...children)
}
```

## 实战练习

### 练习 1：实现 jsx 函数

```ts
// 你的实现
export function jsx(type, config, ...children) {
  // 1. 提取 key 和 ref
  // 2. 构建 props 对象
  // 3. 处理 children
  // 4. 返回 ReactElement
}
```

### 练习 2：打印 ReactElement 树

```tsx
function printElement(element: ReactElement, indent = 0) {
  const prefix = '  '.repeat(indent)
  console.log(`${prefix}<${element.type}>`)
  
  if (element.props.children) {
    const children = Array.isArray(element.props.children)
      ? element.props.children
      : [element.props.children]
    
    children.forEach(child => {
      if (typeof child === 'object') {
        printElement(child, indent + 1)
      } else {
        console.log(`${prefix}  ${child}`)
      }
    })
  }
  
  console.log(`${prefix}</${element.type}>`)
}
```

### 练习 3：实现一个简单的渲染器

```ts
function render(element: ReactElement, container: HTMLElement) {
  const dom = document.createElement(element.type)
  
  // 设置属性
  for (const [key, value] of Object.entries(element.props)) {
    if (key !== 'children') {
      dom.setAttribute(key, value)
    }
  }
  
  // 处理子元素
  const children = element.props.children
  if (children) {
    const childArray = Array.isArray(children) ? children : [children]
    childArray.forEach(child => {
      if (typeof child === 'object') {
        render(child, dom)
      } else {
        dom.appendChild(document.createTextNode(child))
      }
    })
  }
  
  container.appendChild(dom)
}
```

## 小结

1. JSX 是语法糖，编译后变成函数调用
2. `jsx()` 返回 `ReactElement` 对象，描述 UI 结构
3. `key` 和 `ref` 是特殊属性，不传递给组件
4. `children` 可以是字符串、对象或数组

## 下一步

理解了 JSX 转换后，下一步学习 [Fiber 架构](./02-fiber.md)，了解 React 如何用 Fiber 节点组织 UI 树。
