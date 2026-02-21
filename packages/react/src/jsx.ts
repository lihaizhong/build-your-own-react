// JSX 转换核心实现
// 将 JSX 语法编译为 ReactElement 对象

import {
	REACT_ELEMENT_TYPE,
	Type,
	Key,
	Ref,
	Props,
	ReactElementType
} from 'lihzsky-shared';

/**
 * 创建 ReactElement 对象
 * 这是 React 元素的内部数据结构
 */
function ReactElement(
	type: Type,
	key: Key,
	ref: Ref,
	props: Props
): ReactElementType {
	return {
		$$typeof: REACT_ELEMENT_TYPE,
		type,
		key,
		ref,
		props,
		__mark: 'lihzsky-react' // 自定义标记，用于区分官方 React
	};
}

/**
 * 将 JSX 编译后的参数转换为 ReactElement
 * 用于处理 JSX 的转换结果
 *
 * @param type - 元素类型，如 'div' 或函数组件
 * @param config - 元素属性配置
 * @param maybeKey - 可选的 key（由编译器传入）
 * @param _source - 源码位置信息（开发环境）
 * @param _self - this 引用（开发环境）
 * @param children - 子元素
 */
export function jsx(
	type: Type,
	config: any,
	maybeKey?: any,
	_source?: any,
	_self?: any,
	...children: any[]
): ReactElementType {
	let key: Key = null;
	let ref: Ref = null;
	const props: Props = {};

	// 处理 config 中的属性
	if (config != null) {
		// 提取 ref
		if (config.ref !== undefined) {
			ref = config.ref;
		}

		// 提取 key
		// 优先使用 maybeKey（编译器直接传入的 key）
		// 否则使用 config.key
		if (config.key !== undefined || maybeKey !== undefined) {
			key = '' + (config.key === undefined ? maybeKey : config.key);
		}

		// 将其他属性放入 props
		for (const propName in config) {
			if (
				Object.prototype.hasOwnProperty.call(config, propName) &&
				propName !== 'key' &&
				propName !== 'ref' &&
				propName !== '__self' &&
				propName !== '__source'
			) {
				props[propName] = config[propName];
			}
		}
	}

	// 处理 children
	if (children.length === 1) {
		// 单个子元素，直接赋值
		props.children = children[0];
	} else if (children.length > 1) {
		// 多个子元素，直接使用数组
		props.children = children;
	}

	return ReactElement(type, key, ref, props);
}

/**
 * jsx 的别名，用于多子元素的场景
 * React 17+ 编译器会根据子元素数量选择 jsx 或 jsxs
 */
export const jsxs = jsx;

/**
 * 创建一个新的 JSX 元素
 * 用于动态创建元素
 */
export function jsxDEV(
	type: Type,
	config: any,
	maybeKey?: any,
	_source?: any,
	_self?: any
): ReactElementType {
	return jsx(type, config, maybeKey, _source, _self);
}
