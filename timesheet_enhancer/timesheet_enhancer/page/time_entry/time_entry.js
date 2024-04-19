frappe.pages["time-entry"].on_page_load = function (wrapper) {
  frappe.ui.make_app_page({
    parent: wrapper,
    title: "Time Entry",
    single_column: true,
  });
  frappe.timeentry = new TimeEntry(wrapper);
};

class TimeEntry {
  constructor(wrapper) {
    this.wrapper = $(wrapper);
    this.page = wrapper.page;
    this.main_section = this.page.main;
    this.data = {};
    this.init_components();
  }
  init_components() {
    this.prepare_dom();
    this.add_fields();
    this.init_fields();
    this.get_employee_from_session_user();
  }
  prepare_dom() {
    this.page.set_indicator("Not Saved", "orange");
    this.page.set_primary_action("Save", () => {
      frappe.run_serially([() => this.validate(), () => this.save()]);
    });
    this.main_section.append(
      `<div class ="std-form-layout" >
          <div class="form-layout">
              <div class="form-page"></div>
          </div>
        </div>`,
    );
    this.add_section("__section1");
    this.left_column = this.add_column(
      "__column1",
      this.main_section.find(".__section1 > .section-body"),
    );
    this.add_column(
      "__column2",
      this.main_section.find(".__section1 > .section-body"),
    );
    this.add_section("__section2");
    this.add_column(
      "__description",
      this.main_section.find(".__section2 > .section-body"),
      true,
    );
  }
  add_fields() {
    let col1 = this.main_section.find(
      " .__section1 > .section-body > .__column1",
    );
    let col2 = this.main_section.find(
      " .__section1 > .section-body >.__column2",
    );
    let description = this.main_section.find(
      " .__section2 > .section-body > .__description",
    );
    this.employee = frappe.ui.form.make_control({
      df: {
        label: __("Employee"),
        fieldtype: "Link",
        fieldname: "employee",
        options: "Employee",
        reqd: 1,
        onchange: () => {
          if (!this.employee.get_value()) {
            this.employee_name.set_value("");
            return;
          }
          this.data.employee = this.employee.get_value();
          if (this.data.employee_name) {
            return;
          }
          frappe.call({
            method: "frappe.client.get_value",
            args: {
              doctype: "Employee",
              fieldname: ["employee_name"],
              filters: { name: this.data.employee },
            },
            callback: (r) => {
              if (r.message) {
                this.employee_name.set_value(r.message.employee_name);
              }
            },
          });
        },
      },
      parent: col1.find("form"),
      render_input: true,
    });
    this.employee_name = frappe.ui.form.make_control({
      df: {
        label: __("Employee Name"),
        fieldtype: "Data",
        fieldname: "employee_name",
        read_only: 1,
        onchange: () => {
          this.data.employee_name = this.employee_name.get_value();
        },
      },
      parent: col1.find("form"),
      render_input: true,
    });
    this.project = frappe.ui.form.make_control({
      df: {
        label: __("Project"),
        fieldtype: "Link",
        fieldname: "project",
        options: "Project",
        reqd: 0,
        onchange: () => {
          this.data.project = this.project.get_value();
        },
      },
      parent: col1.find("form"),
      render_input: true,
    });

    this.activity = frappe.ui.form.make_control({
      df: {
        label: __("Activity"),
        fieldtype: "Link",
        fieldname: "activity",
        options: "Activity Type",
        reqd: 1,
        onchange: () => {
          this.data.activity = this.activity.get_value();
        },
      },
      parent: col1.find("form"),
      render_input: true,
    });

    this.task = frappe.ui.form.make_control({
      df: {
        label: __("Task"),
        fieldtype: "Link",
        fieldname: "task",
        options: "Task",
        get_query: function () {
          const project = frappe.timeentry.project.value;
          if (!project) {
            frappe.throw(__("Please select Project"));
          }
          return {
            filters: {
              project: project,
            },
          };
        },
        onchange: () => {
          this.data.task = this.task.get_value();
        },
      },
      parent: col2.find("form"),
      render_input: true,
    });

    this.date = frappe.ui.form.make_control({
      df: {
        label: __("Date"),
        fieldtype: "Date",
        fieldname: "date",
        default: frappe.datetime.nowdate(),
        reqd: 1,
        onchange: () => {
          this.data.date = this.date.get_value();
        },
      },
      parent: col2.find("form"),
      render_input: true,
    });

    this.hour = frappe.ui.form.make_control({
      df: {
        label: __("Hours"),
        fieldtype: "Float",
        fieldname: "hour",
        reqd: 1,
        onchange: () => {
          this.data.hour = this.hour.get_value();
        },
      },
      parent: col2.find("form"),
      render_input: true,
    });

    this.description = frappe.ui.form.make_control({
      df: {
        label: __("Description"),
        fieldtype: "Text",
        fieldname: "description",
        max_height: 200,
        onchange: () => {
          this.data.description = this.description.get_value();
        },
      },
      parent: description.find("form"),
      render_input: true,
    });
  }
  get_employee_from_session_user() {
    frappe.call({
      method: "frappe.client.get_value",
      args: {
        doctype: "Employee",
        fieldname: ["name", "employee_name"],
        filters: { user_id: frappe.session.user },
      },
      callback: (r) => {
        if (r.message) {
          this.employee.set_value(r.message.name);
          this.employee_name.set_value(r.message.employee_name);
        }
      },
    });
  }
  init_fields() {
    // Remove error css class on the init of fields
    this.employee.$wrapper.removeClass("has-error");
    this.project.$wrapper.removeClass("has-error");
    this.hour.$wrapper.removeClass("has-error");
    this.date.$wrapper.removeClass("has-error");
    this.task.$wrapper.removeClass("has-error");
    this.activity.$wrapper.removeClass("has-error");

    //  Limit the date picker to allow only current and past 3 days
    const today = frappe.datetime.nowdate();
    this.date.datepicker.update({
      minDate: frappe.datetime.str_to_obj(frappe.datetime.add_days(today, -3)),
      maxDate: frappe.datetime.str_to_obj(today),
    });
    this.date.set_value(today);
  }
  validate() {
    let missing_fields = [];
    if (!this.data.employee) {
      missing_fields.push("Employee");
      this.employee.$wrapper.addClass("has-error");
    }
    if (!this.data.employee_name) {
      missing_fields.push("Employee Name");
      this.employee_name.$wrapper.addClass("has-error");
    }
    if (!this.data.project) {
      missing_fields.push("Project");
      this.project.$wrapper.addClass("has-error");
    }
    if (!this.data.activity) {
      missing_fields.push("activity");
      this.activity.$wrapper.addClass("has-error");
    }
    if (!this.data.date) {
      missing_fields.push("Date");
      this.date.$wrapper.addClass("has-error");
    }
    if (!this.data.hour) {
      missing_fields.push("Hour");
      this.hour.$wrapper.addClass("has-error");
    }
    if (missing_fields.length > 0) {
      let msg = `${__("Following fields are required: ")} <br> <ul>`;
      for (let field of missing_fields) {
        msg += `<li>${field}</li>`;
      }
      msg += "</ul>";
      frappe.throw(msg);
    }
  }
  save() {
    let doc = {
      doctype: "Timesheet",
      employee: this.data.employee,
      time_logs: [
        {
          description: this.data.description,
          hours: this.data.hour,
          project: this.data.project,
          task: this.data.task,
          activity_type: this.data.activity,
          from_time: this.data.date,
          to_time: this.data.date,
        },
      ],
    };
    frappe.call({
      method: "frappe.client.save",
      args: {
        doc: doc,
      },
      freeze: true,
      callback: function (r) {
        if (r.message) {
          const doc_name = r.message.name;
          frappe.msgprint({
            message: __(
              `Timesheet created ${frappe.utils.get_form_link(
                "Timesheet",
                doc_name,
                true,
                doc_name,
              )}`,
            ),
            indicator: "green",
          });
          frappe.timeentry.refresh();
        }
      },
    });
  }
  refresh() {
    this.data = {};
    this.project.set_value("");
    this.task.set_value("");
    this.activity.set_value("");
    this.date.set_value(frappe.datetime.nowdate());
    this.hour.set_value(0);
    this.description.set_value("");
  }
  add_column(name, section, is_full_width = false) {
    let col = $(
      `<div class="form-column col-sm-${
        is_full_width ? "12" : "6"
      } ${name}" data-fieldname="${name}"><form></form></div>`,
    ).appendTo(section);
    return col;
  }
  add_section(name) {
    let section = $(
      `<div class="row form-section card-section ${name}" data-fieldname="${name}" id="${name}">
        <div class="section-body"> </div>
      </div>`,
    ).appendTo(this.main_section.find(".form-page"));
    return section;
  }
}
