// ==== <App> shell v1 ====
// Draws the app frame around every scene: sidebar, top bar with breadcrumb, filter row.
// Window coordinates. Everything is Ghost except the breadcrumb, which is a Landmark
// (real words, muted, no icons). Measure every number from the app at desktop width
// (measure.mjs) and record each page's state in PAGES. Keep comments to what the
// numbers can't say. Version history belongs in git, not here.
//
// SHELL(pageKey, focus?) returns HTML. `focus` maps a top-bar button index to the
// scene's own Focus html, for a button the motion uses.
const SHELL = (() => {
  const GHOST = "#E8E8E8",
    MUTED = "#7C7C7C";
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
    "px;background:" +
    GHOST +
    '"></div>';
  const txt = (x, cy, w) => g(x, cy - 5, w, 10, 5);
  const ico = (x, y) => g(x + 1, y + 1, 14, 14, 4);
  // Sidebar items in order: [labelWidth, activeOnPages[]]; replace with the app's real items.
  const NAV = [
    [46, []],
    [83, []],
    [54, ["list"]],
    [38, []],
  ];
  const PAGES = {
    // key: { active: index in NAV, crumb: ['Section', 'Page'], buttons: [[x, w, 'solid'?]], filters: [[x, w]] }
    list: {
      active: 2,
      crumb: ["Section", "Page"],
      buttons: [[1329, 99, "solid"]],
      filters: [
        [260, 220],
        [488, 140],
      ],
    },
  };
  return (page, focus) => {
    const P = PAGES[page],
      F = focus || {};
    let s =
      '<div style="position:absolute;left:0;top:0;width:240px;height:900px;background:#F8F8F8;border-right:1px solid #EDEDED;box-sizing:border-box">';
    NAV.forEach(([w], i) => {
      const y = 64 + 28 * i;
      if (i === P.active)
        s +=
          '<div style="position:absolute;left:8px;top:' +
          y +
          'px;width:223px;height:28px;border-radius:8px;background:#fff;box-shadow:0 0 0 1px #EDEDED"></div>';
      s += ico(16, y + 6) + txt(40, y + 14, w);
    });
    s +=
      '</div><div style="position:absolute;left:240px;right:0;top:56px;height:1px;background:#EDEDED"></div>';
    s +=
      '<div style="position:absolute;left:257px;top:18px;display:flex;gap:7px;font-size:16px;font-weight:500;line-height:20px;color:' +
      MUTED +
      ';white-space:nowrap">' +
      P.crumb
        .map((c, i) => (i ? "<span>/</span>" : "") + "<span>" + c + "</span>")
        .join("") +
      "</div>";
    P.buttons.forEach(([x, w], i) => {
      s += F[i] || g(x, 14, w, 28, 8);
    });
    P.filters.forEach(([x, w]) => {
      s += g(x, 71, w, 28, 8);
    });
    return s;
  };
})();
// ==== end shell ====
