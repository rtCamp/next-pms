/**
 * External dependencies
 */
import { useState, useEffect } from "react";
import { X } from "lucide-react";
/**
 * Internal dependencies
 */
import { removeValueFromArray } from "@/app/pages/resource_management/utils/helper";
import { FilterPops } from "../type";

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
      <div className="px-2 rounded text-sm z-10 bg-white">Filters:</div>
      <div className="flex gap-x-2 overflow-scroll w-fit px-4 no-scrollbar">
        {updateFilters &&
          updateFilters.map((filter: FilterPops) => {
            if (Array.isArray(filter.value)) {
              return (
                <div className="flex gap-2 flex-shrink-0">
                  <div className="bg-blue-200 px-2 py-1 rounded text-sm">{filter.label}:</div>
                  {filter.value.map((value, index) => (
                    <div
                      key={index}
                      className="bg-gray-200 px-2 py-1 break-keep gap-1 rounded text-sm flex items-center cursor-pointer"
                      onClick={() => filter.handleDelete(removeValueFromArray(value, filter.value as string[]))}
                    >
                      <div className="w-fit">{value}</div>
                      <X className="h-4 w-4 cursor-pointer" />
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <div className="flex gap-2 w-fit flex-shrink-0">
                <div className="bg-blue-200 px-2 py-1 rounded text-sm">{filter.label}:</div>
                <div
                  className="bg-gray-200 px-2 py-1 gap-1 flex-1 rounded text-sm w-fit flex items-center justify-between cursor-pointer"
                  onClick={() => filter.handleDelete(filter.value)}
                >
                  <div className="w-fit">{filter.value}</div>
                  <X className="h-4 w-4 cursor-pointer" />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default FilterValue;