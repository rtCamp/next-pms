/**
 * External dependencies.
 */
import { TableContextProvider } from "@next-pms/resource-management/store";

/**
 * Internal dependencies.
 */
import { ResourceTimeLineComponet } from "./ resourceTimeLine";
import { ResourceContextProvider } from "../store/resourceFormContext";
import { TimeLineContextProvider } from "../store/timeLineContext";

const ResourceTimeLineView = () => {
  return (
    <>
      <TableContextProvider>
        <ResourceContextProvider>
          <TimeLineContextProvider>
            <ResourceTimeLineComponet />
          </TimeLineContextProvider>
        </ResourceContextProvider>
      </TableContextProvider>
    </>
  );
};

export default ResourceTimeLineView;
