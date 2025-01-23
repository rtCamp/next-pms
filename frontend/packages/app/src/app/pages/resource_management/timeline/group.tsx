/**
 * External dependencies.
 */
import { Avatar } from "@next-pms/design-system/components";
import { AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";

/**
 * Internal dependencies.
 */
import { ResourceAllocationEmployeeProps } from "./types";
import { TableInformationCellContent } from "../components/TableCell";

interface ResourceTimeLineGroupProps {
  group: ResourceAllocationEmployeeProps;
}

const ResourceTimeLineGroup = ({ group }: ResourceTimeLineGroupProps) => {
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
    />
  );
};

export default ResourceTimeLineGroup;
