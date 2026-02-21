// Dispatcher 上下文管理
// 用于管理 Hooks 的调用上下文

import { Dispatcher } from 'lihzsky-shared';

// 当前正在执行的 Dispatcher
let currentDispatcher: Dispatcher | null = null;

/**
 * 获取当前的 Dispatcher
 * Hooks 通过此方法获取调度器来执行状态更新
 */
export function resolveDispatcher(): Dispatcher {
	if (currentDispatcher === null) {
		throw new Error(
			'Invalid hook call. Hooks can only be called inside of the body of a function component.'
		);
	}
	return currentDispatcher;
}

/**
 * 设置当前的 Dispatcher
 * 在渲染组件前设置，渲染完成后恢复
 */
export function setDispatcher(dispatcher: Dispatcher | null): void {
	currentDispatcher = dispatcher;
}

/**
 * 获取当前 Dispatcher（用于外部访问）
 */
export function getCurrentDispatcher(): Dispatcher | null {
	return currentDispatcher;
}
