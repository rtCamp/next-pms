/**
 * Internal dependencies.
 */
import { WorkingFrequency } from '@/types';

export type dataItem = {
    date: string;
    hour: number;
    is_leave: boolean;
    note: string;
};

export type ItemProps = {
    employee_name: string;
    name: string;
    image: string;
    data: Array<dataItem>;
    status: string;
    working_hour: number;
    working_frequency: WorkingFrequency;
};
