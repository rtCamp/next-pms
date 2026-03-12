/**
 * External dependencies
 */
import React, { useEffect, useState } from "react";
import { Badge, Button, ComboBox } from "@next-pms/design-system/components";
import { mergeClassNames } from "@next-pms/resource-management/utils";
import { useFrappeGetDocList, useFrappePostCall } from "frappe-react-sdk";
import { Minus, Plus, Tag, X } from "lucide-react";

interface TagsProps {
  userTags?: string;
  doctype: string;
  docname: string;
  className?: string;
  mutate?: () => void;
}

const Tags: React.FC<TagsProps> = ({ userTags, doctype, docname, className, mutate }) => {
  const tags: string[] = (userTags || "")
    .split(",")
    .map((tag: string) => tag?.trim())
    .filter((tag: string) => tag.length > 0);

  const { call, loading } = useFrappePostCall("frappe.desk.doctype.tag.tag.remove_tag");
  const { call: addTagCall, loading: addTagLoading } = useFrappePostCall("frappe.desk.doctype.tag.tag.add_tag");
  const [tagSearch, setTagSearch] = useState("");
  const [hideComboBox, setHideComboBox] = useState(true);
  const {
    data: tagOptions,
    isLoading: tagOptionsLoading,
    mutate: mutateTagOptions,
  } = useFrappeGetDocList("Tag", {
    fields: ["name"],
    filters: tagSearch ? [["name", "like", `%${tagSearch}%`]] : [],
    limit: 10,
    asDict: false,
  });

  useEffect(() => {
    if (hideComboBox) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setHideComboBox(true);
        setTagSearch("");
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [hideComboBox]);

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!docname) return;
    await call({
      tag: tagToRemove,
      dt: doctype,
      dn: docname,
    });
    mutate?.();
  };

  const handleAddTag = async (value: string | string[]) => {
    const selected = Array.isArray(value) ? value : [value];
    if (!docname || !selected[0]) return;
    await addTagCall({
      tag: selected[0],
      dt: doctype,
      dn: docname,
    });
    setTagSearch("");
    mutate?.();
    mutateTagOptions();
    setHideComboBox(true);
  };

  return (
    <div className={mergeClassNames("flex flex-col gap-4 pb-0 pt-1", className)}>
      <div className="flex h-10 border-b lg:px-4 max-lg:px-3 w-full">
        <div className="flex items-center justify-between gap-2 text-sm font-medium w-full">
          <span className="flex items-center gap-1">
            <Tag />
            Tags
          </span>
          <Button
            variant="ghost"
            className="w-6 h-6 p-0 group"
            title="Add tag"
            disabled={loading}
            aria-disabled={loading}
            onClick={() => setHideComboBox(!hideComboBox)}
          >
            {hideComboBox ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-0 lg:px-4 max-lg:px-3">
        <div className="flex flex-col w-full gap-3">
          {!hideComboBox && (
            <div className="flex flex-col ">
              <ComboBox
                label="Search Tag"
                data={tagOptions?.flat().map((tag) => ({
                  label: tag,
                  value: tag,
                }))}
                onSelect={handleAddTag}
                onSearch={setTagSearch}
                isLoading={tagOptionsLoading || addTagLoading}
                disabled={addTagLoading || loading}
                className="w-full"
                showSelected={true}
              />
            </div>
          )}
          {tags.length === 0 ? (
            <span className="text-muted-foreground text-xs">No tags</span>
          ) : (
            <div className="flex gap-1 w-full flex-wrap">
              {tags.map((tag) => (
                <Badge
                  title={tag}
                  key={tag}
                  aria-disabled={loading}
                  className={mergeClassNames(
                    "px-2 rounded-full bg-muted text-foreground hover:bg-muted/80 py-1 text-xs flex items-center gap-1 truncate",
                    loading && "opacity-50 pointer-events-none"
                  )}
                >
                  <p className="flex-shrink truncate">{tag}</p>{" "}
                  <X className="w-3 h-3 flex-shrink-0 flex-grow cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tags;
