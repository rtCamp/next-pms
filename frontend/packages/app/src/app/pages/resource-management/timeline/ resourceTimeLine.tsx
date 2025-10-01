/**
 * External dependencies.
 */
import { useCallback, useEffect } from "react";
import { getUTCDateTime } from "@next-pms/design-system";
import { Spinner, useToast } from "@next-pms/design-system/components";
import { useFrappePostCall } from "frappe-react-sdk";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import CustomViewWrapper from "@/app/components/customViewWrapper";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useAppSelector } from "@/store";
import { ResourceTimLineHeaderSection } from "./components/header";
import { ResourceTimeLine } from "./components/timeLine";
import type {
	ResourceAllocationEmployeeProps,
	ResourceAllocationTimeLineProps,
	ResourceTeamAPIBodyProps,
	ResourceTimeLineDataProps,
	ResourceTimeLineViewComponentProps,
} from "./types";
import { createFilter } from "./utils";
import AddResourceAllocations from "../components/addAllocation";
import { ResourceFormContext } from "../store/resourceFormContext";
import { TimeLineContext } from "../store/timeLineContext";
import type { AllocationDataProps, TimeLineContextState } from "../store/types";
import { getIsBillableValue } from "../utils/helper";

const ResourceTimeLineView = () => {
	return (
		<CustomViewWrapper
			label="ResourceTimelineView"
			createFilter={createFilter({} as TimeLineContextState)}
		>
			{({ viewData }) => <ResourceTimeLineViewComponent viewData={viewData} />}
		</CustomViewWrapper>
	);
};

const ResourceTimeLineViewComponent = ({
	viewData,
}: ResourceTimeLineViewComponentProps) => {
	const { toast } = useToast();
	const {
		apiControler,
		employees,
		customer,
		allocations,
		filters,
		allocationData,
	} = useContextSelector(TimeLineContext, (value) => value.state);

	const {
		updateApiControler,
		setEmployeesData,
		setCustomerData,
		setAllocationsData,
		isEmployeeExits,
		setAllocationData,
	} = useContextSelector(TimeLineContext, (value) => value.actions);

	const {
		permission: resourceAllocationPermission,
		dialogState: resourceDialogState,
	} = useContextSelector(ResourceFormContext, (value) => value.state);

	const { call: fetchData } = useFrappePostCall(
		"next_pms.resource_management.api.team.get_resource_management_team_view_data",
	);

	const user = useAppSelector((state) => state.user);

	const getFilterApiBody = useCallback(
		(req: ResourceTeamAPIBodyProps): ResourceTeamAPIBodyProps => {
			let newReqBody: ResourceTeamAPIBodyProps = {
				...req,
				employee_name: filters.employeeName,
				page_length: filters.page_length,
			};
			if (resourceAllocationPermission.write) {
				newReqBody = {
					...newReqBody,
					business_unit: JSON.stringify(filters.businessUnit),
					reports_to: filters.reportingManager,
					designation: JSON.stringify(filters.designation),
					is_billable: getIsBillableValue(filters.allocationType as string[]),
					skills:
						filters?.skillSearch && filters?.skillSearch?.length > 0
							? JSON.stringify(filters.skillSearch)
							: "[]",
				};
				return newReqBody;
			}

			return newReqBody;
		},
		[resourceAllocationPermission.write, filters],
	);

	const handleApiCall = useCallback(
		async (req: ResourceTeamAPIBodyProps) => {
			try {
				const filterReqBody: ResourceTeamAPIBodyProps = getFilterApiBody(req);
				const res = await fetchData(filterReqBody);
				return res.message;
			} catch (err) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore: Ignore type checking for parseFrappeErrorMsg
				const error = parseFrappeErrorMsg(err);
				toast({
					variant: "destructive",
					description: error,
				});
				return null;
			}
		},
		[fetchData, getFilterApiBody, toast],
	);

	const handleDelete = useCallback(
		(oldData: AllocationDataProps, newData: AllocationDataProps) => {
			setAllocationData({
				old: oldData,
				new: newData,
				isNeedToDelete: true,
			});
		},
		[setAllocationData],
	);

	const filterApiData = useCallback(
		(data: ResourceTimeLineDataProps) => {
			const updatedData = { ...data };

			updatedData.employees = updatedData.employees.map(
				(employee: ResourceAllocationEmployeeProps) => ({
					...employee,
					id: employee.name,
					title: employee.employee_name,
				}),
			);

			updatedData.resource_allocations = updatedData.resource_allocations.map(
				(allocation: ResourceAllocationTimeLineProps) => ({
					...allocation,
					id: allocation.name,
					group: allocation.employee,
					title: allocation.name,
					start_time: getUTCDateTime(
						allocation.allocation_start_date,
					).getTime(),
					end_time: getUTCDateTime(allocation.allocation_end_date).setDate(
						getUTCDateTime(allocation.allocation_end_date).getDate() + 1,
					),
					customerData: {
						...updatedData.customer[allocation.customer],
					},
					canDelete: resourceAllocationPermission.delete,
					onDelete: handleDelete,
					isShowMonth: filters.isShowMonth,
					type: "allocation",
				}),
			);

			updatedData.leaves = updatedData.leaves.map(
				(leave: ResourceAllocationTimeLineProps) => ({
					...leave,
					id: leave.name,
					group: leave.employee,
					title: leave.name,
					start_time: getUTCDateTime(leave.from_date).getTime(),
					end_time: getUTCDateTime(leave.to_date).setDate(
						getUTCDateTime(leave.to_date).getDate() + 1,
					),
					canDelete: false,
					isShowMonth: filters.isShowMonth,
					type: "leave",
				}),
			);

			return updatedData;
		},
		[filters, handleDelete, resourceAllocationPermission.delete],
	);

	const loadIntialData = useCallback(async () => {
		const req: ResourceTeamAPIBodyProps = {
			date: filters.weekDate,
			start: filters.start,
		};

		const mainThredData = await handleApiCall(req);

		if (!mainThredData) return;

		const data = filterApiData(mainThredData);

		setEmployeesData(data.employees, mainThredData.has_more);
		setCustomerData(data.customer);
		setAllocationsData([...data.leaves, ...data.resource_allocations]);
	}, [
		filters.weekDate,
		filters.start,
		handleApiCall,
		filterApiData,
		setEmployeesData,
		setCustomerData,
		setAllocationsData,
	]);

	const handleFormSubmit = useCallback(
		(
			oldData:
				| ResourceAllocationTimeLineProps
				| AllocationDataProps
				| undefined = undefined,
			newData:
				| ResourceAllocationTimeLineProps
				| AllocationDataProps
				| undefined = undefined,
		) => {
			if (!oldData || !newData) return;
			const employeeList = [];
			const isOldEmployeeExits = isEmployeeExits(oldData.employee);
			const isNewEmployeeExits = isEmployeeExits(newData.employee);

			if (isOldEmployeeExits) {
				employeeList.push(oldData.employee);
			}
			if (isNewEmployeeExits) {
				employeeList.push(newData.employee);
			}

			if (employeeList.length == 0) return;

			fetchData({
				date: filters.weekDate,
				employee_id: JSON.stringify(employeeList),
				is_billable: getIsBillableValue(filters.allocationType as string[]),
			}).then((res) => {
				if (res.message) {
					const updatedAllocations = allocations.filter(
						(allocation) =>
							allocation.employee != oldData.employee &&
							allocation.employee != newData.employee,
					);
					const filterData = filterApiData(res.message);
					setAllocationsData(
						[
							...updatedAllocations,
							...filterData.leaves,
							...filterData.resource_allocations,
						],
						"Set",
					);
					setCustomerData({ ...customer, ...filterData.customer });
				}
			});
		},
		[
			allocations,
			customer,
			fetchData,
			filterApiData,
			filters,
			isEmployeeExits,
			setAllocationsData,
			setCustomerData,
		],
	);

	useEffect(() => {
		if (apiControler.isNeedToFetchDataAfterUpdate) {
			loadIntialData();
			updateApiControler({ isNeedToFetchDataAfterUpdate: false });
		}
	}, [
		loadIntialData,
		apiControler.isNeedToFetchDataAfterUpdate,
		updateApiControler,
	]);

	useEffect(() => {
		if (allocationData.isNeedToDelete) {
			handleFormSubmit(allocationData.old, allocationData.new);
			setAllocationData({ isNeedToDelete: false });
		}
	}, [
		allocationData.isNeedToDelete,
		allocationData.new,
		allocationData.old,
		handleFormSubmit,
		setAllocationData,
	]);

	useEffect(() => {
		// This way will make sure the timeline width changes when the user collapses the sidebar.
		setTimeout(() => {
			const container = document.querySelector<HTMLDivElement>(
				".react-calendar-timeline",
			);
			const scrollContainer =
				document.querySelector<HTMLDivElement>(".rct-scroll");
			const sidebar = document.querySelector<HTMLDivElement>(".rct-sidebar");

			if (container && scrollContainer && sidebar) {
				scrollContainer.style.transition = "width 0.2s ease";
				scrollContainer.style.width = `${container.offsetWidth - sidebar.offsetWidth}px`;
			}
		}, 500);
	}, [user.isSidebarCollapsed]);

	return (
		<>
			<ResourceTimLineHeaderSection viewData={viewData} />
			{apiControler.isLoading && employees.length == 0 ? (
				<Spinner isFull />
			) : (
				<ResourceTimeLine handleFormSubmit={handleFormSubmit} />
			)}

			{resourceDialogState.isShowDialog && (
				<AddResourceAllocations onSubmit={handleFormSubmit} />
			)}
		</>
	);
};

export { ResourceTimeLineView };
