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
const COL = i => 885.5 + 64 * i;
// Ghost: text is a 10 px pill, a square of 18 px or less is a 14 px icon, an explicit r keeps the real box.
const G = (x, y, w, h, r) => {
  if (r == null && w === h && w <= 18) { const d = (w - 14) / 2; x += d; y += d; w = h = 14; r = 4; }
  else if (r == null && h <= 22) { y += (h - 10) / 2; h = 10; r = 5; }
  return '<i class="gh" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px' + (r == null ? '' : ';border-radius:' + r + 'px') + '"></i>';
};
const NUM = (cx, cy, w) => G(cx - w / 2, cy - 4, w, 8, 4);
const L = (x, y, w) => '<i class="hair" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px"></i>';
const CHECK = '<svg class="ic" viewBox="0 0 16 16"><path fill="currentColor" d="M13.083 3.38232C13.2635 3.17364 13.5792 3.15115 13.7881 3.33154C13.9968 3.51208 14.0202 3.82774 13.8398 4.03662L6.42871 12.6167C6.33494 12.7251 6.19902 12.789 6.05566 12.7905C5.91224 12.7919 5.77468 12.7311 5.67871 12.6245L2.16797 8.72412C1.98372 8.51899 2.00032 8.20273 2.20508 8.01807C2.41033 7.83334 2.72738 7.84992 2.91211 8.05518L6.04199 11.5337L13.083 3.38232Z"/></svg>';
const TICK = '<svg width="14" height="14" viewBox="0 0 14 14" style="display:block"><path d="M3.4 7.2l2.4 2.4 4.8-5.2" fill="none" stroke="var(--color-ink-white)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const DAYS = ['Mon, Oct 12', 'Tue, Oct 13', 'Wed, Oct 14', 'Thu, Oct 15', 'Fri, Oct 16'];
const fade = (t, a, b) => eo(seg(t, a, a + 0.25)) * (1 - ei(seg(t, b, b + 0.25)));
const dip = (t, c) => 1 - 0.04 * seg(t, c, c + 0.06) * (1 - seg(t, c + 0.12, c + 0.24));
const mix = (a, b, p) => 'color-mix(in srgb, var(--color-' + a + '), var(--color-' + b + ') ' + p * 100 + '%)';
const TOT = 1338.5;
const hours = (y) => { let s = ''; for (let i = 0; i < 7; i++) s += NUM(COL(i), y + 22, 32); return s + NUM(TOT, y + 22, 40); };
// Member rows sit under their project row, one indent deeper than on the Team page.
const row = (y, nw, bw, icon) => G(314, y + 14, 16, 16) + G(338, y + 14, 16, 16, 8) + G(362, y + 14, nw, 16) + G(370 + nw, y + 12, bw, 20, 9999) + hours(y) + (icon ? G(1382, y + 8, 28, 28, 8) : '') + L(260, y + 44, 1154);
const project = (y, label) => G(290, y + 14, 16, 16) + G(314, y + 14, 16, 16) + label + hours(y) + L(260, y + 44, 1154);
const week = (y, w, cols) => { let s = G(272, y + 14, 16, 16) + G(296, y + 14, w, 16); if (cols) { for (let i = 0; i < 7; i++) s += NUM(COL(i), y + 22, 32); s += NUM(TOT, y + 22, 40); } return s + L(260, y + 44, 1154); };
const T = { r1: 2.4, c1: 3.4, open: 3.45, rR: 7.0, cR: 7.9, swap: 8.0, rT: 9.1, cT: 9.55, type: 9.8,
  rB: 12.15, cB: 12.55, close: 12.65, proc: 12.8, rej: 13.5, r4: 13.6 };
const REASON = 'Please add task details';
const XCIRC = '<svg class="ic" viewBox="0 0 16 16"><path fill="currentColor" fill-rule="evenodd" d="M8 14.25C11.4518 14.25 14.25 11.4518 14.25 8C14.25 4.54822 11.4518 1.75 8 1.75C4.54822 1.75 1.75 4.54822 1.75 8C1.75 11.4518 4.54822 14.25 8 14.25ZM8 15.25C12.0041 15.25 15.25 12.0041 15.25 8C15.25 3.99594 12.0041 0.75 8 0.75C3.99594 0.75 0.75 3.99594 0.75 8C0.75 12.0041 3.99594 15.25 8 15.25ZM10.8536 5.14645C11.0488 5.34171 11.0488 5.65829 10.8536 5.85355L8.70711 8L10.8536 10.1464C11.0488 10.3417 11.0488 10.6583 10.8536 10.8536C10.6583 11.0488 10.3417 11.0488 10.1464 10.8536L8 8.70711L5.85355 10.8536C5.65829 11.0488 5.34171 11.0488 5.14645 10.8536C4.95118 10.6583 4.95118 10.3417 5.14645 10.1464L7.29289 8L5.14645 5.85355C4.95118 5.65829 4.95118 5.34171 5.14645 5.14645C5.34171 4.95118 5.65829 4.95118 5.85355 5.14645L8 7.29289L10.1464 5.14645C10.3417 4.95118 10.6583 4.95118 10.8536 5.14645Z"/></svg>';
const XMARK = '<svg style="display:block;width:20px;height:20px" viewBox="0 0 16 16"><path fill="currentColor" d="M12.1494 3.14648C12.3446 2.95126 12.6612 2.95135 12.8564 3.14648C13.0517 3.34175 13.0517 3.65825 12.8564 3.85352L8.70898 8.00098L12.8574 12.1494C13.0526 12.3446 13.0526 12.6612 12.8574 12.8564C12.6622 13.0516 12.3456 13.0517 12.1504 12.8564L8.00195 8.70801L3.85352 12.8564C3.65825 13.0517 3.34175 13.0517 3.14648 12.8564C2.95135 12.6612 2.95126 12.3446 3.14648 12.1494L7.29492 8.00098L3.14746 3.85352C2.95228 3.65827 2.95228 3.34173 3.14746 3.14648C3.34271 2.95137 3.65927 2.95132 3.85449 3.14648L8.00195 7.29395L12.1494 3.14648Z"/></svg>';
const SPIN = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
const DX = 520, DY = 297.7;
kit.scene('reject-project', {
  init(kit) {
    let p = '<div class="reject-page" style="position:absolute;inset:0">' + SHELL('project-timesheet');
    p += G(272, 119, 195, 15);
    for (let i = 0; i < 7; i++) p += NUM(COL(i), 126.5, 32);
    p += NUM(TOT, 126.5, 40) + L(260, 143, 1154) + week(157, 118, true);
    p += project(202, '<span class="lm" style="position:absolute;left:338px;top:216px;font-size:14px;font-weight:500;line-height:16px">Website Redesign</span>');
    p += row(247, 84, 90, false);
    p += G(314, 306, 16, 16) + G(338, 306, 16, 16, 8) + hours(292) + L(260, 336, 1154);
    p += '<div style="position:absolute;left:362px;top:304px;height:20px;display:flex;align-items:center;gap:8px"><span class="lm" style="font-size:14px;font-weight:500;line-height:16px">Julian Andrews</span><span style="position:relative;display:block;height:20px">' +
      '<span class="badge reject-b1" style="position:relative;background:var(--color-surface-amber-2);color:var(--color-ink-amber-4)">Approval pending</span>' +
      '<span class="badge reject-b2" style="left:0;top:0;background:var(--color-surface-amber-2);color:var(--color-ink-amber-4);opacity:0">Processing timesheet</span>' +
      '<span class="badge reject-b3" style="left:0;top:0;background:var(--color-surface-red-2);color:var(--color-ink-red-4);opacity:0">Rejected</span></span></div>';
    p += '<div class="btn reject-st" style="left:1382px;top:300px;width:28px;background:var(--color-surface-gray-7);color:var(--color-ink-white)">' + CHECK + '</div>' +
      '<div class="btn reject-st2" style="left:1382px;top:300px;width:28px;color:var(--color-ink-amber-4);opacity:0"><span class="reject-spin" style="display:block">' + SPIN + '</span></div>' +
      '<div class="btn reject-st3" style="left:1382px;top:300px;width:28px;color:var(--color-ink-red-4);opacity:0">' + XCIRC + '</div>';
    p += '<div class="ring reject-r1" style="left:1375px;top:293px;width:42px;height:42px;border-radius:15px"></div><div class="ring reject-r4" style="border-radius:9999px"></div>';
    p += row(337, 96, 66, true) + project(382, G(338, 396, 150, 16));
    [[427, 124], [472, 132], [517, 120], [562, 126]].forEach(([y, w]) => { p += week(y, w, false); });
    p += '</div><div class="reject-bk" style="position:absolute;inset:0;background:rgba(0,0,0,.27);opacity:0"></div>';
    let q = '<div class="reject-pn" style="position:absolute;left:950px;top:10px;width:480px;height:880px;background:var(--color-surface-modal);border-radius:16px;overflow:hidden;opacity:0;box-shadow:0 0 1px rgba(0,0,0,.19),0 1px 2px rgba(0,0,0,.07),0 6px 15px -5px rgba(0,0,0,.11)">';
    q += G(14, 17, 16, 16, 8) + G(42, 16, 92, 18) + G(146, 17, 106, 16) + G(391, 24, 47, 18) + G(450, 25, 16, 16) + L(0, 66, 480);
    q += '<span class="lm" style="position:absolute;left:42px;top:34px;font-size:14px;line-height:16px">Website Redesign</span>';
    const tw = [148, 132, 160, 140, 152], dw = [210, 176, 232, 190, 168];
    DAYS.forEach((d, i) => {
      const y = 67 + 150 * i;
      q += '<div style="position:absolute;left:0;top:' + y + 'px;width:480px;height:42px;background:var(--color-surface-gray-2)"></div>' + G(14, y + 13, 16, 16);
      q += '<span class="lm" style="position:absolute;left:38px;top:' + (y + 13) + 'px;font-size:14px;font-weight:500;line-height:16px">' + d + '</span>';
      q += G(393, y + 12, 47, 18) + '<div class="cb" style="left:452px;top:' + (y + 15) + 'px;background:var(--color-surface-gray-7)">' + TICK + '</div>' + L(0, y + 42, 480);
      q += G(14, y + 59, 16, 16) + G(42, y + 59, tw[i], 16) + G(48 + tw[i], y + 59, 16, 16) + G(42, y + 79, 104, 14) + G(42, y + 105, dw[i], 21) + G(391, y + 52, 54, 30, 10) + L(0, y + 149, 480);
    });
    q += L(0, 822, 480) + '<div class="btn reject-rj" style="left:14px;top:837px;width:81.3px;background:var(--color-surface-red-5);color:var(--color-ink-white)">' + XCIRC + '<span>Reject</span></div>' + G(371, 837, 95, 28, 8);
    q += '<div class="ring reject-rR" style="left:7px;top:830px;width:95.3px;height:42px;border-radius:15px"></div></div>';
    let d = '<div class="reject-dl" style="position:absolute;left:' + DX + 'px;top:' + DY + 'px;width:400px;height:304.6px;background:var(--color-surface-modal);border-radius:16px;visibility:hidden;box-shadow:0 0 1px rgba(0,0,0,.19),0 1px 2px rgba(0,0,0,.07),0 6px 15px -5px rgba(0,0,0,.11)">';
    d += '<div style="position:absolute;left:24px;top:22.5px;font-size:20px;font-weight:600;line-height:23px;letter-spacing:.2px;color:var(--color-ink-gray-8);white-space:nowrap">Reason for timesheet rejection</div>';
    d += '<div style="position:absolute;left:352px;top:24px;color:var(--color-ink-gray-5)">' + XMARK + '</div>';
    d += '<div style="position:absolute;left:24px;top:64px;width:352px;height:48px;border-radius:10px;background:var(--color-surface-gray-2)"></div>' + G(32, 72, 16, 16, 8);
    d += '<div style="position:absolute;left:56px;top:72px;display:flex;gap:8px;font-size:14px;font-weight:500;line-height:16px;white-space:nowrap"><span style="color:var(--color-ink-gray-7)">Julian Andrews</span><span style="color:var(--color-ink-gray-5)">· Oct 12 - Oct 18</span></div>';
    d += '<div style="position:absolute;left:56px;top:88px;font-size:14px;font-weight:500;line-height:16px;color:var(--color-ink-gray-5);white-space:nowrap">Website Redesign</div>';
    d += '<div style="position:absolute;right:32px;top:80px;font-size:14px;font-weight:500;line-height:16px;color:var(--color-ink-red-4);font-variant-numeric:tabular-nums">24:00</div>';
    d += '<div style="position:absolute;left:24px;top:128px;display:flex;gap:2px;font-size:14px;line-height:16px;color:var(--color-ink-gray-5)">Reason<span style="color:var(--color-ink-red-3)">*</span></div>';
    d += '<div class="reject-ta" style="position:absolute;left:24px;top:150.2px;width:352px;height:78.4px;box-sizing:border-box;border:1px solid var(--color-outline-gray-2);border-radius:8px;background:var(--color-surface-white);padding:6px 8px;font-size:14px;line-height:16px;color:var(--color-ink-gray-7);white-space:nowrap">' +
      '<span class="reject-ph" style="color:var(--color-ink-gray-4)">Enter reason for rejection</span><span class="reject-tv"></span><span class="reject-caret" style="display:inline-block;width:1.5px;height:16px;background:var(--color-ink-gray-7);vertical-align:-3px;opacity:0"></span>' +
      '<svg style="position:absolute;right:2px;bottom:2px;width:8px;height:8px" viewBox="0 0 8 8"><path d="M7 2L2 7M7 5L5 7" stroke="var(--color-ink-gray-4)" stroke-width="1" stroke-linecap="round"/></svg></div>';
    d += '<div class="btn reject-sb" style="left:24px;top:260.6px;width:352px;background:var(--color-surface-gray-7);color:var(--color-ink-white)">Reject timesheet</div>';
    d += '<div class="ring reject-rT" style="left:17px;top:143.2px;width:366px;height:92.4px;border-radius:15px"></div>';
    d += '<div class="ring reject-rB" style="left:17px;top:253.6px;width:366px;height:42px;border-radius:15px"></div></div>';
    kit.stage.append(kit.h('<div class="ground"><div class="reject-cam" style="position:absolute;left:0;top:0;width:1920px;height:1080px"><div class="win">' + p + q + d + '</div></div></div>'));
    const e = this.el = {};
    ['page', 'bk', 'pn', 'dl', 'st', 'st2', 'st3', 'spin', 'b1', 'b2', 'b3', 'rj', 'ta', 'ph', 'tv', 'caret', 'sb', 'r1', 'rR', 'rT', 'rB', 'r4'].forEach(k => { e[k] = kit.stage.querySelector('.reject-' + k); });
    const wr = kit.stage.querySelector('.win').getBoundingClientRect(), k = wr.width / 1440, br = e.b3.getBoundingClientRect();
    const b = k > 0 && br.width > 0 ? { x: (br.left - wr.left) / k, y: (br.top - wr.top) / k, w: br.width / k, h: br.height / k } : { x: 470, y: 304, w: 66, h: 20 };
    Object.assign(e.r4.style, { left: (b.x - 7) + 'px', top: (b.y - 7) + 'px', width: (b.w + 14) + 'px', height: (b.h + 14) + 'px' });
    const cam = this.cam = new kit.Camera(kit.stage.querySelector('.reject-cam'));
    cam.set([
      { t: 0, cx: 960, cy: 540, z: 1.1, hold: 1.0, drift: [2, 0, 0.006] },
      { t: 2.2, cx: 1200, cy: 405, z: 2.0, hold: 1.85, drift: [1.5, 0, 0.004] },
      { t: 5.05, cx: 1430, cy: 480, z: 2.2, hold: 0.55, drift: [0, 1.5, 0.003] },
      { t: 6.5, cx: 1430, cy: 712, z: 2.0, hold: 1.6, drift: [0, -1.5, 0.003] },
      { t: 8.9, cx: 960, cy: 545, z: 2.1, hold: 3.6, drift: [1, 0, 0.003] },
      { t: 13.6, cx: 1134, cy: 462, z: 1.65, drift: [1.5, 0, 0.004] },
    ]);
    const cur = this.cur = kit.cursor();
    kit.stage.querySelector('.reject-cam').appendChild(cur.el);
    cur.keys = [
      { t: 0, at: [1300, 560] }, { t: 2.3, at: [1300, 560] }, { t: 3.0, at: [1636, 404] },
      { t: 6.8, at: [1636, 404] }, { t: 7.5, at: [1246, 951] }, { t: 8.6, at: [1246, 951] }, { t: 9.3, at: [900, 576] },
      { t: 11.6, at: [900, 576] }, { t: 12.3, at: [960, 663] }, { t: 12.9, at: [960, 663] }, { t: 13.7, at: [1250, 525] },
    ];
    cur.clicks = [T.c1, T.cR, T.cT, T.cB];
    this.typ = kit.typist(REASON, T.type, 18);
  },
  render(t) {
    this.cam.apply(t);
    const e = this.el;
    // The panel swaps to the dialog instantly, under one backdrop.
    const o = eo(seg(t, T.open, T.open + 0.1)) * (1 - ei(seg(t, T.close, T.close + 0.15)));
    e.bk.style.opacity = o;
    e.page.style.filter = o > 0 ? 'blur(' + (12 * o).toFixed(2) + 'px)' : 'none';
    const pn = t < T.swap ? o : 0;
    e.pn.style.opacity = pn;
    e.pn.style.visibility = pn > 0 ? 'visible' : 'hidden';
    const dl = t >= T.swap ? o : 0;
    e.dl.style.opacity = dl;
    e.dl.style.visibility = dl > 0 ? 'visible' : 'hidden';
    const h1 = eio(seg(t, 3.0, 3.15)) * (1 - eio(seg(t, T.open, T.open + 0.15)));
    e.st.style.background = mix('surface-gray-7', 'surface-gray-6', h1);
    e.st.style.transform = 'scale(' + dip(t, T.c1) + ')';
    e.rj.style.background = mix('surface-red-5', 'surface-red-6',eio(seg(t, 7.5, 7.65)));
    e.rj.style.transform = 'scale(' + dip(t, T.cR) + ')';
    const hov = eio(seg(t, 9.3, 9.45)) * (1 - eio(seg(t, 11.65, 11.8)));
    const foc = t >= T.cT && t < T.close + 0.15;
    e.ta.style.background = foc ? 'var(--color-surface-white)' : mix('surface-white', 'surface-gray-3', hov);
    e.ta.style.borderColor = mix('outline-gray-2', 'outline-gray-1', hov);
    e.ta.style.outline = foc ? '2px solid var(--color-outline-gray-3)' : 'none';
    e.ta.style.boxShadow = foc ? '0 1px 2px rgba(0,0,0,.1)' : 'none';
    const typed = this.typ.at(t);
    e.tv.textContent = typed;
    e.ph.style.display = typed ? 'none' : 'inline';
    const typing = t > T.type && t < this.typ.end;
    e.caret.style.opacity = foc && t < T.cB && (typing || Math.floor((t - T.cT) / 0.53) % 2 === 0) ? 1 : 0;
    e.sb.style.background = mix('surface-gray-7', 'surface-gray-6', eio(seg(t, 12.3, 12.45)));
    e.sb.style.transform = 'scale(' + dip(t, T.cB) + ')';
    // Processing timesheet briefly, then Rejected.
    const ph = t >= T.proc ? (t >= T.rej ? 2 : 1) : 0;
    e.st.style.opacity = ph === 0 ? 1 : 0;
    e.st2.style.opacity = ph === 1 ? 1 : 0;
    e.st3.style.opacity = ph === 2 ? 1 : 0;
    e.spin.style.transform = 'rotate(' + ((t * 360) % 360).toFixed(1) + 'deg)';
    e.b1.style.opacity = ph === 0 ? 1 : 0;
    e.b2.style.opacity = ph === 1 ? 1 : 0;
    e.b3.style.opacity = ph === 2 ? 1 : 0;
    e.r1.style.opacity = fade(t, T.r1, T.c1);
    e.rR.style.opacity = fade(t, T.rR, T.cR);
    e.rT.style.opacity = fade(t, T.rT, T.cT);
    e.rB.style.opacity = fade(t, T.rB, T.cB);
    e.r4.style.opacity = eo(seg(t, T.r4, T.r4 + 0.25));
    this.cur.render(t);
    const z = this.cam.at(t).z;
    this.cur.el.style.transform += ' scale(' + (1.1 / z).toFixed(4) + ')';
  },
});
