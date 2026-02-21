# 05 - 调度器 (Scheduler)

调度器是 React 并发模式的核心，负责时间切片、优先级调度和任务中断恢复。本节深入理解 Scheduler 的工作原理。

## 为什么需要调度器？

### 问题场景

```
┌─────────────────────────────────────────────────────────────────┐
│                    主线程阻塞问题                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户输入 ──▶ [等待...] ──▶ 响应                                │
│                                                                 │
│  时间线:                                                        │
│  ┌────────────────────────────────────────────────┐            │
│  │            大组件渲染（200ms）                   │            │
│  └────────────────────────────────────────────────┘            │
│       ▲                                                        │
│       │                                                        │
│   用户在此期间点击 ──▶ 无响应                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 解决方案

```
┌─────────────────────────────────────────────────────────────────┐
│                    时间切片方案                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  时间线:                                                        │
│  ┌──────┐ ┌──────┐ ┌──┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│  │渲染1 │ │渲染2 │ │输入│ │渲染3 │ │渲染4 │ │渲染5 │            │
│  │ 5ms  │ │ 5ms  │ │处理│ │ 5ms  │ │ 5ms  │ │ 5ms  │            │
│  └──────┘ └──────┘ └──┘ └──────┘ └──────┘ └──────┘            │
│                │                                                │
│                ▼                                                │
│           让出主线程                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 核心概念

### 优先级 (Priority)

React 定义了不同优先级来区分任务紧急程度：

```ts
// 优先级数值（越小越优先）
export const NoPriority = 0          // 无优先级
export const ImmediatePriority = 1   // 立即执行（用户输入）
export const UserBlockingPriority = 2  // 用户阻塞（点击）
export const NormalPriority = 3      // 正常优先级（数据请求）
export const LowPriority = 4         // 低优先级（分析）
export const IdlePriority = 5        // 空闲优先级

// 优先级对应的超时时间
const timeoutMap = {
  [ImmediatePriority]: -1,      // 立即执行
  [UserBlockingPriority]: 250,  // 250ms
  [NormalPriority]: 5000,       // 5s
  [LowPriority]: 10000,         // 10s
  [IdlePriority]: maxSigned31BitInt  // 永不超时
}
```

### Lane 模型

React 18 使用 Lane 模型替代优先级：

```ts
// Lane 是 31 位二进制数
export const TotalLanes = 31

export const NoLanes = 0b0000000000000000000000000000000
export const SyncLane = 0b0000000000000000000000000000001
export const InputContinuousHydrationLane = 0b0000000000000000000000000000010
export const InputContinuousLane = 0b0000000000000000000000000000100
export const DefaultLane = 0b0000000000000000000000000010000
export const TransitionLane = 0b0000000000000000000000000100000
export const IdleLane = 0b0100000000000000000000000000000

// Lane 的优势：
// 1. 可以批量处理多个优先级
// 2. 更细粒度的优先级控制
// 3. 支持优先级插队
```

## Scheduler 实现

### 任务队列

```ts
interface Task {
  id: number
  callback: Function | null
  priorityLevel: Priority
  startTime: number      // 开始时间
  expirationTime: number // 过期时间
  sortIndex: number      // 排序索引
}

// 最小堆（按过期时间排序）
const taskQueue: Task[] = []
const timerQueue: Task[] = []  // 延迟任务

let taskIdCounter = 1
```

### 调度入口

```ts
function scheduleCallback(
  priorityLevel: Priority,
  callback: Function,
  options?: { delay?: number }
): Task {
  const currentTime = getCurrentTime()
  
  let startTime: number
  if (options?.delay && options.delay > 0) {
    startTime = currentTime + options.delay
  } else {
    startTime = currentTime
  }
  
  // 计算过期时间
  const timeout = timeoutMap[priorityLevel]
  const expirationTime = startTime + timeout
  
  const task: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: expirationTime  // 按过期时间排序
  }
  
  if (startTime > currentTime) {
    // 延迟任务，放入 timerQueue
    push(timerQueue, task)
    // 设置定时器
    requestHostTimeout(handleTimeout, startTime - currentTime)
  } else {
    // 立即执行，放入 taskQueue
    push(taskQueue, task)
    // 请求调度
    requestHostCallback(flushWork)
  }
  
  return task
}
```

### 工作循环

```ts
let isHostCallbackScheduled = false
let isPerformingWork = false

function flushWork(initialTime: number) {
  isHostCallbackScheduled = false
  isPerformingWork = true
  
  try {
    return workLoop(initialTime)
  } finally {
    currentTask = null
    isPerformingWork = false
  }
}

function workLoop(initialTime: number): boolean {
  let currentTime = initialTime
  
  // 处理过期的定时器
  advanceTimers(currentTime)
  
  // 获取最高优先级任务
  currentTask = peek(taskQueue)
  
  while (currentTask !== null) {
    // 检查是否需要让出主线程
    if (
      currentTask.expirationTime > currentTime &&
      shouldYieldToHost()
    ) {
      // 时间片用完，暂停
      break
    }
    
    const callback = currentTask.callback
    if (typeof callback === 'function') {
      currentTask.callback = null
      
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime
      
      // 执行任务，返回是否继续
      const continuationCallback = callback(didUserCallbackTimeout)
      currentTime = getCurrentTime()
      
      if (typeof continuationCallback === 'function') {
        // 任务未完成，继续
        currentTask.callback = continuationCallback
      } else {
        // 任务完成，移除
        pop(taskQueue)
      }
    } else {
      // 无回调，移除
      pop(taskQueue)
    }
    
    currentTask = peek(taskQueue)
  }
  
  if (currentTask !== null) {
    // 还有任务，返回 true 继续调度
    return true
  } else {
    // 没有任务，检查 timerQueue
    const firstTimer = peek(timerQueue)
    if (firstTimer) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime)
    }
    return false
  }
}
```

### 时间切片

```ts
// 每帧的时间片（5ms）
const frameInterval = 5

let frameDeadline = 0
let scheduledHostCallback: Function | null = null

function shouldYieldToHost(): boolean {
  return getCurrentTime() >= frameDeadline
}

// 使用 MessageChannel 实现异步调度
const channel = new MessageChannel()
const port = channel.port2
channel.port1.onmessage = performWorkUntilDeadline

function requestHostCallback(callback: Function) {
  scheduledHostCallback = callback
  
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true
    port.postMessage(null)
  }
}

function performWorkUntilDeadline() {
  if (scheduledHostCallback) {
    // 设置截止时间
    frameDeadline = getCurrentTime() + frameInterval
    
    try {
      const hasMoreWork = scheduledHostCallback(getCurrentTime())
      
      if (hasMoreWork) {
        // 还有工作，继续调度
        port.postMessage(null)
      } else {
        isMessageLoopRunning = false
        scheduledHostCallback = null
      }
    } catch (error) {
      port.postMessage(null)
      throw error
    }
  } else {
    isMessageLoopRunning = false
  }
}
```

## 为什么用 MessageChannel？

### 对比其他方案

| 方案 | 特点 | 问题 |
|------|------|------|
| `setTimeout` | 宏任务 | 最小延迟 4ms，浪费性能 |
| `setInterval` | 循环宏任务 | 同上 |
| `requestAnimationFrame` | 与渲染同步 | 不是每次渲染都执行，不适合任务调度 |
| `Promise.then` | 微任务 | 在渲染前执行，无法让出主线程 |
| `MessageChannel` | 宏任务 | 无最小延迟，最佳选择 |

```
事件循环时间线:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  微任务 ──▶ 渲染前 ──▶ requestAnimationFrame ──▶ 渲染 ──▶ 宏任务  │
│                                                                 │
│  setTimeout(fn, 0)  ──▶ 至少延迟 4ms                            │
│  Promise.then()     ──▶ 微任务，无法让出主线程                    │
│  MessageChannel     ──▶ 宏任务，下一个事件循环执行，无延迟         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## React 中的调度

### scheduleUpdateOnFiber

```ts
function scheduleUpdateOnFiber(fiber: FiberNode) {
  // 1. 标记更新
  const root = markUpdateFromFiberToRoot(fiber)
  
  // 2. 获取优先级
  const lane = requestUpdateLane(fiber)
  
  // 3. 标记 Lane
  markRootUpdated(root, lane)
  
  // 4. 确保调度
  ensureRootIsScheduled(root)
}

function ensureRootIsScheduled(root: FiberRootNode) {
  // 获取最高优先级 Lane
  const nextLanes = getNextLanes(root)
  const newCallbackPriority = getHighestPriorityLane(nextLanes)
  
  // 检查是否已有调度
  const existingCallbackPriority = root.callbackPriority
  
  if (existingCallbackPriority === newCallbackPriority) {
    // 优先级相同，复用现有调度
    return
  }
  
  // 取消现有调度
  if (root.callbackNode !== null) {
    cancelCallback(root.callbackNode)
  }
  
  // 创建新调度
  let newCallbackNode
  if (newCallbackPriority === SyncLane) {
    // 同步优先级，立即执行
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root))
    newCallbackNode = null
  } else {
    // 异步优先级，加入调度
    const schedulerPriorityLevel = lanesToEventPriority(nextLanes)
    newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    )
  }
  
  root.callbackPriority = newCallbackPriority
  root.callbackNode = newCallbackNode
}
```

### 可中断渲染

```ts
function performConcurrentWorkOnRoot(
  root: FiberRootNode,
  didTimeout: boolean
): Function | null {
  // 检查是否超时
  if (didTimeout) {
    // 超时任务优先执行
    const lanes = getLanesToRetrySynchronouslyOnError(root)
    if (lanes !== NoLanes) {
      // 同步执行
      return performSyncWorkOnRoot.bind(null, root)
    }
  }
  
  // 获取可工作的 Lanes
  const lanes = getNextLanes(root)
  
  // 渲染阶段
  const exitStatus = renderRootConcurrent(root, lanes)
  
  if (exitStatus === RootInProgress) {
    // 渲染未完成，返回继续函数
    return performConcurrentWorkOnRoot.bind(null, root)
  }
  
  if (exitStatus === RootCompleted) {
    // 渲染完成，提交
    const finishedWork = root.current.alternate
    root.finishedWork = finishedWork
    commitRoot(root)
  }
  
  return null
}

function renderRootConcurrent(
  root: FiberRootNode,
  lanes: Lanes
): RootExitStatus {
  // 准备工作
  prepareFreshStack(root, lanes)
  
  // 工作循环（可中断）
  do {
    try {
      workLoopConcurrent()
      break
    } catch (error) {
      // 错误处理
    }
  } while (true)
  
  if (workInProgress !== null) {
    // 未完成
    return RootInProgress
  }
  
  return RootCompleted
}

function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress)
  }
}
```

## 任务插队

当更高优先级任务到来时：

```
┌─────────────────────────────────────────────────────────────────┐
│                      任务插队示例                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  时间线:                                                        │
│                                                                 │
│  [低优先级任务 A 开始]                                           │
│       │                                                         │
│       ▼                                                         │
│  [A 执行 3ms]                                                   │
│       │                                                         │
│       │ ◀── [高优先级任务 B 到来]                                │
│       ▼                                                         │
│  [shouldYield = true，暂停 A]                                   │
│       │                                                         │
│       ▼                                                         │
│  [执行 B 到完成]                                                 │
│       │                                                         │
│       ▼                                                         │
│  [恢复 A，继续执行]                                              │
│       │                                                         │
│       ▼                                                         │
│  [A 完成]                                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 饥饿问题

低优先级任务可能永远无法执行：

```ts
function markStarvedLanesAsExpired(root: FiberRootNode, currentTime: number) {
  const pendingLanes = root.pendingLanes
  const suspendedLanes = root.suspendedLanes
  const pingedLanes = root.pingedLanes
  
  let lanes = pendingLanes
  
  while (lanes > 0) {
    const lane = pickArbitraryLane(lanes)
    
    if (!root.expirationTimes.has(lane)) {
      // 设置过期时间
      const timeout = expirationTimeToTimeout(lane)
      root.expirationTimes.set(lane, currentTime + timeout)
    } else if (root.expirationTimes.get(lane) <= currentTime) {
      // 已过期，标记为同步执行
      root.expiredLanes |= lane
    }
    
    lanes &= ~lane
  }
}
```

## 简化版实现

```ts
// 简化的调度器
class SimpleScheduler {
  private taskQueue: Task[] = []
  private isRunning = false
  private frameDeadline = 0
  private readonly frameInterval = 5

  schedule(priority: Priority, callback: Function) {
    const task: Task = {
      id: Date.now(),
      callback,
      priority,
      startTime: performance.now(),
      expirationTime: performance.now() + this.getTimeout(priority),
      sortIndex: 0
    }
    
    this.taskQueue.push(task)
    this.taskQueue.sort((a, b) => a.expirationTime - b.expirationTime)
    
    this.requestRun()
  }

  private requestRun() {
    if (!this.isRunning) {
      this.isRunning = true
      requestAnimationFrame(() => this.runTasks())
    }
  }

  private runTasks() {
    this.frameDeadline = performance.now() + this.frameInterval
    
    while (this.taskQueue.length > 0) {
      if (performance.now() >= this.frameDeadline) {
        // 让出主线程
        requestAnimationFrame(() => this.runTasks())
        return
      }
      
      const task = this.taskQueue.shift()
      if (task && typeof task.callback === 'function') {
        task.callback()
      }
    }
    
    this.isRunning = false
  }

  private getTimeout(priority: Priority): number {
    const timeouts: Record<Priority, number> = {
      [ImmediatePriority]: -1,
      [UserBlockingPriority]: 250,
      [NormalPriority]: 5000,
      [LowPriority]: 10000,
      [IdlePriority]: 1073741823
    }
    return timeouts[priority] || 5000
  }
}
```

## 小结

1. **时间切片**：将大任务拆分成小单元，避免阻塞主线程
2. **优先级调度**：高优先级任务可以打断低优先级任务
3. **MessageChannel**：无最小延迟的宏任务，最佳调度方案
4. **Lane 模型**：更细粒度的优先级控制
5. **饥饿问题**：低优先级任务超时后会升级执行
6. **可中断渲染**：shouldYield() 检查是否需要让出主线程

## 下一步

理解调度器后，下一步学习 [事件系统](./06-events.md)，了解 React 合成事件的实现原理。
