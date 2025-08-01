import { FiberNode } from "./fiber";
import { renderWithHooks } from "./fiberHooks";
import { UpdateQueue } from "./updateQueue";
import { HostRoot } from "./workTags";

export const beginWork = (workInProgress: FiberNode) => {
  switch (workInProgress.tag) {
    case HostRoot:
      return udpateHostRoot(workInProgress);
    case HostComponent:
      return updateHostComponent(workInProgress);
    case HostText:
      return updateHostText();
    default:
      if (__DEV__) {
        console.warn("beginWork 未实现的类型", workInProgress.tag);
      }
      break;
  }
};

function udpateHostRoot(workInProgress: FiberNode): FiberNode | null {
  const baseState = workInProgress.memoizedState;
  const updateQueue = workInProgress.updateQueue as UpdateQueue<Element>;
  const pending = updateQueue.shared.pending;

  updateQueue.shared.pending = null;

  const { memoizedState } = processUpdateQueue(baseState, pending);

  workInProgress.memoizedState = memoizedState;

  const nextChildren = workInProgress.memoizedState;

  reconcileChildren(workInProgress, nextChildren);

  return workInProgress.child;
}

function updateFunctionComponent(workInProgress: FiberNode): FiberNode | null {
  const nextChildren = renderWithHooks(workInProgress);

  reconcileChildren(workInProgress, nextChildren);

  return workInProgress.child;
}
