const supportedSymbol = typeof Symbol === "function" && Symbol.for;

// 表示 ReactElement 类型（JSX创建的React组件或DOM元素）
export const REACT_ELEMENT_TYPE = supportedSymbol
  ? Symbol.for("react.element")
  : 0xeac7;
