/**
 * External dependencies
 */
import React, { useEffect, useState } from "react";
import { Badge, Button, SheetTitle, ComboBox } from "@next-pms/design-system/components";
import { Sheet, SheetContent } from "@next-pms/design-system/components";
import { mergeClassNames } from "@next-pms/resource-management/utils";
import { useFrappeGetDocList, useFrappePostCall } from "frappe-react-sdk";
import { Minus, Plus, Tag, X } from "lucide-react";

interface SidebarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  projectData: any;
  className?: string;
  drawerOpen?: boolean;
  setDrawerOpen?: (open: boolean) => void;
  projectId?: string;
  mutate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ projectData, className, drawerOpen, setDrawerOpen, projectId, mutate }) => {
  const tags: string[] = (projectData?._user_tags || "")
    .split(",")
    .map((tag: string) => tag?.trim())
    .filter((tag: string) => tag.length > 0);

  return (
    <>
      <DesktopSidebar tags={tags} className={className} projectId={projectId} mutate={mutate} />
      <MobileDrawer
        tags={tags}
        className={className}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        projectId={projectId}
        mutate={mutate}
      />
    </>
  );
};

const DesktopSidebar = ({
  tags,
  className,
  projectId,
  mutate,
}: {
  tags: string[];
  className?: string;
  projectId?: string;
  mutate?: () => void;
}) => {
  return (
    <aside
      className="hidden md:flex min-w-sm h-full lg:max-w-72 max-lg:max-w-60 w-full bg-background border-l border-border flex-col gap-4"
      style={{ position: "relative" }}
    >
      <SidebarContent tags={tags} className={className} projectId={projectId} mutate={mutate} />
    </aside>
  );
};

const MobileDrawer = ({
  tags,
  className,
  drawerOpen,
  setDrawerOpen,
  projectId,
  mutate,
}: {
  tags: string[];
  className?: string;
  drawerOpen?: boolean;
  setDrawerOpen?: (open: boolean) => void;
  projectId?: string;
  mutate?: () => void;
}) => {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handler = (event: MediaQueryListEvent) => {
      if (event.matches) setDrawerOpen?.(false);
    };

    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, [setDrawerOpen]);

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetTitle className="sr-only">Sidebar</SheetTitle>
      <SheetContent side="right" className="max-w-sm px-0">
        <div className="flex flex-col gap-2 h-full overflow-y-auto mt-2">
          <SidebarContent tags={tags} className={className} projectId={projectId} mutate={mutate} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

const SidebarContent = ({
  className,
  tags,
  projectId,
  mutate,
}: {
  className?: string;
  tags: string[];
  projectId?: string;
  mutate?: () => void;
}) => {
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
    if (!projectId) return;
    await call({
      tag: tagToRemove,
      dt: "Project",
      dn: projectId,
    });
    mutate?.();
  };

  const handleAddTag = async (value: string | string[]) => {
    const selected = Array.isArray(value) ? value : [value];
    if (!projectId || !selected[0]) return;
    await addTagCall({
      tag: selected[0],
      dt: "Project",
      dn: projectId,
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
                    "px-2 rounded-full bg-muted text-foreground hover:bg-muted/80 py-1 text-xs flex items-center gap-1",
                    loading && "opacity-50 pointer-events-none"
                  )}
                >
                  {tag} <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
