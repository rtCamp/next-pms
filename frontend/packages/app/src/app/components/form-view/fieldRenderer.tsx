/**
 * External dependencies.
 */
import { useForm, Controller } from "react-hook-form";
/**
 * Internal dependencies.
 */
import { Field, Section } from "./types";

type FieldRendererProps = {
  fields: Field[];
  onChange?: (values: Record<string, string | number | null>) => void;
  onSubmit?: (values: Record<string, string | number | null>) => void;
  readOnly?: boolean;
};

/**
 * FieldRenderer Component
 * @description This component renders fields of the form-view section-wise
 * @param fields Array of fields containing sections and columns
 * @param onChange Called when any field's value is changed
 * @param onSubmit Called when any form is submitted
 * @param readOnly Makes all fields read-only
 * @returns A JSX Component
 */
const FieldRenderer = ({ fields, onChange, onSubmit, readOnly }: FieldRendererProps) => {
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
    } else {
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

  if (sections.length === 0) return null;

  return (
    <form
      onSubmit={handleSubmit((data) => {
        if (!readOnly) {
          onSubmit?.(data);
        }
      })}
      className="space-y-6 divide-y"
    >
      {sections.map((section, index) => (
        <div key={index} className="px-4 pb-4">
          {section.title && <h2 className="text-lg font-semibold my-3">{section.title}</h2>}
          <div className="grid lg:grid-cols-2 gap-4">
            {section.left.length > 0 && (
              <div className="space-y-4">
                {section.left.map((field) => renderField(field, control, onChange, readOnly))}
              </div>
            )}
            {section.right.length > 0 && (
              <div className="space-y-4">
                {section.right.map((field) => renderField(field, control, onChange, readOnly))}
              </div>
            )}
          </div>
        </div>
      ))}
    </form>
  );
};

/**
 * RenderField Component
 * @description Renders a specific field type
 * @param field Field configuration
 * @param control React Hook Form control
 * @param onChange Callback function for field value change
 * @param readOnly Boolean indicating if field is read-only
 * @returns A JSX Component
 */
const renderField = (
  field: Field,
  control: any,
  onChange?: (values: Record<string, any>) => void,
  readOnly?: boolean
) => {
  if (!field.label) return null;
  const isRequired = field.reqd === 1 || field.reqd === "1";
  const isReadOnly = readOnly || field.read_only === 1 || field.read_only === "1";

  return (
    <div key={field.label}>
      {field.fieldtype !== "Check" ? (
        <>
          <label className="block font-medium">
            {field.label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <Controller
            name={field.label}
            control={control}
            defaultValue={field.value || ""}
            render={({ field: { onChange: handleChange, value } }) =>
              getFieldComponent(field, handleChange, value, isReadOnly as boolean)
            }
          />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Controller
              name={field.label}
              control={control}
              defaultValue={field.value || ""}
              render={({ field: { onChange: handleChange, value } }) =>
                getFieldComponent(field, handleChange, value, isReadOnly as boolean)
              }
            />
            <label className="font-medium">
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </label>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * GetFieldComponent Function
 * @description Returns JSX for different field types
 * @param field Field configuration
 * @param handleChange Function to handle field change
 * @param value Current field value
 * @param isReadOnly Boolean indicating if field is read-only
 * @returns JSX Element for input field
 */
const getFieldComponent = (field: Field, handleChange: (value: any) => void, value: any, isReadOnly: boolean) => {
  switch (field.fieldtype) {
    case "Select":
      return (
        <select
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
          className="w-full p-2 border rounded"
        >
          {field.options?.split("\n").map((option, idx) => (
            <option key={idx} value={option.trim()}>
              {option.trim()}
            </option>
          ))}
        </select>
      );
    case "Check":
      return (
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => handleChange(e.target.checked ? 1 : 0)}
          disabled={isReadOnly}
          className="w-4 h-4"
        />
      );
    case "Date":
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
          className="w-full p-2 border rounded"
        />
      );
    case "Data":
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
          className="w-full p-2 border rounded"
        />
      );
    case "Float":
    case "Percentage":
    case "Currency":
      return (
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
          disabled={isReadOnly}
          className="w-full p-2 border rounded"
        />
      );
    case "Small Text":
      return (
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
          className="w-full p-2 border rounded"
          rows={2}
        />
      );
    default:
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
          className="w-full p-2 border rounded"
        />
      );
  }
};

export default FieldRenderer;
