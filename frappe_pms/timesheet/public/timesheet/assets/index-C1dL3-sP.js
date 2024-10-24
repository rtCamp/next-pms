const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "assets/index-CEb9j3Od.js",
      "assets/form-BOwT1959.js",
      "assets/input-CYSuPJFJ.js",
      "assets/index-0o5WGapu.js",
      "assets/queryParam-CcAovJGT.js",
      "assets/index-DWGBU-4t.js",
      "assets/employeeDetail-CBbE15sC.js",
    ])
) => i.map((i) => d[i]);
var US = Object.defineProperty,
  BS = Object.defineProperties;
var VS = Object.getOwnPropertyDescriptors;
var sa = Object.getOwnPropertySymbols;
var Mh = Object.prototype.hasOwnProperty,
  jh = Object.prototype.propertyIsEnumerable;
var Xu = (e, t, n) => (t in e ? US(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : (e[t] = n)),
  T = (e, t) => {
    for (var n in t || (t = {})) Mh.call(t, n) && Xu(e, n, t[n]);
    if (sa) for (var n of sa(t)) jh.call(t, n) && Xu(e, n, t[n]);
    return e;
  },
  F = (e, t) => BS(e, VS(t));
var G = (e, t) => {
  var n = {};
  for (var r in e) Mh.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
  if (e != null && sa) for (var r of sa(e)) t.indexOf(r) < 0 && jh.call(e, r) && (n[r] = e[r]);
  return n;
};
var Fh = (e, t, n) => Xu(e, typeof t != "symbol" ? t + "" : t, n);
var le = (e, t, n) =>
  new Promise((r, o) => {
    var i = (l) => {
        try {
          a(n.next(l));
        } catch (u) {
          o(u);
        }
      },
      s = (l) => {
        try {
          a(n.throw(l));
        } catch (u) {
          o(u);
        }
      },
      a = (l) => (l.done ? r(l.value) : Promise.resolve(l.value).then(i, s));
    a((n = n.apply(e, t)).next());
  });
function $y(e, t) {
  for (var n = 0; n < t.length; n++) {
    const r = t[n];
    if (typeof r != "string" && !Array.isArray(r)) {
      for (const o in r)
        if (o !== "default" && !(o in e)) {
          const i = Object.getOwnPropertyDescriptor(r, o);
          i && Object.defineProperty(e, o, i.get ? i : { enumerable: !0, get: () => r[o] });
        }
    }
  }
  return Object.freeze(Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }));
}
(function () {
  const t = document.createElement("link").relList;
  if (t && t.supports && t.supports("modulepreload")) return;
  for (const o of document.querySelectorAll('link[rel="modulepreload"]')) r(o);
  new MutationObserver((o) => {
    for (const i of o)
      if (i.type === "childList")
        for (const s of i.addedNodes) s.tagName === "LINK" && s.rel === "modulepreload" && r(s);
  }).observe(document, { childList: !0, subtree: !0 });
  function n(o) {
    const i = {};
    return (
      o.integrity && (i.integrity = o.integrity),
      o.referrerPolicy && (i.referrerPolicy = o.referrerPolicy),
      o.crossOrigin === "use-credentials"
        ? (i.credentials = "include")
        : o.crossOrigin === "anonymous"
        ? (i.credentials = "omit")
        : (i.credentials = "same-origin"),
      i
    );
  }
  function r(o) {
    if (o.ep) return;
    o.ep = !0;
    const i = n(o);
    fetch(o.href, i);
  }
})();
function zy(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Uy = { exports: {} },
  ru = {},
  By = { exports: {} },
  ue = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Ms = Symbol.for("react.element"),
  WS = Symbol.for("react.portal"),
  HS = Symbol.for("react.fragment"),
  KS = Symbol.for("react.strict_mode"),
  qS = Symbol.for("react.profiler"),
  GS = Symbol.for("react.provider"),
  QS = Symbol.for("react.context"),
  YS = Symbol.for("react.forward_ref"),
  XS = Symbol.for("react.suspense"),
  JS = Symbol.for("react.memo"),
  ZS = Symbol.for("react.lazy"),
  Ih = Symbol.iterator;
function eE(e) {
  return e === null || typeof e != "object"
    ? null
    : ((e = (Ih && e[Ih]) || e["@@iterator"]), typeof e == "function" ? e : null);
}
var Vy = {
    isMounted: function () {
      return !1;
    },
    enqueueForceUpdate: function () {},
    enqueueReplaceState: function () {},
    enqueueSetState: function () {},
  },
  Wy = Object.assign,
  Hy = {};
function pi(e, t, n) {
  (this.props = e), (this.context = t), (this.refs = Hy), (this.updater = n || Vy);
}
pi.prototype.isReactComponent = {};
pi.prototype.setState = function (e, t) {
  if (typeof e != "object" && typeof e != "function" && e != null)
    throw Error(
      "setState(...): takes an object of state variables to update or a function which returns an object of state variables."
    );
  this.updater.enqueueSetState(this, e, t, "setState");
};
pi.prototype.forceUpdate = function (e) {
  this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function Ky() {}
Ky.prototype = pi.prototype;
function Dd(e, t, n) {
  (this.props = e), (this.context = t), (this.refs = Hy), (this.updater = n || Vy);
}
var Md = (Dd.prototype = new Ky());
Md.constructor = Dd;
Wy(Md, pi.prototype);
Md.isPureReactComponent = !0;
var $h = Array.isArray,
  qy = Object.prototype.hasOwnProperty,
  jd = { current: null },
  Gy = { key: !0, ref: !0, __self: !0, __source: !0 };
function Qy(e, t, n) {
  var r,
    o = {},
    i = null,
    s = null;
  if (t != null)
    for (r in (t.ref !== void 0 && (s = t.ref), t.key !== void 0 && (i = "" + t.key), t))
      qy.call(t, r) && !Gy.hasOwnProperty(r) && (o[r] = t[r]);
  var a = arguments.length - 2;
  if (a === 1) o.children = n;
  else if (1 < a) {
    for (var l = Array(a), u = 0; u < a; u++) l[u] = arguments[u + 2];
    o.children = l;
  }
  if (e && e.defaultProps) for (r in ((a = e.defaultProps), a)) o[r] === void 0 && (o[r] = a[r]);
  return { $$typeof: Ms, type: e, key: i, ref: s, props: o, _owner: jd.current };
}
function tE(e, t) {
  return { $$typeof: Ms, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function Fd(e) {
  return typeof e == "object" && e !== null && e.$$typeof === Ms;
}
function nE(e) {
  var t = { "=": "=0", ":": "=2" };
  return (
    "$" +
    e.replace(/[=:]/g, function (n) {
      return t[n];
    })
  );
}
var zh = /\/+/g;
function Ju(e, t) {
  return typeof e == "object" && e !== null && e.key != null ? nE("" + e.key) : t.toString(36);
}
function Wa(e, t, n, r, o) {
  var i = typeof e;
  (i === "undefined" || i === "boolean") && (e = null);
  var s = !1;
  if (e === null) s = !0;
  else
    switch (i) {
      case "string":
      case "number":
        s = !0;
        break;
      case "object":
        switch (e.$$typeof) {
          case Ms:
          case WS:
            s = !0;
        }
    }
  if (s)
    return (
      (s = e),
      (o = o(s)),
      (e = r === "" ? "." + Ju(s, 0) : r),
      $h(o)
        ? ((n = ""),
          e != null && (n = e.replace(zh, "$&/") + "/"),
          Wa(o, t, n, "", function (u) {
            return u;
          }))
        : o != null &&
          (Fd(o) &&
            (o = tE(o, n + (!o.key || (s && s.key === o.key) ? "" : ("" + o.key).replace(zh, "$&/") + "/") + e)),
          t.push(o)),
      1
    );
  if (((s = 0), (r = r === "" ? "." : r + ":"), $h(e)))
    for (var a = 0; a < e.length; a++) {
      i = e[a];
      var l = r + Ju(i, a);
      s += Wa(i, t, n, l, o);
    }
  else if (((l = eE(e)), typeof l == "function"))
    for (e = l.call(e), a = 0; !(i = e.next()).done; ) (i = i.value), (l = r + Ju(i, a++)), (s += Wa(i, t, n, l, o));
  else if (i === "object")
    throw (
      ((t = String(e)),
      Error(
        "Objects are not valid as a React child (found: " +
          (t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t) +
          "). If you meant to render a collection of children, use an array instead."
      ))
    );
  return s;
}
function aa(e, t, n) {
  if (e == null) return e;
  var r = [],
    o = 0;
  return (
    Wa(e, r, "", "", function (i) {
      return t.call(n, i, o++);
    }),
    r
  );
}
function rE(e) {
  if (e._status === -1) {
    var t = e._result;
    (t = t()),
      t.then(
        function (n) {
          (e._status === 0 || e._status === -1) && ((e._status = 1), (e._result = n));
        },
        function (n) {
          (e._status === 0 || e._status === -1) && ((e._status = 2), (e._result = n));
        }
      ),
      e._status === -1 && ((e._status = 0), (e._result = t));
  }
  if (e._status === 1) return e._result.default;
  throw e._result;
}
var wt = { current: null },
  Ha = { transition: null },
  oE = { ReactCurrentDispatcher: wt, ReactCurrentBatchConfig: Ha, ReactCurrentOwner: jd };
function Yy() {
  throw Error("act(...) is not supported in production builds of React.");
}
ue.Children = {
  map: aa,
  forEach: function (e, t, n) {
    aa(
      e,
      function () {
        t.apply(this, arguments);
      },
      n
    );
  },
  count: function (e) {
    var t = 0;
    return (
      aa(e, function () {
        t++;
      }),
      t
    );
  },
  toArray: function (e) {
    return (
      aa(e, function (t) {
        return t;
      }) || []
    );
  },
  only: function (e) {
    if (!Fd(e)) throw Error("React.Children.only expected to receive a single React element child.");
    return e;
  },
};
ue.Component = pi;
ue.Fragment = HS;
ue.Profiler = qS;
ue.PureComponent = Dd;
ue.StrictMode = KS;
ue.Suspense = XS;
ue.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = oE;
ue.act = Yy;
ue.cloneElement = function (e, t, n) {
  if (e == null)
    throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
  var r = Wy({}, e.props),
    o = e.key,
    i = e.ref,
    s = e._owner;
  if (t != null) {
    if (
      (t.ref !== void 0 && ((i = t.ref), (s = jd.current)),
      t.key !== void 0 && (o = "" + t.key),
      e.type && e.type.defaultProps)
    )
      var a = e.type.defaultProps;
    for (l in t) qy.call(t, l) && !Gy.hasOwnProperty(l) && (r[l] = t[l] === void 0 && a !== void 0 ? a[l] : t[l]);
  }
  var l = arguments.length - 2;
  if (l === 1) r.children = n;
  else if (1 < l) {
    a = Array(l);
    for (var u = 0; u < l; u++) a[u] = arguments[u + 2];
    r.children = a;
  }
  return { $$typeof: Ms, type: e.type, key: o, ref: i, props: r, _owner: s };
};
ue.createContext = function (e) {
  return (
    (e = {
      $$typeof: QS,
      _currentValue: e,
      _currentValue2: e,
      _threadCount: 0,
      Provider: null,
      Consumer: null,
      _defaultValue: null,
      _globalName: null,
    }),
    (e.Provider = { $$typeof: GS, _context: e }),
    (e.Consumer = e)
  );
};
ue.createElement = Qy;
ue.createFactory = function (e) {
  var t = Qy.bind(null, e);
  return (t.type = e), t;
};
ue.createRef = function () {
  return { current: null };
};
ue.forwardRef = function (e) {
  return { $$typeof: YS, render: e };
};
ue.isValidElement = Fd;
ue.lazy = function (e) {
  return { $$typeof: ZS, _payload: { _status: -1, _result: e }, _init: rE };
};
ue.memo = function (e, t) {
  return { $$typeof: JS, type: e, compare: t === void 0 ? null : t };
};
ue.startTransition = function (e) {
  var t = Ha.transition;
  Ha.transition = {};
  try {
    e();
  } finally {
    Ha.transition = t;
  }
};
ue.unstable_act = Yy;
ue.useCallback = function (e, t) {
  return wt.current.useCallback(e, t);
};
ue.useContext = function (e) {
  return wt.current.useContext(e);
};
ue.useDebugValue = function () {};
ue.useDeferredValue = function (e) {
  return wt.current.useDeferredValue(e);
};
ue.useEffect = function (e, t) {
  return wt.current.useEffect(e, t);
};
ue.useId = function () {
  return wt.current.useId();
};
ue.useImperativeHandle = function (e, t, n) {
  return wt.current.useImperativeHandle(e, t, n);
};
ue.useInsertionEffect = function (e, t) {
  return wt.current.useInsertionEffect(e, t);
};
ue.useLayoutEffect = function (e, t) {
  return wt.current.useLayoutEffect(e, t);
};
ue.useMemo = function (e, t) {
  return wt.current.useMemo(e, t);
};
ue.useReducer = function (e, t, n) {
  return wt.current.useReducer(e, t, n);
};
ue.useRef = function (e) {
  return wt.current.useRef(e);
};
ue.useState = function (e) {
  return wt.current.useState(e);
};
ue.useSyncExternalStore = function (e, t, n) {
  return wt.current.useSyncExternalStore(e, t, n);
};
ue.useTransition = function () {
  return wt.current.useTransition();
};
ue.version = "18.3.1";
By.exports = ue;
var h = By.exports;
const ft = zy(h),
  gl = $y({ __proto__: null, default: ft }, [h]);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var iE = h,
  sE = Symbol.for("react.element"),
  aE = Symbol.for("react.fragment"),
  lE = Object.prototype.hasOwnProperty,
  uE = iE.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
  cE = { key: !0, ref: !0, __self: !0, __source: !0 };
function Xy(e, t, n) {
  var r,
    o = {},
    i = null,
    s = null;
  n !== void 0 && (i = "" + n), t.key !== void 0 && (i = "" + t.key), t.ref !== void 0 && (s = t.ref);
  for (r in t) lE.call(t, r) && !cE.hasOwnProperty(r) && (o[r] = t[r]);
  if (e && e.defaultProps) for (r in ((t = e.defaultProps), t)) o[r] === void 0 && (o[r] = t[r]);
  return { $$typeof: sE, type: e, key: i, ref: s, props: o, _owner: uE.current };
}
ru.Fragment = aE;
ru.jsx = Xy;
ru.jsxs = Xy;
Uy.exports = ru;
var k = Uy.exports,
  tf = {},
  Jy = { exports: {} },
  zt = {},
  Zy = { exports: {} },
  ev = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ (function (e) {
  function t(M, $) {
    var H = M.length;
    M.push($);
    e: for (; 0 < H; ) {
      var q = (H - 1) >>> 1,
        oe = M[q];
      if (0 < o(oe, $)) (M[q] = $), (M[H] = oe), (H = q);
      else break e;
    }
  }
  function n(M) {
    return M.length === 0 ? null : M[0];
  }
  function r(M) {
    if (M.length === 0) return null;
    var $ = M[0],
      H = M.pop();
    if (H !== $) {
      M[0] = H;
      e: for (var q = 0, oe = M.length, $e = oe >>> 1; q < $e; ) {
        var Ee = 2 * (q + 1) - 1,
          ze = M[Ee],
          We = Ee + 1,
          Bt = M[We];
        if (0 > o(ze, H))
          We < oe && 0 > o(Bt, ze) ? ((M[q] = Bt), (M[We] = H), (q = We)) : ((M[q] = ze), (M[Ee] = H), (q = Ee));
        else if (We < oe && 0 > o(Bt, H)) (M[q] = Bt), (M[We] = H), (q = We);
        else break e;
      }
    }
    return $;
  }
  function o(M, $) {
    var H = M.sortIndex - $.sortIndex;
    return H !== 0 ? H : M.id - $.id;
  }
  if (typeof performance == "object" && typeof performance.now == "function") {
    var i = performance;
    e.unstable_now = function () {
      return i.now();
    };
  } else {
    var s = Date,
      a = s.now();
    e.unstable_now = function () {
      return s.now() - a;
    };
  }
  var l = [],
    u = [],
    c = 1,
    f = null,
    d = 3,
    v = !1,
    m = !1,
    y = !1,
    x = typeof setTimeout == "function" ? setTimeout : null,
    p = typeof clearTimeout == "function" ? clearTimeout : null,
    g = typeof setImmediate != "undefined" ? setImmediate : null;
  typeof navigator != "undefined" &&
    navigator.scheduling !== void 0 &&
    navigator.scheduling.isInputPending !== void 0 &&
    navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function w(M) {
    for (var $ = n(u); $ !== null; ) {
      if ($.callback === null) r(u);
      else if ($.startTime <= M) r(u), ($.sortIndex = $.expirationTime), t(l, $);
      else break;
      $ = n(u);
    }
  }
  function S(M) {
    if (((y = !1), w(M), !m))
      if (n(l) !== null) (m = !0), te(C);
      else {
        var $ = n(u);
        $ !== null && W(S, $.startTime - M);
      }
  }
  function C(M, $) {
    (m = !1), y && ((y = !1), p(R), (R = -1)), (v = !0);
    var H = d;
    try {
      for (w($), f = n(l); f !== null && (!(f.expirationTime > $) || (M && !U())); ) {
        var q = f.callback;
        if (typeof q == "function") {
          (f.callback = null), (d = f.priorityLevel);
          var oe = q(f.expirationTime <= $);
          ($ = e.unstable_now()), typeof oe == "function" ? (f.callback = oe) : f === n(l) && r(l), w($);
        } else r(l);
        f = n(l);
      }
      if (f !== null) var $e = !0;
      else {
        var Ee = n(u);
        Ee !== null && W(S, Ee.startTime - $), ($e = !1);
      }
      return $e;
    } finally {
      (f = null), (d = H), (v = !1);
    }
  }
  var E = !1,
    P = null,
    R = -1,
    A = 5,
    D = -1;
  function U() {
    return !(e.unstable_now() - D < A);
  }
  function I() {
    if (P !== null) {
      var M = e.unstable_now();
      D = M;
      var $ = !0;
      try {
        $ = P(!0, M);
      } finally {
        $ ? Q() : ((E = !1), (P = null));
      }
    } else E = !1;
  }
  var Q;
  if (typeof g == "function")
    Q = function () {
      g(I);
    };
  else if (typeof MessageChannel != "undefined") {
    var X = new MessageChannel(),
      B = X.port2;
    (X.port1.onmessage = I),
      (Q = function () {
        B.postMessage(null);
      });
  } else
    Q = function () {
      x(I, 0);
    };
  function te(M) {
    (P = M), E || ((E = !0), Q());
  }
  function W(M, $) {
    R = x(function () {
      M(e.unstable_now());
    }, $);
  }
  (e.unstable_IdlePriority = 5),
    (e.unstable_ImmediatePriority = 1),
    (e.unstable_LowPriority = 4),
    (e.unstable_NormalPriority = 3),
    (e.unstable_Profiling = null),
    (e.unstable_UserBlockingPriority = 2),
    (e.unstable_cancelCallback = function (M) {
      M.callback = null;
    }),
    (e.unstable_continueExecution = function () {
      m || v || ((m = !0), te(C));
    }),
    (e.unstable_forceFrameRate = function (M) {
      0 > M || 125 < M
        ? console.error(
            "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
          )
        : (A = 0 < M ? Math.floor(1e3 / M) : 5);
    }),
    (e.unstable_getCurrentPriorityLevel = function () {
      return d;
    }),
    (e.unstable_getFirstCallbackNode = function () {
      return n(l);
    }),
    (e.unstable_next = function (M) {
      switch (d) {
        case 1:
        case 2:
        case 3:
          var $ = 3;
          break;
        default:
          $ = d;
      }
      var H = d;
      d = $;
      try {
        return M();
      } finally {
        d = H;
      }
    }),
    (e.unstable_pauseExecution = function () {}),
    (e.unstable_requestPaint = function () {}),
    (e.unstable_runWithPriority = function (M, $) {
      switch (M) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          M = 3;
      }
      var H = d;
      d = M;
      try {
        return $();
      } finally {
        d = H;
      }
    }),
    (e.unstable_scheduleCallback = function (M, $, H) {
      var q = e.unstable_now();
      switch (
        (typeof H == "object" && H !== null
          ? ((H = H.delay), (H = typeof H == "number" && 0 < H ? q + H : q))
          : (H = q),
        M)
      ) {
        case 1:
          var oe = -1;
          break;
        case 2:
          oe = 250;
          break;
        case 5:
          oe = 1073741823;
          break;
        case 4:
          oe = 1e4;
          break;
        default:
          oe = 5e3;
      }
      return (
        (oe = H + oe),
        (M = { id: c++, callback: $, priorityLevel: M, startTime: H, expirationTime: oe, sortIndex: -1 }),
        H > q
          ? ((M.sortIndex = H), t(u, M), n(l) === null && M === n(u) && (y ? (p(R), (R = -1)) : (y = !0), W(S, H - q)))
          : ((M.sortIndex = oe), t(l, M), m || v || ((m = !0), te(C))),
        M
      );
    }),
    (e.unstable_shouldYield = U),
    (e.unstable_wrapCallback = function (M) {
      var $ = d;
      return function () {
        var H = d;
        d = $;
        try {
          return M.apply(this, arguments);
        } finally {
          d = H;
        }
      };
    });
})(ev);
Zy.exports = ev;
var fE = Zy.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var dE = h,
  jt = fE;
function j(e) {
  for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++)
    t += "&args[]=" + encodeURIComponent(arguments[n]);
  return (
    "Minified React error #" +
    e +
    "; visit " +
    t +
    " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
  );
}
var tv = new Set(),
  us = {};
function ho(e, t) {
  Xo(e, t), Xo(e + "Capture", t);
}
function Xo(e, t) {
  for (us[e] = t, e = 0; e < t.length; e++) tv.add(t[e]);
}
var Wn = !(
    typeof window == "undefined" ||
    typeof window.document == "undefined" ||
    typeof window.document.createElement == "undefined"
  ),
  nf = Object.prototype.hasOwnProperty,
  pE =
    /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
  Uh = {},
  Bh = {};
function hE(e) {
  return nf.call(Bh, e) ? !0 : nf.call(Uh, e) ? !1 : pE.test(e) ? (Bh[e] = !0) : ((Uh[e] = !0), !1);
}
function mE(e, t, n, r) {
  if (n !== null && n.type === 0) return !1;
  switch (typeof t) {
    case "function":
    case "symbol":
      return !0;
    case "boolean":
      return r
        ? !1
        : n !== null
        ? !n.acceptsBooleans
        : ((e = e.toLowerCase().slice(0, 5)), e !== "data-" && e !== "aria-");
    default:
      return !1;
  }
}
function gE(e, t, n, r) {
  if (t === null || typeof t == "undefined" || mE(e, t, n, r)) return !0;
  if (r) return !1;
  if (n !== null)
    switch (n.type) {
      case 3:
        return !t;
      case 4:
        return t === !1;
      case 5:
        return isNaN(t);
      case 6:
        return isNaN(t) || 1 > t;
    }
  return !1;
}
function xt(e, t, n, r, o, i, s) {
  (this.acceptsBooleans = t === 2 || t === 3 || t === 4),
    (this.attributeName = r),
    (this.attributeNamespace = o),
    (this.mustUseProperty = n),
    (this.propertyName = e),
    (this.type = t),
    (this.sanitizeURL = i),
    (this.removeEmptyString = s);
}
var lt = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style"
  .split(" ")
  .forEach(function (e) {
    lt[e] = new xt(e, 0, !1, e, null, !1, !1);
  });
[
  ["acceptCharset", "accept-charset"],
  ["className", "class"],
  ["htmlFor", "for"],
  ["httpEquiv", "http-equiv"],
].forEach(function (e) {
  var t = e[0];
  lt[t] = new xt(t, 1, !1, e[1], null, !1, !1);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function (e) {
  lt[e] = new xt(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function (e) {
  lt[e] = new xt(e, 2, !1, e, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope"
  .split(" ")
  .forEach(function (e) {
    lt[e] = new xt(e, 3, !1, e.toLowerCase(), null, !1, !1);
  });
["checked", "multiple", "muted", "selected"].forEach(function (e) {
  lt[e] = new xt(e, 3, !0, e, null, !1, !1);
});
["capture", "download"].forEach(function (e) {
  lt[e] = new xt(e, 4, !1, e, null, !1, !1);
});
["cols", "rows", "size", "span"].forEach(function (e) {
  lt[e] = new xt(e, 6, !1, e, null, !1, !1);
});
["rowSpan", "start"].forEach(function (e) {
  lt[e] = new xt(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var Id = /[\-:]([a-z])/g;
function $d(e) {
  return e[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height"
  .split(" ")
  .forEach(function (e) {
    var t = e.replace(Id, $d);
    lt[t] = new xt(t, 1, !1, e, null, !1, !1);
  });
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function (e) {
  var t = e.replace(Id, $d);
  lt[t] = new xt(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
});
["xml:base", "xml:lang", "xml:space"].forEach(function (e) {
  var t = e.replace(Id, $d);
  lt[t] = new xt(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
["tabIndex", "crossOrigin"].forEach(function (e) {
  lt[e] = new xt(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
lt.xlinkHref = new xt("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1);
["src", "href", "action", "formAction"].forEach(function (e) {
  lt[e] = new xt(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function zd(e, t, n, r) {
  var o = lt.hasOwnProperty(t) ? lt[t] : null;
  (o !== null
    ? o.type !== 0
    : r || !(2 < t.length) || (t[0] !== "o" && t[0] !== "O") || (t[1] !== "n" && t[1] !== "N")) &&
    (gE(t, n, o, r) && (n = null),
    r || o === null
      ? hE(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n))
      : o.mustUseProperty
      ? (e[o.propertyName] = n === null ? (o.type === 3 ? !1 : "") : n)
      : ((t = o.attributeName),
        (r = o.attributeNamespace),
        n === null
          ? e.removeAttribute(t)
          : ((o = o.type),
            (n = o === 3 || (o === 4 && n === !0) ? "" : "" + n),
            r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
}
var Zn = dE.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  la = Symbol.for("react.element"),
  Po = Symbol.for("react.portal"),
  Oo = Symbol.for("react.fragment"),
  Ud = Symbol.for("react.strict_mode"),
  rf = Symbol.for("react.profiler"),
  nv = Symbol.for("react.provider"),
  rv = Symbol.for("react.context"),
  Bd = Symbol.for("react.forward_ref"),
  of = Symbol.for("react.suspense"),
  sf = Symbol.for("react.suspense_list"),
  Vd = Symbol.for("react.memo"),
  dr = Symbol.for("react.lazy"),
  ov = Symbol.for("react.offscreen"),
  Vh = Symbol.iterator;
function _i(e) {
  return e === null || typeof e != "object"
    ? null
    : ((e = (Vh && e[Vh]) || e["@@iterator"]), typeof e == "function" ? e : null);
}
var je = Object.assign,
  Zu;
function Wi(e) {
  if (Zu === void 0)
    try {
      throw Error();
    } catch (n) {
      var t = n.stack.trim().match(/\n( *(at )?)/);
      Zu = (t && t[1]) || "";
    }
  return (
    `
` +
    Zu +
    e
  );
}
var ec = !1;
function tc(e, t) {
  if (!e || ec) return "";
  ec = !0;
  var n = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (t)
      if (
        ((t = function () {
          throw Error();
        }),
        Object.defineProperty(t.prototype, "props", {
          set: function () {
            throw Error();
          },
        }),
        typeof Reflect == "object" && Reflect.construct)
      ) {
        try {
          Reflect.construct(t, []);
        } catch (u) {
          var r = u;
        }
        Reflect.construct(e, [], t);
      } else {
        try {
          t.call();
        } catch (u) {
          r = u;
        }
        e.call(t.prototype);
      }
    else {
      try {
        throw Error();
      } catch (u) {
        r = u;
      }
      e();
    }
  } catch (u) {
    if (u && r && typeof u.stack == "string") {
      for (
        var o = u.stack.split(`
`),
          i = r.stack.split(`
`),
          s = o.length - 1,
          a = i.length - 1;
        1 <= s && 0 <= a && o[s] !== i[a];

      )
        a--;
      for (; 1 <= s && 0 <= a; s--, a--)
        if (o[s] !== i[a]) {
          if (s !== 1 || a !== 1)
            do
              if ((s--, a--, 0 > a || o[s] !== i[a])) {
                var l =
                  `
` + o[s].replace(" at new ", " at ");
                return e.displayName && l.includes("<anonymous>") && (l = l.replace("<anonymous>", e.displayName)), l;
              }
            while (1 <= s && 0 <= a);
          break;
        }
    }
  } finally {
    (ec = !1), (Error.prepareStackTrace = n);
  }
  return (e = e ? e.displayName || e.name : "") ? Wi(e) : "";
}
function yE(e) {
  switch (e.tag) {
    case 5:
      return Wi(e.type);
    case 16:
      return Wi("Lazy");
    case 13:
      return Wi("Suspense");
    case 19:
      return Wi("SuspenseList");
    case 0:
    case 2:
    case 15:
      return (e = tc(e.type, !1)), e;
    case 11:
      return (e = tc(e.type.render, !1)), e;
    case 1:
      return (e = tc(e.type, !0)), e;
    default:
      return "";
  }
}
function af(e) {
  if (e == null) return null;
  if (typeof e == "function") return e.displayName || e.name || null;
  if (typeof e == "string") return e;
  switch (e) {
    case Oo:
      return "Fragment";
    case Po:
      return "Portal";
    case rf:
      return "Profiler";
    case Ud:
      return "StrictMode";
    case of:
      return "Suspense";
    case sf:
      return "SuspenseList";
  }
  if (typeof e == "object")
    switch (e.$$typeof) {
      case rv:
        return (e.displayName || "Context") + ".Consumer";
      case nv:
        return (e._context.displayName || "Context") + ".Provider";
      case Bd:
        var t = e.render;
        return (
          (e = e.displayName),
          e || ((e = t.displayName || t.name || ""), (e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef")),
          e
        );
      case Vd:
        return (t = e.displayName || null), t !== null ? t : af(e.type) || "Memo";
      case dr:
        (t = e._payload), (e = e._init);
        try {
          return af(e(t));
        } catch (n) {}
    }
  return null;
}
function vE(e) {
  var t = e.type;
  switch (e.tag) {
    case 24:
      return "Cache";
    case 9:
      return (t.displayName || "Context") + ".Consumer";
    case 10:
      return (t._context.displayName || "Context") + ".Provider";
    case 18:
      return "DehydratedFragment";
    case 11:
      return (
        (e = t.render),
        (e = e.displayName || e.name || ""),
        t.displayName || (e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef")
      );
    case 7:
      return "Fragment";
    case 5:
      return t;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return af(t);
    case 8:
      return t === Ud ? "StrictMode" : "Mode";
    case 22:
      return "Offscreen";
    case 12:
      return "Profiler";
    case 21:
      return "Scope";
    case 13:
      return "Suspense";
    case 19:
      return "SuspenseList";
    case 25:
      return "TracingMarker";
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if (typeof t == "function") return t.displayName || t.name || null;
      if (typeof t == "string") return t;
  }
  return null;
}
function Rr(e) {
  switch (typeof e) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return e;
    case "object":
      return e;
    default:
      return "";
  }
}
function iv(e) {
  var t = e.type;
  return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
}
function wE(e) {
  var t = iv(e) ? "checked" : "value",
    n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t),
    r = "" + e[t];
  if (!e.hasOwnProperty(t) && typeof n != "undefined" && typeof n.get == "function" && typeof n.set == "function") {
    var o = n.get,
      i = n.set;
    return (
      Object.defineProperty(e, t, {
        configurable: !0,
        get: function () {
          return o.call(this);
        },
        set: function (s) {
          (r = "" + s), i.call(this, s);
        },
      }),
      Object.defineProperty(e, t, { enumerable: n.enumerable }),
      {
        getValue: function () {
          return r;
        },
        setValue: function (s) {
          r = "" + s;
        },
        stopTracking: function () {
          (e._valueTracker = null), delete e[t];
        },
      }
    );
  }
}
function ua(e) {
  e._valueTracker || (e._valueTracker = wE(e));
}
function sv(e) {
  if (!e) return !1;
  var t = e._valueTracker;
  if (!t) return !0;
  var n = t.getValue(),
    r = "";
  return e && (r = iv(e) ? (e.checked ? "true" : "false") : e.value), (e = r), e !== n ? (t.setValue(e), !0) : !1;
}
function yl(e) {
  if (((e = e || (typeof document != "undefined" ? document : void 0)), typeof e == "undefined")) return null;
  try {
    return e.activeElement || e.body;
  } catch (t) {
    return e.body;
  }
}
function lf(e, t) {
  var n = t.checked;
  return je({}, t, {
    defaultChecked: void 0,
    defaultValue: void 0,
    value: void 0,
    checked: n != null ? n : e._wrapperState.initialChecked,
  });
}
function Wh(e, t) {
  var n = t.defaultValue == null ? "" : t.defaultValue,
    r = t.checked != null ? t.checked : t.defaultChecked;
  (n = Rr(t.value != null ? t.value : n)),
    (e._wrapperState = {
      initialChecked: r,
      initialValue: n,
      controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null,
    });
}
function av(e, t) {
  (t = t.checked), t != null && zd(e, "checked", t, !1);
}
function uf(e, t) {
  av(e, t);
  var n = Rr(t.value),
    r = t.type;
  if (n != null)
    r === "number"
      ? ((n === 0 && e.value === "") || e.value != n) && (e.value = "" + n)
      : e.value !== "" + n && (e.value = "" + n);
  else if (r === "submit" || r === "reset") {
    e.removeAttribute("value");
    return;
  }
  t.hasOwnProperty("value") ? cf(e, t.type, n) : t.hasOwnProperty("defaultValue") && cf(e, t.type, Rr(t.defaultValue)),
    t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
}
function Hh(e, t, n) {
  if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
    var r = t.type;
    if (!((r !== "submit" && r !== "reset") || (t.value !== void 0 && t.value !== null))) return;
    (t = "" + e._wrapperState.initialValue), n || t === e.value || (e.value = t), (e.defaultValue = t);
  }
  (n = e.name),
    n !== "" && (e.name = ""),
    (e.defaultChecked = !!e._wrapperState.initialChecked),
    n !== "" && (e.name = n);
}
function cf(e, t, n) {
  (t !== "number" || yl(e.ownerDocument) !== e) &&
    (n == null
      ? (e.defaultValue = "" + e._wrapperState.initialValue)
      : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
}
var Hi = Array.isArray;
function Vo(e, t, n, r) {
  if (((e = e.options), t)) {
    t = {};
    for (var o = 0; o < n.length; o++) t["$" + n[o]] = !0;
    for (n = 0; n < e.length; n++)
      (o = t.hasOwnProperty("$" + e[n].value)),
        e[n].selected !== o && (e[n].selected = o),
        o && r && (e[n].defaultSelected = !0);
  } else {
    for (n = "" + Rr(n), t = null, o = 0; o < e.length; o++) {
      if (e[o].value === n) {
        (e[o].selected = !0), r && (e[o].defaultSelected = !0);
        return;
      }
      t !== null || e[o].disabled || (t = e[o]);
    }
    t !== null && (t.selected = !0);
  }
}
function ff(e, t) {
  if (t.dangerouslySetInnerHTML != null) throw Error(j(91));
  return je({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
}
function Kh(e, t) {
  var n = t.value;
  if (n == null) {
    if (((n = t.children), (t = t.defaultValue), n != null)) {
      if (t != null) throw Error(j(92));
      if (Hi(n)) {
        if (1 < n.length) throw Error(j(93));
        n = n[0];
      }
      t = n;
    }
    t == null && (t = ""), (n = t);
  }
  e._wrapperState = { initialValue: Rr(n) };
}
function lv(e, t) {
  var n = Rr(t.value),
    r = Rr(t.defaultValue);
  n != null &&
    ((n = "" + n),
    n !== e.value && (e.value = n),
    t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)),
    r != null && (e.defaultValue = "" + r);
}
function qh(e) {
  var t = e.textContent;
  t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
}
function uv(e) {
  switch (e) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function df(e, t) {
  return e == null || e === "http://www.w3.org/1999/xhtml"
    ? uv(t)
    : e === "http://www.w3.org/2000/svg" && t === "foreignObject"
    ? "http://www.w3.org/1999/xhtml"
    : e;
}
var ca,
  cv = (function (e) {
    return typeof MSApp != "undefined" && MSApp.execUnsafeLocalFunction
      ? function (t, n, r, o) {
          MSApp.execUnsafeLocalFunction(function () {
            return e(t, n, r, o);
          });
        }
      : e;
  })(function (e, t) {
    if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
    else {
      for (
        ca = ca || document.createElement("div"),
          ca.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>",
          t = ca.firstChild;
        e.firstChild;

      )
        e.removeChild(e.firstChild);
      for (; t.firstChild; ) e.appendChild(t.firstChild);
    }
  });
function cs(e, t) {
  if (t) {
    var n = e.firstChild;
    if (n && n === e.lastChild && n.nodeType === 3) {
      n.nodeValue = t;
      return;
    }
  }
  e.textContent = t;
}
var Xi = {
    animationIterationCount: !0,
    aspectRatio: !0,
    borderImageOutset: !0,
    borderImageSlice: !0,
    borderImageWidth: !0,
    boxFlex: !0,
    boxFlexGroup: !0,
    boxOrdinalGroup: !0,
    columnCount: !0,
    columns: !0,
    flex: !0,
    flexGrow: !0,
    flexPositive: !0,
    flexShrink: !0,
    flexNegative: !0,
    flexOrder: !0,
    gridArea: !0,
    gridRow: !0,
    gridRowEnd: !0,
    gridRowSpan: !0,
    gridRowStart: !0,
    gridColumn: !0,
    gridColumnEnd: !0,
    gridColumnSpan: !0,
    gridColumnStart: !0,
    fontWeight: !0,
    lineClamp: !0,
    lineHeight: !0,
    opacity: !0,
    order: !0,
    orphans: !0,
    tabSize: !0,
    widows: !0,
    zIndex: !0,
    zoom: !0,
    fillOpacity: !0,
    floodOpacity: !0,
    stopOpacity: !0,
    strokeDasharray: !0,
    strokeDashoffset: !0,
    strokeMiterlimit: !0,
    strokeOpacity: !0,
    strokeWidth: !0,
  },
  xE = ["Webkit", "ms", "Moz", "O"];
Object.keys(Xi).forEach(function (e) {
  xE.forEach(function (t) {
    (t = t + e.charAt(0).toUpperCase() + e.substring(1)), (Xi[t] = Xi[e]);
  });
});
function fv(e, t, n) {
  return t == null || typeof t == "boolean" || t === ""
    ? ""
    : n || typeof t != "number" || t === 0 || (Xi.hasOwnProperty(e) && Xi[e])
    ? ("" + t).trim()
    : t + "px";
}
function dv(e, t) {
  e = e.style;
  for (var n in t)
    if (t.hasOwnProperty(n)) {
      var r = n.indexOf("--") === 0,
        o = fv(n, t[n], r);
      n === "float" && (n = "cssFloat"), r ? e.setProperty(n, o) : (e[n] = o);
    }
}
var SE = je(
  { menuitem: !0 },
  {
    area: !0,
    base: !0,
    br: !0,
    col: !0,
    embed: !0,
    hr: !0,
    img: !0,
    input: !0,
    keygen: !0,
    link: !0,
    meta: !0,
    param: !0,
    source: !0,
    track: !0,
    wbr: !0,
  }
);
function pf(e, t) {
  if (t) {
    if (SE[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(j(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null) throw Error(j(60));
      if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(j(61));
    }
    if (t.style != null && typeof t.style != "object") throw Error(j(62));
  }
}
function hf(e, t) {
  if (e.indexOf("-") === -1) return typeof t.is == "string";
  switch (e) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return !1;
    default:
      return !0;
  }
}
var mf = null;
function Wd(e) {
  return (
    (e = e.target || e.srcElement || window),
    e.correspondingUseElement && (e = e.correspondingUseElement),
    e.nodeType === 3 ? e.parentNode : e
  );
}
var gf = null,
  Wo = null,
  Ho = null;
function Gh(e) {
  if ((e = Is(e))) {
    if (typeof gf != "function") throw Error(j(280));
    var t = e.stateNode;
    t && ((t = lu(t)), gf(e.stateNode, e.type, t));
  }
}
function pv(e) {
  Wo ? (Ho ? Ho.push(e) : (Ho = [e])) : (Wo = e);
}
function hv() {
  if (Wo) {
    var e = Wo,
      t = Ho;
    if (((Ho = Wo = null), Gh(e), t)) for (e = 0; e < t.length; e++) Gh(t[e]);
  }
}
function mv(e, t) {
  return e(t);
}
function gv() {}
var nc = !1;
function yv(e, t, n) {
  if (nc) return e(t, n);
  nc = !0;
  try {
    return mv(e, t, n);
  } finally {
    (nc = !1), (Wo !== null || Ho !== null) && (gv(), hv());
  }
}
function fs(e, t) {
  var n = e.stateNode;
  if (n === null) return null;
  var r = lu(n);
  if (r === null) return null;
  n = r[t];
  e: switch (t) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
    case "onMouseEnter":
      (r = !r.disabled) ||
        ((e = e.type), (r = !(e === "button" || e === "input" || e === "select" || e === "textarea"))),
        (e = !r);
      break e;
    default:
      e = !1;
  }
  if (e) return null;
  if (n && typeof n != "function") throw Error(j(231, t, typeof n));
  return n;
}
var yf = !1;
if (Wn)
  try {
    var Ti = {};
    Object.defineProperty(Ti, "passive", {
      get: function () {
        yf = !0;
      },
    }),
      window.addEventListener("test", Ti, Ti),
      window.removeEventListener("test", Ti, Ti);
  } catch (e) {
    yf = !1;
  }
function EE(e, t, n, r, o, i, s, a, l) {
  var u = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(n, u);
  } catch (c) {
    this.onError(c);
  }
}
var Ji = !1,
  vl = null,
  wl = !1,
  vf = null,
  CE = {
    onError: function (e) {
      (Ji = !0), (vl = e);
    },
  };
function bE(e, t, n, r, o, i, s, a, l) {
  (Ji = !1), (vl = null), EE.apply(CE, arguments);
}
function kE(e, t, n, r, o, i, s, a, l) {
  if ((bE.apply(this, arguments), Ji)) {
    if (Ji) {
      var u = vl;
      (Ji = !1), (vl = null);
    } else throw Error(j(198));
    wl || ((wl = !0), (vf = u));
  }
}
function mo(e) {
  var t = e,
    n = e;
  if (e.alternate) for (; t.return; ) t = t.return;
  else {
    e = t;
    do (t = e), t.flags & 4098 && (n = t.return), (e = t.return);
    while (e);
  }
  return t.tag === 3 ? n : null;
}
function vv(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null)) return t.dehydrated;
  }
  return null;
}
function Qh(e) {
  if (mo(e) !== e) throw Error(j(188));
}
function _E(e) {
  var t = e.alternate;
  if (!t) {
    if (((t = mo(e)), t === null)) throw Error(j(188));
    return t !== e ? null : e;
  }
  for (var n = e, r = t; ; ) {
    var o = n.return;
    if (o === null) break;
    var i = o.alternate;
    if (i === null) {
      if (((r = o.return), r !== null)) {
        n = r;
        continue;
      }
      break;
    }
    if (o.child === i.child) {
      for (i = o.child; i; ) {
        if (i === n) return Qh(o), e;
        if (i === r) return Qh(o), t;
        i = i.sibling;
      }
      throw Error(j(188));
    }
    if (n.return !== r.return) (n = o), (r = i);
    else {
      for (var s = !1, a = o.child; a; ) {
        if (a === n) {
          (s = !0), (n = o), (r = i);
          break;
        }
        if (a === r) {
          (s = !0), (r = o), (n = i);
          break;
        }
        a = a.sibling;
      }
      if (!s) {
        for (a = i.child; a; ) {
          if (a === n) {
            (s = !0), (n = i), (r = o);
            break;
          }
          if (a === r) {
            (s = !0), (r = i), (n = o);
            break;
          }
          a = a.sibling;
        }
        if (!s) throw Error(j(189));
      }
    }
    if (n.alternate !== r) throw Error(j(190));
  }
  if (n.tag !== 3) throw Error(j(188));
  return n.stateNode.current === n ? e : t;
}
function wv(e) {
  return (e = _E(e)), e !== null ? xv(e) : null;
}
function xv(e) {
  if (e.tag === 5 || e.tag === 6) return e;
  for (e = e.child; e !== null; ) {
    var t = xv(e);
    if (t !== null) return t;
    e = e.sibling;
  }
  return null;
}
var Sv = jt.unstable_scheduleCallback,
  Yh = jt.unstable_cancelCallback,
  TE = jt.unstable_shouldYield,
  RE = jt.unstable_requestPaint,
  Be = jt.unstable_now,
  PE = jt.unstable_getCurrentPriorityLevel,
  Hd = jt.unstable_ImmediatePriority,
  Ev = jt.unstable_UserBlockingPriority,
  xl = jt.unstable_NormalPriority,
  OE = jt.unstable_LowPriority,
  Cv = jt.unstable_IdlePriority,
  ou = null,
  Cn = null;
function AE(e) {
  if (Cn && typeof Cn.onCommitFiberRoot == "function")
    try {
      Cn.onCommitFiberRoot(ou, e, void 0, (e.current.flags & 128) === 128);
    } catch (t) {}
}
var cn = Math.clz32 ? Math.clz32 : DE,
  NE = Math.log,
  LE = Math.LN2;
function DE(e) {
  return (e >>>= 0), e === 0 ? 32 : (31 - ((NE(e) / LE) | 0)) | 0;
}
var fa = 64,
  da = 4194304;
function Ki(e) {
  switch (e & -e) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return e & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return e & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return e;
  }
}
function Sl(e, t) {
  var n = e.pendingLanes;
  if (n === 0) return 0;
  var r = 0,
    o = e.suspendedLanes,
    i = e.pingedLanes,
    s = n & 268435455;
  if (s !== 0) {
    var a = s & ~o;
    a !== 0 ? (r = Ki(a)) : ((i &= s), i !== 0 && (r = Ki(i)));
  } else (s = n & ~o), s !== 0 ? (r = Ki(s)) : i !== 0 && (r = Ki(i));
  if (r === 0) return 0;
  if (t !== 0 && t !== r && !(t & o) && ((o = r & -r), (i = t & -t), o >= i || (o === 16 && (i & 4194240) !== 0)))
    return t;
  if ((r & 4 && (r |= n & 16), (t = e.entangledLanes), t !== 0))
    for (e = e.entanglements, t &= r; 0 < t; ) (n = 31 - cn(t)), (o = 1 << n), (r |= e[n]), (t &= ~o);
  return r;
}
function ME(e, t) {
  switch (e) {
    case 1:
    case 2:
    case 4:
      return t + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return t + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function jE(e, t) {
  for (var n = e.suspendedLanes, r = e.pingedLanes, o = e.expirationTimes, i = e.pendingLanes; 0 < i; ) {
    var s = 31 - cn(i),
      a = 1 << s,
      l = o[s];
    l === -1 ? (!(a & n) || a & r) && (o[s] = ME(a, t)) : l <= t && (e.expiredLanes |= a), (i &= ~a);
  }
}
function wf(e) {
  return (e = e.pendingLanes & -1073741825), e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
}
function bv() {
  var e = fa;
  return (fa <<= 1), !(fa & 4194240) && (fa = 64), e;
}
function rc(e) {
  for (var t = [], n = 0; 31 > n; n++) t.push(e);
  return t;
}
function js(e, t, n) {
  (e.pendingLanes |= t),
    t !== 536870912 && ((e.suspendedLanes = 0), (e.pingedLanes = 0)),
    (e = e.eventTimes),
    (t = 31 - cn(t)),
    (e[t] = n);
}
function FE(e, t) {
  var n = e.pendingLanes & ~t;
  (e.pendingLanes = t),
    (e.suspendedLanes = 0),
    (e.pingedLanes = 0),
    (e.expiredLanes &= t),
    (e.mutableReadLanes &= t),
    (e.entangledLanes &= t),
    (t = e.entanglements);
  var r = e.eventTimes;
  for (e = e.expirationTimes; 0 < n; ) {
    var o = 31 - cn(n),
      i = 1 << o;
    (t[o] = 0), (r[o] = -1), (e[o] = -1), (n &= ~i);
  }
}
function Kd(e, t) {
  var n = (e.entangledLanes |= t);
  for (e = e.entanglements; n; ) {
    var r = 31 - cn(n),
      o = 1 << r;
    (o & t) | (e[r] & t) && (e[r] |= t), (n &= ~o);
  }
}
var we = 0;
function kv(e) {
  return (e &= -e), 1 < e ? (4 < e ? (e & 268435455 ? 16 : 536870912) : 4) : 1;
}
var _v,
  qd,
  Tv,
  Rv,
  Pv,
  xf = !1,
  pa = [],
  xr = null,
  Sr = null,
  Er = null,
  ds = new Map(),
  ps = new Map(),
  hr = [],
  IE =
    "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(
      " "
    );
function Xh(e, t) {
  switch (e) {
    case "focusin":
    case "focusout":
      xr = null;
      break;
    case "dragenter":
    case "dragleave":
      Sr = null;
      break;
    case "mouseover":
    case "mouseout":
      Er = null;
      break;
    case "pointerover":
    case "pointerout":
      ds.delete(t.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      ps.delete(t.pointerId);
  }
}
function Ri(e, t, n, r, o, i) {
  return e === null || e.nativeEvent !== i
    ? ((e = { blockedOn: t, domEventName: n, eventSystemFlags: r, nativeEvent: i, targetContainers: [o] }),
      t !== null && ((t = Is(t)), t !== null && qd(t)),
      e)
    : ((e.eventSystemFlags |= r), (t = e.targetContainers), o !== null && t.indexOf(o) === -1 && t.push(o), e);
}
function $E(e, t, n, r, o) {
  switch (t) {
    case "focusin":
      return (xr = Ri(xr, e, t, n, r, o)), !0;
    case "dragenter":
      return (Sr = Ri(Sr, e, t, n, r, o)), !0;
    case "mouseover":
      return (Er = Ri(Er, e, t, n, r, o)), !0;
    case "pointerover":
      var i = o.pointerId;
      return ds.set(i, Ri(ds.get(i) || null, e, t, n, r, o)), !0;
    case "gotpointercapture":
      return (i = o.pointerId), ps.set(i, Ri(ps.get(i) || null, e, t, n, r, o)), !0;
  }
  return !1;
}
function Ov(e) {
  var t = Yr(e.target);
  if (t !== null) {
    var n = mo(t);
    if (n !== null) {
      if (((t = n.tag), t === 13)) {
        if (((t = vv(n)), t !== null)) {
          (e.blockedOn = t),
            Pv(e.priority, function () {
              Tv(n);
            });
          return;
        }
      } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
        e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
        return;
      }
    }
  }
  e.blockedOn = null;
}
function Ka(e) {
  if (e.blockedOn !== null) return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = Sf(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (n === null) {
      n = e.nativeEvent;
      var r = new n.constructor(n.type, n);
      (mf = r), n.target.dispatchEvent(r), (mf = null);
    } else return (t = Is(n)), t !== null && qd(t), (e.blockedOn = n), !1;
    t.shift();
  }
  return !0;
}
function Jh(e, t, n) {
  Ka(e) && n.delete(t);
}
function zE() {
  (xf = !1),
    xr !== null && Ka(xr) && (xr = null),
    Sr !== null && Ka(Sr) && (Sr = null),
    Er !== null && Ka(Er) && (Er = null),
    ds.forEach(Jh),
    ps.forEach(Jh);
}
function Pi(e, t) {
  e.blockedOn === t &&
    ((e.blockedOn = null), xf || ((xf = !0), jt.unstable_scheduleCallback(jt.unstable_NormalPriority, zE)));
}
function hs(e) {
  function t(o) {
    return Pi(o, e);
  }
  if (0 < pa.length) {
    Pi(pa[0], e);
    for (var n = 1; n < pa.length; n++) {
      var r = pa[n];
      r.blockedOn === e && (r.blockedOn = null);
    }
  }
  for (
    xr !== null && Pi(xr, e), Sr !== null && Pi(Sr, e), Er !== null && Pi(Er, e), ds.forEach(t), ps.forEach(t), n = 0;
    n < hr.length;
    n++
  )
    (r = hr[n]), r.blockedOn === e && (r.blockedOn = null);
  for (; 0 < hr.length && ((n = hr[0]), n.blockedOn === null); ) Ov(n), n.blockedOn === null && hr.shift();
}
var Ko = Zn.ReactCurrentBatchConfig,
  El = !0;
function UE(e, t, n, r) {
  var o = we,
    i = Ko.transition;
  Ko.transition = null;
  try {
    (we = 1), Gd(e, t, n, r);
  } finally {
    (we = o), (Ko.transition = i);
  }
}
function BE(e, t, n, r) {
  var o = we,
    i = Ko.transition;
  Ko.transition = null;
  try {
    (we = 4), Gd(e, t, n, r);
  } finally {
    (we = o), (Ko.transition = i);
  }
}
function Gd(e, t, n, r) {
  if (El) {
    var o = Sf(e, t, n, r);
    if (o === null) pc(e, t, r, Cl, n), Xh(e, r);
    else if ($E(o, e, t, n, r)) r.stopPropagation();
    else if ((Xh(e, r), t & 4 && -1 < IE.indexOf(e))) {
      for (; o !== null; ) {
        var i = Is(o);
        if ((i !== null && _v(i), (i = Sf(e, t, n, r)), i === null && pc(e, t, r, Cl, n), i === o)) break;
        o = i;
      }
      o !== null && r.stopPropagation();
    } else pc(e, t, r, null, n);
  }
}
var Cl = null;
function Sf(e, t, n, r) {
  if (((Cl = null), (e = Wd(r)), (e = Yr(e)), e !== null))
    if (((t = mo(e)), t === null)) e = null;
    else if (((n = t.tag), n === 13)) {
      if (((e = vv(t)), e !== null)) return e;
      e = null;
    } else if (n === 3) {
      if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
      e = null;
    } else t !== e && (e = null);
  return (Cl = e), null;
}
function Av(e) {
  switch (e) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 1;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 4;
    case "message":
      switch (PE()) {
        case Hd:
          return 1;
        case Ev:
          return 4;
        case xl:
        case OE:
          return 16;
        case Cv:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var yr = null,
  Qd = null,
  qa = null;
function Nv() {
  if (qa) return qa;
  var e,
    t = Qd,
    n = t.length,
    r,
    o = "value" in yr ? yr.value : yr.textContent,
    i = o.length;
  for (e = 0; e < n && t[e] === o[e]; e++);
  var s = n - e;
  for (r = 1; r <= s && t[n - r] === o[i - r]; r++);
  return (qa = o.slice(e, 1 < r ? 1 - r : void 0));
}
function Ga(e) {
  var t = e.keyCode;
  return (
    "charCode" in e ? ((e = e.charCode), e === 0 && t === 13 && (e = 13)) : (e = t),
    e === 10 && (e = 13),
    32 <= e || e === 13 ? e : 0
  );
}
function ha() {
  return !0;
}
function Zh() {
  return !1;
}
function Ut(e) {
  function t(n, r, o, i, s) {
    (this._reactName = n),
      (this._targetInst = o),
      (this.type = r),
      (this.nativeEvent = i),
      (this.target = s),
      (this.currentTarget = null);
    for (var a in e) e.hasOwnProperty(a) && ((n = e[a]), (this[a] = n ? n(i) : i[a]));
    return (
      (this.isDefaultPrevented = (i.defaultPrevented != null ? i.defaultPrevented : i.returnValue === !1) ? ha : Zh),
      (this.isPropagationStopped = Zh),
      this
    );
  }
  return (
    je(t.prototype, {
      preventDefault: function () {
        this.defaultPrevented = !0;
        var n = this.nativeEvent;
        n &&
          (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1),
          (this.isDefaultPrevented = ha));
      },
      stopPropagation: function () {
        var n = this.nativeEvent;
        n &&
          (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0),
          (this.isPropagationStopped = ha));
      },
      persist: function () {},
      isPersistent: ha,
    }),
    t
  );
}
var hi = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function (e) {
      return e.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0,
  },
  Yd = Ut(hi),
  Fs = je({}, hi, { view: 0, detail: 0 }),
  VE = Ut(Fs),
  oc,
  ic,
  Oi,
  iu = je({}, Fs, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: Xd,
    button: 0,
    buttons: 0,
    relatedTarget: function (e) {
      return e.relatedTarget === void 0
        ? e.fromElement === e.srcElement
          ? e.toElement
          : e.fromElement
        : e.relatedTarget;
    },
    movementX: function (e) {
      return "movementX" in e
        ? e.movementX
        : (e !== Oi &&
            (Oi && e.type === "mousemove"
              ? ((oc = e.screenX - Oi.screenX), (ic = e.screenY - Oi.screenY))
              : (ic = oc = 0),
            (Oi = e)),
          oc);
    },
    movementY: function (e) {
      return "movementY" in e ? e.movementY : ic;
    },
  }),
  em = Ut(iu),
  WE = je({}, iu, { dataTransfer: 0 }),
  HE = Ut(WE),
  KE = je({}, Fs, { relatedTarget: 0 }),
  sc = Ut(KE),
  qE = je({}, hi, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
  GE = Ut(qE),
  QE = je({}, hi, {
    clipboardData: function (e) {
      return "clipboardData" in e ? e.clipboardData : window.clipboardData;
    },
  }),
  YE = Ut(QE),
  XE = je({}, hi, { data: 0 }),
  tm = Ut(XE),
  JE = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified",
  },
  ZE = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta",
  },
  eC = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function tC(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = eC[e]) ? !!t[e] : !1;
}
function Xd() {
  return tC;
}
var nC = je({}, Fs, {
    key: function (e) {
      if (e.key) {
        var t = JE[e.key] || e.key;
        if (t !== "Unidentified") return t;
      }
      return e.type === "keypress"
        ? ((e = Ga(e)), e === 13 ? "Enter" : String.fromCharCode(e))
        : e.type === "keydown" || e.type === "keyup"
        ? ZE[e.keyCode] || "Unidentified"
        : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: Xd,
    charCode: function (e) {
      return e.type === "keypress" ? Ga(e) : 0;
    },
    keyCode: function (e) {
      return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    },
    which: function (e) {
      return e.type === "keypress" ? Ga(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    },
  }),
  rC = Ut(nC),
  oC = je({}, iu, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0,
  }),
  nm = Ut(oC),
  iC = je({}, Fs, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: Xd,
  }),
  sC = Ut(iC),
  aC = je({}, hi, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
  lC = Ut(aC),
  uC = je({}, iu, {
    deltaX: function (e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function (e) {
      return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0,
  }),
  cC = Ut(uC),
  fC = [9, 13, 27, 32],
  Jd = Wn && "CompositionEvent" in window,
  Zi = null;
Wn && "documentMode" in document && (Zi = document.documentMode);
var dC = Wn && "TextEvent" in window && !Zi,
  Lv = Wn && (!Jd || (Zi && 8 < Zi && 11 >= Zi)),
  rm = " ",
  om = !1;
function Dv(e, t) {
  switch (e) {
    case "keyup":
      return fC.indexOf(t.keyCode) !== -1;
    case "keydown":
      return t.keyCode !== 229;
    case "keypress":
    case "mousedown":
    case "focusout":
      return !0;
    default:
      return !1;
  }
}
function Mv(e) {
  return (e = e.detail), typeof e == "object" && "data" in e ? e.data : null;
}
var Ao = !1;
function pC(e, t) {
  switch (e) {
    case "compositionend":
      return Mv(t);
    case "keypress":
      return t.which !== 32 ? null : ((om = !0), rm);
    case "textInput":
      return (e = t.data), e === rm && om ? null : e;
    default:
      return null;
  }
}
function hC(e, t) {
  if (Ao) return e === "compositionend" || (!Jd && Dv(e, t)) ? ((e = Nv()), (qa = Qd = yr = null), (Ao = !1), e) : null;
  switch (e) {
    case "paste":
      return null;
    case "keypress":
      if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
        if (t.char && 1 < t.char.length) return t.char;
        if (t.which) return String.fromCharCode(t.which);
      }
      return null;
    case "compositionend":
      return Lv && t.locale !== "ko" ? null : t.data;
    default:
      return null;
  }
}
var mC = {
  color: !0,
  date: !0,
  datetime: !0,
  "datetime-local": !0,
  email: !0,
  month: !0,
  number: !0,
  password: !0,
  range: !0,
  search: !0,
  tel: !0,
  text: !0,
  time: !0,
  url: !0,
  week: !0,
};
function im(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === "input" ? !!mC[e.type] : t === "textarea";
}
function jv(e, t, n, r) {
  pv(r),
    (t = bl(t, "onChange")),
    0 < t.length && ((n = new Yd("onChange", "change", null, n, r)), e.push({ event: n, listeners: t }));
}
var es = null,
  ms = null;
function gC(e) {
  qv(e, 0);
}
function su(e) {
  var t = Do(e);
  if (sv(t)) return e;
}
function yC(e, t) {
  if (e === "change") return t;
}
var Fv = !1;
if (Wn) {
  var ac;
  if (Wn) {
    var lc = "oninput" in document;
    if (!lc) {
      var sm = document.createElement("div");
      sm.setAttribute("oninput", "return;"), (lc = typeof sm.oninput == "function");
    }
    ac = lc;
  } else ac = !1;
  Fv = ac && (!document.documentMode || 9 < document.documentMode);
}
function am() {
  es && (es.detachEvent("onpropertychange", Iv), (ms = es = null));
}
function Iv(e) {
  if (e.propertyName === "value" && su(ms)) {
    var t = [];
    jv(t, ms, e, Wd(e)), yv(gC, t);
  }
}
function vC(e, t, n) {
  e === "focusin" ? (am(), (es = t), (ms = n), es.attachEvent("onpropertychange", Iv)) : e === "focusout" && am();
}
function wC(e) {
  if (e === "selectionchange" || e === "keyup" || e === "keydown") return su(ms);
}
function xC(e, t) {
  if (e === "click") return su(t);
}
function SC(e, t) {
  if (e === "input" || e === "change") return su(t);
}
function EC(e, t) {
  return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var dn = typeof Object.is == "function" ? Object.is : EC;
function gs(e, t) {
  if (dn(e, t)) return !0;
  if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
  var n = Object.keys(e),
    r = Object.keys(t);
  if (n.length !== r.length) return !1;
  for (r = 0; r < n.length; r++) {
    var o = n[r];
    if (!nf.call(t, o) || !dn(e[o], t[o])) return !1;
  }
  return !0;
}
function lm(e) {
  for (; e && e.firstChild; ) e = e.firstChild;
  return e;
}
function um(e, t) {
  var n = lm(e);
  e = 0;
  for (var r; n; ) {
    if (n.nodeType === 3) {
      if (((r = e + n.textContent.length), e <= t && r >= t)) return { node: n, offset: t - e };
      e = r;
    }
    e: {
      for (; n; ) {
        if (n.nextSibling) {
          n = n.nextSibling;
          break e;
        }
        n = n.parentNode;
      }
      n = void 0;
    }
    n = lm(n);
  }
}
function $v(e, t) {
  return e && t
    ? e === t
      ? !0
      : e && e.nodeType === 3
      ? !1
      : t && t.nodeType === 3
      ? $v(e, t.parentNode)
      : "contains" in e
      ? e.contains(t)
      : e.compareDocumentPosition
      ? !!(e.compareDocumentPosition(t) & 16)
      : !1
    : !1;
}
function zv() {
  for (var e = window, t = yl(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == "string";
    } catch (r) {
      n = !1;
    }
    if (n) e = t.contentWindow;
    else break;
    t = yl(e.document);
  }
  return t;
}
function Zd(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return (
    t &&
    ((t === "input" &&
      (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password")) ||
      t === "textarea" ||
      e.contentEditable === "true")
  );
}
function CC(e) {
  var t = zv(),
    n = e.focusedElem,
    r = e.selectionRange;
  if (t !== n && n && n.ownerDocument && $v(n.ownerDocument.documentElement, n)) {
    if (r !== null && Zd(n)) {
      if (((t = r.start), (e = r.end), e === void 0 && (e = t), "selectionStart" in n))
        (n.selectionStart = t), (n.selectionEnd = Math.min(e, n.value.length));
      else if (((e = ((t = n.ownerDocument || document) && t.defaultView) || window), e.getSelection)) {
        e = e.getSelection();
        var o = n.textContent.length,
          i = Math.min(r.start, o);
        (r = r.end === void 0 ? i : Math.min(r.end, o)),
          !e.extend && i > r && ((o = r), (r = i), (i = o)),
          (o = um(n, i));
        var s = um(n, r);
        o &&
          s &&
          (e.rangeCount !== 1 ||
            e.anchorNode !== o.node ||
            e.anchorOffset !== o.offset ||
            e.focusNode !== s.node ||
            e.focusOffset !== s.offset) &&
          ((t = t.createRange()),
          t.setStart(o.node, o.offset),
          e.removeAllRanges(),
          i > r ? (e.addRange(t), e.extend(s.node, s.offset)) : (t.setEnd(s.node, s.offset), e.addRange(t)));
      }
    }
    for (t = [], e = n; (e = e.parentNode); )
      e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
    for (typeof n.focus == "function" && n.focus(), n = 0; n < t.length; n++)
      (e = t[n]), (e.element.scrollLeft = e.left), (e.element.scrollTop = e.top);
  }
}
var bC = Wn && "documentMode" in document && 11 >= document.documentMode,
  No = null,
  Ef = null,
  ts = null,
  Cf = !1;
function cm(e, t, n) {
  var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
  Cf ||
    No == null ||
    No !== yl(r) ||
    ((r = No),
    "selectionStart" in r && Zd(r)
      ? (r = { start: r.selectionStart, end: r.selectionEnd })
      : ((r = ((r.ownerDocument && r.ownerDocument.defaultView) || window).getSelection()),
        (r = {
          anchorNode: r.anchorNode,
          anchorOffset: r.anchorOffset,
          focusNode: r.focusNode,
          focusOffset: r.focusOffset,
        })),
    (ts && gs(ts, r)) ||
      ((ts = r),
      (r = bl(Ef, "onSelect")),
      0 < r.length &&
        ((t = new Yd("onSelect", "select", null, t, n)), e.push({ event: t, listeners: r }), (t.target = No))));
}
function ma(e, t) {
  var n = {};
  return (n[e.toLowerCase()] = t.toLowerCase()), (n["Webkit" + e] = "webkit" + t), (n["Moz" + e] = "moz" + t), n;
}
var Lo = {
    animationend: ma("Animation", "AnimationEnd"),
    animationiteration: ma("Animation", "AnimationIteration"),
    animationstart: ma("Animation", "AnimationStart"),
    transitionend: ma("Transition", "TransitionEnd"),
  },
  uc = {},
  Uv = {};
Wn &&
  ((Uv = document.createElement("div").style),
  "AnimationEvent" in window ||
    (delete Lo.animationend.animation, delete Lo.animationiteration.animation, delete Lo.animationstart.animation),
  "TransitionEvent" in window || delete Lo.transitionend.transition);
function au(e) {
  if (uc[e]) return uc[e];
  if (!Lo[e]) return e;
  var t = Lo[e],
    n;
  for (n in t) if (t.hasOwnProperty(n) && n in Uv) return (uc[e] = t[n]);
  return e;
}
var Bv = au("animationend"),
  Vv = au("animationiteration"),
  Wv = au("animationstart"),
  Hv = au("transitionend"),
  Kv = new Map(),
  fm =
    "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
      " "
    );
function Mr(e, t) {
  Kv.set(e, t), ho(t, [e]);
}
for (var cc = 0; cc < fm.length; cc++) {
  var fc = fm[cc],
    kC = fc.toLowerCase(),
    _C = fc[0].toUpperCase() + fc.slice(1);
  Mr(kC, "on" + _C);
}
Mr(Bv, "onAnimationEnd");
Mr(Vv, "onAnimationIteration");
Mr(Wv, "onAnimationStart");
Mr("dblclick", "onDoubleClick");
Mr("focusin", "onFocus");
Mr("focusout", "onBlur");
Mr(Hv, "onTransitionEnd");
Xo("onMouseEnter", ["mouseout", "mouseover"]);
Xo("onMouseLeave", ["mouseout", "mouseover"]);
Xo("onPointerEnter", ["pointerout", "pointerover"]);
Xo("onPointerLeave", ["pointerout", "pointerover"]);
ho("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
ho("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
ho("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
ho("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
ho("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
ho("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var qi =
    "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
      " "
    ),
  TC = new Set("cancel close invalid load scroll toggle".split(" ").concat(qi));
function dm(e, t, n) {
  var r = e.type || "unknown-event";
  (e.currentTarget = n), kE(r, t, void 0, e), (e.currentTarget = null);
}
function qv(e, t) {
  t = (t & 4) !== 0;
  for (var n = 0; n < e.length; n++) {
    var r = e[n],
      o = r.event;
    r = r.listeners;
    e: {
      var i = void 0;
      if (t)
        for (var s = r.length - 1; 0 <= s; s--) {
          var a = r[s],
            l = a.instance,
            u = a.currentTarget;
          if (((a = a.listener), l !== i && o.isPropagationStopped())) break e;
          dm(o, a, u), (i = l);
        }
      else
        for (s = 0; s < r.length; s++) {
          if (
            ((a = r[s]), (l = a.instance), (u = a.currentTarget), (a = a.listener), l !== i && o.isPropagationStopped())
          )
            break e;
          dm(o, a, u), (i = l);
        }
    }
  }
  if (wl) throw ((e = vf), (wl = !1), (vf = null), e);
}
function _e(e, t) {
  var n = t[Rf];
  n === void 0 && (n = t[Rf] = new Set());
  var r = e + "__bubble";
  n.has(r) || (Gv(t, e, 2, !1), n.add(r));
}
function dc(e, t, n) {
  var r = 0;
  t && (r |= 4), Gv(n, e, r, t);
}
var ga = "_reactListening" + Math.random().toString(36).slice(2);
function ys(e) {
  if (!e[ga]) {
    (e[ga] = !0),
      tv.forEach(function (n) {
        n !== "selectionchange" && (TC.has(n) || dc(n, !1, e), dc(n, !0, e));
      });
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[ga] || ((t[ga] = !0), dc("selectionchange", !1, t));
  }
}
function Gv(e, t, n, r) {
  switch (Av(t)) {
    case 1:
      var o = UE;
      break;
    case 4:
      o = BE;
      break;
    default:
      o = Gd;
  }
  (n = o.bind(null, t, n, e)),
    (o = void 0),
    !yf || (t !== "touchstart" && t !== "touchmove" && t !== "wheel") || (o = !0),
    r
      ? o !== void 0
        ? e.addEventListener(t, n, { capture: !0, passive: o })
        : e.addEventListener(t, n, !0)
      : o !== void 0
      ? e.addEventListener(t, n, { passive: o })
      : e.addEventListener(t, n, !1);
}
function pc(e, t, n, r, o) {
  var i = r;
  if (!(t & 1) && !(t & 2) && r !== null)
    e: for (;;) {
      if (r === null) return;
      var s = r.tag;
      if (s === 3 || s === 4) {
        var a = r.stateNode.containerInfo;
        if (a === o || (a.nodeType === 8 && a.parentNode === o)) break;
        if (s === 4)
          for (s = r.return; s !== null; ) {
            var l = s.tag;
            if (
              (l === 3 || l === 4) &&
              ((l = s.stateNode.containerInfo), l === o || (l.nodeType === 8 && l.parentNode === o))
            )
              return;
            s = s.return;
          }
        for (; a !== null; ) {
          if (((s = Yr(a)), s === null)) return;
          if (((l = s.tag), l === 5 || l === 6)) {
            r = i = s;
            continue e;
          }
          a = a.parentNode;
        }
      }
      r = r.return;
    }
  yv(function () {
    var u = i,
      c = Wd(n),
      f = [];
    e: {
      var d = Kv.get(e);
      if (d !== void 0) {
        var v = Yd,
          m = e;
        switch (e) {
          case "keypress":
            if (Ga(n) === 0) break e;
          case "keydown":
          case "keyup":
            v = rC;
            break;
          case "focusin":
            (m = "focus"), (v = sc);
            break;
          case "focusout":
            (m = "blur"), (v = sc);
            break;
          case "beforeblur":
          case "afterblur":
            v = sc;
            break;
          case "click":
            if (n.button === 2) break e;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            v = em;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            v = HE;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            v = sC;
            break;
          case Bv:
          case Vv:
          case Wv:
            v = GE;
            break;
          case Hv:
            v = lC;
            break;
          case "scroll":
            v = VE;
            break;
          case "wheel":
            v = cC;
            break;
          case "copy":
          case "cut":
          case "paste":
            v = YE;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            v = nm;
        }
        var y = (t & 4) !== 0,
          x = !y && e === "scroll",
          p = y ? (d !== null ? d + "Capture" : null) : d;
        y = [];
        for (var g = u, w; g !== null; ) {
          w = g;
          var S = w.stateNode;
          if (
            (w.tag === 5 && S !== null && ((w = S), p !== null && ((S = fs(g, p)), S != null && y.push(vs(g, S, w)))),
            x)
          )
            break;
          g = g.return;
        }
        0 < y.length && ((d = new v(d, m, null, n, c)), f.push({ event: d, listeners: y }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (
          ((d = e === "mouseover" || e === "pointerover"),
          (v = e === "mouseout" || e === "pointerout"),
          d && n !== mf && (m = n.relatedTarget || n.fromElement) && (Yr(m) || m[Hn]))
        )
          break e;
        if (
          (v || d) &&
          ((d = c.window === c ? c : (d = c.ownerDocument) ? d.defaultView || d.parentWindow : window),
          v
            ? ((m = n.relatedTarget || n.toElement),
              (v = u),
              (m = m ? Yr(m) : null),
              m !== null && ((x = mo(m)), m !== x || (m.tag !== 5 && m.tag !== 6)) && (m = null))
            : ((v = null), (m = u)),
          v !== m)
        ) {
          if (
            ((y = em),
            (S = "onMouseLeave"),
            (p = "onMouseEnter"),
            (g = "mouse"),
            (e === "pointerout" || e === "pointerover") &&
              ((y = nm), (S = "onPointerLeave"), (p = "onPointerEnter"), (g = "pointer")),
            (x = v == null ? d : Do(v)),
            (w = m == null ? d : Do(m)),
            (d = new y(S, g + "leave", v, n, c)),
            (d.target = x),
            (d.relatedTarget = w),
            (S = null),
            Yr(c) === u && ((y = new y(p, g + "enter", m, n, c)), (y.target = w), (y.relatedTarget = x), (S = y)),
            (x = S),
            v && m)
          )
            t: {
              for (y = v, p = m, g = 0, w = y; w; w = bo(w)) g++;
              for (w = 0, S = p; S; S = bo(S)) w++;
              for (; 0 < g - w; ) (y = bo(y)), g--;
              for (; 0 < w - g; ) (p = bo(p)), w--;
              for (; g--; ) {
                if (y === p || (p !== null && y === p.alternate)) break t;
                (y = bo(y)), (p = bo(p));
              }
              y = null;
            }
          else y = null;
          v !== null && pm(f, d, v, y, !1), m !== null && x !== null && pm(f, x, m, y, !0);
        }
      }
      e: {
        if (
          ((d = u ? Do(u) : window),
          (v = d.nodeName && d.nodeName.toLowerCase()),
          v === "select" || (v === "input" && d.type === "file"))
        )
          var C = yC;
        else if (im(d))
          if (Fv) C = SC;
          else {
            C = wC;
            var E = vC;
          }
        else
          (v = d.nodeName) && v.toLowerCase() === "input" && (d.type === "checkbox" || d.type === "radio") && (C = xC);
        if (C && (C = C(e, u))) {
          jv(f, C, n, c);
          break e;
        }
        E && E(e, d, u),
          e === "focusout" && (E = d._wrapperState) && E.controlled && d.type === "number" && cf(d, "number", d.value);
      }
      switch (((E = u ? Do(u) : window), e)) {
        case "focusin":
          (im(E) || E.contentEditable === "true") && ((No = E), (Ef = u), (ts = null));
          break;
        case "focusout":
          ts = Ef = No = null;
          break;
        case "mousedown":
          Cf = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          (Cf = !1), cm(f, n, c);
          break;
        case "selectionchange":
          if (bC) break;
        case "keydown":
        case "keyup":
          cm(f, n, c);
      }
      var P;
      if (Jd)
        e: {
          switch (e) {
            case "compositionstart":
              var R = "onCompositionStart";
              break e;
            case "compositionend":
              R = "onCompositionEnd";
              break e;
            case "compositionupdate":
              R = "onCompositionUpdate";
              break e;
          }
          R = void 0;
        }
      else
        Ao ? Dv(e, n) && (R = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (R = "onCompositionStart");
      R &&
        (Lv &&
          n.locale !== "ko" &&
          (Ao || R !== "onCompositionStart"
            ? R === "onCompositionEnd" && Ao && (P = Nv())
            : ((yr = c), (Qd = "value" in yr ? yr.value : yr.textContent), (Ao = !0))),
        (E = bl(u, R)),
        0 < E.length &&
          ((R = new tm(R, e, null, n, c)),
          f.push({ event: R, listeners: E }),
          P ? (R.data = P) : ((P = Mv(n)), P !== null && (R.data = P)))),
        (P = dC ? pC(e, n) : hC(e, n)) &&
          ((u = bl(u, "onBeforeInput")),
          0 < u.length &&
            ((c = new tm("onBeforeInput", "beforeinput", null, n, c)),
            f.push({ event: c, listeners: u }),
            (c.data = P)));
    }
    qv(f, t);
  });
}
function vs(e, t, n) {
  return { instance: e, listener: t, currentTarget: n };
}
function bl(e, t) {
  for (var n = t + "Capture", r = []; e !== null; ) {
    var o = e,
      i = o.stateNode;
    o.tag === 5 &&
      i !== null &&
      ((o = i), (i = fs(e, n)), i != null && r.unshift(vs(e, i, o)), (i = fs(e, t)), i != null && r.push(vs(e, i, o))),
      (e = e.return);
  }
  return r;
}
function bo(e) {
  if (e === null) return null;
  do e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function pm(e, t, n, r, o) {
  for (var i = t._reactName, s = []; n !== null && n !== r; ) {
    var a = n,
      l = a.alternate,
      u = a.stateNode;
    if (l !== null && l === r) break;
    a.tag === 5 &&
      u !== null &&
      ((a = u),
      o
        ? ((l = fs(n, i)), l != null && s.unshift(vs(n, l, a)))
        : o || ((l = fs(n, i)), l != null && s.push(vs(n, l, a)))),
      (n = n.return);
  }
  s.length !== 0 && e.push({ event: t, listeners: s });
}
var RC = /\r\n?/g,
  PC = /\u0000|\uFFFD/g;
function hm(e) {
  return (typeof e == "string" ? e : "" + e)
    .replace(
      RC,
      `
`
    )
    .replace(PC, "");
}
function ya(e, t, n) {
  if (((t = hm(t)), hm(e) !== t && n)) throw Error(j(425));
}
function kl() {}
var bf = null,
  kf = null;
function _f(e, t) {
  return (
    e === "textarea" ||
    e === "noscript" ||
    typeof t.children == "string" ||
    typeof t.children == "number" ||
    (typeof t.dangerouslySetInnerHTML == "object" &&
      t.dangerouslySetInnerHTML !== null &&
      t.dangerouslySetInnerHTML.__html != null)
  );
}
var Tf = typeof setTimeout == "function" ? setTimeout : void 0,
  OC = typeof clearTimeout == "function" ? clearTimeout : void 0,
  mm = typeof Promise == "function" ? Promise : void 0,
  AC =
    typeof queueMicrotask == "function"
      ? queueMicrotask
      : typeof mm != "undefined"
      ? function (e) {
          return mm.resolve(null).then(e).catch(NC);
        }
      : Tf;
function NC(e) {
  setTimeout(function () {
    throw e;
  });
}
function hc(e, t) {
  var n = t,
    r = 0;
  do {
    var o = n.nextSibling;
    if ((e.removeChild(n), o && o.nodeType === 8))
      if (((n = o.data), n === "/$")) {
        if (r === 0) {
          e.removeChild(o), hs(t);
          return;
        }
        r--;
      } else (n !== "$" && n !== "$?" && n !== "$!") || r++;
    n = o;
  } while (n);
  hs(t);
}
function Cr(e) {
  for (; e != null; e = e.nextSibling) {
    var t = e.nodeType;
    if (t === 1 || t === 3) break;
    if (t === 8) {
      if (((t = e.data), t === "$" || t === "$!" || t === "$?")) break;
      if (t === "/$") return null;
    }
  }
  return e;
}
function gm(e) {
  e = e.previousSibling;
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var n = e.data;
      if (n === "$" || n === "$!" || n === "$?") {
        if (t === 0) return e;
        t--;
      } else n === "/$" && t++;
    }
    e = e.previousSibling;
  }
  return null;
}
var mi = Math.random().toString(36).slice(2),
  wn = "__reactFiber$" + mi,
  ws = "__reactProps$" + mi,
  Hn = "__reactContainer$" + mi,
  Rf = "__reactEvents$" + mi,
  LC = "__reactListeners$" + mi,
  DC = "__reactHandles$" + mi;
function Yr(e) {
  var t = e[wn];
  if (t) return t;
  for (var n = e.parentNode; n; ) {
    if ((t = n[Hn] || n[wn])) {
      if (((n = t.alternate), t.child !== null || (n !== null && n.child !== null)))
        for (e = gm(e); e !== null; ) {
          if ((n = e[wn])) return n;
          e = gm(e);
        }
      return t;
    }
    (e = n), (n = e.parentNode);
  }
  return null;
}
function Is(e) {
  return (e = e[wn] || e[Hn]), !e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3) ? null : e;
}
function Do(e) {
  if (e.tag === 5 || e.tag === 6) return e.stateNode;
  throw Error(j(33));
}
function lu(e) {
  return e[ws] || null;
}
var Pf = [],
  Mo = -1;
function jr(e) {
  return { current: e };
}
function Te(e) {
  0 > Mo || ((e.current = Pf[Mo]), (Pf[Mo] = null), Mo--);
}
function be(e, t) {
  Mo++, (Pf[Mo] = e.current), (e.current = t);
}
var Pr = {},
  pt = jr(Pr),
  Ct = jr(!1),
  oo = Pr;
function Jo(e, t) {
  var n = e.type.contextTypes;
  if (!n) return Pr;
  var r = e.stateNode;
  if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
  var o = {},
    i;
  for (i in n) o[i] = t[i];
  return (
    r &&
      ((e = e.stateNode),
      (e.__reactInternalMemoizedUnmaskedChildContext = t),
      (e.__reactInternalMemoizedMaskedChildContext = o)),
    o
  );
}
function bt(e) {
  return (e = e.childContextTypes), e != null;
}
function _l() {
  Te(Ct), Te(pt);
}
function ym(e, t, n) {
  if (pt.current !== Pr) throw Error(j(168));
  be(pt, t), be(Ct, n);
}
function Qv(e, t, n) {
  var r = e.stateNode;
  if (((t = t.childContextTypes), typeof r.getChildContext != "function")) return n;
  r = r.getChildContext();
  for (var o in r) if (!(o in t)) throw Error(j(108, vE(e) || "Unknown", o));
  return je({}, n, r);
}
function Tl(e) {
  return (
    (e = ((e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext) || Pr),
    (oo = pt.current),
    be(pt, e),
    be(Ct, Ct.current),
    !0
  );
}
function vm(e, t, n) {
  var r = e.stateNode;
  if (!r) throw Error(j(169));
  n ? ((e = Qv(e, t, oo)), (r.__reactInternalMemoizedMergedChildContext = e), Te(Ct), Te(pt), be(pt, e)) : Te(Ct),
    be(Ct, n);
}
var Fn = null,
  uu = !1,
  mc = !1;
function Yv(e) {
  Fn === null ? (Fn = [e]) : Fn.push(e);
}
function MC(e) {
  (uu = !0), Yv(e);
}
function Fr() {
  if (!mc && Fn !== null) {
    mc = !0;
    var e = 0,
      t = we;
    try {
      var n = Fn;
      for (we = 1; e < n.length; e++) {
        var r = n[e];
        do r = r(!0);
        while (r !== null);
      }
      (Fn = null), (uu = !1);
    } catch (o) {
      throw (Fn !== null && (Fn = Fn.slice(e + 1)), Sv(Hd, Fr), o);
    } finally {
      (we = t), (mc = !1);
    }
  }
  return null;
}
var jo = [],
  Fo = 0,
  Rl = null,
  Pl = 0,
  qt = [],
  Gt = 0,
  io = null,
  $n = 1,
  zn = "";
function Kr(e, t) {
  (jo[Fo++] = Pl), (jo[Fo++] = Rl), (Rl = e), (Pl = t);
}
function Xv(e, t, n) {
  (qt[Gt++] = $n), (qt[Gt++] = zn), (qt[Gt++] = io), (io = e);
  var r = $n;
  e = zn;
  var o = 32 - cn(r) - 1;
  (r &= ~(1 << o)), (n += 1);
  var i = 32 - cn(t) + o;
  if (30 < i) {
    var s = o - (o % 5);
    (i = (r & ((1 << s) - 1)).toString(32)),
      (r >>= s),
      (o -= s),
      ($n = (1 << (32 - cn(t) + o)) | (n << o) | r),
      (zn = i + e);
  } else ($n = (1 << i) | (n << o) | r), (zn = e);
}
function ep(e) {
  e.return !== null && (Kr(e, 1), Xv(e, 1, 0));
}
function tp(e) {
  for (; e === Rl; ) (Rl = jo[--Fo]), (jo[Fo] = null), (Pl = jo[--Fo]), (jo[Fo] = null);
  for (; e === io; )
    (io = qt[--Gt]), (qt[Gt] = null), (zn = qt[--Gt]), (qt[Gt] = null), ($n = qt[--Gt]), (qt[Gt] = null);
}
var Dt = null,
  Nt = null,
  Pe = !1,
  an = null;
function Jv(e, t) {
  var n = Yt(5, null, null, 0);
  (n.elementType = "DELETED"),
    (n.stateNode = t),
    (n.return = e),
    (t = e.deletions),
    t === null ? ((e.deletions = [n]), (e.flags |= 16)) : t.push(n);
}
function wm(e, t) {
  switch (e.tag) {
    case 5:
      var n = e.type;
      return (
        (t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t),
        t !== null ? ((e.stateNode = t), (Dt = e), (Nt = Cr(t.firstChild)), !0) : !1
      );
    case 6:
      return (
        (t = e.pendingProps === "" || t.nodeType !== 3 ? null : t),
        t !== null ? ((e.stateNode = t), (Dt = e), (Nt = null), !0) : !1
      );
    case 13:
      return (
        (t = t.nodeType !== 8 ? null : t),
        t !== null
          ? ((n = io !== null ? { id: $n, overflow: zn } : null),
            (e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }),
            (n = Yt(18, null, null, 0)),
            (n.stateNode = t),
            (n.return = e),
            (e.child = n),
            (Dt = e),
            (Nt = null),
            !0)
          : !1
      );
    default:
      return !1;
  }
}
function Of(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function Af(e) {
  if (Pe) {
    var t = Nt;
    if (t) {
      var n = t;
      if (!wm(e, t)) {
        if (Of(e)) throw Error(j(418));
        t = Cr(n.nextSibling);
        var r = Dt;
        t && wm(e, t) ? Jv(r, n) : ((e.flags = (e.flags & -4097) | 2), (Pe = !1), (Dt = e));
      }
    } else {
      if (Of(e)) throw Error(j(418));
      (e.flags = (e.flags & -4097) | 2), (Pe = !1), (Dt = e);
    }
  }
}
function xm(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
  Dt = e;
}
function va(e) {
  if (e !== Dt) return !1;
  if (!Pe) return xm(e), (Pe = !0), !1;
  var t;
  if (
    ((t = e.tag !== 3) &&
      !(t = e.tag !== 5) &&
      ((t = e.type), (t = t !== "head" && t !== "body" && !_f(e.type, e.memoizedProps))),
    t && (t = Nt))
  ) {
    if (Of(e)) throw (Zv(), Error(j(418)));
    for (; t; ) Jv(e, t), (t = Cr(t.nextSibling));
  }
  if ((xm(e), e.tag === 13)) {
    if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e)) throw Error(j(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === "/$") {
            if (t === 0) {
              Nt = Cr(e.nextSibling);
              break e;
            }
            t--;
          } else (n !== "$" && n !== "$!" && n !== "$?") || t++;
        }
        e = e.nextSibling;
      }
      Nt = null;
    }
  } else Nt = Dt ? Cr(e.stateNode.nextSibling) : null;
  return !0;
}
function Zv() {
  for (var e = Nt; e; ) e = Cr(e.nextSibling);
}
function Zo() {
  (Nt = Dt = null), (Pe = !1);
}
function np(e) {
  an === null ? (an = [e]) : an.push(e);
}
var jC = Zn.ReactCurrentBatchConfig;
function Ai(e, t, n) {
  if (((e = n.ref), e !== null && typeof e != "function" && typeof e != "object")) {
    if (n._owner) {
      if (((n = n._owner), n)) {
        if (n.tag !== 1) throw Error(j(309));
        var r = n.stateNode;
      }
      if (!r) throw Error(j(147, e));
      var o = r,
        i = "" + e;
      return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === i
        ? t.ref
        : ((t = function (s) {
            var a = o.refs;
            s === null ? delete a[i] : (a[i] = s);
          }),
          (t._stringRef = i),
          t);
    }
    if (typeof e != "string") throw Error(j(284));
    if (!n._owner) throw Error(j(290, e));
  }
  return e;
}
function wa(e, t) {
  throw (
    ((e = Object.prototype.toString.call(t)),
    Error(j(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)))
  );
}
function Sm(e) {
  var t = e._init;
  return t(e._payload);
}
function e0(e) {
  function t(p, g) {
    if (e) {
      var w = p.deletions;
      w === null ? ((p.deletions = [g]), (p.flags |= 16)) : w.push(g);
    }
  }
  function n(p, g) {
    if (!e) return null;
    for (; g !== null; ) t(p, g), (g = g.sibling);
    return null;
  }
  function r(p, g) {
    for (p = new Map(); g !== null; ) g.key !== null ? p.set(g.key, g) : p.set(g.index, g), (g = g.sibling);
    return p;
  }
  function o(p, g) {
    return (p = Tr(p, g)), (p.index = 0), (p.sibling = null), p;
  }
  function i(p, g, w) {
    return (
      (p.index = w),
      e
        ? ((w = p.alternate), w !== null ? ((w = w.index), w < g ? ((p.flags |= 2), g) : w) : ((p.flags |= 2), g))
        : ((p.flags |= 1048576), g)
    );
  }
  function s(p) {
    return e && p.alternate === null && (p.flags |= 2), p;
  }
  function a(p, g, w, S) {
    return g === null || g.tag !== 6 ? ((g = Ec(w, p.mode, S)), (g.return = p), g) : ((g = o(g, w)), (g.return = p), g);
  }
  function l(p, g, w, S) {
    var C = w.type;
    return C === Oo
      ? c(p, g, w.props.children, S, w.key)
      : g !== null &&
        (g.elementType === C || (typeof C == "object" && C !== null && C.$$typeof === dr && Sm(C) === g.type))
      ? ((S = o(g, w.props)), (S.ref = Ai(p, g, w)), (S.return = p), S)
      : ((S = tl(w.type, w.key, w.props, null, p.mode, S)), (S.ref = Ai(p, g, w)), (S.return = p), S);
  }
  function u(p, g, w, S) {
    return g === null ||
      g.tag !== 4 ||
      g.stateNode.containerInfo !== w.containerInfo ||
      g.stateNode.implementation !== w.implementation
      ? ((g = Cc(w, p.mode, S)), (g.return = p), g)
      : ((g = o(g, w.children || [])), (g.return = p), g);
  }
  function c(p, g, w, S, C) {
    return g === null || g.tag !== 7
      ? ((g = ro(w, p.mode, S, C)), (g.return = p), g)
      : ((g = o(g, w)), (g.return = p), g);
  }
  function f(p, g, w) {
    if ((typeof g == "string" && g !== "") || typeof g == "number")
      return (g = Ec("" + g, p.mode, w)), (g.return = p), g;
    if (typeof g == "object" && g !== null) {
      switch (g.$$typeof) {
        case la:
          return (w = tl(g.type, g.key, g.props, null, p.mode, w)), (w.ref = Ai(p, null, g)), (w.return = p), w;
        case Po:
          return (g = Cc(g, p.mode, w)), (g.return = p), g;
        case dr:
          var S = g._init;
          return f(p, S(g._payload), w);
      }
      if (Hi(g) || _i(g)) return (g = ro(g, p.mode, w, null)), (g.return = p), g;
      wa(p, g);
    }
    return null;
  }
  function d(p, g, w, S) {
    var C = g !== null ? g.key : null;
    if ((typeof w == "string" && w !== "") || typeof w == "number") return C !== null ? null : a(p, g, "" + w, S);
    if (typeof w == "object" && w !== null) {
      switch (w.$$typeof) {
        case la:
          return w.key === C ? l(p, g, w, S) : null;
        case Po:
          return w.key === C ? u(p, g, w, S) : null;
        case dr:
          return (C = w._init), d(p, g, C(w._payload), S);
      }
      if (Hi(w) || _i(w)) return C !== null ? null : c(p, g, w, S, null);
      wa(p, w);
    }
    return null;
  }
  function v(p, g, w, S, C) {
    if ((typeof S == "string" && S !== "") || typeof S == "number") return (p = p.get(w) || null), a(g, p, "" + S, C);
    if (typeof S == "object" && S !== null) {
      switch (S.$$typeof) {
        case la:
          return (p = p.get(S.key === null ? w : S.key) || null), l(g, p, S, C);
        case Po:
          return (p = p.get(S.key === null ? w : S.key) || null), u(g, p, S, C);
        case dr:
          var E = S._init;
          return v(p, g, w, E(S._payload), C);
      }
      if (Hi(S) || _i(S)) return (p = p.get(w) || null), c(g, p, S, C, null);
      wa(g, S);
    }
    return null;
  }
  function m(p, g, w, S) {
    for (var C = null, E = null, P = g, R = (g = 0), A = null; P !== null && R < w.length; R++) {
      P.index > R ? ((A = P), (P = null)) : (A = P.sibling);
      var D = d(p, P, w[R], S);
      if (D === null) {
        P === null && (P = A);
        break;
      }
      e && P && D.alternate === null && t(p, P),
        (g = i(D, g, R)),
        E === null ? (C = D) : (E.sibling = D),
        (E = D),
        (P = A);
    }
    if (R === w.length) return n(p, P), Pe && Kr(p, R), C;
    if (P === null) {
      for (; R < w.length; R++)
        (P = f(p, w[R], S)), P !== null && ((g = i(P, g, R)), E === null ? (C = P) : (E.sibling = P), (E = P));
      return Pe && Kr(p, R), C;
    }
    for (P = r(p, P); R < w.length; R++)
      (A = v(P, p, R, w[R], S)),
        A !== null &&
          (e && A.alternate !== null && P.delete(A.key === null ? R : A.key),
          (g = i(A, g, R)),
          E === null ? (C = A) : (E.sibling = A),
          (E = A));
    return (
      e &&
        P.forEach(function (U) {
          return t(p, U);
        }),
      Pe && Kr(p, R),
      C
    );
  }
  function y(p, g, w, S) {
    var C = _i(w);
    if (typeof C != "function") throw Error(j(150));
    if (((w = C.call(w)), w == null)) throw Error(j(151));
    for (var E = (C = null), P = g, R = (g = 0), A = null, D = w.next(); P !== null && !D.done; R++, D = w.next()) {
      P.index > R ? ((A = P), (P = null)) : (A = P.sibling);
      var U = d(p, P, D.value, S);
      if (U === null) {
        P === null && (P = A);
        break;
      }
      e && P && U.alternate === null && t(p, P),
        (g = i(U, g, R)),
        E === null ? (C = U) : (E.sibling = U),
        (E = U),
        (P = A);
    }
    if (D.done) return n(p, P), Pe && Kr(p, R), C;
    if (P === null) {
      for (; !D.done; R++, D = w.next())
        (D = f(p, D.value, S)), D !== null && ((g = i(D, g, R)), E === null ? (C = D) : (E.sibling = D), (E = D));
      return Pe && Kr(p, R), C;
    }
    for (P = r(p, P); !D.done; R++, D = w.next())
      (D = v(P, p, R, D.value, S)),
        D !== null &&
          (e && D.alternate !== null && P.delete(D.key === null ? R : D.key),
          (g = i(D, g, R)),
          E === null ? (C = D) : (E.sibling = D),
          (E = D));
    return (
      e &&
        P.forEach(function (I) {
          return t(p, I);
        }),
      Pe && Kr(p, R),
      C
    );
  }
  function x(p, g, w, S) {
    if (
      (typeof w == "object" && w !== null && w.type === Oo && w.key === null && (w = w.props.children),
      typeof w == "object" && w !== null)
    ) {
      switch (w.$$typeof) {
        case la:
          e: {
            for (var C = w.key, E = g; E !== null; ) {
              if (E.key === C) {
                if (((C = w.type), C === Oo)) {
                  if (E.tag === 7) {
                    n(p, E.sibling), (g = o(E, w.props.children)), (g.return = p), (p = g);
                    break e;
                  }
                } else if (
                  E.elementType === C ||
                  (typeof C == "object" && C !== null && C.$$typeof === dr && Sm(C) === E.type)
                ) {
                  n(p, E.sibling), (g = o(E, w.props)), (g.ref = Ai(p, E, w)), (g.return = p), (p = g);
                  break e;
                }
                n(p, E);
                break;
              } else t(p, E);
              E = E.sibling;
            }
            w.type === Oo
              ? ((g = ro(w.props.children, p.mode, S, w.key)), (g.return = p), (p = g))
              : ((S = tl(w.type, w.key, w.props, null, p.mode, S)), (S.ref = Ai(p, g, w)), (S.return = p), (p = S));
          }
          return s(p);
        case Po:
          e: {
            for (E = w.key; g !== null; ) {
              if (g.key === E)
                if (
                  g.tag === 4 &&
                  g.stateNode.containerInfo === w.containerInfo &&
                  g.stateNode.implementation === w.implementation
                ) {
                  n(p, g.sibling), (g = o(g, w.children || [])), (g.return = p), (p = g);
                  break e;
                } else {
                  n(p, g);
                  break;
                }
              else t(p, g);
              g = g.sibling;
            }
            (g = Cc(w, p.mode, S)), (g.return = p), (p = g);
          }
          return s(p);
        case dr:
          return (E = w._init), x(p, g, E(w._payload), S);
      }
      if (Hi(w)) return m(p, g, w, S);
      if (_i(w)) return y(p, g, w, S);
      wa(p, w);
    }
    return (typeof w == "string" && w !== "") || typeof w == "number"
      ? ((w = "" + w),
        g !== null && g.tag === 6
          ? (n(p, g.sibling), (g = o(g, w)), (g.return = p), (p = g))
          : (n(p, g), (g = Ec(w, p.mode, S)), (g.return = p), (p = g)),
        s(p))
      : n(p, g);
  }
  return x;
}
var ei = e0(!0),
  t0 = e0(!1),
  Ol = jr(null),
  Al = null,
  Io = null,
  rp = null;
function op() {
  rp = Io = Al = null;
}
function ip(e) {
  var t = Ol.current;
  Te(Ol), (e._currentValue = t);
}
function Nf(e, t, n) {
  for (; e !== null; ) {
    var r = e.alternate;
    if (
      ((e.childLanes & t) !== t
        ? ((e.childLanes |= t), r !== null && (r.childLanes |= t))
        : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t),
      e === n)
    )
      break;
    e = e.return;
  }
}
function qo(e, t) {
  (Al = e),
    (rp = Io = null),
    (e = e.dependencies),
    e !== null && e.firstContext !== null && (e.lanes & t && (Et = !0), (e.firstContext = null));
}
function Zt(e) {
  var t = e._currentValue;
  if (rp !== e)
    if (((e = { context: e, memoizedValue: t, next: null }), Io === null)) {
      if (Al === null) throw Error(j(308));
      (Io = e), (Al.dependencies = { lanes: 0, firstContext: e });
    } else Io = Io.next = e;
  return t;
}
var Xr = null;
function sp(e) {
  Xr === null ? (Xr = [e]) : Xr.push(e);
}
function n0(e, t, n, r) {
  var o = t.interleaved;
  return o === null ? ((n.next = n), sp(t)) : ((n.next = o.next), (o.next = n)), (t.interleaved = n), Kn(e, r);
}
function Kn(e, t) {
  e.lanes |= t;
  var n = e.alternate;
  for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; )
    (e.childLanes |= t), (n = e.alternate), n !== null && (n.childLanes |= t), (n = e), (e = e.return);
  return n.tag === 3 ? n.stateNode : null;
}
var pr = !1;
function ap(e) {
  e.updateQueue = {
    baseState: e.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: { pending: null, interleaved: null, lanes: 0 },
    effects: null,
  };
}
function r0(e, t) {
  (e = e.updateQueue),
    t.updateQueue === e &&
      (t.updateQueue = {
        baseState: e.baseState,
        firstBaseUpdate: e.firstBaseUpdate,
        lastBaseUpdate: e.lastBaseUpdate,
        shared: e.shared,
        effects: e.effects,
      });
}
function Un(e, t) {
  return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function br(e, t, n) {
  var r = e.updateQueue;
  if (r === null) return null;
  if (((r = r.shared), pe & 2)) {
    var o = r.pending;
    return o === null ? (t.next = t) : ((t.next = o.next), (o.next = t)), (r.pending = t), Kn(e, n);
  }
  return (
    (o = r.interleaved),
    o === null ? ((t.next = t), sp(r)) : ((t.next = o.next), (o.next = t)),
    (r.interleaved = t),
    Kn(e, n)
  );
}
function Qa(e, t, n) {
  if (((t = t.updateQueue), t !== null && ((t = t.shared), (n & 4194240) !== 0))) {
    var r = t.lanes;
    (r &= e.pendingLanes), (n |= r), (t.lanes = n), Kd(e, n);
  }
}
function Em(e, t) {
  var n = e.updateQueue,
    r = e.alternate;
  if (r !== null && ((r = r.updateQueue), n === r)) {
    var o = null,
      i = null;
    if (((n = n.firstBaseUpdate), n !== null)) {
      do {
        var s = {
          eventTime: n.eventTime,
          lane: n.lane,
          tag: n.tag,
          payload: n.payload,
          callback: n.callback,
          next: null,
        };
        i === null ? (o = i = s) : (i = i.next = s), (n = n.next);
      } while (n !== null);
      i === null ? (o = i = t) : (i = i.next = t);
    } else o = i = t;
    (n = { baseState: r.baseState, firstBaseUpdate: o, lastBaseUpdate: i, shared: r.shared, effects: r.effects }),
      (e.updateQueue = n);
    return;
  }
  (e = n.lastBaseUpdate), e === null ? (n.firstBaseUpdate = t) : (e.next = t), (n.lastBaseUpdate = t);
}
function Nl(e, t, n, r) {
  var o = e.updateQueue;
  pr = !1;
  var i = o.firstBaseUpdate,
    s = o.lastBaseUpdate,
    a = o.shared.pending;
  if (a !== null) {
    o.shared.pending = null;
    var l = a,
      u = l.next;
    (l.next = null), s === null ? (i = u) : (s.next = u), (s = l);
    var c = e.alternate;
    c !== null &&
      ((c = c.updateQueue),
      (a = c.lastBaseUpdate),
      a !== s && (a === null ? (c.firstBaseUpdate = u) : (a.next = u), (c.lastBaseUpdate = l)));
  }
  if (i !== null) {
    var f = o.baseState;
    (s = 0), (c = u = l = null), (a = i);
    do {
      var d = a.lane,
        v = a.eventTime;
      if ((r & d) === d) {
        c !== null &&
          (c = c.next = { eventTime: v, lane: 0, tag: a.tag, payload: a.payload, callback: a.callback, next: null });
        e: {
          var m = e,
            y = a;
          switch (((d = t), (v = n), y.tag)) {
            case 1:
              if (((m = y.payload), typeof m == "function")) {
                f = m.call(v, f, d);
                break e;
              }
              f = m;
              break e;
            case 3:
              m.flags = (m.flags & -65537) | 128;
            case 0:
              if (((m = y.payload), (d = typeof m == "function" ? m.call(v, f, d) : m), d == null)) break e;
              f = je({}, f, d);
              break e;
            case 2:
              pr = !0;
          }
        }
        a.callback !== null &&
          a.lane !== 0 &&
          ((e.flags |= 64), (d = o.effects), d === null ? (o.effects = [a]) : d.push(a));
      } else
        (v = { eventTime: v, lane: d, tag: a.tag, payload: a.payload, callback: a.callback, next: null }),
          c === null ? ((u = c = v), (l = f)) : (c = c.next = v),
          (s |= d);
      if (((a = a.next), a === null)) {
        if (((a = o.shared.pending), a === null)) break;
        (d = a), (a = d.next), (d.next = null), (o.lastBaseUpdate = d), (o.shared.pending = null);
      }
    } while (!0);
    if (
      (c === null && (l = f),
      (o.baseState = l),
      (o.firstBaseUpdate = u),
      (o.lastBaseUpdate = c),
      (t = o.shared.interleaved),
      t !== null)
    ) {
      o = t;
      do (s |= o.lane), (o = o.next);
      while (o !== t);
    } else i === null && (o.shared.lanes = 0);
    (ao |= s), (e.lanes = s), (e.memoizedState = f);
  }
}
function Cm(e, t, n) {
  if (((e = t.effects), (t.effects = null), e !== null))
    for (t = 0; t < e.length; t++) {
      var r = e[t],
        o = r.callback;
      if (o !== null) {
        if (((r.callback = null), (r = n), typeof o != "function")) throw Error(j(191, o));
        o.call(r);
      }
    }
}
var $s = {},
  bn = jr($s),
  xs = jr($s),
  Ss = jr($s);
function Jr(e) {
  if (e === $s) throw Error(j(174));
  return e;
}
function lp(e, t) {
  switch ((be(Ss, t), be(xs, e), be(bn, $s), (e = t.nodeType), e)) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : df(null, "");
      break;
    default:
      (e = e === 8 ? t.parentNode : t), (t = e.namespaceURI || null), (e = e.tagName), (t = df(t, e));
  }
  Te(bn), be(bn, t);
}
function ti() {
  Te(bn), Te(xs), Te(Ss);
}
function o0(e) {
  Jr(Ss.current);
  var t = Jr(bn.current),
    n = df(t, e.type);
  t !== n && (be(xs, e), be(bn, n));
}
function up(e) {
  xs.current === e && (Te(bn), Te(xs));
}
var Le = jr(0);
function Ll(e) {
  for (var t = e; t !== null; ) {
    if (t.tag === 13) {
      var n = t.memoizedState;
      if (n !== null && ((n = n.dehydrated), n === null || n.data === "$?" || n.data === "$!")) return t;
    } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
      if (t.flags & 128) return t;
    } else if (t.child !== null) {
      (t.child.return = t), (t = t.child);
      continue;
    }
    if (t === e) break;
    for (; t.sibling === null; ) {
      if (t.return === null || t.return === e) return null;
      t = t.return;
    }
    (t.sibling.return = t.return), (t = t.sibling);
  }
  return null;
}
var gc = [];
function cp() {
  for (var e = 0; e < gc.length; e++) gc[e]._workInProgressVersionPrimary = null;
  gc.length = 0;
}
var Ya = Zn.ReactCurrentDispatcher,
  yc = Zn.ReactCurrentBatchConfig,
  so = 0,
  Me = null,
  Je = null,
  nt = null,
  Dl = !1,
  ns = !1,
  Es = 0,
  FC = 0;
function ut() {
  throw Error(j(321));
}
function fp(e, t) {
  if (t === null) return !1;
  for (var n = 0; n < t.length && n < e.length; n++) if (!dn(e[n], t[n])) return !1;
  return !0;
}
function dp(e, t, n, r, o, i) {
  if (
    ((so = i),
    (Me = t),
    (t.memoizedState = null),
    (t.updateQueue = null),
    (t.lanes = 0),
    (Ya.current = e === null || e.memoizedState === null ? UC : BC),
    (e = n(r, o)),
    ns)
  ) {
    i = 0;
    do {
      if (((ns = !1), (Es = 0), 25 <= i)) throw Error(j(301));
      (i += 1), (nt = Je = null), (t.updateQueue = null), (Ya.current = VC), (e = n(r, o));
    } while (ns);
  }
  if (((Ya.current = Ml), (t = Je !== null && Je.next !== null), (so = 0), (nt = Je = Me = null), (Dl = !1), t))
    throw Error(j(300));
  return e;
}
function pp() {
  var e = Es !== 0;
  return (Es = 0), e;
}
function yn() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  return nt === null ? (Me.memoizedState = nt = e) : (nt = nt.next = e), nt;
}
function en() {
  if (Je === null) {
    var e = Me.alternate;
    e = e !== null ? e.memoizedState : null;
  } else e = Je.next;
  var t = nt === null ? Me.memoizedState : nt.next;
  if (t !== null) (nt = t), (Je = e);
  else {
    if (e === null) throw Error(j(310));
    (Je = e),
      (e = {
        memoizedState: Je.memoizedState,
        baseState: Je.baseState,
        baseQueue: Je.baseQueue,
        queue: Je.queue,
        next: null,
      }),
      nt === null ? (Me.memoizedState = nt = e) : (nt = nt.next = e);
  }
  return nt;
}
function Cs(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function vc(e) {
  var t = en(),
    n = t.queue;
  if (n === null) throw Error(j(311));
  n.lastRenderedReducer = e;
  var r = Je,
    o = r.baseQueue,
    i = n.pending;
  if (i !== null) {
    if (o !== null) {
      var s = o.next;
      (o.next = i.next), (i.next = s);
    }
    (r.baseQueue = o = i), (n.pending = null);
  }
  if (o !== null) {
    (i = o.next), (r = r.baseState);
    var a = (s = null),
      l = null,
      u = i;
    do {
      var c = u.lane;
      if ((so & c) === c)
        l !== null &&
          (l = l.next =
            { lane: 0, action: u.action, hasEagerState: u.hasEagerState, eagerState: u.eagerState, next: null }),
          (r = u.hasEagerState ? u.eagerState : e(r, u.action));
      else {
        var f = { lane: c, action: u.action, hasEagerState: u.hasEagerState, eagerState: u.eagerState, next: null };
        l === null ? ((a = l = f), (s = r)) : (l = l.next = f), (Me.lanes |= c), (ao |= c);
      }
      u = u.next;
    } while (u !== null && u !== i);
    l === null ? (s = r) : (l.next = a),
      dn(r, t.memoizedState) || (Et = !0),
      (t.memoizedState = r),
      (t.baseState = s),
      (t.baseQueue = l),
      (n.lastRenderedState = r);
  }
  if (((e = n.interleaved), e !== null)) {
    o = e;
    do (i = o.lane), (Me.lanes |= i), (ao |= i), (o = o.next);
    while (o !== e);
  } else o === null && (n.lanes = 0);
  return [t.memoizedState, n.dispatch];
}
function wc(e) {
  var t = en(),
    n = t.queue;
  if (n === null) throw Error(j(311));
  n.lastRenderedReducer = e;
  var r = n.dispatch,
    o = n.pending,
    i = t.memoizedState;
  if (o !== null) {
    n.pending = null;
    var s = (o = o.next);
    do (i = e(i, s.action)), (s = s.next);
    while (s !== o);
    dn(i, t.memoizedState) || (Et = !0),
      (t.memoizedState = i),
      t.baseQueue === null && (t.baseState = i),
      (n.lastRenderedState = i);
  }
  return [i, r];
}
function i0() {}
function s0(e, t) {
  var n = Me,
    r = en(),
    o = t(),
    i = !dn(r.memoizedState, o);
  if (
    (i && ((r.memoizedState = o), (Et = !0)),
    (r = r.queue),
    hp(u0.bind(null, n, r, e), [e]),
    r.getSnapshot !== t || i || (nt !== null && nt.memoizedState.tag & 1))
  ) {
    if (((n.flags |= 2048), bs(9, l0.bind(null, n, r, o, t), void 0, null), rt === null)) throw Error(j(349));
    so & 30 || a0(n, t, o);
  }
  return o;
}
function a0(e, t, n) {
  (e.flags |= 16384),
    (e = { getSnapshot: t, value: n }),
    (t = Me.updateQueue),
    t === null
      ? ((t = { lastEffect: null, stores: null }), (Me.updateQueue = t), (t.stores = [e]))
      : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e));
}
function l0(e, t, n, r) {
  (t.value = n), (t.getSnapshot = r), c0(t) && f0(e);
}
function u0(e, t, n) {
  return n(function () {
    c0(t) && f0(e);
  });
}
function c0(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !dn(e, n);
  } catch (r) {
    return !0;
  }
}
function f0(e) {
  var t = Kn(e, 1);
  t !== null && fn(t, e, 1, -1);
}
function bm(e) {
  var t = yn();
  return (
    typeof e == "function" && (e = e()),
    (t.memoizedState = t.baseState = e),
    (e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Cs, lastRenderedState: e }),
    (t.queue = e),
    (e = e.dispatch = zC.bind(null, Me, e)),
    [t.memoizedState, e]
  );
}
function bs(e, t, n, r) {
  return (
    (e = { tag: e, create: t, destroy: n, deps: r, next: null }),
    (t = Me.updateQueue),
    t === null
      ? ((t = { lastEffect: null, stores: null }), (Me.updateQueue = t), (t.lastEffect = e.next = e))
      : ((n = t.lastEffect),
        n === null ? (t.lastEffect = e.next = e) : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e))),
    e
  );
}
function d0() {
  return en().memoizedState;
}
function Xa(e, t, n, r) {
  var o = yn();
  (Me.flags |= e), (o.memoizedState = bs(1 | t, n, void 0, r === void 0 ? null : r));
}
function cu(e, t, n, r) {
  var o = en();
  r = r === void 0 ? null : r;
  var i = void 0;
  if (Je !== null) {
    var s = Je.memoizedState;
    if (((i = s.destroy), r !== null && fp(r, s.deps))) {
      o.memoizedState = bs(t, n, i, r);
      return;
    }
  }
  (Me.flags |= e), (o.memoizedState = bs(1 | t, n, i, r));
}
function km(e, t) {
  return Xa(8390656, 8, e, t);
}
function hp(e, t) {
  return cu(2048, 8, e, t);
}
function p0(e, t) {
  return cu(4, 2, e, t);
}
function h0(e, t) {
  return cu(4, 4, e, t);
}
function m0(e, t) {
  if (typeof t == "function")
    return (
      (e = e()),
      t(e),
      function () {
        t(null);
      }
    );
  if (t != null)
    return (
      (e = e()),
      (t.current = e),
      function () {
        t.current = null;
      }
    );
}
function g0(e, t, n) {
  return (n = n != null ? n.concat([e]) : null), cu(4, 4, m0.bind(null, t, e), n);
}
function mp() {}
function y0(e, t) {
  var n = en();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && fp(t, r[1]) ? r[0] : ((n.memoizedState = [e, t]), e);
}
function v0(e, t) {
  var n = en();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && fp(t, r[1]) ? r[0] : ((e = e()), (n.memoizedState = [e, t]), e);
}
function w0(e, t, n) {
  return so & 21
    ? (dn(n, t) || ((n = bv()), (Me.lanes |= n), (ao |= n), (e.baseState = !0)), t)
    : (e.baseState && ((e.baseState = !1), (Et = !0)), (e.memoizedState = n));
}
function IC(e, t) {
  var n = we;
  (we = n !== 0 && 4 > n ? n : 4), e(!0);
  var r = yc.transition;
  yc.transition = {};
  try {
    e(!1), t();
  } finally {
    (we = n), (yc.transition = r);
  }
}
function x0() {
  return en().memoizedState;
}
function $C(e, t, n) {
  var r = _r(e);
  if (((n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }), S0(e))) E0(t, n);
  else if (((n = n0(e, t, n, r)), n !== null)) {
    var o = vt();
    fn(n, e, r, o), C0(n, t, r);
  }
}
function zC(e, t, n) {
  var r = _r(e),
    o = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
  if (S0(e)) E0(t, o);
  else {
    var i = e.alternate;
    if (e.lanes === 0 && (i === null || i.lanes === 0) && ((i = t.lastRenderedReducer), i !== null))
      try {
        var s = t.lastRenderedState,
          a = i(s, n);
        if (((o.hasEagerState = !0), (o.eagerState = a), dn(a, s))) {
          var l = t.interleaved;
          l === null ? ((o.next = o), sp(t)) : ((o.next = l.next), (l.next = o)), (t.interleaved = o);
          return;
        }
      } catch (u) {
      } finally {
      }
    (n = n0(e, t, o, r)), n !== null && ((o = vt()), fn(n, e, r, o), C0(n, t, r));
  }
}
function S0(e) {
  var t = e.alternate;
  return e === Me || (t !== null && t === Me);
}
function E0(e, t) {
  ns = Dl = !0;
  var n = e.pending;
  n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)), (e.pending = t);
}
function C0(e, t, n) {
  if (n & 4194240) {
    var r = t.lanes;
    (r &= e.pendingLanes), (n |= r), (t.lanes = n), Kd(e, n);
  }
}
var Ml = {
    readContext: Zt,
    useCallback: ut,
    useContext: ut,
    useEffect: ut,
    useImperativeHandle: ut,
    useInsertionEffect: ut,
    useLayoutEffect: ut,
    useMemo: ut,
    useReducer: ut,
    useRef: ut,
    useState: ut,
    useDebugValue: ut,
    useDeferredValue: ut,
    useTransition: ut,
    useMutableSource: ut,
    useSyncExternalStore: ut,
    useId: ut,
    unstable_isNewReconciler: !1,
  },
  UC = {
    readContext: Zt,
    useCallback: function (e, t) {
      return (yn().memoizedState = [e, t === void 0 ? null : t]), e;
    },
    useContext: Zt,
    useEffect: km,
    useImperativeHandle: function (e, t, n) {
      return (n = n != null ? n.concat([e]) : null), Xa(4194308, 4, m0.bind(null, t, e), n);
    },
    useLayoutEffect: function (e, t) {
      return Xa(4194308, 4, e, t);
    },
    useInsertionEffect: function (e, t) {
      return Xa(4, 2, e, t);
    },
    useMemo: function (e, t) {
      var n = yn();
      return (t = t === void 0 ? null : t), (e = e()), (n.memoizedState = [e, t]), e;
    },
    useReducer: function (e, t, n) {
      var r = yn();
      return (
        (t = n !== void 0 ? n(t) : t),
        (r.memoizedState = r.baseState = t),
        (e = {
          pending: null,
          interleaved: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: e,
          lastRenderedState: t,
        }),
        (r.queue = e),
        (e = e.dispatch = $C.bind(null, Me, e)),
        [r.memoizedState, e]
      );
    },
    useRef: function (e) {
      var t = yn();
      return (e = { current: e }), (t.memoizedState = e);
    },
    useState: bm,
    useDebugValue: mp,
    useDeferredValue: function (e) {
      return (yn().memoizedState = e);
    },
    useTransition: function () {
      var e = bm(!1),
        t = e[0];
      return (e = IC.bind(null, e[1])), (yn().memoizedState = e), [t, e];
    },
    useMutableSource: function () {},
    useSyncExternalStore: function (e, t, n) {
      var r = Me,
        o = yn();
      if (Pe) {
        if (n === void 0) throw Error(j(407));
        n = n();
      } else {
        if (((n = t()), rt === null)) throw Error(j(349));
        so & 30 || a0(r, t, n);
      }
      o.memoizedState = n;
      var i = { value: n, getSnapshot: t };
      return (
        (o.queue = i),
        km(u0.bind(null, r, i, e), [e]),
        (r.flags |= 2048),
        bs(9, l0.bind(null, r, i, n, t), void 0, null),
        n
      );
    },
    useId: function () {
      var e = yn(),
        t = rt.identifierPrefix;
      if (Pe) {
        var n = zn,
          r = $n;
        (n = (r & ~(1 << (32 - cn(r) - 1))).toString(32) + n),
          (t = ":" + t + "R" + n),
          (n = Es++),
          0 < n && (t += "H" + n.toString(32)),
          (t += ":");
      } else (n = FC++), (t = ":" + t + "r" + n.toString(32) + ":");
      return (e.memoizedState = t);
    },
    unstable_isNewReconciler: !1,
  },
  BC = {
    readContext: Zt,
    useCallback: y0,
    useContext: Zt,
    useEffect: hp,
    useImperativeHandle: g0,
    useInsertionEffect: p0,
    useLayoutEffect: h0,
    useMemo: v0,
    useReducer: vc,
    useRef: d0,
    useState: function () {
      return vc(Cs);
    },
    useDebugValue: mp,
    useDeferredValue: function (e) {
      var t = en();
      return w0(t, Je.memoizedState, e);
    },
    useTransition: function () {
      var e = vc(Cs)[0],
        t = en().memoizedState;
      return [e, t];
    },
    useMutableSource: i0,
    useSyncExternalStore: s0,
    useId: x0,
    unstable_isNewReconciler: !1,
  },
  VC = {
    readContext: Zt,
    useCallback: y0,
    useContext: Zt,
    useEffect: hp,
    useImperativeHandle: g0,
    useInsertionEffect: p0,
    useLayoutEffect: h0,
    useMemo: v0,
    useReducer: wc,
    useRef: d0,
    useState: function () {
      return wc(Cs);
    },
    useDebugValue: mp,
    useDeferredValue: function (e) {
      var t = en();
      return Je === null ? (t.memoizedState = e) : w0(t, Je.memoizedState, e);
    },
    useTransition: function () {
      var e = wc(Cs)[0],
        t = en().memoizedState;
      return [e, t];
    },
    useMutableSource: i0,
    useSyncExternalStore: s0,
    useId: x0,
    unstable_isNewReconciler: !1,
  };
function nn(e, t) {
  if (e && e.defaultProps) {
    (t = je({}, t)), (e = e.defaultProps);
    for (var n in e) t[n] === void 0 && (t[n] = e[n]);
    return t;
  }
  return t;
}
function Lf(e, t, n, r) {
  (t = e.memoizedState),
    (n = n(r, t)),
    (n = n == null ? t : je({}, t, n)),
    (e.memoizedState = n),
    e.lanes === 0 && (e.updateQueue.baseState = n);
}
var fu = {
  isMounted: function (e) {
    return (e = e._reactInternals) ? mo(e) === e : !1;
  },
  enqueueSetState: function (e, t, n) {
    e = e._reactInternals;
    var r = vt(),
      o = _r(e),
      i = Un(r, o);
    (i.payload = t), n != null && (i.callback = n), (t = br(e, i, o)), t !== null && (fn(t, e, o, r), Qa(t, e, o));
  },
  enqueueReplaceState: function (e, t, n) {
    e = e._reactInternals;
    var r = vt(),
      o = _r(e),
      i = Un(r, o);
    (i.tag = 1),
      (i.payload = t),
      n != null && (i.callback = n),
      (t = br(e, i, o)),
      t !== null && (fn(t, e, o, r), Qa(t, e, o));
  },
  enqueueForceUpdate: function (e, t) {
    e = e._reactInternals;
    var n = vt(),
      r = _r(e),
      o = Un(n, r);
    (o.tag = 2), t != null && (o.callback = t), (t = br(e, o, r)), t !== null && (fn(t, e, r, n), Qa(t, e, r));
  },
};
function _m(e, t, n, r, o, i, s) {
  return (
    (e = e.stateNode),
    typeof e.shouldComponentUpdate == "function"
      ? e.shouldComponentUpdate(r, i, s)
      : t.prototype && t.prototype.isPureReactComponent
      ? !gs(n, r) || !gs(o, i)
      : !0
  );
}
function b0(e, t, n) {
  var r = !1,
    o = Pr,
    i = t.contextType;
  return (
    typeof i == "object" && i !== null
      ? (i = Zt(i))
      : ((o = bt(t) ? oo : pt.current), (r = t.contextTypes), (i = (r = r != null) ? Jo(e, o) : Pr)),
    (t = new t(n, i)),
    (e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null),
    (t.updater = fu),
    (e.stateNode = t),
    (t._reactInternals = e),
    r &&
      ((e = e.stateNode),
      (e.__reactInternalMemoizedUnmaskedChildContext = o),
      (e.__reactInternalMemoizedMaskedChildContext = i)),
    t
  );
}
function Tm(e, t, n, r) {
  (e = t.state),
    typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r),
    typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r),
    t.state !== e && fu.enqueueReplaceState(t, t.state, null);
}
function Df(e, t, n, r) {
  var o = e.stateNode;
  (o.props = n), (o.state = e.memoizedState), (o.refs = {}), ap(e);
  var i = t.contextType;
  typeof i == "object" && i !== null ? (o.context = Zt(i)) : ((i = bt(t) ? oo : pt.current), (o.context = Jo(e, i))),
    (o.state = e.memoizedState),
    (i = t.getDerivedStateFromProps),
    typeof i == "function" && (Lf(e, t, i, n), (o.state = e.memoizedState)),
    typeof t.getDerivedStateFromProps == "function" ||
      typeof o.getSnapshotBeforeUpdate == "function" ||
      (typeof o.UNSAFE_componentWillMount != "function" && typeof o.componentWillMount != "function") ||
      ((t = o.state),
      typeof o.componentWillMount == "function" && o.componentWillMount(),
      typeof o.UNSAFE_componentWillMount == "function" && o.UNSAFE_componentWillMount(),
      t !== o.state && fu.enqueueReplaceState(o, o.state, null),
      Nl(e, n, o, r),
      (o.state = e.memoizedState)),
    typeof o.componentDidMount == "function" && (e.flags |= 4194308);
}
function ni(e, t) {
  try {
    var n = "",
      r = t;
    do (n += yE(r)), (r = r.return);
    while (r);
    var o = n;
  } catch (i) {
    o =
      `
Error generating stack: ` +
      i.message +
      `
` +
      i.stack;
  }
  return { value: e, source: t, stack: o, digest: null };
}
function xc(e, t, n) {
  return { value: e, source: null, stack: n != null ? n : null, digest: t != null ? t : null };
}
function Mf(e, t) {
  try {
    console.error(t.value);
  } catch (n) {
    setTimeout(function () {
      throw n;
    });
  }
}
var WC = typeof WeakMap == "function" ? WeakMap : Map;
function k0(e, t, n) {
  (n = Un(-1, n)), (n.tag = 3), (n.payload = { element: null });
  var r = t.value;
  return (
    (n.callback = function () {
      Fl || ((Fl = !0), (Hf = r)), Mf(e, t);
    }),
    n
  );
}
function _0(e, t, n) {
  (n = Un(-1, n)), (n.tag = 3);
  var r = e.type.getDerivedStateFromError;
  if (typeof r == "function") {
    var o = t.value;
    (n.payload = function () {
      return r(o);
    }),
      (n.callback = function () {
        Mf(e, t);
      });
  }
  var i = e.stateNode;
  return (
    i !== null &&
      typeof i.componentDidCatch == "function" &&
      (n.callback = function () {
        Mf(e, t), typeof r != "function" && (kr === null ? (kr = new Set([this])) : kr.add(this));
        var s = t.stack;
        this.componentDidCatch(t.value, { componentStack: s !== null ? s : "" });
      }),
    n
  );
}
function Rm(e, t, n) {
  var r = e.pingCache;
  if (r === null) {
    r = e.pingCache = new WC();
    var o = new Set();
    r.set(t, o);
  } else (o = r.get(t)), o === void 0 && ((o = new Set()), r.set(t, o));
  o.has(n) || (o.add(n), (e = ob.bind(null, e, t, n)), t.then(e, e));
}
function Pm(e) {
  do {
    var t;
    if (((t = e.tag === 13) && ((t = e.memoizedState), (t = t !== null ? t.dehydrated !== null : !0)), t)) return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function Om(e, t, n, r, o) {
  return e.mode & 1
    ? ((e.flags |= 65536), (e.lanes = o), e)
    : (e === t
        ? (e.flags |= 65536)
        : ((e.flags |= 128),
          (n.flags |= 131072),
          (n.flags &= -52805),
          n.tag === 1 && (n.alternate === null ? (n.tag = 17) : ((t = Un(-1, 1)), (t.tag = 2), br(n, t, 1))),
          (n.lanes |= 1)),
      e);
}
var HC = Zn.ReactCurrentOwner,
  Et = !1;
function gt(e, t, n, r) {
  t.child = e === null ? t0(t, null, n, r) : ei(t, e.child, n, r);
}
function Am(e, t, n, r, o) {
  n = n.render;
  var i = t.ref;
  return (
    qo(t, o),
    (r = dp(e, t, n, r, i, o)),
    (n = pp()),
    e !== null && !Et
      ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~o), qn(e, t, o))
      : (Pe && n && ep(t), (t.flags |= 1), gt(e, t, r, o), t.child)
  );
}
function Nm(e, t, n, r, o) {
  if (e === null) {
    var i = n.type;
    return typeof i == "function" &&
      !Cp(i) &&
      i.defaultProps === void 0 &&
      n.compare === null &&
      n.defaultProps === void 0
      ? ((t.tag = 15), (t.type = i), T0(e, t, i, r, o))
      : ((e = tl(n.type, null, r, t, t.mode, o)), (e.ref = t.ref), (e.return = t), (t.child = e));
  }
  if (((i = e.child), !(e.lanes & o))) {
    var s = i.memoizedProps;
    if (((n = n.compare), (n = n !== null ? n : gs), n(s, r) && e.ref === t.ref)) return qn(e, t, o);
  }
  return (t.flags |= 1), (e = Tr(i, r)), (e.ref = t.ref), (e.return = t), (t.child = e);
}
function T0(e, t, n, r, o) {
  if (e !== null) {
    var i = e.memoizedProps;
    if (gs(i, r) && e.ref === t.ref)
      if (((Et = !1), (t.pendingProps = r = i), (e.lanes & o) !== 0)) e.flags & 131072 && (Et = !0);
      else return (t.lanes = e.lanes), qn(e, t, o);
  }
  return jf(e, t, n, r, o);
}
function R0(e, t, n) {
  var r = t.pendingProps,
    o = r.children,
    i = e !== null ? e.memoizedState : null;
  if (r.mode === "hidden")
    if (!(t.mode & 1)) (t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }), be(zo, Pt), (Pt |= n);
    else {
      if (!(n & 1073741824))
        return (
          (e = i !== null ? i.baseLanes | n : n),
          (t.lanes = t.childLanes = 1073741824),
          (t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }),
          (t.updateQueue = null),
          be(zo, Pt),
          (Pt |= e),
          null
        );
      (t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }),
        (r = i !== null ? i.baseLanes : n),
        be(zo, Pt),
        (Pt |= r);
    }
  else i !== null ? ((r = i.baseLanes | n), (t.memoizedState = null)) : (r = n), be(zo, Pt), (Pt |= r);
  return gt(e, t, o, n), t.child;
}
function P0(e, t) {
  var n = t.ref;
  ((e === null && n !== null) || (e !== null && e.ref !== n)) && ((t.flags |= 512), (t.flags |= 2097152));
}
function jf(e, t, n, r, o) {
  var i = bt(n) ? oo : pt.current;
  return (
    (i = Jo(t, i)),
    qo(t, o),
    (n = dp(e, t, n, r, i, o)),
    (r = pp()),
    e !== null && !Et
      ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~o), qn(e, t, o))
      : (Pe && r && ep(t), (t.flags |= 1), gt(e, t, n, o), t.child)
  );
}
function Lm(e, t, n, r, o) {
  if (bt(n)) {
    var i = !0;
    Tl(t);
  } else i = !1;
  if ((qo(t, o), t.stateNode === null)) Ja(e, t), b0(t, n, r), Df(t, n, r, o), (r = !0);
  else if (e === null) {
    var s = t.stateNode,
      a = t.memoizedProps;
    s.props = a;
    var l = s.context,
      u = n.contextType;
    typeof u == "object" && u !== null ? (u = Zt(u)) : ((u = bt(n) ? oo : pt.current), (u = Jo(t, u)));
    var c = n.getDerivedStateFromProps,
      f = typeof c == "function" || typeof s.getSnapshotBeforeUpdate == "function";
    f ||
      (typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function") ||
      ((a !== r || l !== u) && Tm(t, s, r, u)),
      (pr = !1);
    var d = t.memoizedState;
    (s.state = d),
      Nl(t, r, s, o),
      (l = t.memoizedState),
      a !== r || d !== l || Ct.current || pr
        ? (typeof c == "function" && (Lf(t, n, c, r), (l = t.memoizedState)),
          (a = pr || _m(t, n, a, r, d, l, u))
            ? (f ||
                (typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function") ||
                (typeof s.componentWillMount == "function" && s.componentWillMount(),
                typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount()),
              typeof s.componentDidMount == "function" && (t.flags |= 4194308))
            : (typeof s.componentDidMount == "function" && (t.flags |= 4194308),
              (t.memoizedProps = r),
              (t.memoizedState = l)),
          (s.props = r),
          (s.state = l),
          (s.context = u),
          (r = a))
        : (typeof s.componentDidMount == "function" && (t.flags |= 4194308), (r = !1));
  } else {
    (s = t.stateNode),
      r0(e, t),
      (a = t.memoizedProps),
      (u = t.type === t.elementType ? a : nn(t.type, a)),
      (s.props = u),
      (f = t.pendingProps),
      (d = s.context),
      (l = n.contextType),
      typeof l == "object" && l !== null ? (l = Zt(l)) : ((l = bt(n) ? oo : pt.current), (l = Jo(t, l)));
    var v = n.getDerivedStateFromProps;
    (c = typeof v == "function" || typeof s.getSnapshotBeforeUpdate == "function") ||
      (typeof s.UNSAFE_componentWillReceiveProps != "function" && typeof s.componentWillReceiveProps != "function") ||
      ((a !== f || d !== l) && Tm(t, s, r, l)),
      (pr = !1),
      (d = t.memoizedState),
      (s.state = d),
      Nl(t, r, s, o);
    var m = t.memoizedState;
    a !== f || d !== m || Ct.current || pr
      ? (typeof v == "function" && (Lf(t, n, v, r), (m = t.memoizedState)),
        (u = pr || _m(t, n, u, r, d, m, l) || !1)
          ? (c ||
              (typeof s.UNSAFE_componentWillUpdate != "function" && typeof s.componentWillUpdate != "function") ||
              (typeof s.componentWillUpdate == "function" && s.componentWillUpdate(r, m, l),
              typeof s.UNSAFE_componentWillUpdate == "function" && s.UNSAFE_componentWillUpdate(r, m, l)),
            typeof s.componentDidUpdate == "function" && (t.flags |= 4),
            typeof s.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024))
          : (typeof s.componentDidUpdate != "function" ||
              (a === e.memoizedProps && d === e.memoizedState) ||
              (t.flags |= 4),
            typeof s.getSnapshotBeforeUpdate != "function" ||
              (a === e.memoizedProps && d === e.memoizedState) ||
              (t.flags |= 1024),
            (t.memoizedProps = r),
            (t.memoizedState = m)),
        (s.props = r),
        (s.state = m),
        (s.context = l),
        (r = u))
      : (typeof s.componentDidUpdate != "function" ||
          (a === e.memoizedProps && d === e.memoizedState) ||
          (t.flags |= 4),
        typeof s.getSnapshotBeforeUpdate != "function" ||
          (a === e.memoizedProps && d === e.memoizedState) ||
          (t.flags |= 1024),
        (r = !1));
  }
  return Ff(e, t, n, r, i, o);
}
function Ff(e, t, n, r, o, i) {
  P0(e, t);
  var s = (t.flags & 128) !== 0;
  if (!r && !s) return o && vm(t, n, !1), qn(e, t, i);
  (r = t.stateNode), (HC.current = t);
  var a = s && typeof n.getDerivedStateFromError != "function" ? null : r.render();
  return (
    (t.flags |= 1),
    e !== null && s ? ((t.child = ei(t, e.child, null, i)), (t.child = ei(t, null, a, i))) : gt(e, t, a, i),
    (t.memoizedState = r.state),
    o && vm(t, n, !0),
    t.child
  );
}
function O0(e) {
  var t = e.stateNode;
  t.pendingContext ? ym(e, t.pendingContext, t.pendingContext !== t.context) : t.context && ym(e, t.context, !1),
    lp(e, t.containerInfo);
}
function Dm(e, t, n, r, o) {
  return Zo(), np(o), (t.flags |= 256), gt(e, t, n, r), t.child;
}
var If = { dehydrated: null, treeContext: null, retryLane: 0 };
function $f(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function A0(e, t, n) {
  var r = t.pendingProps,
    o = Le.current,
    i = !1,
    s = (t.flags & 128) !== 0,
    a;
  if (
    ((a = s) || (a = e !== null && e.memoizedState === null ? !1 : (o & 2) !== 0),
    a ? ((i = !0), (t.flags &= -129)) : (e === null || e.memoizedState !== null) && (o |= 1),
    be(Le, o & 1),
    e === null)
  )
    return (
      Af(t),
      (e = t.memoizedState),
      e !== null && ((e = e.dehydrated), e !== null)
        ? (t.mode & 1 ? (e.data === "$!" ? (t.lanes = 8) : (t.lanes = 1073741824)) : (t.lanes = 1), null)
        : ((s = r.children),
          (e = r.fallback),
          i
            ? ((r = t.mode),
              (i = t.child),
              (s = { mode: "hidden", children: s }),
              !(r & 1) && i !== null ? ((i.childLanes = 0), (i.pendingProps = s)) : (i = hu(s, r, 0, null)),
              (e = ro(e, r, n, null)),
              (i.return = t),
              (e.return = t),
              (i.sibling = e),
              (t.child = i),
              (t.child.memoizedState = $f(n)),
              (t.memoizedState = If),
              e)
            : gp(t, s))
    );
  if (((o = e.memoizedState), o !== null && ((a = o.dehydrated), a !== null))) return KC(e, t, s, r, a, o, n);
  if (i) {
    (i = r.fallback), (s = t.mode), (o = e.child), (a = o.sibling);
    var l = { mode: "hidden", children: r.children };
    return (
      !(s & 1) && t.child !== o
        ? ((r = t.child), (r.childLanes = 0), (r.pendingProps = l), (t.deletions = null))
        : ((r = Tr(o, l)), (r.subtreeFlags = o.subtreeFlags & 14680064)),
      a !== null ? (i = Tr(a, i)) : ((i = ro(i, s, n, null)), (i.flags |= 2)),
      (i.return = t),
      (r.return = t),
      (r.sibling = i),
      (t.child = r),
      (r = i),
      (i = t.child),
      (s = e.child.memoizedState),
      (s = s === null ? $f(n) : { baseLanes: s.baseLanes | n, cachePool: null, transitions: s.transitions }),
      (i.memoizedState = s),
      (i.childLanes = e.childLanes & ~n),
      (t.memoizedState = If),
      r
    );
  }
  return (
    (i = e.child),
    (e = i.sibling),
    (r = Tr(i, { mode: "visible", children: r.children })),
    !(t.mode & 1) && (r.lanes = n),
    (r.return = t),
    (r.sibling = null),
    e !== null && ((n = t.deletions), n === null ? ((t.deletions = [e]), (t.flags |= 16)) : n.push(e)),
    (t.child = r),
    (t.memoizedState = null),
    r
  );
}
function gp(e, t) {
  return (t = hu({ mode: "visible", children: t }, e.mode, 0, null)), (t.return = e), (e.child = t);
}
function xa(e, t, n, r) {
  return (
    r !== null && np(r),
    ei(t, e.child, null, n),
    (e = gp(t, t.pendingProps.children)),
    (e.flags |= 2),
    (t.memoizedState = null),
    e
  );
}
function KC(e, t, n, r, o, i, s) {
  if (n)
    return t.flags & 256
      ? ((t.flags &= -257), (r = xc(Error(j(422)))), xa(e, t, s, r))
      : t.memoizedState !== null
      ? ((t.child = e.child), (t.flags |= 128), null)
      : ((i = r.fallback),
        (o = t.mode),
        (r = hu({ mode: "visible", children: r.children }, o, 0, null)),
        (i = ro(i, o, s, null)),
        (i.flags |= 2),
        (r.return = t),
        (i.return = t),
        (r.sibling = i),
        (t.child = r),
        t.mode & 1 && ei(t, e.child, null, s),
        (t.child.memoizedState = $f(s)),
        (t.memoizedState = If),
        i);
  if (!(t.mode & 1)) return xa(e, t, s, null);
  if (o.data === "$!") {
    if (((r = o.nextSibling && o.nextSibling.dataset), r)) var a = r.dgst;
    return (r = a), (i = Error(j(419))), (r = xc(i, r, void 0)), xa(e, t, s, r);
  }
  if (((a = (s & e.childLanes) !== 0), Et || a)) {
    if (((r = rt), r !== null)) {
      switch (s & -s) {
        case 4:
          o = 2;
          break;
        case 16:
          o = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          o = 32;
          break;
        case 536870912:
          o = 268435456;
          break;
        default:
          o = 0;
      }
      (o = o & (r.suspendedLanes | s) ? 0 : o),
        o !== 0 && o !== i.retryLane && ((i.retryLane = o), Kn(e, o), fn(r, e, o, -1));
    }
    return Ep(), (r = xc(Error(j(421)))), xa(e, t, s, r);
  }
  return o.data === "$?"
    ? ((t.flags |= 128), (t.child = e.child), (t = ib.bind(null, e)), (o._reactRetry = t), null)
    : ((e = i.treeContext),
      (Nt = Cr(o.nextSibling)),
      (Dt = t),
      (Pe = !0),
      (an = null),
      e !== null && ((qt[Gt++] = $n), (qt[Gt++] = zn), (qt[Gt++] = io), ($n = e.id), (zn = e.overflow), (io = t)),
      (t = gp(t, r.children)),
      (t.flags |= 4096),
      t);
}
function Mm(e, t, n) {
  e.lanes |= t;
  var r = e.alternate;
  r !== null && (r.lanes |= t), Nf(e.return, t, n);
}
function Sc(e, t, n, r, o) {
  var i = e.memoizedState;
  i === null
    ? (e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailMode: o })
    : ((i.isBackwards = t),
      (i.rendering = null),
      (i.renderingStartTime = 0),
      (i.last = r),
      (i.tail = n),
      (i.tailMode = o));
}
function N0(e, t, n) {
  var r = t.pendingProps,
    o = r.revealOrder,
    i = r.tail;
  if ((gt(e, t, r.children, n), (r = Le.current), r & 2)) (r = (r & 1) | 2), (t.flags |= 128);
  else {
    if (e !== null && e.flags & 128)
      e: for (e = t.child; e !== null; ) {
        if (e.tag === 13) e.memoizedState !== null && Mm(e, n, t);
        else if (e.tag === 19) Mm(e, n, t);
        else if (e.child !== null) {
          (e.child.return = e), (e = e.child);
          continue;
        }
        if (e === t) break e;
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t) break e;
          e = e.return;
        }
        (e.sibling.return = e.return), (e = e.sibling);
      }
    r &= 1;
  }
  if ((be(Le, r), !(t.mode & 1))) t.memoizedState = null;
  else
    switch (o) {
      case "forwards":
        for (n = t.child, o = null; n !== null; )
          (e = n.alternate), e !== null && Ll(e) === null && (o = n), (n = n.sibling);
        (n = o),
          n === null ? ((o = t.child), (t.child = null)) : ((o = n.sibling), (n.sibling = null)),
          Sc(t, !1, o, n, i);
        break;
      case "backwards":
        for (n = null, o = t.child, t.child = null; o !== null; ) {
          if (((e = o.alternate), e !== null && Ll(e) === null)) {
            t.child = o;
            break;
          }
          (e = o.sibling), (o.sibling = n), (n = o), (o = e);
        }
        Sc(t, !0, n, null, i);
        break;
      case "together":
        Sc(t, !1, null, null, void 0);
        break;
      default:
        t.memoizedState = null;
    }
  return t.child;
}
function Ja(e, t) {
  !(t.mode & 1) && e !== null && ((e.alternate = null), (t.alternate = null), (t.flags |= 2));
}
function qn(e, t, n) {
  if ((e !== null && (t.dependencies = e.dependencies), (ao |= t.lanes), !(n & t.childLanes))) return null;
  if (e !== null && t.child !== e.child) throw Error(j(153));
  if (t.child !== null) {
    for (e = t.child, n = Tr(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; )
      (e = e.sibling), (n = n.sibling = Tr(e, e.pendingProps)), (n.return = t);
    n.sibling = null;
  }
  return t.child;
}
function qC(e, t, n) {
  switch (t.tag) {
    case 3:
      O0(t), Zo();
      break;
    case 5:
      o0(t);
      break;
    case 1:
      bt(t.type) && Tl(t);
      break;
    case 4:
      lp(t, t.stateNode.containerInfo);
      break;
    case 10:
      var r = t.type._context,
        o = t.memoizedProps.value;
      be(Ol, r._currentValue), (r._currentValue = o);
      break;
    case 13:
      if (((r = t.memoizedState), r !== null))
        return r.dehydrated !== null
          ? (be(Le, Le.current & 1), (t.flags |= 128), null)
          : n & t.child.childLanes
          ? A0(e, t, n)
          : (be(Le, Le.current & 1), (e = qn(e, t, n)), e !== null ? e.sibling : null);
      be(Le, Le.current & 1);
      break;
    case 19:
      if (((r = (n & t.childLanes) !== 0), e.flags & 128)) {
        if (r) return N0(e, t, n);
        t.flags |= 128;
      }
      if (
        ((o = t.memoizedState),
        o !== null && ((o.rendering = null), (o.tail = null), (o.lastEffect = null)),
        be(Le, Le.current),
        r)
      )
        break;
      return null;
    case 22:
    case 23:
      return (t.lanes = 0), R0(e, t, n);
  }
  return qn(e, t, n);
}
var L0, zf, D0, M0;
L0 = function (e, t) {
  for (var n = t.child; n !== null; ) {
    if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
    else if (n.tag !== 4 && n.child !== null) {
      (n.child.return = n), (n = n.child);
      continue;
    }
    if (n === t) break;
    for (; n.sibling === null; ) {
      if (n.return === null || n.return === t) return;
      n = n.return;
    }
    (n.sibling.return = n.return), (n = n.sibling);
  }
};
zf = function () {};
D0 = function (e, t, n, r) {
  var o = e.memoizedProps;
  if (o !== r) {
    (e = t.stateNode), Jr(bn.current);
    var i = null;
    switch (n) {
      case "input":
        (o = lf(e, o)), (r = lf(e, r)), (i = []);
        break;
      case "select":
        (o = je({}, o, { value: void 0 })), (r = je({}, r, { value: void 0 })), (i = []);
        break;
      case "textarea":
        (o = ff(e, o)), (r = ff(e, r)), (i = []);
        break;
      default:
        typeof o.onClick != "function" && typeof r.onClick == "function" && (e.onclick = kl);
    }
    pf(n, r);
    var s;
    n = null;
    for (u in o)
      if (!r.hasOwnProperty(u) && o.hasOwnProperty(u) && o[u] != null)
        if (u === "style") {
          var a = o[u];
          for (s in a) a.hasOwnProperty(s) && (n || (n = {}), (n[s] = ""));
        } else
          u !== "dangerouslySetInnerHTML" &&
            u !== "children" &&
            u !== "suppressContentEditableWarning" &&
            u !== "suppressHydrationWarning" &&
            u !== "autoFocus" &&
            (us.hasOwnProperty(u) ? i || (i = []) : (i = i || []).push(u, null));
    for (u in r) {
      var l = r[u];
      if (((a = o != null ? o[u] : void 0), r.hasOwnProperty(u) && l !== a && (l != null || a != null)))
        if (u === "style")
          if (a) {
            for (s in a) !a.hasOwnProperty(s) || (l && l.hasOwnProperty(s)) || (n || (n = {}), (n[s] = ""));
            for (s in l) l.hasOwnProperty(s) && a[s] !== l[s] && (n || (n = {}), (n[s] = l[s]));
          } else n || (i || (i = []), i.push(u, n)), (n = l);
        else
          u === "dangerouslySetInnerHTML"
            ? ((l = l ? l.__html : void 0),
              (a = a ? a.__html : void 0),
              l != null && a !== l && (i = i || []).push(u, l))
            : u === "children"
            ? (typeof l != "string" && typeof l != "number") || (i = i || []).push(u, "" + l)
            : u !== "suppressContentEditableWarning" &&
              u !== "suppressHydrationWarning" &&
              (us.hasOwnProperty(u)
                ? (l != null && u === "onScroll" && _e("scroll", e), i || a === l || (i = []))
                : (i = i || []).push(u, l));
    }
    n && (i = i || []).push("style", n);
    var u = i;
    (t.updateQueue = u) && (t.flags |= 4);
  }
};
M0 = function (e, t, n, r) {
  n !== r && (t.flags |= 4);
};
function Ni(e, t) {
  if (!Pe)
    switch (e.tailMode) {
      case "hidden":
        t = e.tail;
        for (var n = null; t !== null; ) t.alternate !== null && (n = t), (t = t.sibling);
        n === null ? (e.tail = null) : (n.sibling = null);
        break;
      case "collapsed":
        n = e.tail;
        for (var r = null; n !== null; ) n.alternate !== null && (r = n), (n = n.sibling);
        r === null ? (t || e.tail === null ? (e.tail = null) : (e.tail.sibling = null)) : (r.sibling = null);
    }
}
function ct(e) {
  var t = e.alternate !== null && e.alternate.child === e.child,
    n = 0,
    r = 0;
  if (t)
    for (var o = e.child; o !== null; )
      (n |= o.lanes | o.childLanes),
        (r |= o.subtreeFlags & 14680064),
        (r |= o.flags & 14680064),
        (o.return = e),
        (o = o.sibling);
  else
    for (o = e.child; o !== null; )
      (n |= o.lanes | o.childLanes), (r |= o.subtreeFlags), (r |= o.flags), (o.return = e), (o = o.sibling);
  return (e.subtreeFlags |= r), (e.childLanes = n), t;
}
function GC(e, t, n) {
  var r = t.pendingProps;
  switch ((tp(t), t.tag)) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return ct(t), null;
    case 1:
      return bt(t.type) && _l(), ct(t), null;
    case 3:
      return (
        (r = t.stateNode),
        ti(),
        Te(Ct),
        Te(pt),
        cp(),
        r.pendingContext && ((r.context = r.pendingContext), (r.pendingContext = null)),
        (e === null || e.child === null) &&
          (va(t)
            ? (t.flags |= 4)
            : e === null ||
              (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
              ((t.flags |= 1024), an !== null && (Gf(an), (an = null)))),
        zf(e, t),
        ct(t),
        null
      );
    case 5:
      up(t);
      var o = Jr(Ss.current);
      if (((n = t.type), e !== null && t.stateNode != null))
        D0(e, t, n, r, o), e.ref !== t.ref && ((t.flags |= 512), (t.flags |= 2097152));
      else {
        if (!r) {
          if (t.stateNode === null) throw Error(j(166));
          return ct(t), null;
        }
        if (((e = Jr(bn.current)), va(t))) {
          (r = t.stateNode), (n = t.type);
          var i = t.memoizedProps;
          switch (((r[wn] = t), (r[ws] = i), (e = (t.mode & 1) !== 0), n)) {
            case "dialog":
              _e("cancel", r), _e("close", r);
              break;
            case "iframe":
            case "object":
            case "embed":
              _e("load", r);
              break;
            case "video":
            case "audio":
              for (o = 0; o < qi.length; o++) _e(qi[o], r);
              break;
            case "source":
              _e("error", r);
              break;
            case "img":
            case "image":
            case "link":
              _e("error", r), _e("load", r);
              break;
            case "details":
              _e("toggle", r);
              break;
            case "input":
              Wh(r, i), _e("invalid", r);
              break;
            case "select":
              (r._wrapperState = { wasMultiple: !!i.multiple }), _e("invalid", r);
              break;
            case "textarea":
              Kh(r, i), _e("invalid", r);
          }
          pf(n, i), (o = null);
          for (var s in i)
            if (i.hasOwnProperty(s)) {
              var a = i[s];
              s === "children"
                ? typeof a == "string"
                  ? r.textContent !== a &&
                    (i.suppressHydrationWarning !== !0 && ya(r.textContent, a, e), (o = ["children", a]))
                  : typeof a == "number" &&
                    r.textContent !== "" + a &&
                    (i.suppressHydrationWarning !== !0 && ya(r.textContent, a, e), (o = ["children", "" + a]))
                : us.hasOwnProperty(s) && a != null && s === "onScroll" && _e("scroll", r);
            }
          switch (n) {
            case "input":
              ua(r), Hh(r, i, !0);
              break;
            case "textarea":
              ua(r), qh(r);
              break;
            case "select":
            case "option":
              break;
            default:
              typeof i.onClick == "function" && (r.onclick = kl);
          }
          (r = o), (t.updateQueue = r), r !== null && (t.flags |= 4);
        } else {
          (s = o.nodeType === 9 ? o : o.ownerDocument),
            e === "http://www.w3.org/1999/xhtml" && (e = uv(n)),
            e === "http://www.w3.org/1999/xhtml"
              ? n === "script"
                ? ((e = s.createElement("div")), (e.innerHTML = "<script></script>"), (e = e.removeChild(e.firstChild)))
                : typeof r.is == "string"
                ? (e = s.createElement(n, { is: r.is }))
                : ((e = s.createElement(n)),
                  n === "select" && ((s = e), r.multiple ? (s.multiple = !0) : r.size && (s.size = r.size)))
              : (e = s.createElementNS(e, n)),
            (e[wn] = t),
            (e[ws] = r),
            L0(e, t, !1, !1),
            (t.stateNode = e);
          e: {
            switch (((s = hf(n, r)), n)) {
              case "dialog":
                _e("cancel", e), _e("close", e), (o = r);
                break;
              case "iframe":
              case "object":
              case "embed":
                _e("load", e), (o = r);
                break;
              case "video":
              case "audio":
                for (o = 0; o < qi.length; o++) _e(qi[o], e);
                o = r;
                break;
              case "source":
                _e("error", e), (o = r);
                break;
              case "img":
              case "image":
              case "link":
                _e("error", e), _e("load", e), (o = r);
                break;
              case "details":
                _e("toggle", e), (o = r);
                break;
              case "input":
                Wh(e, r), (o = lf(e, r)), _e("invalid", e);
                break;
              case "option":
                o = r;
                break;
              case "select":
                (e._wrapperState = { wasMultiple: !!r.multiple }), (o = je({}, r, { value: void 0 })), _e("invalid", e);
                break;
              case "textarea":
                Kh(e, r), (o = ff(e, r)), _e("invalid", e);
                break;
              default:
                o = r;
            }
            pf(n, o), (a = o);
            for (i in a)
              if (a.hasOwnProperty(i)) {
                var l = a[i];
                i === "style"
                  ? dv(e, l)
                  : i === "dangerouslySetInnerHTML"
                  ? ((l = l ? l.__html : void 0), l != null && cv(e, l))
                  : i === "children"
                  ? typeof l == "string"
                    ? (n !== "textarea" || l !== "") && cs(e, l)
                    : typeof l == "number" && cs(e, "" + l)
                  : i !== "suppressContentEditableWarning" &&
                    i !== "suppressHydrationWarning" &&
                    i !== "autoFocus" &&
                    (us.hasOwnProperty(i)
                      ? l != null && i === "onScroll" && _e("scroll", e)
                      : l != null && zd(e, i, l, s));
              }
            switch (n) {
              case "input":
                ua(e), Hh(e, r, !1);
                break;
              case "textarea":
                ua(e), qh(e);
                break;
              case "option":
                r.value != null && e.setAttribute("value", "" + Rr(r.value));
                break;
              case "select":
                (e.multiple = !!r.multiple),
                  (i = r.value),
                  i != null
                    ? Vo(e, !!r.multiple, i, !1)
                    : r.defaultValue != null && Vo(e, !!r.multiple, r.defaultValue, !0);
                break;
              default:
                typeof o.onClick == "function" && (e.onclick = kl);
            }
            switch (n) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                r = !!r.autoFocus;
                break e;
              case "img":
                r = !0;
                break e;
              default:
                r = !1;
            }
          }
          r && (t.flags |= 4);
        }
        t.ref !== null && ((t.flags |= 512), (t.flags |= 2097152));
      }
      return ct(t), null;
    case 6:
      if (e && t.stateNode != null) M0(e, t, e.memoizedProps, r);
      else {
        if (typeof r != "string" && t.stateNode === null) throw Error(j(166));
        if (((n = Jr(Ss.current)), Jr(bn.current), va(t))) {
          if (
            ((r = t.stateNode), (n = t.memoizedProps), (r[wn] = t), (i = r.nodeValue !== n) && ((e = Dt), e !== null))
          )
            switch (e.tag) {
              case 3:
                ya(r.nodeValue, n, (e.mode & 1) !== 0);
                break;
              case 5:
                e.memoizedProps.suppressHydrationWarning !== !0 && ya(r.nodeValue, n, (e.mode & 1) !== 0);
            }
          i && (t.flags |= 4);
        } else (r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r)), (r[wn] = t), (t.stateNode = r);
      }
      return ct(t), null;
    case 13:
      if (
        (Te(Le), (r = t.memoizedState), e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
      ) {
        if (Pe && Nt !== null && t.mode & 1 && !(t.flags & 128)) Zv(), Zo(), (t.flags |= 98560), (i = !1);
        else if (((i = va(t)), r !== null && r.dehydrated !== null)) {
          if (e === null) {
            if (!i) throw Error(j(318));
            if (((i = t.memoizedState), (i = i !== null ? i.dehydrated : null), !i)) throw Error(j(317));
            i[wn] = t;
          } else Zo(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4);
          ct(t), (i = !1);
        } else an !== null && (Gf(an), (an = null)), (i = !0);
        if (!i) return t.flags & 65536 ? t : null;
      }
      return t.flags & 128
        ? ((t.lanes = n), t)
        : ((r = r !== null),
          r !== (e !== null && e.memoizedState !== null) &&
            r &&
            ((t.child.flags |= 8192), t.mode & 1 && (e === null || Le.current & 1 ? Ze === 0 && (Ze = 3) : Ep())),
          t.updateQueue !== null && (t.flags |= 4),
          ct(t),
          null);
    case 4:
      return ti(), zf(e, t), e === null && ys(t.stateNode.containerInfo), ct(t), null;
    case 10:
      return ip(t.type._context), ct(t), null;
    case 17:
      return bt(t.type) && _l(), ct(t), null;
    case 19:
      if ((Te(Le), (i = t.memoizedState), i === null)) return ct(t), null;
      if (((r = (t.flags & 128) !== 0), (s = i.rendering), s === null))
        if (r) Ni(i, !1);
        else {
          if (Ze !== 0 || (e !== null && e.flags & 128))
            for (e = t.child; e !== null; ) {
              if (((s = Ll(e)), s !== null)) {
                for (
                  t.flags |= 128,
                    Ni(i, !1),
                    r = s.updateQueue,
                    r !== null && ((t.updateQueue = r), (t.flags |= 4)),
                    t.subtreeFlags = 0,
                    r = n,
                    n = t.child;
                  n !== null;

                )
                  (i = n),
                    (e = r),
                    (i.flags &= 14680066),
                    (s = i.alternate),
                    s === null
                      ? ((i.childLanes = 0),
                        (i.lanes = e),
                        (i.child = null),
                        (i.subtreeFlags = 0),
                        (i.memoizedProps = null),
                        (i.memoizedState = null),
                        (i.updateQueue = null),
                        (i.dependencies = null),
                        (i.stateNode = null))
                      : ((i.childLanes = s.childLanes),
                        (i.lanes = s.lanes),
                        (i.child = s.child),
                        (i.subtreeFlags = 0),
                        (i.deletions = null),
                        (i.memoizedProps = s.memoizedProps),
                        (i.memoizedState = s.memoizedState),
                        (i.updateQueue = s.updateQueue),
                        (i.type = s.type),
                        (e = s.dependencies),
                        (i.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext })),
                    (n = n.sibling);
                return be(Le, (Le.current & 1) | 2), t.child;
              }
              e = e.sibling;
            }
          i.tail !== null && Be() > ri && ((t.flags |= 128), (r = !0), Ni(i, !1), (t.lanes = 4194304));
        }
      else {
        if (!r)
          if (((e = Ll(s)), e !== null)) {
            if (
              ((t.flags |= 128),
              (r = !0),
              (n = e.updateQueue),
              n !== null && ((t.updateQueue = n), (t.flags |= 4)),
              Ni(i, !0),
              i.tail === null && i.tailMode === "hidden" && !s.alternate && !Pe)
            )
              return ct(t), null;
          } else
            2 * Be() - i.renderingStartTime > ri &&
              n !== 1073741824 &&
              ((t.flags |= 128), (r = !0), Ni(i, !1), (t.lanes = 4194304));
        i.isBackwards
          ? ((s.sibling = t.child), (t.child = s))
          : ((n = i.last), n !== null ? (n.sibling = s) : (t.child = s), (i.last = s));
      }
      return i.tail !== null
        ? ((t = i.tail),
          (i.rendering = t),
          (i.tail = t.sibling),
          (i.renderingStartTime = Be()),
          (t.sibling = null),
          (n = Le.current),
          be(Le, r ? (n & 1) | 2 : n & 1),
          t)
        : (ct(t), null);
    case 22:
    case 23:
      return (
        Sp(),
        (r = t.memoizedState !== null),
        e !== null && (e.memoizedState !== null) !== r && (t.flags |= 8192),
        r && t.mode & 1 ? Pt & 1073741824 && (ct(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : ct(t),
        null
      );
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(j(156, t.tag));
}
function QC(e, t) {
  switch ((tp(t), t.tag)) {
    case 1:
      return bt(t.type) && _l(), (e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null;
    case 3:
      return (
        ti(), Te(Ct), Te(pt), cp(), (e = t.flags), e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
      );
    case 5:
      return up(t), null;
    case 13:
      if ((Te(Le), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
        if (t.alternate === null) throw Error(j(340));
        Zo();
      }
      return (e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null;
    case 19:
      return Te(Le), null;
    case 4:
      return ti(), null;
    case 10:
      return ip(t.type._context), null;
    case 22:
    case 23:
      return Sp(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var Sa = !1,
  dt = !1,
  YC = typeof WeakSet == "function" ? WeakSet : Set,
  K = null;
function $o(e, t) {
  var n = e.ref;
  if (n !== null)
    if (typeof n == "function")
      try {
        n(null);
      } catch (r) {
        Ie(e, t, r);
      }
    else n.current = null;
}
function Uf(e, t, n) {
  try {
    n();
  } catch (r) {
    Ie(e, t, r);
  }
}
var jm = !1;
function XC(e, t) {
  if (((bf = El), (e = zv()), Zd(e))) {
    if ("selectionStart" in e) var n = { start: e.selectionStart, end: e.selectionEnd };
    else
      e: {
        n = ((n = e.ownerDocument) && n.defaultView) || window;
        var r = n.getSelection && n.getSelection();
        if (r && r.rangeCount !== 0) {
          n = r.anchorNode;
          var o = r.anchorOffset,
            i = r.focusNode;
          r = r.focusOffset;
          try {
            n.nodeType, i.nodeType;
          } catch (S) {
            n = null;
            break e;
          }
          var s = 0,
            a = -1,
            l = -1,
            u = 0,
            c = 0,
            f = e,
            d = null;
          t: for (;;) {
            for (
              var v;
              f !== n || (o !== 0 && f.nodeType !== 3) || (a = s + o),
                f !== i || (r !== 0 && f.nodeType !== 3) || (l = s + r),
                f.nodeType === 3 && (s += f.nodeValue.length),
                (v = f.firstChild) !== null;

            )
              (d = f), (f = v);
            for (;;) {
              if (f === e) break t;
              if ((d === n && ++u === o && (a = s), d === i && ++c === r && (l = s), (v = f.nextSibling) !== null))
                break;
              (f = d), (d = f.parentNode);
            }
            f = v;
          }
          n = a === -1 || l === -1 ? null : { start: a, end: l };
        } else n = null;
      }
    n = n || { start: 0, end: 0 };
  } else n = null;
  for (kf = { focusedElem: e, selectionRange: n }, El = !1, K = t; K !== null; )
    if (((t = K), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null)) (e.return = t), (K = e);
    else
      for (; K !== null; ) {
        t = K;
        try {
          var m = t.alternate;
          if (t.flags & 1024)
            switch (t.tag) {
              case 0:
              case 11:
              case 15:
                break;
              case 1:
                if (m !== null) {
                  var y = m.memoizedProps,
                    x = m.memoizedState,
                    p = t.stateNode,
                    g = p.getSnapshotBeforeUpdate(t.elementType === t.type ? y : nn(t.type, y), x);
                  p.__reactInternalSnapshotBeforeUpdate = g;
                }
                break;
              case 3:
                var w = t.stateNode.containerInfo;
                w.nodeType === 1
                  ? (w.textContent = "")
                  : w.nodeType === 9 && w.documentElement && w.removeChild(w.documentElement);
                break;
              case 5:
              case 6:
              case 4:
              case 17:
                break;
              default:
                throw Error(j(163));
            }
        } catch (S) {
          Ie(t, t.return, S);
        }
        if (((e = t.sibling), e !== null)) {
          (e.return = t.return), (K = e);
          break;
        }
        K = t.return;
      }
  return (m = jm), (jm = !1), m;
}
function rs(e, t, n) {
  var r = t.updateQueue;
  if (((r = r !== null ? r.lastEffect : null), r !== null)) {
    var o = (r = r.next);
    do {
      if ((o.tag & e) === e) {
        var i = o.destroy;
        (o.destroy = void 0), i !== void 0 && Uf(t, n, i);
      }
      o = o.next;
    } while (o !== r);
  }
}
function du(e, t) {
  if (((t = t.updateQueue), (t = t !== null ? t.lastEffect : null), t !== null)) {
    var n = (t = t.next);
    do {
      if ((n.tag & e) === e) {
        var r = n.create;
        n.destroy = r();
      }
      n = n.next;
    } while (n !== t);
  }
}
function Bf(e) {
  var t = e.ref;
  if (t !== null) {
    var n = e.stateNode;
    switch (e.tag) {
      case 5:
        e = n;
        break;
      default:
        e = n;
    }
    typeof t == "function" ? t(e) : (t.current = e);
  }
}
function j0(e) {
  var t = e.alternate;
  t !== null && ((e.alternate = null), j0(t)),
    (e.child = null),
    (e.deletions = null),
    (e.sibling = null),
    e.tag === 5 &&
      ((t = e.stateNode), t !== null && (delete t[wn], delete t[ws], delete t[Rf], delete t[LC], delete t[DC])),
    (e.stateNode = null),
    (e.return = null),
    (e.dependencies = null),
    (e.memoizedProps = null),
    (e.memoizedState = null),
    (e.pendingProps = null),
    (e.stateNode = null),
    (e.updateQueue = null);
}
function F0(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Fm(e) {
  e: for (;;) {
    for (; e.sibling === null; ) {
      if (e.return === null || F0(e.return)) return null;
      e = e.return;
    }
    for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
      if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
      (e.child.return = e), (e = e.child);
    }
    if (!(e.flags & 2)) return e.stateNode;
  }
}
function Vf(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6)
    (e = e.stateNode),
      t
        ? n.nodeType === 8
          ? n.parentNode.insertBefore(e, t)
          : n.insertBefore(e, t)
        : (n.nodeType === 8 ? ((t = n.parentNode), t.insertBefore(e, n)) : ((t = n), t.appendChild(e)),
          (n = n._reactRootContainer),
          n != null || t.onclick !== null || (t.onclick = kl));
  else if (r !== 4 && ((e = e.child), e !== null))
    for (Vf(e, t, n), e = e.sibling; e !== null; ) Vf(e, t, n), (e = e.sibling);
}
function Wf(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6) (e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e);
  else if (r !== 4 && ((e = e.child), e !== null))
    for (Wf(e, t, n), e = e.sibling; e !== null; ) Wf(e, t, n), (e = e.sibling);
}
var st = null,
  rn = !1;
function ir(e, t, n) {
  for (n = n.child; n !== null; ) I0(e, t, n), (n = n.sibling);
}
function I0(e, t, n) {
  if (Cn && typeof Cn.onCommitFiberUnmount == "function")
    try {
      Cn.onCommitFiberUnmount(ou, n);
    } catch (a) {}
  switch (n.tag) {
    case 5:
      dt || $o(n, t);
    case 6:
      var r = st,
        o = rn;
      (st = null),
        ir(e, t, n),
        (st = r),
        (rn = o),
        st !== null &&
          (rn
            ? ((e = st), (n = n.stateNode), e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n))
            : st.removeChild(n.stateNode));
      break;
    case 18:
      st !== null &&
        (rn
          ? ((e = st), (n = n.stateNode), e.nodeType === 8 ? hc(e.parentNode, n) : e.nodeType === 1 && hc(e, n), hs(e))
          : hc(st, n.stateNode));
      break;
    case 4:
      (r = st), (o = rn), (st = n.stateNode.containerInfo), (rn = !0), ir(e, t, n), (st = r), (rn = o);
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!dt && ((r = n.updateQueue), r !== null && ((r = r.lastEffect), r !== null))) {
        o = r = r.next;
        do {
          var i = o,
            s = i.destroy;
          (i = i.tag), s !== void 0 && (i & 2 || i & 4) && Uf(n, t, s), (o = o.next);
        } while (o !== r);
      }
      ir(e, t, n);
      break;
    case 1:
      if (!dt && ($o(n, t), (r = n.stateNode), typeof r.componentWillUnmount == "function"))
        try {
          (r.props = n.memoizedProps), (r.state = n.memoizedState), r.componentWillUnmount();
        } catch (a) {
          Ie(n, t, a);
        }
      ir(e, t, n);
      break;
    case 21:
      ir(e, t, n);
      break;
    case 22:
      n.mode & 1 ? ((dt = (r = dt) || n.memoizedState !== null), ir(e, t, n), (dt = r)) : ir(e, t, n);
      break;
    default:
      ir(e, t, n);
  }
}
function Im(e) {
  var t = e.updateQueue;
  if (t !== null) {
    e.updateQueue = null;
    var n = e.stateNode;
    n === null && (n = e.stateNode = new YC()),
      t.forEach(function (r) {
        var o = sb.bind(null, e, r);
        n.has(r) || (n.add(r), r.then(o, o));
      });
  }
}
function tn(e, t) {
  var n = t.deletions;
  if (n !== null)
    for (var r = 0; r < n.length; r++) {
      var o = n[r];
      try {
        var i = e,
          s = t,
          a = s;
        e: for (; a !== null; ) {
          switch (a.tag) {
            case 5:
              (st = a.stateNode), (rn = !1);
              break e;
            case 3:
              (st = a.stateNode.containerInfo), (rn = !0);
              break e;
            case 4:
              (st = a.stateNode.containerInfo), (rn = !0);
              break e;
          }
          a = a.return;
        }
        if (st === null) throw Error(j(160));
        I0(i, s, o), (st = null), (rn = !1);
        var l = o.alternate;
        l !== null && (l.return = null), (o.return = null);
      } catch (u) {
        Ie(o, t, u);
      }
    }
  if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) $0(t, e), (t = t.sibling);
}
function $0(e, t) {
  var n = e.alternate,
    r = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if ((tn(t, e), gn(e), r & 4)) {
        try {
          rs(3, e, e.return), du(3, e);
        } catch (y) {
          Ie(e, e.return, y);
        }
        try {
          rs(5, e, e.return);
        } catch (y) {
          Ie(e, e.return, y);
        }
      }
      break;
    case 1:
      tn(t, e), gn(e), r & 512 && n !== null && $o(n, n.return);
      break;
    case 5:
      if ((tn(t, e), gn(e), r & 512 && n !== null && $o(n, n.return), e.flags & 32)) {
        var o = e.stateNode;
        try {
          cs(o, "");
        } catch (y) {
          Ie(e, e.return, y);
        }
      }
      if (r & 4 && ((o = e.stateNode), o != null)) {
        var i = e.memoizedProps,
          s = n !== null ? n.memoizedProps : i,
          a = e.type,
          l = e.updateQueue;
        if (((e.updateQueue = null), l !== null))
          try {
            a === "input" && i.type === "radio" && i.name != null && av(o, i), hf(a, s);
            var u = hf(a, i);
            for (s = 0; s < l.length; s += 2) {
              var c = l[s],
                f = l[s + 1];
              c === "style"
                ? dv(o, f)
                : c === "dangerouslySetInnerHTML"
                ? cv(o, f)
                : c === "children"
                ? cs(o, f)
                : zd(o, c, f, u);
            }
            switch (a) {
              case "input":
                uf(o, i);
                break;
              case "textarea":
                lv(o, i);
                break;
              case "select":
                var d = o._wrapperState.wasMultiple;
                o._wrapperState.wasMultiple = !!i.multiple;
                var v = i.value;
                v != null
                  ? Vo(o, !!i.multiple, v, !1)
                  : d !== !!i.multiple &&
                    (i.defaultValue != null
                      ? Vo(o, !!i.multiple, i.defaultValue, !0)
                      : Vo(o, !!i.multiple, i.multiple ? [] : "", !1));
            }
            o[ws] = i;
          } catch (y) {
            Ie(e, e.return, y);
          }
      }
      break;
    case 6:
      if ((tn(t, e), gn(e), r & 4)) {
        if (e.stateNode === null) throw Error(j(162));
        (o = e.stateNode), (i = e.memoizedProps);
        try {
          o.nodeValue = i;
        } catch (y) {
          Ie(e, e.return, y);
        }
      }
      break;
    case 3:
      if ((tn(t, e), gn(e), r & 4 && n !== null && n.memoizedState.isDehydrated))
        try {
          hs(t.containerInfo);
        } catch (y) {
          Ie(e, e.return, y);
        }
      break;
    case 4:
      tn(t, e), gn(e);
      break;
    case 13:
      tn(t, e),
        gn(e),
        (o = e.child),
        o.flags & 8192 &&
          ((i = o.memoizedState !== null),
          (o.stateNode.isHidden = i),
          !i || (o.alternate !== null && o.alternate.memoizedState !== null) || (wp = Be())),
        r & 4 && Im(e);
      break;
    case 22:
      if (
        ((c = n !== null && n.memoizedState !== null),
        e.mode & 1 ? ((dt = (u = dt) || c), tn(t, e), (dt = u)) : tn(t, e),
        gn(e),
        r & 8192)
      ) {
        if (((u = e.memoizedState !== null), (e.stateNode.isHidden = u) && !c && e.mode & 1))
          for (K = e, c = e.child; c !== null; ) {
            for (f = K = c; K !== null; ) {
              switch (((d = K), (v = d.child), d.tag)) {
                case 0:
                case 11:
                case 14:
                case 15:
                  rs(4, d, d.return);
                  break;
                case 1:
                  $o(d, d.return);
                  var m = d.stateNode;
                  if (typeof m.componentWillUnmount == "function") {
                    (r = d), (n = d.return);
                    try {
                      (t = r), (m.props = t.memoizedProps), (m.state = t.memoizedState), m.componentWillUnmount();
                    } catch (y) {
                      Ie(r, n, y);
                    }
                  }
                  break;
                case 5:
                  $o(d, d.return);
                  break;
                case 22:
                  if (d.memoizedState !== null) {
                    zm(f);
                    continue;
                  }
              }
              v !== null ? ((v.return = d), (K = v)) : zm(f);
            }
            c = c.sibling;
          }
        e: for (c = null, f = e; ; ) {
          if (f.tag === 5) {
            if (c === null) {
              c = f;
              try {
                (o = f.stateNode),
                  u
                    ? ((i = o.style),
                      typeof i.setProperty == "function"
                        ? i.setProperty("display", "none", "important")
                        : (i.display = "none"))
                    : ((a = f.stateNode),
                      (l = f.memoizedProps.style),
                      (s = l != null && l.hasOwnProperty("display") ? l.display : null),
                      (a.style.display = fv("display", s)));
              } catch (y) {
                Ie(e, e.return, y);
              }
            }
          } else if (f.tag === 6) {
            if (c === null)
              try {
                f.stateNode.nodeValue = u ? "" : f.memoizedProps;
              } catch (y) {
                Ie(e, e.return, y);
              }
          } else if (((f.tag !== 22 && f.tag !== 23) || f.memoizedState === null || f === e) && f.child !== null) {
            (f.child.return = f), (f = f.child);
            continue;
          }
          if (f === e) break e;
          for (; f.sibling === null; ) {
            if (f.return === null || f.return === e) break e;
            c === f && (c = null), (f = f.return);
          }
          c === f && (c = null), (f.sibling.return = f.return), (f = f.sibling);
        }
      }
      break;
    case 19:
      tn(t, e), gn(e), r & 4 && Im(e);
      break;
    case 21:
      break;
    default:
      tn(t, e), gn(e);
  }
}
function gn(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      e: {
        for (var n = e.return; n !== null; ) {
          if (F0(n)) {
            var r = n;
            break e;
          }
          n = n.return;
        }
        throw Error(j(160));
      }
      switch (r.tag) {
        case 5:
          var o = r.stateNode;
          r.flags & 32 && (cs(o, ""), (r.flags &= -33));
          var i = Fm(e);
          Wf(e, i, o);
          break;
        case 3:
        case 4:
          var s = r.stateNode.containerInfo,
            a = Fm(e);
          Vf(e, a, s);
          break;
        default:
          throw Error(j(161));
      }
    } catch (l) {
      Ie(e, e.return, l);
    }
    e.flags &= -3;
  }
  t & 4096 && (e.flags &= -4097);
}
function JC(e, t, n) {
  (K = e), z0(e);
}
function z0(e, t, n) {
  for (var r = (e.mode & 1) !== 0; K !== null; ) {
    var o = K,
      i = o.child;
    if (o.tag === 22 && r) {
      var s = o.memoizedState !== null || Sa;
      if (!s) {
        var a = o.alternate,
          l = (a !== null && a.memoizedState !== null) || dt;
        a = Sa;
        var u = dt;
        if (((Sa = s), (dt = l) && !u))
          for (K = o; K !== null; )
            (s = K),
              (l = s.child),
              s.tag === 22 && s.memoizedState !== null ? Um(o) : l !== null ? ((l.return = s), (K = l)) : Um(o);
        for (; i !== null; ) (K = i), z0(i), (i = i.sibling);
        (K = o), (Sa = a), (dt = u);
      }
      $m(e);
    } else o.subtreeFlags & 8772 && i !== null ? ((i.return = o), (K = i)) : $m(e);
  }
}
function $m(e) {
  for (; K !== null; ) {
    var t = K;
    if (t.flags & 8772) {
      var n = t.alternate;
      try {
        if (t.flags & 8772)
          switch (t.tag) {
            case 0:
            case 11:
            case 15:
              dt || du(5, t);
              break;
            case 1:
              var r = t.stateNode;
              if (t.flags & 4 && !dt)
                if (n === null) r.componentDidMount();
                else {
                  var o = t.elementType === t.type ? n.memoizedProps : nn(t.type, n.memoizedProps);
                  r.componentDidUpdate(o, n.memoizedState, r.__reactInternalSnapshotBeforeUpdate);
                }
              var i = t.updateQueue;
              i !== null && Cm(t, i, r);
              break;
            case 3:
              var s = t.updateQueue;
              if (s !== null) {
                if (((n = null), t.child !== null))
                  switch (t.child.tag) {
                    case 5:
                      n = t.child.stateNode;
                      break;
                    case 1:
                      n = t.child.stateNode;
                  }
                Cm(t, s, n);
              }
              break;
            case 5:
              var a = t.stateNode;
              if (n === null && t.flags & 4) {
                n = a;
                var l = t.memoizedProps;
                switch (t.type) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    l.autoFocus && n.focus();
                    break;
                  case "img":
                    l.src && (n.src = l.src);
                }
              }
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              if (t.memoizedState === null) {
                var u = t.alternate;
                if (u !== null) {
                  var c = u.memoizedState;
                  if (c !== null) {
                    var f = c.dehydrated;
                    f !== null && hs(f);
                  }
                }
              }
              break;
            case 19:
            case 17:
            case 21:
            case 22:
            case 23:
            case 25:
              break;
            default:
              throw Error(j(163));
          }
        dt || (t.flags & 512 && Bf(t));
      } catch (d) {
        Ie(t, t.return, d);
      }
    }
    if (t === e) {
      K = null;
      break;
    }
    if (((n = t.sibling), n !== null)) {
      (n.return = t.return), (K = n);
      break;
    }
    K = t.return;
  }
}
function zm(e) {
  for (; K !== null; ) {
    var t = K;
    if (t === e) {
      K = null;
      break;
    }
    var n = t.sibling;
    if (n !== null) {
      (n.return = t.return), (K = n);
      break;
    }
    K = t.return;
  }
}
function Um(e) {
  for (; K !== null; ) {
    var t = K;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var n = t.return;
          try {
            du(4, t);
          } catch (l) {
            Ie(t, n, l);
          }
          break;
        case 1:
          var r = t.stateNode;
          if (typeof r.componentDidMount == "function") {
            var o = t.return;
            try {
              r.componentDidMount();
            } catch (l) {
              Ie(t, o, l);
            }
          }
          var i = t.return;
          try {
            Bf(t);
          } catch (l) {
            Ie(t, i, l);
          }
          break;
        case 5:
          var s = t.return;
          try {
            Bf(t);
          } catch (l) {
            Ie(t, s, l);
          }
      }
    } catch (l) {
      Ie(t, t.return, l);
    }
    if (t === e) {
      K = null;
      break;
    }
    var a = t.sibling;
    if (a !== null) {
      (a.return = t.return), (K = a);
      break;
    }
    K = t.return;
  }
}
var ZC = Math.ceil,
  jl = Zn.ReactCurrentDispatcher,
  yp = Zn.ReactCurrentOwner,
  Xt = Zn.ReactCurrentBatchConfig,
  pe = 0,
  rt = null,
  Qe = null,
  at = 0,
  Pt = 0,
  zo = jr(0),
  Ze = 0,
  ks = null,
  ao = 0,
  pu = 0,
  vp = 0,
  os = null,
  St = null,
  wp = 0,
  ri = 1 / 0,
  jn = null,
  Fl = !1,
  Hf = null,
  kr = null,
  Ea = !1,
  vr = null,
  Il = 0,
  is = 0,
  Kf = null,
  Za = -1,
  el = 0;
function vt() {
  return pe & 6 ? Be() : Za !== -1 ? Za : (Za = Be());
}
function _r(e) {
  return e.mode & 1
    ? pe & 2 && at !== 0
      ? at & -at
      : jC.transition !== null
      ? (el === 0 && (el = bv()), el)
      : ((e = we), e !== 0 || ((e = window.event), (e = e === void 0 ? 16 : Av(e.type))), e)
    : 1;
}
function fn(e, t, n, r) {
  if (50 < is) throw ((is = 0), (Kf = null), Error(j(185)));
  js(e, n, r),
    (!(pe & 2) || e !== rt) &&
      (e === rt && (!(pe & 2) && (pu |= n), Ze === 4 && mr(e, at)),
      kt(e, r),
      n === 1 && pe === 0 && !(t.mode & 1) && ((ri = Be() + 500), uu && Fr()));
}
function kt(e, t) {
  var n = e.callbackNode;
  jE(e, t);
  var r = Sl(e, e === rt ? at : 0);
  if (r === 0) n !== null && Yh(n), (e.callbackNode = null), (e.callbackPriority = 0);
  else if (((t = r & -r), e.callbackPriority !== t)) {
    if ((n != null && Yh(n), t === 1))
      e.tag === 0 ? MC(Bm.bind(null, e)) : Yv(Bm.bind(null, e)),
        AC(function () {
          !(pe & 6) && Fr();
        }),
        (n = null);
    else {
      switch (kv(r)) {
        case 1:
          n = Hd;
          break;
        case 4:
          n = Ev;
          break;
        case 16:
          n = xl;
          break;
        case 536870912:
          n = Cv;
          break;
        default:
          n = xl;
      }
      n = G0(n, U0.bind(null, e));
    }
    (e.callbackPriority = t), (e.callbackNode = n);
  }
}
function U0(e, t) {
  if (((Za = -1), (el = 0), pe & 6)) throw Error(j(327));
  var n = e.callbackNode;
  if (Go() && e.callbackNode !== n) return null;
  var r = Sl(e, e === rt ? at : 0);
  if (r === 0) return null;
  if (r & 30 || r & e.expiredLanes || t) t = $l(e, r);
  else {
    t = r;
    var o = pe;
    pe |= 2;
    var i = V0();
    (rt !== e || at !== t) && ((jn = null), (ri = Be() + 500), no(e, t));
    do
      try {
        nb();
        break;
      } catch (a) {
        B0(e, a);
      }
    while (!0);
    op(), (jl.current = i), (pe = o), Qe !== null ? (t = 0) : ((rt = null), (at = 0), (t = Ze));
  }
  if (t !== 0) {
    if ((t === 2 && ((o = wf(e)), o !== 0 && ((r = o), (t = qf(e, o)))), t === 1))
      throw ((n = ks), no(e, 0), mr(e, r), kt(e, Be()), n);
    if (t === 6) mr(e, r);
    else {
      if (
        ((o = e.current.alternate),
        !(r & 30) &&
          !eb(o) &&
          ((t = $l(e, r)), t === 2 && ((i = wf(e)), i !== 0 && ((r = i), (t = qf(e, i)))), t === 1))
      )
        throw ((n = ks), no(e, 0), mr(e, r), kt(e, Be()), n);
      switch (((e.finishedWork = o), (e.finishedLanes = r), t)) {
        case 0:
        case 1:
          throw Error(j(345));
        case 2:
          qr(e, St, jn);
          break;
        case 3:
          if ((mr(e, r), (r & 130023424) === r && ((t = wp + 500 - Be()), 10 < t))) {
            if (Sl(e, 0) !== 0) break;
            if (((o = e.suspendedLanes), (o & r) !== r)) {
              vt(), (e.pingedLanes |= e.suspendedLanes & o);
              break;
            }
            e.timeoutHandle = Tf(qr.bind(null, e, St, jn), t);
            break;
          }
          qr(e, St, jn);
          break;
        case 4:
          if ((mr(e, r), (r & 4194240) === r)) break;
          for (t = e.eventTimes, o = -1; 0 < r; ) {
            var s = 31 - cn(r);
            (i = 1 << s), (s = t[s]), s > o && (o = s), (r &= ~i);
          }
          if (
            ((r = o),
            (r = Be() - r),
            (r =
              (120 > r
                ? 120
                : 480 > r
                ? 480
                : 1080 > r
                ? 1080
                : 1920 > r
                ? 1920
                : 3e3 > r
                ? 3e3
                : 4320 > r
                ? 4320
                : 1960 * ZC(r / 1960)) - r),
            10 < r)
          ) {
            e.timeoutHandle = Tf(qr.bind(null, e, St, jn), r);
            break;
          }
          qr(e, St, jn);
          break;
        case 5:
          qr(e, St, jn);
          break;
        default:
          throw Error(j(329));
      }
    }
  }
  return kt(e, Be()), e.callbackNode === n ? U0.bind(null, e) : null;
}
function qf(e, t) {
  var n = os;
  return (
    e.current.memoizedState.isDehydrated && (no(e, t).flags |= 256),
    (e = $l(e, t)),
    e !== 2 && ((t = St), (St = n), t !== null && Gf(t)),
    e
  );
}
function Gf(e) {
  St === null ? (St = e) : St.push.apply(St, e);
}
function eb(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var n = t.updateQueue;
      if (n !== null && ((n = n.stores), n !== null))
        for (var r = 0; r < n.length; r++) {
          var o = n[r],
            i = o.getSnapshot;
          o = o.value;
          try {
            if (!dn(i(), o)) return !1;
          } catch (s) {
            return !1;
          }
        }
    }
    if (((n = t.child), t.subtreeFlags & 16384 && n !== null)) (n.return = t), (t = n);
    else {
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return !0;
        t = t.return;
      }
      (t.sibling.return = t.return), (t = t.sibling);
    }
  }
  return !0;
}
function mr(e, t) {
  for (t &= ~vp, t &= ~pu, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
    var n = 31 - cn(t),
      r = 1 << n;
    (e[n] = -1), (t &= ~r);
  }
}
function Bm(e) {
  if (pe & 6) throw Error(j(327));
  Go();
  var t = Sl(e, 0);
  if (!(t & 1)) return kt(e, Be()), null;
  var n = $l(e, t);
  if (e.tag !== 0 && n === 2) {
    var r = wf(e);
    r !== 0 && ((t = r), (n = qf(e, r)));
  }
  if (n === 1) throw ((n = ks), no(e, 0), mr(e, t), kt(e, Be()), n);
  if (n === 6) throw Error(j(345));
  return (e.finishedWork = e.current.alternate), (e.finishedLanes = t), qr(e, St, jn), kt(e, Be()), null;
}
function xp(e, t) {
  var n = pe;
  pe |= 1;
  try {
    return e(t);
  } finally {
    (pe = n), pe === 0 && ((ri = Be() + 500), uu && Fr());
  }
}
function lo(e) {
  vr !== null && vr.tag === 0 && !(pe & 6) && Go();
  var t = pe;
  pe |= 1;
  var n = Xt.transition,
    r = we;
  try {
    if (((Xt.transition = null), (we = 1), e)) return e();
  } finally {
    (we = r), (Xt.transition = n), (pe = t), !(pe & 6) && Fr();
  }
}
function Sp() {
  (Pt = zo.current), Te(zo);
}
function no(e, t) {
  (e.finishedWork = null), (e.finishedLanes = 0);
  var n = e.timeoutHandle;
  if ((n !== -1 && ((e.timeoutHandle = -1), OC(n)), Qe !== null))
    for (n = Qe.return; n !== null; ) {
      var r = n;
      switch ((tp(r), r.tag)) {
        case 1:
          (r = r.type.childContextTypes), r != null && _l();
          break;
        case 3:
          ti(), Te(Ct), Te(pt), cp();
          break;
        case 5:
          up(r);
          break;
        case 4:
          ti();
          break;
        case 13:
          Te(Le);
          break;
        case 19:
          Te(Le);
          break;
        case 10:
          ip(r.type._context);
          break;
        case 22:
        case 23:
          Sp();
      }
      n = n.return;
    }
  if (
    ((rt = e),
    (Qe = e = Tr(e.current, null)),
    (at = Pt = t),
    (Ze = 0),
    (ks = null),
    (vp = pu = ao = 0),
    (St = os = null),
    Xr !== null)
  ) {
    for (t = 0; t < Xr.length; t++)
      if (((n = Xr[t]), (r = n.interleaved), r !== null)) {
        n.interleaved = null;
        var o = r.next,
          i = n.pending;
        if (i !== null) {
          var s = i.next;
          (i.next = o), (r.next = s);
        }
        n.pending = r;
      }
    Xr = null;
  }
  return e;
}
function B0(e, t) {
  do {
    var n = Qe;
    try {
      if ((op(), (Ya.current = Ml), Dl)) {
        for (var r = Me.memoizedState; r !== null; ) {
          var o = r.queue;
          o !== null && (o.pending = null), (r = r.next);
        }
        Dl = !1;
      }
      if (
        ((so = 0), (nt = Je = Me = null), (ns = !1), (Es = 0), (yp.current = null), n === null || n.return === null)
      ) {
        (Ze = 1), (ks = t), (Qe = null);
        break;
      }
      e: {
        var i = e,
          s = n.return,
          a = n,
          l = t;
        if (((t = at), (a.flags |= 32768), l !== null && typeof l == "object" && typeof l.then == "function")) {
          var u = l,
            c = a,
            f = c.tag;
          if (!(c.mode & 1) && (f === 0 || f === 11 || f === 15)) {
            var d = c.alternate;
            d
              ? ((c.updateQueue = d.updateQueue), (c.memoizedState = d.memoizedState), (c.lanes = d.lanes))
              : ((c.updateQueue = null), (c.memoizedState = null));
          }
          var v = Pm(s);
          if (v !== null) {
            (v.flags &= -257), Om(v, s, a, i, t), v.mode & 1 && Rm(i, u, t), (t = v), (l = u);
            var m = t.updateQueue;
            if (m === null) {
              var y = new Set();
              y.add(l), (t.updateQueue = y);
            } else m.add(l);
            break e;
          } else {
            if (!(t & 1)) {
              Rm(i, u, t), Ep();
              break e;
            }
            l = Error(j(426));
          }
        } else if (Pe && a.mode & 1) {
          var x = Pm(s);
          if (x !== null) {
            !(x.flags & 65536) && (x.flags |= 256), Om(x, s, a, i, t), np(ni(l, a));
            break e;
          }
        }
        (i = l = ni(l, a)), Ze !== 4 && (Ze = 2), os === null ? (os = [i]) : os.push(i), (i = s);
        do {
          switch (i.tag) {
            case 3:
              (i.flags |= 65536), (t &= -t), (i.lanes |= t);
              var p = k0(i, l, t);
              Em(i, p);
              break e;
            case 1:
              a = l;
              var g = i.type,
                w = i.stateNode;
              if (
                !(i.flags & 128) &&
                (typeof g.getDerivedStateFromError == "function" ||
                  (w !== null && typeof w.componentDidCatch == "function" && (kr === null || !kr.has(w))))
              ) {
                (i.flags |= 65536), (t &= -t), (i.lanes |= t);
                var S = _0(i, a, t);
                Em(i, S);
                break e;
              }
          }
          i = i.return;
        } while (i !== null);
      }
      H0(n);
    } catch (C) {
      (t = C), Qe === n && n !== null && (Qe = n = n.return);
      continue;
    }
    break;
  } while (!0);
}
function V0() {
  var e = jl.current;
  return (jl.current = Ml), e === null ? Ml : e;
}
function Ep() {
  (Ze === 0 || Ze === 3 || Ze === 2) && (Ze = 4), rt === null || (!(ao & 268435455) && !(pu & 268435455)) || mr(rt, at);
}
function $l(e, t) {
  var n = pe;
  pe |= 2;
  var r = V0();
  (rt !== e || at !== t) && ((jn = null), no(e, t));
  do
    try {
      tb();
      break;
    } catch (o) {
      B0(e, o);
    }
  while (!0);
  if ((op(), (pe = n), (jl.current = r), Qe !== null)) throw Error(j(261));
  return (rt = null), (at = 0), Ze;
}
function tb() {
  for (; Qe !== null; ) W0(Qe);
}
function nb() {
  for (; Qe !== null && !TE(); ) W0(Qe);
}
function W0(e) {
  var t = q0(e.alternate, e, Pt);
  (e.memoizedProps = e.pendingProps), t === null ? H0(e) : (Qe = t), (yp.current = null);
}
function H0(e) {
  var t = e;
  do {
    var n = t.alternate;
    if (((e = t.return), t.flags & 32768)) {
      if (((n = QC(n, t)), n !== null)) {
        (n.flags &= 32767), (Qe = n);
        return;
      }
      if (e !== null) (e.flags |= 32768), (e.subtreeFlags = 0), (e.deletions = null);
      else {
        (Ze = 6), (Qe = null);
        return;
      }
    } else if (((n = GC(n, t, Pt)), n !== null)) {
      Qe = n;
      return;
    }
    if (((t = t.sibling), t !== null)) {
      Qe = t;
      return;
    }
    Qe = t = e;
  } while (t !== null);
  Ze === 0 && (Ze = 5);
}
function qr(e, t, n) {
  var r = we,
    o = Xt.transition;
  try {
    (Xt.transition = null), (we = 1), rb(e, t, n, r);
  } finally {
    (Xt.transition = o), (we = r);
  }
  return null;
}
function rb(e, t, n, r) {
  do Go();
  while (vr !== null);
  if (pe & 6) throw Error(j(327));
  n = e.finishedWork;
  var o = e.finishedLanes;
  if (n === null) return null;
  if (((e.finishedWork = null), (e.finishedLanes = 0), n === e.current)) throw Error(j(177));
  (e.callbackNode = null), (e.callbackPriority = 0);
  var i = n.lanes | n.childLanes;
  if (
    (FE(e, i),
    e === rt && ((Qe = rt = null), (at = 0)),
    (!(n.subtreeFlags & 2064) && !(n.flags & 2064)) ||
      Ea ||
      ((Ea = !0),
      G0(xl, function () {
        return Go(), null;
      })),
    (i = (n.flags & 15990) !== 0),
    n.subtreeFlags & 15990 || i)
  ) {
    (i = Xt.transition), (Xt.transition = null);
    var s = we;
    we = 1;
    var a = pe;
    (pe |= 4),
      (yp.current = null),
      XC(e, n),
      $0(n, e),
      CC(kf),
      (El = !!bf),
      (kf = bf = null),
      (e.current = n),
      JC(n),
      RE(),
      (pe = a),
      (we = s),
      (Xt.transition = i);
  } else e.current = n;
  if (
    (Ea && ((Ea = !1), (vr = e), (Il = o)),
    (i = e.pendingLanes),
    i === 0 && (kr = null),
    AE(n.stateNode),
    kt(e, Be()),
    t !== null)
  )
    for (r = e.onRecoverableError, n = 0; n < t.length; n++)
      (o = t[n]), r(o.value, { componentStack: o.stack, digest: o.digest });
  if (Fl) throw ((Fl = !1), (e = Hf), (Hf = null), e);
  return (
    Il & 1 && e.tag !== 0 && Go(),
    (i = e.pendingLanes),
    i & 1 ? (e === Kf ? is++ : ((is = 0), (Kf = e))) : (is = 0),
    Fr(),
    null
  );
}
function Go() {
  if (vr !== null) {
    var e = kv(Il),
      t = Xt.transition,
      n = we;
    try {
      if (((Xt.transition = null), (we = 16 > e ? 16 : e), vr === null)) var r = !1;
      else {
        if (((e = vr), (vr = null), (Il = 0), pe & 6)) throw Error(j(331));
        var o = pe;
        for (pe |= 4, K = e.current; K !== null; ) {
          var i = K,
            s = i.child;
          if (K.flags & 16) {
            var a = i.deletions;
            if (a !== null) {
              for (var l = 0; l < a.length; l++) {
                var u = a[l];
                for (K = u; K !== null; ) {
                  var c = K;
                  switch (c.tag) {
                    case 0:
                    case 11:
                    case 15:
                      rs(8, c, i);
                  }
                  var f = c.child;
                  if (f !== null) (f.return = c), (K = f);
                  else
                    for (; K !== null; ) {
                      c = K;
                      var d = c.sibling,
                        v = c.return;
                      if ((j0(c), c === u)) {
                        K = null;
                        break;
                      }
                      if (d !== null) {
                        (d.return = v), (K = d);
                        break;
                      }
                      K = v;
                    }
                }
              }
              var m = i.alternate;
              if (m !== null) {
                var y = m.child;
                if (y !== null) {
                  m.child = null;
                  do {
                    var x = y.sibling;
                    (y.sibling = null), (y = x);
                  } while (y !== null);
                }
              }
              K = i;
            }
          }
          if (i.subtreeFlags & 2064 && s !== null) (s.return = i), (K = s);
          else
            e: for (; K !== null; ) {
              if (((i = K), i.flags & 2048))
                switch (i.tag) {
                  case 0:
                  case 11:
                  case 15:
                    rs(9, i, i.return);
                }
              var p = i.sibling;
              if (p !== null) {
                (p.return = i.return), (K = p);
                break e;
              }
              K = i.return;
            }
        }
        var g = e.current;
        for (K = g; K !== null; ) {
          s = K;
          var w = s.child;
          if (s.subtreeFlags & 2064 && w !== null) (w.return = s), (K = w);
          else
            e: for (s = g; K !== null; ) {
              if (((a = K), a.flags & 2048))
                try {
                  switch (a.tag) {
                    case 0:
                    case 11:
                    case 15:
                      du(9, a);
                  }
                } catch (C) {
                  Ie(a, a.return, C);
                }
              if (a === s) {
                K = null;
                break e;
              }
              var S = a.sibling;
              if (S !== null) {
                (S.return = a.return), (K = S);
                break e;
              }
              K = a.return;
            }
        }
        if (((pe = o), Fr(), Cn && typeof Cn.onPostCommitFiberRoot == "function"))
          try {
            Cn.onPostCommitFiberRoot(ou, e);
          } catch (C) {}
        r = !0;
      }
      return r;
    } finally {
      (we = n), (Xt.transition = t);
    }
  }
  return !1;
}
function Vm(e, t, n) {
  (t = ni(n, t)), (t = k0(e, t, 1)), (e = br(e, t, 1)), (t = vt()), e !== null && (js(e, 1, t), kt(e, t));
}
function Ie(e, t, n) {
  if (e.tag === 3) Vm(e, e, n);
  else
    for (; t !== null; ) {
      if (t.tag === 3) {
        Vm(t, e, n);
        break;
      } else if (t.tag === 1) {
        var r = t.stateNode;
        if (
          typeof t.type.getDerivedStateFromError == "function" ||
          (typeof r.componentDidCatch == "function" && (kr === null || !kr.has(r)))
        ) {
          (e = ni(n, e)), (e = _0(t, e, 1)), (t = br(t, e, 1)), (e = vt()), t !== null && (js(t, 1, e), kt(t, e));
          break;
        }
      }
      t = t.return;
    }
}
function ob(e, t, n) {
  var r = e.pingCache;
  r !== null && r.delete(t),
    (t = vt()),
    (e.pingedLanes |= e.suspendedLanes & n),
    rt === e &&
      (at & n) === n &&
      (Ze === 4 || (Ze === 3 && (at & 130023424) === at && 500 > Be() - wp) ? no(e, 0) : (vp |= n)),
    kt(e, t);
}
function K0(e, t) {
  t === 0 && (e.mode & 1 ? ((t = da), (da <<= 1), !(da & 130023424) && (da = 4194304)) : (t = 1));
  var n = vt();
  (e = Kn(e, t)), e !== null && (js(e, t, n), kt(e, n));
}
function ib(e) {
  var t = e.memoizedState,
    n = 0;
  t !== null && (n = t.retryLane), K0(e, n);
}
function sb(e, t) {
  var n = 0;
  switch (e.tag) {
    case 13:
      var r = e.stateNode,
        o = e.memoizedState;
      o !== null && (n = o.retryLane);
      break;
    case 19:
      r = e.stateNode;
      break;
    default:
      throw Error(j(314));
  }
  r !== null && r.delete(t), K0(e, n);
}
var q0;
q0 = function (e, t, n) {
  if (e !== null)
    if (e.memoizedProps !== t.pendingProps || Ct.current) Et = !0;
    else {
      if (!(e.lanes & n) && !(t.flags & 128)) return (Et = !1), qC(e, t, n);
      Et = !!(e.flags & 131072);
    }
  else (Et = !1), Pe && t.flags & 1048576 && Xv(t, Pl, t.index);
  switch (((t.lanes = 0), t.tag)) {
    case 2:
      var r = t.type;
      Ja(e, t), (e = t.pendingProps);
      var o = Jo(t, pt.current);
      qo(t, n), (o = dp(null, t, r, e, o, n));
      var i = pp();
      return (
        (t.flags |= 1),
        typeof o == "object" && o !== null && typeof o.render == "function" && o.$$typeof === void 0
          ? ((t.tag = 1),
            (t.memoizedState = null),
            (t.updateQueue = null),
            bt(r) ? ((i = !0), Tl(t)) : (i = !1),
            (t.memoizedState = o.state !== null && o.state !== void 0 ? o.state : null),
            ap(t),
            (o.updater = fu),
            (t.stateNode = o),
            (o._reactInternals = t),
            Df(t, r, e, n),
            (t = Ff(null, t, r, !0, i, n)))
          : ((t.tag = 0), Pe && i && ep(t), gt(null, t, o, n), (t = t.child)),
        t
      );
    case 16:
      r = t.elementType;
      e: {
        switch (
          (Ja(e, t),
          (e = t.pendingProps),
          (o = r._init),
          (r = o(r._payload)),
          (t.type = r),
          (o = t.tag = lb(r)),
          (e = nn(r, e)),
          o)
        ) {
          case 0:
            t = jf(null, t, r, e, n);
            break e;
          case 1:
            t = Lm(null, t, r, e, n);
            break e;
          case 11:
            t = Am(null, t, r, e, n);
            break e;
          case 14:
            t = Nm(null, t, r, nn(r.type, e), n);
            break e;
        }
        throw Error(j(306, r, ""));
      }
      return t;
    case 0:
      return (r = t.type), (o = t.pendingProps), (o = t.elementType === r ? o : nn(r, o)), jf(e, t, r, o, n);
    case 1:
      return (r = t.type), (o = t.pendingProps), (o = t.elementType === r ? o : nn(r, o)), Lm(e, t, r, o, n);
    case 3:
      e: {
        if ((O0(t), e === null)) throw Error(j(387));
        (r = t.pendingProps), (i = t.memoizedState), (o = i.element), r0(e, t), Nl(t, r, null, n);
        var s = t.memoizedState;
        if (((r = s.element), i.isDehydrated))
          if (
            ((i = {
              element: r,
              isDehydrated: !1,
              cache: s.cache,
              pendingSuspenseBoundaries: s.pendingSuspenseBoundaries,
              transitions: s.transitions,
            }),
            (t.updateQueue.baseState = i),
            (t.memoizedState = i),
            t.flags & 256)
          ) {
            (o = ni(Error(j(423)), t)), (t = Dm(e, t, r, n, o));
            break e;
          } else if (r !== o) {
            (o = ni(Error(j(424)), t)), (t = Dm(e, t, r, n, o));
            break e;
          } else
            for (
              Nt = Cr(t.stateNode.containerInfo.firstChild),
                Dt = t,
                Pe = !0,
                an = null,
                n = t0(t, null, r, n),
                t.child = n;
              n;

            )
              (n.flags = (n.flags & -3) | 4096), (n = n.sibling);
        else {
          if ((Zo(), r === o)) {
            t = qn(e, t, n);
            break e;
          }
          gt(e, t, r, n);
        }
        t = t.child;
      }
      return t;
    case 5:
      return (
        o0(t),
        e === null && Af(t),
        (r = t.type),
        (o = t.pendingProps),
        (i = e !== null ? e.memoizedProps : null),
        (s = o.children),
        _f(r, o) ? (s = null) : i !== null && _f(r, i) && (t.flags |= 32),
        P0(e, t),
        gt(e, t, s, n),
        t.child
      );
    case 6:
      return e === null && Af(t), null;
    case 13:
      return A0(e, t, n);
    case 4:
      return (
        lp(t, t.stateNode.containerInfo),
        (r = t.pendingProps),
        e === null ? (t.child = ei(t, null, r, n)) : gt(e, t, r, n),
        t.child
      );
    case 11:
      return (r = t.type), (o = t.pendingProps), (o = t.elementType === r ? o : nn(r, o)), Am(e, t, r, o, n);
    case 7:
      return gt(e, t, t.pendingProps, n), t.child;
    case 8:
      return gt(e, t, t.pendingProps.children, n), t.child;
    case 12:
      return gt(e, t, t.pendingProps.children, n), t.child;
    case 10:
      e: {
        if (
          ((r = t.type._context),
          (o = t.pendingProps),
          (i = t.memoizedProps),
          (s = o.value),
          be(Ol, r._currentValue),
          (r._currentValue = s),
          i !== null)
        )
          if (dn(i.value, s)) {
            if (i.children === o.children && !Ct.current) {
              t = qn(e, t, n);
              break e;
            }
          } else
            for (i = t.child, i !== null && (i.return = t); i !== null; ) {
              var a = i.dependencies;
              if (a !== null) {
                s = i.child;
                for (var l = a.firstContext; l !== null; ) {
                  if (l.context === r) {
                    if (i.tag === 1) {
                      (l = Un(-1, n & -n)), (l.tag = 2);
                      var u = i.updateQueue;
                      if (u !== null) {
                        u = u.shared;
                        var c = u.pending;
                        c === null ? (l.next = l) : ((l.next = c.next), (c.next = l)), (u.pending = l);
                      }
                    }
                    (i.lanes |= n), (l = i.alternate), l !== null && (l.lanes |= n), Nf(i.return, n, t), (a.lanes |= n);
                    break;
                  }
                  l = l.next;
                }
              } else if (i.tag === 10) s = i.type === t.type ? null : i.child;
              else if (i.tag === 18) {
                if (((s = i.return), s === null)) throw Error(j(341));
                (s.lanes |= n), (a = s.alternate), a !== null && (a.lanes |= n), Nf(s, n, t), (s = i.sibling);
              } else s = i.child;
              if (s !== null) s.return = i;
              else
                for (s = i; s !== null; ) {
                  if (s === t) {
                    s = null;
                    break;
                  }
                  if (((i = s.sibling), i !== null)) {
                    (i.return = s.return), (s = i);
                    break;
                  }
                  s = s.return;
                }
              i = s;
            }
        gt(e, t, o.children, n), (t = t.child);
      }
      return t;
    case 9:
      return (
        (o = t.type),
        (r = t.pendingProps.children),
        qo(t, n),
        (o = Zt(o)),
        (r = r(o)),
        (t.flags |= 1),
        gt(e, t, r, n),
        t.child
      );
    case 14:
      return (r = t.type), (o = nn(r, t.pendingProps)), (o = nn(r.type, o)), Nm(e, t, r, o, n);
    case 15:
      return T0(e, t, t.type, t.pendingProps, n);
    case 17:
      return (
        (r = t.type),
        (o = t.pendingProps),
        (o = t.elementType === r ? o : nn(r, o)),
        Ja(e, t),
        (t.tag = 1),
        bt(r) ? ((e = !0), Tl(t)) : (e = !1),
        qo(t, n),
        b0(t, r, o),
        Df(t, r, o, n),
        Ff(null, t, r, !0, e, n)
      );
    case 19:
      return N0(e, t, n);
    case 22:
      return R0(e, t, n);
  }
  throw Error(j(156, t.tag));
};
function G0(e, t) {
  return Sv(e, t);
}
function ab(e, t, n, r) {
  (this.tag = e),
    (this.key = n),
    (this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null),
    (this.index = 0),
    (this.ref = null),
    (this.pendingProps = t),
    (this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null),
    (this.mode = r),
    (this.subtreeFlags = this.flags = 0),
    (this.deletions = null),
    (this.childLanes = this.lanes = 0),
    (this.alternate = null);
}
function Yt(e, t, n, r) {
  return new ab(e, t, n, r);
}
function Cp(e) {
  return (e = e.prototype), !(!e || !e.isReactComponent);
}
function lb(e) {
  if (typeof e == "function") return Cp(e) ? 1 : 0;
  if (e != null) {
    if (((e = e.$$typeof), e === Bd)) return 11;
    if (e === Vd) return 14;
  }
  return 2;
}
function Tr(e, t) {
  var n = e.alternate;
  return (
    n === null
      ? ((n = Yt(e.tag, t, e.key, e.mode)),
        (n.elementType = e.elementType),
        (n.type = e.type),
        (n.stateNode = e.stateNode),
        (n.alternate = e),
        (e.alternate = n))
      : ((n.pendingProps = t), (n.type = e.type), (n.flags = 0), (n.subtreeFlags = 0), (n.deletions = null)),
    (n.flags = e.flags & 14680064),
    (n.childLanes = e.childLanes),
    (n.lanes = e.lanes),
    (n.child = e.child),
    (n.memoizedProps = e.memoizedProps),
    (n.memoizedState = e.memoizedState),
    (n.updateQueue = e.updateQueue),
    (t = e.dependencies),
    (n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
    (n.sibling = e.sibling),
    (n.index = e.index),
    (n.ref = e.ref),
    n
  );
}
function tl(e, t, n, r, o, i) {
  var s = 2;
  if (((r = e), typeof e == "function")) Cp(e) && (s = 1);
  else if (typeof e == "string") s = 5;
  else
    e: switch (e) {
      case Oo:
        return ro(n.children, o, i, t);
      case Ud:
        (s = 8), (o |= 8);
        break;
      case rf:
        return (e = Yt(12, n, t, o | 2)), (e.elementType = rf), (e.lanes = i), e;
      case of:
        return (e = Yt(13, n, t, o)), (e.elementType = of), (e.lanes = i), e;
      case sf:
        return (e = Yt(19, n, t, o)), (e.elementType = sf), (e.lanes = i), e;
      case ov:
        return hu(n, o, i, t);
      default:
        if (typeof e == "object" && e !== null)
          switch (e.$$typeof) {
            case nv:
              s = 10;
              break e;
            case rv:
              s = 9;
              break e;
            case Bd:
              s = 11;
              break e;
            case Vd:
              s = 14;
              break e;
            case dr:
              (s = 16), (r = null);
              break e;
          }
        throw Error(j(130, e == null ? e : typeof e, ""));
    }
  return (t = Yt(s, n, t, o)), (t.elementType = e), (t.type = r), (t.lanes = i), t;
}
function ro(e, t, n, r) {
  return (e = Yt(7, e, r, t)), (e.lanes = n), e;
}
function hu(e, t, n, r) {
  return (e = Yt(22, e, r, t)), (e.elementType = ov), (e.lanes = n), (e.stateNode = { isHidden: !1 }), e;
}
function Ec(e, t, n) {
  return (e = Yt(6, e, null, t)), (e.lanes = n), e;
}
function Cc(e, t, n) {
  return (
    (t = Yt(4, e.children !== null ? e.children : [], e.key, t)),
    (t.lanes = n),
    (t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }),
    t
  );
}
function ub(e, t, n, r, o) {
  (this.tag = t),
    (this.containerInfo = e),
    (this.finishedWork = this.pingCache = this.current = this.pendingChildren = null),
    (this.timeoutHandle = -1),
    (this.callbackNode = this.pendingContext = this.context = null),
    (this.callbackPriority = 0),
    (this.eventTimes = rc(0)),
    (this.expirationTimes = rc(-1)),
    (this.entangledLanes =
      this.finishedLanes =
      this.mutableReadLanes =
      this.expiredLanes =
      this.pingedLanes =
      this.suspendedLanes =
      this.pendingLanes =
        0),
    (this.entanglements = rc(0)),
    (this.identifierPrefix = r),
    (this.onRecoverableError = o),
    (this.mutableSourceEagerHydrationData = null);
}
function bp(e, t, n, r, o, i, s, a, l) {
  return (
    (e = new ub(e, t, n, a, l)),
    t === 1 ? ((t = 1), i === !0 && (t |= 8)) : (t = 0),
    (i = Yt(3, null, null, t)),
    (e.current = i),
    (i.stateNode = e),
    (i.memoizedState = {
      element: r,
      isDehydrated: n,
      cache: null,
      transitions: null,
      pendingSuspenseBoundaries: null,
    }),
    ap(i),
    e
  );
}
function cb(e, t, n) {
  var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return { $$typeof: Po, key: r == null ? null : "" + r, children: e, containerInfo: t, implementation: n };
}
function Q0(e) {
  if (!e) return Pr;
  e = e._reactInternals;
  e: {
    if (mo(e) !== e || e.tag !== 1) throw Error(j(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if (bt(t.type)) {
            t = t.stateNode.__reactInternalMemoizedMergedChildContext;
            break e;
          }
      }
      t = t.return;
    } while (t !== null);
    throw Error(j(171));
  }
  if (e.tag === 1) {
    var n = e.type;
    if (bt(n)) return Qv(e, n, t);
  }
  return t;
}
function Y0(e, t, n, r, o, i, s, a, l) {
  return (
    (e = bp(n, r, !0, e, o, i, s, a, l)),
    (e.context = Q0(null)),
    (n = e.current),
    (r = vt()),
    (o = _r(n)),
    (i = Un(r, o)),
    (i.callback = t != null ? t : null),
    br(n, i, o),
    (e.current.lanes = o),
    js(e, o, r),
    kt(e, r),
    e
  );
}
function mu(e, t, n, r) {
  var o = t.current,
    i = vt(),
    s = _r(o);
  return (
    (n = Q0(n)),
    t.context === null ? (t.context = n) : (t.pendingContext = n),
    (t = Un(i, s)),
    (t.payload = { element: e }),
    (r = r === void 0 ? null : r),
    r !== null && (t.callback = r),
    (e = br(o, t, s)),
    e !== null && (fn(e, o, s, i), Qa(e, o, s)),
    s
  );
}
function zl(e) {
  if (((e = e.current), !e.child)) return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function Wm(e, t) {
  if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
    var n = e.retryLane;
    e.retryLane = n !== 0 && n < t ? n : t;
  }
}
function kp(e, t) {
  Wm(e, t), (e = e.alternate) && Wm(e, t);
}
function fb() {
  return null;
}
var X0 =
  typeof reportError == "function"
    ? reportError
    : function (e) {
        console.error(e);
      };
function _p(e) {
  this._internalRoot = e;
}
gu.prototype.render = _p.prototype.render = function (e) {
  var t = this._internalRoot;
  if (t === null) throw Error(j(409));
  mu(e, t, null, null);
};
gu.prototype.unmount = _p.prototype.unmount = function () {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    lo(function () {
      mu(null, e, null, null);
    }),
      (t[Hn] = null);
  }
};
function gu(e) {
  this._internalRoot = e;
}
gu.prototype.unstable_scheduleHydration = function (e) {
  if (e) {
    var t = Rv();
    e = { blockedOn: null, target: e, priority: t };
    for (var n = 0; n < hr.length && t !== 0 && t < hr[n].priority; n++);
    hr.splice(n, 0, e), n === 0 && Ov(e);
  }
};
function Tp(e) {
  return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
}
function yu(e) {
  return !(
    !e ||
    (e.nodeType !== 1 &&
      e.nodeType !== 9 &&
      e.nodeType !== 11 &&
      (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "))
  );
}
function Hm() {}
function db(e, t, n, r, o) {
  if (o) {
    if (typeof r == "function") {
      var i = r;
      r = function () {
        var u = zl(s);
        i.call(u);
      };
    }
    var s = Y0(t, r, e, 0, null, !1, !1, "", Hm);
    return (e._reactRootContainer = s), (e[Hn] = s.current), ys(e.nodeType === 8 ? e.parentNode : e), lo(), s;
  }
  for (; (o = e.lastChild); ) e.removeChild(o);
  if (typeof r == "function") {
    var a = r;
    r = function () {
      var u = zl(l);
      a.call(u);
    };
  }
  var l = bp(e, 0, !1, null, null, !1, !1, "", Hm);
  return (
    (e._reactRootContainer = l),
    (e[Hn] = l.current),
    ys(e.nodeType === 8 ? e.parentNode : e),
    lo(function () {
      mu(t, l, n, r);
    }),
    l
  );
}
function vu(e, t, n, r, o) {
  var i = n._reactRootContainer;
  if (i) {
    var s = i;
    if (typeof o == "function") {
      var a = o;
      o = function () {
        var l = zl(s);
        a.call(l);
      };
    }
    mu(t, s, e, o);
  } else s = db(n, t, e, o, r);
  return zl(s);
}
_v = function (e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var n = Ki(t.pendingLanes);
        n !== 0 && (Kd(t, n | 1), kt(t, Be()), !(pe & 6) && ((ri = Be() + 500), Fr()));
      }
      break;
    case 13:
      lo(function () {
        var r = Kn(e, 1);
        if (r !== null) {
          var o = vt();
          fn(r, e, 1, o);
        }
      }),
        kp(e, 1);
  }
};
qd = function (e) {
  if (e.tag === 13) {
    var t = Kn(e, 134217728);
    if (t !== null) {
      var n = vt();
      fn(t, e, 134217728, n);
    }
    kp(e, 134217728);
  }
};
Tv = function (e) {
  if (e.tag === 13) {
    var t = _r(e),
      n = Kn(e, t);
    if (n !== null) {
      var r = vt();
      fn(n, e, t, r);
    }
    kp(e, t);
  }
};
Rv = function () {
  return we;
};
Pv = function (e, t) {
  var n = we;
  try {
    return (we = e), t();
  } finally {
    we = n;
  }
};
gf = function (e, t, n) {
  switch (t) {
    case "input":
      if ((uf(e, n), (t = n.name), n.type === "radio" && t != null)) {
        for (n = e; n.parentNode; ) n = n.parentNode;
        for (
          n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0;
          t < n.length;
          t++
        ) {
          var r = n[t];
          if (r !== e && r.form === e.form) {
            var o = lu(r);
            if (!o) throw Error(j(90));
            sv(r), uf(r, o);
          }
        }
      }
      break;
    case "textarea":
      lv(e, n);
      break;
    case "select":
      (t = n.value), t != null && Vo(e, !!n.multiple, t, !1);
  }
};
mv = xp;
gv = lo;
var pb = { usingClientEntryPoint: !1, Events: [Is, Do, lu, pv, hv, xp] },
  Li = { findFiberByHostInstance: Yr, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" },
  hb = {
    bundleType: Li.bundleType,
    version: Li.version,
    rendererPackageName: Li.rendererPackageName,
    rendererConfig: Li.rendererConfig,
    overrideHookState: null,
    overrideHookStateDeletePath: null,
    overrideHookStateRenamePath: null,
    overrideProps: null,
    overridePropsDeletePath: null,
    overridePropsRenamePath: null,
    setErrorHandler: null,
    setSuspenseHandler: null,
    scheduleUpdate: null,
    currentDispatcherRef: Zn.ReactCurrentDispatcher,
    findHostInstanceByFiber: function (e) {
      return (e = wv(e)), e === null ? null : e.stateNode;
    },
    findFiberByHostInstance: Li.findFiberByHostInstance || fb,
    findHostInstancesForRefresh: null,
    scheduleRefresh: null,
    scheduleRoot: null,
    setRefreshHandler: null,
    getCurrentFiber: null,
    reconcilerVersion: "18.3.1-next-f1338f8080-20240426",
  };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ != "undefined") {
  var Ca = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!Ca.isDisabled && Ca.supportsFiber)
    try {
      (ou = Ca.inject(hb)), (Cn = Ca);
    } catch (e) {}
}
zt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = pb;
zt.createPortal = function (e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!Tp(t)) throw Error(j(200));
  return cb(e, t, null, n);
};
zt.createRoot = function (e, t) {
  if (!Tp(e)) throw Error(j(299));
  var n = !1,
    r = "",
    o = X0;
  return (
    t != null &&
      (t.unstable_strictMode === !0 && (n = !0),
      t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
      t.onRecoverableError !== void 0 && (o = t.onRecoverableError)),
    (t = bp(e, 1, !1, null, null, n, !1, r, o)),
    (e[Hn] = t.current),
    ys(e.nodeType === 8 ? e.parentNode : e),
    new _p(t)
  );
};
zt.findDOMNode = function (e) {
  if (e == null) return null;
  if (e.nodeType === 1) return e;
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == "function" ? Error(j(188)) : ((e = Object.keys(e).join(",")), Error(j(268, e)));
  return (e = wv(t)), (e = e === null ? null : e.stateNode), e;
};
zt.flushSync = function (e) {
  return lo(e);
};
zt.hydrate = function (e, t, n) {
  if (!yu(t)) throw Error(j(200));
  return vu(null, e, t, !0, n);
};
zt.hydrateRoot = function (e, t, n) {
  if (!Tp(e)) throw Error(j(405));
  var r = (n != null && n.hydratedSources) || null,
    o = !1,
    i = "",
    s = X0;
  if (
    (n != null &&
      (n.unstable_strictMode === !0 && (o = !0),
      n.identifierPrefix !== void 0 && (i = n.identifierPrefix),
      n.onRecoverableError !== void 0 && (s = n.onRecoverableError)),
    (t = Y0(t, null, e, 1, n != null ? n : null, o, !1, i, s)),
    (e[Hn] = t.current),
    ys(e),
    r)
  )
    for (e = 0; e < r.length; e++)
      (n = r[e]),
        (o = n._getVersion),
        (o = o(n._source)),
        t.mutableSourceEagerHydrationData == null
          ? (t.mutableSourceEagerHydrationData = [n, o])
          : t.mutableSourceEagerHydrationData.push(n, o);
  return new gu(t);
};
zt.render = function (e, t, n) {
  if (!yu(t)) throw Error(j(200));
  return vu(null, e, t, !1, n);
};
zt.unmountComponentAtNode = function (e) {
  if (!yu(e)) throw Error(j(40));
  return e._reactRootContainer
    ? (lo(function () {
        vu(null, null, e, !1, function () {
          (e._reactRootContainer = null), (e[Hn] = null);
        });
      }),
      !0)
    : !1;
};
zt.unstable_batchedUpdates = xp;
zt.unstable_renderSubtreeIntoContainer = function (e, t, n, r) {
  if (!yu(n)) throw Error(j(200));
  if (e == null || e._reactInternals === void 0) throw Error(j(38));
  return vu(e, t, n, !1, r);
};
zt.version = "18.3.1-next-f1338f8080-20240426";
function J0() {
  if (
    !(
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ == "undefined" ||
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"
    )
  )
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(J0);
    } catch (e) {
      console.error(e);
    }
}
J0(), (Jy.exports = zt);
var go = Jy.exports;
const Z0 = zy(go),
  mb = $y({ __proto__: null, default: Z0 }, [go]);
var Km = go;
(tf.createRoot = Km.createRoot), (tf.hydrateRoot = Km.hydrateRoot);
function ew(e) {
  var t,
    n,
    r = "";
  if (typeof e == "string" || typeof e == "number") r += e;
  else if (typeof e == "object")
    if (Array.isArray(e)) {
      var o = e.length;
      for (t = 0; t < o; t++) e[t] && (n = ew(e[t])) && (r && (r += " "), (r += n));
    } else for (n in e) e[n] && (r && (r += " "), (r += n));
  return r;
}
function gb() {
  for (var e, t, n = 0, r = "", o = arguments.length; n < o; n++)
    (e = arguments[n]) && (t = ew(e)) && (r && (r += " "), (r += t));
  return r;
}
const Rp = "-";
function yb(e) {
  const t = wb(e),
    { conflictingClassGroups: n, conflictingClassGroupModifiers: r } = e;
  function o(s) {
    const a = s.split(Rp);
    return a[0] === "" && a.length !== 1 && a.shift(), tw(a, t) || vb(s);
  }
  function i(s, a) {
    const l = n[s] || [];
    return a && r[s] ? [...l, ...r[s]] : l;
  }
  return { getClassGroupId: o, getConflictingClassGroupIds: i };
}
function tw(e, t) {
  var s;
  if (e.length === 0) return t.classGroupId;
  const n = e[0],
    r = t.nextPart.get(n),
    o = r ? tw(e.slice(1), r) : void 0;
  if (o) return o;
  if (t.validators.length === 0) return;
  const i = e.join(Rp);
  return (s = t.validators.find(({ validator: a }) => a(i))) == null ? void 0 : s.classGroupId;
}
const qm = /^\[(.+)\]$/;
function vb(e) {
  if (qm.test(e)) {
    const t = qm.exec(e)[1],
      n = t == null ? void 0 : t.substring(0, t.indexOf(":"));
    if (n) return "arbitrary.." + n;
  }
}
function wb(e) {
  const { theme: t, prefix: n } = e,
    r = { nextPart: new Map(), validators: [] };
  return (
    Sb(Object.entries(e.classGroups), n).forEach(([i, s]) => {
      Qf(s, r, i, t);
    }),
    r
  );
}
function Qf(e, t, n, r) {
  e.forEach((o) => {
    if (typeof o == "string") {
      const i = o === "" ? t : Gm(t, o);
      i.classGroupId = n;
      return;
    }
    if (typeof o == "function") {
      if (xb(o)) {
        Qf(o(r), t, n, r);
        return;
      }
      t.validators.push({ validator: o, classGroupId: n });
      return;
    }
    Object.entries(o).forEach(([i, s]) => {
      Qf(s, Gm(t, i), n, r);
    });
  });
}
function Gm(e, t) {
  let n = e;
  return (
    t.split(Rp).forEach((r) => {
      n.nextPart.has(r) || n.nextPart.set(r, { nextPart: new Map(), validators: [] }), (n = n.nextPart.get(r));
    }),
    n
  );
}
function xb(e) {
  return e.isThemeGetter;
}
function Sb(e, t) {
  return t
    ? e.map(([n, r]) => {
        const o = r.map((i) =>
          typeof i == "string"
            ? t + i
            : typeof i == "object"
            ? Object.fromEntries(Object.entries(i).map(([s, a]) => [t + s, a]))
            : i
        );
        return [n, o];
      })
    : e;
}
function Eb(e) {
  if (e < 1) return { get: () => {}, set: () => {} };
  let t = 0,
    n = new Map(),
    r = new Map();
  function o(i, s) {
    n.set(i, s), t++, t > e && ((t = 0), (r = n), (n = new Map()));
  }
  return {
    get(i) {
      let s = n.get(i);
      if (s !== void 0) return s;
      if ((s = r.get(i)) !== void 0) return o(i, s), s;
    },
    set(i, s) {
      n.has(i) ? n.set(i, s) : o(i, s);
    },
  };
}
const nw = "!";
function Cb(e) {
  const { separator: t, experimentalParseClassName: n } = e,
    r = t.length === 1,
    o = t[0],
    i = t.length;
  function s(a) {
    const l = [];
    let u = 0,
      c = 0,
      f;
    for (let x = 0; x < a.length; x++) {
      let p = a[x];
      if (u === 0) {
        if (p === o && (r || a.slice(x, x + i) === t)) {
          l.push(a.slice(c, x)), (c = x + i);
          continue;
        }
        if (p === "/") {
          f = x;
          continue;
        }
      }
      p === "[" ? u++ : p === "]" && u--;
    }
    const d = l.length === 0 ? a : a.substring(c),
      v = d.startsWith(nw),
      m = v ? d.substring(1) : d,
      y = f && f > c ? f - c : void 0;
    return { modifiers: l, hasImportantModifier: v, baseClassName: m, maybePostfixModifierPosition: y };
  }
  return n
    ? function (l) {
        return n({ className: l, parseClassName: s });
      }
    : s;
}
function bb(e) {
  if (e.length <= 1) return e;
  const t = [];
  let n = [];
  return (
    e.forEach((r) => {
      r[0] === "[" ? (t.push(...n.sort(), r), (n = [])) : n.push(r);
    }),
    t.push(...n.sort()),
    t
  );
}
function kb(e) {
  return T({ cache: Eb(e.cacheSize), parseClassName: Cb(e) }, yb(e));
}
const _b = /\s+/;
function Tb(e, t) {
  const { parseClassName: n, getClassGroupId: r, getConflictingClassGroupIds: o } = t,
    i = new Set();
  return e
    .trim()
    .split(_b)
    .map((s) => {
      const { modifiers: a, hasImportantModifier: l, baseClassName: u, maybePostfixModifierPosition: c } = n(s);
      let f = !!c,
        d = r(f ? u.substring(0, c) : u);
      if (!d) {
        if (!f) return { isTailwindClass: !1, originalClassName: s };
        if (((d = r(u)), !d)) return { isTailwindClass: !1, originalClassName: s };
        f = !1;
      }
      const v = bb(a).join(":");
      return {
        isTailwindClass: !0,
        modifierId: l ? v + nw : v,
        classGroupId: d,
        originalClassName: s,
        hasPostfixModifier: f,
      };
    })
    .reverse()
    .filter((s) => {
      if (!s.isTailwindClass) return !0;
      const { modifierId: a, classGroupId: l, hasPostfixModifier: u } = s,
        c = a + l;
      return i.has(c) ? !1 : (i.add(c), o(l, u).forEach((f) => i.add(a + f)), !0);
    })
    .reverse()
    .map((s) => s.originalClassName)
    .join(" ");
}
function Rb() {
  let e = 0,
    t,
    n,
    r = "";
  for (; e < arguments.length; ) (t = arguments[e++]) && (n = rw(t)) && (r && (r += " "), (r += n));
  return r;
}
function rw(e) {
  if (typeof e == "string") return e;
  let t,
    n = "";
  for (let r = 0; r < e.length; r++) e[r] && (t = rw(e[r])) && (n && (n += " "), (n += t));
  return n;
}
function Pb(e, ...t) {
  let n,
    r,
    o,
    i = s;
  function s(l) {
    const u = t.reduce((c, f) => f(c), e());
    return (n = kb(u)), (r = n.cache.get), (o = n.cache.set), (i = a), a(l);
  }
  function a(l) {
    const u = r(l);
    if (u) return u;
    const c = Tb(l, n);
    return o(l, c), c;
  }
  return function () {
    return i(Rb.apply(null, arguments));
  };
}
function ke(e) {
  const t = (n) => n[e] || [];
  return (t.isThemeGetter = !0), t;
}
const ow = /^\[(?:([a-z-]+):)?(.+)\]$/i,
  Ob = /^\d+\/\d+$/,
  Ab = new Set(["px", "full", "screen"]),
  Nb = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,
  Lb =
    /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,
  Db = /^(rgba?|hsla?|hwb|(ok)?(lab|lch))\(.+\)$/,
  Mb = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,
  jb = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
function Mn(e) {
  return Zr(e) || Ab.has(e) || Ob.test(e);
}
function sr(e) {
  return gi(e, "length", Wb);
}
function Zr(e) {
  return !!e && !Number.isNaN(Number(e));
}
function ba(e) {
  return gi(e, "number", Zr);
}
function Di(e) {
  return !!e && Number.isInteger(Number(e));
}
function Fb(e) {
  return e.endsWith("%") && Zr(e.slice(0, -1));
}
function se(e) {
  return ow.test(e);
}
function ar(e) {
  return Nb.test(e);
}
const Ib = new Set(["length", "size", "percentage"]);
function $b(e) {
  return gi(e, Ib, iw);
}
function zb(e) {
  return gi(e, "position", iw);
}
const Ub = new Set(["image", "url"]);
function Bb(e) {
  return gi(e, Ub, Kb);
}
function Vb(e) {
  return gi(e, "", Hb);
}
function Mi() {
  return !0;
}
function gi(e, t, n) {
  const r = ow.exec(e);
  return r ? (r[1] ? (typeof t == "string" ? r[1] === t : t.has(r[1])) : n(r[2])) : !1;
}
function Wb(e) {
  return Lb.test(e) && !Db.test(e);
}
function iw() {
  return !1;
}
function Hb(e) {
  return Mb.test(e);
}
function Kb(e) {
  return jb.test(e);
}
function qb() {
  const e = ke("colors"),
    t = ke("spacing"),
    n = ke("blur"),
    r = ke("brightness"),
    o = ke("borderColor"),
    i = ke("borderRadius"),
    s = ke("borderSpacing"),
    a = ke("borderWidth"),
    l = ke("contrast"),
    u = ke("grayscale"),
    c = ke("hueRotate"),
    f = ke("invert"),
    d = ke("gap"),
    v = ke("gradientColorStops"),
    m = ke("gradientColorStopPositions"),
    y = ke("inset"),
    x = ke("margin"),
    p = ke("opacity"),
    g = ke("padding"),
    w = ke("saturate"),
    S = ke("scale"),
    C = ke("sepia"),
    E = ke("skew"),
    P = ke("space"),
    R = ke("translate"),
    A = () => ["auto", "contain", "none"],
    D = () => ["auto", "hidden", "clip", "visible", "scroll"],
    U = () => ["auto", se, t],
    I = () => [se, t],
    Q = () => ["", Mn, sr],
    X = () => ["auto", Zr, se],
    B = () => ["bottom", "center", "left", "left-bottom", "left-top", "right", "right-bottom", "right-top", "top"],
    te = () => ["solid", "dashed", "dotted", "double", "none"],
    W = () => [
      "normal",
      "multiply",
      "screen",
      "overlay",
      "darken",
      "lighten",
      "color-dodge",
      "color-burn",
      "hard-light",
      "soft-light",
      "difference",
      "exclusion",
      "hue",
      "saturation",
      "color",
      "luminosity",
    ],
    M = () => ["start", "end", "center", "between", "around", "evenly", "stretch"],
    $ = () => ["", "0", se],
    H = () => ["auto", "avoid", "all", "avoid-page", "page", "left", "right", "column"],
    q = () => [Zr, ba],
    oe = () => [Zr, se];
  return {
    cacheSize: 500,
    separator: ":",
    theme: {
      colors: [Mi],
      spacing: [Mn, sr],
      blur: ["none", "", ar, se],
      brightness: q(),
      borderColor: [e],
      borderRadius: ["none", "", "full", ar, se],
      borderSpacing: I(),
      borderWidth: Q(),
      contrast: q(),
      grayscale: $(),
      hueRotate: oe(),
      invert: $(),
      gap: I(),
      gradientColorStops: [e],
      gradientColorStopPositions: [Fb, sr],
      inset: U(),
      margin: U(),
      opacity: q(),
      padding: I(),
      saturate: q(),
      scale: q(),
      sepia: $(),
      skew: oe(),
      space: I(),
      translate: I(),
    },
    classGroups: {
      aspect: [{ aspect: ["auto", "square", "video", se] }],
      container: ["container"],
      columns: [{ columns: [ar] }],
      "break-after": [{ "break-after": H() }],
      "break-before": [{ "break-before": H() }],
      "break-inside": [{ "break-inside": ["auto", "avoid", "avoid-page", "avoid-column"] }],
      "box-decoration": [{ "box-decoration": ["slice", "clone"] }],
      box: [{ box: ["border", "content"] }],
      display: [
        "block",
        "inline-block",
        "inline",
        "flex",
        "inline-flex",
        "table",
        "inline-table",
        "table-caption",
        "table-cell",
        "table-column",
        "table-column-group",
        "table-footer-group",
        "table-header-group",
        "table-row-group",
        "table-row",
        "flow-root",
        "grid",
        "inline-grid",
        "contents",
        "list-item",
        "hidden",
      ],
      float: [{ float: ["right", "left", "none", "start", "end"] }],
      clear: [{ clear: ["left", "right", "both", "none", "start", "end"] }],
      isolation: ["isolate", "isolation-auto"],
      "object-fit": [{ object: ["contain", "cover", "fill", "none", "scale-down"] }],
      "object-position": [{ object: [...B(), se] }],
      overflow: [{ overflow: D() }],
      "overflow-x": [{ "overflow-x": D() }],
      "overflow-y": [{ "overflow-y": D() }],
      overscroll: [{ overscroll: A() }],
      "overscroll-x": [{ "overscroll-x": A() }],
      "overscroll-y": [{ "overscroll-y": A() }],
      position: ["static", "fixed", "absolute", "relative", "sticky"],
      inset: [{ inset: [y] }],
      "inset-x": [{ "inset-x": [y] }],
      "inset-y": [{ "inset-y": [y] }],
      start: [{ start: [y] }],
      end: [{ end: [y] }],
      top: [{ top: [y] }],
      right: [{ right: [y] }],
      bottom: [{ bottom: [y] }],
      left: [{ left: [y] }],
      visibility: ["visible", "invisible", "collapse"],
      z: [{ z: ["auto", Di, se] }],
      basis: [{ basis: U() }],
      "flex-direction": [{ flex: ["row", "row-reverse", "col", "col-reverse"] }],
      "flex-wrap": [{ flex: ["wrap", "wrap-reverse", "nowrap"] }],
      flex: [{ flex: ["1", "auto", "initial", "none", se] }],
      grow: [{ grow: $() }],
      shrink: [{ shrink: $() }],
      order: [{ order: ["first", "last", "none", Di, se] }],
      "grid-cols": [{ "grid-cols": [Mi] }],
      "col-start-end": [{ col: ["auto", { span: ["full", Di, se] }, se] }],
      "col-start": [{ "col-start": X() }],
      "col-end": [{ "col-end": X() }],
      "grid-rows": [{ "grid-rows": [Mi] }],
      "row-start-end": [{ row: ["auto", { span: [Di, se] }, se] }],
      "row-start": [{ "row-start": X() }],
      "row-end": [{ "row-end": X() }],
      "grid-flow": [{ "grid-flow": ["row", "col", "dense", "row-dense", "col-dense"] }],
      "auto-cols": [{ "auto-cols": ["auto", "min", "max", "fr", se] }],
      "auto-rows": [{ "auto-rows": ["auto", "min", "max", "fr", se] }],
      gap: [{ gap: [d] }],
      "gap-x": [{ "gap-x": [d] }],
      "gap-y": [{ "gap-y": [d] }],
      "justify-content": [{ justify: ["normal", ...M()] }],
      "justify-items": [{ "justify-items": ["start", "end", "center", "stretch"] }],
      "justify-self": [{ "justify-self": ["auto", "start", "end", "center", "stretch"] }],
      "align-content": [{ content: ["normal", ...M(), "baseline"] }],
      "align-items": [{ items: ["start", "end", "center", "baseline", "stretch"] }],
      "align-self": [{ self: ["auto", "start", "end", "center", "stretch", "baseline"] }],
      "place-content": [{ "place-content": [...M(), "baseline"] }],
      "place-items": [{ "place-items": ["start", "end", "center", "baseline", "stretch"] }],
      "place-self": [{ "place-self": ["auto", "start", "end", "center", "stretch"] }],
      p: [{ p: [g] }],
      px: [{ px: [g] }],
      py: [{ py: [g] }],
      ps: [{ ps: [g] }],
      pe: [{ pe: [g] }],
      pt: [{ pt: [g] }],
      pr: [{ pr: [g] }],
      pb: [{ pb: [g] }],
      pl: [{ pl: [g] }],
      m: [{ m: [x] }],
      mx: [{ mx: [x] }],
      my: [{ my: [x] }],
      ms: [{ ms: [x] }],
      me: [{ me: [x] }],
      mt: [{ mt: [x] }],
      mr: [{ mr: [x] }],
      mb: [{ mb: [x] }],
      ml: [{ ml: [x] }],
      "space-x": [{ "space-x": [P] }],
      "space-x-reverse": ["space-x-reverse"],
      "space-y": [{ "space-y": [P] }],
      "space-y-reverse": ["space-y-reverse"],
      w: [{ w: ["auto", "min", "max", "fit", "svw", "lvw", "dvw", se, t] }],
      "min-w": [{ "min-w": [se, t, "min", "max", "fit"] }],
      "max-w": [{ "max-w": [se, t, "none", "full", "min", "max", "fit", "prose", { screen: [ar] }, ar] }],
      h: [{ h: [se, t, "auto", "min", "max", "fit", "svh", "lvh", "dvh"] }],
      "min-h": [{ "min-h": [se, t, "min", "max", "fit", "svh", "lvh", "dvh"] }],
      "max-h": [{ "max-h": [se, t, "min", "max", "fit", "svh", "lvh", "dvh"] }],
      size: [{ size: [se, t, "auto", "min", "max", "fit"] }],
      "font-size": [{ text: ["base", ar, sr] }],
      "font-smoothing": ["antialiased", "subpixel-antialiased"],
      "font-style": ["italic", "not-italic"],
      "font-weight": [
        { font: ["thin", "extralight", "light", "normal", "medium", "semibold", "bold", "extrabold", "black", ba] },
      ],
      "font-family": [{ font: [Mi] }],
      "fvn-normal": ["normal-nums"],
      "fvn-ordinal": ["ordinal"],
      "fvn-slashed-zero": ["slashed-zero"],
      "fvn-figure": ["lining-nums", "oldstyle-nums"],
      "fvn-spacing": ["proportional-nums", "tabular-nums"],
      "fvn-fraction": ["diagonal-fractions", "stacked-fractons"],
      tracking: [{ tracking: ["tighter", "tight", "normal", "wide", "wider", "widest", se] }],
      "line-clamp": [{ "line-clamp": ["none", Zr, ba] }],
      leading: [{ leading: ["none", "tight", "snug", "normal", "relaxed", "loose", Mn, se] }],
      "list-image": [{ "list-image": ["none", se] }],
      "list-style-type": [{ list: ["none", "disc", "decimal", se] }],
      "list-style-position": [{ list: ["inside", "outside"] }],
      "placeholder-color": [{ placeholder: [e] }],
      "placeholder-opacity": [{ "placeholder-opacity": [p] }],
      "text-alignment": [{ text: ["left", "center", "right", "justify", "start", "end"] }],
      "text-color": [{ text: [e] }],
      "text-opacity": [{ "text-opacity": [p] }],
      "text-decoration": ["underline", "overline", "line-through", "no-underline"],
      "text-decoration-style": [{ decoration: [...te(), "wavy"] }],
      "text-decoration-thickness": [{ decoration: ["auto", "from-font", Mn, sr] }],
      "underline-offset": [{ "underline-offset": ["auto", Mn, se] }],
      "text-decoration-color": [{ decoration: [e] }],
      "text-transform": ["uppercase", "lowercase", "capitalize", "normal-case"],
      "text-overflow": ["truncate", "text-ellipsis", "text-clip"],
      "text-wrap": [{ text: ["wrap", "nowrap", "balance", "pretty"] }],
      indent: [{ indent: I() }],
      "vertical-align": [
        { align: ["baseline", "top", "middle", "bottom", "text-top", "text-bottom", "sub", "super", se] },
      ],
      whitespace: [{ whitespace: ["normal", "nowrap", "pre", "pre-line", "pre-wrap", "break-spaces"] }],
      break: [{ break: ["normal", "words", "all", "keep"] }],
      hyphens: [{ hyphens: ["none", "manual", "auto"] }],
      content: [{ content: ["none", se] }],
      "bg-attachment": [{ bg: ["fixed", "local", "scroll"] }],
      "bg-clip": [{ "bg-clip": ["border", "padding", "content", "text"] }],
      "bg-opacity": [{ "bg-opacity": [p] }],
      "bg-origin": [{ "bg-origin": ["border", "padding", "content"] }],
      "bg-position": [{ bg: [...B(), zb] }],
      "bg-repeat": [{ bg: ["no-repeat", { repeat: ["", "x", "y", "round", "space"] }] }],
      "bg-size": [{ bg: ["auto", "cover", "contain", $b] }],
      "bg-image": [{ bg: ["none", { "gradient-to": ["t", "tr", "r", "br", "b", "bl", "l", "tl"] }, Bb] }],
      "bg-color": [{ bg: [e] }],
      "gradient-from-pos": [{ from: [m] }],
      "gradient-via-pos": [{ via: [m] }],
      "gradient-to-pos": [{ to: [m] }],
      "gradient-from": [{ from: [v] }],
      "gradient-via": [{ via: [v] }],
      "gradient-to": [{ to: [v] }],
      rounded: [{ rounded: [i] }],
      "rounded-s": [{ "rounded-s": [i] }],
      "rounded-e": [{ "rounded-e": [i] }],
      "rounded-t": [{ "rounded-t": [i] }],
      "rounded-r": [{ "rounded-r": [i] }],
      "rounded-b": [{ "rounded-b": [i] }],
      "rounded-l": [{ "rounded-l": [i] }],
      "rounded-ss": [{ "rounded-ss": [i] }],
      "rounded-se": [{ "rounded-se": [i] }],
      "rounded-ee": [{ "rounded-ee": [i] }],
      "rounded-es": [{ "rounded-es": [i] }],
      "rounded-tl": [{ "rounded-tl": [i] }],
      "rounded-tr": [{ "rounded-tr": [i] }],
      "rounded-br": [{ "rounded-br": [i] }],
      "rounded-bl": [{ "rounded-bl": [i] }],
      "border-w": [{ border: [a] }],
      "border-w-x": [{ "border-x": [a] }],
      "border-w-y": [{ "border-y": [a] }],
      "border-w-s": [{ "border-s": [a] }],
      "border-w-e": [{ "border-e": [a] }],
      "border-w-t": [{ "border-t": [a] }],
      "border-w-r": [{ "border-r": [a] }],
      "border-w-b": [{ "border-b": [a] }],
      "border-w-l": [{ "border-l": [a] }],
      "border-opacity": [{ "border-opacity": [p] }],
      "border-style": [{ border: [...te(), "hidden"] }],
      "divide-x": [{ "divide-x": [a] }],
      "divide-x-reverse": ["divide-x-reverse"],
      "divide-y": [{ "divide-y": [a] }],
      "divide-y-reverse": ["divide-y-reverse"],
      "divide-opacity": [{ "divide-opacity": [p] }],
      "divide-style": [{ divide: te() }],
      "border-color": [{ border: [o] }],
      "border-color-x": [{ "border-x": [o] }],
      "border-color-y": [{ "border-y": [o] }],
      "border-color-t": [{ "border-t": [o] }],
      "border-color-r": [{ "border-r": [o] }],
      "border-color-b": [{ "border-b": [o] }],
      "border-color-l": [{ "border-l": [o] }],
      "divide-color": [{ divide: [o] }],
      "outline-style": [{ outline: ["", ...te()] }],
      "outline-offset": [{ "outline-offset": [Mn, se] }],
      "outline-w": [{ outline: [Mn, sr] }],
      "outline-color": [{ outline: [e] }],
      "ring-w": [{ ring: Q() }],
      "ring-w-inset": ["ring-inset"],
      "ring-color": [{ ring: [e] }],
      "ring-opacity": [{ "ring-opacity": [p] }],
      "ring-offset-w": [{ "ring-offset": [Mn, sr] }],
      "ring-offset-color": [{ "ring-offset": [e] }],
      shadow: [{ shadow: ["", "inner", "none", ar, Vb] }],
      "shadow-color": [{ shadow: [Mi] }],
      opacity: [{ opacity: [p] }],
      "mix-blend": [{ "mix-blend": [...W(), "plus-lighter", "plus-darker"] }],
      "bg-blend": [{ "bg-blend": W() }],
      filter: [{ filter: ["", "none"] }],
      blur: [{ blur: [n] }],
      brightness: [{ brightness: [r] }],
      contrast: [{ contrast: [l] }],
      "drop-shadow": [{ "drop-shadow": ["", "none", ar, se] }],
      grayscale: [{ grayscale: [u] }],
      "hue-rotate": [{ "hue-rotate": [c] }],
      invert: [{ invert: [f] }],
      saturate: [{ saturate: [w] }],
      sepia: [{ sepia: [C] }],
      "backdrop-filter": [{ "backdrop-filter": ["", "none"] }],
      "backdrop-blur": [{ "backdrop-blur": [n] }],
      "backdrop-brightness": [{ "backdrop-brightness": [r] }],
      "backdrop-contrast": [{ "backdrop-contrast": [l] }],
      "backdrop-grayscale": [{ "backdrop-grayscale": [u] }],
      "backdrop-hue-rotate": [{ "backdrop-hue-rotate": [c] }],
      "backdrop-invert": [{ "backdrop-invert": [f] }],
      "backdrop-opacity": [{ "backdrop-opacity": [p] }],
      "backdrop-saturate": [{ "backdrop-saturate": [w] }],
      "backdrop-sepia": [{ "backdrop-sepia": [C] }],
      "border-collapse": [{ border: ["collapse", "separate"] }],
      "border-spacing": [{ "border-spacing": [s] }],
      "border-spacing-x": [{ "border-spacing-x": [s] }],
      "border-spacing-y": [{ "border-spacing-y": [s] }],
      "table-layout": [{ table: ["auto", "fixed"] }],
      caption: [{ caption: ["top", "bottom"] }],
      transition: [{ transition: ["none", "all", "", "colors", "opacity", "shadow", "transform", se] }],
      duration: [{ duration: oe() }],
      ease: [{ ease: ["linear", "in", "out", "in-out", se] }],
      delay: [{ delay: oe() }],
      animate: [{ animate: ["none", "spin", "ping", "pulse", "bounce", se] }],
      transform: [{ transform: ["", "gpu", "none"] }],
      scale: [{ scale: [S] }],
      "scale-x": [{ "scale-x": [S] }],
      "scale-y": [{ "scale-y": [S] }],
      rotate: [{ rotate: [Di, se] }],
      "translate-x": [{ "translate-x": [R] }],
      "translate-y": [{ "translate-y": [R] }],
      "skew-x": [{ "skew-x": [E] }],
      "skew-y": [{ "skew-y": [E] }],
      "transform-origin": [
        {
          origin: [
            "center",
            "top",
            "top-right",
            "right",
            "bottom-right",
            "bottom",
            "bottom-left",
            "left",
            "top-left",
            se,
          ],
        },
      ],
      accent: [{ accent: ["auto", e] }],
      appearance: [{ appearance: ["none", "auto"] }],
      cursor: [
        {
          cursor: [
            "auto",
            "default",
            "pointer",
            "wait",
            "text",
            "move",
            "help",
            "not-allowed",
            "none",
            "context-menu",
            "progress",
            "cell",
            "crosshair",
            "vertical-text",
            "alias",
            "copy",
            "no-drop",
            "grab",
            "grabbing",
            "all-scroll",
            "col-resize",
            "row-resize",
            "n-resize",
            "e-resize",
            "s-resize",
            "w-resize",
            "ne-resize",
            "nw-resize",
            "se-resize",
            "sw-resize",
            "ew-resize",
            "ns-resize",
            "nesw-resize",
            "nwse-resize",
            "zoom-in",
            "zoom-out",
            se,
          ],
        },
      ],
      "caret-color": [{ caret: [e] }],
      "pointer-events": [{ "pointer-events": ["none", "auto"] }],
      resize: [{ resize: ["none", "y", "x", ""] }],
      "scroll-behavior": [{ scroll: ["auto", "smooth"] }],
      "scroll-m": [{ "scroll-m": I() }],
      "scroll-mx": [{ "scroll-mx": I() }],
      "scroll-my": [{ "scroll-my": I() }],
      "scroll-ms": [{ "scroll-ms": I() }],
      "scroll-me": [{ "scroll-me": I() }],
      "scroll-mt": [{ "scroll-mt": I() }],
      "scroll-mr": [{ "scroll-mr": I() }],
      "scroll-mb": [{ "scroll-mb": I() }],
      "scroll-ml": [{ "scroll-ml": I() }],
      "scroll-p": [{ "scroll-p": I() }],
      "scroll-px": [{ "scroll-px": I() }],
      "scroll-py": [{ "scroll-py": I() }],
      "scroll-ps": [{ "scroll-ps": I() }],
      "scroll-pe": [{ "scroll-pe": I() }],
      "scroll-pt": [{ "scroll-pt": I() }],
      "scroll-pr": [{ "scroll-pr": I() }],
      "scroll-pb": [{ "scroll-pb": I() }],
      "scroll-pl": [{ "scroll-pl": I() }],
      "snap-align": [{ snap: ["start", "end", "center", "align-none"] }],
      "snap-stop": [{ snap: ["normal", "always"] }],
      "snap-type": [{ snap: ["none", "x", "y", "both"] }],
      "snap-strictness": [{ snap: ["mandatory", "proximity"] }],
      touch: [{ touch: ["auto", "none", "manipulation"] }],
      "touch-x": [{ "touch-pan": ["x", "left", "right"] }],
      "touch-y": [{ "touch-pan": ["y", "up", "down"] }],
      "touch-pz": ["touch-pinch-zoom"],
      select: [{ select: ["none", "text", "all", "auto"] }],
      "will-change": [{ "will-change": ["auto", "scroll", "contents", "transform", se] }],
      fill: [{ fill: [e, "none"] }],
      "stroke-w": [{ stroke: [Mn, sr, ba] }],
      stroke: [{ stroke: [e, "none"] }],
      sr: ["sr-only", "not-sr-only"],
      "forced-color-adjust": [{ "forced-color-adjust": ["auto", "none"] }],
    },
    conflictingClassGroups: {
      overflow: ["overflow-x", "overflow-y"],
      overscroll: ["overscroll-x", "overscroll-y"],
      inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
      "inset-x": ["right", "left"],
      "inset-y": ["top", "bottom"],
      flex: ["basis", "grow", "shrink"],
      gap: ["gap-x", "gap-y"],
      p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
      mx: ["mr", "ml"],
      my: ["mt", "mb"],
      size: ["w", "h"],
      "font-size": ["leading"],
      "fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
      "fvn-ordinal": ["fvn-normal"],
      "fvn-slashed-zero": ["fvn-normal"],
      "fvn-figure": ["fvn-normal"],
      "fvn-spacing": ["fvn-normal"],
      "fvn-fraction": ["fvn-normal"],
      "line-clamp": ["display", "overflow"],
      rounded: [
        "rounded-s",
        "rounded-e",
        "rounded-t",
        "rounded-r",
        "rounded-b",
        "rounded-l",
        "rounded-ss",
        "rounded-se",
        "rounded-ee",
        "rounded-es",
        "rounded-tl",
        "rounded-tr",
        "rounded-br",
        "rounded-bl",
      ],
      "rounded-s": ["rounded-ss", "rounded-es"],
      "rounded-e": ["rounded-se", "rounded-ee"],
      "rounded-t": ["rounded-tl", "rounded-tr"],
      "rounded-r": ["rounded-tr", "rounded-br"],
      "rounded-b": ["rounded-br", "rounded-bl"],
      "rounded-l": ["rounded-tl", "rounded-bl"],
      "border-spacing": ["border-spacing-x", "border-spacing-y"],
      "border-w": ["border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
      "border-w-x": ["border-w-r", "border-w-l"],
      "border-w-y": ["border-w-t", "border-w-b"],
      "border-color": ["border-color-t", "border-color-r", "border-color-b", "border-color-l"],
      "border-color-x": ["border-color-r", "border-color-l"],
      "border-color-y": ["border-color-t", "border-color-b"],
      "scroll-m": [
        "scroll-mx",
        "scroll-my",
        "scroll-ms",
        "scroll-me",
        "scroll-mt",
        "scroll-mr",
        "scroll-mb",
        "scroll-ml",
      ],
      "scroll-mx": ["scroll-mr", "scroll-ml"],
      "scroll-my": ["scroll-mt", "scroll-mb"],
      "scroll-p": [
        "scroll-px",
        "scroll-py",
        "scroll-ps",
        "scroll-pe",
        "scroll-pt",
        "scroll-pr",
        "scroll-pb",
        "scroll-pl",
      ],
      "scroll-px": ["scroll-pr", "scroll-pl"],
      "scroll-py": ["scroll-pt", "scroll-pb"],
      touch: ["touch-x", "touch-y", "touch-pz"],
      "touch-x": ["touch"],
      "touch-y": ["touch"],
      "touch-pz": ["touch"],
    },
    conflictingClassGroupModifiers: { "font-size": ["leading"] },
  };
}
const Gb = Pb(qb);
var Qb = { BASE_URL: "/assets/timesheet_enhancer/timesheet/", MODE: "production", DEV: !1, PROD: !0, SSR: !1 };
function De(...e) {
  return Gb(gb(e));
}
function sw(e) {
  var r;
  const n = `; ${document.cookie}`.split(`; ${e}=`);
  return n.length === 2 ? ((r = n.pop()) == null ? void 0 : r.split(";").shift()) : null;
}
const Yb = () => {
  var e, t, n;
  return (n = (t = (e = window.frappe) == null ? void 0 : e.boot) == null ? void 0 : t.sitename) != null
    ? n
    : Qb.VITE_SITE_NAME;
};
function aw(e) {
  try {
    const t = e._server_messages;
    if (e.exception && !t) return bc(e.exception);
    if (t) {
      const n = JSON.parse(t);
      if (n.length > 0) {
        const r = n[0],
          o = JSON.parse(r);
        return bc(o.message);
      }
    } else if (e._error_message) return bc(e._error_message);
  } catch (t) {
    return "Something went wrong! Please try again later.";
  }
}
function bc(e) {
  return e.replace(/<\/?[^>]+(>|$)/g, "");
}
function Yf(e) {
  typeof e == "string" && (e = new Date(e));
  const t = e.getFullYear(),
    n = String(e.getMonth() + 1).padStart(2, "0"),
    r = String(e.getDate()).padStart(2, "0");
  return `${t}-${n}-${r}`;
}
function Ul() {
  return Yf(new Date());
}
function j2(e, t = !1) {
  const n = new Date(e),
    r = n.toLocaleString("default", { month: "short" }),
    o = n.getDate(),
    i = n.toLocaleString("default", { weekday: t ? "long" : "short" });
  return { date: `${r} ${o}`, day: i };
}
function F2(e) {
  return e.split(" ")[0];
}
function I2(e) {
  const t = Math.floor(e),
    n = Math.round((e % 1) * 60),
    r = String(t).padStart(1, "0"),
    o = String(n).padStart(2, "0");
  return `${r}:${o}`;
}
function $2(e, t) {
  let n;
  return (...r) => {
    clearTimeout(n), (n = setTimeout(() => e.apply(this, r), t));
  };
}
function z2(e, t, n) {
  if (n === "Per Day") return e > t ? 2 : e < t ? 0 : 1;
  const r = t / 5;
  return e > r ? 2 : e < r ? 0 : 1;
}
function U2(e, t, n) {
  return n === "Per Day" && (t = t * 5), e > t ? 2 : e < t ? 0 : 1;
}
const B2 = (e, t) => (t === "Per Day" ? e : e / 5);
var Xb = Object.defineProperty,
  Jb = (e, t, n) => (t in e ? Xb(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : (e[t] = n)),
  Br = (e, t, n) => (Jb(e, typeof t != "symbol" ? t + "" : t, n), n),
  ve =
    typeof globalThis < "u"
      ? globalThis
      : typeof window < "u"
      ? window
      : typeof global < "u"
      ? global
      : typeof self < "u"
      ? self
      : {},
  Qm = {},
  ji = {},
  zs = {},
  Kt =
    (ve && ve.__assign) ||
    function () {
      return (
        (Kt =
          Object.assign ||
          function (e) {
            for (var t, n = 1, r = arguments.length; n < r; n++) {
              t = arguments[n];
              for (var o in t) Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);
            }
            return e;
          }),
        Kt.apply(this, arguments)
      );
    },
  ka =
    (ve && ve.__awaiter) ||
    function (e, t, n, r) {
      function o(i) {
        return i instanceof n
          ? i
          : new n(function (s) {
              s(i);
            });
      }
      return new (n || (n = Promise))(function (i, s) {
        function a(c) {
          try {
            u(r.next(c));
          } catch (f) {
            s(f);
          }
        }
        function l(c) {
          try {
            u(r.throw(c));
          } catch (f) {
            s(f);
          }
        }
        function u(c) {
          c.done ? i(c.value) : o(c.value).then(a, l);
        }
        u((r = r.apply(e, t || [])).next());
      });
    },
  _a =
    (ve && ve.__generator) ||
    function (e, t) {
      var n = {
          label: 0,
          sent: function () {
            if (i[0] & 1) throw i[1];
            return i[1];
          },
          trys: [],
          ops: [],
        },
        r,
        o,
        i,
        s;
      return (
        (s = { next: a(0), throw: a(1), return: a(2) }),
        typeof Symbol == "function" &&
          (s[Symbol.iterator] = function () {
            return this;
          }),
        s
      );
      function a(u) {
        return function (c) {
          return l([u, c]);
        };
      }
      function l(u) {
        if (r) throw new TypeError("Generator is already executing.");
        for (; s && ((s = 0), u[0] && (n = 0)), n; )
          try {
            if (
              ((r = 1),
              o &&
                (i = u[0] & 2 ? o.return : u[0] ? o.throw || ((i = o.return) && i.call(o), 0) : o.next) &&
                !(i = i.call(o, u[1])).done)
            )
              return i;
            switch (((o = 0), i && (u = [u[0] & 2, i.value]), u[0])) {
              case 0:
              case 1:
                i = u;
                break;
              case 4:
                return n.label++, { value: u[1], done: !1 };
              case 5:
                n.label++, (o = u[1]), (u = [0]);
                continue;
              case 7:
                (u = n.ops.pop()), n.trys.pop();
                continue;
              default:
                if (((i = n.trys), !(i = i.length > 0 && i[i.length - 1]) && (u[0] === 6 || u[0] === 2))) {
                  n = 0;
                  continue;
                }
                if (u[0] === 3 && (!i || (u[1] > i[0] && u[1] < i[3]))) {
                  n.label = u[1];
                  break;
                }
                if (u[0] === 6 && n.label < i[1]) {
                  (n.label = i[1]), (i = u);
                  break;
                }
                if (i && n.label < i[2]) {
                  (n.label = i[2]), n.ops.push(u);
                  break;
                }
                i[2] && n.ops.pop(), n.trys.pop();
                continue;
            }
            u = t.call(e, n);
          } catch (c) {
            (u = [6, c]), (o = 0);
          } finally {
            r = i = 0;
          }
        if (u[0] & 5) throw u[1];
        return { value: u[0] ? u[1] : void 0, done: !0 };
      }
    };
Object.defineProperty(zs, "__esModule", { value: !0 });
zs.FrappeCall = void 0;
var Zb = (function () {
  function e(t, n, r, o, i) {
    (this.appURL = t), (this.axios = n), (this.useToken = r != null ? r : !1), (this.token = o), (this.tokenType = i);
  }
  return (
    (e.prototype.get = function (t, n) {
      return ka(this, void 0, void 0, function () {
        var r;
        return _a(this, function (o) {
          return (
            (r = new URLSearchParams()),
            n &&
              Object.entries(n).forEach(function (i) {
                var s = i[0],
                  a = i[1];
                if (a != null) {
                  var l = typeof a == "object" ? JSON.stringify(a) : a;
                  r.set(s, l);
                }
              }),
            [
              2,
              this.axios
                .get("/api/method/".concat(t), { params: r })
                .then(function (i) {
                  return i.data;
                })
                .catch(function (i) {
                  var s, a;
                  throw Kt(Kt({}, i.response.data), {
                    httpStatus: i.response.status,
                    httpStatusText: i.response.statusText,
                    message: (s = i.response.data.message) !== null && s !== void 0 ? s : "There was an error.",
                    exception: (a = i.response.data.exception) !== null && a !== void 0 ? a : "",
                  });
                }),
            ]
          );
        });
      });
    }),
    (e.prototype.post = function (t, n) {
      return ka(this, void 0, void 0, function () {
        return _a(this, function (r) {
          return [
            2,
            this.axios
              .post("/api/method/".concat(t), Kt({}, n))
              .then(function (o) {
                return o.data;
              })
              .catch(function (o) {
                var i, s;
                throw Kt(Kt({}, o.response.data), {
                  httpStatus: o.response.status,
                  httpStatusText: o.response.statusText,
                  message: (i = o.response.data.message) !== null && i !== void 0 ? i : "There was an error.",
                  exception: (s = o.response.data.exception) !== null && s !== void 0 ? s : "",
                });
              }),
          ];
        });
      });
    }),
    (e.prototype.put = function (t, n) {
      return ka(this, void 0, void 0, function () {
        return _a(this, function (r) {
          return [
            2,
            this.axios
              .put("/api/method/".concat(t), Kt({}, n))
              .then(function (o) {
                return o.data;
              })
              .catch(function (o) {
                var i, s;
                throw Kt(Kt({}, o.response.data), {
                  httpStatus: o.response.status,
                  httpStatusText: o.response.statusText,
                  message: (i = o.response.data.message) !== null && i !== void 0 ? i : "There was an error.",
                  exception: (s = o.response.data.exception) !== null && s !== void 0 ? s : "",
                });
              }),
          ];
        });
      });
    }),
    (e.prototype.delete = function (t, n) {
      return ka(this, void 0, void 0, function () {
        return _a(this, function (r) {
          return [
            2,
            this.axios
              .delete("/api/method/".concat(t), { params: n })
              .then(function (o) {
                return o.data;
              })
              .catch(function (o) {
                var i, s;
                throw Kt(Kt({}, o.response.data), {
                  httpStatus: o.response.status,
                  httpStatusText: o.response.statusText,
                  message: (i = o.response.data.message) !== null && i !== void 0 ? i : "There was an error.",
                  exception: (s = o.response.data.exception) !== null && s !== void 0 ? s : "",
                });
              }),
          ];
        });
      });
    }),
    e
  );
})();
zs.FrappeCall = Zb;
var Us = {},
  qe =
    (ve && ve.__assign) ||
    function () {
      return (
        (qe =
          Object.assign ||
          function (e) {
            for (var t, n = 1, r = arguments.length; n < r; n++) {
              t = arguments[n];
              for (var o in t) Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);
            }
            return e;
          }),
        qe.apply(this, arguments)
      );
    },
  Vr =
    (ve && ve.__awaiter) ||
    function (e, t, n, r) {
      function o(i) {
        return i instanceof n
          ? i
          : new n(function (s) {
              s(i);
            });
      }
      return new (n || (n = Promise))(function (i, s) {
        function a(c) {
          try {
            u(r.next(c));
          } catch (f) {
            s(f);
          }
        }
        function l(c) {
          try {
            u(r.throw(c));
          } catch (f) {
            s(f);
          }
        }
        function u(c) {
          c.done ? i(c.value) : o(c.value).then(a, l);
        }
        u((r = r.apply(e, t || [])).next());
      });
    },
  Wr =
    (ve && ve.__generator) ||
    function (e, t) {
      var n = {
          label: 0,
          sent: function () {
            if (i[0] & 1) throw i[1];
            return i[1];
          },
          trys: [],
          ops: [],
        },
        r,
        o,
        i,
        s;
      return (
        (s = { next: a(0), throw: a(1), return: a(2) }),
        typeof Symbol == "function" &&
          (s[Symbol.iterator] = function () {
            return this;
          }),
        s
      );
      function a(u) {
        return function (c) {
          return l([u, c]);
        };
      }
      function l(u) {
        if (r) throw new TypeError("Generator is already executing.");
        for (; s && ((s = 0), u[0] && (n = 0)), n; )
          try {
            if (
              ((r = 1),
              o &&
                (i = u[0] & 2 ? o.return : u[0] ? o.throw || ((i = o.return) && i.call(o), 0) : o.next) &&
                !(i = i.call(o, u[1])).done)
            )
              return i;
            switch (((o = 0), i && (u = [u[0] & 2, i.value]), u[0])) {
              case 0:
              case 1:
                i = u;
                break;
              case 4:
                return n.label++, { value: u[1], done: !1 };
              case 5:
                n.label++, (o = u[1]), (u = [0]);
                continue;
              case 7:
                (u = n.ops.pop()), n.trys.pop();
                continue;
              default:
                if (((i = n.trys), !(i = i.length > 0 && i[i.length - 1]) && (u[0] === 6 || u[0] === 2))) {
                  n = 0;
                  continue;
                }
                if (u[0] === 3 && (!i || (u[1] > i[0] && u[1] < i[3]))) {
                  n.label = u[1];
                  break;
                }
                if (u[0] === 6 && n.label < i[1]) {
                  (n.label = i[1]), (i = u);
                  break;
                }
                if (i && n.label < i[2]) {
                  (n.label = i[2]), n.ops.push(u);
                  break;
                }
                i[2] && n.ops.pop(), n.trys.pop();
                continue;
            }
            u = t.call(e, n);
          } catch (c) {
            (u = [6, c]), (o = 0);
          } finally {
            r = i = 0;
          }
        if (u[0] & 5) throw u[1];
        return { value: u[0] ? u[1] : void 0, done: !0 };
      }
    };
Object.defineProperty(Us, "__esModule", { value: !0 });
Us.FrappeDB = void 0;
var ek = (function () {
  function e(t, n, r, o, i) {
    (this.appURL = t), (this.axios = n), (this.useToken = r != null ? r : !1), (this.token = o), (this.tokenType = i);
  }
  return (
    (e.prototype.getDoc = function (t, n) {
      return (
        n === void 0 && (n = ""),
        Vr(this, void 0, void 0, function () {
          return Wr(this, function (r) {
            return [
              2,
              this.axios
                .get("/api/resource/".concat(t, "/").concat(encodeURIComponent(n)))
                .then(function (o) {
                  return o.data.data;
                })
                .catch(function (o) {
                  var i, s;
                  throw qe(qe({}, o.response.data), {
                    httpStatus: o.response.status,
                    httpStatusText: o.response.statusText,
                    message: "There was an error while fetching the document.",
                    exception:
                      (s = (i = o.response.data.exception) !== null && i !== void 0 ? i : o.response.data.exc_type) !==
                        null && s !== void 0
                        ? s
                        : "",
                  });
                }),
            ];
          });
        })
      );
    }),
    (e.prototype.getDocList = function (t, n) {
      var r;
      return Vr(this, void 0, void 0, function () {
        var o, i, s, a, l, u, c, f, d, v, m;
        return Wr(this, function (y) {
          return (
            (o = {}),
            n &&
              ((i = n.fields),
              (s = n.filters),
              (a = n.orFilters),
              (l = n.orderBy),
              (u = n.limit),
              (c = n.limit_start),
              (f = n.groupBy),
              (d = n.asDict),
              (v = d === void 0 ? !0 : d),
              (m = l
                ? ""
                    .concat(String(l == null ? void 0 : l.field), " ")
                    .concat((r = l == null ? void 0 : l.order) !== null && r !== void 0 ? r : "asc")
                : ""),
              (o = {
                fields: i ? JSON.stringify(i) : void 0,
                filters: s ? JSON.stringify(s) : void 0,
                or_filters: a ? JSON.stringify(a) : void 0,
                order_by: m,
                group_by: f,
                limit: u,
                limit_start: c,
                as_dict: v,
              })),
            [
              2,
              this.axios
                .get("/api/resource/".concat(t), { params: o })
                .then(function (x) {
                  return x.data.data;
                })
                .catch(function (x) {
                  var p, g;
                  throw qe(qe({}, x.response.data), {
                    httpStatus: x.response.status,
                    httpStatusText: x.response.statusText,
                    message: "There was an error while fetching the documents.",
                    exception:
                      (g = (p = x.response.data.exception) !== null && p !== void 0 ? p : x.response.data.exc_type) !==
                        null && g !== void 0
                        ? g
                        : "",
                  });
                }),
            ]
          );
        });
      });
    }),
    (e.prototype.createDoc = function (t, n) {
      return Vr(this, void 0, void 0, function () {
        return Wr(this, function (r) {
          return [
            2,
            this.axios
              .post("/api/resource/".concat(t), qe({}, n))
              .then(function (o) {
                return o.data.data;
              })
              .catch(function (o) {
                var i, s, a;
                throw qe(qe({}, o.response.data), {
                  httpStatus: o.response.status,
                  httpStatusText: o.response.statusText,
                  message:
                    (i = o.response.data.message) !== null && i !== void 0
                      ? i
                      : "There was an error while creating the document.",
                  exception:
                    (a = (s = o.response.data.exception) !== null && s !== void 0 ? s : o.response.data.exc_type) !==
                      null && a !== void 0
                      ? a
                      : "",
                });
              }),
          ];
        });
      });
    }),
    (e.prototype.updateDoc = function (t, n, r) {
      return Vr(this, void 0, void 0, function () {
        return Wr(this, function (o) {
          return [
            2,
            this.axios
              .put("/api/resource/".concat(t, "/").concat(n && encodeURIComponent(n)), qe({}, r))
              .then(function (i) {
                return i.data.data;
              })
              .catch(function (i) {
                var s, a, l;
                throw qe(qe({}, i.response.data), {
                  httpStatus: i.response.status,
                  httpStatusText: i.response.statusText,
                  message:
                    (s = i.response.data.message) !== null && s !== void 0
                      ? s
                      : "There was an error while updating the document.",
                  exception:
                    (l = (a = i.response.data.exception) !== null && a !== void 0 ? a : i.response.data.exc_type) !==
                      null && l !== void 0
                      ? l
                      : "",
                });
              }),
          ];
        });
      });
    }),
    (e.prototype.deleteDoc = function (t, n) {
      return Vr(this, void 0, void 0, function () {
        return Wr(this, function (r) {
          return [
            2,
            this.axios
              .delete("/api/resource/".concat(t, "/").concat(n && encodeURIComponent(n)))
              .then(function (o) {
                return o.data;
              })
              .catch(function (o) {
                var i, s;
                throw qe(qe({}, o.response.data), {
                  httpStatus: o.response.status,
                  httpStatusText: o.response.statusText,
                  message: "There was an error while deleting the document.",
                  exception:
                    (s = (i = o.response.data.exception) !== null && i !== void 0 ? i : o.response.data.exc_type) !==
                      null && s !== void 0
                      ? s
                      : "",
                });
              }),
          ];
        });
      });
    }),
    (e.prototype.getCount = function (t, n, r, o) {
      return (
        r === void 0 && (r = !1),
        o === void 0 && (o = !1),
        Vr(this, void 0, void 0, function () {
          var i;
          return Wr(this, function (s) {
            return (
              (i = { doctype: t, filters: [] }),
              r && (i.cache = r),
              o && (i.debug = o),
              n && (i.filters = n ? JSON.stringify(n) : void 0),
              [
                2,
                this.axios
                  .get("/api/method/frappe.client.get_count", { params: i })
                  .then(function (a) {
                    return a.data.message;
                  })
                  .catch(function (a) {
                    var l, u;
                    throw qe(qe({}, a.response.data), {
                      httpStatus: a.response.status,
                      httpStatusText: a.response.statusText,
                      message: "There was an error while getting the count.",
                      exception:
                        (u =
                          (l = a.response.data.exception) !== null && l !== void 0 ? l : a.response.data.exc_type) !==
                          null && u !== void 0
                          ? u
                          : "",
                    });
                  }),
              ]
            );
          });
        })
      );
    }),
    (e.prototype.getLastDoc = function (t, n) {
      return Vr(this, void 0, void 0, function () {
        var r, o;
        return Wr(this, function (i) {
          switch (i.label) {
            case 0:
              return (
                (r = { orderBy: { field: "creation", order: "desc" } }),
                n && (r = qe(qe({}, r), n)),
                [4, this.getDocList(t, qe(qe({}, r), { limit: 1, fields: ["name"] }))]
              );
            case 1:
              return (o = i.sent()), o.length > 0 ? [2, this.getDoc(t, o[0].name)] : [2, {}];
          }
        });
      });
    }),
    e
  );
})();
Us.FrappeDB = ek;
var Bs = {},
  uo = {};
function lw(e, t) {
  return function () {
    return e.apply(t, arguments);
  };
}
const { toString: tk } = Object.prototype,
  { getPrototypeOf: Pp } = Object,
  wu = ((e) => (t) => {
    const n = tk.call(t);
    return e[n] || (e[n] = n.slice(8, -1).toLowerCase());
  })(Object.create(null)),
  On = (e) => ((e = e.toLowerCase()), (t) => wu(t) === e),
  xu = (e) => (t) => typeof t === e,
  { isArray: yi } = Array,
  _s = xu("undefined");
function nk(e) {
  return (
    e !== null &&
    !_s(e) &&
    e.constructor !== null &&
    !_s(e.constructor) &&
    Jt(e.constructor.isBuffer) &&
    e.constructor.isBuffer(e)
  );
}
const uw = On("ArrayBuffer");
function rk(e) {
  let t;
  return (
    typeof ArrayBuffer < "u" && ArrayBuffer.isView ? (t = ArrayBuffer.isView(e)) : (t = e && e.buffer && uw(e.buffer)),
    t
  );
}
const ok = xu("string"),
  Jt = xu("function"),
  cw = xu("number"),
  Su = (e) => e !== null && typeof e == "object",
  ik = (e) => e === !0 || e === !1,
  nl = (e) => {
    if (wu(e) !== "object") return !1;
    const t = Pp(e);
    return (
      (t === null || t === Object.prototype || Object.getPrototypeOf(t) === null) &&
      !(Symbol.toStringTag in e) &&
      !(Symbol.iterator in e)
    );
  },
  sk = On("Date"),
  ak = On("File"),
  lk = On("Blob"),
  uk = On("FileList"),
  ck = (e) => Su(e) && Jt(e.pipe),
  fk = (e) => {
    let t;
    return (
      e &&
      ((typeof FormData == "function" && e instanceof FormData) ||
        (Jt(e.append) &&
          ((t = wu(e)) === "formdata" || (t === "object" && Jt(e.toString) && e.toString() === "[object FormData]"))))
    );
  },
  dk = On("URLSearchParams"),
  pk = (e) => (e.trim ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""));
function Vs(e, t, { allOwnKeys: n = !1 } = {}) {
  if (e === null || typeof e > "u") return;
  let r, o;
  if ((typeof e != "object" && (e = [e]), yi(e))) for (r = 0, o = e.length; r < o; r++) t.call(null, e[r], r, e);
  else {
    const i = n ? Object.getOwnPropertyNames(e) : Object.keys(e),
      s = i.length;
    let a;
    for (r = 0; r < s; r++) (a = i[r]), t.call(null, e[a], a, e);
  }
}
function fw(e, t) {
  t = t.toLowerCase();
  const n = Object.keys(e);
  let r = n.length,
    o;
  for (; r-- > 0; ) if (((o = n[r]), t === o.toLowerCase())) return o;
  return null;
}
const dw = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : ve,
  pw = (e) => !_s(e) && e !== dw;
function Xf() {
  const { caseless: e } = (pw(this) && this) || {},
    t = {},
    n = (r, o) => {
      const i = (e && fw(t, o)) || o;
      nl(t[i]) && nl(r) ? (t[i] = Xf(t[i], r)) : nl(r) ? (t[i] = Xf({}, r)) : yi(r) ? (t[i] = r.slice()) : (t[i] = r);
    };
  for (let r = 0, o = arguments.length; r < o; r++) arguments[r] && Vs(arguments[r], n);
  return t;
}
const hk = (e, t, n, { allOwnKeys: r } = {}) => (
    Vs(
      t,
      (o, i) => {
        n && Jt(o) ? (e[i] = lw(o, n)) : (e[i] = o);
      },
      { allOwnKeys: r }
    ),
    e
  ),
  mk = (e) => (e.charCodeAt(0) === 65279 && (e = e.slice(1)), e),
  gk = (e, t, n, r) => {
    (e.prototype = Object.create(t.prototype, r)),
      (e.prototype.constructor = e),
      Object.defineProperty(e, "super", { value: t.prototype }),
      n && Object.assign(e.prototype, n);
  },
  yk = (e, t, n, r) => {
    let o, i, s;
    const a = {};
    if (((t = t || {}), e == null)) return t;
    do {
      for (o = Object.getOwnPropertyNames(e), i = o.length; i-- > 0; )
        (s = o[i]), (!r || r(s, e, t)) && !a[s] && ((t[s] = e[s]), (a[s] = !0));
      e = n !== !1 && Pp(e);
    } while (e && (!n || n(e, t)) && e !== Object.prototype);
    return t;
  },
  vk = (e, t, n) => {
    (e = String(e)), (n === void 0 || n > e.length) && (n = e.length), (n -= t.length);
    const r = e.indexOf(t, n);
    return r !== -1 && r === n;
  },
  wk = (e) => {
    if (!e) return null;
    if (yi(e)) return e;
    let t = e.length;
    if (!cw(t)) return null;
    const n = new Array(t);
    for (; t-- > 0; ) n[t] = e[t];
    return n;
  },
  xk = (
    (e) => (t) =>
      e && t instanceof e
  )(typeof Uint8Array < "u" && Pp(Uint8Array)),
  Sk = (e, t) => {
    const n = (e && e[Symbol.iterator]).call(e);
    let r;
    for (; (r = n.next()) && !r.done; ) {
      const o = r.value;
      t.call(e, o[0], o[1]);
    }
  },
  Ek = (e, t) => {
    let n;
    const r = [];
    for (; (n = e.exec(t)) !== null; ) r.push(n);
    return r;
  },
  Ck = On("HTMLFormElement"),
  bk = (e) =>
    e.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function (t, n, r) {
      return n.toUpperCase() + r;
    }),
  Ym = (
    ({ hasOwnProperty: e }) =>
    (t, n) =>
      e.call(t, n)
  )(Object.prototype),
  kk = On("RegExp"),
  hw = (e, t) => {
    const n = Object.getOwnPropertyDescriptors(e),
      r = {};
    Vs(n, (o, i) => {
      let s;
      (s = t(o, i, e)) !== !1 && (r[i] = s || o);
    }),
      Object.defineProperties(e, r);
  },
  _k = (e) => {
    hw(e, (t, n) => {
      if (Jt(e) && ["arguments", "caller", "callee"].indexOf(n) !== -1) return !1;
      const r = e[n];
      if (Jt(r)) {
        if (((t.enumerable = !1), "writable" in t)) {
          t.writable = !1;
          return;
        }
        t.set ||
          (t.set = () => {
            throw Error("Can not rewrite read-only method '" + n + "'");
          });
      }
    });
  },
  Tk = (e, t) => {
    const n = {},
      r = (o) => {
        o.forEach((i) => {
          n[i] = !0;
        });
      };
    return yi(e) ? r(e) : r(String(e).split(t)), n;
  },
  Rk = () => {},
  Pk = (e, t) => ((e = +e), Number.isFinite(e) ? e : t),
  kc = "abcdefghijklmnopqrstuvwxyz",
  Xm = "0123456789",
  mw = { DIGIT: Xm, ALPHA: kc, ALPHA_DIGIT: kc + kc.toUpperCase() + Xm },
  Ok = (e = 16, t = mw.ALPHA_DIGIT) => {
    let n = "";
    const { length: r } = t;
    for (; e--; ) n += t[(Math.random() * r) | 0];
    return n;
  };
function Ak(e) {
  return !!(e && Jt(e.append) && e[Symbol.toStringTag] === "FormData" && e[Symbol.iterator]);
}
const Nk = (e) => {
    const t = new Array(10),
      n = (r, o) => {
        if (Su(r)) {
          if (t.indexOf(r) >= 0) return;
          if (!("toJSON" in r)) {
            t[o] = r;
            const i = yi(r) ? [] : {};
            return (
              Vs(r, (s, a) => {
                const l = n(s, o + 1);
                !_s(l) && (i[a] = l);
              }),
              (t[o] = void 0),
              i
            );
          }
        }
        return r;
      };
    return n(e, 0);
  },
  Lk = On("AsyncFunction"),
  Dk = (e) => e && (Su(e) || Jt(e)) && Jt(e.then) && Jt(e.catch);
var L = {
  isArray: yi,
  isArrayBuffer: uw,
  isBuffer: nk,
  isFormData: fk,
  isArrayBufferView: rk,
  isString: ok,
  isNumber: cw,
  isBoolean: ik,
  isObject: Su,
  isPlainObject: nl,
  isUndefined: _s,
  isDate: sk,
  isFile: ak,
  isBlob: lk,
  isRegExp: kk,
  isFunction: Jt,
  isStream: ck,
  isURLSearchParams: dk,
  isTypedArray: xk,
  isFileList: uk,
  forEach: Vs,
  merge: Xf,
  extend: hk,
  trim: pk,
  stripBOM: mk,
  inherits: gk,
  toFlatObject: yk,
  kindOf: wu,
  kindOfTest: On,
  endsWith: vk,
  toArray: wk,
  forEachEntry: Sk,
  matchAll: Ek,
  isHTMLForm: Ck,
  hasOwnProperty: Ym,
  hasOwnProp: Ym,
  reduceDescriptors: hw,
  freezeMethods: _k,
  toObjectSet: Tk,
  toCamelCase: bk,
  noop: Rk,
  toFiniteNumber: Pk,
  findKey: fw,
  global: dw,
  isContextDefined: pw,
  ALPHABET: mw,
  generateString: Ok,
  isSpecCompliantForm: Ak,
  toJSONObject: Nk,
  isAsyncFn: Lk,
  isThenable: Dk,
};
function de(e, t, n, r, o) {
  Error.call(this),
    Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : (this.stack = new Error().stack),
    (this.message = e),
    (this.name = "AxiosError"),
    t && (this.code = t),
    n && (this.config = n),
    r && (this.request = r),
    o && (this.response = o);
}
L.inherits(de, Error, {
  toJSON: function () {
    return {
      message: this.message,
      name: this.name,
      description: this.description,
      number: this.number,
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      config: L.toJSONObject(this.config),
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null,
    };
  },
});
const gw = de.prototype,
  yw = {};
[
  "ERR_BAD_OPTION_VALUE",
  "ERR_BAD_OPTION",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED",
  "ERR_NOT_SUPPORT",
  "ERR_INVALID_URL",
].forEach((e) => {
  yw[e] = { value: e };
});
Object.defineProperties(de, yw);
Object.defineProperty(gw, "isAxiosError", { value: !0 });
de.from = (e, t, n, r, o, i) => {
  const s = Object.create(gw);
  return (
    L.toFlatObject(
      e,
      s,
      function (a) {
        return a !== Error.prototype;
      },
      (a) => a !== "isAxiosError"
    ),
    de.call(s, e.message, t, n, r, o),
    (s.cause = e),
    (s.name = e.name),
    i && Object.assign(s, i),
    s
  );
};
var Mk = null;
function Jf(e) {
  return L.isPlainObject(e) || L.isArray(e);
}
function vw(e) {
  return L.endsWith(e, "[]") ? e.slice(0, -2) : e;
}
function Jm(e, t, n) {
  return e
    ? e
        .concat(t)
        .map(function (r, o) {
          return (r = vw(r)), !n && o ? "[" + r + "]" : r;
        })
        .join(n ? "." : "")
    : t;
}
function jk(e) {
  return L.isArray(e) && !e.some(Jf);
}
const Fk = L.toFlatObject(L, {}, null, function (e) {
  return /^is[A-Z]/.test(e);
});
function Eu(e, t, n) {
  if (!L.isObject(e)) throw new TypeError("target must be an object");
  (t = t || new FormData()),
    (n = L.toFlatObject(n, { metaTokens: !0, dots: !1, indexes: !1 }, !1, function (v, m) {
      return !L.isUndefined(m[v]);
    }));
  const r = n.metaTokens,
    o = n.visitor || u,
    i = n.dots,
    s = n.indexes,
    a = (n.Blob || (typeof Blob < "u" && Blob)) && L.isSpecCompliantForm(t);
  if (!L.isFunction(o)) throw new TypeError("visitor must be a function");
  function l(v) {
    if (v === null) return "";
    if (L.isDate(v)) return v.toISOString();
    if (!a && L.isBlob(v)) throw new de("Blob is not supported. Use a Buffer instead.");
    return L.isArrayBuffer(v) || L.isTypedArray(v)
      ? a && typeof Blob == "function"
        ? new Blob([v])
        : Buffer.from(v)
      : v;
  }
  function u(v, m, y) {
    let x = v;
    if (v && !y && typeof v == "object") {
      if (L.endsWith(m, "{}")) (m = r ? m : m.slice(0, -2)), (v = JSON.stringify(v));
      else if ((L.isArray(v) && jk(v)) || ((L.isFileList(v) || L.endsWith(m, "[]")) && (x = L.toArray(v))))
        return (
          (m = vw(m)),
          x.forEach(function (p, g) {
            !(L.isUndefined(p) || p === null) && t.append(s === !0 ? Jm([m], g, i) : s === null ? m : m + "[]", l(p));
          }),
          !1
        );
    }
    return Jf(v) ? !0 : (t.append(Jm(y, m, i), l(v)), !1);
  }
  const c = [],
    f = Object.assign(Fk, { defaultVisitor: u, convertValue: l, isVisitable: Jf });
  function d(v, m) {
    if (!L.isUndefined(v)) {
      if (c.indexOf(v) !== -1) throw Error("Circular reference detected in " + m.join("."));
      c.push(v),
        L.forEach(v, function (y, x) {
          (!(L.isUndefined(y) || y === null) && o.call(t, y, L.isString(x) ? x.trim() : x, m, f)) === !0 &&
            d(y, m ? m.concat(x) : [x]);
        }),
        c.pop();
    }
  }
  if (!L.isObject(e)) throw new TypeError("data must be an object");
  return d(e), t;
}
function Zm(e) {
  const t = { "!": "%21", "'": "%27", "(": "%28", ")": "%29", "~": "%7E", "%20": "+", "%00": "\0" };
  return encodeURIComponent(e).replace(/[!'()~]|%20|%00/g, function (n) {
    return t[n];
  });
}
function Op(e, t) {
  (this._pairs = []), e && Eu(e, this, t);
}
const ww = Op.prototype;
ww.append = function (e, t) {
  this._pairs.push([e, t]);
};
ww.toString = function (e) {
  const t = e
    ? function (n) {
        return e.call(this, n, Zm);
      }
    : Zm;
  return this._pairs
    .map(function (n) {
      return t(n[0]) + "=" + t(n[1]);
    }, "")
    .join("&");
};
function Ik(e) {
  return encodeURIComponent(e)
    .replace(/%3A/gi, ":")
    .replace(/%24/g, "$")
    .replace(/%2C/gi, ",")
    .replace(/%20/g, "+")
    .replace(/%5B/gi, "[")
    .replace(/%5D/gi, "]");
}
function xw(e, t, n) {
  if (!t) return e;
  const r = (n && n.encode) || Ik,
    o = n && n.serialize;
  let i;
  if ((o ? (i = o(t, n)) : (i = L.isURLSearchParams(t) ? t.toString() : new Op(t, n).toString(r)), i)) {
    const s = e.indexOf("#");
    s !== -1 && (e = e.slice(0, s)), (e += (e.indexOf("?") === -1 ? "?" : "&") + i);
  }
  return e;
}
class $k {
  constructor() {
    this.handlers = [];
  }
  use(t, n, r) {
    return (
      this.handlers.push({
        fulfilled: t,
        rejected: n,
        synchronous: r ? r.synchronous : !1,
        runWhen: r ? r.runWhen : null,
      }),
      this.handlers.length - 1
    );
  }
  eject(t) {
    this.handlers[t] && (this.handlers[t] = null);
  }
  clear() {
    this.handlers && (this.handlers = []);
  }
  forEach(t) {
    L.forEach(this.handlers, function (n) {
      n !== null && t(n);
    });
  }
}
var eg = $k,
  Sw = { silentJSONParsing: !0, forcedJSONParsing: !0, clarifyTimeoutError: !1 },
  zk = typeof URLSearchParams < "u" ? URLSearchParams : Op,
  Uk = typeof FormData < "u" ? FormData : null,
  Bk = typeof Blob < "u" ? Blob : null,
  Vk = {
    isBrowser: !0,
    classes: { URLSearchParams: zk, FormData: Uk, Blob: Bk },
    protocols: ["http", "https", "file", "blob", "url", "data"],
  };
const Ew = typeof window < "u" && typeof document < "u",
  Wk = ((e) => Ew && ["ReactNative", "NativeScript", "NS"].indexOf(e) < 0)(typeof navigator < "u" && navigator.product),
  Hk = typeof WorkerGlobalScope < "u" && self instanceof WorkerGlobalScope && typeof self.importScripts == "function";
var Kk = Object.freeze({
    __proto__: null,
    hasBrowserEnv: Ew,
    hasStandardBrowserWebWorkerEnv: Hk,
    hasStandardBrowserEnv: Wk,
  }),
  Sn = T(T({}, Kk), Vk);
function qk(e, t) {
  return Eu(
    e,
    new Sn.classes.URLSearchParams(),
    Object.assign(
      {
        visitor: function (n, r, o, i) {
          return Sn.isNode && L.isBuffer(n)
            ? (this.append(r, n.toString("base64")), !1)
            : i.defaultVisitor.apply(this, arguments);
        },
      },
      t
    )
  );
}
function Gk(e) {
  return L.matchAll(/\w+|\[(\w*)]/g, e).map((t) => (t[0] === "[]" ? "" : t[1] || t[0]));
}
function Qk(e) {
  const t = {},
    n = Object.keys(e);
  let r;
  const o = n.length;
  let i;
  for (r = 0; r < o; r++) (i = n[r]), (t[i] = e[i]);
  return t;
}
function Cw(e) {
  function t(n, r, o, i) {
    let s = n[i++];
    if (s === "__proto__") return !0;
    const a = Number.isFinite(+s),
      l = i >= n.length;
    return (
      (s = !s && L.isArray(o) ? o.length : s),
      l
        ? (L.hasOwnProp(o, s) ? (o[s] = [o[s], r]) : (o[s] = r), !a)
        : ((!o[s] || !L.isObject(o[s])) && (o[s] = []), t(n, r, o[s], i) && L.isArray(o[s]) && (o[s] = Qk(o[s])), !a)
    );
  }
  if (L.isFormData(e) && L.isFunction(e.entries)) {
    const n = {};
    return (
      L.forEachEntry(e, (r, o) => {
        t(Gk(r), o, n, 0);
      }),
      n
    );
  }
  return null;
}
function Yk(e, t, n) {
  if (L.isString(e))
    try {
      return (t || JSON.parse)(e), L.trim(e);
    } catch (r) {
      if (r.name !== "SyntaxError") throw r;
    }
  return (0, JSON.stringify)(e);
}
const Ap = {
  transitional: Sw,
  adapter: ["xhr", "http"],
  transformRequest: [
    function (e, t) {
      const n = t.getContentType() || "",
        r = n.indexOf("application/json") > -1,
        o = L.isObject(e);
      if ((o && L.isHTMLForm(e) && (e = new FormData(e)), L.isFormData(e))) return r ? JSON.stringify(Cw(e)) : e;
      if (L.isArrayBuffer(e) || L.isBuffer(e) || L.isStream(e) || L.isFile(e) || L.isBlob(e)) return e;
      if (L.isArrayBufferView(e)) return e.buffer;
      if (L.isURLSearchParams(e))
        return t.setContentType("application/x-www-form-urlencoded;charset=utf-8", !1), e.toString();
      let i;
      if (o) {
        if (n.indexOf("application/x-www-form-urlencoded") > -1) return qk(e, this.formSerializer).toString();
        if ((i = L.isFileList(e)) || n.indexOf("multipart/form-data") > -1) {
          const s = this.env && this.env.FormData;
          return Eu(i ? { "files[]": e } : e, s && new s(), this.formSerializer);
        }
      }
      return o || r ? (t.setContentType("application/json", !1), Yk(e)) : e;
    },
  ],
  transformResponse: [
    function (e) {
      const t = this.transitional || Ap.transitional,
        n = t && t.forcedJSONParsing,
        r = this.responseType === "json";
      if (e && L.isString(e) && ((n && !this.responseType) || r)) {
        const o = !(t && t.silentJSONParsing) && r;
        try {
          return JSON.parse(e);
        } catch (i) {
          if (o) throw i.name === "SyntaxError" ? de.from(i, de.ERR_BAD_RESPONSE, this, null, this.response) : i;
        }
      }
      return e;
    },
  ],
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: { FormData: Sn.classes.FormData, Blob: Sn.classes.Blob },
  validateStatus: function (e) {
    return e >= 200 && e < 300;
  },
  headers: { common: { Accept: "application/json, text/plain, */*", "Content-Type": void 0 } },
};
L.forEach(["delete", "get", "head", "post", "put", "patch"], (e) => {
  Ap.headers[e] = {};
});
var Np = Ap;
const Xk = L.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent",
]);
var Jk = (e) => {
  const t = {};
  let n, r, o;
  return (
    e &&
      e
        .split(
          `
`
        )
        .forEach(function (i) {
          (o = i.indexOf(":")),
            (n = i.substring(0, o).trim().toLowerCase()),
            (r = i.substring(o + 1).trim()),
            !(!n || (t[n] && Xk[n])) &&
              (n === "set-cookie" ? (t[n] ? t[n].push(r) : (t[n] = [r])) : (t[n] = t[n] ? t[n] + ", " + r : r));
        }),
    t
  );
};
const tg = Symbol("internals");
function Fi(e) {
  return e && String(e).trim().toLowerCase();
}
function rl(e) {
  return e === !1 || e == null ? e : L.isArray(e) ? e.map(rl) : String(e);
}
function Zk(e) {
  const t = Object.create(null),
    n = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let r;
  for (; (r = n.exec(e)); ) t[r[1]] = r[2];
  return t;
}
const e_ = (e) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(e.trim());
function _c(e, t, n, r, o) {
  if (L.isFunction(r)) return r.call(this, t, n);
  if ((o && (t = n), !!L.isString(t))) {
    if (L.isString(r)) return t.indexOf(r) !== -1;
    if (L.isRegExp(r)) return r.test(t);
  }
}
function t_(e) {
  return e
    .trim()
    .toLowerCase()
    .replace(/([a-z\d])(\w*)/g, (t, n, r) => n.toUpperCase() + r);
}
function n_(e, t) {
  const n = L.toCamelCase(" " + t);
  ["get", "set", "has"].forEach((r) => {
    Object.defineProperty(e, r + n, {
      value: function (o, i, s) {
        return this[r].call(this, t, o, i, s);
      },
      configurable: !0,
    });
  });
}
class Cu {
  constructor(t) {
    t && this.set(t);
  }
  set(t, n, r) {
    const o = this;
    function i(a, l, u) {
      const c = Fi(l);
      if (!c) throw new Error("header name must be a non-empty string");
      const f = L.findKey(o, c);
      (!f || o[f] === void 0 || u === !0 || (u === void 0 && o[f] !== !1)) && (o[f || l] = rl(a));
    }
    const s = (a, l) => L.forEach(a, (u, c) => i(u, c, l));
    return (
      L.isPlainObject(t) || t instanceof this.constructor
        ? s(t, n)
        : L.isString(t) && (t = t.trim()) && !e_(t)
        ? s(Jk(t), n)
        : t != null && i(n, t, r),
      this
    );
  }
  get(t, n) {
    if (((t = Fi(t)), t)) {
      const r = L.findKey(this, t);
      if (r) {
        const o = this[r];
        if (!n) return o;
        if (n === !0) return Zk(o);
        if (L.isFunction(n)) return n.call(this, o, r);
        if (L.isRegExp(n)) return n.exec(o);
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(t, n) {
    if (((t = Fi(t)), t)) {
      const r = L.findKey(this, t);
      return !!(r && this[r] !== void 0 && (!n || _c(this, this[r], r, n)));
    }
    return !1;
  }
  delete(t, n) {
    const r = this;
    let o = !1;
    function i(s) {
      if (((s = Fi(s)), s)) {
        const a = L.findKey(r, s);
        a && (!n || _c(r, r[a], a, n)) && (delete r[a], (o = !0));
      }
    }
    return L.isArray(t) ? t.forEach(i) : i(t), o;
  }
  clear(t) {
    const n = Object.keys(this);
    let r = n.length,
      o = !1;
    for (; r--; ) {
      const i = n[r];
      (!t || _c(this, this[i], i, t, !0)) && (delete this[i], (o = !0));
    }
    return o;
  }
  normalize(t) {
    const n = this,
      r = {};
    return (
      L.forEach(this, (o, i) => {
        const s = L.findKey(r, i);
        if (s) {
          (n[s] = rl(o)), delete n[i];
          return;
        }
        const a = t ? t_(i) : String(i).trim();
        a !== i && delete n[i], (n[a] = rl(o)), (r[a] = !0);
      }),
      this
    );
  }
  concat(...t) {
    return this.constructor.concat(this, ...t);
  }
  toJSON(t) {
    const n = Object.create(null);
    return (
      L.forEach(this, (r, o) => {
        r != null && r !== !1 && (n[o] = t && L.isArray(r) ? r.join(", ") : r);
      }),
      n
    );
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([t, n]) => t + ": " + n).join(`
`);
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(t) {
    return t instanceof this ? t : new this(t);
  }
  static concat(t, ...n) {
    const r = new this(t);
    return n.forEach((o) => r.set(o)), r;
  }
  static accessor(t) {
    const n = (this[tg] = this[tg] = { accessors: {} }).accessors,
      r = this.prototype;
    function o(i) {
      const s = Fi(i);
      n[s] || (n_(r, i), (n[s] = !0));
    }
    return L.isArray(t) ? t.forEach(o) : o(t), this;
  }
}
Cu.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]);
L.reduceDescriptors(Cu.prototype, ({ value: e }, t) => {
  let n = t[0].toUpperCase() + t.slice(1);
  return {
    get: () => e,
    set(r) {
      this[n] = r;
    },
  };
});
L.freezeMethods(Cu);
var Bn = Cu;
function Tc(e, t) {
  const n = this || Np,
    r = t || n,
    o = Bn.from(r.headers);
  let i = r.data;
  return (
    L.forEach(e, function (s) {
      i = s.call(n, i, o.normalize(), t ? t.status : void 0);
    }),
    o.normalize(),
    i
  );
}
function bw(e) {
  return !!(e && e.__CANCEL__);
}
function Ws(e, t, n) {
  de.call(this, e == null ? "canceled" : e, de.ERR_CANCELED, t, n), (this.name = "CanceledError");
}
L.inherits(Ws, de, { __CANCEL__: !0 });
function r_(e, t, n) {
  const r = n.config.validateStatus;
  !n.status || !r || r(n.status)
    ? e(n)
    : t(
        new de(
          "Request failed with status code " + n.status,
          [de.ERR_BAD_REQUEST, de.ERR_BAD_RESPONSE][Math.floor(n.status / 100) - 4],
          n.config,
          n.request,
          n
        )
      );
}
var o_ = Sn.hasStandardBrowserEnv
  ? {
      write(e, t, n, r, o, i) {
        const s = [e + "=" + encodeURIComponent(t)];
        L.isNumber(n) && s.push("expires=" + new Date(n).toGMTString()),
          L.isString(r) && s.push("path=" + r),
          L.isString(o) && s.push("domain=" + o),
          i === !0 && s.push("secure"),
          (document.cookie = s.join("; "));
      },
      read(e) {
        const t = document.cookie.match(new RegExp("(^|;\\s*)(" + e + ")=([^;]*)"));
        return t ? decodeURIComponent(t[3]) : null;
      },
      remove(e) {
        this.write(e, "", Date.now() - 864e5);
      },
    }
  : {
      write() {},
      read() {
        return null;
      },
      remove() {},
    };
function i_(e) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(e);
}
function s_(e, t) {
  return t ? e.replace(/\/?\/$/, "") + "/" + t.replace(/^\/+/, "") : e;
}
function kw(e, t) {
  return e && !i_(t) ? s_(e, t) : t;
}
var a_ = Sn.hasStandardBrowserEnv
  ? (function () {
      const e = /(msie|trident)/i.test(navigator.userAgent),
        t = document.createElement("a");
      let n;
      function r(o) {
        let i = o;
        return (
          e && (t.setAttribute("href", i), (i = t.href)),
          t.setAttribute("href", i),
          {
            href: t.href,
            protocol: t.protocol ? t.protocol.replace(/:$/, "") : "",
            host: t.host,
            search: t.search ? t.search.replace(/^\?/, "") : "",
            hash: t.hash ? t.hash.replace(/^#/, "") : "",
            hostname: t.hostname,
            port: t.port,
            pathname: t.pathname.charAt(0) === "/" ? t.pathname : "/" + t.pathname,
          }
        );
      }
      return (
        (n = r(window.location.href)),
        function (o) {
          const i = L.isString(o) ? r(o) : o;
          return i.protocol === n.protocol && i.host === n.host;
        }
      );
    })()
  : (function () {
      return function () {
        return !0;
      };
    })();
function l_(e) {
  const t = /^([-+\w]{1,25})(:?\/\/|:)/.exec(e);
  return (t && t[1]) || "";
}
function u_(e, t) {
  e = e || 10;
  const n = new Array(e),
    r = new Array(e);
  let o = 0,
    i = 0,
    s;
  return (
    (t = t !== void 0 ? t : 1e3),
    function (a) {
      const l = Date.now(),
        u = r[i];
      s || (s = l), (n[o] = a), (r[o] = l);
      let c = i,
        f = 0;
      for (; c !== o; ) (f += n[c++]), (c = c % e);
      if (((o = (o + 1) % e), o === i && (i = (i + 1) % e), l - s < t)) return;
      const d = u && l - u;
      return d ? Math.round((f * 1e3) / d) : void 0;
    }
  );
}
function ng(e, t) {
  let n = 0;
  const r = u_(50, 250);
  return (o) => {
    const i = o.loaded,
      s = o.lengthComputable ? o.total : void 0,
      a = i - n,
      l = r(a),
      u = i <= s;
    n = i;
    const c = {
      loaded: i,
      total: s,
      progress: s ? i / s : void 0,
      bytes: a,
      rate: l || void 0,
      estimated: l && s && u ? (s - i) / l : void 0,
      event: o,
    };
    (c[t ? "download" : "upload"] = !0), e(c);
  };
}
const c_ = typeof XMLHttpRequest < "u";
var f_ =
  c_ &&
  function (e) {
    return new Promise(function (t, n) {
      let r = e.data;
      const o = Bn.from(e.headers).normalize();
      let { responseType: i, withXSRFToken: s } = e,
        a;
      function l() {
        e.cancelToken && e.cancelToken.unsubscribe(a), e.signal && e.signal.removeEventListener("abort", a);
      }
      let u;
      if (L.isFormData(r)) {
        if (Sn.hasStandardBrowserEnv || Sn.hasStandardBrowserWebWorkerEnv) o.setContentType(!1);
        else if ((u = o.getContentType()) !== !1) {
          const [m, ...y] = u
            ? u
                .split(";")
                .map((x) => x.trim())
                .filter(Boolean)
            : [];
          o.setContentType([m || "multipart/form-data", ...y].join("; "));
        }
      }
      let c = new XMLHttpRequest();
      if (e.auth) {
        const m = e.auth.username || "",
          y = e.auth.password ? unescape(encodeURIComponent(e.auth.password)) : "";
        o.set("Authorization", "Basic " + btoa(m + ":" + y));
      }
      const f = kw(e.baseURL, e.url);
      c.open(e.method.toUpperCase(), xw(f, e.params, e.paramsSerializer), !0), (c.timeout = e.timeout);
      function d() {
        if (!c) return;
        const m = Bn.from("getAllResponseHeaders" in c && c.getAllResponseHeaders()),
          y = {
            data: !i || i === "text" || i === "json" ? c.responseText : c.response,
            status: c.status,
            statusText: c.statusText,
            headers: m,
            config: e,
            request: c,
          };
        r_(
          function (x) {
            t(x), l();
          },
          function (x) {
            n(x), l();
          },
          y
        ),
          (c = null);
      }
      if (
        ("onloadend" in c
          ? (c.onloadend = d)
          : (c.onreadystatechange = function () {
              !c ||
                c.readyState !== 4 ||
                (c.status === 0 && !(c.responseURL && c.responseURL.indexOf("file:") === 0)) ||
                setTimeout(d);
            }),
        (c.onabort = function () {
          !c || (n(new de("Request aborted", de.ECONNABORTED, e, c)), (c = null));
        }),
        (c.onerror = function () {
          n(new de("Network Error", de.ERR_NETWORK, e, c)), (c = null);
        }),
        (c.ontimeout = function () {
          let m = e.timeout ? "timeout of " + e.timeout + "ms exceeded" : "timeout exceeded";
          const y = e.transitional || Sw;
          e.timeoutErrorMessage && (m = e.timeoutErrorMessage),
            n(new de(m, y.clarifyTimeoutError ? de.ETIMEDOUT : de.ECONNABORTED, e, c)),
            (c = null);
        }),
        Sn.hasStandardBrowserEnv && (s && L.isFunction(s) && (s = s(e)), s || (s !== !1 && a_(f))))
      ) {
        const m = e.xsrfHeaderName && e.xsrfCookieName && o_.read(e.xsrfCookieName);
        m && o.set(e.xsrfHeaderName, m);
      }
      r === void 0 && o.setContentType(null),
        "setRequestHeader" in c &&
          L.forEach(o.toJSON(), function (m, y) {
            c.setRequestHeader(y, m);
          }),
        L.isUndefined(e.withCredentials) || (c.withCredentials = !!e.withCredentials),
        i && i !== "json" && (c.responseType = e.responseType),
        typeof e.onDownloadProgress == "function" && c.addEventListener("progress", ng(e.onDownloadProgress, !0)),
        typeof e.onUploadProgress == "function" &&
          c.upload &&
          c.upload.addEventListener("progress", ng(e.onUploadProgress)),
        (e.cancelToken || e.signal) &&
          ((a = (m) => {
            !c || (n(!m || m.type ? new Ws(null, e, c) : m), c.abort(), (c = null));
          }),
          e.cancelToken && e.cancelToken.subscribe(a),
          e.signal && (e.signal.aborted ? a() : e.signal.addEventListener("abort", a)));
      const v = l_(f);
      if (v && Sn.protocols.indexOf(v) === -1) {
        n(new de("Unsupported protocol " + v + ":", de.ERR_BAD_REQUEST, e));
        return;
      }
      c.send(r || null);
    });
  };
const Zf = { http: Mk, xhr: f_ };
L.forEach(Zf, (e, t) => {
  if (e) {
    try {
      Object.defineProperty(e, "name", { value: t });
    } catch (n) {}
    Object.defineProperty(e, "adapterName", { value: t });
  }
});
const rg = (e) => `- ${e}`,
  d_ = (e) => L.isFunction(e) || e === null || e === !1;
var _w = {
  getAdapter: (e) => {
    e = L.isArray(e) ? e : [e];
    const { length: t } = e;
    let n, r;
    const o = {};
    for (let i = 0; i < t; i++) {
      n = e[i];
      let s;
      if (((r = n), !d_(n) && ((r = Zf[(s = String(n)).toLowerCase()]), r === void 0)))
        throw new de(`Unknown adapter '${s}'`);
      if (r) break;
      o[s || "#" + i] = r;
    }
    if (!r) {
      const i = Object.entries(o).map(
        ([a, l]) =>
          `adapter ${a} ` + (l === !1 ? "is not supported by the environment" : "is not available in the build")
      );
      let s = t
        ? i.length > 1
          ? `since :
` +
            i.map(rg).join(`
`)
          : " " + rg(i[0])
        : "as no adapter specified";
      throw new de("There is no suitable adapter to dispatch the request " + s, "ERR_NOT_SUPPORT");
    }
    return r;
  },
  adapters: Zf,
};
function Rc(e) {
  if ((e.cancelToken && e.cancelToken.throwIfRequested(), e.signal && e.signal.aborted)) throw new Ws(null, e);
}
function og(e) {
  return (
    Rc(e),
    (e.headers = Bn.from(e.headers)),
    (e.data = Tc.call(e, e.transformRequest)),
    ["post", "put", "patch"].indexOf(e.method) !== -1 &&
      e.headers.setContentType("application/x-www-form-urlencoded", !1),
    _w
      .getAdapter(e.adapter || Np.adapter)(e)
      .then(
        function (t) {
          return Rc(e), (t.data = Tc.call(e, e.transformResponse, t)), (t.headers = Bn.from(t.headers)), t;
        },
        function (t) {
          return (
            bw(t) ||
              (Rc(e),
              t &&
                t.response &&
                ((t.response.data = Tc.call(e, e.transformResponse, t.response)),
                (t.response.headers = Bn.from(t.response.headers)))),
            Promise.reject(t)
          );
        }
      )
  );
}
const ig = (e) => (e instanceof Bn ? e.toJSON() : e);
function oi(e, t) {
  t = t || {};
  const n = {};
  function r(u, c, f) {
    return L.isPlainObject(u) && L.isPlainObject(c)
      ? L.merge.call({ caseless: f }, u, c)
      : L.isPlainObject(c)
      ? L.merge({}, c)
      : L.isArray(c)
      ? c.slice()
      : c;
  }
  function o(u, c, f) {
    if (L.isUndefined(c)) {
      if (!L.isUndefined(u)) return r(void 0, u, f);
    } else return r(u, c, f);
  }
  function i(u, c) {
    if (!L.isUndefined(c)) return r(void 0, c);
  }
  function s(u, c) {
    if (L.isUndefined(c)) {
      if (!L.isUndefined(u)) return r(void 0, u);
    } else return r(void 0, c);
  }
  function a(u, c, f) {
    if (f in t) return r(u, c);
    if (f in e) return r(void 0, u);
  }
  const l = {
    url: i,
    method: i,
    data: i,
    baseURL: s,
    transformRequest: s,
    transformResponse: s,
    paramsSerializer: s,
    timeout: s,
    timeoutMessage: s,
    withCredentials: s,
    withXSRFToken: s,
    adapter: s,
    responseType: s,
    xsrfCookieName: s,
    xsrfHeaderName: s,
    onUploadProgress: s,
    onDownloadProgress: s,
    decompress: s,
    maxContentLength: s,
    maxBodyLength: s,
    beforeRedirect: s,
    transport: s,
    httpAgent: s,
    httpsAgent: s,
    cancelToken: s,
    socketPath: s,
    responseEncoding: s,
    validateStatus: a,
    headers: (u, c) => o(ig(u), ig(c), !0),
  };
  return (
    L.forEach(Object.keys(Object.assign({}, e, t)), function (u) {
      const c = l[u] || o,
        f = c(e[u], t[u], u);
      (L.isUndefined(f) && c !== a) || (n[u] = f);
    }),
    n
  );
}
const Tw = "1.6.7",
  Lp = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((e, t) => {
  Lp[e] = function (n) {
    return typeof n === e || "a" + (t < 1 ? "n " : " ") + e;
  };
});
const sg = {};
Lp.transitional = function (e, t, n) {
  function r(o, i) {
    return "[Axios v" + Tw + "] Transitional option '" + o + "'" + i + (n ? ". " + n : "");
  }
  return (o, i, s) => {
    if (e === !1) throw new de(r(i, " has been removed" + (t ? " in " + t : "")), de.ERR_DEPRECATED);
    return (
      t &&
        !sg[i] &&
        ((sg[i] = !0),
        console.warn(r(i, " has been deprecated since v" + t + " and will be removed in the near future"))),
      e ? e(o, i, s) : !0
    );
  };
};
function p_(e, t, n) {
  if (typeof e != "object") throw new de("options must be an object", de.ERR_BAD_OPTION_VALUE);
  const r = Object.keys(e);
  let o = r.length;
  for (; o-- > 0; ) {
    const i = r[o],
      s = t[i];
    if (s) {
      const a = e[i],
        l = a === void 0 || s(a, i, e);
      if (l !== !0) throw new de("option " + i + " must be " + l, de.ERR_BAD_OPTION_VALUE);
      continue;
    }
    if (n !== !0) throw new de("Unknown option " + i, de.ERR_BAD_OPTION);
  }
}
var ed = { assertOptions: p_, validators: Lp };
const lr = ed.validators;
class Bl {
  constructor(t) {
    (this.defaults = t), (this.interceptors = { request: new eg(), response: new eg() });
  }
  request(t, n) {
    return le(this, null, function* () {
      try {
        return yield this._request(t, n);
      } catch (r) {
        if (r instanceof Error) {
          let o;
          Error.captureStackTrace ? Error.captureStackTrace((o = {})) : (o = new Error());
          const i = o.stack ? o.stack.replace(/^.+\n/, "") : "";
          r.stack
            ? i &&
              !String(r.stack).endsWith(i.replace(/^.+\n.+\n/, "")) &&
              (r.stack +=
                `
` + i)
            : (r.stack = i);
        }
        throw r;
      }
    });
  }
  _request(t, n) {
    typeof t == "string" ? ((n = n || {}), (n.url = t)) : (n = t || {}), (n = oi(this.defaults, n));
    const { transitional: r, paramsSerializer: o, headers: i } = n;
    r !== void 0 &&
      ed.assertOptions(
        r,
        {
          silentJSONParsing: lr.transitional(lr.boolean),
          forcedJSONParsing: lr.transitional(lr.boolean),
          clarifyTimeoutError: lr.transitional(lr.boolean),
        },
        !1
      ),
      o != null &&
        (L.isFunction(o)
          ? (n.paramsSerializer = { serialize: o })
          : ed.assertOptions(o, { encode: lr.function, serialize: lr.function }, !0)),
      (n.method = (n.method || this.defaults.method || "get").toLowerCase());
    let s = i && L.merge(i.common, i[n.method]);
    i &&
      L.forEach(["delete", "get", "head", "post", "put", "patch", "common"], (m) => {
        delete i[m];
      }),
      (n.headers = Bn.concat(s, i));
    const a = [];
    let l = !0;
    this.interceptors.request.forEach(function (m) {
      (typeof m.runWhen == "function" && m.runWhen(n) === !1) ||
        ((l = l && m.synchronous), a.unshift(m.fulfilled, m.rejected));
    });
    const u = [];
    this.interceptors.response.forEach(function (m) {
      u.push(m.fulfilled, m.rejected);
    });
    let c,
      f = 0,
      d;
    if (!l) {
      const m = [og.bind(this), void 0];
      for (m.unshift.apply(m, a), m.push.apply(m, u), d = m.length, c = Promise.resolve(n); f < d; )
        c = c.then(m[f++], m[f++]);
      return c;
    }
    d = a.length;
    let v = n;
    for (f = 0; f < d; ) {
      const m = a[f++],
        y = a[f++];
      try {
        v = m(v);
      } catch (x) {
        y.call(this, x);
        break;
      }
    }
    try {
      c = og.call(this, v);
    } catch (m) {
      return Promise.reject(m);
    }
    for (f = 0, d = u.length; f < d; ) c = c.then(u[f++], u[f++]);
    return c;
  }
  getUri(t) {
    t = oi(this.defaults, t);
    const n = kw(t.baseURL, t.url);
    return xw(n, t.params, t.paramsSerializer);
  }
}
L.forEach(["delete", "get", "head", "options"], function (e) {
  Bl.prototype[e] = function (t, n) {
    return this.request(oi(n || {}, { method: e, url: t, data: (n || {}).data }));
  };
});
L.forEach(["post", "put", "patch"], function (e) {
  function t(n) {
    return function (r, o, i) {
      return this.request(
        oi(i || {}, { method: e, headers: n ? { "Content-Type": "multipart/form-data" } : {}, url: r, data: o })
      );
    };
  }
  (Bl.prototype[e] = t()), (Bl.prototype[e + "Form"] = t(!0));
});
var ol = Bl;
class Dp {
  constructor(t) {
    if (typeof t != "function") throw new TypeError("executor must be a function.");
    let n;
    this.promise = new Promise(function (o) {
      n = o;
    });
    const r = this;
    this.promise.then((o) => {
      if (!r._listeners) return;
      let i = r._listeners.length;
      for (; i-- > 0; ) r._listeners[i](o);
      r._listeners = null;
    }),
      (this.promise.then = (o) => {
        let i;
        const s = new Promise((a) => {
          r.subscribe(a), (i = a);
        }).then(o);
        return (
          (s.cancel = function () {
            r.unsubscribe(i);
          }),
          s
        );
      }),
      t(function (o, i, s) {
        r.reason || ((r.reason = new Ws(o, i, s)), n(r.reason));
      });
  }
  throwIfRequested() {
    if (this.reason) throw this.reason;
  }
  subscribe(t) {
    if (this.reason) {
      t(this.reason);
      return;
    }
    this._listeners ? this._listeners.push(t) : (this._listeners = [t]);
  }
  unsubscribe(t) {
    if (!this._listeners) return;
    const n = this._listeners.indexOf(t);
    n !== -1 && this._listeners.splice(n, 1);
  }
  static source() {
    let t;
    return {
      token: new Dp(function (n) {
        t = n;
      }),
      cancel: t,
    };
  }
}
var h_ = Dp;
function m_(e) {
  return function (t) {
    return e.apply(null, t);
  };
}
function g_(e) {
  return L.isObject(e) && e.isAxiosError === !0;
}
const td = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
};
Object.entries(td).forEach(([e, t]) => {
  td[t] = e;
});
var y_ = td;
function Rw(e) {
  const t = new ol(e),
    n = lw(ol.prototype.request, t);
  return (
    L.extend(n, ol.prototype, t, { allOwnKeys: !0 }),
    L.extend(n, t, null, { allOwnKeys: !0 }),
    (n.create = function (r) {
      return Rw(oi(e, r));
    }),
    n
  );
}
const Xe = Rw(Np);
Xe.Axios = ol;
Xe.CanceledError = Ws;
Xe.CancelToken = h_;
Xe.isCancel = bw;
Xe.VERSION = Tw;
Xe.toFormData = Eu;
Xe.AxiosError = de;
Xe.Cancel = Xe.CanceledError;
Xe.all = function (e) {
  return Promise.all(e);
};
Xe.spread = m_;
Xe.isAxiosError = g_;
Xe.mergeConfig = oi;
Xe.AxiosHeaders = Bn;
Xe.formToJSON = (e) => Cw(L.isHTMLForm(e) ? new FormData(e) : e);
Xe.getAdapter = _w.getAdapter;
Xe.HttpStatusCode = y_;
Xe.default = Xe;
var v_ = Xe;
Object.defineProperty(uo, "__esModule", { value: !0 });
uo.getRequestHeaders = uo.getAxiosClient = void 0;
var w_ = v_;
function x_(e, t, n, r) {
  return w_.default.create({ baseURL: e, headers: Pw(t, r, n), withCredentials: !0 });
}
uo.getAxiosClient = x_;
function Pw(e, t, n) {
  e === void 0 && (e = !1);
  var r = { Accept: "application/json", "Content-Type": "application/json; charset=utf-8" };
  return (
    e && t && n && (r.Authorization = "".concat(t, " ").concat(n())),
    typeof window < "u" &&
      typeof document < "u" &&
      (window.location && (r["X-Frappe-Site-Name"] = window.location.hostname),
      window.csrf_token && window.csrf_token !== "{{ csrf_token }}" && (r["X-Frappe-CSRF-Token"] = window.csrf_token)),
    r
  );
}
uo.getRequestHeaders = Pw;
var Uo =
    (ve && ve.__assign) ||
    function () {
      return (
        (Uo =
          Object.assign ||
          function (e) {
            for (var t, n = 1, r = arguments.length; n < r; n++) {
              t = arguments[n];
              for (var o in t) Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);
            }
            return e;
          }),
        Uo.apply(this, arguments)
      );
    },
  S_ =
    (ve && ve.__awaiter) ||
    function (e, t, n, r) {
      function o(i) {
        return i instanceof n
          ? i
          : new n(function (s) {
              s(i);
            });
      }
      return new (n || (n = Promise))(function (i, s) {
        function a(c) {
          try {
            u(r.next(c));
          } catch (f) {
            s(f);
          }
        }
        function l(c) {
          try {
            u(r.throw(c));
          } catch (f) {
            s(f);
          }
        }
        function u(c) {
          c.done ? i(c.value) : o(c.value).then(a, l);
        }
        u((r = r.apply(e, t || [])).next());
      });
    },
  E_ =
    (ve && ve.__generator) ||
    function (e, t) {
      var n = {
          label: 0,
          sent: function () {
            if (i[0] & 1) throw i[1];
            return i[1];
          },
          trys: [],
          ops: [],
        },
        r,
        o,
        i,
        s;
      return (
        (s = { next: a(0), throw: a(1), return: a(2) }),
        typeof Symbol == "function" &&
          (s[Symbol.iterator] = function () {
            return this;
          }),
        s
      );
      function a(u) {
        return function (c) {
          return l([u, c]);
        };
      }
      function l(u) {
        if (r) throw new TypeError("Generator is already executing.");
        for (; s && ((s = 0), u[0] && (n = 0)), n; )
          try {
            if (
              ((r = 1),
              o &&
                (i = u[0] & 2 ? o.return : u[0] ? o.throw || ((i = o.return) && i.call(o), 0) : o.next) &&
                !(i = i.call(o, u[1])).done)
            )
              return i;
            switch (((o = 0), i && (u = [u[0] & 2, i.value]), u[0])) {
              case 0:
              case 1:
                i = u;
                break;
              case 4:
                return n.label++, { value: u[1], done: !1 };
              case 5:
                n.label++, (o = u[1]), (u = [0]);
                continue;
              case 7:
                (u = n.ops.pop()), n.trys.pop();
                continue;
              default:
                if (((i = n.trys), !(i = i.length > 0 && i[i.length - 1]) && (u[0] === 6 || u[0] === 2))) {
                  n = 0;
                  continue;
                }
                if (u[0] === 3 && (!i || (u[1] > i[0] && u[1] < i[3]))) {
                  n.label = u[1];
                  break;
                }
                if (u[0] === 6 && n.label < i[1]) {
                  (n.label = i[1]), (i = u);
                  break;
                }
                if (i && n.label < i[2]) {
                  (n.label = i[2]), n.ops.push(u);
                  break;
                }
                i[2] && n.ops.pop(), n.trys.pop();
                continue;
            }
            u = t.call(e, n);
          } catch (c) {
            (u = [6, c]), (o = 0);
          } finally {
            r = i = 0;
          }
        if (u[0] & 5) throw u[1];
        return { value: u[0] ? u[1] : void 0, done: !0 };
      }
    };
Object.defineProperty(Bs, "__esModule", { value: !0 });
Bs.FrappeFileUpload = void 0;
var C_ = uo,
  b_ = (function () {
    function e(t, n, r, o, i) {
      (this.appURL = t), (this.axios = n), (this.useToken = r != null ? r : !1), (this.token = o), (this.tokenType = i);
    }
    return (
      (e.prototype.uploadFile = function (t, n, r, o) {
        return (
          o === void 0 && (o = "upload_file"),
          S_(this, void 0, void 0, function () {
            var i, s, a, l, u, c, f, d;
            return E_(this, function (v) {
              return (
                (i = new FormData()),
                t && i.append("file", t, t.name),
                (s = n.isPrivate),
                (a = n.folder),
                (l = n.file_url),
                (u = n.doctype),
                (c = n.docname),
                (f = n.fieldname),
                (d = n.otherData),
                s && i.append("is_private", "1"),
                a && i.append("folder", a),
                l && i.append("file_url", l),
                u && c && (i.append("doctype", u), i.append("docname", c), f && i.append("fieldname", f)),
                d &&
                  Object.keys(d).forEach(function (m) {
                    var y = d[m];
                    i.append(m, y);
                  }),
                [
                  2,
                  this.axios
                    .post("/api/method/".concat(o), i, {
                      onUploadProgress: function (m) {
                        r && r(m.loaded, m.total, m);
                      },
                      headers: Uo(Uo({}, (0, C_.getRequestHeaders)(this.useToken, this.tokenType, this.token)), {
                        "Content-Type": "multipart/form-data",
                      }),
                    })
                    .catch(function (m) {
                      var y, x;
                      throw Uo(Uo({}, m.response.data), {
                        httpStatus: m.response.status,
                        httpStatusText: m.response.statusText,
                        message:
                          (y = m.response.data.message) !== null && y !== void 0
                            ? y
                            : "There was an error while uploading the file.",
                        exception: (x = m.response.data.exception) !== null && x !== void 0 ? x : "",
                      });
                    }),
                ]
              );
            });
          })
        );
      }),
      e
    );
  })();
Bs.FrappeFileUpload = b_;
var ag;
function k_() {
  if (ag) return ji;
  (ag = 1), Object.defineProperty(ji, "__esModule", { value: !0 }), (ji.FrappeApp = void 0);
  var e = Ow(),
    t = zs,
    n = Us,
    r = Bs,
    o = uo,
    i = (function () {
      function s(a, l, u) {
        var c, f;
        (this.url = a),
          (this.name = u != null ? u : "FrappeApp"),
          (this.useToken = (c = l == null ? void 0 : l.useToken) !== null && c !== void 0 ? c : !1),
          (this.token = l == null ? void 0 : l.token),
          (this.tokenType = (f = l == null ? void 0 : l.type) !== null && f !== void 0 ? f : "Bearer"),
          (this.axios = (0, o.getAxiosClient)(this.url, this.useToken, this.token, this.tokenType));
      }
      return (
        (s.prototype.auth = function () {
          return new e.FrappeAuth(this.url, this.axios, this.useToken, this.token, this.tokenType);
        }),
        (s.prototype.db = function () {
          return new n.FrappeDB(this.url, this.axios, this.useToken, this.token, this.tokenType);
        }),
        (s.prototype.file = function () {
          return new r.FrappeFileUpload(this.url, this.axios, this.useToken, this.token, this.tokenType);
        }),
        (s.prototype.call = function () {
          return new t.FrappeCall(this.url, this.axios, this.useToken, this.token, this.tokenType);
        }),
        s
      );
    })();
  return (ji.FrappeApp = i), ji;
}
var bu = {},
  vn =
    (ve && ve.__assign) ||
    function () {
      return (
        (vn =
          Object.assign ||
          function (e) {
            for (var t, n = 1, r = arguments.length; n < r; n++) {
              t = arguments[n];
              for (var o in t) Object.prototype.hasOwnProperty.call(t, o) && (e[o] = t[o]);
            }
            return e;
          }),
        vn.apply(this, arguments)
      );
    },
  Ta =
    (ve && ve.__awaiter) ||
    function (e, t, n, r) {
      function o(i) {
        return i instanceof n
          ? i
          : new n(function (s) {
              s(i);
            });
      }
      return new (n || (n = Promise))(function (i, s) {
        function a(c) {
          try {
            u(r.next(c));
          } catch (f) {
            s(f);
          }
        }
        function l(c) {
          try {
            u(r.throw(c));
          } catch (f) {
            s(f);
          }
        }
        function u(c) {
          c.done ? i(c.value) : o(c.value).then(a, l);
        }
        u((r = r.apply(e, t || [])).next());
      });
    },
  Ra =
    (ve && ve.__generator) ||
    function (e, t) {
      var n = {
          label: 0,
          sent: function () {
            if (i[0] & 1) throw i[1];
            return i[1];
          },
          trys: [],
          ops: [],
        },
        r,
        o,
        i,
        s;
      return (
        (s = { next: a(0), throw: a(1), return: a(2) }),
        typeof Symbol == "function" &&
          (s[Symbol.iterator] = function () {
            return this;
          }),
        s
      );
      function a(u) {
        return function (c) {
          return l([u, c]);
        };
      }
      function l(u) {
        if (r) throw new TypeError("Generator is already executing.");
        for (; s && ((s = 0), u[0] && (n = 0)), n; )
          try {
            if (
              ((r = 1),
              o &&
                (i = u[0] & 2 ? o.return : u[0] ? o.throw || ((i = o.return) && i.call(o), 0) : o.next) &&
                !(i = i.call(o, u[1])).done)
            )
              return i;
            switch (((o = 0), i && (u = [u[0] & 2, i.value]), u[0])) {
              case 0:
              case 1:
                i = u;
                break;
              case 4:
                return n.label++, { value: u[1], done: !1 };
              case 5:
                n.label++, (o = u[1]), (u = [0]);
                continue;
              case 7:
                (u = n.ops.pop()), n.trys.pop();
                continue;
              default:
                if (((i = n.trys), !(i = i.length > 0 && i[i.length - 1]) && (u[0] === 6 || u[0] === 2))) {
                  n = 0;
                  continue;
                }
                if (u[0] === 3 && (!i || (u[1] > i[0] && u[1] < i[3]))) {
                  n.label = u[1];
                  break;
                }
                if (u[0] === 6 && n.label < i[1]) {
                  (n.label = i[1]), (i = u);
                  break;
                }
                if (i && n.label < i[2]) {
                  (n.label = i[2]), n.ops.push(u);
                  break;
                }
                i[2] && n.ops.pop(), n.trys.pop();
                continue;
            }
            u = t.call(e, n);
          } catch (c) {
            (u = [6, c]), (o = 0);
          } finally {
            r = i = 0;
          }
        if (u[0] & 5) throw u[1];
        return { value: u[0] ? u[1] : void 0, done: !0 };
      }
    };
Object.defineProperty(bu, "__esModule", { value: !0 });
bu.FrappeAuth = void 0;
var __ = (function () {
  function e(t, n, r, o, i) {
    (this.appURL = t), (this.axios = n), (this.useToken = r != null ? r : !1), (this.token = o), (this.tokenType = i);
  }
  return (
    (e.prototype.loginWithUsernamePassword = function (t) {
      return Ta(this, void 0, void 0, function () {
        return Ra(this, function (n) {
          return [
            2,
            this.axios
              .post("/api/method/login", {
                usr: t.username,
                pwd: t.password,
                otp: t.otp,
                tmp_id: t.tmp_id,
                device: t.device,
              })
              .then(function (r) {
                return r.data;
              })
              .catch(function (r) {
                var o, i;
                throw vn(vn({}, r.response.data), {
                  httpStatus: r.response.status,
                  httpStatusText: r.response.statusText,
                  message:
                    (o = r.response.data.message) !== null && o !== void 0 ? o : "There was an error while logging in",
                  exception: (i = r.response.data.exception) !== null && i !== void 0 ? i : "",
                });
              }),
          ];
        });
      });
    }),
    (e.prototype.getLoggedInUser = function () {
      return Ta(this, void 0, void 0, function () {
        return Ra(this, function (t) {
          return [
            2,
            this.axios
              .get("/api/method/frappe.auth.get_logged_user")
              .then(function (n) {
                return n.data.message;
              })
              .catch(function (n) {
                var r;
                throw vn(vn({}, n.response.data), {
                  httpStatus: n.response.status,
                  httpStatusText: n.response.statusText,
                  message: "There was an error while fetching the logged in user",
                  exception: (r = n.response.data.exception) !== null && r !== void 0 ? r : "",
                });
              }),
          ];
        });
      });
    }),
    (e.prototype.logout = function () {
      return Ta(this, void 0, void 0, function () {
        return Ra(this, function (t) {
          return [
            2,
            this.axios
              .post("/api/method/logout", {})
              .then(function () {})
              .catch(function (n) {
                var r, o;
                throw vn(vn({}, n.response.data), {
                  httpStatus: n.response.status,
                  httpStatusText: n.response.statusText,
                  message:
                    (r = n.response.data.message) !== null && r !== void 0 ? r : "There was an error while logging out",
                  exception: (o = n.response.data.exception) !== null && o !== void 0 ? o : "",
                });
              }),
          ];
        });
      });
    }),
    (e.prototype.forgetPassword = function (t) {
      return Ta(this, void 0, void 0, function () {
        return Ra(this, function (n) {
          return [
            2,
            this.axios
              .post("/", { cmd: "frappe.core.doctype.user.user.reset_password", user: t })
              .then(function () {})
              .catch(function (r) {
                var o, i;
                throw vn(vn({}, r.response.data), {
                  httpStatus: r.response.status,
                  httpStatusText: r.response.statusText,
                  message:
                    (o = r.response.data.message) !== null && o !== void 0
                      ? o
                      : "There was an error sending password reset email.",
                  exception: (i = r.response.data.exception) !== null && i !== void 0 ? i : "",
                });
              }),
          ];
        });
      });
    }),
    e
  );
})();
bu.FrappeAuth = __;
var lg;
function Ow() {
  return (
    lg ||
      ((lg = 1),
      (function (e) {
        var t =
            (ve && ve.__createBinding) ||
            (Object.create
              ? function (r, o, i, s) {
                  s === void 0 && (s = i);
                  var a = Object.getOwnPropertyDescriptor(o, i);
                  (!a || ("get" in a ? !o.__esModule : a.writable || a.configurable)) &&
                    (a = {
                      enumerable: !0,
                      get: function () {
                        return o[i];
                      },
                    }),
                    Object.defineProperty(r, s, a);
                }
              : function (r, o, i, s) {
                  s === void 0 && (s = i), (r[s] = o[i]);
                }),
          n =
            (ve && ve.__exportStar) ||
            function (r, o) {
              for (var i in r) i !== "default" && !Object.prototype.hasOwnProperty.call(o, i) && t(o, r, i);
            };
        Object.defineProperty(e, "__esModule", { value: !0 }), n(k_(), e), n(bu, e), n(Us, e), n(Bs, e), n(zs, e);
      })(Qm)),
    Qm
  );
}
var T_ = Ow(),
  Aw = { exports: {} },
  Pc = {};
/**
 * @license React
 * use-sync-external-store-shim.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var ug;
function R_() {
  if (ug) return Pc;
  ug = 1;
  var e = ft;
  function t(f, d) {
    return (f === d && (f !== 0 || 1 / f === 1 / d)) || (f !== f && d !== d);
  }
  var n = typeof Object.is == "function" ? Object.is : t,
    r = e.useState,
    o = e.useEffect,
    i = e.useLayoutEffect,
    s = e.useDebugValue;
  function a(f, d) {
    var v = d(),
      m = r({ inst: { value: v, getSnapshot: d } }),
      y = m[0].inst,
      x = m[1];
    return (
      i(
        function () {
          (y.value = v), (y.getSnapshot = d), l(y) && x({ inst: y });
        },
        [f, v, d]
      ),
      o(
        function () {
          return (
            l(y) && x({ inst: y }),
            f(function () {
              l(y) && x({ inst: y });
            })
          );
        },
        [f]
      ),
      s(v),
      v
    );
  }
  function l(f) {
    var d = f.getSnapshot;
    f = f.value;
    try {
      var v = d();
      return !n(f, v);
    } catch (m) {
      return !0;
    }
  }
  function u(f, d) {
    return d();
  }
  var c = typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u" ? u : a;
  return (Pc.useSyncExternalStore = e.useSyncExternalStore !== void 0 ? e.useSyncExternalStore : c), Pc;
}
(function (e) {
  e.exports = R_();
})(Aw);
const wr = () => {},
  yt = wr(),
  ss = Object,
  he = (e) => e === yt,
  ln = (e) => typeof e == "function",
  Gn = (e, t) => T(T({}, e), t),
  P_ = (e) => ln(e.then),
  Pa = new WeakMap();
let O_ = 0;
const Ts = (e) => {
    const t = typeof e,
      n = e && e.constructor,
      r = n == Date;
    let o, i;
    if (ss(e) === e && !r && n != RegExp) {
      if (((o = Pa.get(e)), o)) return o;
      if (((o = ++O_ + "~"), Pa.set(e, o), n == Array)) {
        for (o = "@", i = 0; i < e.length; i++) o += Ts(e[i]) + ",";
        Pa.set(e, o);
      }
      if (n == ss) {
        o = "#";
        const s = ss.keys(e).sort();
        for (; !he((i = s.pop())); ) he(e[i]) || (o += i + ":" + Ts(e[i]) + ",");
        Pa.set(e, o);
      }
    } else o = r ? e.toJSON() : t == "symbol" ? e.toString() : t == "string" ? JSON.stringify(e) : "" + e;
    return o;
  },
  In = new WeakMap(),
  Oc = {},
  Oa = {},
  Mp = "undefined",
  ku = typeof window != Mp,
  nd = typeof document != Mp,
  A_ = () => ku && typeof window.requestAnimationFrame != Mp,
  Nw = (e, t) => {
    const n = In.get(e);
    return [
      () => (!he(t) && e.get(t)) || Oc,
      (r) => {
        if (!he(t)) {
          const o = e.get(t);
          t in Oa || (Oa[t] = o), n[5](t, Gn(o, r), o || Oc);
        }
      },
      n[6],
      () => (!he(t) && t in Oa ? Oa[t] : (!he(t) && e.get(t)) || Oc),
    ];
  };
let rd = !0;
const N_ = () => rd,
  [od, id] =
    ku && window.addEventListener
      ? [window.addEventListener.bind(window), window.removeEventListener.bind(window)]
      : [wr, wr],
  L_ = () => {
    const e = nd && document.visibilityState;
    return he(e) || e !== "hidden";
  },
  D_ = (e) => (
    nd && document.addEventListener("visibilitychange", e),
    od("focus", e),
    () => {
      nd && document.removeEventListener("visibilitychange", e), id("focus", e);
    }
  ),
  M_ = (e) => {
    const t = () => {
        (rd = !0), e();
      },
      n = () => {
        rd = !1;
      };
    return (
      od("online", t),
      od("offline", n),
      () => {
        id("online", t), id("offline", n);
      }
    );
  },
  j_ = { isOnline: N_, isVisible: L_ },
  F_ = { initFocus: D_, initReconnect: M_ },
  cg = !ft.useId,
  Rs = !ku || "Deno" in window,
  I_ = (e) => (A_() ? window.requestAnimationFrame(e) : setTimeout(e, 1)),
  il = Rs ? h.useEffect : h.useLayoutEffect,
  Ac = typeof navigator < "u" && navigator.connection,
  fg = !Rs && Ac && (["slow-2g", "2g"].includes(Ac.effectiveType) || Ac.saveData),
  jp = (e) => {
    if (ln(e))
      try {
        e = e();
      } catch (n) {
        e = "";
      }
    const t = e;
    return (e = typeof e == "string" ? e : (Array.isArray(e) ? e.length : e) ? Ts(e) : ""), [e, t];
  };
let $_ = 0;
const sd = () => ++$_,
  Lw = 0,
  Dw = 1,
  Mw = 2,
  z_ = 3;
var Ii = { __proto__: null, ERROR_REVALIDATE_EVENT: z_, FOCUS_EVENT: Lw, MUTATE_EVENT: Mw, RECONNECT_EVENT: Dw };
function jw(...e) {
  return le(this, null, function* () {
    const [t, n, r, o] = e,
      i = Gn({ populateCache: !0, throwOnError: !0 }, typeof o == "boolean" ? { revalidate: o } : o || {});
    let s = i.populateCache;
    const a = i.rollbackOnError;
    let l = i.optimisticData;
    const u = (d) => (typeof a == "function" ? a(d) : a !== !1),
      c = i.throwOnError;
    if (ln(n)) {
      const d = n,
        v = [],
        m = t.keys();
      for (const y of m) !/^\$(inf|sub)\$/.test(y) && d(t.get(y)._k) && v.push(y);
      return Promise.all(v.map(f));
    }
    return f(n);
    function f(d) {
      return le(this, null, function* () {
        const [v] = jp(d);
        if (!v) return;
        const [m, y] = Nw(t, v),
          [x, p, g, w] = In.get(t),
          S = () => {
            const Q = x[v];
            return (ln(i.revalidate) ? i.revalidate(m().data, d) : i.revalidate !== !1) &&
              (delete g[v], delete w[v], Q && Q[0])
              ? Q[0](Mw).then(() => m().data)
              : m().data;
          };
        if (e.length < 3) return S();
        let C = r,
          E;
        const P = sd();
        p[v] = [P, 0];
        const R = !he(l),
          A = m(),
          D = A.data,
          U = A._c,
          I = he(U) ? D : U;
        if ((R && ((l = ln(l) ? l(I, D) : l), y({ data: l, _c: I })), ln(C)))
          try {
            C = C(I);
          } catch (Q) {
            E = Q;
          }
        if (C && P_(C))
          if (
            ((C = yield C.catch((Q) => {
              E = Q;
            })),
            P !== p[v][0])
          ) {
            if (E) throw E;
            return C;
          } else E && R && u(E) && ((s = !0), y({ data: I, _c: yt }));
        if (s && !E)
          if (ln(s)) {
            const Q = s(C, I);
            y({ data: Q, error: yt, _c: yt });
          } else y({ data: C, error: yt, _c: yt });
        if (
          ((p[v][1] = sd()),
          Promise.resolve(S()).then(() => {
            y({ _c: yt });
          }),
          E)
        ) {
          if (c) throw E;
          return;
        }
        return C;
      });
    }
  });
}
const dg = (e, t) => {
    for (const n in e) e[n][0] && e[n][0](t);
  },
  Fw = (e, t) => {
    if (!In.has(e)) {
      const n = Gn(F_, t),
        r = {},
        o = jw.bind(yt, e);
      let i = wr;
      const s = {},
        a = (c, f) => {
          const d = s[c] || [];
          return (s[c] = d), d.push(f), () => d.splice(d.indexOf(f), 1);
        },
        l = (c, f, d) => {
          e.set(c, f);
          const v = s[c];
          if (v) for (const m of v) m(f, d);
        },
        u = () => {
          if (!In.has(e) && (In.set(e, [r, {}, {}, {}, o, l, a]), !Rs)) {
            const c = n.initFocus(setTimeout.bind(yt, dg.bind(yt, r, Lw))),
              f = n.initReconnect(setTimeout.bind(yt, dg.bind(yt, r, Dw)));
            i = () => {
              c && c(), f && f(), In.delete(e);
            };
          }
        };
      return u(), [e, o, u, i];
    }
    return [e, In.get(e)[4]];
  },
  U_ = (e, t, n, r, o) => {
    const i = n.errorRetryCount,
      s = o.retryCount,
      a = ~~((Math.random() + 0.5) * (1 << (s < 8 ? s : 8))) * n.errorRetryInterval;
    (!he(i) && s > i) || setTimeout(r, a, o);
  },
  B_ = (e, t) => Ts(e) == Ts(t),
  [Fp, V_] = Fw(new Map()),
  Ip = Gn(
    {
      onLoadingSlow: wr,
      onSuccess: wr,
      onError: wr,
      onErrorRetry: U_,
      onDiscarded: wr,
      revalidateOnFocus: !0,
      revalidateOnReconnect: !0,
      revalidateIfStale: !0,
      shouldRetryOnError: !0,
      errorRetryInterval: fg ? 1e4 : 5e3,
      focusThrottleInterval: 5 * 1e3,
      dedupingInterval: 2 * 1e3,
      loadingTimeout: fg ? 5e3 : 3e3,
      compare: B_,
      isPaused: () => !1,
      cache: Fp,
      mutate: V_,
      fallback: {},
    },
    j_
  ),
  Iw = (e, t) => {
    const n = Gn(e, t);
    if (t) {
      const { use: r, fallback: o } = e,
        { use: i, fallback: s } = t;
      r && i && (n.use = r.concat(i)), o && s && (n.fallback = Gn(o, s));
    }
    return n;
  },
  ad = h.createContext({}),
  $w = (e) => {
    const { value: t } = e,
      n = h.useContext(ad),
      r = ln(t),
      o = h.useMemo(() => (r ? t(n) : t), [r, n, t]),
      i = h.useMemo(() => (r ? o : Iw(n, o)), [r, n, o]),
      s = o && o.provider,
      a = h.useRef(yt);
    s && !a.current && (a.current = Fw(s(i.cache || Fp), o));
    const l = a.current;
    return (
      l && ((i.cache = l[0]), (i.mutate = l[1])),
      il(() => {
        if (l) return l[2] && l[2](), l[3];
      }, []),
      h.createElement(ad.Provider, Gn(e, { value: i }))
    );
  },
  W_ = "$inf$",
  zw = ku && window.__SWR_DEVTOOLS_USE__,
  H_ = zw ? window.__SWR_DEVTOOLS_USE__ : [],
  K_ = () => {
    zw && (window.__SWR_DEVTOOLS_REACT__ = ft);
  },
  q_ = (e) => (ln(e[1]) ? [e[0], e[1], e[2] || {}] : [e[0], null, (e[1] === null ? e[2] : e[1]) || {}]),
  G_ = () => Gn(Ip, h.useContext(ad)),
  Q_ = (e) => (t, n, r) =>
    e(
      t,
      n &&
        ((...o) => {
          const [i] = jp(t),
            [, , , s] = In.get(Fp);
          if (i.startsWith(W_)) return n(...o);
          const a = s[i];
          return he(a) ? n(...o) : (delete s[i], a);
        }),
      r
    ),
  Y_ = H_.concat(Q_),
  X_ = (e) =>
    function (...t) {
      const n = G_(),
        [r, o, i] = q_(t),
        s = Iw(n, i);
      let a = e;
      const { use: l } = s,
        u = (l || []).concat(Y_);
      for (let c = u.length; c--; ) a = u[c](a);
      return a(r, o || s.fetcher || null, s);
    },
  J_ = (e, t, n) => {
    const r = t[e] || (t[e] = []);
    return (
      r.push(n),
      () => {
        const o = r.indexOf(n);
        o >= 0 && ((r[o] = r[r.length - 1]), r.pop());
      }
    );
  };
K_();
const pg =
    ft.use ||
    ((e) => {
      if (e.status === "pending") throw e;
      if (e.status === "fulfilled") return e.value;
      throw e.status === "rejected"
        ? e.reason
        : ((e.status = "pending"),
          e.then(
            (t) => {
              (e.status = "fulfilled"), (e.value = t);
            },
            (t) => {
              (e.status = "rejected"), (e.reason = t);
            }
          ),
          e);
    }),
  Nc = { dedupe: !0 },
  Z_ = (e, t, n) => {
    const {
        cache: r,
        compare: o,
        suspense: i,
        fallbackData: s,
        revalidateOnMount: a,
        revalidateIfStale: l,
        refreshInterval: u,
        refreshWhenHidden: c,
        refreshWhenOffline: f,
        keepPreviousData: d,
      } = n,
      [v, m, y, x] = In.get(r),
      [p, g] = jp(e),
      w = h.useRef(!1),
      S = h.useRef(!1),
      C = h.useRef(p),
      E = h.useRef(t),
      P = h.useRef(n),
      R = () => P.current,
      A = () => R().isVisible() && R().isOnline(),
      [D, U, I, Q] = Nw(r, p),
      X = h.useRef({}).current,
      B = he(s) ? n.fallback[p] : s,
      te = (ne, ce) => {
        for (const Ae in X) {
          const ge = Ae;
          if (ge === "data") {
            if (!o(ne[ge], ce[ge]) && (!he(ne[ge]) || !o(ze, ce[ge]))) return !1;
          } else if (ce[ge] !== ne[ge]) return !1;
        }
        return !0;
      },
      W = h.useMemo(() => {
        const ne = !p || !t ? !1 : he(a) ? (R().isPaused() || i ? !1 : he(l) ? !0 : l) : a,
          ce = (He) => {
            const Wt = Gn(He);
            return delete Wt._k, ne ? T({ isValidating: !0, isLoading: !0 }, Wt) : Wt;
          },
          Ae = D(),
          ge = Q(),
          Ue = ce(Ae),
          Vt = Ae === ge ? Ue : ce(ge);
        let et = Ue;
        return [
          () => {
            const He = ce(D());
            return te(He, et)
              ? ((et.data = He.data),
                (et.isLoading = He.isLoading),
                (et.isValidating = He.isValidating),
                (et.error = He.error),
                et)
              : ((et = He), He);
          },
          () => Vt,
        ];
      }, [r, p]),
      M = Aw.exports.useSyncExternalStore(
        h.useCallback(
          (ne) =>
            I(p, (ce, Ae) => {
              te(Ae, ce) || ne();
            }),
          [r, p]
        ),
        W[0],
        W[1]
      ),
      $ = !w.current,
      H = v[p] && v[p].length > 0,
      q = M.data,
      oe = he(q) ? B : q,
      $e = M.error,
      Ee = h.useRef(oe),
      ze = d ? (he(q) ? Ee.current : q) : oe,
      We = H && !he($e) ? !1 : $ && !he(a) ? a : R().isPaused() ? !1 : i ? (he(oe) ? !1 : l) : he(oe) || l,
      Bt = !!(p && t && $ && We),
      nr = he(M.isValidating) ? Bt : M.isValidating,
      vo = he(M.isLoading) ? Bt : M.isLoading,
      hn = h.useCallback(
        (ne) =>
          le(void 0, null, function* () {
            const ce = E.current;
            if (!p || !ce || S.current || R().isPaused()) return !1;
            let Ae,
              ge,
              Ue = !0;
            const Vt = ne || {},
              et = !y[p] || !Vt.dedupe,
              He = () => (cg ? !S.current && p === C.current && w.current : p === C.current),
              Wt = { isValidating: !1, isLoading: !1 },
              wo = () => {
                U(Wt);
              },
              Nn = () => {
                const tt = y[p];
                tt && tt[1] === ge && delete y[p];
              },
              Xs = { isValidating: !0 };
            he(D().data) && (Xs.isLoading = !0);
            try {
              if (
                (et &&
                  (U(Xs),
                  n.loadingTimeout &&
                    he(D().data) &&
                    setTimeout(() => {
                      Ue && He() && R().onLoadingSlow(p, n);
                    }, n.loadingTimeout),
                  (y[p] = [ce(g), sd()])),
                ([Ae, ge] = y[p]),
                (Ae = yield Ae),
                et && setTimeout(Nn, n.dedupingInterval),
                !y[p] || y[p][1] !== ge)
              )
                return et && He() && R().onDiscarded(p), !1;
              Wt.error = yt;
              const tt = m[p];
              if (!he(tt) && (ge <= tt[0] || ge <= tt[1] || tt[1] === 0))
                return wo(), et && He() && R().onDiscarded(p), !1;
              const ht = D().data;
              (Wt.data = o(ht, Ae) ? ht : Ae), et && He() && R().onSuccess(Ae, p, n);
            } catch (tt) {
              Nn();
              const ht = R(),
                { shouldRetryOnError: xo } = ht;
              ht.isPaused() ||
                ((Wt.error = tt),
                et &&
                  He() &&
                  (ht.onError(tt, p, ht),
                  (xo === !0 || (ln(xo) && xo(tt))) &&
                    (!R().revalidateOnFocus || !R().revalidateOnReconnect || A()) &&
                    ht.onErrorRetry(
                      tt,
                      p,
                      ht,
                      (bi) => {
                        const Ht = v[p];
                        Ht && Ht[0] && Ht[0](Ii.ERROR_REVALIDATE_EVENT, bi);
                      },
                      { retryCount: (Vt.retryCount || 0) + 1, dedupe: !0 }
                    )));
            }
            return (Ue = !1), wo(), !0;
          }),
        [p, r]
      ),
      Ur = h.useCallback((...ne) => jw(r, C.current, ...ne), []);
    if (
      (il(() => {
        (E.current = t), (P.current = n), he(q) || (Ee.current = q);
      }),
      il(() => {
        if (!p) return;
        const ne = hn.bind(yt, Nc);
        let ce = 0;
        const Ae = J_(p, v, (ge, Ue = {}) => {
          if (ge == Ii.FOCUS_EVENT) {
            const Vt = Date.now();
            R().revalidateOnFocus && Vt > ce && A() && ((ce = Vt + R().focusThrottleInterval), ne());
          } else if (ge == Ii.RECONNECT_EVENT) R().revalidateOnReconnect && A() && ne();
          else {
            if (ge == Ii.MUTATE_EVENT) return hn();
            if (ge == Ii.ERROR_REVALIDATE_EVENT) return hn(Ue);
          }
        });
        return (
          (S.current = !1),
          (C.current = p),
          (w.current = !0),
          U({ _k: g }),
          We && (he(oe) || Rs ? ne() : I_(ne)),
          () => {
            (S.current = !0), Ae();
          }
        );
      }, [p]),
      il(() => {
        let ne;
        function ce() {
          const ge = ln(u) ? u(D().data) : u;
          ge && ne !== -1 && (ne = setTimeout(Ae, ge));
        }
        function Ae() {
          !D().error && (c || R().isVisible()) && (f || R().isOnline()) ? hn(Nc).then(ce) : ce();
        }
        return (
          ce(),
          () => {
            ne && (clearTimeout(ne), (ne = -1));
          }
        );
      }, [u, c, f, p]),
      h.useDebugValue(ze),
      i && he(oe) && p)
    ) {
      if (!cg && Rs) throw new Error("Fallback data is required when using suspense in SSR.");
      (E.current = t), (P.current = n), (S.current = !1);
      const ne = x[p];
      if (!he(ne)) {
        const ce = Ur(ne);
        pg(ce);
      }
      if (he($e)) {
        const ce = hn(Nc);
        he(ze) || ((ce.status = "fulfilled"), (ce.value = !0)), pg(ce);
      } else throw $e;
    }
    return {
      mutate: Ur,
      get data() {
        return (X.data = !0), ze;
      },
      get error() {
        return (X.error = !0), $e;
      },
      get isValidating() {
        return (X.isValidating = !0), nr;
      },
      get isLoading() {
        return (X.isLoading = !0), vo;
      },
    };
  },
  eT = ss.defineProperty($w, "defaultValue", { value: Ip }),
  $p = X_(Z_);
ft.use;
ss.defineProperty($w, "defaultValue", { value: Ip });
Promise.resolve();
const _n = Object.create(null);
_n.open = "0";
_n.close = "1";
_n.ping = "2";
_n.pong = "3";
_n.message = "4";
_n.upgrade = "5";
_n.noop = "6";
const sl = Object.create(null);
Object.keys(_n).forEach((e) => {
  sl[_n[e]] = e;
});
const ld = { type: "error", data: "parser error" },
  Uw =
    typeof Blob == "function" ||
    (typeof Blob < "u" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]"),
  Bw = typeof ArrayBuffer == "function",
  Vw = (e) => (typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e && e.buffer instanceof ArrayBuffer),
  zp = ({ type: e, data: t }, n, r) =>
    Uw && t instanceof Blob
      ? n
        ? r(t)
        : hg(t, r)
      : Bw && (t instanceof ArrayBuffer || Vw(t))
      ? n
        ? r(t)
        : hg(new Blob([t]), r)
      : r(_n[e] + (t || "")),
  hg = (e, t) => {
    const n = new FileReader();
    return (
      (n.onload = function () {
        const r = n.result.split(",")[1];
        t("b" + (r || ""));
      }),
      n.readAsDataURL(e)
    );
  };
function mg(e) {
  return e instanceof Uint8Array
    ? e
    : e instanceof ArrayBuffer
    ? new Uint8Array(e)
    : new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
}
let Lc;
function tT(e, t) {
  if (Uw && e.data instanceof Blob) return e.data.arrayBuffer().then(mg).then(t);
  if (Bw && (e.data instanceof ArrayBuffer || Vw(e.data))) return t(mg(e.data));
  zp(e, !1, (n) => {
    Lc || (Lc = new TextEncoder()), t(Lc.encode(n));
  });
}
const gg = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
  Gi = typeof Uint8Array > "u" ? [] : new Uint8Array(256);
for (let e = 0; e < gg.length; e++) Gi[gg.charCodeAt(e)] = e;
const nT = (e) => {
    let t = e.length * 0.75,
      n = e.length,
      r,
      o = 0,
      i,
      s,
      a,
      l;
    e[e.length - 1] === "=" && (t--, e[e.length - 2] === "=" && t--);
    const u = new ArrayBuffer(t),
      c = new Uint8Array(u);
    for (r = 0; r < n; r += 4)
      (i = Gi[e.charCodeAt(r)]),
        (s = Gi[e.charCodeAt(r + 1)]),
        (a = Gi[e.charCodeAt(r + 2)]),
        (l = Gi[e.charCodeAt(r + 3)]),
        (c[o++] = (i << 2) | (s >> 4)),
        (c[o++] = ((s & 15) << 4) | (a >> 2)),
        (c[o++] = ((a & 3) << 6) | (l & 63));
    return u;
  },
  rT = typeof ArrayBuffer == "function",
  Up = (e, t) => {
    if (typeof e != "string") return { type: "message", data: Ww(e, t) };
    const n = e.charAt(0);
    return n === "b"
      ? { type: "message", data: oT(e.substring(1), t) }
      : sl[n]
      ? e.length > 1
        ? { type: sl[n], data: e.substring(1) }
        : { type: sl[n] }
      : ld;
  },
  oT = (e, t) => {
    if (rT) {
      const n = nT(e);
      return Ww(n, t);
    } else return { base64: !0, data: e };
  },
  Ww = (e, t) => {
    switch (t) {
      case "blob":
        return e instanceof Blob ? e : new Blob([e]);
      case "arraybuffer":
      default:
        return e instanceof ArrayBuffer ? e : e.buffer;
    }
  },
  Hw = "",
  iT = (e, t) => {
    const n = e.length,
      r = new Array(n);
    let o = 0;
    e.forEach((i, s) => {
      zp(i, !1, (a) => {
        (r[s] = a), ++o === n && t(r.join(Hw));
      });
    });
  },
  sT = (e, t) => {
    const n = e.split(Hw),
      r = [];
    for (let o = 0; o < n.length; o++) {
      const i = Up(n[o], t);
      if ((r.push(i), i.type === "error")) break;
    }
    return r;
  };
function aT() {
  return new TransformStream({
    transform(e, t) {
      tT(e, (n) => {
        const r = n.length;
        let o;
        if (r < 126) (o = new Uint8Array(1)), new DataView(o.buffer).setUint8(0, r);
        else if (r < 65536) {
          o = new Uint8Array(3);
          const i = new DataView(o.buffer);
          i.setUint8(0, 126), i.setUint16(1, r);
        } else {
          o = new Uint8Array(9);
          const i = new DataView(o.buffer);
          i.setUint8(0, 127), i.setBigUint64(1, BigInt(r));
        }
        e.data && typeof e.data != "string" && (o[0] |= 128), t.enqueue(o), t.enqueue(n);
      });
    },
  });
}
let Dc;
function Aa(e) {
  return e.reduce((t, n) => t + n.length, 0);
}
function Na(e, t) {
  if (e[0].length === t) return e.shift();
  const n = new Uint8Array(t);
  let r = 0;
  for (let o = 0; o < t; o++) (n[o] = e[0][r++]), r === e[0].length && (e.shift(), (r = 0));
  return e.length && r < e[0].length && (e[0] = e[0].slice(r)), n;
}
function lT(e, t) {
  Dc || (Dc = new TextDecoder());
  const n = [];
  let r = 0,
    o = -1,
    i = !1;
  return new TransformStream({
    transform(s, a) {
      for (n.push(s); ; ) {
        if (r === 0) {
          if (Aa(n) < 1) break;
          const l = Na(n, 1);
          (i = (l[0] & 128) === 128), (o = l[0] & 127), o < 126 ? (r = 3) : o === 126 ? (r = 1) : (r = 2);
        } else if (r === 1) {
          if (Aa(n) < 2) break;
          const l = Na(n, 2);
          (o = new DataView(l.buffer, l.byteOffset, l.length).getUint16(0)), (r = 3);
        } else if (r === 2) {
          if (Aa(n) < 8) break;
          const l = Na(n, 8),
            u = new DataView(l.buffer, l.byteOffset, l.length),
            c = u.getUint32(0);
          if (c > Math.pow(2, 21) - 1) {
            a.enqueue(ld);
            break;
          }
          (o = c * Math.pow(2, 32) + u.getUint32(4)), (r = 3);
        } else {
          if (Aa(n) < o) break;
          const l = Na(n, o);
          a.enqueue(Up(i ? l : Dc.decode(l), t)), (r = 0);
        }
        if (o === 0 || o > e) {
          a.enqueue(ld);
          break;
        }
      }
    },
  });
}
const Kw = 4;
function Ye(e) {
  if (e) return uT(e);
}
function uT(e) {
  for (var t in Ye.prototype) e[t] = Ye.prototype[t];
  return e;
}
Ye.prototype.on = Ye.prototype.addEventListener = function (e, t) {
  return (
    (this._callbacks = this._callbacks || {}), (this._callbacks["$" + e] = this._callbacks["$" + e] || []).push(t), this
  );
};
Ye.prototype.once = function (e, t) {
  function n() {
    this.off(e, n), t.apply(this, arguments);
  }
  return (n.fn = t), this.on(e, n), this;
};
Ye.prototype.off =
  Ye.prototype.removeListener =
  Ye.prototype.removeAllListeners =
  Ye.prototype.removeEventListener =
    function (e, t) {
      if (((this._callbacks = this._callbacks || {}), arguments.length == 0)) return (this._callbacks = {}), this;
      var n = this._callbacks["$" + e];
      if (!n) return this;
      if (arguments.length == 1) return delete this._callbacks["$" + e], this;
      for (var r, o = 0; o < n.length; o++)
        if (((r = n[o]), r === t || r.fn === t)) {
          n.splice(o, 1);
          break;
        }
      return n.length === 0 && delete this._callbacks["$" + e], this;
    };
Ye.prototype.emit = function (e) {
  this._callbacks = this._callbacks || {};
  for (var t = new Array(arguments.length - 1), n = this._callbacks["$" + e], r = 1; r < arguments.length; r++)
    t[r - 1] = arguments[r];
  if (n) {
    n = n.slice(0);
    for (var r = 0, o = n.length; r < o; ++r) n[r].apply(this, t);
  }
  return this;
};
Ye.prototype.emitReserved = Ye.prototype.emit;
Ye.prototype.listeners = function (e) {
  return (this._callbacks = this._callbacks || {}), this._callbacks["$" + e] || [];
};
Ye.prototype.hasListeners = function (e) {
  return !!this.listeners(e).length;
};
const Qt = typeof self < "u" ? self : typeof window < "u" ? window : Function("return this")();
function qw(e, ...t) {
  return t.reduce((n, r) => (e.hasOwnProperty(r) && (n[r] = e[r]), n), {});
}
const cT = Qt.setTimeout,
  fT = Qt.clearTimeout;
function _u(e, t) {
  t.useNativeTimers
    ? ((e.setTimeoutFn = cT.bind(Qt)), (e.clearTimeoutFn = fT.bind(Qt)))
    : ((e.setTimeoutFn = Qt.setTimeout.bind(Qt)), (e.clearTimeoutFn = Qt.clearTimeout.bind(Qt)));
}
const dT = 1.33;
function pT(e) {
  return typeof e == "string" ? hT(e) : Math.ceil((e.byteLength || e.size) * dT);
}
function hT(e) {
  let t = 0,
    n = 0;
  for (let r = 0, o = e.length; r < o; r++)
    (t = e.charCodeAt(r)),
      t < 128 ? (n += 1) : t < 2048 ? (n += 2) : t < 55296 || t >= 57344 ? (n += 3) : (r++, (n += 4));
  return n;
}
function mT(e) {
  let t = "";
  for (let n in e)
    e.hasOwnProperty(n) && (t.length && (t += "&"), (t += encodeURIComponent(n) + "=" + encodeURIComponent(e[n])));
  return t;
}
function gT(e) {
  let t = {},
    n = e.split("&");
  for (let r = 0, o = n.length; r < o; r++) {
    let i = n[r].split("=");
    t[decodeURIComponent(i[0])] = decodeURIComponent(i[1]);
  }
  return t;
}
class yT extends Error {
  constructor(t, n, r) {
    super(t), (this.description = n), (this.context = r), (this.type = "TransportError");
  }
}
class Bp extends Ye {
  constructor(t) {
    super(), (this.writable = !1), _u(this, t), (this.opts = t), (this.query = t.query), (this.socket = t.socket);
  }
  onError(t, n, r) {
    return super.emitReserved("error", new yT(t, n, r)), this;
  }
  open() {
    return (this.readyState = "opening"), this.doOpen(), this;
  }
  close() {
    return (this.readyState === "opening" || this.readyState === "open") && (this.doClose(), this.onClose()), this;
  }
  send(t) {
    this.readyState === "open" && this.write(t);
  }
  onOpen() {
    (this.readyState = "open"), (this.writable = !0), super.emitReserved("open");
  }
  onData(t) {
    const n = Up(t, this.socket.binaryType);
    this.onPacket(n);
  }
  onPacket(t) {
    super.emitReserved("packet", t);
  }
  onClose(t) {
    (this.readyState = "closed"), super.emitReserved("close", t);
  }
  pause(t) {}
  createUri(t, n = {}) {
    return t + "://" + this._hostname() + this._port() + this.opts.path + this._query(n);
  }
  _hostname() {
    const t = this.opts.hostname;
    return t.indexOf(":") === -1 ? t : "[" + t + "]";
  }
  _port() {
    return this.opts.port &&
      ((this.opts.secure && +(this.opts.port !== 443)) || (!this.opts.secure && Number(this.opts.port) !== 80))
      ? ":" + this.opts.port
      : "";
  }
  _query(t) {
    const n = mT(t);
    return n.length ? "?" + n : "";
  }
}
const Gw = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(""),
  ud = 64,
  vT = {};
let yg = 0,
  La = 0,
  vg;
function wg(e) {
  let t = "";
  do (t = Gw[e % ud] + t), (e = Math.floor(e / ud));
  while (e > 0);
  return t;
}
function Qw() {
  const e = wg(+new Date());
  return e !== vg ? ((yg = 0), (vg = e)) : e + "." + wg(yg++);
}
for (; La < ud; La++) vT[Gw[La]] = La;
let Yw = !1;
try {
  Yw = typeof XMLHttpRequest < "u" && "withCredentials" in new XMLHttpRequest();
} catch (e) {}
const wT = Yw;
function Xw(e) {
  const t = e.xdomain;
  try {
    if (typeof XMLHttpRequest < "u" && (!t || wT)) return new XMLHttpRequest();
  } catch (n) {}
  if (!t)
    try {
      return new Qt[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch (n) {}
}
function xT() {}
const ST = (function () {
  return new Xw({ xdomain: !1 }).responseType != null;
})();
class ET extends Bp {
  constructor(t) {
    if ((super(t), (this.polling = !1), typeof location < "u")) {
      const r = location.protocol === "https:";
      let o = location.port;
      o || (o = r ? "443" : "80"),
        (this.xd = (typeof location < "u" && t.hostname !== location.hostname) || o !== t.port);
    }
    const n = t && t.forceBase64;
    (this.supportsBinary = ST && !n), this.opts.withCredentials && (this.cookieJar = void 0);
  }
  get name() {
    return "polling";
  }
  doOpen() {
    this.poll();
  }
  pause(t) {
    this.readyState = "pausing";
    const n = () => {
      (this.readyState = "paused"), t();
    };
    if (this.polling || !this.writable) {
      let r = 0;
      this.polling &&
        (r++,
        this.once("pollComplete", function () {
          --r || n();
        })),
        this.writable ||
          (r++,
          this.once("drain", function () {
            --r || n();
          }));
    } else n();
  }
  poll() {
    (this.polling = !0), this.doPoll(), this.emitReserved("poll");
  }
  onData(t) {
    const n = (r) => {
      if ((this.readyState === "opening" && r.type === "open" && this.onOpen(), r.type === "close"))
        return this.onClose({ description: "transport closed by the server" }), !1;
      this.onPacket(r);
    };
    sT(t, this.socket.binaryType).forEach(n),
      this.readyState !== "closed" &&
        ((this.polling = !1), this.emitReserved("pollComplete"), this.readyState === "open" && this.poll());
  }
  doClose() {
    const t = () => {
      this.write([{ type: "close" }]);
    };
    this.readyState === "open" ? t() : this.once("open", t);
  }
  write(t) {
    (this.writable = !1),
      iT(t, (n) => {
        this.doWrite(n, () => {
          (this.writable = !0), this.emitReserved("drain");
        });
      });
  }
  uri() {
    const t = this.opts.secure ? "https" : "http",
      n = this.query || {};
    return (
      this.opts.timestampRequests !== !1 && (n[this.opts.timestampParam] = Qw()),
      !this.supportsBinary && !n.sid && (n.b64 = 1),
      this.createUri(t, n)
    );
  }
  request(t = {}) {
    return Object.assign(t, { xd: this.xd, cookieJar: this.cookieJar }, this.opts), new kn(this.uri(), t);
  }
  doWrite(t, n) {
    const r = this.request({ method: "POST", data: t });
    r.on("success", n),
      r.on("error", (o, i) => {
        this.onError("xhr post error", o, i);
      });
  }
  doPoll() {
    const t = this.request();
    t.on("data", this.onData.bind(this)),
      t.on("error", (n, r) => {
        this.onError("xhr poll error", n, r);
      }),
      (this.pollXhr = t);
  }
}
class kn extends Ye {
  constructor(t, n) {
    super(),
      _u(this, n),
      (this.opts = n),
      (this.method = n.method || "GET"),
      (this.uri = t),
      (this.data = n.data !== void 0 ? n.data : null),
      this.create();
  }
  create() {
    var t;
    const n = qw(
      this.opts,
      "agent",
      "pfx",
      "key",
      "passphrase",
      "cert",
      "ca",
      "ciphers",
      "rejectUnauthorized",
      "autoUnref"
    );
    n.xdomain = !!this.opts.xd;
    const r = (this.xhr = new Xw(n));
    try {
      r.open(this.method, this.uri, !0);
      try {
        if (this.opts.extraHeaders) {
          r.setDisableHeaderCheck && r.setDisableHeaderCheck(!0);
          for (let o in this.opts.extraHeaders)
            this.opts.extraHeaders.hasOwnProperty(o) && r.setRequestHeader(o, this.opts.extraHeaders[o]);
        }
      } catch (o) {}
      if (this.method === "POST")
        try {
          r.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
        } catch (o) {}
      try {
        r.setRequestHeader("Accept", "*/*");
      } catch (o) {}
      (t = this.opts.cookieJar) === null || t === void 0 || t.addCookies(r),
        "withCredentials" in r && (r.withCredentials = this.opts.withCredentials),
        this.opts.requestTimeout && (r.timeout = this.opts.requestTimeout),
        (r.onreadystatechange = () => {
          var o;
          r.readyState === 3 && ((o = this.opts.cookieJar) === null || o === void 0 || o.parseCookies(r)),
            r.readyState === 4 &&
              (r.status === 200 || r.status === 1223
                ? this.onLoad()
                : this.setTimeoutFn(() => {
                    this.onError(typeof r.status == "number" ? r.status : 0);
                  }, 0));
        }),
        r.send(this.data);
    } catch (o) {
      this.setTimeoutFn(() => {
        this.onError(o);
      }, 0);
      return;
    }
    typeof document < "u" && ((this.index = kn.requestsCount++), (kn.requests[this.index] = this));
  }
  onError(t) {
    this.emitReserved("error", t, this.xhr), this.cleanup(!0);
  }
  cleanup(t) {
    if (!(typeof this.xhr > "u" || this.xhr === null)) {
      if (((this.xhr.onreadystatechange = xT), t))
        try {
          this.xhr.abort();
        } catch (n) {}
      typeof document < "u" && delete kn.requests[this.index], (this.xhr = null);
    }
  }
  onLoad() {
    const t = this.xhr.responseText;
    t !== null && (this.emitReserved("data", t), this.emitReserved("success"), this.cleanup());
  }
  abort() {
    this.cleanup();
  }
}
kn.requestsCount = 0;
kn.requests = {};
if (typeof document < "u") {
  if (typeof attachEvent == "function") attachEvent("onunload", xg);
  else if (typeof addEventListener == "function") {
    const e = "onpagehide" in Qt ? "pagehide" : "unload";
    addEventListener(e, xg, !1);
  }
}
function xg() {
  for (let e in kn.requests) kn.requests.hasOwnProperty(e) && kn.requests[e].abort();
}
const Vp =
    typeof Promise == "function" && typeof Promise.resolve == "function"
      ? (e) => Promise.resolve().then(e)
      : (e, t) => t(e, 0),
  Da = Qt.WebSocket || Qt.MozWebSocket,
  Sg = !0,
  CT = "arraybuffer",
  Eg =
    typeof navigator < "u" && typeof navigator.product == "string" && navigator.product.toLowerCase() === "reactnative";
class bT extends Bp {
  constructor(t) {
    super(t), (this.supportsBinary = !t.forceBase64);
  }
  get name() {
    return "websocket";
  }
  doOpen() {
    if (!this.check()) return;
    const t = this.uri(),
      n = this.opts.protocols,
      r = Eg
        ? {}
        : qw(
            this.opts,
            "agent",
            "perMessageDeflate",
            "pfx",
            "key",
            "passphrase",
            "cert",
            "ca",
            "ciphers",
            "rejectUnauthorized",
            "localAddress",
            "protocolVersion",
            "origin",
            "maxPayload",
            "family",
            "checkServerIdentity"
          );
    this.opts.extraHeaders && (r.headers = this.opts.extraHeaders);
    try {
      this.ws = Sg && !Eg ? (n ? new Da(t, n) : new Da(t)) : new Da(t, n, r);
    } catch (o) {
      return this.emitReserved("error", o);
    }
    (this.ws.binaryType = this.socket.binaryType), this.addEventListeners();
  }
  addEventListeners() {
    (this.ws.onopen = () => {
      this.opts.autoUnref && this.ws._socket.unref(), this.onOpen();
    }),
      (this.ws.onclose = (t) => this.onClose({ description: "websocket connection closed", context: t })),
      (this.ws.onmessage = (t) => this.onData(t.data)),
      (this.ws.onerror = (t) => this.onError("websocket error", t));
  }
  write(t) {
    this.writable = !1;
    for (let n = 0; n < t.length; n++) {
      const r = t[n],
        o = n === t.length - 1;
      zp(r, this.supportsBinary, (i) => {
        try {
          Sg && this.ws.send(i);
        } catch (s) {}
        o &&
          Vp(() => {
            (this.writable = !0), this.emitReserved("drain");
          }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    typeof this.ws < "u" && (this.ws.close(), (this.ws = null));
  }
  uri() {
    const t = this.opts.secure ? "wss" : "ws",
      n = this.query || {};
    return (
      this.opts.timestampRequests && (n[this.opts.timestampParam] = Qw()),
      this.supportsBinary || (n.b64 = 1),
      this.createUri(t, n)
    );
  }
  check() {
    return !!Da;
  }
}
class kT extends Bp {
  get name() {
    return "webtransport";
  }
  doOpen() {
    typeof WebTransport == "function" &&
      ((this.transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name])),
      this.transport.closed
        .then(() => {
          this.onClose();
        })
        .catch((t) => {
          this.onError("webtransport error", t);
        }),
      this.transport.ready.then(() => {
        this.transport.createBidirectionalStream().then((t) => {
          const n = lT(Number.MAX_SAFE_INTEGER, this.socket.binaryType),
            r = t.readable.pipeThrough(n).getReader(),
            o = aT();
          o.readable.pipeTo(t.writable), (this.writer = o.writable.getWriter());
          const i = () => {
            r.read()
              .then(({ done: a, value: l }) => {
                a || (this.onPacket(l), i());
              })
              .catch((a) => {});
          };
          i();
          const s = { type: "open" };
          this.query.sid && (s.data = `{"sid":"${this.query.sid}"}`), this.writer.write(s).then(() => this.onOpen());
        });
      }));
  }
  write(t) {
    this.writable = !1;
    for (let n = 0; n < t.length; n++) {
      const r = t[n],
        o = n === t.length - 1;
      this.writer.write(r).then(() => {
        o &&
          Vp(() => {
            (this.writable = !0), this.emitReserved("drain");
          }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    var t;
    (t = this.transport) === null || t === void 0 || t.close();
  }
}
const _T = { websocket: bT, webtransport: kT, polling: ET },
  TT =
    /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
  RT = [
    "source",
    "protocol",
    "authority",
    "userInfo",
    "user",
    "password",
    "host",
    "port",
    "relative",
    "path",
    "directory",
    "file",
    "query",
    "anchor",
  ];
function cd(e) {
  if (e.length > 2e3) throw "URI too long";
  const t = e,
    n = e.indexOf("["),
    r = e.indexOf("]");
  n != -1 && r != -1 && (e = e.substring(0, n) + e.substring(n, r).replace(/:/g, ";") + e.substring(r, e.length));
  let o = TT.exec(e || ""),
    i = {},
    s = 14;
  for (; s--; ) i[RT[s]] = o[s] || "";
  return (
    n != -1 &&
      r != -1 &&
      ((i.source = t),
      (i.host = i.host.substring(1, i.host.length - 1).replace(/;/g, ":")),
      (i.authority = i.authority.replace("[", "").replace("]", "").replace(/;/g, ":")),
      (i.ipv6uri = !0)),
    (i.pathNames = PT(i, i.path)),
    (i.queryKey = OT(i, i.query)),
    i
  );
}
function PT(e, t) {
  const n = /\/{2,9}/g,
    r = t.replace(n, "/").split("/");
  return (t.slice(0, 1) == "/" || t.length === 0) && r.splice(0, 1), t.slice(-1) == "/" && r.splice(r.length - 1, 1), r;
}
function OT(e, t) {
  const n = {};
  return (
    t.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function (r, o, i) {
      o && (n[o] = i);
    }),
    n
  );
}
class gr extends Ye {
  constructor(t, n = {}) {
    super(),
      (this.binaryType = CT),
      (this.writeBuffer = []),
      t && typeof t == "object" && ((n = t), (t = null)),
      t
        ? ((t = cd(t)),
          (n.hostname = t.host),
          (n.secure = t.protocol === "https" || t.protocol === "wss"),
          (n.port = t.port),
          t.query && (n.query = t.query))
        : n.host && (n.hostname = cd(n.host).host),
      _u(this, n),
      (this.secure = n.secure != null ? n.secure : typeof location < "u" && location.protocol === "https:"),
      n.hostname && !n.port && (n.port = this.secure ? "443" : "80"),
      (this.hostname = n.hostname || (typeof location < "u" ? location.hostname : "localhost")),
      (this.port = n.port || (typeof location < "u" && location.port ? location.port : this.secure ? "443" : "80")),
      (this.transports = n.transports || ["polling", "websocket", "webtransport"]),
      (this.writeBuffer = []),
      (this.prevBufferLen = 0),
      (this.opts = Object.assign(
        {
          path: "/engine.io",
          agent: !1,
          withCredentials: !1,
          upgrade: !0,
          timestampParam: "t",
          rememberUpgrade: !1,
          addTrailingSlash: !0,
          rejectUnauthorized: !0,
          perMessageDeflate: { threshold: 1024 },
          transportOptions: {},
          closeOnBeforeunload: !1,
        },
        n
      )),
      (this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : "")),
      typeof this.opts.query == "string" && (this.opts.query = gT(this.opts.query)),
      (this.id = null),
      (this.upgrades = null),
      (this.pingInterval = null),
      (this.pingTimeout = null),
      (this.pingTimeoutTimer = null),
      typeof addEventListener == "function" &&
        (this.opts.closeOnBeforeunload &&
          ((this.beforeunloadEventListener = () => {
            this.transport && (this.transport.removeAllListeners(), this.transport.close());
          }),
          addEventListener("beforeunload", this.beforeunloadEventListener, !1)),
        this.hostname !== "localhost" &&
          ((this.offlineEventListener = () => {
            this.onClose("transport close", { description: "network connection lost" });
          }),
          addEventListener("offline", this.offlineEventListener, !1))),
      this.open();
  }
  createTransport(t) {
    const n = Object.assign({}, this.opts.query);
    (n.EIO = Kw), (n.transport = t), this.id && (n.sid = this.id);
    const r = Object.assign(
      {},
      this.opts,
      { query: n, socket: this, hostname: this.hostname, secure: this.secure, port: this.port },
      this.opts.transportOptions[t]
    );
    return new _T[t](r);
  }
  open() {
    let t;
    if (this.opts.rememberUpgrade && gr.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1)
      t = "websocket";
    else if (this.transports.length === 0) {
      this.setTimeoutFn(() => {
        this.emitReserved("error", "No transports available");
      }, 0);
      return;
    } else t = this.transports[0];
    this.readyState = "opening";
    try {
      t = this.createTransport(t);
    } catch (n) {
      this.transports.shift(), this.open();
      return;
    }
    t.open(), this.setTransport(t);
  }
  setTransport(t) {
    this.transport && this.transport.removeAllListeners(),
      (this.transport = t),
      t
        .on("drain", this.onDrain.bind(this))
        .on("packet", this.onPacket.bind(this))
        .on("error", this.onError.bind(this))
        .on("close", (n) => this.onClose("transport close", n));
  }
  probe(t) {
    let n = this.createTransport(t),
      r = !1;
    gr.priorWebsocketSuccess = !1;
    const o = () => {
      r ||
        (n.send([{ type: "ping", data: "probe" }]),
        n.once("packet", (f) => {
          if (!r)
            if (f.type === "pong" && f.data === "probe") {
              if (((this.upgrading = !0), this.emitReserved("upgrading", n), !n)) return;
              (gr.priorWebsocketSuccess = n.name === "websocket"),
                this.transport.pause(() => {
                  r ||
                    (this.readyState !== "closed" &&
                      (c(),
                      this.setTransport(n),
                      n.send([{ type: "upgrade" }]),
                      this.emitReserved("upgrade", n),
                      (n = null),
                      (this.upgrading = !1),
                      this.flush()));
                });
            } else {
              const d = new Error("probe error");
              (d.transport = n.name), this.emitReserved("upgradeError", d);
            }
        }));
    };
    function i() {
      r || ((r = !0), c(), n.close(), (n = null));
    }
    const s = (f) => {
      const d = new Error("probe error: " + f);
      (d.transport = n.name), i(), this.emitReserved("upgradeError", d);
    };
    function a() {
      s("transport closed");
    }
    function l() {
      s("socket closed");
    }
    function u(f) {
      n && f.name !== n.name && i();
    }
    const c = () => {
      n.removeListener("open", o),
        n.removeListener("error", s),
        n.removeListener("close", a),
        this.off("close", l),
        this.off("upgrading", u);
    };
    n.once("open", o),
      n.once("error", s),
      n.once("close", a),
      this.once("close", l),
      this.once("upgrading", u),
      this.upgrades.indexOf("webtransport") !== -1 && t !== "webtransport"
        ? this.setTimeoutFn(() => {
            r || n.open();
          }, 200)
        : n.open();
  }
  onOpen() {
    if (
      ((this.readyState = "open"),
      (gr.priorWebsocketSuccess = this.transport.name === "websocket"),
      this.emitReserved("open"),
      this.flush(),
      this.readyState === "open" && this.opts.upgrade)
    ) {
      let t = 0;
      const n = this.upgrades.length;
      for (; t < n; t++) this.probe(this.upgrades[t]);
    }
  }
  onPacket(t) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing")
      switch ((this.emitReserved("packet", t), this.emitReserved("heartbeat"), this.resetPingTimeout(), t.type)) {
        case "open":
          this.onHandshake(JSON.parse(t.data));
          break;
        case "ping":
          this.sendPacket("pong"), this.emitReserved("ping"), this.emitReserved("pong");
          break;
        case "error":
          const n = new Error("server error");
          (n.code = t.data), this.onError(n);
          break;
        case "message":
          this.emitReserved("data", t.data), this.emitReserved("message", t.data);
          break;
      }
  }
  onHandshake(t) {
    this.emitReserved("handshake", t),
      (this.id = t.sid),
      (this.transport.query.sid = t.sid),
      (this.upgrades = this.filterUpgrades(t.upgrades)),
      (this.pingInterval = t.pingInterval),
      (this.pingTimeout = t.pingTimeout),
      (this.maxPayload = t.maxPayload),
      this.onOpen(),
      this.readyState !== "closed" && this.resetPingTimeout();
  }
  resetPingTimeout() {
    this.clearTimeoutFn(this.pingTimeoutTimer),
      (this.pingTimeoutTimer = this.setTimeoutFn(() => {
        this.onClose("ping timeout");
      }, this.pingInterval + this.pingTimeout)),
      this.opts.autoUnref && this.pingTimeoutTimer.unref();
  }
  onDrain() {
    this.writeBuffer.splice(0, this.prevBufferLen),
      (this.prevBufferLen = 0),
      this.writeBuffer.length === 0 ? this.emitReserved("drain") : this.flush();
  }
  flush() {
    if (this.readyState !== "closed" && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
      const t = this.getWritablePackets();
      this.transport.send(t), (this.prevBufferLen = t.length), this.emitReserved("flush");
    }
  }
  getWritablePackets() {
    if (!(this.maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1)) return this.writeBuffer;
    let t = 1;
    for (let n = 0; n < this.writeBuffer.length; n++) {
      const r = this.writeBuffer[n].data;
      if ((r && (t += pT(r)), n > 0 && t > this.maxPayload)) return this.writeBuffer.slice(0, n);
      t += 2;
    }
    return this.writeBuffer;
  }
  write(t, n, r) {
    return this.sendPacket("message", t, n, r), this;
  }
  send(t, n, r) {
    return this.sendPacket("message", t, n, r), this;
  }
  sendPacket(t, n, r, o) {
    if (
      (typeof n == "function" && ((o = n), (n = void 0)),
      typeof r == "function" && ((o = r), (r = null)),
      this.readyState === "closing" || this.readyState === "closed")
    )
      return;
    (r = r || {}), (r.compress = r.compress !== !1);
    const i = { type: t, data: n, options: r };
    this.emitReserved("packetCreate", i), this.writeBuffer.push(i), o && this.once("flush", o), this.flush();
  }
  close() {
    const t = () => {
        this.onClose("forced close"), this.transport.close();
      },
      n = () => {
        this.off("upgrade", n), this.off("upgradeError", n), t();
      },
      r = () => {
        this.once("upgrade", n), this.once("upgradeError", n);
      };
    return (
      (this.readyState === "opening" || this.readyState === "open") &&
        ((this.readyState = "closing"),
        this.writeBuffer.length
          ? this.once("drain", () => {
              this.upgrading ? r() : t();
            })
          : this.upgrading
          ? r()
          : t()),
      this
    );
  }
  onError(t) {
    (gr.priorWebsocketSuccess = !1), this.emitReserved("error", t), this.onClose("transport error", t);
  }
  onClose(t, n) {
    (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing") &&
      (this.clearTimeoutFn(this.pingTimeoutTimer),
      this.transport.removeAllListeners("close"),
      this.transport.close(),
      this.transport.removeAllListeners(),
      typeof removeEventListener == "function" &&
        (removeEventListener("beforeunload", this.beforeunloadEventListener, !1),
        removeEventListener("offline", this.offlineEventListener, !1)),
      (this.readyState = "closed"),
      (this.id = null),
      this.emitReserved("close", t, n),
      (this.writeBuffer = []),
      (this.prevBufferLen = 0));
  }
  filterUpgrades(t) {
    const n = [];
    let r = 0;
    const o = t.length;
    for (; r < o; r++) ~this.transports.indexOf(t[r]) && n.push(t[r]);
    return n;
  }
}
gr.protocol = Kw;
function AT(e, t = "", n) {
  let r = e;
  (n = n || (typeof location < "u" && location)),
    e == null && (e = n.protocol + "//" + n.host),
    typeof e == "string" &&
      (e.charAt(0) === "/" && (e.charAt(1) === "/" ? (e = n.protocol + e) : (e = n.host + e)),
      /^(https?|wss?):\/\//.test(e) || (typeof n < "u" ? (e = n.protocol + "//" + e) : (e = "https://" + e)),
      (r = cd(e))),
    r.port || (/^(http|ws)$/.test(r.protocol) ? (r.port = "80") : /^(http|ws)s$/.test(r.protocol) && (r.port = "443")),
    (r.path = r.path || "/");
  const o = r.host.indexOf(":") !== -1 ? "[" + r.host + "]" : r.host;
  return (
    (r.id = r.protocol + "://" + o + ":" + r.port + t),
    (r.href = r.protocol + "://" + o + (n && n.port === r.port ? "" : ":" + r.port)),
    r
  );
}
const NT = typeof ArrayBuffer == "function",
  LT = (e) => (typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(e) : e.buffer instanceof ArrayBuffer),
  Jw = Object.prototype.toString,
  DT = typeof Blob == "function" || (typeof Blob < "u" && Jw.call(Blob) === "[object BlobConstructor]"),
  MT = typeof File == "function" || (typeof File < "u" && Jw.call(File) === "[object FileConstructor]");
function Wp(e) {
  return (NT && (e instanceof ArrayBuffer || LT(e))) || (DT && e instanceof Blob) || (MT && e instanceof File);
}
function al(e, t) {
  if (!e || typeof e != "object") return !1;
  if (Array.isArray(e)) {
    for (let n = 0, r = e.length; n < r; n++) if (al(e[n])) return !0;
    return !1;
  }
  if (Wp(e)) return !0;
  if (e.toJSON && typeof e.toJSON == "function" && arguments.length === 1) return al(e.toJSON(), !0);
  for (const n in e) if (Object.prototype.hasOwnProperty.call(e, n) && al(e[n])) return !0;
  return !1;
}
function jT(e) {
  const t = [],
    n = e.data,
    r = e;
  return (r.data = fd(n, t)), (r.attachments = t.length), { packet: r, buffers: t };
}
function fd(e, t) {
  if (!e) return e;
  if (Wp(e)) {
    const n = { _placeholder: !0, num: t.length };
    return t.push(e), n;
  } else if (Array.isArray(e)) {
    const n = new Array(e.length);
    for (let r = 0; r < e.length; r++) n[r] = fd(e[r], t);
    return n;
  } else if (typeof e == "object" && !(e instanceof Date)) {
    const n = {};
    for (const r in e) Object.prototype.hasOwnProperty.call(e, r) && (n[r] = fd(e[r], t));
    return n;
  }
  return e;
}
function FT(e, t) {
  return (e.data = dd(e.data, t)), delete e.attachments, e;
}
function dd(e, t) {
  if (!e) return e;
  if (e && e._placeholder === !0) {
    if (typeof e.num == "number" && e.num >= 0 && e.num < t.length) return t[e.num];
    throw new Error("illegal attachments");
  } else if (Array.isArray(e)) for (let n = 0; n < e.length; n++) e[n] = dd(e[n], t);
  else if (typeof e == "object") for (const n in e) Object.prototype.hasOwnProperty.call(e, n) && (e[n] = dd(e[n], t));
  return e;
}
const IT = ["connect", "connect_error", "disconnect", "disconnecting", "newListener", "removeListener"],
  $T = 5;
var fe;
(function (e) {
  (e[(e.CONNECT = 0)] = "CONNECT"),
    (e[(e.DISCONNECT = 1)] = "DISCONNECT"),
    (e[(e.EVENT = 2)] = "EVENT"),
    (e[(e.ACK = 3)] = "ACK"),
    (e[(e.CONNECT_ERROR = 4)] = "CONNECT_ERROR"),
    (e[(e.BINARY_EVENT = 5)] = "BINARY_EVENT"),
    (e[(e.BINARY_ACK = 6)] = "BINARY_ACK");
})(fe || (fe = {}));
class zT {
  constructor(t) {
    this.replacer = t;
  }
  encode(t) {
    return (t.type === fe.EVENT || t.type === fe.ACK) && al(t)
      ? this.encodeAsBinary({
          type: t.type === fe.EVENT ? fe.BINARY_EVENT : fe.BINARY_ACK,
          nsp: t.nsp,
          data: t.data,
          id: t.id,
        })
      : [this.encodeAsString(t)];
  }
  encodeAsString(t) {
    let n = "" + t.type;
    return (
      (t.type === fe.BINARY_EVENT || t.type === fe.BINARY_ACK) && (n += t.attachments + "-"),
      t.nsp && t.nsp !== "/" && (n += t.nsp + ","),
      t.id != null && (n += t.id),
      t.data != null && (n += JSON.stringify(t.data, this.replacer)),
      n
    );
  }
  encodeAsBinary(t) {
    const n = jT(t),
      r = this.encodeAsString(n.packet),
      o = n.buffers;
    return o.unshift(r), o;
  }
}
function Cg(e) {
  return Object.prototype.toString.call(e) === "[object Object]";
}
class Hp extends Ye {
  constructor(t) {
    super(), (this.reviver = t);
  }
  add(t) {
    let n;
    if (typeof t == "string") {
      if (this.reconstructor) throw new Error("got plaintext data when reconstructing a packet");
      n = this.decodeString(t);
      const r = n.type === fe.BINARY_EVENT;
      r || n.type === fe.BINARY_ACK
        ? ((n.type = r ? fe.EVENT : fe.ACK),
          (this.reconstructor = new UT(n)),
          n.attachments === 0 && super.emitReserved("decoded", n))
        : super.emitReserved("decoded", n);
    } else if (Wp(t) || t.base64)
      if (this.reconstructor)
        (n = this.reconstructor.takeBinaryData(t)),
          n && ((this.reconstructor = null), super.emitReserved("decoded", n));
      else throw new Error("got binary data when not reconstructing a packet");
    else throw new Error("Unknown type: " + t);
  }
  decodeString(t) {
    let n = 0;
    const r = { type: Number(t.charAt(0)) };
    if (fe[r.type] === void 0) throw new Error("unknown packet type " + r.type);
    if (r.type === fe.BINARY_EVENT || r.type === fe.BINARY_ACK) {
      const i = n + 1;
      for (; t.charAt(++n) !== "-" && n != t.length; );
      const s = t.substring(i, n);
      if (s != Number(s) || t.charAt(n) !== "-") throw new Error("Illegal attachments");
      r.attachments = Number(s);
    }
    if (t.charAt(n + 1) === "/") {
      const i = n + 1;
      for (; ++n && !(t.charAt(n) === "," || n === t.length); );
      r.nsp = t.substring(i, n);
    } else r.nsp = "/";
    const o = t.charAt(n + 1);
    if (o !== "" && Number(o) == o) {
      const i = n + 1;
      for (; ++n; ) {
        const s = t.charAt(n);
        if (s == null || Number(s) != s) {
          --n;
          break;
        }
        if (n === t.length) break;
      }
      r.id = Number(t.substring(i, n + 1));
    }
    if (t.charAt(++n)) {
      const i = this.tryParse(t.substr(n));
      if (Hp.isPayloadValid(r.type, i)) r.data = i;
      else throw new Error("invalid payload");
    }
    return r;
  }
  tryParse(t) {
    try {
      return JSON.parse(t, this.reviver);
    } catch (n) {
      return !1;
    }
  }
  static isPayloadValid(t, n) {
    switch (t) {
      case fe.CONNECT:
        return Cg(n);
      case fe.DISCONNECT:
        return n === void 0;
      case fe.CONNECT_ERROR:
        return typeof n == "string" || Cg(n);
      case fe.EVENT:
      case fe.BINARY_EVENT:
        return Array.isArray(n) && (typeof n[0] == "number" || (typeof n[0] == "string" && IT.indexOf(n[0]) === -1));
      case fe.ACK:
      case fe.BINARY_ACK:
        return Array.isArray(n);
    }
  }
  destroy() {
    this.reconstructor && (this.reconstructor.finishedReconstruction(), (this.reconstructor = null));
  }
}
class UT {
  constructor(t) {
    (this.packet = t), (this.buffers = []), (this.reconPack = t);
  }
  takeBinaryData(t) {
    if ((this.buffers.push(t), this.buffers.length === this.reconPack.attachments)) {
      const n = FT(this.reconPack, this.buffers);
      return this.finishedReconstruction(), n;
    }
    return null;
  }
  finishedReconstruction() {
    (this.reconPack = null), (this.buffers = []);
  }
}
const BT = Object.freeze(
  Object.defineProperty(
    {
      __proto__: null,
      protocol: $T,
      get PacketType() {
        return fe;
      },
      Encoder: zT,
      Decoder: Hp,
    },
    Symbol.toStringTag,
    { value: "Module" }
  )
);
function on(e, t, n) {
  return (
    e.on(t, n),
    function () {
      e.off(t, n);
    }
  );
}
const VT = Object.freeze({
  connect: 1,
  connect_error: 1,
  disconnect: 1,
  disconnecting: 1,
  newListener: 1,
  removeListener: 1,
});
class Zw extends Ye {
  constructor(t, n, r) {
    super(),
      (this.connected = !1),
      (this.recovered = !1),
      (this.receiveBuffer = []),
      (this.sendBuffer = []),
      (this._queue = []),
      (this._queueSeq = 0),
      (this.ids = 0),
      (this.acks = {}),
      (this.flags = {}),
      (this.io = t),
      (this.nsp = n),
      r && r.auth && (this.auth = r.auth),
      (this._opts = Object.assign({}, r)),
      this.io._autoConnect && this.open();
  }
  get disconnected() {
    return !this.connected;
  }
  subEvents() {
    if (this.subs) return;
    const t = this.io;
    this.subs = [
      on(t, "open", this.onopen.bind(this)),
      on(t, "packet", this.onpacket.bind(this)),
      on(t, "error", this.onerror.bind(this)),
      on(t, "close", this.onclose.bind(this)),
    ];
  }
  get active() {
    return !!this.subs;
  }
  connect() {
    return this.connected
      ? this
      : (this.subEvents(),
        this.io._reconnecting || this.io.open(),
        this.io._readyState === "open" && this.onopen(),
        this);
  }
  open() {
    return this.connect();
  }
  send(...t) {
    return t.unshift("message"), this.emit.apply(this, t), this;
  }
  emit(t, ...n) {
    if (VT.hasOwnProperty(t)) throw new Error('"' + t.toString() + '" is a reserved event name');
    if ((n.unshift(t), this._opts.retries && !this.flags.fromQueue && !this.flags.volatile))
      return this._addToQueue(n), this;
    const r = { type: fe.EVENT, data: n };
    if (((r.options = {}), (r.options.compress = this.flags.compress !== !1), typeof n[n.length - 1] == "function")) {
      const i = this.ids++,
        s = n.pop();
      this._registerAckCallback(i, s), (r.id = i);
    }
    const o = this.io.engine && this.io.engine.transport && this.io.engine.transport.writable;
    return (
      (this.flags.volatile && (!o || !this.connected)) ||
        (this.connected ? (this.notifyOutgoingListeners(r), this.packet(r)) : this.sendBuffer.push(r)),
      (this.flags = {}),
      this
    );
  }
  _registerAckCallback(t, n) {
    var r;
    const o = (r = this.flags.timeout) !== null && r !== void 0 ? r : this._opts.ackTimeout;
    if (o === void 0) {
      this.acks[t] = n;
      return;
    }
    const i = this.io.setTimeoutFn(() => {
      delete this.acks[t];
      for (let s = 0; s < this.sendBuffer.length; s++) this.sendBuffer[s].id === t && this.sendBuffer.splice(s, 1);
      n.call(this, new Error("operation has timed out"));
    }, o);
    this.acks[t] = (...s) => {
      this.io.clearTimeoutFn(i), n.apply(this, [null, ...s]);
    };
  }
  emitWithAck(t, ...n) {
    const r = this.flags.timeout !== void 0 || this._opts.ackTimeout !== void 0;
    return new Promise((o, i) => {
      n.push((s, a) => (r ? (s ? i(s) : o(a)) : o(s))), this.emit(t, ...n);
    });
  }
  _addToQueue(t) {
    let n;
    typeof t[t.length - 1] == "function" && (n = t.pop());
    const r = {
      id: this._queueSeq++,
      tryCount: 0,
      pending: !1,
      args: t,
      flags: Object.assign({ fromQueue: !0 }, this.flags),
    };
    t.push((o, ...i) =>
      r !== this._queue[0]
        ? void 0
        : (o !== null
            ? r.tryCount > this._opts.retries && (this._queue.shift(), n && n(o))
            : (this._queue.shift(), n && n(null, ...i)),
          (r.pending = !1),
          this._drainQueue())
    ),
      this._queue.push(r),
      this._drainQueue();
  }
  _drainQueue(t = !1) {
    if (!this.connected || this._queue.length === 0) return;
    const n = this._queue[0];
    (n.pending && !t) || ((n.pending = !0), n.tryCount++, (this.flags = n.flags), this.emit.apply(this, n.args));
  }
  packet(t) {
    (t.nsp = this.nsp), this.io._packet(t);
  }
  onopen() {
    typeof this.auth == "function"
      ? this.auth((t) => {
          this._sendConnectPacket(t);
        })
      : this._sendConnectPacket(this.auth);
  }
  _sendConnectPacket(t) {
    this.packet({
      type: fe.CONNECT,
      data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, t) : t,
    });
  }
  onerror(t) {
    this.connected || this.emitReserved("connect_error", t);
  }
  onclose(t, n) {
    (this.connected = !1), delete this.id, this.emitReserved("disconnect", t, n);
  }
  onpacket(t) {
    if (t.nsp === this.nsp)
      switch (t.type) {
        case fe.CONNECT:
          t.data && t.data.sid
            ? this.onconnect(t.data.sid, t.data.pid)
            : this.emitReserved(
                "connect_error",
                new Error(
                  "It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"
                )
              );
          break;
        case fe.EVENT:
        case fe.BINARY_EVENT:
          this.onevent(t);
          break;
        case fe.ACK:
        case fe.BINARY_ACK:
          this.onack(t);
          break;
        case fe.DISCONNECT:
          this.ondisconnect();
          break;
        case fe.CONNECT_ERROR:
          this.destroy();
          const n = new Error(t.data.message);
          (n.data = t.data.data), this.emitReserved("connect_error", n);
          break;
      }
  }
  onevent(t) {
    const n = t.data || [];
    t.id != null && n.push(this.ack(t.id)),
      this.connected ? this.emitEvent(n) : this.receiveBuffer.push(Object.freeze(n));
  }
  emitEvent(t) {
    if (this._anyListeners && this._anyListeners.length) {
      const n = this._anyListeners.slice();
      for (const r of n) r.apply(this, t);
    }
    super.emit.apply(this, t),
      this._pid && t.length && typeof t[t.length - 1] == "string" && (this._lastOffset = t[t.length - 1]);
  }
  ack(t) {
    const n = this;
    let r = !1;
    return function (...o) {
      r || ((r = !0), n.packet({ type: fe.ACK, id: t, data: o }));
    };
  }
  onack(t) {
    const n = this.acks[t.id];
    typeof n == "function" && (n.apply(this, t.data), delete this.acks[t.id]);
  }
  onconnect(t, n) {
    (this.id = t),
      (this.recovered = n && this._pid === n),
      (this._pid = n),
      (this.connected = !0),
      this.emitBuffered(),
      this.emitReserved("connect"),
      this._drainQueue(!0);
  }
  emitBuffered() {
    this.receiveBuffer.forEach((t) => this.emitEvent(t)),
      (this.receiveBuffer = []),
      this.sendBuffer.forEach((t) => {
        this.notifyOutgoingListeners(t), this.packet(t);
      }),
      (this.sendBuffer = []);
  }
  ondisconnect() {
    this.destroy(), this.onclose("io server disconnect");
  }
  destroy() {
    this.subs && (this.subs.forEach((t) => t()), (this.subs = void 0)), this.io._destroy(this);
  }
  disconnect() {
    return (
      this.connected && this.packet({ type: fe.DISCONNECT }),
      this.destroy(),
      this.connected && this.onclose("io client disconnect"),
      this
    );
  }
  close() {
    return this.disconnect();
  }
  compress(t) {
    return (this.flags.compress = t), this;
  }
  get volatile() {
    return (this.flags.volatile = !0), this;
  }
  timeout(t) {
    return (this.flags.timeout = t), this;
  }
  onAny(t) {
    return (this._anyListeners = this._anyListeners || []), this._anyListeners.push(t), this;
  }
  prependAny(t) {
    return (this._anyListeners = this._anyListeners || []), this._anyListeners.unshift(t), this;
  }
  offAny(t) {
    if (!this._anyListeners) return this;
    if (t) {
      const n = this._anyListeners;
      for (let r = 0; r < n.length; r++) if (t === n[r]) return n.splice(r, 1), this;
    } else this._anyListeners = [];
    return this;
  }
  listenersAny() {
    return this._anyListeners || [];
  }
  onAnyOutgoing(t) {
    return (this._anyOutgoingListeners = this._anyOutgoingListeners || []), this._anyOutgoingListeners.push(t), this;
  }
  prependAnyOutgoing(t) {
    return (this._anyOutgoingListeners = this._anyOutgoingListeners || []), this._anyOutgoingListeners.unshift(t), this;
  }
  offAnyOutgoing(t) {
    if (!this._anyOutgoingListeners) return this;
    if (t) {
      const n = this._anyOutgoingListeners;
      for (let r = 0; r < n.length; r++) if (t === n[r]) return n.splice(r, 1), this;
    } else this._anyOutgoingListeners = [];
    return this;
  }
  listenersAnyOutgoing() {
    return this._anyOutgoingListeners || [];
  }
  notifyOutgoingListeners(t) {
    if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
      const n = this._anyOutgoingListeners.slice();
      for (const r of n) r.apply(this, t.data);
    }
  }
}
function vi(e) {
  (e = e || {}),
    (this.ms = e.min || 100),
    (this.max = e.max || 1e4),
    (this.factor = e.factor || 2),
    (this.jitter = e.jitter > 0 && e.jitter <= 1 ? e.jitter : 0),
    (this.attempts = 0);
}
vi.prototype.duration = function () {
  var e = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var t = Math.random(),
      n = Math.floor(t * this.jitter * e);
    e = Math.floor(t * 10) & 1 ? e + n : e - n;
  }
  return Math.min(e, this.max) | 0;
};
vi.prototype.reset = function () {
  this.attempts = 0;
};
vi.prototype.setMin = function (e) {
  this.ms = e;
};
vi.prototype.setMax = function (e) {
  this.max = e;
};
vi.prototype.setJitter = function (e) {
  this.jitter = e;
};
class pd extends Ye {
  constructor(t, n) {
    var r;
    super(),
      (this.nsps = {}),
      (this.subs = []),
      t && typeof t == "object" && ((n = t), (t = void 0)),
      (n = n || {}),
      (n.path = n.path || "/socket.io"),
      (this.opts = n),
      _u(this, n),
      this.reconnection(n.reconnection !== !1),
      this.reconnectionAttempts(n.reconnectionAttempts || 1 / 0),
      this.reconnectionDelay(n.reconnectionDelay || 1e3),
      this.reconnectionDelayMax(n.reconnectionDelayMax || 5e3),
      this.randomizationFactor((r = n.randomizationFactor) !== null && r !== void 0 ? r : 0.5),
      (this.backoff = new vi({
        min: this.reconnectionDelay(),
        max: this.reconnectionDelayMax(),
        jitter: this.randomizationFactor(),
      })),
      this.timeout(n.timeout == null ? 2e4 : n.timeout),
      (this._readyState = "closed"),
      (this.uri = t);
    const o = n.parser || BT;
    (this.encoder = new o.Encoder()),
      (this.decoder = new o.Decoder()),
      (this._autoConnect = n.autoConnect !== !1),
      this._autoConnect && this.open();
  }
  reconnection(t) {
    return arguments.length ? ((this._reconnection = !!t), this) : this._reconnection;
  }
  reconnectionAttempts(t) {
    return t === void 0 ? this._reconnectionAttempts : ((this._reconnectionAttempts = t), this);
  }
  reconnectionDelay(t) {
    var n;
    return t === void 0
      ? this._reconnectionDelay
      : ((this._reconnectionDelay = t), (n = this.backoff) === null || n === void 0 || n.setMin(t), this);
  }
  randomizationFactor(t) {
    var n;
    return t === void 0
      ? this._randomizationFactor
      : ((this._randomizationFactor = t), (n = this.backoff) === null || n === void 0 || n.setJitter(t), this);
  }
  reconnectionDelayMax(t) {
    var n;
    return t === void 0
      ? this._reconnectionDelayMax
      : ((this._reconnectionDelayMax = t), (n = this.backoff) === null || n === void 0 || n.setMax(t), this);
  }
  timeout(t) {
    return arguments.length ? ((this._timeout = t), this) : this._timeout;
  }
  maybeReconnectOnOpen() {
    !this._reconnecting && this._reconnection && this.backoff.attempts === 0 && this.reconnect();
  }
  open(t) {
    if (~this._readyState.indexOf("open")) return this;
    this.engine = new gr(this.uri, this.opts);
    const n = this.engine,
      r = this;
    (this._readyState = "opening"), (this.skipReconnect = !1);
    const o = on(n, "open", function () {
        r.onopen(), t && t();
      }),
      i = (a) => {
        this.cleanup(),
          (this._readyState = "closed"),
          this.emitReserved("error", a),
          t ? t(a) : this.maybeReconnectOnOpen();
      },
      s = on(n, "error", i);
    if (this._timeout !== !1) {
      const a = this._timeout,
        l = this.setTimeoutFn(() => {
          o(), i(new Error("timeout")), n.close();
        }, a);
      this.opts.autoUnref && l.unref(),
        this.subs.push(() => {
          this.clearTimeoutFn(l);
        });
    }
    return this.subs.push(o), this.subs.push(s), this;
  }
  connect(t) {
    return this.open(t);
  }
  onopen() {
    this.cleanup(), (this._readyState = "open"), this.emitReserved("open");
    const t = this.engine;
    this.subs.push(
      on(t, "ping", this.onping.bind(this)),
      on(t, "data", this.ondata.bind(this)),
      on(t, "error", this.onerror.bind(this)),
      on(t, "close", this.onclose.bind(this)),
      on(this.decoder, "decoded", this.ondecoded.bind(this))
    );
  }
  onping() {
    this.emitReserved("ping");
  }
  ondata(t) {
    try {
      this.decoder.add(t);
    } catch (n) {
      this.onclose("parse error", n);
    }
  }
  ondecoded(t) {
    Vp(() => {
      this.emitReserved("packet", t);
    }, this.setTimeoutFn);
  }
  onerror(t) {
    this.emitReserved("error", t);
  }
  socket(t, n) {
    let r = this.nsps[t];
    return r ? this._autoConnect && !r.active && r.connect() : ((r = new Zw(this, t, n)), (this.nsps[t] = r)), r;
  }
  _destroy(t) {
    const n = Object.keys(this.nsps);
    for (const r of n) if (this.nsps[r].active) return;
    this._close();
  }
  _packet(t) {
    const n = this.encoder.encode(t);
    for (let r = 0; r < n.length; r++) this.engine.write(n[r], t.options);
  }
  cleanup() {
    this.subs.forEach((t) => t()), (this.subs.length = 0), this.decoder.destroy();
  }
  _close() {
    (this.skipReconnect = !0),
      (this._reconnecting = !1),
      this.onclose("forced close"),
      this.engine && this.engine.close();
  }
  disconnect() {
    return this._close();
  }
  onclose(t, n) {
    this.cleanup(),
      this.backoff.reset(),
      (this._readyState = "closed"),
      this.emitReserved("close", t, n),
      this._reconnection && !this.skipReconnect && this.reconnect();
  }
  reconnect() {
    if (this._reconnecting || this.skipReconnect) return this;
    const t = this;
    if (this.backoff.attempts >= this._reconnectionAttempts)
      this.backoff.reset(), this.emitReserved("reconnect_failed"), (this._reconnecting = !1);
    else {
      const n = this.backoff.duration();
      this._reconnecting = !0;
      const r = this.setTimeoutFn(() => {
        t.skipReconnect ||
          (this.emitReserved("reconnect_attempt", t.backoff.attempts),
          !t.skipReconnect &&
            t.open((o) => {
              o ? ((t._reconnecting = !1), t.reconnect(), this.emitReserved("reconnect_error", o)) : t.onreconnect();
            }));
      }, n);
      this.opts.autoUnref && r.unref(),
        this.subs.push(() => {
          this.clearTimeoutFn(r);
        });
    }
  }
  onreconnect() {
    const t = this.backoff.attempts;
    (this._reconnecting = !1), this.backoff.reset(), this.emitReserved("reconnect", t);
  }
}
const $i = {};
function ll(e, t) {
  typeof e == "object" && ((t = e), (e = void 0)), (t = t || {});
  const n = AT(e, t.path || "/socket.io"),
    r = n.source,
    o = n.id,
    i = n.path,
    s = $i[o] && i in $i[o].nsps,
    a = t.forceNew || t["force new connection"] || t.multiplex === !1 || s;
  let l;
  return (
    a ? (l = new pd(r, t)) : ($i[o] || ($i[o] = new pd(r, t)), (l = $i[o])),
    n.query && !t.query && (t.query = n.queryKey),
    l.socket(n.path, t)
  );
}
Object.assign(ll, { Manager: pd, Socket: Zw, io: ll, connect: ll });
class WT {
  constructor(t, n, r, o) {
    Br(this, "socket_port"),
      Br(this, "host"),
      Br(this, "port"),
      Br(this, "protocol"),
      Br(this, "url"),
      Br(this, "site_name"),
      Br(this, "socket");
    var i, s, a, l;
    if (
      ((this.socket_port = r != null ? r : "9000"),
      (this.host = (i = window.location) == null ? void 0 : i.hostname),
      (this.port = (s = window.location) != null && s.port ? `:${this.socket_port}` : ""),
      (this.protocol = ((a = window.location) == null ? void 0 : a.protocol) === "https:" ? "https" : "http"),
      t)
    ) {
      let u = new URL(t);
      (u.port = ""), r ? ((u.port = r), (this.url = u.toString())) : (this.url = u.toString());
    } else this.url = `${this.protocol}://${this.host}${this.port}/`;
    n && (this.url = `${this.url}${n}`),
      (this.site_name = n),
      (this.socket = ll(`${this.url}`, {
        withCredentials: !0,
        secure: this.protocol === "https",
        extraHeaders:
          o && o.useToken === !0 ? { Authorization: `${o.type} ${(l = o.token) == null ? void 0 : l.call(o)}` } : {},
      }));
  }
}
var ex = { exports: {} },
  zi = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var bg;
function HT() {
  if (bg) return zi;
  bg = 1;
  var e = ft,
    t = Symbol.for("react.element"),
    n = Symbol.for("react.fragment"),
    r = Object.prototype.hasOwnProperty,
    o = e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
    i = { key: !0, ref: !0, __self: !0, __source: !0 };
  function s(a, l, u) {
    var c,
      f = {},
      d = null,
      v = null;
    u !== void 0 && (d = "" + u), l.key !== void 0 && (d = "" + l.key), l.ref !== void 0 && (v = l.ref);
    for (c in l) r.call(l, c) && !i.hasOwnProperty(c) && (f[c] = l[c]);
    if (a && a.defaultProps) for (c in ((l = a.defaultProps), l)) f[c] === void 0 && (f[c] = l[c]);
    return { $$typeof: t, type: a, key: d, ref: v, props: f, _owner: o.current };
  }
  return (zi.Fragment = n), (zi.jsx = s), (zi.jsxs = s), zi;
}
(function (e) {
  e.exports = HT();
})(ex);
const kg = ex.exports.jsx,
  Ir = h.createContext(null),
  KT = ({
    url: e = "",
    tokenParams: t,
    socketPort: n,
    swrConfig: r,
    siteName: o,
    enableSocket: i = !0,
    children: s,
  }) => {
    const a = h.useMemo(() => {
      const l = new T_.FrappeApp(e, t);
      return {
        url: e,
        tokenParams: t,
        app: l,
        auth: l.auth(),
        db: l.db(),
        call: l.call(),
        file: l.file(),
        socket: i ? new WT(e, o, n, t).socket : void 0,
        enableSocket: i,
        socketPort: n,
      };
    }, [e, t, n, i]);
    return kg(Ir.Provider, { value: a, children: kg(eT, { value: r, children: s }) });
  },
  qT = (e) => {
    const { url: t, auth: n, tokenParams: r } = h.useContext(Ir),
      [o, i] = h.useState(),
      s = h.useCallback(() => {
        const m = document.cookie.split(";").find((y) => y.trim().startsWith("user_id="));
        if (m) {
          const y = m.split("=")[1];
          i(y && y !== "Guest" ? y : null);
        } else i(null);
      }, []);
    h.useEffect(() => {
      r && r.useToken ? i(null) : s();
    }, []);
    const {
        data: a,
        error: l,
        isLoading: u,
        isValidating: c,
        mutate: f,
      } = $p(
        () => ((r && r.useToken) || o ? `${t}/api/method/frappe.auth.get_logged_user` : null),
        () => n.getLoggedInUser(),
        T(
          {
            onError: () => {
              i(null);
            },
            shouldRetryOnError: !1,
            revalidateOnFocus: !1,
          },
          e
        )
      ),
      d = h.useCallback(
        (m) =>
          le(void 0, null, function* () {
            return n.loginWithUsernamePassword(m).then((y) => (s(), y));
          }),
        []
      ),
      v = h.useCallback(
        () =>
          le(void 0, null, function* () {
            return n
              .logout()
              .then(() => f(null))
              .then(() => i(null));
          }),
        []
      );
    return {
      isLoading: o === void 0 || u,
      currentUser: a,
      isValidating: c,
      error: l,
      login: d,
      logout: v,
      updateCurrentUser: f,
      getUserCookie: s,
    };
  },
  GT = (e, t, n) => {
    let r = `${t}/api/resource/`;
    return (r += `${e}`), r;
  },
  QT = (e) => {
    var t, n, r;
    let o = "";
    if (
      (e != null && e.fields && (o += "fields=" + JSON.stringify(e == null ? void 0 : e.fields) + "&"),
      e != null && e.filters && (o += "filters=" + JSON.stringify(e == null ? void 0 : e.filters) + "&"),
      e != null && e.orFilters && (o += "or_filters=" + JSON.stringify(e == null ? void 0 : e.orFilters) + "&"),
      e != null && e.limit_start && (o += "limit_start=" + JSON.stringify(e == null ? void 0 : e.limit_start) + "&"),
      e != null && e.limit && (o += "limit=" + JSON.stringify(e == null ? void 0 : e.limit) + "&"),
      e != null && e.groupBy && (o += "group_by=" + String(e.groupBy) + "&"),
      e != null && e.orderBy)
    ) {
      const i = `${String((t = e.orderBy) == null ? void 0 : t.field)} ${
        (r = (n = e.orderBy) == null ? void 0 : n.order) != null ? r : "asc"
      }`;
      o += "order_by=" + i + "&";
    }
    return e != null && e.asDict && (o += "as_dict=" + e.asDict), o;
  },
  V2 = (e, t, n, r) => {
    const { url: o, db: i } = h.useContext(Ir);
    return T(
      {},
      $p(`${GT(e, o)}?${QT(t)}`, () => i.getDocList(e, t), r)
    );
  };
function YT(e) {
  const t = [];
  for (let n in e) t.push(encodeURIComponent(n) + "=" + encodeURIComponent(e[n]));
  return t.join("&");
}
const W2 = (e, t, n, r) => {
    const { call: o } = h.useContext(Ir),
      i = YT(t != null ? t : {}),
      s = `${e}?${i}`;
    return T(
      {},
      $p(n === void 0 ? s : n, () => o.get(e, t), r)
    );
  },
  H2 = (e) => {
    const { call: t } = h.useContext(Ir),
      [n, r] = h.useState(null),
      [o, i] = h.useState(!1),
      [s, a] = h.useState(null),
      [l, u] = h.useState(!1),
      c = h.useCallback(() => {
        r(null), i(!1), a(null), u(!1);
      }, []);
    return {
      call: h.useCallback(
        (f) =>
          le(void 0, null, function* () {
            return (
              a(null),
              u(!1),
              i(!0),
              r(null),
              t
                .post(e, f)
                .then((d) => (r(d), i(!1), u(!0), d))
                .catch((d) => {
                  throw (i(!1), u(!1), a(d), d);
                })
            );
          }),
        []
      ),
      result: n,
      loading: o,
      error: s,
      reset: c,
      isCompleted: l,
    };
  },
  Kp = h.createContext({
    currentUser: null,
    isLoading: !1,
    logout: () => Promise.resolve(),
    updateCurrentUser: () => {},
  }),
  XT = ({ children: e }) => {
    const { logout: t, currentUser: n, updateCurrentUser: r, isLoading: o } = qT(),
      i = () =>
        le(void 0, null, function* () {
          return t().then(() => {
            window.location.replace("/login?redirect-to=/timesheet"), window.location.reload();
          });
        });
    return k.jsx(Kp.Provider, {
      value: { isLoading: o, updateCurrentUser: r, logout: i, currentUser: n != null ? n : null },
      children: e,
    });
  };
var tx = { exports: {} },
  nx = {};
/**
 * @license React
 * use-sync-external-store-with-selector.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Hs = h;
function JT(e, t) {
  return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var ZT = typeof Object.is == "function" ? Object.is : JT,
  eR = Hs.useSyncExternalStore,
  tR = Hs.useRef,
  nR = Hs.useEffect,
  rR = Hs.useMemo,
  oR = Hs.useDebugValue;
nx.useSyncExternalStoreWithSelector = function (e, t, n, r, o) {
  var i = tR(null);
  if (i.current === null) {
    var s = { hasValue: !1, value: null };
    i.current = s;
  } else s = i.current;
  i = rR(
    function () {
      function l(v) {
        if (!u) {
          if (((u = !0), (c = v), (v = r(v)), o !== void 0 && s.hasValue)) {
            var m = s.value;
            if (o(m, v)) return (f = m);
          }
          return (f = v);
        }
        if (((m = f), ZT(c, v))) return m;
        var y = r(v);
        return o !== void 0 && o(m, y) ? m : ((c = v), (f = y));
      }
      var u = !1,
        c,
        f,
        d = n === void 0 ? null : n;
      return [
        function () {
          return l(t());
        },
        d === null
          ? void 0
          : function () {
              return l(d());
            },
      ];
    },
    [t, n, r, o]
  );
  var a = eR(e, i[0], i[1]);
  return (
    nR(
      function () {
        (s.hasValue = !0), (s.value = a);
      },
      [a]
    ),
    oR(a),
    a
  );
};
tx.exports = nx;
var iR = tx.exports,
  Lt = "default" in gl ? ft : gl,
  _g = Symbol.for("react-redux-context"),
  Tg = typeof globalThis != "undefined" ? globalThis : {};
function sR() {
  var n;
  if (!Lt.createContext) return {};
  const e = (n = Tg[_g]) != null ? n : (Tg[_g] = new Map());
  let t = e.get(Lt.createContext);
  return t || ((t = Lt.createContext(null)), e.set(Lt.createContext, t)), t;
}
var Or = sR(),
  aR = () => {
    throw new Error("uSES not initialized!");
  };
function qp(e = Or) {
  return function () {
    return Lt.useContext(e);
  };
}
var rx = qp(),
  ox = aR,
  lR = (e) => {
    ox = e;
  },
  uR = (e, t) => e === t;
function cR(e = Or) {
  const t = e === Or ? rx : qp(e),
    n = (r, o = {}) => {
      const { equalityFn: i = uR, devModeChecks: s = {} } = typeof o == "function" ? { equalityFn: o } : o,
        { store: a, subscription: l, getServerState: u, stabilityCheck: c, identityFunctionCheck: f } = t();
      Lt.useRef(!0);
      const d = Lt.useCallback(
          {
            [r.name](m) {
              return r(m);
            },
          }[r.name],
          [r, c, s.stabilityCheck]
        ),
        v = ox(l.addNestedSub, a.getState, u || a.getState, d, i);
      return Lt.useDebugValue(v), v;
    };
  return Object.assign(n, { withTypes: () => n }), n;
}
var Ks = cR();
function fR(e) {
  e();
}
function dR() {
  let e = null,
    t = null;
  return {
    clear() {
      (e = null), (t = null);
    },
    notify() {
      fR(() => {
        let n = e;
        for (; n; ) n.callback(), (n = n.next);
      });
    },
    get() {
      const n = [];
      let r = e;
      for (; r; ) n.push(r), (r = r.next);
      return n;
    },
    subscribe(n) {
      let r = !0;
      const o = (t = { callback: n, next: null, prev: t });
      return (
        o.prev ? (o.prev.next = o) : (e = o),
        function () {
          !r ||
            e === null ||
            ((r = !1), o.next ? (o.next.prev = o.prev) : (t = o.prev), o.prev ? (o.prev.next = o.next) : (e = o.next));
        }
      );
    },
  };
}
var Rg = { notify() {}, get: () => [] };
function pR(e, t) {
  let n,
    r = Rg,
    o = 0,
    i = !1;
  function s(y) {
    c();
    const x = r.subscribe(y);
    let p = !1;
    return () => {
      p || ((p = !0), x(), f());
    };
  }
  function a() {
    r.notify();
  }
  function l() {
    m.onStateChange && m.onStateChange();
  }
  function u() {
    return i;
  }
  function c() {
    o++, n || ((n = e.subscribe(l)), (r = dR()));
  }
  function f() {
    o--, n && o === 0 && (n(), (n = void 0), r.clear(), (r = Rg));
  }
  function d() {
    i || ((i = !0), c());
  }
  function v() {
    i && ((i = !1), f());
  }
  const m = {
    addNestedSub: s,
    notifyNestedSubs: a,
    handleChangeWrapper: l,
    isSubscribed: u,
    trySubscribe: d,
    tryUnsubscribe: v,
    getListeners: () => r,
  };
  return m;
}
var hR =
    typeof window != "undefined" &&
    typeof window.document != "undefined" &&
    typeof window.document.createElement != "undefined",
  mR = typeof navigator != "undefined" && navigator.product === "ReactNative",
  gR = hR || mR ? Lt.useLayoutEffect : Lt.useEffect;
function yR({
  store: e,
  context: t,
  children: n,
  serverState: r,
  stabilityCheck: o = "once",
  identityFunctionCheck: i = "once",
}) {
  const s = Lt.useMemo(() => {
      const u = pR(e);
      return {
        store: e,
        subscription: u,
        getServerState: r ? () => r : void 0,
        stabilityCheck: o,
        identityFunctionCheck: i,
      };
    }, [e, r, o, i]),
    a = Lt.useMemo(() => e.getState(), [e]);
  gR(() => {
    const { subscription: u } = s;
    return (
      (u.onStateChange = u.notifyNestedSubs),
      u.trySubscribe(),
      a !== e.getState() && u.notifyNestedSubs(),
      () => {
        u.tryUnsubscribe(), (u.onStateChange = void 0);
      }
    );
  }, [s, a]);
  const l = t || Or;
  return Lt.createElement(l.Provider, { value: s }, n);
}
var vR = yR;
function ix(e = Or) {
  const t = e === Or ? rx : qp(e),
    n = () => {
      const { store: r } = t();
      return r;
    };
  return Object.assign(n, { withTypes: () => n }), n;
}
var wR = ix();
function xR(e = Or) {
  const t = e === Or ? wR : ix(e),
    n = () => t().dispatch;
  return Object.assign(n, { withTypes: () => n }), n;
}
var Gp = xR();
lR(iR.useSyncExternalStoreWithSelector);
function it(e) {
  return `Minified Redux error #${e}; visit https://redux.js.org/Errors?code=${e} for the full message or use the non-minified dev environment for full errors. `;
}
var SR = (typeof Symbol == "function" && Symbol.observable) || "@@observable",
  Pg = SR,
  Mc = () => Math.random().toString(36).substring(7).split("").join("."),
  ER = {
    INIT: `@@redux/INIT${Mc()}`,
    REPLACE: `@@redux/REPLACE${Mc()}`,
    PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${Mc()}`,
  },
  Vl = ER;
function Qp(e) {
  if (typeof e != "object" || e === null) return !1;
  let t = e;
  for (; Object.getPrototypeOf(t) !== null; ) t = Object.getPrototypeOf(t);
  return Object.getPrototypeOf(e) === t || Object.getPrototypeOf(e) === null;
}
function sx(e, t, n) {
  if (typeof e != "function") throw new Error(it(2));
  if (
    (typeof t == "function" && typeof n == "function") ||
    (typeof n == "function" && typeof arguments[3] == "function")
  )
    throw new Error(it(0));
  if ((typeof t == "function" && typeof n == "undefined" && ((n = t), (t = void 0)), typeof n != "undefined")) {
    if (typeof n != "function") throw new Error(it(1));
    return n(sx)(e, t);
  }
  let r = e,
    o = t,
    i = new Map(),
    s = i,
    a = 0,
    l = !1;
  function u() {
    s === i &&
      ((s = new Map()),
      i.forEach((x, p) => {
        s.set(p, x);
      }));
  }
  function c() {
    if (l) throw new Error(it(3));
    return o;
  }
  function f(x) {
    if (typeof x != "function") throw new Error(it(4));
    if (l) throw new Error(it(5));
    let p = !0;
    u();
    const g = a++;
    return (
      s.set(g, x),
      function () {
        if (p) {
          if (l) throw new Error(it(6));
          (p = !1), u(), s.delete(g), (i = null);
        }
      }
    );
  }
  function d(x) {
    if (!Qp(x)) throw new Error(it(7));
    if (typeof x.type == "undefined") throw new Error(it(8));
    if (typeof x.type != "string") throw new Error(it(17));
    if (l) throw new Error(it(9));
    try {
      (l = !0), (o = r(o, x));
    } finally {
      l = !1;
    }
    return (
      (i = s).forEach((g) => {
        g();
      }),
      x
    );
  }
  function v(x) {
    if (typeof x != "function") throw new Error(it(10));
    (r = x), d({ type: Vl.REPLACE });
  }
  function m() {
    const x = f;
    return {
      subscribe(p) {
        if (typeof p != "object" || p === null) throw new Error(it(11));
        function g() {
          const S = p;
          S.next && S.next(c());
        }
        return g(), { unsubscribe: x(g) };
      },
      [Pg]() {
        return this;
      },
    };
  }
  return d({ type: Vl.INIT }), { dispatch: d, subscribe: f, getState: c, replaceReducer: v, [Pg]: m };
}
function CR(e) {
  Object.keys(e).forEach((t) => {
    const n = e[t];
    if (typeof n(void 0, { type: Vl.INIT }) == "undefined") throw new Error(it(12));
    if (typeof n(void 0, { type: Vl.PROBE_UNKNOWN_ACTION() }) == "undefined") throw new Error(it(13));
  });
}
function bR(e) {
  const t = Object.keys(e),
    n = {};
  for (let i = 0; i < t.length; i++) {
    const s = t[i];
    typeof e[s] == "function" && (n[s] = e[s]);
  }
  const r = Object.keys(n);
  let o;
  try {
    CR(n);
  } catch (i) {
    o = i;
  }
  return function (s = {}, a) {
    if (o) throw o;
    let l = !1;
    const u = {};
    for (let c = 0; c < r.length; c++) {
      const f = r[c],
        d = n[f],
        v = s[f],
        m = d(v, a);
      if (typeof m == "undefined") throw (a && a.type, new Error(it(14)));
      (u[f] = m), (l = l || m !== v);
    }
    return (l = l || r.length !== Object.keys(s).length), l ? u : s;
  };
}
function Wl(...e) {
  return e.length === 0
    ? (t) => t
    : e.length === 1
    ? e[0]
    : e.reduce(
        (t, n) =>
          (...r) =>
            t(n(...r))
      );
}
function kR(...e) {
  return (t) => (n, r) => {
    const o = t(n, r);
    let i = () => {
      throw new Error(it(15));
    };
    const s = { getState: o.getState, dispatch: (l, ...u) => i(l, ...u) },
      a = e.map((l) => l(s));
    return (i = Wl(...a)(o.dispatch)), F(T({}, o), { dispatch: i });
  };
}
function _R(e) {
  return Qp(e) && "type" in e && typeof e.type == "string";
}
var ax = Symbol.for("immer-nothing"),
  Og = Symbol.for("immer-draftable"),
  Ft = Symbol.for("immer-state");
function un(e, ...t) {
  throw new Error(`[Immer] minified error nr: ${e}. Full error at: https://bit.ly/3cXEKWf`);
}
var ii = Object.getPrototypeOf;
function Ar(e) {
  return !!e && !!e[Ft];
}
function Qn(e) {
  var t;
  return e ? lx(e) || Array.isArray(e) || !!e[Og] || !!((t = e.constructor) != null && t[Og]) || Ru(e) || Pu(e) : !1;
}
var TR = Object.prototype.constructor.toString();
function lx(e) {
  if (!e || typeof e != "object") return !1;
  const t = ii(e);
  if (t === null) return !0;
  const n = Object.hasOwnProperty.call(t, "constructor") && t.constructor;
  return n === Object ? !0 : typeof n == "function" && Function.toString.call(n) === TR;
}
function Hl(e, t) {
  Tu(e) === 0
    ? Reflect.ownKeys(e).forEach((n) => {
        t(n, e[n], e);
      })
    : e.forEach((n, r) => t(r, n, e));
}
function Tu(e) {
  const t = e[Ft];
  return t ? t.type_ : Array.isArray(e) ? 1 : Ru(e) ? 2 : Pu(e) ? 3 : 0;
}
function hd(e, t) {
  return Tu(e) === 2 ? e.has(t) : Object.prototype.hasOwnProperty.call(e, t);
}
function ux(e, t, n) {
  const r = Tu(e);
  r === 2 ? e.set(t, n) : r === 3 ? e.add(n) : (e[t] = n);
}
function RR(e, t) {
  return e === t ? e !== 0 || 1 / e === 1 / t : e !== e && t !== t;
}
function Ru(e) {
  return e instanceof Map;
}
function Pu(e) {
  return e instanceof Set;
}
function Gr(e) {
  return e.copy_ || e.base_;
}
function md(e, t) {
  if (Ru(e)) return new Map(e);
  if (Pu(e)) return new Set(e);
  if (Array.isArray(e)) return Array.prototype.slice.call(e);
  const n = lx(e);
  if (t === !0 || (t === "class_only" && !n)) {
    const r = Object.getOwnPropertyDescriptors(e);
    delete r[Ft];
    let o = Reflect.ownKeys(r);
    for (let i = 0; i < o.length; i++) {
      const s = o[i],
        a = r[s];
      a.writable === !1 && ((a.writable = !0), (a.configurable = !0)),
        (a.get || a.set) && (r[s] = { configurable: !0, writable: !0, enumerable: a.enumerable, value: e[s] });
    }
    return Object.create(ii(e), r);
  } else {
    const r = ii(e);
    if (r !== null && n) return T({}, e);
    const o = Object.create(r);
    return Object.assign(o, e);
  }
}
function Yp(e, t = !1) {
  return (
    Ou(e) ||
      Ar(e) ||
      !Qn(e) ||
      (Tu(e) > 1 && (e.set = e.add = e.clear = e.delete = PR),
      Object.freeze(e),
      t && Object.entries(e).forEach(([n, r]) => Yp(r, !0))),
    e
  );
}
function PR() {
  un(2);
}
function Ou(e) {
  return Object.isFrozen(e);
}
var OR = {};
function co(e) {
  const t = OR[e];
  return t || un(0, e), t;
}
var Ps;
function cx() {
  return Ps;
}
function AR(e, t) {
  return { drafts_: [], parent_: e, immer_: t, canAutoFreeze_: !0, unfinalizedDrafts_: 0 };
}
function Ag(e, t) {
  t && (co("Patches"), (e.patches_ = []), (e.inversePatches_ = []), (e.patchListener_ = t));
}
function gd(e) {
  yd(e), e.drafts_.forEach(NR), (e.drafts_ = null);
}
function yd(e) {
  e === Ps && (Ps = e.parent_);
}
function Ng(e) {
  return (Ps = AR(Ps, e));
}
function NR(e) {
  const t = e[Ft];
  t.type_ === 0 || t.type_ === 1 ? t.revoke_() : (t.revoked_ = !0);
}
function Lg(e, t) {
  t.unfinalizedDrafts_ = t.drafts_.length;
  const n = t.drafts_[0];
  return (
    e !== void 0 && e !== n
      ? (n[Ft].modified_ && (gd(t), un(4)),
        Qn(e) && ((e = Kl(t, e)), t.parent_ || ql(t, e)),
        t.patches_ && co("Patches").generateReplacementPatches_(n[Ft].base_, e, t.patches_, t.inversePatches_))
      : (e = Kl(t, n, [])),
    gd(t),
    t.patches_ && t.patchListener_(t.patches_, t.inversePatches_),
    e !== ax ? e : void 0
  );
}
function Kl(e, t, n) {
  if (Ou(t)) return t;
  const r = t[Ft];
  if (!r) return Hl(t, (o, i) => Dg(e, r, t, o, i, n)), t;
  if (r.scope_ !== e) return t;
  if (!r.modified_) return ql(e, r.base_, !0), r.base_;
  if (!r.finalized_) {
    (r.finalized_ = !0), r.scope_.unfinalizedDrafts_--;
    const o = r.copy_;
    let i = o,
      s = !1;
    r.type_ === 3 && ((i = new Set(o)), o.clear(), (s = !0)),
      Hl(i, (a, l) => Dg(e, r, o, a, l, n, s)),
      ql(e, o, !1),
      n && e.patches_ && co("Patches").generatePatches_(r, n, e.patches_, e.inversePatches_);
  }
  return r.copy_;
}
function Dg(e, t, n, r, o, i, s) {
  if (Ar(o)) {
    const a = i && t && t.type_ !== 3 && !hd(t.assigned_, r) ? i.concat(r) : void 0,
      l = Kl(e, o, a);
    if ((ux(n, r, l), Ar(l))) e.canAutoFreeze_ = !1;
    else return;
  } else s && n.add(o);
  if (Qn(o) && !Ou(o)) {
    if (!e.immer_.autoFreeze_ && e.unfinalizedDrafts_ < 1) return;
    Kl(e, o),
      (!t || !t.scope_.parent_) && typeof r != "symbol" && Object.prototype.propertyIsEnumerable.call(n, r) && ql(e, o);
  }
}
function ql(e, t, n = !1) {
  !e.parent_ && e.immer_.autoFreeze_ && e.canAutoFreeze_ && Yp(t, n);
}
function LR(e, t) {
  const n = Array.isArray(e),
    r = {
      type_: n ? 1 : 0,
      scope_: t ? t.scope_ : cx(),
      modified_: !1,
      finalized_: !1,
      assigned_: {},
      parent_: t,
      base_: e,
      draft_: null,
      copy_: null,
      revoke_: null,
      isManual_: !1,
    };
  let o = r,
    i = Xp;
  n && ((o = [r]), (i = Os));
  const { revoke: s, proxy: a } = Proxy.revocable(o, i);
  return (r.draft_ = a), (r.revoke_ = s), a;
}
var Xp = {
    get(e, t) {
      if (t === Ft) return e;
      const n = Gr(e);
      if (!hd(n, t)) return DR(e, n, t);
      const r = n[t];
      return e.finalized_ || !Qn(r) ? r : r === jc(e.base_, t) ? (Fc(e), (e.copy_[t] = wd(r, e))) : r;
    },
    has(e, t) {
      return t in Gr(e);
    },
    ownKeys(e) {
      return Reflect.ownKeys(Gr(e));
    },
    set(e, t, n) {
      const r = fx(Gr(e), t);
      if (r != null && r.set) return r.set.call(e.draft_, n), !0;
      if (!e.modified_) {
        const o = jc(Gr(e), t),
          i = o == null ? void 0 : o[Ft];
        if (i && i.base_ === n) return (e.copy_[t] = n), (e.assigned_[t] = !1), !0;
        if (RR(n, o) && (n !== void 0 || hd(e.base_, t))) return !0;
        Fc(e), vd(e);
      }
      return (
        (e.copy_[t] === n && (n !== void 0 || t in e.copy_)) ||
          (Number.isNaN(n) && Number.isNaN(e.copy_[t])) ||
          ((e.copy_[t] = n), (e.assigned_[t] = !0)),
        !0
      );
    },
    deleteProperty(e, t) {
      return (
        jc(e.base_, t) !== void 0 || t in e.base_ ? ((e.assigned_[t] = !1), Fc(e), vd(e)) : delete e.assigned_[t],
        e.copy_ && delete e.copy_[t],
        !0
      );
    },
    getOwnPropertyDescriptor(e, t) {
      const n = Gr(e),
        r = Reflect.getOwnPropertyDescriptor(n, t);
      return (
        r && { writable: !0, configurable: e.type_ !== 1 || t !== "length", enumerable: r.enumerable, value: n[t] }
      );
    },
    defineProperty() {
      un(11);
    },
    getPrototypeOf(e) {
      return ii(e.base_);
    },
    setPrototypeOf() {
      un(12);
    },
  },
  Os = {};
Hl(Xp, (e, t) => {
  Os[e] = function () {
    return (arguments[0] = arguments[0][0]), t.apply(this, arguments);
  };
});
Os.deleteProperty = function (e, t) {
  return Os.set.call(this, e, t, void 0);
};
Os.set = function (e, t, n) {
  return Xp.set.call(this, e[0], t, n, e[0]);
};
function jc(e, t) {
  const n = e[Ft];
  return (n ? Gr(n) : e)[t];
}
function DR(e, t, n) {
  var o;
  const r = fx(t, n);
  return r ? ("value" in r ? r.value : (o = r.get) == null ? void 0 : o.call(e.draft_)) : void 0;
}
function fx(e, t) {
  if (!(t in e)) return;
  let n = ii(e);
  for (; n; ) {
    const r = Object.getOwnPropertyDescriptor(n, t);
    if (r) return r;
    n = ii(n);
  }
}
function vd(e) {
  e.modified_ || ((e.modified_ = !0), e.parent_ && vd(e.parent_));
}
function Fc(e) {
  e.copy_ || (e.copy_ = md(e.base_, e.scope_.immer_.useStrictShallowCopy_));
}
var MR = class {
  constructor(e) {
    (this.autoFreeze_ = !0),
      (this.useStrictShallowCopy_ = !1),
      (this.produce = (t, n, r) => {
        if (typeof t == "function" && typeof n != "function") {
          const i = n;
          n = t;
          const s = this;
          return function (l = i, ...u) {
            return s.produce(l, (c) => n.call(this, c, ...u));
          };
        }
        typeof n != "function" && un(6), r !== void 0 && typeof r != "function" && un(7);
        let o;
        if (Qn(t)) {
          const i = Ng(this),
            s = wd(t, void 0);
          let a = !0;
          try {
            (o = n(s)), (a = !1);
          } finally {
            a ? gd(i) : yd(i);
          }
          return Ag(i, r), Lg(o, i);
        } else if (!t || typeof t != "object") {
          if (((o = n(t)), o === void 0 && (o = t), o === ax && (o = void 0), this.autoFreeze_ && Yp(o, !0), r)) {
            const i = [],
              s = [];
            co("Patches").generateReplacementPatches_(t, o, i, s), r(i, s);
          }
          return o;
        } else un(1, t);
      }),
      (this.produceWithPatches = (t, n) => {
        if (typeof t == "function") return (s, ...a) => this.produceWithPatches(s, (l) => t(l, ...a));
        let r, o;
        return [
          this.produce(t, n, (s, a) => {
            (r = s), (o = a);
          }),
          r,
          o,
        ];
      }),
      typeof (e == null ? void 0 : e.autoFreeze) == "boolean" && this.setAutoFreeze(e.autoFreeze),
      typeof (e == null ? void 0 : e.useStrictShallowCopy) == "boolean" &&
        this.setUseStrictShallowCopy(e.useStrictShallowCopy);
  }
  createDraft(e) {
    Qn(e) || un(8), Ar(e) && (e = dx(e));
    const t = Ng(this),
      n = wd(e, void 0);
    return (n[Ft].isManual_ = !0), yd(t), n;
  }
  finishDraft(e, t) {
    const n = e && e[Ft];
    (!n || !n.isManual_) && un(9);
    const { scope_: r } = n;
    return Ag(r, t), Lg(void 0, r);
  }
  setAutoFreeze(e) {
    this.autoFreeze_ = e;
  }
  setUseStrictShallowCopy(e) {
    this.useStrictShallowCopy_ = e;
  }
  applyPatches(e, t) {
    let n;
    for (n = t.length - 1; n >= 0; n--) {
      const o = t[n];
      if (o.path.length === 0 && o.op === "replace") {
        e = o.value;
        break;
      }
    }
    n > -1 && (t = t.slice(n + 1));
    const r = co("Patches").applyPatches_;
    return Ar(e) ? r(e, t) : this.produce(e, (o) => r(o, t));
  }
};
function wd(e, t) {
  const n = Ru(e) ? co("MapSet").proxyMap_(e, t) : Pu(e) ? co("MapSet").proxySet_(e, t) : LR(e, t);
  return (t ? t.scope_ : cx()).drafts_.push(n), n;
}
function dx(e) {
  return Ar(e) || un(10, e), px(e);
}
function px(e) {
  if (!Qn(e) || Ou(e)) return e;
  const t = e[Ft];
  let n;
  if (t) {
    if (!t.modified_) return t.base_;
    (t.finalized_ = !0), (n = md(e, t.scope_.immer_.useStrictShallowCopy_));
  } else n = md(e, !0);
  return (
    Hl(n, (r, o) => {
      ux(n, r, px(o));
    }),
    t && (t.finalized_ = !1),
    n
  );
}
var It = new MR(),
  hx = It.produce;
It.produceWithPatches.bind(It);
It.setAutoFreeze.bind(It);
It.setUseStrictShallowCopy.bind(It);
It.applyPatches.bind(It);
It.createDraft.bind(It);
It.finishDraft.bind(It);
function jR(e, t = `expected a function, instead received ${typeof e}`) {
  if (typeof e != "function") throw new TypeError(t);
}
function FR(e, t = `expected an object, instead received ${typeof e}`) {
  if (typeof e != "object") throw new TypeError(t);
}
function IR(e, t = "expected all items to be functions, instead received the following types: ") {
  if (!e.every((n) => typeof n == "function")) {
    const n = e.map((r) => (typeof r == "function" ? `function ${r.name || "unnamed"}()` : typeof r)).join(", ");
    throw new TypeError(`${t}[${n}]`);
  }
}
var Mg = (e) => (Array.isArray(e) ? e : [e]);
function $R(e) {
  const t = Array.isArray(e[0]) ? e[0] : e;
  return IR(t, "createSelector expects all input-selectors to be functions, but received the following types: "), t;
}
function zR(e, t) {
  const n = [],
    { length: r } = e;
  for (let o = 0; o < r; o++) n.push(e[o].apply(null, t));
  return n;
}
var UR = class {
    constructor(e) {
      this.value = e;
    }
    deref() {
      return this.value;
    }
  },
  BR = typeof WeakRef != "undefined" ? WeakRef : UR,
  VR = 0,
  jg = 1;
function Ma() {
  return { s: VR, v: void 0, o: null, p: null };
}
function Jp(e, t = {}) {
  let n = Ma();
  const { resultEqualityCheck: r } = t;
  let o,
    i = 0;
  function s() {
    var f, d;
    let a = n;
    const { length: l } = arguments;
    for (let v = 0, m = l; v < m; v++) {
      const y = arguments[v];
      if (typeof y == "function" || (typeof y == "object" && y !== null)) {
        let x = a.o;
        x === null && (a.o = x = new WeakMap());
        const p = x.get(y);
        p === void 0 ? ((a = Ma()), x.set(y, a)) : (a = p);
      } else {
        let x = a.p;
        x === null && (a.p = x = new Map());
        const p = x.get(y);
        p === void 0 ? ((a = Ma()), x.set(y, a)) : (a = p);
      }
    }
    const u = a;
    let c;
    if (a.s === jg) c = a.v;
    else if (((c = e.apply(null, arguments)), i++, r)) {
      const v = (d = (f = o == null ? void 0 : o.deref) == null ? void 0 : f.call(o)) != null ? d : o;
      v != null && r(v, c) && ((c = v), i !== 0 && i--),
        (o = (typeof c == "object" && c !== null) || typeof c == "function" ? new BR(c) : c);
    }
    return (u.s = jg), (u.v = c), c;
  }
  return (
    (s.clearCache = () => {
      (n = Ma()), s.resetResultsCount();
    }),
    (s.resultsCount = () => i),
    (s.resetResultsCount = () => {
      i = 0;
    }),
    s
  );
}
function mx(e, ...t) {
  const n = typeof e == "function" ? { memoize: e, memoizeOptions: t } : e,
    r = (...o) => {
      let i = 0,
        s = 0,
        a,
        l = {},
        u = o.pop();
      typeof u == "object" && ((l = u), (u = o.pop())),
        jR(u, `createSelector expects an output function after the inputs, but received: [${typeof u}]`);
      const c = T(T({}, n), l),
        {
          memoize: f,
          memoizeOptions: d = [],
          argsMemoize: v = Jp,
          argsMemoizeOptions: m = [],
          devModeChecks: y = {},
        } = c,
        x = Mg(d),
        p = Mg(m),
        g = $R(o),
        w = f(function () {
          return i++, u.apply(null, arguments);
        }, ...x),
        S = v(function () {
          s++;
          const E = zR(g, arguments);
          return (a = w.apply(null, E)), a;
        }, ...p);
      return Object.assign(S, {
        resultFunc: u,
        memoizedResultFunc: w,
        dependencies: g,
        dependencyRecomputations: () => s,
        resetDependencyRecomputations: () => {
          s = 0;
        },
        lastResult: () => a,
        recomputations: () => i,
        resetRecomputations: () => {
          i = 0;
        },
        memoize: f,
        argsMemoize: v,
      });
    };
  return Object.assign(r, { withTypes: () => r }), r;
}
var WR = mx(Jp),
  HR = Object.assign(
    (e, t = WR) => {
      FR(
        e,
        `createStructuredSelector expects first argument to be an object where each property is a selector, instead received a ${typeof e}`
      );
      const n = Object.keys(e),
        r = n.map((i) => e[i]);
      return t(r, (...i) => i.reduce((s, a, l) => ((s[n[l]] = a), s), {}));
    },
    { withTypes: () => HR }
  );
function gx(e) {
  return ({ dispatch: n, getState: r }) =>
    (o) =>
    (i) =>
      typeof i == "function" ? i(n, r, e) : o(i);
}
var KR = gx(),
  qR = gx,
  GR = (...e) => {
    const t = mx(...e),
      n = Object.assign(
        (...r) => {
          const o = t(...r),
            i = (s, ...a) => o(Ar(s) ? dx(s) : s, ...a);
          return Object.assign(i, o), i;
        },
        { withTypes: () => n }
      );
    return n;
  };
GR(Jp);
var QR =
  typeof window != "undefined" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    : function () {
        if (arguments.length !== 0) return typeof arguments[0] == "object" ? Wl : Wl.apply(null, arguments);
      };
function si(e, t) {
  function n(...r) {
    if (t) {
      let o = t(...r);
      if (!o) throw new Error(_t(0));
      return T(T({ type: e, payload: o.payload }, "meta" in o && { meta: o.meta }), "error" in o && { error: o.error });
    }
    return { type: e, payload: r[0] };
  }
  return (n.toString = () => `${e}`), (n.type = e), (n.match = (r) => _R(r) && r.type === e), n;
}
var yx = class Qi extends Array {
  constructor(...t) {
    super(...t), Object.setPrototypeOf(this, Qi.prototype);
  }
  static get [Symbol.species]() {
    return Qi;
  }
  concat(...t) {
    return super.concat.apply(this, t);
  }
  prepend(...t) {
    return t.length === 1 && Array.isArray(t[0]) ? new Qi(...t[0].concat(this)) : new Qi(...t.concat(this));
  }
};
function Fg(e) {
  return Qn(e) ? hx(e, () => {}) : e;
}
function Ig(e, t, n) {
  if (e.has(t)) {
    let o = e.get(t);
    return n.update && ((o = n.update(o, t, e)), e.set(t, o)), o;
  }
  if (!n.insert) throw new Error(_t(10));
  const r = n.insert(t, e);
  return e.set(t, r), r;
}
function YR(e) {
  return typeof e == "boolean";
}
var XR = () =>
    function (t) {
      const {
        thunk: n = !0,
        immutableCheck: r = !0,
        serializableCheck: o = !0,
        actionCreatorCheck: i = !0,
      } = t != null ? t : {};
      let s = new yx();
      return n && (YR(n) ? s.push(KR) : s.push(qR(n.extraArgument))), s;
    },
  JR = "RTK_autoBatch",
  vx = (e) => (t) => {
    setTimeout(t, e);
  },
  ZR = typeof window != "undefined" && window.requestAnimationFrame ? window.requestAnimationFrame : vx(10),
  eP =
    (e = { type: "raf" }) =>
    (t) =>
    (...n) => {
      const r = t(...n);
      let o = !0,
        i = !1,
        s = !1;
      const a = new Set(),
        l =
          e.type === "tick"
            ? queueMicrotask
            : e.type === "raf"
            ? ZR
            : e.type === "callback"
            ? e.queueNotification
            : vx(e.timeout),
        u = () => {
          (s = !1), i && ((i = !1), a.forEach((c) => c()));
        };
      return Object.assign({}, r, {
        subscribe(c) {
          const f = () => o && c(),
            d = r.subscribe(f);
          return (
            a.add(c),
            () => {
              d(), a.delete(c);
            }
          );
        },
        dispatch(c) {
          var f;
          try {
            return (
              (o = !((f = c == null ? void 0 : c.meta) != null && f[JR])),
              (i = !o),
              i && (s || ((s = !0), l(u))),
              r.dispatch(c)
            );
          } finally {
            o = !0;
          }
        },
      });
    },
  tP = (e) =>
    function (n) {
      const { autoBatch: r = !0 } = n != null ? n : {};
      let o = new yx(e);
      return r && o.push(eP(typeof r == "object" ? r : void 0)), o;
    },
  nP = !0;
function rP(e) {
  const t = XR(),
    {
      reducer: n = void 0,
      middleware: r,
      devTools: o = !0,
      preloadedState: i = void 0,
      enhancers: s = void 0,
    } = e || {};
  let a;
  if (typeof n == "function") a = n;
  else if (Qp(n)) a = bR(n);
  else throw new Error(_t(1));
  let l;
  typeof r == "function" ? (l = r(t)) : (l = t());
  let u = Wl;
  o && (u = QR(T({ trace: !nP }, typeof o == "object" && o)));
  const c = kR(...l),
    f = tP(c);
  let d = typeof s == "function" ? s(f) : f();
  const v = u(...d);
  return sx(a, i, v);
}
function wx(e) {
  const t = {},
    n = [];
  let r;
  const o = {
    addCase(i, s) {
      const a = typeof i == "string" ? i : i.type;
      if (!a) throw new Error(_t(28));
      if (a in t) throw new Error(_t(29));
      return (t[a] = s), o;
    },
    addMatcher(i, s) {
      return n.push({ matcher: i, reducer: s }), o;
    },
    addDefaultCase(i) {
      return (r = i), o;
    },
  };
  return e(o), [t, n, r];
}
function oP(e) {
  return typeof e == "function";
}
function iP(e, t) {
  let [n, r, o] = wx(t),
    i;
  if (oP(e)) i = () => Fg(e());
  else {
    const a = Fg(e);
    i = () => a;
  }
  function s(a = i(), l) {
    let u = [n[l.type], ...r.filter(({ matcher: c }) => c(l)).map(({ reducer: c }) => c)];
    return (
      u.filter((c) => !!c).length === 0 && (u = [o]),
      u.reduce((c, f) => {
        if (f)
          if (Ar(c)) {
            const v = f(c, l);
            return v === void 0 ? c : v;
          } else {
            if (Qn(c)) return hx(c, (d) => f(d, l));
            {
              const d = f(c, l);
              if (d === void 0) {
                if (c === null) return c;
                throw new Error(_t(9));
              }
              return d;
            }
          }
        return c;
      }, a)
    );
  }
  return (s.getInitialState = i), s;
}
var sP = "ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW",
  aP = (e = 21) => {
    let t = "",
      n = e;
    for (; n--; ) t += sP[(Math.random() * 64) | 0];
    return t;
  },
  lP = Symbol.for("rtk-slice-createasyncthunk");
function uP(e, t) {
  return `${e}/${t}`;
}
function cP({ creators: e } = {}) {
  var n;
  const t = (n = e == null ? void 0 : e.asyncThunk) == null ? void 0 : n[lP];
  return function (o) {
    const { name: i, reducerPath: s = i } = o;
    if (!i) throw new Error(_t(11));
    const a = (typeof o.reducers == "function" ? o.reducers(dP()) : o.reducers) || {},
      l = Object.keys(a),
      u = { sliceCaseReducersByName: {}, sliceCaseReducersByType: {}, actionCreators: {}, sliceMatchers: [] },
      c = {
        addCase(w, S) {
          const C = typeof w == "string" ? w : w.type;
          if (!C) throw new Error(_t(12));
          if (C in u.sliceCaseReducersByType) throw new Error(_t(13));
          return (u.sliceCaseReducersByType[C] = S), c;
        },
        addMatcher(w, S) {
          return u.sliceMatchers.push({ matcher: w, reducer: S }), c;
        },
        exposeAction(w, S) {
          return (u.actionCreators[w] = S), c;
        },
        exposeCaseReducer(w, S) {
          return (u.sliceCaseReducersByName[w] = S), c;
        },
      };
    l.forEach((w) => {
      const S = a[w],
        C = { reducerName: w, type: uP(i, w), createNotation: typeof o.reducers == "function" };
      hP(S) ? gP(C, S, c, t) : pP(C, S, c);
    });
    function f() {
      const [w = {}, S = [], C = void 0] =
          typeof o.extraReducers == "function" ? wx(o.extraReducers) : [o.extraReducers],
        E = T(T({}, w), u.sliceCaseReducersByType);
      return iP(o.initialState, (P) => {
        for (let R in E) P.addCase(R, E[R]);
        for (let R of u.sliceMatchers) P.addMatcher(R.matcher, R.reducer);
        for (let R of S) P.addMatcher(R.matcher, R.reducer);
        C && P.addDefaultCase(C);
      });
    }
    const d = (w) => w,
      v = new Map();
    let m;
    function y(w, S) {
      return m || (m = f()), m(w, S);
    }
    function x() {
      return m || (m = f()), m.getInitialState();
    }
    function p(w, S = !1) {
      function C(P) {
        let R = P[w];
        return typeof R == "undefined" && S && (R = x()), R;
      }
      function E(P = d) {
        const R = Ig(v, S, { insert: () => new WeakMap() });
        return Ig(R, P, {
          insert: () => {
            var D;
            const A = {};
            for (const [U, I] of Object.entries((D = o.selectors) != null ? D : {})) A[U] = fP(I, P, x, S);
            return A;
          },
        });
      }
      return {
        reducerPath: w,
        getSelectors: E,
        get selectors() {
          return E(C);
        },
        selectSlice: C,
      };
    }
    const g = F(
      T(
        { name: i, reducer: y, actions: u.actionCreators, caseReducers: u.sliceCaseReducersByName, getInitialState: x },
        p(s)
      ),
      {
        injectInto(w, E = {}) {
          var P = E,
            { reducerPath: S } = P,
            C = G(P, ["reducerPath"]);
          const R = S != null ? S : s;
          return w.inject({ reducerPath: R, reducer: y }, C), T(T({}, g), p(R, !0));
        },
      }
    );
    return g;
  };
}
function fP(e, t, n, r) {
  function o(i, ...s) {
    let a = t(i);
    return typeof a == "undefined" && r && (a = n()), e(a, ...s);
  }
  return (o.unwrapped = e), o;
}
var Au = cP();
function dP() {
  function e(t, n) {
    return T({ _reducerDefinitionType: "asyncThunk", payloadCreator: t }, n);
  }
  return (
    (e.withTypes = () => e),
    {
      reducer(t) {
        return Object.assign(
          {
            [t.name](...n) {
              return t(...n);
            },
          }[t.name],
          { _reducerDefinitionType: "reducer" }
        );
      },
      preparedReducer(t, n) {
        return { _reducerDefinitionType: "reducerWithPrepare", prepare: t, reducer: n };
      },
      asyncThunk: e,
    }
  );
}
function pP({ type: e, reducerName: t, createNotation: n }, r, o) {
  let i, s;
  if ("reducer" in r) {
    if (n && !mP(r)) throw new Error(_t(17));
    (i = r.reducer), (s = r.prepare);
  } else i = r;
  o.addCase(e, i)
    .exposeCaseReducer(t, i)
    .exposeAction(t, s ? si(e, s) : si(e));
}
function hP(e) {
  return e._reducerDefinitionType === "asyncThunk";
}
function mP(e) {
  return e._reducerDefinitionType === "reducerWithPrepare";
}
function gP({ type: e, reducerName: t }, n, r, o) {
  if (!o) throw new Error(_t(18));
  const { payloadCreator: i, fulfilled: s, pending: a, rejected: l, settled: u, options: c } = n,
    f = o(e, i, c);
  r.exposeAction(t, f),
    s && r.addCase(f.fulfilled, s),
    a && r.addCase(f.pending, a),
    l && r.addCase(f.rejected, l),
    u && r.addMatcher(f.settled, u),
    r.exposeCaseReducer(t, { fulfilled: s || ja, pending: a || ja, rejected: l || ja, settled: u || ja });
}
function ja() {}
var yP = (e, t) => {
    if (typeof e != "function") throw new Error(_t(32));
  },
  Zp = "listenerMiddleware",
  vP = (e) => {
    let { type: t, actionCreator: n, matcher: r, predicate: o, effect: i } = e;
    if (t) o = si(t).match;
    else if (n) (t = n.type), (o = n.match);
    else if (r) o = r;
    else if (!o) throw new Error(_t(21));
    return yP(i), { predicate: o, type: t, effect: i };
  },
  wP = Object.assign(
    (e) => {
      const { type: t, predicate: n, effect: r } = vP(e);
      return {
        id: aP(),
        effect: r,
        type: t,
        predicate: n,
        pending: new Set(),
        unsubscribe: () => {
          throw new Error(_t(22));
        },
      };
    },
    { withTypes: () => wP }
  ),
  xP = Object.assign(si(`${Zp}/add`), { withTypes: () => xP });
si(`${Zp}/removeAll`);
var SP = Object.assign(si(`${Zp}/remove`), { withTypes: () => SP });
function _t(e) {
  return `Minified Redux Toolkit error #${e}; visit https://redux-toolkit.js.org/Errors?code=${e} for the full message or use the non-minified dev environment for full errors. `;
}
const Ic = sw("user_image"),
  EP = sw("full_name");
var Ny, Ly, Dy, My, jy, Fy, Iy;
const CP = {
    roles:
      (My =
        (Dy = (Ly = (Ny = window.frappe) == null ? void 0 : Ny.boot) == null ? void 0 : Ly.user) == null
          ? void 0
          : Dy.roles) != null
        ? My
        : [],
    userName: (jy = decodeURIComponent(EP)) != null ? jy : "",
    image: Ic != null ? Ic : "",
    appLogo: (Iy = (Fy = window.frappe) == null ? void 0 : Fy.boot) == null ? void 0 : Iy.app_logo_url,
    isSidebarCollapsed: !1,
    employee: "",
  },
  xx = Au({
    name: "user",
    initialState: CP,
    reducers: {
      setRole: (e, t) => {
        e.roles = t.payload;
      },
      setUserName: (e, t) => {
        e.userName = t.payload;
      },
      setImage: (e, t) => {
        e.image = t.payload;
      },
      setAppLogo: (e, t) => {
        e.appLogo = t.payload;
      },
      setSidebarCollapsed: (e, t) => {
        e.isSidebarCollapsed = t.payload;
      },
      setEmployee: (e, t) => {
        e.employee = t.payload;
      },
    },
  }),
  { setRole: bP, setImage: K2, setUserName: q2, setAppLogo: kP, setSidebarCollapsed: _P, setEmployee: TP } = xx.actions,
  RP = xx.reducer,
  PP = {
    timesheet: { name: "", parent: "", task: "", date: "", description: "", hours: 0, isUpdate: !1, employee: "" },
    dateRange: { start_date: "", end_date: "" },
    isFetching: !1,
    isFetchAgain: !1,
    data: { working_hour: 0, working_frequency: "Per Day", data: {}, leaves: [], holidays: [] },
    isDialogOpen: !1,
    isAprrovalDialogOpen: !1,
    weekDate: Ul(),
  },
  Sx = Au({
    name: "timesheet",
    initialState: PP,
    reducers: {
      setData: (e, t) => {
        e.data = t.payload;
      },
      SetFetching: (e, t) => {
        e.isFetching = t.payload;
      },
      SetFetchAgain: (e, t) => {
        e.isFetchAgain = t.payload;
      },
      setDateRange: (e, t) => {
        e.dateRange = t.payload;
      },
      SetTimesheet: (e, t) => {
        e.timesheet = t.payload;
      },
      SetWeekDate: (e, t) => {
        e.weekDate = t.payload;
      },
      SetAddTimeDialog: (e, t) => {
        e.isDialogOpen = t.payload;
      },
      setApprovalDialog: (e, t) => {
        e.isAprrovalDialogOpen = t.payload;
      },
      AppendData: (e, t) => {
        const n = Object.assign(e.data.data, t.payload.data);
        (e.data.data = n),
          (e.data.holidays = [...e.data.holidays, ...t.payload.holidays]),
          (e.data.leaves = [...e.data.leaves, ...t.payload.leaves]);
      },
      resetState: (e) => {},
    },
  }),
  {
    setData: G2,
    SetFetching: Q2,
    SetFetchAgain: Y2,
    setDateRange: X2,
    SetTimesheet: J2,
    SetWeekDate: Z2,
    SetAddTimeDialog: eM,
    setApprovalDialog: tM,
    AppendData: nM,
    resetState: rM,
  } = Sx.actions,
  OP = Sx.reducer;
function AP(e) {
  const t = Object.prototype.toString.call(e);
  return e instanceof Date || (typeof e == "object" && t === "[object Date]")
    ? new e.constructor(+e)
    : typeof e == "number" || t === "[object Number]" || typeof e == "string" || t === "[object String]"
    ? new Date(e)
    : new Date(NaN);
}
function NP(e, t) {
  return e instanceof Date ? new e.constructor(t) : new Date(t);
}
function LP(e, t) {
  const n = AP(e);
  return isNaN(t) ? NP(e, NaN) : (t && n.setDate(n.getDate() + t), n);
}
const Hr = {
    timesheet: { name: "", parent: "", task: "", date: "", description: "", hours: 0, isUpdate: !1 },
    employee: "",
    projectSearch: "",
    userGroupSearch: "",
    isFetchAgain: !1,
    data: { data: {}, dates: [], total_count: 0, has_more: !1 },
    isDialogOpen: !1,
    isAprrovalDialogOpen: !1,
    weekDate: Yf(LP(Ul(), -7)),
    employeeWeekDate: Yf(Ul()),
    project: [],
    userGroup: [],
    statusFilter: ["Not Submitted"],
    start: 0,
    hasMore: !0,
    dateRange: { start_date: "", end_date: "" },
    timesheetData: { working_hour: 0, working_frequency: "Per Day", data: {}, leaves: [], holidays: [] },
  },
  Ex = Au({
    name: "team",
    initialState: Hr,
    reducers: {
      setData: (e, t) => {
        (e.data = t.payload), (e.hasMore = t.payload.has_more);
      },
      setStatusFilter: (e, t) => {
        (e.statusFilter = t.payload), (e.start = 0), (e.data = Hr.data), (e.isFetchAgain = !0);
      },
      updateData: (e, t) => {
        const n = e.data.data;
        (e.data.data = T(T({}, n), t.payload.data)), (e.hasMore = t.payload.has_more);
      },
      setFetchAgain: (e, t) => {
        e.isFetchAgain = t.payload;
      },
      setTimesheet: (e, t) => {
        (e.timesheet = t.payload.timesheet), (e.employee = t.payload.id), (e.isDialogOpen = !0);
      },
      setWeekDate: (e, t) => {
        (e.weekDate = t.payload), (e.data = Hr.data), (e.start = 0), (e.isFetchAgain = !0);
      },
      setEmployeeWeekDate: (e, t) => {
        (e.employeeWeekDate = t.payload), (e.isFetchAgain = !0);
      },
      setProject: (e, t) => {
        (e.project = t.payload), (e.data = Hr.data), (e.start = 0), (e.isFetchAgain = !0);
      },
      setStart: (e, t) => {
        (e.start = t.payload), (e.isFetchAgain = !0);
      },
      setHasMore: (e, t) => {
        e.hasMore = t.payload;
      },
      setDateRange: (e, t) => {
        (e.dateRange = t.payload.dateRange),
          (e.employee = t.payload.employee),
          (e.isAprrovalDialogOpen = t.payload.isAprrovalDialogOpen);
      },
      setApprovalDialog: (e, t) => {
        e.isAprrovalDialogOpen = t.payload;
      },
      setEmployee: (e, t) => {
        e.employee = t.payload;
      },
      setDialog: (e, t) => {
        e.isDialogOpen = t.payload;
      },
      resetState: (e) => {},
      resetTimesheetDataState: (e) => {
        e.timesheetData = Hr.timesheetData;
      },
      setTimesheetData: (e, t) => {
        e.timesheetData = t.payload;
      },
      updateTimesheetData: (e, t) => {
        const n = Object.assign(e.timesheetData.data, t.payload.data);
        (e.timesheetData.data = n),
          (e.timesheetData.working_hour = t.payload.working_hour),
          (e.timesheetData.working_frequency = t.payload.working_frequency),
          (e.timesheetData.holidays = [...e.timesheetData.holidays, ...t.payload.holidays]),
          (e.timesheetData.leaves = [...e.timesheetData.leaves, ...t.payload.leaves]);
      },
      setUsergroup: (e, t) => {
        (e.userGroup = t.payload), (e.data = Hr.data), (e.start = 0), (e.isFetchAgain = !0);
      },
      setUserGroupSearch: (e, t) => {
        e.userGroupSearch = t.payload;
      },
      setProjectSearch: (e, t) => {
        e.projectSearch = t.payload;
      },
      setFilters: (e, t) => {
        (e.project = t.payload.project),
          (e.userGroup = t.payload.userGroup),
          (e.statusFilter = t.payload.statusFilter),
          (e.start = 0),
          (e.data = Hr.data),
          (e.isFetchAgain = !0);
      },
    },
  }),
  {
    setData: oM,
    setFetchAgain: iM,
    setTimesheet: sM,
    setWeekDate: aM,
    setProject: lM,
    setStart: uM,
    setHasMore: cM,
    updateData: fM,
    setDateRange: dM,
    setApprovalDialog: pM,
    setEmployee: hM,
    setDialog: mM,
    resetState: gM,
    setTimesheetData: yM,
    updateTimesheetData: vM,
    setUsergroup: wM,
    setUserGroupSearch: xM,
    setProjectSearch: SM,
    resetTimesheetDataState: EM,
    setStatusFilter: CM,
    setFilters: bM,
    setEmployeeWeekDate: kM,
  } = Ex.actions,
  DP = Ex.reducer,
  $c = {
    timesheet: { name: "", parent: "", task: "", date: "", description: "", hours: 0, isUpdate: !1, employee: "" },
    isFetchAgain: !1,
    data: { data: [], dates: [], total_count: 0, has_more: !0 },
    isDialogOpen: !1,
    isAprrovalDialogOpen: !1,
    employeeName: "",
    weekDate: Ul(),
    start: 0,
    hasMore: !0,
  },
  Cx = Au({
    name: "home",
    initialState: $c,
    reducers: {
      setData: (e, t) => {
        (e.data = t.payload), (e.hasMore = t.payload.has_more);
      },
      setFetchAgain: (e, t) => {
        e.isFetchAgain = t.payload;
      },
      setTimesheet: (e, t) => {
        e.timesheet = t.payload;
      },
      setWeekDate: (e, t) => {
        (e.weekDate = t.payload), (e.data = $c.data), (e.start = 0), (e.isFetchAgain = !0);
      },
      setEmployeeName: (e, t) => {
        (e.employeeName = t.payload), (e.data = $c.data), (e.start = 0), (e.isFetchAgain = !0);
      },
      setStart: (e, t) => {
        e.start = t.payload;
      },
      setHasMore: (e, t) => {
        e.hasMore = t.payload;
      },
      updateData: (e, t) => {
        const n = e.data.data;
        (e.data.data = T(T({}, n), t.payload.data)), (e.data.dates = t.payload.dates), (e.hasMore = t.payload.has_more);
      },
    },
  }),
  {
    setData: _M,
    setFetchAgain: TM,
    setTimesheet: RM,
    setWeekDate: PM,
    setEmployeeName: OM,
    setStart: AM,
    setHasMore: NM,
    updateData: LM,
  } = Cx.actions,
  MP = Cx.reducer,
  jP = rP({ reducer: { user: RP, timesheet: OP, team: DP, home: MP } });
/**
 * @remix-run/router v1.19.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function Ne() {
  return (
    (Ne = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
          }
          return e;
        }),
    Ne.apply(this, arguments)
  );
}
var Ge;
(function (e) {
  (e.Pop = "POP"), (e.Push = "PUSH"), (e.Replace = "REPLACE");
})(Ge || (Ge = {}));
const $g = "popstate";
function FP(e) {
  e === void 0 && (e = {});
  function t(r, o) {
    let { pathname: i, search: s, hash: a } = r.location;
    return As(
      "",
      { pathname: i, search: s, hash: a },
      (o.state && o.state.usr) || null,
      (o.state && o.state.key) || "default"
    );
  }
  function n(r, o) {
    return typeof o == "string" ? o : fo(o);
  }
  return $P(t, n, null, e);
}
function re(e, t) {
  if (e === !1 || e === null || typeof e == "undefined") throw new Error(t);
}
function ai(e, t) {
  if (!e) {
    typeof console != "undefined" && console.warn(t);
    try {
      throw new Error(t);
    } catch (n) {}
  }
}
function IP() {
  return Math.random().toString(36).substr(2, 8);
}
function zg(e, t) {
  return { usr: e.state, key: e.key, idx: t };
}
function As(e, t, n, r) {
  return (
    n === void 0 && (n = null),
    Ne({ pathname: typeof e == "string" ? e : e.pathname, search: "", hash: "" }, typeof t == "string" ? $r(t) : t, {
      state: n,
      key: (t && t.key) || r || IP(),
    })
  );
}
function fo(e) {
  let { pathname: t = "/", search: n = "", hash: r = "" } = e;
  return (
    n && n !== "?" && (t += n.charAt(0) === "?" ? n : "?" + n),
    r && r !== "#" && (t += r.charAt(0) === "#" ? r : "#" + r),
    t
  );
}
function $r(e) {
  let t = {};
  if (e) {
    let n = e.indexOf("#");
    n >= 0 && ((t.hash = e.substr(n)), (e = e.substr(0, n)));
    let r = e.indexOf("?");
    r >= 0 && ((t.search = e.substr(r)), (e = e.substr(0, r))), e && (t.pathname = e);
  }
  return t;
}
function $P(e, t, n, r) {
  r === void 0 && (r = {});
  let { window: o = document.defaultView, v5Compat: i = !1 } = r,
    s = o.history,
    a = Ge.Pop,
    l = null,
    u = c();
  u == null && ((u = 0), s.replaceState(Ne({}, s.state, { idx: u }), ""));
  function c() {
    return (s.state || { idx: null }).idx;
  }
  function f() {
    a = Ge.Pop;
    let x = c(),
      p = x == null ? null : x - u;
    (u = x), l && l({ action: a, location: y.location, delta: p });
  }
  function d(x, p) {
    a = Ge.Push;
    let g = As(y.location, x, p);
    u = c() + 1;
    let w = zg(g, u),
      S = y.createHref(g);
    try {
      s.pushState(w, "", S);
    } catch (C) {
      if (C instanceof DOMException && C.name === "DataCloneError") throw C;
      o.location.assign(S);
    }
    i && l && l({ action: a, location: y.location, delta: 1 });
  }
  function v(x, p) {
    a = Ge.Replace;
    let g = As(y.location, x, p);
    u = c();
    let w = zg(g, u),
      S = y.createHref(g);
    s.replaceState(w, "", S), i && l && l({ action: a, location: y.location, delta: 0 });
  }
  function m(x) {
    let p = o.location.origin !== "null" ? o.location.origin : o.location.href,
      g = typeof x == "string" ? x : fo(x);
    return (
      (g = g.replace(/ $/, "%20")),
      re(p, "No window.location.(origin|href) available to create URL for href: " + g),
      new URL(g, p)
    );
  }
  let y = {
    get action() {
      return a;
    },
    get location() {
      return e(o, s);
    },
    listen(x) {
      if (l) throw new Error("A history only accepts one active listener");
      return (
        o.addEventListener($g, f),
        (l = x),
        () => {
          o.removeEventListener($g, f), (l = null);
        }
      );
    },
    createHref(x) {
      return t(o, x);
    },
    createURL: m,
    encodeLocation(x) {
      let p = m(x);
      return { pathname: p.pathname, search: p.search, hash: p.hash };
    },
    push: d,
    replace: v,
    go(x) {
      return s.go(x);
    },
  };
  return y;
}
var Se;
(function (e) {
  (e.data = "data"), (e.deferred = "deferred"), (e.redirect = "redirect"), (e.error = "error");
})(Se || (Se = {}));
const zP = new Set(["lazy", "caseSensitive", "path", "id", "index", "children"]);
function UP(e) {
  return e.index === !0;
}
function Ns(e, t, n, r) {
  return (
    n === void 0 && (n = []),
    r === void 0 && (r = {}),
    e.map((o, i) => {
      let s = [...n, String(i)],
        a = typeof o.id == "string" ? o.id : s.join("-");
      if (
        (re(o.index !== !0 || !o.children, "Cannot specify children on an index route"),
        re(
          !r[a],
          'Found a route id collision on id "' + a + `".  Route id's must be globally unique within Data Router usages`
        ),
        UP(o))
      ) {
        let l = Ne({}, o, t(o), { id: a });
        return (r[a] = l), l;
      } else {
        let l = Ne({}, o, t(o), { id: a, children: void 0 });
        return (r[a] = l), o.children && (l.children = Ns(o.children, t, s, r)), l;
      }
    })
  );
}
function Qr(e, t, n) {
  return n === void 0 && (n = "/"), ul(e, t, n, !1);
}
function ul(e, t, n, r) {
  let o = typeof t == "string" ? $r(t) : t,
    i = Yn(o.pathname || "/", n);
  if (i == null) return null;
  let s = bx(e);
  VP(s);
  let a = null;
  for (let l = 0; a == null && l < s.length; ++l) {
    let u = eO(i);
    a = JP(s[l], u, r);
  }
  return a;
}
function BP(e, t) {
  let { route: n, pathname: r, params: o } = e;
  return { id: n.id, pathname: r, params: o, data: t[n.id], handle: n.handle };
}
function bx(e, t, n, r) {
  t === void 0 && (t = []), n === void 0 && (n = []), r === void 0 && (r = "");
  let o = (i, s, a) => {
    let l = {
      relativePath: a === void 0 ? i.path || "" : a,
      caseSensitive: i.caseSensitive === !0,
      childrenIndex: s,
      route: i,
    };
    l.relativePath.startsWith("/") &&
      (re(
        l.relativePath.startsWith(r),
        'Absolute route path "' +
          l.relativePath +
          '" nested under path ' +
          ('"' + r + '" is not valid. An absolute child route path ') +
          "must start with the combined path of all its parent routes."
      ),
      (l.relativePath = l.relativePath.slice(r.length)));
    let u = Vn([r, l.relativePath]),
      c = n.concat(l);
    i.children &&
      i.children.length > 0 &&
      (re(
        i.index !== !0,
        "Index routes must not have child routes. Please remove " + ('all child routes from route path "' + u + '".')
      ),
      bx(i.children, t, c, u)),
      !(i.path == null && !i.index) && t.push({ path: u, score: YP(u, i.index), routesMeta: c });
  };
  return (
    e.forEach((i, s) => {
      var a;
      if (i.path === "" || !((a = i.path) != null && a.includes("?"))) o(i, s);
      else for (let l of kx(i.path)) o(i, s, l);
    }),
    t
  );
}
function kx(e) {
  let t = e.split("/");
  if (t.length === 0) return [];
  let [n, ...r] = t,
    o = n.endsWith("?"),
    i = n.replace(/\?$/, "");
  if (r.length === 0) return o ? [i, ""] : [i];
  let s = kx(r.join("/")),
    a = [];
  return (
    a.push(...s.map((l) => (l === "" ? i : [i, l].join("/")))),
    o && a.push(...s),
    a.map((l) => (e.startsWith("/") && l === "" ? "/" : l))
  );
}
function VP(e) {
  e.sort((t, n) =>
    t.score !== n.score
      ? n.score - t.score
      : XP(
          t.routesMeta.map((r) => r.childrenIndex),
          n.routesMeta.map((r) => r.childrenIndex)
        )
  );
}
const WP = /^:[\w-]+$/,
  HP = 3,
  KP = 2,
  qP = 1,
  GP = 10,
  QP = -2,
  Ug = (e) => e === "*";
function YP(e, t) {
  let n = e.split("/"),
    r = n.length;
  return (
    n.some(Ug) && (r += QP),
    t && (r += KP),
    n.filter((o) => !Ug(o)).reduce((o, i) => o + (WP.test(i) ? HP : i === "" ? qP : GP), r)
  );
}
function XP(e, t) {
  return e.length === t.length && e.slice(0, -1).every((r, o) => r === t[o]) ? e[e.length - 1] - t[t.length - 1] : 0;
}
function JP(e, t, n) {
  n === void 0 && (n = !1);
  let { routesMeta: r } = e,
    o = {},
    i = "/",
    s = [];
  for (let a = 0; a < r.length; ++a) {
    let l = r[a],
      u = a === r.length - 1,
      c = i === "/" ? t : t.slice(i.length) || "/",
      f = Gl({ path: l.relativePath, caseSensitive: l.caseSensitive, end: u }, c),
      d = l.route;
    if (
      (!f &&
        u &&
        n &&
        !r[r.length - 1].route.index &&
        (f = Gl({ path: l.relativePath, caseSensitive: l.caseSensitive, end: !1 }, c)),
      !f)
    )
      return null;
    Object.assign(o, f.params),
      s.push({ params: o, pathname: Vn([i, f.pathname]), pathnameBase: rO(Vn([i, f.pathnameBase])), route: d }),
      f.pathnameBase !== "/" && (i = Vn([i, f.pathnameBase]));
  }
  return s;
}
function Gl(e, t) {
  typeof e == "string" && (e = { path: e, caseSensitive: !1, end: !0 });
  let [n, r] = ZP(e.path, e.caseSensitive, e.end),
    o = t.match(n);
  if (!o) return null;
  let i = o[0],
    s = i.replace(/(.)\/+$/, "$1"),
    a = o.slice(1);
  return {
    params: r.reduce((u, c, f) => {
      let { paramName: d, isOptional: v } = c;
      if (d === "*") {
        let y = a[f] || "";
        s = i.slice(0, i.length - y.length).replace(/(.)\/+$/, "$1");
      }
      const m = a[f];
      return v && !m ? (u[d] = void 0) : (u[d] = (m || "").replace(/%2F/g, "/")), u;
    }, {}),
    pathname: i,
    pathnameBase: s,
    pattern: e,
  };
}
function ZP(e, t, n) {
  t === void 0 && (t = !1),
    n === void 0 && (n = !0),
    ai(
      e === "*" || !e.endsWith("*") || e.endsWith("/*"),
      'Route path "' +
        e +
        '" will be treated as if it were ' +
        ('"' + e.replace(/\*$/, "/*") + '" because the `*` character must ') +
        "always follow a `/` in the pattern. To get rid of this warning, " +
        ('please change the route path to "' + e.replace(/\*$/, "/*") + '".')
    );
  let r = [],
    o =
      "^" +
      e
        .replace(/\/*\*?$/, "")
        .replace(/^\/*/, "/")
        .replace(/[\\.*+^${}|()[\]]/g, "\\$&")
        .replace(
          /\/:([\w-]+)(\?)?/g,
          (s, a, l) => (r.push({ paramName: a, isOptional: l != null }), l ? "/?([^\\/]+)?" : "/([^\\/]+)")
        );
  return (
    e.endsWith("*")
      ? (r.push({ paramName: "*" }), (o += e === "*" || e === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$"))
      : n
      ? (o += "\\/*$")
      : e !== "" && e !== "/" && (o += "(?:(?=\\/|$))"),
    [new RegExp(o, t ? void 0 : "i"), r]
  );
}
function eO(e) {
  try {
    return e
      .split("/")
      .map((t) => decodeURIComponent(t).replace(/\//g, "%2F"))
      .join("/");
  } catch (t) {
    return (
      ai(
        !1,
        'The URL path "' +
          e +
          '" could not be decoded because it is is a malformed URL segment. This is probably due to a bad percent ' +
          ("encoding (" + t + ").")
      ),
      e
    );
  }
}
function Yn(e, t) {
  if (t === "/") return e;
  if (!e.toLowerCase().startsWith(t.toLowerCase())) return null;
  let n = t.endsWith("/") ? t.length - 1 : t.length,
    r = e.charAt(n);
  return r && r !== "/" ? null : e.slice(n) || "/";
}
function tO(e, t) {
  t === void 0 && (t = "/");
  let { pathname: n, search: r = "", hash: o = "" } = typeof e == "string" ? $r(e) : e;
  return { pathname: n ? (n.startsWith("/") ? n : nO(n, t)) : t, search: oO(r), hash: iO(o) };
}
function nO(e, t) {
  let n = t.replace(/\/+$/, "").split("/");
  return (
    e.split("/").forEach((o) => {
      o === ".." ? n.length > 1 && n.pop() : o !== "." && n.push(o);
    }),
    n.length > 1 ? n.join("/") : "/"
  );
}
function zc(e, t, n, r) {
  return (
    "Cannot include a '" +
    e +
    "' character in a manually specified " +
    ("`to." + t + "` field [" + JSON.stringify(r) + "].  Please separate it out to the ") +
    ("`to." + n + "` field. Alternatively you may provide the full path as ") +
    'a string in <Link to="..."> and the router will parse it for you.'
  );
}
function _x(e) {
  return e.filter((t, n) => n === 0 || (t.route.path && t.route.path.length > 0));
}
function Nu(e, t) {
  let n = _x(e);
  return t ? n.map((r, o) => (o === n.length - 1 ? r.pathname : r.pathnameBase)) : n.map((r) => r.pathnameBase);
}
function Lu(e, t, n, r) {
  r === void 0 && (r = !1);
  let o;
  typeof e == "string"
    ? (o = $r(e))
    : ((o = Ne({}, e)),
      re(!o.pathname || !o.pathname.includes("?"), zc("?", "pathname", "search", o)),
      re(!o.pathname || !o.pathname.includes("#"), zc("#", "pathname", "hash", o)),
      re(!o.search || !o.search.includes("#"), zc("#", "search", "hash", o)));
  let i = e === "" || o.pathname === "",
    s = i ? "/" : o.pathname,
    a;
  if (s == null) a = n;
  else {
    let f = t.length - 1;
    if (!r && s.startsWith("..")) {
      let d = s.split("/");
      for (; d[0] === ".."; ) d.shift(), (f -= 1);
      o.pathname = d.join("/");
    }
    a = f >= 0 ? t[f] : "/";
  }
  let l = tO(o, a),
    u = s && s !== "/" && s.endsWith("/"),
    c = (i || s === ".") && n.endsWith("/");
  return !l.pathname.endsWith("/") && (u || c) && (l.pathname += "/"), l;
}
const Vn = (e) => e.join("/").replace(/\/\/+/g, "/"),
  rO = (e) => e.replace(/\/+$/, "").replace(/^\/*/, "/"),
  oO = (e) => (!e || e === "?" ? "" : e.startsWith("?") ? e : "?" + e),
  iO = (e) => (!e || e === "#" ? "" : e.startsWith("#") ? e : "#" + e);
class Ql {
  constructor(t, n, r, o) {
    o === void 0 && (o = !1),
      (this.status = t),
      (this.statusText = n || ""),
      (this.internal = o),
      r instanceof Error ? ((this.data = r.toString()), (this.error = r)) : (this.data = r);
  }
}
function Du(e) {
  return (
    e != null &&
    typeof e.status == "number" &&
    typeof e.statusText == "string" &&
    typeof e.internal == "boolean" &&
    "data" in e
  );
}
const Tx = ["post", "put", "patch", "delete"],
  sO = new Set(Tx),
  aO = ["get", ...Tx],
  lO = new Set(aO),
  uO = new Set([301, 302, 303, 307, 308]),
  cO = new Set([307, 308]),
  Uc = {
    state: "idle",
    location: void 0,
    formMethod: void 0,
    formAction: void 0,
    formEncType: void 0,
    formData: void 0,
    json: void 0,
    text: void 0,
  },
  fO = {
    state: "idle",
    data: void 0,
    formMethod: void 0,
    formAction: void 0,
    formEncType: void 0,
    formData: void 0,
    json: void 0,
    text: void 0,
  },
  Ui = { state: "unblocked", proceed: void 0, reset: void 0, location: void 0 },
  eh = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
  dO = (e) => ({ hasErrorBoundary: !!e.hasErrorBoundary }),
  Rx = "remix-router-transitions";
function pO(e) {
  const t = e.window ? e.window : typeof window != "undefined" ? window : void 0,
    n = typeof t != "undefined" && typeof t.document != "undefined" && typeof t.document.createElement != "undefined",
    r = !n;
  re(e.routes.length > 0, "You must provide a non-empty routes array to createRouter");
  let o;
  if (e.mapRouteProperties) o = e.mapRouteProperties;
  else if (e.detectErrorBoundary) {
    let b = e.detectErrorBoundary;
    o = (_) => ({ hasErrorBoundary: b(_) });
  } else o = dO;
  let i = {},
    s = Ns(e.routes, o, void 0, i),
    a,
    l = e.basename || "/",
    u = e.unstable_dataStrategy || vO,
    c = e.unstable_patchRoutesOnMiss,
    f = Ne(
      {
        v7_fetcherPersist: !1,
        v7_normalizeFormMethod: !1,
        v7_partialHydration: !1,
        v7_prependBasename: !1,
        v7_relativeSplatPath: !1,
        v7_skipActionErrorRevalidation: !1,
      },
      e.future
    ),
    d = null,
    v = new Set(),
    m = null,
    y = null,
    x = null,
    p = e.hydrationData != null,
    g = Qr(s, e.history.location, l),
    w = null;
  if (g == null && !c) {
    let b = mt(404, { pathname: e.history.location.pathname }),
      { matches: _, route: O } = Xg(s);
    (g = _), (w = { [O.id]: b });
  }
  g && !e.hydrationData && ta(g, s, e.history.location.pathname).active && (g = null);
  let S;
  if (g)
    if (g.some((b) => b.route.lazy)) S = !1;
    else if (!g.some((b) => b.route.loader)) S = !0;
    else if (f.v7_partialHydration) {
      let b = e.hydrationData ? e.hydrationData.loaderData : null,
        _ = e.hydrationData ? e.hydrationData.errors : null,
        O = (N) =>
          N.route.loader
            ? typeof N.route.loader == "function" && N.route.loader.hydrate === !0
              ? !1
              : (b && b[N.route.id] !== void 0) || (_ && _[N.route.id] !== void 0)
            : !0;
      if (_) {
        let N = g.findIndex((V) => _[V.route.id] !== void 0);
        S = g.slice(0, N + 1).every(O);
      } else S = g.every(O);
    } else S = e.hydrationData != null;
  else if (((S = !1), (g = []), f.v7_partialHydration)) {
    let b = ta(null, s, e.history.location.pathname);
    b.active && b.matches && (g = b.matches);
  }
  let C,
    E = {
      historyAction: e.history.action,
      location: e.history.location,
      matches: g,
      initialized: S,
      navigation: Uc,
      restoreScrollPosition: e.hydrationData != null ? !1 : null,
      preventScrollReset: !1,
      revalidation: "idle",
      loaderData: (e.hydrationData && e.hydrationData.loaderData) || {},
      actionData: (e.hydrationData && e.hydrationData.actionData) || null,
      errors: (e.hydrationData && e.hydrationData.errors) || w,
      fetchers: new Map(),
      blockers: new Map(),
    },
    P = Ge.Pop,
    R = !1,
    A,
    D = !1,
    U = new Map(),
    I = null,
    Q = !1,
    X = !1,
    B = [],
    te = new Set(),
    W = new Map(),
    M = 0,
    $ = -1,
    H = new Map(),
    q = new Set(),
    oe = new Map(),
    $e = new Map(),
    Ee = new Set(),
    ze = new Map(),
    We = new Map(),
    Bt = new Map(),
    nr = !1;
  function vo() {
    if (
      ((d = e.history.listen((b) => {
        let { action: _, location: O, delta: N } = b;
        if (nr) {
          nr = !1;
          return;
        }
        ai(
          We.size === 0 || N != null,
          "You are trying to use a blocker on a POP navigation to a location that was not created by @remix-run/router. This will fail silently in production. This can happen if you are navigating outside the router via `window.history.pushState`/`window.location.hash` instead of using router navigation APIs.  This can also happen if you are using createHashRouter and the user manually changes the URL."
        );
        let V = Ah({ currentLocation: E.location, nextLocation: O, historyAction: _ });
        if (V && N != null) {
          (nr = !0),
            e.history.go(N * -1),
            Zs(V, {
              state: "blocked",
              location: O,
              proceed() {
                Zs(V, { state: "proceeding", proceed: void 0, reset: void 0, location: O }), e.history.go(N);
              },
              reset() {
                let Y = new Map(E.blockers);
                Y.set(V, Ui), ne({ blockers: Y });
              },
            });
          return;
        }
        return Ue(_, O);
      })),
      n)
    ) {
      AO(t, U);
      let b = () => NO(t, U);
      t.addEventListener("pagehide", b), (I = () => t.removeEventListener("pagehide", b));
    }
    return E.initialized || Ue(Ge.Pop, E.location, { initialHydration: !0 }), C;
  }
  function hn() {
    d && d(),
      I && I(),
      v.clear(),
      A && A.abort(),
      E.fetchers.forEach((b, _) => Js(_)),
      E.blockers.forEach((b, _) => Oh(_));
  }
  function Ur(b) {
    return v.add(b), () => v.delete(b);
  }
  function ne(b, _) {
    _ === void 0 && (_ = {}), (E = Ne({}, E, b));
    let O = [],
      N = [];
    f.v7_fetcherPersist &&
      E.fetchers.forEach((V, Y) => {
        V.state === "idle" && (Ee.has(Y) ? N.push(Y) : O.push(Y));
      }),
      [...v].forEach((V) =>
        V(E, {
          deletedFetchers: N,
          unstable_viewTransitionOpts: _.viewTransitionOpts,
          unstable_flushSync: _.flushSync === !0,
        })
      ),
      f.v7_fetcherPersist && (O.forEach((V) => E.fetchers.delete(V)), N.forEach((V) => Js(V)));
  }
  function ce(b, _, O) {
    var N, V;
    let { flushSync: Y } = O === void 0 ? {} : O,
      ee =
        E.actionData != null &&
        E.navigation.formMethod != null &&
        sn(E.navigation.formMethod) &&
        E.navigation.state === "loading" &&
        ((N = b.state) == null ? void 0 : N._isRedirect) !== !0,
      z;
    _.actionData
      ? Object.keys(_.actionData).length > 0
        ? (z = _.actionData)
        : (z = null)
      : ee
      ? (z = E.actionData)
      : (z = null);
    let ie = _.loaderData ? Qg(E.loaderData, _.loaderData, _.matches || [], _.errors) : E.loaderData,
      J = E.blockers;
    J.size > 0 && ((J = new Map(J)), J.forEach((ye, Ce) => J.set(Ce, Ui)));
    let Z =
      R === !0 ||
      (E.navigation.formMethod != null &&
        sn(E.navigation.formMethod) &&
        ((V = b.state) == null ? void 0 : V._isRedirect) !== !0);
    a && ((s = a), (a = void 0)),
      Q ||
        P === Ge.Pop ||
        (P === Ge.Push ? e.history.push(b, b.state) : P === Ge.Replace && e.history.replace(b, b.state));
    let xe;
    if (P === Ge.Pop) {
      let ye = U.get(E.location.pathname);
      ye && ye.has(b.pathname)
        ? (xe = { currentLocation: E.location, nextLocation: b })
        : U.has(b.pathname) && (xe = { currentLocation: b, nextLocation: E.location });
    } else if (D) {
      let ye = U.get(E.location.pathname);
      ye ? ye.add(b.pathname) : ((ye = new Set([b.pathname])), U.set(E.location.pathname, ye)),
        (xe = { currentLocation: E.location, nextLocation: b });
    }
    ne(
      Ne({}, _, {
        actionData: z,
        loaderData: ie,
        historyAction: P,
        location: b,
        initialized: !0,
        navigation: Uc,
        revalidation: "idle",
        restoreScrollPosition: Lh(b, _.matches || E.matches),
        preventScrollReset: Z,
        blockers: J,
      }),
      { viewTransitionOpts: xe, flushSync: Y === !0 }
    ),
      (P = Ge.Pop),
      (R = !1),
      (D = !1),
      (Q = !1),
      (X = !1),
      (B = []);
  }
  function Ae(b, _) {
    return le(this, null, function* () {
      if (typeof b == "number") {
        e.history.go(b);
        return;
      }
      let O = xd(
          E.location,
          E.matches,
          l,
          f.v7_prependBasename,
          b,
          f.v7_relativeSplatPath,
          _ == null ? void 0 : _.fromRouteId,
          _ == null ? void 0 : _.relative
        ),
        { path: N, submission: V, error: Y } = Bg(f.v7_normalizeFormMethod, !1, O, _),
        ee = E.location,
        z = As(E.location, N, _ && _.state);
      z = Ne({}, z, e.history.encodeLocation(z));
      let ie = _ && _.replace != null ? _.replace : void 0,
        J = Ge.Push;
      ie === !0
        ? (J = Ge.Replace)
        : ie === !1 ||
          (V != null &&
            sn(V.formMethod) &&
            V.formAction === E.location.pathname + E.location.search &&
            (J = Ge.Replace));
      let Z = _ && "preventScrollReset" in _ ? _.preventScrollReset === !0 : void 0,
        xe = (_ && _.unstable_flushSync) === !0,
        ye = Ah({ currentLocation: ee, nextLocation: z, historyAction: J });
      if (ye) {
        Zs(ye, {
          state: "blocked",
          location: z,
          proceed() {
            Zs(ye, { state: "proceeding", proceed: void 0, reset: void 0, location: z }), Ae(b, _);
          },
          reset() {
            let Ce = new Map(E.blockers);
            Ce.set(ye, Ui), ne({ blockers: Ce });
          },
        });
        return;
      }
      return yield Ue(J, z, {
        submission: V,
        pendingError: Y,
        preventScrollReset: Z,
        replace: _ && _.replace,
        enableViewTransition: _ && _.unstable_viewTransition,
        flushSync: xe,
      });
    });
  }
  function ge() {
    if ((bi(), ne({ revalidation: "loading" }), E.navigation.state !== "submitting")) {
      if (E.navigation.state === "idle") {
        Ue(E.historyAction, E.location, { startUninterruptedRevalidation: !0 });
        return;
      }
      Ue(P || E.historyAction, E.navigation.location, { overrideNavigation: E.navigation });
    }
  }
  function Ue(b, _, O) {
    return le(this, null, function* () {
      A && A.abort(),
        (A = null),
        (P = b),
        (Q = (O && O.startUninterruptedRevalidation) === !0),
        FS(E.location, E.matches),
        (R = (O && O.preventScrollReset) === !0),
        (D = (O && O.enableViewTransition) === !0);
      let N = a || s,
        V = O && O.overrideNavigation,
        Y = Qr(N, _, l),
        ee = (O && O.flushSync) === !0,
        z = ta(Y, N, _.pathname);
      if ((z.active && z.matches && (Y = z.matches), !Y)) {
        let { error: me, notFoundMatches: ot, route: Ke } = Qu(_.pathname);
        ce(_, { matches: ot, loaderData: {}, errors: { [Ke.id]: me } }, { flushSync: ee });
        return;
      }
      if (E.initialized && !X && bO(E.location, _) && !(O && O.submission && sn(O.submission.formMethod))) {
        ce(_, { matches: Y }, { flushSync: ee });
        return;
      }
      A = new AbortController();
      let ie = ko(e.history, _, A.signal, O && O.submission),
        J;
      if (O && O.pendingError) J = [Bo(Y).route.id, { type: Se.error, error: O.pendingError }];
      else if (O && O.submission && sn(O.submission.formMethod)) {
        let me = yield Vt(ie, _, O.submission, Y, z.active, { replace: O.replace, flushSync: ee });
        if (me.shortCircuited) return;
        if (me.pendingActionResult) {
          let [ot, Ke] = me.pendingActionResult;
          if (Ot(Ke) && Du(Ke.error) && Ke.error.status === 404) {
            (A = null), ce(_, { matches: me.matches, loaderData: {}, errors: { [ot]: Ke.error } });
            return;
          }
        }
        (Y = me.matches || Y),
          (J = me.pendingActionResult),
          (V = Bc(_, O.submission)),
          (ee = !1),
          (z.active = !1),
          (ie = ko(e.history, ie.url, ie.signal));
      }
      let {
        shortCircuited: Z,
        matches: xe,
        loaderData: ye,
        errors: Ce,
      } = yield et(
        ie,
        _,
        Y,
        z.active,
        V,
        O && O.submission,
        O && O.fetcherSubmission,
        O && O.replace,
        O && O.initialHydration === !0,
        ee,
        J
      );
      Z || ((A = null), ce(_, Ne({ matches: xe || Y }, Yg(J), { loaderData: ye, errors: Ce })));
    });
  }
  function Vt(b, _, O, N, V, Y) {
    return le(this, null, function* () {
      Y === void 0 && (Y = {}), bi();
      let ee = PO(_, O);
      if ((ne({ navigation: ee }, { flushSync: Y.flushSync === !0 }), V)) {
        let J = yield na(N, _.pathname, b.signal);
        if (J.type === "aborted") return { shortCircuited: !0 };
        if (J.type === "error") {
          let { boundaryId: Z, error: xe } = ea(_.pathname, J);
          return { matches: J.partialMatches, pendingActionResult: [Z, { type: Se.error, error: xe }] };
        } else if (J.matches) N = J.matches;
        else {
          let { notFoundMatches: Z, error: xe, route: ye } = Qu(_.pathname);
          return { matches: Z, pendingActionResult: [ye.id, { type: Se.error, error: xe }] };
        }
      }
      let z,
        ie = Yi(N, _);
      if (!ie.route.action && !ie.route.lazy)
        z = { type: Se.error, error: mt(405, { method: b.method, pathname: _.pathname, routeId: ie.route.id }) };
      else if (((z = (yield ht("action", b, [ie], N))[0]), b.signal.aborted)) return { shortCircuited: !0 };
      if (to(z)) {
        let J;
        return (
          Y && Y.replace != null
            ? (J = Y.replace)
            : (J =
                Kg(z.response.headers.get("Location"), new URL(b.url), l) === E.location.pathname + E.location.search),
          yield tt(b, z, { submission: O, replace: J }),
          { shortCircuited: !0 }
        );
      }
      if (eo(z)) throw mt(400, { type: "defer-action" });
      if (Ot(z)) {
        let J = Bo(N, ie.route.id);
        return (Y && Y.replace) !== !0 && (P = Ge.Push), { matches: N, pendingActionResult: [J.route.id, z] };
      }
      return { matches: N, pendingActionResult: [ie.route.id, z] };
    });
  }
  function et(b, _, O, N, V, Y, ee, z, ie, J, Z) {
    return le(this, null, function* () {
      let xe = V || Bc(_, Y),
        ye = Y || ee || ty(xe),
        Ce = !Q && (!f.v7_partialHydration || !ie);
      if (N) {
        if (Ce) {
          let Fe = He(Z);
          ne(Ne({ navigation: xe }, Fe !== void 0 ? { actionData: Fe } : {}), { flushSync: J });
        }
        let ae = yield na(O, _.pathname, b.signal);
        if (ae.type === "aborted") return { shortCircuited: !0 };
        if (ae.type === "error") {
          let { boundaryId: Fe, error: Rt } = ea(_.pathname, ae);
          return { matches: ae.partialMatches, loaderData: {}, errors: { [Fe]: Rt } };
        } else if (ae.matches) O = ae.matches;
        else {
          let { error: Fe, notFoundMatches: Rt, route: Re } = Qu(_.pathname);
          return { matches: Rt, loaderData: {}, errors: { [Re.id]: Fe } };
        }
      }
      let me = a || s,
        [ot, Ke] = Vg(
          e.history,
          E,
          O,
          ye,
          _,
          f.v7_partialHydration && ie === !0,
          f.v7_skipActionErrorRevalidation,
          X,
          B,
          te,
          Ee,
          oe,
          q,
          me,
          l,
          Z
        );
      if (
        (Yu((ae) => !(O && O.some((Fe) => Fe.route.id === ae)) || (ot && ot.some((Fe) => Fe.route.id === ae))),
        ($ = ++M),
        ot.length === 0 && Ke.length === 0)
      ) {
        let ae = Rh();
        return (
          ce(
            _,
            Ne(
              { matches: O, loaderData: {}, errors: Z && Ot(Z[1]) ? { [Z[0]]: Z[1].error } : null },
              Yg(Z),
              ae ? { fetchers: new Map(E.fetchers) } : {}
            ),
            { flushSync: J }
          ),
          { shortCircuited: !0 }
        );
      }
      if (Ce) {
        let ae = {};
        if (!N) {
          ae.navigation = xe;
          let Fe = He(Z);
          Fe !== void 0 && (ae.actionData = Fe);
        }
        Ke.length > 0 && (ae.fetchers = Wt(Ke)), ne(ae, { flushSync: J });
      }
      Ke.forEach((ae) => {
        W.has(ae.key) && rr(ae.key), ae.controller && W.set(ae.key, ae.controller);
      });
      let ki = () => Ke.forEach((ae) => rr(ae.key));
      A && A.signal.addEventListener("abort", ki);
      let { loaderResults: or, fetcherResults: So } = yield xo(E.matches, O, ot, Ke, b);
      if (b.signal.aborted) return { shortCircuited: !0 };
      A && A.signal.removeEventListener("abort", ki), Ke.forEach((ae) => W.delete(ae.key));
      let Eo = Jg([...or, ...So]);
      if (Eo) {
        if (Eo.idx >= ot.length) {
          let ae = Ke[Eo.idx - ot.length].key;
          q.add(ae);
        }
        return yield tt(b, Eo.result, { replace: z }), { shortCircuited: !0 };
      }
      let { loaderData: Co, errors: mn } = Gg(E, O, ot, or, Z, Ke, So, ze);
      ze.forEach((ae, Fe) => {
        ae.subscribe((Rt) => {
          (Rt || ae.done) && ze.delete(Fe);
        });
      }),
        f.v7_partialHydration &&
          ie &&
          E.errors &&
          Object.entries(E.errors)
            .filter((ae) => {
              let [Fe] = ae;
              return !ot.some((Rt) => Rt.route.id === Fe);
            })
            .forEach((ae) => {
              let [Fe, Rt] = ae;
              mn = Object.assign(mn || {}, { [Fe]: Rt });
            });
      let ra = Rh(),
        oa = Ph($),
        ia = ra || oa || Ke.length > 0;
      return Ne({ matches: O, loaderData: Co, errors: mn }, ia ? { fetchers: new Map(E.fetchers) } : {});
    });
  }
  function He(b) {
    if (b && !Ot(b[1])) return { [b[0]]: b[1].data };
    if (E.actionData) return Object.keys(E.actionData).length === 0 ? null : E.actionData;
  }
  function Wt(b) {
    return (
      b.forEach((_) => {
        let O = E.fetchers.get(_.key),
          N = Bi(void 0, O ? O.data : void 0);
        E.fetchers.set(_.key, N);
      }),
      new Map(E.fetchers)
    );
  }
  function wo(b, _, O, N) {
    if (r)
      throw new Error(
        "router.fetch() was called during the server render, but it shouldn't be. You are likely calling a useFetcher() method in the body of your component. Try moving it to a useEffect or a callback."
      );
    W.has(b) && rr(b);
    let V = (N && N.unstable_flushSync) === !0,
      Y = a || s,
      ee = xd(
        E.location,
        E.matches,
        l,
        f.v7_prependBasename,
        O,
        f.v7_relativeSplatPath,
        _,
        N == null ? void 0 : N.relative
      ),
      z = Qr(Y, ee, l),
      ie = ta(z, Y, ee);
    if ((ie.active && ie.matches && (z = ie.matches), !z)) {
      Ln(b, _, mt(404, { pathname: ee }), { flushSync: V });
      return;
    }
    let { path: J, submission: Z, error: xe } = Bg(f.v7_normalizeFormMethod, !0, ee, N);
    if (xe) {
      Ln(b, _, xe, { flushSync: V });
      return;
    }
    let ye = Yi(z, J);
    if (((R = (N && N.preventScrollReset) === !0), Z && sn(Z.formMethod))) {
      Nn(b, _, J, ye, z, ie.active, V, Z);
      return;
    }
    oe.set(b, { routeId: _, path: J }), Xs(b, _, J, ye, z, ie.active, V, Z);
  }
  function Nn(b, _, O, N, V, Y, ee, z) {
    return le(this, null, function* () {
      bi(), oe.delete(b);
      function ie(Re) {
        if (!Re.route.action && !Re.route.lazy) {
          let Dn = mt(405, { method: z.formMethod, pathname: O, routeId: _ });
          return Ln(b, _, Dn, { flushSync: ee }), !0;
        }
        return !1;
      }
      if (!Y && ie(N)) return;
      let J = E.fetchers.get(b);
      Ht(b, OO(z, J), { flushSync: ee });
      let Z = new AbortController(),
        xe = ko(e.history, O, Z.signal, z);
      if (Y) {
        let Re = yield na(V, O, xe.signal);
        if (Re.type === "aborted") return;
        if (Re.type === "error") {
          let { error: Dn } = ea(O, Re);
          Ln(b, _, Dn, { flushSync: ee });
          return;
        } else if (Re.matches) {
          if (((V = Re.matches), (N = Yi(V, O)), ie(N))) return;
        } else {
          Ln(b, _, mt(404, { pathname: O }), { flushSync: ee });
          return;
        }
      }
      W.set(b, Z);
      let ye = M,
        me = (yield ht("action", xe, [N], V))[0];
      if (xe.signal.aborted) {
        W.get(b) === Z && W.delete(b);
        return;
      }
      if (f.v7_fetcherPersist && Ee.has(b)) {
        if (to(me) || Ot(me)) {
          Ht(b, ur(void 0));
          return;
        }
      } else {
        if (to(me))
          if ((W.delete(b), $ > ye)) {
            Ht(b, ur(void 0));
            return;
          } else return q.add(b), Ht(b, Bi(z)), tt(xe, me, { fetcherSubmission: z });
        if (Ot(me)) {
          Ln(b, _, me.error);
          return;
        }
      }
      if (eo(me)) throw mt(400, { type: "defer-action" });
      let ot = E.navigation.location || E.location,
        Ke = ko(e.history, ot, Z.signal),
        ki = a || s,
        or = E.navigation.state !== "idle" ? Qr(ki, E.navigation.location, l) : E.matches;
      re(or, "Didn't find any matches after fetcher action");
      let So = ++M;
      H.set(b, So);
      let Eo = Bi(z, me.data);
      E.fetchers.set(b, Eo);
      let [Co, mn] = Vg(e.history, E, or, z, ot, !1, f.v7_skipActionErrorRevalidation, X, B, te, Ee, oe, q, ki, l, [
        N.route.id,
        me,
      ]);
      mn
        .filter((Re) => Re.key !== b)
        .forEach((Re) => {
          let Dn = Re.key,
            Dh = E.fetchers.get(Dn),
            zS = Bi(void 0, Dh ? Dh.data : void 0);
          E.fetchers.set(Dn, zS), W.has(Dn) && rr(Dn), Re.controller && W.set(Dn, Re.controller);
        }),
        ne({ fetchers: new Map(E.fetchers) });
      let ra = () => mn.forEach((Re) => rr(Re.key));
      Z.signal.addEventListener("abort", ra);
      let { loaderResults: oa, fetcherResults: ia } = yield xo(E.matches, or, Co, mn, Ke);
      if (Z.signal.aborted) return;
      Z.signal.removeEventListener("abort", ra), H.delete(b), W.delete(b), mn.forEach((Re) => W.delete(Re.key));
      let ae = Jg([...oa, ...ia]);
      if (ae) {
        if (ae.idx >= Co.length) {
          let Re = mn[ae.idx - Co.length].key;
          q.add(Re);
        }
        return tt(Ke, ae.result);
      }
      let { loaderData: Fe, errors: Rt } = Gg(E, E.matches, Co, oa, void 0, mn, ia, ze);
      if (E.fetchers.has(b)) {
        let Re = ur(me.data);
        E.fetchers.set(b, Re);
      }
      Ph(So),
        E.navigation.state === "loading" && So > $
          ? (re(P, "Expected pending action"),
            A && A.abort(),
            ce(E.navigation.location, { matches: or, loaderData: Fe, errors: Rt, fetchers: new Map(E.fetchers) }))
          : (ne({ errors: Rt, loaderData: Qg(E.loaderData, Fe, or, Rt), fetchers: new Map(E.fetchers) }), (X = !1));
    });
  }
  function Xs(b, _, O, N, V, Y, ee, z) {
    return le(this, null, function* () {
      let ie = E.fetchers.get(b);
      Ht(b, Bi(z, ie ? ie.data : void 0), { flushSync: ee });
      let J = new AbortController(),
        Z = ko(e.history, O, J.signal);
      if (Y) {
        let me = yield na(V, O, Z.signal);
        if (me.type === "aborted") return;
        if (me.type === "error") {
          let { error: ot } = ea(O, me);
          Ln(b, _, ot, { flushSync: ee });
          return;
        } else if (me.matches) (V = me.matches), (N = Yi(V, O));
        else {
          Ln(b, _, mt(404, { pathname: O }), { flushSync: ee });
          return;
        }
      }
      W.set(b, J);
      let xe = M,
        Ce = (yield ht("loader", Z, [N], V))[0];
      if ((eo(Ce) && (Ce = (yield Lx(Ce, Z.signal, !0)) || Ce), W.get(b) === J && W.delete(b), !Z.signal.aborted)) {
        if (Ee.has(b)) {
          Ht(b, ur(void 0));
          return;
        }
        if (to(Ce))
          if ($ > xe) {
            Ht(b, ur(void 0));
            return;
          } else {
            q.add(b), yield tt(Z, Ce);
            return;
          }
        if (Ot(Ce)) {
          Ln(b, _, Ce.error);
          return;
        }
        re(!eo(Ce), "Unhandled fetcher deferred data"), Ht(b, ur(Ce.data));
      }
    });
  }
  function tt(b, _, O) {
    return le(this, null, function* () {
      let { submission: N, fetcherSubmission: V, replace: Y } = O === void 0 ? {} : O;
      _.response.headers.has("X-Remix-Revalidate") && (X = !0);
      let ee = _.response.headers.get("Location");
      re(ee, "Expected a Location header on the redirect Response"), (ee = Kg(ee, new URL(b.url), l));
      let z = As(E.location, ee, { _isRedirect: !0 });
      if (n) {
        let Ce = !1;
        if (_.response.headers.has("X-Remix-Reload-Document")) Ce = !0;
        else if (eh.test(ee)) {
          const me = e.history.createURL(ee);
          Ce = me.origin !== t.location.origin || Yn(me.pathname, l) == null;
        }
        if (Ce) {
          Y ? t.location.replace(ee) : t.location.assign(ee);
          return;
        }
      }
      A = null;
      let ie = Y === !0 || _.response.headers.has("X-Remix-Replace") ? Ge.Replace : Ge.Push,
        { formMethod: J, formAction: Z, formEncType: xe } = E.navigation;
      !N && !V && J && Z && xe && (N = ty(E.navigation));
      let ye = N || V;
      if (cO.has(_.response.status) && ye && sn(ye.formMethod))
        yield Ue(ie, z, { submission: Ne({}, ye, { formAction: ee }), preventScrollReset: R });
      else {
        let Ce = Bc(z, N);
        yield Ue(ie, z, { overrideNavigation: Ce, fetcherSubmission: V, preventScrollReset: R });
      }
    });
  }
  function ht(b, _, O, N) {
    return le(this, null, function* () {
      try {
        let V = yield wO(u, b, _, O, N, i, o);
        return yield Promise.all(
          V.map((Y, ee) => {
            if (_O(Y)) {
              let z = Y.result;
              return { type: Se.redirect, response: EO(z, _, O[ee].route.id, N, l, f.v7_relativeSplatPath) };
            }
            return SO(Y);
          })
        );
      } catch (V) {
        return O.map(() => ({ type: Se.error, error: V }));
      }
    });
  }
  function xo(b, _, O, N, V) {
    return le(this, null, function* () {
      let [Y, ...ee] = yield Promise.all([
        O.length ? ht("loader", V, O, _) : [],
        ...N.map((z) => {
          if (z.matches && z.match && z.controller) {
            let ie = ko(e.history, z.path, z.controller.signal);
            return ht("loader", ie, [z.match], z.matches).then((J) => J[0]);
          } else return Promise.resolve({ type: Se.error, error: mt(404, { pathname: z.path }) });
        }),
      ]);
      return (
        yield Promise.all([
          ey(
            b,
            O,
            Y,
            Y.map(() => V.signal),
            !1,
            E.loaderData
          ),
          ey(
            b,
            N.map((z) => z.match),
            ee,
            N.map((z) => (z.controller ? z.controller.signal : null)),
            !0
          ),
        ]),
        { loaderResults: Y, fetcherResults: ee }
      );
    });
  }
  function bi() {
    (X = !0),
      B.push(...Yu()),
      oe.forEach((b, _) => {
        W.has(_) && (te.add(_), rr(_));
      });
  }
  function Ht(b, _, O) {
    O === void 0 && (O = {}),
      E.fetchers.set(b, _),
      ne({ fetchers: new Map(E.fetchers) }, { flushSync: (O && O.flushSync) === !0 });
  }
  function Ln(b, _, O, N) {
    N === void 0 && (N = {});
    let V = Bo(E.matches, _);
    Js(b), ne({ errors: { [V.route.id]: O }, fetchers: new Map(E.fetchers) }, { flushSync: (N && N.flushSync) === !0 });
  }
  function _h(b) {
    return f.v7_fetcherPersist && ($e.set(b, ($e.get(b) || 0) + 1), Ee.has(b) && Ee.delete(b)), E.fetchers.get(b) || fO;
  }
  function Js(b) {
    let _ = E.fetchers.get(b);
    W.has(b) && !(_ && _.state === "loading" && H.has(b)) && rr(b),
      oe.delete(b),
      H.delete(b),
      q.delete(b),
      Ee.delete(b),
      te.delete(b),
      E.fetchers.delete(b);
  }
  function DS(b) {
    if (f.v7_fetcherPersist) {
      let _ = ($e.get(b) || 0) - 1;
      _ <= 0 ? ($e.delete(b), Ee.add(b)) : $e.set(b, _);
    } else Js(b);
    ne({ fetchers: new Map(E.fetchers) });
  }
  function rr(b) {
    let _ = W.get(b);
    re(_, "Expected fetch controller: " + b), _.abort(), W.delete(b);
  }
  function Th(b) {
    for (let _ of b) {
      let O = _h(_),
        N = ur(O.data);
      E.fetchers.set(_, N);
    }
  }
  function Rh() {
    let b = [],
      _ = !1;
    for (let O of q) {
      let N = E.fetchers.get(O);
      re(N, "Expected fetcher: " + O), N.state === "loading" && (q.delete(O), b.push(O), (_ = !0));
    }
    return Th(b), _;
  }
  function Ph(b) {
    let _ = [];
    for (let [O, N] of H)
      if (N < b) {
        let V = E.fetchers.get(O);
        re(V, "Expected fetcher: " + O), V.state === "loading" && (rr(O), H.delete(O), _.push(O));
      }
    return Th(_), _.length > 0;
  }
  function MS(b, _) {
    let O = E.blockers.get(b) || Ui;
    return We.get(b) !== _ && We.set(b, _), O;
  }
  function Oh(b) {
    E.blockers.delete(b), We.delete(b);
  }
  function Zs(b, _) {
    let O = E.blockers.get(b) || Ui;
    re(
      (O.state === "unblocked" && _.state === "blocked") ||
        (O.state === "blocked" && _.state === "blocked") ||
        (O.state === "blocked" && _.state === "proceeding") ||
        (O.state === "blocked" && _.state === "unblocked") ||
        (O.state === "proceeding" && _.state === "unblocked"),
      "Invalid blocker state transition: " + O.state + " -> " + _.state
    );
    let N = new Map(E.blockers);
    N.set(b, _), ne({ blockers: N });
  }
  function Ah(b) {
    let { currentLocation: _, nextLocation: O, historyAction: N } = b;
    if (We.size === 0) return;
    We.size > 1 && ai(!1, "A router only supports one blocker at a time");
    let V = Array.from(We.entries()),
      [Y, ee] = V[V.length - 1],
      z = E.blockers.get(Y);
    if (!(z && z.state === "proceeding") && ee({ currentLocation: _, nextLocation: O, historyAction: N })) return Y;
  }
  function Qu(b) {
    let _ = mt(404, { pathname: b }),
      O = a || s,
      { matches: N, route: V } = Xg(O);
    return Yu(), { notFoundMatches: N, route: V, error: _ };
  }
  function ea(b, _) {
    return {
      boundaryId: Bo(_.partialMatches).route.id,
      error: mt(400, {
        type: "route-discovery",
        pathname: b,
        message: _.error != null && "message" in _.error ? _.error : String(_.error),
      }),
    };
  }
  function Yu(b) {
    let _ = [];
    return (
      ze.forEach((O, N) => {
        (!b || b(N)) && (O.cancel(), _.push(N), ze.delete(N));
      }),
      _
    );
  }
  function jS(b, _, O) {
    if (((m = b), (x = _), (y = O || null), !p && E.navigation === Uc)) {
      p = !0;
      let N = Lh(E.location, E.matches);
      N != null && ne({ restoreScrollPosition: N });
    }
    return () => {
      (m = null), (x = null), (y = null);
    };
  }
  function Nh(b, _) {
    return (
      (y &&
        y(
          b,
          _.map((N) => BP(N, E.loaderData))
        )) ||
      b.key
    );
  }
  function FS(b, _) {
    if (m && x) {
      let O = Nh(b, _);
      m[O] = x();
    }
  }
  function Lh(b, _) {
    if (m) {
      let O = Nh(b, _),
        N = m[O];
      if (typeof N == "number") return N;
    }
    return null;
  }
  function ta(b, _, O) {
    if (c)
      if (b) {
        let N = b[b.length - 1].route;
        if (N.path && (N.path === "*" || N.path.endsWith("/*"))) return { active: !0, matches: ul(_, O, l, !0) };
      } else return { active: !0, matches: ul(_, O, l, !0) || [] };
    return { active: !1, matches: null };
  }
  function na(b, _, O) {
    return le(this, null, function* () {
      let N = b,
        V = N.length > 0 ? N[N.length - 1].route : null;
      for (;;) {
        let Y = a == null,
          ee = a || s;
        try {
          yield yO(c, _, N, ee, i, o, Bt, O);
        } catch (Z) {
          return { type: "error", error: Z, partialMatches: N };
        } finally {
          Y && (s = [...s]);
        }
        if (O.aborted) return { type: "aborted" };
        let z = Qr(ee, _, l),
          ie = !1;
        if (z) {
          let Z = z[z.length - 1].route;
          if (Z.index) return { type: "success", matches: z };
          if (Z.path && Z.path.length > 0)
            if (Z.path === "*") ie = !0;
            else return { type: "success", matches: z };
        }
        let J = ul(ee, _, l, !0);
        if (!J || N.map((Z) => Z.route.id).join("-") === J.map((Z) => Z.route.id).join("-"))
          return { type: "success", matches: ie ? z : null };
        if (((N = J), (V = N[N.length - 1].route), V.path === "*")) return { type: "success", matches: N };
      }
    });
  }
  function IS(b) {
    (i = {}), (a = Ns(b, o, void 0, i));
  }
  function $S(b, _) {
    let O = a == null;
    Ox(b, _, a || s, i, o), O && ((s = [...s]), ne({}));
  }
  return (
    (C = {
      get basename() {
        return l;
      },
      get future() {
        return f;
      },
      get state() {
        return E;
      },
      get routes() {
        return s;
      },
      get window() {
        return t;
      },
      initialize: vo,
      subscribe: Ur,
      enableScrollRestoration: jS,
      navigate: Ae,
      fetch: wo,
      revalidate: ge,
      createHref: (b) => e.history.createHref(b),
      encodeLocation: (b) => e.history.encodeLocation(b),
      getFetcher: _h,
      deleteFetcher: DS,
      dispose: hn,
      getBlocker: MS,
      deleteBlocker: Oh,
      patchRoutes: $S,
      _internalFetchControllers: W,
      _internalActiveDeferreds: ze,
      _internalSetRoutes: IS,
    }),
    C
  );
}
function hO(e) {
  return e != null && (("formData" in e && e.formData != null) || ("body" in e && e.body !== void 0));
}
function xd(e, t, n, r, o, i, s, a) {
  let l, u;
  if (s) {
    l = [];
    for (let f of t)
      if ((l.push(f), f.route.id === s)) {
        u = f;
        break;
      }
  } else (l = t), (u = t[t.length - 1]);
  let c = Lu(o || ".", Nu(l, i), Yn(e.pathname, n) || e.pathname, a === "path");
  return (
    o == null && ((c.search = e.search), (c.hash = e.hash)),
    (o == null || o === "" || o === ".") &&
      u &&
      u.route.index &&
      !th(c.search) &&
      (c.search = c.search ? c.search.replace(/^\?/, "?index&") : "?index"),
    r && n !== "/" && (c.pathname = c.pathname === "/" ? n : Vn([n, c.pathname])),
    fo(c)
  );
}
function Bg(e, t, n, r) {
  if (!r || !hO(r)) return { path: n };
  if (r.formMethod && !RO(r.formMethod)) return { path: n, error: mt(405, { method: r.formMethod }) };
  let o = () => ({ path: n, error: mt(400, { type: "invalid-body" }) }),
    i = r.formMethod || "get",
    s = e ? i.toUpperCase() : i.toLowerCase(),
    a = Ax(n);
  if (r.body !== void 0) {
    if (r.formEncType === "text/plain") {
      if (!sn(s)) return o();
      let d =
        typeof r.body == "string"
          ? r.body
          : r.body instanceof FormData || r.body instanceof URLSearchParams
          ? Array.from(r.body.entries()).reduce((v, m) => {
              let [y, x] = m;
              return (
                "" +
                v +
                y +
                "=" +
                x +
                `
`
              );
            }, "")
          : String(r.body);
      return {
        path: n,
        submission: {
          formMethod: s,
          formAction: a,
          formEncType: r.formEncType,
          formData: void 0,
          json: void 0,
          text: d,
        },
      };
    } else if (r.formEncType === "application/json") {
      if (!sn(s)) return o();
      try {
        let d = typeof r.body == "string" ? JSON.parse(r.body) : r.body;
        return {
          path: n,
          submission: {
            formMethod: s,
            formAction: a,
            formEncType: r.formEncType,
            formData: void 0,
            json: d,
            text: void 0,
          },
        };
      } catch (d) {
        return o();
      }
    }
  }
  re(typeof FormData == "function", "FormData is not available in this environment");
  let l, u;
  if (r.formData) (l = Sd(r.formData)), (u = r.formData);
  else if (r.body instanceof FormData) (l = Sd(r.body)), (u = r.body);
  else if (r.body instanceof URLSearchParams) (l = r.body), (u = qg(l));
  else if (r.body == null) (l = new URLSearchParams()), (u = new FormData());
  else
    try {
      (l = new URLSearchParams(r.body)), (u = qg(l));
    } catch (d) {
      return o();
    }
  let c = {
    formMethod: s,
    formAction: a,
    formEncType: (r && r.formEncType) || "application/x-www-form-urlencoded",
    formData: u,
    json: void 0,
    text: void 0,
  };
  if (sn(c.formMethod)) return { path: n, submission: c };
  let f = $r(n);
  return t && f.search && th(f.search) && l.append("index", ""), (f.search = "?" + l), { path: fo(f), submission: c };
}
function mO(e, t) {
  let n = e;
  if (t) {
    let r = e.findIndex((o) => o.route.id === t);
    r >= 0 && (n = e.slice(0, r));
  }
  return n;
}
function Vg(e, t, n, r, o, i, s, a, l, u, c, f, d, v, m, y) {
  let x = y ? (Ot(y[1]) ? y[1].error : y[1].data) : void 0,
    p = e.createURL(t.location),
    g = e.createURL(o),
    w = y && Ot(y[1]) ? y[0] : void 0,
    S = w ? mO(n, w) : n,
    C = y ? y[1].statusCode : void 0,
    E = s && C && C >= 400,
    P = S.filter((A, D) => {
      let { route: U } = A;
      if (U.lazy) return !0;
      if (U.loader == null) return !1;
      if (i)
        return typeof U.loader != "function" || U.loader.hydrate
          ? !0
          : t.loaderData[U.id] === void 0 && (!t.errors || t.errors[U.id] === void 0);
      if (gO(t.loaderData, t.matches[D], A) || l.some((X) => X === A.route.id)) return !0;
      let I = t.matches[D],
        Q = A;
      return Wg(
        A,
        Ne({ currentUrl: p, currentParams: I.params, nextUrl: g, nextParams: Q.params }, r, {
          actionResult: x,
          actionStatus: C,
          defaultShouldRevalidate: E
            ? !1
            : a || p.pathname + p.search === g.pathname + g.search || p.search !== g.search || Px(I, Q),
        })
      );
    }),
    R = [];
  return (
    f.forEach((A, D) => {
      if (i || !n.some((B) => B.route.id === A.routeId) || c.has(D)) return;
      let U = Qr(v, A.path, m);
      if (!U) {
        R.push({ key: D, routeId: A.routeId, path: A.path, matches: null, match: null, controller: null });
        return;
      }
      let I = t.fetchers.get(D),
        Q = Yi(U, A.path),
        X = !1;
      d.has(D)
        ? (X = !1)
        : u.has(D)
        ? (u.delete(D), (X = !0))
        : I && I.state !== "idle" && I.data === void 0
        ? (X = a)
        : (X = Wg(
            Q,
            Ne(
              {
                currentUrl: p,
                currentParams: t.matches[t.matches.length - 1].params,
                nextUrl: g,
                nextParams: n[n.length - 1].params,
              },
              r,
              { actionResult: x, actionStatus: C, defaultShouldRevalidate: E ? !1 : a }
            )
          )),
        X &&
          R.push({ key: D, routeId: A.routeId, path: A.path, matches: U, match: Q, controller: new AbortController() });
    }),
    [P, R]
  );
}
function gO(e, t, n) {
  let r = !t || n.route.id !== t.route.id,
    o = e[n.route.id] === void 0;
  return r || o;
}
function Px(e, t) {
  let n = e.route.path;
  return e.pathname !== t.pathname || (n != null && n.endsWith("*") && e.params["*"] !== t.params["*"]);
}
function Wg(e, t) {
  if (e.route.shouldRevalidate) {
    let n = e.route.shouldRevalidate(t);
    if (typeof n == "boolean") return n;
  }
  return t.defaultShouldRevalidate;
}
function yO(e, t, n, r, o, i, s, a) {
  return le(this, null, function* () {
    let l = [t, ...n.map((u) => u.route.id)].join("-");
    try {
      let u = s.get(l);
      u ||
        ((u = e({
          path: t,
          matches: n,
          patch: (c, f) => {
            a.aborted || Ox(c, f, r, o, i);
          },
        })),
        s.set(l, u)),
        u && kO(u) && (yield u);
    } finally {
      s.delete(l);
    }
  });
}
function Ox(e, t, n, r, o) {
  if (e) {
    var i;
    let s = r[e];
    re(s, "No route found to patch children into: routeId = " + e);
    let a = Ns(t, o, [e, "patch", String(((i = s.children) == null ? void 0 : i.length) || "0")], r);
    s.children ? s.children.push(...a) : (s.children = a);
  } else {
    let s = Ns(t, o, ["patch", String(n.length || "0")], r);
    n.push(...s);
  }
}
function Hg(e, t, n) {
  return le(this, null, function* () {
    if (!e.lazy) return;
    let r = yield e.lazy();
    if (!e.lazy) return;
    let o = n[e.id];
    re(o, "No route found in manifest");
    let i = {};
    for (let s in r) {
      let l = o[s] !== void 0 && s !== "hasErrorBoundary";
      ai(
        !l,
        'Route "' +
          o.id +
          '" has a static property "' +
          s +
          '" defined but its lazy function is also returning a value for this property. ' +
          ('The lazy route property "' + s + '" will be ignored.')
      ),
        !l && !zP.has(s) && (i[s] = r[s]);
    }
    Object.assign(o, i), Object.assign(o, Ne({}, t(o), { lazy: void 0 }));
  });
}
function vO(e) {
  return Promise.all(e.matches.map((t) => t.resolve()));
}
function wO(e, t, n, r, o, i, s, a) {
  return le(this, null, function* () {
    let l = r.reduce((f, d) => f.add(d.route.id), new Set()),
      u = new Set(),
      c = yield e({
        matches: o.map((f) => {
          let d = l.has(f.route.id);
          return Ne({}, f, {
            shouldLoad: d,
            resolve: (m) => (
              u.add(f.route.id), d ? xO(t, n, f, i, s, m, a) : Promise.resolve({ type: Se.data, result: void 0 })
            ),
          });
        }),
        request: n,
        params: o[0].params,
        context: a,
      });
    return (
      o.forEach((f) =>
        re(
          u.has(f.route.id),
          '`match.resolve()` was not called for route id "' +
            f.route.id +
            '". You must call `match.resolve()` on every match passed to `dataStrategy` to ensure all routes are properly loaded.'
        )
      ),
      c.filter((f, d) => l.has(o[d].route.id))
    );
  });
}
function xO(e, t, n, r, o, i, s) {
  return le(this, null, function* () {
    let a,
      l,
      u = (c) => {
        let f,
          d = new Promise((y, x) => (f = x));
        (l = () => f()), t.signal.addEventListener("abort", l);
        let v = (y) =>
            typeof c != "function"
              ? Promise.reject(
                  new Error(
                    "You cannot call the handler for a route which defines a boolean " +
                      ('"' + e + '" [routeId: ' + n.route.id + "]")
                  )
                )
              : c({ request: t, params: n.params, context: s }, ...(y !== void 0 ? [y] : [])),
          m;
        return (
          i
            ? (m = i((y) => v(y)))
            : (m = le(this, null, function* () {
                try {
                  return { type: "data", result: yield v() };
                } catch (y) {
                  return { type: "error", result: y };
                }
              })),
          Promise.race([m, d])
        );
      };
    try {
      let c = n.route[e];
      if (n.route.lazy)
        if (c) {
          let f,
            [d] = yield Promise.all([
              u(c).catch((v) => {
                f = v;
              }),
              Hg(n.route, o, r),
            ]);
          if (f !== void 0) throw f;
          a = d;
        } else if ((yield Hg(n.route, o, r), (c = n.route[e]), c)) a = yield u(c);
        else if (e === "action") {
          let f = new URL(t.url),
            d = f.pathname + f.search;
          throw mt(405, { method: t.method, pathname: d, routeId: n.route.id });
        } else return { type: Se.data, result: void 0 };
      else if (c) a = yield u(c);
      else {
        let f = new URL(t.url),
          d = f.pathname + f.search;
        throw mt(404, { pathname: d });
      }
      re(
        a.result !== void 0,
        "You defined " +
          (e === "action" ? "an action" : "a loader") +
          " for route " +
          ('"' + n.route.id + "\" but didn't return anything from your `" + e + "` ") +
          "function. Please return a value or `null`."
      );
    } catch (c) {
      return { type: Se.error, result: c };
    } finally {
      l && t.signal.removeEventListener("abort", l);
    }
    return a;
  });
}
function SO(e) {
  return le(this, null, function* () {
    let { result: t, type: n } = e;
    if (Nx(t)) {
      let u;
      try {
        let c = t.headers.get("Content-Type");
        c && /\bapplication\/json\b/.test(c)
          ? t.body == null
            ? (u = null)
            : (u = yield t.json())
          : (u = yield t.text());
      } catch (c) {
        return { type: Se.error, error: c };
      }
      return n === Se.error
        ? { type: Se.error, error: new Ql(t.status, t.statusText, u), statusCode: t.status, headers: t.headers }
        : { type: Se.data, data: u, statusCode: t.status, headers: t.headers };
    }
    if (n === Se.error) {
      if (Zg(t)) {
        var r;
        if (t.data instanceof Error) {
          var o;
          return { type: Se.error, error: t.data, statusCode: (o = t.init) == null ? void 0 : o.status };
        }
        t = new Ql(((r = t.init) == null ? void 0 : r.status) || 500, void 0, t.data);
      }
      return { type: Se.error, error: t, statusCode: Du(t) ? t.status : void 0 };
    }
    if (TO(t)) {
      var i, s;
      return {
        type: Se.deferred,
        deferredData: t,
        statusCode: (i = t.init) == null ? void 0 : i.status,
        headers: ((s = t.init) == null ? void 0 : s.headers) && new Headers(t.init.headers),
      };
    }
    if (Zg(t)) {
      var a, l;
      return {
        type: Se.data,
        data: t.data,
        statusCode: (a = t.init) == null ? void 0 : a.status,
        headers: (l = t.init) != null && l.headers ? new Headers(t.init.headers) : void 0,
      };
    }
    return { type: Se.data, data: t };
  });
}
function EO(e, t, n, r, o, i) {
  let s = e.headers.get("Location");
  if ((re(s, "Redirects returned/thrown from loaders/actions must have a Location header"), !eh.test(s))) {
    let a = r.slice(0, r.findIndex((l) => l.route.id === n) + 1);
    (s = xd(new URL(t.url), a, o, !0, s, i)), e.headers.set("Location", s);
  }
  return e;
}
function Kg(e, t, n) {
  if (eh.test(e)) {
    let r = e,
      o = r.startsWith("//") ? new URL(t.protocol + r) : new URL(r),
      i = Yn(o.pathname, n) != null;
    if (o.origin === t.origin && i) return o.pathname + o.search + o.hash;
  }
  return e;
}
function ko(e, t, n, r) {
  let o = e.createURL(Ax(t)).toString(),
    i = { signal: n };
  if (r && sn(r.formMethod)) {
    let { formMethod: s, formEncType: a } = r;
    (i.method = s.toUpperCase()),
      a === "application/json"
        ? ((i.headers = new Headers({ "Content-Type": a })), (i.body = JSON.stringify(r.json)))
        : a === "text/plain"
        ? (i.body = r.text)
        : a === "application/x-www-form-urlencoded" && r.formData
        ? (i.body = Sd(r.formData))
        : (i.body = r.formData);
  }
  return new Request(o, i);
}
function Sd(e) {
  let t = new URLSearchParams();
  for (let [n, r] of e.entries()) t.append(n, typeof r == "string" ? r : r.name);
  return t;
}
function qg(e) {
  let t = new FormData();
  for (let [n, r] of e.entries()) t.append(n, r);
  return t;
}
function CO(e, t, n, r, o, i) {
  let s = {},
    a = null,
    l,
    u = !1,
    c = {},
    f = r && Ot(r[1]) ? r[1].error : void 0;
  return (
    n.forEach((d, v) => {
      let m = t[v].route.id;
      if ((re(!to(d), "Cannot handle redirect results in processLoaderData"), Ot(d))) {
        let y = d.error;
        f !== void 0 && ((y = f), (f = void 0)), (a = a || {});
        {
          let x = Bo(e, m);
          a[x.route.id] == null && (a[x.route.id] = y);
        }
        (s[m] = void 0), u || ((u = !0), (l = Du(d.error) ? d.error.status : 500)), d.headers && (c[m] = d.headers);
      } else
        eo(d)
          ? (o.set(m, d.deferredData),
            (s[m] = d.deferredData.data),
            d.statusCode != null && d.statusCode !== 200 && !u && (l = d.statusCode),
            d.headers && (c[m] = d.headers))
          : ((s[m] = d.data),
            d.statusCode && d.statusCode !== 200 && !u && (l = d.statusCode),
            d.headers && (c[m] = d.headers));
    }),
    f !== void 0 && r && ((a = { [r[0]]: f }), (s[r[0]] = void 0)),
    { loaderData: s, errors: a, statusCode: l || 200, loaderHeaders: c }
  );
}
function Gg(e, t, n, r, o, i, s, a) {
  let { loaderData: l, errors: u } = CO(t, n, r, o, a);
  for (let c = 0; c < i.length; c++) {
    let { key: f, match: d, controller: v } = i[c];
    re(s !== void 0 && s[c] !== void 0, "Did not find corresponding fetcher result");
    let m = s[c];
    if (!(v && v.signal.aborted))
      if (Ot(m)) {
        let y = Bo(e.matches, d == null ? void 0 : d.route.id);
        (u && u[y.route.id]) || (u = Ne({}, u, { [y.route.id]: m.error })), e.fetchers.delete(f);
      } else if (to(m)) re(!1, "Unhandled fetcher revalidation redirect");
      else if (eo(m)) re(!1, "Unhandled fetcher deferred data");
      else {
        let y = ur(m.data);
        e.fetchers.set(f, y);
      }
  }
  return { loaderData: l, errors: u };
}
function Qg(e, t, n, r) {
  let o = Ne({}, t);
  for (let i of n) {
    let s = i.route.id;
    if (
      (t.hasOwnProperty(s) ? t[s] !== void 0 && (o[s] = t[s]) : e[s] !== void 0 && i.route.loader && (o[s] = e[s]),
      r && r.hasOwnProperty(s))
    )
      break;
  }
  return o;
}
function Yg(e) {
  return e ? (Ot(e[1]) ? { actionData: {} } : { actionData: { [e[0]]: e[1].data } }) : {};
}
function Bo(e, t) {
  return (
    (t ? e.slice(0, e.findIndex((r) => r.route.id === t) + 1) : [...e])
      .reverse()
      .find((r) => r.route.hasErrorBoundary === !0) || e[0]
  );
}
function Xg(e) {
  let t = e.length === 1 ? e[0] : e.find((n) => n.index || !n.path || n.path === "/") || { id: "__shim-error-route__" };
  return { matches: [{ params: {}, pathname: "", pathnameBase: "", route: t }], route: t };
}
function mt(e, t) {
  let { pathname: n, routeId: r, method: o, type: i, message: s } = t === void 0 ? {} : t,
    a = "Unknown Server Error",
    l = "Unknown @remix-run/router error";
  return (
    e === 400
      ? ((a = "Bad Request"),
        i === "route-discovery"
          ? (l =
              'Unable to match URL "' +
              n +
              '" - the `unstable_patchRoutesOnMiss()` ' +
              (`function threw the following error:
` +
                s))
          : o && n && r
          ? (l =
              "You made a " +
              o +
              ' request to "' +
              n +
              '" but ' +
              ('did not provide a `loader` for route "' + r + '", ') +
              "so there is no way to handle the request.")
          : i === "defer-action"
          ? (l = "defer() is not supported in actions")
          : i === "invalid-body" && (l = "Unable to encode submission body"))
      : e === 403
      ? ((a = "Forbidden"), (l = 'Route "' + r + '" does not match URL "' + n + '"'))
      : e === 404
      ? ((a = "Not Found"), (l = 'No route matches URL "' + n + '"'))
      : e === 405 &&
        ((a = "Method Not Allowed"),
        o && n && r
          ? (l =
              "You made a " +
              o.toUpperCase() +
              ' request to "' +
              n +
              '" but ' +
              ('did not provide an `action` for route "' + r + '", ') +
              "so there is no way to handle the request.")
          : o && (l = 'Invalid request method "' + o.toUpperCase() + '"')),
    new Ql(e || 500, a, new Error(l), !0)
  );
}
function Jg(e) {
  for (let t = e.length - 1; t >= 0; t--) {
    let n = e[t];
    if (to(n)) return { result: n, idx: t };
  }
}
function Ax(e) {
  let t = typeof e == "string" ? $r(e) : e;
  return fo(Ne({}, t, { hash: "" }));
}
function bO(e, t) {
  return e.pathname !== t.pathname || e.search !== t.search
    ? !1
    : e.hash === ""
    ? t.hash !== ""
    : e.hash === t.hash
    ? !0
    : t.hash !== "";
}
function kO(e) {
  return typeof e == "object" && e != null && "then" in e;
}
function _O(e) {
  return Nx(e.result) && uO.has(e.result.status);
}
function eo(e) {
  return e.type === Se.deferred;
}
function Ot(e) {
  return e.type === Se.error;
}
function to(e) {
  return (e && e.type) === Se.redirect;
}
function Zg(e) {
  return (
    typeof e == "object" && e != null && "type" in e && "data" in e && "init" in e && e.type === "DataWithResponseInit"
  );
}
function TO(e) {
  let t = e;
  return (
    t &&
    typeof t == "object" &&
    typeof t.data == "object" &&
    typeof t.subscribe == "function" &&
    typeof t.cancel == "function" &&
    typeof t.resolveData == "function"
  );
}
function Nx(e) {
  return (
    e != null &&
    typeof e.status == "number" &&
    typeof e.statusText == "string" &&
    typeof e.headers == "object" &&
    typeof e.body != "undefined"
  );
}
function RO(e) {
  return lO.has(e.toLowerCase());
}
function sn(e) {
  return sO.has(e.toLowerCase());
}
function ey(e, t, n, r, o, i) {
  return le(this, null, function* () {
    for (let s = 0; s < n.length; s++) {
      let a = n[s],
        l = t[s];
      if (!l) continue;
      let u = e.find((f) => f.route.id === l.route.id),
        c = u != null && !Px(u, l) && (i && i[l.route.id]) !== void 0;
      if (eo(a) && (o || c)) {
        let f = r[s];
        re(f, "Expected an AbortSignal for revalidating fetcher deferred result"),
          yield Lx(a, f, o).then((d) => {
            d && (n[s] = d || n[s]);
          });
      }
    }
  });
}
function Lx(e, t, n) {
  return le(this, null, function* () {
    if ((n === void 0 && (n = !1), !(yield e.deferredData.resolveData(t)))) {
      if (n)
        try {
          return { type: Se.data, data: e.deferredData.unwrappedData };
        } catch (o) {
          return { type: Se.error, error: o };
        }
      return { type: Se.data, data: e.deferredData.data };
    }
  });
}
function th(e) {
  return new URLSearchParams(e).getAll("index").some((t) => t === "");
}
function Yi(e, t) {
  let n = typeof t == "string" ? $r(t).search : t.search;
  if (e[e.length - 1].route.index && th(n || "")) return e[e.length - 1];
  let r = _x(e);
  return r[r.length - 1];
}
function ty(e) {
  let { formMethod: t, formAction: n, formEncType: r, text: o, formData: i, json: s } = e;
  if (!(!t || !n || !r)) {
    if (o != null) return { formMethod: t, formAction: n, formEncType: r, formData: void 0, json: void 0, text: o };
    if (i != null) return { formMethod: t, formAction: n, formEncType: r, formData: i, json: void 0, text: void 0 };
    if (s !== void 0) return { formMethod: t, formAction: n, formEncType: r, formData: void 0, json: s, text: void 0 };
  }
}
function Bc(e, t) {
  return t
    ? {
        state: "loading",
        location: e,
        formMethod: t.formMethod,
        formAction: t.formAction,
        formEncType: t.formEncType,
        formData: t.formData,
        json: t.json,
        text: t.text,
      }
    : {
        state: "loading",
        location: e,
        formMethod: void 0,
        formAction: void 0,
        formEncType: void 0,
        formData: void 0,
        json: void 0,
        text: void 0,
      };
}
function PO(e, t) {
  return {
    state: "submitting",
    location: e,
    formMethod: t.formMethod,
    formAction: t.formAction,
    formEncType: t.formEncType,
    formData: t.formData,
    json: t.json,
    text: t.text,
  };
}
function Bi(e, t) {
  return e
    ? {
        state: "loading",
        formMethod: e.formMethod,
        formAction: e.formAction,
        formEncType: e.formEncType,
        formData: e.formData,
        json: e.json,
        text: e.text,
        data: t,
      }
    : {
        state: "loading",
        formMethod: void 0,
        formAction: void 0,
        formEncType: void 0,
        formData: void 0,
        json: void 0,
        text: void 0,
        data: t,
      };
}
function OO(e, t) {
  return {
    state: "submitting",
    formMethod: e.formMethod,
    formAction: e.formAction,
    formEncType: e.formEncType,
    formData: e.formData,
    json: e.json,
    text: e.text,
    data: t ? t.data : void 0,
  };
}
function ur(e) {
  return {
    state: "idle",
    formMethod: void 0,
    formAction: void 0,
    formEncType: void 0,
    formData: void 0,
    json: void 0,
    text: void 0,
    data: e,
  };
}
function AO(e, t) {
  try {
    let n = e.sessionStorage.getItem(Rx);
    if (n) {
      let r = JSON.parse(n);
      for (let [o, i] of Object.entries(r || {})) i && Array.isArray(i) && t.set(o, new Set(i || []));
    }
  } catch (n) {}
}
function NO(e, t) {
  if (t.size > 0) {
    let n = {};
    for (let [r, o] of t) n[r] = [...o];
    try {
      e.sessionStorage.setItem(Rx, JSON.stringify(n));
    } catch (r) {
      ai(!1, "Failed to save applied view transitions in sessionStorage (" + r + ").");
    }
  }
}
/**
 * React Router v6.26.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function Yl() {
  return (
    (Yl = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
          }
          return e;
        }),
    Yl.apply(this, arguments)
  );
}
const qs = h.createContext(null),
  nh = h.createContext(null),
  er = h.createContext(null),
  rh = h.createContext(null),
  An = h.createContext({ outlet: null, matches: [], isDataRoute: !1 }),
  Dx = h.createContext(null);
function LO(e, t) {
  let { relative: n } = t === void 0 ? {} : t;
  wi() || re(!1);
  let { basename: r, navigator: o } = h.useContext(er),
    { hash: i, pathname: s, search: a } = Mu(e, { relative: n }),
    l = s;
  return r !== "/" && (l = s === "/" ? r : Vn([r, s])), o.createHref({ pathname: l, search: a, hash: i });
}
function wi() {
  return h.useContext(rh) != null;
}
function xi() {
  return wi() || re(!1), h.useContext(rh).location;
}
function Mx(e) {
  h.useContext(er).static || h.useLayoutEffect(e);
}
function jx() {
  let { isDataRoute: e } = h.useContext(An);
  return e ? qO() : DO();
}
function DO() {
  wi() || re(!1);
  let e = h.useContext(qs),
    { basename: t, future: n, navigator: r } = h.useContext(er),
    { matches: o } = h.useContext(An),
    { pathname: i } = xi(),
    s = JSON.stringify(Nu(o, n.v7_relativeSplatPath)),
    a = h.useRef(!1);
  return (
    Mx(() => {
      a.current = !0;
    }),
    h.useCallback(
      function (u, c) {
        if ((c === void 0 && (c = {}), !a.current)) return;
        if (typeof u == "number") {
          r.go(u);
          return;
        }
        let f = Lu(u, JSON.parse(s), i, c.relative === "path");
        e == null && t !== "/" && (f.pathname = f.pathname === "/" ? t : Vn([t, f.pathname])),
          (c.replace ? r.replace : r.push)(f, c.state, c);
      },
      [t, r, s, i, e]
    )
  );
}
const MO = h.createContext(null);
function jO(e) {
  let t = h.useContext(An).outlet;
  return t && h.createElement(MO.Provider, { value: e }, t);
}
function DM() {
  let { matches: e } = h.useContext(An),
    t = e[e.length - 1];
  return t ? t.params : {};
}
function Mu(e, t) {
  let { relative: n } = t === void 0 ? {} : t,
    { future: r } = h.useContext(er),
    { matches: o } = h.useContext(An),
    { pathname: i } = xi(),
    s = JSON.stringify(Nu(o, r.v7_relativeSplatPath));
  return h.useMemo(() => Lu(e, JSON.parse(s), i, n === "path"), [e, s, i, n]);
}
function FO(e, t, n, r) {
  wi() || re(!1);
  let { navigator: o } = h.useContext(er),
    { matches: i } = h.useContext(An),
    s = i[i.length - 1],
    a = s ? s.params : {};
  s && s.pathname;
  let l = s ? s.pathnameBase : "/";
  s && s.route;
  let u = xi(),
    c;
  c = u;
  let f = c.pathname || "/",
    d = f;
  if (l !== "/") {
    let y = l.replace(/^\//, "").split("/");
    d = "/" + f.replace(/^\//, "").split("/").slice(y.length).join("/");
  }
  let v = Qr(e, { pathname: d });
  return BO(
    v &&
      v.map((y) =>
        Object.assign({}, y, {
          params: Object.assign({}, a, y.params),
          pathname: Vn([l, o.encodeLocation ? o.encodeLocation(y.pathname).pathname : y.pathname]),
          pathnameBase:
            y.pathnameBase === "/"
              ? l
              : Vn([l, o.encodeLocation ? o.encodeLocation(y.pathnameBase).pathname : y.pathnameBase]),
        })
      ),
    i,
    n,
    r
  );
}
function IO() {
  let e = KO(),
    t = Du(e) ? e.status + " " + e.statusText : e instanceof Error ? e.message : JSON.stringify(e),
    n = e instanceof Error ? e.stack : null,
    o = { padding: "0.5rem", backgroundColor: "rgba(200,200,200, 0.5)" };
  return h.createElement(
    h.Fragment,
    null,
    h.createElement("h2", null, "Unexpected Application Error!"),
    h.createElement("h3", { style: { fontStyle: "italic" } }, t),
    n ? h.createElement("pre", { style: o }, n) : null,
    null
  );
}
const $O = h.createElement(IO, null);
class zO extends h.Component {
  constructor(t) {
    super(t), (this.state = { location: t.location, revalidation: t.revalidation, error: t.error });
  }
  static getDerivedStateFromError(t) {
    return { error: t };
  }
  static getDerivedStateFromProps(t, n) {
    return n.location !== t.location || (n.revalidation !== "idle" && t.revalidation === "idle")
      ? { error: t.error, location: t.location, revalidation: t.revalidation }
      : {
          error: t.error !== void 0 ? t.error : n.error,
          location: n.location,
          revalidation: t.revalidation || n.revalidation,
        };
  }
  componentDidCatch(t, n) {
    console.error("React Router caught the following error during render", t, n);
  }
  render() {
    return this.state.error !== void 0
      ? h.createElement(
          An.Provider,
          { value: this.props.routeContext },
          h.createElement(Dx.Provider, { value: this.state.error, children: this.props.component })
        )
      : this.props.children;
  }
}
function UO(e) {
  let { routeContext: t, match: n, children: r } = e,
    o = h.useContext(qs);
  return (
    o &&
      o.static &&
      o.staticContext &&
      (n.route.errorElement || n.route.ErrorBoundary) &&
      (o.staticContext._deepestRenderedBoundaryId = n.route.id),
    h.createElement(An.Provider, { value: t }, r)
  );
}
function BO(e, t, n, r) {
  var o;
  if ((t === void 0 && (t = []), n === void 0 && (n = null), r === void 0 && (r = null), e == null)) {
    var i;
    if (!n) return null;
    if (n.errors) e = n.matches;
    else if ((i = r) != null && i.v7_partialHydration && t.length === 0 && !n.initialized && n.matches.length > 0)
      e = n.matches;
    else return null;
  }
  let s = e,
    a = (o = n) == null ? void 0 : o.errors;
  if (a != null) {
    let c = s.findIndex((f) => f.route.id && (a == null ? void 0 : a[f.route.id]) !== void 0);
    c >= 0 || re(!1), (s = s.slice(0, Math.min(s.length, c + 1)));
  }
  let l = !1,
    u = -1;
  if (n && r && r.v7_partialHydration)
    for (let c = 0; c < s.length; c++) {
      let f = s[c];
      if (((f.route.HydrateFallback || f.route.hydrateFallbackElement) && (u = c), f.route.id)) {
        let { loaderData: d, errors: v } = n,
          m = f.route.loader && d[f.route.id] === void 0 && (!v || v[f.route.id] === void 0);
        if (f.route.lazy || m) {
          (l = !0), u >= 0 ? (s = s.slice(0, u + 1)) : (s = [s[0]]);
          break;
        }
      }
    }
  return s.reduceRight((c, f, d) => {
    let v,
      m = !1,
      y = null,
      x = null;
    n &&
      ((v = a && f.route.id ? a[f.route.id] : void 0),
      (y = f.route.errorElement || $O),
      l &&
        (u < 0 && d === 0
          ? ((m = !0), (x = null))
          : u === d && ((m = !0), (x = f.route.hydrateFallbackElement || null))));
    let p = t.concat(s.slice(0, d + 1)),
      g = () => {
        let w;
        return (
          v
            ? (w = y)
            : m
            ? (w = x)
            : f.route.Component
            ? (w = h.createElement(f.route.Component, null))
            : f.route.element
            ? (w = f.route.element)
            : (w = c),
          h.createElement(UO, {
            match: f,
            routeContext: { outlet: c, matches: p, isDataRoute: n != null },
            children: w,
          })
        );
      };
    return n && (f.route.ErrorBoundary || f.route.errorElement || d === 0)
      ? h.createElement(zO, {
          location: n.location,
          revalidation: n.revalidation,
          component: y,
          error: v,
          children: g(),
          routeContext: { outlet: null, matches: p, isDataRoute: !0 },
        })
      : g();
  }, null);
}
var Fx = (function (e) {
    return (
      (e.UseBlocker = "useBlocker"), (e.UseRevalidator = "useRevalidator"), (e.UseNavigateStable = "useNavigate"), e
    );
  })(Fx || {}),
  Xl = (function (e) {
    return (
      (e.UseBlocker = "useBlocker"),
      (e.UseLoaderData = "useLoaderData"),
      (e.UseActionData = "useActionData"),
      (e.UseRouteError = "useRouteError"),
      (e.UseNavigation = "useNavigation"),
      (e.UseRouteLoaderData = "useRouteLoaderData"),
      (e.UseMatches = "useMatches"),
      (e.UseRevalidator = "useRevalidator"),
      (e.UseNavigateStable = "useNavigate"),
      (e.UseRouteId = "useRouteId"),
      e
    );
  })(Xl || {});
function VO(e) {
  let t = h.useContext(qs);
  return t || re(!1), t;
}
function WO(e) {
  let t = h.useContext(nh);
  return t || re(!1), t;
}
function HO(e) {
  let t = h.useContext(An);
  return t || re(!1), t;
}
function Ix(e) {
  let t = HO(),
    n = t.matches[t.matches.length - 1];
  return n.route.id || re(!1), n.route.id;
}
function KO() {
  var e;
  let t = h.useContext(Dx),
    n = WO(Xl.UseRouteError),
    r = Ix(Xl.UseRouteError);
  return t !== void 0 ? t : (e = n.errors) == null ? void 0 : e[r];
}
function qO() {
  let { router: e } = VO(Fx.UseNavigateStable),
    t = Ix(Xl.UseNavigateStable),
    n = h.useRef(!1);
  return (
    Mx(() => {
      n.current = !0;
    }),
    h.useCallback(
      function (o, i) {
        i === void 0 && (i = {}),
          n.current && (typeof o == "number" ? e.navigate(o) : e.navigate(o, Yl({ fromRouteId: t }, i)));
      },
      [e, t]
    )
  );
}
function GO(e) {
  let { to: t, replace: n, state: r, relative: o } = e;
  wi() || re(!1);
  let { future: i, static: s } = h.useContext(er),
    { matches: a } = h.useContext(An),
    { pathname: l } = xi(),
    u = jx(),
    c = Lu(t, Nu(a, i.v7_relativeSplatPath), l, o === "path"),
    f = JSON.stringify(c);
  return h.useEffect(() => u(JSON.parse(f), { replace: n, state: r, relative: o }), [u, f, o, n, r]), null;
}
function $x(e) {
  return jO(e.context);
}
function cr(e) {
  re(!1);
}
function QO(e) {
  let {
    basename: t = "/",
    children: n = null,
    location: r,
    navigationType: o = Ge.Pop,
    navigator: i,
    static: s = !1,
    future: a,
  } = e;
  wi() && re(!1);
  let l = t.replace(/^\/*/, "/"),
    u = h.useMemo(
      () => ({ basename: l, navigator: i, static: s, future: Yl({ v7_relativeSplatPath: !1 }, a) }),
      [l, a, i, s]
    );
  typeof r == "string" && (r = $r(r));
  let { pathname: c = "/", search: f = "", hash: d = "", state: v = null, key: m = "default" } = r,
    y = h.useMemo(() => {
      let x = Yn(c, l);
      return x == null ? null : { location: { pathname: x, search: f, hash: d, state: v, key: m }, navigationType: o };
    }, [l, c, f, d, v, m, o]);
  return y == null
    ? null
    : h.createElement(er.Provider, { value: u }, h.createElement(rh.Provider, { children: n, value: y }));
}
new Promise(() => {});
function Ed(e, t) {
  t === void 0 && (t = []);
  let n = [];
  return (
    h.Children.forEach(e, (r, o) => {
      if (!h.isValidElement(r)) return;
      let i = [...t, o];
      if (r.type === h.Fragment) {
        n.push.apply(n, Ed(r.props.children, i));
        return;
      }
      r.type !== cr && re(!1), !r.props.index || !r.props.children || re(!1);
      let s = {
        id: r.props.id || i.join("-"),
        caseSensitive: r.props.caseSensitive,
        element: r.props.element,
        Component: r.props.Component,
        index: r.props.index,
        path: r.props.path,
        loader: r.props.loader,
        action: r.props.action,
        errorElement: r.props.errorElement,
        ErrorBoundary: r.props.ErrorBoundary,
        hasErrorBoundary: r.props.ErrorBoundary != null || r.props.errorElement != null,
        shouldRevalidate: r.props.shouldRevalidate,
        handle: r.props.handle,
        lazy: r.props.lazy,
      };
      r.props.children && (s.children = Ed(r.props.children, i)), n.push(s);
    }),
    n
  );
}
function YO(e) {
  let t = { hasErrorBoundary: e.ErrorBoundary != null || e.errorElement != null };
  return (
    e.Component && Object.assign(t, { element: h.createElement(e.Component), Component: void 0 }),
    e.HydrateFallback &&
      Object.assign(t, { hydrateFallbackElement: h.createElement(e.HydrateFallback), HydrateFallback: void 0 }),
    e.ErrorBoundary && Object.assign(t, { errorElement: h.createElement(e.ErrorBoundary), ErrorBoundary: void 0 }),
    t
  );
}
/**
 * React Router DOM v6.26.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function li() {
  return (
    (li = Object.assign
      ? Object.assign.bind()
      : function (e) {
          for (var t = 1; t < arguments.length; t++) {
            var n = arguments[t];
            for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
          }
          return e;
        }),
    li.apply(this, arguments)
  );
}
function zx(e, t) {
  if (e == null) return {};
  var n = {},
    r = Object.keys(e),
    o,
    i;
  for (i = 0; i < r.length; i++) (o = r[i]), !(t.indexOf(o) >= 0) && (n[o] = e[o]);
  return n;
}
function XO(e) {
  return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}
function JO(e, t) {
  return e.button === 0 && (!t || t === "_self") && !XO(e);
}
const ZO = [
    "onClick",
    "relative",
    "reloadDocument",
    "replace",
    "state",
    "target",
    "to",
    "preventScrollReset",
    "unstable_viewTransition",
  ],
  eA = ["aria-current", "caseSensitive", "className", "end", "style", "to", "unstable_viewTransition", "children"],
  tA = "6";
try {
  window.__reactRouterVersion = tA;
} catch (e) {}
function nA(e, t) {
  return pO({
    basename: t == null ? void 0 : t.basename,
    future: li({}, t == null ? void 0 : t.future, { v7_prependBasename: !0 }),
    history: FP({ window: t == null ? void 0 : t.window }),
    hydrationData: (t == null ? void 0 : t.hydrationData) || rA(),
    routes: e,
    mapRouteProperties: YO,
    unstable_dataStrategy: t == null ? void 0 : t.unstable_dataStrategy,
    unstable_patchRoutesOnMiss: t == null ? void 0 : t.unstable_patchRoutesOnMiss,
    window: t == null ? void 0 : t.window,
  }).initialize();
}
function rA() {
  var e;
  let t = (e = window) == null ? void 0 : e.__staticRouterHydrationData;
  return t && t.errors && (t = li({}, t, { errors: oA(t.errors) })), t;
}
function oA(e) {
  if (!e) return null;
  let t = Object.entries(e),
    n = {};
  for (let [r, o] of t)
    if (o && o.__type === "RouteErrorResponse") n[r] = new Ql(o.status, o.statusText, o.data, o.internal === !0);
    else if (o && o.__type === "Error") {
      if (o.__subType) {
        let i = window[o.__subType];
        if (typeof i == "function")
          try {
            let s = new i(o.message);
            (s.stack = ""), (n[r] = s);
          } catch (s) {}
      }
      if (n[r] == null) {
        let i = new Error(o.message);
        (i.stack = ""), (n[r] = i);
      }
    } else n[r] = o;
  return n;
}
const Ux = h.createContext({ isTransitioning: !1 }),
  iA = h.createContext(new Map()),
  sA = "startTransition",
  ny = gl[sA],
  aA = "flushSync",
  ry = mb[aA];
function lA(e) {
  ny ? ny(e) : e();
}
function Vi(e) {
  ry ? ry(e) : e();
}
class uA {
  constructor() {
    (this.status = "pending"),
      (this.promise = new Promise((t, n) => {
        (this.resolve = (r) => {
          this.status === "pending" && ((this.status = "resolved"), t(r));
        }),
          (this.reject = (r) => {
            this.status === "pending" && ((this.status = "rejected"), n(r));
          });
      }));
  }
}
function cA(e) {
  let { fallbackElement: t, router: n, future: r } = e,
    [o, i] = h.useState(n.state),
    [s, a] = h.useState(),
    [l, u] = h.useState({ isTransitioning: !1 }),
    [c, f] = h.useState(),
    [d, v] = h.useState(),
    [m, y] = h.useState(),
    x = h.useRef(new Map()),
    { v7_startTransition: p } = r || {},
    g = h.useCallback(
      (R) => {
        p ? lA(R) : R();
      },
      [p]
    ),
    w = h.useCallback(
      (R, A) => {
        let { deletedFetchers: D, unstable_flushSync: U, unstable_viewTransitionOpts: I } = A;
        D.forEach((X) => x.current.delete(X)),
          R.fetchers.forEach((X, B) => {
            X.data !== void 0 && x.current.set(B, X.data);
          });
        let Q =
          n.window == null || n.window.document == null || typeof n.window.document.startViewTransition != "function";
        if (!I || Q) {
          U ? Vi(() => i(R)) : g(() => i(R));
          return;
        }
        if (U) {
          Vi(() => {
            d && (c && c.resolve(), d.skipTransition()),
              u({
                isTransitioning: !0,
                flushSync: !0,
                currentLocation: I.currentLocation,
                nextLocation: I.nextLocation,
              });
          });
          let X = n.window.document.startViewTransition(() => {
            Vi(() => i(R));
          });
          X.finished.finally(() => {
            Vi(() => {
              f(void 0), v(void 0), a(void 0), u({ isTransitioning: !1 });
            });
          }),
            Vi(() => v(X));
          return;
        }
        d
          ? (c && c.resolve(),
            d.skipTransition(),
            y({ state: R, currentLocation: I.currentLocation, nextLocation: I.nextLocation }))
          : (a(R),
            u({
              isTransitioning: !0,
              flushSync: !1,
              currentLocation: I.currentLocation,
              nextLocation: I.nextLocation,
            }));
      },
      [n.window, d, c, x, g]
    );
  h.useLayoutEffect(() => n.subscribe(w), [n, w]),
    h.useEffect(() => {
      l.isTransitioning && !l.flushSync && f(new uA());
    }, [l]),
    h.useEffect(() => {
      if (c && s && n.window) {
        let R = s,
          A = c.promise,
          D = n.window.document.startViewTransition(() =>
            le(this, null, function* () {
              g(() => i(R)), yield A;
            })
          );
        D.finished.finally(() => {
          f(void 0), v(void 0), a(void 0), u({ isTransitioning: !1 });
        }),
          v(D);
      }
    }, [g, s, c, n.window]),
    h.useEffect(() => {
      c && s && o.location.key === s.location.key && c.resolve();
    }, [c, d, o.location, s]),
    h.useEffect(() => {
      !l.isTransitioning &&
        m &&
        (a(m.state),
        u({ isTransitioning: !0, flushSync: !1, currentLocation: m.currentLocation, nextLocation: m.nextLocation }),
        y(void 0));
    }, [l.isTransitioning, m]),
    h.useEffect(() => {}, []);
  let S = h.useMemo(
      () => ({
        createHref: n.createHref,
        encodeLocation: n.encodeLocation,
        go: (R) => n.navigate(R),
        push: (R, A, D) => n.navigate(R, { state: A, preventScrollReset: D == null ? void 0 : D.preventScrollReset }),
        replace: (R, A, D) =>
          n.navigate(R, { replace: !0, state: A, preventScrollReset: D == null ? void 0 : D.preventScrollReset }),
      }),
      [n]
    ),
    C = n.basename || "/",
    E = h.useMemo(() => ({ router: n, navigator: S, static: !1, basename: C }), [n, S, C]),
    P = h.useMemo(() => ({ v7_relativeSplatPath: n.future.v7_relativeSplatPath }), [n.future.v7_relativeSplatPath]);
  return h.createElement(
    h.Fragment,
    null,
    h.createElement(
      qs.Provider,
      { value: E },
      h.createElement(
        nh.Provider,
        { value: o },
        h.createElement(
          iA.Provider,
          { value: x.current },
          h.createElement(
            Ux.Provider,
            { value: l },
            h.createElement(
              QO,
              { basename: C, location: o.location, navigationType: o.historyAction, navigator: S, future: P },
              o.initialized || n.future.v7_partialHydration
                ? h.createElement(fA, { routes: n.routes, future: n.future, state: o })
                : t
            )
          )
        )
      )
    ),
    null
  );
}
const fA = h.memo(dA);
function dA(e) {
  let { routes: t, future: n, state: r } = e;
  return FO(t, void 0, r, n);
}
const pA =
    typeof window != "undefined" &&
    typeof window.document != "undefined" &&
    typeof window.document.createElement != "undefined",
  hA = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i,
  mA = h.forwardRef(function (t, n) {
    let {
        onClick: r,
        relative: o,
        reloadDocument: i,
        replace: s,
        state: a,
        target: l,
        to: u,
        preventScrollReset: c,
        unstable_viewTransition: f,
      } = t,
      d = zx(t, ZO),
      { basename: v } = h.useContext(er),
      m,
      y = !1;
    if (typeof u == "string" && hA.test(u) && ((m = u), pA))
      try {
        let w = new URL(window.location.href),
          S = u.startsWith("//") ? new URL(w.protocol + u) : new URL(u),
          C = Yn(S.pathname, v);
        S.origin === w.origin && C != null ? (u = C + S.search + S.hash) : (y = !0);
      } catch (w) {}
    let x = LO(u, { relative: o }),
      p = vA(u, { replace: s, state: a, target: l, preventScrollReset: c, relative: o, unstable_viewTransition: f });
    function g(w) {
      r && r(w), w.defaultPrevented || p(w);
    }
    return h.createElement("a", li({}, d, { href: m || x, onClick: y || i ? r : g, ref: n, target: l }));
  }),
  gA = h.forwardRef(function (t, n) {
    let {
        "aria-current": r = "page",
        caseSensitive: o = !1,
        className: i = "",
        end: s = !1,
        style: a,
        to: l,
        unstable_viewTransition: u,
        children: c,
      } = t,
      f = zx(t, eA),
      d = Mu(l, { relative: f.relative }),
      v = xi(),
      m = h.useContext(nh),
      { navigator: y, basename: x } = h.useContext(er),
      p = m != null && wA(d) && u === !0,
      g = y.encodeLocation ? y.encodeLocation(d).pathname : d.pathname,
      w = v.pathname,
      S = m && m.navigation && m.navigation.location ? m.navigation.location.pathname : null;
    o || ((w = w.toLowerCase()), (S = S ? S.toLowerCase() : null), (g = g.toLowerCase())),
      S && x && (S = Yn(S, x) || S);
    const C = g !== "/" && g.endsWith("/") ? g.length - 1 : g.length;
    let E = w === g || (!s && w.startsWith(g) && w.charAt(C) === "/"),
      P = S != null && (S === g || (!s && S.startsWith(g) && S.charAt(g.length) === "/")),
      R = { isActive: E, isPending: P, isTransitioning: p },
      A = E ? r : void 0,
      D;
    typeof i == "function"
      ? (D = i(R))
      : (D = [i, E ? "active" : null, P ? "pending" : null, p ? "transitioning" : null].filter(Boolean).join(" "));
    let U = typeof a == "function" ? a(R) : a;
    return h.createElement(
      mA,
      li({}, f, { "aria-current": A, className: D, ref: n, style: U, to: l, unstable_viewTransition: u }),
      typeof c == "function" ? c(R) : c
    );
  });
var Cd;
(function (e) {
  (e.UseScrollRestoration = "useScrollRestoration"),
    (e.UseSubmit = "useSubmit"),
    (e.UseSubmitFetcher = "useSubmitFetcher"),
    (e.UseFetcher = "useFetcher"),
    (e.useViewTransitionState = "useViewTransitionState");
})(Cd || (Cd = {}));
var oy;
(function (e) {
  (e.UseFetcher = "useFetcher"), (e.UseFetchers = "useFetchers"), (e.UseScrollRestoration = "useScrollRestoration");
})(oy || (oy = {}));
function yA(e) {
  let t = h.useContext(qs);
  return t || re(!1), t;
}
function vA(e, t) {
  let {
      target: n,
      replace: r,
      state: o,
      preventScrollReset: i,
      relative: s,
      unstable_viewTransition: a,
    } = t === void 0 ? {} : t,
    l = jx(),
    u = xi(),
    c = Mu(e, { relative: s });
  return h.useCallback(
    (f) => {
      if (JO(f, n)) {
        f.preventDefault();
        let d = r !== void 0 ? r : fo(u) === fo(c);
        l(e, { replace: d, state: o, preventScrollReset: i, relative: s, unstable_viewTransition: a });
      }
    },
    [u, l, c, r, o, n, e, i, s, a]
  );
}
function wA(e, t) {
  t === void 0 && (t = {});
  let n = h.useContext(Ux);
  n == null && re(!1);
  let { basename: r } = yA(Cd.useViewTransitionState),
    o = Mu(e, { relative: t.relative });
  if (!n.isTransitioning) return !1;
  let i = Yn(n.currentLocation.pathname, r) || n.currentLocation.pathname,
    s = Yn(n.nextLocation.pathname, r) || n.nextLocation.pathname;
  return Gl(o.pathname, s) != null || Gl(o.pathname, i) != null;
}
const xA = "/timesheet",
  oh = "/",
  Bx = "/home",
  cl = "/team",
  SA = "/desk",
  MM = "/employee";
function Oe(e, t, { checkForDefaultPrevented: n = !0 } = {}) {
  return function (o) {
    if ((e == null || e(o), n === !1 || !o.defaultPrevented)) return t == null ? void 0 : t(o);
  };
}
function EA(e, t) {
  typeof e == "function" ? e(t) : e != null && (e.current = t);
}
function Vx(...e) {
  return (t) => e.forEach((n) => EA(n, t));
}
function Tt(...e) {
  return h.useCallback(Vx(...e), e);
}
function jM(e, t) {
  const n = h.createContext(t);
  function r(i) {
    const u = i,
      { children: s } = u,
      a = G(u, ["children"]),
      l = h.useMemo(() => a, Object.values(a));
    return k.jsx(n.Provider, { value: l, children: s });
  }
  function o(i) {
    const s = h.useContext(n);
    if (s) return s;
    if (t !== void 0) return t;
    throw new Error(`\`${i}\` must be used within \`${e}\``);
  }
  return (r.displayName = e + "Provider"), [r, o];
}
function Si(e, t = []) {
  let n = [];
  function r(i, s) {
    const a = h.createContext(s),
      l = n.length;
    n = [...n, s];
    function u(f) {
      const p = f,
        { scope: d, children: v } = p,
        m = G(p, ["scope", "children"]),
        y = (d == null ? void 0 : d[e][l]) || a,
        x = h.useMemo(() => m, Object.values(m));
      return k.jsx(y.Provider, { value: x, children: v });
    }
    function c(f, d) {
      const v = (d == null ? void 0 : d[e][l]) || a,
        m = h.useContext(v);
      if (m) return m;
      if (s !== void 0) return s;
      throw new Error(`\`${f}\` must be used within \`${i}\``);
    }
    return (u.displayName = i + "Provider"), [u, c];
  }
  const o = () => {
    const i = n.map((s) => h.createContext(s));
    return function (a) {
      const l = (a == null ? void 0 : a[e]) || i;
      return h.useMemo(() => ({ [`__scope${e}`]: F(T({}, a), { [e]: l }) }), [a, l]);
    };
  };
  return (o.scopeName = e), [r, CA(o, ...t)];
}
function CA(...e) {
  const t = e[0];
  if (e.length === 1) return t;
  const n = () => {
    const r = e.map((o) => ({ useScope: o(), scopeName: o.scopeName }));
    return function (i) {
      const s = r.reduce((a, { useScope: l, scopeName: u }) => {
        const f = l(i)[`__scope${u}`];
        return T(T({}, a), f);
      }, {});
      return h.useMemo(() => ({ [`__scope${t.scopeName}`]: s }), [s]);
    };
  };
  return (n.scopeName = t.scopeName), n;
}
var ui = h.forwardRef((e, t) => {
  const s = e,
    { children: n } = s,
    r = G(s, ["children"]),
    o = h.Children.toArray(n),
    i = o.find(bA);
  if (i) {
    const a = i.props.children,
      l = o.map((u) =>
        u === i ? (h.Children.count(a) > 1 ? h.Children.only(null) : h.isValidElement(a) ? a.props.children : null) : u
      );
    return k.jsx(bd, F(T({}, r), { ref: t, children: h.isValidElement(a) ? h.cloneElement(a, void 0, l) : null }));
  }
  return k.jsx(bd, F(T({}, r), { ref: t, children: n }));
});
ui.displayName = "Slot";
var bd = h.forwardRef((e, t) => {
  const o = e,
    { children: n } = o,
    r = G(o, ["children"]);
  if (h.isValidElement(n)) {
    const i = _A(n);
    return h.cloneElement(n, F(T({}, kA(r, n.props)), { ref: t ? Vx(t, i) : i }));
  }
  return h.Children.count(n) > 1 ? h.Children.only(null) : null;
});
bd.displayName = "SlotClone";
var Wx = ({ children: e }) => k.jsx(k.Fragment, { children: e });
function bA(e) {
  return h.isValidElement(e) && e.type === Wx;
}
function kA(e, t) {
  const n = T({}, t);
  for (const r in t) {
    const o = e[r],
      i = t[r];
    /^on[A-Z]/.test(r)
      ? o && i
        ? (n[r] = (...a) => {
            i(...a), o(...a);
          })
        : o && (n[r] = o)
      : r === "style"
      ? (n[r] = T(T({}, o), i))
      : r === "className" && (n[r] = [o, i].filter(Boolean).join(" "));
  }
  return T(T({}, e), n);
}
function _A(e) {
  var r, o;
  let t = (r = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : r.get,
    n = t && "isReactWarning" in t && t.isReactWarning;
  return n
    ? e.ref
    : ((t = (o = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : o.get),
      (n = t && "isReactWarning" in t && t.isReactWarning),
      n ? e.props.ref : e.props.ref || e.ref);
}
var TA = [
    "a",
    "button",
    "div",
    "form",
    "h2",
    "h3",
    "img",
    "input",
    "label",
    "li",
    "nav",
    "ol",
    "p",
    "span",
    "svg",
    "ul",
  ],
  Ve = TA.reduce((e, t) => {
    const n = h.forwardRef((r, o) => {
      const l = r,
        { asChild: i } = l,
        s = G(l, ["asChild"]),
        a = i ? ui : t;
      return typeof window != "undefined" && (window[Symbol.for("radix-ui")] = !0), k.jsx(a, F(T({}, s), { ref: o }));
    });
    return (n.displayName = `Primitive.${t}`), F(T({}, e), { [t]: n });
  }, {});
function Hx(e, t) {
  e && go.flushSync(() => e.dispatchEvent(t));
}
function $t(e) {
  const t = h.useRef(e);
  return (
    h.useEffect(() => {
      t.current = e;
    }),
    h.useMemo(
      () =>
        (...n) => {
          var r;
          return (r = t.current) == null ? void 0 : r.call(t, ...n);
        },
      []
    )
  );
}
function RA(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = $t(e);
  h.useEffect(() => {
    const r = (o) => {
      o.key === "Escape" && n(o);
    };
    return (
      t.addEventListener("keydown", r, { capture: !0 }), () => t.removeEventListener("keydown", r, { capture: !0 })
    );
  }, [n, t]);
}
var PA = "DismissableLayer",
  kd = "dismissableLayer.update",
  OA = "dismissableLayer.pointerDownOutside",
  AA = "dismissableLayer.focusOutside",
  iy,
  Kx = h.createContext({ layers: new Set(), layersWithOutsidePointerEventsDisabled: new Set(), branches: new Set() }),
  ju = h.forwardRef((e, t) => {
    var R;
    const P = e,
      {
        disableOutsidePointerEvents: n = !1,
        onEscapeKeyDown: r,
        onPointerDownOutside: o,
        onFocusOutside: i,
        onInteractOutside: s,
        onDismiss: a,
      } = P,
      l = G(P, [
        "disableOutsidePointerEvents",
        "onEscapeKeyDown",
        "onPointerDownOutside",
        "onFocusOutside",
        "onInteractOutside",
        "onDismiss",
      ]),
      u = h.useContext(Kx),
      [c, f] = h.useState(null),
      d = (R = c == null ? void 0 : c.ownerDocument) != null ? R : globalThis == null ? void 0 : globalThis.document,
      [, v] = h.useState({}),
      m = Tt(t, (A) => f(A)),
      y = Array.from(u.layers),
      [x] = [...u.layersWithOutsidePointerEventsDisabled].slice(-1),
      p = y.indexOf(x),
      g = c ? y.indexOf(c) : -1,
      w = u.layersWithOutsidePointerEventsDisabled.size > 0,
      S = g >= p,
      C = LA((A) => {
        const D = A.target,
          U = [...u.branches].some((I) => I.contains(D));
        !S || U || (o == null || o(A), s == null || s(A), A.defaultPrevented || a == null || a());
      }, d),
      E = DA((A) => {
        const D = A.target;
        [...u.branches].some((I) => I.contains(D)) ||
          (i == null || i(A), s == null || s(A), A.defaultPrevented || a == null || a());
      }, d);
    return (
      RA((A) => {
        g === u.layers.size - 1 && (r == null || r(A), !A.defaultPrevented && a && (A.preventDefault(), a()));
      }, d),
      h.useEffect(() => {
        if (c)
          return (
            n &&
              (u.layersWithOutsidePointerEventsDisabled.size === 0 &&
                ((iy = d.body.style.pointerEvents), (d.body.style.pointerEvents = "none")),
              u.layersWithOutsidePointerEventsDisabled.add(c)),
            u.layers.add(c),
            sy(),
            () => {
              n && u.layersWithOutsidePointerEventsDisabled.size === 1 && (d.body.style.pointerEvents = iy);
            }
          );
      }, [c, d, n, u]),
      h.useEffect(
        () => () => {
          c && (u.layers.delete(c), u.layersWithOutsidePointerEventsDisabled.delete(c), sy());
        },
        [c, u]
      ),
      h.useEffect(() => {
        const A = () => v({});
        return document.addEventListener(kd, A), () => document.removeEventListener(kd, A);
      }, []),
      k.jsx(
        Ve.div,
        F(T({}, l), {
          ref: m,
          style: T({ pointerEvents: w ? (S ? "auto" : "none") : void 0 }, e.style),
          onFocusCapture: Oe(e.onFocusCapture, E.onFocusCapture),
          onBlurCapture: Oe(e.onBlurCapture, E.onBlurCapture),
          onPointerDownCapture: Oe(e.onPointerDownCapture, C.onPointerDownCapture),
        })
      )
    );
  });
ju.displayName = PA;
var NA = "DismissableLayerBranch",
  qx = h.forwardRef((e, t) => {
    const n = h.useContext(Kx),
      r = h.useRef(null),
      o = Tt(t, r);
    return (
      h.useEffect(() => {
        const i = r.current;
        if (i)
          return (
            n.branches.add(i),
            () => {
              n.branches.delete(i);
            }
          );
      }, [n.branches]),
      k.jsx(Ve.div, F(T({}, e), { ref: o }))
    );
  });
qx.displayName = NA;
function LA(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = $t(e),
    r = h.useRef(!1),
    o = h.useRef(() => {});
  return (
    h.useEffect(() => {
      const i = (a) => {
          if (a.target && !r.current) {
            let l = function () {
              Gx(OA, n, u, { discrete: !0 });
            };
            const u = { originalEvent: a };
            a.pointerType === "touch"
              ? (t.removeEventListener("click", o.current),
                (o.current = l),
                t.addEventListener("click", o.current, { once: !0 }))
              : l();
          } else t.removeEventListener("click", o.current);
          r.current = !1;
        },
        s = window.setTimeout(() => {
          t.addEventListener("pointerdown", i);
        }, 0);
      return () => {
        window.clearTimeout(s), t.removeEventListener("pointerdown", i), t.removeEventListener("click", o.current);
      };
    }, [t, n]),
    { onPointerDownCapture: () => (r.current = !0) }
  );
}
function DA(e, t = globalThis == null ? void 0 : globalThis.document) {
  const n = $t(e),
    r = h.useRef(!1);
  return (
    h.useEffect(() => {
      const o = (i) => {
        i.target && !r.current && Gx(AA, n, { originalEvent: i }, { discrete: !1 });
      };
      return t.addEventListener("focusin", o), () => t.removeEventListener("focusin", o);
    }, [t, n]),
    { onFocusCapture: () => (r.current = !0), onBlurCapture: () => (r.current = !1) }
  );
}
function sy() {
  const e = new CustomEvent(kd);
  document.dispatchEvent(e);
}
function Gx(e, t, n, { discrete: r }) {
  const o = n.originalEvent.target,
    i = new CustomEvent(e, { bubbles: !1, cancelable: !0, detail: n });
  t && o.addEventListener(e, t, { once: !0 }), r ? Hx(o, i) : o.dispatchEvent(i);
}
var MA = ju,
  jA = qx,
  Tn = globalThis != null && globalThis.document ? h.useLayoutEffect : () => {},
  FA = gl.useId || (() => {}),
  IA = 0;
function Qx(e) {
  const [t, n] = h.useState(FA());
  return (
    Tn(() => {
      n((r) => (r != null ? r : String(IA++)));
    }, [e]),
    t ? `radix-${t}` : ""
  );
}
const $A = ["top", "right", "bottom", "left"],
  En = Math.min,
  At = Math.max,
  Jl = Math.round,
  Fa = Math.floor,
  Nr = (e) => ({ x: e, y: e }),
  zA = { left: "right", right: "left", bottom: "top", top: "bottom" },
  UA = { start: "end", end: "start" };
function _d(e, t, n) {
  return At(e, En(t, n));
}
function Xn(e, t) {
  return typeof e == "function" ? e(t) : e;
}
function Jn(e) {
  return e.split("-")[0];
}
function Ei(e) {
  return e.split("-")[1];
}
function ih(e) {
  return e === "x" ? "y" : "x";
}
function sh(e) {
  return e === "y" ? "height" : "width";
}
function Lr(e) {
  return ["top", "bottom"].includes(Jn(e)) ? "y" : "x";
}
function ah(e) {
  return ih(Lr(e));
}
function BA(e, t, n) {
  n === void 0 && (n = !1);
  const r = Ei(e),
    o = ah(e),
    i = sh(o);
  let s = o === "x" ? (r === (n ? "end" : "start") ? "right" : "left") : r === "start" ? "bottom" : "top";
  return t.reference[i] > t.floating[i] && (s = Zl(s)), [s, Zl(s)];
}
function VA(e) {
  const t = Zl(e);
  return [Td(e), t, Td(t)];
}
function Td(e) {
  return e.replace(/start|end/g, (t) => UA[t]);
}
function WA(e, t, n) {
  const r = ["left", "right"],
    o = ["right", "left"],
    i = ["top", "bottom"],
    s = ["bottom", "top"];
  switch (e) {
    case "top":
    case "bottom":
      return n ? (t ? o : r) : t ? r : o;
    case "left":
    case "right":
      return t ? i : s;
    default:
      return [];
  }
}
function HA(e, t, n, r) {
  const o = Ei(e);
  let i = WA(Jn(e), n === "start", r);
  return o && ((i = i.map((s) => s + "-" + o)), t && (i = i.concat(i.map(Td)))), i;
}
function Zl(e) {
  return e.replace(/left|right|bottom|top/g, (t) => zA[t]);
}
function KA(e) {
  return T({ top: 0, right: 0, bottom: 0, left: 0 }, e);
}
function Yx(e) {
  return typeof e != "number" ? KA(e) : { top: e, right: e, bottom: e, left: e };
}
function eu(e) {
  const { x: t, y: n, width: r, height: o } = e;
  return { width: r, height: o, top: n, left: t, right: t + r, bottom: n + o, x: t, y: n };
}
function ay(e, t, n) {
  let { reference: r, floating: o } = e;
  const i = Lr(t),
    s = ah(t),
    a = sh(s),
    l = Jn(t),
    u = i === "y",
    c = r.x + r.width / 2 - o.width / 2,
    f = r.y + r.height / 2 - o.height / 2,
    d = r[a] / 2 - o[a] / 2;
  let v;
  switch (l) {
    case "top":
      v = { x: c, y: r.y - o.height };
      break;
    case "bottom":
      v = { x: c, y: r.y + r.height };
      break;
    case "right":
      v = { x: r.x + r.width, y: f };
      break;
    case "left":
      v = { x: r.x - o.width, y: f };
      break;
    default:
      v = { x: r.x, y: r.y };
  }
  switch (Ei(t)) {
    case "start":
      v[s] -= d * (n && u ? -1 : 1);
      break;
    case "end":
      v[s] += d * (n && u ? -1 : 1);
      break;
  }
  return v;
}
const qA = (e, t, n) =>
  le(void 0, null, function* () {
    const { placement: r = "bottom", strategy: o = "absolute", middleware: i = [], platform: s } = n,
      a = i.filter(Boolean),
      l = yield s.isRTL == null ? void 0 : s.isRTL(t);
    let u = yield s.getElementRects({ reference: e, floating: t, strategy: o }),
      { x: c, y: f } = ay(u, r, l),
      d = r,
      v = {},
      m = 0;
    for (let y = 0; y < a.length; y++) {
      const { name: x, fn: p } = a[y],
        {
          x: g,
          y: w,
          data: S,
          reset: C,
        } = yield p({
          x: c,
          y: f,
          initialPlacement: r,
          placement: d,
          strategy: o,
          middlewareData: v,
          rects: u,
          platform: s,
          elements: { reference: e, floating: t },
        });
      (c = g != null ? g : c),
        (f = w != null ? w : f),
        (v = F(T({}, v), { [x]: T(T({}, v[x]), S) })),
        C &&
          m <= 50 &&
          (m++,
          typeof C == "object" &&
            (C.placement && (d = C.placement),
            C.rects &&
              (u = C.rects === !0 ? yield s.getElementRects({ reference: e, floating: t, strategy: o }) : C.rects),
            ({ x: c, y: f } = ay(u, d, l))),
          (y = -1));
    }
    return { x: c, y: f, placement: d, strategy: o, middlewareData: v };
  });
function Ls(e, t) {
  return le(this, null, function* () {
    var n;
    t === void 0 && (t = {});
    const { x: r, y: o, platform: i, rects: s, elements: a, strategy: l } = e,
      {
        boundary: u = "clippingAncestors",
        rootBoundary: c = "viewport",
        elementContext: f = "floating",
        altBoundary: d = !1,
        padding: v = 0,
      } = Xn(t, e),
      m = Yx(v),
      x = a[d ? (f === "floating" ? "reference" : "floating") : f],
      p = eu(
        yield i.getClippingRect({
          element:
            (n = yield i.isElement == null ? void 0 : i.isElement(x)) == null || n
              ? x
              : x.contextElement || (yield i.getDocumentElement == null ? void 0 : i.getDocumentElement(a.floating)),
          boundary: u,
          rootBoundary: c,
          strategy: l,
        })
      ),
      g = f === "floating" ? { x: r, y: o, width: s.floating.width, height: s.floating.height } : s.reference,
      w = yield i.getOffsetParent == null ? void 0 : i.getOffsetParent(a.floating),
      S = (yield i.isElement == null ? void 0 : i.isElement(w))
        ? (yield i.getScale == null ? void 0 : i.getScale(w)) || { x: 1, y: 1 }
        : { x: 1, y: 1 },
      C = eu(
        i.convertOffsetParentRelativeRectToViewportRelativeRect
          ? yield i.convertOffsetParentRelativeRectToViewportRelativeRect({
              elements: a,
              rect: g,
              offsetParent: w,
              strategy: l,
            })
          : g
      );
    return {
      top: (p.top - C.top + m.top) / S.y,
      bottom: (C.bottom - p.bottom + m.bottom) / S.y,
      left: (p.left - C.left + m.left) / S.x,
      right: (C.right - p.right + m.right) / S.x,
    };
  });
}
const GA = (e) => ({
    name: "arrow",
    options: e,
    fn(n) {
      return le(this, null, function* () {
        const { x: r, y: o, placement: i, rects: s, platform: a, elements: l, middlewareData: u } = n,
          { element: c, padding: f = 0 } = Xn(e, n) || {};
        if (c == null) return {};
        const d = Yx(f),
          v = { x: r, y: o },
          m = ah(i),
          y = sh(m),
          x = yield a.getDimensions(c),
          p = m === "y",
          g = p ? "top" : "left",
          w = p ? "bottom" : "right",
          S = p ? "clientHeight" : "clientWidth",
          C = s.reference[y] + s.reference[m] - v[m] - s.floating[y],
          E = v[m] - s.reference[m],
          P = yield a.getOffsetParent == null ? void 0 : a.getOffsetParent(c);
        let R = P ? P[S] : 0;
        (!R || !(yield a.isElement == null ? void 0 : a.isElement(P))) && (R = l.floating[S] || s.floating[y]);
        const A = C / 2 - E / 2,
          D = R / 2 - x[y] / 2 - 1,
          U = En(d[g], D),
          I = En(d[w], D),
          Q = U,
          X = R - x[y] - I,
          B = R / 2 - x[y] / 2 + A,
          te = _d(Q, B, X),
          W = !u.arrow && Ei(i) != null && B !== te && s.reference[y] / 2 - (B < Q ? U : I) - x[y] / 2 < 0,
          M = W ? (B < Q ? B - Q : B - X) : 0;
        return { [m]: v[m] + M, data: T({ [m]: te, centerOffset: B - te - M }, W && { alignmentOffset: M }), reset: W };
      });
    },
  }),
  QA = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: "flip",
        options: e,
        fn(n) {
          return le(this, null, function* () {
            var r, o;
            const { placement: i, middlewareData: s, rects: a, initialPlacement: l, platform: u, elements: c } = n,
              B = Xn(e, n),
              {
                mainAxis: f = !0,
                crossAxis: d = !0,
                fallbackPlacements: v,
                fallbackStrategy: m = "bestFit",
                fallbackAxisSideDirection: y = "none",
                flipAlignment: x = !0,
              } = B,
              p = G(B, [
                "mainAxis",
                "crossAxis",
                "fallbackPlacements",
                "fallbackStrategy",
                "fallbackAxisSideDirection",
                "flipAlignment",
              ]);
            if ((r = s.arrow) != null && r.alignmentOffset) return {};
            const g = Jn(i),
              w = Lr(l),
              S = Jn(l) === l,
              C = yield u.isRTL == null ? void 0 : u.isRTL(c.floating),
              E = v || (S || !x ? [Zl(l)] : VA(l)),
              P = y !== "none";
            !v && P && E.push(...HA(l, x, y, C));
            const R = [l, ...E],
              A = yield Ls(n, p),
              D = [];
            let U = ((o = s.flip) == null ? void 0 : o.overflows) || [];
            if ((f && D.push(A[g]), d)) {
              const te = BA(i, a, C);
              D.push(A[te[0]], A[te[1]]);
            }
            if (((U = [...U, { placement: i, overflows: D }]), !D.every((te) => te <= 0))) {
              var I, Q;
              const te = (((I = s.flip) == null ? void 0 : I.index) || 0) + 1,
                W = R[te];
              if (W) return { data: { index: te, overflows: U }, reset: { placement: W } };
              let M =
                (Q = U.filter(($) => $.overflows[0] <= 0).sort(($, H) => $.overflows[1] - H.overflows[1])[0]) == null
                  ? void 0
                  : Q.placement;
              if (!M)
                switch (m) {
                  case "bestFit": {
                    var X;
                    const $ =
                      (X = U.filter((H) => {
                        if (P) {
                          const q = Lr(H.placement);
                          return q === w || q === "y";
                        }
                        return !0;
                      })
                        .map((H) => [H.placement, H.overflows.filter((q) => q > 0).reduce((q, oe) => q + oe, 0)])
                        .sort((H, q) => H[1] - q[1])[0]) == null
                        ? void 0
                        : X[0];
                    $ && (M = $);
                    break;
                  }
                  case "initialPlacement":
                    M = l;
                    break;
                }
              if (i !== M) return { reset: { placement: M } };
            }
            return {};
          });
        },
      }
    );
  };
function ly(e, t) {
  return { top: e.top - t.height, right: e.right - t.width, bottom: e.bottom - t.height, left: e.left - t.width };
}
function uy(e) {
  return $A.some((t) => e[t] >= 0);
}
const YA = function (e) {
  return (
    e === void 0 && (e = {}),
    {
      name: "hide",
      options: e,
      fn(n) {
        return le(this, null, function* () {
          const { rects: r } = n,
            s = Xn(e, n),
            { strategy: o = "referenceHidden" } = s,
            i = G(s, ["strategy"]);
          switch (o) {
            case "referenceHidden": {
              const a = yield Ls(n, F(T({}, i), { elementContext: "reference" })),
                l = ly(a, r.reference);
              return { data: { referenceHiddenOffsets: l, referenceHidden: uy(l) } };
            }
            case "escaped": {
              const a = yield Ls(n, F(T({}, i), { altBoundary: !0 })),
                l = ly(a, r.floating);
              return { data: { escapedOffsets: l, escaped: uy(l) } };
            }
            default:
              return {};
          }
        });
      },
    }
  );
};
function XA(e, t) {
  return le(this, null, function* () {
    const { placement: n, platform: r, elements: o } = e,
      i = yield r.isRTL == null ? void 0 : r.isRTL(o.floating),
      s = Jn(n),
      a = Ei(n),
      l = Lr(n) === "y",
      u = ["left", "top"].includes(s) ? -1 : 1,
      c = i && l ? -1 : 1,
      f = Xn(t, e);
    let {
      mainAxis: d,
      crossAxis: v,
      alignmentAxis: m,
    } = typeof f == "number"
      ? { mainAxis: f, crossAxis: 0, alignmentAxis: null }
      : T({ mainAxis: 0, crossAxis: 0, alignmentAxis: null }, f);
    return (
      a && typeof m == "number" && (v = a === "end" ? m * -1 : m), l ? { x: v * c, y: d * u } : { x: d * u, y: v * c }
    );
  });
}
const JA = function (e) {
    return (
      e === void 0 && (e = 0),
      {
        name: "offset",
        options: e,
        fn(n) {
          return le(this, null, function* () {
            var r, o;
            const { x: i, y: s, placement: a, middlewareData: l } = n,
              u = yield XA(n, e);
            return a === ((r = l.offset) == null ? void 0 : r.placement) && (o = l.arrow) != null && o.alignmentOffset
              ? {}
              : { x: i + u.x, y: s + u.y, data: F(T({}, u), { placement: a }) };
          });
        },
      }
    );
  },
  ZA = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: "shift",
        options: e,
        fn(n) {
          return le(this, null, function* () {
            const { x: r, y: o, placement: i } = n,
              p = Xn(e, n),
              {
                mainAxis: s = !0,
                crossAxis: a = !1,
                limiter: l = {
                  fn: (g) => {
                    let { x: w, y: S } = g;
                    return { x: w, y: S };
                  },
                },
              } = p,
              u = G(p, ["mainAxis", "crossAxis", "limiter"]),
              c = { x: r, y: o },
              f = yield Ls(n, u),
              d = Lr(Jn(i)),
              v = ih(d);
            let m = c[v],
              y = c[d];
            if (s) {
              const g = v === "y" ? "top" : "left",
                w = v === "y" ? "bottom" : "right",
                S = m + f[g],
                C = m - f[w];
              m = _d(S, m, C);
            }
            if (a) {
              const g = d === "y" ? "top" : "left",
                w = d === "y" ? "bottom" : "right",
                S = y + f[g],
                C = y - f[w];
              y = _d(S, y, C);
            }
            const x = l.fn(F(T({}, n), { [v]: m, [d]: y }));
            return F(T({}, x), { data: { x: x.x - r, y: x.y - o } });
          });
        },
      }
    );
  },
  eN = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        options: e,
        fn(t) {
          const { x: n, y: r, placement: o, rects: i, middlewareData: s } = t,
            { offset: a = 0, mainAxis: l = !0, crossAxis: u = !0 } = Xn(e, t),
            c = { x: n, y: r },
            f = Lr(o),
            d = ih(f);
          let v = c[d],
            m = c[f];
          const y = Xn(a, t),
            x = typeof y == "number" ? { mainAxis: y, crossAxis: 0 } : T({ mainAxis: 0, crossAxis: 0 }, y);
          if (l) {
            const w = d === "y" ? "height" : "width",
              S = i.reference[d] - i.floating[w] + x.mainAxis,
              C = i.reference[d] + i.reference[w] - x.mainAxis;
            v < S ? (v = S) : v > C && (v = C);
          }
          if (u) {
            var p, g;
            const w = d === "y" ? "width" : "height",
              S = ["top", "left"].includes(Jn(o)),
              C =
                i.reference[f] -
                i.floating[w] +
                ((S && ((p = s.offset) == null ? void 0 : p[f])) || 0) +
                (S ? 0 : x.crossAxis),
              E =
                i.reference[f] +
                i.reference[w] +
                (S ? 0 : ((g = s.offset) == null ? void 0 : g[f]) || 0) -
                (S ? x.crossAxis : 0);
            m < C ? (m = C) : m > E && (m = E);
          }
          return { [d]: v, [f]: m };
        },
      }
    );
  },
  tN = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: "size",
        options: e,
        fn(n) {
          return le(this, null, function* () {
            const { placement: r, rects: o, platform: i, elements: s } = n,
              A = Xn(e, n),
              { apply: a = () => {} } = A,
              l = G(A, ["apply"]),
              u = yield Ls(n, l),
              c = Jn(r),
              f = Ei(r),
              d = Lr(r) === "y",
              { width: v, height: m } = o.floating;
            let y, x;
            c === "top" || c === "bottom"
              ? ((y = c),
                (x =
                  f === ((yield i.isRTL == null ? void 0 : i.isRTL(s.floating)) ? "start" : "end") ? "left" : "right"))
              : ((x = c), (y = f === "end" ? "top" : "bottom"));
            const p = m - u.top - u.bottom,
              g = v - u.left - u.right,
              w = En(m - u[y], p),
              S = En(v - u[x], g),
              C = !n.middlewareData.shift;
            let E = w,
              P = S;
            if ((d ? (P = f || C ? En(S, g) : g) : (E = f || C ? En(w, p) : p), C && !f)) {
              const D = At(u.left, 0),
                U = At(u.right, 0),
                I = At(u.top, 0),
                Q = At(u.bottom, 0);
              d
                ? (P = v - 2 * (D !== 0 || U !== 0 ? D + U : At(u.left, u.right)))
                : (E = m - 2 * (I !== 0 || Q !== 0 ? I + Q : At(u.top, u.bottom)));
            }
            yield a(F(T({}, n), { availableWidth: P, availableHeight: E }));
            const R = yield i.getDimensions(s.floating);
            return v !== R.width || m !== R.height ? { reset: { rects: !0 } } : {};
          });
        },
      }
    );
  };
function Ci(e) {
  return Xx(e) ? (e.nodeName || "").toLowerCase() : "#document";
}
function Mt(e) {
  var t;
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window;
}
function tr(e) {
  var t;
  return (t = (Xx(e) ? e.ownerDocument : e.document) || window.document) == null ? void 0 : t.documentElement;
}
function Xx(e) {
  return e instanceof Node || e instanceof Mt(e).Node;
}
function Rn(e) {
  return e instanceof Element || e instanceof Mt(e).Element;
}
function Pn(e) {
  return e instanceof HTMLElement || e instanceof Mt(e).HTMLElement;
}
function cy(e) {
  return typeof ShadowRoot == "undefined" ? !1 : e instanceof ShadowRoot || e instanceof Mt(e).ShadowRoot;
}
function Gs(e) {
  const { overflow: t, overflowX: n, overflowY: r, display: o } = pn(e);
  return /auto|scroll|overlay|hidden|clip/.test(t + r + n) && !["inline", "contents"].includes(o);
}
function nN(e) {
  return ["table", "td", "th"].includes(Ci(e));
}
function Fu(e) {
  return [":popover-open", ":modal"].some((t) => {
    try {
      return e.matches(t);
    } catch (n) {
      return !1;
    }
  });
}
function lh(e) {
  const t = uh(),
    n = pn(e);
  return (
    n.transform !== "none" ||
    n.perspective !== "none" ||
    (n.containerType ? n.containerType !== "normal" : !1) ||
    (!t && (n.backdropFilter ? n.backdropFilter !== "none" : !1)) ||
    (!t && (n.filter ? n.filter !== "none" : !1)) ||
    ["transform", "perspective", "filter"].some((r) => (n.willChange || "").includes(r)) ||
    ["paint", "layout", "strict", "content"].some((r) => (n.contain || "").includes(r))
  );
}
function rN(e) {
  let t = Dr(e);
  for (; Pn(t) && !ci(t); ) {
    if (Fu(t)) return null;
    if (lh(t)) return t;
    t = Dr(t);
  }
  return null;
}
function uh() {
  return typeof CSS == "undefined" || !CSS.supports ? !1 : CSS.supports("-webkit-backdrop-filter", "none");
}
function ci(e) {
  return ["html", "body", "#document"].includes(Ci(e));
}
function pn(e) {
  return Mt(e).getComputedStyle(e);
}
function Iu(e) {
  return Rn(e) ? { scrollLeft: e.scrollLeft, scrollTop: e.scrollTop } : { scrollLeft: e.scrollX, scrollTop: e.scrollY };
}
function Dr(e) {
  if (Ci(e) === "html") return e;
  const t = e.assignedSlot || e.parentNode || (cy(e) && e.host) || tr(e);
  return cy(t) ? t.host : t;
}
function Jx(e) {
  const t = Dr(e);
  return ci(t) ? (e.ownerDocument ? e.ownerDocument.body : e.body) : Pn(t) && Gs(t) ? t : Jx(t);
}
function Ds(e, t, n) {
  var r;
  t === void 0 && (t = []), n === void 0 && (n = !0);
  const o = Jx(e),
    i = o === ((r = e.ownerDocument) == null ? void 0 : r.body),
    s = Mt(o);
  return i
    ? t.concat(s, s.visualViewport || [], Gs(o) ? o : [], s.frameElement && n ? Ds(s.frameElement) : [])
    : t.concat(o, Ds(o, [], n));
}
function Zx(e) {
  const t = pn(e);
  let n = parseFloat(t.width) || 0,
    r = parseFloat(t.height) || 0;
  const o = Pn(e),
    i = o ? e.offsetWidth : n,
    s = o ? e.offsetHeight : r,
    a = Jl(n) !== i || Jl(r) !== s;
  return a && ((n = i), (r = s)), { width: n, height: r, $: a };
}
function ch(e) {
  return Rn(e) ? e : e.contextElement;
}
function Qo(e) {
  const t = ch(e);
  if (!Pn(t)) return Nr(1);
  const n = t.getBoundingClientRect(),
    { width: r, height: o, $: i } = Zx(t);
  let s = (i ? Jl(n.width) : n.width) / r,
    a = (i ? Jl(n.height) : n.height) / o;
  return (!s || !Number.isFinite(s)) && (s = 1), (!a || !Number.isFinite(a)) && (a = 1), { x: s, y: a };
}
const oN = Nr(0);
function e1(e) {
  const t = Mt(e);
  return !uh() || !t.visualViewport ? oN : { x: t.visualViewport.offsetLeft, y: t.visualViewport.offsetTop };
}
function iN(e, t, n) {
  return t === void 0 && (t = !1), !n || (t && n !== Mt(e)) ? !1 : t;
}
function po(e, t, n, r) {
  t === void 0 && (t = !1), n === void 0 && (n = !1);
  const o = e.getBoundingClientRect(),
    i = ch(e);
  let s = Nr(1);
  t && (r ? Rn(r) && (s = Qo(r)) : (s = Qo(e)));
  const a = iN(i, n, r) ? e1(i) : Nr(0);
  let l = (o.left + a.x) / s.x,
    u = (o.top + a.y) / s.y,
    c = o.width / s.x,
    f = o.height / s.y;
  if (i) {
    const d = Mt(i),
      v = r && Rn(r) ? Mt(r) : r;
    let m = d,
      y = m.frameElement;
    for (; y && r && v !== m; ) {
      const x = Qo(y),
        p = y.getBoundingClientRect(),
        g = pn(y),
        w = p.left + (y.clientLeft + parseFloat(g.paddingLeft)) * x.x,
        S = p.top + (y.clientTop + parseFloat(g.paddingTop)) * x.y;
      (l *= x.x), (u *= x.y), (c *= x.x), (f *= x.y), (l += w), (u += S), (m = Mt(y)), (y = m.frameElement);
    }
  }
  return eu({ width: c, height: f, x: l, y: u });
}
function sN(e) {
  let { elements: t, rect: n, offsetParent: r, strategy: o } = e;
  const i = o === "fixed",
    s = tr(r),
    a = t ? Fu(t.floating) : !1;
  if (r === s || (a && i)) return n;
  let l = { scrollLeft: 0, scrollTop: 0 },
    u = Nr(1);
  const c = Nr(0),
    f = Pn(r);
  if ((f || (!f && !i)) && ((Ci(r) !== "body" || Gs(s)) && (l = Iu(r)), Pn(r))) {
    const d = po(r);
    (u = Qo(r)), (c.x = d.x + r.clientLeft), (c.y = d.y + r.clientTop);
  }
  return {
    width: n.width * u.x,
    height: n.height * u.y,
    x: n.x * u.x - l.scrollLeft * u.x + c.x,
    y: n.y * u.y - l.scrollTop * u.y + c.y,
  };
}
function aN(e) {
  return Array.from(e.getClientRects());
}
function t1(e) {
  return po(tr(e)).left + Iu(e).scrollLeft;
}
function lN(e) {
  const t = tr(e),
    n = Iu(e),
    r = e.ownerDocument.body,
    o = At(t.scrollWidth, t.clientWidth, r.scrollWidth, r.clientWidth),
    i = At(t.scrollHeight, t.clientHeight, r.scrollHeight, r.clientHeight);
  let s = -n.scrollLeft + t1(e);
  const a = -n.scrollTop;
  return pn(r).direction === "rtl" && (s += At(t.clientWidth, r.clientWidth) - o), { width: o, height: i, x: s, y: a };
}
function uN(e, t) {
  const n = Mt(e),
    r = tr(e),
    o = n.visualViewport;
  let i = r.clientWidth,
    s = r.clientHeight,
    a = 0,
    l = 0;
  if (o) {
    (i = o.width), (s = o.height);
    const u = uh();
    (!u || (u && t === "fixed")) && ((a = o.offsetLeft), (l = o.offsetTop));
  }
  return { width: i, height: s, x: a, y: l };
}
function cN(e, t) {
  const n = po(e, !0, t === "fixed"),
    r = n.top + e.clientTop,
    o = n.left + e.clientLeft,
    i = Pn(e) ? Qo(e) : Nr(1),
    s = e.clientWidth * i.x,
    a = e.clientHeight * i.y,
    l = o * i.x,
    u = r * i.y;
  return { width: s, height: a, x: l, y: u };
}
function fy(e, t, n) {
  let r;
  if (t === "viewport") r = uN(e, n);
  else if (t === "document") r = lN(tr(e));
  else if (Rn(t)) r = cN(t, n);
  else {
    const o = e1(e);
    r = F(T({}, t), { x: t.x - o.x, y: t.y - o.y });
  }
  return eu(r);
}
function n1(e, t) {
  const n = Dr(e);
  return n === t || !Rn(n) || ci(n) ? !1 : pn(n).position === "fixed" || n1(n, t);
}
function fN(e, t) {
  const n = t.get(e);
  if (n) return n;
  let r = Ds(e, [], !1).filter((a) => Rn(a) && Ci(a) !== "body"),
    o = null;
  const i = pn(e).position === "fixed";
  let s = i ? Dr(e) : e;
  for (; Rn(s) && !ci(s); ) {
    const a = pn(s),
      l = lh(s);
    !l && a.position === "fixed" && (o = null),
      (
        i
          ? !l && !o
          : (!l && a.position === "static" && !!o && ["absolute", "fixed"].includes(o.position)) ||
            (Gs(s) && !l && n1(e, s))
      )
        ? (r = r.filter((c) => c !== s))
        : (o = a),
      (s = Dr(s));
  }
  return t.set(e, r), r;
}
function dN(e) {
  let { element: t, boundary: n, rootBoundary: r, strategy: o } = e;
  const s = [...(n === "clippingAncestors" ? (Fu(t) ? [] : fN(t, this._c)) : [].concat(n)), r],
    a = s[0],
    l = s.reduce((u, c) => {
      const f = fy(t, c, o);
      return (
        (u.top = At(f.top, u.top)),
        (u.right = En(f.right, u.right)),
        (u.bottom = En(f.bottom, u.bottom)),
        (u.left = At(f.left, u.left)),
        u
      );
    }, fy(t, a, o));
  return { width: l.right - l.left, height: l.bottom - l.top, x: l.left, y: l.top };
}
function pN(e) {
  const { width: t, height: n } = Zx(e);
  return { width: t, height: n };
}
function hN(e, t, n) {
  const r = Pn(t),
    o = tr(t),
    i = n === "fixed",
    s = po(e, !0, i, t);
  let a = { scrollLeft: 0, scrollTop: 0 };
  const l = Nr(0);
  if (r || (!r && !i))
    if (((Ci(t) !== "body" || Gs(o)) && (a = Iu(t)), r)) {
      const f = po(t, !0, i, t);
      (l.x = f.x + t.clientLeft), (l.y = f.y + t.clientTop);
    } else o && (l.x = t1(o));
  const u = s.left + a.scrollLeft - l.x,
    c = s.top + a.scrollTop - l.y;
  return { x: u, y: c, width: s.width, height: s.height };
}
function Vc(e) {
  return pn(e).position === "static";
}
function dy(e, t) {
  return !Pn(e) || pn(e).position === "fixed" ? null : t ? t(e) : e.offsetParent;
}
function r1(e, t) {
  const n = Mt(e);
  if (Fu(e)) return n;
  if (!Pn(e)) {
    let o = Dr(e);
    for (; o && !ci(o); ) {
      if (Rn(o) && !Vc(o)) return o;
      o = Dr(o);
    }
    return n;
  }
  let r = dy(e, t);
  for (; r && nN(r) && Vc(r); ) r = dy(r, t);
  return r && ci(r) && Vc(r) && !lh(r) ? n : r || rN(e) || n;
}
const mN = function (e) {
  return le(this, null, function* () {
    const t = this.getOffsetParent || r1,
      n = this.getDimensions,
      r = yield n(e.floating);
    return {
      reference: hN(e.reference, yield t(e.floating), e.strategy),
      floating: { x: 0, y: 0, width: r.width, height: r.height },
    };
  });
};
function gN(e) {
  return pn(e).direction === "rtl";
}
const yN = {
  convertOffsetParentRelativeRectToViewportRelativeRect: sN,
  getDocumentElement: tr,
  getClippingRect: dN,
  getOffsetParent: r1,
  getElementRects: mN,
  getClientRects: aN,
  getDimensions: pN,
  getScale: Qo,
  isElement: Rn,
  isRTL: gN,
};
function vN(e, t) {
  let n = null,
    r;
  const o = tr(e);
  function i() {
    var a;
    clearTimeout(r), (a = n) == null || a.disconnect(), (n = null);
  }
  function s(a, l) {
    a === void 0 && (a = !1), l === void 0 && (l = 1), i();
    const { left: u, top: c, width: f, height: d } = e.getBoundingClientRect();
    if ((a || t(), !f || !d)) return;
    const v = Fa(c),
      m = Fa(o.clientWidth - (u + f)),
      y = Fa(o.clientHeight - (c + d)),
      x = Fa(u),
      g = { rootMargin: -v + "px " + -m + "px " + -y + "px " + -x + "px", threshold: At(0, En(1, l)) || 1 };
    let w = !0;
    function S(C) {
      const E = C[0].intersectionRatio;
      if (E !== l) {
        if (!w) return s();
        E
          ? s(!1, E)
          : (r = setTimeout(() => {
              s(!1, 1e-7);
            }, 1e3));
      }
      w = !1;
    }
    try {
      n = new IntersectionObserver(S, F(T({}, g), { root: o.ownerDocument }));
    } catch (C) {
      n = new IntersectionObserver(S, g);
    }
    n.observe(e);
  }
  return s(!0), i;
}
function wN(e, t, n, r) {
  r === void 0 && (r = {});
  const {
      ancestorScroll: o = !0,
      ancestorResize: i = !0,
      elementResize: s = typeof ResizeObserver == "function",
      layoutShift: a = typeof IntersectionObserver == "function",
      animationFrame: l = !1,
    } = r,
    u = ch(e),
    c = o || i ? [...(u ? Ds(u) : []), ...Ds(t)] : [];
  c.forEach((p) => {
    o && p.addEventListener("scroll", n, { passive: !0 }), i && p.addEventListener("resize", n);
  });
  const f = u && a ? vN(u, n) : null;
  let d = -1,
    v = null;
  s &&
    ((v = new ResizeObserver((p) => {
      let [g] = p;
      g &&
        g.target === u &&
        v &&
        (v.unobserve(t),
        cancelAnimationFrame(d),
        (d = requestAnimationFrame(() => {
          var w;
          (w = v) == null || w.observe(t);
        }))),
        n();
    })),
    u && !l && v.observe(u),
    v.observe(t));
  let m,
    y = l ? po(e) : null;
  l && x();
  function x() {
    const p = po(e);
    y && (p.x !== y.x || p.y !== y.y || p.width !== y.width || p.height !== y.height) && n(),
      (y = p),
      (m = requestAnimationFrame(x));
  }
  return (
    n(),
    () => {
      var p;
      c.forEach((g) => {
        o && g.removeEventListener("scroll", n), i && g.removeEventListener("resize", n);
      }),
        f == null || f(),
        (p = v) == null || p.disconnect(),
        (v = null),
        l && cancelAnimationFrame(m);
    }
  );
}
const xN = JA,
  SN = ZA,
  EN = QA,
  CN = tN,
  bN = YA,
  py = GA,
  kN = eN,
  _N = (e, t, n) => {
    const r = new Map(),
      o = T({ platform: yN }, n),
      i = F(T({}, o.platform), { _c: r });
    return qA(e, t, F(T({}, o), { platform: i }));
  };
var fl = typeof document != "undefined" ? h.useLayoutEffect : h.useEffect;
function tu(e, t) {
  if (e === t) return !0;
  if (typeof e != typeof t) return !1;
  if (typeof e == "function" && e.toString() === t.toString()) return !0;
  let n, r, o;
  if (e && t && typeof e == "object") {
    if (Array.isArray(e)) {
      if (((n = e.length), n !== t.length)) return !1;
      for (r = n; r-- !== 0; ) if (!tu(e[r], t[r])) return !1;
      return !0;
    }
    if (((o = Object.keys(e)), (n = o.length), n !== Object.keys(t).length)) return !1;
    for (r = n; r-- !== 0; ) if (!{}.hasOwnProperty.call(t, o[r])) return !1;
    for (r = n; r-- !== 0; ) {
      const i = o[r];
      if (!(i === "_owner" && e.$$typeof) && !tu(e[i], t[i])) return !1;
    }
    return !0;
  }
  return e !== e && t !== t;
}
function o1(e) {
  return typeof window == "undefined" ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1;
}
function hy(e, t) {
  const n = o1(e);
  return Math.round(t * n) / n;
}
function my(e) {
  const t = h.useRef(e);
  return (
    fl(() => {
      t.current = e;
    }),
    t
  );
}
function TN(e) {
  e === void 0 && (e = {});
  const {
      placement: t = "bottom",
      strategy: n = "absolute",
      middleware: r = [],
      platform: o,
      elements: { reference: i, floating: s } = {},
      transform: a = !0,
      whileElementsMounted: l,
      open: u,
    } = e,
    [c, f] = h.useState({ x: 0, y: 0, strategy: n, placement: t, middlewareData: {}, isPositioned: !1 }),
    [d, v] = h.useState(r);
  tu(d, r) || v(r);
  const [m, y] = h.useState(null),
    [x, p] = h.useState(null),
    g = h.useCallback((W) => {
      W !== E.current && ((E.current = W), y(W));
    }, []),
    w = h.useCallback((W) => {
      W !== P.current && ((P.current = W), p(W));
    }, []),
    S = i || m,
    C = s || x,
    E = h.useRef(null),
    P = h.useRef(null),
    R = h.useRef(c),
    A = l != null,
    D = my(l),
    U = my(o),
    I = h.useCallback(() => {
      if (!E.current || !P.current) return;
      const W = { placement: t, strategy: n, middleware: d };
      U.current && (W.platform = U.current),
        _N(E.current, P.current, W).then((M) => {
          const $ = F(T({}, M), { isPositioned: !0 });
          Q.current &&
            !tu(R.current, $) &&
            ((R.current = $),
            go.flushSync(() => {
              f($);
            }));
        });
    }, [d, t, n, U]);
  fl(() => {
    u === !1 && R.current.isPositioned && ((R.current.isPositioned = !1), f((W) => F(T({}, W), { isPositioned: !1 })));
  }, [u]);
  const Q = h.useRef(!1);
  fl(
    () => (
      (Q.current = !0),
      () => {
        Q.current = !1;
      }
    ),
    []
  ),
    fl(() => {
      if ((S && (E.current = S), C && (P.current = C), S && C)) {
        if (D.current) return D.current(S, C, I);
        I();
      }
    }, [S, C, I, D, A]);
  const X = h.useMemo(() => ({ reference: E, floating: P, setReference: g, setFloating: w }), [g, w]),
    B = h.useMemo(() => ({ reference: S, floating: C }), [S, C]),
    te = h.useMemo(() => {
      const W = { position: n, left: 0, top: 0 };
      if (!B.floating) return W;
      const M = hy(B.floating, c.x),
        $ = hy(B.floating, c.y);
      return a
        ? T(
            F(T({}, W), { transform: "translate(" + M + "px, " + $ + "px)" }),
            o1(B.floating) >= 1.5 && { willChange: "transform" }
          )
        : { position: n, left: M, top: $ };
    }, [n, a, B.floating, c.x, c.y]);
  return h.useMemo(() => F(T({}, c), { update: I, refs: X, elements: B, floatingStyles: te }), [c, I, X, B, te]);
}
const RN = (e) => {
    function t(n) {
      return {}.hasOwnProperty.call(n, "current");
    }
    return {
      name: "arrow",
      options: e,
      fn(n) {
        const { element: r, padding: o } = typeof e == "function" ? e(n) : e;
        return r && t(r)
          ? r.current != null
            ? py({ element: r.current, padding: o }).fn(n)
            : {}
          : r
          ? py({ element: r, padding: o }).fn(n)
          : {};
      },
    };
  },
  PN = (e, t) => F(T({}, xN(e)), { options: [e, t] }),
  ON = (e, t) => F(T({}, SN(e)), { options: [e, t] }),
  AN = (e, t) => F(T({}, kN(e)), { options: [e, t] }),
  NN = (e, t) => F(T({}, EN(e)), { options: [e, t] }),
  LN = (e, t) => F(T({}, CN(e)), { options: [e, t] }),
  DN = (e, t) => F(T({}, bN(e)), { options: [e, t] }),
  MN = (e, t) => F(T({}, RN(e)), { options: [e, t] });
var jN = "Arrow",
  i1 = h.forwardRef((e, t) => {
    const s = e,
      { children: n, width: r = 10, height: o = 5 } = s,
      i = G(s, ["children", "width", "height"]);
    return k.jsx(
      Ve.svg,
      F(T({}, i), {
        ref: t,
        width: r,
        height: o,
        viewBox: "0 0 30 10",
        preserveAspectRatio: "none",
        children: e.asChild ? n : k.jsx("polygon", { points: "0,0 30,0 15,10" }),
      })
    );
  });
i1.displayName = jN;
var FN = i1;
function IN(e) {
  const [t, n] = h.useState(void 0);
  return (
    Tn(() => {
      if (e) {
        n({ width: e.offsetWidth, height: e.offsetHeight });
        const r = new ResizeObserver((o) => {
          if (!Array.isArray(o) || !o.length) return;
          const i = o[0];
          let s, a;
          if ("borderBoxSize" in i) {
            const l = i.borderBoxSize,
              u = Array.isArray(l) ? l[0] : l;
            (s = u.inlineSize), (a = u.blockSize);
          } else (s = e.offsetWidth), (a = e.offsetHeight);
          n({ width: s, height: a });
        });
        return r.observe(e, { box: "border-box" }), () => r.unobserve(e);
      } else n(void 0);
    }, [e]),
    t
  );
}
var fh = "Popper",
  [s1, $u] = Si(fh),
  [$N, a1] = s1(fh),
  l1 = (e) => {
    const { __scopePopper: t, children: n } = e,
      [r, o] = h.useState(null);
    return k.jsx($N, { scope: t, anchor: r, onAnchorChange: o, children: n });
  };
l1.displayName = fh;
var u1 = "PopperAnchor",
  c1 = h.forwardRef((e, t) => {
    const l = e,
      { __scopePopper: n, virtualRef: r } = l,
      o = G(l, ["__scopePopper", "virtualRef"]),
      i = a1(u1, n),
      s = h.useRef(null),
      a = Tt(t, s);
    return (
      h.useEffect(() => {
        i.onAnchorChange((r == null ? void 0 : r.current) || s.current);
      }),
      r ? null : k.jsx(Ve.div, F(T({}, o), { ref: a }))
    );
  });
c1.displayName = u1;
var dh = "PopperContent",
  [zN, UN] = s1(dh),
  f1 = h.forwardRef((e, t) => {
    var nr, vo, hn, Ur, ne, ce, Ae, ge;
    const Bt = e,
      {
        __scopePopper: n,
        side: r = "bottom",
        sideOffset: o = 0,
        align: i = "center",
        alignOffset: s = 0,
        arrowPadding: a = 0,
        avoidCollisions: l = !0,
        collisionBoundary: u = [],
        collisionPadding: c = 0,
        sticky: f = "partial",
        hideWhenDetached: d = !1,
        updatePositionStrategy: v = "optimized",
        onPlaced: m,
      } = Bt,
      y = G(Bt, [
        "__scopePopper",
        "side",
        "sideOffset",
        "align",
        "alignOffset",
        "arrowPadding",
        "avoidCollisions",
        "collisionBoundary",
        "collisionPadding",
        "sticky",
        "hideWhenDetached",
        "updatePositionStrategy",
        "onPlaced",
      ]),
      x = a1(dh, n),
      [p, g] = h.useState(null),
      w = Tt(t, (Ue) => g(Ue)),
      [S, C] = h.useState(null),
      E = IN(S),
      P = (nr = E == null ? void 0 : E.width) != null ? nr : 0,
      R = (vo = E == null ? void 0 : E.height) != null ? vo : 0,
      A = r + (i !== "center" ? "-" + i : ""),
      D = typeof c == "number" ? c : T({ top: 0, right: 0, bottom: 0, left: 0 }, c),
      U = Array.isArray(u) ? u : [u],
      I = U.length > 0,
      Q = { padding: D, boundary: U.filter(VN), altBoundary: I },
      {
        refs: X,
        floatingStyles: B,
        placement: te,
        isPositioned: W,
        middlewareData: M,
      } = TN({
        strategy: "fixed",
        placement: A,
        whileElementsMounted: (...Ue) => wN(...Ue, { animationFrame: v === "always" }),
        elements: { reference: x.anchor },
        middleware: [
          PN({ mainAxis: o + R, alignmentAxis: s }),
          l && ON(T({ mainAxis: !0, crossAxis: !1, limiter: f === "partial" ? AN() : void 0 }, Q)),
          l && NN(T({}, Q)),
          LN(
            F(T({}, Q), {
              apply: ({ elements: Ue, rects: Vt, availableWidth: et, availableHeight: He }) => {
                const { width: Wt, height: wo } = Vt.reference,
                  Nn = Ue.floating.style;
                Nn.setProperty("--radix-popper-available-width", `${et}px`),
                  Nn.setProperty("--radix-popper-available-height", `${He}px`),
                  Nn.setProperty("--radix-popper-anchor-width", `${Wt}px`),
                  Nn.setProperty("--radix-popper-anchor-height", `${wo}px`);
              },
            })
          ),
          S && MN({ element: S, padding: a }),
          WN({ arrowWidth: P, arrowHeight: R }),
          d && DN(T({ strategy: "referenceHidden" }, Q)),
        ],
      }),
      [$, H] = h1(te),
      q = $t(m);
    Tn(() => {
      W && (q == null || q());
    }, [W, q]);
    const oe = (hn = M.arrow) == null ? void 0 : hn.x,
      $e = (Ur = M.arrow) == null ? void 0 : Ur.y,
      Ee = ((ne = M.arrow) == null ? void 0 : ne.centerOffset) !== 0,
      [ze, We] = h.useState();
    return (
      Tn(() => {
        p && We(window.getComputedStyle(p).zIndex);
      }, [p]),
      k.jsx("div", {
        ref: X.setFloating,
        "data-radix-popper-content-wrapper": "",
        style: T(
          F(T({}, B), {
            transform: W ? B.transform : "translate(0, -200%)",
            minWidth: "max-content",
            zIndex: ze,
            "--radix-popper-transform-origin": [
              (ce = M.transformOrigin) == null ? void 0 : ce.x,
              (Ae = M.transformOrigin) == null ? void 0 : Ae.y,
            ].join(" "),
          }),
          ((ge = M.hide) == null ? void 0 : ge.referenceHidden) && { visibility: "hidden", pointerEvents: "none" }
        ),
        dir: e.dir,
        children: k.jsx(zN, {
          scope: n,
          placedSide: $,
          onArrowChange: C,
          arrowX: oe,
          arrowY: $e,
          shouldHideArrow: Ee,
          children: k.jsx(
            Ve.div,
            F(T({ "data-side": $, "data-align": H }, y), {
              ref: w,
              style: F(T({}, y.style), { animation: W ? void 0 : "none" }),
            })
          ),
        }),
      })
    );
  });
f1.displayName = dh;
var d1 = "PopperArrow",
  BN = { top: "bottom", right: "left", bottom: "top", left: "right" },
  p1 = h.forwardRef(function (t, n) {
    const a = t,
      { __scopePopper: r } = a,
      o = G(a, ["__scopePopper"]),
      i = UN(d1, r),
      s = BN[i.placedSide];
    return k.jsx("span", {
      ref: i.onArrowChange,
      style: {
        position: "absolute",
        left: i.arrowX,
        top: i.arrowY,
        [s]: 0,
        transformOrigin: { top: "", right: "0 0", bottom: "center 0", left: "100% 0" }[i.placedSide],
        transform: {
          top: "translateY(100%)",
          right: "translateY(50%) rotate(90deg) translateX(-50%)",
          bottom: "rotate(180deg)",
          left: "translateY(50%) rotate(-90deg) translateX(50%)",
        }[i.placedSide],
        visibility: i.shouldHideArrow ? "hidden" : void 0,
      },
      children: k.jsx(FN, F(T({}, o), { ref: n, style: F(T({}, o.style), { display: "block" }) })),
    });
  });
p1.displayName = d1;
function VN(e) {
  return e !== null;
}
var WN = (e) => ({
  name: "transformOrigin",
  options: e,
  fn(t) {
    var x, p, g, w, S;
    const { placement: n, rects: r, middlewareData: o } = t,
      s = ((x = o.arrow) == null ? void 0 : x.centerOffset) !== 0,
      a = s ? 0 : e.arrowWidth,
      l = s ? 0 : e.arrowHeight,
      [u, c] = h1(n),
      f = { start: "0%", center: "50%", end: "100%" }[c],
      d = ((g = (p = o.arrow) == null ? void 0 : p.x) != null ? g : 0) + a / 2,
      v = ((S = (w = o.arrow) == null ? void 0 : w.y) != null ? S : 0) + l / 2;
    let m = "",
      y = "";
    return (
      u === "bottom"
        ? ((m = s ? f : `${d}px`), (y = `${-l}px`))
        : u === "top"
        ? ((m = s ? f : `${d}px`), (y = `${r.floating.height + l}px`))
        : u === "right"
        ? ((m = `${-l}px`), (y = s ? f : `${v}px`))
        : u === "left" && ((m = `${r.floating.width + l}px`), (y = s ? f : `${v}px`)),
      { data: { x: m, y } }
    );
  },
});
function h1(e) {
  const [t, n = "center"] = e.split("-");
  return [t, n];
}
var m1 = l1,
  ph = c1,
  g1 = f1,
  y1 = p1,
  HN = "Portal",
  hh = h.forwardRef((e, t) => {
    var l;
    const a = e,
      { container: n } = a,
      r = G(a, ["container"]),
      [o, i] = h.useState(!1);
    Tn(() => i(!0), []);
    const s = n || (o && ((l = globalThis == null ? void 0 : globalThis.document) == null ? void 0 : l.body));
    return s ? Z0.createPortal(k.jsx(Ve.div, F(T({}, r), { ref: t })), s) : null;
  });
hh.displayName = HN;
function KN(e, t) {
  return h.useReducer((n, r) => {
    const o = t[n][r];
    return o != null ? o : n;
  }, e);
}
var Qs = (e) => {
  const { present: t, children: n } = e,
    r = qN(t),
    o = typeof n == "function" ? n({ present: r.isPresent }) : h.Children.only(n),
    i = Tt(r.ref, GN(o));
  return typeof n == "function" || r.isPresent ? h.cloneElement(o, { ref: i }) : null;
};
Qs.displayName = "Presence";
function qN(e) {
  const [t, n] = h.useState(),
    r = h.useRef({}),
    o = h.useRef(e),
    i = h.useRef("none"),
    s = e ? "mounted" : "unmounted",
    [a, l] = KN(s, {
      mounted: { UNMOUNT: "unmounted", ANIMATION_OUT: "unmountSuspended" },
      unmountSuspended: { MOUNT: "mounted", ANIMATION_END: "unmounted" },
      unmounted: { MOUNT: "mounted" },
    });
  return (
    h.useEffect(() => {
      const u = Ia(r.current);
      i.current = a === "mounted" ? u : "none";
    }, [a]),
    Tn(() => {
      const u = r.current,
        c = o.current;
      if (c !== e) {
        const d = i.current,
          v = Ia(u);
        e
          ? l("MOUNT")
          : v === "none" || (u == null ? void 0 : u.display) === "none"
          ? l("UNMOUNT")
          : l(c && d !== v ? "ANIMATION_OUT" : "UNMOUNT"),
          (o.current = e);
      }
    }, [e, l]),
    Tn(() => {
      if (t) {
        const u = (f) => {
            const v = Ia(r.current).includes(f.animationName);
            f.target === t && v && go.flushSync(() => l("ANIMATION_END"));
          },
          c = (f) => {
            f.target === t && (i.current = Ia(r.current));
          };
        return (
          t.addEventListener("animationstart", c),
          t.addEventListener("animationcancel", u),
          t.addEventListener("animationend", u),
          () => {
            t.removeEventListener("animationstart", c),
              t.removeEventListener("animationcancel", u),
              t.removeEventListener("animationend", u);
          }
        );
      } else l("ANIMATION_END");
    }, [t, l]),
    {
      isPresent: ["mounted", "unmountSuspended"].includes(a),
      ref: h.useCallback((u) => {
        u && (r.current = getComputedStyle(u)), n(u);
      }, []),
    }
  );
}
function Ia(e) {
  return (e == null ? void 0 : e.animationName) || "none";
}
function GN(e) {
  var r, o;
  let t = (r = Object.getOwnPropertyDescriptor(e.props, "ref")) == null ? void 0 : r.get,
    n = t && "isReactWarning" in t && t.isReactWarning;
  return n
    ? e.ref
    : ((t = (o = Object.getOwnPropertyDescriptor(e, "ref")) == null ? void 0 : o.get),
      (n = t && "isReactWarning" in t && t.isReactWarning),
      n ? e.props.ref : e.props.ref || e.ref);
}
function mh({ prop: e, defaultProp: t, onChange: n = () => {} }) {
  const [r, o] = QN({ defaultProp: t, onChange: n }),
    i = e !== void 0,
    s = i ? e : r,
    a = $t(n),
    l = h.useCallback(
      (u) => {
        if (i) {
          const f = typeof u == "function" ? u(e) : u;
          f !== e && a(f);
        } else o(u);
      },
      [i, e, o, a]
    );
  return [s, l];
}
function QN({ defaultProp: e, onChange: t }) {
  const n = h.useState(e),
    [r] = n,
    o = h.useRef(r),
    i = $t(t);
  return (
    h.useEffect(() => {
      o.current !== r && (i(r), (o.current = r));
    }, [r, o, i]),
    n
  );
}
var YN = "VisuallyHidden",
  zu = h.forwardRef((e, t) =>
    k.jsx(
      Ve.span,
      F(T({}, e), {
        ref: t,
        style: T(
          {
            position: "absolute",
            border: 0,
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            wordWrap: "normal",
          },
          e.style
        ),
      })
    )
  );
zu.displayName = YN;
var XN = zu,
  [Uu, FM] = Si("Tooltip", [$u]),
  Bu = $u(),
  v1 = "TooltipProvider",
  JN = 700,
  Rd = "tooltip.open",
  [ZN, gh] = Uu(v1),
  w1 = (e) => {
    const {
        __scopeTooltip: t,
        delayDuration: n = JN,
        skipDelayDuration: r = 300,
        disableHoverableContent: o = !1,
        children: i,
      } = e,
      [s, a] = h.useState(!0),
      l = h.useRef(!1),
      u = h.useRef(0);
    return (
      h.useEffect(() => {
        const c = u.current;
        return () => window.clearTimeout(c);
      }, []),
      k.jsx(ZN, {
        scope: t,
        isOpenDelayed: s,
        delayDuration: n,
        onOpen: h.useCallback(() => {
          window.clearTimeout(u.current), a(!1);
        }, []),
        onClose: h.useCallback(() => {
          window.clearTimeout(u.current), (u.current = window.setTimeout(() => a(!0), r));
        }, [r]),
        isPointerInTransitRef: l,
        onPointerInTransitChange: h.useCallback((c) => {
          l.current = c;
        }, []),
        disableHoverableContent: o,
        children: i,
      })
    );
  };
w1.displayName = v1;
var Vu = "Tooltip",
  [eL, Wu] = Uu(Vu),
  x1 = (e) => {
    const {
        __scopeTooltip: t,
        children: n,
        open: r,
        defaultOpen: o = !1,
        onOpenChange: i,
        disableHoverableContent: s,
        delayDuration: a,
      } = e,
      l = gh(Vu, e.__scopeTooltip),
      u = Bu(t),
      [c, f] = h.useState(null),
      d = Qx(),
      v = h.useRef(0),
      m = s != null ? s : l.disableHoverableContent,
      y = a != null ? a : l.delayDuration,
      x = h.useRef(!1),
      [p = !1, g] = mh({
        prop: r,
        defaultProp: o,
        onChange: (P) => {
          P ? (l.onOpen(), document.dispatchEvent(new CustomEvent(Rd))) : l.onClose(), i == null || i(P);
        },
      }),
      w = h.useMemo(() => (p ? (x.current ? "delayed-open" : "instant-open") : "closed"), [p]),
      S = h.useCallback(() => {
        window.clearTimeout(v.current), (x.current = !1), g(!0);
      }, [g]),
      C = h.useCallback(() => {
        window.clearTimeout(v.current), g(!1);
      }, [g]),
      E = h.useCallback(() => {
        window.clearTimeout(v.current),
          (v.current = window.setTimeout(() => {
            (x.current = !0), g(!0);
          }, y));
      }, [y, g]);
    return (
      h.useEffect(() => () => window.clearTimeout(v.current), []),
      k.jsx(
        m1,
        F(T({}, u), {
          children: k.jsx(eL, {
            scope: t,
            contentId: d,
            open: p,
            stateAttribute: w,
            trigger: c,
            onTriggerChange: f,
            onTriggerEnter: h.useCallback(() => {
              l.isOpenDelayed ? E() : S();
            }, [l.isOpenDelayed, E, S]),
            onTriggerLeave: h.useCallback(() => {
              m ? C() : window.clearTimeout(v.current);
            }, [C, m]),
            onOpen: S,
            onClose: C,
            disableHoverableContent: m,
            children: n,
          }),
        })
      )
    );
  };
x1.displayName = Vu;
var Pd = "TooltipTrigger",
  S1 = h.forwardRef((e, t) => {
    const d = e,
      { __scopeTooltip: n } = d,
      r = G(d, ["__scopeTooltip"]),
      o = Wu(Pd, n),
      i = gh(Pd, n),
      s = Bu(n),
      a = h.useRef(null),
      l = Tt(t, a, o.onTriggerChange),
      u = h.useRef(!1),
      c = h.useRef(!1),
      f = h.useCallback(() => (u.current = !1), []);
    return (
      h.useEffect(() => () => document.removeEventListener("pointerup", f), [f]),
      k.jsx(
        ph,
        F(T({ asChild: !0 }, s), {
          children: k.jsx(
            Ve.button,
            F(T({ "aria-describedby": o.open ? o.contentId : void 0, "data-state": o.stateAttribute }, r), {
              ref: l,
              onPointerMove: Oe(e.onPointerMove, (v) => {
                v.pointerType !== "touch" &&
                  !c.current &&
                  !i.isPointerInTransitRef.current &&
                  (o.onTriggerEnter(), (c.current = !0));
              }),
              onPointerLeave: Oe(e.onPointerLeave, () => {
                o.onTriggerLeave(), (c.current = !1);
              }),
              onPointerDown: Oe(e.onPointerDown, () => {
                (u.current = !0), document.addEventListener("pointerup", f, { once: !0 });
              }),
              onFocus: Oe(e.onFocus, () => {
                u.current || o.onOpen();
              }),
              onBlur: Oe(e.onBlur, o.onClose),
              onClick: Oe(e.onClick, o.onClose),
            })
          ),
        })
      )
    );
  });
S1.displayName = Pd;
var tL = "TooltipPortal",
  [IM, nL] = Uu(tL, { forceMount: void 0 }),
  fi = "TooltipContent",
  E1 = h.forwardRef((e, t) => {
    const n = nL(fi, e.__scopeTooltip),
      a = e,
      { forceMount: r = n.forceMount, side: o = "top" } = a,
      i = G(a, ["forceMount", "side"]),
      s = Wu(fi, e.__scopeTooltip);
    return k.jsx(Qs, {
      present: r || s.open,
      children: s.disableHoverableContent
        ? k.jsx(C1, F(T({ side: o }, i), { ref: t }))
        : k.jsx(rL, F(T({ side: o }, i), { ref: t })),
    });
  }),
  rL = h.forwardRef((e, t) => {
    const n = Wu(fi, e.__scopeTooltip),
      r = gh(fi, e.__scopeTooltip),
      o = h.useRef(null),
      i = Tt(t, o),
      [s, a] = h.useState(null),
      { trigger: l, onClose: u } = n,
      c = o.current,
      { onPointerInTransitChange: f } = r,
      d = h.useCallback(() => {
        a(null), f(!1);
      }, [f]),
      v = h.useCallback(
        (m, y) => {
          const x = m.currentTarget,
            p = { x: m.clientX, y: m.clientY },
            g = aL(p, x.getBoundingClientRect()),
            w = lL(p, g),
            S = uL(y.getBoundingClientRect()),
            C = fL([...w, ...S]);
          a(C), f(!0);
        },
        [f]
      );
    return (
      h.useEffect(() => () => d(), [d]),
      h.useEffect(() => {
        if (l && c) {
          const m = (x) => v(x, c),
            y = (x) => v(x, l);
          return (
            l.addEventListener("pointerleave", m),
            c.addEventListener("pointerleave", y),
            () => {
              l.removeEventListener("pointerleave", m), c.removeEventListener("pointerleave", y);
            }
          );
        }
      }, [l, c, v, d]),
      h.useEffect(() => {
        if (s) {
          const m = (y) => {
            const x = y.target,
              p = { x: y.clientX, y: y.clientY },
              g = (l == null ? void 0 : l.contains(x)) || (c == null ? void 0 : c.contains(x)),
              w = !cL(p, s);
            g ? d() : w && (d(), u());
          };
          return document.addEventListener("pointermove", m), () => document.removeEventListener("pointermove", m);
        }
      }, [l, c, s, u, d]),
      k.jsx(C1, F(T({}, e), { ref: i }))
    );
  }),
  [oL, iL] = Uu(Vu, { isInside: !1 }),
  C1 = h.forwardRef((e, t) => {
    const f = e,
      { __scopeTooltip: n, children: r, "aria-label": o, onEscapeKeyDown: i, onPointerDownOutside: s } = f,
      a = G(f, ["__scopeTooltip", "children", "aria-label", "onEscapeKeyDown", "onPointerDownOutside"]),
      l = Wu(fi, n),
      u = Bu(n),
      { onClose: c } = l;
    return (
      h.useEffect(() => (document.addEventListener(Rd, c), () => document.removeEventListener(Rd, c)), [c]),
      h.useEffect(() => {
        if (l.trigger) {
          const d = (v) => {
            const m = v.target;
            m != null && m.contains(l.trigger) && c();
          };
          return (
            window.addEventListener("scroll", d, { capture: !0 }),
            () => window.removeEventListener("scroll", d, { capture: !0 })
          );
        }
      }, [l.trigger, c]),
      k.jsx(ju, {
        asChild: !0,
        disableOutsidePointerEvents: !1,
        onEscapeKeyDown: i,
        onPointerDownOutside: s,
        onFocusOutside: (d) => d.preventDefault(),
        onDismiss: c,
        children: k.jsxs(
          g1,
          F(T(T({ "data-state": l.stateAttribute }, u), a), {
            ref: t,
            style: F(T({}, a.style), {
              "--radix-tooltip-content-transform-origin": "var(--radix-popper-transform-origin)",
              "--radix-tooltip-content-available-width": "var(--radix-popper-available-width)",
              "--radix-tooltip-content-available-height": "var(--radix-popper-available-height)",
              "--radix-tooltip-trigger-width": "var(--radix-popper-anchor-width)",
              "--radix-tooltip-trigger-height": "var(--radix-popper-anchor-height)",
            }),
            children: [
              k.jsx(Wx, { children: r }),
              k.jsx(oL, {
                scope: n,
                isInside: !0,
                children: k.jsx(XN, { id: l.contentId, role: "tooltip", children: o || r }),
              }),
            ],
          })
        ),
      })
    );
  });
E1.displayName = fi;
var b1 = "TooltipArrow",
  sL = h.forwardRef((e, t) => {
    const s = e,
      { __scopeTooltip: n } = s,
      r = G(s, ["__scopeTooltip"]),
      o = Bu(n);
    return iL(b1, n).isInside ? null : k.jsx(y1, F(T(T({}, o), r), { ref: t }));
  });
sL.displayName = b1;
function aL(e, t) {
  const n = Math.abs(t.top - e.y),
    r = Math.abs(t.bottom - e.y),
    o = Math.abs(t.right - e.x),
    i = Math.abs(t.left - e.x);
  switch (Math.min(n, r, o, i)) {
    case i:
      return "left";
    case o:
      return "right";
    case n:
      return "top";
    case r:
      return "bottom";
    default:
      throw new Error("unreachable");
  }
}
function lL(e, t, n = 5) {
  const r = [];
  switch (t) {
    case "top":
      r.push({ x: e.x - n, y: e.y + n }, { x: e.x + n, y: e.y + n });
      break;
    case "bottom":
      r.push({ x: e.x - n, y: e.y - n }, { x: e.x + n, y: e.y - n });
      break;
    case "left":
      r.push({ x: e.x + n, y: e.y - n }, { x: e.x + n, y: e.y + n });
      break;
    case "right":
      r.push({ x: e.x - n, y: e.y - n }, { x: e.x - n, y: e.y + n });
      break;
  }
  return r;
}
function uL(e) {
  const { top: t, right: n, bottom: r, left: o } = e;
  return [
    { x: o, y: t },
    { x: n, y: t },
    { x: n, y: r },
    { x: o, y: r },
  ];
}
function cL(e, t) {
  const { x: n, y: r } = e;
  let o = !1;
  for (let i = 0, s = t.length - 1; i < t.length; s = i++) {
    const a = t[i].x,
      l = t[i].y,
      u = t[s].x,
      c = t[s].y;
    l > r != c > r && n < ((u - a) * (r - l)) / (c - l) + a && (o = !o);
  }
  return o;
}
function fL(e) {
  const t = e.slice();
  return t.sort((n, r) => (n.x < r.x ? -1 : n.x > r.x ? 1 : n.y < r.y ? -1 : n.y > r.y ? 1 : 0)), dL(t);
}
function dL(e) {
  if (e.length <= 1) return e.slice();
  const t = [];
  for (let r = 0; r < e.length; r++) {
    const o = e[r];
    for (; t.length >= 2; ) {
      const i = t[t.length - 1],
        s = t[t.length - 2];
      if ((i.x - s.x) * (o.y - s.y) >= (i.y - s.y) * (o.x - s.x)) t.pop();
      else break;
    }
    t.push(o);
  }
  t.pop();
  const n = [];
  for (let r = e.length - 1; r >= 0; r--) {
    const o = e[r];
    for (; n.length >= 2; ) {
      const i = n[n.length - 1],
        s = n[n.length - 2];
      if ((i.x - s.x) * (o.y - s.y) >= (i.y - s.y) * (o.x - s.x)) n.pop();
      else break;
    }
    n.push(o);
  }
  return n.pop(), t.length === 1 && n.length === 1 && t[0].x === n[0].x && t[0].y === n[0].y ? t : t.concat(n);
}
var pL = w1,
  hL = x1,
  mL = S1,
  k1 = E1;
const gL = pL,
  $M = hL,
  zM = mL,
  yL = h.forwardRef((o, r) => {
    var i = o,
      { className: e, sideOffset: t = 4 } = i,
      n = G(i, ["className", "sideOffset"]);
    return k.jsx(
      k1,
      T(
        {
          ref: r,
          sideOffset: t,
          className: De(
            "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            e
          ),
        },
        n
      )
    );
  });
yL.displayName = k1.displayName;
const vL = "modulepreload",
  wL = function (e) {
    return "/assets/timesheet_enhancer/timesheet/" + e;
  },
  gy = {},
  Hu = function (t, n, r) {
    let o = Promise.resolve();
    if (n && n.length > 0) {
      document.getElementsByTagName("link");
      const i = document.querySelector("meta[property=csp-nonce]"),
        s = (i == null ? void 0 : i.nonce) || (i == null ? void 0 : i.getAttribute("nonce"));
      o = Promise.all(
        n.map((a) => {
          if (((a = wL(a)), a in gy)) return;
          gy[a] = !0;
          const l = a.endsWith(".css"),
            u = l ? '[rel="stylesheet"]' : "";
          if (document.querySelector(`link[href="${a}"]${u}`)) return;
          const c = document.createElement("link");
          if (
            ((c.rel = l ? "stylesheet" : vL),
            l || ((c.as = "script"), (c.crossOrigin = "")),
            (c.href = a),
            s && c.setAttribute("nonce", s),
            document.head.appendChild(c),
            l)
          )
            return new Promise((f, d) => {
              c.addEventListener("load", f),
                c.addEventListener("error", () => d(new Error(`Unable to preload CSS for ${a}`)));
            });
        })
      );
    }
    return o
      .then(() => t())
      .catch((i) => {
        const s = new Event("vite:preloadError", { cancelable: !0 });
        if (((s.payload = i), window.dispatchEvent(s), !s.defaultPrevented)) throw i;
      });
  },
  xL = { h1: "h1", h2: "h2", h3: "h3", h4: "h4", h5: "h5", h6: "h6", p: "p", large: "p", muted: "p", small: "span" },
  SL = {
    h1: "text-3xl font-bold ",
    h2: "text-2xl font-bold",
    h3: "text-xl font-bold ",
    h4: "text-lg font-bold ",
    h5: "text-md font-bold",
    h6: "text-base font-bold ",
    p: "text-sm font-normal",
    large: "text-lg sm:text-md font-bold",
    muted: "text-muted-foreground text-sm font-normal",
    small: "text-xs font-normal",
  },
  nu = ({ variant: e, children: t, className: n = "", as: r }) => {
    const o = SL[e],
      i = r || xL[e];
    return k.jsx(i, { className: De("text-primary", o, n), children: t });
  };
/**
 * @license lucide-react v0.408.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const EL = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(),
  _1 = (...e) => e.filter((t, n, r) => !!t && r.indexOf(t) === n).join(" ");
/**
 * @license lucide-react v0.408.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var CL = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};
/**
 * @license lucide-react v0.408.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const bL = h.forwardRef((u, l) => {
  var c = u,
    {
      color: e = "currentColor",
      size: t = 24,
      strokeWidth: n = 2,
      absoluteStrokeWidth: r,
      className: o = "",
      children: i,
      iconNode: s,
    } = c,
    a = G(c, ["color", "size", "strokeWidth", "absoluteStrokeWidth", "className", "children", "iconNode"]);
  return h.createElement(
    "svg",
    T(
      F(T({ ref: l }, CL), {
        width: t,
        height: t,
        stroke: e,
        strokeWidth: r ? (Number(n) * 24) / Number(t) : n,
        className: _1("lucide", o),
      }),
      a
    ),
    [...s.map(([f, d]) => h.createElement(f, d)), ...(Array.isArray(i) ? i : [i])]
  );
});
/**
 * @license lucide-react v0.408.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const yo = (e, t) => {
  const n = h.forwardRef((s, i) => {
    var a = s,
      { className: r } = a,
      o = G(a, ["className"]);
    return h.createElement(bL, T({ ref: i, iconNode: t, className: _1(`lucide-${EL(e)}`, r) }, o));
  });
  return (n.displayName = `${e}`), n;
};
/**
 * @license lucide-react v0.408.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const kL = yo("ArrowLeftToLine", [
  ["path", { d: "M3 19V5", key: "rwsyhb" }],
  ["path", { d: "m13 6-6 6 6 6", key: "1yhaz7" }],
  ["path", { d: "M7 12h14", key: "uoisry" }],
]);
/**
 * @license lucide-react v0.408.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const _L = yo("ArrowRightLeft", [
  ["path", { d: "m16 3 4 4-4 4", key: "1x1c3m" }],
  ["path", { d: "M20 7H4", key: "zbl0bi" }],
  ["path", { d: "m8 21-4-4 4-4", key: "h9nckh" }],
  ["path", { d: "M4 17h16", key: "g4d7ey" }],
]);
/**
 * @license lucide-react v0.408.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const TL = yo("Clock3", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["polyline", { points: "12 6 12 12 16.5 12", key: "1aq6pp" }],
]);
/**
 * @license lucide-react v0.408.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const RL = yo("House", [
  ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", key: "5wwlr5" }],
  [
    "path",
    {
      d: "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
      key: "1d0kgt",
    },
  ],
]);
/**
 * @license lucide-react v0.408.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const PL = yo("LogOut", [
  ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "1uf3rs" }],
  ["polyline", { points: "16 17 21 12 16 7", key: "1gabdz" }],
  ["line", { x1: "21", x2: "9", y1: "12", y2: "12", key: "1uyos4" }],
]);
/**
 * @license lucide-react v0.408.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const OL = yo("Users", [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
  ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75", key: "1da9ce" }],
]);
/**
 * @license lucide-react v0.408.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const AL = yo("X", [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }],
]);
function T1(e) {
  var t,
    n,
    r = "";
  if (typeof e == "string" || typeof e == "number") r += e;
  else if (typeof e == "object")
    if (Array.isArray(e)) for (t = 0; t < e.length; t++) e[t] && (n = T1(e[t])) && (r && (r += " "), (r += n));
    else for (t in e) e[t] && (r && (r += " "), (r += t));
  return r;
}
function NL() {
  for (var e, t, n = 0, r = ""; n < arguments.length; )
    (e = arguments[n++]) && (t = T1(e)) && (r && (r += " "), (r += t));
  return r;
}
const yy = (e) => (typeof e == "boolean" ? "".concat(e) : e === 0 ? "0" : e),
  vy = NL,
  R1 = (e, t) => (n) => {
    var r;
    if ((t == null ? void 0 : t.variants) == null)
      return vy(e, n == null ? void 0 : n.class, n == null ? void 0 : n.className);
    const { variants: o, defaultVariants: i } = t,
      s = Object.keys(o).map((u) => {
        const c = n == null ? void 0 : n[u],
          f = i == null ? void 0 : i[u];
        if (c === null) return null;
        const d = yy(c) || yy(f);
        return o[u][d];
      }),
      a =
        n &&
        Object.entries(n).reduce((u, c) => {
          let [f, d] = c;
          return d === void 0 || (u[f] = d), u;
        }, {}),
      l =
        t == null || (r = t.compoundVariants) === null || r === void 0
          ? void 0
          : r.reduce((u, c) => {
              let m = c,
                { class: f, className: d } = m,
                v = G(m, ["class", "className"]);
              return Object.entries(v).every((y) => {
                let [x, p] = y;
                return Array.isArray(p) ? p.includes(T(T({}, i), a)[x]) : T(T({}, i), a)[x] === p;
              })
                ? [...u, f, d]
                : u;
            }, []);
    return vy(e, s, l, n == null ? void 0 : n.class, n == null ? void 0 : n.className);
  },
  LL = R1(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground hover:bg-primary/90",
          destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          success: "bg-success text-success-foreground hover:bg-success/90",
          warning: "bg-warning text-warning-foreground hover:bg-warning/90",
          outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
          secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          ghost: "hover:bg-accent hover:text-accent-foreground",
          link: "text-primary underline-offset-4 hover:underline",
        },
        size: { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", lg: "h-11 rounded-md px-8", icon: "h-10 w-10" },
      },
      defaultVariants: { variant: "default", size: "default" },
    }
  ),
  yh = h.forwardRef((s, i) => {
    var a = s,
      { className: e, variant: t, size: n, asChild: r = !1 } = a,
      o = G(a, ["className", "variant", "size", "asChild"]);
    const l = r ? ui : "button";
    return k.jsx(l, T({ className: De(LL({ variant: t, size: n, className: e })), ref: i }, o));
  });
yh.displayName = "Button";
const DL = 1,
  ML = 1e6;
let Wc = 0;
function jL() {
  return (Wc = (Wc + 1) % Number.MAX_SAFE_INTEGER), Wc.toString();
}
const Hc = new Map(),
  wy = (e) => {
    if (Hc.has(e)) return;
    const t = setTimeout(() => {
      Hc.delete(e), as({ type: "REMOVE_TOAST", toastId: e });
    }, ML);
    Hc.set(e, t);
  },
  FL = (e, t) => {
    switch (t.type) {
      case "ADD_TOAST":
        return F(T({}, e), { toasts: [t.toast, ...e.toasts].slice(0, DL) });
      case "UPDATE_TOAST":
        return F(T({}, e), { toasts: e.toasts.map((n) => (n.id === t.toast.id ? T(T({}, n), t.toast) : n)) });
      case "DISMISS_TOAST": {
        const { toastId: n } = t;
        return (
          n
            ? wy(n)
            : e.toasts.forEach((r) => {
                wy(r.id);
              }),
          F(T({}, e), { toasts: e.toasts.map((r) => (r.id === n || n === void 0 ? F(T({}, r), { open: !1 }) : r)) })
        );
      }
      case "REMOVE_TOAST":
        return t.toastId === void 0
          ? F(T({}, e), { toasts: [] })
          : F(T({}, e), { toasts: e.toasts.filter((n) => n.id !== t.toastId) });
    }
  },
  dl = [];
let pl = { toasts: [] };
function as(e) {
  (pl = FL(pl, e)),
    dl.forEach((t) => {
      t(pl);
    });
}
function IL(t) {
  var e = G(t, []);
  const n = jL(),
    r = (i) => as({ type: "UPDATE_TOAST", toast: F(T({}, i), { id: n }) }),
    o = () => as({ type: "DISMISS_TOAST", toastId: n });
  return (
    as({
      type: "ADD_TOAST",
      toast: F(T({}, e), {
        id: n,
        open: !0,
        onOpenChange: (i) => {
          i || o();
        },
      }),
    }),
    { id: n, dismiss: o, update: r }
  );
}
function vh() {
  const [e, t] = h.useState(pl);
  return (
    h.useEffect(
      () => (
        dl.push(t),
        () => {
          const n = dl.indexOf(t);
          n > -1 && dl.splice(n, 1);
        }
      ),
      [e]
    ),
    F(T({}, e), { toast: IL, dismiss: (n) => as({ type: "DISMISS_TOAST", toastId: n }) })
  );
}
var Kc = 0;
function $L() {
  h.useEffect(() => {
    var t, n;
    const e = document.querySelectorAll("[data-radix-focus-guard]");
    return (
      document.body.insertAdjacentElement("afterbegin", (t = e[0]) != null ? t : xy()),
      document.body.insertAdjacentElement("beforeend", (n = e[1]) != null ? n : xy()),
      Kc++,
      () => {
        Kc === 1 && document.querySelectorAll("[data-radix-focus-guard]").forEach((r) => r.remove()), Kc--;
      }
    );
  }, []);
}
function xy() {
  const e = document.createElement("span");
  return (
    e.setAttribute("data-radix-focus-guard", ""),
    (e.tabIndex = 0),
    (e.style.cssText = "outline: none; opacity: 0; position: fixed; pointer-events: none"),
    e
  );
}
var qc = "focusScope.autoFocusOnMount",
  Gc = "focusScope.autoFocusOnUnmount",
  Sy = { bubbles: !1, cancelable: !0 },
  zL = "FocusScope",
  P1 = h.forwardRef((e, t) => {
    const y = e,
      { loop: n = !1, trapped: r = !1, onMountAutoFocus: o, onUnmountAutoFocus: i } = y,
      s = G(y, ["loop", "trapped", "onMountAutoFocus", "onUnmountAutoFocus"]),
      [a, l] = h.useState(null),
      u = $t(o),
      c = $t(i),
      f = h.useRef(null),
      d = Tt(t, (x) => l(x)),
      v = h.useRef({
        paused: !1,
        pause() {
          this.paused = !0;
        },
        resume() {
          this.paused = !1;
        },
      }).current;
    h.useEffect(() => {
      if (r) {
        let x = function (S) {
            if (v.paused || !a) return;
            const C = S.target;
            a.contains(C) ? (f.current = C) : fr(f.current, { select: !0 });
          },
          p = function (S) {
            if (v.paused || !a) return;
            const C = S.relatedTarget;
            C !== null && (a.contains(C) || fr(f.current, { select: !0 }));
          },
          g = function (S) {
            if (document.activeElement === document.body) for (const E of S) E.removedNodes.length > 0 && fr(a);
          };
        document.addEventListener("focusin", x), document.addEventListener("focusout", p);
        const w = new MutationObserver(g);
        return (
          a && w.observe(a, { childList: !0, subtree: !0 }),
          () => {
            document.removeEventListener("focusin", x), document.removeEventListener("focusout", p), w.disconnect();
          }
        );
      }
    }, [r, a, v.paused]),
      h.useEffect(() => {
        if (a) {
          Cy.add(v);
          const x = document.activeElement;
          if (!a.contains(x)) {
            const g = new CustomEvent(qc, Sy);
            a.addEventListener(qc, u),
              a.dispatchEvent(g),
              g.defaultPrevented || (UL(KL(O1(a)), { select: !0 }), document.activeElement === x && fr(a));
          }
          return () => {
            a.removeEventListener(qc, u),
              setTimeout(() => {
                const g = new CustomEvent(Gc, Sy);
                a.addEventListener(Gc, c),
                  a.dispatchEvent(g),
                  g.defaultPrevented || fr(x != null ? x : document.body, { select: !0 }),
                  a.removeEventListener(Gc, c),
                  Cy.remove(v);
              }, 0);
          };
        }
      }, [a, u, c, v]);
    const m = h.useCallback(
      (x) => {
        if ((!n && !r) || v.paused) return;
        const p = x.key === "Tab" && !x.altKey && !x.ctrlKey && !x.metaKey,
          g = document.activeElement;
        if (p && g) {
          const w = x.currentTarget,
            [S, C] = BL(w);
          S && C
            ? !x.shiftKey && g === C
              ? (x.preventDefault(), n && fr(S, { select: !0 }))
              : x.shiftKey && g === S && (x.preventDefault(), n && fr(C, { select: !0 }))
            : g === w && x.preventDefault();
        }
      },
      [n, r, v.paused]
    );
    return k.jsx(Ve.div, F(T({ tabIndex: -1 }, s), { ref: d, onKeyDown: m }));
  });
P1.displayName = zL;
function UL(e, { select: t = !1 } = {}) {
  const n = document.activeElement;
  for (const r of e) if ((fr(r, { select: t }), document.activeElement !== n)) return;
}
function BL(e) {
  const t = O1(e),
    n = Ey(t, e),
    r = Ey(t.reverse(), e);
  return [n, r];
}
function O1(e) {
  const t = [],
    n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (r) => {
        const o = r.tagName === "INPUT" && r.type === "hidden";
        return r.disabled || r.hidden || o
          ? NodeFilter.FILTER_SKIP
          : r.tabIndex >= 0
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      },
    });
  for (; n.nextNode(); ) t.push(n.currentNode);
  return t;
}
function Ey(e, t) {
  for (const n of e) if (!VL(n, { upTo: t })) return n;
}
function VL(e, { upTo: t }) {
  if (getComputedStyle(e).visibility === "hidden") return !0;
  for (; e; ) {
    if (t !== void 0 && e === t) return !1;
    if (getComputedStyle(e).display === "none") return !0;
    e = e.parentElement;
  }
  return !1;
}
function WL(e) {
  return e instanceof HTMLInputElement && "select" in e;
}
function fr(e, { select: t = !1 } = {}) {
  if (e && e.focus) {
    const n = document.activeElement;
    e.focus({ preventScroll: !0 }), e !== n && WL(e) && t && e.select();
  }
}
var Cy = HL();
function HL() {
  let e = [];
  return {
    add(t) {
      const n = e[0];
      t !== n && (n == null || n.pause()), (e = by(e, t)), e.unshift(t);
    },
    remove(t) {
      var n;
      (e = by(e, t)), (n = e[0]) == null || n.resume();
    },
  };
}
function by(e, t) {
  const n = [...e],
    r = n.indexOf(t);
  return r !== -1 && n.splice(r, 1), n;
}
function KL(e) {
  return e.filter((t) => t.tagName !== "A");
}
var qL = function (e) {
    if (typeof document == "undefined") return null;
    var t = Array.isArray(e) ? e[0] : e;
    return t.ownerDocument.body;
  },
  _o = new WeakMap(),
  $a = new WeakMap(),
  za = {},
  Qc = 0,
  A1 = function (e) {
    return e && (e.host || A1(e.parentNode));
  },
  GL = function (e, t) {
    return t
      .map(function (n) {
        if (e.contains(n)) return n;
        var r = A1(n);
        return r && e.contains(r)
          ? r
          : (console.error("aria-hidden", n, "in not contained inside", e, ". Doing nothing"), null);
      })
      .filter(function (n) {
        return !!n;
      });
  },
  QL = function (e, t, n, r) {
    var o = GL(t, Array.isArray(e) ? e : [e]);
    za[n] || (za[n] = new WeakMap());
    var i = za[n],
      s = [],
      a = new Set(),
      l = new Set(o),
      u = function (f) {
        !f || a.has(f) || (a.add(f), u(f.parentNode));
      };
    o.forEach(u);
    var c = function (f) {
      !f ||
        l.has(f) ||
        Array.prototype.forEach.call(f.children, function (d) {
          if (a.has(d)) c(d);
          else
            try {
              var v = d.getAttribute(r),
                m = v !== null && v !== "false",
                y = (_o.get(d) || 0) + 1,
                x = (i.get(d) || 0) + 1;
              _o.set(d, y),
                i.set(d, x),
                s.push(d),
                y === 1 && m && $a.set(d, !0),
                x === 1 && d.setAttribute(n, "true"),
                m || d.setAttribute(r, "true");
            } catch (p) {
              console.error("aria-hidden: cannot operate on ", d, p);
            }
        });
    };
    return (
      c(t),
      a.clear(),
      Qc++,
      function () {
        s.forEach(function (f) {
          var d = _o.get(f) - 1,
            v = i.get(f) - 1;
          _o.set(f, d), i.set(f, v), d || ($a.has(f) || f.removeAttribute(r), $a.delete(f)), v || f.removeAttribute(n);
        }),
          Qc--,
          Qc || ((_o = new WeakMap()), (_o = new WeakMap()), ($a = new WeakMap()), (za = {}));
      }
    );
  },
  YL = function (e, t, n) {
    n === void 0 && (n = "data-aria-hidden");
    var r = Array.from(Array.isArray(e) ? e : [e]),
      o = qL(e);
    return o
      ? (r.push.apply(r, Array.from(o.querySelectorAll("[aria-live]"))), QL(r, o, n, "aria-hidden"))
      : function () {
          return null;
        };
  },
  xn = function () {
    return (
      (xn =
        Object.assign ||
        function (t) {
          for (var n, r = 1, o = arguments.length; r < o; r++) {
            n = arguments[r];
            for (var i in n) Object.prototype.hasOwnProperty.call(n, i) && (t[i] = n[i]);
          }
          return t;
        }),
      xn.apply(this, arguments)
    );
  };
function N1(e, t) {
  var n = {};
  for (var r in e) Object.prototype.hasOwnProperty.call(e, r) && t.indexOf(r) < 0 && (n[r] = e[r]);
  if (e != null && typeof Object.getOwnPropertySymbols == "function")
    for (var o = 0, r = Object.getOwnPropertySymbols(e); o < r.length; o++)
      t.indexOf(r[o]) < 0 && Object.prototype.propertyIsEnumerable.call(e, r[o]) && (n[r[o]] = e[r[o]]);
  return n;
}
function XL(e, t, n) {
  if (n || arguments.length === 2)
    for (var r = 0, o = t.length, i; r < o; r++)
      (i || !(r in t)) && (i || (i = Array.prototype.slice.call(t, 0, r)), (i[r] = t[r]));
  return e.concat(i || Array.prototype.slice.call(t));
}
var hl = "right-scroll-bar-position",
  ml = "width-before-scroll-bar",
  JL = "with-scroll-bars-hidden",
  ZL = "--removed-body-scroll-bar-size";
function Yc(e, t) {
  return typeof e == "function" ? e(t) : e && (e.current = t), e;
}
function eD(e, t) {
  var n = h.useState(function () {
    return {
      value: e,
      callback: t,
      facade: {
        get current() {
          return n.value;
        },
        set current(r) {
          var o = n.value;
          o !== r && ((n.value = r), n.callback(r, o));
        },
      },
    };
  })[0];
  return (n.callback = t), n.facade;
}
var tD = typeof window != "undefined" ? h.useLayoutEffect : h.useEffect,
  ky = new WeakMap();
function nD(e, t) {
  var n = eD(null, function (r) {
    return e.forEach(function (o) {
      return Yc(o, r);
    });
  });
  return (
    tD(
      function () {
        var r = ky.get(n);
        if (r) {
          var o = new Set(r),
            i = new Set(e),
            s = n.current;
          o.forEach(function (a) {
            i.has(a) || Yc(a, null);
          }),
            i.forEach(function (a) {
              o.has(a) || Yc(a, s);
            });
        }
        ky.set(n, e);
      },
      [e]
    ),
    n
  );
}
function rD(e) {
  return e;
}
function oD(e, t) {
  t === void 0 && (t = rD);
  var n = [],
    r = !1,
    o = {
      read: function () {
        if (r)
          throw new Error(
            "Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`."
          );
        return n.length ? n[n.length - 1] : e;
      },
      useMedium: function (i) {
        var s = t(i, r);
        return (
          n.push(s),
          function () {
            n = n.filter(function (a) {
              return a !== s;
            });
          }
        );
      },
      assignSyncMedium: function (i) {
        for (r = !0; n.length; ) {
          var s = n;
          (n = []), s.forEach(i);
        }
        n = {
          push: function (a) {
            return i(a);
          },
          filter: function () {
            return n;
          },
        };
      },
      assignMedium: function (i) {
        r = !0;
        var s = [];
        if (n.length) {
          var a = n;
          (n = []), a.forEach(i), (s = n);
        }
        var l = function () {
            var c = s;
            (s = []), c.forEach(i);
          },
          u = function () {
            return Promise.resolve().then(l);
          };
        u(),
          (n = {
            push: function (c) {
              s.push(c), u();
            },
            filter: function (c) {
              return (s = s.filter(c)), n;
            },
          });
      },
    };
  return o;
}
function iD(e) {
  e === void 0 && (e = {});
  var t = oD(null);
  return (t.options = xn({ async: !0, ssr: !1 }, e)), t;
}
var L1 = function (e) {
  var t = e.sideCar,
    n = N1(e, ["sideCar"]);
  if (!t) throw new Error("Sidecar: please provide `sideCar` property to import the right car");
  var r = t.read();
  if (!r) throw new Error("Sidecar medium not found");
  return h.createElement(r, xn({}, n));
};
L1.isSideCarExport = !0;
function sD(e, t) {
  return e.useMedium(t), L1;
}
var D1 = iD(),
  Xc = function () {},
  Ku = h.forwardRef(function (e, t) {
    var n = h.useRef(null),
      r = h.useState({ onScrollCapture: Xc, onWheelCapture: Xc, onTouchMoveCapture: Xc }),
      o = r[0],
      i = r[1],
      s = e.forwardProps,
      a = e.children,
      l = e.className,
      u = e.removeScrollBar,
      c = e.enabled,
      f = e.shards,
      d = e.sideCar,
      v = e.noIsolation,
      m = e.inert,
      y = e.allowPinchZoom,
      x = e.as,
      p = x === void 0 ? "div" : x,
      g = e.gapMode,
      w = N1(e, [
        "forwardProps",
        "children",
        "className",
        "removeScrollBar",
        "enabled",
        "shards",
        "sideCar",
        "noIsolation",
        "inert",
        "allowPinchZoom",
        "as",
        "gapMode",
      ]),
      S = d,
      C = nD([n, t]),
      E = xn(xn({}, w), o);
    return h.createElement(
      h.Fragment,
      null,
      c &&
        h.createElement(S, {
          sideCar: D1,
          removeScrollBar: u,
          shards: f,
          noIsolation: v,
          inert: m,
          setCallbacks: i,
          allowPinchZoom: !!y,
          lockRef: n,
          gapMode: g,
        }),
      s
        ? h.cloneElement(h.Children.only(a), xn(xn({}, E), { ref: C }))
        : h.createElement(p, xn({}, E, { className: l, ref: C }), a)
    );
  });
Ku.defaultProps = { enabled: !0, removeScrollBar: !0, inert: !1 };
Ku.classNames = { fullWidth: ml, zeroRight: hl };
var aD = function () {
  if (typeof __webpack_nonce__ != "undefined") return __webpack_nonce__;
};
function lD() {
  if (!document) return null;
  var e = document.createElement("style");
  e.type = "text/css";
  var t = aD();
  return t && e.setAttribute("nonce", t), e;
}
function uD(e, t) {
  e.styleSheet ? (e.styleSheet.cssText = t) : e.appendChild(document.createTextNode(t));
}
function cD(e) {
  var t = document.head || document.getElementsByTagName("head")[0];
  t.appendChild(e);
}
var fD = function () {
    var e = 0,
      t = null;
    return {
      add: function (n) {
        e == 0 && (t = lD()) && (uD(t, n), cD(t)), e++;
      },
      remove: function () {
        e--, !e && t && (t.parentNode && t.parentNode.removeChild(t), (t = null));
      },
    };
  },
  dD = function () {
    var e = fD();
    return function (t, n) {
      h.useEffect(
        function () {
          return (
            e.add(t),
            function () {
              e.remove();
            }
          );
        },
        [t && n]
      );
    };
  },
  M1 = function () {
    var e = dD(),
      t = function (n) {
        var r = n.styles,
          o = n.dynamic;
        return e(r, o), null;
      };
    return t;
  },
  pD = { left: 0, top: 0, right: 0, gap: 0 },
  Jc = function (e) {
    return parseInt(e || "", 10) || 0;
  },
  hD = function (e) {
    var t = window.getComputedStyle(document.body),
      n = t[e === "padding" ? "paddingLeft" : "marginLeft"],
      r = t[e === "padding" ? "paddingTop" : "marginTop"],
      o = t[e === "padding" ? "paddingRight" : "marginRight"];
    return [Jc(n), Jc(r), Jc(o)];
  },
  mD = function (e) {
    if ((e === void 0 && (e = "margin"), typeof window == "undefined")) return pD;
    var t = hD(e),
      n = document.documentElement.clientWidth,
      r = window.innerWidth;
    return { left: t[0], top: t[1], right: t[2], gap: Math.max(0, r - n + t[2] - t[0]) };
  },
  gD = M1(),
  Yo = "data-scroll-locked",
  yD = function (e, t, n, r) {
    var o = e.left,
      i = e.top,
      s = e.right,
      a = e.gap;
    return (
      n === void 0 && (n = "margin"),
      `
  .`
        .concat(
          JL,
          ` {
   overflow: hidden `
        )
        .concat(
          r,
          `;
   padding-right: `
        )
        .concat(a, "px ")
        .concat(
          r,
          `;
  }
  body[`
        )
        .concat(
          Yo,
          `] {
    overflow: hidden `
        )
        .concat(
          r,
          `;
    overscroll-behavior: contain;
    `
        )
        .concat(
          [
            t && "position: relative ".concat(r, ";"),
            n === "margin" &&
              `
    padding-left: `
                .concat(
                  o,
                  `px;
    padding-top: `
                )
                .concat(
                  i,
                  `px;
    padding-right: `
                )
                .concat(
                  s,
                  `px;
    margin-left:0;
    margin-top:0;
    margin-right: `
                )
                .concat(a, "px ")
                .concat(
                  r,
                  `;
    `
                ),
            n === "padding" && "padding-right: ".concat(a, "px ").concat(r, ";"),
          ]
            .filter(Boolean)
            .join(""),
          `
  }

  .`
        )
        .concat(
          hl,
          ` {
    right: `
        )
        .concat(a, "px ")
        .concat(
          r,
          `;
  }

  .`
        )
        .concat(
          ml,
          ` {
    margin-right: `
        )
        .concat(a, "px ")
        .concat(
          r,
          `;
  }

  .`
        )
        .concat(hl, " .")
        .concat(
          hl,
          ` {
    right: 0 `
        )
        .concat(
          r,
          `;
  }

  .`
        )
        .concat(ml, " .")
        .concat(
          ml,
          ` {
    margin-right: 0 `
        )
        .concat(
          r,
          `;
  }

  body[`
        )
        .concat(
          Yo,
          `] {
    `
        )
        .concat(ZL, ": ")
        .concat(
          a,
          `px;
  }
`
        )
    );
  },
  _y = function () {
    var e = parseInt(document.body.getAttribute(Yo) || "0", 10);
    return isFinite(e) ? e : 0;
  },
  vD = function () {
    h.useEffect(function () {
      return (
        document.body.setAttribute(Yo, (_y() + 1).toString()),
        function () {
          var e = _y() - 1;
          e <= 0 ? document.body.removeAttribute(Yo) : document.body.setAttribute(Yo, e.toString());
        }
      );
    }, []);
  },
  wD = function (e) {
    var t = e.noRelative,
      n = e.noImportant,
      r = e.gapMode,
      o = r === void 0 ? "margin" : r;
    vD();
    var i = h.useMemo(
      function () {
        return mD(o);
      },
      [o]
    );
    return h.createElement(gD, { styles: yD(i, !t, o, n ? "" : "!important") });
  },
  Od = !1;
if (typeof window != "undefined")
  try {
    var Ua = Object.defineProperty({}, "passive", {
      get: function () {
        return (Od = !0), !0;
      },
    });
    window.addEventListener("test", Ua, Ua), window.removeEventListener("test", Ua, Ua);
  } catch (e) {
    Od = !1;
  }
var To = Od ? { passive: !1 } : !1,
  xD = function (e) {
    return e.tagName === "TEXTAREA";
  },
  j1 = function (e, t) {
    var n = window.getComputedStyle(e);
    return n[t] !== "hidden" && !(n.overflowY === n.overflowX && !xD(e) && n[t] === "visible");
  },
  SD = function (e) {
    return j1(e, "overflowY");
  },
  ED = function (e) {
    return j1(e, "overflowX");
  },
  Ty = function (e, t) {
    var n = t.ownerDocument,
      r = t;
    do {
      typeof ShadowRoot != "undefined" && r instanceof ShadowRoot && (r = r.host);
      var o = F1(e, r);
      if (o) {
        var i = I1(e, r),
          s = i[1],
          a = i[2];
        if (s > a) return !0;
      }
      r = r.parentNode;
    } while (r && r !== n.body);
    return !1;
  },
  CD = function (e) {
    var t = e.scrollTop,
      n = e.scrollHeight,
      r = e.clientHeight;
    return [t, n, r];
  },
  bD = function (e) {
    var t = e.scrollLeft,
      n = e.scrollWidth,
      r = e.clientWidth;
    return [t, n, r];
  },
  F1 = function (e, t) {
    return e === "v" ? SD(t) : ED(t);
  },
  I1 = function (e, t) {
    return e === "v" ? CD(t) : bD(t);
  },
  kD = function (e, t) {
    return e === "h" && t === "rtl" ? -1 : 1;
  },
  _D = function (e, t, n, r, o) {
    var i = kD(e, window.getComputedStyle(t).direction),
      s = i * r,
      a = n.target,
      l = t.contains(a),
      u = !1,
      c = s > 0,
      f = 0,
      d = 0;
    do {
      var v = I1(e, a),
        m = v[0],
        y = v[1],
        x = v[2],
        p = y - x - i * m;
      (m || p) && F1(e, a) && ((f += p), (d += m)), a instanceof ShadowRoot ? (a = a.host) : (a = a.parentNode);
    } while ((!l && a !== document.body) || (l && (t.contains(a) || t === a)));
    return ((c && (Math.abs(f) < 1 || !o)) || (!c && (Math.abs(d) < 1 || !o))) && (u = !0), u;
  },
  Ba = function (e) {
    return "changedTouches" in e ? [e.changedTouches[0].clientX, e.changedTouches[0].clientY] : [0, 0];
  },
  Ry = function (e) {
    return [e.deltaX, e.deltaY];
  },
  Py = function (e) {
    return e && "current" in e ? e.current : e;
  },
  TD = function (e, t) {
    return e[0] === t[0] && e[1] === t[1];
  },
  RD = function (e) {
    return `
  .block-interactivity-`
      .concat(
        e,
        ` {pointer-events: none;}
  .allow-interactivity-`
      )
      .concat(
        e,
        ` {pointer-events: all;}
`
      );
  },
  PD = 0,
  Ro = [];
function OD(e) {
  var t = h.useRef([]),
    n = h.useRef([0, 0]),
    r = h.useRef(),
    o = h.useState(PD++)[0],
    i = h.useState(M1)[0],
    s = h.useRef(e);
  h.useEffect(
    function () {
      s.current = e;
    },
    [e]
  ),
    h.useEffect(
      function () {
        if (e.inert) {
          document.body.classList.add("block-interactivity-".concat(o));
          var y = XL([e.lockRef.current], (e.shards || []).map(Py), !0).filter(Boolean);
          return (
            y.forEach(function (x) {
              return x.classList.add("allow-interactivity-".concat(o));
            }),
            function () {
              document.body.classList.remove("block-interactivity-".concat(o)),
                y.forEach(function (x) {
                  return x.classList.remove("allow-interactivity-".concat(o));
                });
            }
          );
        }
      },
      [e.inert, e.lockRef.current, e.shards]
    );
  var a = h.useCallback(function (y, x) {
      if ("touches" in y && y.touches.length === 2) return !s.current.allowPinchZoom;
      var p = Ba(y),
        g = n.current,
        w = "deltaX" in y ? y.deltaX : g[0] - p[0],
        S = "deltaY" in y ? y.deltaY : g[1] - p[1],
        C,
        E = y.target,
        P = Math.abs(w) > Math.abs(S) ? "h" : "v";
      if ("touches" in y && P === "h" && E.type === "range") return !1;
      var R = Ty(P, E);
      if (!R) return !0;
      if ((R ? (C = P) : ((C = P === "v" ? "h" : "v"), (R = Ty(P, E))), !R)) return !1;
      if ((!r.current && "changedTouches" in y && (w || S) && (r.current = C), !C)) return !0;
      var A = r.current || C;
      return _D(A, x, y, A === "h" ? w : S, !0);
    }, []),
    l = h.useCallback(function (y) {
      var x = y;
      if (!(!Ro.length || Ro[Ro.length - 1] !== i)) {
        var p = "deltaY" in x ? Ry(x) : Ba(x),
          g = t.current.filter(function (C) {
            return C.name === x.type && (C.target === x.target || x.target === C.shadowParent) && TD(C.delta, p);
          })[0];
        if (g && g.should) {
          x.cancelable && x.preventDefault();
          return;
        }
        if (!g) {
          var w = (s.current.shards || [])
              .map(Py)
              .filter(Boolean)
              .filter(function (C) {
                return C.contains(x.target);
              }),
            S = w.length > 0 ? a(x, w[0]) : !s.current.noIsolation;
          S && x.cancelable && x.preventDefault();
        }
      }
    }, []),
    u = h.useCallback(function (y, x, p, g) {
      var w = { name: y, delta: x, target: p, should: g, shadowParent: AD(p) };
      t.current.push(w),
        setTimeout(function () {
          t.current = t.current.filter(function (S) {
            return S !== w;
          });
        }, 1);
    }, []),
    c = h.useCallback(function (y) {
      (n.current = Ba(y)), (r.current = void 0);
    }, []),
    f = h.useCallback(function (y) {
      u(y.type, Ry(y), y.target, a(y, e.lockRef.current));
    }, []),
    d = h.useCallback(function (y) {
      u(y.type, Ba(y), y.target, a(y, e.lockRef.current));
    }, []);
  h.useEffect(function () {
    return (
      Ro.push(i),
      e.setCallbacks({ onScrollCapture: f, onWheelCapture: f, onTouchMoveCapture: d }),
      document.addEventListener("wheel", l, To),
      document.addEventListener("touchmove", l, To),
      document.addEventListener("touchstart", c, To),
      function () {
        (Ro = Ro.filter(function (y) {
          return y !== i;
        })),
          document.removeEventListener("wheel", l, To),
          document.removeEventListener("touchmove", l, To),
          document.removeEventListener("touchstart", c, To);
      }
    );
  }, []);
  var v = e.removeScrollBar,
    m = e.inert;
  return h.createElement(
    h.Fragment,
    null,
    m ? h.createElement(i, { styles: RD(o) }) : null,
    v ? h.createElement(wD, { gapMode: e.gapMode }) : null
  );
}
function AD(e) {
  for (var t = null; e !== null; ) e instanceof ShadowRoot && ((t = e.host), (e = e.host)), (e = e.parentNode);
  return t;
}
const ND = sD(D1, OD);
var $1 = h.forwardRef(function (e, t) {
  return h.createElement(Ku, xn({}, e, { ref: t, sideCar: ND }));
});
$1.classNames = Ku.classNames;
var wh = "Popover",
  [z1, UM] = Si(wh, [$u]),
  Ys = $u(),
  [LD, zr] = z1(wh),
  U1 = (e) => {
    const { __scopePopover: t, children: n, open: r, defaultOpen: o, onOpenChange: i, modal: s = !1 } = e,
      a = Ys(t),
      l = h.useRef(null),
      [u, c] = h.useState(!1),
      [f = !1, d] = mh({ prop: r, defaultProp: o, onChange: i });
    return k.jsx(
      m1,
      F(T({}, a), {
        children: k.jsx(LD, {
          scope: t,
          contentId: Qx(),
          triggerRef: l,
          open: f,
          onOpenChange: d,
          onOpenToggle: h.useCallback(() => d((v) => !v), [d]),
          hasCustomAnchor: u,
          onCustomAnchorAdd: h.useCallback(() => c(!0), []),
          onCustomAnchorRemove: h.useCallback(() => c(!1), []),
          modal: s,
          children: n,
        }),
      })
    );
  };
U1.displayName = wh;
var B1 = "PopoverAnchor",
  DD = h.forwardRef((e, t) => {
    const l = e,
      { __scopePopover: n } = l,
      r = G(l, ["__scopePopover"]),
      o = zr(B1, n),
      i = Ys(n),
      { onCustomAnchorAdd: s, onCustomAnchorRemove: a } = o;
    return h.useEffect(() => (s(), () => a()), [s, a]), k.jsx(ph, F(T(T({}, i), r), { ref: t }));
  });
DD.displayName = B1;
var V1 = "PopoverTrigger",
  W1 = h.forwardRef((e, t) => {
    const l = e,
      { __scopePopover: n } = l,
      r = G(l, ["__scopePopover"]),
      o = zr(V1, n),
      i = Ys(n),
      s = Tt(t, o.triggerRef),
      a = k.jsx(
        Ve.button,
        F(
          T(
            {
              type: "button",
              "aria-haspopup": "dialog",
              "aria-expanded": o.open,
              "aria-controls": o.contentId,
              "data-state": Q1(o.open),
            },
            r
          ),
          { ref: s, onClick: Oe(e.onClick, o.onOpenToggle) }
        )
      );
    return o.hasCustomAnchor ? a : k.jsx(ph, F(T({ asChild: !0 }, i), { children: a }));
  });
W1.displayName = V1;
var xh = "PopoverPortal",
  [MD, jD] = z1(xh, { forceMount: void 0 }),
  H1 = (e) => {
    const { __scopePopover: t, forceMount: n, children: r, container: o } = e,
      i = zr(xh, t);
    return k.jsx(MD, {
      scope: t,
      forceMount: n,
      children: k.jsx(Qs, { present: n || i.open, children: k.jsx(hh, { asChild: !0, container: o, children: r }) }),
    });
  };
H1.displayName = xh;
var di = "PopoverContent",
  K1 = h.forwardRef((e, t) => {
    const n = jD(di, e.__scopePopover),
      s = e,
      { forceMount: r = n.forceMount } = s,
      o = G(s, ["forceMount"]),
      i = zr(di, e.__scopePopover);
    return k.jsx(Qs, {
      present: r || i.open,
      children: i.modal ? k.jsx(FD, F(T({}, o), { ref: t })) : k.jsx(ID, F(T({}, o), { ref: t })),
    });
  });
K1.displayName = di;
var FD = h.forwardRef((e, t) => {
    const n = zr(di, e.__scopePopover),
      r = h.useRef(null),
      o = Tt(t, r),
      i = h.useRef(!1);
    return (
      h.useEffect(() => {
        const s = r.current;
        if (s) return YL(s);
      }, []),
      k.jsx($1, {
        as: ui,
        allowPinchZoom: !0,
        children: k.jsx(
          q1,
          F(T({}, e), {
            ref: o,
            trapFocus: n.open,
            disableOutsidePointerEvents: !0,
            onCloseAutoFocus: Oe(e.onCloseAutoFocus, (s) => {
              var a;
              s.preventDefault(), i.current || (a = n.triggerRef.current) == null || a.focus();
            }),
            onPointerDownOutside: Oe(
              e.onPointerDownOutside,
              (s) => {
                const a = s.detail.originalEvent,
                  l = a.button === 0 && a.ctrlKey === !0,
                  u = a.button === 2 || l;
                i.current = u;
              },
              { checkForDefaultPrevented: !1 }
            ),
            onFocusOutside: Oe(e.onFocusOutside, (s) => s.preventDefault(), { checkForDefaultPrevented: !1 }),
          })
        ),
      })
    );
  }),
  ID = h.forwardRef((e, t) => {
    const n = zr(di, e.__scopePopover),
      r = h.useRef(!1),
      o = h.useRef(!1);
    return k.jsx(
      q1,
      F(T({}, e), {
        ref: t,
        trapFocus: !1,
        disableOutsidePointerEvents: !1,
        onCloseAutoFocus: (i) => {
          var s, a;
          (s = e.onCloseAutoFocus) == null || s.call(e, i),
            i.defaultPrevented || (r.current || (a = n.triggerRef.current) == null || a.focus(), i.preventDefault()),
            (r.current = !1),
            (o.current = !1);
        },
        onInteractOutside: (i) => {
          var l, u;
          (l = e.onInteractOutside) == null || l.call(e, i),
            i.defaultPrevented || ((r.current = !0), i.detail.originalEvent.type === "pointerdown" && (o.current = !0));
          const s = i.target;
          ((u = n.triggerRef.current) == null ? void 0 : u.contains(s)) && i.preventDefault(),
            i.detail.originalEvent.type === "focusin" && o.current && i.preventDefault();
        },
      })
    );
  }),
  q1 = h.forwardRef((e, t) => {
    const m = e,
      {
        __scopePopover: n,
        trapFocus: r,
        onOpenAutoFocus: o,
        onCloseAutoFocus: i,
        disableOutsidePointerEvents: s,
        onEscapeKeyDown: a,
        onPointerDownOutside: l,
        onFocusOutside: u,
        onInteractOutside: c,
      } = m,
      f = G(m, [
        "__scopePopover",
        "trapFocus",
        "onOpenAutoFocus",
        "onCloseAutoFocus",
        "disableOutsidePointerEvents",
        "onEscapeKeyDown",
        "onPointerDownOutside",
        "onFocusOutside",
        "onInteractOutside",
      ]),
      d = zr(di, n),
      v = Ys(n);
    return (
      $L(),
      k.jsx(P1, {
        asChild: !0,
        loop: !0,
        trapped: r,
        onMountAutoFocus: o,
        onUnmountAutoFocus: i,
        children: k.jsx(ju, {
          asChild: !0,
          disableOutsidePointerEvents: s,
          onInteractOutside: c,
          onEscapeKeyDown: a,
          onPointerDownOutside: l,
          onFocusOutside: u,
          onDismiss: () => d.onOpenChange(!1),
          children: k.jsx(
            g1,
            F(T(T({ "data-state": Q1(d.open), role: "dialog", id: d.contentId }, v), f), {
              ref: t,
              style: F(T({}, f.style), {
                "--radix-popover-content-transform-origin": "var(--radix-popper-transform-origin)",
                "--radix-popover-content-available-width": "var(--radix-popper-available-width)",
                "--radix-popover-content-available-height": "var(--radix-popper-available-height)",
                "--radix-popover-trigger-width": "var(--radix-popper-anchor-width)",
                "--radix-popover-trigger-height": "var(--radix-popper-anchor-height)",
              }),
            })
          ),
        }),
      })
    );
  }),
  G1 = "PopoverClose",
  $D = h.forwardRef((e, t) => {
    const i = e,
      { __scopePopover: n } = i,
      r = G(i, ["__scopePopover"]),
      o = zr(G1, n);
    return k.jsx(Ve.button, F(T({ type: "button" }, r), { ref: t, onClick: Oe(e.onClick, () => o.onOpenChange(!1)) }));
  });
$D.displayName = G1;
var zD = "PopoverArrow",
  UD = h.forwardRef((e, t) => {
    const i = e,
      { __scopePopover: n } = i,
      r = G(i, ["__scopePopover"]),
      o = Ys(n);
    return k.jsx(y1, F(T(T({}, o), r), { ref: t }));
  });
UD.displayName = zD;
function Q1(e) {
  return e ? "open" : "closed";
}
var BD = U1,
  VD = W1,
  WD = H1,
  Y1 = K1;
const HD = BD,
  KD = VD,
  X1 = h.forwardRef((i, o) => {
    var s = i,
      { className: e, align: t = "center", sideOffset: n = 4 } = s,
      r = G(s, ["className", "align", "sideOffset"]);
    return k.jsx(WD, {
      children: k.jsx(
        Y1,
        T(
          {
            ref: o,
            align: t,
            sideOffset: n,
            className: De(
              "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
              e
            ),
          },
          r
        )
      ),
    });
  });
X1.displayName = Y1.displayName;
var Sh = "Avatar",
  [qD, BM] = Si(Sh),
  [GD, J1] = qD(Sh),
  Z1 = h.forwardRef((e, t) => {
    const s = e,
      { __scopeAvatar: n } = s,
      r = G(s, ["__scopeAvatar"]),
      [o, i] = h.useState("idle");
    return k.jsx(GD, {
      scope: n,
      imageLoadingStatus: o,
      onImageLoadingStatusChange: i,
      children: k.jsx(Ve.span, F(T({}, r), { ref: t })),
    });
  });
Z1.displayName = Sh;
var eS = "AvatarImage",
  tS = h.forwardRef((e, t) => {
    const u = e,
      { __scopeAvatar: n, src: r, onLoadingStatusChange: o = () => {} } = u,
      i = G(u, ["__scopeAvatar", "src", "onLoadingStatusChange"]),
      s = J1(eS, n),
      a = QD(r),
      l = $t((c) => {
        o(c), s.onImageLoadingStatusChange(c);
      });
    return (
      Tn(() => {
        a !== "idle" && l(a);
      }, [a, l]),
      a === "loaded" ? k.jsx(Ve.img, F(T({}, i), { ref: t, src: r })) : null
    );
  });
tS.displayName = eS;
var nS = "AvatarFallback",
  rS = h.forwardRef((e, t) => {
    const l = e,
      { __scopeAvatar: n, delayMs: r } = l,
      o = G(l, ["__scopeAvatar", "delayMs"]),
      i = J1(nS, n),
      [s, a] = h.useState(r === void 0);
    return (
      h.useEffect(() => {
        if (r !== void 0) {
          const u = window.setTimeout(() => a(!0), r);
          return () => window.clearTimeout(u);
        }
      }, [r]),
      s && i.imageLoadingStatus !== "loaded" ? k.jsx(Ve.span, F(T({}, o), { ref: t })) : null
    );
  });
rS.displayName = nS;
function QD(e) {
  const [t, n] = h.useState("idle");
  return (
    Tn(() => {
      if (!e) {
        n("error");
        return;
      }
      let r = !0;
      const o = new window.Image(),
        i = (s) => () => {
          r && n(s);
        };
      return (
        n("loading"),
        (o.onload = i("loaded")),
        (o.onerror = i("error")),
        (o.src = e),
        () => {
          r = !1;
        }
      );
    }, [e]),
    t
  );
}
var oS = Z1,
  iS = tS,
  sS = rS;
const aS = h.forwardRef((r, n) => {
  var o = r,
    { className: e } = o,
    t = G(o, ["className"]);
  return k.jsx(oS, T({ ref: n, className: De("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", e) }, t));
});
aS.displayName = oS.displayName;
const lS = h.forwardRef((r, n) => {
  var o = r,
    { className: e } = o,
    t = G(o, ["className"]);
  return k.jsx(iS, T({ ref: n, className: De("aspect-square h-full w-full", e) }, t));
});
lS.displayName = iS.displayName;
const uS = h.forwardRef((r, n) => {
  var o = r,
    { className: e } = o,
    t = G(o, ["className"]);
  return k.jsx(
    sS,
    T({ ref: n, className: De("flex h-full w-full items-center justify-center rounded-full bg-muted", e) }, t)
  );
});
uS.displayName = sS.displayName;
var YD = "Separator",
  Oy = "horizontal",
  XD = ["horizontal", "vertical"],
  Eh = h.forwardRef((e, t) => {
    const l = e,
      { decorative: n, orientation: r = Oy } = l,
      o = G(l, ["decorative", "orientation"]),
      i = JD(r) ? r : Oy,
      a = n ? { role: "none" } : { "aria-orientation": i === "vertical" ? i : void 0, role: "separator" };
    return k.jsx(Ve.div, F(T(T({ "data-orientation": i }, a), o), { ref: t }));
  });
Eh.displayName = YD;
function JD(e) {
  return XD.includes(e);
}
var VM = Eh;
const ZD = () =>
  k.jsx(k.Fragment, {
    children: k.jsx("div", {
      className: "w-full h-full flex justify-center items-center",
      children: k.jsx(nu, { variant: "p", className: "text-slate-600 font-medium", children: "Something went wrong" }),
    }),
  });
class e2 extends h.Component {
  constructor() {
    super(...arguments);
    Fh(this, "state", { hasError: !1, error: null });
  }
  static getDerivedStateFromError(n) {
    return { hasError: !0, error: n };
  }
  componentDidCatch(n, r) {
    console.error("Uncaught error:", n, r);
  }
  render() {
    const { hasError: n } = this.state,
      { children: r, fallback: o } = this.props;
    return n ? o || k.jsx(ZD, {}) : r;
  }
}
const ls = ({ children: e }) => k.jsx(k.Fragment, { children: k.jsx(e2, { children: e }) }),
  t2 = () => {
    const { call: e } = h.useContext(Ir),
      t = Ks((l) => l.user),
      n = Gp(),
      { toast: r } = vh(),
      o = t.roles.includes("Projects Manager");
    h.useEffect(() => {
      t.appLogo || i();
    }, []);
    const i = () => {
        e.get("timesheet_enhancer.api.utils.app_logo")
          .then((l) => {
            n(kP(l.message));
          })
          .catch((l) => {
            const u = aw(l);
            r({ variant: "destructive", description: u });
          });
      },
      s = () => {
        n(_P(!t.isSidebarCollapsed));
      },
      a = [
        { to: Bx, icon: RL, label: "Home", key: "home", isPmRoute: !0 },
        { to: oh, icon: TL, label: "Timesheet", key: "timesheet", isPmRoute: !1 },
        { to: cl, icon: OL, label: "Teams", key: "teams", isPmRoute: !0 },
      ];
    return k.jsx(ls, {
      children: k.jsxs("aside", {
        className: De(
          "bg-slate-100  w-1/5 transition-all duration-300 ease-in-out p-4 flex flex-col",
          t.isSidebarCollapsed && "w-16 items-center"
        ),
        children: [
          k.jsxs("div", {
            className: De("flex gap-x-2 items-center", !t.isSidebarCollapsed && "pl-3"),
            id: "app-logo",
            children: [
              k.jsx("img", { src: decodeURIComponent(t.appLogo), alt: "app-logo", className: "w-8 h-8" }),
              k.jsx(nu, {
                variant: "h2",
                className: De("transition-all duration-300 ease-in-out", t.isSidebarCollapsed && "hidden"),
                children: "Timesheet",
              }),
            ],
          }),
          k.jsx("div", {
            className: "pt-10 flex flex-col gap-y-2",
            children: a.map((l) =>
              l.isPmRoute && !o
                ? null
                : k.jsx(
                    gA,
                    {
                      to: l.to,
                      className: "transition-all duration-300 ease-in-out flex items-center h-9",
                      children: ({ isActive: u }) =>
                        k.jsxs("div", {
                          className: De(
                            "flex w-full pl-2 rounded-lg items-center px-3 py-2 hover:bg-slate-200 text-primary gap-x-2",
                            u && "bg-primary shadow-md hover:bg-slate-700 "
                          ),
                          children: [
                            k.jsx(l.icon, {
                              className: De("shrink-0 stroke-primary h-4 w-4", u && "stroke-background"),
                            }),
                            k.jsx(nu, {
                              variant: "p",
                              className: De(
                                "transition-all duration-300 ease-in-out text-white",
                                !u && "text-primary",
                                t.isSidebarCollapsed && "hidden"
                              ),
                              children: l.label,
                            }),
                          ],
                        }),
                    },
                    l.key
                  )
            ),
          }),
          k.jsx("div", { className: "grow" }),
          k.jsxs("div", {
            className: De("flex justify-between items-center", t.isSidebarCollapsed && "flex-col "),
            children: [
              k.jsx(n2, {}),
              k.jsx(yh, {
                variant: "ghost",
                className: "justify-end  gap-x-2 transition-all duration-300 ease-in-out h-6",
                onClick: s,
                children: k.jsx(kL, {
                  className: De(
                    "stroke-primary h-4 w-4 transition-all duration-600",
                    t.isSidebarCollapsed && "rotate-180"
                  ),
                }),
              }),
            ],
          }),
        ],
      }),
    });
  },
  n2 = () => {
    const e = Ks((n) => n.user),
      { logout: t } = h.useContext(Kp);
    return k.jsx(ls, {
      children: k.jsxs(HD, {
        children: [
          k.jsxs(KD, {
            className: De("flex items-center gap-x-2"),
            children: [
              k.jsxs(aS, {
                className: "w-8 h-8 justify-self-end transition-all duration-600",
                children: [k.jsx(lS, { src: decodeURIComponent(e.image) }), k.jsx(uS, { children: e.userName[0] })],
              }),
              k.jsx(nu, {
                variant: "p",
                className: De("transition-all duration-800", e.isSidebarCollapsed && "hidden"),
                children: e.userName,
              }),
            ],
          }),
          k.jsxs(X1, {
            className: "flex flex-col p-1 w-52",
            children: [
              k.jsxs("a", {
                className: "flex justify-start text-sm hover:no-underline hover:bg-accent p-2 gap-x-2 items-center",
                href: SA,
                children: [k.jsx(_L, { className: "w-4 h-4" }), "Switch To Desk"],
              }),
              k.jsx(Eh, { className: "my-1" }),
              k.jsxs(yh, {
                variant: "link",
                className:
                  "flex justify-start hover:no-underline font-normal hover:bg-accent p-2 gap-x-2 items-center focus-visible:ring-0 focus-visible:ring-offset-0",
                onClick: t,
                children: [k.jsx(PL, { className: "w-4 h-4" }), "Logout"],
              }),
            ],
          }),
        ],
      }),
    });
  };
function r2(e) {
  const t = e + "CollectionProvider",
    [n, r] = Si(t),
    [o, i] = n(t, { collectionRef: { current: null }, itemMap: new Map() }),
    s = (v) => {
      const { scope: m, children: y } = v,
        x = ft.useRef(null),
        p = ft.useRef(new Map()).current;
      return k.jsx(o, { scope: m, itemMap: p, collectionRef: x, children: y });
    };
  s.displayName = t;
  const a = e + "CollectionSlot",
    l = ft.forwardRef((v, m) => {
      const { scope: y, children: x } = v,
        p = i(a, y),
        g = Tt(m, p.collectionRef);
      return k.jsx(ui, { ref: g, children: x });
    });
  l.displayName = a;
  const u = e + "CollectionItemSlot",
    c = "data-radix-collection-item",
    f = ft.forwardRef((v, m) => {
      const C = v,
        { scope: y, children: x } = C,
        p = G(C, ["scope", "children"]),
        g = ft.useRef(null),
        w = Tt(m, g),
        S = i(u, y);
      return (
        ft.useEffect(() => (S.itemMap.set(g, T({ ref: g }, p)), () => void S.itemMap.delete(g))),
        k.jsx(ui, { [c]: "", ref: w, children: x })
      );
    });
  f.displayName = u;
  function d(v) {
    const m = i(e + "CollectionConsumer", v);
    return ft.useCallback(() => {
      const x = m.collectionRef.current;
      if (!x) return [];
      const p = Array.from(x.querySelectorAll(`[${c}]`));
      return Array.from(m.itemMap.values()).sort((S, C) => p.indexOf(S.ref.current) - p.indexOf(C.ref.current));
    }, [m.collectionRef, m.itemMap]);
  }
  return [{ Provider: s, Slot: l, ItemSlot: f }, d, r];
}
var Ch = "ToastProvider",
  [bh, o2, i2] = r2("Toast"),
  [cS, WM] = Si("Toast", [i2]),
  [s2, qu] = cS(Ch),
  fS = (e) => {
    const {
        __scopeToast: t,
        label: n = "Notification",
        duration: r = 5e3,
        swipeDirection: o = "right",
        swipeThreshold: i = 50,
        children: s,
      } = e,
      [a, l] = h.useState(null),
      [u, c] = h.useState(0),
      f = h.useRef(!1),
      d = h.useRef(!1);
    return (
      n.trim() || console.error(`Invalid prop \`label\` supplied to \`${Ch}\`. Expected non-empty \`string\`.`),
      k.jsx(bh.Provider, {
        scope: t,
        children: k.jsx(s2, {
          scope: t,
          label: n,
          duration: r,
          swipeDirection: o,
          swipeThreshold: i,
          toastCount: u,
          viewport: a,
          onViewportChange: l,
          onToastAdd: h.useCallback(() => c((v) => v + 1), []),
          onToastRemove: h.useCallback(() => c((v) => v - 1), []),
          isFocusedToastEscapeKeyDownRef: f,
          isClosePausedRef: d,
          children: s,
        }),
      })
    );
  };
fS.displayName = Ch;
var dS = "ToastViewport",
  a2 = ["F8"],
  Ad = "toast.viewportPause",
  Nd = "toast.viewportResume",
  pS = h.forwardRef((e, t) => {
    const x = e,
      { __scopeToast: n, hotkey: r = a2, label: o = "Notifications ({hotkey})" } = x,
      i = G(x, ["__scopeToast", "hotkey", "label"]),
      s = qu(dS, n),
      a = o2(n),
      l = h.useRef(null),
      u = h.useRef(null),
      c = h.useRef(null),
      f = h.useRef(null),
      d = Tt(t, f, s.onViewportChange),
      v = r.join("+").replace(/Key/g, "").replace(/Digit/g, ""),
      m = s.toastCount > 0;
    h.useEffect(() => {
      const p = (g) => {
        var S;
        r.every((C) => g[C] || g.code === C) && ((S = f.current) == null || S.focus());
      };
      return document.addEventListener("keydown", p), () => document.removeEventListener("keydown", p);
    }, [r]),
      h.useEffect(() => {
        const p = l.current,
          g = f.current;
        if (m && p && g) {
          const w = () => {
              if (!s.isClosePausedRef.current) {
                const P = new CustomEvent(Ad);
                g.dispatchEvent(P), (s.isClosePausedRef.current = !0);
              }
            },
            S = () => {
              if (s.isClosePausedRef.current) {
                const P = new CustomEvent(Nd);
                g.dispatchEvent(P), (s.isClosePausedRef.current = !1);
              }
            },
            C = (P) => {
              !p.contains(P.relatedTarget) && S();
            },
            E = () => {
              p.contains(document.activeElement) || S();
            };
          return (
            p.addEventListener("focusin", w),
            p.addEventListener("focusout", C),
            p.addEventListener("pointermove", w),
            p.addEventListener("pointerleave", E),
            window.addEventListener("blur", w),
            window.addEventListener("focus", S),
            () => {
              p.removeEventListener("focusin", w),
                p.removeEventListener("focusout", C),
                p.removeEventListener("pointermove", w),
                p.removeEventListener("pointerleave", E),
                window.removeEventListener("blur", w),
                window.removeEventListener("focus", S);
            }
          );
        }
      }, [m, s.isClosePausedRef]);
    const y = h.useCallback(
      ({ tabbingDirection: p }) => {
        const w = a().map((S) => {
          const C = S.ref.current,
            E = [C, ...x2(C)];
          return p === "forwards" ? E : E.reverse();
        });
        return (p === "forwards" ? w.reverse() : w).flat();
      },
      [a]
    );
    return (
      h.useEffect(() => {
        const p = f.current;
        if (p) {
          const g = (w) => {
            var E, P, R;
            const S = w.altKey || w.ctrlKey || w.metaKey;
            if (w.key === "Tab" && !S) {
              const A = document.activeElement,
                D = w.shiftKey;
              if (w.target === p && D) {
                (E = u.current) == null || E.focus();
                return;
              }
              const Q = y({ tabbingDirection: D ? "backwards" : "forwards" }),
                X = Q.findIndex((B) => B === A);
              Zc(Q.slice(X + 1))
                ? w.preventDefault()
                : D
                ? (P = u.current) == null || P.focus()
                : (R = c.current) == null || R.focus();
            }
          };
          return p.addEventListener("keydown", g), () => p.removeEventListener("keydown", g);
        }
      }, [a, y]),
      k.jsxs(jA, {
        ref: l,
        role: "region",
        "aria-label": o.replace("{hotkey}", v),
        tabIndex: -1,
        style: { pointerEvents: m ? void 0 : "none" },
        children: [
          m &&
            k.jsx(Ld, {
              ref: u,
              onFocusFromOutsideViewport: () => {
                const p = y({ tabbingDirection: "forwards" });
                Zc(p);
              },
            }),
          k.jsx(bh.Slot, { scope: n, children: k.jsx(Ve.ol, F(T({ tabIndex: -1 }, i), { ref: d })) }),
          m &&
            k.jsx(Ld, {
              ref: c,
              onFocusFromOutsideViewport: () => {
                const p = y({ tabbingDirection: "backwards" });
                Zc(p);
              },
            }),
        ],
      })
    );
  });
pS.displayName = dS;
var hS = "ToastFocusProxy",
  Ld = h.forwardRef((e, t) => {
    const s = e,
      { __scopeToast: n, onFocusFromOutsideViewport: r } = s,
      o = G(s, ["__scopeToast", "onFocusFromOutsideViewport"]),
      i = qu(hS, n);
    return k.jsx(
      zu,
      F(T({ "aria-hidden": !0, tabIndex: 0 }, o), {
        ref: t,
        style: { position: "fixed" },
        onFocus: (a) => {
          var c;
          const l = a.relatedTarget;
          !((c = i.viewport) != null && c.contains(l)) && r();
        },
      })
    );
  });
Ld.displayName = hS;
var Gu = "Toast",
  l2 = "toast.swipeStart",
  u2 = "toast.swipeMove",
  c2 = "toast.swipeCancel",
  f2 = "toast.swipeEnd",
  mS = h.forwardRef((e, t) => {
    const u = e,
      { forceMount: n, open: r, defaultOpen: o, onOpenChange: i } = u,
      s = G(u, ["forceMount", "open", "defaultOpen", "onOpenChange"]),
      [a = !0, l] = mh({ prop: r, defaultProp: o, onChange: i });
    return k.jsx(Qs, {
      present: n || a,
      children: k.jsx(
        h2,
        F(T({ open: a }, s), {
          ref: t,
          onClose: () => l(!1),
          onPause: $t(e.onPause),
          onResume: $t(e.onResume),
          onSwipeStart: Oe(e.onSwipeStart, (c) => {
            c.currentTarget.setAttribute("data-swipe", "start");
          }),
          onSwipeMove: Oe(e.onSwipeMove, (c) => {
            const { x: f, y: d } = c.detail.delta;
            c.currentTarget.setAttribute("data-swipe", "move"),
              c.currentTarget.style.setProperty("--radix-toast-swipe-move-x", `${f}px`),
              c.currentTarget.style.setProperty("--radix-toast-swipe-move-y", `${d}px`);
          }),
          onSwipeCancel: Oe(e.onSwipeCancel, (c) => {
            c.currentTarget.setAttribute("data-swipe", "cancel"),
              c.currentTarget.style.removeProperty("--radix-toast-swipe-move-x"),
              c.currentTarget.style.removeProperty("--radix-toast-swipe-move-y"),
              c.currentTarget.style.removeProperty("--radix-toast-swipe-end-x"),
              c.currentTarget.style.removeProperty("--radix-toast-swipe-end-y");
          }),
          onSwipeEnd: Oe(e.onSwipeEnd, (c) => {
            const { x: f, y: d } = c.detail.delta;
            c.currentTarget.setAttribute("data-swipe", "end"),
              c.currentTarget.style.removeProperty("--radix-toast-swipe-move-x"),
              c.currentTarget.style.removeProperty("--radix-toast-swipe-move-y"),
              c.currentTarget.style.setProperty("--radix-toast-swipe-end-x", `${f}px`),
              c.currentTarget.style.setProperty("--radix-toast-swipe-end-y", `${d}px`),
              l(!1);
          }),
        })
      ),
    });
  });
mS.displayName = Gu;
var [d2, p2] = cS(Gu, { onClose() {} }),
  h2 = h.forwardRef((e, t) => {
    const X = e,
      {
        __scopeToast: n,
        type: r = "foreground",
        duration: o,
        open: i,
        onClose: s,
        onEscapeKeyDown: a,
        onPause: l,
        onResume: u,
        onSwipeStart: c,
        onSwipeMove: f,
        onSwipeCancel: d,
        onSwipeEnd: v,
      } = X,
      m = G(X, [
        "__scopeToast",
        "type",
        "duration",
        "open",
        "onClose",
        "onEscapeKeyDown",
        "onPause",
        "onResume",
        "onSwipeStart",
        "onSwipeMove",
        "onSwipeCancel",
        "onSwipeEnd",
      ]),
      y = qu(Gu, n),
      [x, p] = h.useState(null),
      g = Tt(t, (B) => p(B)),
      w = h.useRef(null),
      S = h.useRef(null),
      C = o || y.duration,
      E = h.useRef(0),
      P = h.useRef(C),
      R = h.useRef(0),
      { onToastAdd: A, onToastRemove: D } = y,
      U = $t(() => {
        var te;
        (x == null ? void 0 : x.contains(document.activeElement)) && ((te = y.viewport) == null || te.focus()), s();
      }),
      I = h.useCallback(
        (B) => {
          !B ||
            B === 1 / 0 ||
            (window.clearTimeout(R.current), (E.current = new Date().getTime()), (R.current = window.setTimeout(U, B)));
        },
        [U]
      );
    h.useEffect(() => {
      const B = y.viewport;
      if (B) {
        const te = () => {
            I(P.current), u == null || u();
          },
          W = () => {
            const M = new Date().getTime() - E.current;
            (P.current = P.current - M), window.clearTimeout(R.current), l == null || l();
          };
        return (
          B.addEventListener(Ad, W),
          B.addEventListener(Nd, te),
          () => {
            B.removeEventListener(Ad, W), B.removeEventListener(Nd, te);
          }
        );
      }
    }, [y.viewport, C, l, u, I]),
      h.useEffect(() => {
        i && !y.isClosePausedRef.current && I(C);
      }, [i, C, y.isClosePausedRef, I]),
      h.useEffect(() => (A(), () => D()), [A, D]);
    const Q = h.useMemo(() => (x ? ES(x) : null), [x]);
    return y.viewport
      ? k.jsxs(k.Fragment, {
          children: [
            Q &&
              k.jsx(m2, {
                __scopeToast: n,
                role: "status",
                "aria-live": r === "foreground" ? "assertive" : "polite",
                "aria-atomic": !0,
                children: Q,
              }),
            k.jsx(d2, {
              scope: n,
              onClose: U,
              children: go.createPortal(
                k.jsx(bh.ItemSlot, {
                  scope: n,
                  children: k.jsx(MA, {
                    asChild: !0,
                    onEscapeKeyDown: Oe(a, () => {
                      y.isFocusedToastEscapeKeyDownRef.current || U(), (y.isFocusedToastEscapeKeyDownRef.current = !1);
                    }),
                    children: k.jsx(
                      Ve.li,
                      F(
                        T(
                          {
                            role: "status",
                            "aria-live": "off",
                            "aria-atomic": !0,
                            tabIndex: 0,
                            "data-state": i ? "open" : "closed",
                            "data-swipe-direction": y.swipeDirection,
                          },
                          m
                        ),
                        {
                          ref: g,
                          style: T({ userSelect: "none", touchAction: "none" }, e.style),
                          onKeyDown: Oe(e.onKeyDown, (B) => {
                            B.key === "Escape" &&
                              (a == null || a(B.nativeEvent),
                              B.nativeEvent.defaultPrevented || ((y.isFocusedToastEscapeKeyDownRef.current = !0), U()));
                          }),
                          onPointerDown: Oe(e.onPointerDown, (B) => {
                            B.button === 0 && (w.current = { x: B.clientX, y: B.clientY });
                          }),
                          onPointerMove: Oe(e.onPointerMove, (B) => {
                            if (!w.current) return;
                            const te = B.clientX - w.current.x,
                              W = B.clientY - w.current.y,
                              M = !!S.current,
                              $ = ["left", "right"].includes(y.swipeDirection),
                              H = ["left", "up"].includes(y.swipeDirection) ? Math.min : Math.max,
                              q = $ ? H(0, te) : 0,
                              oe = $ ? 0 : H(0, W),
                              $e = B.pointerType === "touch" ? 10 : 2,
                              Ee = { x: q, y: oe },
                              ze = { originalEvent: B, delta: Ee };
                            M
                              ? ((S.current = Ee), Va(u2, f, ze, { discrete: !1 }))
                              : Ay(Ee, y.swipeDirection, $e)
                              ? ((S.current = Ee),
                                Va(l2, c, ze, { discrete: !1 }),
                                B.target.setPointerCapture(B.pointerId))
                              : (Math.abs(te) > $e || Math.abs(W) > $e) && (w.current = null);
                          }),
                          onPointerUp: Oe(e.onPointerUp, (B) => {
                            const te = S.current,
                              W = B.target;
                            if (
                              (W.hasPointerCapture(B.pointerId) && W.releasePointerCapture(B.pointerId),
                              (S.current = null),
                              (w.current = null),
                              te)
                            ) {
                              const M = B.currentTarget,
                                $ = { originalEvent: B, delta: te };
                              Ay(te, y.swipeDirection, y.swipeThreshold)
                                ? Va(f2, v, $, { discrete: !0 })
                                : Va(c2, d, $, { discrete: !0 }),
                                M.addEventListener("click", (H) => H.preventDefault(), { once: !0 });
                            }
                          }),
                        }
                      )
                    ),
                  }),
                }),
                y.viewport
              ),
            }),
          ],
        })
      : null;
  }),
  m2 = (e) => {
    const u = e,
      { __scopeToast: t, children: n } = u,
      r = G(u, ["__scopeToast", "children"]),
      o = qu(Gu, t),
      [i, s] = h.useState(!1),
      [a, l] = h.useState(!1);
    return (
      v2(() => s(!0)),
      h.useEffect(() => {
        const c = window.setTimeout(() => l(!0), 1e3);
        return () => window.clearTimeout(c);
      }, []),
      a
        ? null
        : k.jsx(hh, {
            asChild: !0,
            children: k.jsx(zu, F(T({}, r), { children: i && k.jsxs(k.Fragment, { children: [o.label, " ", n] }) })),
          })
    );
  },
  g2 = "ToastTitle",
  gS = h.forwardRef((e, t) => {
    const o = e,
      { __scopeToast: n } = o,
      r = G(o, ["__scopeToast"]);
    return k.jsx(Ve.div, F(T({}, r), { ref: t }));
  });
gS.displayName = g2;
var y2 = "ToastDescription",
  yS = h.forwardRef((e, t) => {
    const o = e,
      { __scopeToast: n } = o,
      r = G(o, ["__scopeToast"]);
    return k.jsx(Ve.div, F(T({}, r), { ref: t }));
  });
yS.displayName = y2;
var vS = "ToastAction",
  wS = h.forwardRef((e, t) => {
    const o = e,
      { altText: n } = o,
      r = G(o, ["altText"]);
    return n.trim()
      ? k.jsx(SS, { altText: n, asChild: !0, children: k.jsx(kh, F(T({}, r), { ref: t })) })
      : (console.error(`Invalid prop \`altText\` supplied to \`${vS}\`. Expected non-empty \`string\`.`), null);
  });
wS.displayName = vS;
var xS = "ToastClose",
  kh = h.forwardRef((e, t) => {
    const i = e,
      { __scopeToast: n } = i,
      r = G(i, ["__scopeToast"]),
      o = p2(xS, n);
    return k.jsx(SS, {
      asChild: !0,
      children: k.jsx(Ve.button, F(T({ type: "button" }, r), { ref: t, onClick: Oe(e.onClick, o.onClose) })),
    });
  });
kh.displayName = xS;
var SS = h.forwardRef((e, t) => {
  const i = e,
    { __scopeToast: n, altText: r } = i,
    o = G(i, ["__scopeToast", "altText"]);
  return k.jsx(
    Ve.div,
    F(T({ "data-radix-toast-announce-exclude": "", "data-radix-toast-announce-alt": r || void 0 }, o), { ref: t })
  );
});
function ES(e) {
  const t = [];
  return (
    Array.from(e.childNodes).forEach((r) => {
      if ((r.nodeType === r.TEXT_NODE && r.textContent && t.push(r.textContent), w2(r))) {
        const o = r.ariaHidden || r.hidden || r.style.display === "none",
          i = r.dataset.radixToastAnnounceExclude === "";
        if (!o)
          if (i) {
            const s = r.dataset.radixToastAnnounceAlt;
            s && t.push(s);
          } else t.push(...ES(r));
      }
    }),
    t
  );
}
function Va(e, t, n, { discrete: r }) {
  const o = n.originalEvent.currentTarget,
    i = new CustomEvent(e, { bubbles: !0, cancelable: !0, detail: n });
  t && o.addEventListener(e, t, { once: !0 }), r ? Hx(o, i) : o.dispatchEvent(i);
}
var Ay = (e, t, n = 0) => {
  const r = Math.abs(e.x),
    o = Math.abs(e.y),
    i = r > o;
  return t === "left" || t === "right" ? i && r > n : !i && o > n;
};
function v2(e = () => {}) {
  const t = $t(e);
  Tn(() => {
    let n = 0,
      r = 0;
    return (
      (n = window.requestAnimationFrame(() => (r = window.requestAnimationFrame(t)))),
      () => {
        window.cancelAnimationFrame(n), window.cancelAnimationFrame(r);
      }
    );
  }, [t]);
}
function w2(e) {
  return e.nodeType === e.ELEMENT_NODE;
}
function x2(e) {
  const t = [],
    n = document.createTreeWalker(e, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (r) => {
        const o = r.tagName === "INPUT" && r.type === "hidden";
        return r.disabled || r.hidden || o
          ? NodeFilter.FILTER_SKIP
          : r.tabIndex >= 0
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      },
    });
  for (; n.nextNode(); ) t.push(n.currentNode);
  return t;
}
function Zc(e) {
  const t = document.activeElement;
  return e.some((n) => (n === t ? !0 : (n.focus(), document.activeElement !== t)));
}
var S2 = fS,
  CS = pS,
  bS = mS,
  kS = gS,
  _S = yS,
  TS = wS,
  RS = kh;
const E2 = S2,
  PS = h.forwardRef((r, n) => {
    var o = r,
      { className: e } = o,
      t = G(o, ["className"]);
    return k.jsx(
      CS,
      T(
        {
          ref: n,
          className: De(
            "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
            e
          ),
        },
        t
      )
    );
  });
PS.displayName = CS.displayName;
const C2 = R1(
    "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
    {
      variants: {
        variant: {
          default: "border bg-background text-foreground",
          destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
          success: "success group border-success bg-success text-success-foreground",
          warning: "warning group border-warning bg-warning text-warning-foreground",
        },
      },
      defaultVariants: { variant: "default" },
    }
  ),
  OS = h.forwardRef((o, r) => {
    var i = o,
      { className: e, variant: t } = i,
      n = G(i, ["className", "variant"]);
    return k.jsx(bS, T({ ref: r, className: De(C2({ variant: t }), e) }, n));
  });
OS.displayName = bS.displayName;
const b2 = h.forwardRef((r, n) => {
  var o = r,
    { className: e } = o,
    t = G(o, ["className"]);
  return k.jsx(
    TS,
    T(
      {
        ref: n,
        className: De(
          "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
          e
        ),
      },
      t
    )
  );
});
b2.displayName = TS.displayName;
const AS = h.forwardRef((r, n) => {
  var o = r,
    { className: e } = o,
    t = G(o, ["className"]);
  return k.jsx(
    RS,
    F(
      T(
        {
          ref: n,
          className: De(
            "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
            e
          ),
          "toast-close": "",
        },
        t
      ),
      { children: k.jsx(AL, { className: "h-4 w-4" }) }
    )
  );
});
AS.displayName = RS.displayName;
const NS = h.forwardRef((r, n) => {
  var o = r,
    { className: e } = o,
    t = G(o, ["className"]);
  return k.jsx(kS, T({ ref: n, className: De("text-sm font-semibold", e) }, t));
});
NS.displayName = kS.displayName;
const LS = h.forwardRef((r, n) => {
  var o = r,
    { className: e } = o,
    t = G(o, ["className"]);
  return k.jsx(_S, T({ ref: n, className: De("text-sm opacity-90", e) }, t));
});
LS.displayName = _S.displayName;
function k2() {
  const { toasts: e } = vh();
  return k.jsxs(E2, {
    children: [
      e.map(function (s) {
        var a = s,
          { id: t, title: n, description: r, action: o } = a,
          i = G(a, ["id", "title", "description", "action"]);
        return k.jsxs(
          OS,
          F(T({}, i), {
            children: [
              k.jsxs("div", {
                className: "grid gap-1",
                children: [n && k.jsx(NS, { children: n }), r && k.jsx(LS, { children: r })],
              }),
              o,
              k.jsx(AS, {}),
            ],
          }),
          t
        );
      }),
      k.jsx(PS, {}),
    ],
  });
}
const _2 = ({ children: e }) => {
    const { call: t } = h.useContext(Ir),
      n = Ks((i) => i.user),
      r = Gp(),
      { toast: o } = vh();
    return (
      h.useEffect(() => {
        le(void 0, null, function* () {
          t.get("timesheet_enhancer.api.utils.get_employee_from_user")
            .then((i) => {
              r(TP(i == null ? void 0 : i.message));
            })
            .catch((i) => {
              const s = aw(i);
              o({ variant: "destructive", description: s });
            });
        });
      }, []),
      k.jsx(ls, {
        children: k.jsxs("div", {
          className: "flex flex-row h-screen w-screen",
          children: [
            k.jsx(ls, { children: k.jsx(t2, {}) }),
            k.jsx("div", {
              className: "w-full flex flex-col",
              children:
                n.employee &&
                k.jsxs("div", {
                  className: "h-full p-3",
                  children: [
                    k.jsx(h.Suspense, { fallback: k.jsx(k.Fragment, {}), children: k.jsx(ls, { children: e }) }),
                    k.jsx(k2, {}),
                  ],
                }),
            }),
          ],
        }),
      })
    );
  },
  T2 = () => (Ks((t) => t.user).roles.includes("Projects Manager") ? k.jsx($x, {}) : k.jsx(GO, { to: oh })),
  R2 = h.lazy(() => Hu(() => import("./index-CEb9j3Od.js"), __vite__mapDeps([0, 1, 2]))),
  P2 = h.lazy(() => Hu(() => import("./index-0o5WGapu.js"), __vite__mapDeps([3, 2, 4]))),
  O2 = h.lazy(() => Hu(() => import("./index-DWGBU-4t.js"), __vite__mapDeps([5, 1, 2, 6, 4]))),
  A2 = h.lazy(() => Hu(() => import("./employeeDetail-CBbE15sC.js"), __vite__mapDeps([6, 1, 2])));
function N2() {
  return k.jsxs(cr, {
    element: k.jsx(L2, {}),
    children: [
      k.jsx(cr, { path: oh, element: k.jsx(R2, {}) }),
      k.jsxs(cr, {
        element: k.jsx(T2, {}),
        children: [
          k.jsx(cr, { path: Bx, element: k.jsx(P2, {}) }),
          k.jsxs(cr, {
            path: cl,
            children: [
              k.jsx(cr, { path: `${cl}/`, element: k.jsx(O2, {}) }),
              k.jsx(cr, { path: `${cl}/employee/:id`, element: k.jsx(A2, {}) }),
            ],
          }),
        ],
      }),
    ],
  });
}
const L2 = () => {
  const { currentUser: e, isLoading: t } = h.useContext(Kp),
    { call: n } = h.useContext(Ir),
    r = Ks((i) => i.user),
    o = Gp();
  if (
    (r.roles.length < 1 &&
      n.get("timesheet_enhancer.api.utils.get_current_user_roles").then((i) => {
        o(bP(i.message));
      }),
    t)
  )
    return k.jsx(k.Fragment, {});
  if (((!e || e === "Guest") && window.location.replace("/login?redirect-to=/timesheet"), !t && e && e !== "Guest"))
    return k.jsx(_2, { children: k.jsx($x, {}) });
};
var ef = { BASE_URL: "/assets/timesheet_enhancer/timesheet/", MODE: "production", DEV: !1, PROD: !0, SSR: !1 };
function D2() {
  var t;
  const e = nA(Ed(N2()), { basename: xA });
  return k.jsx(k.Fragment, {
    children: k.jsx(KT, {
      url: (t = ef.VITE_BASE_URL) != null ? t : "",
      socketPort: ef.VITE_SOCKET_PORT,
      enableSocket: ef.VITE_ENABLE_SOCKET === "true",
      siteName: Yb(),
      children: k.jsx(XT, {
        children: k.jsx(vR, {
          store: jP,
          children: k.jsx(gL, {
            children: k.jsx(h.Suspense, { fallback: k.jsx(k.Fragment, {}), children: k.jsx(cA, { router: e }) }),
          }),
        }),
      }),
    }),
  });
}
tf.createRoot(document.getElementById("root")).render(k.jsx(ft.StrictMode, { children: k.jsx(D2, {}) }));
export {
  aM as $,
  nM as A,
  yh as B,
  TL as C,
  PM as D,
  AM as E,
  De as F,
  cl as G,
  MM as H,
  aS as I,
  lS as J,
  uS as K,
  z2 as L,
  $M as M,
  zM as N,
  yL as O,
  R1 as P,
  F2 as Q,
  VM as R,
  eM as S,
  nu as T,
  V2 as U,
  dM as V,
  iM as W,
  AL as X,
  bM as Y,
  fM as Z,
  oM as _,
  Gp as a,
  lM as a0,
  wM as a1,
  CM as a2,
  SM as a3,
  xM as a4,
  uM as a5,
  U2 as a6,
  xi as a7,
  r2 as a8,
  Si as a9,
  YL as aA,
  $L as aB,
  P1 as aC,
  ju as aD,
  jM as aE,
  hh as aF,
  LL as aG,
  gl as aH,
  go as aI,
  Z0 as aJ,
  iD as aK,
  N1 as aL,
  nD as aM,
  xn as aN,
  ml as aO,
  hl as aP,
  M1 as aQ,
  XL as aR,
  wD as aS,
  sD as aT,
  IN as aU,
  Tt as aa,
  mh as ab,
  $t as ac,
  Ve as ad,
  Oe as ae,
  Qx as af,
  Qs as ag,
  mM as ah,
  DM as ai,
  EM as aj,
  Ul as ak,
  kM as al,
  hM as am,
  vM as an,
  yM as ao,
  HD as ap,
  KD as aq,
  X1 as ar,
  sM as as,
  AP as at,
  NP as au,
  Tn as av,
  ft as aw,
  ls as ax,
  $1 as ay,
  ui as az,
  H2 as b,
  yo as c,
  vh as d,
  W2 as e,
  B2 as f,
  Yf as g,
  Y2 as h,
  j2 as i,
  k as j,
  tM as k,
  G2 as l,
  I2 as m,
  J2 as n,
  Z2 as o,
  aw as p,
  LP as q,
  h as r,
  X2 as s,
  jx as t,
  Ks as u,
  TM as v,
  LM as w,
  _M as x,
  OM as y,
  $2 as z,
};
