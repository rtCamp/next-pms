/**
 * External dependencies.
 */
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { evaluateDependsOn, mapFieldsToObject, mergeClassNames } from "@/lib/utils";
import RenderField from "./renderField";
import { Field, FieldConfigType, Section } from "../types";

type FieldRendererProps = {
  fields: Field[];
  tabs: Record<string, Field[]>;
  onChange?: (values: Record<string, string | number | null>) => void;
  onSubmit?: (values: Record<string, string | number | null>) => void;
  readOnly?: boolean;
  currencySymbol?: string;
  fieldConfig?: FieldConfigType;
  className?: string;
};

/**
 * FieldRenderer Component
 * @description This component renders fields of the form-view section-wise, while respecting depends_on conditions.
 */
const FieldRenderer = forwardRef(
  ({ fields, onChange, onSubmit, readOnly, currencySymbol, fieldConfig, className, tabs }: FieldRendererProps, ref) => {
    const { control, handleSubmit, reset } = useForm();

    useEffect(() => {
      const defaultValues = fields.reduce((acc, field) => {
        acc[field.fieldname] = field.value || "";
        return acc;
      }, {} as Record<string, string | number | null>);
      reset(defaultValues);
    }, [fields]);

    useImperativeHandle(ref, () => ({
      submitForm: () => {
        handleSubmit((data) => {
          if (!readOnly) {
            onSubmit?.(data);
          }
        })();
      },
    }));

    // Watch all field values to dynamically check dependencies
    const formData = useWatch({ control });

    const sections: Section[] = [];
    let currentSection: Section = { title: "", columns: [[]] };
    let currentColumnIndex = 0;

    fields?.forEach((field) => {
      if (fieldConfig?.[field.fieldname]?.hidden || field.hidden === 1) {
        return;
      }
      if (
        field.depends_on &&
        !evaluateDependsOn(
          field.depends_on,
          Object.keys(formData).length > 0 ? formData : mapFieldsToObject(Object.values(tabs).flat())
        )
      ) {
        return; // Skip rendering if dependency is not met
      }

      if (field.fieldtype === "Section Break") {
        if (currentSection.columns.some((col) => col.length > 0)) {
          sections.push(currentSection);
        }
        currentSection = { title: field.label || "", columns: [[]] };
        currentColumnIndex = 0;
      } else if (field.fieldtype === "Column Break") {
        currentColumnIndex++;
        if (!currentSection.columns[currentColumnIndex]) {
          currentSection.columns[currentColumnIndex] = [];
        }
      } else {
        if (!currentSection.columns[currentColumnIndex]) {
          currentSection.columns[currentColumnIndex] = [];
        }
        currentSection.columns[currentColumnIndex].push(field);
      }
    });

    if (currentSection.columns.some((col) => col.length > 0)) {
      sections.push(currentSection);
    }

    const filteredSections = sections.filter((section) => section.columns.some((col) => col.length > 0));

    if (filteredSections.length === 0)
      return (
        <div className="absolute w-full h-52 flex justify-center items-center text-sm">
          <span>Nothing to show</span>
        </div>
      );

    return (
      <form
        onSubmit={handleSubmit((data) => {
          if (!readOnly) {
            onSubmit?.(data);
          }
        })}
        className="divide-y"
      >
        {filteredSections.map((section, index) => (
          <div key={index} className={mergeClassNames("px-4", !section.title && "pb-4")}>
            {section.title ? (
              <Accordion type="single" collapsible key={index} className={className} defaultValue={String(index)}>
                <AccordionItem value={String(index)} className="border-0">
                  <AccordionTrigger className="hover:no-underline justify-normal-overide !gap-2 focus-visible:ring-0 focus-visible:outline-none">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="!w-full">
                    <div
                      className="flex flex-col lg:grid gap-4"
                      style={{ gridTemplateColumns: `repeat(${section.columns.length}, minmax(0, 1fr))` }}
                    >
                      {section.columns.map((column, colIndex) => (
                        <div key={colIndex} className="space-y-4 overflow-hidden">
                          {column.map((field) =>
                            RenderField(field, control, onChange, readOnly, currencySymbol, fieldConfig)
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <>
                <div className={className}>
                  <h2 className="text-lg font-semibold my-3"></h2>
                  <div
                    className="flex flex-col lg:grid gap-4"
                    style={{ gridTemplateColumns: `repeat(${section.columns.length}, minmax(0, 1fr))` }}
                  >
                    {section.columns.map((column, colIndex) => (
                      <div key={colIndex} className="space-y-4 overflow-hidden">
                        {column.map((field) =>
                          RenderField(field, control, onChange, readOnly, currencySymbol, fieldConfig)
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </form>
    );
  }
);

export default FieldRenderer;
