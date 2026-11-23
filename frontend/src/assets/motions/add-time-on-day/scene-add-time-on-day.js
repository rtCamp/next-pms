const { seg, lerp, eo, ei, eio } = kit;
// ==== Next PMS shell v1 ====
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
const COLS = [916, 981, 1046, 1111, 1176, 1241, 1306];
const DATES = ['Oct 12', 'Oct 13', 'Oct 14', 'Oct 15', 'Oct 16', 'Oct 17', 'Oct 18'];
const PROJECT = 'Atlas UI Stabilization';
const TASKS = ['Cross-browser and responsiveness fixes', 'Design system component refinements', 'Client dashboard layout improvements'];
const PICK = 1;
const COMMENT = 'Button variant fixes';
const RED = 'var(--color-ink-red-4)';
const GREEN = 'var(--color-ink-green-4)';
const CHEV = '<path d="M11.3848 5.6582C11.5735 5.45686 11.8903 5.44622 12.0918 5.63477C12.2931 5.82353 12.3038 6.14033 12.1152 6.3418L8.36523 10.3418C8.27071 10.4426 8.1382 10.5 8 10.5C7.8618 10.5 7.72929 10.4426 7.63477 10.3418L3.88477 6.3418C3.69622 6.14033 3.70686 5.82353 3.9082 5.63477C4.10967 5.44622 4.42647 5.45686 4.61523 5.6582L8 9.26855L11.3848 5.6582Z" fill="currentColor"/>';
const FOLDER = '<path fill-rule="evenodd" clip-rule="evenodd" d="M10.023 2.5L8.43184 3.68632C8.25916 3.81507 8.04952 3.88462 7.83412 3.88462H2V12.5C2 13.0523 2.44772 13.5 3 13.5H13C13.5523 13.5 14 13.0523 14 12.5V2.5H10.023ZM9.49179 1.64872C9.6213 1.55216 9.77853 1.5 9.94008 1.5H14.35C14.709 1.5 15 1.79101 15 2.15V12.5C15 13.6046 14.1046 14.5 13 14.5H3C1.89543 14.5 1 13.6046 1 12.5V3.53462C1 3.17563 1.29102 2.88462 1.65 2.88462H7.83412L9.49179 1.64872Z" fill="currentColor"/>';
const TASKIC = '<g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1"><path d="M8 1.333V4m2.8 1.2 1.933-1.933M12 8h2.667M10.8 10.8l1.933 1.933M8 12v2.667m-4.733-1.934L5.2 10.8M1.333 8H4m-.733-4.733L5.2 5.2"/></g>';
const PLUS = '<path d="M7.99805 2.75C8.27402 2.7502 8.49805 2.97398 8.49805 3.25V7.49805H12.7451C13.0213 7.49805 13.2451 7.7219 13.2451 7.99805C13.2449 8.27402 13.0211 8.49805 12.7451 8.49805H8.49805V12.7451C8.49805 13.0211 8.27402 13.2449 7.99805 13.2451C7.7219 13.2451 7.49805 13.0213 7.49805 12.7451V8.49805H3.25C2.97398 8.49805 2.7502 8.27402 2.75 7.99805C2.75 7.7219 2.97386 7.49805 3.25 7.49805H7.49805V3.25C7.49805 2.97386 7.7219 2.75 7.99805 2.75Z" fill="currentColor"/>';
const XMARK = '<path fill="currentColor" d="M12.1494 3.14648C12.3446 2.95126 12.6612 2.95135 12.8564 3.14648C13.0517 3.34175 13.0517 3.65825 12.8564 3.85352L8.70898 8.00098L12.8574 12.1494C13.0526 12.3446 13.0526 12.6612 12.8574 12.8564C12.6622 13.0516 12.3456 13.0517 12.1504 12.8564L8.00195 8.70801L3.85352 12.8564C3.65825 13.0517 3.34175 13.0517 3.14648 12.8564C2.95135 12.6612 2.95126 12.3446 3.14648 12.1494L7.29492 8.00098L3.14746 3.85352C2.95228 3.65827 2.95228 3.34173 3.14746 3.14648C3.34271 2.95137 3.65927 2.95132 3.85449 3.14648L8.00195 7.29395L12.1494 3.14648Z"/>';
const CAL = '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>';
const DOWN = '<path d="m6 9 6 6 6-6"/>';
const i16 = (inner) => '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex:none;display:block">' + inner + '</svg>';
const s24 = (inner) => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;display:block">' + inner + '</svg>';
const cell = (x, txt, cls, sty) => '<div class="pms-cell ' + (cls || '') + '" style="left:' + (x - 268) + 'px;' + (sty || '') + '">' + txt + '</div>';
const bar = (x, y, w, h) => '<div class="pms-bar" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + (h || 10) + 'px"></div>';
const gh = (x, y, w, h, r) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;border-radius:' + r + 'px;background:var(--color-surface-gray-3)"></div>';
const dot = (x) => '<div class="pms-abs" style="left:' + (x - 242) + 'px;top:34px;width:4px;height:4px;border-radius:2px;background:var(--color-surface-amber-3)"></div>';
const SH = 'box-shadow:0 0 1px rgba(0,0,0,.19),0 1px 2px rgba(0,0,0,.07),0 6px 15px -5px rgba(0,0,0,.11)';
const lab = (x, y, txt, req, sz, extra) => '<div class="pms-abs" style="left:' + x + 'px;top:' + y + 'px;font-size:' + (sz || 14) + 'px;line-height:16px;font-weight:420;color:var(--color-ink-gray-5);white-space:nowrap;' + (extra || '') + '">' + txt + (req ? '<span style="color:var(--color-ink-red-3);margin-left:' + (sz === 13 ? 4 : 1) + 'px">*</span>' : '') + '</div>';
const field = (cls, x, y, w, h, inner, extra) => '<div class="pms-abs ' + cls + '" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;background:var(--color-surface-white);font-size:14px;font-weight:420;color:var(--color-ink-gray-7);' + (extra || '') + '">' + inner + '</div>';
const sel = (cls, y, icon, valCls, ph) => field(cls, 24, y, 464, 32, '<span class="pms-abs ' + valCls + '-ic" style="left:7px;top:7px;display:none;color:var(--color-ink-gray-7)">' + i16(icon) + '</span><span class="pms-abs ' + valCls + '" style="left:8px;top:0;line-height:30px;color:var(--color-ink-gray-4);white-space:nowrap">' + ph + '</span><span class="pms-abs" style="right:8px;top:7px;color:var(--color-ink-gray-4)">' + s24(DOWN) + '</span>');
const TIMES = { open: 1.8, rP: 2.1, rD: 2.8, rT: 3.5, cT: 4.15, panel: 4.2, cO: 4.9, rB: 5.1, press: 5.55, rel: 6.2, rC: 6.25, cC: 6.9, type: 7.05, rS: 8.3, cS: 8.85, close: 8.9, upd: 9.15, rR: 9.6 };
const RINGS = [
  [TIMES.rP - 1.2, 1.7, 1078, 231, 66, 38],
  [TIMES.rP, TIMES.rD, 483, 205, 474, 42],
  [TIMES.rD, TIMES.rT, 483, 345, 234, 42],
  [TIMES.rT, TIMES.cT + 0.1, 483, 275, 474, 42],
  [TIMES.rB, TIMES.press, 723, 344, 234, 42],
  [TIMES.rC, TIMES.cC, 483, 447, 474, 106],
  [TIMES.rS, TIMES.cS + 0.05, 719, 567.5, 238, 38],
  [TIMES.rR, 12.2, 1078, 231, 66, 38],
];
RINGS[0][0] = 0.9;
const fmt = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
kit.scene('add-time-on-day', {
  init(kit) {
    const side = SHELL('personal');
    let head = '<div class="pms-row" style="top:100px;height:40px">' + bar(32, 16, 130, 8);
    COLS.forEach((x) => { head += bar(x - 256, 16, 32, 8); });
    head += bar(1110, 16, 40, 8) + '</div>';
    let week = '<div class="pms-row" style="top:140px">' + gh(33, 14, 14, 14, 4) +
      '<div class="pms-abs" style="left:56px;top:12px;height:20px;display:flex;align-items:center;gap:8px;white-space:nowrap"><span style="font-size:14px;font-weight:500;line-height:16px;color:var(--color-ink-gray-5)">Oct 12 - 18, 2026</span>' + '<span style="display:block;width:86px;height:20px;border-radius:10px;background:var(--color-surface-gray-3)"></span>'+ '</div>';
    DATES.forEach((d, i) => { week += cell(COLS[i], d); });
    week += cell(1366, 'Total') + gh(1156, 8, 28, 28, 8) + '</div>';
    const vals = (kind) => {
      let r = '';
      COLS.forEach((x, i) => {
        const on = i < 5 && i !== 3;
        const col = kind === 'proj' ? 'var(--color-ink-gray-6)' : 'var(--color-ink-gray-8)';
        r += cell(x, on ? '08:00' : '-', i === 3 ? 'ad-thu-' + kind : '', 'color:' + (on ? col : 'var(--color-ink-gray-4)') + ';font-weight:' + (kind === 'all' && on ? '500' : '420'));
      });
      return r;
    };
    const tot = (kind, c) => cell(1366, '32:00', 'ad-tot-' + kind, 'color:' + c + ';font-weight:' + (kind === 'all' ? '500' : '420'));
    const all = '<div class="pms-row" style="top:184px">' + bar(48, 17, 120) + vals('all') + tot('all', RED) + '</div>';
    const proj = '<div class="pms-row" style="top:228px"><div class="pms-abs" style="left:26px;top:14px;display:flex;gap:6px;color:var(--color-ink-gray-6)">' + i16(CHEV) + i16(FOLDER) + '</div>' + bar(70, 17, 150) +
      vals('proj') + '<div class="pms-abs ad-hbg" style="left:' + (COLS[3] - 268) + 'px;top:8px;width:56px;height:28px;border-radius:8px;background:var(--color-surface-gray-2);opacity:0"></div>' +
      '<div class="pms-abs ad-plus" style="left:' + (COLS[3] - 268) + 'px;top:8px;width:56px;height:28px;display:none;align-items:center;justify-content:center;color:var(--color-ink-gray-6)">' + i16(PLUS) + '</div>' + tot('proj', GREEN) + '</div>';
    let dotsA = '';
    [0, 1, 2, 4].forEach((i) => { dotsA += dot(COLS[i]); });
    const taskA = '<div class="pms-row" style="top:272px"><div class="pms-abs" style="left:70px;top:14px;display:flex;align-items:center;gap:6px;color:var(--color-ink-gray-4)">' + i16(TASKIC) + '</div>' + bar(94, 17, 190) + vals('task') + dotsA + tot('task', 'var(--color-ink-gray-6)') + '</div>';
    let newRow = '<div class="pms-row" style="top:0"><div class="pms-abs" style="left:70px;top:12px;display:flex;align-items:center;gap:6px;color:var(--color-ink-gray-6);white-space:nowrap">' + i16(TASKIC) + '<span style="color:var(--color-ink-gray-8)">' + TASKS[PICK] + '</span></div>';
    COLS.forEach((x, i) => { newRow += i === 3 ? cell(x, '02:00', '', 'color:var(--color-ink-gray-8);font-weight:420') + dot(x) : cell(x, '-', '', 'color:var(--color-ink-gray-4)'); });
    newRow += cell(1366, '02:00', '', 'color:var(--color-ink-gray-6)') + '</div>';
    const ins = '<div class="pms-abs ad-ins" style="left:0;right:0;top:316px;height:0;overflow:hidden">' + newRow + '</div>';
    let skel = '';
    for (let i = 0; i < 12; i++) {
      let r = '<div class="pms-row" style="top:' + (i * 44) + 'px">' + bar(i % 3 ? 48 : 32, 17, i % 3 ? 160 + (i * 53) % 120 : 110);
      COLS.forEach((x) => { r += bar(x - 256, 18, 32, 8); });
      skel += r + bar(1110, 18, 40, 8) + '</div>';
    }
    skel = '<div class="pms-abs ad-below" style="left:0;right:0;top:316px;height:600px">' + skel + '</div>';
    const opts = TASKS.map((n, i) => '<div class="pms-abs ad-opt" style="left:7px;top:' + (7 + 28.1 * i) + 'px;width:450px;height:28.1px;border-radius:8px;box-sizing:border-box;padding-left:10px;display:flex;align-items:center;gap:8px;font-size:14px;font-weight:420;color:var(--color-ink-gray-7);white-space:nowrap"><span style="color:var(--color-ink-gray-7);display:flex">' + i16(TASKIC.replace('stroke-width="1"', 'stroke-width="1.3"')) + '</span><span style="margin-left:2px">' + n + '</span></div>').join('');
    const dlg = '<div class="pms-abs ad-ov" style="inset:0;background:rgba(0,0,0,.27);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);opacity:0;visibility:hidden"></div>' +
      '<div class="pms-abs ad-dlg" style="left:464px;top:120px;width:512px;height:504.5px;background:var(--color-surface-modal);border-radius:16px;' + SH + ';opacity:0;visibility:hidden">' +
      '<div class="pms-abs" style="left:24px;top:22px;font-size:20px;line-height:24px;font-weight:600;color:var(--color-ink-gray-8)">Add time</div>' +
      '<div class="pms-abs" style="left:456px;top:20px;width:32px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--color-ink-gray-8)">' + i16(XMARK) + '</div>' +
      lab(24, 68, 'Project', true) + sel('ad-pin', 90.1, FOLDER, 'ad-pv', 'Select project') +
      lab(24, 138.1, 'Task', true) + sel('ad-tin', 160.2, TASKIC, 'ad-tv', 'Select task') +
      lab(24, 208.2, 'Date', true) + field('', 24, 230.3, 224, 32, '<span class="pms-abs" style="left:10px;top:0;line-height:30px">2026-10-15</span><span class="pms-abs" style="right:11px;top:7px;color:var(--color-ink-gray-6)">' + s24(CAL) + '</span>') +
      lab(264, 208.2, 'Duration ', true, 13) + '<div class="pms-abs ad-left" style="right:24px;top:208.2px;font-size:13px;line-height:15px;color:var(--color-ink-gray-5);white-space:nowrap">8h left</div>' +
      '<div class="pms-abs" style="left:264px;top:229.2px;width:224px;height:32px;border-radius:8px;background:var(--color-surface-gray-2);overflow:hidden"><div class="pms-abs ad-fill" style="left:0;top:0;height:32px;width:0;background:var(--color-surface-gray-4);border-radius:8px;visibility:hidden"><span class="pms-abs" style="right:8px;top:10px;width:2px;height:12px;border-radius:2px;background:rgba(23,23,23,.09)"></span></div><span class="pms-abs ad-dv" style="right:10px;top:8px;font-size:14px;line-height:16px;font-weight:420;color:var(--color-ink-gray-8);font-variant-numeric:tabular-nums">00:00</span></div>' +
      '<div class="pms-abs" style="left:24px;top:279.3px;width:14px;height:14px;box-sizing:border-box;border:1px solid var(--color-outline-gray-3);border-radius:4px"></div><div class="pms-abs" style="left:46px;top:278.3px;font-size:14px;line-height:16px;font-weight:500;color:var(--color-ink-gray-8)">Add calendar events</div>' +
      lab(24, 310.4, 'Comment', true) + field('ad-cin', 24, 332, 464, 96, '<div class="pms-abs" style="left:10px;top:8px;right:10px;line-height:21px;white-space:nowrap"><span class="ad-cv"></span><span class="ad-caret" style="display:inline-block;width:1px;height:16px;background:var(--color-ink-gray-8);vertical-align:-3px;opacity:0"></span></div>') +
      '<div class="pms-abs" style="left:24px;top:452.5px;width:228px;height:28px;border-radius:8px;background:var(--color-surface-gray-2);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:420;color:var(--color-ink-gray-8)">Save and add another</div>' +
      '<div class="pms-abs ad-save" style="left:260px;top:452.5px;width:228px;height:28px;border-radius:8px;background:var(--color-surface-gray-7);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:420;color:var(--color-ink-white)">Save and close</div>' +
      '<div class="pms-abs ad-panel" style="left:24px;top:196px;width:464px;height:' + (TASKS.length * 28.1 + 14) + 'px;box-sizing:border-box;background:var(--color-surface-modal);border:1px solid var(--color-outline-gray-1);border-radius:12px;' + SH + ';visibility:hidden">' + opts + '</div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="pms-cam ad-cam"><div class="pms-win">' + side +
      head + week + all + proj + taskA + ins + skel + dlg + '<div class="pms-ring ad-ring"></div></div></div></div>'));
    const q = (c) => kit.stage.querySelector('.ad-' + c);
    for (const k of ['cam', 'ov', 'dlg', 'pv', 'pv-ic', 'tv', 'tv-ic', 'pin', 'tin', 'cin', 'left', 'fill', 'dv', 'cv', 'caret', 'save', 'panel', 'ring', 'hbg', 'plus', 'ins', 'below', 'thu-all', 'thu-proj', 'thu-task', 'tot-all', 'tot-proj', 'tot-task']) this[k] = q(k);
    this.opts = [...kit.stage.querySelectorAll('.ad-opt')];
    this.camera = new kit.Camera(this.cam);
    this.camera.set([
      { t: 0, cx: 930, cy: 540, z: 1.12, hold: 0.4 },
      { t: 1.3, cx: 1090, cy: 380, z: 2.0, hold: 0.3 },
      { t: 2.2, cx: 960, cy: 462, z: 1.9, hold: 6.6 },
      { t: 9.6, cx: 962, cy: 500, z: 1.36 },
    ]);
    this.cur = kit.cursor();
    this.cam.appendChild(this.cur.el);
    this.cur.keys = [
      { t: 0, at: [1500, 900] }, { t: 1.3, at: [1351, 340] }, { t: 2.0, at: [1351, 340] }, { t: 2.5, at: [1120, 300] },
      { t: 3.5, at: [1120, 300] }, { t: 4.1, at: [900, 386] }, { t: 4.25, at: [900, 386] }, { t: 4.7, at: [900, 455] }, { t: 4.95, at: [900, 455] },
      { t: 5.5, at: [976, 455] }, { t: 5.65, at: [976, 455] }, { t: 6.15, at: [1024, 455] }, { t: 6.3, at: [1024, 455] }, { t: 6.85, at: [960, 590] },
      { t: 8.3, at: [960, 590] }, { t: 8.8, at: [1078, 676] }, { t: 9.0, at: [1078, 676] }, { t: 9.9, at: [1480, 560] }, { t: 12.2, at: [1486, 566] },
    ];
    this.cur.clicks = [1.75, TIMES.cT, TIMES.cO, TIMES.press, TIMES.cC, TIMES.cS];
    this.cur.holds = [[5.58, TIMES.rel]];
    this.com = kit.typist(COMMENT, TIMES.type, 18);
  },
  render(t) {
    this.camera.apply(t);
    const z = this.camera.at(t).z;
    const cur = this.cur;
    const over = (u) => { const [x, y] = cur.position(u); return x > 1323 && x < 1379 && y > 326 && y < 354 && u < TIMES.open + 0.15; };
    let h = 0;
    for (let k = 0; k < 6; k++) h += over(t - k * 0.03) ? 1 / 6 : 0;
    this.hbg.style.opacity = h;
    const ho = over(t);
    this.plus.style.display = ho ? 'flex' : 'none';
    const done = t >= TIMES.upd;
    const hide = ho && !done;
    this['thu-proj'].style.visibility = hide ? 'hidden' : 'visible';
    const o =eo(seg(t, TIMES.open, TIMES.open + 0.15)) * (1 - ei(seg(t, TIMES.close, TIMES.close + 0.15)));
    this.ov.style.opacity = o; this.ov.style.visibility = o > 0 ? 'visible' : 'hidden';
    this.dlg.style.opacity = o; this.dlg.style.visibility = o > 0 ? 'visible' : 'hidden';
    this.dlg.style.transform = 'scale(' + lerp(0.96, 1, eo(seg(t, TIMES.open, TIMES.open + 0.15))) + ')';
    this.pv.textContent = PROJECT; this.pv.style.color = 'var(--color-ink-gray-7)'; this.pv.style.left = '32px'; this['pv-ic'].style.display = 'block';
    const picked = t >= TIMES.cO;
    this.tv.textContent = picked ? TASKS[PICK] : 'Select task';
    this.tv.style.color = picked ? 'var(--color-ink-gray-7)' : 'var(--color-ink-gray-4)';
    this.tv.style.left = picked ? '32px' : '8px';
    this['tv-ic'].style.display = picked ? 'block' : 'none';
    const panelOn = t >= TIMES.panel && t < TIMES.cO + 0.05;
    this.panel.style.visibility = panelOn ? 'visible' : 'hidden';
    this.tin.style.borderColor = panelOn ? 'var(--color-outline-gray-5)' : 'var(--color-outline-gray-2)';
    const [cx, cy] = cur.position(t);
    const hi = panelOn && cx > 735 && cx < 1185 ? Math.floor((cy - (210 + 203)) / 28.1) : -1;
    this.opts.forEach((el, i) => { el.style.background = i === hi ? 'var(--color-surface-gray-3)' : 'transparent'; });
    let hrs = 0;
    if (t >= 5.58) { const xr = cur.position(Math.min(t, TIMES.rel))[0]; hrs = Math.max(0, Math.min(8, Math.round(8 * (xr - 968) / 224 * 4) / 4)); }
    const mins = Math.round(hrs * 60), left = 480 - mins;
    this.fill.style.width = (hrs / 8 * 100) + '%';
    this.fill.style.visibility = hrs > 0 ? 'visible' : 'hidden';
    this.dv.textContent = fmt(mins);
    this.left.textContent = Math.floor(left / 60) + 'h' + (left % 60 ? ' ' + (left % 60) + 'm' : '') + ' left';
    const typed = this.com.at(t);
    this.cv.textContent = typed;
    const typing = t > TIMES.type && t < this.com.end;
    this.caret.style.opacity = t > TIMES.cC && t < TIMES.cS + 0.05 && (typing || t < TIMES.type || Math.floor(t / 0.53) % 2 === 0) ? 1 : 0;
    this.cin.style.borderColor = t > TIMES.cC && t < TIMES.close ? 'var(--color-outline-gray-5)' : 'var(--color-outline-gray-2)';
    this.save.style.transform = 'scale(' + (1 - 0.04 * seg(t, TIMES.cS - 0.05, TIMES.cS) * (1 - seg(t, TIMES.cS, TIMES.cS + 0.12))) + ')';
    const k =eio(seg(t, TIMES.upd, TIMES.upd + 0.35));
    this.ins.style.height = 44 * k + 'px';
    this.below.style.transform = 'translateY(' + 44 * k + 'px)';
    ['all', 'proj'].forEach((n) => {
      const el = this['thu-' + n];
      el.textContent = done ? '02:00' : '-';
      el.style.color = done ? (n === 'all' ? 'var(--color-ink-gray-8)' : 'var(--color-ink-gray-6)') : 'var(--color-ink-gray-4)';
      el.style.fontWeight = done && n === 'all' ? '500' : '420';
    });
    this['thu-task'].textContent = '-';
    for (const n of ['all', 'proj', 'task']) this['tot-' + n].textContent = done && n !== 'task' ? '34:00' : '32:00';
    let r = null;
    for (const g of RINGS) if (t >= g[0] && t < g[1]) r = g;
    if (r) {
      const s = this.ring.style;
      s.left = r[2] + 'px'; s.top = r[3] + 'px'; s.width = r[4] + 'px'; s.height = r[5] + 'px';
      s.opacity = Math.min(eo(seg(t, r[0], r[0] + 0.25)), r[1] >= 12.2 ? 1 : 1 - seg(t, r[1] - 0.15, r[1]));
    } else this.ring.style.opacity = 0;
    this.cur.render(t);
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
