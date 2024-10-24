var h = Object.defineProperty;
var c = Object.getOwnPropertySymbols;
var u = Object.prototype.hasOwnProperty,
  p = Object.prototype.propertyIsEnumerable;
var b = (e, a, t) => (a in e ? h(e, a, { enumerable: !0, configurable: !0, writable: !0, value: t }) : (e[a] = t)),
  l = (e, a) => {
    for (var t in a || (a = {})) u.call(a, t) && b(e, t, a[t]);
    if (c) for (var t of c(a)) p.call(a, t) && b(e, t, a[t]);
    return e;
  };
var d = (e, a) => {
  var t = {};
  for (var r in e) u.call(e, r) && a.indexOf(r) < 0 && (t[r] = e[r]);
  if (e != null && c) for (var r of c(e)) a.indexOf(r) < 0 && p.call(e, r) && (t[r] = e[r]);
  return t;
};
import { at as y, au as g, c as f, r as i, j as o, F as n } from "./index-C1dL3-sP.js";
function x(e) {
  const a = y(e);
  return a.setHours(0, 0, 0, 0), a;
}
function N(e) {
  return g(e, Date.now());
}
function w(e, a) {
  const t = x(e),
    r = x(a);
  return +t == +r;
}
function O(e) {
  return w(e, N(e));
}
/**
 * @license lucide-react v0.408.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const _ = f("ChevronLeft", [["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }]]);
/**
 * @license lucide-react v0.408.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const z = f("ChevronRight", [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]]);
/**
 * @license lucide-react v0.408.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const T = f("LoaderCircle", [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }]]),
  j = i.forwardRef((r, t) => {
    var s = r,
      { className: e } = s,
      a = d(s, ["className"]);
    return o.jsx("div", {
      className: "relative w-full overflow-auto",
      children: o.jsx("table", l({ ref: t, className: n("w-full caption-bottom text-sm", e) }, a)),
    });
  });
j.displayName = "Table";
const R = i.forwardRef((r, t) => {
  var s = r,
    { className: e } = s,
    a = d(s, ["className"]);
  return o.jsx("thead", l({ ref: t, className: n("[&_tr]:border-b bg-slate-50 border-slate-200 border-t", e) }, a));
});
R.displayName = "TableHeader";
const v = i.forwardRef((r, t) => {
  var s = r,
    { className: e } = s,
    a = d(s, ["className"]);
  return o.jsx("tbody", l({ ref: t, className: n("[&_tr:last-child]:border-0", e) }, a));
});
v.displayName = "TableBody";
const C = i.forwardRef((r, t) => {
  var s = r,
    { className: e } = s,
    a = d(s, ["className"]);
  return o.jsx("tfoot", l({ ref: t, className: n("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", e) }, a));
});
C.displayName = "TableFooter";
const k = i.forwardRef((r, t) => {
  var s = r,
    { className: e } = s,
    a = d(s, ["className"]);
  return o.jsx(
    "tr",
    l({ ref: t, className: n("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", e) }, a)
  );
});
k.displayName = "TableRow";
const L = i.forwardRef((r, t) => {
  var s = r,
    { className: e } = s,
    a = d(s, ["className"]);
  return o.jsx(
    "th",
    l(
      {
        ref: t,
        className: n(
          "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
          e
        ),
      },
      a
    )
  );
});
L.displayName = "TableHead";
const D = i.forwardRef((r, t) => {
  var s = r,
    { className: e } = s,
    a = d(s, ["className"]);
  return o.jsx("td", l({ ref: t, className: n("px-4 py-2 align-middle [&:has([role=checkbox])]:pr-0", e) }, a));
});
D.displayName = "TableCell";
const H = i.forwardRef((r, t) => {
  var s = r,
    { className: e } = s,
    a = d(s, ["className"]);
  return o.jsx("caption", l({ ref: t, className: n("mt-4 text-sm text-muted-foreground", e) }, a));
});
H.displayName = "TableCaption";
const B = ({ isFull: e = !1 }) =>
    o.jsx("div", {
      className: n("flex justify-center items-center animate-spin", e && "h-screen"),
      children: o.jsx(T, { size: 64, className: "w-6 h-6" }),
    }),
  S = i.forwardRef((s, r) => {
    var m = s,
      { className: e, type: a } = m,
      t = d(m, ["className", "type"]);
    return o.jsx(
      "input",
      l(
        {
          type: a,
          className: n(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            e
          ),
          ref: r,
        },
        t
      )
    );
  });
S.displayName = "Input";
export {
  _ as C,
  S as I,
  T as L,
  B as S,
  j as T,
  z as a,
  R as b,
  k as c,
  L as d,
  v as e,
  D as f,
  w as g,
  N as h,
  O as i,
  x as s,
};
