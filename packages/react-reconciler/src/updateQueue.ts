import { Action } from "shared/ReactTypes";
import { Update } from "./fiberFlags";

// 定义 Update 数据结构
export interface Update {
  action: Action<State>;
}

// 定义 UpdateQueue 数据结构
export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null;
  };
}

// 创建 Update 实例的方法
export const createUpdate = <State>(action: Action): Update<State> => ({
  action,
});

// 创建 UpdateQueue 实例的方法
export const createUpdateQueue = <State>(): UpdateQueue<State> => ({
  shared: { pending: null },
});

// 将 Update 添加到 UpdateQueue 中的方法
export const processUpdateQueue = <State>(
  baseState: State,
  pendingState: Update<State> | null,
): { memoizedState: State } => {
  const result: ResultType<typeof processUpdateQueue<State>> = {
    memoizedState: baseState,
  };

  if (pendingState !== null) {
    const action = pendingState.action;

    if (action instanceof Function) {
      // 若 action 是回调函数：(baseState = 1, update: (i) => 5 * i) => memoizedState = 5
      result.memoizedState = action(baseState);
    } else {
      // 若 action 是状态值：(baseState = 1, update = 2) => memoizedState = 2
      result.memoizedState = action;
    }
  }

  return result;
};
