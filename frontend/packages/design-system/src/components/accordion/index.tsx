/**
 * External dependencies.
 */
import * as React from "react";
import { Accordion as BaseAccordion } from "@base-ui/react/accordion";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "../../utils";
import "./accordion.css";

const Accordion = React.forwardRef<
  React.ComponentRef<typeof BaseAccordion.Root>,
  React.ComponentPropsWithoutRef<typeof BaseAccordion.Root>
>((props, ref) => <BaseAccordion.Root ref={ref} {...props} />);
Accordion.displayName = "Accordion";

const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof BaseAccordion.Item>,
  React.ComponentPropsWithoutRef<typeof BaseAccordion.Item> & {
    className?: string;
  }
>(({ className, ...props }, ref) => (
  <BaseAccordion.Item
    ref={ref}
    className={mergeClassNames(className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof BaseAccordion.Trigger>,
  React.ComponentPropsWithoutRef<typeof BaseAccordion.Trigger> & {
    hideChevronDown?: boolean;
    className?: string;
  }
>(({ className, children, ...props }, ref) => (
  <BaseAccordion.Header className="flex">
    <BaseAccordion.Trigger
      ref={ref}
      className={mergeClassNames(
        "flex flex-1 items-center justify-between",
        className,
      )}
      {...props}
    >
      {children}
    </BaseAccordion.Trigger>
  </BaseAccordion.Header>
));
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof BaseAccordion.Panel>,
  React.ComponentPropsWithoutRef<typeof BaseAccordion.Panel> & {
    className?: string;
  }
>(({ className, children, ...props }, ref) => (
  <BaseAccordion.Panel ref={ref} className="accordion-panel" {...props}>
    <div className={mergeClassNames("pb-0 pt-0", className)}>{children}</div>
  </BaseAccordion.Panel>
));
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
