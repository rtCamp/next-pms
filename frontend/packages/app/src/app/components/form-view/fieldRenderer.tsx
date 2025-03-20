/**
 * External dependencies.
 */
import { forwardRef, useEffect, useImperativeHandle } from "react";
import { useForm, useWatch } from "react-hook-form";

/**
 * Internal dependencies.
 */
import { evaluateDependsOn, mapFieldsToObject } from "@/lib/utils";
import RenderField from "./renderField";
import { Field, Section } from "./types";

type FieldRendererProps = {
  fields: Field[];
  onChange?: (values: Record<string, string | number | null>) => void;
  onSubmit?: (values: Record<string, string | number | null>) => void;
  readOnly?: boolean;
  currencySymbol?: string;
  hideFields?: Array<string>;
};

/**
 * FieldRenderer Component
 * @description This component renders fields of the form-view section-wise, while respecting depends_on conditions.
 */
const FieldRenderer = forwardRef(
  ({ fields, onChange, onSubmit, readOnly, currencySymbol, hideFields }: FieldRendererProps, ref) => {
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
    let currentSection: Section = { title: "", left: [], right: [], isRight: false };

    fields?.forEach((field) => {
      if (hideFields?.includes(field.fieldname)) {
        return;
      }

      if (
        field.depends_on &&
        !evaluateDependsOn(field.depends_on, Object.keys(formData).length > 0 ? formData : mapFieldsToObject(fields))
      ) {
        return; // Skip rendering if dependency is not met
      }

      if (field.fieldtype === "Section Break") {
        if (currentSection.left.length || currentSection.right.length) {
          sections.push(currentSection);
        }
        currentSection = { title: field.label || "", left: [], right: [], isRight: false };
      } else if (field.fieldtype === "Column Break") {
        currentSection.isRight = true;
      } else if (
        field.depends_on ||
        (field.value !== null &&
          field.value !== undefined &&
          field.value !== "" &&
          (field.value !== 0 || field.fieldtype === "Check"))
      ) {
        if (currentSection.isRight) {
          currentSection.right.push(field);
        } else {
          currentSection.left.push(field);
        }
      }
    });

    if (currentSection.left.length || currentSection.right.length) {
      sections.push(currentSection);
    }

    const filteredSections = sections.filter((section) => section.left.length > 0 || section.right.length > 0);

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
        className="space-y-6 divide-y"
      >
        {filteredSections.map((section, index) => (
          <div key={index} className="px-4 pb-4">
            <h2 className="text-lg font-semibold my-3">{section.title}</h2>
            <div className="grid lg:grid-cols-2 gap-4">
              {section.left.length > 0 && (
                <div className="space-y-4">
                  {section.left.map((field) => RenderField(field, control, onChange, readOnly, currencySymbol))}
                </div>
              )}
              {section.right.length > 0 && (
                <div className="space-y-4">
                  {section.right.map((field) => RenderField(field, control, onChange, readOnly, currencySymbol))}
                </div>
              )}
            </div>
          </div>
        ))}
      </form>
    );
  }
);

export default FieldRenderer;
