const { seg, lerp, eo, ei, eio } = kit;
// ==== Next PMS shell v1.7 ====
// Measured from the running app at its 2023 px desktop width and drawn in a 1440x900 window.
// Sidebar 240 wide, top bar 57 high, filter row at y 71. Right-anchored x = app x - 2023 + 1440.
// Ghost shapes: text = 10 px pill r5 (secondary 8 px r4), icon = 14 px square r4, buttons keep their real box.
// Breadcrumb is a Landmark (real words, muted, no icons). Everything else in the shell is Ghost.
// projects-list: Create view and its divider sit in the hidden `.pms-sh-changed` group, which a scene shows when
// the list gets unsaved changes. Its Ghost filters are narrower than the app's so they fit the 1440 window.
const SHELL = (() => {
  const g = (x, y, w, h, r) => '<div style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;background:var(--color-surface-gray-3)"></div>';
  const txt = (x, cy, w) => g(x, cy - 5, w, 10, 5);
  const ico = (x, y) => g(x + 1, y + 1, 14, 14, 4);
  const NAV = { dashboards: ['Dashboards', 73, [['Leadership', 73], ['Manager', 58]]], timesheet: ['Timesheet', 64, [['Personal', 57], ['Team', 36], ['Projects', 54]]], allocations: ['Allocations', 68, [['Team', 36], ['Projects', 54]]] };
  const PAGES = {
    personal: { group: 'timesheet', active: 'Personal', crumb: ['Timesheets', 'Personal'],
      buttons: [[1197, 123], [1329, 99, 'solid']],
      filters: [[260, 274], [542, 143]], right: [[1323, 97]] },
    team: { group: 'timesheet', active: 'Team', crumb: ['Timesheets', 'Team'],
      buttons: [[1197, 123], [1329, 99, 'solid']],
      filters: [[260, 174], [442, 198], [648, 143]], right: [[1323, 97]] },
    'project-timesheet': { group: 'timesheet', active: 'Projects', crumb: ['Timesheets', 'Project'],
      buttons: [[1197, 123], [1329, 99, 'solid']],
      filters: [[260, 174]], right: [[1323, 97]] },
    'alloc-team': { group: 'allocations', active: 'Team', crumb: ['Allocations', 'Team'],
      buttons: [[1294, 134, 'solid']],
      filters: [[260, 174], [442, 168], [618, 168], [794, 122], [924, 139]], right: [[1195, 28, 'icon'], [1227, 56, 'text'], [1287, 28, 'icon'], [1323, 97]] },
    'alloc-project': { group: 'allocations', active: 'Projects', crumb: ['Allocations', 'Project'],
      buttons: [[1294, 134, 'solid']],
      filters: [[260, 174], [442, 122], [572, 139]], right: [[1195, 28, 'icon'], [1227, 56, 'text'], [1287, 28, 'icon'], [1323, 97]] },
    'projects-kanban': { top: 'Projects', crumb: ['Projects', 'Kanban view'],
      buttons: [[1311, 117, 'solid']],
      filters: [[260, 176], [444, 176], [628, 112], [748, 90], [846, 84]], right: [[1323, 97]] },
    'projects-list': { top: 'Projects', crumb: ['Projects', 'List view'],
      buttons: [[1311, 117, 'solid']],
      filters: [[260, 160], [428, 160], [596, 95], [699, 90], [797, 84]], right: [[1044, 98], [1150, 165], [1323, 97]],
      changed: [[932.1, 94.5], 1034.5] },
    'dashboard-manager': { group: 'dashboards', active: 'Manager', crumb: ['Dashboard', 'Management'],
      buttons: [], filters: [], right: [] },
    'project-detail': { crumb: ['Projects', 'Atlas UI Stabilization'], buttons: [], filters: [], right: [] },
    tasks: { top: 'Tasks', crumb: ['Tasks'],
      buttons: [[1327, 101, 'solid']],
      filters: [[260, 176], [444, 176], [628, 176]], right: [[1065, 98], [1171, 144], [1323, 97]] },
  };
  // focus: { [buttonIndex]: html } replaces a top-bar ghost button with the scene's own Focus element.
  // focus.cv (projects-list) replaces the hidden Create view ghost.
  return (page, focus) => {
    const P = PAGES[page], F = focus || {};
    let s = '<div style="position:absolute;left:0;top:0;width:240px;height:900px;background:var(--color-surface-menu-bar);border-right:1px solid var(--color-outline-gray-1);box-sizing:border-box">';
    s += g(16, 16, 32, 32, 8) + txt(56, 23.5, 66) + g(56, 37, 56, 8, 4) + ico(208, 24);
    [[64, 46, 'Search'], [92, 83, 'Notifications'], [120, 54, 'Projects'], [148, 38, 'Tasks']].forEach(([y, w, name]) => {
      if (name === P.top) s += '<div style="position:absolute;left:8px;top:' + y + 'px;width:223px;height:28px;border-radius:8px;background:var(--color-surface-white);box-shadow:0 0 0 1px var(--color-outline-gray-1)"></div>';
      s += ico(16, y + 6) + txt(40, y + 14, w);
    });
    let y = 196;
    for (const key of ['dashboards', 'timesheet', 'allocations']) {
      const label = key === 'dashboards' ? ['Dashboards', 73] : NAV[key].slice(0, 2);
      s += ico(24, y + 6) + txt(44, y + 14, label[1]);
      if (key === P.group) {
        NAV[key][2].forEach(([name, w], i) => {
          const iy = y + 28 + 30 * i;
          if (name === P.active) s += '<div style="position:absolute;left:8px;top:' + iy + 'px;width:223px;height:28px;border-radius:8px;background:var(--color-surface-white);box-shadow:0 0 0 1px var(--color-outline-gray-1)"></div>';
          s += ico(32, iy + 6) + txt(56, iy + 14, w);
          if (i === NAV[key][2].length - 1) y = iy;
        });
      }
      y += 48;
    }
    s += ico(24, 834) + txt(48, 842, 28) + ico(24, 870) + txt(48, 878, 53) + '</div>';
    // top bar
    s += '<div style="position:absolute;left:240px;right:0;top:56px;height:1px;background:var(--color-outline-gray-1)"></div>';
    const c = P.crumb;
    s += '<div style="position:absolute;left:257px;top:18px;display:flex;gap:7px;font-size:16px;font-weight:500;line-height:20px;color:var(--color-ink-gray-5);white-space:nowrap"><span>' + c[0] + '</span>' + (c.length > 1 ? '<span style="color:var(--color-ink-gray-4)">/</span><span style="margin-left:6px">' + c[1] + '</span>' : '') + '</div>';
    P.buttons.forEach(([x, w], i) => { s += F[i] || g(x, 14, w, 28, 8); });
    P.filters.forEach(([x, w]) => { s += g(x, 71, w, 28, 8); });
    P.right.forEach(([x, w, k]) => { s += k === 'icon' ? ico(x + 6, 77) : k === 'text' ? txt(x + 12, 85, w - 24) : g(x, 71, w, 28, 8); });
    if (P.changed) s += '<div class="pms-sh-changed" style="position:absolute;left:0;top:0;visibility:hidden">' + (F.cv || g(P.changed[0][0], 71, P.changed[0][1], 28, 8)) +
      '<div style="position:absolute;left:' + P.changed[1] + 'px;top:71px;width:1px;height:28px;background:var(--color-outline-gray-2)"></div></div>';
    return s;
  };
})();
// ==== end shell ====
const WEEKS = ['Oct 12 - 18', 'Oct 19 - 25', 'Oct 26 - Nov 1', 'Nov 2 - 8'];
const mix = (a, b, p) => 'color-mix(in srgb, var(--color-' + a + '), var(--color-' + b + ') ' + p * 100 + '%)';
const ic = (p, sz) => '<svg width="' + (sz || 16) + '" height="' + (sz || 16) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none">' + p + '</svg>';
const IC = {
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
};
const EDIT = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none"><path d="M8.47949 1.75C8.75549 1.75018 8.97949 1.97397 8.97949 2.25C8.97949 2.52603 8.75549 2.74982 8.47949 2.75H4.75C3.64543 2.75 2.75 3.64543 2.75 4.75V11.25C2.75 12.3546 3.64543 13.25 4.75 13.25H11.25C12.3546 13.25 13.25 12.3546 13.25 11.25V7.52051C13.2502 7.24451 13.474 7.02051 13.75 7.02051C14.026 7.02051 14.2498 7.24451 14.25 7.52051V11.25C14.25 12.9069 12.9069 14.25 11.25 14.25H4.75C3.09315 14.25 1.75 12.9069 1.75 11.25V4.75C1.75 3.09315 3.09315 1.75 4.75 1.75H8.47949ZM13.3965 1.89648C13.5918 1.70144 13.9083 1.70129 14.1035 1.89648C14.2985 2.09169 14.2985 2.40831 14.1035 2.60352L7.37109 9.33594C7.17589 9.53101 6.8593 9.53094 6.66406 9.33594C6.46884 9.14071 6.46892 8.82418 6.66406 8.62891L13.3965 1.89648Z" fill="currentColor"/></svg>';
const box = (x, y, w, h, r) => '<div class="pms-ghost" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px' + (r !== undefined ? ';border-radius:' + r + 'px' : '') + '"></div>';
const label = (x, y, txt, req) => '<div class="pms-label" style="left:' + x + 'px;top:' + y + 'px">' + txt + (req ? '<b>*</b>' : '') + '</div>';
const pill = (x, y, w, bg, ink, txt, cls) => '<div class="pms-pill' + (cls ? ' ' + cls : '') + '" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;background:var(--color-' + bg + ');color:var(--color-' + ink + ')">' + txt + '</div>';
const rule = (x, y, w) => '<div class="pms-abs" style="left:' + x + 'px;width:' + w + 'px;top:' + y + 'px;height:1px;background:var(--color-outline-gray-1)"></div>';
// Rows are 61 px (60 plus the 1 px header border) and the Add member row is 41. Header cells share one layout: name line at y 12, subtext line at y 35.
// Orion Release Readiness is expanded at y 175, its members sit one indent deeper (pl-8 instead of pl-3 with a chevron).
const name = (y, text, w) => text ? '<div class="pms-abs" style="left:296px;top:' + (y + 12) + 'px;color:var(--color-ink-gray-4)">' + text + '</div>' : box(296, y + 15, w, 11, 5);
const head = (y, text, w, chev, r) => rule(240, y + 60, 240) + (chev ? box(252, y + 12.5, 16, 16, 4) : '') + box(272, y + 12.5, 16, 16, r) + name(y, text, w) + box(296, y + 35.5, 110, 9, 4);
// Julian Andrews' allocation on Orion Release Readiness, Mon Oct 19 to Fri Oct 23 at 8h/day. Saving 4h/day on Thu and Fri splits it in two.
const BAR_L = 748, BAR_Y = 250, COL = 38;
const barW = (n) => n * COL - 4;
const T = { hover: 1.3, card: 1.7, edit: 2.6, open: 2.65, sched: 4.3, thu: 5.8, fri: 6.9, slide: 8.3, save: 9.95, close: 10.0, grid: 11.0 };
// Edit allocation opens top-anchored at y 120. Edit schedule is 360 wide, centred, and grows 35 px with each summary row.
const DLG_L = 464, DLG_TOP = 120;
const ES_L = 540, ES_W = 360;
const esH = (rows) => 268 + 35 * rows + 1 + 34;
const esTop = (rows) => (900 - esH(rows)) / 2;
const CHIPS = [['Mon', 19], ['Tue', 20], ['Wed', 21], ['Thu', 22], ['Fri', 23]];
kit.scene('edit-schedule-project', {
  init(kit) {
    const side = SHELL('alloc-project');
    let grid = '<div class="pms-abs" style="left:480px;right:0;top:236px;height:162px;background:' + mix('surface-gray-1', 'surface-white', 0.5) + '"></div><div class="pms-abs" style="left:240px;right:0;top:113px;height:1px;background:var(--color-outline-gray-1)"></div>' + box(257, 136, 72, 14, 5);
    for (let w = 0; w < 4; w++) {
      const x0 = 480 + 266 * w;
      grid += '<div class="pms-abs" style="left:' + (x0 + 190) + 'px;top:144px;width:76px;height:756px;border-radius:8px 8px 0 0;background:var(--color-surface-gray-1)"></div><div class="pms-abs" style="left:' + x0 + 'px;top:114px;width:1px;height:786px;background:var(--color-outline-gray-1)"></div>';
      grid += '<div class="pms-abs" style="left:' + x0 + 'px;top:120px;width:266px;text-align:center;font-size:12px;color:var(--color-ink-gray-4)">' + WEEKS[w] + '</div>';
    }
    for (let d = 0; d < 28; d++) {
      const n = d < 20 ? 12 + d : d - 19;
      grid += '<div class="pms-abs" style="left:' + (480 + COL * d) + 'px;top:150px;width:38px;text-align:center;font-size:13px;color:var(--color-ink-gray-4)">' + n + '</div>';
    }
    // the project row sums its members' weeks, so Ananya's two weeks are Ghost bars
    grid += rule(240, 175, 1200) + head(175, 'Orion Release Readiness', 0, true, 4);
    for (let w = 1; w < 4; w++) {
      const x = 480 + 266 * w + 2;
      grid += w === 1 ? pill(x, 189, barW(5), 'surface-blue-2', 'ink-blue-3', '40h / week', 'at-sum1') + pill(x + 3 * COL, 189, barW(2), 'surface-blue-2', 'ink-blue-3', '8h / week', 'at-sum2') : box(x, 189, 186, 32);
    }
    grid += head(236, 'Julian Andrews', 0, false, 8) + head(297, '', 130, false, 8) + box(BAR_L + 7 * COL, 311, barW(12), 32);
    grid += '<div class="pms-abs" style="left:272px;top:370px;height:16px;display:flex;align-items:center;gap:8px;font-weight:500;line-height:16px;white-space:nowrap">' + ic(IC.plus) + 'Add member</div>' + rule(240, 398, 240);
    for (let i = 0; i < 4; i++) {
      const y = 398 + 61 * i;
      grid += head(y, '', 96 + i * 13, true, 4);
      for (let w = 0; w < 4; w++) if ((w + i) % 3 !== 2) grid += box(480 + 266 * w + 2, y + 14, 186, 32);
    }
    // Julian's allocation bar, then the two bars the saved schedule splits it into
    const barCss = 'top:' + BAR_Y + 'px;height:32px;border-radius:9px;background:var(--color-surface-white);box-shadow:0 0 1px rgba(0,0,0,.14), 0 1px 3px rgba(0,0,0,.14);box-sizing:border-box;display:flex;align-items:center;padding:0 10px;font-size:13px;font-weight:500;color:var(--color-ink-gray-5);white-space:nowrap';
    const lab = (s) => '<span style="min-width:0;overflow:hidden;text-overflow:ellipsis">' + s + '</span>';
    const handle = (cls, edge) => '<span class="pms-abs ' + cls + '" style="' + edge + ':4px;top:8px;width:2px;height:16px;border-radius:2px;background:var(--color-surface-gray-4)"></span>';
    const bar = '<div class="pms-abs at-bar" style="left:' + BAR_L + 'px;width:' + barW(5) + 'px;' + barCss + '">' + lab('8h/day for 5 days') + handle('at-g1', 'left') + handle('at-g2', 'right') + '</div>' +
      '<div class="pms-abs at-seg1" style="left:' + BAR_L + 'px;width:' + barW(3) + 'px;' + barCss + '">' + lab('8h/day for 3 days') + '</div>' +
      '<div class="pms-abs at-seg2" style="left:' + (BAR_L + 3 * COL) + 'px;width:' + barW(2) + 'px;' + barCss + '">' + lab('4h/day for 2 days') + '</div>';
    // hover card: 280 wide, 4 px under the bar, left edges aligned. On this page it opens with the member (avatar and name) where the Team page shows the project. Only its edit icon is Focus.
    const crow = (y, w) => box(13, y + 1, 14, 14, 4) + box(36, y + 3, w, 10, 5);
    const card = '<div class="pms-abs at-card" style="left:' + BAR_L + 'px;top:' + (BAR_Y + 36) + 'px;width:280px;height:146px;border-radius:16px;background:var(--color-surface-modal);box-shadow:0 25px 50px -12px rgba(0,0,0,.25);transform-origin:0 0">' +
      '<span class="pms-av" style="position:absolute;left:12px;top:12px">J</span><div class="pms-abs" style="left:36px;top:12px;font-size:14px;font-weight:500;line-height:16px;color:var(--color-ink-gray-7)">Julian Andrews</div>' + box(253, 13, 14, 14, 4) +
      crow(40, 176) + crow(66, 109) + crow(92, 129) +
      '<div class="pms-ghost" style="left:12px;top:118px;width:16px;height:16px;border-radius:50%"></div>' + box(36, 121, 102, 10, 5) +
      '<div class="pms-abs at-pen" style="left:228px;top:118px;color:var(--color-ink-gray-6);display:flex">' + EDIT + '</div>' +
      box(253, 119, 14, 14, 4) + '</div>';
    // Edit allocation dialog: on this page Project comes first, then Customer, then Employee. Edit Schedule (14 px, right edge 14 px in, on the date label's line) is Focus.
    const lab10 = (x, y, w) => box(x, y, w, 10, 5);
    const dlg = '<div class="pms-abs at-dov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)"></div><div class="pms-dialog at-dlg" style="left:' + DLG_L + 'px;top:' + DLG_TOP + 'px;height:724px;border-radius:16px">' +
      '<div class="pms-abs" style="left:14px;top:18px;font-size:16px;font-weight:500;color:var(--color-ink-gray-7)">Edit allocation</div><div class="pms-abs" style="right:22px;top:20px;color:var(--color-ink-gray-9)">' + ic(IC.x) + '</div>' +
      lab10(14, 61, 56) + box(14, 83, 484, 32) + lab10(14, 132, 64) + box(14, 153, 484, 32) + lab10(14, 202, 70) + box(14, 223, 484, 32) + lab10(14, 272, 76) + box(14, 294, 484, 28, 10) + box(14, 342, 100, 10, 5) +
      box(14, 362, 14, 14, 4) + lab10(34, 364, 110) + box(14, 384, 14, 14, 4) + lab10(34, 386, 104) +
      label(14, 410, 'Start and end date', 1) + '<div class="pms-abs at-esb" style="right:14px;top:410px;font-size:14px;color:var(--color-ink-gray-5);white-space:nowrap">Edit Schedule</div>' +
      '<div class="pms-input on" style="left:14px;top:434px;width:484px;height:28px">Oct 19, 2026 - Oct 23, 2026<span style="margin-left:auto;color:var(--color-ink-gray-6);display:flex">' + ic(IC.cal) + '</span></div>' +
      lab10(14, 481, 76) + box(14, 502, 237, 32) + lab10(261, 481, 72) + box(261, 502, 237, 32) +
      box(14, 554, 14, 14, 4) + lab10(34, 556, 130) + lab10(14, 588, 40) + box(14, 607, 484, 61) + box(24, 690, 14, 14, 4) + lab10(44, 692, 110) + box(300, 683, 70, 28) + box(378, 683, 110, 28) + '</div>';
    // Edit schedule dialog. Positions are relative to the dialog, which re-centres as the summary grows.
    let chips = '';
    CHIPS.forEach(([d, n], i) => {
      chips += '<div class="pms-abs at-chip' + i + '" style="left:' + (14 + 46 * i) + 'px;top:79px;width:42px;height:47px;border-radius:12px;background:var(--color-surface-gray-1)">' +
        '<div class="pms-abs at-cd' + i + '" style="left:0;top:8px;width:42px;text-align:center;font-size:11px;line-height:13px;color:var(--color-ink-gray-4)">' + d + '</div>' +
        '<div class="pms-abs at-cn' + i + '" style="left:0;top:23px;width:42px;text-align:center;font-size:14px;line-height:16px;font-weight:500;color:var(--color-ink-gray-6)">' + n + '</div>' +
        (i === 0 ? '<div class="pms-abs" style="left:8px;top:41px;width:27px;height:12px;border-radius:5px;background:var(--color-surface-white);text-align:center;font-size:9px;line-height:12px;color:var(--color-ink-gray-5)">OCT</div>' : '') + '</div>';
    });
    const es = '<div class="pms-abs at-es" style="left:' + ES_L + 'px;top:281px;width:' + ES_W + 'px;height:338px;background:var(--color-surface-modal);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.18);transform-origin:50% 50%">' +
      '<div class="pms-abs" style="left:14px;top:18px;font-size:16px;font-weight:500;color:var(--color-ink-gray-7)">Edit schedule</div><div class="pms-abs" style="left:322px;top:20px;color:var(--color-ink-gray-9);display:flex">' + ic(IC.x) + '</div>' +
      label(14, 54, 'Select dates to edit') + '<div class="pms-abs at-rng" style="right:14px;top:54px;color:var(--color-ink-gray-5)">Oct 19 - 23</div>' + chips +
      label(14, 150, 'Edit hours / day', 1) +
      '<div class="pms-abs at-hs" style="left:14px;top:172px;width:162px;height:28px;border-radius:8px;background:var(--color-surface-white);box-shadow:0 0 0 1px var(--color-outline-gray-2);overflow:hidden"><div class="pms-abs at-hf" style="left:0;top:0;height:28px;width:162px;background:var(--color-surface-gray-3);border-radius:8px"><span class="pms-abs" style="right:8px;top:8px;width:2px;height:12px;border-radius:2px;background:color-mix(in srgb, var(--color-surface-gray-7) 9%, transparent)"></span></div><span class="pms-abs at-hv" style="right:10px;top:0;width:40px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;font-variant-numeric:tabular-nums">04:00</span></div>' +
      '<div class="pms-abs" style="left:184px;top:150px;display:flex;align-items:center;gap:6px"><span class="pms-label" style="position:static">Edit total hours<b>*</b></span><span style="width:12px;height:12px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-4)">' + ic(IC.info, 10) + '</span></div>' +
      '<div class="pms-input on at-tin" style="left:184px;top:172px;width:162px;height:28px;padding-left:8px"><span class="at-tv"></span></div>' +
      label(14, 218, 'Schedule summary') +
      '<div class="pms-abs at-tab" style="left:14px;top:240px;width:332px;border:1px solid var(--color-outline-gray-2);border-radius:8px;overflow:hidden;box-sizing:border-box"></div>' +
      '<div class="pms-abs at-foot" style="left:0;top:296px;width:360px;height:28px">' + box(168, 0, 62, 28) + '<div class="pms-btn pms-btn-solid at-sc" style="left:238px;top:0;width:108px">Save changes</div></div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam at-cam"><div class="pms-win">' + side + grid + bar + card + dlg + es + '<div class="pms-ring at-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.at-' + c);
    for (const k of ['cam', 'bar', 'g1', 'g2', 'seg1', 'seg2', 'sum1', 'sum2', 'card', 'pen', 'dov', 'dlg', 'esb', 'es', 'rng', 'hs', 'hf', 'hv', 'tin', 'tv', 'tab', 'foot', 'sc', 'ring']) this[k] = q(k);
    this.chip = CHIPS.map((_, i) => [q('chip' + i), q('cd' + i), q('cn' + i)]);
    this.tabKey = '';
    // the Edit Schedule ring follows the text's real box
    const wr = kit.stage.querySelector('.pms-win').getBoundingClientRect(), k = wr.width / 1440, br = this.esb.getBoundingClientRect();
    this.esbBox = k > 0 && br.width > 0 ? [(br.left - wr.left) / k, (br.top - wr.top) / k, br.width / k, br.height / k] : [DLG_L + 407, DLG_TOP + 410, 91, 17];
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 960, cy: 540, z: 1.12, hold: 0.4 },
      { t: 1.15, cx: 1070, cy: 430, z: 1.6, hold: 1.5, drift: [1.5, 0, 0.003] },
      { t: 3.3, cx: 960, cy: 520, z: 1.6, hold: 1.05 },
      { t: 5.0, cx: 960, cy: 540, z: 2.2, hold: 5.1, drift: [0, 0.8, 0.002] },
      { t: 10.9, cx: 1000, cy: 382, z: 1.9, drift: [-1.5, 0, 0.003] },
    ]);
    // cursor keys in scene px (window + 240, 90)
    const sc = (x, y) => [x + 240, y + 90];
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1500, 900] }, { t: 0.55, at: [1500, 900] }, { t: T.hover, at: sc(830, 266) },
      { t: 1.85, at: sc(830, 266) }, { t: 2.45, at: sc(984, 412) },
      { t: 3.5, at: sc(984, 412) }, { t: 4.15, at: sc(916, 538) },
      { t: 5.05, at: sc(916, 538) }, { t: 5.65, at: sc(ES_L + 173, esTop(1) + 102) },
      { t: 6.35, at: sc(ES_L + 173, esTop(1) + 102) }, { t: 6.8, at: sc(ES_L + 219, esTop(3) + 102) },
      { t: 7.55, at: sc(ES_L + 219, esTop(3) + 102) }, { t: 8.15, at: sc(ES_L + 95, esTop(2) + 186) },
      { t: 9.3, at: sc(ES_L + 95, esTop(2) + 186) }, { t: 9.85, at: sc(ES_L + 292, esTop(2) + 345) },
      { t: 10.3, at: sc(ES_L + 292, esTop(2) + 345) }, { t: 11.1, at: sc(1110, 400) }, { t: 14.2, at: sc(1116, 404) },
    ];
    this.cur.clicks = [T.edit, T.sched, T.thu, T.fri, T.slide, T.save];
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    // grid: the allocation until the saved schedule reloads the row, then its two bars
    const split = t >= T.grid;
    this.bar.style.visibility = split ? 'hidden' : 'visible';
    this.seg1.style.visibility = this.seg2.style.visibility = split ? 'visible' : 'hidden';
    const hov = seg(t, T.hover, T.hover + 0.1) * (1 - seg(t, T.open, T.open + 0.1));
    this.g1.style.opacity = this.g2.style.opacity = hov;
    // the project row re-sums the week: 24h Mon to Wed, 8h Thu to Fri
    this.sum1.style.width = barW(split ? 3 : 5) + 'px';
    this.sum1.textContent = split ? '24h / week' : '40h / week';
    this.sum2.style.visibility = split ? 'visible' : 'hidden';
    // hover card: rest 0.4 s on the bar, scale-fade from its top-left corner, gone when the dialog opens
    const c = eo(seg(t, T.card, T.card + 0.2)) * (1 - seg(t, T.open, T.open + 0.12));
    this.card.style.opacity = c;
    this.card.style.visibility = c > 0 ? 'visible' : 'hidden';
    this.card.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, T.card, T.card + 0.2))) + ')';
    // Edit allocation dialog, then Edit schedule in its place (backdrop stays)
    const bd = eo(seg(t, T.open, T.open + 0.22)) * (1 - seg(t, T.close, T.close + 0.2));
    this.dov.style.opacity = bd;
    const d = eo(seg(t, T.open, T.open + 0.22)) * (t < T.sched + 0.05 ? 1 : 0);
    this.dlg.style.opacity = d;
    this.dlg.style.visibility = d > 0 ? 'visible' : 'hidden';
    this.dlg.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, T.open, T.open + 0.22))) + ')';
    const e = eo(seg(t, T.sched + 0.05, T.sched + 0.27)) * (1 - seg(t, T.close, T.close + 0.2));
    this.es.style.opacity = e;
    this.es.style.visibility = e > 0 ? 'visible' : 'hidden';
    this.es.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, T.sched + 0.05, T.sched + 0.27))) + ')';
    // schedule state
    const thu = t >= T.thu, fri = t >= T.fri, two = t >= T.slide;
    const sel = [false, false, false, thu, fri];
    this.chip.forEach(([b, dn, nn], i) => {
      const on = sel[i] ? eio(seg(t, i === 3 ? T.thu : T.fri, (i === 3 ? T.thu : T.fri) + 0.15)) : 0;
      b.style.background = on > 0.5 ? 'var(--color-surface-gray-7)' : 'var(--color-surface-gray-1)';
      dn.style.color = on > 0.5 ? 'var(--color-ink-gray-3)' : 'var(--color-ink-gray-4)';
      nn.style.color = on > 0.5 ? 'var(--color-ink-white)' : 'var(--color-ink-gray-6)';
    });
    // summary rows: [range, hours / day, total, 0 untouched, 1 selected and unchanged, 2 selected and changed]
    const rows = !thu ? [['Oct 19 - 23', '8h/day', '40 hours', 0]]
      : !fri ? [['Oct 19 - 21', '8h/day', '24 hours', 0], ['Oct 22', '8h/day', '8 hours', 1], ['Oct 23', '8h/day', '8 hours', 0]]
      : !two ? [['Oct 19 - 21', '8h/day', '24 hours', 0], ['Oct 22 - 23', '8h/day', '16 hours', 1]]
      : [['Oct 19 - 21', '8h/day', '24 hours', 0], ['Oct 22 - 23', '4h/day', '8 hours', 2]];
    const key = rows.map((r) => r.join('|')).join('/');
    if (key !== this.tabKey) {
      this.tabKey = key;
      this.tab.innerHTML = rows.map((r, i) => '<div style="position:relative;height:35px;' + (i < rows.length - 1 ? 'border-bottom:1px solid var(--color-outline-gray-2);' : '') + (r[3] ? 'background:var(--color-surface-gray-3);' : '') + (r[3] === 1 ? 'opacity:.5;' : '') + 'font-size:14px;box-sizing:border-box">' +
        '<span class="pms-abs" style="left:8px;top:9px;color:var(--color-ink-gray-6)">' + r[0] + '</span><span class="pms-abs" style="left:164px;top:0;width:1px;height:35px;background:var(--color-outline-gray-2)"></span>' +
        '<span class="pms-abs" style="left:173px;top:9px;white-space:nowrap;color:var(--color-ink-gray-6)">' + r[1] + '<span style="color:var(--color-ink-gray-5)"> · ' + r[2] + '</span></span></div>').join('');
    }
    const n = rows.length, top = esTop(n);
    this.es.style.top = top + 'px';
    this.es.style.height = esH(n) + 'px';
    this.tab.style.height = 35 * n + 2 + 'px';
    this.foot.style.top = 240 + 35 * n + 1 + 20 + 'px';
    this.rng.textContent = !thu ? 'Oct 19 - 23' : !fri ? 'Oct 22' : 'Oct 22 - 23';
    // both inputs are disabled until a day is selected
    const hrs = two ? 4 : 8;
    this.hs.style.opacity = thu ? 1 : 0.9;
    this.hf.style.width = 162 * hrs / 8 + 'px';
    this.hv.textContent = '0' + hrs + ':00';
    this.hv.style.color = thu ? 'var(--color-ink-gray-8)' : 'var(--color-ink-gray-3)';
    this.tin.style.background = thu ? 'var(--color-surface-white)' : 'var(--color-surface-gray-1)';
    this.tv.textContent = !thu ? '' : String(hrs * (fri ? 2 : 1));
    // button presses (dip to 96%)
    const press = (a) => 1 - 0.04 * seg(t, a - 0.05, a) * (1 - seg(t, a, a + 0.12));
    this.pen.style.transform = 'scale(' + press(T.edit) + ')';
    this.esb.style.transform = 'scale(' + press(T.sched) + ')';
    this.sc.style.transform = 'scale(' + press(T.save) + ')';
    this.sc.style.background = t >= 9.85 && t < T.close ? 'var(--color-surface-gray-6)' : 'var(--color-surface-gray-7)';
    // one highlight ring at a time, 5 px outside the target (window px)
    const rr = (a, b, x, y, w, h) => [a, b, x - 5, y - 5, w + 10, h + 10];
    const RINGS = [
      rr(0.9, 1.85, BAR_L, BAR_Y, barW(5), 32),
      rr(2.05, 2.75, 976, 404, 16, 16),
      rr(3.45, 4.4, ...this.esbBox),
      rr(5.1, T.thu + 0.05, ES_L + 152, esTop(1) + 79, 42, 47),
      rr(T.thu + 0.35, T.fri + 0.05, ES_L + 198, esTop(3) + 79, 42, 47),
      rr(7.4, T.slide + 0.6, ES_L + 14, esTop(2) + 172, 162, 28),
      rr(9.25, T.save + 0.05, ES_L + 238, esTop(2) + 331, 108, 28),
      rr(T.grid, 99, BAR_L, 189, barW(5), BAR_Y + 32 - 189),
    ];
    let g = null;
    for (const x of RINGS) if (t >= x[0] && t < x[1]) g = x;
    const s = this.ring.style;
    if (g) {
      s.left = g[2] + 'px'; s.top = g[3] + 'px'; s.width = g[4] + 'px'; s.height = g[5] + 'px';
      s.opacity = Math.min(eo(seg(t, g[0], g[0] + 0.25)), 1 - seg(t, g[1] - 0.15, g[1]));
    } else s.opacity = 0;
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
