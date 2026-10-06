/**
 * External dependencies.
 */
import { Spinner } from "@next-pms/design-system/components";
import { Button, FileUploader, useToasts } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

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
      onFailure={(_, errorMessage) => {
        toast.error(errorMessage ?? "Failed to upload document");
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
            <AddSm className="size-4" />
          )}
        </Button>
      )}
    </FileUploader>
  );
}
