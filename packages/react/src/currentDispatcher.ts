import { Action } from "lihzsky-shared/ReactTypes";

export interface Dispatcher {
  useState: <S>(initialState: S | (() => S)) => [S, Dispatch<Action<S>>];
}

export type Dispatch<State> = (action: Action<State>) => void;

const currentDispatcher: { current: Dispatcher | null } = { current: null };

export const resolveDispatcher = (): Dispatcher => {
  const dispatcher = currentDispatcher.current;

  if (dispatcher === null) {
    throw new Error("Hooks 只能在函数组件中执行");
  }

  return dispatcher;
};

export default currentDispatcher;
