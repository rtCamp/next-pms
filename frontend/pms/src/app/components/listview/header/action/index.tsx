/**
 * External dependencies
 */
import { useState } from "react";
import { Download, Ellipsis, Plus } from "lucide-react";
/**
 * Internal dependencies
 */
import { CreateView } from "@/app/components/listview/createView";
import { Export } from "@/app/components/listview/Export";
import { Typography } from "@/app/components/typography";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { canExport, canCreate } from "@/lib/utils";
import { ActionProps } from "../../type";

/**
 * Action component
 * @description This component is responsible for rendering the action dropdown in the header.
 * @param docType The doctype for which the action is being rendered.
 * @param exportProps The props for the export component.
 * @param viewProps The props for the create view component.
 * @returns React.FC
 */
const Action = ({ docType, exportProps, viewProps }: ActionProps) => {
  const [exportDialog, setExportDialog] = useState(false);
  const [createViewDialog, setCreateViewDialog] = useState(false);
  const openCreateView = () => {
    setCreateViewDialog(true);
  };
  const openExportDialog = () => {
    setExportDialog(true);
  };
  const shouldShowAction = canExport(docType) || canCreate(docType);
  if (!shouldShowAction) return;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="mr-2 [&_div]:cursor-pointer  [&_div]:gap-x-1">
          {canCreate("PMS View Setting") && (
            <DropdownMenuItem onClick={openCreateView}>
              <Plus />
              <Typography variant="p">Create View </Typography>
            </DropdownMenuItem>
          )}
          {canExport(docType) && (
            <DropdownMenuItem onClick={openExportDialog}>
              <Download />
              <Typography variant="p">Export </Typography>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {exportDialog && <Export doctype={docType} isOpen={exportDialog} setIsOpen={setExportDialog} {...exportProps} />}
      {createViewDialog && (
        <CreateView
          isOpen={createViewDialog}
          dt={docType}
          {...viewProps}
          setIsOpen={setCreateViewDialog}
          route={docType.toLowerCase().replace(" ", "-")}
          isDefault={false}
          isPublic={false}
        />
      )}
    </>
  );
};

export default Action;
