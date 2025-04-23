/**
 * External dependencies.
 */
import { useContext } from "react";
import { Controller } from "react-hook-form";
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
import { mergeClassNames } from "@/lib/utils";
import { ThemeProviderContext } from "@/providers/theme/context";
import LinkField from "./linkField";
import { Field, FieldConfigType } from "../types";
import ChildTable from "./childTable";
import Editor from "./editor";

/**
 * RenderField Component
 * @description Renders a specific field type
 * @param field Field configuration
 * @param control React Hook Form control
 * @param onChange Callback function for field value change
 * @param readOnly Boolean indicating if field is read-only
 * @param currencySymbol Currency symbol for Currency field-type
 * @returns A JSX Component
 */
const RenderField = (
  field: Field,
  control: any,
  onChange?: (values: Record<string, any>) => void,
  readOnly?: boolean,
  currencySymbol?: string,
  fieldConfig?: FieldConfigType
) => {
  const { theme } = useContext(ThemeProviderContext);
  if (!field.label) return null;
  const isRequired = field.reqd === 1 || field.reqd === "1";
  const isReadOnly =
    readOnly || fieldConfig?.[field.fieldname]?.readOnly || field.read_only === 1 || field.read_only === "1";
  return (
    <div className="space-y-2 p-1" key={field.label}>
      {field.fieldtype !== "Check" ? (
        <>
          <label className="text-sm">
            {field.label} {isRequired && <span className="text-red-500">*</span>}
          </label>
          <Controller
            name={field.fieldname}
            control={control}
            defaultValue={field.value || ""}
            rules={{ required: isRequired ? "This field is required" : false }}
            render={({ field: { onChange: handleChange, value }, fieldState: { error } }) => {
              const handleFieldChange = (newValue: any) => {
                handleChange(newValue);
                const updatedFormData = { ...control._formValues, [field.fieldname as string]: newValue };
                onChange?.(updatedFormData);
              };

              return (
                <>
                  {getFieldComponent(
                    field,
                    handleFieldChange,
                    value,
                    isReadOnly as boolean,
                    currencySymbol as string,
                    theme
                  )}
                  {error && (
                    <Typography variant="p" className="text-xs text-red-500">
                      {error.message}
                    </Typography>
                  )}
                </>
              );
            }}
          />

          <Typography variant="p" className="text-xs text-gray-500">
            {field.description}
          </Typography>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Controller
              name={field.fieldname}
              control={control}
              defaultValue={field.value || ""}
              rules={{ required: isRequired ? "This field is required" : false }}
              render={({ field: { onChange: handleChange, value }, fieldState: { error } }) => {
                const handleFieldChange = (newValue: any) => {
                  handleChange(newValue);
                  const updatedFormData = { ...control._formValues, [field.fieldname as string]: newValue };
                  onChange?.(updatedFormData);
                };

                return (
                  <>
                    {getFieldComponent(
                      field,
                      handleFieldChange,
                      value,
                      isReadOnly as boolean,
                      currencySymbol as string,
                      theme
                    )}
                    {error && (
                      <Typography variant="p" className="text-xs text-red-500">
                        {error.message}
                      </Typography>
                    )}
                  </>
                );
              }}
            />
            <label htmlFor={field.fieldname} className="text-sm">
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
const getFieldComponent = (
  field: Field,
  handleChange: (value: any) => void,
  value: any,
  isReadOnly: boolean,
  currencySymbol: string,
  theme: string
) => {
  switch (field.fieldtype) {
    case "Select":
      return (
        <Select onValueChange={handleChange} defaultValue={value} value={value} disabled={isReadOnly}>
          <SelectTrigger className="disabled:bg-transparent">
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
          id={field.fieldname}
          onCheckedChange={(checked) => handleChange(checked ? 1 : 0)}
          disabled={isReadOnly}
          className="w-4 h-4"
        />
      );
    case "Date":
      return (
        <input
          type="date"
          style={
            theme === "dark"
              ? {
                  colorScheme: "dark",
                }
              : {}
          }
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
          className="w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-sm"
        />
      );
    case "Time":
      return (
        <input
          type="text"
          value={
            value ||
            new Date().toLocaleTimeString("en-GB", { hour12: false }) +
              `.${new Date().getMilliseconds().toString().padEnd(6, "0")}`
          }
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
          className="w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-sm"
        />
      );
    case "Data":
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
          className="text-sm"
        />
      );
    case "Float":
    case "Percent":
      return (
        <Input
          type="text"
          step="any"
          value={Number(value)}
          onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
          disabled={isReadOnly}
          className="text-sm focus-visible:!ring-0"
        />
      );
    case "Currency":
      return (
        <div
          className={mergeClassNames(
            "flex items-center gap-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-sm",
            isReadOnly && "border-gray-100 dark:border-input"
          )}
        >
          <Typography className={mergeClassNames("shrink-0 ", isReadOnly && "text-gray-400")}>
            {currencySymbol}
          </Typography>
          <Input
            type="text"
            step="any"
            value={Number(value)}
            onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
            disabled={isReadOnly}
            className="!border-none rounded-none focus-visible:outline-none h-auto focus-visible:ring-0 !px-0 text-sm !py-1"
          />
        </div>
      );
    case "Text":
    case "Small Text":
      return (
        <TextArea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
          rows={7}
          className="text-sm"
        />
      );
    case "Link":
      return (
        <LinkField
          field={field}
          value={value}
          isReadOnly={isReadOnly}
          onSelect={(value) => {
            handleChange(value);
          }}
        />
      );
    case "Table":
      return <ChildTable isReadOnly={isReadOnly} field={field} currencySymbol={currencySymbol} />;
    case "Text Editor":
      return (
        <Editor
          field={field}
          isReadOnly={isReadOnly}
          onChange={(value) => {
            handleChange(value);
          }}
        />
      );
    default:
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isReadOnly}
          className="text-sm"
        />
      );
  }
};

export default RenderField;
