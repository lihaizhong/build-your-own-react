export type Container = Element;
export type Instance = Element;

export const createInstance = (type: string, props: any) => {
  // TODO: Props的处理

  const element = document.createElement(type);

  return element;
};

export const appendInitialChild = (
  parent: Container | Instance,
  child: Instance,
) => {
  parent.appendChild(child);
};

export const createTextNode = (content: string) =>
  document.createTextNode(content);

export const appendChildToContainer = (
  child: Instance,
  parent: Container | Instance,
) => {
  parent.appendChild(child);
};
