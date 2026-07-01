import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/*
 * `ComponentType<any>` is intentional. It makes the interface allign with lazy from react.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type ImportStatement<T extends ComponentType<any>> = () => Promise<{
  default: T;
}>;

export type PreloadableComponent<T extends ComponentType<any>> =
  LazyExoticComponent<T> & {
    preload: ImportStatement<T>;
  };

const ReactLazyPreload = <T extends ComponentType<any>>(
  importStatement: ImportStatement<T>,
): PreloadableComponent<T> => {
  const Component = lazy(importStatement) as PreloadableComponent<T>;
  Component.preload = importStatement;
  return Component;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export default ReactLazyPreload;
