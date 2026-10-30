// ==== Next PMS shell v1 ====
// Measured from the running app at its 2023 px desktop width and drawn in a 1440x900 window.
// Sidebar 240 wide, top bar 57 high, filter row at y 71. Right-anchored x = app x - 2023 + 1440.
// Ghost shapes: text = 10 px pill r5 (secondary 8 px r4), icon = 14 px square r4, buttons keep their real box.
// Breadcrumb is a Landmark (real words, muted, no icons). Everything else in the shell is Ghost.
// projects-list: Create view and its divider sit in the hidden `.pms-sh-changed` group, which a scene shows when
// the list gets unsaved changes. Its Ghost filters are narrower than the app's so they fit the 1440 window.
const SHELL = (() => {
  const g = (x, y, w, h, r) =>
    '<div style="position:absolute;left:' +
    x +
    "px;top:" +
    y +
    "px;width:" +
    w +
    "px;height:" +
    h +
    "px;border-radius:" +
    r +
    'px;background:var(--color-surface-gray-3)"></div>';
  const txt = (x, cy, w) => g(x, cy - 5, w, 10, 5);
  const ico = (x, y) => g(x + 1, y + 1, 14, 14, 4);
  const NAV = {
    dashboards: [
      "Dashboards",
      73,
      [
        ["Leadership", 73],
        ["Manager", 58],
      ],
    ],
    timesheet: [
      "Timesheet",
      64,
      [
        ["Personal", 57],
        ["Team", 36],
        ["Projects", 54],
      ],
    ],
    allocations: [
      "Allocations",
      68,
      [
        ["Team", 36],
        ["Projects", 54],
      ],
    ],
  };
  const PAGES = {
    personal: {
      group: "timesheet",
      active: "Personal",
      crumb: ["Timesheets", "Personal"],
      buttons: [
        [1197, 123],
        [1329, 99, "solid"],
      ],
      filters: [
        [260, 274],
        [542, 143],
      ],
      right: [[1323, 97]],
    },
    team: {
      group: "timesheet",
      active: "Team",
      crumb: ["Timesheets", "Team"],
      buttons: [
        [1197, 123],
        [1329, 99, "solid"],
      ],
      filters: [
        [260, 174],
        [442, 198],
        [648, 143],
      ],
      right: [[1323, 97]],
    },
    "project-timesheet": {
      group: "timesheet",
      active: "Projects",
      crumb: ["Timesheets", "Project"],
      buttons: [
        [1197, 123],
        [1329, 99, "solid"],
      ],
      filters: [[260, 174]],
      right: [[1323, 97]],
    },
    "alloc-team": {
      group: "allocations",
      active: "Team",
      crumb: ["Allocations", "Team"],
      buttons: [[1294, 134, "solid"]],
      filters: [
        [260, 174],
        [442, 168],
        [618, 168],
        [794, 122],
        [924, 139],
      ],
      right: [
        [1195, 28, "icon"],
        [1227, 56, "text"],
        [1287, 28, "icon"],
        [1323, 97],
      ],
    },
    "alloc-project": {
      group: "allocations",
      active: "Projects",
      crumb: ["Allocations", "Project"],
      buttons: [[1294, 134, "solid"]],
      filters: [
        [260, 174],
        [442, 122],
        [572, 139],
      ],
      right: [
        [1195, 28, "icon"],
        [1227, 56, "text"],
        [1287, 28, "icon"],
        [1323, 97],
      ],
    },
    "projects-kanban": {
      top: "Projects",
      crumb: ["Projects", "Kanban view"],
      buttons: [[1311, 117, "solid"]],
      filters: [
        [260, 176],
        [444, 176],
        [628, 112],
        [748, 90],
        [846, 84],
      ],
      right: [[1323, 97]],
    },
    "projects-list": {
      top: "Projects",
      crumb: ["Projects", "List view"],
      buttons: [[1311, 117, "solid"]],
      filters: [
        [260, 160],
        [428, 160],
        [596, 95],
        [699, 90],
        [797, 84],
      ],
      right: [
        [1044, 98],
        [1150, 165],
        [1323, 97],
      ],
      changed: [[932.1, 94.5], 1034.5],
    },
    "dashboard-manager": {
      group: "dashboards",
      active: "Manager",
      crumb: ["Dashboard", "Management"],
      buttons: [],
      filters: [],
      right: [],
    },
    "project-detail": {
      crumb: ["Projects", "Atlas UI Stabilization"],
      buttons: [],
      filters: [],
      right: [],
    },
    tasks: {
      top: "Tasks",
      crumb: ["Tasks"],
      buttons: [[1327, 101, "solid"]],
      filters: [
        [260, 176],
        [444, 176],
        [628, 176],
      ],
      right: [
        [1065, 98],
        [1171, 144],
        [1323, 97],
      ],
    },
  };
  // focus: { [buttonIndex]: html } replaces a top-bar ghost button with the scene's own Focus element.
  // focus.cv (projects-list) replaces the hidden Create view ghost.
  return (page, focus) => {
    const P = PAGES[page],
      F = focus || {};
    let s =
      '<div style="position:absolute;left:0;top:0;width:240px;height:900px;background:var(--color-surface-menu-bar);border-right:1px solid var(--color-outline-gray-1);box-sizing:border-box">';
    s +=
      g(16, 16, 32, 32, 8) +
      txt(56, 23.5, 66) +
      g(56, 37, 56, 8, 4) +
      ico(208, 24);
    [
      [64, 46, "Search"],
      [92, 83, "Notifications"],
      [120, 54, "Projects"],
      [148, 38, "Tasks"],
    ].forEach(([y, w, name]) => {
      if (name === P.top)
        s +=
          '<div style="position:absolute;left:8px;top:' +
          y +
          'px;width:223px;height:28px;border-radius:8px;background:var(--color-surface-white);box-shadow:0 0 0 1px var(--color-outline-gray-1)"></div>';
      s += ico(16, y + 6) + txt(40, y + 14, w);
    });
    let y = 196;
    for (const key of ["dashboards", "timesheet", "allocations"]) {
      const label =
        key === "dashboards" ? ["Dashboards", 73] : NAV[key].slice(0, 2);
      s += ico(24, y + 6) + txt(44, y + 14, label[1]);
      if (key === P.group) {
        NAV[key][2].forEach(([name, w], i) => {
          const iy = y + 28 + 30 * i;
          if (name === P.active)
            s +=
              '<div style="position:absolute;left:8px;top:' +
              iy +
              'px;width:223px;height:28px;border-radius:8px;background:var(--color-surface-white);box-shadow:0 0 0 1px var(--color-outline-gray-1)"></div>';
          s += ico(32, iy + 6) + txt(56, iy + 14, w);
          if (i === NAV[key][2].length - 1) y = iy;
        });
      }
      y += 48;
    }
    s +=
      ico(24, 834) +
      txt(48, 842, 28) +
      ico(24, 870) +
      txt(48, 878, 53) +
      "</div>";
    // top bar
    s +=
      '<div style="position:absolute;left:240px;right:0;top:56px;height:1px;background:var(--color-outline-gray-1)"></div>';
    const c = P.crumb;
    s +=
      '<div style="position:absolute;left:257px;top:18px;display:flex;gap:7px;font-size:16px;font-weight:500;line-height:20px;color:var(--color-ink-gray-5);white-space:nowrap"><span>' +
      c[0] +
      "</span>" +
      (c.length > 1
        ? '<span style="color:var(--color-ink-gray-4)">/</span><span style="margin-left:6px">' +
          c[1] +
          "</span>"
        : "") +
      "</div>";
    P.buttons.forEach(([x, w], i) => {
      s += F[i] || g(x, 14, w, 28, 8);
    });
    P.filters.forEach(([x, w]) => {
      s += g(x, 71, w, 28, 8);
    });
    P.right.forEach(([x, w, k]) => {
      s +=
        k === "icon"
          ? ico(x + 6, 77)
          : k === "text"
            ? txt(x + 12, 85, w - 24)
            : g(x, 71, w, 28, 8);
    });
    if (P.changed)
      s +=
        '<div class="pms-sh-changed" style="position:absolute;left:0;top:0;visibility:hidden">' +
        (F.cv || g(P.changed[0][0], 71, P.changed[0][1], 28, 8)) +
        '<div style="position:absolute;left:' +
        P.changed[1] +
        'px;top:71px;width:1px;height:28px;background:var(--color-outline-gray-2)"></div></div>';
    return s;
  };
})();
// ==== end shell ====
