/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import { Button, Dialog, TextInput } from "@rtcamp/frappe-ui-react";

type AddRepoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (url: string) => void;
};

export function AddRepoDialog({
  open,
  onOpenChange,
  onAdd,
}: AddRepoDialogProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setUrl("");
    onOpenChange(false);
  }, [url, onAdd, onOpenChange]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setUrl("");
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      options={{ title: "Connect repository" }}
      actions={
        <Button
          className="w-full h-7"
          variant="solid"
          label="Add"
          onClick={handleSubmit}
          disabled={!url.trim()}
        />
      }
    >
      <div className="-mt-2 space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="block text-base text-ink-gray-5">
            Repository URL
          </label>
          <TextInput
            size="md"
            variant="outline"
            placeholder="https://github.com/<org>/<repo>"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-white border-outline-gray-2"
          />
        </div>
      </div>
    </Dialog>
  );
}
