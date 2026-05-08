/**
 * External dependencies.
 */
import { Button, Select, TextInput, Filter } from "@rtcamp/frappe-ui-react";
import { DotHorizontal } from "@rtcamp/frappe-ui-react/icons";

const noop = () => {};

export function ProjectListSubHeader() {
  return (
    <div className="flex flex-wrap gap-2 justify-between px-5 py-3.5">
      <div className="flex gap-2">
        <TextInput size="sm" placeholder="Search project" />
        <Select
          placeholder="RAG Status"
          className="w-fit"
          options={[
            { label: "Red", value: "red" },
            { label: "Amber", value: "amber" },
            { label: "Green", value: "green" },
          ]}
        />
        <Select
          placeholder="Phases"
          className="w-fit"
          options={[
            { label: "Red", value: "red" },
            { label: "Amber", value: "amber" },
            { label: "Green", value: "green" },
          ]}
        />
        <Select
          placeholder="Active"
          className="w-fit"
          options={[
            { label: "Red", value: "red" },
            { label: "Amber", value: "amber" },
            { label: "Green", value: "green" },
          ]}
        />
      </div>
      <div className="flex gap-2">
        <Filter
          align="end"
          fields={[
            {
              name: "project_name",
              label: "Project",
              type: "string",
            },
          ]}
        />
        <Button size="sm" icon={DotHorizontal} onClick={noop} />
      </div>
    </div>
  );
}
