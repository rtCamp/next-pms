/**
 * External dependencies.
 */
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  toast,
  DialogDescription,
} from "@next-pms/design-system/components";
import { useFrappeUpdateDoc } from "frappe-react-sdk";
import { LoaderCircle, Save, X } from "lucide-react";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { ChildRow, Field, ChildMetaField as FieldMeta } from "../types";
import RenderField from "./renderField";
import { useFormContext } from "../context";
import { enrichChildMeta } from "../utils";

interface DynamicFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
  fieldMeta: FieldMeta[];
  value: ChildRow[];
  currencySymbol: string;
  rowName: string;
  rowIndex?: number;
}

const DynamicFormDialog = ({
  open,
  onClose,
  onSubmit,
  fieldMeta,
  value,
  rowName,
  currencySymbol,
  rowIndex,
}: DynamicFormDialogProps) => {
  const filteredMeta: Field[] = useMemo(() => {
    return enrichChildMeta(fieldMeta, value, rowName)?.filter(
      (f) =>
        f.label !== null && f.read_only !== 1 && f.fieldtype !== "Read Only",
    );
  }, [fieldMeta, value, rowName]);
  const { doctype, docname, mutateData } = useFormContext();

  const {
    updateDoc: updateChildTableRow,
    loading,
    error,
  } = useFrappeUpdateDoc();

  const {
    control,
    handleSubmit,
    formState: { isDirty, isValid },
  } = useForm();

  useEffect(() => {
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
  }, [error]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        aria-describedby="DynamicForm"
        aria-description="DynamicForm"
      >
        <DialogHeader>
          <DialogTitle>Editing Row #{rowIndex}</DialogTitle>
          <DialogDescription></DialogDescription>{" "}
          {/* To remove description warnings in console*/}
        </DialogHeader>
        <form className="space-y-4 py-4">
          {filteredMeta.map((meta) =>
            RenderField(meta, control, () => {}, false, currencySymbol, {}),
          )}
          <DialogFooter className="sm:justify-start w-full pt-3">
            <div className="flex gap-x-4 w-full">
              <Button
                onClick={(e) => {
                  handleSubmit(async (values) => {
                    await updateChildTableRow(doctype, docname, {
                      [fieldMeta[0].parentfield]: [
                        {
                          ...value.find((obj) => obj.name === rowName),
                          ...Object.fromEntries([
                            ...Object.entries(values).filter(
                              ([, value]) => value !== "",
                            ),
                          ]),
                          modified: 1,
                          idx: rowIndex,
                        },
                        ...value.filter((obj) => obj.name !== rowName),
                      ],
                    });
                    toast({
                      variant: "success",
                      description: "Project updated",
                    });
                    mutateData?.();
                    onSubmit(value);
                  })();
                  e.preventDefault();
                }}
                disabled={!isDirty || !isValid || loading}
              >
                {loading ? (
                  <LoaderCircle className="animate-spin size-4" />
                ) : (
                  <Save className="size-4" />
                )}
                Save
              </Button>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                }}
                disabled={loading}
                variant="secondary"
                type="button"
              >
                <X className="size-4" />
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DynamicFormDialog;
