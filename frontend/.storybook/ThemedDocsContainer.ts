import { createElement, type PropsWithChildren } from "react";
import {
  DocsContainer,
  type DocsContainerProps,
} from "@storybook/addon-docs/blocks";
import { themes } from "storybook/theming";

// Docs pages are React, so the theme toolbar reaches them through Storybook's
// own theme rather than the `data-theme` attribute.
export function ThemedDocsContainer(
  props: PropsWithChildren<DocsContainerProps>,
) {
  const { context } = props;
  const dark =
    context.getStoryContext(context.storyById()).globals.theme === "dark";
  return createElement(DocsContainer, {
    ...props,
    theme: dark ? themes.dark : themes.light,
  });
}
