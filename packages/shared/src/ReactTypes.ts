// React 类型定义文件

// 元素类型：原生标签（如 'div'）或函数组件
export type Type = any;

// key 类型
export type Key = string | null;

// ref 类型
export type Ref = any;

// props 类型
export type Props = Record<string, any> & { children?: any };

// ReactElement 接口
export interface ReactElementType {
	$$typeof: symbol | number;
	key: Key;
	ref: Ref;
	type: Type;
	props: Props;
	__mark: string; // 自定义标记，用于区分官方 React
}

// ReactNode 类型：可以是 ReactElement、字符串、数字、数组、null、undefined、boolean
export type ReactNode =
	| ReactElementType
	| string
	| number
	| Iterable<ReactNode>
	| ReactPortal
	| boolean
	| null
	| undefined;

// ReactPortal 接口
export interface ReactPortal {
	$$typeof: symbol | number;
	key: Key | null;
	children: ReactNode[];
	containerInfo: any;
	implementation: any;
}

// Context 相关类型
export interface ReactContext<T> {
	$$typeof: symbol | number;
	Provider: ReactProviderType<T>;
	Consumer: ReactContext<T>;
	_displayName: string;
	_currentValue: T;
	_currentValue2: T;
	_threadCount: number;
}

export interface ReactProviderType<T> {
	$$typeof: symbol | number;
	_context: ReactContext<T>;
}

// ForwardRef 组件类型
export interface ForwardRefComponent {
	$$typeof: symbol | number;
	render: (props: any, ref: Ref) => ReactNode;
	displayName?: string;
}

// Lazy 组件类型
export interface LazyComponent<T> {
	$$typeof: symbol | number;
	_payload: T;
	_init: (payload: T) => any;
}

// Dispatcher 接口（用于 Hooks 上下文）
export interface Dispatcher {
	useState: <T>(
		initialState: T | (() => T)
	) => [T, (newState: T | ((prev: T) => T)) => void];
	useReducer: any;
	useEffect: any;
	useLayoutEffect: any;
	useCallback: any;
	useMemo: any;
	useRef: any;
	useContext: any;
	useImperativeHandle: any;
	useDebugValue: any;
	useDeferredValue: any;
	useTransition: any;
	useId: any;
	useSyncExternalStore: any;
}
