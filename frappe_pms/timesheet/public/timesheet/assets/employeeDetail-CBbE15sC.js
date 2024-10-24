var Je = Object.defineProperty,
  Xe = Object.defineProperties;
var Ze = Object.getOwnPropertyDescriptors;
var K = Object.getOwnPropertySymbols;
var ue = Object.prototype.hasOwnProperty,
  me = Object.prototype.propertyIsEnumerable;
var de = (t, a, s) => (a in t ? Je(t, a, { enumerable: !0, configurable: !0, writable: !0, value: s }) : (t[a] = s)),
  j = (t, a) => {
    for (var s in a || (a = {})) ue.call(a, s) && de(t, s, a[s]);
    if (K) for (var s of K(a)) me.call(a, s) && de(t, s, a[s]);
    return t;
  },
  y = (t, a) => Xe(t, Ze(a));
var _ = (t, a) => {
  var s = {};
  for (var n in t) ue.call(t, n) && a.indexOf(n) < 0 && (s[n] = t[n]);
  if (t != null && K) for (var n of K(t)) a.indexOf(n) < 0 && me.call(t, n) && (s[n] = t[n]);
  return s;
};
import {
  a8 as et,
  a9 as pe,
  r as m,
  j as e,
  aa as tt,
  ab as xe,
  ac as at,
  ad as R,
  ae as I,
  af as ge,
  ag as st,
  F as E,
  u as H,
  a as ae,
  b as ve,
  d as se,
  e as B,
  p as G,
  B as k,
  I as z,
  J as Y,
  K as Q,
  T as D,
  C as nt,
  ah as rt,
  g as J,
  W as U,
  ai as ne,
  aj as ot,
  ak as it,
  al as he,
  am as ct,
  an as lt,
  ao as dt,
  m as X,
  i as ut,
  Q as fe,
  L as mt,
  t as ht,
  ap as ft,
  aq as pt,
  ar as xt,
  as as je,
  q as gt,
  z as vt,
} from "./index-C1dL3-sP.js";
import {
  K as be,
  u as jt,
  t as bt,
  D as yt,
  a as Nt,
  c as Tt,
  F as wt,
  d as P,
  e as L,
  f as O,
  g as M,
  h as V,
  i as Ct,
  C as Dt,
  S as _t,
  T as Ft,
  j as It,
  l as St,
  A as ye,
  n as Ne,
  o as Te,
  q as we,
  r as Et,
  L as At,
  M as kt,
  N as Rt,
  Q as Pt,
  U as Lt,
  V as Ot,
  W as Mt,
  G as Vt,
} from "./form-BOwT1959.js";
import { S as Ce, I as De, L as Gt } from "./input-CYSuPJFJ.js";
var W = "rovingFocusGroup.onEntryFocus",
  Kt = { bubbles: !1, cancelable: !0 },
  $ = "RovingFocusGroup",
  [Z, _e, Ut] = et($),
  [Bt, Fe] = pe($, [Ut]),
  [Ht, $t] = Bt($),
  Ie = m.forwardRef((t, a) =>
    e.jsx(Z.Provider, {
      scope: t.__scopeRovingFocusGroup,
      children: e.jsx(Z.Slot, { scope: t.__scopeRovingFocusGroup, children: e.jsx(qt, y(j({}, t), { ref: a })) }),
    })
  );
Ie.displayName = $;
var qt = m.forwardRef((t, a) => {
    const ce = t,
      {
        __scopeRovingFocusGroup: s,
        orientation: n,
        loop: o = !1,
        dir: h,
        currentTabStopId: r,
        defaultCurrentTabStopId: u,
        onCurrentTabStopIdChange: i,
        onEntryFocus: l,
        preventScrollOnEntryFocus: d = !1,
      } = ce,
      g = _(ce, [
        "__scopeRovingFocusGroup",
        "orientation",
        "loop",
        "dir",
        "currentTabStopId",
        "defaultCurrentTabStopId",
        "onCurrentTabStopIdChange",
        "onEntryFocus",
        "preventScrollOnEntryFocus",
      ]),
      x = m.useRef(null),
      v = tt(a, x),
      N = be(h),
      [p = null, T] = xe({ prop: r, defaultProp: u, onChange: i }),
      [F, f] = m.useState(!1),
      b = at(l),
      c = _e(s),
      C = m.useRef(!1),
      [A, ie] = m.useState(0);
    return (
      m.useEffect(() => {
        const w = x.current;
        if (w) return w.addEventListener(W, b), () => w.removeEventListener(W, b);
      }, [b]),
      e.jsx(Ht, {
        scope: s,
        orientation: n,
        dir: N,
        loop: o,
        currentTabStopId: p,
        onItemFocus: m.useCallback((w) => T(w), [T]),
        onItemShiftTab: m.useCallback(() => f(!0), []),
        onFocusableItemAdd: m.useCallback(() => ie((w) => w + 1), []),
        onFocusableItemRemove: m.useCallback(() => ie((w) => w - 1), []),
        children: e.jsx(
          R.div,
          y(j({ tabIndex: F || A === 0 ? -1 : 0, "data-orientation": n }, g), {
            ref: v,
            style: j({ outline: "none" }, t.style),
            onMouseDown: I(t.onMouseDown, () => {
              C.current = !0;
            }),
            onFocus: I(t.onFocus, (w) => {
              const We = !C.current;
              if (w.target === w.currentTarget && We && !F) {
                const le = new CustomEvent(W, Kt);
                if ((w.currentTarget.dispatchEvent(le), !le.defaultPrevented)) {
                  const q = c().filter((S) => S.focusable),
                    ze = q.find((S) => S.active),
                    Ye = q.find((S) => S.id === p),
                    Qe = [ze, Ye, ...q].filter(Boolean).map((S) => S.ref.current);
                  Ae(Qe, d);
                }
              }
              C.current = !1;
            }),
            onBlur: I(t.onBlur, () => f(!1)),
          })
        ),
      })
    );
  }),
  Se = "RovingFocusGroupItem",
  Ee = m.forwardRef((t, a) => {
    const N = t,
      { __scopeRovingFocusGroup: s, focusable: n = !0, active: o = !1, tabStopId: h } = N,
      r = _(N, ["__scopeRovingFocusGroup", "focusable", "active", "tabStopId"]),
      u = ge(),
      i = h || u,
      l = $t(Se, s),
      d = l.currentTabStopId === i,
      g = _e(s),
      { onFocusableItemAdd: x, onFocusableItemRemove: v } = l;
    return (
      m.useEffect(() => {
        if (n) return x(), () => v();
      }, [n, x, v]),
      e.jsx(Z.ItemSlot, {
        scope: s,
        id: i,
        focusable: n,
        active: o,
        children: e.jsx(
          R.span,
          y(j({ tabIndex: d ? 0 : -1, "data-orientation": l.orientation }, r), {
            ref: a,
            onMouseDown: I(t.onMouseDown, (p) => {
              n ? l.onItemFocus(i) : p.preventDefault();
            }),
            onFocus: I(t.onFocus, () => l.onItemFocus(i)),
            onKeyDown: I(t.onKeyDown, (p) => {
              if (p.key === "Tab" && p.shiftKey) {
                l.onItemShiftTab();
                return;
              }
              if (p.target !== p.currentTarget) return;
              const T = Yt(p, l.orientation, l.dir);
              if (T !== void 0) {
                if (p.metaKey || p.ctrlKey || p.altKey || p.shiftKey) return;
                p.preventDefault();
                let f = g()
                  .filter((b) => b.focusable)
                  .map((b) => b.ref.current);
                if (T === "last") f.reverse();
                else if (T === "prev" || T === "next") {
                  T === "prev" && f.reverse();
                  const b = f.indexOf(p.currentTarget);
                  f = l.loop ? Qt(f, b + 1) : f.slice(b + 1);
                }
                setTimeout(() => Ae(f));
              }
            }),
          })
        ),
      })
    );
  });
Ee.displayName = Se;
var Wt = {
  ArrowLeft: "prev",
  ArrowUp: "prev",
  ArrowRight: "next",
  ArrowDown: "next",
  PageUp: "first",
  Home: "first",
  PageDown: "last",
  End: "last",
};
function zt(t, a) {
  return a !== "rtl" ? t : t === "ArrowLeft" ? "ArrowRight" : t === "ArrowRight" ? "ArrowLeft" : t;
}
function Yt(t, a, s) {
  const n = zt(t.key, s);
  if (
    !(a === "vertical" && ["ArrowLeft", "ArrowRight"].includes(n)) &&
    !(a === "horizontal" && ["ArrowUp", "ArrowDown"].includes(n))
  )
    return Wt[n];
}
function Ae(t, a = !1) {
  const s = document.activeElement;
  for (const n of t) if (n === s || (n.focus({ preventScroll: a }), document.activeElement !== s)) return;
}
function Qt(t, a) {
  return t.map((s, n) => t[(a + n) % t.length]);
}
var Jt = Ie,
  Xt = Ee,
  re = "Tabs",
  [Zt, ha] = pe(re, [Fe]),
  ke = Fe(),
  [ea, oe] = Zt(re),
  Re = m.forwardRef((t, a) => {
    const v = t,
      {
        __scopeTabs: s,
        value: n,
        onValueChange: o,
        defaultValue: h,
        orientation: r = "horizontal",
        dir: u,
        activationMode: i = "automatic",
      } = v,
      l = _(v, ["__scopeTabs", "value", "onValueChange", "defaultValue", "orientation", "dir", "activationMode"]),
      d = be(u),
      [g, x] = xe({ prop: n, onChange: o, defaultProp: h });
    return e.jsx(ea, {
      scope: s,
      baseId: ge(),
      value: g,
      onValueChange: x,
      orientation: r,
      dir: d,
      activationMode: i,
      children: e.jsx(R.div, y(j({ dir: d, "data-orientation": r }, l), { ref: a })),
    });
  });
Re.displayName = re;
var Pe = "TabsList",
  Le = m.forwardRef((t, a) => {
    const u = t,
      { __scopeTabs: s, loop: n = !0 } = u,
      o = _(u, ["__scopeTabs", "loop"]),
      h = oe(Pe, s),
      r = ke(s);
    return e.jsx(
      Jt,
      y(j({ asChild: !0 }, r), {
        orientation: h.orientation,
        dir: h.dir,
        loop: n,
        children: e.jsx(R.div, y(j({ role: "tablist", "aria-orientation": h.orientation }, o), { ref: a })),
      })
    );
  });
Le.displayName = Pe;
var Oe = "TabsTrigger",
  Me = m.forwardRef((t, a) => {
    const g = t,
      { __scopeTabs: s, value: n, disabled: o = !1 } = g,
      h = _(g, ["__scopeTabs", "value", "disabled"]),
      r = oe(Oe, s),
      u = ke(s),
      i = Ke(r.baseId, n),
      l = Ue(r.baseId, n),
      d = n === r.value;
    return e.jsx(
      Xt,
      y(j({ asChild: !0 }, u), {
        focusable: !o,
        active: d,
        children: e.jsx(
          R.button,
          y(
            j(
              {
                type: "button",
                role: "tab",
                "aria-selected": d,
                "aria-controls": l,
                "data-state": d ? "active" : "inactive",
                "data-disabled": o ? "" : void 0,
                disabled: o,
                id: i,
              },
              h
            ),
            {
              ref: a,
              onMouseDown: I(t.onMouseDown, (x) => {
                !o && x.button === 0 && x.ctrlKey === !1 ? r.onValueChange(n) : x.preventDefault();
              }),
              onKeyDown: I(t.onKeyDown, (x) => {
                [" ", "Enter"].includes(x.key) && r.onValueChange(n);
              }),
              onFocus: I(t.onFocus, () => {
                const x = r.activationMode !== "manual";
                !d && !o && x && r.onValueChange(n);
              }),
            }
          )
        ),
      })
    );
  });
Me.displayName = Oe;
var Ve = "TabsContent",
  Ge = m.forwardRef((t, a) => {
    const x = t,
      { __scopeTabs: s, value: n, forceMount: o, children: h } = x,
      r = _(x, ["__scopeTabs", "value", "forceMount", "children"]),
      u = oe(Ve, s),
      i = Ke(u.baseId, n),
      l = Ue(u.baseId, n),
      d = n === u.value,
      g = m.useRef(d);
    return (
      m.useEffect(() => {
        const v = requestAnimationFrame(() => (g.current = !1));
        return () => cancelAnimationFrame(v);
      }, []),
      e.jsx(st, {
        present: o || d,
        children: ({ present: v }) =>
          e.jsx(
            R.div,
            y(
              j(
                {
                  "data-state": d ? "active" : "inactive",
                  "data-orientation": u.orientation,
                  role: "tabpanel",
                  "aria-labelledby": i,
                  hidden: !v,
                  id: l,
                  tabIndex: 0,
                },
                r
              ),
              { ref: a, style: y(j({}, t.style), { animationDuration: g.current ? "0s" : void 0 }), children: v && h }
            )
          ),
      })
    );
  });
Ge.displayName = Ve;
function Ke(t, a) {
  return `${t}-trigger-${a}`;
}
function Ue(t, a) {
  return `${t}-content-${a}`;
}
var ta = Re,
  Be = Le,
  He = Me,
  $e = Ge;
const aa = ta,
  qe = m.forwardRef((n, s) => {
    var o = n,
      { className: t } = o,
      a = _(o, ["className"]);
    return e.jsx(
      Be,
      j(
        {
          ref: s,
          className: E("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", t),
        },
        a
      )
    );
  });
qe.displayName = Be.displayName;
const ee = m.forwardRef((n, s) => {
  var o = n,
    { className: t } = o,
    a = _(o, ["className"]);
  return e.jsx(
    He,
    j(
      {
        ref: s,
        className: E(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
          t
        ),
      },
      a
    )
  );
});
ee.displayName = He.displayName;
const te = m.forwardRef((n, s) => {
  var o = n,
    { className: t } = o,
    a = _(o, ["className"]);
  return e.jsx(
    $e,
    j(
      {
        ref: s,
        className: E(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          t
        ),
      },
      a
    )
  );
});
te.displayName = $e.displayName;
const sa = () => {
    const t = H((c) => c.team),
      a = ae(),
      [s, n] = m.useState(""),
      { call: o } = ve("timesheet_enhancer.api.timesheet.save"),
      { toast: h } = se(),
      r = jt({
        resolver: bt(St),
        defaultValues: {
          name: t.timesheet.name,
          task: t.timesheet.task,
          hours: t.timesheet.hours.toString(),
          description: t.timesheet.description,
          date: t.timesheet.date,
          parent: t.timesheet.parent,
          is_update: t.timesheet.isUpdate,
          employee: t.employee,
        },
        mode: "onSubmit",
      }),
      {
        data: u,
        isLoading: i,
        mutate: l,
        error: d,
      } = B(
        "timesheet_enhancer.api.utils.get_task_for_employee",
        { employee: r.getValues("employee"), search: s },
        "task_for_an_employee",
        { shouldRetryOnError: !1, errorRetryCount: 0, keepPreviousData: !0 }
      ),
      {
        data: g,
        isLoading: x,
        error: v,
      } = B("frappe.client.get_value", {
        doctype: "Employee",
        fieldname: ["name", "employee_name", "image"],
        filters: [["name", "=", t.employee]],
      }),
      N = () => {
        r.reset(), a(rt(!1));
      },
      p = (c) => {
        const C = c.target.value;
        r.setValue("hours", C);
      },
      T = (c) => {
        r.setValue("date", J(c));
      },
      F = (c) => {
        n(c);
      },
      f = (c) => {
        c instanceof Array ? r.setValue("task", c[0]) : r.setValue("task", c);
      },
      b = (c) => {
        o(c)
          .then((C) => {
            h({ variant: "success", description: C.message }), a(U(!0)), N();
          })
          .catch((C) => {
            const A = G(C);
            h({ variant: "destructive", description: A });
          });
      };
    return (
      m.useEffect(() => {
        l();
      }, [s, l]),
      m.useEffect(() => {
        if (d) {
          const c = G(d);
          h({ variant: "destructive", description: c });
        }
        if (v) {
          const c = G(v);
          h({ variant: "destructive", description: c });
        }
      }, [d, v]),
      e.jsx(yt, {
        open: t.isDialogOpen,
        onOpenChange: N,
        children: e.jsxs(Nt, {
          className: "max-w-xl",
          children: [
            e.jsx(Tt, { children: "Add Time" }),
            i || x
              ? e.jsx(Ce, {})
              : e.jsx(
                  wt,
                  y(j({}, r), {
                    children: e.jsx("form", {
                      onSubmit: r.handleSubmit(b),
                      children: e.jsxs("div", {
                        className: "flex flex-col gap-y-4",
                        children: [
                          e.jsxs("div", {
                            className: "flex gap-x-2",
                            children: [
                              e.jsx(P, {
                                control: r.control,
                                name: "employee",
                                render: () => {
                                  var c, C, A;
                                  return e.jsxs(L, {
                                    className: "w-full",
                                    children: [
                                      e.jsx(O, { children: "Employee" }),
                                      e.jsx(M, {
                                        children: e.jsx("div", {
                                          className: "relative flex items-center",
                                          children: e.jsx(k, {
                                            variant: "outline",
                                            disabled: !0,
                                            className: "justify-start gap-x-3 font-normal w-full truncate",
                                            children:
                                              g && g.message
                                                ? e.jsxs(e.Fragment, {
                                                    children: [
                                                      e.jsxs(z, {
                                                        className: "w-8 h-8",
                                                        children: [
                                                          e.jsx(Y, {
                                                            src: (c = g.message) == null ? void 0 : c.image,
                                                            alt: "image",
                                                          }),
                                                          e.jsx(Q, {
                                                            children:
                                                              (C = g.message) == null ? void 0 : C.employee_name[0],
                                                          }),
                                                        ],
                                                      }),
                                                      e.jsx(D, {
                                                        variant: "p",
                                                        className: "truncate",
                                                        children: (A = g.message) == null ? void 0 : A.employee_name,
                                                      }),
                                                    ],
                                                  })
                                                : "select employee",
                                          }),
                                        }),
                                      }),
                                      e.jsx(V, {}),
                                    ],
                                  });
                                },
                              }),
                              e.jsx(P, {
                                control: r.control,
                                name: "hours",
                                render: ({ field: c }) =>
                                  e.jsxs(L, {
                                    className: "w-full",
                                    children: [
                                      e.jsx(O, { children: "Time" }),
                                      e.jsx(M, {
                                        children: e.jsxs("div", {
                                          className: "relative flex items-center",
                                          children: [
                                            e.jsx(
                                              De,
                                              y(
                                                j(
                                                  {
                                                    placeholder: "0h",
                                                    className:
                                                      "placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0",
                                                  },
                                                  c
                                                ),
                                                { type: "text", onChange: p }
                                              )
                                            ),
                                            e.jsx(nt, {
                                              className: "h-4 w-4 absolute right-0 m-3 top-0 stroke-slate-400",
                                            }),
                                          ],
                                        }),
                                      }),
                                      e.jsx(V, {}),
                                    ],
                                  }),
                              }),
                              e.jsx(P, {
                                control: r.control,
                                name: "date",
                                render: ({ field: c }) =>
                                  e.jsxs(L, {
                                    className: "w-full",
                                    children: [
                                      e.jsx(O, { children: "Date" }),
                                      e.jsx(M, { children: e.jsx(Ct, { date: c.value, onDateChange: T }) }),
                                      e.jsx(V, {}),
                                    ],
                                  }),
                              }),
                            ],
                          }),
                          e.jsx(P, {
                            control: r.control,
                            name: "task",
                            render: () =>
                              e.jsxs(L, {
                                className: "w-full",
                                children: [
                                  e.jsx(O, { children: "Tasks" }),
                                  e.jsx(M, {
                                    children: e.jsx(Dt, {
                                      label: "Search Task",
                                      disabled: t.timesheet.task.length > 0,
                                      value: r.getValues("task") ? [r.getValues("task")] : [],
                                      data:
                                        u == null
                                          ? void 0
                                          : u.message.map((c) => ({
                                              label: c.subject,
                                              value: c.name,
                                              description: c.project_name,
                                              disabled: !1,
                                            })),
                                      showSelected: !0,
                                      onSelect: f,
                                      onSearch: F,
                                      rightIcon: e.jsx(_t, { className: "h-4 w-4 stroke-slate-400" }),
                                    }),
                                  }),
                                  e.jsx(V, {}),
                                ],
                              }),
                          }),
                          e.jsx(P, {
                            control: r.control,
                            name: "description",
                            render: ({ field: c }) =>
                              e.jsxs(L, {
                                className: "w-full",
                                children: [
                                  e.jsx(O, { children: "Comment" }),
                                  e.jsx(M, {
                                    children: e.jsx(
                                      Ft,
                                      j(
                                        {
                                          placeholder: "Explain your progress",
                                          rows: 4,
                                          className:
                                            "w-full placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0",
                                        },
                                        c
                                      )
                                    ),
                                  }),
                                  e.jsx(V, {}),
                                ],
                              }),
                          }),
                          e.jsxs(It, {
                            className: "sm:justify-start",
                            children: [
                              e.jsxs(k, {
                                disabled: r.formState.isSubmitting,
                                children: [
                                  r.formState.isSubmitting && e.jsx(Gt, { className: "animate-spin w-4 h-4" }),
                                  "Add Time",
                                ],
                              }),
                              e.jsx(k, { type: "button", variant: "outline", onClick: N, children: "Cancel" }),
                            ],
                          }),
                        ],
                      }),
                    }),
                  })
                ),
          ],
        }),
      })
    );
  },
  fa = () => {
    const { id: t } = ne(),
      a = H((d) => d.team),
      s = ae(),
      { toast: n } = se(),
      {
        data: o,
        isLoading: h,
        error: r,
        mutate: u,
      } = B("timesheet_enhancer.api.timesheet.get_timesheet_data", {
        employee: t,
        start_date: a.employeeWeekDate,
        max_week: 4,
      }),
      i = () => {
        const d = { name: "", parent: "", task: "", date: J(new Date()), description: "", hours: 0, isUpdate: !1 };
        s(je({ timesheet: d, id: t }));
      },
      l = () => {
        if (a.timesheetData.data == null || Object.keys(a.timesheetData.data).length == 0) return;
        const d = a.timesheetData.data[Object.keys(a.timesheetData.data).pop()],
          g = J(gt(d.start_date, -1));
        s(he(g));
      };
    return (
      m.useEffect(() => {
        s(ot());
        const d = it();
        s(he(d)), s(ct(t));
      }, [t]),
      m.useEffect(() => {
        if (r) {
          const d = G(r);
          n({ variant: "destructive", description: d }), U(!1);
          return;
        }
        a.isFetchAgain && (u(), U(!1)),
          o &&
            (a.timesheetData.data && Object.keys(a.timesheetData.data).length > 0
              ? s(lt(o.message))
              : s(dt(o.message)));
      }, [o, a.employeeWeekDate, r, a.isFetchAgain]),
      e.jsxs(e.Fragment, {
        children: [
          a.isDialogOpen && e.jsx(sa, {}),
          e.jsx(oa, {}),
          e.jsxs(aa, {
            defaultValue: "timesheet",
            className: "mt-3",
            children: [
              e.jsxs("div", {
                className: "flex gap-x-4",
                children: [
                  e.jsxs(qe, {
                    className: "w-full justify-start",
                    children: [
                      e.jsx(ee, { value: "timesheet", children: "Timesheet" }),
                      e.jsx(ee, { value: "time", children: "Time" }),
                    ],
                  }),
                  e.jsx(k, { className: "float-right mb-1", onClick: i, children: "Add Time" }),
                ],
              }),
              h
                ? e.jsx(Ce, { isFull: !0 })
                : e.jsxs(e.Fragment, {
                    children: [
                      e.jsxs("div", {
                        className: "overflow-y-scroll",
                        style: { height: "calc(100vh - 11rem)" },
                        children: [
                          e.jsx(te, { value: "timesheet", className: "mt-0", children: e.jsx(na, {}) }),
                          e.jsx(te, {
                            value: "time",
                            className: "mt-0",
                            children: e.jsx(ra, {
                              callback: () => {
                                s(U(!0));
                              },
                            }),
                          }),
                        ],
                      }),
                      e.jsx("div", {
                        className: "mt-5",
                        children: e.jsx(k, {
                          className: "float-left",
                          variant: "outline",
                          onClick: l,
                          children: "Load More",
                        }),
                      }),
                    ],
                  }),
            ],
          }),
        ],
      })
    );
  },
  na = () => {
    const { id: t } = ne(),
      a = H((o) => o.team),
      s = ae(),
      n = (o) => {
        (o.isUpdate = !!(o != null && o.hours && (o == null ? void 0 : o.hours) > 0)), s(je({ timesheet: o, id: t }));
      };
    return e.jsx("div", {
      className: "flex flex-col",
      children:
        a.timesheetData.data &&
        Object.keys(a.timesheetData.data).length > 0 &&
        Object.entries(a.timesheetData.data).map(([o, h]) =>
          e.jsx(e.Fragment, {
            children: e.jsx(
              ye,
              {
                type: "multiple",
                defaultValue: [o],
                children: e.jsxs(Ne, {
                  value: o,
                  children: [
                    e.jsx(Te, {
                      className: "hover:no-underline w-full",
                      children: e.jsx("div", {
                        className: "flex justify-between w-full",
                        children: e.jsxs(D, {
                          variant: "h6",
                          className: "font-normal",
                          children: [o, ": ", X(h.total_hours), "h"],
                        }),
                      }),
                    }),
                    e.jsx(we, {
                      className: "pb-0",
                      children: e.jsx(Et, {
                        dates: h.dates,
                        holidays: a.timesheetData.holidays,
                        leaves: a.timesheetData.leaves,
                        tasks: h.tasks,
                        onCellClick: n,
                        working_frequency: a.timesheetData.working_frequency,
                        working_hour: a.timesheetData.working_hour,
                      }),
                    }),
                  ],
                }),
              },
              o
            ),
          })
        ),
    });
  },
  ra = ({ callback: t, isOpen: a = !1 }) => {
    const s = H((r) => r.team),
      { call: n } = ve("timesheet_enhancer.api.timesheet.save"),
      { toast: o } = se(),
      h = (r) => {
        n(r)
          .then((u) => {
            o({ variant: "success", description: u.message }), t && t();
          })
          .catch((u) => {
            const i = G(u);
            o({ variant: "destructive", description: i });
          });
      };
    return e.jsx("div", {
      children:
        s.timesheetData.data &&
        Object.keys(s.timesheetData.data).length > 0 &&
        Object.entries(s.timesheetData.data).map(([r, u]) =>
          e.jsx(e.Fragment, {
            children: e.jsx(
              ye,
              {
                type: "multiple",
                defaultValue: a ? [r] : [],
                children: e.jsxs(Ne, {
                  value: r,
                  children: [
                    e.jsx(Te, {
                      className: "hover:no-underline w-full",
                      children: e.jsx("div", {
                        className: "flex justify-between w-full",
                        children: e.jsxs(D, {
                          variant: "h6",
                          className: "font-normal",
                          children: [r, ": ", X(u.total_hours), "h"],
                        }),
                      }),
                    }),
                    e.jsx(we, {
                      className: "pb-0",
                      children: u.dates.map((i, l) => {
                        const { date: d, day: g } = ut(i, !0),
                          x = Object.entries(u.tasks).flatMap(([f, b]) =>
                            b.data
                              .filter((c) => fe(c.from_time) === i)
                              .map((c) => y(j({}, c), { taskName: f, projectName: b.project_name }))
                          ),
                          v = s.timesheetData.holidays.includes(i);
                        let N = x.reduce((f, b) => f + b.hours, 0);
                        const p = s.timesheetData.leaves.find((f) => i >= f.from_date && i <= f.to_date),
                          T = !!(p != null && p.half_day && (p == null ? void 0 : p.half_day_date) == i);
                        p && !v && (T ? (N += 4) : (N += 8));
                        const F = mt(N, s.timesheetData.working_hour, s.timesheetData.working_frequency);
                        return e.jsxs(
                          "div",
                          {
                            className: "flex flex-col",
                            children: [
                              e.jsxs("div", {
                                className: "bg-gray-100 p-2 py-3 border-b flex items-center gap-x-2",
                                children: [
                                  e.jsxs(D, {
                                    variant: "p",
                                    className: E(
                                      F == 0 && "text-destructive",
                                      F && "text-success",
                                      F == 2 && "text-warning"
                                    ),
                                    children: [X(N), "h"],
                                  }),
                                  e.jsx(D, { variant: "p", children: d }),
                                  v && e.jsx(D, { variant: "p", className: "text-gray-600", children: "(Holiday)" }),
                                  p &&
                                    !v &&
                                    e.jsxs(D, {
                                      variant: "p",
                                      className: "text-gray-600",
                                      children: ["(", T ? "Half day leave" : "Full Day Leave", ")"],
                                    }),
                                ],
                              }),
                              x == null
                                ? void 0
                                : x.map((f, b) => {
                                    const c = {
                                      name: f.name,
                                      parent: f.parent,
                                      task: f.task,
                                      date: fe(f.from_time),
                                      description: f.description,
                                      hours: f.hours,
                                      isUpdate: f.hours > 0,
                                    };
                                    return e.jsxs(
                                      "div",
                                      {
                                        className: "flex gap-x-4 items-center p-2 border-b last:border-b-0",
                                        children: [
                                          e.jsx(ia, {
                                            disabled: f.docstatus == 1,
                                            data: c,
                                            callback: h,
                                            employee: s.employee,
                                            className: "w-12 p-1 h-8",
                                          }),
                                          e.jsxs("div", {
                                            className: "grid w-full grid-cols-3",
                                            children: [
                                              e.jsx(D, { variant: "p", className: "font-bold ", children: f.taskName }),
                                              e.jsx(D, {
                                                variant: "p",
                                                className: " col-span-2",
                                                children: f.description,
                                              }),
                                            ],
                                          }),
                                        ],
                                      },
                                      b
                                    );
                                  }),
                              x.length == 0 &&
                                e.jsx(D, { variant: "p", className: "text-center p-3", children: "No data." }),
                            ],
                          },
                          l
                        );
                      }),
                    }),
                  ],
                }),
              },
              r
            ),
          })
        ),
    });
  },
  oa = () => {
    const { id: t } = ne(),
      [a, s] = m.useState(t != null ? t : ""),
      [n, o] = m.useState(),
      h = ht(),
      { data: r } = B(
        "frappe.client.get_list",
        { doctype: "Employee", fields: ["name", "employee_name", "image"], filters: [["status", "=", "Active"]] },
        { shouldRetryOnError: !1 }
      ),
      u = (i) => {
        s(i), h(`/team/employee/${i}`);
      };
    return (
      m.useEffect(() => {
        const i = r == null ? void 0 : r.message.find((l) => l.name === a);
        o(i);
      }, [r, t]),
      e.jsxs(ft, {
        modal: !0,
        children: [
          e.jsx(pt, {
            asChild: !0,
            children: e.jsxs(k, {
              variant: "outline",
              className: E("items-center gap-x-4 px-2 justify-between [&[data-state=open]>svg]:rotate-180"),
              children: [
                e.jsxs("span", {
                  className: "flex gap-x-2 items-center",
                  children: [
                    e.jsxs(z, {
                      className: "w-8 h-8",
                      children: [
                        e.jsx(Y, { src: n == null ? void 0 : n.image, alt: "image" }),
                        e.jsx(Q, { children: n == null ? void 0 : n.employee_name[0] }),
                      ],
                    }),
                    n == null ? void 0 : n.employee_name,
                  ],
                }),
                e.jsx(At, { size: 24, className: "w-4 h-4 transition-transform duration-400" }),
              ],
            }),
          }),
          e.jsx(xt, {
            className: "p-0",
            children: e.jsxs(kt, {
              children: [
                e.jsx(Rt, { placeholder: "Search Employee" }),
                e.jsx(Pt, { children: "No data." }),
                e.jsx(Lt, {
                  children: e.jsx(Ot, {
                    children:
                      r == null
                        ? void 0
                        : r.message.map((i, l) => {
                            const d = a == i.name;
                            return e.jsxs(
                              Mt,
                              {
                                onSelect: u,
                                className: "flex gap-x-2 text-primary font-normal",
                                value: i.name,
                                children: [
                                  e.jsx(Vt, { className: E("mr-2 h-4 w-4", d ? "opacity-100" : "opacity-0") }),
                                  e.jsxs(z, {
                                    children: [
                                      e.jsx(Y, { src: i.image, alt: i.employee_name }),
                                      e.jsx(Q, { children: i.employee_name[0] }),
                                    ],
                                  }),
                                  e.jsx(D, { variant: "p", children: i.employee_name }),
                                ],
                              },
                              l
                            );
                          }),
                  }),
                }),
              ],
            }),
          }),
        ],
      })
    );
  },
  ia = ({ data: t, employee: a, disabled: s = !1, className: n, callback: o }) => {
    const [h, r] = m.useState(t.hours),
      u = (l) => {
        r(l.target.value), i(parseFloat(l.target.value));
      },
      i = vt((l) => {
        if (l == 0 || Number.isNaN(l)) return;
        const d = y(j({}, t), { hours: l, employee: a });
        o(d);
      }, 1e3);
    return e.jsx(De, { value: h, className: E("w-20", n), onChange: u, disabled: s });
  };
export { ra as Time, ia as TimeInput, fa as default };
