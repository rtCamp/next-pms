/**
 * External dependencies
 */
import { useState } from "react";
import { Download, Ellipsis, Plus } from "lucide-react";
/**
 * Internal dependencies
 */
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


interface ActionProps {
  docType: string;
}
const Action = ({ docType }: ActionProps) => {
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
          <DropdownMenuItem onClick={openCreateView}>
            <Plus />
            <Typography variant="p">Create View </Typography>
          </DropdownMenuItem>
          {canExport(docType) && (
            <DropdownMenuItem onClick={openExportDialog}>
              <Download />
              <Typography variant="p">Export </Typography>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {exportDialog && <Export doctype={docType} isOpen={exportDialog} setIsOpen={setExportDialog} />}
    </>
  );
};
