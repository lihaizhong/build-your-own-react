import internals from "lihzsky-shared/internals";
import { FiberNode } from "./fiber";
import { Dispatcher } from "react/src/currentDispatcher";
import { UpdateQueue } from "./updateQueue";
import { Action } from "shared/ReactTypes";

const { currentDispatcher } = internals;

export interface Hook {
  memoizedState: any;
  queue: any;
  next: Hook | null;
}

/**
 * 执行函数组件中的函数
 * @param workInProgress
 * @returns
 */
export function renderWithHooks(workInProgress: FiberNode): FiberNode | null {
  // 赋值
  currentlyRenderingFiber = workInProgress;
  workInProgress.memoizedState = null;

  // 判断 Hooks 被调用的时机
  const current = workInProgress.alternate;
  if (current !== null) {
    // 组件更新阶段（update）
    currentDispatcher.current = HookDispatcherOnUpdate;
  } else {
    // 组件首次渲染阶段（mount）
    currentDispatcher.current = HookDispatcherOnMount;
  }

  // 函数保存在 type 属性上
  const Component = workInProgress.type;
  const props = workInProgress.pendingProps;
  // 执行函数
  const children = Component(props);

  // 重置
  currentlyRenderingFiber = null;
  workInProgressHook = null;

  return children;
}

const HookDispatcherOnMount: Dispatcher = {
  useState: mountState,
};

const HookDispatcherOnUpdate: Dispatcher = {
  useState: updateState,
};

function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    memoizedState: null,
    queue: null,
    next: null,
  };

  if (workInProgressHook == null) {
    // mount 时的第一个 hook
    if (currentlyRenderingFiber !== null) {
      workInProgressHook = hook;
      currentlyRenderingFiber.memoizedState = workInProgressHook;
    } else {
      // currentlyRenderingFiber == null 代表 Hook 执行的上下文不是一个函数组件
      throw new Error("Hooks 只能在函数组件中执行");
    }
  } else {
    // mount 时的其他 hook
    // 将当前工作的 Hook 的 next 指向新建的 hook，形成 Hooks 链表
    workInProgressHook.next = hook;
    // 更新当前工作的 Hook
    workInProgressHook = hook;
  }

  return workInProgressHook;
}

function mountState<State>(
  initialState: (() => State) | State,
): [State, Dispatch<State>] {
  // 当前正在工作的 useState
  const hook = mountWorkInProgressHook();

  // 当前 useState 对应的 Hook 数据
  let memoizedState;
  if (initialState instanceof Function) {
    memoizedState = initialState();
  } else {
    memoizedState = initialState;
  }

  hook.memoizedState = memoizedState;

  const queue = createUpdateQueue<State>();

  hook.queue = queue;

  // 实现 dispatch
  const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);

  queue.dispatch = dispatch;

  return [memoizedState, dispatch];
}

function dispatchSetState<State>(
  fiber: FiberNode,
  updateQueue: UpdateQueue<State>,
  action: Action<State>,
) {
  const update = createUpdate(action);

  enqueueUpdate(updateQueue, update);
  // 调度更新
  scheduleUpdateOnFiber(fiber);
}
