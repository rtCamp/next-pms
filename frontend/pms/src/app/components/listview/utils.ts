export const getDefaultView = (fields: Array<string>, docType: string, label: string, route: string) => {
    const columns = Object.fromEntries(fields.map((value) => [value, 150]));
    const view = {
        label: label,
        user: "",
        type: "List",
        dt: docType,
        route: route,
        rows: fields,
        columns: columns,
        filters: {},
        default: true,
        public: false,
        order_by: {
            field: "modified",
            order: "desc",
        },
    };
    return view;
}
