import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { getCookie } from "@/lib/utils";

const userImage = getCookie("user_image");
const fullName = getCookie("full_name");

interface UserState {
    userName: string;
    image: string;
    roles: string[];
    appLogo: string
    isSidebarCollapsed: boolean
    employee: string
}

const initialState: UserState = {
    //@ts-ignore
    roles: window.frappe?.boot?.user?.roles ?? [],
    userName: decodeURIComponent(fullName as string) ?? "",
    image: userImage ?? "",
    //@ts-ignore
    appLogo: window.frappe?.boot?.app_logo_url,
    isSidebarCollapsed: false,
    employee: "",
};

const userSlice = createSlice({
    name: 'user',
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
        setAppLogo: (state, action: PayloadAction<string>) => {
            state.appLogo = action.payload
        },
        setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
            state.isSidebarCollapsed = action.payload
        },
        setEmployee: (state, action: PayloadAction<string>) => {
            state.employee = action.payload
        },
    },

});

export const { setRole, setImage, setUserName, setAppLogo, setSidebarCollapsed, setEmployee} = userSlice.actions;
export default userSlice.reducer;
