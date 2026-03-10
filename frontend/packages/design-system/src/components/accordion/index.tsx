/**
 * External dependencies.
 */
import * as React from "react";
import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
/**
 * Internal dependencies.
 */
import { mergeClassNames } from "../../utils";

const Accordion = React.forwardRef<
  React.ElementRef<typeof BaseAccordion.Root>,
  React.ComponentPropsWithoutRef<typeof BaseAccordion.Root>
>((props, ref) => <BaseAccordion.Root ref={ref} {...props} />);
Accordion.displayName = "Accordion";

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof BaseAccordion.Item>,
  React.ComponentPropsWithoutRef<typeof BaseAccordion.Item> & { className?: string }
>(({ className, ...props }, ref) => (
  <BaseAccordion.Item ref={ref} className={mergeClassNames("border-b", className)} {...props} />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof BaseAccordion.Trigger>,
  React.ComponentPropsWithoutRef<typeof BaseAccordion.Trigger> & { hideChevronDown?: boolean; className?: string }
>(({ className, children, hideChevronDown, ...props }, ref) => (
  <BaseAccordion.Header className="flex">
    <BaseAccordion.Trigger
      ref={ref}
      className={mergeClassNames(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
        className
      )}
      {...props}
    >
      {children}
      {!hideChevronDown && (
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 [[data-open]_&]:rotate-180" />
      )}
    </BaseAccordion.Trigger>
  </BaseAccordion.Header>
));
AccordionTrigger.displayName = "AccordionTrigger";

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof BaseAccordion.Panel>,
  React.ComponentPropsWithoutRef<typeof BaseAccordion.Panel> & { className?: string }
>(({ className, children, ...props }, ref) => (
  <BaseAccordion.Panel ref={ref} className="overflow-hidden" {...props}>
    <div className={mergeClassNames("pb-0 pt-0", className)}>{children}</div>
  </BaseAccordion.Panel>
));
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
