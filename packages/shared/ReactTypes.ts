export type Type = any;
export type Key = any;
export type Props = any;
export type Ref = any;
export type ElementType = any;

export interface ReactElementType {
  // 一个内部使用的字段
  // 通过这个字段来表明当前这个数据结构是一个 ReactElement
  $$typeof: symbol | number;
  key: Key;
  props: Props;
  ref: Ref;
  type: ElementType;
  // 为了与官方 react 包区分开的自定义字段
  __mark: string;
}
