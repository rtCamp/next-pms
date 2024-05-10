import { useFrappeGetCall } from 'frappe-react-sdk'
import { setCookie,getCookie } from "@/app/lib/utils";
export const setEmployee = () => { 
    const { data, error, isLoading, isValidating, mutate } = useFrappeGetCall("timesheet_enhancer.api.utils.get_employee_from_user", {});
    if (isLoading || isValidating) {
        return null;
    }
    if (data) {
        setCookie("employee", data.message, 30);
        return data.message
    }
}

export const getEmployee = () => { 
    let employee = getCookie("employee");
    if(!employee){
        employee = setEmployee();
    }
    return employee;
}
