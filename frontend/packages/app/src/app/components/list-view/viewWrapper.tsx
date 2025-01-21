/**
 * External dependencies
 */
import { useContext, useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Spinner } from "@next-pms/design-system/components";
import { useToast } from "@next-pms/design-system/hooks";
import { FrappeContext, FrappeConfig, useFrappeGetCall } from "frappe-react-sdk";
/**
 * Internal dependencies
 */
import { getDefaultView } from "@/app/components/list-view/utils";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { setViews, ViewData } from "@/store/view";
import { DocMetaProps } from "@/types";

type ViewWrapperProps = {
  docType: string;
  children: (props: { viewData: ViewData; meta: { message: DocMetaProps } }) => React.ReactNode;
};

/**
 * Custom View Wrapper
 * @description This component handles the default/custom view for the list view.
 * First it checks if the view is available in the URL, if not then it checks the user's default view.
 * If the view is not available then it creates a default view for the user.
 * and updates the view data, then it renders the children with the view data and meta.
 */
const ViewWrapper = ({ docType, children }: ViewWrapperProps) => {
  const views = useSelector((state: RootState) => state.view);
  const user = useSelector((state: RootState) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewData, setViewData] = useState<ViewData | undefined>(undefined);
  const { call } = useContext(FrappeContext) as FrappeConfig;
  const dispatch = useDispatch();
  const { toast } = useToast();
  const view = searchParams.get("view");
  const { data: meta } = useFrappeGetCall(
    "next_pms.timesheet.api.app.get_doc_meta",
    {
      doctype: docType,
    },
    undefined,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  const defaultFields = useMemo(() => {
    return meta?.message?.default_fields?.map((field: { fieldname: string }) => field.fieldname) || [];
  }, [meta]);

  const userViews = useMemo(() => {
    return views.views.filter((v) => v.dt === docType && v.user === user.user);
  }, [views, docType, user]);

  useEffect(() => {
    if (!meta) return;
    let viewInfo = view ? views.views.find((v) => v.name == view) : userViews.find((v) => v.default);
    if (!viewInfo) {
      searchParams.delete("view");
      setSearchParams(searchParams);
      viewInfo = userViews.find((v) => v.default);
    }

    if (!viewInfo) {
      call
        .post("next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.create_view", {
          view: getDefaultView(defaultFields, docType, docType, docType.toLowerCase()),
        })
        .then((res) => {
          dispatch(setViews(res.message));
        })
        .catch((error) => {
          const e = parseFrappeErrorMsg(error);
          toast({
            variant: "destructive",
            description: e,
          });
        });
    } else {
      setViewData(viewInfo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta, view, views.views]);

  if (viewData && meta) {
    return <>{children({ viewData, meta })}</>;
  } else {
    return <Spinner isFull />;
  }
};

export default ViewWrapper;
