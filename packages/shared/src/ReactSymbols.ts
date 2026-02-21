// React 内部使用的 Symbol 常量
// 用于标识不同类型的 React 元素和数据结构

const supportSymbol = typeof Symbol === 'function' && Symbol.for;

// React 元素标识符
export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for('react.element')
	: 0xeac7;

// React 传送门标识符
export const REACT_PORTAL_TYPE = supportSymbol
	? Symbol.for('react.portal')
	: 0xeaca;

// React Fragment 标识符
export const REACT_FRAGMENT_TYPE = supportSymbol
	? Symbol.for('react.fragment')
	: 0xeacb;

// React 严格模式标识符
export const REACT_STRICT_MODE_TYPE = supportSymbol
	? Symbol.for('react.strict_mode')
	: 0xeacc;

// React Profiler 标识符
export const REACT_PROFILER_TYPE = supportSymbol
	? Symbol.for('react.profiler')
	: 0xead2;

// React Context 标识符
export const REACT_PROVIDER_TYPE = supportSymbol
	? Symbol.for('react.provider')
	: 0xeacd;

export const REACT_CONTEXT_TYPE = supportSymbol
	? Symbol.for('react.context')
	: 0xeace;

// React ForwardRef 标识符
export const REACT_FORWARD_REF_TYPE = supportSymbol
	? Symbol.for('react.forward_ref')
	: 0xead0;

// React Suspense 标识符
export const REACT_SUSPENSE_TYPE = supportSymbol
	? Symbol.for('react.suspense')
	: 0xead1;

export const REACT_SUSPENSE_LIST_TYPE = supportSymbol
	? Symbol.for('react.suspense_list')
	: 0xead8;

// React Memo 标识符
export const REACT_MEMO_TYPE = supportSymbol
	? Symbol.for('react.memo')
	: 0xead3;

// React Lazy 标识符
export const REACT_LAZY_TYPE = supportSymbol
	? Symbol.for('react.lazy')
	: 0xead4;
