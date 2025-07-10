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
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors duration-150 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 focus:bg-blue-50 focus:text-blue-700 group"
            >
              <Plus className="h-4 w-4 text-blue-700 group-hover:text-blue-800 dark:text-blue-300 dark:group-hover:text-blue-400" />
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
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors duration-150 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20 dark:hover:text-green-300 focus:bg-green-50 focus:text-green-700 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Globe className="h-4 w-4 text-green-600 group-hover:text-green-500 dark:text-green-400" />
                    <Typography variant="p" className="text-sm font-medium">
                      {updateLoading ? "Making Public..." : "Make Public"}
                    </Typography>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteView}
                    disabled={deleteLoading}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors duration-150 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-300 focus:bg-red-50 focus:text-red-700 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4 text-red-500 group-hover:text-red-600 dark:text-red-400" />
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors duration-150 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300 focus:bg-gray-50 focus:text-gray-700 group"
            >
              <Download className="h-4 w-4 text-gray-600 group-hover:text-gray-700 dark:text-gray-300 dark:group-hover:text-gray-200" />
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
