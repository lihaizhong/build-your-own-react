import { Props, Key, Ref } from "lihzsky-shared/ReactTypes";
import { WorkTag } from "./workTags";
import { NoFlags, Flags } from "./fiberFlags";

export const createWorkInProgress = (
  current: FiberNode,
  pendingProps: Props,
): FiberNode => {
  let workInProgress = current.alternate;

  if (workInProgress == null) {
    // 首屏渲染时（mount）
    workInProgress = new FiberNode(current.tag, pendingProps, current.key);
    workInProgress.stateNode = current.stateNode;

    // 双缓冲机制
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 非首屏渲染时（update）
    workInProgress.pendingProps = pendingProps;
    // 将 effect 链表重置为空，以便在更新过程中记录新的副作用
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
  }

  // 复制当前节点的大部分属性
  workInProgress.type = current.type;
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;

  return workInProgress;
};

export class FiberRootNode {
  container: Container;

  current: FiberNode;

  finishedWork: FiberNode | null;

  constructor(container: CSSContainerRule, hostRootFiber: FiberNode) {
    this.container = container;
    this.current = hostRootFiber;
    // 将根节点的 stateNode 属性指向 FiberRootNode，用于表示整个 React 应用的节点
    hostRootFiber.stateNode = this;
    // 指向更新完成之后的 hostRootFiber
    this.finishedWork = null;
  }
}

export class FiberNode {
  // 标识不同类型的工作单元
  tag: WorkTag;

  key: Key;

  // 节点对应的实际 DOM 节点或组件实例
  stateNode: any;

  // 节点类型，可以是原生 DOM 元素、函数组件或类组件等
  type: any;

  // 指向节点的父节点
  return: FiberNode | null;

  // 指向节点的下一个兄弟节点
  sibling: FiberNode | null;

  // 指向节点的第一个子节点
  child: FiberNode | null;

  // 索引
  index: number;

  ref: Ref;

  // 表示节点的新属性，用于在协调过程中进行更新
  pendingProps: Props;

  // 已更新完成的属性
  memoizedProps: Props;

  // 更新完成后的新 State
  memoizedState: any;

  // 指向节点的备份节点，用于在协调过程中进行比较
  alternate: FiberNode | null;

  // 表示节点的副作用类型，如更新、插入、删除等
  flags: Flags;

  // 表示子节点的副作用类型，如更新、插入、删除等
  subtreeFlags: Flags;

  // 更新计划队列
  updateQueue: unknown;

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    // 类型
    this.tag = tag;
    this.key = key;
    this.ref = null;
    this.stateNode = null; // 节点对应的实际 DOM 节点或组件实例
    this.type = null; // 节点的类型，可以是原生 DOM 元素、函数组件或类组件等

    // 构成树状结构
    this.return = null; // 指向节点的父节点
    this.sibling = null; // 指向节点的下一个兄弟节点
    this.child = null; // 指向节点的第一个子节点
    this.index = 0; // 索引

    // 作为工作单元
    this.pendingProps = pendingProps; // 表示节点的新属性，用于在协调过程中进行更新
    this.memoizedProps = null; // 已经更新完的属性
    this.memoizedState = null; // 更新完成后新的 State

    this.alternate = null; // 指向节点的备份节点，用于在协调过程中进行比较
    this.flags = NoFlags; // 表示节点的副作用类型，比如更新、插入、删除等
    this.subtreeFlags = NoFlags; // 表示子节点的副作用类型，比如更新、插入、删除等
    this.updateQueue = null; // 更新计划队列
  }
}
