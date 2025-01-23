/**
 * External dependencies.
 */
import { useContext } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { ResourceAllocationEmployeeProps } from "./types";
import { TableInformationCellContent } from "../components/TableCell";
import { TimeLineContext } from "../store/timeLineContext";

interface ResourceTimeLineGroupProps {
  group: ResourceAllocationEmployeeProps;
}

const ResourceTimeLineGroup = ({ group }: ResourceTimeLineGroupProps) => {
  const { getLastTimeLineItem, verticalLoderRef } = useContext(TimeLineContext);

  const lastEmployee = getLastTimeLineItem() == group.name;

  return (
    <TableInformationCellContent
      cellClassName="overflow-hidden flex items-center font-normal bg-none"
      CellComponet={() => {
        return (
          <Avatar className="w-6 h-6 hover:none">
            {group.image && <AvatarImage src={decodeURIComponent(group.image)} />}
            <AvatarFallback>{group.employee_name && group.employee_name[0]}</AvatarFallback>
          </Avatar>
        );
      }}
      value={group.employee_name}
      cellRef={lastEmployee ? verticalLoderRef : null}
    />
  );
};

export default ResourceTimeLineGroup;
