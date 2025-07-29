import { REACT_ELEMENT_TYPE } from "lihzsky-shared/ReactSymbols";
import {
  Type,
  Key,
  Props,
  Ref,
  ElementType,
  ReactElementType,
} from "lihzsky-shared/ReactTypes";

function ReactElement(
  type: Type,
  key: Key,
  ref: Ref,
  props: Props,
): ReactElementType {
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    key,
    ref,
    props,
    type,
    __mark: "my-react-element",
  };
}

export function jsx(
  type: ElementType,
  config: any,
  ...children: any
): ReactElementType {
  let key: Key = null;
  let ref: Ref = null;
  const props: Props = {};

  // 排除两个关键属性 key 和 ref
  // 其他的属性都作为 props 的属性
  for (const prop in config) {
    const val = config[prop];

    if (prop === "key") {
      if (val !== undefined) {
        key = "" + val;
      }

      continue;
    }

    if (prop === "ref") {
      if (val !== undefined) {
        ref = val;
      }

      continue;
    }

    if (Object.hasOwn(config, prop)) {
      props[prop] = val;
    }
  }

  const childrenLength = children.length;

  if (childrenLength) {
    props.children = childrenLength === 1 ? children[0] : children;
  }

  return ReactElement(type, key, ref, props);
}

/**
 * 开发环境不做 children 的处理，方便后续做额外的检查
 */
export function jsxDev(
  type: ElementType,
  config: any,
  ...children: any
): ReactElementType {
  let key: Key = null;
  let ref: Ref = null;
  const props: Props = {};

  for (const prop in config) {
    const val = config[prop];

    if (prop === "key") {
      if (val !== undefined) {
        key = "" + val;
      }

      continue;
    }

    if (prop === "ref") {
      if (val !== undefined) {
        ref = val;
      }

      continue;
    }

    if (Object.hasOwn(config, prop)) {
      props[prop] = val;
    }
  }

  return ReactElement(type, key, ref, props);
}
