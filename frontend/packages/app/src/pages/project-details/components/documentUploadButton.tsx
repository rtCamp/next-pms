/**
 * External dependencies.
 */
import { Spinner } from "@next-pms/design-system/components";
import {
  Button,
  FileUploader,
  Tooltip,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

interface DocumentUploadButtonProps {
  doctype: string;
  docname: string;
  onSuccess: () => void;
}

export function DocumentUploadButton({
  doctype,
  docname,
  onSuccess,
}: DocumentUploadButtonProps) {
  const toast = useToasts();

  return (
    <FileUploader
      uploadArgs={{ doctype, docname, private: true }}
      onSuccess={onSuccess}
      onFailure={(_, errorMessage) => {
        toast.error(errorMessage ?? "Failed to upload document");
      }}
    >
      {({ uploading, openFileSelector }) => (
        <Tooltip text="Upload document">
          <Button
            type="button"
            variant="ghost"
            onClick={openFileSelector}
            disabled={uploading}
            aria-label="Upload document"
          >
            {uploading ? (
              <Spinner className="size-4" />
            ) : (
              <AddSm className="size-4" />
            )}
          </Button>
        </Tooltip>
      )}
    </FileUploader>
  );
}
