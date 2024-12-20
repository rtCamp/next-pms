/**
 * External dependencies
 */

/**
 *
 * Internal dependencies
 */
import { Filter } from "@/app/components/listview/header/Filter";
import { HeaderProps, FilterPops, ButtonProps } from "@/app/components/listview/type";
import { Button } from "@/app/components/ui/button";
import { Header as RootHeader } from "@/app/layout/root";
import { cn } from "@/lib/utils";
import ColumnSelector from "./columnSelector";
import Sort from "./Sort";

/**
 * This component is responsible for Render the header section of pages.
 *
 * @param props.filters The filters to be displayed in the header section.
 * @param props.buttons The buttons to be displayed in the header section.
 * @param props.showColumnSelector The flag to show the column selector.
 * @param props.columnSelector The column selector object.
 * @param props.showSort The flag to show the sort.
 * @param props.sort The sort object.
 * @returns React.FC
 */
export const Header = ({
  filters,
  buttons,
  showColumnSelector = false,
  columnSelector,
  showSort,
  sort,
}: HeaderProps) => {
  return (
    <div className="border-b">
      <RootHeader
        className="flex items-center max-md:flex-col overflow-y-hidden no-scrollbar max-lg:gap-x-2"
        parentClassName="border-0"
      >
        <div id="filters" className="flex gap-x-2 max-md:w-full items-center ">
          {filters &&
            filters.map((filter: FilterPops) => {
              if (filter.hide) {
                return <></>;
              }
              return <Filter filter={filter} key={filter.queryParameterName} />;
            })}
        </div>
        {buttons && (
          <div className="flex gap-x-2 max-md:p-1 max-md:w-full max-md:justify-between max-md:m-2">
            {buttons.map((button: ButtonProps) => {
              if (button.hide) {
                return <></>;
              }
              return (
                <Button
                  title={button.title}
                  className={cn("p-1 h-fit", button.className)}
                  variant={button.variant || "outline"}
                  onClick={button.handleClick}
                >
                  {button.icon && <button.icon />}
                  {button.label}
                </Button>
              );
            })}
          </div>
        )}
        <section className="flex gap-x-2">
          {showColumnSelector && columnSelector?.fieldMeta && <ColumnSelector {...columnSelector} />}
          {showSort && sort && <Sort {...sort} />}
        </section>
      </RootHeader>
    </div>
  );
};
