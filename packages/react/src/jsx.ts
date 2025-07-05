import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import {
  Type,
  Key,
  Props,
  Ref,
  ElementType,
  ReactElementType,
} from "shared/ReactTypes";

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
    if (childrenLength === 1) {
      props.children = children[0];
    } else {
      props.children = children;
    }
  }

  return ReactElement(type, key, ref, props);
}

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
