/**
 * External dependencies.
 */
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

/**
 * Internal dependencies.
 */
import { getLocalStorage } from "@/lib/storage";
import { getCookie } from "@/lib/utils";
import { WorkingFrequency } from "@/types";

const userImage = getCookie("user_image");
const fullName = getCookie("full_name");
const user = getCookie("user_id");

interface InitiDataProps {
	employee: string;
	workingHours: number;
	workingFrequency: WorkingFrequency;
	reportsTo: string;
	employeeName: string;
}

export interface UserState {
	userName: string;
	image: string;
	roles: string[];
	isSidebarCollapsed: boolean;
	employee: string;
	user: string;
	workingHours: number;
	workingFrequency: WorkingFrequency;
	reportsTo: string;
	employeeName: string;
	currencies: Array<string>;
	hasBuField: boolean;
	hasIndustryField: boolean;
}

const initialState: UserState = {
	roles: window.frappe?.boot?.user?.roles ?? [],
	userName: decodeURIComponent(fullName as string) ?? "",
	image: userImage ?? "",
	isSidebarCollapsed: getLocalStorage("next-pms:isSidebarCollapsed") || false,
	employee: "",
	employeeName: "",
	user: decodeURIComponent(user ?? ""),
	workingHours: 0,
	workingFrequency: "Per Day",
	reportsTo: "",
	currencies: window.frappe?.boot?.currencies ?? [],
	hasBuField: window.frappe?.boot?.has_business_unit ?? false,
	hasIndustryField: window.frappe?.boot?.has_industry ?? false,
};

const userSlice = createSlice({
	name: "user",
	initialState,
	reducers: {
		setRole: (state, action: PayloadAction<Array<string>>) => {
			state.roles = action.payload;
		},
		setUserName: (state, action: PayloadAction<string>) => {
			state.userName = action.payload;
		},
		setImage: (state, action: PayloadAction<string>) => {
			state.image = action.payload;
		},
		setReportsTo: (state, action: PayloadAction<string>) => {
			state.reportsTo = action.payload;
		},
		setHasBuField: (state, action: PayloadAction<boolean>) => {
			state.hasBuField = action.payload;
		},
		setHasIndustryField: (state, action: PayloadAction<boolean>) => {
			state.hasIndustryField = action.payload;
		},
		setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
			state.isSidebarCollapsed = action.payload;
		},
		setEmployee: (state, action: PayloadAction<string>) => {
			state.employee = action.payload;
		},
		setCurrency: (state, action: PayloadAction<Array<string>>) => {
			state.currencies = action.payload;
		},
		setWorkingDetail: (
			state,
			action: PayloadAction<{
				workingHours: number;
				workingFrequency: WorkingFrequency;
			}>,
		) => {
			state.workingHours = action.payload.workingHours;
			state.workingFrequency = action.payload.workingFrequency;
		},
		setInitialData: (state, action: PayloadAction<InitiDataProps>) => {
			state.employee = action.payload.employee;
			state.workingHours = action.payload.workingHours;
			state.workingFrequency = action.payload.workingFrequency;
			state.reportsTo = action.payload.reportsTo;
			state.employeeName = action.payload.employeeName;
		},
	},
});

export const {
	setRole,
	setImage,
	setUserName,
	setSidebarCollapsed,
	setEmployee,
	setWorkingDetail,
	setInitialData,
	setCurrency,
	setHasBuField,
	setHasIndustryField,
} = userSlice.actions;

export default userSlice.reducer;
