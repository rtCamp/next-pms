// Function to get query parameters from the URL
function getQueryParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

frappe.ready(function () {
  frappe.web_form.after_save = () => {
    // Once the form is saved, send a message to the
    // parent window to mark the entry as submitted
    $(".new-btn").remove(); // remove the 'Submit Another Response' button
    window.parent.postMessage({ formSaved: true }, "*");
  };

  // Get the token from the URL
  const token = getQueryParameter("token");

  const hidden_fields = [
    "feedback_from_date",
    "feedback_to_date",
    "evaluation_type",
  ];

  // Set the prefilled fields as hidden
  hidden_fields.forEach((field) => {
    try {
      frappe.web_form.set_df_property(field, "hidden", true);
    } catch (error) {}
  });

  // remove the 'Discard' button, since it is not working
  // with the token approach
  $(".discard-btn").remove();

  if (token) {
    // The server re-validates this on insert; the values set below are only for display.
    frappe.web_form.set_value("token", token);
    frappe.call({
      method:
        "next_pms.customer_feedback.doctype.customer_feedback_schedule.customer_feedback_schedule.get_webform_details",
      args: {
        token: token,
      },
      callback: function (r) {
        if (r.exc) {
          frappe.msgprint(__("Got error"));
          return;
        }
        frappe.web_form.set_value("evaluation_type", r.message.evaluation_type);
        frappe.web_form.set_value(
          "feedback_from_date",
          r.message.feedback_from_date,
        );
        frappe.web_form.set_value(
          "feedback_to_date",
          r.message.feedback_to_date,
        );

        const brand = r.message.brand_title;
        if (brand) {
          frappe.web_form.set_df_property(
            "p_overall_satisfaction",
            "label",
            __(
              "Overall, how satisfied are you with {0}\u2019s work this month?",
              [brand],
            ),
          );
          frappe.web_form.set_df_property(
            "p_reccomendation",
            "label",
            __("Would you recommend {0} to a peer?", [brand]),
          );
        }

        if (r.message.feedback_type !== "Project") {
          frappe.web_form.set_value(
            "feedback_for_name",
            r.message.employee_name,
          );
        }
      },
    });
  } else {
    frappe.msgprint(__("No token found in the URL."));
  }
});
