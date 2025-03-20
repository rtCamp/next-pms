/**
 * External dependencies.
 */
import { TableContextProvider } from "@next-pms/resource-management/store";

/**
 * Internal dependencies.
 */
import { ResourceTimeLine } from "./ resourceTimeLine";
import { ResourceContextProvider } from "../store/resourceFormContext";
import { TimeLineContextProvider } from "../store/timeLineContext";

const ResourceTimeLineView = () => {
  return (
    <>
      <TableContextProvider>
        <ResourceContextProvider>
          <TimeLineContextProvider>
            <ResourceTimeLine />
          </TimeLineContextProvider>
        </ResourceContextProvider>
      </TableContextProvider>
    </>
  );
};

export default ResourceTimeLineView;
