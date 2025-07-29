import {
  createContainer,
  updateContainer,
} from "lihzsky-react-reconciler/src/fiberReconciler";
import { ReactElementType } from "lihzsky-shared/ReactTypes";
import { Container } from "./hostConfig";

export function createRoot(container: Container) {
  const root = createContainer(container);

  return {
    render(element: ReactElementType) {
      updateContainer(element, root);
    },
  };
}
