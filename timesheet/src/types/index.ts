export type Employee = {
    name: string;
    image: string;
    employee_name: string;
};
export type WorkingFrequency = "Per Day" | "Per Week";

export type ItemDataProps = {
    date: string;
    hour: number;
};
  
export type ItemProps = {
    employee_name: string;
    name: string;
    image: string;
    data: Array<ItemDataProps>;
    status: string;
    working_hour: number;
    working_frequency: WorkingFrequency;
  };
