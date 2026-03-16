/**
 * External dependencies
 */
import { useContext, useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, useSearchParams } from "react-router-dom";
import { Spinner } from "@next-pms/design-system/components";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";

/**
 * Internal dependencies
 */
import { getDefaultView, parseFrappeErrorMsg } from "@/lib/utils";
import { useUserState } from "@/providers/user";
import { RootState } from "@/store";
import { setViews, ViewData } from "@/store/view";

type CustomViewWrapperProps = {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createFilter: any;
  children: (props: { viewData: ViewData }) => JSX.Element;
};

const CustomViewWrapper = ({
  label,
  createFilter,
  children,
}: CustomViewWrapperProps) => {
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const views = useSelector((state: RootState) => state.view);
  const { userId } = useUserState();
  const [viewData, setViewData] = useState<ViewData | undefined>(undefined);
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const dispatch = useDispatch();
  const toast = useToasts();

  const view = searchParams.get("view");

  const userViews = useMemo(() => {
    return views.views.filter((v) => v.route === pathname && v.user === userId);
  }, [views, pathname, userId]);

  useEffect(() => {
    let viewInfo = view
      ? views.views.find((v) => v.name === view)
      : userViews.find((v) => v.default);

    if (!viewInfo) {
      searchParams.delete("view");
      setSearchParams(searchParams);
      viewInfo = userViews.find((v) => v.default);
    }

    if (!viewInfo) {
      const defaultView = getDefaultView(label, "", pathname, createFilter);

      call
        .post(
          "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.create_view",
          {
            view: defaultView,
          },
        )
        .then((res) => {
          dispatch(setViews(res.message));
        })
        .catch((error) => {
          const e = parseFrappeErrorMsg(error);
          toast.error(e);
        });
    } else {
      setViewData(viewInfo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, views.views]);

  if (viewData) {
    return <>{children({ viewData })}</>;
  } else {
    return <Spinner isFull />;
  }
};

export default CustomViewWrapper;
