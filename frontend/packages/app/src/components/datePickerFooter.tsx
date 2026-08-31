/**
 * External Dependencies
 */
import { Button, type DatePickerFooterRender } from "@rtcamp/frappe-ui-react";
import { format, subDays } from "date-fns";

export const datePickerFooter: DatePickerFooterRender = (
  props,
  { setValue, clear, close },
) => (
  <div {...props} className="flex gap-1 justify-between">
    <div className="flex gap-1">
      <Button
        variant="outline"
        onClick={() => {
          setValue(format(subDays(new Date(), 1), "yyyy-MM-dd"));
          close();
        }}
      >
        Yesterday
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          setValue(format(new Date(), "yyyy-MM-dd"));
          close();
        }}
      >
        Today
      </Button>
    </div>
    <Button variant="outline" onClick={clear}>
      Clear
    </Button>
  </div>
);
