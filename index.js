/**
 * @name Sona
 * @version 1.1.0
 * @description 基于 Pengu Loader 的全服可用英雄联盟客户端增强插件
 * @author WJZ_P
 * @link https://github.com/WJZ-P/sona
 */
import "./index.css";
var k1 = Object.defineProperty;
var M1 = (s, c, d) => c in s ? k1(s, c, { enumerable: !0, configurable: !0, writable: !0, value: d }) : s[c] = d;
var Ve = (s, c, d) => M1(s, typeof c != "symbol" ? c + "" : c, d);
var nr = { exports: {} }, Oi = {};
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var zh;
function N1() {
  if (zh) return Oi;
  zh = 1;
  var s = Symbol.for("react.transitional.element"), c = Symbol.for("react.fragment");
  function d(r, m, h) {
    var v = null;
    if (h !== void 0 && (v = "" + h), m.key !== void 0 && (v = "" + m.key), "key" in m) {
      h = {};
      for (var T in m)
        T !== "key" && (h[T] = m[T]);
    } else h = m;
    return m = h.ref, {
      $$typeof: s,
      type: r,
      key: v,
      ref: m !== void 0 ? m : null,
      props: h
    };
  }
  return Oi.Fragment = c, Oi.jsx = d, Oi.jsxs = d, Oi;
}
var wh;
function U1() {
  return wh || (wh = 1, nr.exports = N1()), nr.exports;
}
var u = U1(), ir = { exports: {} }, qi = {}, sr = { exports: {} }, ur = {};
/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ih;
function R1() {
  return Ih || (Ih = 1, (function(s) {
    function c(D, H) {
      var G = D.length;
      D.push(H);
      e: for (; 0 < G; ) {
        var ce = G - 1 >>> 1, se = D[ce];
        if (0 < m(se, H))
          D[ce] = H, D[G] = se, G = ce;
        else break e;
      }
    }
    function d(D) {
      return D.length === 0 ? null : D[0];
    }
    function r(D) {
      if (D.length === 0) return null;
      var H = D[0], G = D.pop();
      if (G !== H) {
        D[0] = G;
        e: for (var ce = 0, se = D.length, A = se >>> 1; ce < A; ) {
          var I = 2 * (ce + 1) - 1, K = D[I], V = I + 1, P = D[V];
          if (0 > m(K, G))
            V < se && 0 > m(P, K) ? (D[ce] = P, D[V] = G, ce = V) : (D[ce] = K, D[I] = G, ce = I);
          else if (V < se && 0 > m(P, G))
            D[ce] = P, D[V] = G, ce = V;
          else break e;
        }
      }
      return H;
    }
    function m(D, H) {
      var G = D.sortIndex - H.sortIndex;
      return G !== 0 ? G : D.id - H.id;
    }
    if (s.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
      var h = performance;
      s.unstable_now = function() {
        return h.now();
      };
    } else {
      var v = Date, T = v.now();
      s.unstable_now = function() {
        return v.now() - T;
      };
    }
    var S = [], p = [], z = 1, E = null, Q = 3, ee = !1, re = !1, ae = !1, ye = !1, Y = typeof setTimeout == "function" ? setTimeout : null, Z = typeof clearTimeout == "function" ? clearTimeout : null, $ = typeof setImmediate < "u" ? setImmediate : null;
    function de(D) {
      for (var H = d(p); H !== null; ) {
        if (H.callback === null) r(p);
        else if (H.startTime <= D)
          r(p), H.sortIndex = H.expirationTime, c(S, H);
        else break;
        H = d(p);
      }
    }
    function W(D) {
      if (ae = !1, de(D), !re)
        if (d(S) !== null)
          re = !0, le || (le = !0, j());
        else {
          var H = d(p);
          H !== null && Ee(W, H.startTime - D);
        }
    }
    var le = !1, ne = -1, ke = 5, ue = -1;
    function Xe() {
      return ye ? !0 : !(s.unstable_now() - ue < ke);
    }
    function X() {
      if (ye = !1, le) {
        var D = s.unstable_now();
        ue = D;
        var H = !0;
        try {
          e: {
            re = !1, ae && (ae = !1, Z(ne), ne = -1), ee = !0;
            var G = Q;
            try {
              t: {
                for (de(D), E = d(S); E !== null && !(E.expirationTime > D && Xe()); ) {
                  var ce = E.callback;
                  if (typeof ce == "function") {
                    E.callback = null, Q = E.priorityLevel;
                    var se = ce(
                      E.expirationTime <= D
                    );
                    if (D = s.unstable_now(), typeof se == "function") {
                      E.callback = se, de(D), H = !0;
                      break t;
                    }
                    E === d(S) && r(S), de(D);
                  } else r(S);
                  E = d(S);
                }
                if (E !== null) H = !0;
                else {
                  var A = d(p);
                  A !== null && Ee(
                    W,
                    A.startTime - D
                  ), H = !1;
                }
              }
              break e;
            } finally {
              E = null, Q = G, ee = !1;
            }
            H = void 0;
          }
        } finally {
          H ? j() : le = !1;
        }
      }
    }
    var j;
    if (typeof $ == "function")
      j = function() {
        $(X);
      };
    else if (typeof MessageChannel < "u") {
      var F = new MessageChannel(), he = F.port2;
      F.port1.onmessage = X, j = function() {
        he.postMessage(null);
      };
    } else
      j = function() {
        Y(X, 0);
      };
    function Ee(D, H) {
      ne = Y(function() {
        D(s.unstable_now());
      }, H);
    }
    s.unstable_IdlePriority = 5, s.unstable_ImmediatePriority = 1, s.unstable_LowPriority = 4, s.unstable_NormalPriority = 3, s.unstable_Profiling = null, s.unstable_UserBlockingPriority = 2, s.unstable_cancelCallback = function(D) {
      D.callback = null;
    }, s.unstable_forceFrameRate = function(D) {
      0 > D || 125 < D ? console.error(
        "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
      ) : ke = 0 < D ? Math.floor(1e3 / D) : 5;
    }, s.unstable_getCurrentPriorityLevel = function() {
      return Q;
    }, s.unstable_next = function(D) {
      switch (Q) {
        case 1:
        case 2:
        case 3:
          var H = 3;
          break;
        default:
          H = Q;
      }
      var G = Q;
      Q = H;
      try {
        return D();
      } finally {
        Q = G;
      }
    }, s.unstable_requestPaint = function() {
      ye = !0;
    }, s.unstable_runWithPriority = function(D, H) {
      switch (D) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          D = 3;
      }
      var G = Q;
      Q = D;
      try {
        return H();
      } finally {
        Q = G;
      }
    }, s.unstable_scheduleCallback = function(D, H, G) {
      var ce = s.unstable_now();
      switch (typeof G == "object" && G !== null ? (G = G.delay, G = typeof G == "number" && 0 < G ? ce + G : ce) : G = ce, D) {
        case 1:
          var se = -1;
          break;
        case 2:
          se = 250;
          break;
        case 5:
          se = 1073741823;
          break;
        case 4:
          se = 1e4;
          break;
        default:
          se = 5e3;
      }
      return se = G + se, D = {
        id: z++,
        callback: H,
        priorityLevel: D,
        startTime: G,
        expirationTime: se,
        sortIndex: -1
      }, G > ce ? (D.sortIndex = G, c(p, D), d(S) === null && D === d(p) && (ae ? (Z(ne), ne = -1) : ae = !0, Ee(W, G - ce))) : (D.sortIndex = se, c(S, D), re || ee || (re = !0, le || (le = !0, j()))), D;
    }, s.unstable_shouldYield = Xe, s.unstable_wrapCallback = function(D) {
      var H = Q;
      return function() {
        var G = Q;
        Q = H;
        try {
          return D.apply(this, arguments);
        } finally {
          Q = G;
        }
      };
    };
  })(ur)), ur;
}
var jh;
function D1() {
  return jh || (jh = 1, sr.exports = R1()), sr.exports;
}
var cr = { exports: {} }, me = {};
/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Oh;
function z1() {
  if (Oh) return me;
  Oh = 1;
  var s = Symbol.for("react.transitional.element"), c = Symbol.for("react.portal"), d = Symbol.for("react.fragment"), r = Symbol.for("react.strict_mode"), m = Symbol.for("react.profiler"), h = Symbol.for("react.consumer"), v = Symbol.for("react.context"), T = Symbol.for("react.forward_ref"), S = Symbol.for("react.suspense"), p = Symbol.for("react.memo"), z = Symbol.for("react.lazy"), E = Symbol.for("react.activity"), Q = Symbol.iterator;
  function ee(A) {
    return A === null || typeof A != "object" ? null : (A = Q && A[Q] || A["@@iterator"], typeof A == "function" ? A : null);
  }
  var re = {
    isMounted: function() {
      return !1;
    },
    enqueueForceUpdate: function() {
    },
    enqueueReplaceState: function() {
    },
    enqueueSetState: function() {
    }
  }, ae = Object.assign, ye = {};
  function Y(A, I, K) {
    this.props = A, this.context = I, this.refs = ye, this.updater = K || re;
  }
  Y.prototype.isReactComponent = {}, Y.prototype.setState = function(A, I) {
    if (typeof A != "object" && typeof A != "function" && A != null)
      throw Error(
        "takes an object of state variables to update or a function which returns an object of state variables."
      );
    this.updater.enqueueSetState(this, A, I, "setState");
  }, Y.prototype.forceUpdate = function(A) {
    this.updater.enqueueForceUpdate(this, A, "forceUpdate");
  };
  function Z() {
  }
  Z.prototype = Y.prototype;
  function $(A, I, K) {
    this.props = A, this.context = I, this.refs = ye, this.updater = K || re;
  }
  var de = $.prototype = new Z();
  de.constructor = $, ae(de, Y.prototype), de.isPureReactComponent = !0;
  var W = Array.isArray;
  function le() {
  }
  var ne = { H: null, A: null, T: null, S: null }, ke = Object.prototype.hasOwnProperty;
  function ue(A, I, K) {
    var V = K.ref;
    return {
      $$typeof: s,
      type: A,
      key: I,
      ref: V !== void 0 ? V : null,
      props: K
    };
  }
  function Xe(A, I) {
    return ue(A.type, I, A.props);
  }
  function X(A) {
    return typeof A == "object" && A !== null && A.$$typeof === s;
  }
  function j(A) {
    var I = { "=": "=0", ":": "=2" };
    return "$" + A.replace(/[=:]/g, function(K) {
      return I[K];
    });
  }
  var F = /\/+/g;
  function he(A, I) {
    return typeof A == "object" && A !== null && A.key != null ? j("" + A.key) : I.toString(36);
  }
  function Ee(A) {
    switch (A.status) {
      case "fulfilled":
        return A.value;
      case "rejected":
        throw A.reason;
      default:
        switch (typeof A.status == "string" ? A.then(le, le) : (A.status = "pending", A.then(
          function(I) {
            A.status === "pending" && (A.status = "fulfilled", A.value = I);
          },
          function(I) {
            A.status === "pending" && (A.status = "rejected", A.reason = I);
          }
        )), A.status) {
          case "fulfilled":
            return A.value;
          case "rejected":
            throw A.reason;
        }
    }
    throw A;
  }
  function D(A, I, K, V, P) {
    var fe = typeof A;
    (fe === "undefined" || fe === "boolean") && (A = null);
    var ve = !1;
    if (A === null) ve = !0;
    else
      switch (fe) {
        case "bigint":
        case "string":
        case "number":
          ve = !0;
          break;
        case "object":
          switch (A.$$typeof) {
            case s:
            case c:
              ve = !0;
              break;
            case z:
              return ve = A._init, D(
                ve(A._payload),
                I,
                K,
                V,
                P
              );
          }
      }
    if (ve)
      return P = P(A), ve = V === "" ? "." + he(A, 0) : V, W(P) ? (K = "", ve != null && (K = ve.replace(F, "$&/") + "/"), D(P, I, K, "", function(Pt) {
        return Pt;
      })) : P != null && (X(P) && (P = Xe(
        P,
        K + (P.key == null || A && A.key === P.key ? "" : ("" + P.key).replace(
          F,
          "$&/"
        ) + "/") + ve
      )), I.push(P)), 1;
    ve = 0;
    var Je = V === "" ? "." : V + ":";
    if (W(A))
      for (var De = 0; De < A.length; De++)
        V = A[De], fe = Je + he(V, De), ve += D(
          V,
          I,
          K,
          fe,
          P
        );
    else if (De = ee(A), typeof De == "function")
      for (A = De.call(A), De = 0; !(V = A.next()).done; )
        V = V.value, fe = Je + he(V, De++), ve += D(
          V,
          I,
          K,
          fe,
          P
        );
    else if (fe === "object") {
      if (typeof A.then == "function")
        return D(
          Ee(A),
          I,
          K,
          V,
          P
        );
      throw I = String(A), Error(
        "Objects are not valid as a React child (found: " + (I === "[object Object]" ? "object with keys {" + Object.keys(A).join(", ") + "}" : I) + "). If you meant to render a collection of children, use an array instead."
      );
    }
    return ve;
  }
  function H(A, I, K) {
    if (A == null) return A;
    var V = [], P = 0;
    return D(A, V, "", "", function(fe) {
      return I.call(K, fe, P++);
    }), V;
  }
  function G(A) {
    if (A._status === -1) {
      var I = A._result;
      I = I(), I.then(
        function(K) {
          (A._status === 0 || A._status === -1) && (A._status = 1, A._result = K);
        },
        function(K) {
          (A._status === 0 || A._status === -1) && (A._status = 2, A._result = K);
        }
      ), A._status === -1 && (A._status = 0, A._result = I);
    }
    if (A._status === 1) return A._result.default;
    throw A._result;
  }
  var ce = typeof reportError == "function" ? reportError : function(A) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var I = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof A == "object" && A !== null && typeof A.message == "string" ? String(A.message) : String(A),
        error: A
      });
      if (!window.dispatchEvent(I)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", A);
      return;
    }
    console.error(A);
  }, se = {
    map: H,
    forEach: function(A, I, K) {
      H(
        A,
        function() {
          I.apply(this, arguments);
        },
        K
      );
    },
    count: function(A) {
      var I = 0;
      return H(A, function() {
        I++;
      }), I;
    },
    toArray: function(A) {
      return H(A, function(I) {
        return I;
      }) || [];
    },
    only: function(A) {
      if (!X(A))
        throw Error(
          "React.Children.only expected to receive a single React element child."
        );
      return A;
    }
  };
  return me.Activity = E, me.Children = se, me.Component = Y, me.Fragment = d, me.Profiler = m, me.PureComponent = $, me.StrictMode = r, me.Suspense = S, me.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ne, me.__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(A) {
      return ne.H.useMemoCache(A);
    }
  }, me.cache = function(A) {
    return function() {
      return A.apply(null, arguments);
    };
  }, me.cacheSignal = function() {
    return null;
  }, me.cloneElement = function(A, I, K) {
    if (A == null)
      throw Error(
        "The argument must be a React element, but you passed " + A + "."
      );
    var V = ae({}, A.props), P = A.key;
    if (I != null)
      for (fe in I.key !== void 0 && (P = "" + I.key), I)
        !ke.call(I, fe) || fe === "key" || fe === "__self" || fe === "__source" || fe === "ref" && I.ref === void 0 || (V[fe] = I[fe]);
    var fe = arguments.length - 2;
    if (fe === 1) V.children = K;
    else if (1 < fe) {
      for (var ve = Array(fe), Je = 0; Je < fe; Je++)
        ve[Je] = arguments[Je + 2];
      V.children = ve;
    }
    return ue(A.type, P, V);
  }, me.createContext = function(A) {
    return A = {
      $$typeof: v,
      _currentValue: A,
      _currentValue2: A,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, A.Provider = A, A.Consumer = {
      $$typeof: h,
      _context: A
    }, A;
  }, me.createElement = function(A, I, K) {
    var V, P = {}, fe = null;
    if (I != null)
      for (V in I.key !== void 0 && (fe = "" + I.key), I)
        ke.call(I, V) && V !== "key" && V !== "__self" && V !== "__source" && (P[V] = I[V]);
    var ve = arguments.length - 2;
    if (ve === 1) P.children = K;
    else if (1 < ve) {
      for (var Je = Array(ve), De = 0; De < ve; De++)
        Je[De] = arguments[De + 2];
      P.children = Je;
    }
    if (A && A.defaultProps)
      for (V in ve = A.defaultProps, ve)
        P[V] === void 0 && (P[V] = ve[V]);
    return ue(A, fe, P);
  }, me.createRef = function() {
    return { current: null };
  }, me.forwardRef = function(A) {
    return { $$typeof: T, render: A };
  }, me.isValidElement = X, me.lazy = function(A) {
    return {
      $$typeof: z,
      _payload: { _status: -1, _result: A },
      _init: G
    };
  }, me.memo = function(A, I) {
    return {
      $$typeof: p,
      type: A,
      compare: I === void 0 ? null : I
    };
  }, me.startTransition = function(A) {
    var I = ne.T, K = {};
    ne.T = K;
    try {
      var V = A(), P = ne.S;
      P !== null && P(K, V), typeof V == "object" && V !== null && typeof V.then == "function" && V.then(le, ce);
    } catch (fe) {
      ce(fe);
    } finally {
      I !== null && K.types !== null && (I.types = K.types), ne.T = I;
    }
  }, me.unstable_useCacheRefresh = function() {
    return ne.H.useCacheRefresh();
  }, me.use = function(A) {
    return ne.H.use(A);
  }, me.useActionState = function(A, I, K) {
    return ne.H.useActionState(A, I, K);
  }, me.useCallback = function(A, I) {
    return ne.H.useCallback(A, I);
  }, me.useContext = function(A) {
    return ne.H.useContext(A);
  }, me.useDebugValue = function() {
  }, me.useDeferredValue = function(A, I) {
    return ne.H.useDeferredValue(A, I);
  }, me.useEffect = function(A, I) {
    return ne.H.useEffect(A, I);
  }, me.useEffectEvent = function(A) {
    return ne.H.useEffectEvent(A);
  }, me.useId = function() {
    return ne.H.useId();
  }, me.useImperativeHandle = function(A, I, K) {
    return ne.H.useImperativeHandle(A, I, K);
  }, me.useInsertionEffect = function(A, I) {
    return ne.H.useInsertionEffect(A, I);
  }, me.useLayoutEffect = function(A, I) {
    return ne.H.useLayoutEffect(A, I);
  }, me.useMemo = function(A, I) {
    return ne.H.useMemo(A, I);
  }, me.useOptimistic = function(A, I) {
    return ne.H.useOptimistic(A, I);
  }, me.useReducer = function(A, I, K) {
    return ne.H.useReducer(A, I, K);
  }, me.useRef = function(A) {
    return ne.H.useRef(A);
  }, me.useState = function(A) {
    return ne.H.useState(A);
  }, me.useSyncExternalStore = function(A, I, K) {
    return ne.H.useSyncExternalStore(
      A,
      I,
      K
    );
  }, me.useTransition = function() {
    return ne.H.useTransition();
  }, me.version = "19.2.4", me;
}
var qh;
function Ir() {
  return qh || (qh = 1, cr.exports = z1()), cr.exports;
}
var or = { exports: {} }, ht = {};
/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Lh;
function w1() {
  if (Lh) return ht;
  Lh = 1;
  var s = Ir();
  function c(S) {
    var p = "https://react.dev/errors/" + S;
    if (1 < arguments.length) {
      p += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var z = 2; z < arguments.length; z++)
        p += "&args[]=" + encodeURIComponent(arguments[z]);
    }
    return "Minified React error #" + S + "; visit " + p + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function d() {
  }
  var r = {
    d: {
      f: d,
      r: function() {
        throw Error(c(522));
      },
      D: d,
      C: d,
      L: d,
      m: d,
      X: d,
      S: d,
      M: d
    },
    p: 0,
    findDOMNode: null
  }, m = Symbol.for("react.portal");
  function h(S, p, z) {
    var E = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: m,
      key: E == null ? null : "" + E,
      children: S,
      containerInfo: p,
      implementation: z
    };
  }
  var v = s.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function T(S, p) {
    if (S === "font") return "";
    if (typeof p == "string")
      return p === "use-credentials" ? p : "";
  }
  return ht.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = r, ht.createPortal = function(S, p) {
    var z = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!p || p.nodeType !== 1 && p.nodeType !== 9 && p.nodeType !== 11)
      throw Error(c(299));
    return h(S, p, null, z);
  }, ht.flushSync = function(S) {
    var p = v.T, z = r.p;
    try {
      if (v.T = null, r.p = 2, S) return S();
    } finally {
      v.T = p, r.p = z, r.d.f();
    }
  }, ht.preconnect = function(S, p) {
    typeof S == "string" && (p ? (p = p.crossOrigin, p = typeof p == "string" ? p === "use-credentials" ? p : "" : void 0) : p = null, r.d.C(S, p));
  }, ht.prefetchDNS = function(S) {
    typeof S == "string" && r.d.D(S);
  }, ht.preinit = function(S, p) {
    if (typeof S == "string" && p && typeof p.as == "string") {
      var z = p.as, E = T(z, p.crossOrigin), Q = typeof p.integrity == "string" ? p.integrity : void 0, ee = typeof p.fetchPriority == "string" ? p.fetchPriority : void 0;
      z === "style" ? r.d.S(
        S,
        typeof p.precedence == "string" ? p.precedence : void 0,
        {
          crossOrigin: E,
          integrity: Q,
          fetchPriority: ee
        }
      ) : z === "script" && r.d.X(S, {
        crossOrigin: E,
        integrity: Q,
        fetchPriority: ee,
        nonce: typeof p.nonce == "string" ? p.nonce : void 0
      });
    }
  }, ht.preinitModule = function(S, p) {
    if (typeof S == "string")
      if (typeof p == "object" && p !== null) {
        if (p.as == null || p.as === "script") {
          var z = T(
            p.as,
            p.crossOrigin
          );
          r.d.M(S, {
            crossOrigin: z,
            integrity: typeof p.integrity == "string" ? p.integrity : void 0,
            nonce: typeof p.nonce == "string" ? p.nonce : void 0
          });
        }
      } else p == null && r.d.M(S);
  }, ht.preload = function(S, p) {
    if (typeof S == "string" && typeof p == "object" && p !== null && typeof p.as == "string") {
      var z = p.as, E = T(z, p.crossOrigin);
      r.d.L(S, z, {
        crossOrigin: E,
        integrity: typeof p.integrity == "string" ? p.integrity : void 0,
        nonce: typeof p.nonce == "string" ? p.nonce : void 0,
        type: typeof p.type == "string" ? p.type : void 0,
        fetchPriority: typeof p.fetchPriority == "string" ? p.fetchPriority : void 0,
        referrerPolicy: typeof p.referrerPolicy == "string" ? p.referrerPolicy : void 0,
        imageSrcSet: typeof p.imageSrcSet == "string" ? p.imageSrcSet : void 0,
        imageSizes: typeof p.imageSizes == "string" ? p.imageSizes : void 0,
        media: typeof p.media == "string" ? p.media : void 0
      });
    }
  }, ht.preloadModule = function(S, p) {
    if (typeof S == "string")
      if (p) {
        var z = T(p.as, p.crossOrigin);
        r.d.m(S, {
          as: typeof p.as == "string" && p.as !== "script" ? p.as : void 0,
          crossOrigin: z,
          integrity: typeof p.integrity == "string" ? p.integrity : void 0
        });
      } else r.d.m(S);
  }, ht.requestFormReset = function(S) {
    r.d.r(S);
  }, ht.unstable_batchedUpdates = function(S, p) {
    return S(p);
  }, ht.useFormState = function(S, p, z) {
    return v.H.useFormState(S, p, z);
  }, ht.useFormStatus = function() {
    return v.H.useHostTransitionStatus();
  }, ht.version = "19.2.4", ht;
}
var Bh;
function Qg() {
  if (Bh) return or.exports;
  Bh = 1;
  function s() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(s);
      } catch (c) {
        console.error(c);
      }
  }
  return s(), or.exports = w1(), or.exports;
}
/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Gh;
function I1() {
  if (Gh) return qi;
  Gh = 1;
  var s = D1(), c = Ir(), d = Qg();
  function r(e) {
    var t = "https://react.dev/errors/" + e;
    if (1 < arguments.length) {
      t += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var a = 2; a < arguments.length; a++)
        t += "&args[]=" + encodeURIComponent(arguments[a]);
    }
    return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function m(e) {
    return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
  }
  function h(e) {
    var t = e, a = e;
    if (e.alternate) for (; t.return; ) t = t.return;
    else {
      e = t;
      do
        t = e, (t.flags & 4098) !== 0 && (a = t.return), e = t.return;
      while (e);
    }
    return t.tag === 3 ? a : null;
  }
  function v(e) {
    if (e.tag === 13) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function T(e) {
    if (e.tag === 31) {
      var t = e.memoizedState;
      if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
    }
    return null;
  }
  function S(e) {
    if (h(e) !== e)
      throw Error(r(188));
  }
  function p(e) {
    var t = e.alternate;
    if (!t) {
      if (t = h(e), t === null) throw Error(r(188));
      return t !== e ? null : e;
    }
    for (var a = e, l = t; ; ) {
      var n = a.return;
      if (n === null) break;
      var i = n.alternate;
      if (i === null) {
        if (l = n.return, l !== null) {
          a = l;
          continue;
        }
        break;
      }
      if (n.child === i.child) {
        for (i = n.child; i; ) {
          if (i === a) return S(n), e;
          if (i === l) return S(n), t;
          i = i.sibling;
        }
        throw Error(r(188));
      }
      if (a.return !== l.return) a = n, l = i;
      else {
        for (var o = !1, f = n.child; f; ) {
          if (f === a) {
            o = !0, a = n, l = i;
            break;
          }
          if (f === l) {
            o = !0, l = n, a = i;
            break;
          }
          f = f.sibling;
        }
        if (!o) {
          for (f = i.child; f; ) {
            if (f === a) {
              o = !0, a = i, l = n;
              break;
            }
            if (f === l) {
              o = !0, l = i, a = n;
              break;
            }
            f = f.sibling;
          }
          if (!o) throw Error(r(189));
        }
      }
      if (a.alternate !== l) throw Error(r(190));
    }
    if (a.tag !== 3) throw Error(r(188));
    return a.stateNode.current === a ? e : t;
  }
  function z(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e;
    for (e = e.child; e !== null; ) {
      if (t = z(e), t !== null) return t;
      e = e.sibling;
    }
    return null;
  }
  var E = Object.assign, Q = Symbol.for("react.element"), ee = Symbol.for("react.transitional.element"), re = Symbol.for("react.portal"), ae = Symbol.for("react.fragment"), ye = Symbol.for("react.strict_mode"), Y = Symbol.for("react.profiler"), Z = Symbol.for("react.consumer"), $ = Symbol.for("react.context"), de = Symbol.for("react.forward_ref"), W = Symbol.for("react.suspense"), le = Symbol.for("react.suspense_list"), ne = Symbol.for("react.memo"), ke = Symbol.for("react.lazy"), ue = Symbol.for("react.activity"), Xe = Symbol.for("react.memo_cache_sentinel"), X = Symbol.iterator;
  function j(e) {
    return e === null || typeof e != "object" ? null : (e = X && e[X] || e["@@iterator"], typeof e == "function" ? e : null);
  }
  var F = Symbol.for("react.client.reference");
  function he(e) {
    if (e == null) return null;
    if (typeof e == "function")
      return e.$$typeof === F ? null : e.displayName || e.name || null;
    if (typeof e == "string") return e;
    switch (e) {
      case ae:
        return "Fragment";
      case Y:
        return "Profiler";
      case ye:
        return "StrictMode";
      case W:
        return "Suspense";
      case le:
        return "SuspenseList";
      case ue:
        return "Activity";
    }
    if (typeof e == "object")
      switch (e.$$typeof) {
        case re:
          return "Portal";
        case $:
          return e.displayName || "Context";
        case Z:
          return (e._context.displayName || "Context") + ".Consumer";
        case de:
          var t = e.render;
          return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
        case ne:
          return t = e.displayName || null, t !== null ? t : he(e.type) || "Memo";
        case ke:
          t = e._payload, e = e._init;
          try {
            return he(e(t));
          } catch {
          }
      }
    return null;
  }
  var Ee = Array.isArray, D = c.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, H = d.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, G = {
    pending: !1,
    data: null,
    method: null,
    action: null
  }, ce = [], se = -1;
  function A(e) {
    return { current: e };
  }
  function I(e) {
    0 > se || (e.current = ce[se], ce[se] = null, se--);
  }
  function K(e, t) {
    se++, ce[se] = e.current, e.current = t;
  }
  var V = A(null), P = A(null), fe = A(null), ve = A(null);
  function Je(e, t) {
    switch (K(fe, t), K(P, e), K(V, null), t.nodeType) {
      case 9:
      case 11:
        e = (e = t.documentElement) && (e = e.namespaceURI) ? th(e) : 0;
        break;
      default:
        if (e = t.tagName, t = t.namespaceURI)
          t = th(t), e = ah(t, e);
        else
          switch (e) {
            case "svg":
              e = 1;
              break;
            case "math":
              e = 2;
              break;
            default:
              e = 0;
          }
    }
    I(V), K(V, e);
  }
  function De() {
    I(V), I(P), I(fe);
  }
  function Pt(e) {
    e.memoizedState !== null && K(ve, e);
    var t = V.current, a = ah(t, e.type);
    t !== a && (K(P, e), K(V, a));
  }
  function _t(e) {
    P.current === e && (I(V), I(P)), ve.current === e && (I(ve), zi._currentValue = G);
  }
  var Qa, ga;
  function At(e) {
    if (Qa === void 0)
      try {
        throw Error();
      } catch (a) {
        var t = a.stack.trim().match(/\n( *(at )?)/);
        Qa = t && t[1] || "", ga = -1 < a.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < a.stack.indexOf("@") ? "@unknown:0:0" : "";
      }
    return `
` + Qa + e + ga;
  }
  var pa = !1;
  function ya(e, t) {
    if (!e || pa) return "";
    pa = !0;
    var a = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var l = {
        DetermineComponentFrameRoot: function() {
          try {
            if (t) {
              var L = function() {
                throw Error();
              };
              if (Object.defineProperty(L.prototype, "props", {
                set: function() {
                  throw Error();
                }
              }), typeof Reflect == "object" && Reflect.construct) {
                try {
                  Reflect.construct(L, []);
                } catch (R) {
                  var N = R;
                }
                Reflect.construct(e, [], L);
              } else {
                try {
                  L.call();
                } catch (R) {
                  N = R;
                }
                e.call(L.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (R) {
                N = R;
              }
              (L = e()) && typeof L.catch == "function" && L.catch(function() {
              });
            }
          } catch (R) {
            if (R && N && typeof R.stack == "string")
              return [R.stack, N.stack];
          }
          return [null, null];
        }
      };
      l.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var n = Object.getOwnPropertyDescriptor(
        l.DetermineComponentFrameRoot,
        "name"
      );
      n && n.configurable && Object.defineProperty(
        l.DetermineComponentFrameRoot,
        "name",
        { value: "DetermineComponentFrameRoot" }
      );
      var i = l.DetermineComponentFrameRoot(), o = i[0], f = i[1];
      if (o && f) {
        var g = o.split(`
`), M = f.split(`
`);
        for (n = l = 0; l < g.length && !g[l].includes("DetermineComponentFrameRoot"); )
          l++;
        for (; n < M.length && !M[n].includes(
          "DetermineComponentFrameRoot"
        ); )
          n++;
        if (l === g.length || n === M.length)
          for (l = g.length - 1, n = M.length - 1; 1 <= l && 0 <= n && g[l] !== M[n]; )
            n--;
        for (; 1 <= l && 0 <= n; l--, n--)
          if (g[l] !== M[n]) {
            if (l !== 1 || n !== 1)
              do
                if (l--, n--, 0 > n || g[l] !== M[n]) {
                  var O = `
` + g[l].replace(" at new ", " at ");
                  return e.displayName && O.includes("<anonymous>") && (O = O.replace("<anonymous>", e.displayName)), O;
                }
              while (1 <= l && 0 <= n);
            break;
          }
      }
    } finally {
      pa = !1, Error.prepareStackTrace = a;
    }
    return (a = e ? e.displayName || e.name : "") ? At(a) : "";
  }
  function El(e, t) {
    switch (e.tag) {
      case 26:
      case 27:
      case 5:
        return At(e.type);
      case 16:
        return At("Lazy");
      case 13:
        return e.child !== t && t !== null ? At("Suspense Fallback") : At("Suspense");
      case 19:
        return At("SuspenseList");
      case 0:
      case 15:
        return ya(e.type, !1);
      case 11:
        return ya(e.type.render, !1);
      case 1:
        return ya(e.type, !0);
      case 31:
        return At("Activity");
      default:
        return "";
    }
  }
  function va(e) {
    try {
      var t = "", a = null;
      do
        t += El(e, a), a = e, e = e.return;
      while (e);
      return t;
    } catch (l) {
      return `
Error generating stack: ` + l.message + `
` + l.stack;
    }
  }
  var $t = Object.prototype.hasOwnProperty, ua = s.unstable_scheduleCallback, ea = s.unstable_cancelCallback, Xa = s.unstable_shouldYield, bt = s.unstable_requestPaint, nt = s.unstable_now, Cl = s.unstable_getCurrentPriorityLevel, Ka = s.unstable_ImmediatePriority, it = s.unstable_UserBlockingPriority, Ut = s.unstable_NormalPriority, mt = s.unstable_LowPriority, Lt = s.unstable_IdlePriority, ta = s.log, Bt = s.unstable_setDisableYieldValue, Rt = null, pt = null;
  function ca(e) {
    if (typeof ta == "function" && Bt(e), pt && typeof pt.setStrictMode == "function")
      try {
        pt.setStrictMode(Rt, e);
      } catch {
      }
  }
  var Ze = Math.clz32 ? Math.clz32 : ss, is = Math.log, Vu = Math.LN2;
  function ss(e) {
    return e >>>= 0, e === 0 ? 32 : 31 - (is(e) / Vu | 0) | 0;
  }
  var oa = 256, Jl = 262144, Tl = 4194304;
  function Aa(e) {
    var t = e & 42;
    if (t !== 0) return t;
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
        return 64;
      case 128:
        return 128;
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
        return e & 261888;
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return e & 3932160;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return e & 62914560;
      case 67108864:
        return 67108864;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 0;
      default:
        return e;
    }
  }
  function Yl(e, t, a) {
    var l = e.pendingLanes;
    if (l === 0) return 0;
    var n = 0, i = e.suspendedLanes, o = e.pingedLanes;
    e = e.warmLanes;
    var f = l & 134217727;
    return f !== 0 ? (l = f & ~i, l !== 0 ? n = Aa(l) : (o &= f, o !== 0 ? n = Aa(o) : a || (a = f & ~e, a !== 0 && (n = Aa(a))))) : (f = l & ~i, f !== 0 ? n = Aa(f) : o !== 0 ? n = Aa(o) : a || (a = l & ~e, a !== 0 && (n = Aa(a)))), n === 0 ? 0 : t !== 0 && t !== n && (t & i) === 0 && (i = n & -n, a = t & -t, i >= a || i === 32 && (a & 4194048) !== 0) ? t : n;
  }
  function xl(e, t) {
    return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
  }
  function Ju(e, t) {
    switch (e) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 64:
        return t + 250;
      case 16:
      case 32:
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
        return -1;
      case 67108864:
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function us() {
    var e = Tl;
    return Tl <<= 1, (Tl & 62914560) === 0 && (Tl = 4194304), e;
  }
  function Fl(e) {
    for (var t = [], a = 0; 31 > a; a++) t.push(e);
    return t;
  }
  function w(e, t) {
    e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
  }
  function Me(e, t, a, l, n, i) {
    var o = e.pendingLanes;
    e.pendingLanes = a, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= a, e.entangledLanes &= a, e.errorRecoveryDisabledLanes &= a, e.shellSuspendCounter = 0;
    var f = e.entanglements, g = e.expirationTimes, M = e.hiddenUpdates;
    for (a = o & ~a; 0 < a; ) {
      var O = 31 - Ze(a), L = 1 << O;
      f[O] = 0, g[O] = -1;
      var N = M[O];
      if (N !== null)
        for (M[O] = null, O = 0; O < N.length; O++) {
          var R = N[O];
          R !== null && (R.lane &= -536870913);
        }
      a &= ~L;
    }
    l !== 0 && aa(e, l, 0), i !== 0 && n === 0 && e.tag !== 0 && (e.suspendedLanes |= i & ~(o & ~t));
  }
  function aa(e, t, a) {
    e.pendingLanes |= t, e.suspendedLanes &= ~t;
    var l = 31 - Ze(t);
    e.entangledLanes |= t, e.entanglements[l] = e.entanglements[l] | 1073741824 | a & 261930;
  }
  function ba(e, t) {
    var a = e.entangledLanes |= t;
    for (e = e.entanglements; a; ) {
      var l = 31 - Ze(a), n = 1 << l;
      n & t | e[l] & t && (e[l] |= t), a &= ~n;
    }
  }
  function Vn(e, t) {
    var a = t & -t;
    return a = (a & 42) !== 0 ? 1 : Wl(a), (a & (e.suspendedLanes | t)) !== 0 ? 0 : a;
  }
  function Wl(e) {
    switch (e) {
      case 2:
        e = 1;
        break;
      case 8:
        e = 4;
        break;
      case 32:
        e = 16;
        break;
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
        e = 128;
        break;
      case 268435456:
        e = 134217728;
        break;
      default:
        e = 0;
    }
    return e;
  }
  function Sa(e) {
    return e &= -e, 2 < e ? 8 < e ? (e & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
  }
  function Br() {
    var e = H.p;
    return e !== 0 ? e : (e = window.event, e === void 0 ? 32 : xh(e.type));
  }
  function Gr(e, t) {
    var a = H.p;
    try {
      return H.p = e, t();
    } finally {
      H.p = a;
    }
  }
  var Za = Math.random().toString(36).slice(2), ct = "__reactFiber$" + Za, St = "__reactProps$" + Za, Pl = "__reactContainer$" + Za, Yu = "__reactEvents$" + Za, g0 = "__reactListeners$" + Za, p0 = "__reactHandles$" + Za, Hr = "__reactResources$" + Za, Jn = "__reactMarker$" + Za;
  function Fu(e) {
    delete e[ct], delete e[St], delete e[Yu], delete e[g0], delete e[p0];
  }
  function _l(e) {
    var t = e[ct];
    if (t) return t;
    for (var a = e.parentNode; a; ) {
      if (t = a[Pl] || a[ct]) {
        if (a = t.alternate, t.child !== null || a !== null && a.child !== null)
          for (e = oh(e); e !== null; ) {
            if (a = e[ct]) return a;
            e = oh(e);
          }
        return t;
      }
      e = a, a = e.parentNode;
    }
    return null;
  }
  function $l(e) {
    if (e = e[ct] || e[Pl]) {
      var t = e.tag;
      if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3)
        return e;
    }
    return null;
  }
  function Yn(e) {
    var t = e.tag;
    if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
    throw Error(r(33));
  }
  function en(e) {
    var t = e[Hr];
    return t || (t = e[Hr] = { hoistableStyles: /* @__PURE__ */ new Map(), hoistableScripts: /* @__PURE__ */ new Map() }), t;
  }
  function st(e) {
    e[Jn] = !0;
  }
  var Qr = /* @__PURE__ */ new Set(), Xr = {};
  function kl(e, t) {
    tn(e, t), tn(e + "Capture", t);
  }
  function tn(e, t) {
    for (Xr[e] = t, e = 0; e < t.length; e++)
      Qr.add(t[e]);
  }
  var y0 = RegExp(
    "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"
  ), Kr = {}, Zr = {};
  function v0(e) {
    return $t.call(Zr, e) ? !0 : $t.call(Kr, e) ? !1 : y0.test(e) ? Zr[e] = !0 : (Kr[e] = !0, !1);
  }
  function cs(e, t, a) {
    if (v0(t))
      if (a === null) e.removeAttribute(t);
      else {
        switch (typeof a) {
          case "undefined":
          case "function":
          case "symbol":
            e.removeAttribute(t);
            return;
          case "boolean":
            var l = t.toLowerCase().slice(0, 5);
            if (l !== "data-" && l !== "aria-") {
              e.removeAttribute(t);
              return;
            }
        }
        e.setAttribute(t, "" + a);
      }
  }
  function os(e, t, a) {
    if (a === null) e.removeAttribute(t);
    else {
      switch (typeof a) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          e.removeAttribute(t);
          return;
      }
      e.setAttribute(t, "" + a);
    }
  }
  function Ea(e, t, a, l) {
    if (l === null) e.removeAttribute(a);
    else {
      switch (typeof l) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          e.removeAttribute(a);
          return;
      }
      e.setAttributeNS(t, a, "" + l);
    }
  }
  function Gt(e) {
    switch (typeof e) {
      case "bigint":
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
  function Vr(e) {
    var t = e.type;
    return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
  }
  function A0(e, t, a) {
    var l = Object.getOwnPropertyDescriptor(
      e.constructor.prototype,
      t
    );
    if (!e.hasOwnProperty(t) && typeof l < "u" && typeof l.get == "function" && typeof l.set == "function") {
      var n = l.get, i = l.set;
      return Object.defineProperty(e, t, {
        configurable: !0,
        get: function() {
          return n.call(this);
        },
        set: function(o) {
          a = "" + o, i.call(this, o);
        }
      }), Object.defineProperty(e, t, {
        enumerable: l.enumerable
      }), {
        getValue: function() {
          return a;
        },
        setValue: function(o) {
          a = "" + o;
        },
        stopTracking: function() {
          e._valueTracker = null, delete e[t];
        }
      };
    }
  }
  function Wu(e) {
    if (!e._valueTracker) {
      var t = Vr(e) ? "checked" : "value";
      e._valueTracker = A0(
        e,
        t,
        "" + e[t]
      );
    }
  }
  function Jr(e) {
    if (!e) return !1;
    var t = e._valueTracker;
    if (!t) return !0;
    var a = t.getValue(), l = "";
    return e && (l = Vr(e) ? e.checked ? "true" : "false" : e.value), e = l, e !== a ? (t.setValue(e), !0) : !1;
  }
  function rs(e) {
    if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  var b0 = /[\n"\\]/g;
  function Ht(e) {
    return e.replace(
      b0,
      function(t) {
        return "\\" + t.charCodeAt(0).toString(16) + " ";
      }
    );
  }
  function Pu(e, t, a, l, n, i, o, f) {
    e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t != null ? o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Gt(t)) : e.value !== "" + Gt(t) && (e.value = "" + Gt(t)) : o !== "submit" && o !== "reset" || e.removeAttribute("value"), t != null ? _u(e, o, Gt(t)) : a != null ? _u(e, o, Gt(a)) : l != null && e.removeAttribute("value"), n == null && i != null && (e.defaultChecked = !!i), n != null && (e.checked = n && typeof n != "function" && typeof n != "symbol"), f != null && typeof f != "function" && typeof f != "symbol" && typeof f != "boolean" ? e.name = "" + Gt(f) : e.removeAttribute("name");
  }
  function Yr(e, t, a, l, n, i, o, f) {
    if (i != null && typeof i != "function" && typeof i != "symbol" && typeof i != "boolean" && (e.type = i), t != null || a != null) {
      if (!(i !== "submit" && i !== "reset" || t != null)) {
        Wu(e);
        return;
      }
      a = a != null ? "" + Gt(a) : "", t = t != null ? "" + Gt(t) : a, f || t === e.value || (e.value = t), e.defaultValue = t;
    }
    l = l ?? n, l = typeof l != "function" && typeof l != "symbol" && !!l, e.checked = f ? e.checked : !!l, e.defaultChecked = !!l, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), Wu(e);
  }
  function _u(e, t, a) {
    t === "number" && rs(e.ownerDocument) === e || e.defaultValue === "" + a || (e.defaultValue = "" + a);
  }
  function an(e, t, a, l) {
    if (e = e.options, t) {
      t = {};
      for (var n = 0; n < a.length; n++)
        t["$" + a[n]] = !0;
      for (a = 0; a < e.length; a++)
        n = t.hasOwnProperty("$" + e[a].value), e[a].selected !== n && (e[a].selected = n), n && l && (e[a].defaultSelected = !0);
    } else {
      for (a = "" + Gt(a), t = null, n = 0; n < e.length; n++) {
        if (e[n].value === a) {
          e[n].selected = !0, l && (e[n].defaultSelected = !0);
          return;
        }
        t !== null || e[n].disabled || (t = e[n]);
      }
      t !== null && (t.selected = !0);
    }
  }
  function Fr(e, t, a) {
    if (t != null && (t = "" + Gt(t), t !== e.value && (e.value = t), a == null)) {
      e.defaultValue !== t && (e.defaultValue = t);
      return;
    }
    e.defaultValue = a != null ? "" + Gt(a) : "";
  }
  function Wr(e, t, a, l) {
    if (t == null) {
      if (l != null) {
        if (a != null) throw Error(r(92));
        if (Ee(l)) {
          if (1 < l.length) throw Error(r(93));
          l = l[0];
        }
        a = l;
      }
      a == null && (a = ""), t = a;
    }
    a = Gt(t), e.defaultValue = a, l = e.textContent, l === a && l !== "" && l !== null && (e.value = l), Wu(e);
  }
  function ln(e, t) {
    if (t) {
      var a = e.firstChild;
      if (a && a === e.lastChild && a.nodeType === 3) {
        a.nodeValue = t;
        return;
      }
    }
    e.textContent = t;
  }
  var S0 = new Set(
    "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
      " "
    )
  );
  function Pr(e, t, a) {
    var l = t.indexOf("--") === 0;
    a == null || typeof a == "boolean" || a === "" ? l ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : l ? e.setProperty(t, a) : typeof a != "number" || a === 0 || S0.has(t) ? t === "float" ? e.cssFloat = a : e[t] = ("" + a).trim() : e[t] = a + "px";
  }
  function _r(e, t, a) {
    if (t != null && typeof t != "object")
      throw Error(r(62));
    if (e = e.style, a != null) {
      for (var l in a)
        !a.hasOwnProperty(l) || t != null && t.hasOwnProperty(l) || (l.indexOf("--") === 0 ? e.setProperty(l, "") : l === "float" ? e.cssFloat = "" : e[l] = "");
      for (var n in t)
        l = t[n], t.hasOwnProperty(n) && a[n] !== l && Pr(e, n, l);
    } else
      for (var i in t)
        t.hasOwnProperty(i) && Pr(e, i, t[i]);
  }
  function $u(e) {
    if (e.indexOf("-") === -1) return !1;
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
  var E0 = /* @__PURE__ */ new Map([
    ["acceptCharset", "accept-charset"],
    ["htmlFor", "for"],
    ["httpEquiv", "http-equiv"],
    ["crossOrigin", "crossorigin"],
    ["accentHeight", "accent-height"],
    ["alignmentBaseline", "alignment-baseline"],
    ["arabicForm", "arabic-form"],
    ["baselineShift", "baseline-shift"],
    ["capHeight", "cap-height"],
    ["clipPath", "clip-path"],
    ["clipRule", "clip-rule"],
    ["colorInterpolation", "color-interpolation"],
    ["colorInterpolationFilters", "color-interpolation-filters"],
    ["colorProfile", "color-profile"],
    ["colorRendering", "color-rendering"],
    ["dominantBaseline", "dominant-baseline"],
    ["enableBackground", "enable-background"],
    ["fillOpacity", "fill-opacity"],
    ["fillRule", "fill-rule"],
    ["floodColor", "flood-color"],
    ["floodOpacity", "flood-opacity"],
    ["fontFamily", "font-family"],
    ["fontSize", "font-size"],
    ["fontSizeAdjust", "font-size-adjust"],
    ["fontStretch", "font-stretch"],
    ["fontStyle", "font-style"],
    ["fontVariant", "font-variant"],
    ["fontWeight", "font-weight"],
    ["glyphName", "glyph-name"],
    ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
    ["glyphOrientationVertical", "glyph-orientation-vertical"],
    ["horizAdvX", "horiz-adv-x"],
    ["horizOriginX", "horiz-origin-x"],
    ["imageRendering", "image-rendering"],
    ["letterSpacing", "letter-spacing"],
    ["lightingColor", "lighting-color"],
    ["markerEnd", "marker-end"],
    ["markerMid", "marker-mid"],
    ["markerStart", "marker-start"],
    ["overlinePosition", "overline-position"],
    ["overlineThickness", "overline-thickness"],
    ["paintOrder", "paint-order"],
    ["panose-1", "panose-1"],
    ["pointerEvents", "pointer-events"],
    ["renderingIntent", "rendering-intent"],
    ["shapeRendering", "shape-rendering"],
    ["stopColor", "stop-color"],
    ["stopOpacity", "stop-opacity"],
    ["strikethroughPosition", "strikethrough-position"],
    ["strikethroughThickness", "strikethrough-thickness"],
    ["strokeDasharray", "stroke-dasharray"],
    ["strokeDashoffset", "stroke-dashoffset"],
    ["strokeLinecap", "stroke-linecap"],
    ["strokeLinejoin", "stroke-linejoin"],
    ["strokeMiterlimit", "stroke-miterlimit"],
    ["strokeOpacity", "stroke-opacity"],
    ["strokeWidth", "stroke-width"],
    ["textAnchor", "text-anchor"],
    ["textDecoration", "text-decoration"],
    ["textRendering", "text-rendering"],
    ["transformOrigin", "transform-origin"],
    ["underlinePosition", "underline-position"],
    ["underlineThickness", "underline-thickness"],
    ["unicodeBidi", "unicode-bidi"],
    ["unicodeRange", "unicode-range"],
    ["unitsPerEm", "units-per-em"],
    ["vAlphabetic", "v-alphabetic"],
    ["vHanging", "v-hanging"],
    ["vIdeographic", "v-ideographic"],
    ["vMathematical", "v-mathematical"],
    ["vectorEffect", "vector-effect"],
    ["vertAdvY", "vert-adv-y"],
    ["vertOriginX", "vert-origin-x"],
    ["vertOriginY", "vert-origin-y"],
    ["wordSpacing", "word-spacing"],
    ["writingMode", "writing-mode"],
    ["xmlnsXlink", "xmlns:xlink"],
    ["xHeight", "x-height"]
  ]), C0 = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function ds(e) {
    return C0.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
  }
  function Ca() {
  }
  var ec = null;
  function tc(e) {
    return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
  }
  var nn = null, sn = null;
  function $r(e) {
    var t = $l(e);
    if (t && (e = t.stateNode)) {
      var a = e[St] || null;
      e: switch (e = t.stateNode, t.type) {
        case "input":
          if (Pu(
            e,
            a.value,
            a.defaultValue,
            a.defaultValue,
            a.checked,
            a.defaultChecked,
            a.type,
            a.name
          ), t = a.name, a.type === "radio" && t != null) {
            for (a = e; a.parentNode; ) a = a.parentNode;
            for (a = a.querySelectorAll(
              'input[name="' + Ht(
                "" + t
              ) + '"][type="radio"]'
            ), t = 0; t < a.length; t++) {
              var l = a[t];
              if (l !== e && l.form === e.form) {
                var n = l[St] || null;
                if (!n) throw Error(r(90));
                Pu(
                  l,
                  n.value,
                  n.defaultValue,
                  n.defaultValue,
                  n.checked,
                  n.defaultChecked,
                  n.type,
                  n.name
                );
              }
            }
            for (t = 0; t < a.length; t++)
              l = a[t], l.form === e.form && Jr(l);
          }
          break e;
        case "textarea":
          Fr(e, a.value, a.defaultValue);
          break e;
        case "select":
          t = a.value, t != null && an(e, !!a.multiple, t, !1);
      }
    }
  }
  var ac = !1;
  function ed(e, t, a) {
    if (ac) return e(t, a);
    ac = !0;
    try {
      var l = e(t);
      return l;
    } finally {
      if (ac = !1, (nn !== null || sn !== null) && (_s(), nn && (t = nn, e = sn, sn = nn = null, $r(t), e)))
        for (t = 0; t < e.length; t++) $r(e[t]);
    }
  }
  function Fn(e, t) {
    var a = e.stateNode;
    if (a === null) return null;
    var l = a[St] || null;
    if (l === null) return null;
    a = l[t];
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
        (l = !l.disabled) || (e = e.type, l = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !l;
        break e;
      default:
        e = !1;
    }
    if (e) return null;
    if (a && typeof a != "function")
      throw Error(
        r(231, t, typeof a)
      );
    return a;
  }
  var Ta = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), lc = !1;
  if (Ta)
    try {
      var Wn = {};
      Object.defineProperty(Wn, "passive", {
        get: function() {
          lc = !0;
        }
      }), window.addEventListener("test", Wn, Wn), window.removeEventListener("test", Wn, Wn);
    } catch {
      lc = !1;
    }
  var Va = null, nc = null, fs = null;
  function td() {
    if (fs) return fs;
    var e, t = nc, a = t.length, l, n = "value" in Va ? Va.value : Va.textContent, i = n.length;
    for (e = 0; e < a && t[e] === n[e]; e++) ;
    var o = a - e;
    for (l = 1; l <= o && t[a - l] === n[i - l]; l++) ;
    return fs = n.slice(e, 1 < l ? 1 - l : void 0);
  }
  function ms(e) {
    var t = e.keyCode;
    return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
  }
  function hs() {
    return !0;
  }
  function ad() {
    return !1;
  }
  function Et(e) {
    function t(a, l, n, i, o) {
      this._reactName = a, this._targetInst = n, this.type = l, this.nativeEvent = i, this.target = o, this.currentTarget = null;
      for (var f in e)
        e.hasOwnProperty(f) && (a = e[f], this[f] = a ? a(i) : i[f]);
      return this.isDefaultPrevented = (i.defaultPrevented != null ? i.defaultPrevented : i.returnValue === !1) ? hs : ad, this.isPropagationStopped = ad, this;
    }
    return E(t.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var a = this.nativeEvent;
        a && (a.preventDefault ? a.preventDefault() : typeof a.returnValue != "unknown" && (a.returnValue = !1), this.isDefaultPrevented = hs);
      },
      stopPropagation: function() {
        var a = this.nativeEvent;
        a && (a.stopPropagation ? a.stopPropagation() : typeof a.cancelBubble != "unknown" && (a.cancelBubble = !0), this.isPropagationStopped = hs);
      },
      persist: function() {
      },
      isPersistent: hs
    }), t;
  }
  var Ml = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function(e) {
      return e.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
  }, gs = Et(Ml), Pn = E({}, Ml, { view: 0, detail: 0 }), T0 = Et(Pn), ic, sc, _n, ps = E({}, Pn, {
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
    getModifierState: cc,
    button: 0,
    buttons: 0,
    relatedTarget: function(e) {
      return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
    },
    movementX: function(e) {
      return "movementX" in e ? e.movementX : (e !== _n && (_n && e.type === "mousemove" ? (ic = e.screenX - _n.screenX, sc = e.screenY - _n.screenY) : sc = ic = 0, _n = e), ic);
    },
    movementY: function(e) {
      return "movementY" in e ? e.movementY : sc;
    }
  }), ld = Et(ps), x0 = E({}, ps, { dataTransfer: 0 }), k0 = Et(x0), M0 = E({}, Pn, { relatedTarget: 0 }), uc = Et(M0), N0 = E({}, Ml, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), U0 = Et(N0), R0 = E({}, Ml, {
    clipboardData: function(e) {
      return "clipboardData" in e ? e.clipboardData : window.clipboardData;
    }
  }), D0 = Et(R0), z0 = E({}, Ml, { data: 0 }), nd = Et(z0), w0 = {
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
    MozPrintableKey: "Unidentified"
  }, I0 = {
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
    224: "Meta"
  }, j0 = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
  function O0(e) {
    var t = this.nativeEvent;
    return t.getModifierState ? t.getModifierState(e) : (e = j0[e]) ? !!t[e] : !1;
  }
  function cc() {
    return O0;
  }
  var q0 = E({}, Pn, {
    key: function(e) {
      if (e.key) {
        var t = w0[e.key] || e.key;
        if (t !== "Unidentified") return t;
      }
      return e.type === "keypress" ? (e = ms(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? I0[e.keyCode] || "Unidentified" : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: cc,
    charCode: function(e) {
      return e.type === "keypress" ? ms(e) : 0;
    },
    keyCode: function(e) {
      return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    },
    which: function(e) {
      return e.type === "keypress" ? ms(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
    }
  }), L0 = Et(q0), B0 = E({}, ps, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0
  }), id = Et(B0), G0 = E({}, Pn, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: cc
  }), H0 = Et(G0), Q0 = E({}, Ml, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), X0 = Et(Q0), K0 = E({}, ps, {
    deltaX: function(e) {
      return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function(e) {
      return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }), Z0 = Et(K0), V0 = E({}, Ml, {
    newState: 0,
    oldState: 0
  }), J0 = Et(V0), Y0 = [9, 13, 27, 32], oc = Ta && "CompositionEvent" in window, $n = null;
  Ta && "documentMode" in document && ($n = document.documentMode);
  var F0 = Ta && "TextEvent" in window && !$n, sd = Ta && (!oc || $n && 8 < $n && 11 >= $n), ud = " ", cd = !1;
  function od(e, t) {
    switch (e) {
      case "keyup":
        return Y0.indexOf(t.keyCode) !== -1;
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
  function rd(e) {
    return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
  }
  var un = !1;
  function W0(e, t) {
    switch (e) {
      case "compositionend":
        return rd(t);
      case "keypress":
        return t.which !== 32 ? null : (cd = !0, ud);
      case "textInput":
        return e = t.data, e === ud && cd ? null : e;
      default:
        return null;
    }
  }
  function P0(e, t) {
    if (un)
      return e === "compositionend" || !oc && od(e, t) ? (e = td(), fs = nc = Va = null, un = !1, e) : null;
    switch (e) {
      case "paste":
        return null;
      case "keypress":
        if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
          if (t.char && 1 < t.char.length)
            return t.char;
          if (t.which) return String.fromCharCode(t.which);
        }
        return null;
      case "compositionend":
        return sd && t.locale !== "ko" ? null : t.data;
      default:
        return null;
    }
  }
  var _0 = {
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
    week: !0
  };
  function dd(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t === "input" ? !!_0[e.type] : t === "textarea";
  }
  function fd(e, t, a, l) {
    nn ? sn ? sn.push(l) : sn = [l] : nn = l, t = iu(t, "onChange"), 0 < t.length && (a = new gs(
      "onChange",
      "change",
      null,
      a,
      l
    ), e.push({ event: a, listeners: t }));
  }
  var ei = null, ti = null;
  function $0(e) {
    Fm(e, 0);
  }
  function ys(e) {
    var t = Yn(e);
    if (Jr(t)) return e;
  }
  function md(e, t) {
    if (e === "change") return t;
  }
  var hd = !1;
  if (Ta) {
    var rc;
    if (Ta) {
      var dc = "oninput" in document;
      if (!dc) {
        var gd = document.createElement("div");
        gd.setAttribute("oninput", "return;"), dc = typeof gd.oninput == "function";
      }
      rc = dc;
    } else rc = !1;
    hd = rc && (!document.documentMode || 9 < document.documentMode);
  }
  function pd() {
    ei && (ei.detachEvent("onpropertychange", yd), ti = ei = null);
  }
  function yd(e) {
    if (e.propertyName === "value" && ys(ti)) {
      var t = [];
      fd(
        t,
        ti,
        e,
        tc(e)
      ), ed($0, t);
    }
  }
  function ep(e, t, a) {
    e === "focusin" ? (pd(), ei = t, ti = a, ei.attachEvent("onpropertychange", yd)) : e === "focusout" && pd();
  }
  function tp(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown")
      return ys(ti);
  }
  function ap(e, t) {
    if (e === "click") return ys(t);
  }
  function lp(e, t) {
    if (e === "input" || e === "change")
      return ys(t);
  }
  function np(e, t) {
    return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
  }
  var Dt = typeof Object.is == "function" ? Object.is : np;
  function ai(e, t) {
    if (Dt(e, t)) return !0;
    if (typeof e != "object" || e === null || typeof t != "object" || t === null)
      return !1;
    var a = Object.keys(e), l = Object.keys(t);
    if (a.length !== l.length) return !1;
    for (l = 0; l < a.length; l++) {
      var n = a[l];
      if (!$t.call(t, n) || !Dt(e[n], t[n]))
        return !1;
    }
    return !0;
  }
  function vd(e) {
    for (; e && e.firstChild; ) e = e.firstChild;
    return e;
  }
  function Ad(e, t) {
    var a = vd(e);
    e = 0;
    for (var l; a; ) {
      if (a.nodeType === 3) {
        if (l = e + a.textContent.length, e <= t && l >= t)
          return { node: a, offset: t - e };
        e = l;
      }
      e: {
        for (; a; ) {
          if (a.nextSibling) {
            a = a.nextSibling;
            break e;
          }
          a = a.parentNode;
        }
        a = void 0;
      }
      a = vd(a);
    }
  }
  function bd(e, t) {
    return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? bd(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
  }
  function Sd(e) {
    e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
    for (var t = rs(e.document); t instanceof e.HTMLIFrameElement; ) {
      try {
        var a = typeof t.contentWindow.location.href == "string";
      } catch {
        a = !1;
      }
      if (a) e = t.contentWindow;
      else break;
      t = rs(e.document);
    }
    return t;
  }
  function fc(e) {
    var t = e && e.nodeName && e.nodeName.toLowerCase();
    return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
  }
  var ip = Ta && "documentMode" in document && 11 >= document.documentMode, cn = null, mc = null, li = null, hc = !1;
  function Ed(e, t, a) {
    var l = a.window === a ? a.document : a.nodeType === 9 ? a : a.ownerDocument;
    hc || cn == null || cn !== rs(l) || (l = cn, "selectionStart" in l && fc(l) ? l = { start: l.selectionStart, end: l.selectionEnd } : (l = (l.ownerDocument && l.ownerDocument.defaultView || window).getSelection(), l = {
      anchorNode: l.anchorNode,
      anchorOffset: l.anchorOffset,
      focusNode: l.focusNode,
      focusOffset: l.focusOffset
    }), li && ai(li, l) || (li = l, l = iu(mc, "onSelect"), 0 < l.length && (t = new gs(
      "onSelect",
      "select",
      null,
      t,
      a
    ), e.push({ event: t, listeners: l }), t.target = cn)));
  }
  function Nl(e, t) {
    var a = {};
    return a[e.toLowerCase()] = t.toLowerCase(), a["Webkit" + e] = "webkit" + t, a["Moz" + e] = "moz" + t, a;
  }
  var on = {
    animationend: Nl("Animation", "AnimationEnd"),
    animationiteration: Nl("Animation", "AnimationIteration"),
    animationstart: Nl("Animation", "AnimationStart"),
    transitionrun: Nl("Transition", "TransitionRun"),
    transitionstart: Nl("Transition", "TransitionStart"),
    transitioncancel: Nl("Transition", "TransitionCancel"),
    transitionend: Nl("Transition", "TransitionEnd")
  }, gc = {}, Cd = {};
  Ta && (Cd = document.createElement("div").style, "AnimationEvent" in window || (delete on.animationend.animation, delete on.animationiteration.animation, delete on.animationstart.animation), "TransitionEvent" in window || delete on.transitionend.transition);
  function Ul(e) {
    if (gc[e]) return gc[e];
    if (!on[e]) return e;
    var t = on[e], a;
    for (a in t)
      if (t.hasOwnProperty(a) && a in Cd)
        return gc[e] = t[a];
    return e;
  }
  var Td = Ul("animationend"), xd = Ul("animationiteration"), kd = Ul("animationstart"), sp = Ul("transitionrun"), up = Ul("transitionstart"), cp = Ul("transitioncancel"), Md = Ul("transitionend"), Nd = /* @__PURE__ */ new Map(), pc = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
    " "
  );
  pc.push("scrollEnd");
  function la(e, t) {
    Nd.set(e, t), kl(t, [e]);
  }
  var vs = typeof reportError == "function" ? reportError : function(e) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var t = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof e == "object" && e !== null && typeof e.message == "string" ? String(e.message) : String(e),
        error: e
      });
      if (!window.dispatchEvent(t)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", e);
      return;
    }
    console.error(e);
  }, Qt = [], rn = 0, yc = 0;
  function As() {
    for (var e = rn, t = yc = rn = 0; t < e; ) {
      var a = Qt[t];
      Qt[t++] = null;
      var l = Qt[t];
      Qt[t++] = null;
      var n = Qt[t];
      Qt[t++] = null;
      var i = Qt[t];
      if (Qt[t++] = null, l !== null && n !== null) {
        var o = l.pending;
        o === null ? n.next = n : (n.next = o.next, o.next = n), l.pending = n;
      }
      i !== 0 && Ud(a, n, i);
    }
  }
  function bs(e, t, a, l) {
    Qt[rn++] = e, Qt[rn++] = t, Qt[rn++] = a, Qt[rn++] = l, yc |= l, e.lanes |= l, e = e.alternate, e !== null && (e.lanes |= l);
  }
  function vc(e, t, a, l) {
    return bs(e, t, a, l), Ss(e);
  }
  function Rl(e, t) {
    return bs(e, null, null, t), Ss(e);
  }
  function Ud(e, t, a) {
    e.lanes |= a;
    var l = e.alternate;
    l !== null && (l.lanes |= a);
    for (var n = !1, i = e.return; i !== null; )
      i.childLanes |= a, l = i.alternate, l !== null && (l.childLanes |= a), i.tag === 22 && (e = i.stateNode, e === null || e._visibility & 1 || (n = !0)), e = i, i = i.return;
    return e.tag === 3 ? (i = e.stateNode, n && t !== null && (n = 31 - Ze(a), e = i.hiddenUpdates, l = e[n], l === null ? e[n] = [t] : l.push(t), t.lane = a | 536870912), i) : null;
  }
  function Ss(e) {
    if (50 < xi)
      throw xi = 0, No = null, Error(r(185));
    for (var t = e.return; t !== null; )
      e = t, t = e.return;
    return e.tag === 3 ? e.stateNode : null;
  }
  var dn = {};
  function op(e, t, a, l) {
    this.tag = e, this.key = a, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = l, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function zt(e, t, a, l) {
    return new op(e, t, a, l);
  }
  function Ac(e) {
    return e = e.prototype, !(!e || !e.isReactComponent);
  }
  function xa(e, t) {
    var a = e.alternate;
    return a === null ? (a = zt(
      e.tag,
      t,
      e.key,
      e.mode
    ), a.elementType = e.elementType, a.type = e.type, a.stateNode = e.stateNode, a.alternate = e, e.alternate = a) : (a.pendingProps = t, a.type = e.type, a.flags = 0, a.subtreeFlags = 0, a.deletions = null), a.flags = e.flags & 65011712, a.childLanes = e.childLanes, a.lanes = e.lanes, a.child = e.child, a.memoizedProps = e.memoizedProps, a.memoizedState = e.memoizedState, a.updateQueue = e.updateQueue, t = e.dependencies, a.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, a.sibling = e.sibling, a.index = e.index, a.ref = e.ref, a.refCleanup = e.refCleanup, a;
  }
  function Rd(e, t) {
    e.flags &= 65011714;
    var a = e.alternate;
    return a === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = a.childLanes, e.lanes = a.lanes, e.child = a.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = a.memoizedProps, e.memoizedState = a.memoizedState, e.updateQueue = a.updateQueue, e.type = a.type, t = a.dependencies, e.dependencies = t === null ? null : {
      lanes: t.lanes,
      firstContext: t.firstContext
    }), e;
  }
  function Es(e, t, a, l, n, i) {
    var o = 0;
    if (l = e, typeof e == "function") Ac(e) && (o = 1);
    else if (typeof e == "string")
      o = h1(
        e,
        a,
        V.current
      ) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
    else
      e: switch (e) {
        case ue:
          return e = zt(31, a, t, n), e.elementType = ue, e.lanes = i, e;
        case ae:
          return Dl(a.children, n, i, t);
        case ye:
          o = 8, n |= 24;
          break;
        case Y:
          return e = zt(12, a, t, n | 2), e.elementType = Y, e.lanes = i, e;
        case W:
          return e = zt(13, a, t, n), e.elementType = W, e.lanes = i, e;
        case le:
          return e = zt(19, a, t, n), e.elementType = le, e.lanes = i, e;
        default:
          if (typeof e == "object" && e !== null)
            switch (e.$$typeof) {
              case $:
                o = 10;
                break e;
              case Z:
                o = 9;
                break e;
              case de:
                o = 11;
                break e;
              case ne:
                o = 14;
                break e;
              case ke:
                o = 16, l = null;
                break e;
            }
          o = 29, a = Error(
            r(130, e === null ? "null" : typeof e, "")
          ), l = null;
      }
    return t = zt(o, a, t, n), t.elementType = e, t.type = l, t.lanes = i, t;
  }
  function Dl(e, t, a, l) {
    return e = zt(7, e, l, t), e.lanes = a, e;
  }
  function bc(e, t, a) {
    return e = zt(6, e, null, t), e.lanes = a, e;
  }
  function Dd(e) {
    var t = zt(18, null, null, 0);
    return t.stateNode = e, t;
  }
  function Sc(e, t, a) {
    return t = zt(
      4,
      e.children !== null ? e.children : [],
      e.key,
      t
    ), t.lanes = a, t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation
    }, t;
  }
  var zd = /* @__PURE__ */ new WeakMap();
  function Xt(e, t) {
    if (typeof e == "object" && e !== null) {
      var a = zd.get(e);
      return a !== void 0 ? a : (t = {
        value: e,
        source: t,
        stack: va(t)
      }, zd.set(e, t), t);
    }
    return {
      value: e,
      source: t,
      stack: va(t)
    };
  }
  var fn = [], mn = 0, Cs = null, ni = 0, Kt = [], Zt = 0, Ja = null, ra = 1, da = "";
  function ka(e, t) {
    fn[mn++] = ni, fn[mn++] = Cs, Cs = e, ni = t;
  }
  function wd(e, t, a) {
    Kt[Zt++] = ra, Kt[Zt++] = da, Kt[Zt++] = Ja, Ja = e;
    var l = ra;
    e = da;
    var n = 32 - Ze(l) - 1;
    l &= ~(1 << n), a += 1;
    var i = 32 - Ze(t) + n;
    if (30 < i) {
      var o = n - n % 5;
      i = (l & (1 << o) - 1).toString(32), l >>= o, n -= o, ra = 1 << 32 - Ze(t) + n | a << n | l, da = i + e;
    } else
      ra = 1 << i | a << n | l, da = e;
  }
  function Ec(e) {
    e.return !== null && (ka(e, 1), wd(e, 1, 0));
  }
  function Cc(e) {
    for (; e === Cs; )
      Cs = fn[--mn], fn[mn] = null, ni = fn[--mn], fn[mn] = null;
    for (; e === Ja; )
      Ja = Kt[--Zt], Kt[Zt] = null, da = Kt[--Zt], Kt[Zt] = null, ra = Kt[--Zt], Kt[Zt] = null;
  }
  function Id(e, t) {
    Kt[Zt++] = ra, Kt[Zt++] = da, Kt[Zt++] = Ja, ra = t.id, da = t.overflow, Ja = e;
  }
  var ot = null, Be = null, xe = !1, Ya = null, Vt = !1, Tc = Error(r(519));
  function Fa(e) {
    var t = Error(
      r(
        418,
        1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML",
        ""
      )
    );
    throw ii(Xt(t, e)), Tc;
  }
  function jd(e) {
    var t = e.stateNode, a = e.type, l = e.memoizedProps;
    switch (t[ct] = e, t[St] = l, a) {
      case "dialog":
        Se("cancel", t), Se("close", t);
        break;
      case "iframe":
      case "object":
      case "embed":
        Se("load", t);
        break;
      case "video":
      case "audio":
        for (a = 0; a < Mi.length; a++)
          Se(Mi[a], t);
        break;
      case "source":
        Se("error", t);
        break;
      case "img":
      case "image":
      case "link":
        Se("error", t), Se("load", t);
        break;
      case "details":
        Se("toggle", t);
        break;
      case "input":
        Se("invalid", t), Yr(
          t,
          l.value,
          l.defaultValue,
          l.checked,
          l.defaultChecked,
          l.type,
          l.name,
          !0
        );
        break;
      case "select":
        Se("invalid", t);
        break;
      case "textarea":
        Se("invalid", t), Wr(t, l.value, l.defaultValue, l.children);
    }
    a = l.children, typeof a != "string" && typeof a != "number" && typeof a != "bigint" || t.textContent === "" + a || l.suppressHydrationWarning === !0 || $m(t.textContent, a) ? (l.popover != null && (Se("beforetoggle", t), Se("toggle", t)), l.onScroll != null && Se("scroll", t), l.onScrollEnd != null && Se("scrollend", t), l.onClick != null && (t.onclick = Ca), t = !0) : t = !1, t || Fa(e, !0);
  }
  function Od(e) {
    for (ot = e.return; ot; )
      switch (ot.tag) {
        case 5:
        case 31:
        case 13:
          Vt = !1;
          return;
        case 27:
        case 3:
          Vt = !0;
          return;
        default:
          ot = ot.return;
      }
  }
  function hn(e) {
    if (e !== ot) return !1;
    if (!xe) return Od(e), xe = !0, !1;
    var t = e.tag, a;
    if ((a = t !== 3 && t !== 27) && ((a = t === 5) && (a = e.type, a = !(a !== "form" && a !== "button") || Xo(e.type, e.memoizedProps)), a = !a), a && Be && Fa(e), Od(e), t === 13) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(r(317));
      Be = ch(e);
    } else if (t === 31) {
      if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(r(317));
      Be = ch(e);
    } else
      t === 27 ? (t = Be, ol(e.type) ? (e = Yo, Yo = null, Be = e) : Be = t) : Be = ot ? Yt(e.stateNode.nextSibling) : null;
    return !0;
  }
  function zl() {
    Be = ot = null, xe = !1;
  }
  function xc() {
    var e = Ya;
    return e !== null && (kt === null ? kt = e : kt.push.apply(
      kt,
      e
    ), Ya = null), e;
  }
  function ii(e) {
    Ya === null ? Ya = [e] : Ya.push(e);
  }
  var kc = A(null), wl = null, Ma = null;
  function Wa(e, t, a) {
    K(kc, t._currentValue), t._currentValue = a;
  }
  function Na(e) {
    e._currentValue = kc.current, I(kc);
  }
  function Mc(e, t, a) {
    for (; e !== null; ) {
      var l = e.alternate;
      if ((e.childLanes & t) !== t ? (e.childLanes |= t, l !== null && (l.childLanes |= t)) : l !== null && (l.childLanes & t) !== t && (l.childLanes |= t), e === a) break;
      e = e.return;
    }
  }
  function Nc(e, t, a, l) {
    var n = e.child;
    for (n !== null && (n.return = e); n !== null; ) {
      var i = n.dependencies;
      if (i !== null) {
        var o = n.child;
        i = i.firstContext;
        e: for (; i !== null; ) {
          var f = i;
          i = n;
          for (var g = 0; g < t.length; g++)
            if (f.context === t[g]) {
              i.lanes |= a, f = i.alternate, f !== null && (f.lanes |= a), Mc(
                i.return,
                a,
                e
              ), l || (o = null);
              break e;
            }
          i = f.next;
        }
      } else if (n.tag === 18) {
        if (o = n.return, o === null) throw Error(r(341));
        o.lanes |= a, i = o.alternate, i !== null && (i.lanes |= a), Mc(o, a, e), o = null;
      } else o = n.child;
      if (o !== null) o.return = n;
      else
        for (o = n; o !== null; ) {
          if (o === e) {
            o = null;
            break;
          }
          if (n = o.sibling, n !== null) {
            n.return = o.return, o = n;
            break;
          }
          o = o.return;
        }
      n = o;
    }
  }
  function gn(e, t, a, l) {
    e = null;
    for (var n = t, i = !1; n !== null; ) {
      if (!i) {
        if ((n.flags & 524288) !== 0) i = !0;
        else if ((n.flags & 262144) !== 0) break;
      }
      if (n.tag === 10) {
        var o = n.alternate;
        if (o === null) throw Error(r(387));
        if (o = o.memoizedProps, o !== null) {
          var f = n.type;
          Dt(n.pendingProps.value, o.value) || (e !== null ? e.push(f) : e = [f]);
        }
      } else if (n === ve.current) {
        if (o = n.alternate, o === null) throw Error(r(387));
        o.memoizedState.memoizedState !== n.memoizedState.memoizedState && (e !== null ? e.push(zi) : e = [zi]);
      }
      n = n.return;
    }
    e !== null && Nc(
      t,
      e,
      a,
      l
    ), t.flags |= 262144;
  }
  function Ts(e) {
    for (e = e.firstContext; e !== null; ) {
      if (!Dt(
        e.context._currentValue,
        e.memoizedValue
      ))
        return !0;
      e = e.next;
    }
    return !1;
  }
  function Il(e) {
    wl = e, Ma = null, e = e.dependencies, e !== null && (e.firstContext = null);
  }
  function rt(e) {
    return qd(wl, e);
  }
  function xs(e, t) {
    return wl === null && Il(e), qd(e, t);
  }
  function qd(e, t) {
    var a = t._currentValue;
    if (t = { context: t, memoizedValue: a, next: null }, Ma === null) {
      if (e === null) throw Error(r(308));
      Ma = t, e.dependencies = { lanes: 0, firstContext: t }, e.flags |= 524288;
    } else Ma = Ma.next = t;
    return a;
  }
  var rp = typeof AbortController < "u" ? AbortController : function() {
    var e = [], t = this.signal = {
      aborted: !1,
      addEventListener: function(a, l) {
        e.push(l);
      }
    };
    this.abort = function() {
      t.aborted = !0, e.forEach(function(a) {
        return a();
      });
    };
  }, dp = s.unstable_scheduleCallback, fp = s.unstable_NormalPriority, _e = {
    $$typeof: $,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  };
  function Uc() {
    return {
      controller: new rp(),
      data: /* @__PURE__ */ new Map(),
      refCount: 0
    };
  }
  function si(e) {
    e.refCount--, e.refCount === 0 && dp(fp, function() {
      e.controller.abort();
    });
  }
  var ui = null, Rc = 0, pn = 0, yn = null;
  function mp(e, t) {
    if (ui === null) {
      var a = ui = [];
      Rc = 0, pn = Io(), yn = {
        status: "pending",
        value: void 0,
        then: function(l) {
          a.push(l);
        }
      };
    }
    return Rc++, t.then(Ld, Ld), t;
  }
  function Ld() {
    if (--Rc === 0 && ui !== null) {
      yn !== null && (yn.status = "fulfilled");
      var e = ui;
      ui = null, pn = 0, yn = null;
      for (var t = 0; t < e.length; t++) (0, e[t])();
    }
  }
  function hp(e, t) {
    var a = [], l = {
      status: "pending",
      value: null,
      reason: null,
      then: function(n) {
        a.push(n);
      }
    };
    return e.then(
      function() {
        l.status = "fulfilled", l.value = t;
        for (var n = 0; n < a.length; n++) (0, a[n])(t);
      },
      function(n) {
        for (l.status = "rejected", l.reason = n, n = 0; n < a.length; n++)
          (0, a[n])(void 0);
      }
    ), l;
  }
  var Bd = D.S;
  D.S = function(e, t) {
    Cm = nt(), typeof t == "object" && t !== null && typeof t.then == "function" && mp(e, t), Bd !== null && Bd(e, t);
  };
  var jl = A(null);
  function Dc() {
    var e = jl.current;
    return e !== null ? e : Le.pooledCache;
  }
  function ks(e, t) {
    t === null ? K(jl, jl.current) : K(jl, t.pool);
  }
  function Gd() {
    var e = Dc();
    return e === null ? null : { parent: _e._currentValue, pool: e };
  }
  var vn = Error(r(460)), zc = Error(r(474)), Ms = Error(r(542)), Ns = { then: function() {
  } };
  function Hd(e) {
    return e = e.status, e === "fulfilled" || e === "rejected";
  }
  function Qd(e, t, a) {
    switch (a = e[a], a === void 0 ? e.push(t) : a !== t && (t.then(Ca, Ca), t = a), t.status) {
      case "fulfilled":
        return t.value;
      case "rejected":
        throw e = t.reason, Kd(e), e;
      default:
        if (typeof t.status == "string") t.then(Ca, Ca);
        else {
          if (e = Le, e !== null && 100 < e.shellSuspendCounter)
            throw Error(r(482));
          e = t, e.status = "pending", e.then(
            function(l) {
              if (t.status === "pending") {
                var n = t;
                n.status = "fulfilled", n.value = l;
              }
            },
            function(l) {
              if (t.status === "pending") {
                var n = t;
                n.status = "rejected", n.reason = l;
              }
            }
          );
        }
        switch (t.status) {
          case "fulfilled":
            return t.value;
          case "rejected":
            throw e = t.reason, Kd(e), e;
        }
        throw ql = t, vn;
    }
  }
  function Ol(e) {
    try {
      var t = e._init;
      return t(e._payload);
    } catch (a) {
      throw a !== null && typeof a == "object" && typeof a.then == "function" ? (ql = a, vn) : a;
    }
  }
  var ql = null;
  function Xd() {
    if (ql === null) throw Error(r(459));
    var e = ql;
    return ql = null, e;
  }
  function Kd(e) {
    if (e === vn || e === Ms)
      throw Error(r(483));
  }
  var An = null, ci = 0;
  function Us(e) {
    var t = ci;
    return ci += 1, An === null && (An = []), Qd(An, e, t);
  }
  function oi(e, t) {
    t = t.props.ref, e.ref = t !== void 0 ? t : null;
  }
  function Rs(e, t) {
    throw t.$$typeof === Q ? Error(r(525)) : (e = Object.prototype.toString.call(t), Error(
      r(
        31,
        e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e
      )
    ));
  }
  function Zd(e) {
    function t(x, b) {
      if (e) {
        var k = x.deletions;
        k === null ? (x.deletions = [b], x.flags |= 16) : k.push(b);
      }
    }
    function a(x, b) {
      if (!e) return null;
      for (; b !== null; )
        t(x, b), b = b.sibling;
      return null;
    }
    function l(x) {
      for (var b = /* @__PURE__ */ new Map(); x !== null; )
        x.key !== null ? b.set(x.key, x) : b.set(x.index, x), x = x.sibling;
      return b;
    }
    function n(x, b) {
      return x = xa(x, b), x.index = 0, x.sibling = null, x;
    }
    function i(x, b, k) {
      return x.index = k, e ? (k = x.alternate, k !== null ? (k = k.index, k < b ? (x.flags |= 67108866, b) : k) : (x.flags |= 67108866, b)) : (x.flags |= 1048576, b);
    }
    function o(x) {
      return e && x.alternate === null && (x.flags |= 67108866), x;
    }
    function f(x, b, k, q) {
      return b === null || b.tag !== 6 ? (b = bc(k, x.mode, q), b.return = x, b) : (b = n(b, k), b.return = x, b);
    }
    function g(x, b, k, q) {
      var ie = k.type;
      return ie === ae ? O(
        x,
        b,
        k.props.children,
        q,
        k.key
      ) : b !== null && (b.elementType === ie || typeof ie == "object" && ie !== null && ie.$$typeof === ke && Ol(ie) === b.type) ? (b = n(b, k.props), oi(b, k), b.return = x, b) : (b = Es(
        k.type,
        k.key,
        k.props,
        null,
        x.mode,
        q
      ), oi(b, k), b.return = x, b);
    }
    function M(x, b, k, q) {
      return b === null || b.tag !== 4 || b.stateNode.containerInfo !== k.containerInfo || b.stateNode.implementation !== k.implementation ? (b = Sc(k, x.mode, q), b.return = x, b) : (b = n(b, k.children || []), b.return = x, b);
    }
    function O(x, b, k, q, ie) {
      return b === null || b.tag !== 7 ? (b = Dl(
        k,
        x.mode,
        q,
        ie
      ), b.return = x, b) : (b = n(b, k), b.return = x, b);
    }
    function L(x, b, k) {
      if (typeof b == "string" && b !== "" || typeof b == "number" || typeof b == "bigint")
        return b = bc(
          "" + b,
          x.mode,
          k
        ), b.return = x, b;
      if (typeof b == "object" && b !== null) {
        switch (b.$$typeof) {
          case ee:
            return k = Es(
              b.type,
              b.key,
              b.props,
              null,
              x.mode,
              k
            ), oi(k, b), k.return = x, k;
          case re:
            return b = Sc(
              b,
              x.mode,
              k
            ), b.return = x, b;
          case ke:
            return b = Ol(b), L(x, b, k);
        }
        if (Ee(b) || j(b))
          return b = Dl(
            b,
            x.mode,
            k,
            null
          ), b.return = x, b;
        if (typeof b.then == "function")
          return L(x, Us(b), k);
        if (b.$$typeof === $)
          return L(
            x,
            xs(x, b),
            k
          );
        Rs(x, b);
      }
      return null;
    }
    function N(x, b, k, q) {
      var ie = b !== null ? b.key : null;
      if (typeof k == "string" && k !== "" || typeof k == "number" || typeof k == "bigint")
        return ie !== null ? null : f(x, b, "" + k, q);
      if (typeof k == "object" && k !== null) {
        switch (k.$$typeof) {
          case ee:
            return k.key === ie ? g(x, b, k, q) : null;
          case re:
            return k.key === ie ? M(x, b, k, q) : null;
          case ke:
            return k = Ol(k), N(x, b, k, q);
        }
        if (Ee(k) || j(k))
          return ie !== null ? null : O(x, b, k, q, null);
        if (typeof k.then == "function")
          return N(
            x,
            b,
            Us(k),
            q
          );
        if (k.$$typeof === $)
          return N(
            x,
            b,
            xs(x, k),
            q
          );
        Rs(x, k);
      }
      return null;
    }
    function R(x, b, k, q, ie) {
      if (typeof q == "string" && q !== "" || typeof q == "number" || typeof q == "bigint")
        return x = x.get(k) || null, f(b, x, "" + q, ie);
      if (typeof q == "object" && q !== null) {
        switch (q.$$typeof) {
          case ee:
            return x = x.get(
              q.key === null ? k : q.key
            ) || null, g(b, x, q, ie);
          case re:
            return x = x.get(
              q.key === null ? k : q.key
            ) || null, M(b, x, q, ie);
          case ke:
            return q = Ol(q), R(
              x,
              b,
              k,
              q,
              ie
            );
        }
        if (Ee(q) || j(q))
          return x = x.get(k) || null, O(b, x, q, ie, null);
        if (typeof q.then == "function")
          return R(
            x,
            b,
            k,
            Us(q),
            ie
          );
        if (q.$$typeof === $)
          return R(
            x,
            b,
            k,
            xs(b, q),
            ie
          );
        Rs(b, q);
      }
      return null;
    }
    function _(x, b, k, q) {
      for (var ie = null, Ne = null, te = b, pe = b = 0, Te = null; te !== null && pe < k.length; pe++) {
        te.index > pe ? (Te = te, te = null) : Te = te.sibling;
        var Ue = N(
          x,
          te,
          k[pe],
          q
        );
        if (Ue === null) {
          te === null && (te = Te);
          break;
        }
        e && te && Ue.alternate === null && t(x, te), b = i(Ue, b, pe), Ne === null ? ie = Ue : Ne.sibling = Ue, Ne = Ue, te = Te;
      }
      if (pe === k.length)
        return a(x, te), xe && ka(x, pe), ie;
      if (te === null) {
        for (; pe < k.length; pe++)
          te = L(x, k[pe], q), te !== null && (b = i(
            te,
            b,
            pe
          ), Ne === null ? ie = te : Ne.sibling = te, Ne = te);
        return xe && ka(x, pe), ie;
      }
      for (te = l(te); pe < k.length; pe++)
        Te = R(
          te,
          x,
          pe,
          k[pe],
          q
        ), Te !== null && (e && Te.alternate !== null && te.delete(
          Te.key === null ? pe : Te.key
        ), b = i(
          Te,
          b,
          pe
        ), Ne === null ? ie = Te : Ne.sibling = Te, Ne = Te);
      return e && te.forEach(function(hl) {
        return t(x, hl);
      }), xe && ka(x, pe), ie;
    }
    function oe(x, b, k, q) {
      if (k == null) throw Error(r(151));
      for (var ie = null, Ne = null, te = b, pe = b = 0, Te = null, Ue = k.next(); te !== null && !Ue.done; pe++, Ue = k.next()) {
        te.index > pe ? (Te = te, te = null) : Te = te.sibling;
        var hl = N(x, te, Ue.value, q);
        if (hl === null) {
          te === null && (te = Te);
          break;
        }
        e && te && hl.alternate === null && t(x, te), b = i(hl, b, pe), Ne === null ? ie = hl : Ne.sibling = hl, Ne = hl, te = Te;
      }
      if (Ue.done)
        return a(x, te), xe && ka(x, pe), ie;
      if (te === null) {
        for (; !Ue.done; pe++, Ue = k.next())
          Ue = L(x, Ue.value, q), Ue !== null && (b = i(Ue, b, pe), Ne === null ? ie = Ue : Ne.sibling = Ue, Ne = Ue);
        return xe && ka(x, pe), ie;
      }
      for (te = l(te); !Ue.done; pe++, Ue = k.next())
        Ue = R(te, x, pe, Ue.value, q), Ue !== null && (e && Ue.alternate !== null && te.delete(Ue.key === null ? pe : Ue.key), b = i(Ue, b, pe), Ne === null ? ie = Ue : Ne.sibling = Ue, Ne = Ue);
      return e && te.forEach(function(x1) {
        return t(x, x1);
      }), xe && ka(x, pe), ie;
    }
    function Oe(x, b, k, q) {
      if (typeof k == "object" && k !== null && k.type === ae && k.key === null && (k = k.props.children), typeof k == "object" && k !== null) {
        switch (k.$$typeof) {
          case ee:
            e: {
              for (var ie = k.key; b !== null; ) {
                if (b.key === ie) {
                  if (ie = k.type, ie === ae) {
                    if (b.tag === 7) {
                      a(
                        x,
                        b.sibling
                      ), q = n(
                        b,
                        k.props.children
                      ), q.return = x, x = q;
                      break e;
                    }
                  } else if (b.elementType === ie || typeof ie == "object" && ie !== null && ie.$$typeof === ke && Ol(ie) === b.type) {
                    a(
                      x,
                      b.sibling
                    ), q = n(b, k.props), oi(q, k), q.return = x, x = q;
                    break e;
                  }
                  a(x, b);
                  break;
                } else t(x, b);
                b = b.sibling;
              }
              k.type === ae ? (q = Dl(
                k.props.children,
                x.mode,
                q,
                k.key
              ), q.return = x, x = q) : (q = Es(
                k.type,
                k.key,
                k.props,
                null,
                x.mode,
                q
              ), oi(q, k), q.return = x, x = q);
            }
            return o(x);
          case re:
            e: {
              for (ie = k.key; b !== null; ) {
                if (b.key === ie)
                  if (b.tag === 4 && b.stateNode.containerInfo === k.containerInfo && b.stateNode.implementation === k.implementation) {
                    a(
                      x,
                      b.sibling
                    ), q = n(b, k.children || []), q.return = x, x = q;
                    break e;
                  } else {
                    a(x, b);
                    break;
                  }
                else t(x, b);
                b = b.sibling;
              }
              q = Sc(k, x.mode, q), q.return = x, x = q;
            }
            return o(x);
          case ke:
            return k = Ol(k), Oe(
              x,
              b,
              k,
              q
            );
        }
        if (Ee(k))
          return _(
            x,
            b,
            k,
            q
          );
        if (j(k)) {
          if (ie = j(k), typeof ie != "function") throw Error(r(150));
          return k = ie.call(k), oe(
            x,
            b,
            k,
            q
          );
        }
        if (typeof k.then == "function")
          return Oe(
            x,
            b,
            Us(k),
            q
          );
        if (k.$$typeof === $)
          return Oe(
            x,
            b,
            xs(x, k),
            q
          );
        Rs(x, k);
      }
      return typeof k == "string" && k !== "" || typeof k == "number" || typeof k == "bigint" ? (k = "" + k, b !== null && b.tag === 6 ? (a(x, b.sibling), q = n(b, k), q.return = x, x = q) : (a(x, b), q = bc(k, x.mode, q), q.return = x, x = q), o(x)) : a(x, b);
    }
    return function(x, b, k, q) {
      try {
        ci = 0;
        var ie = Oe(
          x,
          b,
          k,
          q
        );
        return An = null, ie;
      } catch (te) {
        if (te === vn || te === Ms) throw te;
        var Ne = zt(29, te, null, x.mode);
        return Ne.lanes = q, Ne.return = x, Ne;
      } finally {
      }
    };
  }
  var Ll = Zd(!0), Vd = Zd(!1), Pa = !1;
  function wc(e) {
    e.updateQueue = {
      baseState: e.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: { pending: null, lanes: 0, hiddenCallbacks: null },
      callbacks: null
    };
  }
  function Ic(e, t) {
    e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
      baseState: e.baseState,
      firstBaseUpdate: e.firstBaseUpdate,
      lastBaseUpdate: e.lastBaseUpdate,
      shared: e.shared,
      callbacks: null
    });
  }
  function _a(e) {
    return { lane: e, tag: 0, payload: null, callback: null, next: null };
  }
  function $a(e, t, a) {
    var l = e.updateQueue;
    if (l === null) return null;
    if (l = l.shared, (Re & 2) !== 0) {
      var n = l.pending;
      return n === null ? t.next = t : (t.next = n.next, n.next = t), l.pending = t, t = Ss(e), Ud(e, null, a), t;
    }
    return bs(e, l, t, a), Ss(e);
  }
  function ri(e, t, a) {
    if (t = t.updateQueue, t !== null && (t = t.shared, (a & 4194048) !== 0)) {
      var l = t.lanes;
      l &= e.pendingLanes, a |= l, t.lanes = a, ba(e, a);
    }
  }
  function jc(e, t) {
    var a = e.updateQueue, l = e.alternate;
    if (l !== null && (l = l.updateQueue, a === l)) {
      var n = null, i = null;
      if (a = a.firstBaseUpdate, a !== null) {
        do {
          var o = {
            lane: a.lane,
            tag: a.tag,
            payload: a.payload,
            callback: null,
            next: null
          };
          i === null ? n = i = o : i = i.next = o, a = a.next;
        } while (a !== null);
        i === null ? n = i = t : i = i.next = t;
      } else n = i = t;
      a = {
        baseState: l.baseState,
        firstBaseUpdate: n,
        lastBaseUpdate: i,
        shared: l.shared,
        callbacks: l.callbacks
      }, e.updateQueue = a;
      return;
    }
    e = a.lastBaseUpdate, e === null ? a.firstBaseUpdate = t : e.next = t, a.lastBaseUpdate = t;
  }
  var Oc = !1;
  function di() {
    if (Oc) {
      var e = yn;
      if (e !== null) throw e;
    }
  }
  function fi(e, t, a, l) {
    Oc = !1;
    var n = e.updateQueue;
    Pa = !1;
    var i = n.firstBaseUpdate, o = n.lastBaseUpdate, f = n.shared.pending;
    if (f !== null) {
      n.shared.pending = null;
      var g = f, M = g.next;
      g.next = null, o === null ? i = M : o.next = M, o = g;
      var O = e.alternate;
      O !== null && (O = O.updateQueue, f = O.lastBaseUpdate, f !== o && (f === null ? O.firstBaseUpdate = M : f.next = M, O.lastBaseUpdate = g));
    }
    if (i !== null) {
      var L = n.baseState;
      o = 0, O = M = g = null, f = i;
      do {
        var N = f.lane & -536870913, R = N !== f.lane;
        if (R ? (Ce & N) === N : (l & N) === N) {
          N !== 0 && N === pn && (Oc = !0), O !== null && (O = O.next = {
            lane: 0,
            tag: f.tag,
            payload: f.payload,
            callback: null,
            next: null
          });
          e: {
            var _ = e, oe = f;
            N = t;
            var Oe = a;
            switch (oe.tag) {
              case 1:
                if (_ = oe.payload, typeof _ == "function") {
                  L = _.call(Oe, L, N);
                  break e;
                }
                L = _;
                break e;
              case 3:
                _.flags = _.flags & -65537 | 128;
              case 0:
                if (_ = oe.payload, N = typeof _ == "function" ? _.call(Oe, L, N) : _, N == null) break e;
                L = E({}, L, N);
                break e;
              case 2:
                Pa = !0;
            }
          }
          N = f.callback, N !== null && (e.flags |= 64, R && (e.flags |= 8192), R = n.callbacks, R === null ? n.callbacks = [N] : R.push(N));
        } else
          R = {
            lane: N,
            tag: f.tag,
            payload: f.payload,
            callback: f.callback,
            next: null
          }, O === null ? (M = O = R, g = L) : O = O.next = R, o |= N;
        if (f = f.next, f === null) {
          if (f = n.shared.pending, f === null)
            break;
          R = f, f = R.next, R.next = null, n.lastBaseUpdate = R, n.shared.pending = null;
        }
      } while (!0);
      O === null && (g = L), n.baseState = g, n.firstBaseUpdate = M, n.lastBaseUpdate = O, i === null && (n.shared.lanes = 0), nl |= o, e.lanes = o, e.memoizedState = L;
    }
  }
  function Jd(e, t) {
    if (typeof e != "function")
      throw Error(r(191, e));
    e.call(t);
  }
  function Yd(e, t) {
    var a = e.callbacks;
    if (a !== null)
      for (e.callbacks = null, e = 0; e < a.length; e++)
        Jd(a[e], t);
  }
  var bn = A(null), Ds = A(0);
  function Fd(e, t) {
    e = qa, K(Ds, e), K(bn, t), qa = e | t.baseLanes;
  }
  function qc() {
    K(Ds, qa), K(bn, bn.current);
  }
  function Lc() {
    qa = Ds.current, I(bn), I(Ds);
  }
  var wt = A(null), Jt = null;
  function el(e) {
    var t = e.alternate;
    K(We, We.current & 1), K(wt, e), Jt === null && (t === null || bn.current !== null || t.memoizedState !== null) && (Jt = e);
  }
  function Bc(e) {
    K(We, We.current), K(wt, e), Jt === null && (Jt = e);
  }
  function Wd(e) {
    e.tag === 22 ? (K(We, We.current), K(wt, e), Jt === null && (Jt = e)) : tl();
  }
  function tl() {
    K(We, We.current), K(wt, wt.current);
  }
  function It(e) {
    I(wt), Jt === e && (Jt = null), I(We);
  }
  var We = A(0);
  function zs(e) {
    for (var t = e; t !== null; ) {
      if (t.tag === 13) {
        var a = t.memoizedState;
        if (a !== null && (a = a.dehydrated, a === null || Vo(a) || Jo(a)))
          return t;
      } else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
        if ((t.flags & 128) !== 0) return t;
      } else if (t.child !== null) {
        t.child.return = t, t = t.child;
        continue;
      }
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return null;
        t = t.return;
      }
      t.sibling.return = t.return, t = t.sibling;
    }
    return null;
  }
  var Ua = 0, ge = null, Ie = null, $e = null, ws = !1, Sn = !1, Bl = !1, Is = 0, mi = 0, En = null, gp = 0;
  function Ye() {
    throw Error(r(321));
  }
  function Gc(e, t) {
    if (t === null) return !1;
    for (var a = 0; a < t.length && a < e.length; a++)
      if (!Dt(e[a], t[a])) return !1;
    return !0;
  }
  function Hc(e, t, a, l, n, i) {
    return Ua = i, ge = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, D.H = e === null || e.memoizedState === null ? If : ao, Bl = !1, i = a(l, n), Bl = !1, Sn && (i = _d(
      t,
      a,
      l,
      n
    )), Pd(e), i;
  }
  function Pd(e) {
    D.H = pi;
    var t = Ie !== null && Ie.next !== null;
    if (Ua = 0, $e = Ie = ge = null, ws = !1, mi = 0, En = null, t) throw Error(r(300));
    e === null || et || (e = e.dependencies, e !== null && Ts(e) && (et = !0));
  }
  function _d(e, t, a, l) {
    ge = e;
    var n = 0;
    do {
      if (Sn && (En = null), mi = 0, Sn = !1, 25 <= n) throw Error(r(301));
      if (n += 1, $e = Ie = null, e.updateQueue != null) {
        var i = e.updateQueue;
        i.lastEffect = null, i.events = null, i.stores = null, i.memoCache != null && (i.memoCache.index = 0);
      }
      D.H = jf, i = t(a, l);
    } while (Sn);
    return i;
  }
  function pp() {
    var e = D.H, t = e.useState()[0];
    return t = typeof t.then == "function" ? hi(t) : t, e = e.useState()[0], (Ie !== null ? Ie.memoizedState : null) !== e && (ge.flags |= 1024), t;
  }
  function Qc() {
    var e = Is !== 0;
    return Is = 0, e;
  }
  function Xc(e, t, a) {
    t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~a;
  }
  function Kc(e) {
    if (ws) {
      for (e = e.memoizedState; e !== null; ) {
        var t = e.queue;
        t !== null && (t.pending = null), e = e.next;
      }
      ws = !1;
    }
    Ua = 0, $e = Ie = ge = null, Sn = !1, mi = Is = 0, En = null;
  }
  function yt() {
    var e = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };
    return $e === null ? ge.memoizedState = $e = e : $e = $e.next = e, $e;
  }
  function Pe() {
    if (Ie === null) {
      var e = ge.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = Ie.next;
    var t = $e === null ? ge.memoizedState : $e.next;
    if (t !== null)
      $e = t, Ie = e;
    else {
      if (e === null)
        throw ge.alternate === null ? Error(r(467)) : Error(r(310));
      Ie = e, e = {
        memoizedState: Ie.memoizedState,
        baseState: Ie.baseState,
        baseQueue: Ie.baseQueue,
        queue: Ie.queue,
        next: null
      }, $e === null ? ge.memoizedState = $e = e : $e = $e.next = e;
    }
    return $e;
  }
  function js() {
    return { lastEffect: null, events: null, stores: null, memoCache: null };
  }
  function hi(e) {
    var t = mi;
    return mi += 1, En === null && (En = []), e = Qd(En, e, t), t = ge, ($e === null ? t.memoizedState : $e.next) === null && (t = t.alternate, D.H = t === null || t.memoizedState === null ? If : ao), e;
  }
  function Os(e) {
    if (e !== null && typeof e == "object") {
      if (typeof e.then == "function") return hi(e);
      if (e.$$typeof === $) return rt(e);
    }
    throw Error(r(438, String(e)));
  }
  function Zc(e) {
    var t = null, a = ge.updateQueue;
    if (a !== null && (t = a.memoCache), t == null) {
      var l = ge.alternate;
      l !== null && (l = l.updateQueue, l !== null && (l = l.memoCache, l != null && (t = {
        data: l.data.map(function(n) {
          return n.slice();
        }),
        index: 0
      })));
    }
    if (t == null && (t = { data: [], index: 0 }), a === null && (a = js(), ge.updateQueue = a), a.memoCache = t, a = t.data[t.index], a === void 0)
      for (a = t.data[t.index] = Array(e), l = 0; l < e; l++)
        a[l] = Xe;
    return t.index++, a;
  }
  function Ra(e, t) {
    return typeof t == "function" ? t(e) : t;
  }
  function qs(e) {
    var t = Pe();
    return Vc(t, Ie, e);
  }
  function Vc(e, t, a) {
    var l = e.queue;
    if (l === null) throw Error(r(311));
    l.lastRenderedReducer = a;
    var n = e.baseQueue, i = l.pending;
    if (i !== null) {
      if (n !== null) {
        var o = n.next;
        n.next = i.next, i.next = o;
      }
      t.baseQueue = n = i, l.pending = null;
    }
    if (i = e.baseState, n === null) e.memoizedState = i;
    else {
      t = n.next;
      var f = o = null, g = null, M = t, O = !1;
      do {
        var L = M.lane & -536870913;
        if (L !== M.lane ? (Ce & L) === L : (Ua & L) === L) {
          var N = M.revertLane;
          if (N === 0)
            g !== null && (g = g.next = {
              lane: 0,
              revertLane: 0,
              gesture: null,
              action: M.action,
              hasEagerState: M.hasEagerState,
              eagerState: M.eagerState,
              next: null
            }), L === pn && (O = !0);
          else if ((Ua & N) === N) {
            M = M.next, N === pn && (O = !0);
            continue;
          } else
            L = {
              lane: 0,
              revertLane: M.revertLane,
              gesture: null,
              action: M.action,
              hasEagerState: M.hasEagerState,
              eagerState: M.eagerState,
              next: null
            }, g === null ? (f = g = L, o = i) : g = g.next = L, ge.lanes |= N, nl |= N;
          L = M.action, Bl && a(i, L), i = M.hasEagerState ? M.eagerState : a(i, L);
        } else
          N = {
            lane: L,
            revertLane: M.revertLane,
            gesture: M.gesture,
            action: M.action,
            hasEagerState: M.hasEagerState,
            eagerState: M.eagerState,
            next: null
          }, g === null ? (f = g = N, o = i) : g = g.next = N, ge.lanes |= L, nl |= L;
        M = M.next;
      } while (M !== null && M !== t);
      if (g === null ? o = i : g.next = f, !Dt(i, e.memoizedState) && (et = !0, O && (a = yn, a !== null)))
        throw a;
      e.memoizedState = i, e.baseState = o, e.baseQueue = g, l.lastRenderedState = i;
    }
    return n === null && (l.lanes = 0), [e.memoizedState, l.dispatch];
  }
  function Jc(e) {
    var t = Pe(), a = t.queue;
    if (a === null) throw Error(r(311));
    a.lastRenderedReducer = e;
    var l = a.dispatch, n = a.pending, i = t.memoizedState;
    if (n !== null) {
      a.pending = null;
      var o = n = n.next;
      do
        i = e(i, o.action), o = o.next;
      while (o !== n);
      Dt(i, t.memoizedState) || (et = !0), t.memoizedState = i, t.baseQueue === null && (t.baseState = i), a.lastRenderedState = i;
    }
    return [i, l];
  }
  function $d(e, t, a) {
    var l = ge, n = Pe(), i = xe;
    if (i) {
      if (a === void 0) throw Error(r(407));
      a = a();
    } else a = t();
    var o = !Dt(
      (Ie || n).memoizedState,
      a
    );
    if (o && (n.memoizedState = a, et = !0), n = n.queue, Wc(af.bind(null, l, n, e), [
      e
    ]), n.getSnapshot !== t || o || $e !== null && $e.memoizedState.tag & 1) {
      if (l.flags |= 2048, Cn(
        9,
        { destroy: void 0 },
        tf.bind(
          null,
          l,
          n,
          a,
          t
        ),
        null
      ), Le === null) throw Error(r(349));
      i || (Ua & 127) !== 0 || ef(l, t, a);
    }
    return a;
  }
  function ef(e, t, a) {
    e.flags |= 16384, e = { getSnapshot: t, value: a }, t = ge.updateQueue, t === null ? (t = js(), ge.updateQueue = t, t.stores = [e]) : (a = t.stores, a === null ? t.stores = [e] : a.push(e));
  }
  function tf(e, t, a, l) {
    t.value = a, t.getSnapshot = l, lf(t) && nf(e);
  }
  function af(e, t, a) {
    return a(function() {
      lf(t) && nf(e);
    });
  }
  function lf(e) {
    var t = e.getSnapshot;
    e = e.value;
    try {
      var a = t();
      return !Dt(e, a);
    } catch {
      return !0;
    }
  }
  function nf(e) {
    var t = Rl(e, 2);
    t !== null && Mt(t, e, 2);
  }
  function Yc(e) {
    var t = yt();
    if (typeof e == "function") {
      var a = e;
      if (e = a(), Bl) {
        ca(!0);
        try {
          a();
        } finally {
          ca(!1);
        }
      }
    }
    return t.memoizedState = t.baseState = e, t.queue = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Ra,
      lastRenderedState: e
    }, t;
  }
  function sf(e, t, a, l) {
    return e.baseState = a, Vc(
      e,
      Ie,
      typeof l == "function" ? l : Ra
    );
  }
  function yp(e, t, a, l, n) {
    if (Gs(e)) throw Error(r(485));
    if (e = t.action, e !== null) {
      var i = {
        payload: n,
        action: e,
        next: null,
        isTransition: !0,
        status: "pending",
        value: null,
        reason: null,
        listeners: [],
        then: function(o) {
          i.listeners.push(o);
        }
      };
      D.T !== null ? a(!0) : i.isTransition = !1, l(i), a = t.pending, a === null ? (i.next = t.pending = i, uf(t, i)) : (i.next = a.next, t.pending = a.next = i);
    }
  }
  function uf(e, t) {
    var a = t.action, l = t.payload, n = e.state;
    if (t.isTransition) {
      var i = D.T, o = {};
      D.T = o;
      try {
        var f = a(n, l), g = D.S;
        g !== null && g(o, f), cf(e, t, f);
      } catch (M) {
        Fc(e, t, M);
      } finally {
        i !== null && o.types !== null && (i.types = o.types), D.T = i;
      }
    } else
      try {
        i = a(n, l), cf(e, t, i);
      } catch (M) {
        Fc(e, t, M);
      }
  }
  function cf(e, t, a) {
    a !== null && typeof a == "object" && typeof a.then == "function" ? a.then(
      function(l) {
        of(e, t, l);
      },
      function(l) {
        return Fc(e, t, l);
      }
    ) : of(e, t, a);
  }
  function of(e, t, a) {
    t.status = "fulfilled", t.value = a, rf(t), e.state = a, t = e.pending, t !== null && (a = t.next, a === t ? e.pending = null : (a = a.next, t.next = a, uf(e, a)));
  }
  function Fc(e, t, a) {
    var l = e.pending;
    if (e.pending = null, l !== null) {
      l = l.next;
      do
        t.status = "rejected", t.reason = a, rf(t), t = t.next;
      while (t !== l);
    }
    e.action = null;
  }
  function rf(e) {
    e = e.listeners;
    for (var t = 0; t < e.length; t++) (0, e[t])();
  }
  function df(e, t) {
    return t;
  }
  function ff(e, t) {
    if (xe) {
      var a = Le.formState;
      if (a !== null) {
        e: {
          var l = ge;
          if (xe) {
            if (Be) {
              t: {
                for (var n = Be, i = Vt; n.nodeType !== 8; ) {
                  if (!i) {
                    n = null;
                    break t;
                  }
                  if (n = Yt(
                    n.nextSibling
                  ), n === null) {
                    n = null;
                    break t;
                  }
                }
                i = n.data, n = i === "F!" || i === "F" ? n : null;
              }
              if (n) {
                Be = Yt(
                  n.nextSibling
                ), l = n.data === "F!";
                break e;
              }
            }
            Fa(l);
          }
          l = !1;
        }
        l && (t = a[0]);
      }
    }
    return a = yt(), a.memoizedState = a.baseState = t, l = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: df,
      lastRenderedState: t
    }, a.queue = l, a = Df.bind(
      null,
      ge,
      l
    ), l.dispatch = a, l = Yc(!1), i = to.bind(
      null,
      ge,
      !1,
      l.queue
    ), l = yt(), n = {
      state: t,
      dispatch: null,
      action: e,
      pending: null
    }, l.queue = n, a = yp.bind(
      null,
      ge,
      n,
      i,
      a
    ), n.dispatch = a, l.memoizedState = e, [t, a, !1];
  }
  function mf(e) {
    var t = Pe();
    return hf(t, Ie, e);
  }
  function hf(e, t, a) {
    if (t = Vc(
      e,
      t,
      df
    )[0], e = qs(Ra)[0], typeof t == "object" && t !== null && typeof t.then == "function")
      try {
        var l = hi(t);
      } catch (o) {
        throw o === vn ? Ms : o;
      }
    else l = t;
    t = Pe();
    var n = t.queue, i = n.dispatch;
    return a !== t.memoizedState && (ge.flags |= 2048, Cn(
      9,
      { destroy: void 0 },
      vp.bind(null, n, a),
      null
    )), [l, i, e];
  }
  function vp(e, t) {
    e.action = t;
  }
  function gf(e) {
    var t = Pe(), a = Ie;
    if (a !== null)
      return hf(t, a, e);
    Pe(), t = t.memoizedState, a = Pe();
    var l = a.queue.dispatch;
    return a.memoizedState = e, [t, l, !1];
  }
  function Cn(e, t, a, l) {
    return e = { tag: e, create: a, deps: l, inst: t, next: null }, t = ge.updateQueue, t === null && (t = js(), ge.updateQueue = t), a = t.lastEffect, a === null ? t.lastEffect = e.next = e : (l = a.next, a.next = e, e.next = l, t.lastEffect = e), e;
  }
  function pf() {
    return Pe().memoizedState;
  }
  function Ls(e, t, a, l) {
    var n = yt();
    ge.flags |= e, n.memoizedState = Cn(
      1 | t,
      { destroy: void 0 },
      a,
      l === void 0 ? null : l
    );
  }
  function Bs(e, t, a, l) {
    var n = Pe();
    l = l === void 0 ? null : l;
    var i = n.memoizedState.inst;
    Ie !== null && l !== null && Gc(l, Ie.memoizedState.deps) ? n.memoizedState = Cn(t, i, a, l) : (ge.flags |= e, n.memoizedState = Cn(
      1 | t,
      i,
      a,
      l
    ));
  }
  function yf(e, t) {
    Ls(8390656, 8, e, t);
  }
  function Wc(e, t) {
    Bs(2048, 8, e, t);
  }
  function Ap(e) {
    ge.flags |= 4;
    var t = ge.updateQueue;
    if (t === null)
      t = js(), ge.updateQueue = t, t.events = [e];
    else {
      var a = t.events;
      a === null ? t.events = [e] : a.push(e);
    }
  }
  function vf(e) {
    var t = Pe().memoizedState;
    return Ap({ ref: t, nextImpl: e }), function() {
      if ((Re & 2) !== 0) throw Error(r(440));
      return t.impl.apply(void 0, arguments);
    };
  }
  function Af(e, t) {
    return Bs(4, 2, e, t);
  }
  function bf(e, t) {
    return Bs(4, 4, e, t);
  }
  function Sf(e, t) {
    if (typeof t == "function") {
      e = e();
      var a = t(e);
      return function() {
        typeof a == "function" ? a() : t(null);
      };
    }
    if (t != null)
      return e = e(), t.current = e, function() {
        t.current = null;
      };
  }
  function Ef(e, t, a) {
    a = a != null ? a.concat([e]) : null, Bs(4, 4, Sf.bind(null, t, e), a);
  }
  function Pc() {
  }
  function Cf(e, t) {
    var a = Pe();
    t = t === void 0 ? null : t;
    var l = a.memoizedState;
    return t !== null && Gc(t, l[1]) ? l[0] : (a.memoizedState = [e, t], e);
  }
  function Tf(e, t) {
    var a = Pe();
    t = t === void 0 ? null : t;
    var l = a.memoizedState;
    if (t !== null && Gc(t, l[1]))
      return l[0];
    if (l = e(), Bl) {
      ca(!0);
      try {
        e();
      } finally {
        ca(!1);
      }
    }
    return a.memoizedState = [l, t], l;
  }
  function _c(e, t, a) {
    return a === void 0 || (Ua & 1073741824) !== 0 && (Ce & 261930) === 0 ? e.memoizedState = t : (e.memoizedState = a, e = xm(), ge.lanes |= e, nl |= e, a);
  }
  function xf(e, t, a, l) {
    return Dt(a, t) ? a : bn.current !== null ? (e = _c(e, a, l), Dt(e, t) || (et = !0), e) : (Ua & 42) === 0 || (Ua & 1073741824) !== 0 && (Ce & 261930) === 0 ? (et = !0, e.memoizedState = a) : (e = xm(), ge.lanes |= e, nl |= e, t);
  }
  function kf(e, t, a, l, n) {
    var i = H.p;
    H.p = i !== 0 && 8 > i ? i : 8;
    var o = D.T, f = {};
    D.T = f, to(e, !1, t, a);
    try {
      var g = n(), M = D.S;
      if (M !== null && M(f, g), g !== null && typeof g == "object" && typeof g.then == "function") {
        var O = hp(
          g,
          l
        );
        gi(
          e,
          t,
          O,
          qt(e)
        );
      } else
        gi(
          e,
          t,
          l,
          qt(e)
        );
    } catch (L) {
      gi(
        e,
        t,
        { then: function() {
        }, status: "rejected", reason: L },
        qt()
      );
    } finally {
      H.p = i, o !== null && f.types !== null && (o.types = f.types), D.T = o;
    }
  }
  function bp() {
  }
  function $c(e, t, a, l) {
    if (e.tag !== 5) throw Error(r(476));
    var n = Mf(e).queue;
    kf(
      e,
      n,
      t,
      G,
      a === null ? bp : function() {
        return Nf(e), a(l);
      }
    );
  }
  function Mf(e) {
    var t = e.memoizedState;
    if (t !== null) return t;
    t = {
      memoizedState: G,
      baseState: G,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Ra,
        lastRenderedState: G
      },
      next: null
    };
    var a = {};
    return t.next = {
      memoizedState: a,
      baseState: a,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Ra,
        lastRenderedState: a
      },
      next: null
    }, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
  }
  function Nf(e) {
    var t = Mf(e);
    t.next === null && (t = e.alternate.memoizedState), gi(
      e,
      t.next.queue,
      {},
      qt()
    );
  }
  function eo() {
    return rt(zi);
  }
  function Uf() {
    return Pe().memoizedState;
  }
  function Rf() {
    return Pe().memoizedState;
  }
  function Sp(e) {
    for (var t = e.return; t !== null; ) {
      switch (t.tag) {
        case 24:
        case 3:
          var a = qt();
          e = _a(a);
          var l = $a(t, e, a);
          l !== null && (Mt(l, t, a), ri(l, t, a)), t = { cache: Uc() }, e.payload = t;
          return;
      }
      t = t.return;
    }
  }
  function Ep(e, t, a) {
    var l = qt();
    a = {
      lane: l,
      revertLane: 0,
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Gs(e) ? zf(t, a) : (a = vc(e, t, a, l), a !== null && (Mt(a, e, l), wf(a, t, l)));
  }
  function Df(e, t, a) {
    var l = qt();
    gi(e, t, a, l);
  }
  function gi(e, t, a, l) {
    var n = {
      lane: l,
      revertLane: 0,
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
    if (Gs(e)) zf(t, n);
    else {
      var i = e.alternate;
      if (e.lanes === 0 && (i === null || i.lanes === 0) && (i = t.lastRenderedReducer, i !== null))
        try {
          var o = t.lastRenderedState, f = i(o, a);
          if (n.hasEagerState = !0, n.eagerState = f, Dt(f, o))
            return bs(e, t, n, 0), Le === null && As(), !1;
        } catch {
        } finally {
        }
      if (a = vc(e, t, n, l), a !== null)
        return Mt(a, e, l), wf(a, t, l), !0;
    }
    return !1;
  }
  function to(e, t, a, l) {
    if (l = {
      lane: 2,
      revertLane: Io(),
      gesture: null,
      action: l,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, Gs(e)) {
      if (t) throw Error(r(479));
    } else
      t = vc(
        e,
        a,
        l,
        2
      ), t !== null && Mt(t, e, 2);
  }
  function Gs(e) {
    var t = e.alternate;
    return e === ge || t !== null && t === ge;
  }
  function zf(e, t) {
    Sn = ws = !0;
    var a = e.pending;
    a === null ? t.next = t : (t.next = a.next, a.next = t), e.pending = t;
  }
  function wf(e, t, a) {
    if ((a & 4194048) !== 0) {
      var l = t.lanes;
      l &= e.pendingLanes, a |= l, t.lanes = a, ba(e, a);
    }
  }
  var pi = {
    readContext: rt,
    use: Os,
    useCallback: Ye,
    useContext: Ye,
    useEffect: Ye,
    useImperativeHandle: Ye,
    useLayoutEffect: Ye,
    useInsertionEffect: Ye,
    useMemo: Ye,
    useReducer: Ye,
    useRef: Ye,
    useState: Ye,
    useDebugValue: Ye,
    useDeferredValue: Ye,
    useTransition: Ye,
    useSyncExternalStore: Ye,
    useId: Ye,
    useHostTransitionStatus: Ye,
    useFormState: Ye,
    useActionState: Ye,
    useOptimistic: Ye,
    useMemoCache: Ye,
    useCacheRefresh: Ye
  };
  pi.useEffectEvent = Ye;
  var If = {
    readContext: rt,
    use: Os,
    useCallback: function(e, t) {
      return yt().memoizedState = [
        e,
        t === void 0 ? null : t
      ], e;
    },
    useContext: rt,
    useEffect: yf,
    useImperativeHandle: function(e, t, a) {
      a = a != null ? a.concat([e]) : null, Ls(
        4194308,
        4,
        Sf.bind(null, t, e),
        a
      );
    },
    useLayoutEffect: function(e, t) {
      return Ls(4194308, 4, e, t);
    },
    useInsertionEffect: function(e, t) {
      Ls(4, 2, e, t);
    },
    useMemo: function(e, t) {
      var a = yt();
      t = t === void 0 ? null : t;
      var l = e();
      if (Bl) {
        ca(!0);
        try {
          e();
        } finally {
          ca(!1);
        }
      }
      return a.memoizedState = [l, t], l;
    },
    useReducer: function(e, t, a) {
      var l = yt();
      if (a !== void 0) {
        var n = a(t);
        if (Bl) {
          ca(!0);
          try {
            a(t);
          } finally {
            ca(!1);
          }
        }
      } else n = t;
      return l.memoizedState = l.baseState = n, e = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: e,
        lastRenderedState: n
      }, l.queue = e, e = e.dispatch = Ep.bind(
        null,
        ge,
        e
      ), [l.memoizedState, e];
    },
    useRef: function(e) {
      var t = yt();
      return e = { current: e }, t.memoizedState = e;
    },
    useState: function(e) {
      e = Yc(e);
      var t = e.queue, a = Df.bind(null, ge, t);
      return t.dispatch = a, [e.memoizedState, a];
    },
    useDebugValue: Pc,
    useDeferredValue: function(e, t) {
      var a = yt();
      return _c(a, e, t);
    },
    useTransition: function() {
      var e = Yc(!1);
      return e = kf.bind(
        null,
        ge,
        e.queue,
        !0,
        !1
      ), yt().memoizedState = e, [!1, e];
    },
    useSyncExternalStore: function(e, t, a) {
      var l = ge, n = yt();
      if (xe) {
        if (a === void 0)
          throw Error(r(407));
        a = a();
      } else {
        if (a = t(), Le === null)
          throw Error(r(349));
        (Ce & 127) !== 0 || ef(l, t, a);
      }
      n.memoizedState = a;
      var i = { value: a, getSnapshot: t };
      return n.queue = i, yf(af.bind(null, l, i, e), [
        e
      ]), l.flags |= 2048, Cn(
        9,
        { destroy: void 0 },
        tf.bind(
          null,
          l,
          i,
          a,
          t
        ),
        null
      ), a;
    },
    useId: function() {
      var e = yt(), t = Le.identifierPrefix;
      if (xe) {
        var a = da, l = ra;
        a = (l & ~(1 << 32 - Ze(l) - 1)).toString(32) + a, t = "_" + t + "R_" + a, a = Is++, 0 < a && (t += "H" + a.toString(32)), t += "_";
      } else
        a = gp++, t = "_" + t + "r_" + a.toString(32) + "_";
      return e.memoizedState = t;
    },
    useHostTransitionStatus: eo,
    useFormState: ff,
    useActionState: ff,
    useOptimistic: function(e) {
      var t = yt();
      t.memoizedState = t.baseState = e;
      var a = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: null,
        lastRenderedState: null
      };
      return t.queue = a, t = to.bind(
        null,
        ge,
        !0,
        a
      ), a.dispatch = t, [e, t];
    },
    useMemoCache: Zc,
    useCacheRefresh: function() {
      return yt().memoizedState = Sp.bind(
        null,
        ge
      );
    },
    useEffectEvent: function(e) {
      var t = yt(), a = { impl: e };
      return t.memoizedState = a, function() {
        if ((Re & 2) !== 0)
          throw Error(r(440));
        return a.impl.apply(void 0, arguments);
      };
    }
  }, ao = {
    readContext: rt,
    use: Os,
    useCallback: Cf,
    useContext: rt,
    useEffect: Wc,
    useImperativeHandle: Ef,
    useInsertionEffect: Af,
    useLayoutEffect: bf,
    useMemo: Tf,
    useReducer: qs,
    useRef: pf,
    useState: function() {
      return qs(Ra);
    },
    useDebugValue: Pc,
    useDeferredValue: function(e, t) {
      var a = Pe();
      return xf(
        a,
        Ie.memoizedState,
        e,
        t
      );
    },
    useTransition: function() {
      var e = qs(Ra)[0], t = Pe().memoizedState;
      return [
        typeof e == "boolean" ? e : hi(e),
        t
      ];
    },
    useSyncExternalStore: $d,
    useId: Uf,
    useHostTransitionStatus: eo,
    useFormState: mf,
    useActionState: mf,
    useOptimistic: function(e, t) {
      var a = Pe();
      return sf(a, Ie, e, t);
    },
    useMemoCache: Zc,
    useCacheRefresh: Rf
  };
  ao.useEffectEvent = vf;
  var jf = {
    readContext: rt,
    use: Os,
    useCallback: Cf,
    useContext: rt,
    useEffect: Wc,
    useImperativeHandle: Ef,
    useInsertionEffect: Af,
    useLayoutEffect: bf,
    useMemo: Tf,
    useReducer: Jc,
    useRef: pf,
    useState: function() {
      return Jc(Ra);
    },
    useDebugValue: Pc,
    useDeferredValue: function(e, t) {
      var a = Pe();
      return Ie === null ? _c(a, e, t) : xf(
        a,
        Ie.memoizedState,
        e,
        t
      );
    },
    useTransition: function() {
      var e = Jc(Ra)[0], t = Pe().memoizedState;
      return [
        typeof e == "boolean" ? e : hi(e),
        t
      ];
    },
    useSyncExternalStore: $d,
    useId: Uf,
    useHostTransitionStatus: eo,
    useFormState: gf,
    useActionState: gf,
    useOptimistic: function(e, t) {
      var a = Pe();
      return Ie !== null ? sf(a, Ie, e, t) : (a.baseState = e, [e, a.queue.dispatch]);
    },
    useMemoCache: Zc,
    useCacheRefresh: Rf
  };
  jf.useEffectEvent = vf;
  function lo(e, t, a, l) {
    t = e.memoizedState, a = a(l, t), a = a == null ? t : E({}, t, a), e.memoizedState = a, e.lanes === 0 && (e.updateQueue.baseState = a);
  }
  var no = {
    enqueueSetState: function(e, t, a) {
      e = e._reactInternals;
      var l = qt(), n = _a(l);
      n.payload = t, a != null && (n.callback = a), t = $a(e, n, l), t !== null && (Mt(t, e, l), ri(t, e, l));
    },
    enqueueReplaceState: function(e, t, a) {
      e = e._reactInternals;
      var l = qt(), n = _a(l);
      n.tag = 1, n.payload = t, a != null && (n.callback = a), t = $a(e, n, l), t !== null && (Mt(t, e, l), ri(t, e, l));
    },
    enqueueForceUpdate: function(e, t) {
      e = e._reactInternals;
      var a = qt(), l = _a(a);
      l.tag = 2, t != null && (l.callback = t), t = $a(e, l, a), t !== null && (Mt(t, e, a), ri(t, e, a));
    }
  };
  function Of(e, t, a, l, n, i, o) {
    return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(l, i, o) : t.prototype && t.prototype.isPureReactComponent ? !ai(a, l) || !ai(n, i) : !0;
  }
  function qf(e, t, a, l) {
    e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(a, l), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(a, l), t.state !== e && no.enqueueReplaceState(t, t.state, null);
  }
  function Gl(e, t) {
    var a = t;
    if ("ref" in t) {
      a = {};
      for (var l in t)
        l !== "ref" && (a[l] = t[l]);
    }
    if (e = e.defaultProps) {
      a === t && (a = E({}, a));
      for (var n in e)
        a[n] === void 0 && (a[n] = e[n]);
    }
    return a;
  }
  function Lf(e) {
    vs(e);
  }
  function Bf(e) {
    console.error(e);
  }
  function Gf(e) {
    vs(e);
  }
  function Hs(e, t) {
    try {
      var a = e.onUncaughtError;
      a(t.value, { componentStack: t.stack });
    } catch (l) {
      setTimeout(function() {
        throw l;
      });
    }
  }
  function Hf(e, t, a) {
    try {
      var l = e.onCaughtError;
      l(a.value, {
        componentStack: a.stack,
        errorBoundary: t.tag === 1 ? t.stateNode : null
      });
    } catch (n) {
      setTimeout(function() {
        throw n;
      });
    }
  }
  function io(e, t, a) {
    return a = _a(a), a.tag = 3, a.payload = { element: null }, a.callback = function() {
      Hs(e, t);
    }, a;
  }
  function Qf(e) {
    return e = _a(e), e.tag = 3, e;
  }
  function Xf(e, t, a, l) {
    var n = a.type.getDerivedStateFromError;
    if (typeof n == "function") {
      var i = l.value;
      e.payload = function() {
        return n(i);
      }, e.callback = function() {
        Hf(t, a, l);
      };
    }
    var o = a.stateNode;
    o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
      Hf(t, a, l), typeof n != "function" && (il === null ? il = /* @__PURE__ */ new Set([this]) : il.add(this));
      var f = l.stack;
      this.componentDidCatch(l.value, {
        componentStack: f !== null ? f : ""
      });
    });
  }
  function Cp(e, t, a, l, n) {
    if (a.flags |= 32768, l !== null && typeof l == "object" && typeof l.then == "function") {
      if (t = a.alternate, t !== null && gn(
        t,
        a,
        n,
        !0
      ), a = wt.current, a !== null) {
        switch (a.tag) {
          case 31:
          case 13:
            return Jt === null ? $s() : a.alternate === null && Fe === 0 && (Fe = 3), a.flags &= -257, a.flags |= 65536, a.lanes = n, l === Ns ? a.flags |= 16384 : (t = a.updateQueue, t === null ? a.updateQueue = /* @__PURE__ */ new Set([l]) : t.add(l), Do(e, l, n)), !1;
          case 22:
            return a.flags |= 65536, l === Ns ? a.flags |= 16384 : (t = a.updateQueue, t === null ? (t = {
              transitions: null,
              markerInstances: null,
              retryQueue: /* @__PURE__ */ new Set([l])
            }, a.updateQueue = t) : (a = t.retryQueue, a === null ? t.retryQueue = /* @__PURE__ */ new Set([l]) : a.add(l)), Do(e, l, n)), !1;
        }
        throw Error(r(435, a.tag));
      }
      return Do(e, l, n), $s(), !1;
    }
    if (xe)
      return t = wt.current, t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256), t.flags |= 65536, t.lanes = n, l !== Tc && (e = Error(r(422), { cause: l }), ii(Xt(e, a)))) : (l !== Tc && (t = Error(r(423), {
        cause: l
      }), ii(
        Xt(t, a)
      )), e = e.current.alternate, e.flags |= 65536, n &= -n, e.lanes |= n, l = Xt(l, a), n = io(
        e.stateNode,
        l,
        n
      ), jc(e, n), Fe !== 4 && (Fe = 2)), !1;
    var i = Error(r(520), { cause: l });
    if (i = Xt(i, a), Ti === null ? Ti = [i] : Ti.push(i), Fe !== 4 && (Fe = 2), t === null) return !0;
    l = Xt(l, a), a = t;
    do {
      switch (a.tag) {
        case 3:
          return a.flags |= 65536, e = n & -n, a.lanes |= e, e = io(a.stateNode, l, e), jc(a, e), !1;
        case 1:
          if (t = a.type, i = a.stateNode, (a.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || i !== null && typeof i.componentDidCatch == "function" && (il === null || !il.has(i))))
            return a.flags |= 65536, n &= -n, a.lanes |= n, n = Qf(n), Xf(
              n,
              e,
              a,
              l
            ), jc(a, n), !1;
      }
      a = a.return;
    } while (a !== null);
    return !1;
  }
  var so = Error(r(461)), et = !1;
  function dt(e, t, a, l) {
    t.child = e === null ? Vd(t, null, a, l) : Ll(
      t,
      e.child,
      a,
      l
    );
  }
  function Kf(e, t, a, l, n) {
    a = a.render;
    var i = t.ref;
    if ("ref" in l) {
      var o = {};
      for (var f in l)
        f !== "ref" && (o[f] = l[f]);
    } else o = l;
    return Il(t), l = Hc(
      e,
      t,
      a,
      o,
      i,
      n
    ), f = Qc(), e !== null && !et ? (Xc(e, t, n), Da(e, t, n)) : (xe && f && Ec(t), t.flags |= 1, dt(e, t, l, n), t.child);
  }
  function Zf(e, t, a, l, n) {
    if (e === null) {
      var i = a.type;
      return typeof i == "function" && !Ac(i) && i.defaultProps === void 0 && a.compare === null ? (t.tag = 15, t.type = i, Vf(
        e,
        t,
        i,
        l,
        n
      )) : (e = Es(
        a.type,
        null,
        l,
        t,
        t.mode,
        n
      ), e.ref = t.ref, e.return = t, t.child = e);
    }
    if (i = e.child, !go(e, n)) {
      var o = i.memoizedProps;
      if (a = a.compare, a = a !== null ? a : ai, a(o, l) && e.ref === t.ref)
        return Da(e, t, n);
    }
    return t.flags |= 1, e = xa(i, l), e.ref = t.ref, e.return = t, t.child = e;
  }
  function Vf(e, t, a, l, n) {
    if (e !== null) {
      var i = e.memoizedProps;
      if (ai(i, l) && e.ref === t.ref)
        if (et = !1, t.pendingProps = l = i, go(e, n))
          (e.flags & 131072) !== 0 && (et = !0);
        else
          return t.lanes = e.lanes, Da(e, t, n);
    }
    return uo(
      e,
      t,
      a,
      l,
      n
    );
  }
  function Jf(e, t, a, l) {
    var n = l.children, i = e !== null ? e.memoizedState : null;
    if (e === null && t.stateNode === null && (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), l.mode === "hidden") {
      if ((t.flags & 128) !== 0) {
        if (i = i !== null ? i.baseLanes | a : a, e !== null) {
          for (l = t.child = e.child, n = 0; l !== null; )
            n = n | l.lanes | l.childLanes, l = l.sibling;
          l = n & ~i;
        } else l = 0, t.child = null;
        return Yf(
          e,
          t,
          i,
          a,
          l
        );
      }
      if ((a & 536870912) !== 0)
        t.memoizedState = { baseLanes: 0, cachePool: null }, e !== null && ks(
          t,
          i !== null ? i.cachePool : null
        ), i !== null ? Fd(t, i) : qc(), Wd(t);
      else
        return l = t.lanes = 536870912, Yf(
          e,
          t,
          i !== null ? i.baseLanes | a : a,
          a,
          l
        );
    } else
      i !== null ? (ks(t, i.cachePool), Fd(t, i), tl(), t.memoizedState = null) : (e !== null && ks(t, null), qc(), tl());
    return dt(e, t, n, a), t.child;
  }
  function yi(e, t) {
    return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), t.sibling;
  }
  function Yf(e, t, a, l, n) {
    var i = Dc();
    return i = i === null ? null : { parent: _e._currentValue, pool: i }, t.memoizedState = {
      baseLanes: a,
      cachePool: i
    }, e !== null && ks(t, null), qc(), Wd(t), e !== null && gn(e, t, l, !0), t.childLanes = n, null;
  }
  function Qs(e, t) {
    return t = Ks(
      { mode: t.mode, children: t.children },
      e.mode
    ), t.ref = e.ref, e.child = t, t.return = e, t;
  }
  function Ff(e, t, a) {
    return Ll(t, e.child, null, a), e = Qs(t, t.pendingProps), e.flags |= 2, It(t), t.memoizedState = null, e;
  }
  function Tp(e, t, a) {
    var l = t.pendingProps, n = (t.flags & 128) !== 0;
    if (t.flags &= -129, e === null) {
      if (xe) {
        if (l.mode === "hidden")
          return e = Qs(t, l), t.lanes = 536870912, yi(null, e);
        if (Bc(t), (e = Be) ? (e = uh(
          e,
          Vt
        ), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: Ja !== null ? { id: ra, overflow: da } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, a = Dd(e), a.return = t, t.child = a, ot = t, Be = null)) : e = null, e === null) throw Fa(t);
        return t.lanes = 536870912, null;
      }
      return Qs(t, l);
    }
    var i = e.memoizedState;
    if (i !== null) {
      var o = i.dehydrated;
      if (Bc(t), n)
        if (t.flags & 256)
          t.flags &= -257, t = Ff(
            e,
            t,
            a
          );
        else if (t.memoizedState !== null)
          t.child = e.child, t.flags |= 128, t = null;
        else throw Error(r(558));
      else if (et || gn(e, t, a, !1), n = (a & e.childLanes) !== 0, et || n) {
        if (l = Le, l !== null && (o = Vn(l, a), o !== 0 && o !== i.retryLane))
          throw i.retryLane = o, Rl(e, o), Mt(l, e, o), so;
        $s(), t = Ff(
          e,
          t,
          a
        );
      } else
        e = i.treeContext, Be = Yt(o.nextSibling), ot = t, xe = !0, Ya = null, Vt = !1, e !== null && Id(t, e), t = Qs(t, l), t.flags |= 4096;
      return t;
    }
    return e = xa(e.child, {
      mode: l.mode,
      children: l.children
    }), e.ref = t.ref, t.child = e, e.return = t, e;
  }
  function Xs(e, t) {
    var a = t.ref;
    if (a === null)
      e !== null && e.ref !== null && (t.flags |= 4194816);
    else {
      if (typeof a != "function" && typeof a != "object")
        throw Error(r(284));
      (e === null || e.ref !== a) && (t.flags |= 4194816);
    }
  }
  function uo(e, t, a, l, n) {
    return Il(t), a = Hc(
      e,
      t,
      a,
      l,
      void 0,
      n
    ), l = Qc(), e !== null && !et ? (Xc(e, t, n), Da(e, t, n)) : (xe && l && Ec(t), t.flags |= 1, dt(e, t, a, n), t.child);
  }
  function Wf(e, t, a, l, n, i) {
    return Il(t), t.updateQueue = null, a = _d(
      t,
      l,
      a,
      n
    ), Pd(e), l = Qc(), e !== null && !et ? (Xc(e, t, i), Da(e, t, i)) : (xe && l && Ec(t), t.flags |= 1, dt(e, t, a, i), t.child);
  }
  function Pf(e, t, a, l, n) {
    if (Il(t), t.stateNode === null) {
      var i = dn, o = a.contextType;
      typeof o == "object" && o !== null && (i = rt(o)), i = new a(l, i), t.memoizedState = i.state !== null && i.state !== void 0 ? i.state : null, i.updater = no, t.stateNode = i, i._reactInternals = t, i = t.stateNode, i.props = l, i.state = t.memoizedState, i.refs = {}, wc(t), o = a.contextType, i.context = typeof o == "object" && o !== null ? rt(o) : dn, i.state = t.memoizedState, o = a.getDerivedStateFromProps, typeof o == "function" && (lo(
        t,
        a,
        o,
        l
      ), i.state = t.memoizedState), typeof a.getDerivedStateFromProps == "function" || typeof i.getSnapshotBeforeUpdate == "function" || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (o = i.state, typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount(), o !== i.state && no.enqueueReplaceState(i, i.state, null), fi(t, l, i, n), di(), i.state = t.memoizedState), typeof i.componentDidMount == "function" && (t.flags |= 4194308), l = !0;
    } else if (e === null) {
      i = t.stateNode;
      var f = t.memoizedProps, g = Gl(a, f);
      i.props = g;
      var M = i.context, O = a.contextType;
      o = dn, typeof O == "object" && O !== null && (o = rt(O));
      var L = a.getDerivedStateFromProps;
      O = typeof L == "function" || typeof i.getSnapshotBeforeUpdate == "function", f = t.pendingProps !== f, O || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (f || M !== o) && qf(
        t,
        i,
        l,
        o
      ), Pa = !1;
      var N = t.memoizedState;
      i.state = N, fi(t, l, i, n), di(), M = t.memoizedState, f || N !== M || Pa ? (typeof L == "function" && (lo(
        t,
        a,
        L,
        l
      ), M = t.memoizedState), (g = Pa || Of(
        t,
        a,
        g,
        l,
        N,
        M,
        o
      )) ? (O || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (typeof i.componentWillMount == "function" && i.componentWillMount(), typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount()), typeof i.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = l, t.memoizedState = M), i.props = l, i.state = M, i.context = o, l = g) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308), l = !1);
    } else {
      i = t.stateNode, Ic(e, t), o = t.memoizedProps, O = Gl(a, o), i.props = O, L = t.pendingProps, N = i.context, M = a.contextType, g = dn, typeof M == "object" && M !== null && (g = rt(M)), f = a.getDerivedStateFromProps, (M = typeof f == "function" || typeof i.getSnapshotBeforeUpdate == "function") || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (o !== L || N !== g) && qf(
        t,
        i,
        l,
        g
      ), Pa = !1, N = t.memoizedState, i.state = N, fi(t, l, i, n), di();
      var R = t.memoizedState;
      o !== L || N !== R || Pa || e !== null && e.dependencies !== null && Ts(e.dependencies) ? (typeof f == "function" && (lo(
        t,
        a,
        f,
        l
      ), R = t.memoizedState), (O = Pa || Of(
        t,
        a,
        O,
        l,
        N,
        R,
        g
      ) || e !== null && e.dependencies !== null && Ts(e.dependencies)) ? (M || typeof i.UNSAFE_componentWillUpdate != "function" && typeof i.componentWillUpdate != "function" || (typeof i.componentWillUpdate == "function" && i.componentWillUpdate(l, R, g), typeof i.UNSAFE_componentWillUpdate == "function" && i.UNSAFE_componentWillUpdate(
        l,
        R,
        g
      )), typeof i.componentDidUpdate == "function" && (t.flags |= 4), typeof i.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof i.componentDidUpdate != "function" || o === e.memoizedProps && N === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && N === e.memoizedState || (t.flags |= 1024), t.memoizedProps = l, t.memoizedState = R), i.props = l, i.state = R, i.context = g, l = O) : (typeof i.componentDidUpdate != "function" || o === e.memoizedProps && N === e.memoizedState || (t.flags |= 4), typeof i.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && N === e.memoizedState || (t.flags |= 1024), l = !1);
    }
    return i = l, Xs(e, t), l = (t.flags & 128) !== 0, i || l ? (i = t.stateNode, a = l && typeof a.getDerivedStateFromError != "function" ? null : i.render(), t.flags |= 1, e !== null && l ? (t.child = Ll(
      t,
      e.child,
      null,
      n
    ), t.child = Ll(
      t,
      null,
      a,
      n
    )) : dt(e, t, a, n), t.memoizedState = i.state, e = t.child) : e = Da(
      e,
      t,
      n
    ), e;
  }
  function _f(e, t, a, l) {
    return zl(), t.flags |= 256, dt(e, t, a, l), t.child;
  }
  var co = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null
  };
  function oo(e) {
    return { baseLanes: e, cachePool: Gd() };
  }
  function ro(e, t, a) {
    return e = e !== null ? e.childLanes & ~a : 0, t && (e |= Ot), e;
  }
  function $f(e, t, a) {
    var l = t.pendingProps, n = !1, i = (t.flags & 128) !== 0, o;
    if ((o = i) || (o = e !== null && e.memoizedState === null ? !1 : (We.current & 2) !== 0), o && (n = !0, t.flags &= -129), o = (t.flags & 32) !== 0, t.flags &= -33, e === null) {
      if (xe) {
        if (n ? el(t) : tl(), (e = Be) ? (e = uh(
          e,
          Vt
        ), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
          dehydrated: e,
          treeContext: Ja !== null ? { id: ra, overflow: da } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, a = Dd(e), a.return = t, t.child = a, ot = t, Be = null)) : e = null, e === null) throw Fa(t);
        return Jo(e) ? t.lanes = 32 : t.lanes = 536870912, null;
      }
      var f = l.children;
      return l = l.fallback, n ? (tl(), n = t.mode, f = Ks(
        { mode: "hidden", children: f },
        n
      ), l = Dl(
        l,
        n,
        a,
        null
      ), f.return = t, l.return = t, f.sibling = l, t.child = f, l = t.child, l.memoizedState = oo(a), l.childLanes = ro(
        e,
        o,
        a
      ), t.memoizedState = co, yi(null, l)) : (el(t), fo(t, f));
    }
    var g = e.memoizedState;
    if (g !== null && (f = g.dehydrated, f !== null)) {
      if (i)
        t.flags & 256 ? (el(t), t.flags &= -257, t = mo(
          e,
          t,
          a
        )) : t.memoizedState !== null ? (tl(), t.child = e.child, t.flags |= 128, t = null) : (tl(), f = l.fallback, n = t.mode, l = Ks(
          { mode: "visible", children: l.children },
          n
        ), f = Dl(
          f,
          n,
          a,
          null
        ), f.flags |= 2, l.return = t, f.return = t, l.sibling = f, t.child = l, Ll(
          t,
          e.child,
          null,
          a
        ), l = t.child, l.memoizedState = oo(a), l.childLanes = ro(
          e,
          o,
          a
        ), t.memoizedState = co, t = yi(null, l));
      else if (el(t), Jo(f)) {
        if (o = f.nextSibling && f.nextSibling.dataset, o) var M = o.dgst;
        o = M, l = Error(r(419)), l.stack = "", l.digest = o, ii({ value: l, source: null, stack: null }), t = mo(
          e,
          t,
          a
        );
      } else if (et || gn(e, t, a, !1), o = (a & e.childLanes) !== 0, et || o) {
        if (o = Le, o !== null && (l = Vn(o, a), l !== 0 && l !== g.retryLane))
          throw g.retryLane = l, Rl(e, l), Mt(o, e, l), so;
        Vo(f) || $s(), t = mo(
          e,
          t,
          a
        );
      } else
        Vo(f) ? (t.flags |= 192, t.child = e.child, t = null) : (e = g.treeContext, Be = Yt(
          f.nextSibling
        ), ot = t, xe = !0, Ya = null, Vt = !1, e !== null && Id(t, e), t = fo(
          t,
          l.children
        ), t.flags |= 4096);
      return t;
    }
    return n ? (tl(), f = l.fallback, n = t.mode, g = e.child, M = g.sibling, l = xa(g, {
      mode: "hidden",
      children: l.children
    }), l.subtreeFlags = g.subtreeFlags & 65011712, M !== null ? f = xa(
      M,
      f
    ) : (f = Dl(
      f,
      n,
      a,
      null
    ), f.flags |= 2), f.return = t, l.return = t, l.sibling = f, t.child = l, yi(null, l), l = t.child, f = e.child.memoizedState, f === null ? f = oo(a) : (n = f.cachePool, n !== null ? (g = _e._currentValue, n = n.parent !== g ? { parent: g, pool: g } : n) : n = Gd(), f = {
      baseLanes: f.baseLanes | a,
      cachePool: n
    }), l.memoizedState = f, l.childLanes = ro(
      e,
      o,
      a
    ), t.memoizedState = co, yi(e.child, l)) : (el(t), a = e.child, e = a.sibling, a = xa(a, {
      mode: "visible",
      children: l.children
    }), a.return = t, a.sibling = null, e !== null && (o = t.deletions, o === null ? (t.deletions = [e], t.flags |= 16) : o.push(e)), t.child = a, t.memoizedState = null, a);
  }
  function fo(e, t) {
    return t = Ks(
      { mode: "visible", children: t },
      e.mode
    ), t.return = e, e.child = t;
  }
  function Ks(e, t) {
    return e = zt(22, e, null, t), e.lanes = 0, e;
  }
  function mo(e, t, a) {
    return Ll(t, e.child, null, a), e = fo(
      t,
      t.pendingProps.children
    ), e.flags |= 2, t.memoizedState = null, e;
  }
  function em(e, t, a) {
    e.lanes |= t;
    var l = e.alternate;
    l !== null && (l.lanes |= t), Mc(e.return, t, a);
  }
  function ho(e, t, a, l, n, i) {
    var o = e.memoizedState;
    o === null ? e.memoizedState = {
      isBackwards: t,
      rendering: null,
      renderingStartTime: 0,
      last: l,
      tail: a,
      tailMode: n,
      treeForkCount: i
    } : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = l, o.tail = a, o.tailMode = n, o.treeForkCount = i);
  }
  function tm(e, t, a) {
    var l = t.pendingProps, n = l.revealOrder, i = l.tail;
    l = l.children;
    var o = We.current, f = (o & 2) !== 0;
    if (f ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, K(We, o), dt(e, t, l, a), l = xe ? ni : 0, !f && e !== null && (e.flags & 128) !== 0)
      e: for (e = t.child; e !== null; ) {
        if (e.tag === 13)
          e.memoizedState !== null && em(e, a, t);
        else if (e.tag === 19)
          em(e, a, t);
        else if (e.child !== null) {
          e.child.return = e, e = e.child;
          continue;
        }
        if (e === t) break e;
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t)
            break e;
          e = e.return;
        }
        e.sibling.return = e.return, e = e.sibling;
      }
    switch (n) {
      case "forwards":
        for (a = t.child, n = null; a !== null; )
          e = a.alternate, e !== null && zs(e) === null && (n = a), a = a.sibling;
        a = n, a === null ? (n = t.child, t.child = null) : (n = a.sibling, a.sibling = null), ho(
          t,
          !1,
          n,
          a,
          i,
          l
        );
        break;
      case "backwards":
      case "unstable_legacy-backwards":
        for (a = null, n = t.child, t.child = null; n !== null; ) {
          if (e = n.alternate, e !== null && zs(e) === null) {
            t.child = n;
            break;
          }
          e = n.sibling, n.sibling = a, a = n, n = e;
        }
        ho(
          t,
          !0,
          a,
          null,
          i,
          l
        );
        break;
      case "together":
        ho(
          t,
          !1,
          null,
          null,
          void 0,
          l
        );
        break;
      default:
        t.memoizedState = null;
    }
    return t.child;
  }
  function Da(e, t, a) {
    if (e !== null && (t.dependencies = e.dependencies), nl |= t.lanes, (a & t.childLanes) === 0)
      if (e !== null) {
        if (gn(
          e,
          t,
          a,
          !1
        ), (a & t.childLanes) === 0)
          return null;
      } else return null;
    if (e !== null && t.child !== e.child)
      throw Error(r(153));
    if (t.child !== null) {
      for (e = t.child, a = xa(e, e.pendingProps), t.child = a, a.return = t; e.sibling !== null; )
        e = e.sibling, a = a.sibling = xa(e, e.pendingProps), a.return = t;
      a.sibling = null;
    }
    return t.child;
  }
  function go(e, t) {
    return (e.lanes & t) !== 0 ? !0 : (e = e.dependencies, !!(e !== null && Ts(e)));
  }
  function xp(e, t, a) {
    switch (t.tag) {
      case 3:
        Je(t, t.stateNode.containerInfo), Wa(t, _e, e.memoizedState.cache), zl();
        break;
      case 27:
      case 5:
        Pt(t);
        break;
      case 4:
        Je(t, t.stateNode.containerInfo);
        break;
      case 10:
        Wa(
          t,
          t.type,
          t.memoizedProps.value
        );
        break;
      case 31:
        if (t.memoizedState !== null)
          return t.flags |= 128, Bc(t), null;
        break;
      case 13:
        var l = t.memoizedState;
        if (l !== null)
          return l.dehydrated !== null ? (el(t), t.flags |= 128, null) : (a & t.child.childLanes) !== 0 ? $f(e, t, a) : (el(t), e = Da(
            e,
            t,
            a
          ), e !== null ? e.sibling : null);
        el(t);
        break;
      case 19:
        var n = (e.flags & 128) !== 0;
        if (l = (a & t.childLanes) !== 0, l || (gn(
          e,
          t,
          a,
          !1
        ), l = (a & t.childLanes) !== 0), n) {
          if (l)
            return tm(
              e,
              t,
              a
            );
          t.flags |= 128;
        }
        if (n = t.memoizedState, n !== null && (n.rendering = null, n.tail = null, n.lastEffect = null), K(We, We.current), l) break;
        return null;
      case 22:
        return t.lanes = 0, Jf(
          e,
          t,
          a,
          t.pendingProps
        );
      case 24:
        Wa(t, _e, e.memoizedState.cache);
    }
    return Da(e, t, a);
  }
  function am(e, t, a) {
    if (e !== null)
      if (e.memoizedProps !== t.pendingProps)
        et = !0;
      else {
        if (!go(e, a) && (t.flags & 128) === 0)
          return et = !1, xp(
            e,
            t,
            a
          );
        et = (e.flags & 131072) !== 0;
      }
    else
      et = !1, xe && (t.flags & 1048576) !== 0 && wd(t, ni, t.index);
    switch (t.lanes = 0, t.tag) {
      case 16:
        e: {
          var l = t.pendingProps;
          if (e = Ol(t.elementType), t.type = e, typeof e == "function")
            Ac(e) ? (l = Gl(e, l), t.tag = 1, t = Pf(
              null,
              t,
              e,
              l,
              a
            )) : (t.tag = 0, t = uo(
              null,
              t,
              e,
              l,
              a
            ));
          else {
            if (e != null) {
              var n = e.$$typeof;
              if (n === de) {
                t.tag = 11, t = Kf(
                  null,
                  t,
                  e,
                  l,
                  a
                );
                break e;
              } else if (n === ne) {
                t.tag = 14, t = Zf(
                  null,
                  t,
                  e,
                  l,
                  a
                );
                break e;
              }
            }
            throw t = he(e) || e, Error(r(306, t, ""));
          }
        }
        return t;
      case 0:
        return uo(
          e,
          t,
          t.type,
          t.pendingProps,
          a
        );
      case 1:
        return l = t.type, n = Gl(
          l,
          t.pendingProps
        ), Pf(
          e,
          t,
          l,
          n,
          a
        );
      case 3:
        e: {
          if (Je(
            t,
            t.stateNode.containerInfo
          ), e === null) throw Error(r(387));
          l = t.pendingProps;
          var i = t.memoizedState;
          n = i.element, Ic(e, t), fi(t, l, null, a);
          var o = t.memoizedState;
          if (l = o.cache, Wa(t, _e, l), l !== i.cache && Nc(
            t,
            [_e],
            a,
            !0
          ), di(), l = o.element, i.isDehydrated)
            if (i = {
              element: l,
              isDehydrated: !1,
              cache: o.cache
            }, t.updateQueue.baseState = i, t.memoizedState = i, t.flags & 256) {
              t = _f(
                e,
                t,
                l,
                a
              );
              break e;
            } else if (l !== n) {
              n = Xt(
                Error(r(424)),
                t
              ), ii(n), t = _f(
                e,
                t,
                l,
                a
              );
              break e;
            } else {
              switch (e = t.stateNode.containerInfo, e.nodeType) {
                case 9:
                  e = e.body;
                  break;
                default:
                  e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
              }
              for (Be = Yt(e.firstChild), ot = t, xe = !0, Ya = null, Vt = !0, a = Vd(
                t,
                null,
                l,
                a
              ), t.child = a; a; )
                a.flags = a.flags & -3 | 4096, a = a.sibling;
            }
          else {
            if (zl(), l === n) {
              t = Da(
                e,
                t,
                a
              );
              break e;
            }
            dt(e, t, l, a);
          }
          t = t.child;
        }
        return t;
      case 26:
        return Xs(e, t), e === null ? (a = mh(
          t.type,
          null,
          t.pendingProps,
          null
        )) ? t.memoizedState = a : xe || (a = t.type, e = t.pendingProps, l = su(
          fe.current
        ).createElement(a), l[ct] = t, l[St] = e, ft(l, a, e), st(l), t.stateNode = l) : t.memoizedState = mh(
          t.type,
          e.memoizedProps,
          t.pendingProps,
          e.memoizedState
        ), null;
      case 27:
        return Pt(t), e === null && xe && (l = t.stateNode = rh(
          t.type,
          t.pendingProps,
          fe.current
        ), ot = t, Vt = !0, n = Be, ol(t.type) ? (Yo = n, Be = Yt(l.firstChild)) : Be = n), dt(
          e,
          t,
          t.pendingProps.children,
          a
        ), Xs(e, t), e === null && (t.flags |= 4194304), t.child;
      case 5:
        return e === null && xe && ((n = l = Be) && (l = t1(
          l,
          t.type,
          t.pendingProps,
          Vt
        ), l !== null ? (t.stateNode = l, ot = t, Be = Yt(l.firstChild), Vt = !1, n = !0) : n = !1), n || Fa(t)), Pt(t), n = t.type, i = t.pendingProps, o = e !== null ? e.memoizedProps : null, l = i.children, Xo(n, i) ? l = null : o !== null && Xo(n, o) && (t.flags |= 32), t.memoizedState !== null && (n = Hc(
          e,
          t,
          pp,
          null,
          null,
          a
        ), zi._currentValue = n), Xs(e, t), dt(e, t, l, a), t.child;
      case 6:
        return e === null && xe && ((e = a = Be) && (a = a1(
          a,
          t.pendingProps,
          Vt
        ), a !== null ? (t.stateNode = a, ot = t, Be = null, e = !0) : e = !1), e || Fa(t)), null;
      case 13:
        return $f(e, t, a);
      case 4:
        return Je(
          t,
          t.stateNode.containerInfo
        ), l = t.pendingProps, e === null ? t.child = Ll(
          t,
          null,
          l,
          a
        ) : dt(e, t, l, a), t.child;
      case 11:
        return Kf(
          e,
          t,
          t.type,
          t.pendingProps,
          a
        );
      case 7:
        return dt(
          e,
          t,
          t.pendingProps,
          a
        ), t.child;
      case 8:
        return dt(
          e,
          t,
          t.pendingProps.children,
          a
        ), t.child;
      case 12:
        return dt(
          e,
          t,
          t.pendingProps.children,
          a
        ), t.child;
      case 10:
        return l = t.pendingProps, Wa(t, t.type, l.value), dt(e, t, l.children, a), t.child;
      case 9:
        return n = t.type._context, l = t.pendingProps.children, Il(t), n = rt(n), l = l(n), t.flags |= 1, dt(e, t, l, a), t.child;
      case 14:
        return Zf(
          e,
          t,
          t.type,
          t.pendingProps,
          a
        );
      case 15:
        return Vf(
          e,
          t,
          t.type,
          t.pendingProps,
          a
        );
      case 19:
        return tm(e, t, a);
      case 31:
        return Tp(e, t, a);
      case 22:
        return Jf(
          e,
          t,
          a,
          t.pendingProps
        );
      case 24:
        return Il(t), l = rt(_e), e === null ? (n = Dc(), n === null && (n = Le, i = Uc(), n.pooledCache = i, i.refCount++, i !== null && (n.pooledCacheLanes |= a), n = i), t.memoizedState = { parent: l, cache: n }, wc(t), Wa(t, _e, n)) : ((e.lanes & a) !== 0 && (Ic(e, t), fi(t, null, null, a), di()), n = e.memoizedState, i = t.memoizedState, n.parent !== l ? (n = { parent: l, cache: l }, t.memoizedState = n, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = n), Wa(t, _e, l)) : (l = i.cache, Wa(t, _e, l), l !== n.cache && Nc(
          t,
          [_e],
          a,
          !0
        ))), dt(
          e,
          t,
          t.pendingProps.children,
          a
        ), t.child;
      case 29:
        throw t.pendingProps;
    }
    throw Error(r(156, t.tag));
  }
  function za(e) {
    e.flags |= 4;
  }
  function po(e, t, a, l, n) {
    if ((t = (e.mode & 32) !== 0) && (t = !1), t) {
      if (e.flags |= 16777216, (n & 335544128) === n)
        if (e.stateNode.complete) e.flags |= 8192;
        else if (Um()) e.flags |= 8192;
        else
          throw ql = Ns, zc;
    } else e.flags &= -16777217;
  }
  function lm(e, t) {
    if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0)
      e.flags &= -16777217;
    else if (e.flags |= 16777216, !vh(t))
      if (Um()) e.flags |= 8192;
      else
        throw ql = Ns, zc;
  }
  function Zs(e, t) {
    t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag !== 22 ? us() : 536870912, e.lanes |= t, Mn |= t);
  }
  function vi(e, t) {
    if (!xe)
      switch (e.tailMode) {
        case "hidden":
          t = e.tail;
          for (var a = null; t !== null; )
            t.alternate !== null && (a = t), t = t.sibling;
          a === null ? e.tail = null : a.sibling = null;
          break;
        case "collapsed":
          a = e.tail;
          for (var l = null; a !== null; )
            a.alternate !== null && (l = a), a = a.sibling;
          l === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : l.sibling = null;
      }
  }
  function Ge(e) {
    var t = e.alternate !== null && e.alternate.child === e.child, a = 0, l = 0;
    if (t)
      for (var n = e.child; n !== null; )
        a |= n.lanes | n.childLanes, l |= n.subtreeFlags & 65011712, l |= n.flags & 65011712, n.return = e, n = n.sibling;
    else
      for (n = e.child; n !== null; )
        a |= n.lanes | n.childLanes, l |= n.subtreeFlags, l |= n.flags, n.return = e, n = n.sibling;
    return e.subtreeFlags |= l, e.childLanes = a, t;
  }
  function kp(e, t, a) {
    var l = t.pendingProps;
    switch (Cc(t), t.tag) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return Ge(t), null;
      case 1:
        return Ge(t), null;
      case 3:
        return a = t.stateNode, l = null, e !== null && (l = e.memoizedState.cache), t.memoizedState.cache !== l && (t.flags |= 2048), Na(_e), De(), a.pendingContext && (a.context = a.pendingContext, a.pendingContext = null), (e === null || e.child === null) && (hn(t) ? za(t) : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024, xc())), Ge(t), null;
      case 26:
        var n = t.type, i = t.memoizedState;
        return e === null ? (za(t), i !== null ? (Ge(t), lm(t, i)) : (Ge(t), po(
          t,
          n,
          null,
          l,
          a
        ))) : i ? i !== e.memoizedState ? (za(t), Ge(t), lm(t, i)) : (Ge(t), t.flags &= -16777217) : (e = e.memoizedProps, e !== l && za(t), Ge(t), po(
          t,
          n,
          e,
          l,
          a
        )), null;
      case 27:
        if (_t(t), a = fe.current, n = t.type, e !== null && t.stateNode != null)
          e.memoizedProps !== l && za(t);
        else {
          if (!l) {
            if (t.stateNode === null)
              throw Error(r(166));
            return Ge(t), null;
          }
          e = V.current, hn(t) ? jd(t) : (e = rh(n, l, a), t.stateNode = e, za(t));
        }
        return Ge(t), null;
      case 5:
        if (_t(t), n = t.type, e !== null && t.stateNode != null)
          e.memoizedProps !== l && za(t);
        else {
          if (!l) {
            if (t.stateNode === null)
              throw Error(r(166));
            return Ge(t), null;
          }
          if (i = V.current, hn(t))
            jd(t);
          else {
            var o = su(
              fe.current
            );
            switch (i) {
              case 1:
                i = o.createElementNS(
                  "http://www.w3.org/2000/svg",
                  n
                );
                break;
              case 2:
                i = o.createElementNS(
                  "http://www.w3.org/1998/Math/MathML",
                  n
                );
                break;
              default:
                switch (n) {
                  case "svg":
                    i = o.createElementNS(
                      "http://www.w3.org/2000/svg",
                      n
                    );
                    break;
                  case "math":
                    i = o.createElementNS(
                      "http://www.w3.org/1998/Math/MathML",
                      n
                    );
                    break;
                  case "script":
                    i = o.createElement("div"), i.innerHTML = "<script><\/script>", i = i.removeChild(
                      i.firstChild
                    );
                    break;
                  case "select":
                    i = typeof l.is == "string" ? o.createElement("select", {
                      is: l.is
                    }) : o.createElement("select"), l.multiple ? i.multiple = !0 : l.size && (i.size = l.size);
                    break;
                  default:
                    i = typeof l.is == "string" ? o.createElement(n, { is: l.is }) : o.createElement(n);
                }
            }
            i[ct] = t, i[St] = l;
            e: for (o = t.child; o !== null; ) {
              if (o.tag === 5 || o.tag === 6)
                i.appendChild(o.stateNode);
              else if (o.tag !== 4 && o.tag !== 27 && o.child !== null) {
                o.child.return = o, o = o.child;
                continue;
              }
              if (o === t) break e;
              for (; o.sibling === null; ) {
                if (o.return === null || o.return === t)
                  break e;
                o = o.return;
              }
              o.sibling.return = o.return, o = o.sibling;
            }
            t.stateNode = i;
            e: switch (ft(i, n, l), n) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                l = !!l.autoFocus;
                break e;
              case "img":
                l = !0;
                break e;
              default:
                l = !1;
            }
            l && za(t);
          }
        }
        return Ge(t), po(
          t,
          t.type,
          e === null ? null : e.memoizedProps,
          t.pendingProps,
          a
        ), null;
      case 6:
        if (e && t.stateNode != null)
          e.memoizedProps !== l && za(t);
        else {
          if (typeof l != "string" && t.stateNode === null)
            throw Error(r(166));
          if (e = fe.current, hn(t)) {
            if (e = t.stateNode, a = t.memoizedProps, l = null, n = ot, n !== null)
              switch (n.tag) {
                case 27:
                case 5:
                  l = n.memoizedProps;
              }
            e[ct] = t, e = !!(e.nodeValue === a || l !== null && l.suppressHydrationWarning === !0 || $m(e.nodeValue, a)), e || Fa(t, !0);
          } else
            e = su(e).createTextNode(
              l
            ), e[ct] = t, t.stateNode = e;
        }
        return Ge(t), null;
      case 31:
        if (a = t.memoizedState, e === null || e.memoizedState !== null) {
          if (l = hn(t), a !== null) {
            if (e === null) {
              if (!l) throw Error(r(318));
              if (e = t.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(r(557));
              e[ct] = t;
            } else
              zl(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Ge(t), e = !1;
          } else
            a = xc(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), e = !0;
          if (!e)
            return t.flags & 256 ? (It(t), t) : (It(t), null);
          if ((t.flags & 128) !== 0)
            throw Error(r(558));
        }
        return Ge(t), null;
      case 13:
        if (l = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
          if (n = hn(t), l !== null && l.dehydrated !== null) {
            if (e === null) {
              if (!n) throw Error(r(318));
              if (n = t.memoizedState, n = n !== null ? n.dehydrated : null, !n) throw Error(r(317));
              n[ct] = t;
            } else
              zl(), (t.flags & 128) === 0 && (t.memoizedState = null), t.flags |= 4;
            Ge(t), n = !1;
          } else
            n = xc(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), n = !0;
          if (!n)
            return t.flags & 256 ? (It(t), t) : (It(t), null);
        }
        return It(t), (t.flags & 128) !== 0 ? (t.lanes = a, t) : (a = l !== null, e = e !== null && e.memoizedState !== null, a && (l = t.child, n = null, l.alternate !== null && l.alternate.memoizedState !== null && l.alternate.memoizedState.cachePool !== null && (n = l.alternate.memoizedState.cachePool.pool), i = null, l.memoizedState !== null && l.memoizedState.cachePool !== null && (i = l.memoizedState.cachePool.pool), i !== n && (l.flags |= 2048)), a !== e && a && (t.child.flags |= 8192), Zs(t, t.updateQueue), Ge(t), null);
      case 4:
        return De(), e === null && Lo(t.stateNode.containerInfo), Ge(t), null;
      case 10:
        return Na(t.type), Ge(t), null;
      case 19:
        if (I(We), l = t.memoizedState, l === null) return Ge(t), null;
        if (n = (t.flags & 128) !== 0, i = l.rendering, i === null)
          if (n) vi(l, !1);
          else {
            if (Fe !== 0 || e !== null && (e.flags & 128) !== 0)
              for (e = t.child; e !== null; ) {
                if (i = zs(e), i !== null) {
                  for (t.flags |= 128, vi(l, !1), e = i.updateQueue, t.updateQueue = e, Zs(t, e), t.subtreeFlags = 0, e = a, a = t.child; a !== null; )
                    Rd(a, e), a = a.sibling;
                  return K(
                    We,
                    We.current & 1 | 2
                  ), xe && ka(t, l.treeForkCount), t.child;
                }
                e = e.sibling;
              }
            l.tail !== null && nt() > Ws && (t.flags |= 128, n = !0, vi(l, !1), t.lanes = 4194304);
          }
        else {
          if (!n)
            if (e = zs(i), e !== null) {
              if (t.flags |= 128, n = !0, e = e.updateQueue, t.updateQueue = e, Zs(t, e), vi(l, !0), l.tail === null && l.tailMode === "hidden" && !i.alternate && !xe)
                return Ge(t), null;
            } else
              2 * nt() - l.renderingStartTime > Ws && a !== 536870912 && (t.flags |= 128, n = !0, vi(l, !1), t.lanes = 4194304);
          l.isBackwards ? (i.sibling = t.child, t.child = i) : (e = l.last, e !== null ? e.sibling = i : t.child = i, l.last = i);
        }
        return l.tail !== null ? (e = l.tail, l.rendering = e, l.tail = e.sibling, l.renderingStartTime = nt(), e.sibling = null, a = We.current, K(
          We,
          n ? a & 1 | 2 : a & 1
        ), xe && ka(t, l.treeForkCount), e) : (Ge(t), null);
      case 22:
      case 23:
        return It(t), Lc(), l = t.memoizedState !== null, e !== null ? e.memoizedState !== null !== l && (t.flags |= 8192) : l && (t.flags |= 8192), l ? (a & 536870912) !== 0 && (t.flags & 128) === 0 && (Ge(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Ge(t), a = t.updateQueue, a !== null && Zs(t, a.retryQueue), a = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), l = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (l = t.memoizedState.cachePool.pool), l !== a && (t.flags |= 2048), e !== null && I(jl), null;
      case 24:
        return a = null, e !== null && (a = e.memoizedState.cache), t.memoizedState.cache !== a && (t.flags |= 2048), Na(_e), Ge(t), null;
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(r(156, t.tag));
  }
  function Mp(e, t) {
    switch (Cc(t), t.tag) {
      case 1:
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 3:
        return Na(_e), De(), e = t.flags, (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128, t) : null;
      case 26:
      case 27:
      case 5:
        return _t(t), null;
      case 31:
        if (t.memoizedState !== null) {
          if (It(t), t.alternate === null)
            throw Error(r(340));
          zl();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 13:
        if (It(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
          if (t.alternate === null)
            throw Error(r(340));
          zl();
        }
        return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 19:
        return I(We), null;
      case 4:
        return De(), null;
      case 10:
        return Na(t.type), null;
      case 22:
      case 23:
        return It(t), Lc(), e !== null && I(jl), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
      case 24:
        return Na(_e), null;
      case 25:
        return null;
      default:
        return null;
    }
  }
  function nm(e, t) {
    switch (Cc(t), t.tag) {
      case 3:
        Na(_e), De();
        break;
      case 26:
      case 27:
      case 5:
        _t(t);
        break;
      case 4:
        De();
        break;
      case 31:
        t.memoizedState !== null && It(t);
        break;
      case 13:
        It(t);
        break;
      case 19:
        I(We);
        break;
      case 10:
        Na(t.type);
        break;
      case 22:
      case 23:
        It(t), Lc(), e !== null && I(jl);
        break;
      case 24:
        Na(_e);
    }
  }
  function Ai(e, t) {
    try {
      var a = t.updateQueue, l = a !== null ? a.lastEffect : null;
      if (l !== null) {
        var n = l.next;
        a = n;
        do {
          if ((a.tag & e) === e) {
            l = void 0;
            var i = a.create, o = a.inst;
            l = i(), o.destroy = l;
          }
          a = a.next;
        } while (a !== n);
      }
    } catch (f) {
      we(t, t.return, f);
    }
  }
  function al(e, t, a) {
    try {
      var l = t.updateQueue, n = l !== null ? l.lastEffect : null;
      if (n !== null) {
        var i = n.next;
        l = i;
        do {
          if ((l.tag & e) === e) {
            var o = l.inst, f = o.destroy;
            if (f !== void 0) {
              o.destroy = void 0, n = t;
              var g = a, M = f;
              try {
                M();
              } catch (O) {
                we(
                  n,
                  g,
                  O
                );
              }
            }
          }
          l = l.next;
        } while (l !== i);
      }
    } catch (O) {
      we(t, t.return, O);
    }
  }
  function im(e) {
    var t = e.updateQueue;
    if (t !== null) {
      var a = e.stateNode;
      try {
        Yd(t, a);
      } catch (l) {
        we(e, e.return, l);
      }
    }
  }
  function sm(e, t, a) {
    a.props = Gl(
      e.type,
      e.memoizedProps
    ), a.state = e.memoizedState;
    try {
      a.componentWillUnmount();
    } catch (l) {
      we(e, t, l);
    }
  }
  function bi(e, t) {
    try {
      var a = e.ref;
      if (a !== null) {
        switch (e.tag) {
          case 26:
          case 27:
          case 5:
            var l = e.stateNode;
            break;
          case 30:
            l = e.stateNode;
            break;
          default:
            l = e.stateNode;
        }
        typeof a == "function" ? e.refCleanup = a(l) : a.current = l;
      }
    } catch (n) {
      we(e, t, n);
    }
  }
  function fa(e, t) {
    var a = e.ref, l = e.refCleanup;
    if (a !== null)
      if (typeof l == "function")
        try {
          l();
        } catch (n) {
          we(e, t, n);
        } finally {
          e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
        }
      else if (typeof a == "function")
        try {
          a(null);
        } catch (n) {
          we(e, t, n);
        }
      else a.current = null;
  }
  function um(e) {
    var t = e.type, a = e.memoizedProps, l = e.stateNode;
    try {
      e: switch (t) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          a.autoFocus && l.focus();
          break e;
        case "img":
          a.src ? l.src = a.src : a.srcSet && (l.srcset = a.srcSet);
      }
    } catch (n) {
      we(e, e.return, n);
    }
  }
  function yo(e, t, a) {
    try {
      var l = e.stateNode;
      Fp(l, e.type, a, t), l[St] = t;
    } catch (n) {
      we(e, e.return, n);
    }
  }
  function cm(e) {
    return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && ol(e.type) || e.tag === 4;
  }
  function vo(e) {
    e: for (; ; ) {
      for (; e.sibling === null; ) {
        if (e.return === null || cm(e.return)) return null;
        e = e.return;
      }
      for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
        if (e.tag === 27 && ol(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue e;
        e.child.return = e, e = e.child;
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function Ao(e, t, a) {
    var l = e.tag;
    if (l === 5 || l === 6)
      e = e.stateNode, t ? (a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a).insertBefore(e, t) : (t = a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a, t.appendChild(e), a = a._reactRootContainer, a != null || t.onclick !== null || (t.onclick = Ca));
    else if (l !== 4 && (l === 27 && ol(e.type) && (a = e.stateNode, t = null), e = e.child, e !== null))
      for (Ao(e, t, a), e = e.sibling; e !== null; )
        Ao(e, t, a), e = e.sibling;
  }
  function Vs(e, t, a) {
    var l = e.tag;
    if (l === 5 || l === 6)
      e = e.stateNode, t ? a.insertBefore(e, t) : a.appendChild(e);
    else if (l !== 4 && (l === 27 && ol(e.type) && (a = e.stateNode), e = e.child, e !== null))
      for (Vs(e, t, a), e = e.sibling; e !== null; )
        Vs(e, t, a), e = e.sibling;
  }
  function om(e) {
    var t = e.stateNode, a = e.memoizedProps;
    try {
      for (var l = e.type, n = t.attributes; n.length; )
        t.removeAttributeNode(n[0]);
      ft(t, l, a), t[ct] = e, t[St] = a;
    } catch (i) {
      we(e, e.return, i);
    }
  }
  var wa = !1, tt = !1, bo = !1, rm = typeof WeakSet == "function" ? WeakSet : Set, ut = null;
  function Np(e, t) {
    if (e = e.containerInfo, Ho = mu, e = Sd(e), fc(e)) {
      if ("selectionStart" in e)
        var a = {
          start: e.selectionStart,
          end: e.selectionEnd
        };
      else
        e: {
          a = (a = e.ownerDocument) && a.defaultView || window;
          var l = a.getSelection && a.getSelection();
          if (l && l.rangeCount !== 0) {
            a = l.anchorNode;
            var n = l.anchorOffset, i = l.focusNode;
            l = l.focusOffset;
            try {
              a.nodeType, i.nodeType;
            } catch {
              a = null;
              break e;
            }
            var o = 0, f = -1, g = -1, M = 0, O = 0, L = e, N = null;
            t: for (; ; ) {
              for (var R; L !== a || n !== 0 && L.nodeType !== 3 || (f = o + n), L !== i || l !== 0 && L.nodeType !== 3 || (g = o + l), L.nodeType === 3 && (o += L.nodeValue.length), (R = L.firstChild) !== null; )
                N = L, L = R;
              for (; ; ) {
                if (L === e) break t;
                if (N === a && ++M === n && (f = o), N === i && ++O === l && (g = o), (R = L.nextSibling) !== null) break;
                L = N, N = L.parentNode;
              }
              L = R;
            }
            a = f === -1 || g === -1 ? null : { start: f, end: g };
          } else a = null;
        }
      a = a || { start: 0, end: 0 };
    } else a = null;
    for (Qo = { focusedElem: e, selectionRange: a }, mu = !1, ut = t; ut !== null; )
      if (t = ut, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null)
        e.return = t, ut = e;
      else
        for (; ut !== null; ) {
          switch (t = ut, i = t.alternate, e = t.flags, t.tag) {
            case 0:
              if ((e & 4) !== 0 && (e = t.updateQueue, e = e !== null ? e.events : null, e !== null))
                for (a = 0; a < e.length; a++)
                  n = e[a], n.ref.impl = n.nextImpl;
              break;
            case 11:
            case 15:
              break;
            case 1:
              if ((e & 1024) !== 0 && i !== null) {
                e = void 0, a = t, n = i.memoizedProps, i = i.memoizedState, l = a.stateNode;
                try {
                  var _ = Gl(
                    a.type,
                    n
                  );
                  e = l.getSnapshotBeforeUpdate(
                    _,
                    i
                  ), l.__reactInternalSnapshotBeforeUpdate = e;
                } catch (oe) {
                  we(
                    a,
                    a.return,
                    oe
                  );
                }
              }
              break;
            case 3:
              if ((e & 1024) !== 0) {
                if (e = t.stateNode.containerInfo, a = e.nodeType, a === 9)
                  Zo(e);
                else if (a === 1)
                  switch (e.nodeName) {
                    case "HEAD":
                    case "HTML":
                    case "BODY":
                      Zo(e);
                      break;
                    default:
                      e.textContent = "";
                  }
              }
              break;
            case 5:
            case 26:
            case 27:
            case 6:
            case 4:
            case 17:
              break;
            default:
              if ((e & 1024) !== 0) throw Error(r(163));
          }
          if (e = t.sibling, e !== null) {
            e.return = t.return, ut = e;
            break;
          }
          ut = t.return;
        }
  }
  function dm(e, t, a) {
    var l = a.flags;
    switch (a.tag) {
      case 0:
      case 11:
      case 15:
        ja(e, a), l & 4 && Ai(5, a);
        break;
      case 1:
        if (ja(e, a), l & 4)
          if (e = a.stateNode, t === null)
            try {
              e.componentDidMount();
            } catch (o) {
              we(a, a.return, o);
            }
          else {
            var n = Gl(
              a.type,
              t.memoizedProps
            );
            t = t.memoizedState;
            try {
              e.componentDidUpdate(
                n,
                t,
                e.__reactInternalSnapshotBeforeUpdate
              );
            } catch (o) {
              we(
                a,
                a.return,
                o
              );
            }
          }
        l & 64 && im(a), l & 512 && bi(a, a.return);
        break;
      case 3:
        if (ja(e, a), l & 64 && (e = a.updateQueue, e !== null)) {
          if (t = null, a.child !== null)
            switch (a.child.tag) {
              case 27:
              case 5:
                t = a.child.stateNode;
                break;
              case 1:
                t = a.child.stateNode;
            }
          try {
            Yd(e, t);
          } catch (o) {
            we(a, a.return, o);
          }
        }
        break;
      case 27:
        t === null && l & 4 && om(a);
      case 26:
      case 5:
        ja(e, a), t === null && l & 4 && um(a), l & 512 && bi(a, a.return);
        break;
      case 12:
        ja(e, a);
        break;
      case 31:
        ja(e, a), l & 4 && hm(e, a);
        break;
      case 13:
        ja(e, a), l & 4 && gm(e, a), l & 64 && (e = a.memoizedState, e !== null && (e = e.dehydrated, e !== null && (a = qp.bind(
          null,
          a
        ), l1(e, a))));
        break;
      case 22:
        if (l = a.memoizedState !== null || wa, !l) {
          t = t !== null && t.memoizedState !== null || tt, n = wa;
          var i = tt;
          wa = l, (tt = t) && !i ? Oa(
            e,
            a,
            (a.subtreeFlags & 8772) !== 0
          ) : ja(e, a), wa = n, tt = i;
        }
        break;
      case 30:
        break;
      default:
        ja(e, a);
    }
  }
  function fm(e) {
    var t = e.alternate;
    t !== null && (e.alternate = null, fm(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && Fu(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
  }
  var Ke = null, Ct = !1;
  function Ia(e, t, a) {
    for (a = a.child; a !== null; )
      mm(e, t, a), a = a.sibling;
  }
  function mm(e, t, a) {
    if (pt && typeof pt.onCommitFiberUnmount == "function")
      try {
        pt.onCommitFiberUnmount(Rt, a);
      } catch {
      }
    switch (a.tag) {
      case 26:
        tt || fa(a, t), Ia(
          e,
          t,
          a
        ), a.memoizedState ? a.memoizedState.count-- : a.stateNode && (a = a.stateNode, a.parentNode.removeChild(a));
        break;
      case 27:
        tt || fa(a, t);
        var l = Ke, n = Ct;
        ol(a.type) && (Ke = a.stateNode, Ct = !1), Ia(
          e,
          t,
          a
        ), Ui(a.stateNode), Ke = l, Ct = n;
        break;
      case 5:
        tt || fa(a, t);
      case 6:
        if (l = Ke, n = Ct, Ke = null, Ia(
          e,
          t,
          a
        ), Ke = l, Ct = n, Ke !== null)
          if (Ct)
            try {
              (Ke.nodeType === 9 ? Ke.body : Ke.nodeName === "HTML" ? Ke.ownerDocument.body : Ke).removeChild(a.stateNode);
            } catch (i) {
              we(
                a,
                t,
                i
              );
            }
          else
            try {
              Ke.removeChild(a.stateNode);
            } catch (i) {
              we(
                a,
                t,
                i
              );
            }
        break;
      case 18:
        Ke !== null && (Ct ? (e = Ke, ih(
          e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e,
          a.stateNode
        ), jn(e)) : ih(Ke, a.stateNode));
        break;
      case 4:
        l = Ke, n = Ct, Ke = a.stateNode.containerInfo, Ct = !0, Ia(
          e,
          t,
          a
        ), Ke = l, Ct = n;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        al(2, a, t), tt || al(4, a, t), Ia(
          e,
          t,
          a
        );
        break;
      case 1:
        tt || (fa(a, t), l = a.stateNode, typeof l.componentWillUnmount == "function" && sm(
          a,
          t,
          l
        )), Ia(
          e,
          t,
          a
        );
        break;
      case 21:
        Ia(
          e,
          t,
          a
        );
        break;
      case 22:
        tt = (l = tt) || a.memoizedState !== null, Ia(
          e,
          t,
          a
        ), tt = l;
        break;
      default:
        Ia(
          e,
          t,
          a
        );
    }
  }
  function hm(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
      e = e.dehydrated;
      try {
        jn(e);
      } catch (a) {
        we(t, t.return, a);
      }
    }
  }
  function gm(e, t) {
    if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null))))
      try {
        jn(e);
      } catch (a) {
        we(t, t.return, a);
      }
  }
  function Up(e) {
    switch (e.tag) {
      case 31:
      case 13:
      case 19:
        var t = e.stateNode;
        return t === null && (t = e.stateNode = new rm()), t;
      case 22:
        return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new rm()), t;
      default:
        throw Error(r(435, e.tag));
    }
  }
  function Js(e, t) {
    var a = Up(e);
    t.forEach(function(l) {
      if (!a.has(l)) {
        a.add(l);
        var n = Lp.bind(null, e, l);
        l.then(n, n);
      }
    });
  }
  function Tt(e, t) {
    var a = t.deletions;
    if (a !== null)
      for (var l = 0; l < a.length; l++) {
        var n = a[l], i = e, o = t, f = o;
        e: for (; f !== null; ) {
          switch (f.tag) {
            case 27:
              if (ol(f.type)) {
                Ke = f.stateNode, Ct = !1;
                break e;
              }
              break;
            case 5:
              Ke = f.stateNode, Ct = !1;
              break e;
            case 3:
            case 4:
              Ke = f.stateNode.containerInfo, Ct = !0;
              break e;
          }
          f = f.return;
        }
        if (Ke === null) throw Error(r(160));
        mm(i, o, n), Ke = null, Ct = !1, i = n.alternate, i !== null && (i.return = null), n.return = null;
      }
    if (t.subtreeFlags & 13886)
      for (t = t.child; t !== null; )
        pm(t, e), t = t.sibling;
  }
  var na = null;
  function pm(e, t) {
    var a = e.alternate, l = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        Tt(t, e), xt(e), l & 4 && (al(3, e, e.return), Ai(3, e), al(5, e, e.return));
        break;
      case 1:
        Tt(t, e), xt(e), l & 512 && (tt || a === null || fa(a, a.return)), l & 64 && wa && (e = e.updateQueue, e !== null && (l = e.callbacks, l !== null && (a = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = a === null ? l : a.concat(l))));
        break;
      case 26:
        var n = na;
        if (Tt(t, e), xt(e), l & 512 && (tt || a === null || fa(a, a.return)), l & 4) {
          var i = a !== null ? a.memoizedState : null;
          if (l = e.memoizedState, a === null)
            if (l === null)
              if (e.stateNode === null) {
                e: {
                  l = e.type, a = e.memoizedProps, n = n.ownerDocument || n;
                  t: switch (l) {
                    case "title":
                      i = n.getElementsByTagName("title")[0], (!i || i[Jn] || i[ct] || i.namespaceURI === "http://www.w3.org/2000/svg" || i.hasAttribute("itemprop")) && (i = n.createElement(l), n.head.insertBefore(
                        i,
                        n.querySelector("head > title")
                      )), ft(i, l, a), i[ct] = e, st(i), l = i;
                      break e;
                    case "link":
                      var o = ph(
                        "link",
                        "href",
                        n
                      ).get(l + (a.href || ""));
                      if (o) {
                        for (var f = 0; f < o.length; f++)
                          if (i = o[f], i.getAttribute("href") === (a.href == null || a.href === "" ? null : a.href) && i.getAttribute("rel") === (a.rel == null ? null : a.rel) && i.getAttribute("title") === (a.title == null ? null : a.title) && i.getAttribute("crossorigin") === (a.crossOrigin == null ? null : a.crossOrigin)) {
                            o.splice(f, 1);
                            break t;
                          }
                      }
                      i = n.createElement(l), ft(i, l, a), n.head.appendChild(i);
                      break;
                    case "meta":
                      if (o = ph(
                        "meta",
                        "content",
                        n
                      ).get(l + (a.content || ""))) {
                        for (f = 0; f < o.length; f++)
                          if (i = o[f], i.getAttribute("content") === (a.content == null ? null : "" + a.content) && i.getAttribute("name") === (a.name == null ? null : a.name) && i.getAttribute("property") === (a.property == null ? null : a.property) && i.getAttribute("http-equiv") === (a.httpEquiv == null ? null : a.httpEquiv) && i.getAttribute("charset") === (a.charSet == null ? null : a.charSet)) {
                            o.splice(f, 1);
                            break t;
                          }
                      }
                      i = n.createElement(l), ft(i, l, a), n.head.appendChild(i);
                      break;
                    default:
                      throw Error(r(468, l));
                  }
                  i[ct] = e, st(i), l = i;
                }
                e.stateNode = l;
              } else
                yh(
                  n,
                  e.type,
                  e.stateNode
                );
            else
              e.stateNode = gh(
                n,
                l,
                e.memoizedProps
              );
          else
            i !== l ? (i === null ? a.stateNode !== null && (a = a.stateNode, a.parentNode.removeChild(a)) : i.count--, l === null ? yh(
              n,
              e.type,
              e.stateNode
            ) : gh(
              n,
              l,
              e.memoizedProps
            )) : l === null && e.stateNode !== null && yo(
              e,
              e.memoizedProps,
              a.memoizedProps
            );
        }
        break;
      case 27:
        Tt(t, e), xt(e), l & 512 && (tt || a === null || fa(a, a.return)), a !== null && l & 4 && yo(
          e,
          e.memoizedProps,
          a.memoizedProps
        );
        break;
      case 5:
        if (Tt(t, e), xt(e), l & 512 && (tt || a === null || fa(a, a.return)), e.flags & 32) {
          n = e.stateNode;
          try {
            ln(n, "");
          } catch (_) {
            we(e, e.return, _);
          }
        }
        l & 4 && e.stateNode != null && (n = e.memoizedProps, yo(
          e,
          n,
          a !== null ? a.memoizedProps : n
        )), l & 1024 && (bo = !0);
        break;
      case 6:
        if (Tt(t, e), xt(e), l & 4) {
          if (e.stateNode === null)
            throw Error(r(162));
          l = e.memoizedProps, a = e.stateNode;
          try {
            a.nodeValue = l;
          } catch (_) {
            we(e, e.return, _);
          }
        }
        break;
      case 3:
        if (ou = null, n = na, na = uu(t.containerInfo), Tt(t, e), na = n, xt(e), l & 4 && a !== null && a.memoizedState.isDehydrated)
          try {
            jn(t.containerInfo);
          } catch (_) {
            we(e, e.return, _);
          }
        bo && (bo = !1, ym(e));
        break;
      case 4:
        l = na, na = uu(
          e.stateNode.containerInfo
        ), Tt(t, e), xt(e), na = l;
        break;
      case 12:
        Tt(t, e), xt(e);
        break;
      case 31:
        Tt(t, e), xt(e), l & 4 && (l = e.updateQueue, l !== null && (e.updateQueue = null, Js(e, l)));
        break;
      case 13:
        Tt(t, e), xt(e), e.child.flags & 8192 && e.memoizedState !== null != (a !== null && a.memoizedState !== null) && (Fs = nt()), l & 4 && (l = e.updateQueue, l !== null && (e.updateQueue = null, Js(e, l)));
        break;
      case 22:
        n = e.memoizedState !== null;
        var g = a !== null && a.memoizedState !== null, M = wa, O = tt;
        if (wa = M || n, tt = O || g, Tt(t, e), tt = O, wa = M, xt(e), l & 8192)
          e: for (t = e.stateNode, t._visibility = n ? t._visibility & -2 : t._visibility | 1, n && (a === null || g || wa || tt || Hl(e)), a = null, t = e; ; ) {
            if (t.tag === 5 || t.tag === 26) {
              if (a === null) {
                g = a = t;
                try {
                  if (i = g.stateNode, n)
                    o = i.style, typeof o.setProperty == "function" ? o.setProperty("display", "none", "important") : o.display = "none";
                  else {
                    f = g.stateNode;
                    var L = g.memoizedProps.style, N = L != null && L.hasOwnProperty("display") ? L.display : null;
                    f.style.display = N == null || typeof N == "boolean" ? "" : ("" + N).trim();
                  }
                } catch (_) {
                  we(g, g.return, _);
                }
              }
            } else if (t.tag === 6) {
              if (a === null) {
                g = t;
                try {
                  g.stateNode.nodeValue = n ? "" : g.memoizedProps;
                } catch (_) {
                  we(g, g.return, _);
                }
              }
            } else if (t.tag === 18) {
              if (a === null) {
                g = t;
                try {
                  var R = g.stateNode;
                  n ? sh(R, !0) : sh(g.stateNode, !1);
                } catch (_) {
                  we(g, g.return, _);
                }
              }
            } else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
              t.child.return = t, t = t.child;
              continue;
            }
            if (t === e) break e;
            for (; t.sibling === null; ) {
              if (t.return === null || t.return === e) break e;
              a === t && (a = null), t = t.return;
            }
            a === t && (a = null), t.sibling.return = t.return, t = t.sibling;
          }
        l & 4 && (l = e.updateQueue, l !== null && (a = l.retryQueue, a !== null && (l.retryQueue = null, Js(e, a))));
        break;
      case 19:
        Tt(t, e), xt(e), l & 4 && (l = e.updateQueue, l !== null && (e.updateQueue = null, Js(e, l)));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        Tt(t, e), xt(e);
    }
  }
  function xt(e) {
    var t = e.flags;
    if (t & 2) {
      try {
        for (var a, l = e.return; l !== null; ) {
          if (cm(l)) {
            a = l;
            break;
          }
          l = l.return;
        }
        if (a == null) throw Error(r(160));
        switch (a.tag) {
          case 27:
            var n = a.stateNode, i = vo(e);
            Vs(e, i, n);
            break;
          case 5:
            var o = a.stateNode;
            a.flags & 32 && (ln(o, ""), a.flags &= -33);
            var f = vo(e);
            Vs(e, f, o);
            break;
          case 3:
          case 4:
            var g = a.stateNode.containerInfo, M = vo(e);
            Ao(
              e,
              M,
              g
            );
            break;
          default:
            throw Error(r(161));
        }
      } catch (O) {
        we(e, e.return, O);
      }
      e.flags &= -3;
    }
    t & 4096 && (e.flags &= -4097);
  }
  function ym(e) {
    if (e.subtreeFlags & 1024)
      for (e = e.child; e !== null; ) {
        var t = e;
        ym(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
      }
  }
  function ja(e, t) {
    if (t.subtreeFlags & 8772)
      for (t = t.child; t !== null; )
        dm(e, t.alternate, t), t = t.sibling;
  }
  function Hl(e) {
    for (e = e.child; e !== null; ) {
      var t = e;
      switch (t.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          al(4, t, t.return), Hl(t);
          break;
        case 1:
          fa(t, t.return);
          var a = t.stateNode;
          typeof a.componentWillUnmount == "function" && sm(
            t,
            t.return,
            a
          ), Hl(t);
          break;
        case 27:
          Ui(t.stateNode);
        case 26:
        case 5:
          fa(t, t.return), Hl(t);
          break;
        case 22:
          t.memoizedState === null && Hl(t);
          break;
        case 30:
          Hl(t);
          break;
        default:
          Hl(t);
      }
      e = e.sibling;
    }
  }
  function Oa(e, t, a) {
    for (a = a && (t.subtreeFlags & 8772) !== 0, t = t.child; t !== null; ) {
      var l = t.alternate, n = e, i = t, o = i.flags;
      switch (i.tag) {
        case 0:
        case 11:
        case 15:
          Oa(
            n,
            i,
            a
          ), Ai(4, i);
          break;
        case 1:
          if (Oa(
            n,
            i,
            a
          ), l = i, n = l.stateNode, typeof n.componentDidMount == "function")
            try {
              n.componentDidMount();
            } catch (M) {
              we(l, l.return, M);
            }
          if (l = i, n = l.updateQueue, n !== null) {
            var f = l.stateNode;
            try {
              var g = n.shared.hiddenCallbacks;
              if (g !== null)
                for (n.shared.hiddenCallbacks = null, n = 0; n < g.length; n++)
                  Jd(g[n], f);
            } catch (M) {
              we(l, l.return, M);
            }
          }
          a && o & 64 && im(i), bi(i, i.return);
          break;
        case 27:
          om(i);
        case 26:
        case 5:
          Oa(
            n,
            i,
            a
          ), a && l === null && o & 4 && um(i), bi(i, i.return);
          break;
        case 12:
          Oa(
            n,
            i,
            a
          );
          break;
        case 31:
          Oa(
            n,
            i,
            a
          ), a && o & 4 && hm(n, i);
          break;
        case 13:
          Oa(
            n,
            i,
            a
          ), a && o & 4 && gm(n, i);
          break;
        case 22:
          i.memoizedState === null && Oa(
            n,
            i,
            a
          ), bi(i, i.return);
          break;
        case 30:
          break;
        default:
          Oa(
            n,
            i,
            a
          );
      }
      t = t.sibling;
    }
  }
  function So(e, t) {
    var a = null;
    e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== a && (e != null && e.refCount++, a != null && si(a));
  }
  function Eo(e, t) {
    e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && si(e));
  }
  function ia(e, t, a, l) {
    if (t.subtreeFlags & 10256)
      for (t = t.child; t !== null; )
        vm(
          e,
          t,
          a,
          l
        ), t = t.sibling;
  }
  function vm(e, t, a, l) {
    var n = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        ia(
          e,
          t,
          a,
          l
        ), n & 2048 && Ai(9, t);
        break;
      case 1:
        ia(
          e,
          t,
          a,
          l
        );
        break;
      case 3:
        ia(
          e,
          t,
          a,
          l
        ), n & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && si(e)));
        break;
      case 12:
        if (n & 2048) {
          ia(
            e,
            t,
            a,
            l
          ), e = t.stateNode;
          try {
            var i = t.memoizedProps, o = i.id, f = i.onPostCommit;
            typeof f == "function" && f(
              o,
              t.alternate === null ? "mount" : "update",
              e.passiveEffectDuration,
              -0
            );
          } catch (g) {
            we(t, t.return, g);
          }
        } else
          ia(
            e,
            t,
            a,
            l
          );
        break;
      case 31:
        ia(
          e,
          t,
          a,
          l
        );
        break;
      case 13:
        ia(
          e,
          t,
          a,
          l
        );
        break;
      case 23:
        break;
      case 22:
        i = t.stateNode, o = t.alternate, t.memoizedState !== null ? i._visibility & 2 ? ia(
          e,
          t,
          a,
          l
        ) : Si(e, t) : i._visibility & 2 ? ia(
          e,
          t,
          a,
          l
        ) : (i._visibility |= 2, Tn(
          e,
          t,
          a,
          l,
          (t.subtreeFlags & 10256) !== 0 || !1
        )), n & 2048 && So(o, t);
        break;
      case 24:
        ia(
          e,
          t,
          a,
          l
        ), n & 2048 && Eo(t.alternate, t);
        break;
      default:
        ia(
          e,
          t,
          a,
          l
        );
    }
  }
  function Tn(e, t, a, l, n) {
    for (n = n && ((t.subtreeFlags & 10256) !== 0 || !1), t = t.child; t !== null; ) {
      var i = e, o = t, f = a, g = l, M = o.flags;
      switch (o.tag) {
        case 0:
        case 11:
        case 15:
          Tn(
            i,
            o,
            f,
            g,
            n
          ), Ai(8, o);
          break;
        case 23:
          break;
        case 22:
          var O = o.stateNode;
          o.memoizedState !== null ? O._visibility & 2 ? Tn(
            i,
            o,
            f,
            g,
            n
          ) : Si(
            i,
            o
          ) : (O._visibility |= 2, Tn(
            i,
            o,
            f,
            g,
            n
          )), n && M & 2048 && So(
            o.alternate,
            o
          );
          break;
        case 24:
          Tn(
            i,
            o,
            f,
            g,
            n
          ), n && M & 2048 && Eo(o.alternate, o);
          break;
        default:
          Tn(
            i,
            o,
            f,
            g,
            n
          );
      }
      t = t.sibling;
    }
  }
  function Si(e, t) {
    if (t.subtreeFlags & 10256)
      for (t = t.child; t !== null; ) {
        var a = e, l = t, n = l.flags;
        switch (l.tag) {
          case 22:
            Si(a, l), n & 2048 && So(
              l.alternate,
              l
            );
            break;
          case 24:
            Si(a, l), n & 2048 && Eo(l.alternate, l);
            break;
          default:
            Si(a, l);
        }
        t = t.sibling;
      }
  }
  var Ei = 8192;
  function xn(e, t, a) {
    if (e.subtreeFlags & Ei)
      for (e = e.child; e !== null; )
        Am(
          e,
          t,
          a
        ), e = e.sibling;
  }
  function Am(e, t, a) {
    switch (e.tag) {
      case 26:
        xn(
          e,
          t,
          a
        ), e.flags & Ei && e.memoizedState !== null && g1(
          a,
          na,
          e.memoizedState,
          e.memoizedProps
        );
        break;
      case 5:
        xn(
          e,
          t,
          a
        );
        break;
      case 3:
      case 4:
        var l = na;
        na = uu(e.stateNode.containerInfo), xn(
          e,
          t,
          a
        ), na = l;
        break;
      case 22:
        e.memoizedState === null && (l = e.alternate, l !== null && l.memoizedState !== null ? (l = Ei, Ei = 16777216, xn(
          e,
          t,
          a
        ), Ei = l) : xn(
          e,
          t,
          a
        ));
        break;
      default:
        xn(
          e,
          t,
          a
        );
    }
  }
  function bm(e) {
    var t = e.alternate;
    if (t !== null && (e = t.child, e !== null)) {
      t.child = null;
      do
        t = e.sibling, e.sibling = null, e = t;
      while (e !== null);
    }
  }
  function Ci(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null)
        for (var a = 0; a < t.length; a++) {
          var l = t[a];
          ut = l, Em(
            l,
            e
          );
        }
      bm(e);
    }
    if (e.subtreeFlags & 10256)
      for (e = e.child; e !== null; )
        Sm(e), e = e.sibling;
  }
  function Sm(e) {
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        Ci(e), e.flags & 2048 && al(9, e, e.return);
        break;
      case 3:
        Ci(e);
        break;
      case 12:
        Ci(e);
        break;
      case 22:
        var t = e.stateNode;
        e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Ys(e)) : Ci(e);
        break;
      default:
        Ci(e);
    }
  }
  function Ys(e) {
    var t = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (t !== null)
        for (var a = 0; a < t.length; a++) {
          var l = t[a];
          ut = l, Em(
            l,
            e
          );
        }
      bm(e);
    }
    for (e = e.child; e !== null; ) {
      switch (t = e, t.tag) {
        case 0:
        case 11:
        case 15:
          al(8, t, t.return), Ys(t);
          break;
        case 22:
          a = t.stateNode, a._visibility & 2 && (a._visibility &= -3, Ys(t));
          break;
        default:
          Ys(t);
      }
      e = e.sibling;
    }
  }
  function Em(e, t) {
    for (; ut !== null; ) {
      var a = ut;
      switch (a.tag) {
        case 0:
        case 11:
        case 15:
          al(8, a, t);
          break;
        case 23:
        case 22:
          if (a.memoizedState !== null && a.memoizedState.cachePool !== null) {
            var l = a.memoizedState.cachePool.pool;
            l != null && l.refCount++;
          }
          break;
        case 24:
          si(a.memoizedState.cache);
      }
      if (l = a.child, l !== null) l.return = a, ut = l;
      else
        e: for (a = e; ut !== null; ) {
          l = ut;
          var n = l.sibling, i = l.return;
          if (fm(l), l === a) {
            ut = null;
            break e;
          }
          if (n !== null) {
            n.return = i, ut = n;
            break e;
          }
          ut = i;
        }
    }
  }
  var Rp = {
    getCacheForType: function(e) {
      var t = rt(_e), a = t.data.get(e);
      return a === void 0 && (a = e(), t.data.set(e, a)), a;
    },
    cacheSignal: function() {
      return rt(_e).controller.signal;
    }
  }, Dp = typeof WeakMap == "function" ? WeakMap : Map, Re = 0, Le = null, be = null, Ce = 0, ze = 0, jt = null, ll = !1, kn = !1, Co = !1, qa = 0, Fe = 0, nl = 0, Ql = 0, To = 0, Ot = 0, Mn = 0, Ti = null, kt = null, xo = !1, Fs = 0, Cm = 0, Ws = 1 / 0, Ps = null, il = null, at = 0, sl = null, Nn = null, La = 0, ko = 0, Mo = null, Tm = null, xi = 0, No = null;
  function qt() {
    return (Re & 2) !== 0 && Ce !== 0 ? Ce & -Ce : D.T !== null ? Io() : Br();
  }
  function xm() {
    if (Ot === 0)
      if ((Ce & 536870912) === 0 || xe) {
        var e = Jl;
        Jl <<= 1, (Jl & 3932160) === 0 && (Jl = 262144), Ot = e;
      } else Ot = 536870912;
    return e = wt.current, e !== null && (e.flags |= 32), Ot;
  }
  function Mt(e, t, a) {
    (e === Le && (ze === 2 || ze === 9) || e.cancelPendingCommit !== null) && (Un(e, 0), ul(
      e,
      Ce,
      Ot,
      !1
    )), w(e, a), ((Re & 2) === 0 || e !== Le) && (e === Le && ((Re & 2) === 0 && (Ql |= a), Fe === 4 && ul(
      e,
      Ce,
      Ot,
      !1
    )), ma(e));
  }
  function km(e, t, a) {
    if ((Re & 6) !== 0) throw Error(r(327));
    var l = !a && (t & 127) === 0 && (t & e.expiredLanes) === 0 || xl(e, t), n = l ? Ip(e, t) : Ro(e, t, !0), i = l;
    do {
      if (n === 0) {
        kn && !l && ul(e, t, 0, !1);
        break;
      } else {
        if (a = e.current.alternate, i && !zp(a)) {
          n = Ro(e, t, !1), i = !1;
          continue;
        }
        if (n === 2) {
          if (i = t, e.errorRecoveryDisabledLanes & i)
            var o = 0;
          else
            o = e.pendingLanes & -536870913, o = o !== 0 ? o : o & 536870912 ? 536870912 : 0;
          if (o !== 0) {
            t = o;
            e: {
              var f = e;
              n = Ti;
              var g = f.current.memoizedState.isDehydrated;
              if (g && (Un(f, o).flags |= 256), o = Ro(
                f,
                o,
                !1
              ), o !== 2) {
                if (Co && !g) {
                  f.errorRecoveryDisabledLanes |= i, Ql |= i, n = 4;
                  break e;
                }
                i = kt, kt = n, i !== null && (kt === null ? kt = i : kt.push.apply(
                  kt,
                  i
                ));
              }
              n = o;
            }
            if (i = !1, n !== 2) continue;
          }
        }
        if (n === 1) {
          Un(e, 0), ul(e, t, 0, !0);
          break;
        }
        e: {
          switch (l = e, i = n, i) {
            case 0:
            case 1:
              throw Error(r(345));
            case 4:
              if ((t & 4194048) !== t) break;
            case 6:
              ul(
                l,
                t,
                Ot,
                !ll
              );
              break e;
            case 2:
              kt = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(r(329));
          }
          if ((t & 62914560) === t && (n = Fs + 300 - nt(), 10 < n)) {
            if (ul(
              l,
              t,
              Ot,
              !ll
            ), Yl(l, 0, !0) !== 0) break e;
            La = t, l.timeoutHandle = lh(
              Mm.bind(
                null,
                l,
                a,
                kt,
                Ps,
                xo,
                t,
                Ot,
                Ql,
                Mn,
                ll,
                i,
                "Throttled",
                -0,
                0
              ),
              n
            );
            break e;
          }
          Mm(
            l,
            a,
            kt,
            Ps,
            xo,
            t,
            Ot,
            Ql,
            Mn,
            ll,
            i,
            null,
            -0,
            0
          );
        }
      }
      break;
    } while (!0);
    ma(e);
  }
  function Mm(e, t, a, l, n, i, o, f, g, M, O, L, N, R) {
    if (e.timeoutHandle = -1, L = t.subtreeFlags, L & 8192 || (L & 16785408) === 16785408) {
      L = {
        stylesheets: null,
        count: 0,
        imgCount: 0,
        imgBytes: 0,
        suspenseyImages: [],
        waitingForImages: !0,
        waitingForViewTransition: !1,
        unsuspend: Ca
      }, Am(
        t,
        i,
        L
      );
      var _ = (i & 62914560) === i ? Fs - nt() : (i & 4194048) === i ? Cm - nt() : 0;
      if (_ = p1(
        L,
        _
      ), _ !== null) {
        La = i, e.cancelPendingCommit = _(
          jm.bind(
            null,
            e,
            t,
            i,
            a,
            l,
            n,
            o,
            f,
            g,
            O,
            L,
            null,
            N,
            R
          )
        ), ul(e, i, o, !M);
        return;
      }
    }
    jm(
      e,
      t,
      i,
      a,
      l,
      n,
      o,
      f,
      g
    );
  }
  function zp(e) {
    for (var t = e; ; ) {
      var a = t.tag;
      if ((a === 0 || a === 11 || a === 15) && t.flags & 16384 && (a = t.updateQueue, a !== null && (a = a.stores, a !== null)))
        for (var l = 0; l < a.length; l++) {
          var n = a[l], i = n.getSnapshot;
          n = n.value;
          try {
            if (!Dt(i(), n)) return !1;
          } catch {
            return !1;
          }
        }
      if (a = t.child, t.subtreeFlags & 16384 && a !== null)
        a.return = t, t = a;
      else {
        if (t === e) break;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === e) return !0;
          t = t.return;
        }
        t.sibling.return = t.return, t = t.sibling;
      }
    }
    return !0;
  }
  function ul(e, t, a, l) {
    t &= ~To, t &= ~Ql, e.suspendedLanes |= t, e.pingedLanes &= ~t, l && (e.warmLanes |= t), l = e.expirationTimes;
    for (var n = t; 0 < n; ) {
      var i = 31 - Ze(n), o = 1 << i;
      l[i] = -1, n &= ~o;
    }
    a !== 0 && aa(e, a, t);
  }
  function _s() {
    return (Re & 6) === 0 ? (ki(0), !1) : !0;
  }
  function Uo() {
    if (be !== null) {
      if (ze === 0)
        var e = be.return;
      else
        e = be, Ma = wl = null, Kc(e), An = null, ci = 0, e = be;
      for (; e !== null; )
        nm(e.alternate, e), e = e.return;
      be = null;
    }
  }
  function Un(e, t) {
    var a = e.timeoutHandle;
    a !== -1 && (e.timeoutHandle = -1, _p(a)), a = e.cancelPendingCommit, a !== null && (e.cancelPendingCommit = null, a()), La = 0, Uo(), Le = e, be = a = xa(e.current, null), Ce = t, ze = 0, jt = null, ll = !1, kn = xl(e, t), Co = !1, Mn = Ot = To = Ql = nl = Fe = 0, kt = Ti = null, xo = !1, (t & 8) !== 0 && (t |= t & 32);
    var l = e.entangledLanes;
    if (l !== 0)
      for (e = e.entanglements, l &= t; 0 < l; ) {
        var n = 31 - Ze(l), i = 1 << n;
        t |= e[n], l &= ~i;
      }
    return qa = t, As(), a;
  }
  function Nm(e, t) {
    ge = null, D.H = pi, t === vn || t === Ms ? (t = Xd(), ze = 3) : t === zc ? (t = Xd(), ze = 4) : ze = t === so ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1, jt = t, be === null && (Fe = 1, Hs(
      e,
      Xt(t, e.current)
    ));
  }
  function Um() {
    var e = wt.current;
    return e === null ? !0 : (Ce & 4194048) === Ce ? Jt === null : (Ce & 62914560) === Ce || (Ce & 536870912) !== 0 ? e === Jt : !1;
  }
  function Rm() {
    var e = D.H;
    return D.H = pi, e === null ? pi : e;
  }
  function Dm() {
    var e = D.A;
    return D.A = Rp, e;
  }
  function $s() {
    Fe = 4, ll || (Ce & 4194048) !== Ce && wt.current !== null || (kn = !0), (nl & 134217727) === 0 && (Ql & 134217727) === 0 || Le === null || ul(
      Le,
      Ce,
      Ot,
      !1
    );
  }
  function Ro(e, t, a) {
    var l = Re;
    Re |= 2;
    var n = Rm(), i = Dm();
    (Le !== e || Ce !== t) && (Ps = null, Un(e, t)), t = !1;
    var o = Fe;
    e: do
      try {
        if (ze !== 0 && be !== null) {
          var f = be, g = jt;
          switch (ze) {
            case 8:
              Uo(), o = 6;
              break e;
            case 3:
            case 2:
            case 9:
            case 6:
              wt.current === null && (t = !0);
              var M = ze;
              if (ze = 0, jt = null, Rn(e, f, g, M), a && kn) {
                o = 0;
                break e;
              }
              break;
            default:
              M = ze, ze = 0, jt = null, Rn(e, f, g, M);
          }
        }
        wp(), o = Fe;
        break;
      } catch (O) {
        Nm(e, O);
      }
    while (!0);
    return t && e.shellSuspendCounter++, Ma = wl = null, Re = l, D.H = n, D.A = i, be === null && (Le = null, Ce = 0, As()), o;
  }
  function wp() {
    for (; be !== null; ) zm(be);
  }
  function Ip(e, t) {
    var a = Re;
    Re |= 2;
    var l = Rm(), n = Dm();
    Le !== e || Ce !== t ? (Ps = null, Ws = nt() + 500, Un(e, t)) : kn = xl(
      e,
      t
    );
    e: do
      try {
        if (ze !== 0 && be !== null) {
          t = be;
          var i = jt;
          t: switch (ze) {
            case 1:
              ze = 0, jt = null, Rn(e, t, i, 1);
              break;
            case 2:
            case 9:
              if (Hd(i)) {
                ze = 0, jt = null, wm(t);
                break;
              }
              t = function() {
                ze !== 2 && ze !== 9 || Le !== e || (ze = 7), ma(e);
              }, i.then(t, t);
              break e;
            case 3:
              ze = 7;
              break e;
            case 4:
              ze = 5;
              break e;
            case 7:
              Hd(i) ? (ze = 0, jt = null, wm(t)) : (ze = 0, jt = null, Rn(e, t, i, 7));
              break;
            case 5:
              var o = null;
              switch (be.tag) {
                case 26:
                  o = be.memoizedState;
                case 5:
                case 27:
                  var f = be;
                  if (o ? vh(o) : f.stateNode.complete) {
                    ze = 0, jt = null;
                    var g = f.sibling;
                    if (g !== null) be = g;
                    else {
                      var M = f.return;
                      M !== null ? (be = M, eu(M)) : be = null;
                    }
                    break t;
                  }
              }
              ze = 0, jt = null, Rn(e, t, i, 5);
              break;
            case 6:
              ze = 0, jt = null, Rn(e, t, i, 6);
              break;
            case 8:
              Uo(), Fe = 6;
              break e;
            default:
              throw Error(r(462));
          }
        }
        jp();
        break;
      } catch (O) {
        Nm(e, O);
      }
    while (!0);
    return Ma = wl = null, D.H = l, D.A = n, Re = a, be !== null ? 0 : (Le = null, Ce = 0, As(), Fe);
  }
  function jp() {
    for (; be !== null && !Xa(); )
      zm(be);
  }
  function zm(e) {
    var t = am(e.alternate, e, qa);
    e.memoizedProps = e.pendingProps, t === null ? eu(e) : be = t;
  }
  function wm(e) {
    var t = e, a = t.alternate;
    switch (t.tag) {
      case 15:
      case 0:
        t = Wf(
          a,
          t,
          t.pendingProps,
          t.type,
          void 0,
          Ce
        );
        break;
      case 11:
        t = Wf(
          a,
          t,
          t.pendingProps,
          t.type.render,
          t.ref,
          Ce
        );
        break;
      case 5:
        Kc(t);
      default:
        nm(a, t), t = be = Rd(t, qa), t = am(a, t, qa);
    }
    e.memoizedProps = e.pendingProps, t === null ? eu(e) : be = t;
  }
  function Rn(e, t, a, l) {
    Ma = wl = null, Kc(t), An = null, ci = 0;
    var n = t.return;
    try {
      if (Cp(
        e,
        n,
        t,
        a,
        Ce
      )) {
        Fe = 1, Hs(
          e,
          Xt(a, e.current)
        ), be = null;
        return;
      }
    } catch (i) {
      if (n !== null) throw be = n, i;
      Fe = 1, Hs(
        e,
        Xt(a, e.current)
      ), be = null;
      return;
    }
    t.flags & 32768 ? (xe || l === 1 ? e = !0 : kn || (Ce & 536870912) !== 0 ? e = !1 : (ll = e = !0, (l === 2 || l === 9 || l === 3 || l === 6) && (l = wt.current, l !== null && l.tag === 13 && (l.flags |= 16384))), Im(t, e)) : eu(t);
  }
  function eu(e) {
    var t = e;
    do {
      if ((t.flags & 32768) !== 0) {
        Im(
          t,
          ll
        );
        return;
      }
      e = t.return;
      var a = kp(
        t.alternate,
        t,
        qa
      );
      if (a !== null) {
        be = a;
        return;
      }
      if (t = t.sibling, t !== null) {
        be = t;
        return;
      }
      be = t = e;
    } while (t !== null);
    Fe === 0 && (Fe = 5);
  }
  function Im(e, t) {
    do {
      var a = Mp(e.alternate, e);
      if (a !== null) {
        a.flags &= 32767, be = a;
        return;
      }
      if (a = e.return, a !== null && (a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null), !t && (e = e.sibling, e !== null)) {
        be = e;
        return;
      }
      be = e = a;
    } while (e !== null);
    Fe = 6, be = null;
  }
  function jm(e, t, a, l, n, i, o, f, g) {
    e.cancelPendingCommit = null;
    do
      tu();
    while (at !== 0);
    if ((Re & 6) !== 0) throw Error(r(327));
    if (t !== null) {
      if (t === e.current) throw Error(r(177));
      if (i = t.lanes | t.childLanes, i |= yc, Me(
        e,
        a,
        i,
        o,
        f,
        g
      ), e === Le && (be = Le = null, Ce = 0), Nn = t, sl = e, La = a, ko = i, Mo = n, Tm = l, (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (e.callbackNode = null, e.callbackPriority = 0, Bp(Ut, function() {
        return Gm(), null;
      })) : (e.callbackNode = null, e.callbackPriority = 0), l = (t.flags & 13878) !== 0, (t.subtreeFlags & 13878) !== 0 || l) {
        l = D.T, D.T = null, n = H.p, H.p = 2, o = Re, Re |= 4;
        try {
          Np(e, t, a);
        } finally {
          Re = o, H.p = n, D.T = l;
        }
      }
      at = 1, Om(), qm(), Lm();
    }
  }
  function Om() {
    if (at === 1) {
      at = 0;
      var e = sl, t = Nn, a = (t.flags & 13878) !== 0;
      if ((t.subtreeFlags & 13878) !== 0 || a) {
        a = D.T, D.T = null;
        var l = H.p;
        H.p = 2;
        var n = Re;
        Re |= 4;
        try {
          pm(t, e);
          var i = Qo, o = Sd(e.containerInfo), f = i.focusedElem, g = i.selectionRange;
          if (o !== f && f && f.ownerDocument && bd(
            f.ownerDocument.documentElement,
            f
          )) {
            if (g !== null && fc(f)) {
              var M = g.start, O = g.end;
              if (O === void 0 && (O = M), "selectionStart" in f)
                f.selectionStart = M, f.selectionEnd = Math.min(
                  O,
                  f.value.length
                );
              else {
                var L = f.ownerDocument || document, N = L && L.defaultView || window;
                if (N.getSelection) {
                  var R = N.getSelection(), _ = f.textContent.length, oe = Math.min(g.start, _), Oe = g.end === void 0 ? oe : Math.min(g.end, _);
                  !R.extend && oe > Oe && (o = Oe, Oe = oe, oe = o);
                  var x = Ad(
                    f,
                    oe
                  ), b = Ad(
                    f,
                    Oe
                  );
                  if (x && b && (R.rangeCount !== 1 || R.anchorNode !== x.node || R.anchorOffset !== x.offset || R.focusNode !== b.node || R.focusOffset !== b.offset)) {
                    var k = L.createRange();
                    k.setStart(x.node, x.offset), R.removeAllRanges(), oe > Oe ? (R.addRange(k), R.extend(b.node, b.offset)) : (k.setEnd(b.node, b.offset), R.addRange(k));
                  }
                }
              }
            }
            for (L = [], R = f; R = R.parentNode; )
              R.nodeType === 1 && L.push({
                element: R,
                left: R.scrollLeft,
                top: R.scrollTop
              });
            for (typeof f.focus == "function" && f.focus(), f = 0; f < L.length; f++) {
              var q = L[f];
              q.element.scrollLeft = q.left, q.element.scrollTop = q.top;
            }
          }
          mu = !!Ho, Qo = Ho = null;
        } finally {
          Re = n, H.p = l, D.T = a;
        }
      }
      e.current = t, at = 2;
    }
  }
  function qm() {
    if (at === 2) {
      at = 0;
      var e = sl, t = Nn, a = (t.flags & 8772) !== 0;
      if ((t.subtreeFlags & 8772) !== 0 || a) {
        a = D.T, D.T = null;
        var l = H.p;
        H.p = 2;
        var n = Re;
        Re |= 4;
        try {
          dm(e, t.alternate, t);
        } finally {
          Re = n, H.p = l, D.T = a;
        }
      }
      at = 3;
    }
  }
  function Lm() {
    if (at === 4 || at === 3) {
      at = 0, bt();
      var e = sl, t = Nn, a = La, l = Tm;
      (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? at = 5 : (at = 0, Nn = sl = null, Bm(e, e.pendingLanes));
      var n = e.pendingLanes;
      if (n === 0 && (il = null), Sa(a), t = t.stateNode, pt && typeof pt.onCommitFiberRoot == "function")
        try {
          pt.onCommitFiberRoot(
            Rt,
            t,
            void 0,
            (t.current.flags & 128) === 128
          );
        } catch {
        }
      if (l !== null) {
        t = D.T, n = H.p, H.p = 2, D.T = null;
        try {
          for (var i = e.onRecoverableError, o = 0; o < l.length; o++) {
            var f = l[o];
            i(f.value, {
              componentStack: f.stack
            });
          }
        } finally {
          D.T = t, H.p = n;
        }
      }
      (La & 3) !== 0 && tu(), ma(e), n = e.pendingLanes, (a & 261930) !== 0 && (n & 42) !== 0 ? e === No ? xi++ : (xi = 0, No = e) : xi = 0, ki(0);
    }
  }
  function Bm(e, t) {
    (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, si(t)));
  }
  function tu() {
    return Om(), qm(), Lm(), Gm();
  }
  function Gm() {
    if (at !== 5) return !1;
    var e = sl, t = ko;
    ko = 0;
    var a = Sa(La), l = D.T, n = H.p;
    try {
      H.p = 32 > a ? 32 : a, D.T = null, a = Mo, Mo = null;
      var i = sl, o = La;
      if (at = 0, Nn = sl = null, La = 0, (Re & 6) !== 0) throw Error(r(331));
      var f = Re;
      if (Re |= 4, Sm(i.current), vm(
        i,
        i.current,
        o,
        a
      ), Re = f, ki(0, !1), pt && typeof pt.onPostCommitFiberRoot == "function")
        try {
          pt.onPostCommitFiberRoot(Rt, i);
        } catch {
        }
      return !0;
    } finally {
      H.p = n, D.T = l, Bm(e, t);
    }
  }
  function Hm(e, t, a) {
    t = Xt(a, t), t = io(e.stateNode, t, 2), e = $a(e, t, 2), e !== null && (w(e, 2), ma(e));
  }
  function we(e, t, a) {
    if (e.tag === 3)
      Hm(e, e, a);
    else
      for (; t !== null; ) {
        if (t.tag === 3) {
          Hm(
            t,
            e,
            a
          );
          break;
        } else if (t.tag === 1) {
          var l = t.stateNode;
          if (typeof t.type.getDerivedStateFromError == "function" || typeof l.componentDidCatch == "function" && (il === null || !il.has(l))) {
            e = Xt(a, e), a = Qf(2), l = $a(t, a, 2), l !== null && (Xf(
              a,
              l,
              t,
              e
            ), w(l, 2), ma(l));
            break;
          }
        }
        t = t.return;
      }
  }
  function Do(e, t, a) {
    var l = e.pingCache;
    if (l === null) {
      l = e.pingCache = new Dp();
      var n = /* @__PURE__ */ new Set();
      l.set(t, n);
    } else
      n = l.get(t), n === void 0 && (n = /* @__PURE__ */ new Set(), l.set(t, n));
    n.has(a) || (Co = !0, n.add(a), e = Op.bind(null, e, t, a), t.then(e, e));
  }
  function Op(e, t, a) {
    var l = e.pingCache;
    l !== null && l.delete(t), e.pingedLanes |= e.suspendedLanes & a, e.warmLanes &= ~a, Le === e && (Ce & a) === a && (Fe === 4 || Fe === 3 && (Ce & 62914560) === Ce && 300 > nt() - Fs ? (Re & 2) === 0 && Un(e, 0) : To |= a, Mn === Ce && (Mn = 0)), ma(e);
  }
  function Qm(e, t) {
    t === 0 && (t = us()), e = Rl(e, t), e !== null && (w(e, t), ma(e));
  }
  function qp(e) {
    var t = e.memoizedState, a = 0;
    t !== null && (a = t.retryLane), Qm(e, a);
  }
  function Lp(e, t) {
    var a = 0;
    switch (e.tag) {
      case 31:
      case 13:
        var l = e.stateNode, n = e.memoizedState;
        n !== null && (a = n.retryLane);
        break;
      case 19:
        l = e.stateNode;
        break;
      case 22:
        l = e.stateNode._retryCache;
        break;
      default:
        throw Error(r(314));
    }
    l !== null && l.delete(t), Qm(e, a);
  }
  function Bp(e, t) {
    return ua(e, t);
  }
  var au = null, Dn = null, zo = !1, lu = !1, wo = !1, cl = 0;
  function ma(e) {
    e !== Dn && e.next === null && (Dn === null ? au = Dn = e : Dn = Dn.next = e), lu = !0, zo || (zo = !0, Hp());
  }
  function ki(e, t) {
    if (!wo && lu) {
      wo = !0;
      do
        for (var a = !1, l = au; l !== null; ) {
          if (e !== 0) {
            var n = l.pendingLanes;
            if (n === 0) var i = 0;
            else {
              var o = l.suspendedLanes, f = l.pingedLanes;
              i = (1 << 31 - Ze(42 | e) + 1) - 1, i &= n & ~(o & ~f), i = i & 201326741 ? i & 201326741 | 1 : i ? i | 2 : 0;
            }
            i !== 0 && (a = !0, Vm(l, i));
          } else
            i = Ce, i = Yl(
              l,
              l === Le ? i : 0,
              l.cancelPendingCommit !== null || l.timeoutHandle !== -1
            ), (i & 3) === 0 || xl(l, i) || (a = !0, Vm(l, i));
          l = l.next;
        }
      while (a);
      wo = !1;
    }
  }
  function Gp() {
    Xm();
  }
  function Xm() {
    lu = zo = !1;
    var e = 0;
    cl !== 0 && Pp() && (e = cl);
    for (var t = nt(), a = null, l = au; l !== null; ) {
      var n = l.next, i = Km(l, t);
      i === 0 ? (l.next = null, a === null ? au = n : a.next = n, n === null && (Dn = a)) : (a = l, (e !== 0 || (i & 3) !== 0) && (lu = !0)), l = n;
    }
    at !== 0 && at !== 5 || ki(e), cl !== 0 && (cl = 0);
  }
  function Km(e, t) {
    for (var a = e.suspendedLanes, l = e.pingedLanes, n = e.expirationTimes, i = e.pendingLanes & -62914561; 0 < i; ) {
      var o = 31 - Ze(i), f = 1 << o, g = n[o];
      g === -1 ? ((f & a) === 0 || (f & l) !== 0) && (n[o] = Ju(f, t)) : g <= t && (e.expiredLanes |= f), i &= ~f;
    }
    if (t = Le, a = Ce, a = Yl(
      e,
      e === t ? a : 0,
      e.cancelPendingCommit !== null || e.timeoutHandle !== -1
    ), l = e.callbackNode, a === 0 || e === t && (ze === 2 || ze === 9) || e.cancelPendingCommit !== null)
      return l !== null && l !== null && ea(l), e.callbackNode = null, e.callbackPriority = 0;
    if ((a & 3) === 0 || xl(e, a)) {
      if (t = a & -a, t === e.callbackPriority) return t;
      switch (l !== null && ea(l), Sa(a)) {
        case 2:
        case 8:
          a = it;
          break;
        case 32:
          a = Ut;
          break;
        case 268435456:
          a = Lt;
          break;
        default:
          a = Ut;
      }
      return l = Zm.bind(null, e), a = ua(a, l), e.callbackPriority = t, e.callbackNode = a, t;
    }
    return l !== null && l !== null && ea(l), e.callbackPriority = 2, e.callbackNode = null, 2;
  }
  function Zm(e, t) {
    if (at !== 0 && at !== 5)
      return e.callbackNode = null, e.callbackPriority = 0, null;
    var a = e.callbackNode;
    if (tu() && e.callbackNode !== a)
      return null;
    var l = Ce;
    return l = Yl(
      e,
      e === Le ? l : 0,
      e.cancelPendingCommit !== null || e.timeoutHandle !== -1
    ), l === 0 ? null : (km(e, l, t), Km(e, nt()), e.callbackNode != null && e.callbackNode === a ? Zm.bind(null, e) : null);
  }
  function Vm(e, t) {
    if (tu()) return null;
    km(e, t, !0);
  }
  function Hp() {
    $p(function() {
      (Re & 6) !== 0 ? ua(
        Ka,
        Gp
      ) : Xm();
    });
  }
  function Io() {
    if (cl === 0) {
      var e = pn;
      e === 0 && (e = oa, oa <<= 1, (oa & 261888) === 0 && (oa = 256)), cl = e;
    }
    return cl;
  }
  function Jm(e) {
    return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : ds("" + e);
  }
  function Ym(e, t) {
    var a = t.ownerDocument.createElement("input");
    return a.name = t.name, a.value = t.value, e.id && a.setAttribute("form", e.id), t.parentNode.insertBefore(a, t), e = new FormData(e), a.parentNode.removeChild(a), e;
  }
  function Qp(e, t, a, l, n) {
    if (t === "submit" && a && a.stateNode === n) {
      var i = Jm(
        (n[St] || null).action
      ), o = l.submitter;
      o && (t = (t = o[St] || null) ? Jm(t.formAction) : o.getAttribute("formAction"), t !== null && (i = t, o = null));
      var f = new gs(
        "action",
        "action",
        null,
        l,
        n
      );
      e.push({
        event: f,
        listeners: [
          {
            instance: null,
            listener: function() {
              if (l.defaultPrevented) {
                if (cl !== 0) {
                  var g = o ? Ym(n, o) : new FormData(n);
                  $c(
                    a,
                    {
                      pending: !0,
                      data: g,
                      method: n.method,
                      action: i
                    },
                    null,
                    g
                  );
                }
              } else
                typeof i == "function" && (f.preventDefault(), g = o ? Ym(n, o) : new FormData(n), $c(
                  a,
                  {
                    pending: !0,
                    data: g,
                    method: n.method,
                    action: i
                  },
                  i,
                  g
                ));
            },
            currentTarget: n
          }
        ]
      });
    }
  }
  for (var jo = 0; jo < pc.length; jo++) {
    var Oo = pc[jo], Xp = Oo.toLowerCase(), Kp = Oo[0].toUpperCase() + Oo.slice(1);
    la(
      Xp,
      "on" + Kp
    );
  }
  la(Td, "onAnimationEnd"), la(xd, "onAnimationIteration"), la(kd, "onAnimationStart"), la("dblclick", "onDoubleClick"), la("focusin", "onFocus"), la("focusout", "onBlur"), la(sp, "onTransitionRun"), la(up, "onTransitionStart"), la(cp, "onTransitionCancel"), la(Md, "onTransitionEnd"), tn("onMouseEnter", ["mouseout", "mouseover"]), tn("onMouseLeave", ["mouseout", "mouseover"]), tn("onPointerEnter", ["pointerout", "pointerover"]), tn("onPointerLeave", ["pointerout", "pointerover"]), kl(
    "onChange",
    "change click focusin focusout input keydown keyup selectionchange".split(" ")
  ), kl(
    "onSelect",
    "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
      " "
    )
  ), kl("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste"
  ]), kl(
    "onCompositionEnd",
    "compositionend focusout keydown keypress keyup mousedown".split(" ")
  ), kl(
    "onCompositionStart",
    "compositionstart focusout keydown keypress keyup mousedown".split(" ")
  ), kl(
    "onCompositionUpdate",
    "compositionupdate focusout keydown keypress keyup mousedown".split(" ")
  );
  var Mi = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
    " "
  ), Zp = new Set(
    "beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Mi)
  );
  function Fm(e, t) {
    t = (t & 4) !== 0;
    for (var a = 0; a < e.length; a++) {
      var l = e[a], n = l.event;
      l = l.listeners;
      e: {
        var i = void 0;
        if (t)
          for (var o = l.length - 1; 0 <= o; o--) {
            var f = l[o], g = f.instance, M = f.currentTarget;
            if (f = f.listener, g !== i && n.isPropagationStopped())
              break e;
            i = f, n.currentTarget = M;
            try {
              i(n);
            } catch (O) {
              vs(O);
            }
            n.currentTarget = null, i = g;
          }
        else
          for (o = 0; o < l.length; o++) {
            if (f = l[o], g = f.instance, M = f.currentTarget, f = f.listener, g !== i && n.isPropagationStopped())
              break e;
            i = f, n.currentTarget = M;
            try {
              i(n);
            } catch (O) {
              vs(O);
            }
            n.currentTarget = null, i = g;
          }
      }
    }
  }
  function Se(e, t) {
    var a = t[Yu];
    a === void 0 && (a = t[Yu] = /* @__PURE__ */ new Set());
    var l = e + "__bubble";
    a.has(l) || (Wm(t, e, 2, !1), a.add(l));
  }
  function qo(e, t, a) {
    var l = 0;
    t && (l |= 4), Wm(
      a,
      e,
      l,
      t
    );
  }
  var nu = "_reactListening" + Math.random().toString(36).slice(2);
  function Lo(e) {
    if (!e[nu]) {
      e[nu] = !0, Qr.forEach(function(a) {
        a !== "selectionchange" && (Zp.has(a) || qo(a, !1, e), qo(a, !0, e));
      });
      var t = e.nodeType === 9 ? e : e.ownerDocument;
      t === null || t[nu] || (t[nu] = !0, qo("selectionchange", !1, t));
    }
  }
  function Wm(e, t, a, l) {
    switch (xh(t)) {
      case 2:
        var n = A1;
        break;
      case 8:
        n = b1;
        break;
      default:
        n = $o;
    }
    a = n.bind(
      null,
      t,
      a,
      e
    ), n = void 0, !lc || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (n = !0), l ? n !== void 0 ? e.addEventListener(t, a, {
      capture: !0,
      passive: n
    }) : e.addEventListener(t, a, !0) : n !== void 0 ? e.addEventListener(t, a, {
      passive: n
    }) : e.addEventListener(t, a, !1);
  }
  function Bo(e, t, a, l, n) {
    var i = l;
    if ((t & 1) === 0 && (t & 2) === 0 && l !== null)
      e: for (; ; ) {
        if (l === null) return;
        var o = l.tag;
        if (o === 3 || o === 4) {
          var f = l.stateNode.containerInfo;
          if (f === n) break;
          if (o === 4)
            for (o = l.return; o !== null; ) {
              var g = o.tag;
              if ((g === 3 || g === 4) && o.stateNode.containerInfo === n)
                return;
              o = o.return;
            }
          for (; f !== null; ) {
            if (o = _l(f), o === null) return;
            if (g = o.tag, g === 5 || g === 6 || g === 26 || g === 27) {
              l = i = o;
              continue e;
            }
            f = f.parentNode;
          }
        }
        l = l.return;
      }
    ed(function() {
      var M = i, O = tc(a), L = [];
      e: {
        var N = Nd.get(e);
        if (N !== void 0) {
          var R = gs, _ = e;
          switch (e) {
            case "keypress":
              if (ms(a) === 0) break e;
            case "keydown":
            case "keyup":
              R = L0;
              break;
            case "focusin":
              _ = "focus", R = uc;
              break;
            case "focusout":
              _ = "blur", R = uc;
              break;
            case "beforeblur":
            case "afterblur":
              R = uc;
              break;
            case "click":
              if (a.button === 2) break e;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              R = ld;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              R = k0;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              R = H0;
              break;
            case Td:
            case xd:
            case kd:
              R = U0;
              break;
            case Md:
              R = X0;
              break;
            case "scroll":
            case "scrollend":
              R = T0;
              break;
            case "wheel":
              R = Z0;
              break;
            case "copy":
            case "cut":
            case "paste":
              R = D0;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              R = id;
              break;
            case "toggle":
            case "beforetoggle":
              R = J0;
          }
          var oe = (t & 4) !== 0, Oe = !oe && (e === "scroll" || e === "scrollend"), x = oe ? N !== null ? N + "Capture" : null : N;
          oe = [];
          for (var b = M, k; b !== null; ) {
            var q = b;
            if (k = q.stateNode, q = q.tag, q !== 5 && q !== 26 && q !== 27 || k === null || x === null || (q = Fn(b, x), q != null && oe.push(
              Ni(b, q, k)
            )), Oe) break;
            b = b.return;
          }
          0 < oe.length && (N = new R(
            N,
            _,
            null,
            a,
            O
          ), L.push({ event: N, listeners: oe }));
        }
      }
      if ((t & 7) === 0) {
        e: {
          if (N = e === "mouseover" || e === "pointerover", R = e === "mouseout" || e === "pointerout", N && a !== ec && (_ = a.relatedTarget || a.fromElement) && (_l(_) || _[Pl]))
            break e;
          if ((R || N) && (N = O.window === O ? O : (N = O.ownerDocument) ? N.defaultView || N.parentWindow : window, R ? (_ = a.relatedTarget || a.toElement, R = M, _ = _ ? _l(_) : null, _ !== null && (Oe = h(_), oe = _.tag, _ !== Oe || oe !== 5 && oe !== 27 && oe !== 6) && (_ = null)) : (R = null, _ = M), R !== _)) {
            if (oe = ld, q = "onMouseLeave", x = "onMouseEnter", b = "mouse", (e === "pointerout" || e === "pointerover") && (oe = id, q = "onPointerLeave", x = "onPointerEnter", b = "pointer"), Oe = R == null ? N : Yn(R), k = _ == null ? N : Yn(_), N = new oe(
              q,
              b + "leave",
              R,
              a,
              O
            ), N.target = Oe, N.relatedTarget = k, q = null, _l(O) === M && (oe = new oe(
              x,
              b + "enter",
              _,
              a,
              O
            ), oe.target = k, oe.relatedTarget = Oe, q = oe), Oe = q, R && _)
              t: {
                for (oe = Vp, x = R, b = _, k = 0, q = x; q; q = oe(q))
                  k++;
                q = 0;
                for (var ie = b; ie; ie = oe(ie))
                  q++;
                for (; 0 < k - q; )
                  x = oe(x), k--;
                for (; 0 < q - k; )
                  b = oe(b), q--;
                for (; k--; ) {
                  if (x === b || b !== null && x === b.alternate) {
                    oe = x;
                    break t;
                  }
                  x = oe(x), b = oe(b);
                }
                oe = null;
              }
            else oe = null;
            R !== null && Pm(
              L,
              N,
              R,
              oe,
              !1
            ), _ !== null && Oe !== null && Pm(
              L,
              Oe,
              _,
              oe,
              !0
            );
          }
        }
        e: {
          if (N = M ? Yn(M) : window, R = N.nodeName && N.nodeName.toLowerCase(), R === "select" || R === "input" && N.type === "file")
            var Ne = md;
          else if (dd(N))
            if (hd)
              Ne = lp;
            else {
              Ne = tp;
              var te = ep;
            }
          else
            R = N.nodeName, !R || R.toLowerCase() !== "input" || N.type !== "checkbox" && N.type !== "radio" ? M && $u(M.elementType) && (Ne = md) : Ne = ap;
          if (Ne && (Ne = Ne(e, M))) {
            fd(
              L,
              Ne,
              a,
              O
            );
            break e;
          }
          te && te(e, N, M), e === "focusout" && M && N.type === "number" && M.memoizedProps.value != null && _u(N, "number", N.value);
        }
        switch (te = M ? Yn(M) : window, e) {
          case "focusin":
            (dd(te) || te.contentEditable === "true") && (cn = te, mc = M, li = null);
            break;
          case "focusout":
            li = mc = cn = null;
            break;
          case "mousedown":
            hc = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            hc = !1, Ed(L, a, O);
            break;
          case "selectionchange":
            if (ip) break;
          case "keydown":
          case "keyup":
            Ed(L, a, O);
        }
        var pe;
        if (oc)
          e: {
            switch (e) {
              case "compositionstart":
                var Te = "onCompositionStart";
                break e;
              case "compositionend":
                Te = "onCompositionEnd";
                break e;
              case "compositionupdate":
                Te = "onCompositionUpdate";
                break e;
            }
            Te = void 0;
          }
        else
          un ? od(e, a) && (Te = "onCompositionEnd") : e === "keydown" && a.keyCode === 229 && (Te = "onCompositionStart");
        Te && (sd && a.locale !== "ko" && (un || Te !== "onCompositionStart" ? Te === "onCompositionEnd" && un && (pe = td()) : (Va = O, nc = "value" in Va ? Va.value : Va.textContent, un = !0)), te = iu(M, Te), 0 < te.length && (Te = new nd(
          Te,
          e,
          null,
          a,
          O
        ), L.push({ event: Te, listeners: te }), pe ? Te.data = pe : (pe = rd(a), pe !== null && (Te.data = pe)))), (pe = F0 ? W0(e, a) : P0(e, a)) && (Te = iu(M, "onBeforeInput"), 0 < Te.length && (te = new nd(
          "onBeforeInput",
          "beforeinput",
          null,
          a,
          O
        ), L.push({
          event: te,
          listeners: Te
        }), te.data = pe)), Qp(
          L,
          e,
          M,
          a,
          O
        );
      }
      Fm(L, t);
    });
  }
  function Ni(e, t, a) {
    return {
      instance: e,
      listener: t,
      currentTarget: a
    };
  }
  function iu(e, t) {
    for (var a = t + "Capture", l = []; e !== null; ) {
      var n = e, i = n.stateNode;
      if (n = n.tag, n !== 5 && n !== 26 && n !== 27 || i === null || (n = Fn(e, a), n != null && l.unshift(
        Ni(e, n, i)
      ), n = Fn(e, t), n != null && l.push(
        Ni(e, n, i)
      )), e.tag === 3) return l;
      e = e.return;
    }
    return [];
  }
  function Vp(e) {
    if (e === null) return null;
    do
      e = e.return;
    while (e && e.tag !== 5 && e.tag !== 27);
    return e || null;
  }
  function Pm(e, t, a, l, n) {
    for (var i = t._reactName, o = []; a !== null && a !== l; ) {
      var f = a, g = f.alternate, M = f.stateNode;
      if (f = f.tag, g !== null && g === l) break;
      f !== 5 && f !== 26 && f !== 27 || M === null || (g = M, n ? (M = Fn(a, i), M != null && o.unshift(
        Ni(a, M, g)
      )) : n || (M = Fn(a, i), M != null && o.push(
        Ni(a, M, g)
      ))), a = a.return;
    }
    o.length !== 0 && e.push({ event: t, listeners: o });
  }
  var Jp = /\r\n?/g, Yp = /\u0000|\uFFFD/g;
  function _m(e) {
    return (typeof e == "string" ? e : "" + e).replace(Jp, `
`).replace(Yp, "");
  }
  function $m(e, t) {
    return t = _m(t), _m(e) === t;
  }
  function je(e, t, a, l, n, i) {
    switch (a) {
      case "children":
        typeof l == "string" ? t === "body" || t === "textarea" && l === "" || ln(e, l) : (typeof l == "number" || typeof l == "bigint") && t !== "body" && ln(e, "" + l);
        break;
      case "className":
        os(e, "class", l);
        break;
      case "tabIndex":
        os(e, "tabindex", l);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        os(e, a, l);
        break;
      case "style":
        _r(e, l, i);
        break;
      case "data":
        if (t !== "object") {
          os(e, "data", l);
          break;
        }
      case "src":
      case "href":
        if (l === "" && (t !== "a" || a !== "href")) {
          e.removeAttribute(a);
          break;
        }
        if (l == null || typeof l == "function" || typeof l == "symbol" || typeof l == "boolean") {
          e.removeAttribute(a);
          break;
        }
        l = ds("" + l), e.setAttribute(a, l);
        break;
      case "action":
      case "formAction":
        if (typeof l == "function") {
          e.setAttribute(
            a,
            "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
          );
          break;
        } else
          typeof i == "function" && (a === "formAction" ? (t !== "input" && je(e, t, "name", n.name, n, null), je(
            e,
            t,
            "formEncType",
            n.formEncType,
            n,
            null
          ), je(
            e,
            t,
            "formMethod",
            n.formMethod,
            n,
            null
          ), je(
            e,
            t,
            "formTarget",
            n.formTarget,
            n,
            null
          )) : (je(e, t, "encType", n.encType, n, null), je(e, t, "method", n.method, n, null), je(e, t, "target", n.target, n, null)));
        if (l == null || typeof l == "symbol" || typeof l == "boolean") {
          e.removeAttribute(a);
          break;
        }
        l = ds("" + l), e.setAttribute(a, l);
        break;
      case "onClick":
        l != null && (e.onclick = Ca);
        break;
      case "onScroll":
        l != null && Se("scroll", e);
        break;
      case "onScrollEnd":
        l != null && Se("scrollend", e);
        break;
      case "dangerouslySetInnerHTML":
        if (l != null) {
          if (typeof l != "object" || !("__html" in l))
            throw Error(r(61));
          if (a = l.__html, a != null) {
            if (n.children != null) throw Error(r(60));
            e.innerHTML = a;
          }
        }
        break;
      case "multiple":
        e.multiple = l && typeof l != "function" && typeof l != "symbol";
        break;
      case "muted":
        e.muted = l && typeof l != "function" && typeof l != "symbol";
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "defaultValue":
      case "defaultChecked":
      case "innerHTML":
      case "ref":
        break;
      case "autoFocus":
        break;
      case "xlinkHref":
        if (l == null || typeof l == "function" || typeof l == "boolean" || typeof l == "symbol") {
          e.removeAttribute("xlink:href");
          break;
        }
        a = ds("" + l), e.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "xlink:href",
          a
        );
        break;
      case "contentEditable":
      case "spellCheck":
      case "draggable":
      case "value":
      case "autoReverse":
      case "externalResourcesRequired":
      case "focusable":
      case "preserveAlpha":
        l != null && typeof l != "function" && typeof l != "symbol" ? e.setAttribute(a, "" + l) : e.removeAttribute(a);
        break;
      case "inert":
      case "allowFullScreen":
      case "async":
      case "autoPlay":
      case "controls":
      case "default":
      case "defer":
      case "disabled":
      case "disablePictureInPicture":
      case "disableRemotePlayback":
      case "formNoValidate":
      case "hidden":
      case "loop":
      case "noModule":
      case "noValidate":
      case "open":
      case "playsInline":
      case "readOnly":
      case "required":
      case "reversed":
      case "scoped":
      case "seamless":
      case "itemScope":
        l && typeof l != "function" && typeof l != "symbol" ? e.setAttribute(a, "") : e.removeAttribute(a);
        break;
      case "capture":
      case "download":
        l === !0 ? e.setAttribute(a, "") : l !== !1 && l != null && typeof l != "function" && typeof l != "symbol" ? e.setAttribute(a, l) : e.removeAttribute(a);
        break;
      case "cols":
      case "rows":
      case "size":
      case "span":
        l != null && typeof l != "function" && typeof l != "symbol" && !isNaN(l) && 1 <= l ? e.setAttribute(a, l) : e.removeAttribute(a);
        break;
      case "rowSpan":
      case "start":
        l == null || typeof l == "function" || typeof l == "symbol" || isNaN(l) ? e.removeAttribute(a) : e.setAttribute(a, l);
        break;
      case "popover":
        Se("beforetoggle", e), Se("toggle", e), cs(e, "popover", l);
        break;
      case "xlinkActuate":
        Ea(
          e,
          "http://www.w3.org/1999/xlink",
          "xlink:actuate",
          l
        );
        break;
      case "xlinkArcrole":
        Ea(
          e,
          "http://www.w3.org/1999/xlink",
          "xlink:arcrole",
          l
        );
        break;
      case "xlinkRole":
        Ea(
          e,
          "http://www.w3.org/1999/xlink",
          "xlink:role",
          l
        );
        break;
      case "xlinkShow":
        Ea(
          e,
          "http://www.w3.org/1999/xlink",
          "xlink:show",
          l
        );
        break;
      case "xlinkTitle":
        Ea(
          e,
          "http://www.w3.org/1999/xlink",
          "xlink:title",
          l
        );
        break;
      case "xlinkType":
        Ea(
          e,
          "http://www.w3.org/1999/xlink",
          "xlink:type",
          l
        );
        break;
      case "xmlBase":
        Ea(
          e,
          "http://www.w3.org/XML/1998/namespace",
          "xml:base",
          l
        );
        break;
      case "xmlLang":
        Ea(
          e,
          "http://www.w3.org/XML/1998/namespace",
          "xml:lang",
          l
        );
        break;
      case "xmlSpace":
        Ea(
          e,
          "http://www.w3.org/XML/1998/namespace",
          "xml:space",
          l
        );
        break;
      case "is":
        cs(e, "is", l);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < a.length) || a[0] !== "o" && a[0] !== "O" || a[1] !== "n" && a[1] !== "N") && (a = E0.get(a) || a, cs(e, a, l));
    }
  }
  function Go(e, t, a, l, n, i) {
    switch (a) {
      case "style":
        _r(e, l, i);
        break;
      case "dangerouslySetInnerHTML":
        if (l != null) {
          if (typeof l != "object" || !("__html" in l))
            throw Error(r(61));
          if (a = l.__html, a != null) {
            if (n.children != null) throw Error(r(60));
            e.innerHTML = a;
          }
        }
        break;
      case "children":
        typeof l == "string" ? ln(e, l) : (typeof l == "number" || typeof l == "bigint") && ln(e, "" + l);
        break;
      case "onScroll":
        l != null && Se("scroll", e);
        break;
      case "onScrollEnd":
        l != null && Se("scrollend", e);
        break;
      case "onClick":
        l != null && (e.onclick = Ca);
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "innerHTML":
      case "ref":
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        if (!Xr.hasOwnProperty(a))
          e: {
            if (a[0] === "o" && a[1] === "n" && (n = a.endsWith("Capture"), t = a.slice(2, n ? a.length - 7 : void 0), i = e[St] || null, i = i != null ? i[a] : null, typeof i == "function" && e.removeEventListener(t, i, n), typeof l == "function")) {
              typeof i != "function" && i !== null && (a in e ? e[a] = null : e.hasAttribute(a) && e.removeAttribute(a)), e.addEventListener(t, l, n);
              break e;
            }
            a in e ? e[a] = l : l === !0 ? e.setAttribute(a, "") : cs(e, a, l);
          }
    }
  }
  function ft(e, t, a) {
    switch (t) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "img":
        Se("error", e), Se("load", e);
        var l = !1, n = !1, i;
        for (i in a)
          if (a.hasOwnProperty(i)) {
            var o = a[i];
            if (o != null)
              switch (i) {
                case "src":
                  l = !0;
                  break;
                case "srcSet":
                  n = !0;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  throw Error(r(137, t));
                default:
                  je(e, t, i, o, a, null);
              }
          }
        n && je(e, t, "srcSet", a.srcSet, a, null), l && je(e, t, "src", a.src, a, null);
        return;
      case "input":
        Se("invalid", e);
        var f = i = o = n = null, g = null, M = null;
        for (l in a)
          if (a.hasOwnProperty(l)) {
            var O = a[l];
            if (O != null)
              switch (l) {
                case "name":
                  n = O;
                  break;
                case "type":
                  o = O;
                  break;
                case "checked":
                  g = O;
                  break;
                case "defaultChecked":
                  M = O;
                  break;
                case "value":
                  i = O;
                  break;
                case "defaultValue":
                  f = O;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  if (O != null)
                    throw Error(r(137, t));
                  break;
                default:
                  je(e, t, l, O, a, null);
              }
          }
        Yr(
          e,
          i,
          f,
          g,
          M,
          o,
          n,
          !1
        );
        return;
      case "select":
        Se("invalid", e), l = o = i = null;
        for (n in a)
          if (a.hasOwnProperty(n) && (f = a[n], f != null))
            switch (n) {
              case "value":
                i = f;
                break;
              case "defaultValue":
                o = f;
                break;
              case "multiple":
                l = f;
              default:
                je(e, t, n, f, a, null);
            }
        t = i, a = o, e.multiple = !!l, t != null ? an(e, !!l, t, !1) : a != null && an(e, !!l, a, !0);
        return;
      case "textarea":
        Se("invalid", e), i = n = l = null;
        for (o in a)
          if (a.hasOwnProperty(o) && (f = a[o], f != null))
            switch (o) {
              case "value":
                l = f;
                break;
              case "defaultValue":
                n = f;
                break;
              case "children":
                i = f;
                break;
              case "dangerouslySetInnerHTML":
                if (f != null) throw Error(r(91));
                break;
              default:
                je(e, t, o, f, a, null);
            }
        Wr(e, l, n, i);
        return;
      case "option":
        for (g in a)
          if (a.hasOwnProperty(g) && (l = a[g], l != null))
            switch (g) {
              case "selected":
                e.selected = l && typeof l != "function" && typeof l != "symbol";
                break;
              default:
                je(e, t, g, l, a, null);
            }
        return;
      case "dialog":
        Se("beforetoggle", e), Se("toggle", e), Se("cancel", e), Se("close", e);
        break;
      case "iframe":
      case "object":
        Se("load", e);
        break;
      case "video":
      case "audio":
        for (l = 0; l < Mi.length; l++)
          Se(Mi[l], e);
        break;
      case "image":
        Se("error", e), Se("load", e);
        break;
      case "details":
        Se("toggle", e);
        break;
      case "embed":
      case "source":
      case "link":
        Se("error", e), Se("load", e);
      case "area":
      case "base":
      case "br":
      case "col":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "track":
      case "wbr":
      case "menuitem":
        for (M in a)
          if (a.hasOwnProperty(M) && (l = a[M], l != null))
            switch (M) {
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(r(137, t));
              default:
                je(e, t, M, l, a, null);
            }
        return;
      default:
        if ($u(t)) {
          for (O in a)
            a.hasOwnProperty(O) && (l = a[O], l !== void 0 && Go(
              e,
              t,
              O,
              l,
              a,
              void 0
            ));
          return;
        }
    }
    for (f in a)
      a.hasOwnProperty(f) && (l = a[f], l != null && je(e, t, f, l, a, null));
  }
  function Fp(e, t, a, l) {
    switch (t) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "input":
        var n = null, i = null, o = null, f = null, g = null, M = null, O = null;
        for (R in a) {
          var L = a[R];
          if (a.hasOwnProperty(R) && L != null)
            switch (R) {
              case "checked":
                break;
              case "value":
                break;
              case "defaultValue":
                g = L;
              default:
                l.hasOwnProperty(R) || je(e, t, R, null, l, L);
            }
        }
        for (var N in l) {
          var R = l[N];
          if (L = a[N], l.hasOwnProperty(N) && (R != null || L != null))
            switch (N) {
              case "type":
                i = R;
                break;
              case "name":
                n = R;
                break;
              case "checked":
                M = R;
                break;
              case "defaultChecked":
                O = R;
                break;
              case "value":
                o = R;
                break;
              case "defaultValue":
                f = R;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                if (R != null)
                  throw Error(r(137, t));
                break;
              default:
                R !== L && je(
                  e,
                  t,
                  N,
                  R,
                  l,
                  L
                );
            }
        }
        Pu(
          e,
          o,
          f,
          g,
          M,
          O,
          i,
          n
        );
        return;
      case "select":
        R = o = f = N = null;
        for (i in a)
          if (g = a[i], a.hasOwnProperty(i) && g != null)
            switch (i) {
              case "value":
                break;
              case "multiple":
                R = g;
              default:
                l.hasOwnProperty(i) || je(
                  e,
                  t,
                  i,
                  null,
                  l,
                  g
                );
            }
        for (n in l)
          if (i = l[n], g = a[n], l.hasOwnProperty(n) && (i != null || g != null))
            switch (n) {
              case "value":
                N = i;
                break;
              case "defaultValue":
                f = i;
                break;
              case "multiple":
                o = i;
              default:
                i !== g && je(
                  e,
                  t,
                  n,
                  i,
                  l,
                  g
                );
            }
        t = f, a = o, l = R, N != null ? an(e, !!a, N, !1) : !!l != !!a && (t != null ? an(e, !!a, t, !0) : an(e, !!a, a ? [] : "", !1));
        return;
      case "textarea":
        R = N = null;
        for (f in a)
          if (n = a[f], a.hasOwnProperty(f) && n != null && !l.hasOwnProperty(f))
            switch (f) {
              case "value":
                break;
              case "children":
                break;
              default:
                je(e, t, f, null, l, n);
            }
        for (o in l)
          if (n = l[o], i = a[o], l.hasOwnProperty(o) && (n != null || i != null))
            switch (o) {
              case "value":
                N = n;
                break;
              case "defaultValue":
                R = n;
                break;
              case "children":
                break;
              case "dangerouslySetInnerHTML":
                if (n != null) throw Error(r(91));
                break;
              default:
                n !== i && je(e, t, o, n, l, i);
            }
        Fr(e, N, R);
        return;
      case "option":
        for (var _ in a)
          if (N = a[_], a.hasOwnProperty(_) && N != null && !l.hasOwnProperty(_))
            switch (_) {
              case "selected":
                e.selected = !1;
                break;
              default:
                je(
                  e,
                  t,
                  _,
                  null,
                  l,
                  N
                );
            }
        for (g in l)
          if (N = l[g], R = a[g], l.hasOwnProperty(g) && N !== R && (N != null || R != null))
            switch (g) {
              case "selected":
                e.selected = N && typeof N != "function" && typeof N != "symbol";
                break;
              default:
                je(
                  e,
                  t,
                  g,
                  N,
                  l,
                  R
                );
            }
        return;
      case "img":
      case "link":
      case "area":
      case "base":
      case "br":
      case "col":
      case "embed":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "source":
      case "track":
      case "wbr":
      case "menuitem":
        for (var oe in a)
          N = a[oe], a.hasOwnProperty(oe) && N != null && !l.hasOwnProperty(oe) && je(e, t, oe, null, l, N);
        for (M in l)
          if (N = l[M], R = a[M], l.hasOwnProperty(M) && N !== R && (N != null || R != null))
            switch (M) {
              case "children":
              case "dangerouslySetInnerHTML":
                if (N != null)
                  throw Error(r(137, t));
                break;
              default:
                je(
                  e,
                  t,
                  M,
                  N,
                  l,
                  R
                );
            }
        return;
      default:
        if ($u(t)) {
          for (var Oe in a)
            N = a[Oe], a.hasOwnProperty(Oe) && N !== void 0 && !l.hasOwnProperty(Oe) && Go(
              e,
              t,
              Oe,
              void 0,
              l,
              N
            );
          for (O in l)
            N = l[O], R = a[O], !l.hasOwnProperty(O) || N === R || N === void 0 && R === void 0 || Go(
              e,
              t,
              O,
              N,
              l,
              R
            );
          return;
        }
    }
    for (var x in a)
      N = a[x], a.hasOwnProperty(x) && N != null && !l.hasOwnProperty(x) && je(e, t, x, null, l, N);
    for (L in l)
      N = l[L], R = a[L], !l.hasOwnProperty(L) || N === R || N == null && R == null || je(e, t, L, N, l, R);
  }
  function eh(e) {
    switch (e) {
      case "css":
      case "script":
      case "font":
      case "img":
      case "image":
      case "input":
      case "link":
        return !0;
      default:
        return !1;
    }
  }
  function Wp() {
    if (typeof performance.getEntriesByType == "function") {
      for (var e = 0, t = 0, a = performance.getEntriesByType("resource"), l = 0; l < a.length; l++) {
        var n = a[l], i = n.transferSize, o = n.initiatorType, f = n.duration;
        if (i && f && eh(o)) {
          for (o = 0, f = n.responseEnd, l += 1; l < a.length; l++) {
            var g = a[l], M = g.startTime;
            if (M > f) break;
            var O = g.transferSize, L = g.initiatorType;
            O && eh(L) && (g = g.responseEnd, o += O * (g < f ? 1 : (f - M) / (g - M)));
          }
          if (--l, t += 8 * (i + o) / (n.duration / 1e3), e++, 10 < e) break;
        }
      }
      if (0 < e) return t / e / 1e6;
    }
    return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
  }
  var Ho = null, Qo = null;
  function su(e) {
    return e.nodeType === 9 ? e : e.ownerDocument;
  }
  function th(e) {
    switch (e) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function ah(e, t) {
    if (e === 0)
      switch (t) {
        case "svg":
          return 1;
        case "math":
          return 2;
        default:
          return 0;
      }
    return e === 1 && t === "foreignObject" ? 0 : e;
  }
  function Xo(e, t) {
    return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
  }
  var Ko = null;
  function Pp() {
    var e = window.event;
    return e && e.type === "popstate" ? e === Ko ? !1 : (Ko = e, !0) : (Ko = null, !1);
  }
  var lh = typeof setTimeout == "function" ? setTimeout : void 0, _p = typeof clearTimeout == "function" ? clearTimeout : void 0, nh = typeof Promise == "function" ? Promise : void 0, $p = typeof queueMicrotask == "function" ? queueMicrotask : typeof nh < "u" ? function(e) {
    return nh.resolve(null).then(e).catch(e1);
  } : lh;
  function e1(e) {
    setTimeout(function() {
      throw e;
    });
  }
  function ol(e) {
    return e === "head";
  }
  function ih(e, t) {
    var a = t, l = 0;
    do {
      var n = a.nextSibling;
      if (e.removeChild(a), n && n.nodeType === 8)
        if (a = n.data, a === "/$" || a === "/&") {
          if (l === 0) {
            e.removeChild(n), jn(t);
            return;
          }
          l--;
        } else if (a === "$" || a === "$?" || a === "$~" || a === "$!" || a === "&")
          l++;
        else if (a === "html")
          Ui(e.ownerDocument.documentElement);
        else if (a === "head") {
          a = e.ownerDocument.head, Ui(a);
          for (var i = a.firstChild; i; ) {
            var o = i.nextSibling, f = i.nodeName;
            i[Jn] || f === "SCRIPT" || f === "STYLE" || f === "LINK" && i.rel.toLowerCase() === "stylesheet" || a.removeChild(i), i = o;
          }
        } else
          a === "body" && Ui(e.ownerDocument.body);
      a = n;
    } while (a);
    jn(t);
  }
  function sh(e, t) {
    var a = e;
    e = 0;
    do {
      var l = a.nextSibling;
      if (a.nodeType === 1 ? t ? (a._stashedDisplay = a.style.display, a.style.display = "none") : (a.style.display = a._stashedDisplay || "", a.getAttribute("style") === "" && a.removeAttribute("style")) : a.nodeType === 3 && (t ? (a._stashedText = a.nodeValue, a.nodeValue = "") : a.nodeValue = a._stashedText || ""), l && l.nodeType === 8)
        if (a = l.data, a === "/$") {
          if (e === 0) break;
          e--;
        } else
          a !== "$" && a !== "$?" && a !== "$~" && a !== "$!" || e++;
      a = l;
    } while (a);
  }
  function Zo(e) {
    var t = e.firstChild;
    for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
      var a = t;
      switch (t = t.nextSibling, a.nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          Zo(a), Fu(a);
          continue;
        case "SCRIPT":
        case "STYLE":
          continue;
        case "LINK":
          if (a.rel.toLowerCase() === "stylesheet") continue;
      }
      e.removeChild(a);
    }
  }
  function t1(e, t, a, l) {
    for (; e.nodeType === 1; ) {
      var n = a;
      if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
        if (!l && (e.nodeName !== "INPUT" || e.type !== "hidden"))
          break;
      } else if (l) {
        if (!e[Jn])
          switch (t) {
            case "meta":
              if (!e.hasAttribute("itemprop")) break;
              return e;
            case "link":
              if (i = e.getAttribute("rel"), i === "stylesheet" && e.hasAttribute("data-precedence"))
                break;
              if (i !== n.rel || e.getAttribute("href") !== (n.href == null || n.href === "" ? null : n.href) || e.getAttribute("crossorigin") !== (n.crossOrigin == null ? null : n.crossOrigin) || e.getAttribute("title") !== (n.title == null ? null : n.title))
                break;
              return e;
            case "style":
              if (e.hasAttribute("data-precedence")) break;
              return e;
            case "script":
              if (i = e.getAttribute("src"), (i !== (n.src == null ? null : n.src) || e.getAttribute("type") !== (n.type == null ? null : n.type) || e.getAttribute("crossorigin") !== (n.crossOrigin == null ? null : n.crossOrigin)) && i && e.hasAttribute("async") && !e.hasAttribute("itemprop"))
                break;
              return e;
            default:
              return e;
          }
      } else if (t === "input" && e.type === "hidden") {
        var i = n.name == null ? null : "" + n.name;
        if (n.type === "hidden" && e.getAttribute("name") === i)
          return e;
      } else return e;
      if (e = Yt(e.nextSibling), e === null) break;
    }
    return null;
  }
  function a1(e, t, a) {
    if (t === "") return null;
    for (; e.nodeType !== 3; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !a || (e = Yt(e.nextSibling), e === null)) return null;
    return e;
  }
  function uh(e, t) {
    for (; e.nodeType !== 8; )
      if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = Yt(e.nextSibling), e === null)) return null;
    return e;
  }
  function Vo(e) {
    return e.data === "$?" || e.data === "$~";
  }
  function Jo(e) {
    return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
  }
  function l1(e, t) {
    var a = e.ownerDocument;
    if (e.data === "$~") e._reactRetry = t;
    else if (e.data !== "$?" || a.readyState !== "loading")
      t();
    else {
      var l = function() {
        t(), a.removeEventListener("DOMContentLoaded", l);
      };
      a.addEventListener("DOMContentLoaded", l), e._reactRetry = l;
    }
  }
  function Yt(e) {
    for (; e != null; e = e.nextSibling) {
      var t = e.nodeType;
      if (t === 1 || t === 3) break;
      if (t === 8) {
        if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F")
          break;
        if (t === "/$" || t === "/&") return null;
      }
    }
    return e;
  }
  var Yo = null;
  function ch(e) {
    e = e.nextSibling;
    for (var t = 0; e; ) {
      if (e.nodeType === 8) {
        var a = e.data;
        if (a === "/$" || a === "/&") {
          if (t === 0)
            return Yt(e.nextSibling);
          t--;
        } else
          a !== "$" && a !== "$!" && a !== "$?" && a !== "$~" && a !== "&" || t++;
      }
      e = e.nextSibling;
    }
    return null;
  }
  function oh(e) {
    e = e.previousSibling;
    for (var t = 0; e; ) {
      if (e.nodeType === 8) {
        var a = e.data;
        if (a === "$" || a === "$!" || a === "$?" || a === "$~" || a === "&") {
          if (t === 0) return e;
          t--;
        } else a !== "/$" && a !== "/&" || t++;
      }
      e = e.previousSibling;
    }
    return null;
  }
  function rh(e, t, a) {
    switch (t = su(a), e) {
      case "html":
        if (e = t.documentElement, !e) throw Error(r(452));
        return e;
      case "head":
        if (e = t.head, !e) throw Error(r(453));
        return e;
      case "body":
        if (e = t.body, !e) throw Error(r(454));
        return e;
      default:
        throw Error(r(451));
    }
  }
  function Ui(e) {
    for (var t = e.attributes; t.length; )
      e.removeAttributeNode(t[0]);
    Fu(e);
  }
  var Ft = /* @__PURE__ */ new Map(), dh = /* @__PURE__ */ new Set();
  function uu(e) {
    return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
  }
  var Ba = H.d;
  H.d = {
    f: n1,
    r: i1,
    D: s1,
    C: u1,
    L: c1,
    m: o1,
    X: d1,
    S: r1,
    M: f1
  };
  function n1() {
    var e = Ba.f(), t = _s();
    return e || t;
  }
  function i1(e) {
    var t = $l(e);
    t !== null && t.tag === 5 && t.type === "form" ? Nf(t) : Ba.r(e);
  }
  var zn = typeof document > "u" ? null : document;
  function fh(e, t, a) {
    var l = zn;
    if (l && typeof t == "string" && t) {
      var n = Ht(t);
      n = 'link[rel="' + e + '"][href="' + n + '"]', typeof a == "string" && (n += '[crossorigin="' + a + '"]'), dh.has(n) || (dh.add(n), e = { rel: e, crossOrigin: a, href: t }, l.querySelector(n) === null && (t = l.createElement("link"), ft(t, "link", e), st(t), l.head.appendChild(t)));
    }
  }
  function s1(e) {
    Ba.D(e), fh("dns-prefetch", e, null);
  }
  function u1(e, t) {
    Ba.C(e, t), fh("preconnect", e, t);
  }
  function c1(e, t, a) {
    Ba.L(e, t, a);
    var l = zn;
    if (l && e && t) {
      var n = 'link[rel="preload"][as="' + Ht(t) + '"]';
      t === "image" && a && a.imageSrcSet ? (n += '[imagesrcset="' + Ht(
        a.imageSrcSet
      ) + '"]', typeof a.imageSizes == "string" && (n += '[imagesizes="' + Ht(
        a.imageSizes
      ) + '"]')) : n += '[href="' + Ht(e) + '"]';
      var i = n;
      switch (t) {
        case "style":
          i = wn(e);
          break;
        case "script":
          i = In(e);
      }
      Ft.has(i) || (e = E(
        {
          rel: "preload",
          href: t === "image" && a && a.imageSrcSet ? void 0 : e,
          as: t
        },
        a
      ), Ft.set(i, e), l.querySelector(n) !== null || t === "style" && l.querySelector(Ri(i)) || t === "script" && l.querySelector(Di(i)) || (t = l.createElement("link"), ft(t, "link", e), st(t), l.head.appendChild(t)));
    }
  }
  function o1(e, t) {
    Ba.m(e, t);
    var a = zn;
    if (a && e) {
      var l = t && typeof t.as == "string" ? t.as : "script", n = 'link[rel="modulepreload"][as="' + Ht(l) + '"][href="' + Ht(e) + '"]', i = n;
      switch (l) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          i = In(e);
      }
      if (!Ft.has(i) && (e = E({ rel: "modulepreload", href: e }, t), Ft.set(i, e), a.querySelector(n) === null)) {
        switch (l) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (a.querySelector(Di(i)))
              return;
        }
        l = a.createElement("link"), ft(l, "link", e), st(l), a.head.appendChild(l);
      }
    }
  }
  function r1(e, t, a) {
    Ba.S(e, t, a);
    var l = zn;
    if (l && e) {
      var n = en(l).hoistableStyles, i = wn(e);
      t = t || "default";
      var o = n.get(i);
      if (!o) {
        var f = { loading: 0, preload: null };
        if (o = l.querySelector(
          Ri(i)
        ))
          f.loading = 5;
        else {
          e = E(
            { rel: "stylesheet", href: e, "data-precedence": t },
            a
          ), (a = Ft.get(i)) && Fo(e, a);
          var g = o = l.createElement("link");
          st(g), ft(g, "link", e), g._p = new Promise(function(M, O) {
            g.onload = M, g.onerror = O;
          }), g.addEventListener("load", function() {
            f.loading |= 1;
          }), g.addEventListener("error", function() {
            f.loading |= 2;
          }), f.loading |= 4, cu(o, t, l);
        }
        o = {
          type: "stylesheet",
          instance: o,
          count: 1,
          state: f
        }, n.set(i, o);
      }
    }
  }
  function d1(e, t) {
    Ba.X(e, t);
    var a = zn;
    if (a && e) {
      var l = en(a).hoistableScripts, n = In(e), i = l.get(n);
      i || (i = a.querySelector(Di(n)), i || (e = E({ src: e, async: !0 }, t), (t = Ft.get(n)) && Wo(e, t), i = a.createElement("script"), st(i), ft(i, "link", e), a.head.appendChild(i)), i = {
        type: "script",
        instance: i,
        count: 1,
        state: null
      }, l.set(n, i));
    }
  }
  function f1(e, t) {
    Ba.M(e, t);
    var a = zn;
    if (a && e) {
      var l = en(a).hoistableScripts, n = In(e), i = l.get(n);
      i || (i = a.querySelector(Di(n)), i || (e = E({ src: e, async: !0, type: "module" }, t), (t = Ft.get(n)) && Wo(e, t), i = a.createElement("script"), st(i), ft(i, "link", e), a.head.appendChild(i)), i = {
        type: "script",
        instance: i,
        count: 1,
        state: null
      }, l.set(n, i));
    }
  }
  function mh(e, t, a, l) {
    var n = (n = fe.current) ? uu(n) : null;
    if (!n) throw Error(r(446));
    switch (e) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof a.precedence == "string" && typeof a.href == "string" ? (t = wn(a.href), a = en(
          n
        ).hoistableStyles, l = a.get(t), l || (l = {
          type: "style",
          instance: null,
          count: 0,
          state: null
        }, a.set(t, l)), l) : { type: "void", instance: null, count: 0, state: null };
      case "link":
        if (a.rel === "stylesheet" && typeof a.href == "string" && typeof a.precedence == "string") {
          e = wn(a.href);
          var i = en(
            n
          ).hoistableStyles, o = i.get(e);
          if (o || (n = n.ownerDocument || n, o = {
            type: "stylesheet",
            instance: null,
            count: 0,
            state: { loading: 0, preload: null }
          }, i.set(e, o), (i = n.querySelector(
            Ri(e)
          )) && !i._p && (o.instance = i, o.state.loading = 5), Ft.has(e) || (a = {
            rel: "preload",
            as: "style",
            href: a.href,
            crossOrigin: a.crossOrigin,
            integrity: a.integrity,
            media: a.media,
            hrefLang: a.hrefLang,
            referrerPolicy: a.referrerPolicy
          }, Ft.set(e, a), i || m1(
            n,
            e,
            a,
            o.state
          ))), t && l === null)
            throw Error(r(528, ""));
          return o;
        }
        if (t && l !== null)
          throw Error(r(529, ""));
        return null;
      case "script":
        return t = a.async, a = a.src, typeof a == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = In(a), a = en(
          n
        ).hoistableScripts, l = a.get(t), l || (l = {
          type: "script",
          instance: null,
          count: 0,
          state: null
        }, a.set(t, l)), l) : { type: "void", instance: null, count: 0, state: null };
      default:
        throw Error(r(444, e));
    }
  }
  function wn(e) {
    return 'href="' + Ht(e) + '"';
  }
  function Ri(e) {
    return 'link[rel="stylesheet"][' + e + "]";
  }
  function hh(e) {
    return E({}, e, {
      "data-precedence": e.precedence,
      precedence: null
    });
  }
  function m1(e, t, a, l) {
    e.querySelector('link[rel="preload"][as="style"][' + t + "]") ? l.loading = 1 : (t = e.createElement("link"), l.preload = t, t.addEventListener("load", function() {
      return l.loading |= 1;
    }), t.addEventListener("error", function() {
      return l.loading |= 2;
    }), ft(t, "link", a), st(t), e.head.appendChild(t));
  }
  function In(e) {
    return '[src="' + Ht(e) + '"]';
  }
  function Di(e) {
    return "script[async]" + e;
  }
  function gh(e, t, a) {
    if (t.count++, t.instance === null)
      switch (t.type) {
        case "style":
          var l = e.querySelector(
            'style[data-href~="' + Ht(a.href) + '"]'
          );
          if (l)
            return t.instance = l, st(l), l;
          var n = E({}, a, {
            "data-href": a.href,
            "data-precedence": a.precedence,
            href: null,
            precedence: null
          });
          return l = (e.ownerDocument || e).createElement(
            "style"
          ), st(l), ft(l, "style", n), cu(l, a.precedence, e), t.instance = l;
        case "stylesheet":
          n = wn(a.href);
          var i = e.querySelector(
            Ri(n)
          );
          if (i)
            return t.state.loading |= 4, t.instance = i, st(i), i;
          l = hh(a), (n = Ft.get(n)) && Fo(l, n), i = (e.ownerDocument || e).createElement("link"), st(i);
          var o = i;
          return o._p = new Promise(function(f, g) {
            o.onload = f, o.onerror = g;
          }), ft(i, "link", l), t.state.loading |= 4, cu(i, a.precedence, e), t.instance = i;
        case "script":
          return i = In(a.src), (n = e.querySelector(
            Di(i)
          )) ? (t.instance = n, st(n), n) : (l = a, (n = Ft.get(i)) && (l = E({}, a), Wo(l, n)), e = e.ownerDocument || e, n = e.createElement("script"), st(n), ft(n, "link", l), e.head.appendChild(n), t.instance = n);
        case "void":
          return null;
        default:
          throw Error(r(443, t.type));
      }
    else
      t.type === "stylesheet" && (t.state.loading & 4) === 0 && (l = t.instance, t.state.loading |= 4, cu(l, a.precedence, e));
    return t.instance;
  }
  function cu(e, t, a) {
    for (var l = a.querySelectorAll(
      'link[rel="stylesheet"][data-precedence],style[data-precedence]'
    ), n = l.length ? l[l.length - 1] : null, i = n, o = 0; o < l.length; o++) {
      var f = l[o];
      if (f.dataset.precedence === t) i = f;
      else if (i !== n) break;
    }
    i ? i.parentNode.insertBefore(e, i.nextSibling) : (t = a.nodeType === 9 ? a.head : a, t.insertBefore(e, t.firstChild));
  }
  function Fo(e, t) {
    e.crossOrigin == null && (e.crossOrigin = t.crossOrigin), e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy), e.title == null && (e.title = t.title);
  }
  function Wo(e, t) {
    e.crossOrigin == null && (e.crossOrigin = t.crossOrigin), e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy), e.integrity == null && (e.integrity = t.integrity);
  }
  var ou = null;
  function ph(e, t, a) {
    if (ou === null) {
      var l = /* @__PURE__ */ new Map(), n = ou = /* @__PURE__ */ new Map();
      n.set(a, l);
    } else
      n = ou, l = n.get(a), l || (l = /* @__PURE__ */ new Map(), n.set(a, l));
    if (l.has(e)) return l;
    for (l.set(e, null), a = a.getElementsByTagName(e), n = 0; n < a.length; n++) {
      var i = a[n];
      if (!(i[Jn] || i[ct] || e === "link" && i.getAttribute("rel") === "stylesheet") && i.namespaceURI !== "http://www.w3.org/2000/svg") {
        var o = i.getAttribute(t) || "";
        o = e + o;
        var f = l.get(o);
        f ? f.push(i) : l.set(o, [i]);
      }
    }
    return l;
  }
  function yh(e, t, a) {
    e = e.ownerDocument || e, e.head.insertBefore(
      a,
      t === "title" ? e.querySelector("head > title") : null
    );
  }
  function h1(e, t, a) {
    if (a === 1 || t.itemProp != null) return !1;
    switch (e) {
      case "meta":
      case "title":
        return !0;
      case "style":
        if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "")
          break;
        return !0;
      case "link":
        if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError)
          break;
        switch (t.rel) {
          case "stylesheet":
            return e = t.disabled, typeof t.precedence == "string" && e == null;
          default:
            return !0;
        }
      case "script":
        if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string")
          return !0;
    }
    return !1;
  }
  function vh(e) {
    return !(e.type === "stylesheet" && (e.state.loading & 3) === 0);
  }
  function g1(e, t, a, l) {
    if (a.type === "stylesheet" && (typeof l.media != "string" || matchMedia(l.media).matches !== !1) && (a.state.loading & 4) === 0) {
      if (a.instance === null) {
        var n = wn(l.href), i = t.querySelector(
          Ri(n)
        );
        if (i) {
          t = i._p, t !== null && typeof t == "object" && typeof t.then == "function" && (e.count++, e = ru.bind(e), t.then(e, e)), a.state.loading |= 4, a.instance = i, st(i);
          return;
        }
        i = t.ownerDocument || t, l = hh(l), (n = Ft.get(n)) && Fo(l, n), i = i.createElement("link"), st(i);
        var o = i;
        o._p = new Promise(function(f, g) {
          o.onload = f, o.onerror = g;
        }), ft(i, "link", l), a.instance = i;
      }
      e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(a, t), (t = a.state.preload) && (a.state.loading & 3) === 0 && (e.count++, a = ru.bind(e), t.addEventListener("load", a), t.addEventListener("error", a));
    }
  }
  var Po = 0;
  function p1(e, t) {
    return e.stylesheets && e.count === 0 && fu(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(a) {
      var l = setTimeout(function() {
        if (e.stylesheets && fu(e, e.stylesheets), e.unsuspend) {
          var i = e.unsuspend;
          e.unsuspend = null, i();
        }
      }, 6e4 + t);
      0 < e.imgBytes && Po === 0 && (Po = 62500 * Wp());
      var n = setTimeout(
        function() {
          if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && fu(e, e.stylesheets), e.unsuspend)) {
            var i = e.unsuspend;
            e.unsuspend = null, i();
          }
        },
        (e.imgBytes > Po ? 50 : 800) + t
      );
      return e.unsuspend = a, function() {
        e.unsuspend = null, clearTimeout(l), clearTimeout(n);
      };
    } : null;
  }
  function ru() {
    if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
      if (this.stylesheets) fu(this, this.stylesheets);
      else if (this.unsuspend) {
        var e = this.unsuspend;
        this.unsuspend = null, e();
      }
    }
  }
  var du = null;
  function fu(e, t) {
    e.stylesheets = null, e.unsuspend !== null && (e.count++, du = /* @__PURE__ */ new Map(), t.forEach(y1, e), du = null, ru.call(e));
  }
  function y1(e, t) {
    if (!(t.state.loading & 4)) {
      var a = du.get(e);
      if (a) var l = a.get(null);
      else {
        a = /* @__PURE__ */ new Map(), du.set(e, a);
        for (var n = e.querySelectorAll(
          "link[data-precedence],style[data-precedence]"
        ), i = 0; i < n.length; i++) {
          var o = n[i];
          (o.nodeName === "LINK" || o.getAttribute("media") !== "not all") && (a.set(o.dataset.precedence, o), l = o);
        }
        l && a.set(null, l);
      }
      n = t.instance, o = n.getAttribute("data-precedence"), i = a.get(o) || l, i === l && a.set(null, n), a.set(o, n), this.count++, l = ru.bind(this), n.addEventListener("load", l), n.addEventListener("error", l), i ? i.parentNode.insertBefore(n, i.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(n, e.firstChild)), t.state.loading |= 4;
    }
  }
  var zi = {
    $$typeof: $,
    Provider: null,
    Consumer: null,
    _currentValue: G,
    _currentValue2: G,
    _threadCount: 0
  };
  function v1(e, t, a, l, n, i, o, f, g) {
    this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Fl(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Fl(0), this.hiddenUpdates = Fl(null), this.identifierPrefix = l, this.onUncaughtError = n, this.onCaughtError = i, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = g, this.incompleteTransitions = /* @__PURE__ */ new Map();
  }
  function Ah(e, t, a, l, n, i, o, f, g, M, O, L) {
    return e = new v1(
      e,
      t,
      a,
      o,
      g,
      M,
      O,
      L,
      f
    ), t = 1, i === !0 && (t |= 24), i = zt(3, null, null, t), e.current = i, i.stateNode = e, t = Uc(), t.refCount++, e.pooledCache = t, t.refCount++, i.memoizedState = {
      element: l,
      isDehydrated: a,
      cache: t
    }, wc(i), e;
  }
  function bh(e) {
    return e ? (e = dn, e) : dn;
  }
  function Sh(e, t, a, l, n, i) {
    n = bh(n), l.context === null ? l.context = n : l.pendingContext = n, l = _a(t), l.payload = { element: a }, i = i === void 0 ? null : i, i !== null && (l.callback = i), a = $a(e, l, t), a !== null && (Mt(a, e, t), ri(a, e, t));
  }
  function Eh(e, t) {
    if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
      var a = e.retryLane;
      e.retryLane = a !== 0 && a < t ? a : t;
    }
  }
  function _o(e, t) {
    Eh(e, t), (e = e.alternate) && Eh(e, t);
  }
  function Ch(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = Rl(e, 67108864);
      t !== null && Mt(t, e, 67108864), _o(e, 67108864);
    }
  }
  function Th(e) {
    if (e.tag === 13 || e.tag === 31) {
      var t = qt();
      t = Wl(t);
      var a = Rl(e, t);
      a !== null && Mt(a, e, t), _o(e, t);
    }
  }
  var mu = !0;
  function A1(e, t, a, l) {
    var n = D.T;
    D.T = null;
    var i = H.p;
    try {
      H.p = 2, $o(e, t, a, l);
    } finally {
      H.p = i, D.T = n;
    }
  }
  function b1(e, t, a, l) {
    var n = D.T;
    D.T = null;
    var i = H.p;
    try {
      H.p = 8, $o(e, t, a, l);
    } finally {
      H.p = i, D.T = n;
    }
  }
  function $o(e, t, a, l) {
    if (mu) {
      var n = er(l);
      if (n === null)
        Bo(
          e,
          t,
          l,
          hu,
          a
        ), kh(e, l);
      else if (E1(
        n,
        e,
        t,
        a,
        l
      ))
        l.stopPropagation();
      else if (kh(e, l), t & 4 && -1 < S1.indexOf(e)) {
        for (; n !== null; ) {
          var i = $l(n);
          if (i !== null)
            switch (i.tag) {
              case 3:
                if (i = i.stateNode, i.current.memoizedState.isDehydrated) {
                  var o = Aa(i.pendingLanes);
                  if (o !== 0) {
                    var f = i;
                    for (f.pendingLanes |= 2, f.entangledLanes |= 2; o; ) {
                      var g = 1 << 31 - Ze(o);
                      f.entanglements[1] |= g, o &= ~g;
                    }
                    ma(i), (Re & 6) === 0 && (Ws = nt() + 500, ki(0));
                  }
                }
                break;
              case 31:
              case 13:
                f = Rl(i, 2), f !== null && Mt(f, i, 2), _s(), _o(i, 2);
            }
          if (i = er(l), i === null && Bo(
            e,
            t,
            l,
            hu,
            a
          ), i === n) break;
          n = i;
        }
        n !== null && l.stopPropagation();
      } else
        Bo(
          e,
          t,
          l,
          null,
          a
        );
    }
  }
  function er(e) {
    return e = tc(e), tr(e);
  }
  var hu = null;
  function tr(e) {
    if (hu = null, e = _l(e), e !== null) {
      var t = h(e);
      if (t === null) e = null;
      else {
        var a = t.tag;
        if (a === 13) {
          if (e = v(t), e !== null) return e;
          e = null;
        } else if (a === 31) {
          if (e = T(t), e !== null) return e;
          e = null;
        } else if (a === 3) {
          if (t.stateNode.current.memoizedState.isDehydrated)
            return t.tag === 3 ? t.stateNode.containerInfo : null;
          e = null;
        } else t !== e && (e = null);
      }
    }
    return hu = e, null;
  }
  function xh(e) {
    switch (e) {
      case "beforetoggle":
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
      case "toggle":
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
        return 2;
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
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 8;
      case "message":
        switch (Cl()) {
          case Ka:
            return 2;
          case it:
            return 8;
          case Ut:
          case mt:
            return 32;
          case Lt:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var ar = !1, rl = null, dl = null, fl = null, wi = /* @__PURE__ */ new Map(), Ii = /* @__PURE__ */ new Map(), ml = [], S1 = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
    " "
  );
  function kh(e, t) {
    switch (e) {
      case "focusin":
      case "focusout":
        rl = null;
        break;
      case "dragenter":
      case "dragleave":
        dl = null;
        break;
      case "mouseover":
      case "mouseout":
        fl = null;
        break;
      case "pointerover":
      case "pointerout":
        wi.delete(t.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Ii.delete(t.pointerId);
    }
  }
  function ji(e, t, a, l, n, i) {
    return e === null || e.nativeEvent !== i ? (e = {
      blockedOn: t,
      domEventName: a,
      eventSystemFlags: l,
      nativeEvent: i,
      targetContainers: [n]
    }, t !== null && (t = $l(t), t !== null && Ch(t)), e) : (e.eventSystemFlags |= l, t = e.targetContainers, n !== null && t.indexOf(n) === -1 && t.push(n), e);
  }
  function E1(e, t, a, l, n) {
    switch (t) {
      case "focusin":
        return rl = ji(
          rl,
          e,
          t,
          a,
          l,
          n
        ), !0;
      case "dragenter":
        return dl = ji(
          dl,
          e,
          t,
          a,
          l,
          n
        ), !0;
      case "mouseover":
        return fl = ji(
          fl,
          e,
          t,
          a,
          l,
          n
        ), !0;
      case "pointerover":
        var i = n.pointerId;
        return wi.set(
          i,
          ji(
            wi.get(i) || null,
            e,
            t,
            a,
            l,
            n
          )
        ), !0;
      case "gotpointercapture":
        return i = n.pointerId, Ii.set(
          i,
          ji(
            Ii.get(i) || null,
            e,
            t,
            a,
            l,
            n
          )
        ), !0;
    }
    return !1;
  }
  function Mh(e) {
    var t = _l(e.target);
    if (t !== null) {
      var a = h(t);
      if (a !== null) {
        if (t = a.tag, t === 13) {
          if (t = v(a), t !== null) {
            e.blockedOn = t, Gr(e.priority, function() {
              Th(a);
            });
            return;
          }
        } else if (t === 31) {
          if (t = T(a), t !== null) {
            e.blockedOn = t, Gr(e.priority, function() {
              Th(a);
            });
            return;
          }
        } else if (t === 3 && a.stateNode.current.memoizedState.isDehydrated) {
          e.blockedOn = a.tag === 3 ? a.stateNode.containerInfo : null;
          return;
        }
      }
    }
    e.blockedOn = null;
  }
  function gu(e) {
    if (e.blockedOn !== null) return !1;
    for (var t = e.targetContainers; 0 < t.length; ) {
      var a = er(e.nativeEvent);
      if (a === null) {
        a = e.nativeEvent;
        var l = new a.constructor(
          a.type,
          a
        );
        ec = l, a.target.dispatchEvent(l), ec = null;
      } else
        return t = $l(a), t !== null && Ch(t), e.blockedOn = a, !1;
      t.shift();
    }
    return !0;
  }
  function Nh(e, t, a) {
    gu(e) && a.delete(t);
  }
  function C1() {
    ar = !1, rl !== null && gu(rl) && (rl = null), dl !== null && gu(dl) && (dl = null), fl !== null && gu(fl) && (fl = null), wi.forEach(Nh), Ii.forEach(Nh);
  }
  function pu(e, t) {
    e.blockedOn === t && (e.blockedOn = null, ar || (ar = !0, s.unstable_scheduleCallback(
      s.unstable_NormalPriority,
      C1
    )));
  }
  var yu = null;
  function Uh(e) {
    yu !== e && (yu = e, s.unstable_scheduleCallback(
      s.unstable_NormalPriority,
      function() {
        yu === e && (yu = null);
        for (var t = 0; t < e.length; t += 3) {
          var a = e[t], l = e[t + 1], n = e[t + 2];
          if (typeof l != "function") {
            if (tr(l || a) === null)
              continue;
            break;
          }
          var i = $l(a);
          i !== null && (e.splice(t, 3), t -= 3, $c(
            i,
            {
              pending: !0,
              data: n,
              method: a.method,
              action: l
            },
            l,
            n
          ));
        }
      }
    ));
  }
  function jn(e) {
    function t(g) {
      return pu(g, e);
    }
    rl !== null && pu(rl, e), dl !== null && pu(dl, e), fl !== null && pu(fl, e), wi.forEach(t), Ii.forEach(t);
    for (var a = 0; a < ml.length; a++) {
      var l = ml[a];
      l.blockedOn === e && (l.blockedOn = null);
    }
    for (; 0 < ml.length && (a = ml[0], a.blockedOn === null); )
      Mh(a), a.blockedOn === null && ml.shift();
    if (a = (e.ownerDocument || e).$$reactFormReplay, a != null)
      for (l = 0; l < a.length; l += 3) {
        var n = a[l], i = a[l + 1], o = n[St] || null;
        if (typeof i == "function")
          o || Uh(a);
        else if (o) {
          var f = null;
          if (i && i.hasAttribute("formAction")) {
            if (n = i, o = i[St] || null)
              f = o.formAction;
            else if (tr(n) !== null) continue;
          } else f = o.action;
          typeof f == "function" ? a[l + 1] = f : (a.splice(l, 3), l -= 3), Uh(a);
        }
      }
  }
  function Rh() {
    function e(i) {
      i.canIntercept && i.info === "react-transition" && i.intercept({
        handler: function() {
          return new Promise(function(o) {
            return n = o;
          });
        },
        focusReset: "manual",
        scroll: "manual"
      });
    }
    function t() {
      n !== null && (n(), n = null), l || setTimeout(a, 20);
    }
    function a() {
      if (!l && !navigation.transition) {
        var i = navigation.currentEntry;
        i && i.url != null && navigation.navigate(i.url, {
          state: i.getState(),
          info: "react-transition",
          history: "replace"
        });
      }
    }
    if (typeof navigation == "object") {
      var l = !1, n = null;
      return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(a, 100), function() {
        l = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), n !== null && (n(), n = null);
      };
    }
  }
  function lr(e) {
    this._internalRoot = e;
  }
  vu.prototype.render = lr.prototype.render = function(e) {
    var t = this._internalRoot;
    if (t === null) throw Error(r(409));
    var a = t.current, l = qt();
    Sh(a, l, e, t, null, null);
  }, vu.prototype.unmount = lr.prototype.unmount = function() {
    var e = this._internalRoot;
    if (e !== null) {
      this._internalRoot = null;
      var t = e.containerInfo;
      Sh(e.current, 2, null, e, null, null), _s(), t[Pl] = null;
    }
  };
  function vu(e) {
    this._internalRoot = e;
  }
  vu.prototype.unstable_scheduleHydration = function(e) {
    if (e) {
      var t = Br();
      e = { blockedOn: null, target: e, priority: t };
      for (var a = 0; a < ml.length && t !== 0 && t < ml[a].priority; a++) ;
      ml.splice(a, 0, e), a === 0 && Mh(e);
    }
  };
  var Dh = c.version;
  if (Dh !== "19.2.4")
    throw Error(
      r(
        527,
        Dh,
        "19.2.4"
      )
    );
  H.findDOMNode = function(e) {
    var t = e._reactInternals;
    if (t === void 0)
      throw typeof e.render == "function" ? Error(r(188)) : (e = Object.keys(e).join(","), Error(r(268, e)));
    return e = p(t), e = e !== null ? z(e) : null, e = e === null ? null : e.stateNode, e;
  };
  var T1 = {
    bundleType: 0,
    version: "19.2.4",
    rendererPackageName: "react-dom",
    currentDispatcherRef: D,
    reconcilerVersion: "19.2.4"
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var Au = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!Au.isDisabled && Au.supportsFiber)
      try {
        Rt = Au.inject(
          T1
        ), pt = Au;
      } catch {
      }
  }
  return qi.createRoot = function(e, t) {
    if (!m(e)) throw Error(r(299));
    var a = !1, l = "", n = Lf, i = Bf, o = Gf;
    return t != null && (t.unstable_strictMode === !0 && (a = !0), t.identifierPrefix !== void 0 && (l = t.identifierPrefix), t.onUncaughtError !== void 0 && (n = t.onUncaughtError), t.onCaughtError !== void 0 && (i = t.onCaughtError), t.onRecoverableError !== void 0 && (o = t.onRecoverableError)), t = Ah(
      e,
      1,
      !1,
      null,
      null,
      a,
      l,
      null,
      n,
      i,
      o,
      Rh
    ), e[Pl] = t.current, Lo(e), new lr(t);
  }, qi.hydrateRoot = function(e, t, a) {
    if (!m(e)) throw Error(r(299));
    var l = !1, n = "", i = Lf, o = Bf, f = Gf, g = null;
    return a != null && (a.unstable_strictMode === !0 && (l = !0), a.identifierPrefix !== void 0 && (n = a.identifierPrefix), a.onUncaughtError !== void 0 && (i = a.onUncaughtError), a.onCaughtError !== void 0 && (o = a.onCaughtError), a.onRecoverableError !== void 0 && (f = a.onRecoverableError), a.formState !== void 0 && (g = a.formState)), t = Ah(
      e,
      1,
      !0,
      t,
      a ?? null,
      l,
      n,
      g,
      i,
      o,
      f,
      Rh
    ), t.context = bh(null), a = t.current, l = qt(), l = Wl(l), n = _a(l), n.callback = null, $a(a, n, l), a = l, t.current.lanes = a, w(t, a), ma(t), e[Pl] = t.current, Lo(e), new vu(t);
  }, qi.version = "19.2.4", qi;
}
var Hh;
function j1() {
  if (Hh) return ir.exports;
  Hh = 1;
  function s() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(s);
      } catch (c) {
        console.error(c);
      }
  }
  return s(), ir.exports = I1(), ir.exports;
}
var Kn = j1(), U = Ir(), O1 = Qg();
function Zu({
  open: s,
  onClose: c,
  children: d,
  width: r = 680,
  height: m = 520,
  maskClosable: h = !0,
  closable: v = !0
}) {
  const T = U.useRef(null), S = U.useRef(null), p = U.useRef(null), [z, E] = U.useState(!1), [Q, ee] = U.useState(!1);
  if (U.useEffect(() => {
    s ? (E(!0), ee(!1)) : z && ee(!0);
  }, [s]), U.useEffect(() => {
    if (!Q) return;
    const Y = S.current;
    if (!Y) {
      E(!1), ee(!1);
      return;
    }
    const Z = ($) => {
      $.target === Y && (E(!1), ee(!1));
    };
    return Y.addEventListener("animationend", Z), () => Y.removeEventListener("animationend", Z);
  }, [Q]), U.useEffect(() => {
    if (!s) return;
    const Y = (Z) => {
      Z.key === "Escape" && c();
    };
    return document.addEventListener("keydown", Y), () => document.removeEventListener("keydown", Y);
  }, [s, c]), U.useEffect(() => {
    if (!z || Q) return;
    const Y = p.current;
    if (!Y) return;
    const Z = Y.getContext("2d");
    if (!Z) return;
    let $, de = !1;
    const W = [], le = () => {
      const ue = Y.parentElement;
      if (ue) {
        const Xe = ue.offsetWidth, X = ue.offsetHeight;
        Xe > 0 && X > 0 && (Y.width = Xe, Y.height = X);
      }
    }, ne = () => {
      if (!(de || Y.width === 0 || Y.height === 0)) {
        de = !0;
        for (let ue = 0; ue < 80; ue++)
          W.push({
            x: Math.random() * Y.width,
            y: Math.random() * Y.height,
            size: Math.random() * 1.5 + 0.5,
            speedY: Math.random() * 0.4 + 0.1,
            speedX: (Math.random() - 0.5) * 0.2,
            opacity: Math.random() * 0.3 + 0.1,
            isGold: Math.random() > 0.7
          });
      }
    }, ke = () => {
      de || (le(), ne()), Z.clearRect(0, 0, Y.width, Y.height), W.forEach((ue) => {
        ue.y -= ue.speedY, ue.x += ue.speedX, ue.opacity += (Math.random() - 0.5) * 0.02, ue.opacity < 0.1 && (ue.opacity = 0.1), ue.opacity > 0.5 && (ue.opacity = 0.5), ue.y < 0 && (ue.y = Y.height, ue.x = Math.random() * Y.width), ue.isGold ? (Z.shadowBlur = 4, Z.shadowColor = `rgba(200, 170, 110, ${ue.opacity})`) : (Z.shadowBlur = 3, Z.shadowColor = `rgba(0, 180, 255, ${ue.opacity * 0.8})`), Z.beginPath(), Z.arc(ue.x, ue.y, ue.size, 0, Math.PI * 2), Z.fillStyle = ue.isGold ? `rgba(220, 190, 130, ${ue.opacity})` : `rgba(80, 200, 255, ${ue.opacity * 0.85})`, Z.fill();
      }), Z.shadowBlur = 0, Z.shadowColor = "transparent", $ = requestAnimationFrame(ke);
    };
    return $ = requestAnimationFrame(ke), window.addEventListener("resize", le), () => {
      window.removeEventListener("resize", le), cancelAnimationFrame($);
    };
  }, [z, Q]), U.useEffect(() => (z && !Q && (document.body.style.overflow = "hidden"), z || (document.body.style.overflow = ""), () => {
    document.body.style.overflow = "";
  }), [z, Q]), !z) return null;
  const re = {
    width: typeof r == "number" ? `${r}px` : r,
    height: typeof m == "number" ? `${m}px` : m
  }, ae = `sona-modal-overlay${Q ? " sona-modal-closing" : ""}`, ye = `sona-modal-dialog${Q ? " sona-modal-closing" : ""}`;
  return O1.createPortal(
    /* @__PURE__ */ u.jsx(
      "div",
      {
        ref: S,
        className: ae,
        onClick: h ? c : void 0,
        onMouseDown: (Y) => Y.stopPropagation(),
        onMouseUp: (Y) => Y.stopPropagation(),
        children: /* @__PURE__ */ u.jsxs(
          "div",
          {
            ref: T,
            className: ye,
            style: re,
            onClick: (Y) => Y.stopPropagation(),
            children: [
              /* @__PURE__ */ u.jsx(
                "canvas",
                {
                  ref: p,
                  className: "sona-modal-particle-canvas"
                }
              ),
              v && /* @__PURE__ */ u.jsx("button", { className: "sona-modal-close", onClick: c, title: "Close", children: /* @__PURE__ */ u.jsx("svg", { width: "14", height: "14", viewBox: "0 0 14 14", fill: "none", children: /* @__PURE__ */ u.jsx("path", { d: "M1 1L13 13M13 1L1 13", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }) }) }),
              /* @__PURE__ */ u.jsx("div", { className: "sona-modal-body", children: d })
            ]
          }
        )
      }
    ),
    document.getElementById("sona-root") || document.body
  );
}
function q1() {
  return /* @__PURE__ */ u.jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ u.jsx("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" }) });
}
function L1() {
  return /* @__PURE__ */ u.jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ u.jsx("polyline", { points: "16 18 22 12 16 6" }),
    /* @__PURE__ */ u.jsx("polyline", { points: "8 6 2 12 8 18" })
  ] });
}
function B1() {
  return /* @__PURE__ */ u.jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ u.jsx("path", { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }),
    /* @__PURE__ */ u.jsx("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }),
    /* @__PURE__ */ u.jsx("line", { x1: "12", y1: "22.08", x2: "12", y2: "12" })
  ] });
}
function G1() {
  return /* @__PURE__ */ u.jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ u.jsx("path", { d: "M9 18V5l12-2v13" }),
    /* @__PURE__ */ u.jsx("circle", { cx: "6", cy: "18", r: "3" }),
    /* @__PURE__ */ u.jsx("circle", { cx: "18", cy: "16", r: "3" })
  ] });
}
function H1() {
  return /* @__PURE__ */ u.jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ u.jsx("path", { d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }),
    /* @__PURE__ */ u.jsx("polyline", { points: "9 22 9 12 15 12 15 22" })
  ] });
}
function Q1() {
  return /* @__PURE__ */ u.jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ u.jsx("circle", { cx: "12", cy: "12", r: "3" }),
    /* @__PURE__ */ u.jsx("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" })
  ] });
}
function X1() {
  return /* @__PURE__ */ u.jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ u.jsx("line", { x1: "6", y1: "12", x2: "10", y2: "12" }),
    /* @__PURE__ */ u.jsx("line", { x1: "8", y1: "10", x2: "8", y2: "14" }),
    /* @__PURE__ */ u.jsx("line", { x1: "15", y1: "13", x2: "15.01", y2: "13" }),
    /* @__PURE__ */ u.jsx("line", { x1: "18", y1: "11", x2: "18.01", y2: "11" }),
    /* @__PURE__ */ u.jsx("path", { d: "M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" })
  ] });
}
function K1() {
  return /* @__PURE__ */ u.jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ u.jsx("circle", { cx: "12", cy: "12", r: "10" }),
    /* @__PURE__ */ u.jsx("line", { x1: "12", y1: "16", x2: "12", y2: "12" }),
    /* @__PURE__ */ u.jsx("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })
  ] });
}
function Z1() {
  return /* @__PURE__ */ u.jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ u.jsx("polyline", { points: "15 18 9 12 15 6" }) });
}
function V1() {
  return /* @__PURE__ */ u.jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ u.jsx("polyline", { points: "9 18 15 12 9 6" }) });
}
function J1() {
  return /* @__PURE__ */ u.jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ u.jsx("rect", { x: "8", y: "6", width: "8", height: "14", rx: "4" }),
    /* @__PURE__ */ u.jsx("path", { d: "M6 12H2" }),
    /* @__PURE__ */ u.jsx("path", { d: "M22 12h-4" }),
    /* @__PURE__ */ u.jsx("path", { d: "M6 8l-2-2" }),
    /* @__PURE__ */ u.jsx("path", { d: "M18 8l2-2" }),
    /* @__PURE__ */ u.jsx("path", { d: "M6 18l-2 2" }),
    /* @__PURE__ */ u.jsx("path", { d: "M18 18l2 2" }),
    /* @__PURE__ */ u.jsx("path", { d: "M12 6V2" })
  ] });
}
function Y1() {
  return /* @__PURE__ */ u.jsx("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ u.jsx("path", { d: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.338c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" }) });
}
function F1({ items: s, activeId: c, onSelect: d, collapsed: r, onToggle: m }) {
  return /* @__PURE__ */ u.jsxs("div", { className: `sona-sidebar${r ? " sona-sidebar--collapsed" : ""}`, children: [
    /* @__PURE__ */ u.jsxs("div", { className: "sona-sidebar-logo", children: [
      /* @__PURE__ */ u.jsx("span", { className: "sona-sidebar-logo-icon", children: /* @__PURE__ */ u.jsx(G1, {}) }),
      !r && /* @__PURE__ */ u.jsx("span", { className: "sona-sidebar-logo-text", children: "Sona" })
    ] }),
    /* @__PURE__ */ u.jsx("nav", { className: "sona-sidebar-nav", children: s.map((h) => /* @__PURE__ */ u.jsxs(
      "button",
      {
        className: `sona-sidebar-item${c === h.id ? " sona-sidebar-item--active" : ""}`,
        onClick: () => d(h.id),
        title: r ? h.label : void 0,
        children: [
          /* @__PURE__ */ u.jsx("span", { className: "sona-sidebar-item-icon", children: h.icon }),
          !r && /* @__PURE__ */ u.jsx("span", { className: "sona-sidebar-item-label", children: h.label })
        ]
      },
      h.id
    )) }),
    /* @__PURE__ */ u.jsx("div", { className: "sona-sidebar-footer", children: /* @__PURE__ */ u.jsx("button", { className: "sona-sidebar-toggle", onClick: m, title: r ? "展开侧边栏" : "收起侧边栏", children: r ? /* @__PURE__ */ u.jsx(V1, {}) : /* @__PURE__ */ u.jsx(Z1, {}) }) })
  ] });
}
const Xg = "data:image/png;base64,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";
function W1() {
  const s = U.useRef(null);
  return U.useEffect(() => {
    const c = s.current;
    if (!c) return;
    const d = c.getContext("2d");
    if (!d) return;
    let r = 0;
    const m = [], h = () => {
      const S = c.parentElement;
      S && (c.width = S.offsetWidth, c.height = S.offsetHeight);
    }, v = () => {
      const S = c.width / 2, p = c.height / 2, z = Math.random() > 0.35, E = Math.random() * Math.PI * 2, Q = 30 + Math.random() * 20;
      m.push({
        x: S + Math.cos(E) * Q,
        y: p + Math.sin(E) * Q,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.12 + 0.05),
        size: Math.random() * 1.8 + 0.5,
        opacity: 0,
        life: 0,
        maxLife: 50 + Math.random() * 50,
        isGold: z
      });
    }, T = () => {
      d.clearRect(0, 0, c.width, c.height), m.length < 80 && v();
      for (let S = m.length - 1; S >= 0; S--) {
        const p = m[S];
        p.life++, p.x += p.vx, p.y += p.vy, p.vx += (Math.random() - 0.5) * 0.01, p.vy -= 1e-3;
        const z = p.life / p.maxLife;
        if (z < 0.2 ? p.opacity = z / 0.2 * 0.8 : z > 0.7 && (p.opacity = (1 - z) / 0.3 * 0.8), p.life >= p.maxLife) {
          m.splice(S, 1);
          continue;
        }
        p.isGold ? (d.shadowBlur = 6, d.shadowColor = `rgba(200, 170, 110, ${p.opacity})`, d.fillStyle = `rgba(220, 190, 130, ${p.opacity})`) : (d.shadowBlur = 5, d.shadowColor = `rgba(0, 180, 255, ${p.opacity * 0.8})`, d.fillStyle = `rgba(100, 200, 255, ${p.opacity * 0.85})`), d.beginPath(), d.arc(p.x, p.y, p.size, 0, Math.PI * 2), d.fill();
      }
      d.shadowBlur = 0, d.shadowColor = "transparent", r = requestAnimationFrame(T);
    };
    return h(), window.addEventListener("resize", h), r = requestAnimationFrame(T), () => {
      cancelAnimationFrame(r), window.removeEventListener("resize", h);
    };
  }, []), /* @__PURE__ */ u.jsx("canvas", { ref: s, className: "sona-home-particle-canvas" });
}
function Qh() {
  return /* @__PURE__ */ u.jsxs("div", { className: "sona-home", children: [
    /* @__PURE__ */ u.jsx("h1", { className: "sona-home-brand", children: /* @__PURE__ */ u.jsx("span", { className: "sona-home-brand-text", children: "SONA" }) }),
    /* @__PURE__ */ u.jsxs("div", { className: "sona-home-avatar-wrap", children: [
      /* @__PURE__ */ u.jsx(W1, {}),
      /* @__PURE__ */ u.jsx("div", { className: "sona-home-avatar-glow" }),
      /* @__PURE__ */ u.jsx(
        "img",
        {
          className: "sona-home-avatar",
          src: Xg,
          alt: "Sona",
          draggable: !1
        }
      )
    ] }),
    /* @__PURE__ */ u.jsxs("div", { className: "sona-home-welcome", children: [
      /* @__PURE__ */ u.jsx("h2", { className: "sona-home-heading", children: "欢迎使用 Sona" }),
      /* @__PURE__ */ u.jsx("p", { className: "sona-home-subtitle", children: "你的英雄联盟客户端增强工具" })
    ] }),
    /* @__PURE__ */ u.jsxs("p", { className: "sona-home-quote", children: [
      '"本项目完全开源免费，如果你通过收费渠道使用，那你被骗啦!"',
      /* @__PURE__ */ u.jsx("br", {}),
      " —— 神奇的WJZ_P"
    ] })
  ] });
}
function He({ title: s, description: c, children: d }) {
  return /* @__PURE__ */ u.jsxs("div", { className: "sona-setting-card", children: [
    /* @__PURE__ */ u.jsxs("div", { className: "sona-setting-card-info", children: [
      /* @__PURE__ */ u.jsx("h4", { className: "sona-setting-card-title", children: s }),
      c && /* @__PURE__ */ u.jsx("p", { className: "sona-setting-card-desc", children: c })
    ] }),
    /* @__PURE__ */ u.jsx("div", { className: "sona-setting-card-action", children: d })
  ] });
}
function Qe({ title: s, children: c }) {
  return /* @__PURE__ */ u.jsxs("div", { className: "sona-setting-group", children: [
    /* @__PURE__ */ u.jsx("h3", { className: "sona-setting-group-title", children: s }),
    /* @__PURE__ */ u.jsx("div", { className: "sona-setting-group-list", children: c })
  ] });
}
function J({ children: s, variant: c = "primary", onClick: d, disabled: r = !1, style: m }) {
  return /* @__PURE__ */ u.jsxs(
    "button",
    {
      className: `sona-btn sona-btn--${c}${r ? " sona-btn--disabled" : ""}`,
      onClick: d,
      disabled: r,
      style: m,
      type: "button",
      children: [
        /* @__PURE__ */ u.jsx("span", { className: "sona-btn-shine" }),
        s
      ]
    }
  );
}
function Nt({ value: s, onChange: c, placeholder: d, icon: r, type: m = "text", onKeyDown: h }) {
  const [v, T] = U.useState(!1);
  return /* @__PURE__ */ u.jsxs("div", { className: `sona-input${v ? " sona-input--focused" : ""}`, children: [
    r && /* @__PURE__ */ u.jsx("span", { className: "sona-input-icon", children: r }),
    /* @__PURE__ */ u.jsx(
      "input",
      {
        type: m,
        value: s,
        onChange: (S) => c(S.target.value),
        onKeyDown: h,
        placeholder: d,
        onFocus: () => T(!0),
        onBlur: () => T(!1),
        className: "sona-input-field"
      }
    )
  ] });
}
function lt({ checked: s, onChange: c, disabled: d = !1 }) {
  return /* @__PURE__ */ u.jsx(
    "button",
    {
      className: `sona-switch${s ? " sona-switch--on" : ""}${d ? " sona-switch--disabled" : ""}`,
      onClick: () => !d && c(!s),
      type: "button",
      role: "switch",
      "aria-checked": s,
      children: /* @__PURE__ */ u.jsx("span", { className: "sona-switch-thumb" })
    }
  );
}
function Wt({ options: s, value: c, onChange: d, placeholder: r = "请选择..." }) {
  const [m, h] = U.useState(!1), v = U.useRef(null), T = s.find((S) => S.value === c);
  return U.useEffect(() => {
    function S(p) {
      v.current && !v.current.contains(p.target) && h(!1);
    }
    return document.addEventListener("mousedown", S), () => document.removeEventListener("mousedown", S);
  }, []), /* @__PURE__ */ u.jsxs("div", { className: "sona-select", ref: v, children: [
    /* @__PURE__ */ u.jsxs(
      "button",
      {
        className: `sona-select-trigger${m ? " sona-select-trigger--open" : ""}`,
        onClick: () => h(!m),
        type: "button",
        children: [
          /* @__PURE__ */ u.jsx("span", { className: "sona-select-value", children: T ? T.label : r }),
          /* @__PURE__ */ u.jsx("svg", { className: `sona-select-arrow${m ? " sona-select-arrow--open" : ""}`, width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ u.jsx("polyline", { points: "6 9 12 15 18 9" }) })
        ]
      }
    ),
    m && /* @__PURE__ */ u.jsx("div", { className: "sona-select-dropdown", children: s.map((S) => /* @__PURE__ */ u.jsxs(
      "button",
      {
        className: `sona-select-option${c === S.value ? " sona-select-option--active" : ""}`,
        onClick: () => {
          d(S.value), h(!1);
        },
        type: "button",
        children: [
          /* @__PURE__ */ u.jsx("span", { children: S.label }),
          c === S.value && /* @__PURE__ */ u.jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ u.jsx("polyline", { points: "20 6 9 17 4 12" }) })
        ]
      },
      S.value
    )) })
  ] });
}
const Kg = {
  // ===== 国服 (Tencent) =====
  TENCENT_HN1: { matchHistory: "https://hn1-k8s-sgp.lol.qq.com:21019", common: "https://hn1-k8s-sgp.lol.qq.com:21019" },
  TENCENT_HN10: { matchHistory: "https://hn10-k8s-sgp.lol.qq.com:21019", common: "https://hn10-k8s-sgp.lol.qq.com:21019" },
  TENCENT_TJ100: { matchHistory: "https://tj100-sgp.lol.qq.com:21019", common: "https://tj100-sgp.lol.qq.com:21019" },
  TENCENT_TJ101: { matchHistory: "https://tj101-sgp.lol.qq.com:21019", common: "https://tj101-sgp.lol.qq.com:21019" },
  TENCENT_NJ100: { matchHistory: "https://nj100-sgp.lol.qq.com:21019", common: "https://nj100-sgp.lol.qq.com:21019" },
  TENCENT_GZ100: { matchHistory: "https://gz100-sgp.lol.qq.com:21019", common: "https://gz100-sgp.lol.qq.com:21019" },
  TENCENT_CQ100: { matchHistory: "https://cq100-sgp.lol.qq.com:21019", common: "https://cq100-sgp.lol.qq.com:21019" },
  TENCENT_BGP2: { matchHistory: "https://bgp2-k8s-sgp.lol.qq.com:21019", common: "https://bgp2-k8s-sgp.lol.qq.com:21019" },
  TENCENT_PBE: { matchHistory: "https://pbe-sgp.lol.qq.com:21019", common: "https://pbe-sgp.lol.qq.com:21019" },
  TENCENT_PREPBE: { matchHistory: "https://prepbe-sgp.lol.qq.com:21019", common: "https://prepbe-sgp.lol.qq.com:21019" },
  // ===== 外服 =====
  TW2: { matchHistory: "https://apse1-red.pp.sgp.pvp.net", common: "https://tw2-red.lol.sgp.pvp.net" },
  SG2: { matchHistory: "https://apse1-red.pp.sgp.pvp.net", common: "https://sg2-red.lol.sgp.pvp.net" },
  PH2: { matchHistory: "https://apse1-red.pp.sgp.pvp.net", common: "https://ph2-red.lol.sgp.pvp.net" },
  VN2: { matchHistory: "https://apse1-red.pp.sgp.pvp.net", common: "https://vn2-red.lol.sgp.pvp.net" },
  TH2: { matchHistory: "https://apse1-red.pp.sgp.pvp.net", common: "https://th2-red.lol.sgp.pvp.net" },
  JP1: { matchHistory: "https://apne1-red.pp.sgp.pvp.net", common: "https://jp-red.lol.sgp.pvp.net" },
  KR: { matchHistory: "https://apne1-red.pp.sgp.pvp.net", common: "https://kr-red.lol.sgp.pvp.net" },
  NA1: { matchHistory: "https://usw2-red.pp.sgp.pvp.net", common: "https://na-red.lol.sgp.pvp.net" },
  BR1: { matchHistory: "https://usw2-red.pp.sgp.pvp.net", common: "https://br-red.lol.sgp.pvp.net" },
  LA1: { matchHistory: "https://usw2-red.pp.sgp.pvp.net", common: "https://lan-red.lol.sgp.pvp.net" },
  LA2: { matchHistory: "https://usw2-red.pp.sgp.pvp.net", common: "https://las-red.lol.sgp.pvp.net" },
  OC1: { matchHistory: "https://apse1-red.pp.sgp.pvp.net", common: "https://oce-red.lol.sgp.pvp.net" },
  EUW: { matchHistory: "https://euc1-red.pp.sgp.pvp.net", common: "https://euw-red.lol.sgp.pvp.net" },
  TR1: { matchHistory: "https://euc1-red.pp.sgp.pvp.net", common: "https://tr-red.lol.sgp.pvp.net" },
  RU: { matchHistory: "https://euc1-red.pp.sgp.pvp.net", common: "https://ru-red.lol.sgp.pvp.net" },
  PBE: { matchHistory: "https://usw2-red.pp.sgp.pvp.net", common: "https://pbe-red.lol.sgp.pvp.net" }
};
function as(s) {
  return s > 0 ? `q_${s}` : "";
}
const P1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  SGP_SERVERS: Kg,
  queueIdToTag: as
}, Symbol.toStringTag, { value: "Module" }));
var vt = /* @__PURE__ */ ((s) => (s.READY_CHECK = "/lol-matchmaking/v1/ready-check", s.GAMEFLOW_PHASE = "/lol-gameflow/v1/session", s.CHAMP_SELECT = "/lol-champ-select/v1/session", s.TFT_BATTLE_PASS = "/lol-tft-pass/v1/battle-pass", s.GAMEFLOW_PHASE_CHANGE = "/lol-gameflow/v1/gameflow-phase", s.LOBBY = "/lol-lobby/v2/lobby", s.CHAT_ME = "/lol-chat/v1/me", s))(vt || {});
async function Zn(s, c = {}) {
  const d = s.startsWith("/") ? s : `/${s}`, r = await fetch(d, {
    ...c,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...c.headers
    }
  });
  if (!r.ok)
    throw new Error(`[LCU] 请求失败: ${c.method ?? "GET"} ${d} → ${r.status} ${r.statusText}`);
  const m = await r.text();
  return m ? JSON.parse(m) : void 0;
}
function Ae(s) {
  return Zn(s, { method: "GET" });
}
function gt(s, c) {
  return Zn(s, {
    method: "POST",
    body: c != null ? JSON.stringify(c) : void 0
  });
}
function rr(s, c) {
  return Zn(s, {
    method: "PUT",
    body: c != null ? JSON.stringify(c) : void 0
  });
}
function On(s, c) {
  return Zn(s, {
    method: "PATCH",
    body: c != null ? JSON.stringify(c) : void 0
  });
}
function dr(s) {
  return Zn(s, { method: "DELETE" });
}
class _1 {
  constructor() {
    Ve(this, "eventListeners", /* @__PURE__ */ new Map());
    /** 当前 socket 上已经实际调用过 observe 的 URI 集合 */
    Ve(this, "observedUris", /* @__PURE__ */ new Set());
    Ve(this, "penguContext", null);
    // -------------------- SGP Token 缓存 --------------------
    /**
     * Entitlements Token 缓存
     *
     * 通过 WS 事件 `/entitlements/v1/token` 自动保活：
     * LCU 会在 token 即将过期时主动推送新 token，无需自己算过期时间。
     * 初始值通过主动拉取填充，后续由 WS 事件驱动更新。
     */
    Ve(this, "_entitlementsToken", null);
    /**
     * League Session Token 缓存
     *
     * 通过 WS 事件 `/lol-league-session/v1/league-session-token` 自动保活。
     */
    Ve(this, "_leagueSessionToken", null);
    // -------------------- 底层请求 (公开) --------------------
    /** 通用 REST 请求 */
    Ve(this, "request", Zn);
    Ve(this, "get", Ae);
    Ve(this, "post", gt);
    Ve(this, "put", rr);
    Ve(this, "patch", On);
    Ve(this, "delete", dr);
  }
  /** SGP Token 是否已就绪（两个 token 都已拿到） */
  get isSgpTokenReady() {
    return this._entitlementsToken !== null && this._leagueSessionToken !== null;
  }
  /** 获取缓存的 Entitlements Token（不会发起网络请求） */
  get cachedEntitlementsToken() {
    return this._entitlementsToken;
  }
  /** 获取缓存的 League Session Token（不会发起网络请求） */
  get cachedLeagueSessionToken() {
    return this._leagueSessionToken;
  }
  // -------------------- 初始化 --------------------
  /**
   * 绑定 PenguContext，用于 WebSocket 事件监听
   * 应在 init(context) 生命周期中调用
   */
  bindContext(c) {
    this.penguContext = c;
    const d = Array.from(this.eventListeners.keys());
    this.observedUris.clear(), console.log("[LCUManager] bindContext() → replay %d observed uri(s)", d.length), d.forEach((r) => this.observeUriOnSocket(r)), this._initSgpTokenKeepAlive();
  }
  /**
   * SGP Token 保活机制
   *
   * 参考 LeagueAkari 的 _maintainEntitlementsToken / _maintainLeagueSessionToken 实现。
   *
   * 策略：
   * 1. 启动时主动拉取一次 token 填充缓存
   * 2. 监听 LCU WebSocket 事件，token 变化时自动更新缓存
   *    - `/entitlements/v1/token` → Entitlements Token
   *    - `/lol-league-session/v1/league-session-token` → League Session Token
   * 3. LCU 会在 token 即将过期时主动推送新 token，无需自己算过期时间
   */
  _initSgpTokenKeepAlive() {
    this._fetchInitialTokens(), this.observe("/entitlements/v1/token", (c) => {
      const d = c.data;
      d ? (this._entitlementsToken = d, console.log("[LCUManager] Entitlements Token 已通过 WS 事件更新")) : (this._entitlementsToken = null, console.log("[LCUManager] Entitlements Token 已清空（WS 事件）"));
    }), this.observe("/lol-league-session/v1/league-session-token", (c) => {
      const d = c.data;
      d ? (this._leagueSessionToken = d, console.log("[LCUManager] League Session Token 已通过 WS 事件更新")) : (this._leagueSessionToken = null, console.log("[LCUManager] League Session Token 已清空（WS 事件）"));
    });
  }
  /** 主动拉取初始 token 填充缓存 */
  async _fetchInitialTokens() {
    try {
      const [c, d] = await Promise.all([
        this.getEntitlementsToken().catch((r) => (console.warn("[LCUManager] 初始拉取 Entitlements Token 失败:", r), null)),
        this.getLeagueSessionToken().catch((r) => (console.warn("[LCUManager] 初始拉取 League Session Token 失败:", r), null))
      ]);
      c && (this._entitlementsToken = c, console.log("[LCUManager] 初始 Entitlements Token 已获取")), d && (this._leagueSessionToken = d, console.log("[LCUManager] 初始 League Session Token 已获取"));
    } catch (c) {
      console.warn("[LCUManager] 初始拉取 SGP Token 异常:", c);
    }
  }
  // ==================== 召唤师 ====================
  /** 获取当前登录的召唤师信息 */
  getSummonerInfo() {
    return Ae("/lol-summoner/v1/current-summoner");
  }
  /** 通过 summoner ID 获取召唤师信息 */
  getSummonerById(c) {
    return Ae(`/lol-summoner/v1/summoners/${c}`);
  }
  /** 通过 puuid 获取召唤师信息 */
  getSummonerByPuuid(c) {
    return Ae(`/lol-summoner/v2/summoners/puuid/${c}`);
  }
  /** 通过 gameName + tagLine (Riot ID) 获取召唤师信息 */
  getSummonerByRiotId(c, d) {
    return Ae(`/lol-summoner/v1/alias/lookup?gameName=${encodeURIComponent(c)}&tagLine=${encodeURIComponent(d)}`);
  }
  /** 获取当前玩家的排位数据 */
  getCurrentRankedStats() {
    return Ae("/lol-ranked/v1/current-ranked-stats");
  }
  /** 通过 puuid 获取排位数据 */
  getRankedStats(c) {
    return Ae(`/lol-ranked/v1/ranked-stats/${c}`);
  }
  // ==================== 房间/大厅 ====================
  /** 获取当前房间信息 */
  getLobby() {
    return Ae("/lol-lobby/v2/lobby");
  }
  /** 通过队列 ID 创建房间 */
  createLobby(c) {
    return gt("/lol-lobby/v2/lobby", { queueId: c });
  }
  /** 通过自定义配置创建房间 */
  createCustomLobby(c) {
    return gt("/lol-lobby/v2/lobby", c);
  }
  /** 退出当前房间 */
  leaveLobby() {
    return dr("/lol-lobby/v2/lobby");
  }
  /**
   * 秒退英雄选择阶段（dodge ChampSelect）
   *
   * 走客户端自己的 TeamBuilder 底层退房接口——这是从自定义房间抓包得到的
   * 真正被客户端调用的端点，比 LCDS 代理（`/lol-login/v1/session/invoke`）更干净：
   *   - 无需 URL encode args / 构造 LCDS 调用签名
   *   - 无需 body（纯 POST）
   *   - 路径本身就清晰表达了语义
   *
   * 注：这会吃逃跑惩罚（降低排位或禁止匹配一段时间），由调用方自行确认场景。
   */
  dodgeChampSelect() {
    return gt("/lol-lobby-team-builder/champ-select/v1/session/quit");
  }
  // ==================== 匹配 ====================
  /** 开始匹配 */
  startMatchmaking() {
    return gt("/lol-lobby/v2/lobby/matchmaking/search");
  }
  /** 停止匹配 */
  stopMatchmaking() {
    return dr("/lol-lobby/v2/lobby/matchmaking/search");
  }
  /** 获取当前匹配搜索状态 */
  async getMatchSearchState() {
    return (await Ae("/lol-lobby/v2/lobby/matchmaking/search-state")).searchState;
  }
  /** 接受对局 (Ready Check) */
  acceptMatch() {
    return gt("/lol-matchmaking/v1/ready-check/accept");
  }
  /** 拒绝对局 (Ready Check) */
  declineMatch() {
    return gt("/lol-matchmaking/v1/ready-check/decline");
  }
  /** 获取 Ready Check 状态 */
  getReadyCheck() {
    return Ae("/lol-matchmaking/v1/ready-check");
  }
  // ==================== 游戏流程 ====================
  /** 获取当前游戏流程阶段 */
  getGameflowPhase() {
    return Ae("/lol-gameflow/v1/gameflow-phase");
  }
  /** 获取游戏流程会话详情 */
  getGameflowSession() {
    return Ae("/lol-gameflow/v1/session");
  }
  /** 提前退出游戏（关闭游戏窗口） */
  earlyExitGame() {
    return gt("/lol-gameflow/v1/early-exit");
  }
  /** 投降 */
  surrender() {
    return gt("/lol-gameflow/v1/surrender");
  }
  /** 再来一局（对局结束后返回房间并自动排队） */
  playAgain() {
    return gt("/lol-lobby/v2/play-again");
  }
  // ==================== 英雄选择 ====================
  /** 获取英雄选择会话 */
  getChampSelectSession() {
    return Ae("/lol-champ-select/v1/session");
  }
  /** 获取当前可选的英雄 ID 列表 */
  getPickableChampionIds() {
    return Ae("/lol-champ-select/v1/pickable-champion-ids");
  }
  /** 获取当前可禁用的英雄 ID 列表 */
  getBannableChampionIds() {
    return Ae("/lol-champ-select/v1/bannable-champion-ids");
  }
  /**
   * 锁定英雄（完成选人/禁人动作）
   *
   * 流程：从当前 session 中找到属于自己的、正在进行中的 action，
   * 先 PATCH 设置英雄，再 POST complete 锁定。
   *
   * @param championId 要锁定的英雄 ID
   * @param actionId 可选，直接指定 action ID（不传则自动查找当前正在进行的 action）
   */
  async lockChampion(c, d) {
    let r = d;
    if (r == null) {
      const m = await this.getChampSelectSession(), h = m.actions.flat(2).find((v) => v.actorCellId === m.localPlayerCellId && v.isInProgress && !v.completed);
      if (!h)
        throw new Error("[LCU] 找不到当前正在进行的选人/禁人动作");
      r = h.id;
    }
    await On(`/lol-champ-select/v1/session/actions/${r}`, { championId: c }), await gt(`/lol-champ-select/v1/session/actions/${r}/complete`);
  }
  /**
   * 仅选择英雄（不锁定）
   * 只执行 PATCH 设置英雄，不执行 complete 锁定
   */
  async pickChampion(c, d) {
    let r = d;
    if (r == null) {
      const m = await this.getChampSelectSession(), h = m.actions.flat(2).find((v) => v.actorCellId === m.localPlayerCellId && v.isInProgress && !v.completed);
      if (!h)
        throw new Error("[LCU] 找不到当前正在进行的选人动作");
      r = h.id;
    }
    await On(`/lol-champ-select/v1/session/actions/${r}`, { championId: c });
  }
  /**
   * 修改自己的选人信息（皮肤、召唤师技能等）
   * @param selection 选择参数
   */
  updateMySelection(c) {
    return On("/lol-champ-select/v1/session/my-selection", c);
  }
  /**
   * ARAM 重随英雄
   * 消耗重随点数，随机获得一个新英雄
   */
  reroll() {
    return gt("/lol-champ-select/v1/session/my-selection/reroll");
  }
  /**
   * 从 ARAM 共享池（Bench）中拿取英雄
   * 将自己当前的英雄放回池子，换取池中指定的英雄
   * @param championId 要从池中拿取的英雄 ID
   */
  benchSwap(c) {
    return gt(`/lol-champ-select/v1/session/bench/swap/${c}`);
  }
  /**
   * 获取当前 ARAM 共享池中的英雄列表
   * 从 session 的 benchChampions 字段提取
   */
  async getBenchChampions() {
    return (await this.getChampSelectSession()).benchChampions;
  }
  /**
   * 获取本局选人阶段所有玩家的详细信息
   * 包含召唤师信息、排位数据、近期战绩
   * @returns 我方和敌方玩家信息数组
   */
  async getChampSelectPlayers() {
    const c = await this.getChampSelectSession(), d = async (h) => {
      try {
        const v = await this.getSummonerById(h.summonerId), [T, S] = await Promise.all([
          this.getRankedStats(v.puuid).catch(() => null),
          this.getMatchHistory(v.puuid, 0, 19).catch(() => null)
        ]);
        return {
          summonerId: h.summonerId,
          championId: h.championId,
          assignedPosition: h.assignedPosition,
          gameName: v.gameName,
          tagLine: v.tagLine,
          summonerLevel: v.summonerLevel,
          puuid: v.puuid,
          profileIconId: v.profileIconId,
          ranked: T,
          recentMatches: S
        };
      } catch {
        return {
          summonerId: h.summonerId,
          championId: h.championId,
          assignedPosition: h.assignedPosition,
          gameName: "Unknown",
          tagLine: "",
          summonerLevel: 0,
          puuid: "",
          profileIconId: 0,
          ranked: null,
          recentMatches: null
        };
      }
    }, [r, m] = await Promise.all([
      Promise.all(c.myTeam.map(d)),
      Promise.all(c.theirTeam.map(d))
    ]);
    return { myTeam: r, theirTeam: m };
  }
  // ==================== 聊天 ====================
  /** 获取当前用户的聊天状态信息 */
  getChatMe() {
    return Ae("/lol-chat/v1/me");
  }
  /**
   * 更改玩家在线状态
   * @param availability 在线状态: 'chat'(在线) | 'away'(离开) | 'dnd'(勿扰) | 'offline'(隐身) | 'mobile'(手机在线)
   * @param statusMessage 可选，自定义签名
   */
  setAvailability(c, d) {
    const r = { availability: c };
    return d != null && (r.statusMessage = d), rr("/lol-chat/v1/me", r);
  }
  /** 设置自定义签名 */
  setStatusMessage(c) {
    return rr("/lol-chat/v1/me", { statusMessage: c });
  }
  /** 获取聊天对话列表 */
  getChatConversations() {
    return Ae("/lol-chat/v1/conversations");
  }
  /** 获取指定会话的消息记录 */
  getChatMessages(c) {
    return Ae(`/lol-chat/v1/conversations/${c}/messages`);
  }
  /**
   * 向指定会话发送消息
   *
   * 注意：LCU API 单条消息最大长度为 2696 个字符（含空格），超出会被截断或拒绝。
   * 该限制为 API 层限制，客户端前端 UI 的 200 字限制仅为前端校验。
   *
   * @param conversationId 会话 ID
   * @param message 消息内容（字符串或完整请求体）
   */
  sendChatMessage(c, d) {
    const r = typeof d == "string" ? { body: d, type: "chat" } : d;
    return gt(`/lol-chat/v1/conversations/${c}/messages`, r);
  }
  /**
   * 获取当前英雄选择阶段的聊天会话
   * 从所有会话中找到 type 为 'championSelect' 的会话
   * @returns 英雄选择聊天会话，如果不在选人阶段则返回 null
   */
  async getChampSelectConversation() {
    return (await this.getChatConversations()).find((d) => d.type === "championSelect") ?? null;
  }
  /**
   * 在英雄选择界面发送消息（一步到位）
   * 自动找到选人聊天会话并发送消息
   * @param message 消息内容
   * @param type 消息类型: 'chat'(所有人可见)、'celebration'(仅自己可见/黄色)、'system'(仅自己可见/系统样式)
   * @throws 如果当前不在选人阶段（找不到 championSelect 会话）
   */
  async sendChampSelectMessage(c, d) {
    const r = await this.getChampSelectConversation();
    if (!r)
      throw new Error("[LCU] 当前不在英雄选择阶段，找不到 championSelect 会话");
    return this.sendChatMessage(r.id, { body: c, type: d ?? "chat" });
  }
  // ==================== 队列信息 ====================
  /** 获取所有可用队列（含中文名、游戏模式、地图等） */
  getQueues() {
    return Ae("/lol-game-queues/v1/queues");
  }
  /** 获取当前游戏模式信息 */
  getCurrentGamemode() {
    return Ae("/lol-lobby/v1/parties/gamemode");
  }
  /** 获取所有游戏模式 */
  getGameModes() {
    return Ae("/lol-game-queues/v1/game-type-config");
  }
  /** 获取所有地图信息 */
  getMaps() {
    return Ae("/lol-maps/v1/maps");
  }
  /** 获取地图资源数据（含地图皮肤/突变模式本地化名称） */
  getMapAssets() {
    return Ae("/lol-game-data/assets/v1/maps.json");
  }
  // ==================== 战绩 ====================
  /**
   * 获取战绩列表
   * @param puuid 不传则查当前玩家，传入则查指定玩家
   * @param begIndex 起始索引，默认 0
   * @param endIndex 结束索引，默认 19（共 20 条）
   */
  getMatchHistory(c, d = 0, r = 19) {
    const m = c ? `/lol-match-history/v1/products/lol/${c}/matches` : "/lol-match-history/v1/products/lol/current-summoner/matches";
    return Ae(`${m}?begIndex=${d}&endIndex=${r}`);
  }
  /**
   * 获取单局对局详情
   * @param gameId 对局 ID
   */
  getMatchDetail(c) {
    return Ae(`/lol-match-history/v1/games/${c}`);
  }
  /**
   * 获取单局时间线数据
   * @param gameId 对局 ID
   */
  getMatchTimeline(c) {
    return Ae(`/lol-match-history/v1/game-timelines/${c}`);
  }
  /** 获取最近一起玩过的召唤师 */
  getRecentlyPlayedSummoners() {
    return Ae("/lol-match-history/v1/recently-played-summoners");
  }
  // ==================== SGP Token ====================
  /**
   * 获取 Entitlements Token（SGP 战绩查询所需）
   *
   * 返回值说明：
   * - `accessToken`: JWT，用于 `Authorization: Bearer {accessToken}` 请求 SGP 战绩/对局详情接口
   * - `token`: Entitlements JWT（格式不同，部分 SGP 接口可能需要）
   * - `issuer`: 签发者 URL，如 `http://hn1-k8s-bcs-internal.lol.qq.com:28088`
   *   可从中解析当前区服（hn1 = 艾欧尼亚、hn10 = 黑色玫瑰 等）
   * - `subject`: 玩家 PUUID
   * - `entitlements`: 权限列表（通常为空数组）
   *
   * Akari 通过 WS 事件 `/entitlements/v1/token` 自动刷新，我们这里按需拉取。
   */
  getEntitlementsToken() {
    return Ae("/entitlements/v1/token");
  }
  /**
   * 获取 League Session Token（SGP 通用查询所需）
   *
   * 返回纯 JWT 字符串，用于 `Authorization: Bearer {token}` 请求 SGP 通用接口（召唤师/排位等）。
   */
  getLeagueSessionToken() {
    return Ae("/lol-league-session/v1/league-session-token");
  }
  /**
   * 从 Entitlements Token 的 issuer 推断当前 SGP 服务器 ID
   *
   * 优先使用缓存的 token，避免每次都发请求。
   * 国服 issuer 格式：`http://hn1-k8s-bcs-internal.lol.qq.com:28088`
   *   → 提取 `hn1` → 映射为 `TENCENT_HN1`
   *
   * 外服 issuer 格式：`https://euw1-red.lol.sgp.pvp.net`
   *   → 提取 `euw1` → 映射为 `EUW`
   *
   * 如果解析失败返回空字符串
   */
  async getSgpServerId() {
    const d = (this._entitlementsToken ?? await this.getEntitlementsToken()).issuer ?? "", r = d.match(/https?:\/\/([a-z0-9]+)-k8s-bcs-internal\.lol\.qq\.com/);
    if (r)
      return `TENCENT_${r[1].toUpperCase()}`;
    const m = d.match(/https?:\/\/([a-z0-9]+)-/);
    return m ? m[1].toUpperCase() : "";
  }
  /**
   * 通过 SGP 查询战绩列表
   *
   * 相比 LCU 接口的优势：
   * - 支持 `tag` 参数按队列模式过滤（如 `q_450` 只查大乱斗）
   * - 无浏览器缓存问题
   * - 国服跨区查询
   * - 突破 LCU 100 场上限
   *
   * @param puuid 玩家 PUUID
   * @param options 查询参数
   * @param options.startIndex 起始索引（默认 0，注意：SGP 用 startIndex 而非 LCU 的 begIndex）
   * @param options.count 获取数量（默认 100，注意：SGP 用 count 而非 LCU 的 endIndex）
   * @param options.tag 按队列模式过滤，如 `q_450`（大乱斗），不传则查全部模式。使用 `queueIdToTag()` 生成。
   */
  async getSgpMatchHistory(c, d) {
    const r = this._entitlementsToken ?? await this.getEntitlementsToken(), m = await this.getSgpServerId(), { SGP_SERVERS: h } = await Promise.resolve().then(() => P1), v = h[m.toUpperCase()];
    if (!(v != null && v.matchHistory))
      throw new Error(`[SGP] 找不到服务器配置: ${m}`);
    const T = new URLSearchParams();
    T.set("startIndex", String((d == null ? void 0 : d.startIndex) ?? 0)), T.set("count", String((d == null ? void 0 : d.count) ?? 100)), d != null && d.tag && T.set("tag", d.tag);
    const S = `${v.matchHistory}/match-history-query/v1/products/lol/player/${c}/SUMMARY?${T}`, p = await fetch(S, {
      headers: {
        Authorization: `Bearer ${r.accessToken}`,
        "User-Agent": "LeagueOfLegendsClient"
      }
    });
    if (!p.ok) {
      const z = await p.text().catch(() => "");
      throw new Error(`[SGP] 请求失败: ${p.status} ${p.statusText} ${z}`);
    }
    return p.json();
  }
  // ==================== 好友 ====================
  /**
   * 获取好友列表
   * 包含每个好友的在线状态、游戏状态、gameId 等
   */
  getFriends() {
    return Ae("/lol-chat/v1/friends");
  }
  // ==================== 游戏资源 ====================
  /** 获取当前客户端的游戏版本号（如 "14.7.580.1234"） */
  getGameVersion() {
    return Ae("/lol-patch/v1/game-version");
  }
  /** 获取所有物品数据（含 iconPath） */
  getItems() {
    return Ae("/lol-game-data/assets/v1/items.json");
  }
  /** 获取所有召唤师技能数据（含 iconPath） */
  getSummonerSpells() {
    return Ae("/lol-game-data/assets/v1/summoner-spells.json");
  }
  /** 获取所有英雄摘要数据（含 squarePortraitPath） */
  getChampionSummary() {
    return Ae("/lol-game-data/assets/v1/champion-summary.json");
  }
  /** 获取所有符文数据（含 iconPath，对应单个符文 ID） */
  getPerks() {
    return Ae("/lol-game-data/assets/v1/perks.json");
  }
  /** 获取所有符文系样式（对应 perkPrimaryStyle / perkSubStyle） */
  getPerkStyles() {
    return Ae("/lol-game-data/assets/v1/perkstyles.json");
  }
  // ==================== 通知 ====================
  /**
   * 发送客户端原生通知（右下角弹窗）
   * @param title 通知标题
   * @param details 通知内容
   */
  sendNotification(c, d) {
    return gt("/player-notifications/v1/notifications", {
      detailKey: "pre_translated_details",
      titleKey: "pre_translated_title",
      backgroundUrl: "",
      data: { title: c, details: d },
      iconUrl: "/lol-game-data/assets/v1/profile-icons/3867.jpg",
      // https://heimerdinger.lol/index.php/icon/sona-champie-icon-5s8jq
      source: "sona",
      state: "toast",
      type: "string"
    });
  }
  // ==================== 客户端设置备份/恢复 ====================
  async getPuuid() {
    const c = await Ae("/lol-login/v1/session");
    if (!c.puuid) throw new Error("未获取到 PUUID");
    return c.puuid;
  }
  loadAllBackups(c) {
    const d = localStorage.getItem(`sona_backups_${c}`);
    if (!d) return {};
    try {
      return JSON.parse(d);
    } catch {
      return {};
    }
  }
  saveAllBackups(c, d) {
    localStorage.setItem(`sona_backups_${c}`, JSON.stringify(d));
  }
  /** 获取常规游戏设置（画质、声音、HUD 等，对应 game.cfg） */
  getGameSettings() {
    return Ae("/lol-game-settings/v1/game-settings");
  }
  /** 获取热键设置（对应 PersistedSettings.json 的热键部分） */
  getInputSettings() {
    return Ae("/lol-game-settings/v1/input-settings");
  }
  /**
   * 创建命名备份（同时拉取常规设置 + 热键设置）
   * @param name 用户自定义的备份名称
   */
  async backupSettings(c) {
    try {
      const d = await this.getPuuid(), [r, m] = await Promise.all([
        this.getGameSettings(),
        this.getInputSettings()
      ]), h = this.loadAllBackups(d);
      return h[c] = { general: r, input: m, timestamp: Date.now() }, this.saveAllBackups(d, h), !0;
    } catch {
      return !1;
    }
  }
  /**
   * 恢复指定名称的备份并写入磁盘
   * @param name 备份名称
   */
  async restoreSettings(c) {
    try {
      const d = await this.getPuuid(), m = this.loadAllBackups(d)[c];
      if (!m) throw new Error(`备份 "${c}" 不存在`);
      return m.general && await On("/lol-game-settings/v1/game-settings", m.general), m.input && await On("/lol-game-settings/v1/input-settings", m.input), await gt("/lol-game-settings/v1/save"), !0;
    } catch {
      return !1;
    }
  }
  /**
   * 删除指定名称的备份
   * @param name 备份名称
   */
  async deleteBackup(c) {
    try {
      const d = await this.getPuuid(), r = this.loadAllBackups(d);
      return c in r ? (delete r[c], this.saveAllBackups(d, r), !0) : !1;
    } catch {
      return !1;
    }
  }
  /**
   * 获取所有备份列表（按时间倒序）
   */
  async listBackups() {
    try {
      const c = await this.getPuuid(), d = this.loadAllBackups(c);
      return Object.entries(d).map(([r, m]) => ({ name: r, timestamp: m.timestamp ?? 0 })).sort((r, m) => m.timestamp - r.timestamp);
    } catch {
      return [];
    }
  }
  // ==================== WebSocket 事件 ====================
  observeUriOnSocket(c) {
    if (!this.penguContext) {
      console.warn("[LCUManager] PenguContext 未绑定，无法监听事件。请先调用 lcu.bindContext(context)");
      return;
    }
    if (this.observedUris.has(c)) {
      console.log("[LCUManager] URI 已订阅到底层 socket，跳过重复 observe: %s", c);
      return;
    }
    this.observedUris.add(c), console.log("[LCUManager] 向当前 socket 订阅 URI: %s", c), this.penguContext.socket.observe(c, (d) => {
      console.log("[LCUManager] WS 收到事件 → uri=%s, data=%o", c, d);
      const r = d, m = this.eventListeners.get(c);
      m == null || m.forEach((h) => h(r));
    });
  }
  /**
   * 监听 LCU WebSocket 事件
   *
   * 基于 Pengu Loader 的 context.socket.observe 实现。
   * 支持同一 URI 注册多个回调。
   *
   * @param uri 事件 URI (e.g. '/lol-gameflow/v1/gameflow-phase')
   * @param callback 事件回调
   * @returns 取消监听的函数
   *
   * @example
   * ```ts
   * const unsubscribe = lcu.observe('/lol-gameflow/v1/gameflow-phase', (event) => {
   *   console.log('Phase changed:', event.data)
   * })
   *
   * // 稍后取消监听
   * unsubscribe()
   * ```
   */
  observe(c, d) {
    var m;
    console.log("[LCUManager] observe() called → uri=%s, hasContext=%s", c, String(!!this.penguContext)), console.log("[LCUManager] eventListeners has uri? %s, listeners count: %d", this.eventListeners.has(c), ((m = this.eventListeners.get(c)) == null ? void 0 : m.size) ?? 0);
    let r = this.eventListeners.get(c);
    return r || (r = /* @__PURE__ */ new Set(), this.eventListeners.set(c, r)), r.add(d), this.observeUriOnSocket(c), () => {
      const h = this.eventListeners.get(c);
      h == null || h.delete(d), h && h.size === 0 && this.eventListeners.delete(c);
    };
  }
  /**
   * 断开所有 WebSocket 事件监听
   * 应在插件卸载时调用
   */
  disconnect() {
    this.penguContext && this.penguContext.socket.disconnect(), this.eventListeners.clear(), this.observedUris.clear();
  }
}
const B = new _1(), $1 = { source: "fandom-wiki", sourceUrl: "https://leagueoflegends.fandom.com/wiki/Module:ChampionData/data", updatedAt: "2026-04-22T10:32:03.933Z", sha1: "461fcb859341e84929aa0bd4d922e957bc01277b", championCount: 172 }, ey = /* @__PURE__ */ JSON.parse('{"1":{"id":1,"alias":"Annie","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.05,"shielding":0.9},"urf":{"dmg_dealt":0.9,"dmg_taken":1.05}}},"2":{"id":2,"alias":"Olaf","stats":{"aram":{"dmg_dealt":1.05}}},"3":{"id":3,"alias":"Galio","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.05}}},"4":{"id":4,"alias":"TwistedFate","stats":{"urf":{"dmg_dealt":0.95}}},"5":{"id":5,"alias":"XinZhao","stats":{"aram":{"dmg_dealt":0.95},"urf":{"dmg_taken":1.1},"ofa":{"dmg_dealt":0.97,"dmg_taken":1.02,"healing":1.2},"usb":{"dmg_dealt":0.95,"dmg_taken":1.05}}},"6":{"id":6,"alias":"Urgot","stats":{"aram":{"dmg_taken":1.05},"urf":{"dmg_dealt":1.15,"dmg_taken":0.85},"ofa":{"dmg_dealt":0.95,"dmg_taken":1.02}}},"7":{"id":7,"alias":"Leblanc","stats":{"aram":{"dmg_dealt":1.1,"dmg_taken":0.9,"ability_haste":20},"ofa":{"dmg_taken":0.95},"nb":{"dmg_taken":0.9,"ability_haste":20}}},"8":{"id":8,"alias":"Vladimir","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.05,"healing":0.9},"urf":{"dmg_dealt":0.92,"dmg_taken":1.05,"healing":1.2}}},"9":{"id":9,"alias":"Fiddlesticks","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.05},"urf":{"dmg_dealt":1.1,"dmg_taken":0.85},"ofa":{"dmg_dealt":1.05,"dmg_taken":0.93,"healing":1.2},"usb":{"dmg_dealt":1.05,"dmg_taken":0.95}}},"10":{"id":10,"alias":"Kayle","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.1},"urf":{"dmg_dealt":0.95,"dmg_taken":1.1},"ofa":{"dmg_dealt":0.95,"dmg_taken":1.05},"nb":{"dmg_dealt":0.9,"dmg_taken":1.05}}},"11":{"id":11,"alias":"MasterYi","stats":{"aram":{"dmg_taken":0.97},"urf":{"dmg_dealt":0.9,"healing":0.8},"usb":{"dmg_taken":1.05}}},"12":{"id":12,"alias":"Alistar","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.05,"healing":0.8},"urf":{"dmg_taken":0.95},"ofa":{"dmg_dealt":1.05,"dmg_taken":0.97},"usb":{"dmg_dealt":0.95}}},"13":{"id":13,"alias":"Ryze","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.95},"ofa":{"dmg_dealt":1.03}}},"14":{"id":14,"alias":"Sion","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.1,"ability_haste":-10},"urf":{"dmg_dealt":1.1,"dmg_taken":0.92,"shielding":1.2},"nb":{"dmg_taken":1.05}}},"15":{"id":15,"alias":"Sivir","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.05},"urf":{"dmg_dealt":0.9},"nb":{"dmg_dealt":0.95,"dmg_taken":1.05}}},"16":{"id":16,"alias":"Soraka","stats":{"aram":{"dmg_taken":0.97},"urf":{"dmg_dealt":1.05,"dmg_taken":0.92},"ofa":{"dmg_dealt":1.03,"dmg_taken":0.97,"healing":1.1}}},"17":{"id":17,"alias":"Teemo","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.1,"ability_haste":-20},"urf":{"dmg_dealt":0.95},"nb":{"dmg_dealt":0.9,"dmg_taken":1.05}}},"18":{"id":18,"alias":"Tristana","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.95}}},"19":{"id":19,"alias":"Warwick","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.95,"healing":1.05},"usb":{"dmg_dealt":0.95}}},"20":{"id":20,"alias":"Nunu","stats":{"aram":{"dmg_dealt":1.1,"dmg_taken":0.9,"healing":1.1,"shielding":1.2,"tenacity":1.2},"urf":{"dmg_dealt":1.08,"dmg_taken":0.95},"ofa":{"dmg_dealt":1.05,"dmg_taken":0.92,"healing":1.05,"shielding":1.2},"nb":{"dmg_dealt":1.1,"dmg_taken":0.9,"ability_haste":20},"usb":{"dmg_dealt":1.05,"dmg_taken":0.95,"healing":1.2}}},"21":{"id":21,"alias":"MissFortune","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.1},"usb":{"dmg_dealt":1.05,"dmg_taken":0.95}}},"22":{"id":22,"alias":"Ashe","stats":{"aram":{"dmg_dealt":1.05,"attack_speed":1.03},"usb":{"dmg_taken":0.95}}},"23":{"id":23,"alias":"Tryndamere","stats":{"aram":{"dmg_dealt":1.1,"dmg_taken":0.9,"healing":1.35}}},"24":{"id":24,"alias":"Jax","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.97},"urf":{"dmg_dealt":0.9,"dmg_taken":1.15},"ofa":{"dmg_dealt":0.95,"dmg_taken":1.05},"usb":{"dmg_dealt":0.95,"dmg_taken":1.05}}},"25":{"id":25,"alias":"Morgana","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.1},"urf":{"dmg_dealt":0.9,"dmg_taken":1.05},"nb":{"dmg_dealt":0.95}}},"26":{"id":26,"alias":"Zilean","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.95,"ability_haste":10},"urf":{"dmg_dealt":1.05,"dmg_taken":0.9},"ofa":{"dmg_dealt":1.05,"dmg_taken":0.95}}},"27":{"id":27,"alias":"Singed","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.05},"urf":{"dmg_dealt":0.9},"nb":{"dmg_dealt":0.95},"usb":{"dmg_taken":1.05}}},"28":{"id":28,"alias":"Evelynn","stats":{"aram":{"dmg_dealt":1.1,"dmg_taken":0.9,"tenacity":1.2},"urf":{"dmg_dealt":1.05,"dmg_taken":0.95},"ofa":{"dmg_dealt":1.07,"dmg_taken":0.93},"nb":{"dmg_taken":0.9,"ability_haste":20},"usb":{"dmg_dealt":1.1}}},"29":{"id":29,"alias":"Twitch","stats":{"aram":{"dmg_taken":0.95},"urf":{"dmg_dealt":0.92,"dmg_taken":1.05},"ofa":{"dmg_dealt":0.98}}},"30":{"id":30,"alias":"Karthus","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.05},"urf":{"dmg_dealt":0.9}}},"31":{"id":31,"alias":"Chogath","stats":{"aram":{"dmg_taken":1.1},"ofa":{"dmg_dealt":0.98,"dmg_taken":1.05}}},"32":{"id":32,"alias":"Amumu","stats":{"urf":{"dmg_dealt":1.1,"dmg_taken":0.9},"ofa":{"dmg_taken":1.05}}},"33":{"id":33,"alias":"Rammus","stats":{"urf":{"dmg_dealt":1.1,"dmg_taken":0.85},"ofa":{"dmg_dealt":1.05},"usb":{"dmg_dealt":1.05,"dmg_taken":0.95}}},"34":{"id":34,"alias":"Anivia","stats":{"aram":{"dmg_dealt":1.05},"urf":{"dmg_dealt":1.15,"dmg_taken":0.92},"usb":{"dmg_dealt":1.1,"dmg_taken":0.9}}},"35":{"id":35,"alias":"Shaco","stats":{"aram":{"dmg_dealt":1.05},"urf":{"dmg_dealt":0.9,"dmg_taken":1.1}}},"36":{"id":36,"alias":"DrMundo","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.05,"healing":0.9},"ofa":{"dmg_dealt":0.95,"dmg_taken":1.05,"healing":0.9}}},"37":{"id":37,"alias":"Sona","stats":{"aram":{"dmg_taken":1.1,"healing":0.85,"shielding":0.85,"ability_haste":-20},"urf":{"dmg_dealt":0.9,"healing":0.7},"nb":{"dmg_dealt":0.95,"healing":0.9,"shielding":0.9}}},"38":{"id":38,"alias":"Kassadin","stats":{"aram":{"dmg_taken":0.95}}},"39":{"id":39,"alias":"Irelia","stats":{"aram":{"ability_haste":20},"ofa":{"dmg_dealt":0.97}}},"40":{"id":40,"alias":"Janna","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.05,"healing":0.9,"shielding":0.95},"ofa":{"dmg_dealt":1.03}}},"41":{"id":41,"alias":"Gangplank","stats":{"aram":{"dmg_dealt":1.05},"ofa":{"dmg_dealt":1.05,"dmg_taken":0.9}}},"42":{"id":42,"alias":"Corki","stats":{"aram":{"dmg_taken":0.9,"ability_haste":20},"nb":{"dmg_dealt":1.05}}},"43":{"id":43,"alias":"Karma","stats":{"aram":{"dmg_dealt":0.98}}},"44":{"id":44,"alias":"Taric","stats":{"aram":{"dmg_taken":1.1},"urf":{"healing":0.85},"ofa":{"dmg_taken":0.92}}},"45":{"id":45,"alias":"Veigar","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.1}}},"48":{"id":48,"alias":"Trundle","stats":{"aram":{"dmg_taken":1.05},"urf":{"dmg_dealt":0.95,"healing":0.8},"ofa":{"dmg_dealt":0.95,"dmg_taken":1.07},"usb":{"dmg_taken":1.05}}},"50":{"id":50,"alias":"Swain","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.15,"healing":0.8},"nb":{"dmg_dealt":0.95,"dmg_taken":1.05}}},"51":{"id":51,"alias":"Caitlyn","stats":{"aram":{"dmg_taken":1.05}}},"53":{"id":53,"alias":"Blitzcrank","stats":{"ofa":{"dmg_dealt":1.06,"dmg_taken":0.97},"nb":{"dmg_dealt":1.05},"usb":{"dmg_dealt":1.05,"dmg_taken":0.95}}},"54":{"id":54,"alias":"Malphite","stats":{"urf":{"dmg_dealt":0.95},"ofa":{"dmg_dealt":0.95}}},"55":{"id":55,"alias":"Katarina","stats":{"aram":{"ability_haste":10,"tenacity":1.2},"urf":{"dmg_dealt":1.05,"dmg_taken":0.95},"ofa":{"dmg_taken":0.95}}},"56":{"id":56,"alias":"Nocturne","stats":{"aram":{"dmg_dealt":1.1,"dmg_taken":0.9,"healing":1.2},"urf":{"dmg_dealt":0.95},"ofa":{"dmg_dealt":0.95}}},"57":{"id":57,"alias":"Maokai","stats":{"aram":{"dmg_dealt":0.8,"dmg_taken":1.1,"healing":0.9},"urf":{"dmg_taken":1.05,"healing":0.7},"ofa":{"dmg_taken":1.05},"nb":{"dmg_dealt":0.95,"dmg_taken":1.05,"healing":0.95,"shielding":0.95}}},"58":{"id":58,"alias":"Renekton","stats":{"aram":{"healing":1.05}}},"59":{"id":59,"alias":"JarvanIV","stats":{"ofa":{"dmg_dealt":0.95},"usb":{"dmg_dealt":0.95}}},"60":{"id":60,"alias":"Elise","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.9,"tenacity":1.2},"urf":{"dmg_taken":0.95},"ofa":{"dmg_dealt":1.05,"dmg_taken":0.92},"usb":{"dmg_dealt":1.05,"dmg_taken":0.95}}},"61":{"id":61,"alias":"Orianna","stats":{"urf":{"dmg_dealt":0.9,"dmg_taken":1.1,"shielding":0.8}}},"62":{"id":62,"alias":"MonkeyKing","stats":{"urf":{"dmg_dealt":0.9,"dmg_taken":1.1},"ofa":{"dmg_dealt":0.95,"dmg_taken":1.05},"usb":{"dmg_dealt":0.95}}},"63":{"id":63,"alias":"Brand","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.1,"ability_haste":-10},"ofa":{"dmg_taken":1.03},"nb":{"dmg_dealt":0.9,"dmg_taken":1.08},"usb":{"dmg_dealt":0.95}}},"64":{"id":64,"alias":"LeeSin","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.95,"healing":1.1,"shielding":1.2,"energy_regen":1.2},"ofa":{"dmg_taken":0.95}}},"67":{"id":67,"alias":"Vayne","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.95},"urf":{"dmg_taken":1.05},"ofa":{"dmg_dealt":0.97}}},"68":{"id":68,"alias":"Rumble","stats":{}},"69":{"id":69,"alias":"Cassiopeia","stats":{"urf":{"dmg_dealt":0.95,"dmg_taken":1.05}}},"72":{"id":72,"alias":"Skarner","stats":{"aram":{"dmg_taken":1.05},"ofa":{"dmg_taken":0.97}}},"74":{"id":74,"alias":"Heimerdinger","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.1},"ofa":{"dmg_dealt":0.97}}},"75":{"id":75,"alias":"Nasus","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.05},"nb":{"dmg_dealt":0.95},"usb":{"dmg_taken":0.95}}},"76":{"id":76,"alias":"Nidalee","stats":{"aram":{"dmg_dealt":1.1},"urf":{"dmg_dealt":1.05,"dmg_taken":0.95},"ofa":{"dmg_dealt":1.07,"dmg_taken":0.95},"nb":{"dmg_dealt":1.05,"dmg_taken":0.9,"healing":1.1,"shielding":1.1},"usb":{"dmg_dealt":1.05,"dmg_taken":0.95,"healing":1.2}}},"77":{"id":77,"alias":"Udyr","stats":{"urf":{"dmg_dealt":1.1,"dmg_taken":0.92}}},"78":{"id":78,"alias":"Poppy","stats":{}},"79":{"id":79,"alias":"Gragas","stats":{"aram":{"dmg_taken":0.95}}},"80":{"id":80,"alias":"Pantheon","stats":{"ofa":{"dmg_dealt":0.98,"dmg_taken":1.02}}},"81":{"id":81,"alias":"Ezreal","stats":{"urf":{"dmg_dealt":0.95}}},"82":{"id":82,"alias":"Mordekaiser","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.05},"urf":{"dmg_taken":0.85},"ofa":{"dmg_dealt":0.95,"dmg_taken":1.05},"usb":{"dmg_taken":1.05}}},"83":{"id":83,"alias":"Yorick","stats":{"ofa":{"dmg_dealt":0.9,"dmg_taken":1.05}}},"84":{"id":84,"alias":"Akali","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.9,"energy_regen":1.2,"tenacity":1.2},"urf":{"dmg_taken":0.9},"ofa":{"dmg_dealt":1.05,"dmg_taken":0.97},"nb":{"dmg_taken":0.9,"ability_haste":20}}},"85":{"id":85,"alias":"Kennen","stats":{"aram":{"dmg_dealt":1.05,"energy_regen":1.2},"ofa":{"dmg_dealt":0.98,"dmg_taken":1.02}}},"86":{"id":86,"alias":"Garen","stats":{"aram":{"dmg_taken":0.95},"urf":{"dmg_dealt":1.1,"dmg_taken":0.9},"ofa":{"dmg_dealt":0.95}}},"89":{"id":89,"alias":"Leona","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.05}}},"90":{"id":90,"alias":"Malzahar","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.1},"urf":{"dmg_dealt":0.92,"dmg_taken":1.08}}},"91":{"id":91,"alias":"Talon","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.95,"tenacity":1.2}}},"92":{"id":92,"alias":"Riven","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.92},"urf":{"dmg_taken":0.95},"nb":{"dmg_dealt":1.05}}},"96":{"id":96,"alias":"KogMaw","stats":{"aram":{"dmg_dealt":0.88,"dmg_taken":1.1},"urf":{"dmg_dealt":0.95},"ofa":{"dmg_dealt":0.97,"dmg_taken":1.03},"nb":{"dmg_dealt":0.9,"dmg_taken":1.05}}},"98":{"id":98,"alias":"Shen","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.05},"urf":{"dmg_taken":1.05},"ofa":{"dmg_dealt":0.95}}},"99":{"id":99,"alias":"Lux","stats":{"aram":{"dmg_dealt":0.85,"dmg_taken":1.1,"shielding":0.8},"urf":{"dmg_dealt":0.95}}},"101":{"id":101,"alias":"Xerath","stats":{"aram":{"dmg_dealt":0.93,"dmg_taken":1.05},"ofa":{"dmg_dealt":1.03}}},"102":{"id":102,"alias":"Shyvana","stats":{"aram":{"dmg_taken":0.95},"urf":{"dmg_dealt":0.85},"ofa":{"dmg_taken":1.02}}},"103":{"id":103,"alias":"Mel","stats":{"urf":{"dmg_dealt":0.9,"dmg_taken":1.05},"usb":{"dmg_taken":0.95}}},"104":{"id":104,"alias":"Graves","stats":{"ofa":{"dmg_dealt":0.98,"dmg_taken":1.05},"usb":{"dmg_dealt":0.95}}},"105":{"id":105,"alias":"Fizz","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.95,"tenacity":1.1},"urf":{"dmg_dealt":0.9,"dmg_taken":1.1}}},"106":{"id":106,"alias":"Volibear","stats":{"urf":{"dmg_dealt":0.95,"dmg_taken":1.1,"healing":0.8},"ofa":{"dmg_dealt":0.9,"dmg_taken":1.1,"shielding":0.8}}},"107":{"id":107,"alias":"Rengar","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.92,"tenacity":1.2},"ofa":{"dmg_dealt":1.05,"dmg_taken":0.95}}},"110":{"id":110,"alias":"Varus","stats":{"aram":{"dmg_dealt":0.98,"dmg_taken":1.05}}},"111":{"id":111,"alias":"Nautilus","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.1}}},"112":{"id":112,"alias":"Viktor","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.05},"urf":{"dmg_dealt":0.95}}},"113":{"id":113,"alias":"Sejuani","stats":{}},"114":{"id":114,"alias":"Fiora","stats":{"aram":{"dmg_taken":0.95},"urf":{"dmg_dealt":0.9,"dmg_taken":1.1,"healing":0.65},"usb":{"dmg_dealt":0.95,"dmg_taken":1.05}}},"115":{"id":115,"alias":"Ziggs","stats":{"aram":{"dmg_dealt":0.87,"dmg_taken":1.2,"ability_haste":-20},"ofa":{"dmg_taken":0.95},"nb":{"dmg_dealt":0.95,"ability_haste":-10}}},"117":{"id":117,"alias":"Lulu","stats":{}},"119":{"id":119,"alias":"Draven","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.95},"urf":{"dmg_dealt":0.95,"dmg_taken":1.05},"ofa":{"dmg_taken":0.95}}},"120":{"id":120,"alias":"Hecarim","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.9,"healing":1.2,"ability_haste":10},"nb":{"dmg_taken":0.95}}},"121":{"id":121,"alias":"Khazix","stats":{"aram":{"dmg_dealt":1.1,"dmg_taken":0.9,"healing":1.2,"tenacity":1.2}}},"122":{"id":122,"alias":"Darius","stats":{"aram":{"dmg_dealt":1.05},"urf":{"dmg_dealt":1.05,"dmg_taken":0.85},"ofa":{"dmg_dealt":0.9,"dmg_taken":1.05}}},"126":{"id":126,"alias":"Jayce","stats":{"aram":{"dmg_dealt":1.05},"urf":{"dmg_dealt":0.92,"dmg_taken":1.05}}},"127":{"id":127,"alias":"Lissandra","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.05}}},"131":{"id":131,"alias":"Diana","stats":{"aram":{"dmg_dealt":1.02,"dmg_taken":0.98},"ofa":{"dmg_dealt":0.95}}},"133":{"id":133,"alias":"Quinn","stats":{"aram":{"dmg_dealt":1.1,"dmg_taken":0.9,"attack_speed":1.025,"tenacity":1.2},"urf":{"dmg_taken":0.95}}},"134":{"id":134,"alias":"Syndra","stats":{"aram":{"dmg_dealt":1.05,"ability_haste":5},"urf":{"dmg_dealt":0.9,"dmg_taken":1.1}}},"136":{"id":136,"alias":"AurelionSol","stats":{"urf":{"dmg_dealt":1.1,"dmg_taken":0.9},"ofa":{"dmg_dealt":1.02,"dmg_taken":0.92,"ability_haste":-20},"usb":{"dmg_dealt":1.05,"movement_speed":1.2}}},"141":{"id":141,"alias":"Kayn","stats":{"aram":{"healing":0.8,"tenacity":1.2}}},"142":{"id":142,"alias":"Zoe","stats":{"aram":{"dmg_dealt":1.1,"dmg_taken":0.95},"ofa":{"dmg_dealt":1.1,"dmg_taken":0.9}}},"143":{"id":143,"alias":"Zyra","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.05,"ability_haste":-10},"nb":{"dmg_dealt":0.95,"dmg_taken":1.08}}},"145":{"id":145,"alias":"Kaisa","stats":{"aram":{"dmg_taken":0.95,"attack_speed":1.025},"urf":{"dmg_dealt":0.9,"dmg_taken":1.1},"ofa":{"dmg_dealt":1.03}}},"147":{"id":147,"alias":"Seraphine","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.2,"healing":0.8,"shielding":0.8,"ability_haste":-20},"urf":{"dmg_dealt":0.92,"healing":0.8},"nb":{"dmg_dealt":0.95,"healing":0.9,"shielding":0.9}}},"150":{"id":150,"alias":"Gnar","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.95,"attack_speed":1.025},"urf":{"dmg_dealt":1.1,"dmg_taken":0.9}}},"154":{"id":154,"alias":"Zac","stats":{"aram":{"dmg_taken":0.96,"healing":1.1}}},"157":{"id":157,"alias":"Yasuo","stats":{"aram":{"attack_speed":1.025},"urf":{"dmg_taken":0.9}}},"161":{"id":161,"alias":"Velkoz","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.05},"urf":{"dmg_dealt":0.95}}},"163":{"id":163,"alias":"Taliyah","stats":{"ofa":{"dmg_dealt":1.05,"dmg_taken":0.9},"nb":{"dmg_dealt":0.95,"ability_haste":-10}}},"164":{"id":164,"alias":"Camille","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.95,"healing":1.2,"shielding":1.1,"ability_haste":10},"nb":{"dmg_taken":0.95}}},"166":{"id":166,"alias":"Akshan","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.95},"urf":{"dmg_dealt":1.05}}},"200":{"id":200,"alias":"Belveth","stats":{"aram":{"dmg_dealt":1.05},"usb":{"dmg_dealt":0.9}}},"201":{"id":201,"alias":"Braum","stats":{"urf":{"dmg_dealt":1.05,"dmg_taken":0.82},"ofa":{"dmg_dealt":1.1,"dmg_taken":0.9}}},"202":{"id":202,"alias":"Jhin","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.05},"urf":{"dmg_dealt":1.05}}},"203":{"id":203,"alias":"Kindred","stats":{"aram":{"dmg_dealt":1.1,"dmg_taken":0.9,"attack_speed":1.025},"ofa":{"dmg_taken":0.95},"usb":{"dmg_dealt":0.95,"dmg_taken":1.05}}},"221":{"id":221,"alias":"Zeri","stats":{"aram":{"dmg_dealt":1.1}}},"222":{"id":222,"alias":"Jinx","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.05},"nb":{"dmg_dealt":0.95,"dmg_taken":1.05}}},"223":{"id":223,"alias":"TahmKench","stats":{"aram":{"dmg_taken":1.05},"urf":{"dmg_dealt":1.2,"dmg_taken":0.85}}},"233":{"id":233,"alias":"Briar","stats":{"aram":{"dmg_dealt":1.05,"healing":1.2}}},"234":{"id":234,"alias":"Viego","stats":{"aram":{"dmg_dealt":1.05},"urf":{"dmg_dealt":1.05,"dmg_taken":0.9},"usb":{"dmg_dealt":0.95,"healing":0.8}}},"235":{"id":235,"alias":"Senna","stats":{"aram":{"dmg_dealt":0.97,"dmg_taken":1.05},"ofa":{"dmg_dealt":1.05,"dmg_taken":0.9},"usb":{"dmg_dealt":1.1,"healing":1.2}}},"236":{"id":236,"alias":"Lucian","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.95,"ability_haste":10,"tenacity":1.2},"urf":{"dmg_dealt":0.95,"dmg_taken":1.05}}},"238":{"id":238,"alias":"Zed","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.95,"energy_regen":1.2,"tenacity":1.2},"urf":{"dmg_dealt":0.85,"dmg_taken":1.1}}},"240":{"id":240,"alias":"Kled","stats":{"aram":{"dmg_dealt":1.05},"urf":{"dmg_taken":0.9}}},"245":{"id":245,"alias":"Ekko","stats":{"aram":{"dmg_dealt":1.1,"tenacity":1.2},"ofa":{"dmg_dealt":0.95}}},"246":{"id":246,"alias":"Qiyana","stats":{"aram":{"dmg_dealt":1.15,"dmg_taken":0.9,"tenacity":1.2},"urf":{"dmg_taken":0.9},"ofa":{"dmg_dealt":1.05,"dmg_taken":0.92}}},"254":{"id":254,"alias":"Vi","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.95},"urf":{"dmg_dealt":0.95,"dmg_taken":1.05},"ofa":{"dmg_dealt":0.95,"dmg_taken":1.05},"usb":{"dmg_dealt":0.95,"dmg_taken":1.05}}},"266":{"id":266,"alias":"Aatrox","stats":{"aram":{"dmg_dealt":1.05},"urf":{"dmg_dealt":1.15,"dmg_taken":0.7}}},"267":{"id":267,"alias":"Nami","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.05,"healing":0.9},"ofa":{"dmg_dealt":1.05,"dmg_taken":0.93,"healing":1.2}}},"268":{"id":268,"alias":"Azir","stats":{"aram":{"dmg_taken":0.95,"ability_haste":20,"attack_speed":1.025},"ofa":{"dmg_dealt":1.08,"dmg_taken":0.9,"movement_speed":1.05}}},"350":{"id":350,"alias":"Yuumi","stats":{"aram":{"dmg_dealt":1.05},"urf":{"dmg_dealt":0.65,"dmg_taken":1.2,"healing":0.7},"ofa":{"dmg_dealt":1.15,"dmg_taken":0.8,"healing":1.2,"shielding":1.2},"usb":{"dmg_dealt":0.95,"healing":0.75,"shielding":0.75}}},"360":{"id":360,"alias":"Samira","stats":{"aram":{"dmg_dealt":0.98,"dmg_taken":1.05},"urf":{"dmg_dealt":0.95},"usb":{"dmg_dealt":0.9,"shielding":0.99}}},"412":{"id":412,"alias":"Thresh","stats":{"aram":{"dmg_taken":1.05},"urf":{"dmg_taken":0.87,"shielding":1.2},"ofa":{"movement_speed":1.05},"nb":{"ability_haste":20},"usb":{"movement_speed":1.2}}},"420":{"id":420,"alias":"Illaoi","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.05,"healing":0.8},"urf":{"dmg_taken":0.9},"ofa":{"dmg_dealt":0.92,"dmg_taken":1.05}}},"421":{"id":421,"alias":"RekSai","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.9},"urf":{"dmg_dealt":1.07,"dmg_taken":0.93,"healing":1.2},"ofa":{"dmg_dealt":1.05,"dmg_taken":0.93,"healing":1.2},"nb":{"dmg_dealt":1.05,"dmg_taken":0.9}}},"427":{"id":427,"alias":"Ivern","stats":{"aram":{"dmg_dealt":0.95,"shielding":0.8},"ofa":{"dmg_dealt":1.1,"dmg_taken":0.93,"shielding":1.2},"usb":{"dmg_taken":0.95}}},"429":{"id":429,"alias":"Kalista","stats":{"aram":{"dmg_dealt":1.1,"dmg_taken":0.9},"urf":{"dmg_dealt":1.1,"dmg_taken":0.9}}},"432":{"id":432,"alias":"Bard","stats":{"aram":{"dmg_dealt":1.15,"dmg_taken":0.85,"healing":1.2},"urf":{"dmg_dealt":1.15,"dmg_taken":0.85,"healing":1.2},"ofa":{"dmg_dealt":1.15,"dmg_taken":0.85,"healing":1.2},"nb":{"dmg_taken":0.9,"ability_haste":20},"usb":{"dmg_dealt":1.08,"dmg_taken":0.92,"movement_speed":1.2}}},"497":{"id":497,"alias":"Rakan","stats":{"aram":{"dmg_taken":0.95}}},"498":{"id":498,"alias":"Xayah","stats":{"aram":{"dmg_dealt":1.05,"attack_speed":1.03},"urf":{"dmg_dealt":0.85,"dmg_taken":1.1},"usb":{"dmg_taken":0.95}}},"516":{"id":516,"alias":"Ornn","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.05},"urf":{"dmg_dealt":1.05,"dmg_taken":0.95}}},"517":{"id":517,"alias":"Sylas","stats":{"aram":{"dmg_dealt":1.05},"urf":{"dmg_dealt":0.95}}},"518":{"id":518,"alias":"Neeko","stats":{"ofa":{"dmg_dealt":0.98},"usb":{"dmg_taken":0.95}}},"523":{"id":523,"alias":"Aphelios","stats":{"urf":{"dmg_dealt":1.05},"ofa":{"dmg_dealt":1.08},"usb":{"dmg_dealt":0.95}}},"526":{"id":526,"alias":"Rell","stats":{"aram":{"dmg_dealt":0.95,"healing":0.9,"shielding":0.9},"ofa":{"dmg_dealt":1.05},"usb":{"dmg_dealt":0.9,"dmg_taken":1.05}}},"555":{"id":555,"alias":"Pyke","stats":{"aram":{"dmg_dealt":1.1,"dmg_taken":0.95,"tenacity":1.2},"urf":{"dmg_taken":0.95},"ofa":{"dmg_taken":0.95},"nb":{"dmg_dealt":1.05}}},"711":{"id":711,"alias":"Vex","stats":{"aram":{"dmg_dealt":0.95},"urf":{"dmg_dealt":0.9}}},"777":{"id":777,"alias":"Yone","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.97,"attack_speed":1.025},"urf":{"dmg_dealt":1.1,"dmg_taken":0.9,"shielding":1.2},"ofa":{"dmg_dealt":0.98}}},"875":{"id":875,"alias":"Sett","stats":{"aram":{"dmg_dealt":0.9,"dmg_taken":1.1,"healing":0.9,"shielding":0.9},"urf":{"dmg_dealt":1.05,"dmg_taken":0.92},"ofa":{"dmg_dealt":0.95,"dmg_taken":1.05},"nb":{"dmg_dealt":0.95},"usb":{"dmg_dealt":0.95,"dmg_taken":1.05}}},"876":{"id":876,"alias":"Lillia","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.05},"ofa":{"dmg_dealt":0.98},"usb":{"dmg_dealt":0.95}}},"887":{"id":887,"alias":"Gwen","stats":{"usb":{"dmg_dealt":0.95,"dmg_taken":1.05}}},"888":{"id":888,"alias":"Renata","stats":{"aram":{"dmg_dealt":0.95,"dmg_taken":1.05,"shielding":0.8},"ofa":{"dmg_dealt":1.1,"dmg_taken":0.95,"shielding":1.2}}},"893":{"id":893,"alias":"Aurora","stats":{}},"895":{"id":895,"alias":"Nilah","stats":{"aram":{"dmg_dealt":0.97}}},"897":{"id":897,"alias":"KSante","stats":{"aram":{"dmg_dealt":1.05},"urf":{"dmg_dealt":1.05}}},"901":{"id":901,"alias":"Smolder","stats":{"aram":{"dmg_taken":1.05,"ability_haste":-10}}},"902":{"id":902,"alias":"Milio","stats":{"aram":{"healing":0.95,"shielding":0.9,"ability_haste":-10}}},"910":{"id":910,"alias":"Hwei","stats":{}},"950":{"id":950,"alias":"Naafiri","stats":{"aram":{"dmg_dealt":1.1,"ability_haste":10}}},"150.2":{"id":150.2,"alias":"GnarBig","stats":{}},"240.1":{"id":240.1,"alias":"Kled","stats":{"aram":{"dmg_dealt":1.05,"dmg_taken":0.9}}}}'), pr = {
  _meta: $1,
  champions: ey
};
function bu(s) {
  return s.toLowerCase();
}
const Du = /* @__PURE__ */ new Map(), zu = /* @__PURE__ */ new Map(), yr = /* @__PURE__ */ new Map(), vr = /* @__PURE__ */ new Map(), $i = /* @__PURE__ */ new Map(), Ar = /* @__PURE__ */ new Map(), es = /* @__PURE__ */ new Map(), qu = /* @__PURE__ */ new Map();
let Zg = !1;
async function ty() {
  Zg || (ay(), await Vg(0));
}
function ay() {
  var s;
  try {
    const c = pr.champions;
    for (const [d, r] of Object.entries(c))
      qu.set(Number(d), r);
    y.info(
      "[Assets] 英雄平衡数据加载完成 → %d 个英雄 (数据更新于 %s)",
      qu.size,
      ((s = pr._meta) == null ? void 0 : s.updatedAt) ?? "未知"
    );
  } catch (c) {
    y.error("[Assets] 英雄平衡数据加载失败:", c);
  }
}
async function Vg(s) {
  const [r, m, h, v, T, S, p] = await Promise.all([
    B.getItems().catch((E) => (y.warn("[Assets] getItems 失败:", E), [])),
    B.getSummonerSpells().catch((E) => (y.warn("[Assets] getSummonerSpells 失败:", E), [])),
    B.getQueues().catch((E) => (y.warn("[Assets] getQueues 失败:", E), [])),
    B.getMapAssets().catch((E) => (y.warn("[Assets] getMapAssets 失败:", E), [])),
    B.getPerks().catch((E) => (y.warn("[Assets] getPerks 失败:", E), [])),
    B.getPerkStyles().catch((E) => (y.warn("[Assets] getPerkStyles 失败:", E), { styles: [] })),
    B.getChampionSummary().catch((E) => (y.warn("[Assets] getChampionSummary 失败:", E), []))
  ]);
  for (const E of r)
    E.id > 0 && E.iconPath && Du.set(E.id, bu(E.iconPath));
  for (const E of m)
    E.id > 0 && E.iconPath && zu.set(E.id, bu(E.iconPath));
  for (const E of h)
    $i.set(E.id, E);
  for (const E of v)
    E.id != null && Ar.set(E.id, E);
  for (const E of T)
    E.id > 0 && E.iconPath && yr.set(E.id, bu(E.iconPath));
  for (const E of S.styles)
    E.id > 0 && E.iconPath && vr.set(E.id, bu(E.iconPath));
  for (const E of p)
    E.id > 0 && es.set(E.id, {
      id: E.id,
      name: E.description || "",
      title: E.name || "",
      alias: E.alias
    });
  y.info(
    "[Assets] 资源映射初始化 (attempt %d) → 装备 %d, 技能 %d, 符文 %d, 符文系 %d, 队列 %d, 地图 %d, 英雄 %d",
    s + 1,
    Du.size,
    zu.size,
    yr.size,
    vr.size,
    $i.size,
    Ar.size,
    es.size
  );
  const z = [
    Du.size === 0 && "items",
    zu.size === 0 && "spells",
    $i.size === 0 && "queues",
    es.size === 0 && "champions"
  ].filter(Boolean);
  if (z.length > 0 && s < 3) {
    y.warn("[Assets] 关键资源缺失: %s，%d 秒后重试 (%d/%d)", z.join(","), 2e3 / 1e3, s + 1, 3), setTimeout(() => Vg(s + 1), 2e3);
    return;
  }
  Zg = !0, z.length > 0 ? y.error("[Assets] 重试 %d 次后仍有资源缺失: %s", 3, z.join(",")) : y.info("[Assets] 资源映射初始化完成 ✓");
}
function br(s) {
  return `/lol-game-data/assets/v1/champion-icons/${s}.png`;
}
function ly(s) {
  return Du.get(s) ?? "";
}
function Xh(s) {
  return zu.get(s) ?? "";
}
function Kh(s) {
  return yr.get(s) ?? "";
}
function Zh(s) {
  return vr.get(s) ?? "";
}
function jr(s) {
  var c;
  return ((c = $i.get(s)) == null ? void 0 : c.name) ?? `队列${s}`;
}
function ny(s) {
  var c;
  return ((c = Ar.get(s)) == null ? void 0 : c.name) ?? `地图${s}`;
}
function Jg(s) {
  return es.get(s);
}
function Yg(s, c = 8) {
  if (!s.trim()) return [];
  const d = s.trim().toLowerCase(), r = [];
  return es.forEach((m) => {
    m.id <= 0 || (m.name.toLowerCase().includes(d) || m.title.toLowerCase().includes(d) || m.alias.toLowerCase().includes(d)) && r.push(m);
  }), r.sort((m, h) => {
    const v = m.name.toLowerCase() === d ? 0 : 1, T = h.name.toLowerCase() === d ? 0 : 1;
    return v - T;
  }), r.slice(0, c);
}
function iy(s) {
  return qu.get(s);
}
function sy() {
  return Array.from(qu.values());
}
function uy() {
  return pr._meta;
}
function cy() {
  const s = /* @__PURE__ */ new Set([
    "TUTORIAL",
    "TUTORIAL_MODULE_1",
    "TUTORIAL_MODULE_2",
    "TUTORIAL_MODULE_3",
    "PRACTICETOOL",
    "SWIFTPLAY",
    "TFT"
  ]), c = /* @__PURE__ */ new Set([
    "CHERRY_UNRANKED"
  ]), d = [];
  return $i.forEach((r) => {
    r.id <= 0 || r.isCustom || !r.isEnabled || r.queueAvailability !== "Available" || s.has(r.gameMode) || c.has(r.type) || d.push({ id: r.id, name: r.name || r.shortName || `队列${r.id}` });
  }), d.sort((r, m) => r.name.localeCompare(m.name, "zh")), d;
}
function Vh(s) {
  return s >= 1e3 ? `${(s / 1e3).toFixed(1)}k` : String(s);
}
function oy(s) {
  const c = new Date(s), d = /* @__PURE__ */ new Date(), r = new Date(d.getFullYear(), d.getMonth(), d.getDate()), m = new Date(c.getFullYear(), c.getMonth(), c.getDate()), h = Math.round((r.getTime() - m.getTime()) / (1e3 * 60 * 60 * 24)), v = c.toLocaleTimeString(void 0, { hour: "2-digit", minute: "2-digit", hour12: !1 });
  return h === 0 ? `今天 ${v}` : h === 1 ? `昨天 ${v}` : h === 2 ? `前天 ${v}` : c.toLocaleDateString(void 0, { month: "2-digit", day: "2-digit" }) + " " + v;
}
function Jh(s, c) {
  var p, z, E, Q, ee, re, ae;
  const d = s.json, r = d.participants.find((ye) => ye.puuid === c);
  if (!r) return null;
  let m = ny(d.mapId);
  if (d.mapId === 12) {
    const ye = (p = d.gameModeMutators) == null ? void 0 : p[0];
    ye === "mapskin_ha_bilgewater" ? m = "屠夫之桥" : ye === "mapskin_map12_bloom" ? m = "莲华栈桥" : m = "嚎哭深渊";
  }
  const h = (E = (z = r.perks) == null ? void 0 : z.styles) == null ? void 0 : E[0], v = (ee = (Q = r.perks) == null ? void 0 : Q.styles) == null ? void 0 : ee[1], T = ((ae = (re = h == null ? void 0 : h.selections) == null ? void 0 : re[0]) == null ? void 0 : ae.perk) ?? 0, S = (v == null ? void 0 : v.style) ?? 0;
  return {
    gameId: d.gameId,
    queueId: d.queueId,
    win: r.win,
    championId: r.championId,
    level: r.champLevel,
    kills: r.kills,
    deaths: r.deaths,
    assists: r.assists,
    cs: r.totalMinionsKilled + r.neutralMinionsKilled,
    gold: r.goldEarned,
    damage: r.totalDamageDealtToChampions,
    queueName: jr(d.queueId),
    mapName: m,
    spell1Id: r.spell1Id,
    spell2Id: r.spell2Id,
    perk0: T,
    perkSubStyle: S,
    items: [r.item0, r.item1, r.item2, r.item3, r.item4, r.item5, r.item6],
    gameCreation: d.gameCreation
  };
}
function ry({ match: s }) {
  const c = s.win ? "smh-win" : "smh-loss", d = s.win ? "胜利" : "失败", [r, m] = U.useState(!1), h = () => {
    navigator.clipboard.writeText(String(s.gameId)).then(() => {
      m(!0), setTimeout(() => m(!1), 1500);
    });
  };
  return /* @__PURE__ */ u.jsxs("div", { className: `smh-row ${c}`, children: [
    /* @__PURE__ */ u.jsxs("div", { className: "smh-row-left", children: [
      /* @__PURE__ */ u.jsxs("div", { className: "smh-champion", children: [
        /* @__PURE__ */ u.jsx("div", { className: "smh-champion-mask", children: /* @__PURE__ */ u.jsx("img", { className: "smh-champion-icon", src: br(s.championId), alt: "" }) }),
        /* @__PURE__ */ u.jsx("span", { className: "smh-champion-level", children: s.level })
      ] }),
      /* @__PURE__ */ u.jsxs("div", { className: "smh-row-info", children: [
        /* @__PURE__ */ u.jsx("span", { className: `smh-status ${c}`, children: d }),
        /* @__PURE__ */ u.jsx("span", { className: "smh-gamemode", children: s.queueName }),
        /* @__PURE__ */ u.jsxs("div", { className: "smh-spells", children: [
          /* @__PURE__ */ u.jsx("img", { className: "smh-spell", src: Xh(s.spell1Id), alt: "" }),
          /* @__PURE__ */ u.jsx("img", { className: "smh-spell", src: Xh(s.spell2Id), alt: "" }),
          s.perk0 > 0 && Kh(s.perk0) && /* @__PURE__ */ u.jsxs(u.Fragment, { children: [
            /* @__PURE__ */ u.jsx("img", { className: "smh-perk smh-perk-primary", src: Kh(s.perk0), alt: "" }),
            s.perkSubStyle > 0 && Zh(s.perkSubStyle) && /* @__PURE__ */ u.jsx("img", { className: "smh-perk smh-perk-sub", src: Zh(s.perkSubStyle), alt: "" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ u.jsxs("div", { className: "smh-row-center", children: [
      /* @__PURE__ */ u.jsx("div", { className: "smh-items", children: s.items.map((v, T) => /* @__PURE__ */ u.jsx("div", { className: "smh-item-slot", children: v > 0 && /* @__PURE__ */ u.jsx("img", { className: "smh-item-icon", src: ly(v), alt: "" }) }, T)) }),
      /* @__PURE__ */ u.jsxs("div", { className: "smh-stats-line", children: [
        /* @__PURE__ */ u.jsxs("span", { className: "smh-kda", children: [
          /* @__PURE__ */ u.jsx("span", { className: "smh-sprite-icon", style: { WebkitMaskImage: "url(/fe/lol-match-history/icons.png)", WebkitMaskPositionY: "0%", width: "22px", height: "22px" } }),
          /* @__PURE__ */ u.jsx("span", { className: `smh-kda-num${s.kills >= s.deaths && s.kills >= s.assists ? " smh-kda-highlight" : ""}`, children: s.kills }),
          " / ",
          /* @__PURE__ */ u.jsx("span", { className: `smh-kda-num${s.deaths > s.kills && s.deaths > s.assists ? " smh-kda-highlight" : ""}`, children: s.deaths }),
          " / ",
          /* @__PURE__ */ u.jsx("span", { className: `smh-kda-num${s.assists > s.kills && s.assists > s.deaths ? " smh-kda-highlight" : ""}`, children: s.assists })
        ] }),
        /* @__PURE__ */ u.jsxs("span", { className: "smh-cs", children: [
          /* @__PURE__ */ u.jsx("span", { className: "smh-stat-icon", style: { WebkitMaskImage: "url(/fe/lol-match-history/icon_minions.png)" } }),
          s.cs
        ] }),
        /* @__PURE__ */ u.jsxs("span", { className: "smh-gold", children: [
          /* @__PURE__ */ u.jsx("span", { className: "smh-stat-icon", style: { WebkitMaskImage: "url(/fe/lol-match-history/icon_gold.png)" } }),
          Vh(s.gold)
        ] }),
        /* @__PURE__ */ u.jsxs("span", { className: "smh-damage", children: [
          "🗡️ ",
          Vh(s.damage)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ u.jsxs("div", { className: "smh-row-right", children: [
      /* @__PURE__ */ u.jsx("span", { className: "smh-mapname", children: s.mapName }),
      /* @__PURE__ */ u.jsx("span", { className: "smh-date", children: oy(s.gameCreation) }),
      /* @__PURE__ */ u.jsxs("span", { className: "smh-gameid", onClick: h, children: [
        "ID:",
        s.gameId,
        /* @__PURE__ */ u.jsx("span", { className: `smh-copy-icon ${r ? "smh-copied" : ""}`, style: { WebkitMaskImage: "url(/fe/lol-static-assets/images/game-id-clipboard-copy.svg)" } })
      ] })
    ] })
  ] });
}
function ls({ open: s, onClose: c, puuid: d, playerName: r, queueId: m }) {
  var H;
  const [h, v] = U.useState([]), [T, S] = U.useState(!1), [p, z] = U.useState(!1), [E, Q] = U.useState(""), [ee, re] = U.useState(!0), [ae, ye] = U.useState(m ?? 0), [Y, Z] = U.useState(!1), $ = U.useRef(""), de = U.useRef(null), W = U.useRef(null), le = U.useRef(0), ne = U.useRef(null), ke = 20, ue = 20, [Xe, X] = U.useState([]);
  U.useEffect(() => {
    const G = cy();
    X(G);
  }, []), U.useEffect(() => {
    const G = (ce) => {
      W.current && !W.current.contains(ce.target) && Z(!1);
    };
    return document.addEventListener("mousedown", G), () => document.removeEventListener("mousedown", G);
  }, []);
  const j = U.useCallback(async (G) => {
    S(!0), Q(""), v([]), re(!0), le.current = 0;
    try {
      const ce = as(G), A = (await B.getSgpMatchHistory(d, {
        startIndex: 0,
        count: ke,
        tag: ce || void 0
      })).games ?? [], I = A.map((K) => Jh(K, d)).filter((K) => K !== null);
      v(I), le.current = ke, A.length < ke && re(!1);
    } catch {
      Q("查询战绩失败");
    } finally {
      S(!1);
    }
  }, [d]), F = U.useCallback(async () => {
    if (!(p || !ee)) {
      z(!0);
      try {
        const G = as(ae), se = (await B.getSgpMatchHistory(d, {
          startIndex: le.current,
          count: ue,
          tag: G || void 0
        })).games ?? [], A = se.map((I) => Jh(I, d)).filter((I) => I !== null);
        v((I) => [...I, ...A]), le.current += se.length, se.length < ue && re(!1);
      } catch {
      } finally {
        z(!1);
      }
    }
  }, [d, ae, p, ee]), he = U.useRef(F);
  he.current = F, U.useEffect(() => {
    if (!s) return;
    const G = requestAnimationFrame(() => {
      const ce = de.current;
      if (!ce) return;
      const se = () => {
        const { scrollTop: A, scrollHeight: I, clientHeight: K } = ce;
        I - A - K < 60 && he.current();
      };
      ce.addEventListener("scroll", se, { passive: !0 }), ne.current = () => ce.removeEventListener("scroll", se);
    });
    return () => {
      var ce;
      cancelAnimationFrame(G), (ce = ne.current) == null || ce.call(ne), ne.current = null;
    };
  }, [s]), U.useEffect(() => {
    if (!s || !d) return;
    const G = `${d}-${m ?? 0}`;
    G !== $.current && ($.current = G, ye(m ?? 0), j(m ?? 0));
  }, [s, d, m, j]);
  const Ee = (G) => {
    ye(G), Z(!1), $.current = `${d}-${G}`, j(G);
  };
  U.useEffect(() => {
    s || ($.current = "");
  }, [s]);
  const D = ae > 0 ? ((H = Xe.find((G) => G.id === ae)) == null ? void 0 : H.name) ?? jr(ae) : "全部模式";
  return /* @__PURE__ */ u.jsx(Zu, { open: s, onClose: c, width: 860, height: 620, children: /* @__PURE__ */ u.jsxs("div", { className: "smh-container", children: [
    /* @__PURE__ */ u.jsxs("div", { className: "smh-header", children: [
      /* @__PURE__ */ u.jsxs("span", { className: "smh-title", children: [
        "❖ ",
        r,
        " 的近期战报"
      ] }),
      /* @__PURE__ */ u.jsxs("div", { className: "smh-filter", ref: W, children: [
        /* @__PURE__ */ u.jsxs(
          "button",
          {
            className: `smh-filter-trigger${Y ? " smh-filter-trigger--open" : ""}`,
            onClick: () => Z(!Y),
            type: "button",
            children: [
              /* @__PURE__ */ u.jsx("span", { children: D }),
              /* @__PURE__ */ u.jsx("svg", { className: `smh-filter-arrow${Y ? " smh-filter-arrow--open" : ""}`, width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ u.jsx("polyline", { points: "6 9 12 15 18 9" }) })
            ]
          }
        ),
        Y && /* @__PURE__ */ u.jsxs("div", { className: "smh-filter-dropdown", children: [
          /* @__PURE__ */ u.jsx(
            "button",
            {
              className: `smh-filter-option${ae === 0 ? " smh-filter-option--active" : ""}`,
              onClick: () => Ee(0),
              type: "button",
              children: "全部模式"
            }
          ),
          Xe.map((G) => /* @__PURE__ */ u.jsx(
            "button",
            {
              className: `smh-filter-option${ae === G.id ? " smh-filter-option--active" : ""}`,
              onClick: () => Ee(G.id),
              type: "button",
              children: G.name
            },
            G.id
          ))
        ] })
      ] })
    ] }),
    /* @__PURE__ */ u.jsxs("div", { className: "smh-list", ref: de, children: [
      T && /* @__PURE__ */ u.jsx("div", { className: "smh-empty", children: "加载中..." }),
      E && /* @__PURE__ */ u.jsx("div", { className: "smh-empty smh-error", children: E }),
      !T && !E && h.length === 0 && /* @__PURE__ */ u.jsx("div", { className: "smh-empty", children: ae > 0 ? "该模式暂无战绩，试试切换模式" : "暂无战绩" }),
      h.map((G) => /* @__PURE__ */ u.jsx(ry, { match: G }, G.gameId)),
      p && /* @__PURE__ */ u.jsx("div", { className: "smh-empty", children: "加载更多..." }),
      !T && !E && h.length > 0 && /* @__PURE__ */ u.jsx("div", { className: "smh-empty smh-no-more", children: ee ? "↓ 下滑加载更多" : `— 共 ${h.length} 条战绩 —` })
    ] })
  ] }) });
}
const gl = {
  autoAcceptMatch: !1,
  autoAcceptDelayMin: 0,
  autoAcceptDelayMax: 0,
  developerMode: !1,
  unlockStatus: !0,
  unlockAvailability: !1,
  benchNoCooldown: !1,
  sidebarCollapsed: !1,
  availability: "chat",
  statusMessage: "",
  hotkey: "F1",
  windowEffect: "none",
  champSelectAssist: !1,
  analyzeTeamPower: !1,
  analyzeTeamPowerMsgType: "celebration",
  analyzeTeamPowerFetchCount: 50,
  champSelectAssistFetchCount: 50,
  gameAnalysisFetchCount: 50,
  sideIndicator: !1,
  sideIndicatorMsgType: "celebration",
  globalParticle: !1,
  friendSmartGroup: !1,
  hideTFT: !1,
  hideRightNavText: !1,
  customProfileBg: !1,
  autoHonor: !1,
  rankDisguise: !1,
  rankQueue: "RANKED_SOLO_5x5",
  rankTier: "CHALLENGER",
  rankDivision: "I",
  autoLockChampion: !1,
  autoLockChampionId: 0,
  autoLockInstant: !0,
  balanceBuffTooltip: !1,
  unlockChromas: !0,
  champSelectQuitButton: !1,
  gameAnalysisPopup: !1,
  autoReturnToLobby: !1,
  autoReturnMode: "queue"
}, Yh = "sona:";
class dy {
  constructor() {
    Ve(this, "listeners", /* @__PURE__ */ new Map());
    Ve(this, "cache");
    const c = { ...gl };
    for (const d of Object.keys(gl))
      c[d] = this.readFromDisk(d);
    this.cache = c;
  }
  /**
   * 获取配置值
   */
  get(c) {
    return this.cache[c];
  }
  /**
   * 设置配置值（自动持久化 + 触发监听）
   */
  set(c, d) {
    if (this.cache[c] === d) return;
    this.cache[c] = d, DataStore.set(`${Yh}${c}`, d);
    const m = this.listeners.get(c);
    m && m.forEach((h) => {
      try {
        h(d, c);
      } catch {
      }
    });
  }
  /**
   * 切换布尔值配置
   */
  toggle(c) {
    const d = this.get(c);
    if (typeof d != "boolean") return d;
    const r = !d;
    return this.set(c, r), r;
  }
  /**
   * 监听配置变化
   * @returns 取消监听的函数
   */
  onChange(c, d) {
    let r = this.listeners.get(c);
    return r || (r = /* @__PURE__ */ new Set(), this.listeners.set(c, r)), r.add(d), () => {
      r.delete(d);
    };
  }
  /**
   * 重置所有配置为默认值
   */
  resetAll() {
    for (const c of Object.keys(gl))
      this.set(c, gl[c]);
  }
  /**
   * 重置单个配置为默认值
   */
  reset(c) {
    this.set(c, gl[c]);
  }
  /**
   * 获取所有配置的快照
   */
  getAll() {
    const c = { ...gl };
    for (const d of Object.keys(gl))
      c[d] = this.get(d);
    return c;
  }
  // ---- 内部方法 ----
  readFromDisk(c) {
    const d = DataStore.get(`${Yh}${c}`);
    return d !== void 0 ? d : gl[c];
  }
}
const C = new dy(), fy = [
  { value: "none", label: "无（默认）" },
  { value: "blurbehind", label: "毛玻璃" },
  { value: "acrylic", label: "亚克力" },
  { value: "unified", label: "混合" },
  { value: "mica", label: "云母 (Win11)" },
  { value: "transparent", label: "透明" }
];
function my() {
  const [s, c] = U.useState(""), [d, r] = U.useState([]), [m, h] = U.useState(""), v = async () => {
    const E = await B.listBackups();
    r(E);
  };
  U.useEffect(() => {
    v();
  }, []);
  const T = async () => {
    const E = s.trim();
    if (!E) {
      h("❌ 请输入备份名称");
      return;
    }
    h("⏳ 备份中...");
    const Q = await B.backupSettings(E);
    h(Q ? "✅ 备份成功" : "❌ 备份失败"), Q && (c(""), v());
  }, S = async (E) => {
    h(`⏳ 恢复 "${E}" 中...`);
    const Q = await B.restoreSettings(E);
    h(Q ? `✅ "${E}" 已恢复` : "❌ 恢复失败");
  }, p = async (E) => {
    await B.deleteBackup(E) && (h(`已删除 "${E}"`), v());
  }, z = (E) => E ? new Date(E).toLocaleString(void 0, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: !1 }) : "";
  return /* @__PURE__ */ u.jsxs(u.Fragment, { children: [
    /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { alignItems: "flex-end", gap: 8 }, children: [
      /* @__PURE__ */ u.jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ u.jsx(
        Nt,
        {
          value: s,
          onChange: (E) => {
            c(E), h("");
          },
          onKeyDown: (E) => {
            E.key === "Enter" && T();
          },
          placeholder: "输入备份名称 (如: 排位设置)"
        }
      ) }),
      /* @__PURE__ */ u.jsx(J, { variant: "primary", onClick: T, children: "保存备份" })
    ] }),
    m && /* @__PURE__ */ u.jsx("p", { className: "sona-subtitle", style: { marginTop: 6 }, children: m }),
    d.length > 0 && /* @__PURE__ */ u.jsx("div", { style: { marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }, children: d.map((E) => /* @__PURE__ */ u.jsxs("div", { className: "sona-backup-item", children: [
      /* @__PURE__ */ u.jsxs("div", { className: "sona-backup-info", children: [
        /* @__PURE__ */ u.jsx("span", { className: "sona-backup-name", children: E.name }),
        /* @__PURE__ */ u.jsx("span", { className: "sona-backup-time", children: z(E.timestamp) })
      ] }),
      /* @__PURE__ */ u.jsxs("div", { className: "sona-backup-actions", children: [
        /* @__PURE__ */ u.jsx(J, { onClick: () => S(E.name), children: "恢复" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => p(E.name), children: "删除" })
      ] })
    ] }, E.name)) })
  ] });
}
function hy() {
  const [s, c] = U.useState(C.get("autoAcceptMatch")), [d, r] = U.useState(String(C.get("autoAcceptDelayMin"))), [m, h] = U.useState(String(C.get("autoAcceptDelayMax"))), [v, T] = U.useState(C.get("unlockStatus")), [S, p] = U.useState(C.get("unlockAvailability")), [z, E] = U.useState(C.get("unlockChromas")), [Q, ee] = U.useState(C.get("benchNoCooldown")), [re, ae] = U.useState(C.get("hideTFT")), [ye, Y] = U.useState(C.get("hideRightNavText")), [Z, $] = U.useState(C.get("windowEffect")), [de, W] = U.useState(C.get("champSelectAssist")), [le, ne] = U.useState(C.get("balanceBuffTooltip")), [ke, ue] = U.useState(C.get("champSelectQuitButton")), [Xe, X] = U.useState(C.get("gameAnalysisPopup")), [j, F] = U.useState(C.get("autoReturnToLobby")), [he, Ee] = U.useState(C.get("autoReturnMode")), [D, H] = U.useState(C.get("analyzeTeamPower")), [G, ce] = U.useState(C.get("analyzeTeamPowerMsgType")), [se, A] = U.useState(C.get("analyzeTeamPowerFetchCount")), [I, K] = U.useState(C.get("champSelectAssistFetchCount")), [V, P] = U.useState(C.get("gameAnalysisFetchCount")), [fe, ve] = U.useState(C.get("sideIndicator")), [Je, De] = U.useState(C.get("sideIndicatorMsgType")), [Pt, _t] = U.useState(C.get("friendSmartGroup")), [Qa, ga] = U.useState(C.get("customProfileBg")), [At, pa] = U.useState(C.get("rankQueue")), [ya, El] = U.useState(C.get("rankTier")), [va, $t] = U.useState(C.get("rankDivision")), [ua, ea] = U.useState(C.get("autoHonor")), [Xa, bt] = U.useState(C.get("autoLockChampion")), [nt, Cl] = U.useState(() => {
    const w = C.get("autoLockChampionId");
    if (w > 0) {
      const Me = Jg(w);
      return Me ? `${Me.title} ${Me.name}` : String(w);
    }
    return "";
  }), [Ka, it] = U.useState([]), [Ut, mt] = U.useState(!1), [Lt, ta] = U.useState(C.get("autoLockInstant")), Bt = U.useRef(null), [Rt, pt] = U.useState(""), [ca, Ze] = U.useState("idle"), [is, Vu] = U.useState(""), [ss, oa] = U.useState(""), [Jl, Tl] = U.useState(!1), [Aa, Yl] = U.useState(""), [xl, Ju] = U.useState("");
  U.useEffect(() => {
    const w = [
      C.onChange("autoAcceptMatch", c),
      C.onChange("autoAcceptDelayMin", (Me) => r(String(Me))),
      C.onChange("autoAcceptDelayMax", (Me) => h(String(Me))),
      C.onChange("unlockStatus", T),
      C.onChange("unlockAvailability", p),
      C.onChange("unlockChromas", E),
      C.onChange("benchNoCooldown", ee),
      C.onChange("hideTFT", ae),
      C.onChange("windowEffect", $),
      C.onChange("champSelectAssist", W),
      C.onChange("balanceBuffTooltip", ne),
      C.onChange("champSelectQuitButton", ue),
      C.onChange("gameAnalysisPopup", X),
      C.onChange("autoReturnToLobby", F),
      C.onChange("autoReturnMode", Ee),
      C.onChange("analyzeTeamPower", H),
      C.onChange("analyzeTeamPowerFetchCount", A),
      C.onChange("champSelectAssistFetchCount", K),
      C.onChange("gameAnalysisFetchCount", P),
      C.onChange("sideIndicator", ve),
      C.onChange("friendSmartGroup", _t),
      C.onChange("customProfileBg", ga),
      C.onChange("autoHonor", ea),
      C.onChange("autoLockChampion", bt),
      C.onChange("rankQueue", pa),
      C.onChange("rankTier", El),
      C.onChange("rankDivision", $t)
    ];
    return () => w.forEach((Me) => Me());
  }, []), U.useEffect(() => {
    const w = (Me) => {
      Bt.current && !Bt.current.contains(Me.target) && mt(!1);
    };
    return document.addEventListener("mousedown", w), () => document.removeEventListener("mousedown", w);
  }, []);
  const us = (w) => {
    $(w), C.set("windowEffect", w), w === "none" ? (Effect.clear(), y.info("Window effect cleared")) : (Effect.apply(w, { color: "#0006" }), y.info("Window effect applied: %s", w));
  }, Fl = async () => {
    const w = is.trim().split("#");
    if (w.length !== 2 || !w[0] || !w[1]) {
      oa("格式错误，请输入: 名字#Tag");
      return;
    }
    oa("");
    try {
      const Me = await B.getSummonerByRiotId(w[0], w[1]);
      if (!(Me != null && Me.puuid)) {
        oa("未找到该召唤师");
        return;
      }
      Yl(Me.puuid), Ju(`${w[0]}#${w[1]}`), Tl(!0);
    } catch {
      oa("查询失败，请检查名字和Tag是否正确");
    }
  };
  return /* @__PURE__ */ u.jsxs("div", { className: "sona-settings", children: [
    /* @__PURE__ */ u.jsx("h2", { className: "sona-settings-title", children: "工具" }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "战绩查询", children: [
      /* @__PURE__ */ u.jsx("p", { className: "sona-subtitle", style: { marginBottom: 10 }, children: "输入召唤师名#Tag 查询任意玩家的近期战绩。" }),
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { alignItems: "flex-end", gap: 8 }, children: [
        /* @__PURE__ */ u.jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ u.jsx(
          Nt,
          {
            value: is,
            onChange: (w) => {
              Vu(w), oa("");
            },
            onKeyDown: (w) => {
              w.key === "Enter" && Fl();
            },
            placeholder: "名字#Tag (例:丨一疾风剑豪一丨#77772)"
          }
        ) }),
        /* @__PURE__ */ u.jsx(J, { variant: "primary", onClick: Fl, children: "查询战绩" })
      ] }),
      ss && /* @__PURE__ */ u.jsx("p", { className: "sona-subtitle", style: { color: "#e74c3c", marginTop: 6 }, children: ss })
    ] }),
    /* @__PURE__ */ u.jsx(
      ls,
      {
        open: Jl,
        onClose: () => Tl(!1),
        puuid: Aa,
        playerName: xl
      }
    ),
    /* @__PURE__ */ u.jsxs(Qe, { title: "对局相关", children: [
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "自动接受对局",
          description: "匹配到对局时自动点击接受，再也不会错过。",
          children: /* @__PURE__ */ u.jsx(
            lt,
            {
              checked: s,
              onChange: (w) => {
                c(w), C.set("autoAcceptMatch", w);
              }
            }
          )
        }
      ),
      s && /* @__PURE__ */ u.jsx(
        He,
        {
          title: "自动接受的随机延迟",
          description: "在区间内随机延迟后再接受（上限 15000ms）。",
          children: /* @__PURE__ */ u.jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ u.jsx("div", { style: { width: 80 }, children: /* @__PURE__ */ u.jsx(
              Nt,
              {
                value: d,
                onChange: (w) => {
                  const Me = w.replace(/[^\d]/g, "");
                  r(Me);
                  const aa = parseInt(Me, 10);
                  C.set("autoAcceptDelayMin", Number.isFinite(aa) ? aa : 0);
                },
                placeholder: "最小"
              }
            ) }),
            /* @__PURE__ */ u.jsx("span", { style: { color: "#a09b8c", fontSize: 13 }, children: "—" }),
            /* @__PURE__ */ u.jsx("div", { style: { width: 80 }, children: /* @__PURE__ */ u.jsx(
              Nt,
              {
                value: m,
                onChange: (w) => {
                  const Me = w.replace(/[^\d]/g, "");
                  h(Me);
                  const aa = parseInt(Me, 10);
                  C.set("autoAcceptDelayMax", Number.isFinite(aa) ? aa : 0);
                },
                placeholder: "最大"
              }
            ) }),
            /* @__PURE__ */ u.jsx("span", { style: { color: "#a09b8c", fontSize: 13 }, children: "毫秒" })
          ] })
        }
      ),
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "大乱斗无CD换英雄",
          description: "移除共享池英雄的切换冷却限制，随时换取心仪英雄。",
          children: /* @__PURE__ */ u.jsx(
            lt,
            {
              checked: Q,
              onChange: (w) => {
                ee(w), C.set("benchNoCooldown", w);
              }
            }
          )
        }
      ),
      /* @__PURE__ */ u.jsxs(
        He,
        {
          title: "分析友方战力",
          description: "进入英雄选择时，自动分析队友近期战绩并发送到队伍聊天框。",
          children: [
            /* @__PURE__ */ u.jsx(
              Wt,
              {
                value: String(se),
                onChange: (w) => {
                  A(Number(w)), C.set("analyzeTeamPowerFetchCount", Number(w));
                },
                options: [
                  { value: "20", label: "近20局" },
                  { value: "50", label: "近50局" },
                  { value: "100", label: "近100局" }
                ]
              }
            ),
            /* @__PURE__ */ u.jsx(
              Wt,
              {
                value: G,
                onChange: (w) => {
                  ce(w), C.set("analyzeTeamPowerMsgType", w);
                },
                options: [
                  { value: "celebration", label: "自己可见" },
                  { value: "chat", label: "全队可见" }
                ]
              }
            ),
            /* @__PURE__ */ u.jsx(
              lt,
              {
                checked: D,
                onChange: (w) => {
                  H(w), C.set("analyzeTeamPower", w);
                }
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ u.jsxs(
        He,
        {
          title: "红蓝方提示",
          description: "进入英雄选择时，在聊天框提示本局是蓝方还是红方。",
          children: [
            /* @__PURE__ */ u.jsx(
              Wt,
              {
                value: Je,
                onChange: (w) => {
                  De(w), C.set("sideIndicatorMsgType", w);
                },
                options: [
                  { value: "celebration", label: "自己可见" },
                  { value: "chat", label: "全队可见" }
                ]
              }
            ),
            /* @__PURE__ */ u.jsx(
              lt,
              {
                checked: fe,
                onChange: (w) => {
                  ve(w), C.set("sideIndicator", w);
                }
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ u.jsxs(
        He,
        {
          title: "英雄选择阶段增强",
          description: "英雄选择时显示粒子特效，底部自动显示本模式近期胜率和KDA，点击队友头像可查询近期战绩。",
          children: [
            /* @__PURE__ */ u.jsx(
              Wt,
              {
                value: String(I),
                onChange: (w) => {
                  K(Number(w)), C.set("champSelectAssistFetchCount", Number(w));
                },
                options: [
                  { value: "20", label: "近20局" },
                  { value: "50", label: "近50局" },
                  { value: "100", label: "近100局" }
                ]
              }
            ),
            /* @__PURE__ */ u.jsx(
              lt,
              {
                checked: de,
                onChange: (w) => {
                  W(w), C.set("champSelectAssist", w);
                }
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "平衡性调整buff提示",
          description: "游玩特定模式（大乱斗、无限火力）时，鼠标悬停在英雄头像上，显示对应的平衡性数值调整。",
          children: /* @__PURE__ */ u.jsx(
            lt,
            {
              checked: le,
              onChange: (w) => {
                ne(w), C.set("balanceBuffTooltip", w);
              }
            }
          )
        }
      ),
      /* @__PURE__ */ u.jsxs(
        He,
        {
          title: "全局战力分析弹窗",
          description: "进入游戏后，自动弹窗展示双方队伍战力分析，包括胜率、KDA、段位、开黑分组。",
          children: [
            /* @__PURE__ */ u.jsx(
              Wt,
              {
                value: String(V),
                onChange: (w) => {
                  P(Number(w)), C.set("gameAnalysisFetchCount", Number(w));
                },
                options: [
                  { value: "20", label: "近20局" },
                  { value: "50", label: "近50局" },
                  { value: "100", label: "近100局" }
                ]
              }
            ),
            /* @__PURE__ */ u.jsx(
              lt,
              {
                checked: Xe,
                onChange: (w) => {
                  X(w), C.set("gameAnalysisPopup", w);
                }
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ u.jsxs(
        He,
        {
          title: "对局结束自动返回房间",
          description: "对局结束后自动返回房间，省去手动操作。可选择自动排队或仅返回房间。",
          children: [
            /* @__PURE__ */ u.jsx(
              Wt,
              {
                value: he,
                onChange: (w) => {
                  Ee(w), C.set("autoReturnMode", w);
                },
                options: [
                  { value: "queue", label: "自动排队" },
                  { value: "lobby", label: "仅返回房间" }
                ]
              }
            ),
            /* @__PURE__ */ u.jsx(
              lt,
              {
                checked: j,
                onChange: (w) => {
                  F(w), C.set("autoReturnToLobby", w);
                }
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "对局结束自动点赞",
          description: "对局结束后，随机给队友点赞，再也不用手点啦。",
          children: /* @__PURE__ */ u.jsx(
            lt,
            {
              checked: ua,
              onChange: (w) => {
                ea(w), C.set("autoHonor", w);
              }
            }
          )
        }
      ),
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "秒抢英雄",
          description: "进入可选英雄的模式时，轮到自己自动秒锁指定英雄。大乱斗等无需选人的模式不受影响。",
          children: /* @__PURE__ */ u.jsx(
            lt,
            {
              checked: Xa,
              onChange: (w) => {
                bt(w), C.set("autoLockChampion", w);
              }
            }
          )
        }
      ),
      Xa && /* @__PURE__ */ u.jsxs("div", { style: { padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }, children: [
        /* @__PURE__ */ u.jsx("div", { className: "sona-debug-actions", style: { alignItems: "flex-start", gap: 8 }, children: /* @__PURE__ */ u.jsxs("div", { style: { flex: 1, position: "relative" }, ref: Bt, children: [
          /* @__PURE__ */ u.jsx(
            Nt,
            {
              value: nt,
              onChange: (w) => {
                Cl(w);
                const Me = Yg(w);
                it(Me), mt(Me.length > 0);
              },
              placeholder: "输入英雄名/称号搜索 (如: 亚索)"
            }
          ),
          Ut && Ka.length > 0 && /* @__PURE__ */ u.jsx("div", { className: "sona-champ-suggest", children: Ka.map((w) => /* @__PURE__ */ u.jsxs(
            "button",
            {
              className: "sona-champ-suggest-item",
              type: "button",
              onClick: () => {
                Cl(`${w.title} ${w.name}`), C.set("autoLockChampionId", w.id), mt(!1), y.info("[AutoLock] 目标英雄已设置: %s %s (ID: %d)", w.title, w.name, w.id);
              },
              children: [
                /* @__PURE__ */ u.jsx("img", { className: "sona-champ-suggest-icon", src: `/lol-game-data/assets/v1/champion-icons/${w.id}.png`, alt: "" }),
                /* @__PURE__ */ u.jsx("span", { className: "sona-champ-suggest-title", children: w.title }),
                /* @__PURE__ */ u.jsx("span", { className: "sona-champ-suggest-name", children: w.name })
              ]
            },
            w.id
          )) })
        ] }) }),
        /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { gap: 8 }, children: [
          /* @__PURE__ */ u.jsxs(
            J,
            {
              variant: Lt ? "primary" : void 0,
              onClick: () => {
                ta(!0), C.set("autoLockInstant", !0);
              },
              children: [
                "秒选并锁定",
                Lt ? " ✓" : ""
              ]
            }
          ),
          /* @__PURE__ */ u.jsxs(
            J,
            {
              variant: Lt ? void 0 : "primary",
              onClick: () => {
                ta(!1), C.set("autoLockInstant", !1);
              },
              children: [
                "仅预选",
                Lt ? "" : " ✓"
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "社交", children: [
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "解锁自定义签名",
          description: "移除客户端对签名编辑的禁用限制，可自由修改个人签名。",
          children: /* @__PURE__ */ u.jsx(
            lt,
            {
              checked: v,
              onChange: (w) => {
                T(w), C.set("unlockStatus", w);
              }
            }
          )
        }
      ),
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "解锁在线状态切换",
          description: "接管客户端的状态按钮，支持切换至隐身、手机在线等客户端默认不提供的状态。",
          children: /* @__PURE__ */ u.jsx(
            lt,
            {
              checked: S,
              onChange: (w) => {
                p(w), C.set("unlockAvailability", w);
              }
            }
          )
        }
      ),
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "解锁炫彩分页（国服）",
          description: "在生涯藏品页恢复被隐藏的「炫彩」子分页。修改开关后需要重启客户端才能生效。",
          children: /* @__PURE__ */ u.jsx(
            lt,
            {
              checked: z,
              onChange: (w) => {
                E(w), C.set("unlockChromas", w);
              }
            }
          )
        }
      ),
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "卸下头像边框",
          description: "移除头像框装饰，恢复干净的头像展示。(需召唤兽等级>=525)",
          children: /* @__PURE__ */ u.jsx(J, { onClick: async () => {
            try {
              await fetch("/lol-regalia/v2/current-summoner/regalia", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ preferredCrestType: "prestige", preferredBannerType: "blank", selectedPrestigeCrest: 0 })
              }), y.info("头像边框已卸下 ✓");
            } catch (w) {
              y.error("卸下头像边框失败:", w);
            }
          }, children: "卸下" })
        }
      ),
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "自定义生涯背景",
          description: "增强修改生涯背景弹窗，可以选择任意皮肤作为生涯背景。",
          children: /* @__PURE__ */ u.jsx(
            lt,
            {
              checked: Qa,
              onChange: (w) => {
                ga(w), C.set("customProfileBg", w);
              }
            }
          )
        }
      ),
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "开黑好友标记",
          description: "开黑中的好友用同样颜色标记，看看谁在偷偷开黑！",
          children: /* @__PURE__ */ u.jsx(
            lt,
            {
              checked: Pt,
              onChange: (w) => {
                _t(w), C.set("friendSmartGroup", w);
              }
            }
          )
        }
      )
    ] }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "界面", children: [
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "隐藏首页云顶之弈",
          description: "隐藏顶部导航栏的云顶之弈入口。",
          children: /* @__PURE__ */ u.jsx(
            lt,
            {
              checked: re,
              onChange: (w) => {
                ae(w), C.set("hideTFT", w);
              }
            }
          )
        }
      ),
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "隐藏右侧导航文字",
          description: "隐藏主页顶部右侧导航栏的文字标签，仅保留图标，界面更简洁。",
          children: /* @__PURE__ */ u.jsx(
            lt,
            {
              checked: ye,
              onChange: (w) => {
                Y(w), C.set("hideRightNavText", w);
              }
            }
          )
        }
      ),
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "窗口特效",
          description: "为客户端窗口添加毛玻璃等视觉效果。Win10 拖动窗口时可能卡顿。但实际测试下来好像没啥效果？",
          children: /* @__PURE__ */ u.jsx("div", { style: { minWidth: 130 }, children: /* @__PURE__ */ u.jsx(
            Wt,
            {
              options: fy,
              value: Z,
              onChange: us
            }
          ) })
        }
      )
    ] }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "段位伪装", children: [
      /* @__PURE__ */ u.jsx("p", { className: "sona-subtitle", style: { marginBottom: 10 }, children: "伪装好友列表中显示的段位信息，仅影响聊天名片展示，不影响生涯页面。" }),
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { alignItems: "center" }, children: [
        /* @__PURE__ */ u.jsx("div", { style: { minWidth: 140 }, children: /* @__PURE__ */ u.jsx(
          Wt,
          {
            options: [
              { value: "RANKED_SOLO_5x5", label: "单排/双排" },
              { value: "RANKED_FLEX_SR", label: "灵活组排" },
              { value: "RANKED_FLEX_TT", label: "灵活 3v3" },
              { value: "RANKED_TFT", label: "云顶之弈" },
              { value: "RANKED_TFT_DOUBLE_UP", label: "云顶双人" },
              { value: "RANKED_TFT_TURBO", label: "云顶激斗" }
            ],
            value: At,
            onChange: pa
          }
        ) }),
        /* @__PURE__ */ u.jsx("div", { style: { minWidth: 130 }, children: /* @__PURE__ */ u.jsx(
          Wt,
          {
            options: [
              { value: "CHALLENGER", label: "最强王者" },
              { value: "GRANDMASTER", label: "傲世宗师" },
              { value: "MASTER", label: "超凡大师" },
              { value: "DIAMOND", label: "璀璨钻石" },
              { value: "EMERALD", label: "流光翡翠" },
              { value: "PLATINUM", label: "华贵铂金" },
              { value: "GOLD", label: "荣耀黄金" },
              { value: "SILVER", label: "不屈白银" },
              { value: "BRONZE", label: "英勇青铜" },
              { value: "IRON", label: "坚韧黑铁" }
            ],
            value: ya,
            onChange: El
          }
        ) }),
        /* @__PURE__ */ u.jsx("div", { style: { minWidth: 80 }, children: /* @__PURE__ */ u.jsx(
          Wt,
          {
            options: [
              { value: "I", label: "I" },
              { value: "II", label: "II" },
              { value: "III", label: "III" },
              { value: "IV", label: "IV" }
            ],
            value: va,
            onChange: $t
          }
        ) }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => {
          C.set("rankQueue", At), C.set("rankTier", ya), C.set("rankDivision", va), C.set("rankDisguise", !0);
        }, children: "应用" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => {
          C.set("rankDisguise", !1);
        }, children: "恢复" })
      ] })
    ] }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "回放", children: [
      /* @__PURE__ */ u.jsx("p", { className: "sona-subtitle", style: { marginBottom: 10 }, children: "输入 Game ID 下载并观看对局回放。可从战绩面板复制 Game ID。" }),
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { alignItems: "flex-end", gap: 8 }, children: [
        /* @__PURE__ */ u.jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ u.jsx(
          Nt,
          {
            value: Rt,
            onChange: (w) => {
              pt(w), Ze("idle");
            },
            placeholder: "输入 Game ID..."
          }
        ) }),
        /* @__PURE__ */ u.jsx(
          J,
          {
            onClick: async () => {
              const w = Number(Rt);
              if (w) {
                Ze("downloading");
                try {
                  const Me = await fetch(`/lol-replays/v1/metadata/${w}`);
                  if (!Me.ok) {
                    y.error("[Replay] 获取元数据失败:", Me.status), Ze("error");
                    return;
                  }
                  const aa = await Me.json();
                  if (aa.state === "watch") {
                    Ze("launching");
                    const ba = await fetch(`/lol-replays/v1/rofls/${w}/watch`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ componentType: "replay", contextData: "match-history" })
                    });
                    Ze(ba.ok ? "ready" : "error"), ba.ok ? y.info("[Replay] 开始播放 #%d ✓", w) : y.error("[Replay] 播放失败:", await ba.text());
                    return;
                  }
                  aa.state !== "downloading" && await fetch(`/lol-replays/v1/rofls/${w}/download`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ componentType: "replay", contextData: "match-history" })
                  });
                  for (let ba = 0; ba < 30; ba++) {
                    await new Promise((Sa) => setTimeout(Sa, 2e3));
                    const Vn = await fetch(`/lol-replays/v1/metadata/${w}`);
                    if (!Vn.ok) continue;
                    const Wl = await Vn.json();
                    if (y.info("[Replay] 下载中... %d%%", Wl.downloadProgress), Wl.state === "watch") {
                      Ze("launching");
                      const Sa = await fetch(`/lol-replays/v1/rofls/${w}/watch`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ componentType: "replay", contextData: "match-history" })
                      });
                      Ze(Sa.ok ? "ready" : "error"), Sa.ok ? y.info("[Replay] 下载完成，开始播放 #%d ✓", w) : y.error("[Replay] 播放失败:", await Sa.text());
                      return;
                    }
                  }
                  y.warn("[Replay] 等待超时"), Ze("error");
                } catch (Me) {
                  y.error("[Replay] 异常:", Me), Ze("error");
                }
              }
            },
            children: { idle: "▶ 观看回放", downloading: "⏳ 下载中...", ready: "✓ 已启动", launching: "🚀 启动中...", error: "✗ 重试" }[ca]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "设置备份", children: [
      /* @__PURE__ */ u.jsx("p", { className: "sona-subtitle", style: { marginBottom: 10 }, children: "备份当前客户端设置（快捷键、界面布局等），支持多个命名存档。" }),
      /* @__PURE__ */ u.jsx(my, {})
    ] })
  ] });
}
const gy = [
  { value: "F1", label: "F1" },
  { value: "F2", label: "F2" },
  { value: "F3", label: "F3" },
  { value: "F4", label: "F4" },
  { value: "F5", label: "F5" }
];
function py() {
  const [s, c] = U.useState(C.get("developerMode")), [d, r] = U.useState(C.get("hotkey")), [m, h] = U.useState(C.get("globalParticle"));
  return U.useEffect(() => {
    const v = [
      C.onChange("developerMode", c),
      C.onChange("hotkey", r),
      C.onChange("globalParticle", h)
    ];
    return () => v.forEach((T) => T());
  }, []), /* @__PURE__ */ u.jsxs("div", { className: "sona-settings", children: [
    /* @__PURE__ */ u.jsx("h2", { className: "sona-settings-title", children: "设置" }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "通用", children: [
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "面板快捷键",
          description: "随时按下快捷键打开/关闭 Sona 面板。",
          children: /* @__PURE__ */ u.jsx(
            Wt,
            {
              options: gy,
              value: d,
              onChange: (v) => {
                r(v), C.set("hotkey", v);
              }
            }
          )
        }
      ),
      /* @__PURE__ */ u.jsx(
        He,
        {
          title: "全局粒子美化",
          description: "为客户端添加星光粒子背景效果 ✨",
          children: /* @__PURE__ */ u.jsx(
            lt,
            {
              checked: m,
              onChange: (v) => {
                h(v), C.set("globalParticle", v);
              }
            }
          )
        }
      )
    ] }),
    /* @__PURE__ */ u.jsx(Qe, { title: "高级选项", children: /* @__PURE__ */ u.jsx(
      He,
      {
        title: "开发者模式",
        description: "启用调试面板，你最好知道你在做什么 ( ˘•ω•˘ )◞⚠",
        children: /* @__PURE__ */ u.jsx(
          lt,
          {
            checked: s,
            onChange: (v) => {
              c(v), C.set("developerMode", v);
            }
          }
        )
      }
    ) })
  ] });
}
function fr({ icon: s, label: c, value: d }) {
  return /* @__PURE__ */ u.jsxs("div", { className: "sona-hex-card", children: [
    /* @__PURE__ */ u.jsx("span", { className: "sona-hex-card-icon", children: s }),
    /* @__PURE__ */ u.jsxs("div", { className: "sona-hex-card-text", children: [
      /* @__PURE__ */ u.jsx("span", { className: "sona-hex-card-label", children: c }),
      /* @__PURE__ */ u.jsx("span", { className: "sona-hex-card-value", children: d })
    ] })
  ] });
}
function yy() {
  return /* @__PURE__ */ u.jsxs("div", { className: "sona-about", children: [
    /* @__PURE__ */ u.jsxs("div", { className: "sona-about-header", children: [
      /* @__PURE__ */ u.jsx("h2", { className: "sona-about-title", children: "Sona" }),
      /* @__PURE__ */ u.jsxs("span", { className: "sona-about-version", children: [
        "v",
        "1.1.0"
      ] })
    ] }),
    /* @__PURE__ */ u.jsx("p", { className: "sona-about-desc", children: "Sona 是一款基于 React + Vite 构建的英雄联盟客户端增强插件，运行在 Pengu Loader 之上，提供丰富的自定义功能。" }),
    /* @__PURE__ */ u.jsxs("div", { className: "sona-about-row", children: [
      /* @__PURE__ */ u.jsxs("div", { className: "sona-about-cards", children: [
        /* @__PURE__ */ u.jsx(fr, { icon: /* @__PURE__ */ u.jsx(q1, {}), label: "插件", value: "Sona v1.1.0" }),
        /* @__PURE__ */ u.jsx(fr, { icon: /* @__PURE__ */ u.jsx(L1, {}), label: "框架", value: "React + Vite" }),
        /* @__PURE__ */ u.jsx(
          fr,
          {
            icon: /* @__PURE__ */ u.jsx(B1, {}),
            label: "加载器",
            value: `Pengu Loader ${typeof Pengu < "u" ? Pengu.version : "1.1.6"}`
          }
        )
      ] }),
      /* @__PURE__ */ u.jsxs("div", { className: "sona-about-section sona-about-tech", children: [
        /* @__PURE__ */ u.jsx("h3", { className: "sona-about-section-title", children: "技术栈" }),
        /* @__PURE__ */ u.jsxs("ul", { className: "sona-about-list", children: [
          /* @__PURE__ */ u.jsx("li", { children: "React 19 + TypeScript" }),
          /* @__PURE__ */ u.jsx("li", { children: "Vite 6" }),
          /* @__PURE__ */ u.jsx("li", { children: "Pengu Loader v1.1.0+" }),
          /* @__PURE__ */ u.jsx("li", { children: "LCU REST API + WebSocket" })
        ] }),
        /* @__PURE__ */ u.jsxs(
          "a",
          {
            className: "sona-hex-card sona-hex-card-link",
            href: "https://github.com/WJZ-P/sona",
            target: "_blank",
            rel: "noopener noreferrer",
            children: [
              /* @__PURE__ */ u.jsx("span", { className: "sona-hex-card-icon", children: /* @__PURE__ */ u.jsx(Y1, {}) }),
              /* @__PURE__ */ u.jsxs("div", { className: "sona-hex-card-text", children: [
                /* @__PURE__ */ u.jsx("span", { className: "sona-hex-card-label", children: "GitHub" }),
                /* @__PURE__ */ u.jsx("span", { className: "sona-hex-card-value", children: "WJZ-P/sona" })
              ] })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ u.jsxs("div", { className: "sona-about-section", children: [
      /* @__PURE__ */ u.jsx("h3", { className: "sona-about-section-title", children: "开源协议" }),
      /* @__PURE__ */ u.jsx("p", { className: "sona-about-text", children: "AGPL-3.0" })
    ] }),
    /* @__PURE__ */ u.jsx("div", { className: "sona-about-quote", children: "Made by WJZ_P with love ❤." })
  ] });
}
class vy {
  constructor() {
    Ve(this, "tasks", /* @__PURE__ */ new Set());
    Ve(this, "observer", null);
    Ve(this, "isThrottled", !1);
  }
  /**
   * 注册一个新的注入任务
   * 注册后立即尝试执行一次
   */
  register(c) {
    this.tasks.add(c);
    try {
      c();
    } catch (d) {
      y.error("[Injector] Task failed on register:", d);
    }
  }
  /**
   * 取消注册一个注入任务
   */
  unregister(c) {
    this.tasks.delete(c);
  }
  /**
   * 启动全局 DOM 守护者
   * 只会启动一次，重复调用无效
   */
  start() {
    this.observer || (y.info("[Injector] Starting global DOM observer..."), this.observer = new MutationObserver(() => {
      this.isThrottled || (this.isThrottled = !0, requestAnimationFrame(() => {
        for (const c of this.tasks)
          try {
            c();
          } catch (d) {
            y.error("[Injector] Task failed:", d);
          }
        this.isThrottled = !1;
      }));
    }), this.observer.observe(document.body, {
      childList: !0,
      subtree: !0
    }));
  }
  /**
   * 停止全局守护（一般不需要调用）
   */
  stop() {
    this.observer && (this.observer.disconnect(), this.observer = null, y.info("[Injector] Global DOM observer stopped"));
  }
}
const qe = new vy(), ha = (s) => new Promise((c) => setTimeout(c, s)), Ay = "data:image/png;base64,UklGRlIBAABXRUJQVlA4TEUBAAAvDUADENW4qbZtWWhJDUZm+ujoTO7u9sn7Sw6swr38MwVI8Bd4V4Zt20YO3X8WHbdtJEmTf6yUZ2bv/UEVANB0NdtsN85b9RaNvGr8gh2VnWxvzQ0P0e8LGH0mgK9Hm2W3yK9q/4jzsgDdTW30aTUufRduthxX6Xub/lDBwvXAbqvh+TLYodGFvCsXAO56cvmxnE7aB/xf8yiAIB0TPJB/P8hLHUNAwEsAr7eJDB+J8HweEsB4s7uAXwC/+p2cfXUE4PnQR7xP65JZ1jGCzj/JVbca0N+X2DJz0j1Bb3Nc9ZoItwKUvf7IwU4uz7nrgVqunOUvEd4EeeY4YNvWcro7FQQUv5Oxr06aBACPk21rpuq4HAXBusIeoOpVpPidGMNGVYUSbCr+V6G/LxQshmQYqwp12JXWkw2IWNgA61CEUEBGsPMtAA==", by = "data:image/png;base64,UklGRiIBAABXRUJQVlA4TBYBAAAvDUADEPVArW3rWdR/l6S3KeSHHi4ZCkCPyzJPJfGzoz/5W7Np2+bmKG2pgraNHP5Mf7g3GEARAIBgNNtrtm32Nb7Bi7a93QdsxqvqRrLdbKdYwinO13CJzcIUnOAL29hauX7DmUpI7bqYQi6mQBkWU5DvQIip9j75BYKLFCJIIg1PbaBZDDCWcdDeM+Ifc9jBB9xJ9cOxj72GjbygL1CMeYZsfgeE3csNLqqBKQpBJIEFx8K2LChunzCPv2p4ARldaKHBFS6rQUDVMYseDFeDzuEHpw0PsAeFjiLo1eAVFrp8Yhy9oAQOvOFacBJMdlQKVAIMGvjpCCVB+L+P8CKAm447BDNAgCm89I5nTICXtcPXbTXKDA==", Sy = "data:image/png;base64,UklGRu4AAABXRUJQVlA4TOEAAAAvDUADEBq4sW27avovlNUIpoYd40KX3RmQl0KvRCCQ+NPeBo+WhhsAAMEmtm2NWY3JNk5wstms7QPs7r3ANl6w3U5ARQfH2EdBRS8zBFc98p8/1LQoME7wmkiCKrYNv6iIGu7whh+8YurE/neuD385yQaXucZjPnCGAQ7OWprZw3NCexx+8XeG37cbLcITw0ff1FDyOTeGKKWRVUb/W2b78IuKyOAjXxy/gl1zoyZyeX8h+eOjopjBKwvc5+6Nv9zmAZOtZGtWsmcVhdTSz2e+036kaFWRuX0htg1J5DxXiS4A", Ey = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAB4UExURUdwTPDn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0/Dn0zE5cgoAAAAndFJOUwBjAgGA7/sDBGKic502DjGcctR1BlfNMDpUD9cLyF39blZgCMteycoVKjcAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABjSURBVAjXXY9HEsIwFEMfabYpqfSWAkT3vyELZwFfO400KgB4uhrHAsdKeUYamSfoclaDj1rQ8349aUsSnROPmz8UGxwEfXhLx32lDAaNr1l9obbc5WtLjdlG/RfZGXbk74UvTVAKbSM7BuAAAAAASUVORK5CYII=", Cy = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAACXBIWXMAAA7CAAAOwgEVKEqAAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAFWSURBVHjanNGxahRRFAbgm13T2Kyk1NZWBMFOlFRCwMrSyhdInsBX8E32CcTOVsh/iG8w/1EiO/+fIhCSzYzFvZmdWObCuTBwPs7575RxHMtDql7tmJjX0onixAcRazEOxChiLO7BvosJiVg6o5g4dMZGGaMyvomxEmM3se+iiFGcUUQsVfFLE+fOGE1cTzhjNcHWOEcvTPxpaKuM0RkVE+sJtkmLvovSd/FMxC/Xpq0r2tbvOFfi/XziXt+h9B2eztBNQ7eua0oZb52zjCJWSjwR8aM13aFhQsQ7E8WJ5QQ3PN038dyJSzGGBoa23sWEiEcboswznpnx2cSJE6MzbrSDVyLe1EeLhTL2dqsm1kp8dXdWnPgu1gfRXT7iVMRrJR73v3/ey3gk4qOIIxOvnHDDgzMGMW5FDE5ciPiyW5UxmLE1YzTxycTx/Df8l/nvBB9S/wYAuI1dHfraI7kAAAAASUVORK5CYII=", Ty = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAACXBIWXMAAA7CAAAOwgEVKEqAAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAHPSURBVHjanJJNa1NhEIUnt5SC4FJc6qYbK0V3pX9AFNGtKxXRjX/Chf+hCCouRFprEKlfIW7SLBSU5t7zhuJXNr29522a3N4ZJbqxzeuiaUzc6eIwcxge5gyMhBDkfyQhBFFiV4kwqAfaG2jUByV2h2CRJceVeKZEvciSaSVOKzGjxEklThVMppV4q0S5yJJjfzZ6iHpcUOLT4psXYt7dNu9em3cVI27l2ftIiS9KnFNiLGopbLdFPZpKXDLirHoXjAhKd0aJy0qsfdtqihLREDSPyDzEPC4akRkxZcRdJRaUmFI6Gt15oxOjGwEJMe8i807M46F5rNhmMrGTJZERL5Xuwf7MRWNRjRD1rmTeiRJlJWrqndiWEyXq6vF4AJbUuzEwMjpR4oYSbaU7ovtelDiqREeJq+qdqB+JGkKQnSw+rIQvsuR6r7MurebqZKu5OtnrrEtB3FQiy9PGob8fQJS4Zt59DiHI3k/K9+2P0stb8utHW0IIE+bdVyWujN34dPHOTDdtVLsbjXcrT+7N1qvL87XK0lytsjRXry7PPy/fn83Txofuxtqr8qOFE0MwT+OgRL/I0M/TuJ9vxiFP436exuGgH5mHsRv/Vb8HALH3T81RJ032AAAAAElFTkSuQmCC", xy = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAACXBIWXMAAA7CAAAOwgEVKEqAAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAGSSURBVHjanJExa9RREMQ3F0QLISpIakUhpLAXQSHYWCgoaKGFhHRWfhALxUrwE1imURsbS+X4zyZCCgNKbjaHXDJ7l0LRO5/FvZj/tXkwvLfFj5l5a6UUO46slGIZ/q3qe723RfQUWBVhIuYUsMPzHxSx0tJNEfcz/KoCixl+RdGYorGD3bAMzIDvRbwT8VbEuohl9fyUiK0kfJ+NjfvbJmJun5iJ+iLDn2f4GwWeKHBOBJIoSX9Q485nwBRYaIMrGX5ttPvFMnwhwz+LKCLu7O00J9XD6QovKfzVEUjviv5UxBkRGxW6JeKSiB9JdDN8XcRQ9M1WRzfRz4ro5hS6LeKyiEGGlwyfiJjU98f25yxOIS9Jv5uBiwoMRC8KjJM+yfBfIkoGnrU6TuNl+MPa5XpO50mG/1X4uLr1k7jQdvydxCPR7Sc3bEicT/qBwovC/9SoRcRjcXaP9xQwhZ+ojjcyDh1RRIxErGW4ZaDTBk1ER4Mty80PJuKl6F9FfMrAaxHLo77bMLyzt9McOR5H/wYABmNXd0d0o0wAAAAASUVORK5CYII=", ky = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAACXBIWXMAAA7CAAAOwgEVKEqAAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAG6SURBVHjaVJKxapRREIVn/4hgIRs1gohgo4WgL2AlCCKo+Ai+gL2dINjZWGkjFna+gLVWQWGXnImIRYS42TNEjf8ZQxRcw16L/+5PcmG4F+bOPd+cuWZmlgHLgIkYiDAR50XcEXGzxu2f07WBiNMiroow6wrdWsLiy8i+b46XRKyKKCJmdX+T4SbikegbmvrQWrrtTNZNxFJVuyeiZPh+hs8VKBm4LOKi6H8zvIh4ZkmYoo8jIj7V5KzuLzLckn4p6Xcz/EbSr9v25KMl0WSndj+Jok6tiPgl4kIlGdjBlXQT3UScVPh2dmgz0YuI58l1E3056ccy/IyI43v8bJbhTW38cVX5k+H/OlN8L8N3M7ytubcizoowqxhXRPzO8JL0ueglw+cZKEnfr85+EHGqx66HayKeZPhDBR5k+Ov6yMLF9yKWtbVmIpp+jmZmbcCS3nQ942nSiwJFxGqGn8twU6BR91F61EbE0XYysuri7qKnlhj+mIxNRJOBbnz0Tm1nc9yblOG3atE7ESvtFkzsc3YIU8RBd1+J2FBg5QBNd2eKQ6Nc4JqIEyJetsTw29dRLermnAu8uv4PALICHRChyaA4AAAAAElFTkSuQmCC", My = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAADkUExURUdwTPDm0u/m0+/m0u/m0u/m0u/m0u/m0u/m0u/m0u/m0u/m0+/m0u/m0u/m0u/m0+/m0u/m0u/m0+/m0u/m0u/m0u/m0u/m0vDm0u/m0u/m0+/m0u/m0u/m0u/m0u/n0+/m0u/m0u/m0+/m0/Dm0u/n0u/m0u/m0u/m0u/n0+/m0u/m0u/m0u/m0u/m0+/m0+/m0u/m0u/m0u/m0u/m0u/m0u/m0u/m0u/m0u7j0+/m0u3j0+/m0vDm0u/m0u/m0u/l0+/m0u/m0u/m0u/m0vDn0/Dm0vDm0+/m0+/n0vDn0u/m0uooK2UAAABFdFJOUwCEBNEFHvIEpTZN/KjbeeE74GAcokoboSAlrNl3/d7pHySrEC78ON3iKezSngM4xvvf8cMzXIAMMgEQAZ+zCIgDXqY+hSBjQloAAAAJcEhZcwAADsIAAA7CARUoSoAAAACCSURBVAgdLcEFAoJQEAXAp4KA3d3d3V2Ldf/7uC5/Bo6RBeB+PkFkxnMdu6P3ir964PM115vD7QHmdvmJJittu7+AxbzEZksIK0xiugAz0jYJezAEoLdJyacANHqklLsAKiVSgnEAmvkmR8IAi3RIRFsQvn7x+Wp6klCyoVytUAX7AXh1Gh7Rr6e3AAAAAElFTkSuQmCC", Ny = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAACXBIWXMAAA7CAAAOwgEVKEqAAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAFiSURBVHjanJI9SmxREISPM0YG/iVvCQaCgiAYiAYKL3iYvlBwFSa6EHeggbgAUQNjxWpE3gKmWnmDUy0iis7cY3Cvd+4YGhSH0/RHVfc5KeecfqKUc05Byw0VQcsi+iI2w21TxIlos6Il0Vo1KOJPQ1sidkRbCGIlaI9yy3I7FW1KtKGjHEdyHMpxJOJAjukg5kR0wy0H8V7DblPNqGfhdhG0u3DbDmIuhlBfbjncSpg4bjpuiFgULfU69kvEbZRNH1FC/fJu/+X43ZyxEPG318GMiH8V1K+gQZQxJbe1cBvZ6qIckyIuq6Yvp6KGiPUgUjjaDRApiPlwvIhWVEBRxXuqIWL8kRhxHA9aCmI3HDncPjQE30SsikiiteQ2NuLYfbhLz53rVjjOxXIh+pqPuBGxLMdE7/4qfY/aqs6lcDxVcBFuhWgDEUVZx/4I+MqbFLR2+a2w13yGbzN3a/An+hwAFPptmYU9Y5wAAAAASUVORK5CYII=", Uy = {
  dmg_dealt: Ay,
  dmg_taken: by,
  healing: Sy,
  shielding: Ey,
  tenacity: Cy,
  ability_haste: Ty,
  attack_speed: xy,
  energy_regen: ky,
  mana_regen: My,
  movement_speed: Ny
}, Ry = {
  dmg_dealt: "造成伤害",
  dmg_taken: "承受伤害",
  healing: "治疗效果",
  shielding: "护盾效果",
  tenacity: "韧性",
  ability_haste: "技能急速",
  attack_speed: "成长攻速",
  energy_regen: "能量回复",
  mana_regen: "法力回复",
  movement_speed: "移动速度"
}, Dy = [
  "dmg_dealt",
  "dmg_taken",
  "healing",
  "shielding",
  "attack_speed",
  "ability_haste",
  "movement_speed",
  "tenacity",
  "mana_regen",
  "energy_regen"
];
function zy(s) {
  const c = s.toLowerCase();
  return c === "aram" || c === "kiwi" ? "aram" : c === "urf" || c === "arurf" ? "urf" : c === "oneforall" || c === "ofa" ? "ofa" : c === "nexusblitz" || c === "nb" ? "nb" : c === "cherry" || c === "arena" ? "ar" : c === "ultbook" || c === "usb" ? "usb" : null;
}
class wy {
  constructor(c) {
    Ve(this, "manager");
    Ve(this, "root");
    Ve(this, "container");
    Ve(this, "tooltip");
    Ve(this, "caption");
    Ve(this, "content");
    this.manager = c;
    const d = document.createElement("div");
    d.setAttribute("style", "position:absolute;top:0;left:0;width:0;height:0;overflow:visible;z-index:19001;"), this.root = d;
    const r = document.createElement("div");
    r.setAttribute("style", "position:absolute;opacity:0;pointer-events:none;transition:opacity 0.2s;"), d.appendChild(r), this.container = r;
    const m = document.createElement("lol-uikit-tooltip");
    m.setAttribute("data-tooltip-position", "right"), r.appendChild(m), this.tooltip = m;
    const h = document.createElement("div");
    h.setAttribute("style", "background:#1a1c21;direction:ltr;width:240px;font-family:var(--font-body);-webkit-font-smoothing:subpixel-antialiased;color:#a09b8c;font-size:12px;font-weight:400;letter-spacing:.025em;line-height:16px;"), m.appendChild(h);
    const v = document.createElement("div");
    v.setAttribute("style", "min-width:200px;padding:14px 18px;"), h.appendChild(v);
    const T = document.createElement("div");
    T.setAttribute("style", "margin-bottom:10px;color:#f0e6d2;font-size:13px;font-weight:700;letter-spacing:.075em;line-height:18px;text-transform:uppercase;border-bottom:1px solid #3c3c41;padding-bottom:6px;"), v.appendChild(T), this.caption = T;
    const S = document.createElement("div");
    v.appendChild(S), this.content = S;
  }
  show(c, d, r, m) {
    this.caption.textContent = r, this.content.innerHTML = m, this.root.isConnected || this.manager.appendChild(this.root), this.tooltip.setAttribute("data-tooltip-position", d);
    const h = c.getBoundingClientRect();
    let v = 0, T = 0;
    d === "right" ? (v = h.right + 5, T = h.bottom - (h.height + this.container.offsetHeight) / 2) : (T = h.bottom, v = h.right - (h.width + this.container.offsetWidth) / 2), this.container.style.left = `${v}px`, this.container.style.top = `${T}px`, this.container.style.opacity = "1";
  }
  hide() {
    this.container.style.opacity = "0";
  }
  destroy() {
    this.container.style.opacity = "0", this.root.remove();
  }
}
function Iy(s) {
  const c = (s - 1) * 100, d = parseFloat(c.toFixed(2)) + "%";
  return s >= 1 ? "+" + d : d;
}
function Fg(s) {
  return s === "ability_haste";
}
function jy(s, c) {
  return s === "dmg_taken" ? c < 1 : Fg(s) ? c >= 0 : c >= 1;
}
function Oy(s) {
  const c = [];
  for (const r of Dy) {
    const m = s[r];
    typeof m == "number" && c.push([r, m]);
  }
  return c.length === 0 ? '<div style="color:#746e64;font-style:italic;">无平衡调整（原版数值）</div>' : c.map(([r, m]) => {
    const h = Ry[r] ?? r, v = Uy[r], T = jy(r, m) ? "#5bbd72" : "#e84749", S = Fg(r) ? m >= 0 ? `+${m}` : `${m}` : Iy(m);
    return `
      <div style="display:flex;align-items:center;margin-bottom:4px;line-height:18px;">
        <span style="display:flex;align-items:center;flex:1;">
          ${v ? `<img src="${v}" width="14" height="14" alt="" style="margin-right:6px;vertical-align:middle;" />` : ""}<span>${h}</span>
        </span>
        <span style="color:${T};font-weight:bold;">${S}</span>
      </div>
    `;
  }).join("");
}
let Ha = null, Lu = [], Bu = [], Zl = null, wu = null, Li = null, Sr = !1;
function Fh(s) {
  var r;
  if (s <= 0 || !Zl) return null;
  const c = iy(s);
  if (!c) return null;
  const d = ((r = c.stats) == null ? void 0 : r[Zl.dataKey]) ?? {};
  return {
    champId: s,
    caption: `${Zl.displayName} · 平衡调整`,
    content: Oy(d)
  };
}
function Wh(s) {
  if (Zl) {
    if (Lu = [], Bu = [], Array.isArray(s.myTeam))
      for (let c = 0; c < s.myTeam.length; c++) {
        const d = s.myTeam[c], r = d.championPickIntent || d.championId, m = Fh(r);
        Lu[c] = m ?? { champId: 0, caption: "", content: "" };
      }
    if (s.benchEnabled && Array.isArray(s.benchChampions))
      for (let c = 0; c < s.benchChampions.length; c++) {
        const d = s.benchChampions[c], r = Fh(d.championId);
        Bu[c] = r ?? { champId: 0, caption: "", content: "" };
      }
  }
}
const Ln = "data-sona-balance-hover";
function Wg() {
  if (!Ha || !Zl) return !0;
  const s = document.querySelector(".summoner-array.your-party");
  return s && s.querySelectorAll(".summoner-container-wrapper").forEach((r, m) => {
    r.hasAttribute(Ln) || (r.setAttribute(Ln, "team"), r.addEventListener("mouseenter", () => {
      const h = Lu[m];
      h && h.champId > 0 && Ha.show(r, "right", h.caption, h.content);
    }), r.addEventListener("mouseleave", () => Ha.hide()));
  }), document.querySelectorAll(".bench-container .champion-bench-item").forEach((d, r) => {
    d.hasAttribute(Ln) || (d.setAttribute(Ln, "bench"), d.addEventListener("mouseenter", () => {
      const m = Bu[r];
      m && m.champId > 0 && Ha.show(d, "bottom", m.caption, m.content);
    }), d.addEventListener("mouseleave", () => Ha.hide()));
  }), !0;
}
async function Ph() {
  var h, v, T, S;
  let s = "", c = 0;
  try {
    const p = await B.getGameflowSession();
    s = ((v = (h = p.gameData) == null ? void 0 : h.queue) == null ? void 0 : v.gameMode) || "", c = ((S = (T = p.gameData) == null ? void 0 : T.queue) == null ? void 0 : S.id) || 0;
  } catch {
  }
  const d = zy(s);
  if (!d) {
    y.info("[BalanceBuff] 当前模式 %s 不支持，跳过", s);
    return;
  }
  const r = c > 0 ? jr(c) : s;
  Zl = { dataKey: d, displayName: r }, y.info("[BalanceBuff] 进入选人阶段 → %s (gameMode=%s, queueId=%d, dataKey=%s)", r, s, c, d);
  const m = document.getElementById("lol-uikit-layer-manager-wrapper");
  if (!m) {
    y.warn("[BalanceBuff] 未找到 layer-manager-wrapper，延迟挂载");
    return;
  }
  Ha = new wy(m), wu = B.observe(vt.CHAMP_SELECT, (p) => {
    const z = p.data;
    z && Wh(z);
  });
  try {
    const p = await B.getChampSelectSession();
    Wh(p);
  } catch {
  }
  qe.register(Wg), Sr = !0;
}
function Su() {
  Sr && (qe.unregister(Wg), Sr = !1), wu && (wu(), wu = null), Ha && (Ha.destroy(), Ha = null), document.querySelectorAll(`[${Ln}]`).forEach((s) => s.removeAttribute(Ln)), Lu = [], Bu = [], Zl = null;
}
function _h(s) {
  s && !Li ? (Li = B.observe(vt.GAMEFLOW_PHASE_CHANGE, (c) => {
    c.data === "ChampSelect" ? (Su(), Ph()) : Su();
  }), B.getGameflowPhase().then((c) => {
    c === "ChampSelect" && (Su(), Ph());
  }).catch(() => {
  }), y.info("[BalanceBuff] 平衡性调整 buff 提示已启用 ✓")) : !s && Li && (Li(), Li = null, Su(), y.info("[BalanceBuff] 平衡性调整 buff 提示已禁用"));
}
const qy = ".bottom-right-buttons", Or = "data-sona-quit-button", Er = "sona-quit-confirm-overlay";
function Ly(s) {
  if (document.getElementById(Er)) return;
  const c = document.createElement("div");
  c.id = Er, c.style.cssText = [
    "position:fixed",
    "inset:0",
    "background:rgba(0,0,0,0.65)",
    "z-index:821",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "backdrop-filter:blur(2px)"
  ].join(";");
  const d = document.createElement("div");
  d.style.cssText = [
    "min-width:420px",
    "max-width:480px",
    "background:#010a13",
    "border:1px solid #785a28",
    "box-shadow:0 0 32px rgba(0,0,0,0.8)",
    "padding:24px 28px",
    "font-family:var(--font-body)",
    "-webkit-font-smoothing:subpixel-antialiased",
    "color:#a09b8c"
  ].join(";");
  const r = document.createElement("div");
  r.textContent = "确认退出英雄选择？", r.style.cssText = [
    "color:#f0e6d2",
    "font-size:16px",
    "font-weight:700",
    "letter-spacing:0.075em",
    "line-height:20px",
    "text-transform:uppercase",
    "border-bottom:1px solid #3c3c41",
    "padding-bottom:10px",
    "margin-bottom:14px"
  ].join(";"), d.appendChild(r);
  const m = document.createElement("div");
  m.innerHTML = [
    "秒退将会：",
    "<br/>• 立即退出英雄选择并返回大厅",
    '<br/>• <span style="color:#e84749;font-weight:bold;">短时间内无法匹配</span>，并可能扣除信誉分',
    "<br/><br/>请谨慎操作。"
  ].join(""), m.style.cssText = "font-size:13px;line-height:20px;margin-bottom:20px;", d.appendChild(m);
  const h = document.createElement("div");
  h.style.cssText = "display:flex;justify-content:flex-end;gap:10px;";
  const v = document.createElement("lol-uikit-flat-button");
  v.textContent = "取消", v.style.minWidth = "100px";
  const T = document.createElement("lol-uikit-flat-button");
  T.textContent = "确认秒退", T.style.minWidth = "120px", T.style.color = "#e84749";
  const S = () => {
    c.remove();
  };
  v.addEventListener("click", S), T.addEventListener("click", () => {
    S(), s();
  }), c.addEventListener("click", (p) => {
    p.target === c && S();
  }), h.appendChild(v), h.appendChild(T), d.appendChild(h), c.appendChild(d), document.body.appendChild(c);
}
function By() {
  const s = document.createElement("lol-uikit-flat-button");
  return s.setAttribute(Or, "true"), s.textContent = "退出对局", s.style.width = "125px", s.style.marginRight = "10px", s.addEventListener("click", (c) => {
    c.stopPropagation(), c.preventDefault(), Ly(async () => {
      try {
        await B.dodgeChampSelect(), y.info("[QuitButton] 已发送秒退请求 ✓");
      } catch (d) {
        y.error("[QuitButton] 秒退请求失败:", d);
      }
    });
  }), s;
}
function Pg() {
  const s = document.querySelector(qy);
  if (!s) return !1;
  if (s.querySelector(`[${Or}]`)) return !0;
  const c = By();
  return s.insertBefore(c, s.firstChild), y.info("[QuitButton] 已注入选人阶段退出按钮 ✓"), !0;
}
let Bi = null, Gu = !1;
function $h() {
  Gu || (qe.register(Pg), Gu = !0);
}
function eg() {
  Gu && (qe.unregister(Pg), Gu = !1), document.querySelectorAll(`[${Or}]`).forEach((c) => c.remove());
  const s = document.getElementById(Er);
  s && s.remove();
}
function tg(s) {
  s && !Bi ? (Bi = B.observe(vt.GAMEFLOW_PHASE_CHANGE, (c) => {
    c.data === "ChampSelect" ? $h() : eg();
  }), B.getGameflowPhase().then((c) => {
    c === "ChampSelect" && $h();
  }).catch(() => {
  }), y.info("[QuitButton] 选人阶段退出按钮已启用 ✓")) : !s && Bi && (Bi(), Bi = null, eg(), y.info("[QuitButton] 选人阶段退出按钮已禁用"));
}
const Hu = /* @__PURE__ */ new Set();
let Hn = !1;
function Gy() {
  return Hn;
}
function _g() {
  Hn = !0, Hu.forEach((s) => s(Hn));
}
function $g() {
  Hn = !1, Hu.forEach((s) => s(Hn));
}
function Hy() {
  Hn ? $g() : _g();
}
function e0(s) {
  return Hu.add(s), () => {
    Hu.delete(s);
  };
}
let Cr = "";
function Qy(s) {
  s.key === Cr && (s.preventDefault(), s.stopPropagation(), Hy());
}
function Xy() {
  Cr = C.get("hotkey"), document.addEventListener("keydown", Qy, !0), C.onChange("hotkey", (s) => {
    Cr = s;
  });
}
const Qn = "data-sona-hijacked", t0 = "sona-entry-btn";
function Ky() {
  const s = document.createElement("div");
  return s.id = t0, s.className = "sona-entry-btn", s.innerHTML = `
    <img class="sona-entry-icon" src="${Xg}" alt="Sona" />
  `, s.addEventListener("mousedown", (c) => c.stopPropagation()), s.addEventListener("mouseup", (c) => c.stopPropagation()), s.addEventListener("click", (c) => {
    c.stopPropagation(), _g(), y.info("Modal opened");
  }), e0((c) => {
    s.classList.toggle("sona-entry-btn--active", c);
  }), s;
}
function Zy() {
  var d;
  if ((d = document.getElementById(t0)) != null && d.isConnected) return !0;
  const s = document.querySelector(".play-button-container");
  return s != null && s.parentElement ? (s.parentElement.insertBefore(Ky(), s), y.info("Entry button injected ✓ (beside play button)"), !0) : !1;
}
const qr = "sona-availability-menu", Vy = [
  { value: "chat", label: "在线" },
  { value: "away", label: "离开" },
  //{ value: 'dnd', label: '勿扰' }, 勿扰跟离开看起来是一样的，留一个就行了
  { value: "offline", label: "隐身" },
  { value: "mobile", label: "手机在线" }
];
let Bn = C.get("availability");
async function Jy() {
  try {
    y.info("[Availability] 开始恢复持久化状态...");
    const s = await B.getGameflowPhase();
    if (s !== "None" && s !== "Lobby") {
      y.info("[Availability] 当前阶段 %s，跳过状态恢复（避免与底层状态机冲突）", s);
      return;
    }
    const c = await B.getChatMe(), d = C.get("availability"), r = C.get("statusMessage");
    if (y.info(
      "[Availability] 当前状态快照: client.availability=%s, client.statusMessage=%s | saved.availability=%s, saved.statusMessage=%s",
      c.availability,
      JSON.stringify(c.statusMessage),
      d,
      JSON.stringify(r)
    ), d && d !== "away" && d !== c.availability) {
      try {
        await B.setAvailability(d), y.info("[Availability] 已写入 availability: %s", d);
      } catch (h) {
        y.warn("[Availability] availability 写入失败（稍后会再校验一次）:", h);
      }
      Bn = d;
    } else
      y.info("[Availability] availability 无需恢复（已与 store 一致 / 未配置）"), Bn = c.availability;
    const m = ns(c.statusMessage) ? c.statusMessage : "";
    if (m === "" && ns(r))
      try {
        await B.setStatusMessage(r), y.info("[Availability] 已写入 statusMessage: %s", r);
      } catch (h) {
        y.warn("[Availability] statusMessage 写入失败（稍后会再校验一次）:", h);
      }
    else m !== "" ? m !== r ? (C.set("statusMessage", m), y.info("[Availability] 客户端签名与 store 不一致，已回写到 store: %s", m)) : y.info("[Availability] statusMessage 无需恢复（客户端与 store 一致）") : y.info("[Availability] 客户端无签名且 store 也无签名，跳过");
  } catch (s) {
    y.warn("[Availability] Failed to restore availability/status:", s);
  }
}
async function Yy() {
  await ha(2e3);
  try {
    const s = await B.getGameflowPhase();
    if (s !== "None" && s !== "Lobby") {
      y.info("[Availability] 延迟校验时阶段为 %s，跳过", s);
      return;
    }
    const c = await B.getChatMe(), d = C.get("availability"), r = C.get("statusMessage"), m = ns(c.statusMessage) ? c.statusMessage : "";
    y.info(
      "[Availability] 延迟校验快照: client.availability=%s, client.statusMessage=%s | saved.availability=%s, saved.statusMessage=%s",
      c.availability,
      JSON.stringify(c.statusMessage),
      d,
      JSON.stringify(r)
    ), d && d !== c.availability && (y.warn("[Availability] 延迟校验发现 availability 被客户端回退，再次写入: %s", d), await B.setAvailability(d).catch((h) => {
      y.warn("[Availability] 延迟校验写 availability 失败:", h);
    })), ns(r) && m !== r && (y.warn('[Availability] 延迟校验发现 statusMessage 被客户端回退（"%s" → "%s"），再次写入', r, m), await B.setStatusMessage(r).catch((h) => {
      y.warn("[Availability] 延迟校验写 statusMessage 失败:", h);
    }));
  } catch (s) {
    y.warn("[Availability] 延迟校验失败:", s);
  }
}
function ns(s) {
  return typeof s == "string" && s.length > 0;
}
let ag = null;
function Fy() {
  ag || (ag = B.observe(vt.CHAT_ME, async (s) => {
    const c = s.data;
    if (c) {
      try {
        const d = await B.getGameflowPhase();
        if (d !== "None" && d !== "Lobby") return;
      } catch {
        return;
      }
      ns(c.statusMessage) && C.get("statusMessage") !== c.statusMessage && (C.set("statusMessage", c.statusMessage), y.info("[Availability] 签名变化 → 已持久化: %s", c.statusMessage)), c.availability && c.availability !== "away" && C.get("availability") !== c.availability && (C.set("availability", c.availability), Bn = c.availability, y.info("[Availability] 在线状态变化 → 已持久化: %s", c.availability));
    }
  }), y.info("[Availability] 已订阅 /lol-chat/v1/me 实时同步"));
}
function ts() {
  var s;
  (s = document.getElementById(qr)) == null || s.remove();
}
function Wy(s) {
  ts();
  const c = document.createElement("div");
  c.id = qr, c.className = "sona-availability-menu";
  for (const m of Vy) {
    const h = document.createElement("button");
    h.className = `sona-availability-option${Bn === m.value ? " sona-availability-option--active" : ""}`, h.type = "button", h.innerHTML = `
      <span class="sona-availability-dot sona-availability-dot--${m.value}"></span>
      <span>${m.label}</span>
    `, h.addEventListener("mousedown", (v) => v.stopPropagation()), h.addEventListener("click", (v) => {
      v.stopPropagation(), v.stopImmediatePropagation(), m.value !== Bn && (Bn = m.value, B.getGameflowPhase().then((T) => {
        (T === "None" || T === "Lobby") && m.value !== "away" ? (C.set("availability", m.value), y.info("[Availability] 持久化: %s (phase=%s)", m.value, T)) : y.info("[Availability] 仅临时切换（阶段 %s，不持久化）", T);
      }).catch(() => {
        y.warn("[Availability] 无法获取 gameflow phase，跳过持久化");
      }), B.setAvailability(m.value).then(() => y.info("[Availability] 已切换: %s", m.value)).catch((T) => y.error("[Availability] 切换失败:", T))), ts();
    }, !0), c.appendChild(h);
  }
  const d = s.getBoundingClientRect();
  c.style.top = `${d.bottom + 6}px`, c.style.left = `${d.left + d.width / 2 - 6}px`, document.body.appendChild(c);
  const r = (m) => {
    c.contains(m.target) || (ts(), document.removeEventListener("mousedown", r, !0));
  };
  requestAnimationFrame(() => {
    document.addEventListener("mousedown", r, !0);
  });
}
let a0 = !1;
function lg(s) {
  a0 = s, s ? qe.register(ng) : (qe.unregister(ng), ts());
}
function ng() {
  const s = document.querySelector(`.social-identity-block .lol-social-availability-hitbox:not([${Qn}])`);
  return s && (s.setAttribute(Qn, "true"), s.addEventListener("click", (c) => {
    a0 && (c.stopPropagation(), c.stopImmediatePropagation(), c.preventDefault(), y.debug("Availability hitbox clicked"), document.getElementById(qr) ? (ts(), y.debug("Availability menu closed")) : (Wy(s), y.debug("Availability menu shown")));
  }, !0), y.info("Availability hitbox hijacked ✓")), !0;
}
let l0 = !1;
function ig(s) {
  l0 = s, s ? qe.register(ug) : (qe.unregister(ug), document.querySelectorAll(`[${Qn}-tft]`).forEach((c) => {
    c.style.display = "", c.removeAttribute(`${Qn}-tft`);
  }));
}
const sg = `${Qn}-tft`;
function ug() {
  if (!l0) return !0;
  const s = document.querySelector(`.menu_item_navbar_tft:not([${sg}])`);
  return s && (s.setAttribute(sg, "true"), s.style.display = "none"), !0;
}
let n0 = !1;
const Tr = `${Qn}-nav-text`;
function cg(s) {
  if (n0 = s, s)
    qe.register(og);
  else {
    qe.unregister(og);
    const c = document.querySelector(".right-nav-menu");
    c && (c.removeAttribute(Tr), c.querySelectorAll("lol-uikit-navigation-item").forEach((d) => {
      const r = d.querySelector(".menu-item-small-text");
      r && (r.style.display = "");
    }));
  }
}
function og() {
  if (!n0) return !0;
  const s = document.querySelector(".right-nav-menu");
  if (!s || s.hasAttribute(Tr)) return !0;
  const c = s.querySelectorAll("lol-uikit-navigation-item");
  let d = 0;
  return c.forEach((r) => {
    const m = r, h = m.querySelector(".menu-item-small-text");
    h && (h.style.display = "none", d++, y.info(`[HideRightNavText] Hide right nav text: ${m.textContent}`));
  }), d > 0 && s.setAttribute(Tr, "true"), !0;
}
function Py() {
  qe.register(Zy), Jy().finally(() => {
    Fy(), Yy();
  }), qe.start();
}
function i0(s) {
  return s >= 70 ? {
    id: "blazing",
    borderColor: "#ff3300",
    particleColors: ["#ff3300", "#ffaa00", "#ff003c"],
    particleStyle: "fire",
    boxShadow: "0 0 15px rgba(255,51,0,0.5)"
  } : s >= 60 ? {
    id: "strong",
    borderColor: "#c8aa6e",
    particleColors: ["#4a9eff", "#7ec8ff", "#2060c0"],
    particleStyle: "magic",
    boxShadow: "0 0 8px rgba(74,158,255,0.35)"
  } : s >= 50 ? {
    id: "normal",
    borderColor: "#3c2e16",
    particleColors: ["#a09b8c", "#5c6b73", "#d1d8e0"],
    particleStyle: "ambient",
    boxShadow: "0 0 6px rgba(160,155,140,0.25)"
  } : s >= 40 ? {
    id: "shaky",
    borderColor: "#555555",
    particleColors: ["#8b6914", "#a07828", "#6b4e0a"],
    particleStyle: "ash",
    filter: "saturate(0.5)",
    boxShadow: "0 0 6px rgba(139,105,20,0.3)"
  } : {
    id: "dizzy",
    borderColor: "#8b00ff",
    particleColors: ["#8b00ff", "#4a0080", "#000000"],
    particleStyle: "void",
    filter: "grayscale(1) contrast(1.2)",
    boxShadow: "0 0 10px rgba(139,0,255,0.4)"
  };
}
function _y({ winRate: s, width: c = 160, height: d = 160 }) {
  const r = U.useRef(null), m = i0(s);
  return U.useEffect(() => {
    const h = r.current;
    if (!h) return;
    const v = h.getContext("2d");
    if (!v) return;
    const T = v, S = c / 2, p = d / 2, z = Math.min(c, d) / 4;
    let E = 0;
    const Q = [];
    function ee() {
      const ae = Math.random() * Math.PI * 2, ye = z + Math.random() * 5, Y = m.particleColors, Z = {
        x: S + Math.cos(ae) * ye,
        y: p + Math.sin(ae) * ye,
        vx: 0,
        vy: 0,
        size: Math.random() * 2.5 + 0.5,
        color: Y[Math.floor(Math.random() * Y.length)],
        life: 1,
        decay: Math.random() * 0.01 + 5e-3
      };
      switch (m.particleStyle) {
        case "fire":
          Z.vx = Math.cos(ae) * (Math.random() * 0.3 + 0.1), Z.vy = Math.sin(ae) * (Math.random() * 0.3 + 0.1) - 0.2, Z.decay = Math.random() * 8e-3 + 3e-3;
          break;
        case "magic":
          Z.vx = (Math.random() - 0.5) * 0.3, Z.vy = -Math.random() * 0.5 - 0.2;
          break;
        case "ambient":
          Z.vx = (Math.random() - 0.5) * 0.2, Z.vy = (Math.random() - 0.5) * 0.2 - 0.1, Z.decay = Math.random() * 8e-3 + 4e-3;
          break;
        case "ash":
          Z.vx = (Math.random() - 0.5) * 0.3, Z.vy = Math.random() * 0.1 + 0.2;
          break;
        case "void": {
          const $ = z + 15;
          Z.x = S + Math.cos(ae) * $, Z.y = p + Math.sin(ae) * $, Z.vx = -Math.cos(ae) * (Math.random() * 0.4 + 0.1), Z.vy = -Math.sin(ae) * (Math.random() * 0.4 + 0.1), Z.decay = Math.random() * 0.015 + 0.01;
          break;
        }
      }
      return Z;
    }
    function re() {
      T.clearRect(0, 0, c, d);
      const ae = m.particleStyle === "fire" ? 3 : 2, ye = m.particleStyle === "ambient" ? 0.7 : 0.3;
      for (let Y = 0; Y < ae; Y++)
        Math.random() > ye && Q.push(ee());
      for (let Y = Q.length - 1; Y >= 0; Y--) {
        const Z = Q[Y];
        if (Z.x += Z.vx, Z.y += Z.vy, Z.life -= Z.decay, Z.life <= 0) {
          Q.splice(Y, 1);
          continue;
        }
        T.beginPath(), T.arc(Z.x, Z.y, Z.size, 0, Math.PI * 2);
        const $ = Z.x - S, de = Z.y - p, W = Math.sqrt($ * $ + de * de), le = Math.min(c, d) / 2, ne = Math.max(0, 1 - W / le);
        T.globalAlpha = Z.life * ne, T.fillStyle = Z.color;
        const ke = m.particleStyle;
        ke === "fire" || ke === "magic" ? (T.shadowBlur = 8, T.shadowColor = Z.color) : ke === "ambient" ? (T.shadowBlur = 3, T.shadowColor = Z.color) : T.shadowBlur = 0, T.fill(), T.globalAlpha = 1;
      }
      E = requestAnimationFrame(re);
    }
    return re(), () => {
      cancelAnimationFrame(E), T.clearRect(0, 0, c, d);
    };
  }, [m, c, d]), /* @__PURE__ */ u.jsx(
    "canvas",
    {
      ref: r,
      width: c,
      height: d,
      style: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 0,
        borderRadius: "50%",
        mixBlendMode: m.particleStyle === "void" ? "normal" : "screen"
      }
    }
  );
}
function rg({ open: s, onClose: c }) {
  const [d, r] = U.useState([]), [m, h] = U.useState(!1), [v, T] = U.useState(""), [S, p] = U.useState(null), [z, E] = U.useState("");
  U.useEffect(() => {
    s && (h(!0), r([]), E(""), (async () => {
      try {
        const le = (await B.getSummonerInfo()).summonerId;
        try {
          const j = await fetch("/lol-summoner/v1/current-summoner/summoner-profile");
          if (j.ok) {
            const F = await j.json();
            F.backgroundSkinId && p(F.backgroundSkinId);
          }
        } catch {
        }
        const ne = await B.getChampionSummary(), ke = /* @__PURE__ */ new Map();
        for (const j of ne)
          j.id > 0 && ke.set(j.id, { name: j.name });
        const ue = await fetch(`/lol-champions/v1/inventories/${le}/skins-minimal`);
        if (!ue.ok) throw new Error(`获取皮肤失败 ${ue.status}`);
        const Xe = await ue.json(), X = [];
        for (const j of Xe) {
          if (!j.tilePath) continue;
          const F = ke.get(j.championId);
          F && X.push({
            id: j.id,
            name: j.name,
            championId: j.championId,
            champName: F.name,
            tilePath: j.tilePath
          });
        }
        X.sort((j, F) => j.champName.localeCompare(F.champName, void 0) || j.id - F.id), r(X), y.info("[ProfileBg] 加载了 %d 款皮肤", X.length);
      } catch (W) {
        y.error("[ProfileBg] 加载皮肤失败:", W), E("❌ 加载皮肤数据失败");
      } finally {
        h(!1);
      }
    })());
  }, [s]);
  const Q = U.useMemo(() => {
    if (!v.trim()) return d;
    const W = v.toLowerCase();
    return d.filter(
      (le) => le.name.toLowerCase().includes(W) || le.champName.toLowerCase().includes(W)
    );
  }, [d, v]), ee = 25, [re, ae] = U.useState(ee), ye = U.useRef(null);
  U.useEffect(() => {
    ae(ee);
  }, [v]);
  const Y = U.useMemo(() => Q.slice(0, re), [Q, re]), Z = re < Q.length, $ = U.useCallback(() => {
    const W = ye.current;
    !W || !Z || W.scrollTop + W.clientHeight >= W.scrollHeight - 100 && ae((le) => Math.min(le + ee, Q.length));
  }, [Z, Q.length]), de = async (W) => {
    E(`正在应用 ${W.name}...`);
    try {
      const le = await fetch("/lol-summoner/v1/current-summoner/summoner-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "backgroundSkinId", value: W.id })
      });
      le.ok ? (p(W.id), E(`✅ 已应用 [${W.name}]`), y.info("[ProfileBg] 背景已设置为 %s (id=%d)", W.name, W.id)) : E(`❌ 设置失败 ${le.status}`);
    } catch (le) {
      E("❌ 请求失败"), y.error("[ProfileBg] 设置背景失败:", le);
    }
    setTimeout(() => E(""), 3e3);
  };
  return /* @__PURE__ */ u.jsx(Zu, { open: s, onClose: c, width: 1100, height: 620, children: /* @__PURE__ */ u.jsxs("div", { className: "spbg-container", children: [
    /* @__PURE__ */ u.jsx("div", { className: "spbg-header", children: /* @__PURE__ */ u.jsx("span", { className: "spbg-title", children: "自定义生涯背景" }) }),
    /* @__PURE__ */ u.jsxs("div", { className: "spbg-toolbar", children: [
      /* @__PURE__ */ u.jsx(
        "input",
        {
          className: "spbg-search",
          type: "text",
          value: v,
          onChange: (W) => T(W.target.value),
          placeholder: "搜索英雄或皮肤..."
        }
      ),
      /* @__PURE__ */ u.jsxs("span", { className: "spbg-count", children: [
        Q.length,
        " 款皮肤"
      ] }),
      z && /* @__PURE__ */ u.jsx("span", { className: "spbg-status", children: z })
    ] }),
    /* @__PURE__ */ u.jsxs("div", { className: "spbg-grid-wrap", ref: ye, onScroll: $, children: [
      m && /* @__PURE__ */ u.jsx("div", { className: "spbg-empty", children: "加载中..." }),
      !m && Q.length === 0 && /* @__PURE__ */ u.jsx("div", { className: "spbg-empty", children: "没有找到相关皮肤" }),
      /* @__PURE__ */ u.jsx("div", { className: "spbg-grid", children: Y.map((W) => {
        const le = S === W.id;
        return /* @__PURE__ */ u.jsxs(
          "div",
          {
            className: `spbg-card ${le ? "spbg-applied" : ""}`,
            onClick: () => de(W),
            children: [
              /* @__PURE__ */ u.jsxs("div", { className: "spbg-card-img-wrap", children: [
                /* @__PURE__ */ u.jsx(
                  "img",
                  {
                    className: "spbg-card-img",
                    src: W.tilePath,
                    alt: W.name,
                    loading: "lazy"
                  }
                ),
                /* @__PURE__ */ u.jsx("div", { className: "spbg-card-hover", children: "点击应用" }),
                le && /* @__PURE__ */ u.jsx("div", { className: "spbg-card-badge", children: "使用中" })
              ] }),
              /* @__PURE__ */ u.jsx("p", { className: "spbg-card-name", children: W.name })
            ]
          },
          W.id
        );
      }) })
    ] })
  ] }) });
}
const $y = 15e3;
let Gi = null, sa = null;
function ev() {
  const s = C.get("autoAcceptDelayMin"), c = C.get("autoAcceptDelayMax");
  return Number.isFinite(s) && Number.isFinite(c) && s >= 0 && c >= 0 && c <= $y && s <= c && c > 0 ? Math.round(s + Math.random() * (c - s)) : 0;
}
function tv() {
  sa && (clearTimeout(sa), sa = null);
  const s = ev(), c = () => {
    sa = null, B.acceptMatch().then(() => y.info("Auto accepted match ✓ (delay=%dms)", s)).catch((d) => y.error("Auto accept failed:", d));
  };
  s === 0 ? c() : (y.info("[AutoAccept] 随机延迟 %dms 后接受", s), sa = setTimeout(c, s));
}
function dg(s) {
  s && !Gi ? (Gi = B.observe(vt.GAMEFLOW_PHASE_CHANGE, (c) => {
    c.data === "ReadyCheck" ? tv() : sa && (clearTimeout(sa), sa = null);
  }), y.info("Auto accept enabled ✓")) : !s && Gi && (Gi(), Gi = null, sa && (clearTimeout(sa), sa = null), y.info("Auto accept disabled"));
}
let Hi = null;
const av = {
  ReadyCheck: "匹配确认",
  ChampSelect: "英雄选择",
  GameStart: "游戏启动",
  InProgress: "对局进行中",
  Reconnect: "重新连接",
  WaitingForStats: "等待结算",
  PreEndOfGame: "结算准备",
  EndOfGame: "对局结束"
};
function fg(s) {
  s && !Hi ? (Hi = B.observe(vt.GAMEFLOW_PHASE_CHANGE, (c) => {
    const d = c.data, r = av[d];
    y.info("Gameflow phase → %s%s", d, r ? ` (${r})` : ""), r && B.getGameflowSession().then((m) => {
      y.info("=== %s ===", r), y.info("游戏模式: %s | 队列: %s (ID: %d)", m.gameData.queue.gameMode, m.gameData.queue.name, m.gameData.queue.id), y.info("对局 ID: %d | 自定义: %s", m.gameData.gameId, m.gameData.isCustomGame), y.info("地图: %s (ID: %d)", m.map.name, m.map.id), y.info("我方队伍:", m.gameData.teamOne), y.info("对方队伍:", m.gameData.teamTwo), d === "InProgress" && y.info("游戏客户端: running=%s, server=%s:%d", m.gameClient.running, m.gameClient.serverIp, m.gameClient.serverPort), y.info("完整 session: %o", m), d === "ChampSelect" && B.getChampSelectSession().then((h) => {
        y.info("--- 英雄选择详情 ---"), y.info("本地玩家 cellId: %d", h.localPlayerCellId), h.myTeam.forEach((v, T) => {
          y.info("我方 #%d → summonerId: %d, championId: %d, cellId: %d, position: %s", T + 1, v.summonerId, v.championId, v.cellId, v.assignedPosition || "无");
        }), h.theirTeam.forEach((v, T) => {
          y.info("对方 #%d → summonerId: %d, championId: %d, cellId: %d, position: %s", T + 1, v.summonerId, v.championId, v.cellId, v.assignedPosition || "无");
        }), y.info("完整 champSelect: %o", h);
      }).catch((h) => y.error("获取英雄选择详情失败:", h));
    }).catch((m) => y.error("获取 %s 对局信息失败:", r, m));
  }), y.info("Debug gameflow logging enabled ✓")) : !s && Hi && (Hi(), Hi = null, y.info("Debug gameflow logging disabled"));
}
function mg() {
  const s = document.querySelector(".lower-details .status.disabled");
  return s && (s.classList.remove("disabled"), y.info("Status input unlocked ✓")), !0;
}
let Eu = !1;
function hg(s) {
  s && !Eu ? (qe.register(mg), Eu = !0, y.info("Unlock status enabled ✓")) : !s && Eu && (qe.unregister(mg), Eu = !1, y.info("Unlock status disabled"));
}
const gg = "data-sona-bench-hijacked";
function lv(s) {
  const c = s.querySelector(".bench-champion-background");
  if (!c) return null;
  const r = (c.style.backgroundImage || "").match(/champion-icons\/(\d+)\.png/);
  return r ? Number(r[1]) : null;
}
function pg() {
  const s = document.querySelector(".bench-container");
  return s && (s.querySelectorAll('[class*="on-cooldown"]').forEach((c) => {
    Array.from(c.classList).filter((m) => m.startsWith("on-cooldown")).forEach((m) => c.classList.remove(m));
    const r = c.querySelector(".cooldown-mask");
    r instanceof HTMLElement && (r.style.display = "none");
  }), s.querySelectorAll(`.champion-bench-item:not([${gg}])`).forEach((c) => {
    c.classList.contains("empty-bench-item") || c.classList.contains("locked-out") || (c.setAttribute(gg, "true"), c.addEventListener("click", (d) => {
      const r = lv(c);
      r && (d.stopPropagation(), d.stopImmediatePropagation(), d.preventDefault(), B.benchSwap(r).then(() => y.info("Bench swap → champion %d ✓", r)).catch((m) => y.error("Bench swap failed:", m)));
    }, !0));
  })), !0;
}
let Cu = !1;
function yg(s) {
  s && !Cu ? (qe.register(pg), Cu = !0, y.info("Bench no-cooldown enabled ✓")) : !s && Cu && (qe.unregister(pg), Cu = !1, y.info("Bench no-cooldown disabled"));
}
let Qi = null;
async function s0() {
  if (Qi) return Qi;
  Qi = nv();
  try {
    return await Qi;
  } finally {
    Qi = null;
  }
}
async function nv() {
  const s = await B.getChampSelectSession(), c = s.myTeam.find((S) => S.cellId === s.localPlayerCellId), d = c ? c.cellId < 5 : !0, r = s.queueId;
  y.info("[TeamStats] 当前队列 ID: %d", r);
  const m = as(r), h = Math.max(
    C.get("champSelectAssistFetchCount") || 50,
    C.get("analyzeTeamPowerFetchCount") || 50
  ), v = (S, p) => ({
    floor: p + 1,
    summonerId: S.summonerId,
    puuid: S.puuid,
    gameName: S.gameName,
    tagLine: S.tagLine,
    winRate: null,
    wins: 0,
    total: 0,
    avgK: 0,
    avgD: 0,
    avgA: 0,
    kdaNum: 0
  }), T = await Promise.all(s.myTeam.map(async (S, p) => {
    if (!S.puuid)
      return v(S, p);
    try {
      const z = S.puuid, E = S.gameName, Q = S.tagLine, re = (await B.getSgpMatchHistory(z, {
        startIndex: 0,
        count: h,
        tag: m || void 0
      })).games ?? [], ae = [];
      for (const W of re) {
        const le = W.json.participants.find((ne) => ne.puuid === z);
        le && ae.push({
          kills: le.kills,
          deaths: le.deaths,
          assists: le.assists,
          win: le.win
        });
      }
      if (ae.length === 0)
        return v(S, p);
      let ye = 0, Y = 0, Z = 0, $ = 0;
      for (const W of ae)
        W.win && ye++, Y += W.kills, Z += W.deaths, $ += W.assists;
      const de = ae.length;
      return y.info("[TeamStats] %s → SGP 拉取 %d 场 (tag=%s)", E, de, m || "全部"), {
        floor: p + 1,
        summonerId: S.summonerId,
        puuid: z,
        gameName: E,
        tagLine: Q,
        winRate: ye / de * 100,
        wins: ye,
        total: de,
        avgK: Y / de,
        avgD: Z / de,
        avgA: $ / de,
        kdaNum: Z === 0 ? Y + $ : (Y + $) / Z
      };
    } catch {
      return v(S, p);
    }
  }));
  return { isBlue: d, queueId: r, stats: T };
}
const u0 = "data-sona-tier", xr = "data-sona-stats", kr = "data-sona-click";
let Vl = [], Gn = /* @__PURE__ */ new Map(), Qu = 0, Mr = [], pl = null, yl = null;
function iv(s, c, d) {
  yl || (yl = document.createElement("div"), yl.id = "sona-match-history-modal-root", document.body.appendChild(yl), pl = Kn.createRoot(yl));
  const r = () => {
    pl == null || pl.render(
      U.createElement(ls, { open: !1, onClose: r, puuid: "", playerName: "" })
    );
  };
  pl.render(
    U.createElement(ls, { open: !0, onClose: r, puuid: s, playerName: c, queueId: d })
  );
}
function sv() {
  pl && (pl.unmount(), pl = null), yl && (yl.remove(), yl = null);
}
const Nr = [];
function c0() {
  const s = document.querySelectorAll(".party.visible .summoner-wrapper.visible.left");
  return s.length === 0 || Vl.length === 0 || s.forEach((c, d) => {
    const r = c.querySelector(".champion-icon-container");
    if (!r) return;
    const m = Vl[d];
    if (!m || m.winRate == null) return;
    const h = m.winRate;
    if (!r.querySelector("[data-sona-particle]")) {
      r.setAttribute(u0, "true"), r.style.position = "relative", r.style.overflow = "visible", r.style.borderRadius = "50%";
      const S = i0(h);
      S.boxShadow && (r.style.boxShadow = S.boxShadow);
      const p = document.createElement("div");
      p.setAttribute("data-sona-particle", "true"), r.prepend(p);
      const z = r.getBoundingClientRect(), E = Math.max(z.width, z.height) + 40, Q = Kn.createRoot(p);
      Q.render(U.createElement(_y, { winRate: h, width: E, height: E })), Nr.push({ root: Q, container: p }), y.info("头像粒子特效 → %d楼 胜率%s%% → %s", d + 1, h.toFixed(1), S.id);
    }
    let v = null;
    if (!r.hasAttribute(kr) && m.puuid) {
      r.setAttribute(kr, "true"), r.style.cursor = "pointer";
      const S = d;
      v = (p) => {
        if (p.target.closest(".swap-button-component, .swap-button-btn")) return;
        p.stopPropagation(), p.preventDefault();
        const E = Vl[S];
        E != null && E.puuid && iv(E.puuid, `${E.gameName}#${E.tagLine}`, Qu || void 0);
      }, r.addEventListener("click", v, !0);
    }
    const T = c.querySelector(".player-details");
    if (T && !T.querySelector(`[${xr}]`)) {
      T.style.position = "relative", T.style.overflow = "visible";
      const S = T.closest(".summoner-container");
      S && (S.style.overflow = "visible");
      const p = m.kdaNum >= 99 ? "Perfect" : m.kdaNum.toFixed(1), z = h >= 55 ? "#5bbd72" : h >= 45 ? "#c8aa6e" : "#e74c3c", E = document.createElement("div");
      E.setAttribute(xr, "true"), E.style.cssText = "position:absolute;left:0;top:100%;display:flex;align-items:center;font-size:11px;line-height:1;white-space:nowrap;margin-top:2px;";
      const Q = document.createElement("span");
      Q.style.cssText = `color:${z};font-weight:bold;display:inline-block;min-width:90px;`, Q.textContent = `${h.toFixed(0)}% (${m.wins}胜/${m.total - m.wins}负)`;
      const ee = m.kdaNum >= 5 ? "#5bbd72" : m.kdaNum >= 3 ? "#c8aa6e" : "#e74c3c", re = document.createElement("span");
      re.style.cssText = `color:${ee};margin-left:8px;font-weight:bold;text-shadow:0 0 4px rgba(200,170,110,0.6);`, re.textContent = `KDA ${p}`, E.appendChild(Q), E.appendChild(re), T.appendChild(E), Mr.push({ statsDiv: E, iconContainer: r, summonerContainer: S, playerDetails: T, clickHandler: v });
    }
  }), !0;
}
let Xu = !1;
function uv() {
  Xu || (qe.register(c0), Xu = !0);
}
function Iu() {
  Xu && (qe.unregister(c0), Xu = !1), Vl = [], Gn.clear(), Qu = 0, o0(), sv();
}
async function cv() {
  try {
    Iu();
    const { stats: s, queueId: c } = await s0();
    Qu = c, Vl = s, Gn.clear();
    for (const d of s)
      d.puuid && Gn.set(d.puuid, d);
    uv(), y.info("头像特效数据就绪，%d 位队友，队列 ID: %d", s.length, Qu);
  } catch (s) {
    y.error("头像特效查询失败:", s);
  }
}
let Xi = null, Tu = null;
function ov(s) {
  if (s.eventType !== "Update" || Gn.size === 0) return;
  const c = s.data;
  if (!(c != null && c.myTeam)) return;
  const d = c.myTeam.map((h) => h.puuid).filter(Boolean), r = Vl.map((h) => h.puuid).filter(Boolean);
  if (d.length === r.length && d.every((h, v) => h === r[v])) return;
  y.info("[ChampSelect] 检测到楼层顺序变化，重建 floorStats");
  const m = c.myTeam.map((h, v) => {
    if (h.puuid && Gn.has(h.puuid)) {
      const T = { ...Gn.get(h.puuid) };
      return T.floor = v + 1, T;
    }
    return {
      floor: v + 1,
      summonerId: h.summonerId,
      puuid: h.puuid,
      gameName: h.gameName,
      tagLine: h.tagLine,
      winRate: null,
      wins: 0,
      total: 0,
      avgK: 0,
      avgD: 0,
      avgA: 0,
      kdaNum: 0
    };
  });
  o0(), Vl = m;
}
function o0() {
  Nr.forEach(({ root: s, container: c }) => {
    s.unmount(), c.remove();
  }), Nr.length = 0;
  for (const s of Mr)
    s.statsDiv.remove(), s.clickHandler && s.iconContainer.removeEventListener("click", s.clickHandler, !0), s.iconContainer.style.filter = "", s.iconContainer.style.boxShadow = "", s.iconContainer.removeAttribute(u0), s.iconContainer.removeAttribute(kr), s.iconContainer.style.cursor = "", s.playerDetails.removeAttribute(xr), s.playerDetails.style.cursor = "", s.summonerContainer && (s.summonerContainer.style.overflow = "");
  Mr = [];
}
function vg(s) {
  s && !Xi ? (Xi = B.observe(vt.GAMEFLOW_PHASE_CHANGE, (c) => {
    c.data === "ChampSelect" ? (Iu(), cv()) : Iu();
  }), Tu = B.observe(vt.CHAMP_SELECT, ov), y.info("Champ select assist enabled ✓")) : !s && Xi && (Xi(), Xi = null, Iu(), Tu && (Tu(), Tu = null), y.info("Champ select assist disabled"));
}
function r0(s, c) {
  return s >= 75 && c >= 4.5 ? "👑 峡谷通天代" : s >= 70 ? "🚀 降维来炸鱼" : s >= 65 ? "🔥 绝对真大腿" : s >= 60 ? "⚔️ 绝活哥出列" : s >= 56 ? "✨ 稳健老司机" : s >= 52 ? "🛡️ 上分好帮手" : s >= 48 ? "🎲 峡谷摇摆人" : s >= 45 ? "🫠 默默抗压中" : s >= 41 ? "🍂 随缘在补位" : s >= 37 ? "💀 连败渡劫中" : s >= 33 ? "🤡 敌方突破口" : s >= 28 ? "💸 峡谷提款机" : s >= 20 ? "🏳️ 投降发起人" : "☠️ 演员已就位";
}
async function rv() {
  try {
    const { stats: s } = await s0();
    y.info("┌─── 队友战绩分析 ───");
    const c = [`Sona助手 ♫   队友卡池一览(本模式战绩):
`];
    for (const m of s) {
      const h = `${m.floor}楼`;
      if (m.winRate == null) {
        y.info("│ %s — %s#%s — 无近期战绩或查询失败", h, m.gameName, m.tagLine), c.push(`${h}: 🆕 萌新上线 (无战绩)`);
        continue;
      }
      const v = m.winRate.toFixed(1), T = m.kdaNum >= 99 ? "Perfect" : m.kdaNum.toFixed(2), S = r0(m.winRate, m.kdaNum);
      y.info(
        "│ %s — %s#%s — 近%d场 胜率: %s%% (%d胜%d负) | KDA: %s (%.1f/%.1f/%.1f) | %s",
        h,
        m.gameName,
        m.tagLine,
        m.total,
        v,
        m.wins,
        m.total - m.wins,
        T,
        m.avgK,
        m.avgD,
        m.avgA,
        S
      ), c.push(`${h}: ${S} | 胜率${v}% | KDA ${T}`);
    }
    y.info("└────────────────────");
    const d = c.join(`
`), r = C.get("analyzeTeamPowerMsgType") || "celebration";
    for (let m = 0; m < 10; m++)
      try {
        await B.sendChampSelectMessage(d, r), y.info("队友分析已发送到聊天框 ✓");
        break;
      } catch {
        m < 9 ? await ha(1e3) : y.warn("聊天发送失败，聊天室始终未就绪");
      }
  } catch (s) {
    y.error("队友战绩分析失败:", s);
  }
}
let Ki = null;
function Ag(s) {
  s && !Ki ? (Ki = B.observe(vt.GAMEFLOW_PHASE_CHANGE, (c) => {
    c.data === "ChampSelect" && rv();
  }), y.info("Analyze team power enabled ✓")) : !s && Ki && (Ki(), Ki = null, y.info("Analyze team power disabled"));
}
async function dv() {
  try {
    const s = await B.getChampSelectSession(), c = s.myTeam.find((v) => v.cellId === s.localPlayerCellId), r = (c ? c.cellId < 5 : !0) ? "🔵 蓝方 (左下方)" : "🔴 红方 (右上方)", m = `Sona助手 ♫   本局${r}`, h = C.get("sideIndicatorMsgType") || "celebration";
    for (let v = 0; v < 10; v++)
      try {
        await B.sendChampSelectMessage(m, h), y.info("红蓝方提示已发送 → %s", r);
        break;
      } catch {
        v < 9 ? await ha(1e3) : y.warn("红蓝方提示发送失败，聊天室始终未就绪");
      }
  } catch (s) {
    y.error("红蓝方提示失败:", s);
  }
}
let Zi = null;
function bg(s) {
  s && !Zi ? (Zi = B.observe(vt.GAMEFLOW_PHASE_CHANGE, (c) => {
    c.data === "ChampSelect" && dv();
  }), y.info("Side indicator enabled ✓")) : !s && Zi && (Zi(), Zi = null, y.info("Side indicator disabled"));
}
const Sg = "sona-global-particle-canvas";
let Xl = null;
function fv() {
  return document.getElementById("rcp-fe-viewport-root") ?? null;
}
function Eg() {
  const s = fv();
  if (!s) return !1;
  const c = document.getElementById(Sg);
  if (c instanceof HTMLCanvasElement && c.isConnected) return !0;
  Xl && (Xl(), Xl = null);
  const d = document.createElement("canvas");
  d.id = Sg, d.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:821;", s.appendChild(d);
  const r = d.getContext("2d");
  if (!r) return !1;
  let m = 0, h = !1;
  const v = [], T = () => {
    d.width = window.innerWidth, d.height = window.innerHeight;
  }, S = () => {
    if (!(h || d.width === 0)) {
      h = !0;
      for (let z = 0; z < 300; z++)
        v.push({
          x: Math.random() * d.width,
          y: Math.random() * d.height,
          size: Math.random() * 1.5 + 0.5,
          speedY: Math.random() * 0.4 + 0.1,
          speedX: (Math.random() - 0.5) * 0.2,
          opacity: Math.random() * 0.3 + 0.1,
          isGold: Math.random() > 0.7
        });
    }
  }, p = () => {
    h || (T(), S()), r.clearRect(0, 0, d.width, d.height);
    for (const z of v)
      z.y -= z.speedY, z.x += z.speedX, z.opacity += (Math.random() - 0.5) * 0.02, z.opacity < 0.1 && (z.opacity = 0.1), z.opacity > 0.5 && (z.opacity = 0.5), z.y < 0 && (z.y = d.height, z.x = Math.random() * d.width), z.isGold ? (r.shadowBlur = 4, r.shadowColor = `rgba(200, 170, 110, ${z.opacity})`) : (r.shadowBlur = 3, r.shadowColor = `rgba(0, 180, 255, ${z.opacity * 0.8})`), r.beginPath(), r.arc(z.x, z.y, z.size, 0, Math.PI * 2), r.fillStyle = z.isGold ? `rgba(220, 190, 130, ${z.opacity})` : `rgba(80, 200, 255, ${z.opacity * 0.85})`, r.fill();
    r.shadowBlur = 0, r.shadowColor = "transparent", m = requestAnimationFrame(p);
  };
  return T(), window.addEventListener("resize", T), m = requestAnimationFrame(p), Xl = () => {
    cancelAnimationFrame(m), window.removeEventListener("resize", T), d.remove();
  }, y.info("Global particle canvas injected ✓"), !0;
}
let xu = !1;
function Cg(s) {
  s && !xu ? (qe.register(Eg), xu = !0, y.info("Global particle effect enabled ✓")) : !s && xu && (qe.unregister(Eg), xu = !1, Xl && (Xl(), Xl = null), y.info("Global particle effect disabled"));
}
const Ga = "data-sona-friend-group", d0 = "data-sona-friend-checked", Tg = [
  "#e8a424",
  "#4a9eff",
  "#5bbd72",
  "#e74c3c",
  "#c084fc",
  "#f97316",
  "#14b8a6",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#eab308",
  "#ef4444",
  "#22d3ee",
  "#a3e635",
  "#fb923c",
  "#f472b6"
];
let ju = /* @__PURE__ */ new Map(), Ur = 0, Lr = /* @__PURE__ */ new Map();
function mv(s) {
  return ju.has(s) || (ju.set(s, Tg[Ur % Tg.length]), Ur++), ju.get(s);
}
async function hv(s = 5) {
  var c, d;
  for (let r = 0; r <= s; r++)
    try {
      const m = await B.getFriends(), h = /* @__PURE__ */ new Map();
      for (const v of m) {
        const T = v.gameName || v.name;
        if (!T) continue;
        const S = (c = v.lol) == null ? void 0 : c.gameId, p = S ? Number(S) : 0, z = ((d = v.lol) == null ? void 0 : d.gameStatus) ?? "";
        p > 0 && z && z !== "outOfGame" && h.set(T, { gameId: p, gameStatus: z });
      }
      Lr = h, y.info("[FriendGroup] 刷新好友游戏状态 → %d 人在游戏中 (attempt %d)", h.size, r);
      return;
    } catch (m) {
      r < s ? (y.debug("[FriendGroup] 好友接口未就绪，%ds 后重试 (%d/%d)", 2, r + 1, s), await ha(2e3)) : y.error("[FriendGroup] 查询好友状态失败:", m);
    }
}
function xg() {
  const s = document.querySelector(".lol-social-lower-pane-container");
  if (!s) return !0;
  const c = s.querySelectorAll('[class*="lol-social-roster-member"]');
  if (c.length === 0) return !0;
  const d = /* @__PURE__ */ new Map();
  return c.forEach((r) => {
    var E;
    const m = r;
    if (!(!m.className.includes("offline") && !!m.querySelector("span.status-message.game-status.dnd"))) {
      m.hasAttribute(Ga) && (m.removeAttribute(Ga), m.style.borderRight = ""), m.removeAttribute(d0);
      return;
    }
    const T = m.querySelector(".member-name"), S = ((E = T == null ? void 0 : T.textContent) == null ? void 0 : E.trim()) ?? "";
    if (!S) return;
    const p = Lr.get(S), z = p ? String(p.gameId) : void 0;
    z ? (d.has(z) || d.set(z, []), d.get(z).push(m)) : m.hasAttribute(Ga) && (m.removeAttribute(Ga), m.style.borderRight = "");
  }), d.forEach((r, m) => {
    if (r.length < 2) {
      r.forEach((v) => {
        v.hasAttribute(Ga) && (v.removeAttribute(Ga), v.style.borderRight = "");
      });
      return;
    }
    const h = mv(m);
    r.forEach((v) => {
      v.setAttribute(Ga, m), v.style.borderRight = `4px solid ${h}`;
    });
  }), !0;
}
let Vi = !1;
function kg(s) {
  s && !Vi ? (Vi = !0, hv().then(() => {
    Vi && (qe.register(xg), y.info("Friend smart group enabled ✓"));
  })) : !s && Vi && (qe.unregister(xg), Vi = !1, Lr.clear(), ju.clear(), Ur = 0, document.querySelectorAll(`[${Ga}]`).forEach((c) => {
    const d = c;
    d.removeAttribute(Ga), d.removeAttribute(d0), d.style.borderRight = "";
  }), y.info("Friend smart group disabled"));
}
const Mg = ["HEART", "COOL", "SHOTCALLER"];
async function gv() {
  var s;
  try {
    const c = await fetch("/lol-honor-v2/v1/ballot");
    if (!c.ok) {
      y.info("[AutoHonor] 当前没有待点赞的对局");
      return;
    }
    const d = await c.json(), r = [...d.eligibleAllies || []], m = [...d.eligibleOpponents || []];
    if (r.length === 0 && m.length === 0) {
      y.info("[AutoHonor] 没有可点赞的玩家");
      return;
    }
    const h = ((s = d.votePool) == null ? void 0 : s.votes) ?? 1;
    y.info("[AutoHonor] 可用票数: %d, 队友: %d, 对手: %d", h, r.length, m.length);
    for (let T = r.length - 1; T > 0; T--) {
      const S = Math.floor(Math.random() * (T + 1));
      [r[T], r[S]] = [r[S], r[T]];
    }
    for (let T = m.length - 1; T > 0; T--) {
      const S = Math.floor(Math.random() * (T + 1));
      [m[T], m[S]] = [m[S], m[T]];
    }
    const v = [...r, ...m].slice(0, h);
    for (let T = 0; T < v.length; T++) {
      const S = v[T], p = Mg[Math.floor(Math.random() * Mg.length)], z = T < r.length, E = await fetch("/lol-honor-v2/v1/honor-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puuid: S.puuid,
          summonerId: S.summonerId,
          gameId: d.gameId,
          honorCategory: p
        })
      });
      E.ok ? y.info("[AutoHonor] 第%d票 ✓ → [%s] 给了 %s%s", T + 1, p, S.championName, z ? "" : " (对手)") : y.error("[AutoHonor] 第%d票失败:", T + 1, E.status, await E.text());
    }
    y.info("[AutoHonor] 自动点赞完成，共 %d 票", v.length);
  } catch (c) {
    y.error("[AutoHonor] 自动点赞异常:", c);
  }
}
let Ji = null;
function Ng(s) {
  s && !Ji ? (Ji = B.observe(vt.GAMEFLOW_PHASE_CHANGE, (c) => {
    c.data === "PreEndOfGame" && gv();
  }), y.info("Auto honor enabled ✓")) : !s && Ji && (Ji(), Ji = null, y.info("Auto honor disabled"));
}
async function mr(s, c) {
  const d = Jg(s), r = (d == null ? void 0 : d.name) || `英雄#${s}`, h = `Sona助手 ♫   ${c ? "自动锁定" : "自动预选"}: ${r}`;
  try {
    await B.sendChampSelectMessage(h, "celebration");
  } catch {
  }
}
async function pv() {
  const s = C.get("autoLockChampionId");
  if (!s || s <= 0) {
    y.warn("[AutoLock] 未设置目标英雄 ID");
    return;
  }
  for (let c = 0; c < 300; c++)
    try {
      const d = await B.getChampSelectSession(), r = d.actions.flat(2), m = r.find(
        (h) => h.actorCellId === d.localPlayerCellId && h.type === "pick" && !h.completed
      );
      if (!m) {
        if (r.every((h) => h.type !== "pick" || h.actorCellId !== d.localPlayerCellId)) {
          y.info("[AutoLock] 当前模式无需选人（大乱斗等），跳过");
          return;
        }
        await ha(1e3);
        continue;
      }
      if (m.isInProgress) {
        if (d.timer.phase === "PLANNING") {
          await ha(1e3);
          continue;
        }
        const h = C.get("autoLockInstant"), v = `/lol-champ-select/v1/session/actions/${m.id}`;
        h ? (y.info("[AutoLock] 真正轮到选人了！秒锁英雄 ID: %d (actionId: %d)", s, m.id), (await fetch(v, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actorCellId: d.localPlayerCellId,
            championId: s,
            completed: !0,
            id: m.id,
            isAllyAction: !0,
            type: "pick"
          })
        })).ok ? (y.info("[AutoLock] 秒锁成功 (PATCH completed:true) ✓"), mr(s, !0)) : (y.warn("[AutoLock] PATCH 方案失败，尝试备用方案 /select"), await fetch(v, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ championId: s })
        }), await ha(200), (await fetch(`${v}/select`, { method: "POST" })).ok ? (y.info("[AutoLock] 秒锁成功 (select 备用) ✓"), mr(s, !0)) : y.error("[AutoLock] 秒锁失败，可能英雄被抢或被 Ban"))) : (y.info("[AutoLock] 轮到选人，预选英雄 ID: %d（不锁定）", s), await fetch(v, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ championId: s })
        }), y.info("[AutoLock] 预选成功 ✓"), mr(s, !1));
        return;
      }
      await ha(1e3);
    } catch {
      y.error("[AutoLock] 轮询中断 (可能有人秒退了房间)");
      return;
    }
  y.warn("[AutoLock] 等待超时 (5分钟)，未能秒锁");
}
let Yi = null;
function Ug(s) {
  s && !Yi ? (Yi = B.observe(vt.GAMEFLOW_PHASE_CHANGE, (c) => {
    c.data === "ChampSelect" && pv();
  }), y.info("Auto lock champion enabled ✓")) : !s && Yi && (Yi(), Yi = null, y.info("Auto lock champion disabled"));
}
async function Ou() {
  const s = C.get("rankQueue"), c = C.get("rankTier"), d = C.get("rankDivision");
  try {
    const r = await fetch("/lol-chat/v1/me");
    if (!r.ok) {
      y.error("[RankDisguise] 获取聊天状态失败");
      return;
    }
    const m = await r.json();
    m.lol.rankedLeagueTier = c, m.lol.rankedLeagueDivision = d, m.lol.rankedLeagueQueue = s;
    const h = await fetch("/lol-chat/v1/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(m)
    });
    h.ok ? y.info("[RankDisguise] 段位伪装已应用 ✓ %s %s %s", s, c, d) : y.error("[RankDisguise] 应用失败:", await h.text());
  } catch (r) {
    y.error("[RankDisguise] 应用异常:", r);
  }
}
async function yv() {
  try {
    const s = await fetch("/lol-chat/v1/me");
    if (!s.ok) return;
    const c = await s.json();
    c.lol.rankedLeagueTier = "", c.lol.rankedLeagueDivision = "", c.lol.rankedLeagueQueue = "", (await fetch("/lol-chat/v1/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c)
    })).ok && y.info("[RankDisguise] 已恢复真实段位 ✓");
  } catch (s) {
    y.error("[RankDisguise] 恢复失败:", s);
  }
}
function Rg(s) {
  s ? Ou() : yv();
}
const Ku = "data-sona-profile-bg-hijacked";
let vl = null, Al = null;
function vv() {
  Al || (Al = document.createElement("div"), Al.id = "sona-profile-bg-root", document.body.appendChild(Al), vl = Kn.createRoot(Al));
  const s = () => {
    vl == null || vl.render(
      U.createElement(rg, { open: !1, onClose: s })
    );
  };
  vl.render(
    U.createElement(rg, { open: !0, onClose: s })
  );
}
function Av() {
  vl && (vl.unmount(), vl = null), Al && (Al.remove(), Al = null);
}
function Dg() {
  const s = document.querySelector(".style-profile-skin-picker-button");
  return !s || s.hasAttribute(Ku) || (s.setAttribute(Ku, "true"), s.addEventListener("click", (c) => {
    c.stopPropagation(), c.stopImmediatePropagation(), c.preventDefault(), vv(), y.info("[ProfileBg] 拦截原生按钮点击，打开自定义弹窗");
  }, !0), y.info("[ProfileBg] 已接管皮肤选择按钮 ✓")), !0;
}
let ku = !1;
function zg(s) {
  s && !ku ? (qe.register(Dg), ku = !0, y.info("Custom profile background enabled ✓")) : !s && ku && (qe.unregister(Dg), ku = !1, Av(), document.querySelectorAll(`[${Ku}]`).forEach((c) => {
    c.removeAttribute(Ku);
  }), y.info("Custom profile background disabled"));
}
let bl = null, Sl = null;
function Rr() {
  Sl || (Sl = document.createElement("div"), Sl.id = "sona-game-analysis-root", document.body.appendChild(Sl), bl = Kn.createRoot(Sl));
  const s = () => {
    bl == null || bl.render(
      U.createElement(wr, { open: !1, onClose: s })
    );
  };
  bl.render(
    U.createElement(wr, { open: !0, onClose: s })
  ), y.info("[GameAnalysis] 战力分析弹窗已显示");
}
function wg() {
  bl && (bl.unmount(), bl = null), Sl && (Sl.remove(), Sl = null);
}
const Dr = "data-sona-game-analysis";
function hr() {
  const s = document.querySelector(".game-in-progress-container");
  if (!s) return !1;
  if (s.querySelector(`[${Dr}]`)) return !0;
  const c = document.createElement("lol-uikit-flat-button");
  return c.setAttribute(Dr, "true"), c.textContent = "对局分析", c.style.marginTop = "12px", c.addEventListener("click", (d) => {
    d.stopPropagation(), d.preventDefault(), Rr(), y.info("[GameAnalysis] 打开分析弹窗");
  }), s.appendChild(c), y.info("[GameAnalysis] 客户端内嵌按钮已注入 ✓"), !0;
}
function Ig() {
  document.querySelectorAll(`[${Dr}]`).forEach((s) => s.remove());
}
let qn = !1, Mu = 0, Fi = null;
function jg(s) {
  s && !Fi ? (Fi = B.observe(vt.GAMEFLOW_PHASE_CHANGE, (c) => {
    const d = c.data;
    d === "InProgress" ? (qn || (qe.register(hr), qn = !0), B.getGameflowSession().then((r) => {
      var h;
      const m = ((h = r.gameData) == null ? void 0 : h.gameId) ?? 0;
      m > 0 && m !== Mu && (Mu = m, Rr());
    }).catch(() => {
      Rr();
    })) : (d === "WaitingForStats" || d === "PreEndOfGame" || d === "EndOfGame") && (Mu = 0, qn && (qe.unregister(hr), qn = !1), Ig(), wg());
  }), y.info("Game analysis popup enabled ✓")) : !s && Fi && (Fi(), Fi = null, Mu = 0, qn && (qe.unregister(hr), qn = !1), Ig(), wg(), y.info("Game analysis popup disabled"));
}
let Wi = null;
function Nu(s) {
  s && !Wi ? (Wi = B.observe(vt.GAMEFLOW_PHASE_CHANGE, async (c) => {
    if (c.data === "EndOfGame") {
      const r = C.get("autoReturnMode");
      y.info("[AutoReturn] 检测到对局结束，准备执行自动返回流程..."), await ha(2e3);
      try {
        if (await B.playAgain(), y.info("[AutoReturn] 已通过 play-again 重建房间（已保留原队伍结构）✓"), r === "queue") {
          y.info("[AutoReturn] 当前模式为自动排队，准备启动匹配引擎...");
          const m = 15;
          for (let h = 1; h <= m; h++) {
            await ha(1e3);
            try {
              await B.startMatchmaking(), y.info("[AutoReturn] 正在自动匹配... ✓ (第 %d 次尝试)", h);
              break;
            } catch (v) {
              h < m ? y.info("[AutoReturn] 开始排队失败（队友可能未就绪），1s 后重试... (%d/%d)", h, m) : y.error("[AutoReturn] 开始排队失败，已达最大重试次数 %d:", m, v);
            }
          }
        }
      } catch (m) {
        y.error("[AutoReturn] 自动返回流程异常:", m);
      }
    }
  }), y.info("Auto return to lobby enabled ✓")) : !s && Wi && (Wi(), Wi = null, y.info("Auto return to lobby disabled"));
}
function bv() {
  dg(C.get("autoAcceptMatch")), C.onChange("autoAcceptMatch", dg), fg(C.get("developerMode")), C.onChange("developerMode", fg), hg(C.get("unlockStatus")), C.onChange("unlockStatus", hg), yg(C.get("benchNoCooldown")), C.onChange("benchNoCooldown", yg), Ag(C.get("analyzeTeamPower")), C.onChange("analyzeTeamPower", Ag), bg(C.get("sideIndicator")), C.onChange("sideIndicator", bg), vg(C.get("champSelectAssist")), C.onChange("champSelectAssist", vg), Cg(C.get("globalParticle")), C.onChange("globalParticle", Cg), kg(C.get("friendSmartGroup")), C.onChange("friendSmartGroup", kg), zg(C.get("customProfileBg")), C.onChange("customProfileBg", zg), Ng(C.get("autoHonor")), C.onChange("autoHonor", Ng), Rg(C.get("rankDisguise")), C.onChange("rankDisguise", Rg), C.onChange("rankQueue", () => {
    C.get("rankDisguise") && Ou();
  }), C.onChange("rankTier", () => {
    C.get("rankDisguise") && Ou();
  }), C.onChange("rankDivision", () => {
    C.get("rankDisguise") && Ou();
  }), Ug(C.get("autoLockChampion")), C.onChange("autoLockChampion", Ug), _h(C.get("balanceBuffTooltip")), C.onChange("balanceBuffTooltip", _h), tg(C.get("champSelectQuitButton")), C.onChange("champSelectQuitButton", tg), jg(C.get("gameAnalysisPopup")), C.onChange("gameAnalysisPopup", jg), Nu(C.get("autoReturnToLobby")), C.onChange("autoReturnToLobby", Nu), C.onChange("autoReturnMode", () => {
    C.get("autoReturnToLobby") && (Nu(!1), Nu(!0));
  }), lg(C.get("unlockAvailability")), C.onChange("unlockAvailability", lg), ig(C.get("hideTFT")), C.onChange("hideTFT", ig), cg(C.get("hideRightNavText")), C.onChange("hideRightNavText", cg);
  const s = C.get("windowEffect");
  s && s !== "none" && (Effect.apply(s, { color: "#0006" }), y.info("Restored window effect: %s", s)), y.info("Features initialized ✓");
}
const Og = {
  top: 1,
  jungle: 2,
  mid: 3,
  bot: 4,
  utility: 5
}, Uu = (s) => [...s].sort((c, d) => {
  const r = Og[c.selectedPosition] ?? 99, m = Og[d.selectedPosition] ?? 99;
  return r - m;
}), Ru = {
  CHALLENGER: "#f1c40f",
  GRANDMASTER: "#e74c3c",
  MASTER: "#9b59b6",
  DIAMOND: "#3498db",
  EMERALD: "#00d084",
  PLATINUM: "#b8c4cc",
  GOLD: "#c8aa6e",
  SILVER: "#a09b8c",
  BRONZE: "#cd7f32",
  IRON: "#7e7e7e",
  UNRANKED: "#5c5b57"
}, Sv = {
  CHALLENGER: "最强王者",
  GRANDMASTER: "傲世宗师",
  MASTER: "超凡大师",
  DIAMOND: "璀璨钻石",
  EMERALD: "流光翡翠",
  PLATINUM: "华贵铂金",
  GOLD: "荣耀黄金",
  SILVER: "不屈白银",
  BRONZE: "英勇青铜",
  IRON: "坚韧黑铁"
}, zr = ["#e8a424", "#4a9eff", "#5bbd72", "#e74c3c", "#c084fc"], Ev = [
  "rgba(232, 164, 36, 0.15)",
  "rgba(74, 158, 255, 0.15)",
  "rgba(91, 189, 114, 0.15)",
  "rgba(231, 76, 60, 0.15)",
  "rgba(192, 132, 252, 0.15)"
];
function wr({ open: s, onClose: c, mockData: d }) {
  const [r, m] = U.useState([]), [h, v] = U.useState([]), [T, S] = U.useState(null), [p, z] = U.useState(!1), [E, Q] = U.useState(""), [ee, re] = U.useState(/* @__PURE__ */ new Map()), ae = U.useCallback(async () => {
    if (z(!0), Q(""), m([]), v([]), S(null), re(/* @__PURE__ */ new Map()), d) {
      m(Uu(d.blueTeam)), v(Uu(d.redTeam)), S(d.gameInfo), z(!1);
      return;
    }
    try {
      const $ = await B.getGameflowSession(), de = $.gameData.teamOne ?? [], W = $.gameData.teamTwo ?? [], le = $.gameData.playerChampionSelections ?? [], ne = Math.ceil(le.length / 2) || 5, ke = le.slice(0, ne), ue = le.slice(ne), Xe = /* @__PURE__ */ new Map();
      for (const V of [...de, ...W])
        Xe.set(V.puuid, V);
      const X = (await B.getSummonerInfo()).puuid, j = de.some((V) => V.puuid === X) || ke.some((V) => V.puuid === X);
      S({
        queueName: $.gameData.queue.name,
        gameMode: $.gameData.queue.gameMode,
        mapName: $.map.name,
        isBlueTeam: j,
        queueId: $.gameData.queue.id
      });
      const F = /* @__PURE__ */ new Map(), he = /* @__PURE__ */ new Map();
      for (const V of [...de, ...W]) {
        const P = V.teamParticipantId;
        P && P > 0 && (he.has(P) || he.set(P, []), he.get(P).push(V.puuid));
      }
      let Ee = 0;
      he.forEach((V, P) => {
        if (V.length >= 2) {
          const fe = zr[Ee % zr.length];
          Ee++;
          const ve = String.fromCharCode(65 + (Ee - 1) % 26);
          for (const Je of V)
            F.set(Je, ve);
        }
      }), re(new Map(F));
      const D = $.gameData.queue.id, H = as(D), G = (V) => V.map((P) => {
        var fe;
        return {
          puuid: P.puuid,
          championId: P.championId,
          teamParticipantId: ((fe = Xe.get(P.puuid)) == null ? void 0 : fe.teamParticipantId) ?? 0,
          isBroadcaster: !Xe.has(P.puuid)
        };
      }), ce = G(ke), se = G(ue), A = async (V) => Promise.all(V.map(async (P) => {
        var Je;
        const fe = P.isBroadcaster, ve = {
          puuid: P.puuid,
          summonerId: 0,
          summonerName: fe ? "未知" : "",
          championId: P.championId,
          teamParticipantId: P.teamParticipantId,
          selectedPosition: "",
          winRate: null,
          wins: 0,
          total: 0,
          kdaNum: 0,
          avgK: 0,
          avgD: 0,
          avgA: 0,
          rankText: "未定级",
          rankColor: Ru.UNRANKED,
          rating: "",
          premadeGroup: F.get(P.puuid) ?? null,
          recentGames: [],
          isBroadcaster: fe
        };
        try {
          const [De, Pt, _t] = await Promise.all([
            B.getSummonerByPuuid(P.puuid).catch(() => null),
            B.getRankedStats(P.puuid).catch(() => null),
            B.getSgpMatchHistory(P.puuid, {
              startIndex: 0,
              count: C.get("gameAnalysisFetchCount") || 50,
              tag: H || void 0
            }).catch(() => null)
          ]), Qa = fe ? "未知" : De != null && De.gameName ? `${De.gameName} #${De.tagLine}` : "未知";
          let ga = "未定级", At = Ru.UNRANKED;
          const pa = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"], ya = { IV: 1, III: 2, II: 3, I: 4 };
          if (Pt && typeof Pt == "object") {
            const it = Pt.queueMap;
            if (it) {
              const Ut = [];
              for (const [mt, Lt] of [["RANKED_SOLO_5x5", "单双"], ["RANKED_FLEX_SR", "灵活"]]) {
                const ta = it[mt];
                if (!ta) continue;
                const Bt = ta.tier ?? "", Rt = ta.division ?? "";
                Bt && Bt !== "UNRANKED" && Ut.push({ key: mt, label: Lt, tier: Bt, division: Rt });
              }
              if (Ut.length > 0) {
                Ut.sort((Lt, ta) => {
                  const Bt = pa.indexOf(Lt.tier), Rt = pa.indexOf(ta.tier);
                  return Bt !== Rt ? Rt - Bt : (ya[Lt.division] ?? 0) - (ya[ta.division] ?? 0);
                });
                const mt = Ut[0];
                ga = (Sv[mt.tier] ?? mt.tier) + (mt.division && mt.division !== "NA" ? ` ${mt.division}` : "") + ` ${mt.label}`, At = Ru[mt.tier] ?? Ru.UNRANKED;
              }
            }
          }
          if (!_t || !((Je = _t.games) != null && Je.length))
            return { ...ve, summonerName: Qa, rankText: ga, rankColor: At, rating: "" };
          const El = _t.games;
          let va = 0, $t = 0, ua = 0, ea = 0;
          const Xa = [];
          for (const Ka of El) {
            const it = Ka.json.participants.find((Ut) => Ut.puuid === P.puuid);
            it && (it.win && va++, $t += it.kills, ua += it.deaths, ea += it.assists, Xa.length < 5 && Xa.push({
              championId: it.championId,
              win: it.win,
              kills: it.kills,
              deaths: it.deaths,
              assists: it.assists
            }));
          }
          const bt = El.length, nt = bt > 0 ? va / bt * 100 : 0, Cl = ua === 0 ? $t + ea : ($t + ea) / ua;
          return {
            ...ve,
            summonerName: Qa,
            winRate: nt,
            wins: va,
            total: bt,
            kdaNum: Cl,
            avgK: bt > 0 ? $t / bt : 0,
            avgD: bt > 0 ? ua / bt : 0,
            avgA: bt > 0 ? ea / bt : 0,
            rankText: ga,
            rankColor: At,
            rating: r0(nt, Cl),
            recentGames: Xa
          };
        } catch {
          return { ...ve, summonerName: "未知" };
        }
      })), [I, K] = await Promise.all([
        A(ce),
        A(se)
      ]);
      m(Uu(j ? I : K)), v(Uu(j ? K : I));
    } catch ($) {
      Q("获取对局信息失败"), console.error("[GameAnalysis] 加载失败:", $);
    } finally {
      z(!1);
    }
  }, [d]);
  U.useEffect(() => {
    s && ae();
  }, [s, ae]);
  const ye = ($) => {
    const de = $.filter((W) => W.winRate != null);
    return de.length === 0 ? null : Math.round(de.reduce((W, le) => W + le.winRate, 0) / de.length);
  }, Y = ye(r), Z = ye(h);
  return /* @__PURE__ */ u.jsx(Zu, { open: s, onClose: c, width: 1160, height: 645, closable: !0, children: /* @__PURE__ */ u.jsxs("div", { className: "sga-container", children: [
    /* @__PURE__ */ u.jsxs("div", { className: "sga-header", children: [
      /* @__PURE__ */ u.jsxs("div", { className: "sga-header-left", children: [
        /* @__PURE__ */ u.jsx("span", { className: "sga-header-icon", children: "❖" }),
        /* @__PURE__ */ u.jsxs("span", { className: "sga-header-title", children: [
          "对局分析",
          /* @__PURE__ */ u.jsxs("span", { className: "sga-header-subtitle", children: [
            "（本模式近",
            C.get("gameAnalysisFetchCount") || 50,
            "局）"
          ] })
        ] })
      ] }),
      T && /* @__PURE__ */ u.jsxs("span", { className: "sga-header-info", children: [
        T.mapName,
        " · ",
        T.queueName
      ] })
    ] }),
    /* @__PURE__ */ u.jsxs("div", { className: "sga-body", children: [
      p && /* @__PURE__ */ u.jsxs("div", { className: "sga-loading", children: [
        /* @__PURE__ */ u.jsx("div", { className: "sga-loading-spinner" }),
        /* @__PURE__ */ u.jsx("span", { children: "正在分析对局数据..." })
      ] }),
      E && /* @__PURE__ */ u.jsx("div", { className: "sga-error", children: E }),
      !p && !E && (r.length > 0 || h.length > 0) && /* @__PURE__ */ u.jsxs("div", { className: "sga-teams", children: [
        /* @__PURE__ */ u.jsxs("div", { className: "sga-team", children: [
          /* @__PURE__ */ u.jsxs("div", { className: "sga-team-header sga-team-header--blue", children: [
            /* @__PURE__ */ u.jsx("span", { className: "sga-team-name", children: "蓝色方" }),
            Y != null && /* @__PURE__ */ u.jsxs("span", { className: "sga-team-avg", children: [
              "平均胜率 ",
              /* @__PURE__ */ u.jsxs("span", { className: `sga-team-avg-num ${Y > 50 ? "sga-avg-green" : "sga-avg-red"}`, children: [
                Y,
                "%"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ u.jsx("div", { className: "sga-team-players", children: r.map(($, de) => /* @__PURE__ */ u.jsx(qg, { player: $, isRed: !1, queueId: T == null ? void 0 : T.queueId }, $.puuid || de)) })
        ] }),
        /* @__PURE__ */ u.jsxs("div", { className: "sga-team", children: [
          /* @__PURE__ */ u.jsxs("div", { className: "sga-team-header sga-team-header--red", children: [
            /* @__PURE__ */ u.jsx("span", { className: "sga-team-name", children: "红色方" }),
            Z != null && /* @__PURE__ */ u.jsxs("span", { className: "sga-team-avg", children: [
              "平均胜率 ",
              /* @__PURE__ */ u.jsxs("span", { className: `sga-team-avg-num ${Z > 50 ? "sga-avg-green" : "sga-avg-red"}`, children: [
                Z,
                "%"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ u.jsx("div", { className: "sga-team-players", children: h.map(($, de) => /* @__PURE__ */ u.jsx(qg, { player: $, isRed: !0, queueId: T == null ? void 0 : T.queueId }, $.puuid || de)) })
        ] })
      ] }),
      !p && !E && r.length === 0 && h.length === 0 && /* @__PURE__ */ u.jsx("div", { className: "sga-empty", children: "暂无对局数据" })
    ] })
  ] }) });
}
function gr(s, c) {
  const d = String(s);
  return c ? /* @__PURE__ */ u.jsx("span", { style: { color: "#ff4444" }, children: d }) : d;
}
function qg({ player: s, isRed: c, queueId: d }) {
  const r = s.winRate, m = r != null ? r >= 70 ? "#e8a424" : r >= 50 ? "#5bbd72" : r >= 30 ? "#e84057" : "#9b59b6" : "#5c5b57", h = r != null ? r >= 70 ? "#e8a424" : r >= 50 ? "#5bbd72" : r >= 30 ? "#e84057" : "#9b59b6" : "#3c2e16", v = s.kdaNum >= 99 ? "Perfect" : s.kdaNum.toFixed(1), T = s.kdaNum >= 3 ? "#5bbd72" : "#e74c3c", S = s.premadeGroup, p = S ? S.charCodeAt(0) - 65 : -1, z = p >= 0 ? zr[p] ?? "#c8aa6e" : void 0, E = p >= 0 ? Ev[p] ?? void 0 : void 0, Q = () => {
    s.puuid && Cv(s.puuid, s.summonerName || "???", d);
  };
  return /* @__PURE__ */ u.jsxs(
    "div",
    {
      className: `sga-player-wrapper ${c ? "sga-player-wrapper--red" : ""} ${s.isBroadcaster ? "sga-player-wrapper--broadcaster" : ""}`,
      style: {
        ...E ? { background: E } : {}
      },
      onClick: Q,
      children: [
        /* @__PURE__ */ u.jsxs(
          "div",
          {
            className: `sga-player ${c ? "sga-player--red" : "sga-player--blue"}`,
            children: [
              /* @__PURE__ */ u.jsx("div", { className: "sga-player-champ", children: s.championId > 0 ? /* @__PURE__ */ u.jsx("img", { className: "sga-player-champ-img", src: br(s.championId), alt: "" }) : /* @__PURE__ */ u.jsx("div", { className: "sga-player-champ-placeholder" }) }),
              /* @__PURE__ */ u.jsxs("div", { className: "sga-player-info", children: [
                /* @__PURE__ */ u.jsxs("div", { className: "sga-player-name-row", children: [
                  /* @__PURE__ */ u.jsx("span", { className: "sga-player-name", children: s.summonerName || "???" }),
                  s.isBroadcaster && /* @__PURE__ */ u.jsx("span", { className: "sga-broadcaster-badge", children: "主播模式" }),
                  S && /* @__PURE__ */ u.jsx("span", { className: "sga-premade-badge", style: { background: z }, children: S })
                ] }),
                /* @__PURE__ */ u.jsxs("span", { className: "sga-player-rank", style: { color: s.rankColor || "#5c5b57" }, children: [
                  c && s.rating ? /* @__PURE__ */ u.jsxs("span", { className: "sga-player-rating", children: [
                    s.rating,
                    " · "
                  ] }) : null,
                  s.rankText || "未定级",
                  !c && s.rating ? /* @__PURE__ */ u.jsxs("span", { className: "sga-player-rating", children: [
                    " · ",
                    s.rating
                  ] }) : null
                ] })
              ] }),
              /* @__PURE__ */ u.jsx("div", { className: "sga-player-winrate", children: r != null ? /* @__PURE__ */ u.jsxs(u.Fragment, { children: [
                /* @__PURE__ */ u.jsxs("div", { className: "sga-winrate-text", children: [
                  /* @__PURE__ */ u.jsxs("span", { style: { color: m, fontWeight: "bold" }, children: [
                    r.toFixed(0),
                    "%"
                  ] }),
                  /* @__PURE__ */ u.jsxs("span", { className: "sga-winrate-wl", children: [
                    /* @__PURE__ */ u.jsxs("span", { className: "sga-wl-win", children: [
                      s.wins,
                      " 胜"
                    ] }),
                    /* @__PURE__ */ u.jsx("span", { className: "sga-wl-sep", children: " / " }),
                    /* @__PURE__ */ u.jsxs("span", { className: "sga-wl-loss", children: [
                      s.total - s.wins,
                      " 负"
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ u.jsx("div", { className: "sga-winrate-bar", children: /* @__PURE__ */ u.jsx("div", { className: "sga-winrate-bar-fill", style: { width: `${r}%`, background: h } }) })
              ] }) : /* @__PURE__ */ u.jsx("span", { className: "sga-no-data", children: "无数据" }) }),
              /* @__PURE__ */ u.jsx("div", { className: "sga-player-kda", children: r != null ? /* @__PURE__ */ u.jsxs(u.Fragment, { children: [
                /* @__PURE__ */ u.jsx("span", { style: { color: T, fontWeight: "bold" }, children: v }),
                /* @__PURE__ */ u.jsx("span", { className: "sga-kda-label", children: " KDA" })
              ] }) : /* @__PURE__ */ u.jsx("span", { className: "sga-no-data", children: "—" }) })
            ]
          }
        ),
        s.recentGames.length > 0 ? /* @__PURE__ */ u.jsx("div", { className: "sga-recent", children: s.recentGames.map((ee, re) => /* @__PURE__ */ u.jsxs("div", { className: `sga-recent-game ${ee.win ? "sga-recent-win" : "sga-recent-loss"}`, children: [
          /* @__PURE__ */ u.jsx("img", { className: "sga-recent-champ", src: br(ee.championId), alt: "" }),
          /* @__PURE__ */ u.jsxs("span", { className: "sga-recent-kda", children: [
            gr(ee.kills, ee.kills >= ee.deaths && ee.kills >= ee.assists),
            /* @__PURE__ */ u.jsx("span", { className: "sga-kda-slash", children: "/" }),
            gr(ee.deaths, ee.deaths >= ee.kills && ee.deaths >= ee.assists),
            /* @__PURE__ */ u.jsx("span", { className: "sga-kda-slash", children: "/" }),
            gr(ee.assists, ee.assists >= ee.kills && ee.assists >= ee.deaths)
          ] })
        ] }, re)) }) : null
      ]
    }
  );
}
let Pi = null, _i = null;
function Cv(s, c, d) {
  _i || (_i = document.createElement("div"), _i.id = "sona-game-analysis-match-modal-root", document.body.appendChild(_i), Pi = Kn.createRoot(_i));
  const r = () => {
    Pi == null || Pi.render(
      U.createElement(ls, { open: !1, onClose: r, puuid: "", playerName: "" })
    );
  };
  Pi.render(
    U.createElement(ls, { open: !0, onClose: r, puuid: s, playerName: c, queueId: d })
  );
}
function Tv() {
  const [s, c] = U.useState(""), [d, r] = U.useState(""), [m, h] = U.useState(""), [v, T] = U.useState(""), [S, p] = U.useState("celebration"), [z, E] = U.useState(""), [Q, ee] = U.useState(""), [re, ae] = U.useState(""), [ye, Y] = U.useState(""), [Z, $] = U.useState([]), [de, W] = U.useState(!1), [le, ne] = U.useState(0), [ke, ue] = U.useState(!1), Xe = U.useRef(null);
  U.useEffect(() => {
    const j = (F) => {
      Xe.current && !Xe.current.contains(F.target) && W(!1);
    };
    return document.addEventListener("mousedown", j), () => document.removeEventListener("mousedown", j);
  }, []);
  const X = async (j, F) => {
    c(`⏳ ${j}...`);
    try {
      const he = await F();
      y.info(`%s ↓ 
%o`, j, he);
      const Ee = JSON.stringify(he, null, 2);
      c(`✅ ${j}
${Ee}`);
    } catch (he) {
      c(`❌ ${j}
${String(he)}`);
    }
  };
  return /* @__PURE__ */ u.jsxs("div", { className: "sona-settings", children: [
    /* @__PURE__ */ u.jsx("h2", { className: "sona-settings-title", children: "调试面板" }),
    /* @__PURE__ */ u.jsx(Qe, { title: "LCU API 测试", children: /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", children: [
      /* @__PURE__ */ u.jsx(J, { onClick: () => X("获取召唤师信息", () => B.getSummonerInfo()), children: "获取召唤师信息" }),
      /* @__PURE__ */ u.jsx(J, { onClick: () => X("获取在线状态", () => B.getChatMe()), children: "获取在线状态" }),
      /* @__PURE__ */ u.jsx(J, { onClick: () => X("获取游戏流程", () => B.getGameflowPhase()), children: "游戏流程阶段" }),
      /* @__PURE__ */ u.jsx(J, { onClick: () => X("获取聊天会话", () => B.getChatConversations()), children: "聊天会话列表" })
    ] }) }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "英雄选择 (ARAM)", children: [
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", children: [
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("ARAM 重随", () => B.reroll()), children: "重随英雄" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("英雄选择会话", () => B.getChampSelectSession()), children: "选人 Session" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("GameFlow Session", () => B.getGameflowSession()), children: "GameFlow Session" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("共享池英雄", () => B.getBenchChampions()), children: "Bench 英雄" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("可选英雄列表", () => B.getPickableChampionIds()), children: "可选英雄" })
      ] }),
      /* @__PURE__ */ u.jsx("p", { className: "sona-subtitle", children: "点击选取共享池对应槽位的英雄" }),
      /* @__PURE__ */ u.jsx("div", { className: "sona-debug-actions", children: Array.from({ length: 10 }, (j, F) => /* @__PURE__ */ u.jsx(J, { style: { minWidth: 40, padding: "6px 0" }, onClick: () => X(`Bench 换英雄 (槽位 ${F + 1})`, async () => {
        const he = await B.getBenchChampions();
        if (F >= he.length) throw new Error(`槽位 ${F + 1} 不存在，当前 Bench 共 ${he.length} 个英雄`);
        const Ee = he[F];
        return y.info("尝试换取槽位 %d 的英雄 → championId: %d", F + 1, Ee.championId), B.benchSwap(Ee.championId);
      }), children: F + 1 }, F)) })
    ] }),
    /* @__PURE__ */ u.jsx(Qe, { title: "信息查询", children: /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { alignItems: "flex-end", gap: 8 }, children: [
      /* @__PURE__ */ u.jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ u.jsx(
        Nt,
        {
          value: z,
          onChange: E,
          placeholder: "名字#Tag (例: 丨一疾风剑豪一丨#77772)"
        }
      ) }),
      /* @__PURE__ */ u.jsx(J, { onClick: () => {
        const j = z.trim().split("#");
        if (j.length !== 2 || !j[0] || !j[1]) {
          c("❌ 格式: 名字#Tag");
          return;
        }
        X(`查询召唤师 ${z}`, () => B.getSummonerByRiotId(j[0], j[1]));
      }, children: "查询 PUUID" })
    ] }) }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "战绩查询", children: [
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", children: [
        /* @__PURE__ */ u.jsx(J, { variant: "primary", onClick: () => X("贪婪拉取 100 条战绩", async () => {
          var D;
          const F = (await B.getSummonerInfo()).puuid;
          if (!F) return "❌ 无法获取 PUUID";
          const Ee = ((D = (await B.getMatchHistory(F, 0, 99)).games) == null ? void 0 : D.games) || [];
          return { total: Ee.length, games: Ee };
        }), children: "贪婪拉取战绩 (100场)" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("最近一起玩的人", () => B.getRecentlyPlayedSummoners()), children: "最近队友" })
      ] }),
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { marginTop: 8, alignItems: "flex-end", gap: 8 }, children: [
        /* @__PURE__ */ u.jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ u.jsx(
          Nt,
          {
            value: m,
            onChange: h,
            placeholder: "输入 PUUID 查他人战绩..."
          }
        ) }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => {
          if (!m.trim()) {
            c("❌ 请输入 PUUID");
            return;
          }
          X(`战绩 (${m.slice(0, 8)}...)`, () => B.getMatchHistory(m.trim()));
        }, children: "查询战绩" })
      ] }),
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { marginTop: 8, alignItems: "flex-end", gap: 8 }, children: [
        /* @__PURE__ */ u.jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ u.jsx(
          Nt,
          {
            value: d,
            onChange: r,
            placeholder: "输入 Game ID..."
          }
        ) }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => {
          const j = Number(d);
          if (!j) {
            c("❌ 请输入有效的 Game ID");
            return;
          }
          X(`对局详情 #${j}`, () => B.getMatchDetail(j));
        }, children: "对局详情" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => {
          const j = Number(d);
          if (!j) {
            c("❌ 请输入有效的 Game ID");
            return;
          }
          X(`时间线 #${j}`, () => B.getMatchTimeline(j));
        }, children: "时间线" })
      ] })
    ] }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "SGP Token & 直连调试", children: [
      /* @__PURE__ */ u.jsx("p", { className: "sona-subtitle", children: "测试从 LCU 获取 SGP 所需的 Token，并尝试直接请求 SGP 战绩接口。" }),
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", children: [
        /* @__PURE__ */ u.jsx(J, { variant: "primary", onClick: () => X("Entitlements Token", () => B.getEntitlementsToken()), children: "获取 Entitlements Token" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("League Session Token", () => B.getLeagueSessionToken()), children: "获取 Session Token" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("SGP Server ID (从 issuer 解析)", () => B.getSgpServerId()), children: "解析 SGP Server ID" })
      ] }),
      /* @__PURE__ */ u.jsx("div", { className: "sona-debug-actions", style: { marginTop: 8 }, children: /* @__PURE__ */ u.jsx(J, { onClick: () => X("SGP 直连: 自己战绩", async () => {
        var ce;
        const [j, F, he] = await Promise.all([
          B.getEntitlementsToken(),
          B.getSummonerInfo(),
          B.getSgpServerId()
        ]), Ee = Kg[he.toUpperCase()], D = Ee == null ? void 0 : Ee.matchHistory;
        if (!D)
          return { error: `未知 SGP 服务器 ID: ${he}`, issuer: j.issuer, sgpServerId: he };
        const H = `${D}/match-history-query/v1/products/lol/player/${F.puuid}/SUMMARY?startIndex=0&count=10`, G = {
          sgpServerId: he,
          baseUrl: D,
          puuid: F.puuid,
          requestUrl: H,
          tokenPreview: ((ce = j.accessToken) == null ? void 0 : ce.slice(0, 40)) + "..."
        };
        try {
          const se = await fetch(H, {
            headers: {
              Authorization: `Bearer ${j.accessToken}`,
              "User-Agent": "LeagueOfLegendsClient/14.13.596.7996 (rcp-be-lol-match-history)"
            }
          });
          if (G.status = se.status, G.statusText = se.statusText, G.ok = se.ok, se.ok) {
            const A = await se.json();
            G.dataPreview = A;
          } else
            G.errorBody = await se.text().catch(() => "");
        } catch (se) {
          G.fetchError = se instanceof Error ? se.message : String(se), G.hint = "如果看到 CORS/Network 错误，说明 CEF 浏览器拦截了跨域请求，SGP 直连走不通";
        }
        return G;
      }), children: "SGP 直连: 自己战绩" }) })
    ] }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "聊天调试", children: [
      /* @__PURE__ */ u.jsx("p", { className: "sona-subtitle", children: "向当前英雄选择聊天框发送指定类型的消息。celebration / system / information 仅自己可见，chat 所有人可见。" }),
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { gap: 8 }, children: [
        /* @__PURE__ */ u.jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ u.jsx(
          Nt,
          {
            value: v,
            onChange: T,
            placeholder: "输入要发送的消息..."
          }
        ) }),
        /* @__PURE__ */ u.jsx(
          Wt,
          {
            value: S,
            onChange: p,
            options: [
              { value: "chat", label: "chat (所有人可见)" },
              { value: "celebration", label: "celebration (仅自己可见)" },
              { value: "system", label: "system (仅自己可见)" },
              { value: "information", label: "information (仅自己可见)" }
            ]
          }
        ),
        /* @__PURE__ */ u.jsx(J, { onClick: () => {
          if (!v.trim()) {
            c("❌ 请输入消息");
            return;
          }
          X(`发送聊天 [${S}] (${v.length}字)`, () => B.sendChampSelectMessage(v, S));
        }, children: "发送" })
      ] }),
      /* @__PURE__ */ u.jsxs("p", { className: "sona-subtitle", children: [
        "字数: ",
        v.length
      ] })
    ] }),
    /* @__PURE__ */ u.jsx(Qe, { title: "客户端操作", children: /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", children: [
      /* @__PURE__ */ u.jsx(J, { onClick: () => window.openDevTools(), children: "打开 DevTools" }),
      /* @__PURE__ */ u.jsx(J, { onClick: () => window.openPluginsFolder(), children: "打开插件目录" }),
      /* @__PURE__ */ u.jsx(J, { variant: "secondary", onClick: () => window.reloadClient(), children: "重载客户端" }),
      /* @__PURE__ */ u.jsx(J, { onClick: () => ue(!0), children: "对局分析面板" })
    ] }) }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "游戏资源", children: [
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", children: [
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("物品列表 (items.json)", () => B.getItems()), children: "物品图标" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("召唤师技能 (summoner-spells.json)", () => B.getSummonerSpells()), children: "技能图标" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("英雄摘要 (champion-summary.json)", () => B.getChampionSummary()), children: "英雄摘要数据" })
      ] }),
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { marginTop: 8, alignItems: "flex-start", gap: 8 }, children: [
        /* @__PURE__ */ u.jsxs("div", { style: { flex: 1, position: "relative" }, ref: Xe, children: [
          /* @__PURE__ */ u.jsx(
            Nt,
            {
              value: ye,
              onChange: (j) => {
                Y(j);
                const F = Yg(j);
                $(F), W(F.length > 0);
              },
              placeholder: "搜索英雄 (名字/称号/英文名)"
            }
          ),
          de && Z.length > 0 && /* @__PURE__ */ u.jsx("div", { className: "sona-champ-suggest", children: Z.map((j) => /* @__PURE__ */ u.jsxs(
            "button",
            {
              className: "sona-champ-suggest-item",
              type: "button",
              onClick: () => {
                Y(`${j.title} ${j.name}`), ne(j.id), W(!1);
              },
              children: [
                /* @__PURE__ */ u.jsx("img", { className: "sona-champ-suggest-icon", src: `/lol-game-data/assets/v1/champion-icons/${j.id}.png`, alt: "" }),
                /* @__PURE__ */ u.jsx("span", { className: "sona-champ-suggest-title", children: j.title }),
                /* @__PURE__ */ u.jsx("span", { className: "sona-champ-suggest-name", children: j.name })
              ]
            },
            j.id
          )) })
        ] }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => {
          if (!le) {
            c("❌ 请先选择一个英雄");
            return;
          }
          X(`英雄完整数据 #${le}`, async () => (await fetch(`/lol-game-data/assets/v1/champions/${le}.json`)).json());
        }, children: "查询完整数据" })
      ] }),
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { marginTop: 8 }, children: [
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("符文列表 (perks.json)", () => B.getPerks()), children: "符文列表" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("符文系 (perkstyles.json)", () => B.getPerkStyles()), children: "符文系" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("好友列表 (friends)", () => B.getFriends()), children: "好友列表" })
      ] }),
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { marginTop: 8 }, children: [
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("队列列表 (queues)", () => B.getQueues()), children: "队列列表" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("游戏模式 (game-type-config)", () => B.getGameModes()), children: "游戏模式" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("地图信息 (maps)", () => B.getMaps()), children: "地图信息" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("地图资源 (maps.json)", () => B.getMapAssets()), children: "地图资源" })
      ] })
    ] }),
    /* @__PURE__ */ u.jsx(Qe, { title: "回放调试", children: /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { alignItems: "flex-end", gap: 8 }, children: [
      /* @__PURE__ */ u.jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ u.jsx(
        Nt,
        {
          value: d,
          onChange: r,
          placeholder: "输入 Game ID..."
        }
      ) }),
      /* @__PURE__ */ u.jsx(J, { onClick: () => {
        const j = Number(d);
        if (!j) {
          c("❌ 请输入 Game ID");
          return;
        }
        X(`回放元数据 #${j}`, async () => {
          const F = await fetch(`/lol-replays/v1/metadata/${j}`);
          return F.ok ? F.json() : `❌ ${F.status} ${await F.text()}`;
        });
      }, children: "查状态" }),
      /* @__PURE__ */ u.jsx(J, { onClick: () => {
        const j = Number(d);
        if (!j) {
          c("❌ 请输入 Game ID");
          return;
        }
        X(`直接观看 #${j} (不下载)`, async () => {
          const F = await fetch(`/lol-replays/v1/rofls/${j}/watch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ componentType: "replay", contextData: "match-history" })
          });
          return F.ok ? "✅ 已发送观看请求" : `❌ ${F.status} ${await F.text()}`;
        });
      }, children: "直接观看" }),
      /* @__PURE__ */ u.jsx(J, { variant: "secondary", onClick: () => {
        const j = Number(d);
        if (!j) {
          c("❌ 请输入 Game ID");
          return;
        }
        X(`下载回放 #${j}`, async () => {
          const F = await fetch(`/lol-replays/v1/rofls/${j}/download`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ componentType: "replay", contextData: "match-history" })
          });
          return F.ok ? "✅ 已发送下载请求" : `❌ ${F.status} ${await F.text()}`;
        });
      }, children: "下载" })
    ] }) }),
    /* @__PURE__ */ u.jsx(Qe, { title: "荣誉 & 点赞", children: /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", children: [
      /* @__PURE__ */ u.jsx(J, { onClick: () => X("荣誉选票 (ballot)", async () => (await fetch("/lol-honor-v2/v1/ballot")).json()), children: "查看选票" }),
      /* @__PURE__ */ u.jsx(J, { onClick: () => X("荣誉配置", async () => (await fetch("/lol-honor-v2/v1/config")).json()), children: "荣誉配置" }),
      /* @__PURE__ */ u.jsx(J, { onClick: () => X("最近荣誉", async () => (await fetch("/lol-honor-v2/v1/latest-eligible-game")).json()), children: "最近可荣誉" }),
      /* @__PURE__ */ u.jsx(J, { variant: "primary", onClick: () => X("随机点赞全部票数", async () => {
        var G;
        const j = await fetch("/lol-honor-v2/v1/ballot");
        if (!j.ok) return `❌ 当前没有待点赞对局 ${j.status}`;
        const F = await j.json(), he = F.eligibleAllies || [];
        if (he.length === 0) return "⚠️ 没有可点赞的队友";
        const Ee = ((G = F.votePool) == null ? void 0 : G.votes) ?? 1, D = ["HEART", "COOL", "SHOTCALLER"], H = [];
        for (let ce = 0; ce < Ee; ce++) {
          const se = he[Math.floor(Math.random() * he.length)], A = D[Math.floor(Math.random() * D.length)], I = await fetch("/lol-honor-v2/v1/honor-player", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ puuid: se.puuid, summonerId: se.summonerId, gameId: F.gameId, honorCategory: A })
          });
          H.push(I.ok ? `✅ [${A}] → ${se.championName}` : `❌ ${I.status}`);
        }
        return H.join(`
`);
      }), children: "随机点赞" })
    ] }) }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "房间 & 组队", children: [
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", children: [
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("房间信息 (lobby)", async () => (await fetch("/lol-lobby/v2/lobby")).json()), children: "房间信息" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("房间成员 (members)", async () => (await fetch("/lol-lobby/v2/lobby/members")).json()), children: "成员列表" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("邀请列表 (invitations)", async () => (await fetch("/lol-lobby/v2/lobby/invitations")).json()), children: "邀请列表" })
      ] }),
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { marginTop: 8, alignItems: "flex-end", gap: 8 }, children: [
        /* @__PURE__ */ u.jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ u.jsx(
          Nt,
          {
            value: re,
            onChange: ae,
            placeholder: "输入 Queue ID (如 450=大乱斗)"
          }
        ) }),
        /* @__PURE__ */ u.jsx(J, { variant: "primary", onClick: () => {
          const j = Number(re);
          if (!j) {
            c("❌ 请输入有效的 Queue ID");
            return;
          }
          X(`创建房间 queueId=${j}`, () => B.createLobby(j));
        }, children: "创建房间" })
      ] })
    ] }),
    /* @__PURE__ */ u.jsx(Qe, { title: "头像框 & 头像", children: /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", children: [
      /* @__PURE__ */ u.jsx(J, { onClick: () => X("Regalia v2", async () => (await fetch("/lol-regalia/v2/current-summoner/regalia")).json()), children: "查看 Regalia" }),
      /* @__PURE__ */ u.jsx(J, { onClick: () => X("当前头像", async () => (await fetch("/lol-summoner/v1/current-summoner")).json()), children: "当前召唤师" }),
      /* @__PURE__ */ u.jsx(J, { variant: "primary", onClick: () => X("恢复默认头像 (id=29)", async () => (await fetch("/lol-summoner/v1/current-summoner/icon", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileIconId: 29 })
      })).json()), children: "恢复默认头像" })
    ] }) }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "生涯背景", children: [
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", children: [
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("summoner-profile", async () => (await fetch("/lol-summoner/v1/current-summoner/summoner-profile")).json()), children: "当前 Profile" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("backdrop", async () => (await fetch("/lol-collections/v1/inventories/local/backdrop")).json()), children: "Backdrop" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("获取皮肤库存", async () => {
          const j = await fetch("/lol-summoner/v1/current-summoner");
          if (!j.ok) return "❌ 获取个人信息失败";
          const F = await j.json(), he = await fetch(`/lol-champions/v1/inventories/${F.summonerId}/skins-minimal`);
          return he.ok ? (await he.json()).filter((H) => {
            var G;
            return (G = H.ownership) == null ? void 0 : G.owned;
          }) : `❌ ${he.status} 获取皮肤失败`;
        }), children: "皮肤库存" })
      ] }),
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { marginTop: 8, alignItems: "flex-end", gap: 8 }, children: [
        /* @__PURE__ */ u.jsx("div", { style: { flex: 1 }, children: /* @__PURE__ */ u.jsx(
          Nt,
          {
            value: Q,
            onChange: ee,
            placeholder: "输入皮肤 ID (如 777058)"
          }
        ) }),
        /* @__PURE__ */ u.jsx(J, { variant: "primary", onClick: () => {
          const j = Number(Q);
          if (!j && j !== 0) {
            c("❌ 请输入有效的皮肤 ID");
            return;
          }
          X(`设置生涯背景 skinId=${j}`, async () => {
            const F = await fetch("/lol-summoner/v1/current-summoner/summoner-profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: "backgroundSkinId", value: j })
            });
            return F.ok ? `✅ 背景已设置为 ${j}` : `❌ ${F.status} ${await F.text()}`;
          });
        }, children: "设置背景" })
      ] })
    ] }),
    /* @__PURE__ */ u.jsx(Qe, { title: "客户端配置", children: /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", children: [
      /* @__PURE__ */ u.jsx(J, { onClick: () => X("常规设置 (game-settings)", () => B.getGameSettings()), children: "常规设置" }),
      /* @__PURE__ */ u.jsx(J, { onClick: () => X("热键设置 (input-settings)", () => B.getInputSettings()), children: "热键设置" }),
      /* @__PURE__ */ u.jsx(J, { onClick: () => X("游戏版本 (game-version)", () => B.getGameVersion()), children: "游戏版本" }),
      /* @__PURE__ */ u.jsx(J, { onClick: () => X(
        "英雄平衡数据 (meta + count)",
        () => Promise.resolve({ meta: uy(), count: sy().length })
      ), children: "英雄平衡数据" })
    ] }) }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "区域 & 炫彩", children: [
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", children: [
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("区域语言", async () => (await fetch("/riotclient/region-locale")).json()), children: "区域语言" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("炫彩目录", async () => (await fetch("/lol-store/v1/catalog?inventoryType=CHROMA")).json()), children: "炫彩目录" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("功能开关", async () => (await fetch("/lol-platform-config/v3/namespaces/FeatureToggles")).json()), children: "功能开关" })
      ] }),
      /* @__PURE__ */ u.jsxs("div", { className: "sona-debug-actions", style: { marginTop: 8 }, children: [
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("配置命名空间", async () => (await fetch("/lol-platform-config/v3/namespaces")).json()), children: "配置命名空间" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("Chromas 配置", async () => (await fetch("/lol-platform-config/v3/namespaces/Chromas")).json()), children: "Chromas 配置" }),
        /* @__PURE__ */ u.jsx(J, { onClick: () => X("商店配置", async () => (await fetch("/lol-platform-config/v3/namespaces/LcuStore")).json()), children: "商店配置" })
      ] })
    ] }),
    /* @__PURE__ */ u.jsxs(Qe, { title: "Store 调试", children: [
      /* @__PURE__ */ u.jsx(He, { title: "当前配置快照", description: "查看所有持久化配置的当前值", children: /* @__PURE__ */ u.jsx(J, { onClick: () => c(JSON.stringify(C.getAll(), null, 2)), children: "查看" }) }),
      /* @__PURE__ */ u.jsx(He, { title: "重置所有配置", description: "将所有配置恢复为默认值", children: /* @__PURE__ */ u.jsx(J, { variant: "secondary", onClick: () => {
        C.resetAll(), c("✅ 已重置所有配置");
      }, children: "重置" }) })
    ] }),
    s && /* @__PURE__ */ u.jsx("div", { className: "sona-debug-output", children: /* @__PURE__ */ u.jsx("pre", { children: s }) }),
    /* @__PURE__ */ u.jsx(wr, { open: ke, onClose: () => ue(!1), mockData: xv })
  ] });
}
const xv = {
  gameInfo: {
    queueName: "排位赛 单双排",
    gameMode: "CLASSIC",
    mapName: "召唤师峡谷",
    isBlueTeam: !0,
    queueId: 420
  },
  blueTeam: [
    {
      puuid: "mock-blue-1",
      summonerId: 1,
      summonerName: "暗夜猎手 #CN1",
      championId: 67,
      teamParticipantId: 1,
      selectedPosition: "top",
      winRate: 75,
      wins: 30,
      total: 40,
      kdaNum: 5.2,
      avgK: 8.2,
      avgD: 4.1,
      avgA: 13.1,
      rankText: "最强王者 单双",
      rankColor: "#f1c40f",
      rating: "战神",
      premadeGroup: "A",
      isBroadcaster: !1,
      recentGames: [
        { championId: 67, win: !0, kills: 12, deaths: 3, assists: 8 },
        { championId: 67, win: !0, kills: 7, deaths: 5, assists: 11 },
        { championId: 22, win: !1, kills: 4, deaths: 8, assists: 6 },
        { championId: 67, win: !0, kills: 9, deaths: 2, assists: 14 },
        { championId: 51, win: !0, kills: 6, deaths: 4, assists: 9 }
      ]
    },
    {
      puuid: "mock-blue-2",
      summonerId: 2,
      summonerName: "疾风剑豪 #JP2",
      championId: 157,
      teamParticipantId: 1,
      selectedPosition: "mid",
      winRate: 62,
      wins: 31,
      total: 50,
      kdaNum: 2.1,
      avgK: 9.5,
      avgD: 7.8,
      avgA: 6.9,
      rankText: "傲世宗师 单双",
      rankColor: "#e74c3c",
      rating: "猛将",
      premadeGroup: "A",
      isBroadcaster: !1,
      recentGames: [
        { championId: 157, win: !1, kills: 11, deaths: 9, assists: 3 },
        { championId: 157, win: !0, kills: 15, deaths: 5, assists: 4 },
        { championId: 157, win: !1, kills: 3, deaths: 12, assists: 2 },
        { championId: 238, win: !0, kills: 8, deaths: 6, assists: 5 },
        { championId: 157, win: !1, kills: 6, deaths: 10, assists: 4 }
      ]
    },
    {
      puuid: "mock-blue-3",
      summonerId: 3,
      summonerName: "光辉女郎 #KR3",
      championId: 99,
      teamParticipantId: 3,
      selectedPosition: "jungle",
      winRate: 55,
      wins: 22,
      total: 40,
      kdaNum: 4.8,
      avgK: 5.1,
      avgD: 3.2,
      avgA: 10.3,
      rankText: "超凡大师 单双",
      rankColor: "#9b59b6",
      rating: "神射",
      premadeGroup: null,
      isBroadcaster: !1,
      recentGames: [
        { championId: 99, win: !0, kills: 4, deaths: 2, assists: 16 },
        { championId: 99, win: !0, kills: 7, deaths: 3, assists: 12 },
        { championId: 161, win: !1, kills: 3, deaths: 6, assists: 8 },
        { championId: 99, win: !0, kills: 6, deaths: 4, assists: 11 },
        { championId: 143, win: !1, kills: 2, deaths: 5, assists: 9 }
      ]
    },
    {
      puuid: "mock-blue-4",
      summonerId: 4,
      summonerName: "盲僧 #SEA4",
      championId: 64,
      teamParticipantId: 4,
      selectedPosition: "bot",
      winRate: 48,
      wins: 24,
      total: 50,
      kdaNum: 3.3,
      avgK: 7.3,
      avgD: 5.8,
      avgA: 11.8,
      rankText: "璀璨钻石 II 单双",
      rankColor: "#3498db",
      rating: "先锋",
      premadeGroup: null,
      isBroadcaster: !1,
      recentGames: [
        { championId: 64, win: !0, kills: 8, deaths: 4, assists: 14 },
        { championId: 64, win: !1, kills: 5, deaths: 7, assists: 9 },
        { championId: 64, win: !0, kills: 10, deaths: 3, assists: 12 },
        { championId: 120, win: !0, kills: 6, deaths: 5, assists: 10 },
        { championId: 64, win: !1, kills: 3, deaths: 9, assists: 7 }
      ]
    },
    {
      puuid: "mock-blue-5",
      summonerId: 5,
      summonerName: "锤石 #EU5",
      championId: 412,
      teamParticipantId: 5,
      selectedPosition: "utility",
      winRate: 25,
      wins: 8,
      total: 32,
      kdaNum: 2.8,
      avgK: 2.1,
      avgD: 5.3,
      avgA: 12.8,
      rankText: "流光翡翠 IV 灵活",
      rankColor: "#00d084",
      rating: "坚守",
      premadeGroup: null,
      isBroadcaster: !1,
      recentGames: [
        { championId: 412, win: !1, kills: 1, deaths: 7, assists: 14 },
        { championId: 412, win: !1, kills: 3, deaths: 4, assists: 18 },
        { championId: 201, win: !1, kills: 0, deaths: 8, assists: 10 },
        { championId: 412, win: !0, kills: 2, deaths: 3, assists: 16 },
        { championId: 89, win: !1, kills: 1, deaths: 6, assists: 9 }
      ]
    }
  ],
  redTeam: [
    {
      puuid: "mock-red-1",
      summonerId: 6,
      summonerName: "影流之主 #CN6",
      championId: 238,
      teamParticipantId: 6,
      selectedPosition: "top",
      winRate: 58,
      wins: 29,
      total: 50,
      kdaNum: 4.5,
      avgK: 10.2,
      avgD: 4.8,
      avgA: 11.3,
      rankText: "华贵铂金 I 单双",
      rankColor: "#b8c4cc",
      rating: "刺客",
      premadeGroup: "B",
      isBroadcaster: !1,
      recentGames: [
        { championId: 238, win: !0, kills: 14, deaths: 3, assists: 6 },
        { championId: 238, win: !0, kills: 11, deaths: 5, assists: 8 },
        { championId: 91, win: !1, kills: 6, deaths: 9, assists: 3 },
        { championId: 238, win: !0, kills: 9, deaths: 4, assists: 7 },
        { championId: 238, win: !1, kills: 5, deaths: 8, assists: 4 }
      ]
    },
    {
      puuid: "mock-red-2",
      summonerId: 7,
      summonerName: "沙漠皇帝 #KR7",
      championId: 268,
      teamParticipantId: 6,
      selectedPosition: "mid",
      winRate: 44,
      wins: 17,
      total: 39,
      kdaNum: 3.9,
      avgK: 6.5,
      avgD: 3.8,
      avgA: 8.3,
      rankText: "荣耀黄金 III 单双",
      rankColor: "#c8aa6e",
      rating: "统帅",
      premadeGroup: "B",
      isBroadcaster: !1,
      recentGames: [
        { championId: 268, win: !0, kills: 7, deaths: 3, assists: 10 },
        { championId: 268, win: !1, kills: 4, deaths: 6, assists: 7 },
        { championId: 69, win: !0, kills: 8, deaths: 2, assists: 9 },
        { championId: 268, win: !0, kills: 5, deaths: 4, assists: 11 },
        { championId: 112, win: !1, kills: 3, deaths: 7, assists: 5 }
      ]
    },
    {
      puuid: "mock-red-3",
      summonerId: 8,
      summonerName: "未知",
      championId: 119,
      teamParticipantId: 0,
      selectedPosition: "jungle",
      winRate: 35,
      wins: 13,
      total: 37,
      kdaNum: 2.5,
      avgK: 8.8,
      avgD: 7.2,
      avgA: 9.1,
      rankText: "不屈白银 II 灵活",
      rankColor: "#a09b8c",
      rating: "勇武",
      premadeGroup: null,
      recentGames: [
        { championId: 119, win: !1, kills: 9, deaths: 8, assists: 5 },
        { championId: 119, win: !0, kills: 14, deaths: 4, assists: 6 },
        { championId: 119, win: !1, kills: 5, deaths: 10, assists: 3 },
        { championId: 22, win: !0, kills: 7, deaths: 5, assists: 8 },
        { championId: 119, win: !1, kills: 3, deaths: 9, assists: 4 }
      ],
      isBroadcaster: !0
    },
    {
      puuid: "mock-red-4",
      summonerId: 9,
      summonerName: "赵信 #TW9",
      championId: 5,
      teamParticipantId: 9,
      selectedPosition: "bot",
      winRate: 22,
      wins: 7,
      total: 32,
      kdaNum: 2.9,
      avgK: 6.8,
      avgD: 6.1,
      avgA: 10.9,
      rankText: "英勇青铜 I 单双",
      rankColor: "#cd7f32",
      rating: "冲锋",
      premadeGroup: "C",
      isBroadcaster: !1,
      recentGames: [
        { championId: 5, win: !1, kills: 8, deaths: 5, assists: 13 },
        { championId: 5, win: !1, kills: 4, deaths: 8, assists: 7 },
        { championId: 120, win: !1, kills: 7, deaths: 4, assists: 12 },
        { championId: 5, win: !0, kills: 9, deaths: 3, assists: 11 },
        { championId: 113, win: !1, kills: 3, deaths: 9, assists: 6 }
      ]
    },
    {
      puuid: "mock-red-5",
      summonerId: 10,
      summonerName: "牛头 #JP10",
      championId: 12,
      teamParticipantId: 9,
      selectedPosition: "utility",
      winRate: 15,
      wins: 4,
      total: 27,
      kdaNum: 3.1,
      avgK: 1.8,
      avgD: 4.5,
      avgA: 12.1,
      rankText: "坚韧黑铁 IV 单双",
      rankColor: "#7e7e7e",
      rating: "坚守",
      premadeGroup: "C",
      isBroadcaster: !1,
      recentGames: [
        { championId: 12, win: !1, kills: 2, deaths: 3, assists: 18 },
        { championId: 12, win: !1, kills: 0, deaths: 6, assists: 11 },
        { championId: 201, win: !1, kills: 1, deaths: 4, assists: 15 },
        { championId: 89, win: !0, kills: 3, deaths: 5, assists: 13 },
        { championId: 12, win: !1, kills: 1, deaths: 7, assists: 8 }
      ]
    }
  ]
}, Lg = [
  { id: "home", icon: /* @__PURE__ */ u.jsx(H1, {}), label: "主页" },
  { id: "tools", icon: /* @__PURE__ */ u.jsx(X1, {}), label: "工具" },
  { id: "settings", icon: /* @__PURE__ */ u.jsx(Q1, {}), label: "设置" },
  { id: "about", icon: /* @__PURE__ */ u.jsx(K1, {}), label: "关于" }
], kv = {
  id: "debug",
  icon: /* @__PURE__ */ u.jsx(J1, {}),
  label: "调试"
};
function Mv({ pageId: s }) {
  switch (s) {
    case "home":
      return /* @__PURE__ */ u.jsx(Qh, {});
    case "tools":
      return /* @__PURE__ */ u.jsx(hy, {});
    case "settings":
      return /* @__PURE__ */ u.jsx(py, {});
    case "about":
      return /* @__PURE__ */ u.jsx(yy, {});
    case "debug":
      return /* @__PURE__ */ u.jsx(Tv, {});
    default:
      return /* @__PURE__ */ u.jsx(Qh, {});
  }
}
function Nv() {
  const [s, c] = U.useState(Gy()), [d, r] = U.useState("home"), [m, h] = U.useState(C.get("sidebarCollapsed")), [v, T] = U.useState(C.get("developerMode"));
  U.useEffect(() => e0((E) => {
    var ee;
    const Q = !!((ee = document.getElementById("sona-root")) != null && ee.isConnected);
    y.debug("Modal visibility changed: %s (root in DOM: %s)", String(E), String(Q)), c(E);
  }), []), U.useEffect(() => C.onChange("developerMode", (E) => {
    T(E), !E && d === "debug" && r("home");
  }), [d]);
  const S = U.useMemo(() => v ? [...Lg, kv] : Lg, [v]), p = () => {
    $g(), y.info("Modal closed");
  }, z = () => {
    h((E) => {
      const Q = !E;
      return C.set("sidebarCollapsed", Q), Q;
    });
  };
  return /* @__PURE__ */ u.jsx(
    Zu,
    {
      open: s,
      onClose: p,
      width: 840,
      height: 560,
      children: /* @__PURE__ */ u.jsxs("div", { className: "sona-layout", children: [
        /* @__PURE__ */ u.jsx(
          F1,
          {
            items: S,
            activeId: d,
            onSelect: r,
            collapsed: m,
            onToggle: z
          }
        ),
        /* @__PURE__ */ u.jsx("div", { className: "sona-content", children: /* @__PURE__ */ u.jsx(Mv, { pageId: d }) })
      ] })
    }
  );
}
const Uv = {
  info: { badge: "INFO", color: "#43b581", method: "log" },
  warn: { badge: "WARN", color: "#faa61a", method: "warn" },
  error: { badge: "ERROR", color: "#f04747", method: "error" },
  debug: { badge: "DEBUG", color: "#7289da", method: "debug" }
};
function Rv(s) {
  const {
    name: c,
    version: d,
    primaryColor: r = "#66ccff",
    accentColor: m = "#43b581"
  } = s, h = `${c}`;
  function v() {
    const S = [
      "color: #fff",
      `background: ${r}`,
      "padding: 4px 8px",
      "border-radius: 4px 0 0 4px",
      "font-weight: bold",
      "font-size: 14px"
    ].join(";"), p = [
      "color: #fff",
      `background: ${m}`,
      "padding: 4px 8px",
      "border-radius: 0 4px 4px 0",
      "font-weight: bold",
      "font-size: 14px"
    ].join(";");
    console.log(
      `%c ${c} ଘ(੭ˊᵕˋ)੭* ੈ✩‧₊˚♫ %c v${d} `,
      S,
      p
    );
  }
  function T(S, p, ...z) {
    const { badge: E, color: Q, method: ee } = Uv[S], re = [
      "color: #fff",
      `background: ${r}`,
      "padding: 2px 6px",
      "border-radius: 3px 0 0 3px",
      "font-weight: bold",
      "font-size: 13px"
    ].join(";"), ae = [
      "color: #fff",
      `background: ${Q}`,
      "padding: 2px 6px",
      "border-radius: 0 3px 3px 0",
      "font-weight: bold",
      "font-size: 13px"
    ].join(";");
    console[ee](
      `%c${h}%c${E}%c ${p}`,
      re,
      ae,
      "color: inherit; background: inherit;",
      ...z
    );
  }
  return {
    printBanner: v,
    info: (S, ...p) => T("info", S, ...p),
    warn: (S, ...p) => T("warn", S, ...p),
    error: (S, ...p) => T("error", S, ...p),
    debug: (S, ...p) => T("debug", S, ...p)
  };
}
const Kl = [];
let Bg = !1;
const Xn = Symbol("SonaEmberWrapped"), Gg = "__sonaAppliedRules";
function Dv(s, c, d) {
  const r = s[c];
  if (typeof r != "function") return !1;
  const m = s[Xn] ?? /* @__PURE__ */ new Set();
  if (m.has(c)) return !1;
  const h = r;
  return s[c] = function(...v) {
    const T = (...S) => h.apply(this, S);
    return d.call(this, T, v);
  }, m.add(c), s[Xn] = m, !0;
}
function zv(s) {
  const c = [];
  for (const d of s)
    if (d && typeof d == "object") {
      const r = d.classNames;
      if (Array.isArray(r))
        for (const m of r)
          typeof m == "string" && c.push(m);
    }
  return c;
}
function wv(s, c, d, r) {
  var h;
  let m = c;
  if (r.mixin)
    try {
      const v = r.mixin(s, d);
      m = m.extend(v), y.info("[EmberHook] mixin applied: %s", r.name);
    } catch (v) {
      y.warn("[EmberHook] mixin failed: %s, %o", r.name, v);
    }
  if ((h = r.wraps) != null && h.length)
    try {
      const v = m.proto(), T = v[Gg] ?? /* @__PURE__ */ new Set();
      if (!T.has(r.name)) {
        for (const S of r.wraps)
          Dv(v, S.name, S.replacement) && y.info("[EmberHook] wrap applied: %s.%s", r.name, S.name);
        T.add(r.name), v[Gg] = T;
      }
    } catch (v) {
      y.warn("[EmberHook] wraps failed: %s, %o", r.name, v);
    }
  return m;
}
function Iv(s) {
  const c = s.Component;
  if (!c || typeof c.extend != "function") {
    y.warn("[EmberHook] Ember.Component.extend 不存在，放弃");
    return;
  }
  const d = c;
  if (d[Xn])
    return;
  const r = c.extend.bind(c);
  c.extend = function(...m) {
    let h = r(...m);
    if (Kl.length > 0) {
      let v = null;
      const T = () => (v === null && (v = zv(m)), v);
      for (const S of Kl) {
        const p = S.matcher;
        let z = !1;
        if (typeof p == "function")
          try {
            z = p(m);
          } catch (E) {
            y.warn("[EmberHook] matcher 函数抛错 (%s): %o", S.name, E), z = !1;
          }
        else p === "*" ? z = !0 : z = T().includes(p);
        z && (h = wv(s, h, m, S));
      }
    }
    return h;
  }, d[Xn] = !0, y.info("[EmberHook] ✅ Ember.Component.extend 已被劫持（当前规则数: %d）", Kl.length);
}
function jv(s) {
  if (Bg) {
    y.warn("[EmberHook] installEmberHook 已经被调用过，忽略");
    return;
  }
  Bg = !0, y.info("[EmberHook] 注册 rcp-fe-ember-libs postInit..."), s.rcp.postInit("rcp-fe-ember-libs", (c) => {
    const d = c;
    if (!d || typeof d.getEmber != "function") {
      y.warn("[EmberHook] rcp-fe-ember-libs 里没有 getEmber，放弃");
      return;
    }
    const r = d;
    if (r[Xn]) {
      y.info("[EmberHook] getEmber 已被劫持过，跳过");
      return;
    }
    const m = d.getEmber.bind(d);
    d.getEmber = function(...h) {
      const v = m(...h);
      return Promise.resolve(v).then((T) => {
        try {
          Iv(T);
        } catch (S) {
          y.warn("[EmberHook] hookComponentExtend 异常: %o", S);
        }
        return T;
      });
    }, r[Xn] = !0, y.info("[EmberHook] 🎯 已劫持 rcp-fe-ember-libs.getEmber，等客户端首次调用...");
  }, !0);
}
function Ov(s) {
  const c = Kl.findIndex((d) => d.name === s.name);
  if (c >= 0)
    Kl[c] = s, y.info("[EmberHook] 更新规则: %s", s.name);
  else {
    Kl.push(s);
    const d = typeof s.matcher == "function" ? "<function>" : s.matcher;
    y.info("[EmberHook] 新增规则: %s (matcher=%s)，当前共 %d 条", s.name, d, Kl.length);
  }
}
function qv() {
  if (!C.get("unlockChromas")) {
    y.info("[ChromaUnlock] 开关已关闭，跳过注册");
    return;
  }
  Ov({
    name: "unlock-chromas",
    matcher: "collections-sub-nav-component",
    mixin: () => ({
      // 覆盖为普通属性（会遮蔽同名的 computed getter）
      isChromasDisabled: !1,
      isTencentRegion: !1
    })
  });
}
const Lv = "Sona", Bv = "1.1.0", Hg = "sona-root", y = Rv({
  name: Lv,
  version: Bv
});
function f0() {
  return window.__SONA_RUNTIME__ || (window.__SONA_RUNTIME__ = {
    container: null,
    root: null,
    hasShownStartupToast: !1
  }), window.__SONA_RUNTIME__;
}
function m0(s) {
  (document.body ?? document.documentElement).appendChild(s);
}
function Gv(s) {
  const c = document.getElementById(Hg);
  return c instanceof HTMLDivElement && (s.container = c), s.container || (s.container = document.createElement("div"), s.container.id = Hg, y.info("Created app container")), s.container.isConnected || (m0(s.container), y.warn("App container was missing from DOM and has been reattached")), s.container;
}
let h0 = null;
function Kv(s) {
  h0 = s, B.bindContext(s), jv(s), qv(), y.printBanner();
}
function Zv() {
  y.info("Plugin loading..."), Py(), bv(), Xy(), ty(), Qv();
}
function Vv() {
  return h0;
}
function Hv() {
  var c, d;
  const s = f0();
  return (c = s.container) != null && c.isConnected ? !0 : (s.container && (m0(s.container), y.warn("Detected host DOM refresh; restored app container")), !!((d = s.container) != null && d.isConnected));
}
function Qv() {
  const s = f0(), c = Gv(s);
  qe.register(Hv), s.root ? y.info("Reusing existing React root") : (s.root = Kn.createRoot(c), y.info("Created React root")), s.root.render(/* @__PURE__ */ u.jsx(Nv, {})), y.info("Mounted ✓ (container connected: %s)", String(c.isConnected)), s.hasShownStartupToast || (Toast.success("Sona 已启动 ♫"), s.hasShownStartupToast = !0);
}
export {
  Vv as getContext,
  Kv as init,
  Zv as load,
  y as logger
};
