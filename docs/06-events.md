# 06 - 事件系统

React 实现了一套完整的事件系统（Synthetic Events），提供跨浏览器兼容的事件处理。本节深入理解合成事件的原理。

## 为什么需要合成事件？

### 原生事件的问题

```tsx
// 不同浏览器的事件对象属性不一致
document.onclick = function(e) {
  e = e || window.event  // IE 需要
  
  const target = e.target || e.srcElement  // IE 需要
  
  // 阻止冒泡
  if (e.stopPropagation) {
    e.stopPropagation()
  } else {
    e.cancelBubble = true  // IE 需要
  }
  
  // 阻止默认行为
  if (e.preventDefault) {
    e.preventDefault()
  } else {
    e.returnValue = false  // IE 需要
  }
}
```

### 合成事件的优势

| 特性 | 说明 |
|------|------|
| **跨浏览器兼容** | 统一的 API，无需处理浏览器差异 |
| **性能优化** | 事件委托到根节点，减少内存占用 |
| **事件池** | 复用事件对象，减少 GC 压力 |
| **优先级调度** | 支持事件优先级，与调度器配合 |
| **批量更新** | 自动批处理状态更新 |

## 事件委托架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      事件委托机制                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────┐              │
│   │              #root (事件监听器)               │              │
│   │  click, change, input, keydown, ...         │              │
│   └─────────────────────────────────────────────┘              │
│                        │                                        │
│         ┌──────────────┼──────────────┐                        │
│         ▼              ▼              ▼                        │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐                  │
│   │  <div>   │   │  <div>   │   │  <div>   │                  │
│   │ onClick  │   │ onClick  │   │ onClick  │                  │
│   └──────────┘   └──────────┘   └──────────┘                  │
│                                                                 │
│   点击任意 div：                                                 │
│   1. 事件冒泡到 #root                                           │
│   2. React 找到对应的 Fiber 节点                                 │
│   3. 执行 onClick 处理函数                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 合成事件对象

### 数据结构

```ts
interface SyntheticEvent {
  // 基础属性
  bubbles: boolean
  cancelable: boolean
  currentTarget: EventTarget | null
  defaultPrevented: boolean
  eventPhase: number
  isTrusted: boolean
  nativeEvent: Event  // 原生事件对象
  target: EventTarget | null
  timeStamp: number
  type: string
  
  // 方法
  isDefaultPrevented(): boolean
  isPropagationStopped(): boolean
  preventDefault(): void
  stopPropagation(): void
  persist(): void  // 保留事件对象（异步使用）
  
  // 池化相关
  _isSyntheticEvent: boolean
  _dispatchListeners?: Function | Function[]
  _dispatchInstances?: Fiber | Fiber[]
}
```

### 创建合成事件

```ts
function createSyntheticEvent(nativeEvent: Event): SyntheticEvent {
  const syntheticEvent = {
    nativeEvent,
    type: nativeEvent.type,
    target: nativeEvent.target,
    currentTarget: null,
    bubbles: nativeEvent.bubbles,
    cancelable: nativeEvent.cancelable,
    defaultPrevented: nativeEvent.defaultPrevented,
    eventPhase: nativeEvent.eventPhase,
    isTrusted: nativeEvent.isTrusted,
    timeStamp: nativeEvent.timeStamp,
    
    _isSyntheticEvent: true,
    _dispatchListeners: null,
    _dispatchInstances: null,
    
    isDefaultPrevented() {
      return this.defaultPrevented
    },
    
    isPropagationStopped() {
      return false
    },
    
    preventDefault() {
      this.defaultPrevented = true
      this.nativeEvent.preventDefault()
    },
    
    stopPropagation() {
      this._stopPropagation = true
      this.nativeEvent.stopPropagation()
    },
    
    persist() {
      this._persistent = true
    }
  }
  
  return syntheticEvent
}
```

## 事件监听器注册

### 收集事件

```ts
// 从 Fiber 树收集所有事件类型
function listenToAllSupportedEvents(rootContainer: Element) {
  // 所有支持的事件类型
  const allNativeEvents = new Set([
    'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover',
    'mousemove', 'mouseout', 'mouseenter', 'mouseleave',
    'keydown', 'keypress', 'keyup',
    'focus', 'blur', 'change', 'input', 'submit',
    'drag', 'dragend', 'dragenter', 'dragexit', 'dragleave',
    'dragover', 'dragstart', 'drop',
    'touchstart', 'touchend', 'touchmove', 'touchcancel',
    'animationstart', 'animationend', 'animationiteration',
    'transitionend',
    // ...更多事件
  ])
  
  allNativeEvents.forEach(eventType => {
    // 注册捕获和冒泡阶段监听
    listenToNativeEvent(eventType, false, rootContainer)  // 冒泡
    listenToNativeEvent(eventType, true, rootContainer)   // 捕获
  })
}

function listenToNativeEvent(
  eventType: string,
  isCapturePhase: boolean,
  target: Element
) {
  // 事件委托到根节点
  target.addEventListener(
    eventType,
    dispatchEvent,
    isCapturePhase
  )
}
```

### 事件属性提取

```ts
// 从 Fiber 节点提取事件处理函数
function extractEvents(
  dispatchQueue: DispatchQueue,
  eventType: string,
  targetFiber: FiberNode,
  nativeEvent: Event
) {
  // 事件名称映射
  const eventTypes = {
    click: 'onClick',
    doubleclick: 'onDoubleClick',
    mousedown: 'onMouseDown',
    mouseup: 'onMouseUp',
    // ...
  }
  
  const reactEventType = eventTypes[eventType]
  
  // 从目标向上遍历，收集处理函数
  const listeners = accumulateEventListeners(
    targetFiber,
    reactEventType
  )
  
  if (listeners.length > 0) {
    // 创建合成事件
    const syntheticEvent = createSyntheticEvent(nativeEvent)
    
    dispatchQueue.push({
      event: syntheticEvent,
      listeners
    })
  }
}

function accumulateEventListeners(
  targetFiber: FiberNode,
  reactEventType: string
): Listener[] {
  const listeners: Listener[] = []
  let fiber = targetFiber
  
  while (fiber !== null) {
    const { stateNode, tag } = fiber
    
    // 检查是否有事件处理函数
    if (tag === HostComponent || tag === HostText) {
      const props = stateNode.pendingProps || stateNode.memoizedProps
      const listener = props[reactEventType]
      
      if (typeof listener === 'function') {
        listeners.push({
          instance: fiber,
          listener,
          currentTarget: stateNode
        })
      }
    }
    
    // 向上遍历
    fiber = fiber.return
  }
  
  return listeners
}
```

## 事件分发

### dispatchEvent

```ts
function dispatchEvent(nativeEvent: Event) {
  // 1. 获取目标 Fiber
  const targetFiber = getClosestInstanceFromNode(nativeEvent.target)
  
  if (targetFiber === null) {
    return
  }
  
  // 2. 获取 FiberRoot
  const root = getFiberRootFromTarget(targetFiber)
  
  // 3. 批量更新上下文
  const previousPriority = getCurrentUpdatePriority()
  const eventPriority = getEventPriority(nativeEvent.type)
  setCurrentUpdatePriority(eventPriority)
  
  // 4. 分发事件
  try {
    batchedUpdates(dispatchEvents, root, nativeEvent, targetFiber)
  } finally {
    setCurrentUpdatePriority(previousPriority)
  }
}

function dispatchEvents(
  root: FiberRootNode,
  nativeEvent: Event,
  targetFiber: FiberNode
) {
  const dispatchQueue: DispatchQueue = []
  
  // 收集事件处理函数
  extractEvents(
    dispatchQueue,
    nativeEvent.type,
    targetFiber,
    nativeEvent
  )
  
  // 执行事件处理函数
  processDispatchQueue(dispatchQueue)
}
```

### 执行事件处理

```ts
function processDispatchQueue(dispatchQueue: DispatchQueue) {
  for (const { event, listeners } of dispatchQueue) {
    for (let i = 0; i < listeners.length; i++) {
      const { listener, instance, currentTarget } = listeners[i]
      
      // 设置 currentTarget
      event.currentTarget = currentTarget
      
      // 检查是否已停止传播
      if (event._stopPropagation) {
        break
      }
      
      // 执行处理函数
      listener.call(instance, event)
    }
  }
}
```

## 事件优先级

不同事件有不同的优先级：

```ts
const eventPriorities = {
  // 离散事件 - 同步优先级
  click: DiscreteEventPriority,
  dblclick: DiscreteEventPriority,
  mousedown: DiscreteEventPriority,
  mouseup: DiscreteEventPriority,
  keydown: DiscreteEventPriority,
  keypress: DiscreteEventPriority,
  keyup: DiscreteEventPriority,
  
  // 连续事件 - 用户阻塞优先级
  mousemove: ContinuousEventPriority,
  mouseover: ContinuousEventPriority,
  mouseout: ContinuousEventPriority,
  mouseenter: ContinuousEventPriority,
  mouseleave: ContinuousEventPriority,
  drag: ContinuousEventPriority,
  touchmove: ContinuousEventPriority,
  
  // 其他 - 默认优先级
  change: DefaultEventPriority,
  input: DefaultEventPriority,
  scroll: DefaultEventPriority,
}

function getEventPriority(eventType: string): Lane {
  return eventPriorities[eventType] || DefaultEventPriority
}
```

### 优先级的作用

```tsx
function App() {
  const [count, setCount] = useState(0)
  
  // 点击事件：同步优先级
  // 状态更新会立即执行
  const handleClick = () => {
    setCount(c => c + 1)
  }
  
  // mousemove 事件：连续事件优先级
  // 状态更新可能被批处理
  const handleMouseMove = () => {
    setCount(c => c + 1)
  }
  
  return (
    <div 
      onClick={handleClick}
      onMouseMove={handleMouseMove}
    >
      {count}
    </div>
  )
}
```

## 事件池

### 为什么需要事件池？

```tsx
// ❌ 错误：异步访问事件对象
function handleClick(e) {
  setTimeout(() => {
    console.log(e.target)  // null！事件对象已被回收
  }, 100)
}

// ✅ 正确：使用 persist 保留事件
function handleClick(e) {
  e.persist()  // 从池中移除，不会被回收
  setTimeout(() => {
    console.log(e.target)  // 正常访问
  }, 100)
}

// ✅ 正确：保存需要的值
function handleClick(e) {
  const target = e.target
  setTimeout(() => {
    console.log(target)
  }, 100)
}
```

### 事件池实现

```ts
const eventPool: SyntheticEvent[] = []
const poolSize = 10

function getPooledEvent(nativeEvent: Event): SyntheticEvent {
  // 尝试从池中获取
  if (eventPool.length > 0) {
    const event = eventPool.pop()
    // 重置并复用
    return reinitializeEvent(event, nativeEvent)
  }
  
  // 池中没有，创建新的
  return createSyntheticEvent(nativeEvent)
}

function releaseEvent(event: SyntheticEvent) {
  // 如果没有被 persist，放回池中
  if (!event._persistent && eventPool.length < poolSize) {
    resetEvent(event)
    eventPool.push(event)
  }
}

// React 17+ 已移除事件池
// 现代浏览器优化后不再需要
```

## 特殊事件处理

### onChange 事件

React 的 onChange 与原生 change 不同：

```ts
// React 的 onChange 在 input 时就触发
// 原生 change 在失焦时触发

function handleChange(event) {
  const value = event.target.value
  // 实时获取输入值
}

// 实现原理
function extractInputEvents(target: FiberNode) {
  const props = target.memoizedProps
  
  if (props.onChange) {
    // 监听 input 事件而非 change
    listenToNativeEvent('input', false, target.stateNode)
    listenToNativeEvent('change', false, target.stateNode)
  }
}
```

### onFocus/onBlur

```ts
// React 的 focus/blur 会冒泡
// 原生 focus/blur 不冒泡

function extractFocusEvents(target: FiberNode) {
  // 使用 focusin/focusout 代替 focus/blur
  listenToNativeEvent('focusin', false, target.stateNode)
  listenToNativeEvent('focusout', false, target.stateNode)
}
```

## 实现示例

### 简化版事件系统

```ts
class EventSystem {
  private root: Element
  private listeners: Map<string, Map<Element, Function>>
  
  constructor(root: Element) {
    this.root = root
    this.listeners = new Map()
    this.setup()
  }
  
  private setup() {
    const events = ['click', 'change', 'input', 'keydown', 'keyup']
    
    events.forEach(eventType => {
      this.root.addEventListener(eventType, this.handleEvent.bind(this))
    })
  }
  
  addListener(element: Element, eventType: string, listener: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Map())
    }
    this.listeners.get(eventType)!.set(element, listener)
  }
  
  removeListener(element: Element, eventType: string) {
    this.listeners.get(eventType)?.delete(element)
  }
  
  private handleEvent(nativeEvent: Event) {
    const eventType = nativeEvent.type
    const eventListeners = this.listeners.get(eventType)
    
    if (!eventListeners) return
    
    // 创建合成事件
    const syntheticEvent = this.createSyntheticEvent(nativeEvent)
    
    // 从目标向上冒泡
    let target = nativeEvent.target as Element | null
    
    while (target && target !== this.root) {
      const listener = eventListeners.get(target)
      
      if (listener) {
        syntheticEvent.currentTarget = target
        listener.call(target, syntheticEvent)
        
        if (syntheticEvent._stopPropagation) {
          break
        }
      }
      
      target = target.parentElement
    }
  }
  
  private createSyntheticEvent(nativeEvent: Event) {
    return {
      nativeEvent,
      type: nativeEvent.type,
      target: nativeEvent.target,
      currentTarget: null,
      _stopPropagation: false,
      
      stopPropagation() {
        this._stopPropagation = true
        this.nativeEvent.stopPropagation()
      },
      
      preventDefault() {
        this.nativeEvent.preventDefault()
      }
    }
  }
}
```

## 调试技巧

### 打印事件流

```tsx
function EventDebugger() {
  const handleClick = (e) => {
    console.log('Event Phase:', e.eventPhase)
    console.log('Target:', e.target)
    console.log('Current Target:', e.currentTarget)
    console.log('Native Event:', e.nativeEvent)
  }
  
  return (
    <div onClick={handleClick}>
      <button onClick={handleClick}>
        <span onClick={handleClick}>Click me</span>
      </button>
    </div>
  )
}
```

### 查看事件监听器

```ts
// Chrome DevTools
// Elements → Event Listeners 面板
// 查看绑定在元素上的事件

// 代码查看
getEventListeners(document.getElementById('root'))
```

## React 17+ 变化

React 17 对事件系统做了重要改动：

### 变更点

| 变更 | React 16 | React 17+ |
|------|----------|-----------|
| 事件委托位置 | `document` | `ReactDOM.render` 的根节点 |
| 事件池 | 使用 | 移除 |
| useEffect 执行时机 | 在渲染前 | 在渲染后 |
| onScroll 冒泡 | 不冒泡 | 冒泡 |

### 影响

```tsx
// React 16
document.addEventListener('click', () => {
  console.log('document click')
})

function App() {
  const handleClick = () => {
    console.log('react click')
    e.stopPropagation()
  }
  
  return <div onClick={handleClick}>Click</div>
}

// 点击结果：document click → react click
// React 事件委托在 document，stopPropagation 无法阻止

// React 17+
// 点击结果：react click（stopPropagation 生效）
```

## 小结

1. **事件委托**：所有事件监听器绑定到根节点，减少内存占用
2. **合成事件**：统一的跨浏览器 API
3. **事件优先级**：不同事件有不同优先级，配合调度器
4. **事件池**：React 17 已移除，现代浏览器不再需要
5. **特殊事件**：onChange、onFocus 等与原生行为不同
6. **React 17+**：事件委托位置变更，更符合预期

## 学习总结

恭喜你完成了 React 核心概念的学习！

| 章节 | 核心内容 |
|------|----------|
| [JSX 转换](./01-jsx.md) | ReactElement、createElement、key/ref |
| [Fiber 架构](./02-fiber.md) | FiberNode、双缓冲、工作单元 |
| [协调算法](./03-reconciliation.md) | beginWork、completeWork、Diff |
| [Hooks 实现](./04-hooks.md) | 链表结构、Dispatcher、闭包陷阱 |
| [调度器](./05-scheduler.md) | 时间切片、优先级、MessageChannel |
| [事件系统](./06-events.md) | 合成事件、事件委托、优先级 |

现在你已经掌握了 React 的核心原理，可以开始动手实现自己的 React 了！
