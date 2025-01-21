/**
 * External dependencies
 */
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Button,
} from "@next-pms/design-system/components";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import { useFrappePostCall } from "frappe-react-sdk";
/**
 * Internal dependencies
 */
import { RootState } from "@/store";
import { setViews } from "@/store/view";

interface CreateViewProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dt: string;
  rows: Array<string>;
  filters: Record<string, string | number | Array<string>>;
  orderBy: { field: string; order: string };
  route: string;
  isDefault: boolean;
  columns: Record<string, number | string>;
  isPublic: boolean;
}
export const CreateView = ({
  isOpen = false,
  dt,
  rows,
  filters,
  orderBy,
  route,
  isDefault,
  isPublic,
  columns,
  setIsOpen,
}: CreateViewProps) => {
  const { call } = useFrappePostCall("next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.create_view");
  const user = useSelector((state: RootState) => state.user);
  const [label, setLabel] = useState("");
  const dispatch = useDispatch();
  const [openEmoji, setOpenEmoji] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState("😀");
  const createView = () => {
    const view = {
      dt: dt,
      rows: rows,
      label: label,
      filters: filters,
      columns: columns,
      user: user.user,
      default: isDefault,
      public: isPublic,
      route: route,
      type: "Custom",
      icon: selectedEmoji,
      order_by: orderBy,
    };
    call({
      view: view,
    }).then((res) => {
      dispatch(setViews(res.message));
      setLabel("");
      setIsOpen(!isOpen);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create View</DialogTitle>
        </DialogHeader>
        <div className="flex gap-x-2">
          <Button onClick={() => setOpenEmoji(!openEmoji)} className="w-10 p-0" variant="outline">
            {selectedEmoji}
          </Button>
          {openEmoji && (
            <EmojiPicker
              lazyLoadEmojis={true}
              previewConfig={{ showPreview: false, defaultEmoji: selectedEmoji }}
              emojiStyle={EmojiStyle.NATIVE}
              className="absolute mt-11 h-80 overflow-y-auto"
              onEmojiClick={(event) => {
                setSelectedEmoji(event.emoji);
                setOpenEmoji(false);
              }}
            />
          )}
          <Input
            placeholder="eg: My custom view"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
            }}
          />
        </div>
        <DialogFooter>
          <Button onClick={createView}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
