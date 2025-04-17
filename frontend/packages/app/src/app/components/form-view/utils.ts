import { ChildMetaField, ChildRow } from "./types";

// This transforms ChildMeta Type to Field type
export const enrichChildMeta = (
  childMeta: ChildMetaField[],
  values: ChildRow[],
  name: string
) => {
  const matchedValue = values.find((v) => v.name === name);

  if (!matchedValue) return childMeta;

  return childMeta.map((field) => ({
    ...field,
    value: matchedValue[field.fieldname] ?? null,
    link: {
      route: `/app/${field.options
        ?.toLowerCase()
        .replace(/[_\s]/g, "-")}/${encodeURIComponent(
        matchedValue[field.fieldname]
      )}`,
    },
  }));
};
