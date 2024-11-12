import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useFrappePostCall } from "frappe-react-sdk";
import { useDispatch, useSelector } from "react-redux";
import { setViews } from "@/store/view";
import { useState } from "react";
import { RootState } from "@/store";

interface CreateViewProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dt: string;
  rows: Array<string>;
  filters: any;
  orderBy: { field: string; order: string };
  route: string;
  isDefault: boolean;
  columns:any
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
  const { call } = useFrappePostCall("frappe_pms.timesheet.doctype.pms_view_setting.pms_view_setting.create_view");
  const user = useSelector((state: RootState) => state.user);
  const defaultRows = ["name", "creation", "modified"];
  const [label, setLabel] = useState("");
  const dispatch = useDispatch();
  const createView = () => {
    defaultRows.forEach((value) => {
      if (!rows.includes(value)) {
        rows.push(value);
      }
    });
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
        <Input
          placeholder="eg: My custom view"
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
          }}
        />

        <DialogFooter>
          <Button onClick={createView}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
