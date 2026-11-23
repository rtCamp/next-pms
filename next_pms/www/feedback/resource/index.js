frappe.ready(function () {
  $(".custom-employee-row").on("click", function () {
    const $this = $(this);
    const feedbackLink = $this.data("link");
    const $formContainer = $("#feedback-form-container");
    const $iframe = $("#feedback-form");
    const $spinner = $("#loading-spinner");
    const $initialTextSmall = $("#initial-text-small");
    const $initialTextLarge = $("#initial-text-large");
    const $listGroup = $("#employee-list");
    const $dropdownSelectTitle = $("#dropdown-select-title");

    if ($this.data("is_submitted") === "True") {
      frappe.show_alert(
        {
          message: __("Feedback already submitted for this resource"),
          indicator: "info",
        },
        5,
      );
      return;
    }

    // Remove previous selection indicator
    $(".custom-employee-row").css("background-color", "");
    $dropdownSelectTitle.html($this.find("strong").html());
    // Check if the device is small or medium (e.g., less than 992px)
    if (window.innerWidth < 1024) {
      $listGroup.hide(); // Hide the list only on smaller devices
    }

    // Show selection indicator for the clicked employee
    $this.css("background-color", "#EBEEF0");

    $iframe.css({
      opacity: "0",
      display: "block",
      transition: "opacity 0.2s ease",
    });
    $initialTextSmall.hide();
    $initialTextLarge.hide();
    $formContainer.show();
    $spinner.show();
    $iframe.attr("src", feedbackLink);

    $iframe.on("load", function () {
      setTimeout(() => {
        $spinner.hide();
        $iframe.css({
          opacity: "1",
          transition: "opacity 0.2s ease",
        });
      }, 500);
    });
  });

  // Selecting the list-group element
  let $listGroup = $(".list-group");
  let $chevronDown = $("#chevron-down");
  let $dropdown = $(".dropdown");

  $dropdown.on("click", function () {
    // Toggle the display style
    if ($listGroup.css("display") === "flex") {
      $listGroup.css("display", "none");
    } else {
      $listGroup.css("display", "flex");
    }

    // Toggle the chevron rotation class
    $chevronDown.toggleClass("chevron-rotate");
  });

  // Event listener to ensure visibility on larger screens
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 768) {
      $listGroup.css("display", "flex"); // Ensure visibility on larger screens
    }
  });
  window.addEventListener("message", function (event) {
    if (event.data.formSaved) {
      frappe.show_alert(
        {
          message: __("Feedback Submitted Successfully"),
          indicator: "green",
        },
        4,
      );
      // Change the badge from Pending to Submitted
      const $activeRow = $(
        ".custom-employee-row[style*='background-color: rgb(235, 238, 240)']",
      );
      const $pendingBadge = $activeRow.find(".custom-pending-btn");

      if ($pendingBadge.length) {
        $pendingBadge
          .removeClass("custom-pending-btn")
          .addClass("custom-submitted-btn");
        $pendingBadge.html(`
          Submitted
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-person-check-fill" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M15.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L12.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
            <path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
          </svg>
        `);
      }

      // Update the data attribute
      $activeRow.data("is_submitted", "True");
    }
  });
});
