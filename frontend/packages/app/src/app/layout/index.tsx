/**
 * External dependencies.
 */
import { Suspense, useEffect } from "react";
import { ErrorFallback } from "@next-pms/design-system/components";
import { useToast, Toaster } from "@next-pms/design-system/components";
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import Sidebar from "@/app/layout/sidebar";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { setInitialData } from "@/store/user";

const Layout = ({ children }: { children: React.ReactNode }) => {
	const user = useAppSelector((state) => state.user);
	const dispatch = useAppDispatch();
	const { toast } = useToast();
	const { data, error } = useFrappeGetCall(
		"next_pms.timesheet.api.employee.get_data",
		{},
		undefined,
		{
			revalidateOnFocus: false,
			revalidateIfStale: false,
			errorRetryCount: 1,
		},
	);

	useEffect(() => {
		if (data) {
			const info = {
				employee: data.message?.employee ?? "",
				workingHours: data.message?.employee_working_detail?.working_hour ?? 8,
				workingFrequency:
					data.message?.employee_working_detail?.working_frequency ?? "Per Day",
				reportsTo: data.message?.employee_report_to ?? "",
				employeeName: data.message?.employee_name ?? "",
			};
			dispatch(setInitialData(info));
		}
		if (error) {
			const err = parseFrappeErrorMsg(error);
			toast({
				variant: "destructive",
				description: err,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data, error]);

	return (
		<ErrorFallback>
			<div className="flex flex-row h-screen w-full">
				<ErrorFallback>
					<Sidebar />
				</ErrorFallback>
				<div className="w-full overflow-hidden flex flex-col">
					{(user.employee || user.user == "Administrator") && (
						<>
							<Suspense fallback={<></>}>
								<ErrorFallback>{children}</ErrorFallback>
							</Suspense>
						</>
					)}
				</div>
			</div>
			<Toaster />
		</ErrorFallback>
	);
};

export default Layout;
