frappe.ui.form.on("Customer", {
    customer_name: async function(frm) {
        if(frm.doc.customer_name){
            const abbr = frm.doc.customer_name
                .split(" ")
                .filter(Boolean)
                .map(w => w[0])
                .join("")
                .toUpperCase();
            frm.set_value("custom_abbr", abbr);
        
    }}

})