type FieldRendererProps = {
  fields: string;
  tabName: string;
};

/**
 * FieldRenderer Component
 * @description This component renders fields of the form-view section wise
 * @param fields Array of fields containing fields, section and columns
 * @param tabName The name of tab
 * @returns A JSX Component
 */

const FieldRenderer = ({ fields, tabName }) => {
  const sections = [];
  let currentSection = { title: "", left: [], right: [], isRight: false };

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

  return (
    <div className="space-y-6">
      {sections?.map((section, index) => (
        <div key={index} className="border p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">{section.left.map(renderField)}</div>
            <div className="space-y-4">{section.right.map(renderField)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const renderField = (field) => {
  switch (field.fieldtype) {
    case "Data":
    case "Text":
    case "Currency":
      return (
        <input
          key={field.label}
          type="text"
          placeholder={field.label}
          defaultValue={field.value}
          className="w-full p-2 border rounded"
        />
      );

    case "Select":
      return (
        <select key={field.label} className="w-full p-2 border rounded">
          {field.options?.split("\n").map((opt, idx) => (
            <option key={idx} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case "Date":
      return <input key={field.label} type="date" defaultValue={field.value} className="w-full p-2 border rounded" />;

    case "Float":
    case "Percent":
      return (
        <input
          key={field.label}
          type="number"
          placeholder={field.label}
          defaultValue={field.value}
          step="any"
          className="w-full p-2 border rounded"
        />
      );

    case "Link":
      return (
        <input
          key={field.label}
          type="url"
          placeholder={field.label}
          defaultValue={field.value}
          className="w-full p-2 border rounded"
        />
      );

    default:
      return null;
  }
};

export default FieldRenderer;
