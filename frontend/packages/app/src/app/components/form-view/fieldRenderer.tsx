/**
 * External dependencies.
 */
import { useForm } from "react-hook-form";
/**
 * Internal dependencies.
 */
import RenderField from "./renderField";
import { Field, Section } from "./types";

type FieldRendererProps = {
  fields: Field[];
  onChange?: (values: Record<string, string | number | null>) => void;
  onSubmit?: (values: Record<string, string | number | null>) => void;
  readOnly?: boolean;
  currencySymbol?: string;
};

/**
 * FieldRenderer Component
 * @description This component renders fields of the form-view section-wise
 * @param fields Array of fields containing sections and columns
 * @param onChange Called when any field's value is changed
 * @param onSubmit Called when any form is submitted
 * @param readOnly Makes all fields read-only
 * @param currencySymbol Currency symbol for Currency field-type
 * @returns A JSX Component
 */
const FieldRenderer = ({ fields, onChange, onSubmit, readOnly, currencySymbol }: FieldRendererProps) => {
  const { control, handleSubmit } = useForm();

  const sections: Section[] = [];
  let currentSection: Section = { title: "", left: [], right: [], isRight: false };

  fields?.forEach((field) => {
    if (field.fieldtype === "Section Break") {
      if (currentSection.left.length || currentSection.right.length) {
        sections.push(currentSection);
      }
      currentSection = { title: field.label || "", left: [], right: [], isRight: false };
    } else if (field.fieldtype === "Column Break") {
      currentSection.isRight = true;
    } else if (
      field.value !== null &&
      field.value !== undefined &&
      field.value !== "" &&
      (field.value !== 0 || field.fieldtype === "Check")
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

  if (filteredSections.length === 0) return null;

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
          {section.title && <h2 className="text-lg font-semibold my-3">{section.title}</h2>}
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
};

export default FieldRenderer;
