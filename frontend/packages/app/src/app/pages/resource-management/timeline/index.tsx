/**
 * External dependencies.
 */
import { TableContextProvider } from "@next-pms/resource-management/store";

/**
 * Internal dependencies.
 */
import { ResourceTimeLineView } from "./ resourceTimeLine";
import { ResourceContextProvider } from "../store/resourceFormContext";
import { TimeLineContextProvider } from "../store/timeLineContext";

const ResourceTimeLineViewWrapper = () => {
  return (
    <>
      <TableContextProvider>
        <ResourceContextProvider>
          <TimeLineContextProvider>
            <ResourceTimeLineView />
          </TimeLineContextProvider>
        </ResourceContextProvider>
      </TableContextProvider>
    </>
  );
};

export default ResourceTimeLineViewWrapper;
