// React 包入口文件

// 导出 JSX 相关函数（旧版 API，兼容 React.createElement）
export { jsx, jsxs } from './src/jsx';

// 导出 Dispatcher 相关函数（内部使用）
export {
	resolveDispatcher,
	setDispatcher,
	getCurrentDispatcher
} from './src/currentDispatcher';
