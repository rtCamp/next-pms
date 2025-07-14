/**
 * External dependencies
 */
import { useState, useContext } from "react";
import { useDispatch } from "react-redux";
import {
  Typography,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  useToast,
} from "@next-pms/design-system/components";
import { useFrappeDeleteDoc, useFrappeUpdateDoc, FrappeContext, FrappeConfig } from "frappe-react-sdk";
import { Download, EllipsisVertical, Plus, Trash2, Globe } from "lucide-react";
/**
 * Internal dependencies
 */
import { CreateView } from "@/app/components/list-view/createView";
import { Export } from "@/app/components/list-view/export";
import { canExport, canCreate, parseFrappeErrorMsg } from "@/lib/utils";
import { removeView, setViews } from "@/store/view";
import type { ActionProps } from "../../types";

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
  const { toast } = useToast();
  const dispatch = useDispatch();
  const { deleteDoc, loading: deleteLoading } = useFrappeDeleteDoc();
  const { updateDoc, loading: updateLoading } = useFrappeUpdateDoc();
  const { call } = useContext(FrappeContext) as FrappeConfig;

  const openCreateView = () => {
    setCreateViewDialog(true);
  };
  const openExportDialog = () => {
    setExportDialog(true);
  };

  const fetchAllViews = async () => {
    try {
      const response = await call.post("next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.get_views");
      dispatch(setViews(response.message));
    } catch (error) {
      console.error("Error fetching views:", error);
    }
  };

  const makeViewPublic = () => {
    if (updateLoading || !viewProps.name) return;

    updateDoc("PMS View Setting", viewProps.name, { public: 1 })
      .then(async () => {
        await fetchAllViews();
        toast({
          variant: "success",
          description: "View has been made public successfully",
        });
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };

  const handleDeleteView = () => {
    if (deleteLoading || !viewProps.name) return;

    deleteDoc("PMS View Setting", viewProps.name)
      .then(async () => {
        dispatch(removeView(viewProps.name));
        toast({
          variant: "success",
          description: "View deleted successfully",
        });
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };

  if (!canExport(docType) || !canCreate(docType)) return;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-10 px-2 " aria-label="More actions">
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-44 p-1 shadow-lg bg-white dark:bg-gray-900 rounded-lg"
          align="end"
          sideOffset={5}
        >
          {canCreate("PMS View Setting") && (
            <DropdownMenuItem
              onClick={openCreateView}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors duration-150 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/10 dark:hover:text-primary focus:bg-primary/10 focus:text-primary group"
            >
              <Plus className="h-4 w-4 text-primary group-hover:text-primary dark:text-primary dark:group-hover:text-primary" />
              <Typography variant="p" className="text-sm font-medium">
                Create View
              </Typography>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator className="my-1" />

          {!viewProps.isDefault && (
            <>
              {!viewProps.isPublic && (
                <>
                  <DropdownMenuItem
                    onClick={makeViewPublic}
                    disabled={updateLoading}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors duration-150 hover:bg-success/10 hover:text-success dark:hover:bg-success/10 dark:hover:text-success focus:bg-success/10 focus:text-success group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Globe className="h-4 w-4 text-success group-hover:text-success dark:text-success" />
                    <Typography variant="p" className="text-sm font-medium">
                      {updateLoading ? "Making Public..." : "Make Public"}
                    </Typography>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteView}
                    disabled={deleteLoading}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/10 dark:hover:text-destructive focus:bg-destructive/10 focus:text-destructive group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4 text-destructive group-hover:text-destructive dark:text-destructive" />
                    <Typography variant="p" className="text-sm font-medium">
                      {deleteLoading ? "Deleting..." : "Delete View"}
                    </Typography>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                </>
              )}
            </>
          )}
          {canExport(docType) && (
            <DropdownMenuItem
              onClick={openExportDialog}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors duration-150 hover:bg-secondary hover:text-secondary-foreground dark:hover:bg-secondary dark:hover:text-secondary-foreground focus:bg-secondary focus:text-secondary-foreground group"
            >
              <Download className="h-4 w-4 text-muted-foreground group-hover:text-secondary-foreground dark:text-muted-foreground dark:group-hover:text-secondary-foreground" />
              <Typography variant="p" className="text-sm font-medium">
                Export
              </Typography>
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
