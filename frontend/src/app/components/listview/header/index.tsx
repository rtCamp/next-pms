import React from "react";
import { Filter } from "@/app/components/listview/header/Filter";
import { HeaderProps, FilterPops, ButtonProps } from "@/app/components/listview/type";
import { Button } from "@/app/components/ui/button";
import { Header as RootHeader } from "@/app/layout/root";
import { cn } from "@/lib/utils";
import Action from "./action";
import ColumnSelector from "./columnSelector";
import FilterValue from "./FilterValue";
import Sort from "./Sort";
/**
 * This component is responsible for rendering the header section of pages.
 *
 * @param props.filters The filters to be displayed in the header section.
 * @param props.buttons The buttons to be displayed in the header section.
 * @param props.showColumnSelector The flag to show the column selector.
 * @param props.columnSelector The column selector object.
 * @param props.showSort The flag to show the sort.
 * @param props.sort The sort object.
 * @param props.customComponents An array of custom components to render in the header.
 * @returns React.FC
 */
export const Header = ({
  filters,
  buttons,
  showColumnSelector = false,
  columnSelector,
  showSort,
  sort,
  showActions,
  actionProps,
  className,
  showFilterValue = false,
  customComponents,
}: HeaderProps) => {
  return (
    <div className="border-b">
      <RootHeader
        className={cn("flex items-center max-md:flex-col gap-x-3", className)}
        parentClassName="border-0"
      >
        <div id="filters" className="flex gap-x-2 max-md:w-full items-center overflow-y-hidden no-scrollbar">
          {filters &&
            filters.map((filter: FilterPops, idx) => {
              if (filter.hide) {
                return <React.Fragment key={idx}></React.Fragment>;
              }
              return <Filter filter={filter} key={filter.queryParameterName} />;
            })}
        </div>
        <div className="flex gap-x-2">
          {customComponents && (
              <div className="flex gap-x-2 items-center max-md:p-1 max-md:w-full max-md:justify-between max-md:m-2">
                {customComponents.map((Component, idx) => (
                    <React.Fragment key={idx}>{Component}</React.Fragment>
                  )
                )}
              </div>
            )
          }
          {buttons && (
            <div className="flex gap-x-2 items-center max-md:p-1 max-md:w-full max-md:justify-between max-md:m-2">
              {buttons.map((button: ButtonProps, idx) => {
                if (button.hide) {
                  return <React.Fragment key={idx}></React.Fragment>;
                }
                return (
                  <Button
                    title={button.title}
                    className={button.className}
                    variant={button.variant || "outline"}
                    onClick={button.handleClick}
                    key={idx}
                  >
                    {button.icon && <button.icon />}
                    {button.label}
                  </Button>
                );
              })}
            </div>
          )}
          {(showColumnSelector || showSort || showActions) && (
            <section className="flex gap-x-2 items-center">
              {showColumnSelector && columnSelector?.fieldMeta && <ColumnSelector {...columnSelector} />}
              {showSort && sort && <Sort {...sort} />}
              {showActions && actionProps && <Action {...actionProps} />}
            </section>
          )}
        </div>
      </RootHeader>
      {showFilterValue && <FilterValue filters={filters} />}
    </div>
  );
};
