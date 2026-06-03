/**
 * External dependencies.
 */
import { Spinner } from "@next-pms/design-system/components";
import { Button, FileUploader, useToasts } from "@rtcamp/frappe-ui-react";
import { Plus } from "lucide-react";

interface DocumentUploadButtonProps {
  riskName: string;
  onSuccess: () => void;
}

export function DocumentUploadButton({
  riskName,
  onSuccess,
}: DocumentUploadButtonProps) {
  const toast = useToasts();

  return (
    <FileUploader
      uploadArgs={{ doctype: "Risk", docname: riskName }}
      onSuccess={onSuccess}
      onFailure={(err) => {
        toast.error(err);
      }}
    >
      {({ uploading, openFileSelector }) => (
        <Button
          type="button"
          variant="ghost"
          onClick={openFileSelector}
          disabled={uploading}
          aria-label="Add document"
        >
          {uploading ? (
            <Spinner className="size-4" />
          ) : (
            <Plus className="size-4" />
          )}
        </Button>
      )}
    </FileUploader>
  );
}
