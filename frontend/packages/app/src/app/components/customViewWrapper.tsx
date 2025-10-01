/**
 * External dependencies
 */
import { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Spinner } from "@next-pms/design-system/components";
import { useToast } from "@next-pms/design-system/hooks";
import { FrappeContext, FrappeConfig } from "frappe-react-sdk";

/**
 * Internal dependencies
 */
import { getDefaultView, parseFrappeErrorMsg } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
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
	const views = useAppSelector((state) => state.view);
	const user = useAppSelector((state) => state.user);
	const [viewData, setViewData] = useState<ViewData | undefined>(undefined);
	const { call } = useContext(FrappeContext) as FrappeConfig;
	const dispatch = useAppDispatch();
	const { toast } = useToast();

	const view = searchParams.get("view");

	const userViews = useMemo(() => {
		return views.views.filter(
			(v) => v.route === pathname && v.user === user.user,
		);
	}, [views, pathname, user]);

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
					toast({
						variant: "destructive",
						description: e,
					});
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
