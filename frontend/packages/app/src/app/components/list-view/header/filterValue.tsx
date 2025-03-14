/**
 * External dependencies
 */
import { useState, useEffect } from "react";
import { Badge } from "@next-pms/design-system/components";
import { X } from "lucide-react";
/**
 * Internal dependencies
 */
import { removeValueFromArray } from "@/app/pages/resource_management/utils/helper";
import type { FilterPops } from "../types";

/**
 * This component is responsible for rendering the active filters views in the header section.
 *
 * @param props.filters The filters to be displayed in the header section.
 * @returns React.FC
 */
const FilterValue = ({ filters }: { filters: FilterPops[] }) => {
  const [updateFilters, setUpdateFilters] = useState<FilterPops[]>([]);

  useEffect(() => {
    const needToShowValues = filters.filter((filter) => {
      return (
        !filter.hide &&
        filter.value &&
        (filter.value as []).length != 0 &&
        filter.type != "checkbox" &&
        filter.type != "select"
      );
    });

    setUpdateFilters(needToShowValues);
  }, [filters]);

  if (updateFilters.length == 0) {
    return <></>;
  }

  return (
    <div id="filters" className="flex gap-x-2 max-md:gap-x-3 w-full px-4 py-2 items-center">
      <div className="px-2 rounded text-sm">Filters</div>
      <div className="flex gap-x-2 overflow-scroll w-fit px-4 no-scrollbar">
        {updateFilters &&
          updateFilters.map((filter: FilterPops, idx) => {
            if (Array.isArray(filter.value)) {
              return (
                <div key={idx} className="flex gap-2 flex-shrink-0">
                  <div className="bg-gray-200 px-2 py-1 rounded text-sm">{filter.label}</div>
                  {filter.value.map((value, index) => (
                    <Badge
                      variant="secondary"
                      key={index}
                      className="break-keep gap-x-1 font-normal text-sm flex items-center cursor-pointer"
                      onClick={() => filter.handleDelete(removeValueFromArray(value, filter.value as string[]))}
                    >
                      <div className="w-fit">{value}</div>
                      <X className="h-4 w-4 cursor-pointer" />
                    </Badge>
                  ))}
                </div>
              );
            }
            return (
              <div key={idx} className="flex gap-2 w-fit flex-shrink-0">
                <div className="bg-gray-200 px-2 py-1 rounded text-sm">{filter.label}</div>
                <Badge
                  variant="secondary"
                  className="break-keep gap-x-1 font-normal text-sm flex items-center cursor-pointer"
                  onClick={() => filter.handleDelete(filter.value)}
                >
                  <div className="w-fit">{filter.value}</div>
                  <X className="h-4 w-4 cursor-pointer" />
                </Badge>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default FilterValue;
