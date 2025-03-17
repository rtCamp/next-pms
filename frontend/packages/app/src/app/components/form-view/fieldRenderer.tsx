/**
 * External dependencies.
 */
import { useForm, Controller } from "react-hook-form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
  TextArea,
  Input,
  Typography,
} from "@next-pms/design-system/components";

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
    <div className="space-y-2" key={field.label}>
      {field.fieldtype !== "Check" ? (
        <>
          <label className="text-sm">
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
          <Typography variant="p" className="text-xs text-gray-500">
            {field.description}
          </Typography>
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
            <label className="text-sm">
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
        <Select
          onValueChange={handleChange}
          defaultValue={
            (field?.options || "")
              .split("\n")
              .map((option) => option.trim())
              .filter((option) => option !== "")
              .includes(value)
              ? value
              : undefined
          }
          disabled={isReadOnly}
        >
          <SelectTrigger className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-900 focus:ring-gray-300 transition-all  ">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {(field?.options || "")
              .split("\n")
              .map((option) => option.trim())
              .filter((option) => option !== "").length > 0 ? (
              (field?.options || "").split("\n").map((option, idx) => {
                const trimmedOption = option.trim();
                return trimmedOption !== "" ? (
                  <SelectItem className="cursor-pointer" key={idx} value={trimmedOption}>
                    {trimmedOption}
                  </SelectItem>
                ) : null;
              })
            ) : (
              <SelectItem disabled value="">
                No options available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      );
    case "Check":
      return (
        <Checkbox
          checked={!!value}
          onCheckedChange={(checked) => handleChange(checked ? 1 : 0)}
          disabled={isReadOnly}
          className="w-4 h-4"
        />
      );
    case "Date":
      return (
        <Input
          type="date"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 disabled:text-gray-900 disabled:bg-gray-100 focus:ring-gray-300 transition-all   text-sm"
        />
      );
    case "Data":
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 disabled:text-gray-900 disabled:bg-gray-100 focus:ring-gray-300 transition-all   text-sm"
        />
      );
    case "Float":
    case "Percentage":
    case "Currency":
      return (
        <Input
          type="number"
          step="any"
          value={value}
          onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
          disabled={isReadOnly}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 disabled:text-gray-900 disabled:bg-gray-100 focus:ring-gray-300 transition-all   text-sm"
        />
      );
    case "Text":
    case "Small Text":
      return (
        <TextArea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
          rows={7}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none disabled:bg-gray-100 disabled:text-gray-900 focus:ring-2 focus:ring-gray-300 transition-all   text-sm"
        />
      );
    default:
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:text-gray-900 focus:ring-gray-300 transition-all   text-sm"
        />
      );
  }
};

export default FieldRenderer;
