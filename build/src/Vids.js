
        <script type="text/javascript">
            if (!location.pathname.includes("auth")) {
                !function(e, t) {
                    var n;
                    e[t] = e[t] || function e() {
                        (e.q = e.q || []).push(arguments)
                    }
                    ,
                    e[t].v = e[t].v || 2,
                    e[t].s = "1",
                    function(e, n, a, c, s, r, i) {
                        function o(c, s) {
                            (c = function(n, a) {
                                try {
                                    if (a = (n = e.localStorage).getItem("_aQS02NDU1MUY5OUQwRTFBMDgwOENGRDc4ODktMQ"))
                                        return JSON.parse(a).lgk || [];
                                    if ((i = n.getItem(decodeURI(decodeURI("%764%2561%63%25%33%31%65%69%25%35%61r%30")))) && i.split(",")[4] > 0)
                                        return [[t + "-engaged", "true"]]
                                } catch (e) {}
                            }()) && typeof c.forEach === a && (s = e[n].pubads()) && c.forEach((function(e) {
                                e && e[0] && s.setTargeting(e[0], e[1] || "")
                            }
                            ))
                        }
                        try {
                            (r = e[n] = e[n] || {}).cmd = r.cmd || [],
                            typeof r.pubads === a ? o() : typeof r.cmd.unshift === a ? r.cmd.unshift(o) : r.cmd.push(o)
                        } catch (e) {}
                    }(window, "googletag", "function"),
                    (n = window).__admiral_getConsentForGTM = function(e) {
                        function a(t, n) {
                            e(function(e, t) {
                                const n = e && e.purpose && e.purpose.consents || {};
                                return {
                                    adConsentGranted: t || !!n[1],
                                    adUserData: t || !!n[7],
                                    adPersonalization: t || !!n[3],
                                    analyticsConsentGranted: t || !!n[1],
                                    personalizationConsentGranted: t || !!n[5],
                                    functionalityConsentGranted: t || !1,
                                    securityConsentGranted: t || !0
                                }
                            }(t, !n))
                        }
                        n[t]("after", "cmp.loaded", (function(e) {
                            e && e.tcData && e.tcData.gdprApplies ? (e.consentKnown && a(e.tcData, !0),
                            n[t]("after", "cmp.updated", (function(e) {
                                a(e.tcData, !0)
                            }
                            ))) : a({}, !1)
                        }
                        ))
                    }
                }(window, decodeURI(decodeURI("%2561dm%256%39%72%2561%25%36%63"))),
                function(e, t, n, a) {
                    n = e.createElement(t),
                    e = e.getElementsByTagName(t)[0],
                    n.async = 1,
                    n.src = "https://eventexistence.com/static/3ee29b5457c_d12f289111c1c37ee223f665f315e5d31ea1824f38e.bundle.js",
                    0 && 0(n),
                    e.parentNode.insertBefore(n, e)
                }(document, "script"),
                function(e, t, n, a, c) {
                    function s() {
                        for (var e = [], n = 0; n < arguments.length; n++)
                            e.push(arguments[n]);
                        if (!e.length)
                            return c;
                        "ping" === e[0] ? e[2]({
                            gdprAppliesGlobally: !!t.__cmpGdprAppliesGlobally,
                            cmpLoaded: !1,
                            cmpStatus: "stub"
                        }) : e.length > 0 && c.push(e)
                    }
                    function r(e) {
                        if (e && e.data && e.source) {
                            var a, c = e.source, s = "string" == typeof e.data && e.data.indexOf("__tcfapiCall") >= 0;
                            (a = s ? (function(e) {
                                try {
                                    return JSON.parse(e)
                                } catch (e) {}
                            }(e.data) || {}).__tcfapiCall : (e.data || {}).__tcfapiCall) && t[n](a.command, a.version, (function(e, t) {
                                var n = {
                                    __tcfapiReturn: {
                                        returnValue: e,
                                        success: t,
                                        callId: a.callId
                                    }
                                };
                                c && c.postMessage(s ? JSON.stringify(n) : n, "*")
                            }
                            ), a.parameter)
                        }
                    }
                    !function n() {
                        if (!t.frames[a]) {
                            var c = e.body;
                            if (c) {
                                var s = e.createElement("iframe");
                                s.style.display = "none",
                                s.name = a,
                                c.appendChild(s)
                            } else
                                setTimeout(n, 5)
                        }
                    }(),
                    s.v = 1,
                    "function" != typeof t[n] && (t[n] = t[n] || s,
                    t.addEventListener ? t.addEventListener("message", r, !1) : t.attachEvent && t.attachEvent("onmessage", r))
                }(document, window, "__tcfapi", "__tcfapiLocator", []),
                function(e, t, n, a, c, s, r, i, o, d, p) {
                    function u() {
                        for (var e = [], t = arguments.length, n = 0; n < t; n++)
                            e.push(arguments[n]);
                        var a, c = e[1], s = typeof c === r, i = e[2], u = {
                            gppVersion: "1.1",
                            cmpStatus: "stub",
                            cmpDisplayStatus: "hidden",
                            signalStatus: "not ready",
                            supportedAPIs: ["7:usnat"].reduce((function(e, t) {
                                return t && e.push(t),
                                e
                            }
                            ), []),
                            cmpId: 9,
                            sectionList: [],
                            applicableSections: [0],
                            gppString: "",
                            parsedSections: {}
                        };
                        function l(e) {
                            s && c(e, !0)
                        }
                        switch (e[0]) {
                        case "ping":
                            return l(u);
                        case "queue":
                            return o;
                        case "events":
                            return d;
                        case "addEventListener":
                            return s && (a = ++p,
                            d.push({
                                id: a,
                                callback: c,
                                parameter: i
                            })),
                            l({
                                eventName: "listenerRegistered",
                                listenerId: a,
                                data: !0,
                                pingData: u
                            });
                        case "removeEventListener":
                            for (a = !1,
                            n = 0; n < d.length; n++)
                                if (d[n].id === i) {
                                    d.splice(n, 1),
                                    a = !0;
                                    break
                                }
                            return l(a);
                        case "hasSection":
                        case "getSection":
                        case "getField":
                            return l(null);
                        default:
                            return void o.push(e)
                        }
                    }
                    u.v = 2,
                    typeof t.__gpp !== r && (t.__gpp = t.__gpp || u,
                    t.addEventListener && t.addEventListener("message", (function(e, n) {
                        var a = "string" == typeof e.data;
                        (n = a ? (function(e) {
                            try {
                                return JSON.parse(e)
                            } catch (e) {}
                        }(e.data) || {}).__gppCall : (e.data || {}).__gppCall) && t.__gpp(n.command, (function(t, c) {
                            var s = {
                                __gppReturn: {
                                    returnValue: t,
                                    success: c,
                                    callId: n.callId
                                }
                            };
                            e.source.postMessage(a ? JSON.stringify(s) : s, "*")
                        }
                        ), "parameter"in n ? n.parameter : null, n.version || 1)
                    }
                    ), !1),
                    function n() {
                        if (!t.frames[a]) {
                            var c = e.body;
                            if (c) {
                                var s = e.createElement("iframe");
                                s.style.display = "none",
                                s.name = a,
                                c.appendChild(s)
                            } else
                                setTimeout(n, 5)
                        }
                    }())
                }(document, window, 0, "__gppLocator", 0, 0, "function", 0, [], [], 0);
                const e = document.createElement("script");
                e.type = "text/javascript",
                e.src = "https://s3.us-east-2.amazonaws.com/telemetry.bydata/freeconvert/bydataAnalytics.js?cId=asc140589",
                e.async = !0,
                document.head.appendChild(e)
            }
        </script>
    </head>
    <body>
        <noscript data-n-head="ssr" data-hid="gtm-noscript" data-pbody="true">
            <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TRMVBM3&" height="0" width="0" style="display:none;visibility:hidden" title="gtm"></iframe>
        </noscript>
        <div data-server-rendered="true" id="__nuxt">
            <!---->
            <div id="__layout">
                <div id="fc" data-v-9b2d368e>
                    <div id="navbar-container" data-automation-id="NavbarContainer" class="navbar-container container-fluid" data-v-ed8b2202 data-v-9b2d368e>
                        <div id="NavigationResponsive" class="navigation-responsive min-width visible-in-mobile__navigation" data-v-6b088f1c data-v-ed8b2202>
                            <div class="navigation-responsive__navbar nav display-flex justify-content-between align-items-center" data-v-6b088f1c>
                                <div id="ButtonBurgerMenu" class="button-burger-menu__container" data-v-00bbbc7b data-v-6b088f1c>
                                    <div class="button-burger-menu is-closed" data-v-00bbbc7b>
                                        <div class="line-top" data-v-00bbbc7b></div>
                                        <div class="line-middle" data-v-00bbbc7b></div>
                                        <div class="line-bottom" data-v-00bbbc7b></div>
                                    </div>
                                </div>
                                <a href="/" data-automation-id="NavigationLogoMobile" class="Logo nuxt-link-active" data-v-11580f7e data-v-6b088f1c>
                                    <img src="https://cdn.freeconvert.com/logo_theme.svg" width="152" height="25" alt="Logo" loading="lazy" data-v-11580f7e>
                                </a>
                                <div class="navigation-responsive__search" data-v-6b088f1c></div>
                            </div>
                            <div class="navigation-responsive__drawer" data-v-6b088f1c>
                                <div id="NavigationDrawer" class="navigation-drawer min-width" data-v-4ddc6f6a data-v-6b088f1c>
                                    <div class="navigation-drawer__header" data-v-4ddc6f6a>
                                        <a href="/" class="Logo nuxt-link-active" data-v-11580f7e data-v-4ddc6f6a>
                                            <img src="https://cdn.freeconvert.com/logo_theme.svg" width="152" height="25" alt="Logo" loading="lazy" data-v-11580f7e>
                                        </a>
                                    </div>
                                    <div class="navigation-drawer__body" data-v-4ddc6f6a>
                                        <div class="navigation-drawer__search" data-v-4ddc6f6a>
                                            <div class="site-search" data-v-54014a2f data-v-4ddc6f6a>
                                                <div class="site-search__box" data-v-54014a2f>
                                                    <input id="SiteSearchInput" type="text" inputmode="search" placeholder="Search" data-automation-id="site-search-input-box" class="site-search__box--input" data-v-54014a2f>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="site-search__box--icon feather feather-search" data-v-54014a2f data-v-54014a2f>
                                                        <circle cx="11" cy="11" r="8" data-v-54014a2f data-v-54014a2f></circle>
                                                        <line x1="21" y1="21" x2="16.65" y2="16.65" data-v-54014a2f data-v-54014a2f></line>
                                                    </svg>
                                                </div>
                                                <div class="site-search__result" style="display:none;" data-v-54014a2f>
                                                    <p class="empty" data-v-54014a2f>
                                                        <span data-v-54014a2f>No matches found.
                </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="NavigationAuth" class="navigation-auth d-flex align-items-center" data-v-47dc278d data-v-4ddc6f6a>
                                            <span style="display: none" data-v-47dc278d>auth.token:false,loggedInStore: false</span>
                                            <div class="nested-links visible-in-mobile__navigation" style="display:none;" data-v-244e7091 data-v-47dc278d>
                                                <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                    <span style="margin-right: 10px" data-v-244e7091>
                                                        <button class="button white oval navigation-auth__icon-button d-flex justify-content-center align-items-center" data-v-244e7091 data-v-47dc278d>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="navigation-auth__icon feather feather-user" data-v-244e7091 data-v-47dc278d>
                                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" data-v-244e7091 data-v-47dc278d></path>
                                                                <circle cx="12" cy="7" r="4" data-v-244e7091 data-v-47dc278d></circle>
                                                            </svg>
                                                        </button>
                                                    </span>
                                                    <div class="nested-links__parent__text" data-v-244e7091>
                                                        <span style="margin-top: 5px" data-v-244e7091>My Account</span>
                                                    </div>
                                                    <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                </button>
                                                <div class="nested-links__content" data-v-244e7091>
                                                    <ul class="navigation-auth__account-options" data-v-244e7091 data-v-47dc278d>
                                                        <li data-v-244e7091 data-v-47dc278d>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-shopping-cart" data-v-244e7091 data-v-47dc278d>
                                                                <circle cx="9" cy="21" r="1" data-v-244e7091 data-v-47dc278d></circle>
                                                                <circle cx="20" cy="21" r="1" data-v-244e7091 data-v-47dc278d></circle>
                                                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" data-v-244e7091 data-v-47dc278d></path>
                                                            </svg>
                                                            Billing Plan
      
                                                        </li>
                                                        <li data-v-244e7091 data-v-47dc278d>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-credit-card" data-v-244e7091 data-v-47dc278d>
                                                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" data-v-244e7091 data-v-47dc278d></rect>
                                                                <line x1="1" y1="10" x2="23" y2="10" data-v-244e7091 data-v-47dc278d></line>
                                                            </svg>
                                                            Payment Method
      
                                                        </li>
                                                        <li data-v-244e7091 data-v-47dc278d>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file-text" data-v-244e7091 data-v-47dc278d>
                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" data-v-244e7091 data-v-47dc278d></path>
                                                                <polyline points="14 2 14 8 20 8" data-v-244e7091 data-v-47dc278d></polyline>
                                                                <line x1="16" y1="13" x2="8" y2="13" data-v-244e7091 data-v-47dc278d></line>
                                                                <line x1="16" y1="17" x2="8" y2="17" data-v-244e7091 data-v-47dc278d></line>
                                                                <polyline points="10 9 9 9 8 9" data-v-244e7091 data-v-47dc278d></polyline>
                                                            </svg>
                                                            Invoice
      
                                                        </li>
                                                        <li class="hl" data-v-244e7091 data-v-47dc278d></li>
                                                        <li data-v-244e7091 data-v-47dc278d>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-layers" data-v-244e7091 data-v-47dc278d>
                                                                <polygon points="12 2 2 7 12 12 22 7 12 2" data-v-244e7091 data-v-47dc278d></polygon>
                                                                <polyline points="2 17 12 22 22 17" data-v-244e7091 data-v-47dc278d></polyline>
                                                                <polyline points="2 12 12 17 22 12" data-v-244e7091 data-v-47dc278d></polyline>
                                                            </svg>
                                                            Tasks
      
                                                        </li>
                                                        <li data-v-244e7091 data-v-47dc278d>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-briefcase" data-v-244e7091 data-v-47dc278d>
                                                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" data-v-244e7091 data-v-47dc278d></rect>
                                                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" data-v-244e7091 data-v-47dc278d></path>
                                                            </svg>
                                                            Jobs
      
                                                        </li>
                                                        <li data-v-244e7091 data-v-47dc278d>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-key" data-v-244e7091 data-v-47dc278d>
                                                                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" data-v-244e7091 data-v-47dc278d></path>
                                                            </svg>
                                                            API Keys
      
                                                        </li>
                                                        <li data-v-244e7091 data-v-47dc278d>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-anchor" data-v-244e7091 data-v-47dc278d>
                                                                <circle cx="12" cy="5" r="3" data-v-244e7091 data-v-47dc278d></circle>
                                                                <line x1="12" y1="22" x2="12" y2="8" data-v-244e7091 data-v-47dc278d></line>
                                                                <path d="M5 12H2a10 10 0 0 0 20 0h-3" data-v-244e7091 data-v-47dc278d></path>
                                                            </svg>
                                                            Webhooks
      
                                                        </li>
                                                        <li class="hl" data-v-244e7091 data-v-47dc278d></li>
                                                        <li data-v-244e7091 data-v-47dc278d>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user" data-v-244e7091 data-v-47dc278d>
                                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" data-v-244e7091 data-v-47dc278d></path>
                                                                <circle cx="12" cy="7" r="4" data-v-244e7091 data-v-47dc278d></circle>
                                                            </svg>
                                                            Account
      
                                                        </li>
                                                        <li data-v-244e7091 data-v-47dc278d>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-bell" data-v-244e7091 data-v-47dc278d>
                                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" data-v-244e7091 data-v-47dc278d></path>
                                                                <path d="M13.73 21a2 2 0 0 1-3.46 0" data-v-244e7091 data-v-47dc278d></path>
                                                            </svg>
                                                            Notifications
      
                                                        </li>
                                                        <li data-v-244e7091 data-v-47dc278d>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-users" data-v-244e7091 data-v-47dc278d>
                                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" data-v-244e7091 data-v-47dc278d></path>
                                                                <circle cx="9" cy="7" r="4" data-v-244e7091 data-v-47dc278d></circle>
                                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" data-v-244e7091 data-v-47dc278d></path>
                                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" data-v-244e7091 data-v-47dc278d></path>
                                                            </svg>
                                                            Team
      
                                                        </li>
                                                        <li data-v-244e7091 data-v-47dc278d>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-activity" data-v-244e7091 data-v-47dc278d>
                                                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" data-v-244e7091 data-v-47dc278d></polyline>
                                                            </svg>
                                                            Activity
      
                                                        </li>
                                                        <li data-v-244e7091 data-v-47dc278d>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-circle" data-v-244e7091 data-v-47dc278d>
                                                                <circle cx="12" cy="12" r="10" data-v-244e7091 data-v-47dc278d></circle>
                                                                <line x1="12" y1="8" x2="12" y2="12" data-v-244e7091 data-v-47dc278d></line>
                                                                <line x1="12" y1="16" x2="12.01" y2="16" data-v-244e7091 data-v-47dc278d></line>
                                                            </svg>
                                                            FAQ
      
                                                        </li>
                                                        <li data-v-244e7091 data-v-47dc278d>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-log-out" data-v-244e7091 data-v-47dc278d>
                                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" data-v-244e7091 data-v-47dc278d></path>
                                                                <polyline points="16 17 21 12 16 7" data-v-244e7091 data-v-47dc278d></polyline>
                                                                <line x1="21" y1="12" x2="9" y2="12" data-v-244e7091 data-v-47dc278d></line>
                                                            </svg>
                                                            Logout
      
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <div id="NavigationUserDropdown" data-automation-id="NavigationUserDropdown" class="drop visible-in-web__navigation default" style="display:none;" data-v-14ab5a00 data-v-47dc278d>
                                                <a href="#" class="drop__trigger" data-v-14ab5a00>
                                                    <button class="button oval white navigation-auth__icon-button d-flex justify-content-center align-items-center" data-v-14ab5a00 data-v-47dc278d>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="navigation-auth__icon feather feather-user" data-v-14ab5a00 data-v-47dc278d>
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" data-v-14ab5a00 data-v-47dc278d></path>
                                                            <circle cx="12" cy="7" r="4" data-v-14ab5a00 data-v-47dc278d></circle>
                                                        </svg>
                                                    </button>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="drop__icon feather feather-chevron-down" data-v-14ab5a00 data-v-14ab5a00>
                                                        <polyline points="6 9 12 15 18 9" data-v-14ab5a00 data-v-14ab5a00></polyline>
                                                    </svg>
                                                </a>
                                                <div class="drop__content-wrapper drop-pos-left" data-v-14ab5a00>
                                                    <div class="drop__content drop-pos-left" data-v-14ab5a00>
                                                        <div class="user-dropdown" data-v-14ab5a00 data-v-47dc278d>
                                                            <a data-automation-id="NavigationDashboardLink" href="/account/billing-plan" class="user-dropdown__item" data-v-14ab5a00 data-v-47dc278d>Dashboard
      </a>
                                                            <a data-automation-id="NavigationLoginLink" href="#" class="user-dropdown__item" data-v-14ab5a00 data-v-47dc278d>Logout
      </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div id="NavigationAuthLinks" class="navigation-auth__wrapper align-items-center" style="display:;" data-v-47dc278d>
                                                <a href="/auth/login" data-automation-id="NavigationLoginWeb" class="button link navigation-auth__button navigation-auth__button--login" data-v-47dc278d>Log In
    </a>
                                                <a href="/pricing" data-automation-id="NavigationSignupWeb" class="button primary_outline navigation-auth__button navigation-auth__button--signup" data-v-47dc278d>Sign Up
    </a>
                                            </div>
                                        </div>
                                        <div id="NavigationLinks" class="navigation-links--responsive navbar" data-v-ed111bba data-v-4ddc6f6a>
                                            <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                    <!---->
                                                    <div class="nested-links__parent__text" data-v-244e7091>
                                                        <span style="margin-top: 5px" data-v-244e7091>Convert</span>
                                                    </div>
                                                    <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                </button>
                                                <div class="nested-links__content" data-v-244e7091>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" size="1.2x" data-v-ed111bba>
                                                                    <g clip-path="url(#clip0_11196_593)">
                                                                        <path d="M15.1253 1.63647H4.82389C3.13999 1.63843 1.77539 3.00303 1.77344 4.68693V14.9884C1.77539 16.6723 3.13999 18.0369 4.82389 18.0388H15.1253C16.8092 18.0369 18.1738 16.6723 18.1758 14.9884V4.68693C18.1738 3.00303 16.8092 1.63843 15.1253 1.63647ZM17.0435 4.68693V5.6759H14.175L12.0297 2.76878H15.1254C16.1842 2.76997 17.0423 3.62805 17.0435 4.68693ZM10.6224 2.76878L12.7677 5.6759H9.32678L7.18147 2.76878H10.6224ZM2.90574 4.68693C2.90693 3.62808 3.76501 2.77 4.82389 2.76878H5.77423L7.91954 5.6759H2.90574V4.68693ZM15.1253 16.9065H4.82389C3.76504 16.9053 2.90696 16.0472 2.90574 14.9884V6.80824H17.0435V14.9884C17.0423 16.0472 16.1842 16.9053 15.1253 16.9065Z" fill="#282F3A"></path>
                                                                        <path d="M12.9963 11.3672L8.51721 8.7812C8.24641 8.62487 7.90016 8.71764 7.74383 8.98844C7.69414 9.07452 7.66797 9.17214 7.66797 9.27154V14.4436C7.66797 14.7562 7.92144 15.0097 8.23411 15.0097C8.33348 15.0097 8.43113 14.9836 8.51721 14.9339L12.9963 12.3478C13.2671 12.1915 13.3599 11.8453 13.2035 11.5745C13.1538 11.4884 13.0823 11.4169 12.9963 11.3672ZM8.80028 13.463V10.2521L11.5809 11.8575L8.80028 13.463Z" fill="#282F3A"></path>
                                                                    </g>
                                                                    <defs>
                                                                        <clipPath id="clip0_11196_593">
                                                                            <rect width="18" height="18" fill="white" transform="translate(0.976562 0.837646)"></rect>
                                                                        </clipPath>
                                                                    </defs>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>Video &amp;Audio</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/video-converter" data-v-244e7091>Video Converter</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/audio-converter" data-v-244e7091>Audio Converter</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/mp3-converter" data-v-244e7091>MP3 Converter</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/mp4-to-mp3" data-v-244e7091>MP4 to MP3</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/convert/video-to-mp3" data-v-244e7091>Video to MP3</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/mp4-converter" data-v-244e7091>MP4 Converter</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/mov-to-mp4" data-v-244e7091>MOV to MP4</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/mp3-to-ogg" data-v-244e7091>MP3 to OGG</a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg" size="1.2x" data-v-ed111bba>
                                                                    <path d="M14.9811 1.02502H3.31651C2.13467 1.02502 1.17383 1.98587 1.17383 3.16771V14.8323C1.17383 16.0142 2.13467 16.975 3.31651 16.975H14.9811C16.163 16.975 17.1238 16.0142 17.1238 14.8323V3.16771C17.1238 1.98587 16.163 1.02502 14.9811 1.02502ZM2.38449 13.2181L5.37271 10.6815C5.43036 10.6335 5.51684 10.6335 5.57449 10.6815L7.47696 12.2573C7.71717 12.4591 8.07268 12.4398 8.29368 12.2188L12.8192 7.69328C12.8192 7.69328 12.9057 7.64523 12.9346 7.64523C12.9826 7.64523 13.021 7.66445 13.0499 7.70289L15.9324 11.2484V14.8323C15.9324 15.3512 15.5096 15.7644 15.0004 15.7644H3.31651C2.79765 15.7644 2.38449 15.3416 2.38449 14.8323V13.2181ZM11.9545 6.83813L7.82286 10.9794L6.34317 9.74948C5.83392 9.32671 5.09407 9.32671 4.58482 9.75909L2.38449 11.6327V3.16771C2.38449 2.64885 2.80726 2.23569 3.31651 2.23569H14.9811C15.5 2.23569 15.9132 2.65846 15.9132 3.16771V9.32671L13.9723 6.93421C13.732 6.63635 13.3669 6.45379 12.9826 6.43457C12.5886 6.39614 12.2139 6.55948 11.9449 6.82852L11.9545 6.83813Z" fill="#282F3A"></path>
                                                                    <path d="M6.19462 2.98792C4.9457 2.98792 3.92969 4.00399 3.92969 5.25285C3.92969 6.50173 4.94573 7.51778 6.19462 7.51778C7.4435 7.51778 8.45955 6.50173 8.45955 5.25285C8.45955 4.00396 7.44353 2.98792 6.19462 2.98792ZM6.19462 6.57842C5.46368 6.57842 4.86905 5.98376 4.86905 5.25285C4.86905 4.52191 5.46368 3.92727 6.19462 3.92727C6.92556 3.92727 7.52019 4.52194 7.52019 5.25285C7.52019 5.98376 6.92556 6.57842 6.19462 6.57842Z" fill="#282F3A"></path>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>Image</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/image-converter" data-v-244e7091>Image Converter</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/webp-to-png" data-v-244e7091>WEBP to PNG</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/jfif-to-png" data-v-244e7091>JFIF to PNG</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/png-to-svg" data-v-244e7091>PNG to SVG</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/heic-to-jpg" data-v-244e7091>HEIC to JPG</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/heic-to-png" data-v-244e7091>HEIC to PNG</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/webp-to-jpg" data-v-244e7091>WEBP to JPG</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/svg-converter" data-v-244e7091>SVG Converter</a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file-text" data-v-244e7091 data-v-ed111bba>
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" data-v-244e7091 data-v-ed111bba></path>
                                                                    <polyline points="14 2 14 8 20 8" data-v-244e7091 data-v-ed111bba></polyline>
                                                                    <line x1="16" y1="13" x2="8" y2="13" data-v-244e7091 data-v-ed111bba></line>
                                                                    <line x1="16" y1="17" x2="8" y2="17" data-v-244e7091 data-v-ed111bba></line>
                                                                    <polyline points="10 9 9 9 8 9" data-v-244e7091 data-v-ed111bba></polyline>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>PDF &amp;Documents</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/pdf-converter" data-v-244e7091>PDF Converter</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/document-converter" data-v-244e7091>Document Converter</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/ebook-converter" data-v-244e7091>Ebook Converter</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/pdf-to-word" data-v-244e7091>PDF to Word</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/pdf-to-jpg" data-v-244e7091>PDF to JPG</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/pdf-to-epub" data-v-244e7091>PDF to EPUB</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/epub-to-pdf" data-v-244e7091>EPUB to PDF</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/heic-to-pdf" data-v-244e7091>HEIC to PDF</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/docx-to-pdf" data-v-244e7091>DOCX to PDF</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/jpg-to-pdf" data-v-244e7091>JPG to PDF</a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" size="1.2x" data-v-ed111bba>
                                                                    <g clip-path="url(#clip0_11196_622)">
                                                                        <path d="M18.4527 4.16765C18.4127 3.66765 18.3227 3.29765 18.1627 2.97765C17.8727 2.40765 17.4127 1.94765 16.8427 1.65765C16.5227 1.49765 16.1527 1.40765 15.6527 1.36765C15.2227 1.32765 14.6927 1.32765 14.0227 1.32765H5.94266C5.27266 1.32765 4.74266 1.32765 4.31266 1.36765C3.81266 1.40765 3.44266 1.49765 3.12266 1.65765C2.55266 1.94765 2.09266 2.40765 1.80266 2.97765C1.64266 3.29765 1.55266 3.66765 1.51266 4.16765C1.47266 4.59765 1.47266 5.12765 1.47266 5.79765V13.8777C1.47266 14.5477 1.47266 15.0777 1.51266 15.5077C1.55266 16.0077 1.64266 16.3777 1.80266 16.6977C2.09266 17.2677 2.55266 17.7277 3.12266 18.0177C3.44266 18.1777 3.81266 18.2677 4.31266 18.3077C4.74266 18.3477 5.27266 18.3477 5.94266 18.3477H14.0227C14.6927 18.3477 15.2227 18.3477 15.6527 18.3077C16.1527 18.2677 16.5227 18.1777 16.8427 18.0177C17.4127 17.7277 17.8727 17.2677 18.1627 16.6977C18.3227 16.3777 18.4127 16.0177 18.4527 15.5077C18.4827 15.0777 18.4827 14.5477 18.4827 13.8777V5.78765C18.4827 5.11765 18.4827 4.58765 18.4527 4.15765V4.16765ZM17.3127 5.80765V13.8477C17.3127 14.5277 17.3127 15.0177 17.2827 15.3977C17.2527 15.7377 17.2027 15.9677 17.1127 16.1477C16.9327 16.4977 16.6527 16.7777 16.3027 16.9577C16.1227 17.0477 15.9027 17.0977 15.5527 17.1277C15.1727 17.1577 14.6827 17.1577 14.0027 17.1577H5.96266C5.28266 17.1577 4.79266 17.1577 4.41266 17.1277C4.06266 17.0977 3.84266 17.0477 3.66266 16.9577C3.31266 16.7777 3.03266 16.4977 2.85266 16.1477C2.76266 15.9677 2.71266 15.7477 2.68266 15.3977C2.65266 15.0177 2.65266 14.5277 2.65266 13.8477V5.80765C2.65266 5.12765 2.65266 4.63765 2.68266 4.25765C2.71266 3.90765 2.76266 3.68765 2.85266 3.50765C3.03266 3.15765 3.31266 2.87765 3.66266 2.69765C3.84266 2.60765 4.06266 2.55765 4.41266 2.52765C4.79266 2.49765 5.28266 2.49765 5.96266 2.49765H14.0027C14.6827 2.49765 15.1727 2.49765 15.5527 2.52765C15.9027 2.55765 16.1227 2.60765 16.3027 2.69765C16.6527 2.87765 16.9327 3.15765 17.1127 3.50765C17.2027 3.68765 17.2527 3.90765 17.2827 4.25765C17.3127 4.63765 17.3127 5.12765 17.3127 5.80765Z" fill="#282F3A"></path>
                                                                        <path d="M8.42328 9.74763H7.37328C7.24328 9.74763 7.13328 9.77763 7.06328 9.84763C6.99328 9.90763 6.95328 9.99763 6.95328 10.1176C6.95328 10.2376 6.99328 10.3276 7.06328 10.3876C7.13328 10.4576 7.23328 10.4876 7.37328 10.4876H7.97328V11.4076C7.87328 11.4376 7.77328 11.4676 7.66328 11.4876C7.49328 11.5176 7.33328 11.5376 7.16328 11.5376C6.68328 11.5376 6.32328 11.4076 6.08328 11.1476C5.84328 10.8876 5.72328 10.5076 5.72328 10.0076C5.72328 9.67763 5.77328 9.38763 5.87328 9.16763C5.98328 8.93763 6.14328 8.75763 6.35328 8.64763C6.56328 8.52763 6.83328 8.46763 7.15328 8.46763C7.35328 8.46763 7.53328 8.48763 7.69328 8.52763C7.86328 8.56763 8.01328 8.61763 8.16328 8.69763C8.27328 8.74763 8.37328 8.76763 8.45328 8.74763C8.54328 8.72763 8.61328 8.67763 8.66328 8.61763C8.72328 8.54763 8.75328 8.46763 8.77328 8.37763C8.79328 8.28763 8.77328 8.19763 8.74328 8.11763C8.71328 8.03763 8.65328 7.96763 8.55328 7.90763C8.33328 7.78763 8.09328 7.69763 7.85328 7.63763C7.61328 7.58763 7.37328 7.55763 7.13328 7.55763C6.74328 7.55763 6.38328 7.61763 6.07328 7.72763C5.76328 7.84763 5.50328 8.00763 5.28328 8.22763C5.07328 8.43763 4.90328 8.69763 4.78328 8.99763C4.67328 9.29763 4.61328 9.63763 4.61328 10.0076C4.61328 10.4976 4.71328 10.9176 4.90328 11.2776C5.09328 11.6376 5.37328 11.9176 5.74328 12.1176C6.11328 12.3176 6.56328 12.4176 7.09328 12.4176C7.34328 12.4176 7.58328 12.3976 7.83328 12.3476C8.08328 12.3076 8.31328 12.2476 8.51328 12.1776C8.62328 12.1376 8.69328 12.0876 8.74328 12.0076C8.78328 11.9276 8.81328 11.8276 8.81328 11.7176V10.1676C8.81328 10.0376 8.77328 9.92763 8.70328 9.85763C8.63328 9.78763 8.53328 9.74763 8.40328 9.74763H8.42328Z" fill="#282F3A"></path>
                                                                        <path d="M10.2622 7.57765C10.0922 7.57765 9.96219 7.62765 9.87219 7.71765C9.78219 7.80765 9.74219 7.94765 9.74219 8.10765V11.8777C9.74219 12.0477 9.78219 12.1777 9.87219 12.2677C9.96219 12.3577 10.0922 12.4077 10.2622 12.4077C10.4322 12.4077 10.5622 12.3577 10.6422 12.2677C10.7322 12.1777 10.7722 12.0377 10.7722 11.8777V8.10765C10.7722 7.93765 10.7322 7.80765 10.6422 7.71765C10.5522 7.62765 10.4222 7.57765 10.2622 7.57765Z" fill="#282F3A"></path>
                                                                        <path d="M14.5644 7.63771H12.2744C12.1044 7.63771 11.9644 7.68771 11.8744 7.77771C11.7844 7.86771 11.7344 8.00771 11.7344 8.17771V11.8677C11.7344 12.0477 11.7744 12.1777 11.8644 12.2777C11.9544 12.3677 12.0944 12.4177 12.2544 12.4177C12.5944 12.4177 12.7644 12.2377 12.7644 11.8677V10.4077H14.4144C14.5444 10.4077 14.6544 10.3677 14.7244 10.2977C14.7944 10.2277 14.8344 10.1277 14.8344 9.99771C14.8344 9.86771 14.7944 9.76771 14.7244 9.70771C14.6544 9.63771 14.5544 9.59771 14.4144 9.59771H12.7644V8.44771H14.5544C14.6844 8.44771 14.7844 8.41771 14.8544 8.34771C14.9244 8.27771 14.9644 8.17771 14.9644 8.03771C14.9644 7.89771 14.9244 7.80771 14.8544 7.74771C14.7844 7.67771 14.6844 7.63771 14.5544 7.63771H14.5644Z" fill="#282F3A"></path>
                                                                    </g>
                                                                    <defs>
                                                                        <clipPath id="clip0_11196_622">
                                                                            <rect width="18" height="18" fill="white" transform="translate(0.976562 0.837646)"></rect>
                                                                        </clipPath>
                                                                    </defs>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>GIF</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/convert/video-to-gif" data-v-244e7091>Video to GIF</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/convert/mp4-to-gif" data-v-244e7091>MP4 to GIF</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/convert/webm-to-gif" data-v-244e7091>WEBM to GIF</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/convert/apng-to-gif" data-v-244e7091>APNG to GIF</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/convert/gif-to-mp4" data-v-244e7091>GIF to MP4</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/convert/gif-to-apng" data-v-244e7091>GIF to APNG</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/image-to-gif" data-v-244e7091>Image to GIF</a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" size="1.2x" data-v-ed111bba>
                                                                    <g clip-path="url(#clip0_11196_631)">
                                                                        <path d="M1.57031 3.23263V7.17263C1.57031 8.16263 2.38031 8.97263 3.37031 8.97263H7.31031C8.30031 8.97263 9.11031 8.16263 9.11031 7.17263V3.23263C9.11031 2.24263 8.30031 1.43263 7.31031 1.43263H3.37031C2.38031 1.43263 1.57031 2.24263 1.57031 3.23263ZM2.77031 3.23263C2.77031 2.90263 3.04031 2.63263 3.37031 2.63263H7.31031C7.64031 2.63263 7.91031 2.90263 7.91031 3.23263V7.17263C7.91031 7.50263 7.64031 7.77263 7.31031 7.77263H3.37031C3.04031 7.77263 2.77031 7.50263 2.77031 7.17263V3.23263Z" fill="#282F3A"></path>
                                                                        <path d="M1.57031 16.4427C1.57031 17.4327 2.38031 18.2427 3.37031 18.2427H7.31031C8.30031 18.2427 9.11031 17.4327 9.11031 16.4427V12.5027C9.11031 11.5127 8.30031 10.7027 7.31031 10.7027H3.37031C2.38031 10.7027 1.57031 11.5127 1.57031 12.5027V16.4427ZM2.77031 12.5027C2.77031 12.1727 3.04031 11.9027 3.37031 11.9027H7.31031C7.64031 11.9027 7.91031 12.1727 7.91031 12.5027V16.4427C7.91031 16.7727 7.64031 17.0427 7.31031 17.0427H3.37031C3.04031 17.0427 2.77031 16.7727 2.77031 16.4427V12.5027Z" fill="#282F3A"></path>
                                                                        <path d="M16.5798 10.7027H12.6398C11.6498 10.7027 10.8398 11.5127 10.8398 12.5027V16.4427C10.8398 17.4327 11.6498 18.2427 12.6398 18.2427H16.5798C17.5698 18.2427 18.3798 17.4327 18.3798 16.4427V12.5027C18.3798 11.5127 17.5698 10.7027 16.5798 10.7027ZM17.1798 16.4427C17.1798 16.7727 16.9098 17.0427 16.5798 17.0427H12.6398C12.3098 17.0427 12.0398 16.7727 12.0398 16.4427V12.5027C12.0398 12.1727 12.3098 11.9027 12.6398 11.9027H16.5798C16.9098 11.9027 17.1798 12.1727 17.1798 12.5027V16.4427Z" fill="#282F3A"></path>
                                                                        <path d="M17.7798 4.60263H15.2098V2.03263C15.2098 1.70263 14.9398 1.43263 14.6098 1.43263C14.2798 1.43263 14.0098 1.70263 14.0098 2.03263V4.60263H11.4398C11.1098 4.60263 10.8398 4.87263 10.8398 5.20263C10.8398 5.53263 11.1098 5.80263 11.4398 5.80263H14.0098V8.37263C14.0098 8.70263 14.2798 8.97263 14.6098 8.97263C14.9398 8.97263 15.2098 8.70263 15.2098 8.37263V5.80263H17.7798C18.1098 5.80263 18.3798 5.53263 18.3798 5.20263C18.3798 4.87263 18.1098 4.60263 17.7798 4.60263Z" fill="#282F3A"></path>
                                                                    </g>
                                                                    <defs>
                                                                        <clipPath id="clip0_11196_631">
                                                                            <rect width="18" height="18" fill="white" transform="translate(0.976562 0.837646)"></rect>
                                                                        </clipPath>
                                                                    </defs>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>Others</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/unit-converter" data-v-244e7091>Unit Converter</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/time/cst-to-est" data-v-244e7091>Time Converter</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/archive-converter" data-v-244e7091>Archive Converter</a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                    <!---->
                                                    <div class="nested-links__parent__text" data-v-244e7091>
                                                        <span style="margin-top: 5px" data-v-244e7091>Compress</span>
                                                    </div>
                                                    <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                </button>
                                                <div class="nested-links__content" data-v-244e7091>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" size="1.2x" data-v-ed111bba>
                                                                    <g clip-path="url(#clip0_11196_593)">
                                                                        <path d="M15.1253 1.63647H4.82389C3.13999 1.63843 1.77539 3.00303 1.77344 4.68693V14.9884C1.77539 16.6723 3.13999 18.0369 4.82389 18.0388H15.1253C16.8092 18.0369 18.1738 16.6723 18.1758 14.9884V4.68693C18.1738 3.00303 16.8092 1.63843 15.1253 1.63647ZM17.0435 4.68693V5.6759H14.175L12.0297 2.76878H15.1254C16.1842 2.76997 17.0423 3.62805 17.0435 4.68693ZM10.6224 2.76878L12.7677 5.6759H9.32678L7.18147 2.76878H10.6224ZM2.90574 4.68693C2.90693 3.62808 3.76501 2.77 4.82389 2.76878H5.77423L7.91954 5.6759H2.90574V4.68693ZM15.1253 16.9065H4.82389C3.76504 16.9053 2.90696 16.0472 2.90574 14.9884V6.80824H17.0435V14.9884C17.0423 16.0472 16.1842 16.9053 15.1253 16.9065Z" fill="#282F3A"></path>
                                                                        <path d="M12.9963 11.3672L8.51721 8.7812C8.24641 8.62487 7.90016 8.71764 7.74383 8.98844C7.69414 9.07452 7.66797 9.17214 7.66797 9.27154V14.4436C7.66797 14.7562 7.92144 15.0097 8.23411 15.0097C8.33348 15.0097 8.43113 14.9836 8.51721 14.9339L12.9963 12.3478C13.2671 12.1915 13.3599 11.8453 13.2035 11.5745C13.1538 11.4884 13.0823 11.4169 12.9963 11.3672ZM8.80028 13.463V10.2521L11.5809 11.8575L8.80028 13.463Z" fill="#282F3A"></path>
                                                                    </g>
                                                                    <defs>
                                                                        <clipPath id="clip0_11196_593">
                                                                            <rect width="18" height="18" fill="white" transform="translate(0.976562 0.837646)"></rect>
                                                                        </clipPath>
                                                                    </defs>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>Video &amp;Audio</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/video-compressor" data-v-244e7091>Video Compressor</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/mp3-compressor" data-v-244e7091>MP3 Compressor</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/wav-compressor" data-v-244e7091>WAV Compressor</a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg" size="1.2x" data-v-ed111bba>
                                                                    <path d="M14.9811 1.02502H3.31651C2.13467 1.02502 1.17383 1.98587 1.17383 3.16771V14.8323C1.17383 16.0142 2.13467 16.975 3.31651 16.975H14.9811C16.163 16.975 17.1238 16.0142 17.1238 14.8323V3.16771C17.1238 1.98587 16.163 1.02502 14.9811 1.02502ZM2.38449 13.2181L5.37271 10.6815C5.43036 10.6335 5.51684 10.6335 5.57449 10.6815L7.47696 12.2573C7.71717 12.4591 8.07268 12.4398 8.29368 12.2188L12.8192 7.69328C12.8192 7.69328 12.9057 7.64523 12.9346 7.64523C12.9826 7.64523 13.021 7.66445 13.0499 7.70289L15.9324 11.2484V14.8323C15.9324 15.3512 15.5096 15.7644 15.0004 15.7644H3.31651C2.79765 15.7644 2.38449 15.3416 2.38449 14.8323V13.2181ZM11.9545 6.83813L7.82286 10.9794L6.34317 9.74948C5.83392 9.32671 5.09407 9.32671 4.58482 9.75909L2.38449 11.6327V3.16771C2.38449 2.64885 2.80726 2.23569 3.31651 2.23569H14.9811C15.5 2.23569 15.9132 2.65846 15.9132 3.16771V9.32671L13.9723 6.93421C13.732 6.63635 13.3669 6.45379 12.9826 6.43457C12.5886 6.39614 12.2139 6.55948 11.9449 6.82852L11.9545 6.83813Z" fill="#282F3A"></path>
                                                                    <path d="M6.19462 2.98792C4.9457 2.98792 3.92969 4.00399 3.92969 5.25285C3.92969 6.50173 4.94573 7.51778 6.19462 7.51778C7.4435 7.51778 8.45955 6.50173 8.45955 5.25285C8.45955 4.00396 7.44353 2.98792 6.19462 2.98792ZM6.19462 6.57842C5.46368 6.57842 4.86905 5.98376 4.86905 5.25285C4.86905 4.52191 5.46368 3.92727 6.19462 3.92727C6.92556 3.92727 7.52019 4.52194 7.52019 5.25285C7.52019 5.98376 6.92556 6.57842 6.19462 6.57842Z" fill="#282F3A"></path>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>Image</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/image-compressor" data-v-244e7091>Image Compressor</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/compress-jpeg" data-v-244e7091>JPEG Compressor</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/compress-png" data-v-244e7091>PNG Compressor</a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file-text" data-v-244e7091 data-v-ed111bba>
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" data-v-244e7091 data-v-ed111bba></path>
                                                                    <polyline points="14 2 14 8 20 8" data-v-244e7091 data-v-ed111bba></polyline>
                                                                    <line x1="16" y1="13" x2="8" y2="13" data-v-244e7091 data-v-ed111bba></line>
                                                                    <line x1="16" y1="17" x2="8" y2="17" data-v-244e7091 data-v-ed111bba></line>
                                                                    <polyline points="10 9 9 9 8 9" data-v-244e7091 data-v-ed111bba></polyline>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>PDF &amp;Documents</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/compress-pdf" data-v-244e7091>PDF Compressor</a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" size="1.2x" data-v-ed111bba>
                                                                    <g clip-path="url(#clip0_11196_622)">
                                                                        <path d="M18.4527 4.16765C18.4127 3.66765 18.3227 3.29765 18.1627 2.97765C17.8727 2.40765 17.4127 1.94765 16.8427 1.65765C16.5227 1.49765 16.1527 1.40765 15.6527 1.36765C15.2227 1.32765 14.6927 1.32765 14.0227 1.32765H5.94266C5.27266 1.32765 4.74266 1.32765 4.31266 1.36765C3.81266 1.40765 3.44266 1.49765 3.12266 1.65765C2.55266 1.94765 2.09266 2.40765 1.80266 2.97765C1.64266 3.29765 1.55266 3.66765 1.51266 4.16765C1.47266 4.59765 1.47266 5.12765 1.47266 5.79765V13.8777C1.47266 14.5477 1.47266 15.0777 1.51266 15.5077C1.55266 16.0077 1.64266 16.3777 1.80266 16.6977C2.09266 17.2677 2.55266 17.7277 3.12266 18.0177C3.44266 18.1777 3.81266 18.2677 4.31266 18.3077C4.74266 18.3477 5.27266 18.3477 5.94266 18.3477H14.0227C14.6927 18.3477 15.2227 18.3477 15.6527 18.3077C16.1527 18.2677 16.5227 18.1777 16.8427 18.0177C17.4127 17.7277 17.8727 17.2677 18.1627 16.6977C18.3227 16.3777 18.4127 16.0177 18.4527 15.5077C18.4827 15.0777 18.4827 14.5477 18.4827 13.8777V5.78765C18.4827 5.11765 18.4827 4.58765 18.4527 4.15765V4.16765ZM17.3127 5.80765V13.8477C17.3127 14.5277 17.3127 15.0177 17.2827 15.3977C17.2527 15.7377 17.2027 15.9677 17.1127 16.1477C16.9327 16.4977 16.6527 16.7777 16.3027 16.9577C16.1227 17.0477 15.9027 17.0977 15.5527 17.1277C15.1727 17.1577 14.6827 17.1577 14.0027 17.1577H5.96266C5.28266 17.1577 4.79266 17.1577 4.41266 17.1277C4.06266 17.0977 3.84266 17.0477 3.66266 16.9577C3.31266 16.7777 3.03266 16.4977 2.85266 16.1477C2.76266 15.9677 2.71266 15.7477 2.68266 15.3977C2.65266 15.0177 2.65266 14.5277 2.65266 13.8477V5.80765C2.65266 5.12765 2.65266 4.63765 2.68266 4.25765C2.71266 3.90765 2.76266 3.68765 2.85266 3.50765C3.03266 3.15765 3.31266 2.87765 3.66266 2.69765C3.84266 2.60765 4.06266 2.55765 4.41266 2.52765C4.79266 2.49765 5.28266 2.49765 5.96266 2.49765H14.0027C14.6827 2.49765 15.1727 2.49765 15.5527 2.52765C15.9027 2.55765 16.1227 2.60765 16.3027 2.69765C16.6527 2.87765 16.9327 3.15765 17.1127 3.50765C17.2027 3.68765 17.2527 3.90765 17.2827 4.25765C17.3127 4.63765 17.3127 5.12765 17.3127 5.80765Z" fill="#282F3A"></path>
                                                                        <path d="M8.42328 9.74763H7.37328C7.24328 9.74763 7.13328 9.77763 7.06328 9.84763C6.99328 9.90763 6.95328 9.99763 6.95328 10.1176C6.95328 10.2376 6.99328 10.3276 7.06328 10.3876C7.13328 10.4576 7.23328 10.4876 7.37328 10.4876H7.97328V11.4076C7.87328 11.4376 7.77328 11.4676 7.66328 11.4876C7.49328 11.5176 7.33328 11.5376 7.16328 11.5376C6.68328 11.5376 6.32328 11.4076 6.08328 11.1476C5.84328 10.8876 5.72328 10.5076 5.72328 10.0076C5.72328 9.67763 5.77328 9.38763 5.87328 9.16763C5.98328 8.93763 6.14328 8.75763 6.35328 8.64763C6.56328 8.52763 6.83328 8.46763 7.15328 8.46763C7.35328 8.46763 7.53328 8.48763 7.69328 8.52763C7.86328 8.56763 8.01328 8.61763 8.16328 8.69763C8.27328 8.74763 8.37328 8.76763 8.45328 8.74763C8.54328 8.72763 8.61328 8.67763 8.66328 8.61763C8.72328 8.54763 8.75328 8.46763 8.77328 8.37763C8.79328 8.28763 8.77328 8.19763 8.74328 8.11763C8.71328 8.03763 8.65328 7.96763 8.55328 7.90763C8.33328 7.78763 8.09328 7.69763 7.85328 7.63763C7.61328 7.58763 7.37328 7.55763 7.13328 7.55763C6.74328 7.55763 6.38328 7.61763 6.07328 7.72763C5.76328 7.84763 5.50328 8.00763 5.28328 8.22763C5.07328 8.43763 4.90328 8.69763 4.78328 8.99763C4.67328 9.29763 4.61328 9.63763 4.61328 10.0076C4.61328 10.4976 4.71328 10.9176 4.90328 11.2776C5.09328 11.6376 5.37328 11.9176 5.74328 12.1176C6.11328 12.3176 6.56328 12.4176 7.09328 12.4176C7.34328 12.4176 7.58328 12.3976 7.83328 12.3476C8.08328 12.3076 8.31328 12.2476 8.51328 12.1776C8.62328 12.1376 8.69328 12.0876 8.74328 12.0076C8.78328 11.9276 8.81328 11.8276 8.81328 11.7176V10.1676C8.81328 10.0376 8.77328 9.92763 8.70328 9.85763C8.63328 9.78763 8.53328 9.74763 8.40328 9.74763H8.42328Z" fill="#282F3A"></path>
                                                                        <path d="M10.2622 7.57765C10.0922 7.57765 9.96219 7.62765 9.87219 7.71765C9.78219 7.80765 9.74219 7.94765 9.74219 8.10765V11.8777C9.74219 12.0477 9.78219 12.1777 9.87219 12.2677C9.96219 12.3577 10.0922 12.4077 10.2622 12.4077C10.4322 12.4077 10.5622 12.3577 10.6422 12.2677C10.7322 12.1777 10.7722 12.0377 10.7722 11.8777V8.10765C10.7722 7.93765 10.7322 7.80765 10.6422 7.71765C10.5522 7.62765 10.4222 7.57765 10.2622 7.57765Z" fill="#282F3A"></path>
                                                                        <path d="M14.5644 7.63771H12.2744C12.1044 7.63771 11.9644 7.68771 11.8744 7.77771C11.7844 7.86771 11.7344 8.00771 11.7344 8.17771V11.8677C11.7344 12.0477 11.7744 12.1777 11.8644 12.2777C11.9544 12.3677 12.0944 12.4177 12.2544 12.4177C12.5944 12.4177 12.7644 12.2377 12.7644 11.8677V10.4077H14.4144C14.5444 10.4077 14.6544 10.3677 14.7244 10.2977C14.7944 10.2277 14.8344 10.1277 14.8344 9.99771C14.8344 9.86771 14.7944 9.76771 14.7244 9.70771C14.6544 9.63771 14.5544 9.59771 14.4144 9.59771H12.7644V8.44771H14.5544C14.6844 8.44771 14.7844 8.41771 14.8544 8.34771C14.9244 8.27771 14.9644 8.17771 14.9644 8.03771C14.9644 7.89771 14.9244 7.80771 14.8544 7.74771C14.7844 7.67771 14.6844 7.63771 14.5544 7.63771H14.5644Z" fill="#282F3A"></path>
                                                                    </g>
                                                                    <defs>
                                                                        <clipPath id="clip0_11196_622">
                                                                            <rect width="18" height="18" fill="white" transform="translate(0.976562 0.837646)"></rect>
                                                                        </clipPath>
                                                                    </defs>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>GIF</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/gif-compressor" data-v-244e7091>GIF Compressor</a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                    <!---->
                                                    <div class="nested-links__parent__text" data-v-244e7091>
                                                        <span style="margin-top: 5px" data-v-244e7091>Tools</span>
                                                    </div>
                                                    <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                </button>
                                                <div class="nested-links__content" data-v-244e7091>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" size="1.2x" data-v-ed111bba>
                                                                    <g clip-path="url(#clip0_11196_593)">
                                                                        <path d="M15.1253 1.63647H4.82389C3.13999 1.63843 1.77539 3.00303 1.77344 4.68693V14.9884C1.77539 16.6723 3.13999 18.0369 4.82389 18.0388H15.1253C16.8092 18.0369 18.1738 16.6723 18.1758 14.9884V4.68693C18.1738 3.00303 16.8092 1.63843 15.1253 1.63647ZM17.0435 4.68693V5.6759H14.175L12.0297 2.76878H15.1254C16.1842 2.76997 17.0423 3.62805 17.0435 4.68693ZM10.6224 2.76878L12.7677 5.6759H9.32678L7.18147 2.76878H10.6224ZM2.90574 4.68693C2.90693 3.62808 3.76501 2.77 4.82389 2.76878H5.77423L7.91954 5.6759H2.90574V4.68693ZM15.1253 16.9065H4.82389C3.76504 16.9053 2.90696 16.0472 2.90574 14.9884V6.80824H17.0435V14.9884C17.0423 16.0472 16.1842 16.9053 15.1253 16.9065Z" fill="#282F3A"></path>
                                                                        <path d="M12.9963 11.3672L8.51721 8.7812C8.24641 8.62487 7.90016 8.71764 7.74383 8.98844C7.69414 9.07452 7.66797 9.17214 7.66797 9.27154V14.4436C7.66797 14.7562 7.92144 15.0097 8.23411 15.0097C8.33348 15.0097 8.43113 14.9836 8.51721 14.9339L12.9963 12.3478C13.2671 12.1915 13.3599 11.8453 13.2035 11.5745C13.1538 11.4884 13.0823 11.4169 12.9963 11.3672ZM8.80028 13.463V10.2521L11.5809 11.8575L8.80028 13.463Z" fill="#282F3A"></path>
                                                                    </g>
                                                                    <defs>
                                                                        <clipPath id="clip0_11196_593">
                                                                            <rect width="18" height="18" fill="white" transform="translate(0.976562 0.837646)"></rect>
                                                                        </clipPath>
                                                                    </defs>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>Video Tools</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/crop-video" data-v-244e7091>Crop Video</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/video-trimmer" data-v-244e7091>Trim Video</a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg" size="1.2x" data-v-ed111bba>
                                                                    <path d="M14.9811 1.02502H3.31651C2.13467 1.02502 1.17383 1.98587 1.17383 3.16771V14.8323C1.17383 16.0142 2.13467 16.975 3.31651 16.975H14.9811C16.163 16.975 17.1238 16.0142 17.1238 14.8323V3.16771C17.1238 1.98587 16.163 1.02502 14.9811 1.02502ZM2.38449 13.2181L5.37271 10.6815C5.43036 10.6335 5.51684 10.6335 5.57449 10.6815L7.47696 12.2573C7.71717 12.4591 8.07268 12.4398 8.29368 12.2188L12.8192 7.69328C12.8192 7.69328 12.9057 7.64523 12.9346 7.64523C12.9826 7.64523 13.021 7.66445 13.0499 7.70289L15.9324 11.2484V14.8323C15.9324 15.3512 15.5096 15.7644 15.0004 15.7644H3.31651C2.79765 15.7644 2.38449 15.3416 2.38449 14.8323V13.2181ZM11.9545 6.83813L7.82286 10.9794L6.34317 9.74948C5.83392 9.32671 5.09407 9.32671 4.58482 9.75909L2.38449 11.6327V3.16771C2.38449 2.64885 2.80726 2.23569 3.31651 2.23569H14.9811C15.5 2.23569 15.9132 2.65846 15.9132 3.16771V9.32671L13.9723 6.93421C13.732 6.63635 13.3669 6.45379 12.9826 6.43457C12.5886 6.39614 12.2139 6.55948 11.9449 6.82852L11.9545 6.83813Z" fill="#282F3A"></path>
                                                                    <path d="M6.19462 2.98792C4.9457 2.98792 3.92969 4.00399 3.92969 5.25285C3.92969 6.50173 4.94573 7.51778 6.19462 7.51778C7.4435 7.51778 8.45955 6.50173 8.45955 5.25285C8.45955 4.00396 7.44353 2.98792 6.19462 2.98792ZM6.19462 6.57842C5.46368 6.57842 4.86905 5.98376 4.86905 5.25285C4.86905 4.52191 5.46368 3.92727 6.19462 3.92727C6.92556 3.92727 7.52019 4.52194 7.52019 5.25285C7.52019 5.98376 6.92556 6.57842 6.19462 6.57842Z" fill="#282F3A"></path>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>Image Tools</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/gif-maker" data-v-244e7091>GIF Maker</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="https://imageresizer.com/" target="_blank" data-v-244e7091>Resize Image
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="https://imageresizer.com/crop-image" target="_blank" data-v-244e7091>Crop Image
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="https://imageresizer.com/color-picker" target="_blank" data-v-244e7091>Color Picker
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="https://imageresizer.com/rotate-image" target="_blank" data-v-244e7091>Rotate Image
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="https://imageresizer.com/flip-image" target="_blank" data-v-244e7091>Flip Image
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="https://imageresizer.com/image-enlarger" target="_blank" data-v-244e7091>Image Enlarger
          </a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file-text" data-v-244e7091 data-v-ed111bba>
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" data-v-244e7091 data-v-ed111bba></path>
                                                                    <polyline points="14 2 14 8 20 8" data-v-244e7091 data-v-ed111bba></polyline>
                                                                    <line x1="16" y1="13" x2="8" y2="13" data-v-244e7091 data-v-ed111bba></line>
                                                                    <line x1="16" y1="17" x2="8" y2="17" data-v-244e7091 data-v-ed111bba></line>
                                                                    <polyline points="10 9 9 9 8 9" data-v-244e7091 data-v-ed111bba></polyline>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>PDF Tools</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/merge-pdf" data-v-244e7091>PDF Merge</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/split-pdf" data-v-244e7091>PDF Split</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/flatten-pdf" data-v-244e7091>Flatten PDF</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/unlock-pdf" data-v-244e7091>Unlock PDF</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/rotate-pdf" data-v-244e7091>Rotate PDF</a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/extract-images-from-pdf" data-v-244e7091>Extract image from PDF</a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                    <!---->
                                                    <div class="nested-links__parent__text" data-v-244e7091>
                                                        <span style="margin-top: 5px" data-v-244e7091>API</span>
                                                    </div>
                                                    <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                </button>
                                                <div class="nested-links__content" data-v-244e7091>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file-text" data-v-244e7091 data-v-ed111bba>
                                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" data-v-244e7091 data-v-ed111bba></path>
                                                                    <polyline points="14 2 14 8 20 8" data-v-244e7091 data-v-ed111bba></polyline>
                                                                    <line x1="16" y1="13" x2="8" y2="13" data-v-244e7091 data-v-ed111bba></line>
                                                                    <line x1="16" y1="17" x2="8" y2="17" data-v-244e7091 data-v-ed111bba></line>
                                                                    <polyline points="10 9 9 9 8 9" data-v-244e7091 data-v-ed111bba></polyline>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>Documentation</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/job-builder" target="_blank" data-v-244e7091>API Job Builder
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/v1/" target="_blank" data-v-244e7091>API Documentation
          </a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-repeat" data-v-244e7091 data-v-ed111bba>
                                                                    <polyline points="17 1 21 5 17 9" data-v-244e7091 data-v-ed111bba></polyline>
                                                                    <path d="M3 11V9a4 4 0 0 1 4-4h14" data-v-244e7091 data-v-ed111bba></path>
                                                                    <polyline points="7 23 3 19 7 15" data-v-244e7091 data-v-ed111bba></polyline>
                                                                    <path d="M21 13v2a4 4 0 0 1-4 4H3" data-v-244e7091 data-v-ed111bba></path>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>Conversion APIs</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/file-conversion-api" target="_blank" data-v-244e7091>File Conversion API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/image-conversion-api" target="_blank" data-v-244e7091>Image Conversion API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/audio-conversion-api" target="_blank" data-v-244e7091>Audio Conversion API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/document-conversion-api" target="_blank" data-v-244e7091>Document Conversion API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/pdf-conversion-api" target="_blank" data-v-244e7091>PDF Conversion API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/mp4-conversion-api" target="_blank" data-v-244e7091>MP4 Conversion API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/video-conversion-api" target="_blank" data-v-244e7091>Video Conversion API
          </a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" size="1.2x" data-v-ed111bba>
                                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.10273 1.58081H9.19273C10.9227 1.58081 12.2827 1.58081 13.3427 1.72081C14.4327 1.87081 15.2927 2.17081 15.9727 2.85081C16.6527 3.53081 16.9527 4.39081 17.1027 5.48081C17.2427 6.54081 17.2427 7.90081 17.2427 9.63081V9.72081C17.2427 11.4508 17.2427 12.8108 17.1027 13.8708C16.9527 14.9608 16.6527 15.8208 15.9727 16.5008C15.2927 17.1808 14.4327 17.4808 13.3427 17.6308C12.2827 17.7708 10.9227 17.7708 9.19273 17.7708H9.10273C7.37273 17.7708 6.01273 17.7708 4.95273 17.6308C3.86273 17.4808 3.00273 17.1808 2.32273 16.5008C1.64273 15.8208 1.34273 14.9608 1.19273 13.8708C1.05273 12.8108 1.05273 11.4508 1.05273 9.72081V9.63081C1.05273 7.90081 1.05273 6.54081 1.19273 5.48081C1.34273 4.39081 1.64273 3.53081 2.32273 2.85081C3.00273 2.17081 3.86273 1.87081 4.95273 1.72081C6.01273 1.58081 7.37273 1.58081 9.10273 1.58081ZM5.11273 2.90081C4.15273 3.03081 3.58273 3.27081 3.16273 3.69081C2.74273 4.11081 2.50273 4.68081 2.37273 5.64081C2.24273 6.61081 2.24273 7.89081 2.24273 9.68081C2.24273 11.4708 2.24273 12.7408 2.37273 13.7208C2.50273 14.6808 2.74273 15.2508 3.16273 15.6708C3.58273 16.0908 4.15273 16.3308 5.11273 16.4608C6.08273 16.5908 7.36273 16.5908 9.15273 16.5908C10.9427 16.5908 12.2127 16.5908 13.1927 16.4608C14.1527 16.3308 14.7227 16.0908 15.1427 15.6708C15.5627 15.2508 15.8027 14.6808 15.9327 13.7208C16.0627 12.7508 16.0627 11.4708 16.0627 9.68081C16.0627 7.89081 16.0627 6.62081 15.9327 5.64081C15.8027 4.68081 15.5627 4.11081 15.1427 3.69081C14.7227 3.27081 14.1527 3.03081 13.1927 2.90081C12.2227 2.77081 10.9427 2.77081 9.15273 2.77081C7.36273 2.77081 6.09273 2.77081 5.11273 2.90081Z" fill="#282F3A"></path>
                                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.74903 6.71093C5.99903 6.71093 6.21903 6.85093 6.31903 7.07093L8.28903 11.8109C8.41903 12.1109 8.26903 12.4609 7.96903 12.5809C7.66903 12.7109 7.31903 12.5609 7.19903 12.2609L6.85903 11.4409H5.01903L4.75903 12.2209C4.65903 12.5309 4.31903 12.7009 4.00903 12.5909C3.69903 12.4809 3.52903 12.1509 3.63903 11.8409L5.21903 7.10093C5.29903 6.87093 5.50903 6.70093 5.75903 6.70093L5.74903 6.71093ZM5.40903 10.2709H6.35903L5.82903 9.00093L5.40903 10.2709Z" fill="#282F3A"></path>
                                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M10.0514 6.71069C10.0514 6.71069 10.0714 6.71069 10.0814 6.71069H11.1114C12.0914 6.71069 12.8914 7.51069 12.8914 8.49069C12.8914 9.47069 12.0914 10.2707 11.1114 10.2707H10.1214V12.0507C10.1214 12.3807 9.85141 12.6407 9.53141 12.6407C9.21141 12.6407 8.94141 12.3707 8.94141 12.0507V7.86069C8.94141 7.86069 8.94141 7.84069 8.94141 7.83069C8.94141 7.72069 8.94141 7.55069 8.99141 7.40069C9.09141 7.10069 9.32141 6.86069 9.62141 6.77069C9.77141 6.72069 9.95141 6.72069 10.0514 6.72069V6.71069ZM10.1214 9.08069H11.1114C11.4414 9.08069 11.7014 8.81069 11.7014 8.49069C11.7014 8.17069 11.4314 7.90069 11.1114 7.90069H10.1214V9.08069Z" fill="#282F3A"></path>
                                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M14.0998 6.71069C14.4298 6.71069 14.6898 6.98069 14.6898 7.30069V12.0407C14.6898 12.3707 14.4198 12.6307 14.0998 12.6307C13.7798 12.6307 13.5098 12.3607 13.5098 12.0407V7.30069C13.5098 6.97069 13.7798 6.71069 14.0998 6.71069Z" fill="#282F3A"></path>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>Specific APIs</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/jpg-to-pdf-api" target="_blank" data-v-244e7091>JPG to PDF API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/video-to-mp3-api" target="_blank" data-v-244e7091>Video to MP3 API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/heic-to-jpg-api" target="_blank" data-v-244e7091>HEIC to JPG API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/pdf-to-jpg-api" target="_blank" data-v-244e7091>PDF to JPG API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/webp-to-png-api" target="_blank" data-v-244e7091>Webp to PNG API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/pdf-to-word-api" target="_blank" data-v-244e7091>PDF to WORD API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/mp4-to-mp3-api" target="_blank" data-v-244e7091>MP4 to MP3 API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/webp-to-jpg-api" target="_blank" data-v-244e7091>Webp to JPG API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/word-to-pdf-api" target="_blank" data-v-244e7091>WORD to PDF API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/html-to-pdf-api" target="_blank" data-v-244e7091>HTML to PDF API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/website-screenshot-api" target="_blank" data-v-244e7091>Website Screenshot API
          </a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                        <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                            <span style="margin-right: 10px" data-v-244e7091>
                                                                <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" size="1.2x" data-v-ed111bba>
                                                                    <path d="M12.3476 3.63262L10.5112 5.45759V1.66992H9.11089V5.45759L7.28592 3.63262L6.29883 4.61971L9.81103 8.13192L13.3347 4.61971L12.3476 3.63262Z" fill="#282F3A"></path>
                                                                    <path d="M13.3347 14.7317L9.81103 11.2195L6.29883 14.7317L7.28592 15.7188L9.11089 13.8938V17.6815H10.5112V13.8938L12.3476 15.7188L13.3347 14.7317Z" fill="#282F3A"></path>
                                                                    <path d="M2.20117 8.98106V10.3813L17.4322 10.3813V8.98106H2.20117Z" fill="#282F3A"></path>
                                                                </svg>
                                                            </span>
                                                            <div class="nested-links__parent__text bold-header" data-v-244e7091>
                                                                <span style="margin-top: 5px" data-v-244e7091>Compression APIs</span>
                                                            </div>
                                                            <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                                        </button>
                                                        <div class="nested-links__content" data-v-244e7091>
                                                            <ul class="p-0 mb-0" data-v-244e7091>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/video-compression-api" target="_blank" data-v-244e7091>Video Compression API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/compress-pdf-api" target="_blank" data-v-244e7091>Compress PDF API
          </a>
                                                                </li>
                                                                <li class="m-0" data-v-244e7091>
                                                                    <a href="/api/image-compression-api" target="_blank" data-v-244e7091>Image Compression API
          </a>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="nested-links" data-v-244e7091 data-v-ed111bba>
                                                <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                    <!---->
                                                    <div class="nested-links__parent__text" data-v-244e7091>
                                                        <span style="margin-top: 5px" data-v-244e7091>Pricing</span>
                                                    </div>
                                                    <!---->
                                                </button>
                                                <div class="nested-links__content" data-v-244e7091>
                                                <!---->
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="visible-in-web__navigation" data-v-a74f88da data-v-ed8b2202>
                            <div id="NavigationBarWeb" data-automation-id="NavigationBarWeb" class="navigation-web" data-v-a74f88da>
                                <nav class="navbar" data-v-a74f88da>
                                    <a href="/" data-automation-id="NavigationLogoWeb" class="Logo nuxt-link-active" data-v-11580f7e data-v-a74f88da>
                                        <img src="https://cdn.freeconvert.com/logo_theme.svg" width="152" height="25" alt="Logo" loading="lazy" data-v-11580f7e>
                                    </a>
                                    <ul class="navigation-links__links navbar-nav d-flex align-items-center flex-row" data-v-47965b1a data-v-a74f88da>
                                        <li class="navigation-links__links__item navigation-links__links__item--tools nav-item" data-v-47965b1a>
                                            <a href="#" data-automation-id="NavigationConvertDropdown" class="drop navigation-tools-dropdown" data-v-47965b1a>
                                                Convert
            
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down" data-v-47965b1a data-v-47965b1a>
                                                    <polyline points="6 9 12 15 18 9" data-v-47965b1a data-v-47965b1a></polyline>
                                                </svg>
                                            </a>
                                        </li>
                                        <li class="navigation-links__links__item navigation-links__links__item--tools nav-item" data-v-47965b1a>
                                            <a href="#" data-automation-id="NavigationCompressDropdown" class="drop navigation-tools-dropdown" data-v-47965b1a>
                                                Compress
            
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down" data-v-47965b1a data-v-47965b1a>
                                                    <polyline points="6 9 12 15 18 9" data-v-47965b1a data-v-47965b1a></polyline>
                                                </svg>
                                            </a>
                                        </li>
                                        <li class="navigation-links__links__item navigation-links__links__item--tools nav-item" data-v-47965b1a>
                                            <a href="#" data-automation-id="NavigationToolsDropdown" class="drop navigation-tools-dropdown" data-v-47965b1a>
                                                Tools
            
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down" data-v-47965b1a data-v-47965b1a>
                                                    <polyline points="6 9 12 15 18 9" data-v-47965b1a data-v-47965b1a></polyline>
                                                </svg>
                                            </a>
                                        </li>
                                        <li class="navigation-links__links__item navigation-links__links__item--tools nav-item" data-v-47965b1a>
                                            <a href="#" data-automation-id="NavigationApiDropdown" class="drop navigation-tools-dropdown api" data-v-47965b1a>
                                                API
            
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down" data-v-47965b1a data-v-47965b1a>
                                                    <polyline points="6 9 12 15 18 9" data-v-47965b1a data-v-47965b1a></polyline>
                                                </svg>
                                            </a>
                                        </li>
                                        <li class="navigation-links__links__item nav-item" data-v-47965b1a>
                                            <a data-automation-id="NavigationPricing" href="/pricing" data-v-47965b1a>Pricing
        </a>
                                        </li>
                                    </ul>
                                    <div data-v-a74f88da>
                                        <div data-automation-id="SiteSearchIcon" style="cursor: pointer">
                                            <svg width="41" height="41" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="0.816406" y="0.162354" width="40" height="40" rx="20" fill="#F5F4F3"></rect>
                                                <path d="M19.9831 25.9957C23.665 25.9957 26.6497 23.0109 26.6497 19.329C26.6497 15.6471 23.665 12.6624 19.9831 12.6624C16.3012 12.6624 13.3164 15.6471 13.3164 19.329C13.3164 23.0109 16.3012 25.9957 19.9831 25.9957Z" stroke="#282F3A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                                <path d="M28.3164 27.6624L24.6914 24.0374" stroke="#282F3A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                            </svg>
                                        </div>
                                        <!---->
                                    </div>
                                    <div id="NavigationAuth" class="navigation-auth d-flex align-items-center" data-v-47dc278d data-v-a74f88da>
                                        <span style="display: none" data-v-47dc278d>auth.token:false,loggedInStore: false</span>
                                        <div class="nested-links visible-in-mobile__navigation" style="display:none;" data-v-244e7091 data-v-47dc278d>
                                            <button aria-disabled="true" class="nested-links__parent" data-v-244e7091>
                                                <span style="margin-right: 10px" data-v-244e7091>
                                                    <button class="button white oval navigation-auth__icon-button d-flex justify-content-center align-items-center" data-v-244e7091 data-v-47dc278d>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="navigation-auth__icon feather feather-user" data-v-244e7091 data-v-47dc278d>
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" data-v-244e7091 data-v-47dc278d></path>
                                                            <circle cx="12" cy="7" r="4" data-v-244e7091 data-v-47dc278d></circle>
                                                        </svg>
                                                    </button>
                                                </span>
                                                <div class="nested-links__parent__text" data-v-244e7091>
                                                    <span style="margin-top: 5px" data-v-244e7091>My Account</span>
                                                </div>
                                                <span class="nested-links__parent__icon" data-v-244e7091>▼</span>
                                            </button>
                                            <div class="nested-links__content" data-v-244e7091>
                                                <ul class="navigation-auth__account-options" data-v-244e7091 data-v-47dc278d>
                                                    <li data-v-244e7091 data-v-47dc278d>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-shopping-cart" data-v-244e7091 data-v-47dc278d>
                                                            <circle cx="9" cy="21" r="1" data-v-244e7091 data-v-47dc278d></circle>
                                                            <circle cx="20" cy="21" r="1" data-v-244e7091 data-v-47dc278d></circle>
                                                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" data-v-244e7091 data-v-47dc278d></path>
                                                        </svg>
                                                        Billing Plan
      
                                                    </li>
                                                    <li data-v-244e7091 data-v-47dc278d>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-credit-card" data-v-244e7091 data-v-47dc278d>
                                                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" data-v-244e7091 data-v-47dc278d></rect>
                                                            <line x1="1" y1="10" x2="23" y2="10" data-v-244e7091 data-v-47dc278d></line>
                                                        </svg>
                                                        Payment Method
      
                                                    </li>
                                                    <li data-v-244e7091 data-v-47dc278d>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file-text" data-v-244e7091 data-v-47dc278d>
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" data-v-244e7091 data-v-47dc278d></path>
                                                            <polyline points="14 2 14 8 20 8" data-v-244e7091 data-v-47dc278d></polyline>
                                                            <line x1="16" y1="13" x2="8" y2="13" data-v-244e7091 data-v-47dc278d></line>
                                                            <line x1="16" y1="17" x2="8" y2="17" data-v-244e7091 data-v-47dc278d></line>
                                                            <polyline points="10 9 9 9 8 9" data-v-244e7091 data-v-47dc278d></polyline>
                                                        </svg>
                                                        Invoice
      
                                                    </li>
                                                    <li class="hl" data-v-244e7091 data-v-47dc278d></li>
                                                    <li data-v-244e7091 data-v-47dc278d>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-layers" data-v-244e7091 data-v-47dc278d>
                                                            <polygon points="12 2 2 7 12 12 22 7 12 2" data-v-244e7091 data-v-47dc278d></polygon>
                                                            <polyline points="2 17 12 22 22 17" data-v-244e7091 data-v-47dc278d></polyline>
                                                            <polyline points="2 12 12 17 22 12" data-v-244e7091 data-v-47dc278d></polyline>
                                                        </svg>
                                                        Tasks
      
                                                    </li>
                                                    <li data-v-244e7091 data-v-47dc278d>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-briefcase" data-v-244e7091 data-v-47dc278d>
                                                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" data-v-244e7091 data-v-47dc278d></rect>
                                                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" data-v-244e7091 data-v-47dc278d></path>
                                                        </svg>
                                                        Jobs
      
                                                    </li>
                                                    <li data-v-244e7091 data-v-47dc278d>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-key" data-v-244e7091 data-v-47dc278d>
                                                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" data-v-244e7091 data-v-47dc278d></path>
                                                        </svg>
                                                        API Keys
      
                                                    </li>
                                                    <li data-v-244e7091 data-v-47dc278d>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-anchor" data-v-244e7091 data-v-47dc278d>
                                                            <circle cx="12" cy="5" r="3" data-v-244e7091 data-v-47dc278d></circle>
                                                            <line x1="12" y1="22" x2="12" y2="8" data-v-244e7091 data-v-47dc278d></line>
                                                            <path d="M5 12H2a10 10 0 0 0 20 0h-3" data-v-244e7091 data-v-47dc278d></path>
                                                        </svg>
                                                        Webhooks
      
                                                    </li>
                                                    <li class="hl" data-v-244e7091 data-v-47dc278d></li>
                                                    <li data-v-244e7091 data-v-47dc278d>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user" data-v-244e7091 data-v-47dc278d>
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" data-v-244e7091 data-v-47dc278d></path>
                                                            <circle cx="12" cy="7" r="4" data-v-244e7091 data-v-47dc278d></circle>
                                                        </svg>
                                                        Account
      
                                                    </li>
                                                    <li data-v-244e7091 data-v-47dc278d>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-bell" data-v-244e7091 data-v-47dc278d>
                                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" data-v-244e7091 data-v-47dc278d></path>
                                                            <path d="M13.73 21a2 2 0 0 1-3.46 0" data-v-244e7091 data-v-47dc278d></path>
                                                        </svg>
                                                        Notifications
      
                                                    </li>
                                                    <li data-v-244e7091 data-v-47dc278d>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-users" data-v-244e7091 data-v-47dc278d>
                                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" data-v-244e7091 data-v-47dc278d></path>
                                                            <circle cx="9" cy="7" r="4" data-v-244e7091 data-v-47dc278d></circle>
                                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" data-v-244e7091 data-v-47dc278d></path>
                                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" data-v-244e7091 data-v-47dc278d></path>
                                                        </svg>
                                                        Team
      
                                                    </li>
                                                    <li data-v-244e7091 data-v-47dc278d>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-activity" data-v-244e7091 data-v-47dc278d>
                                                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" data-v-244e7091 data-v-47dc278d></polyline>
                                                        </svg>
                                                        Activity
      
                                                    </li>
                                                    <li data-v-244e7091 data-v-47dc278d>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-circle" data-v-244e7091 data-v-47dc278d>
                                                            <circle cx="12" cy="12" r="10" data-v-244e7091 data-v-47dc278d></circle>
                                                            <line x1="12" y1="8" x2="12" y2="12" data-v-244e7091 data-v-47dc278d></line>
                                                            <line x1="12" y1="16" x2="12.01" y2="16" data-v-244e7091 data-v-47dc278d></line>
                                                        </svg>
                                                        FAQ
      
                                                    </li>
                                                    <li data-v-244e7091 data-v-47dc278d>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-log-out" data-v-244e7091 data-v-47dc278d>
                                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" data-v-244e7091 data-v-47dc278d></path>
                                                            <polyline points="16 17 21 12 16 7" data-v-244e7091 data-v-47dc278d></polyline>
                                                            <line x1="21" y1="12" x2="9" y2="12" data-v-244e7091 data-v-47dc278d></line>
                                                        </svg>
                                                        Logout
      
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div id="NavigationUserDropdown" data-automation-id="NavigationUserDropdown" class="drop visible-in-web__navigation default" style="display:none;" data-v-14ab5a00 data-v-47dc278d>
                                            <a href="#" class="drop__trigger" data-v-14ab5a00>
                                                <button class="button oval white navigation-auth__icon-button d-flex justify-content-center align-items-center" data-v-14ab5a00 data-v-47dc278d>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="navigation-auth__icon feather feather-user" data-v-14ab5a00 data-v-47dc278d>
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" data-v-14ab5a00 data-v-47dc278d></path>
                                                        <circle cx="12" cy="7" r="4" data-v-14ab5a00 data-v-47dc278d></circle>
                                                    </svg>
                                                </button>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="drop__icon feather feather-chevron-down" data-v-14ab5a00 data-v-14ab5a00>
                                                    <polyline points="6 9 12 15 18 9" data-v-14ab5a00 data-v-14ab5a00></polyline>
                                                </svg>
                                            </a>
                                            <div class="drop__content-wrapper drop-pos-left" data-v-14ab5a00>
                                                <div class="drop__content drop-pos-left" data-v-14ab5a00>
                                                    <div class="user-dropdown" data-v-14ab5a00 data-v-47dc278d>
                                                        <a data-automation-id="NavigationDashboardLink" href="/account/billing-plan" class="user-dropdown__item" data-v-14ab5a00 data-v-47dc278d>Dashboard
      </a>
                                                        <a data-automation-id="NavigationLoginLink" href="#" class="user-dropdown__item" data-v-14ab5a00 data-v-47dc278d>Logout
      </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div id="NavigationAuthLinks" class="navigation-auth__wrapper align-items-center" style="display:;" data-v-47dc278d>
                                            <a href="/auth/login" data-automation-id="NavigationLoginWeb" class="button link navigation-auth__button navigation-auth__button--login" data-v-47dc278d>Log In
    </a>
                                            <a href="/pricing" data-automation-id="NavigationSignupWeb" class="button primary_outline navigation-auth__button navigation-auth__button--signup" data-v-47dc278d>Sign Up
    </a>
                                        </div>
                                    </div>
                                </nav>
                            </div>
                            <!---->
                        </div>
                        <div id="breadcrumb" data-automation-id="NavBreadcrumb" data-v-ed8b2202>
                            <ol class="breadcrumb">
                                <li>
                                    <!---->
                                    <a href="/" class="nuxt-link-active">Home
                </a>
                                </li>
                                <li>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right">
                                        <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                    <a href="/video-compressor">Video Compressor</a>
                                </li>
                            </ol>
                        </div>
                    </div>
                    <div id="fc__app" class="converter-page hasbreadcrumb" data-v-ea80c756 data-v-9b2d368e>
                        <div class="ads-side-layout container container--theme visible-in-web" data-v-5c6d6a47 data-v-abbc60c2 data-v-ea80c756>
                            <div class="ads-side-layout__left" data-v-5c6d6a47>
                                <div class="ads-side-layout__placement" style="padding-top:130px;" data-v-5c6d6a47>
                                    <div class="ad-sticky-wrapper" data-v-5c6d6a47 data-v-abbc60c2>
                                        <div class="ad-container" data-v-5c6d6a47 data-v-abbc60c2>
                                            <div data-aaad="true" data-aa-adunit="/22404391699/FreeConvert_LeftSidebar" data-v-5c6d6a47 data-v-abbc60c2></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="ads-side-layout__right" data-v-5c6d6a47>
                                <div class="ads-side-layout__placement" style="padding-top:130px;" data-v-5c6d6a47>
                                    <div class="ad-sticky-wrapper" data-v-5c6d6a47 data-v-abbc60c2>
                                        <div class="ad-container" data-v-5c6d6a47 data-v-abbc60c2>
                                            <div data-aaad="true" data-aa-adunit="/22404391699/FreeConvert_RightSidebar" data-v-5c6d6a47 data-v-abbc60c2></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="container container--theme" data-v-ea80c756>
                            <!---->
                            <h1 class="h1 converter-page__title" data-v-ea80c756>Video Compressor
            </h1>
                            <p class="converter-page__description" data-v-ea80c756>World's best video compressor tool to reduce video file size
            </p>
                            <br data-v-ea80c756>
                            <div class="container container--theme" data-v-48a88b00 data-v-ea80c756>
                                <div class="ads-in-page" data-v-48a88b00>
                                    <div class="ad-in-page__container" data-v-48a88b00>
                                        <div data-aaad="true" data-aa-adunit="/22404391699/FreeConvert_TopLeaderboard" data-v-48a88b00></div>
                                    </div>
                                </div>
                            </div>
                            <br data-v-ea80c756>
                            <div type="video-compressor" info="[object Object]" class="tool-template" data-v-744d43ba data-v-ea80c756>
                                <div class="file-input" data-v-cc632b3e data-v-744d43ba>
                                    <div class="dropzone flex-column" data-v-cfb61030 data-v-cc632b3e>
                                        <div class="file-input-dropdown__wrapper" data-v-06b5dcbf data-v-cfb61030>
                                            <div id="FileInputDropdown" data-automation-id="FileInputDropdownButton" class="file-input-dropdown" data-v-06b5dcbf>
                                                <div id="FileInputDropdownHolder" class="file-input-dropdown__holder" data-v-06b5dcbf>
                                                    <div class="file-input-dropdown__button" style="display:;" data-v-06b5dcbf>
                                                        <div id="upload-file-button" data-automation-id="FilePickerButton" class="file-input-dropdown__button__content" data-v-06b5dcbf>
                                                            <input type="file" id="file" data-automation-id="DeviceUploaderInput" multiple="multiple" accept=".m2ts,.mp4,.mts,.mpeg,.swf,.mod,.mov,.m4v,.qt,.rm,.mpg,.3gpp,.flv,.divx,.vob,.dvr-ms,.wmv,.rmvb,.asf,.mkv,.3g2,.ts,.mpv,.wtv,.webm,.xvid,.3gp,.mxf,.avi,.m1v,.f4p,.f4v,.ogv" class="device-uploader" data-v-3ce7d028 data-v-06b5dcbf>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="file-input-dropdown__button__icon feather feather-file-plus" data-v-06b5dcbf data-v-06b5dcbf>
                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" data-v-06b5dcbf data-v-06b5dcbf></path>
                                                                <polyline points="14 2 14 8 20 8" data-v-06b5dcbf data-v-06b5dcbf></polyline>
                                                                <line x1="12" y1="18" x2="12" y2="12" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                <line x1="9" y1="15" x2="15" y2="15" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                            </svg>
                                                            <span data-v-06b5dcbf>Choose Files</span>
                                                        </div>
                                                        <div id="FileInputDropDownTrigger" data-automation-id="FileInputDropDownTrigger" class="file-input-dropdown__button__drop" data-v-06b5dcbf>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="caret-holder__icon feather feather-chevron-down" data-v-06b5dcbf data-v-06b5dcbf>
                                                                <polyline points="6 9 12 15 18 9" data-v-06b5dcbf data-v-06b5dcbf></polyline>
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <ul data-automation-id="FileInputDropdownList" class="file-input-dropdown__list" data-v-06b5dcbf>
                                                        <li class="file-input-dropdown__list__item" data-v-06b5dcbf>
                                                            <div data-v-06b5dcbf>
                                                                <input type="file" id="file" data-automation-id="DeviceUploaderInput" multiple="multiple" accept=".m2ts,.mp4,.mts,.mpeg,.swf,.mod,.mov,.m4v,.qt,.rm,.mpg,.3gpp,.flv,.divx,.vob,.dvr-ms,.wmv,.rmvb,.asf,.mkv,.3g2,.ts,.mpv,.wtv,.webm,.xvid,.3gp,.mxf,.avi,.m1v,.f4p,.f4v,.ogv" class="device-uploader" data-v-3ce7d028 data-v-06b5dcbf>
                                                                <svg id="Icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 26" height="20" width="26" class="file-input-dropdown__list__item__icon" data-v-06b5dcbf>
                                                                    <g>
                                                                        <path d="M20 16C20 16.5304 19.7893 17.0391 19.4142 17.4142C19.0391 17.7893 18.5304 18 18 18H2C1.46957 18 0.960859 17.7893 0.585786 17.4142C0.210714 17.0391 0 16.5304 0 16V2C0 1.46957 0.210714 0.960859 0.585786 0.585786C0.960859 0.210714 1.46957 0 2 0H7L9 3H18C18.5304 3 19.0391 3.21071 19.4142 3.58579C19.7893 3.96086 20 4.46957 20 5V16Z" fill="white"></path>
                                                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M9 3L7 0H2C1.46957 0 0.960859 0.210714 0.585786 0.585786C0.210714 0.960859 0 1.46957 0 2V16C0 16.5304 0.210714 17.0391 0.585786 17.4142C0.960859 17.7893 1.46957 18 2 18H18C18.5304 18 19.0391 17.7893 19.4142 17.4142C19.7893 17.0391 20 16.5304 20 16V5C20 4.46957 19.7893 3.96086 19.4142 3.58579C19.0391 3.21071 18.5304 3 18 3H9ZM5.92963 2H2V16H18V5H9C8.33129 5 7.70683 4.6658 7.3359 4.1094L5.92963 2Z" fill="white"></path>
                                                                    </g>
                                                                </svg>
                                                                From Device
            
                                                            </div>
                                                        </li>
                                                        <li class="file-input-dropdown__list__item disabled-picker" data-v-06b5dcbf>
                                                            <div class="d-flex" data-v-06b5dcbf>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spins file-input-dropdown__list__item__icon feather feather-loader" data-v-06b5dcbf data-v-06b5dcbf>
                                                                    <line x1="12" y1="2" x2="12" y2="6" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="12" y1="18" x2="12" y2="22" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="2" y1="12" x2="6" y2="12" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="18" y1="12" x2="22" y2="12" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                </svg>
                                                                <div data-v-06b5dcbf>From Dropbox
            </div>
                                                            </div>
                                                        </li>
                                                        <li class="file-input-dropdown__list__item disabled-picker" data-v-06b5dcbf>
                                                            <div class="d-flex" data-v-06b5dcbf>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spins file-input-dropdown__list__item__icon feather feather-loader" data-v-06b5dcbf data-v-06b5dcbf>
                                                                    <line x1="12" y1="2" x2="12" y2="6" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="12" y1="18" x2="12" y2="22" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="2" y1="12" x2="6" y2="12" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="18" y1="12" x2="22" y2="12" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                </svg>
                                                                <div data-v-06b5dcbf>From Google Drive
            </div>
                                                            </div>
                                                        </li>
                                                        <li class="file-input-dropdown__list__item" data-v-06b5dcbf>
                                                            <div class="d-flex" data-v-06b5dcbf>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spins file-input-dropdown__list__item__icon feather feather-loader" data-v-06b5dcbf data-v-06b5dcbf>
                                                                    <line x1="12" y1="2" x2="12" y2="6" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="12" y1="18" x2="12" y2="22" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="2" y1="12" x2="6" y2="12" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="18" y1="12" x2="22" y2="12" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" data-v-06b5dcbf data-v-06b5dcbf></line>
                                                                </svg>
                                                                <div data-v-06b5dcbf>From OneDrive
            </div>
                                                            </div>
                                                        </li>
                                                        <li class="file-input-dropdown__list__item" data-v-06b5dcbf>
                                                            <div data-v-06b5dcbf>
                                                                <!---->
                                                                <svg id="Icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 26" height="20" width="26" class="file-input-dropdown__list__item__icon" data-v-06b5dcbf>
                                                                    <g>
                                                                        <path d="M11.7661 13.8266L8.70516 16.8876C7.43935 18.1535 5.37946 18.1537 4.11351 16.8878C3.50023 16.2745 3.16256 15.4591 3.16256 14.592C3.16256 13.7249 3.50023 12.9096 4.11329 12.2963C4.11322 12.2964 4.11336 12.2963 4.11329 12.2963L7.17449 9.23507C7.59708 8.81242 7.59708 8.12713 7.17442 7.70454C6.75183 7.28196 6.06655 7.28196 5.64389 7.70454L2.5829 10.7656C2.58312 10.7654 2.58269 10.7658 2.5829 10.7656C1.56133 11.7875 0.998047 13.1469 0.998047 14.592C0.998047 16.0373 1.56089 17.3962 2.58298 18.4183C3.63796 19.4732 5.02361 20.0007 6.40933 20.0007C7.79506 20.0007 9.18078 19.4732 10.2356 18.4183L13.2967 15.3571C13.7193 14.9345 13.7193 14.2492 13.2966 13.8266C12.8741 13.404 12.1889 13.404 11.7661 13.8266Z" fill="white"></path>
                                                                        <path d="M21.0037 5.4087C21.0037 3.96331 20.4408 2.60443 19.4187 1.58234C17.3088 -0.527483 13.8758 -0.527411 11.7661 1.58234C11.7662 1.5822 11.766 1.58249 11.7661 1.58234L8.70488 4.64354C8.28223 5.06613 8.28223 5.75149 8.70488 6.17407C8.91629 6.38547 9.1932 6.4911 9.47018 6.4911C9.7471 6.4911 10.0242 6.3854 10.2354 6.17407L13.2963 3.11323C13.2962 3.11338 13.2964 3.11309 13.2963 3.11323C14.5621 1.84742 16.6222 1.84699 17.8882 3.11287C18.5014 3.72615 18.8392 4.54152 18.8392 5.4087C18.8392 6.2758 18.5015 7.09103 17.8884 7.70431C17.8885 7.70424 17.8883 7.70438 17.8884 7.70431L14.8272 10.7656C14.4046 11.1882 14.4046 11.8735 14.8273 12.2961C15.0386 12.5074 15.3156 12.6131 15.5925 12.6131C15.8695 12.6131 16.1465 12.5074 16.3578 12.2961L19.4188 9.23506C19.4186 9.23527 19.419 9.23484 19.4188 9.23506C20.4404 8.21312 21.0037 6.85373 21.0037 5.4087Z" fill="white"></path>
                                                                        <path d="M7.17449 13.8266C7.38582 14.0379 7.6628 14.1436 7.93972 14.1436C8.2167 14.1436 8.49369 14.0379 8.70502 13.8266L14.8271 7.70447C15.2498 7.28189 15.2498 6.59661 14.8271 6.17395C14.4045 5.75136 13.7193 5.75136 13.2966 6.17395L7.17449 12.296C6.75183 12.7187 6.75183 13.404 7.17449 13.8266Z" fill="white"></path>
                                                                    </g>
                                                                </svg>
                                                                From Url
            
                                                            </div>
                                                        </li>
                                                    </ul>
                                                </div>
                                                <!---->
                                            </div>
                                            <!---->
                                            <div data-v-06b5dcbf></div>
                                            <div data-v-06b5dcbf></div>
                                            <div data-v-06b5dcbf></div>
                                            <!---->
                                            <!---->
                                            <!---->
                                            <div id="fullpageDrop" class="full-page-dropzone" style="display:none;" data-v-93e6ca88 data-v-06b5dcbf>
                                                <img src="https://cdn.freeconvert.com/add-file.png" alt="Drop Files" loading="lazy" data-v-93e6ca88>
                                                <p data-v-93e6ca88>Drop any files here!</p>
                                            </div>
                                            <!---->
                                        </div>
                                        <span class="msg" style="display:;" data-v-cfb61030>
                                            <span data-v-cfb61030>
                                                Max file size 1GB.
      
                                                <span style="display:none;" data-v-cfb61030>
                                                    <a href="/pricing" data-v-cfb61030>Upgrade for more</a>
                                                </span>
                                                <span style="display:;" data-v-cfb61030>
                                                    <a href="/pricing" data-v-cfb61030>Sign Up</a>
                                                    for more
      
                                                </span>
                                            </span>
                                            <p class="upload-copyright" data-v-cfb61030>
                                                By proceeding, you agree to our <a href='/terms' target='_blank'>Terms of Use</a>
                                                .
                                            </p>
                                        </span>
                                    </div>
                                </div>
                                <br style="display:;" data-v-744d43ba>
                                <div id="accordionSingle" data-v-33a9f859 data-v-744d43ba>
                                    <div class="accordion" data-v-33a9f859>
                                        <input id="toggle-single" type="radio" name="toggle" class="accordion-toggle open" data-v-33a9f859>
                                        <label for="toggle-single" data-v-33a9f859>
                                            <span class="accordion__title" data-v-33a9f859>
                                                <div class="collapsed-settings__title" data-v-33a9f859 data-v-744d43ba>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="collapsed-settings__title__icon feather feather-settings" data-v-33a9f859 data-v-744d43ba>
                                                        <circle cx="12" cy="12" r="3" data-v-33a9f859 data-v-744d43ba></circle>
                                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" data-v-33a9f859 data-v-744d43ba></path>
                                                    </svg>
                                                    <span data-v-33a9f859 data-v-744d43ba>Advanced settings (optional)</span>
                                                </div>
                                            </span>
                                            <span class="accordion__icon" data-v-33a9f859>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down" data-v-33a9f859 data-v-33a9f859>
                                                    <polyline points="6 9 12 15 18 9" data-v-33a9f859 data-v-33a9f859></polyline>
                                                </svg>
                                            </span>
                                        </label>
                                        <section id="section-single" data-v-33a9f859>
                                            <div class="collapsed-settings" data-v-33a9f859 data-v-744d43ba>
                                                <section id="advanced-option" class="container single-template__options ao-showing" style="padding:0 15px;" data-v-68c980fc data-v-744d43ba>
                                                    <!---->
                                                    <form method="post" enctype="multipart/form-data" novalidate="novalidate" class="advanced-option__form form-horizontal row" style="margin-right:0 !important;margin-left:0 !important;" data-v-68c980fc data-v-68c980fc>
                                                        <div class="col-md-12 advanced-options__group advanced-options-list" style="padding:0;" data-v-68c980fc>
                                                            <div id="panel-0" class="panel panel-ao in-page" data-v-68c980fc>
                                                                <div id="VideoQuality&amp;SizeTitle" class="advanced-options__group__header d-flex justify-content-between no-radius" style="font-size:16px;" data-v-68c980fc>
                                                                    <span data-v-68c980fc>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-settings" data-v-68c980fc>
                                                                            <circle cx="12" cy="12" r="3" data-v-68c980fc></circle>
                                                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" data-v-68c980fc></path>
                                                                        </svg>
                                                                        Video Quality &amp;Size 
                                                                        <!---->
                                                                    </span>
                                                                    <!---->
                                                                    <!---->
                                                                </div>
                                                                <div id="VideoQuality&amp;SizeOptionsList" class="panel-body container options-list" style="padding-bottom:20px;" data-v-68c980fc>
                                                                    <div class="clearfix container p-0" data-v-79d03f26 data-v-68c980fc>
                                                                        <div uid="page" class="control--theme row col-xs-12" data-v-7ce5e9b8 data-v-79d03f26>
                                                                            <label class="control-label advanced-options-list col-md-12 text-md-left col-xl-4 col-xxl-3 text-xl-right" data-v-7ce5e9b8>Video Codec
        
                                                                            <!---->
                                                                            </label>
                                                                            <div class="col-md-12 col-xl-8 col-xxl-9" data-v-7ce5e9b8>
                                                                                <div data-automation-id="video_codec_compress" class="dropdown" data-v-7ce5e9b8>
                                                                                    <div class="dropdown__selected" data-v-7ce5e9b8>
                                                                                        <div class="dropdown__selected--label" data-v-7ce5e9b8>H264
                    
                                                                                        <!---->
                                                                                        </div>
                                                                                        <span class="dropdown__icon" data-v-7ce5e9b8>
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down" data-v-7ce5e9b8 data-v-7ce5e9b8>
                                                                                                <polyline points="6 9 12 15 18 9" data-v-7ce5e9b8 data-v-7ce5e9b8></polyline>
                                                                                            </svg>
                                                                                        </span>
                                                                                    </div>
                                                                                    <!---->
                                                                                </div>
                                                                                <small data-v-7ce5e9b8>H265 codec can reduce video size 20-75% more compared to H264 (especially high-resolution video)</small>
                                                                                <!---->
                                                                            </div>
                                                                        </div>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <div class="clearfix" data-v-79d03f26></div>
                                                                    </div>
                                                                    <div class="clearfix container p-0" data-v-79d03f26 data-v-68c980fc>
                                                                        <div uid="page" class="control--theme row col-xs-12" data-v-7ce5e9b8 data-v-79d03f26>
                                                                            <label class="control-label advanced-options-list col-md-12 text-md-left col-xl-4 col-xxl-3 text-xl-right" data-v-7ce5e9b8>Compression Method
        
                                                                            <!---->
                                                                            </label>
                                                                            <div class="col-md-12 col-xl-8 col-xxl-9" data-v-7ce5e9b8>
                                                                                <div data-automation-id="compress_video" class="dropdown" data-v-7ce5e9b8>
                                                                                    <div class="dropdown__selected" data-v-7ce5e9b8>
                                                                                        <div class="dropdown__selected--label" data-v-7ce5e9b8>Target a file size (Percentage)
                    
                                                                                        <!---->
                                                                                        </div>
                                                                                        <span class="dropdown__icon" data-v-7ce5e9b8>
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down" data-v-7ce5e9b8 data-v-7ce5e9b8>
                                                                                                <polyline points="6 9 12 15 18 9" data-v-7ce5e9b8 data-v-7ce5e9b8></polyline>
                                                                                            </svg>
                                                                                        </span>
                                                                                    </div>
                                                                                    <!---->
                                                                                </div>
                                                                                <small data-v-7ce5e9b8>Choose "Target a file size" to get an exact output file size. Choose "Target a video quality" when quality is of importance.</small>
                                                                                <!---->
                                                                            </div>
                                                                        </div>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <div class="clearfix" data-v-79d03f26>
                                                                            <div class="clearfix container p-0" data-v-79d03f26 data-v-79d03f26>
                                                                                <!---->
                                                                                <!---->
                                                                                <!---->
                                                                                <!---->
                                                                                <div class="control--theme row col-xs-12" data-v-feec5c6a data-v-79d03f26>
                                                                                    <label for="video_compress_quality_percentage" class="col-md-12 text-md-left col-xl-4 col-xxl-3 text-xl-right" style="padding-top: 5px" data-v-feec5c6a>
                                                                                        <span class="float-xl-right" style="display: inline" data-v-feec5c6a>Select Target Size (%)
            
                                                                                        <!---->
                                                                                        </span>
                                                                                        <span class="visible-in-mobile" data-v-feec5c6a>
                                                                                            <div class="input-group display-flex align-items-center" data-v-feec5c6a>
                                                                                                <input min="0" max="100" type="number" name="video_compress_quality_percentage" value="60" class="form-control percent-input" data-v-feec5c6a>
                                                                                                <span class="input-group-addon percent-input__addon" data-v-feec5c6a>%</span>
                                                                                                <span class="slider-value__limit" data-v-feec5c6a></span>
                                                                                            </div>
                                                                                        </span>
                                                                                    </label>
                                                                                    <div class="col-md-12 col-xl-8 col-xxl-9 row flex-row align-items-center" style="padding-top:0;" data-v-feec5c6a>
                                                                                        <div class="align-center display-flex fffff col-9 pl-0" data-v-feec5c6a>
                                                                                            <div class="vue-slider-container vue-slider-component vue-slider-horizontal" style="width:100%;" data-v-feec5c6a>
                                                                                                <div aria-hidden="true" class="vue-slider" style="height:7px;">
                                                                                                    <div class="vue-slider-dot" style="width:20px;height:20px;top:-7.5px;">
                                                                                                        <span class="vue-slider-tooltip vue-slider-tooltip-top vue-slider-tooltip-wrap">0
          </span>
                                                                                                    </div>
                                                                                                    <ul class="vue-slider-piecewise"></ul>
                                                                                                    <div class="vue-slider-process"></div>
                                                                                                </div>
                                                                                                <input type="range" min="0" max="100" value="0" class="vue-slider-sr-only">
                                                                                            </div>
                                                                                        </div>
                                                                                        <div class="slider-value visible-in-web-tab col-3" data-v-feec5c6a>
                                                                                            <div class="input-group display-flex align-items-center" data-v-feec5c6a>
                                                                                                <div class="percent-input__wrapper" style="position: relative" data-v-feec5c6a>
                                                                                                    <input name="video_compress_quality_percentage" min="0" max="100" type="number" value="60" class="form-control percent-input" data-v-feec5c6a>
                                                                                                    <span class="input-group-addon percent-input__addon" data-v-feec5c6a>%</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div class="row" style="padding-top:0;" data-v-feec5c6a>
                                                                                            <small class="form-text" data-v-feec5c6a>Select a target file size as a percentage (0 - 10000%) of the original. Smaller values compress more. For example, a 100Mb file would become 25Mb if you select 25%.</small>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <!---->
                                                                                <!---->
                                                                                <!---->
                                                                                <!---->
                                                                                <!---->
                                                                                <!---->
                                                                                <div class="clearfix" data-v-79d03f26></div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div class="clearfix container p-0" data-v-79d03f26 data-v-68c980fc>
                                                                        <!---->
                                                                        <!---->
                                                                        <div class="control--theme row col-xs-12" data-v-76a72d5c data-v-79d03f26>
                                                                            <label for="isCompatibleWithOldDevices_compress" class="visible-in-web control-label advanced-options-list col-md-12 text-md-left col-xl-4 col-xxl-3 text-xl-right" data-v-76a72d5c>Make video compatible with old devices?
    
                                                                            <!---->
                                                                            </label>
                                                                            <div class="text-left checkbox col-md-12 col-xl-8 col-xxl-9" data-v-76a72d5c>
                                                                                <div class="theme-checkbox" data-v-76a72d5c>
                                                                                    <input id="isCompatibleWithOldDevices_compresscheckbox" name="isCompatibleWithOldDevices_compress" type="checkbox" class="checkbox" data-v-76a72d5c>
                                                                                    <label for="isCompatibleWithOldDevices_compress" class="checkbox-label" data-v-76a72d5c>
                                                                                        <span class="visible-in-mobile" data-v-76a72d5c>Make video compatible with old devices?</span>
                                                                                        <small class="form-text visible-in-web" style="padding: 0 20px 0 0" data-v-76a72d5c>Only use this option if you plan to play the video on a really old device or if you are having playback issues (it compress less)</small>
                                                                                    </label>
                                                                                </div>
                                                                                <small class="visible-in-mobile d-block" data-v-76a72d5c>Only use this option if you plan to play the video on a really old device or if you are having playback issues (it compress less)</small>
                                                                            </div>
                                                                        </div>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <div class="clearfix" data-v-79d03f26></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div id="panel-1" class="panel panel-ao in-page" data-v-68c980fc>
                                                                <div id="SubtitleSettingsTitle" class="advanced-options__group__header d-flex justify-content-between no-radius" style="font-size:16px;" data-v-68c980fc>
                                                                    <span data-v-68c980fc>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="1.1em" height="1.1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-settings" data-v-68c980fc>
                                                                            <circle cx="12" cy="12" r="3" data-v-68c980fc></circle>
                                                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" data-v-68c980fc></path>
                                                                        </svg>
                                                                        Subtitle Settings 
                                                                        <!---->
                                                                        <!---->
                                                                    </span>
                                                                    <!---->
                                                                    <!---->
                                                                </div>
                                                                <div id="SubtitleSettingsOptionsList" class="panel-body container options-list" style="padding-bottom:20px;" data-v-68c980fc>
                                                                    <div class="clearfix container p-0" data-v-79d03f26 data-v-68c980fc>
                                                                        <div uid="page" class="control--theme row col-xs-12" data-v-7ce5e9b8 data-v-79d03f26>
                                                                            <label class="control-label advanced-options-list col-md-12 text-md-left col-xl-4 col-xxl-3 text-xl-right" data-v-7ce5e9b8>Add Subtitle
        
                                                                            <!---->
                                                                            </label>
                                                                            <div class="col-md-12 col-xl-8 col-xxl-9" data-v-7ce5e9b8>
                                                                                <div data-automation-id="subtitle_add" class="dropdown" data-v-7ce5e9b8>
                                                                                    <div class="dropdown__selected" data-v-7ce5e9b8>
                                                                                        <div class="dropdown__selected--label" data-v-7ce5e9b8>Upload
                    
                                                                                        <!---->
                                                                                        </div>
                                                                                        <span class="dropdown__icon" data-v-7ce5e9b8>
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down" data-v-7ce5e9b8 data-v-7ce5e9b8>
                                                                                                <polyline points="6 9 12 15 18 9" data-v-7ce5e9b8 data-v-7ce5e9b8></polyline>
                                                                                            </svg>
                                                                                        </span>
                                                                                    </div>
                                                                                    <!---->
                                                                                </div>
                                                                                <small data-v-7ce5e9b8>Select the best option for your subtitles: 'Upload' to add your own, or 'Copy' to replicate from the original file.</small>
                                                                                <!---->
                                                                            </div>
                                                                        </div>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <div class="clearfix" data-v-79d03f26></div>
                                                                    </div>
                                                                    <div class="clearfix container p-0" data-v-79d03f26 data-v-68c980fc>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <div class="control--theme row col-xs-12" data-v-b5a7b524 data-v-79d03f26>
                                                                            <label class="col-md-12 text-md-left col-xl-4 col-xxl-3 text-xl-right" data-v-b5a7b524>Upload Subtitles
    
                                                                            <!---->
                                                                            </label>
                                                                            <div class="col-md-12 col-xl-8 col-xxl-9" data-v-b5a7b524>
                                                                                <div class="fake-input form-control" data-v-b5a7b524>
                                                                                    <span class="text" data-v-b5a7b524>Choose a file
      </span>
                                                                                    <span class="fake-btn" data-v-b5a7b524>Browse</span>
                                                                                </div>
                                                                                <input name="subtitle" type="file" accept=".srt,.ass" style="display:none;" data-v-b5a7b524>
                                                                                <small class="form-text" data-v-b5a7b524>Upload a .srt or .ass file.</small>
                                                                                <!---->
                                                                                <!---->
                                                                            </div>
                                                                        </div>
                                                                        <!---->
                                                                        <!---->
                                                                        <div class="clearfix" data-v-79d03f26></div>
                                                                    </div>
                                                                    <div class="clearfix container p-0" data-v-79d03f26 data-v-68c980fc>
                                                                        <div uid="page" class="control--theme row col-xs-12" data-v-7ce5e9b8 data-v-79d03f26>
                                                                            <label class="control-label advanced-options-list col-md-12 text-md-left col-xl-4 col-xxl-3 text-xl-right" data-v-7ce5e9b8>Subtitle Mode
        
                                                                            <!---->
                                                                            </label>
                                                                            <div class="col-md-12 col-xl-8 col-xxl-9" data-v-7ce5e9b8>
                                                                                <div data-automation-id="subtitle_mode" class="dropdown" data-v-7ce5e9b8>
                                                                                    <div class="dropdown__selected" data-v-7ce5e9b8>
                                                                                        <div class="dropdown__selected--label" data-v-7ce5e9b8>Hard
                    
                                                                                        <!---->
                                                                                        </div>
                                                                                        <span class="dropdown__icon" data-v-7ce5e9b8>
                                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down" data-v-7ce5e9b8 data-v-7ce5e9b8>
                                                                                                <polyline points="6 9 12 15 18 9" data-v-7ce5e9b8 data-v-7ce5e9b8></polyline>
                                                                                            </svg>
                                                                                        </span>
                                                                                    </div>
                                                                                    <!---->
                                                                                </div>
                                                                                <small data-v-7ce5e9b8>Hardsubs, always visible and integrated into the video, are suitable for permanent captions, while softsubs, stored separately, can be turned on or off for customized viewing.</small>
                                                                                <!---->
                                                                            </div>
                                                                        </div>
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <!---->
                                                                        <div class="clearfix" data-v-79d03f26></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <!---->
                                                        </div>
                                                    </form>
                                                    <div class="advanced-single__buttons d-flex justify-content-between align-items-center" data-v-68c980fc>
                                                        <div class="d-flex align-items-center advanced-single__preset" style="display:block !important;" data-v-68c980fc>
                                                            <div id="Dropdown" name="" class="dropdown__wrapper nav-item dropdown dropdown-slide dropdown-hover download-action__dropdown" data-v-149d9c9e data-v-68c980fc>
                                                                <a class="dropdown__toggle nav-link" data-v-149d9c9e>
                                                                    <button class="button primary btn-block text-left advanced-option-preset-dropdown download-action__button all" data-v-149d9c9e data-v-68c980fc>Apply to All Files
                    </button>
                                                                    <div data-automation-id="toggle_icon_preset_dropdown" class="dropdown__toggle__icon__placeholder" data-v-149d9c9e></div>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-automation-id="dropdown_btn_icon" class="dropdown__toggle__icon feather feather-chevron-down" data-v-149d9c9e data-v-149d9c9e>
                                                                        <polyline points="6 9 12 15 18 9" data-v-149d9c9e data-v-149d9c9e></polyline>
                                                                    </svg>
                                                                </a>
                                                                <div class="dropdown-menu scrollbar-theme left bottom" data-v-149d9c9e>
                                                                    <div class="download-action__options" data-v-149d9c9e data-v-68c980fc>
                                                                        <ul data-v-149d9c9e data-v-68c980fc>
                                                                            <li data-v-149d9c9e data-v-68c980fc>
                                                                                <button class="button primary btn-block preset-options" data-v-149d9c9e data-v-68c980fc>Reset all options
                            </button>
                                                                            </li>
                                                                            <!---->
                                                                            <li data-v-149d9c9e data-v-68c980fc>
                                                                                <button data-automation-id="dropdown_apply_from_preset" class="button primary btn-block preset-options" data-v-149d9c9e data-v-68c980fc>Apply from Preset
                            </button>
                                                                            </li>
                                                                            <li data-v-149d9c9e data-v-68c980fc>
                                                                                <button data-automation-id="dropdown_save_as_preset" class="button primary btn-block preset-options" data-v-149d9c9e data-v-68c980fc>Save as Preset
                            </button>
                                                                            </li>
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                                <!---->
                                                            </div>
                                                        </div>
                                                        <!---->
                                                    </div>
                                                    <!---->
                                                </section>
                                                <br data-v-33a9f859 data-v-744d43ba>
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </div>
                            <br data-v-ea80c756>
                            <div class="app-links layout__section--elevated" data-v-38046e6f data-v-ea80c756>
                                <div class="links-header text-center" data-v-38046e6f>
                                    <p class="links-header__text text-center" data-v-38046e6f>Get it on Mobile
    </p>
                                    <p data-v-38046e6f>
                                        Compress videos directly on your mobile device using our <a href="https://play.google.com/store/apps/details?id=com.freeconvert.video_compressor" data-v-38046e6f>Android Video Compressor</a>
                                        or <a href="https://apps.apple.com/app/apple-store/id1560444951?pt=118041337&amp;ct=fc-inhouseads-vcapp&amp;mt=8" data-v-38046e6f>iOS Video Compressor</a>
                                        .
    
                                    </p>
                                </div>
                                <div class="app-link-btns" data-v-38046e6f>
                                    <a target="_blank" href="https://play.google.com/store/apps/details?id=com.freeconvert.video_compressor" class="google-play-link" data-v-38046e6f>
                                        <div style="height: 24px; width: 105px" data-v-38046e6f>
                                            <svg viewBox="0 0 105 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" data-v-38046e6f>
                                                <title data-v-38046e6f>Google Play logo</title>
                                                <desc data-v-38046e6f>Video Compressor App - ShrinkVid</desc>
                                                <path d="M0.449659 0.378522C0.139006 0.743312 -0.0177921 1.21031 0.0112268 1.68431V22.3158C-0.0177921 22.7898 0.139006 23.2568 0.449659 23.6216L0.516377 23.6869L12.3255 12.14V11.8695L0.516377 0.313232L0.449659 0.378522Z" fill="url(#paint0_linear)" data-v-38046e6f></path>
                                                <path d="M16.2359 15.992L12.3281 12.1399V11.8695L16.2359 8.00806L16.3217 8.05469L21.0015 10.6569C22.3358 11.3938 22.3358 12.6063 21.0015 13.3525L16.3407 15.9454L16.2359 15.992Z" fill="url(#paint1_linear)" data-v-38046e6f></path>
                                                <path d="M16.3393 15.936L12.3172 12L0.441406 23.6215C1.00252 24.1042 1.83527 24.1277 2.42388 23.6775L16.3489 15.936" fill="url(#paint2_linear)" data-v-38046e6f></path>
                                                <path d="M16.3411 8.06398L2.41607 0.322505C1.82745 -0.127736 0.994708 -0.104229 0.433594 0.378468L12.3189 12L16.3411 8.06398Z" fill="url(#paint3_linear)" data-v-38046e6f></path>
                                                <path opacity="0.2" d="M16.225 15.8521L2.41435 23.5469C1.84919 23.9604 1.07328 23.9604 0.508124 23.5469L0.441406 23.6122L0.508124 23.6775C1.07222 24.0941 1.85025 24.0941 2.41435 23.6775L16.3393 15.936L16.225 15.8521Z" fill="black" data-v-38046e6f></path>
                                                <path opacity="0.12" fill-rule="evenodd" clip-rule="evenodd" d="M16.2336 15.8521L20.9992 13.2125C21.4916 12.9746 21.8437 12.5268 21.9523 12C21.9032 12.5824 21.5396 13.0946 20.9992 13.3431L16.3194 15.936L16.2336 15.8521ZM0.00915323 22.3667C0.0248916 22.7771 0.178789 23.1729 0.449659 23.4909L0.516377 23.5656L0.449659 23.6308C0.148111 23.2767 -0.00846846 22.8263 0.00915323 22.3667ZM0.00915323 22.3667C0.00968531 22.3528 0.0103762 22.3389 0.0112268 22.3251V22.1852C0.00751049 22.2459 0.00684169 22.3064 0.00915323 22.3667Z" fill="black" data-v-38046e6f></path>
                                                <path opacity="0.25" d="M2.42091 0.453767L20.9971 10.7882C21.4896 11.026 21.8416 11.4739 21.9502 12.0007C21.9011 11.4183 21.5376 10.906 20.9971 10.6576L2.42091 0.323188C1.08655 -0.413651 0 0.201936 0 1.69427V1.83417C0.0285934 0.332515 1.09608 -0.283072 2.42091 0.453767V0.453767Z" data-v-38046e6f></path>
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M55.0189 4.74409C53.9773 3.64005 53.9773 1.91386 55.0189 0.809813C55.5328 0.291502 56.232 0 56.9613 0C57.6907 0 58.3899 0.291502 58.9038 0.809813C59.9498 1.91208 59.9498 3.64182 58.9038 4.74409C57.8292 5.81406 56.0934 5.81406 55.0189 4.74409ZM35.7737 2.99342C35.804 3.64875 35.5647 4.28787 35.1115 4.76164C34.6051 5.28839 33.8988 5.57451 33.1691 5.54849C32.0499 5.53972 31.0449 4.85996 30.619 3.82352C30.193 2.78708 30.429 1.59594 31.2179 0.800838C31.7304 0.276851 32.4368 -0.0112005 33.1691 0.00514179C33.5424 0.00389647 33.9119 0.0791135 34.2551 0.226169C34.5746 0.355207 34.859 0.558201 35.085 0.81852L34.6171 1.2871C34.2598 0.861555 33.7235 0.629047 33.1691 0.659381C32.6119 0.656644 32.0775 0.881369 31.6894 1.28174C31.3012 1.68211 31.0927 2.22356 31.1119 2.78124C31.1001 3.62396 31.5957 4.39105 32.3682 4.72562C33.1408 5.06018 34.0384 4.8965 34.6436 4.31074C34.9153 4.01592 35.0719 3.63308 35.085 3.23213H33.1691V2.59557H35.7384C35.7619 2.72688 35.7738 2.86002 35.7737 2.99342ZM39.8201 0.78339H37.4362V2.46319H39.6082V3.09975H37.4362V4.77955H39.8201V5.43379H36.7299V0.12915H39.8201V0.78339ZM42.0335 5.43379H42.7134V0.78339H44.232V0.12915H40.5502V0.78339H42.0335V5.43379ZM46.8322 5.43372V0.129074H47.5121V5.43372H46.8322ZM49.846 5.43379H50.5259V0.78339H52.0003V0.12915H48.3627V0.78339H49.846V5.43379ZM58.3897 4.30201C57.5939 5.09556 56.3072 5.09556 55.5114 4.30201C54.7298 3.43928 54.7298 2.12342 55.5114 1.26068C56.3072 0.467141 57.5939 0.467141 58.3897 1.26068C59.1713 2.12342 59.1713 3.43928 58.3897 4.30201ZM60.6323 5.43379V0.12915H61.4622L64.0403 4.25793V0.12915H64.7202V5.43379H64.0138L61.3209 1.11051V5.43379H60.6323ZM36.063 15.9192V14.3278L41.4223 14.2836C41.4839 14.613 41.5135 14.9476 41.5106 15.2827C41.5522 16.6581 41.0583 17.9959 40.1333 19.0136C39.0762 20.122 37.592 20.7184 36.063 20.6492C33.9255 20.7325 31.9137 19.6381 30.8201 17.797C29.7266 15.956 29.7266 13.6634 30.8201 11.8223C31.9137 9.98126 33.9255 8.88683 36.063 8.97013C37.5646 8.95709 39.0075 9.55352 40.0626 10.6234L38.9413 11.7462C38.1677 10.9983 37.1294 10.5882 36.0542 10.6057C33.7136 10.6057 31.8162 12.5057 31.8162 14.8494C31.8162 17.1932 33.7136 19.0932 36.0542 19.0932C37.1548 19.1371 38.2227 18.7132 38.9943 17.9261C39.5063 17.376 39.8174 16.6688 39.8772 15.9192H36.063ZM42.1165 16.9252C42.1132 14.8554 43.7876 13.1745 45.8575 13.1696H45.8486C46.8505 13.1504 47.8173 13.5387 48.5275 14.2456C49.2378 14.9524 49.6306 15.9174 49.6161 16.9193C49.6161 18.989 47.939 20.6673 45.8692 20.6689C43.7994 20.6706 42.1197 18.9949 42.1165 16.9252ZM54.0758 13.1696C52.0072 13.1794 50.3372 14.8624 50.3437 16.931C50.3502 18.9996 52.0307 20.6722 54.0993 20.6689C56.168 20.6657 57.8432 18.9879 57.8433 16.9193C57.8578 15.9174 57.465 14.9524 56.7547 14.2456C56.0445 13.5387 55.0777 13.1504 54.0758 13.1696ZM54.266 19.2942C53.2835 19.363 52.3589 18.8238 51.9343 17.9347C51.5098 17.0455 51.6716 15.9871 52.3424 15.2655C53.0132 14.544 54.0567 14.3061 54.9737 14.6656C55.8907 15.0251 56.4948 15.9089 56.4972 16.8943C56.5275 17.5107 56.3076 18.1132 55.8875 18.5651C55.4674 19.017 54.8826 19.2799 54.266 19.2942ZM46.0753 19.2936C45.0923 19.3662 44.165 18.8297 43.7374 17.9411C43.3099 17.0525 43.4692 15.9927 44.139 15.2692C44.8089 14.5457 45.8529 14.3059 46.771 14.6646C47.6892 15.0232 48.2946 15.9074 48.2972 16.8936C48.3275 17.5101 48.1076 18.1126 47.6875 18.5644C47.2674 19.0163 46.6826 19.2793 46.066 19.2936H46.0753ZM76.0649 15.5655C75.5935 14.1767 74.3149 13.2235 72.8511 13.1696C71.8749 13.1676 70.9415 13.5704 70.2724 14.2822C69.6034 14.9941 69.2584 15.9514 69.3194 16.927C69.2977 17.9254 69.6824 18.8898 70.3851 19.5984C71.0878 20.3071 72.0481 20.6991 73.0453 20.6845C74.2998 20.6912 75.4739 20.0669 76.1708 19.0223L74.8906 18.1382C74.5019 18.7871 73.801 19.1834 73.0453 19.1815C72.2627 19.2114 71.5414 18.7591 71.2265 18.041L76.2503 15.9633L76.0649 15.5655ZM71.4692 15.3123C71.1005 15.7248 70.913 16.2685 70.9492 16.821L74.3043 15.4241C74.0403 14.9031 73.4914 14.59 72.9093 14.6284C72.357 14.6533 71.8379 14.8998 71.4692 15.3123ZM66.8633 20.4636H68.5143V9.41223H66.8633V20.4636ZM64.1003 14.0095H64.1621V13.3907H65.6807V20.0833C65.6807 22.8594 64.0827 23.9999 62.1491 23.9999C60.6916 24.0087 59.3747 23.1307 58.8205 21.7808L60.2596 21.1796C60.5605 21.9674 61.307 22.4949 62.1491 22.5146C63.3852 22.5146 64.1533 21.7455 64.1533 20.3044V19.7651H64.1003C63.6041 20.3382 62.88 20.6619 62.1226 20.6492C60.1185 20.5519 58.5435 18.8965 58.5435 16.8873C58.5435 14.8781 60.1185 13.2227 62.1226 13.1254C62.8775 13.1244 63.597 13.4461 64.1003 14.0095ZM62.2813 19.2081L62.2786 19.2079C62.8501 19.1842 63.3874 18.9282 63.7663 18.4989C64.1466 18.068 64.3342 17.5001 64.2855 16.9271C64.3291 16.3568 64.1409 15.793 63.7636 15.3636C63.3863 14.9341 62.8518 14.6754 62.2813 14.6461C61.1008 14.7503 60.1953 15.7404 60.1953 16.9271C60.1953 18.1129 61.0993 19.1024 62.2786 19.2079L62.2725 19.2081H62.2813ZM79.8546 9.41219H83.8013H83.8101C85.0927 9.31992 86.3193 9.95281 86.9887 11.0522C87.6581 12.1516 87.6581 13.5334 86.9887 14.6328C86.3193 15.7322 85.0927 16.3651 83.8101 16.2729H81.5057V20.4635H79.8546V9.41219ZM83.8053 14.7168H81.5009V10.9505H83.8406C84.8865 10.9505 85.7344 11.7996 85.7344 12.8469C85.7344 13.8943 84.8865 14.7433 83.8406 14.7433L83.8053 14.7168ZM91.0427 14.8141C91.5995 13.7152 92.7544 13.0519 93.9828 13.1254L94.0269 13.1519C95.9076 13.1519 97.3732 14.2748 97.3732 16.211V20.4635H95.7839V19.5794H95.731C95.2715 20.2944 94.4589 20.7012 93.612 20.6403C92.9247 20.6912 92.2461 20.4615 91.7306 20.0036C91.2151 19.5457 90.9064 18.8984 90.8749 18.209C90.8749 16.6088 92.473 15.7247 94.0534 15.7247C94.6535 15.7222 95.2448 15.8679 95.7751 16.1491V16.0341C95.733 15.6094 95.5223 15.2194 95.1902 14.9517C94.8582 14.6841 94.4327 14.5612 94.0093 14.6107C93.3922 14.5602 92.8036 14.8792 92.5083 15.4241L91.0427 14.8141ZM93.7812 19.1817C93.2427 19.1817 92.4922 18.9076 92.4922 18.2445C92.4922 17.3604 93.4281 17.0686 94.258 17.0686C94.7825 17.0557 95.3009 17.1839 95.759 17.44C95.6448 18.4296 94.82 19.1839 93.8254 19.2082L93.7812 19.1817ZM101.275 18.1826L103.164 13.3907H105.001L100.48 23.8144H98.7587L100.436 20.0923L97.4961 13.3907H99.2619L101.222 18.1826H101.275ZM88.3237 20.4635H89.9747V9.41216H88.3237V20.4635Z" data-v-38046e6f></path>
                                                <linearGradient id="paint0_linear" x1="7.15312" y1="-13.7044" x2="-11.701" y2="-8.5804" gradientUnits="userSpaceOnUse" data-v-38046e6f>
                                                    <stop stop-color="#00A0FF" data-v-38046e6f></stop>
                                                    <stop offset="0.01" stop-color="#00A1FF" data-v-38046e6f></stop>
                                                    <stop offset="0.26" stop-color="#00BEFF" data-v-38046e6f></stop>
                                                    <stop offset="0.51" stop-color="#00D2FF" data-v-38046e6f></stop>
                                                    <stop offset="0.76" stop-color="#00DFFF" data-v-38046e6f></stop>
                                                    <stop offset="1" stop-color="#00E3FF" data-v-38046e6f></stop>
                                                </linearGradient>
                                                <linearGradient id="paint1_linear" x1="22.7457" y1="2.48614" x2="-0.310157" y2="2.48614" gradientUnits="userSpaceOnUse" data-v-38046e6f>
                                                    <stop stop-color="#FFE000" data-v-38046e6f></stop>
                                                    <stop offset="0.41" stop-color="#FFBD00" data-v-38046e6f></stop>
                                                    <stop offset="0.78" stop-color="#FFA500" data-v-38046e6f></stop>
                                                    <stop offset="1" stop-color="#FF9C00" data-v-38046e6f></stop>
                                                </linearGradient>
                                                <linearGradient id="paint2_linear" x1="0.0924626" y1="5.96308" x2="-14.616" y2="31.2455" gradientUnits="userSpaceOnUse" data-v-38046e6f>
                                                    <stop stop-color="#FF3A44" data-v-38046e6f></stop>
                                                    <stop offset="1" stop-color="#C31162" data-v-38046e6f></stop>
                                                </linearGradient>
                                                <linearGradient id="paint3_linear" x1="-8.83065" y1="-2.83377" x2="-2.26551" y2="8.45598" gradientUnits="userSpaceOnUse" data-v-38046e6f>
                                                    <stop stop-color="#32A071" data-v-38046e6f></stop>
                                                    <stop offset="0.07" stop-color="#2DA771" data-v-38046e6f></stop>
                                                    <stop offset="0.48" stop-color="#15CF74" data-v-38046e6f></stop>
                                                    <stop offset="0.8" stop-color="#06E775" data-v-38046e6f></stop>
                                                    <stop offset="1" stop-color="#00F076" data-v-38046e6f></stop>
                                                </linearGradient>
                                            </svg>
                                        </div>
                                    </a>
                                    <a target="_blank" href="https://apps.apple.com/app/apple-store/id1560444951?pt=118041337&amp;ct=fc-inhouseads-vcapp&amp;mt=8" class="ios-link" data-v-38046e6f>
                                        <div style="height: 24px; width: 96px" data-v-38046e6f>
                                            <svg viewBox="0 0 96 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" data-v-38046e6f>
                                                <title data-v-38046e6f>Apple App Store logo</title>
                                                <desc data-v-38046e6f>Video Compressor App - ShrinkVid</desc>
                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M46.8949 0H47.7433V5.99731H46.8949V0ZM28.5993 1.06508C28.0801 0.514926 27.3424 0.227392 26.5892 0.281626H24.5316V5.9974H26.5892C28.286 5.9974 29.2696 4.94776 29.2696 3.12172C29.3645 2.37004 29.1186 1.61524 28.5993 1.06508ZM26.4893 5.18908H25.4153V1.08937H26.4893C27.0247 1.05955 27.5454 1.27138 27.9089 1.66692C28.2725 2.06246 28.4408 2.60031 28.3679 3.13337C28.4465 3.66866 28.2806 4.21098 27.9162 4.60977C27.5517 5.00856 27.0276 5.22136 26.4893 5.18908ZM30.2679 3.83872C30.1942 3.06556 30.5636 2.31732 31.2213 1.90779C31.8791 1.49827 32.7113 1.49827 33.369 1.90779C34.0267 2.31732 34.3962 3.06556 34.3225 3.83872C34.3976 4.6127 34.0285 5.3624 33.3702 5.77281C32.7119 6.18322 31.8785 6.18322 31.2202 5.77281C30.5619 5.3624 30.1928 4.6127 30.2679 3.83872ZM32.2982 2.35693C33.0328 2.35693 33.4514 2.90372 33.4514 3.83872C33.4514 4.77746 33.0328 5.32378 32.2982 5.32379C31.5607 5.32379 31.1459 4.78122 31.1459 3.83873C31.1459 2.90372 31.5607 2.35693 32.2982 2.35693ZM39.7148 5.99732H38.8347L37.9462 2.82045H37.8791L36.9944 5.99732H36.1226L34.9377 1.68385H35.7982L36.5683 4.97528H36.6317L37.5155 1.68385H38.3294L39.2132 4.97528H39.2804L40.0467 1.68385H40.8951L39.7148 5.99732ZM42.7074 1.68386H41.8907L41.8906 5.99732H42.739V3.47388C42.7086 3.18683 42.8046 2.90074 43.0019 2.69064C43.1992 2.48053 43.4781 2.36736 43.7655 2.38079C44.393 2.38079 44.6932 2.72552 44.6932 3.4187V5.99728H45.5416V3.20493C45.6038 2.78318 45.4714 2.35593 45.182 2.04383C44.8925 1.73173 44.4773 1.56863 44.0536 1.6006C43.5064 1.55597 42.9912 1.86458 42.7708 2.36909H42.7074V1.68386ZM49.873 1.90772C49.2153 2.31725 48.8457 3.06552 48.9194 3.83872C48.8444 4.61274 49.2136 5.36241 49.8719 5.7728C50.5302 6.18319 51.3636 6.18319 52.0219 5.7728C52.6803 5.36241 53.0495 4.61274 52.9745 3.83872C53.0481 3.06552 52.6786 2.31725 52.0208 1.90772C51.3631 1.49819 50.5308 1.49819 49.873 1.90772ZM52.103 3.83872C52.103 2.90372 51.6844 2.35693 50.9497 2.35693C50.2123 2.35693 49.7974 2.90372 49.7974 3.83873C49.7974 4.78122 50.2123 5.32379 50.9497 5.32379C51.6844 5.32378 52.103 4.77746 52.103 3.83872ZM55.4703 3.48976C54.4476 3.55338 53.8714 4.001 53.8714 4.77744C53.8729 5.1456 54.0295 5.49596 54.3025 5.74191C54.5755 5.98787 54.9395 6.10646 55.3044 6.06837C55.825 6.09252 56.3183 5.8338 56.5956 5.39112H56.6628V5.9973H57.4795V3.0501C57.4795 2.13894 56.8716 1.60059 55.7939 1.60059C54.8187 1.60059 54.1241 2.0758 54.0374 2.8167H54.8587C54.9529 2.51173 55.2811 2.33727 55.7547 2.33727C56.3346 2.33727 56.6348 2.59452 56.6348 3.0501V3.42241L55.4703 3.48976ZM56.6324 4.40888V4.04826L55.5826 4.11562C54.9906 4.15537 54.7221 4.35743 54.7221 4.7377C54.7221 5.12592 55.0577 5.35183 55.5193 5.35183C55.7925 5.37959 56.0652 5.29489 56.2751 5.11714C56.4849 4.93939 56.6138 4.6838 56.6324 4.40888ZM60.3746 1.6123C59.2885 1.6123 58.5902 2.47574 58.5902 3.83872C58.5902 5.20498 59.281 6.06844 60.3746 6.0684C60.9291 6.0889 61.4491 5.79902 61.7246 5.31581H61.7917V5.99731H62.6047V0H61.7563V2.36906H61.6929C61.4367 1.88181 60.9231 1.58694 60.3746 1.6123ZM59.4691 3.83872C59.4691 4.75361 59.8989 5.30414 60.6177 5.30414C61.3328 5.30414 61.7747 4.74567 61.7747 3.84247C61.7747 2.94347 61.3281 2.37704 60.6177 2.37704C59.9035 2.37704 59.4691 2.93131 59.4691 3.83872H59.4691ZM67.0723 1.90779C66.4146 2.31732 66.0451 3.06556 66.1189 3.83872C66.0437 4.6127 66.4129 5.3624 67.0712 5.77281C67.7295 6.18322 68.5628 6.18322 69.2211 5.77281C69.8794 5.3624 70.2486 4.6127 70.1735 3.83872C70.2472 3.06556 69.8777 2.31732 69.22 1.90779C68.5623 1.49827 67.73 1.49827 67.0723 1.90779ZM69.2985 3.83872C69.2985 2.90372 68.8799 2.35693 68.1452 2.35693C67.4078 2.35693 66.993 2.90372 66.993 3.83873C66.993 4.78122 67.4078 5.32379 68.1452 5.32379C68.8799 5.32378 69.2985 4.77746 69.2985 3.83872ZM72.1256 1.68385H71.3089V5.99731H72.1573V3.47387C72.1269 3.18681 72.2229 2.90073 72.4202 2.69062C72.6175 2.48052 72.8964 2.36734 73.1838 2.38077C73.8113 2.38077 74.1115 2.7255 74.1115 3.41868V5.99726H74.9599V3.20491C75.022 2.78316 74.8897 2.35592 74.6003 2.04382C74.3108 1.73171 73.8956 1.56862 73.4719 1.60058C72.9247 1.55595 72.4095 1.86457 72.189 2.36908H72.1256V1.68385ZM79.7509 0.609924V1.70349H80.6823V2.42053H79.7509V4.63854C79.7509 5.09037 79.9364 5.28822 80.3587 5.28822C80.4669 5.28787 80.5749 5.28131 80.6823 5.26857V5.97766C80.5299 6.00501 80.3755 6.01956 80.2208 6.02116C79.2773 6.02116 78.9015 5.68813 78.9015 4.85649V2.4205H78.2191V1.70345H78.9015V0.609924H79.7509ZM82.6858 0H81.8449L81.8449 5.9973H82.6933V3.47808C82.6671 3.18209 82.7724 2.88957 82.9811 2.67873C83.1898 2.46789 83.4806 2.36022 83.7757 2.38451C84.3752 2.38451 84.695 2.73344 84.695 3.42242V5.99732H85.5442V3.21242C85.6004 2.79283 85.4672 2.36996 85.1809 2.05899C84.8946 1.74802 84.485 1.58134 84.0637 1.60434C83.5082 1.5591 82.984 1.86811 82.753 2.37704H82.6858V0ZM90.4886 4.83267C90.2507 5.64631 89.4659 6.17201 88.6258 6.08058C88.0526 6.09576 87.5017 5.85736 87.1193 5.42861C86.7369 4.99987 86.5616 4.42414 86.64 3.85417C86.5637 3.28261 86.7383 2.70595 87.1186 2.27359C87.4988 1.84122 88.0474 1.5957 88.6221 1.60061C89.8182 1.60061 90.5398 2.42059 90.5398 3.7751V4.07214H87.5042V4.11985C87.4774 4.43993 87.5863 4.75653 87.8043 4.99179C88.0223 5.22705 88.329 5.35913 88.6491 5.35557C89.0642 5.40557 89.4682 5.19898 89.6719 4.83264L90.4886 4.83267ZM89.6757 3.44255H87.5043C87.5005 3.14511 87.6165 2.85871 87.8261 2.64833C88.0357 2.43794 88.3211 2.3214 88.6175 2.32513C88.91 2.31841 89.1917 2.43592 89.3932 2.64872C89.5947 2.86152 89.6973 3.14981 89.6757 3.44255ZM61.7682 19.7707C60.2075 19.7707 59.0654 18.9962 58.934 17.8165L57.1178 17.8165C57.2325 19.9681 59.0076 21.3292 61.6367 21.3292C64.4467 21.3292 66.2134 19.9353 66.2134 17.7098C66.2134 15.9699 65.2028 14.9895 62.7704 14.4123L61.4642 14.0905C59.9362 13.7117 59.3115 13.2168 59.3115 12.3758C59.3115 11.3206 60.2895 10.5956 61.7187 10.5956C63.148 10.5956 64.126 11.3122 64.2332 12.4993H66.0242C65.9664 10.4469 64.249 9.03709 61.7439 9.03709C59.2127 9.03709 57.4302 10.4469 57.4302 12.4993C57.4302 14.1569 58.4408 15.1785 60.6177 15.7061L62.1542 16.0775C63.6906 16.4563 64.3395 17.0092 64.3395 17.9325C64.3395 18.9961 63.2636 19.7707 61.7682 19.7707ZM30.8586 17.9157H26.3397L25.2545 21.1309H23.3405L27.6207 9.23544H29.6093L33.8895 21.1309H31.9429L30.8586 17.9157ZM26.8092 16.432H30.3911L28.6253 11.214H28.5759L26.8092 16.432ZM39.5271 21.2217C41.6966 21.2217 43.1342 19.4901 43.1342 16.795C43.1342 14.1074 41.6881 12.3674 39.4945 12.3674C38.3657 12.3309 37.3082 12.92 36.7423 13.9007H36.7097V12.4582H34.9923V24H36.7665V19.7043H36.8076C37.3494 20.6912 38.4057 21.2805 39.5271 21.2217ZM41.31 16.795C41.31 15.0391 40.4056 13.8848 39.0258 13.8848C37.6702 13.8848 36.7584 15.0634 36.7584 16.795C36.7584 18.5425 37.6702 19.7127 39.0258 19.7127C40.4056 19.7127 41.31 18.5668 41.31 16.795ZM49.0393 21.2217C51.2088 21.2217 52.6464 19.4901 52.6464 16.795C52.6464 14.1074 51.2004 12.3674 49.0066 12.3674C47.8778 12.3309 46.8204 12.92 46.2545 13.9007H46.2218V12.4582H44.5045V24H46.2787V19.7043H46.3198C46.8616 20.6912 47.9179 21.2805 49.0393 21.2217ZM50.822 16.795C50.822 15.0391 49.9176 13.8848 48.5378 13.8848C47.1823 13.8848 46.2705 15.0634 46.2705 16.795C46.2705 18.5425 47.1823 19.7127 48.5378 19.7127C49.9176 19.7127 50.822 18.5668 50.822 16.795ZM70.0402 10.4057V12.4582H71.6839V13.8679H70.0402V18.6491C70.0402 19.3919 70.3693 19.738 71.0918 19.738C71.287 19.7346 71.4818 19.7208 71.6755 19.6968V21.0981C71.3506 21.1591 71.0204 21.1866 70.69 21.1805C68.9401 21.1805 68.2576 20.521 68.2576 18.839V13.8679H67.0009V12.4582H68.2576V10.4057H70.0402ZM76.7374 12.3515C74.2397 12.3515 72.638 14.0663 72.638 16.795C72.638 19.5313 74.2238 21.2385 76.7374 21.2385C79.2518 21.2385 80.8376 19.5313 80.8376 16.795C80.8376 14.0662 79.2434 12.3515 76.7374 12.3515ZM79.0301 16.795C79.0301 14.9231 78.1752 13.8183 76.7375 13.8183C75.2999 13.8183 74.4459 14.9316 74.4459 16.795C74.4459 18.6744 75.2999 19.7708 76.7375 19.7708C78.1752 19.7708 79.0301 18.6744 79.0301 16.795ZM83.9927 12.4582H82.3005L82.3005 21.1309H84.0747V15.9868C84.0156 15.4663 84.1862 14.946 84.5416 14.5624C84.8971 14.1787 85.4019 13.9702 85.9235 13.9914C86.1932 13.9835 86.4625 14.0198 86.7206 14.099V12.4338C86.5211 12.389 86.3172 12.3667 86.1128 12.3674C85.1375 12.33 84.2697 12.9841 84.0337 13.9343H83.9927V12.4582ZM94.903 18.5836C94.6643 20.158 93.1362 21.2385 91.1812 21.2385C88.6668 21.2385 87.1061 19.5481 87.1061 16.8362C87.1061 14.1158 88.6752 12.3515 91.1066 12.3515C93.498 12.3515 95.0018 13.9998 95.0018 16.6294V17.2394H88.8971V17.3469C88.8401 17.9926 89.0623 18.6317 89.5071 19.1017C89.952 19.5717 90.5767 19.8273 91.2222 19.8035C92.0832 19.8844 92.8949 19.3884 93.2183 18.5836L94.903 18.5836ZM93.2244 15.9952H88.9031C88.9016 15.4096 89.1333 14.8478 89.5466 14.4344C89.96 14.0211 90.5207 13.7905 91.1043 13.794C91.6833 13.7815 92.2412 14.012 92.6436 14.4298C93.0461 14.8476 93.2566 15.415 93.2244 15.9952ZM11.5213 3.61511C12.2961 2.68189 12.6778 1.4824 12.5853 0.27136C11.4017 0.396101 10.3083 0.963728 9.52311 1.86114C8.74774 2.74656 8.35494 3.90492 8.43123 5.08109C9.63074 5.09349 10.7697 4.55317 11.5213 3.61511ZM14.1267 11.3645C14.1476 9.73941 14.9967 8.23832 16.3765 7.38714C15.5021 6.13408 14.09 5.36809 12.5662 5.32025C11.5856 5.21697 10.6233 5.60019 9.83685 5.91338C9.33759 6.1122 8.90919 6.2828 8.59197 6.2828C8.2311 6.2828 7.79041 6.10519 7.29662 5.90618C6.65094 5.64595 5.91448 5.34913 5.147 5.36498C3.36491 5.42275 1.7438 6.41476 0.876774 7.97807C-0.969583 11.1856 0.407633 15.8996 2.17629 18.4923C3.06118 19.7619 4.09537 21.1801 5.44859 21.1298C6.06245 21.1042 6.49802 20.9203 6.94792 20.7303C7.46854 20.5104 8.00834 20.2825 8.86578 20.2825C9.67427 20.2825 10.1909 20.5033 10.6868 20.7153C11.1621 20.9184 11.6183 21.1134 12.2941 21.0978C13.715 21.0746 14.6102 19.8226 15.4641 18.541C16.0999 17.6363 16.5891 16.6365 16.9137 15.5786C15.2261 14.8624 14.1287 13.2031 14.1267 11.3645Z" data-v-38046e6f></path>
                                            </svg>
                                        </div>
                                    </a>
                                </div>
                            </div>
                            <br data-v-ea80c756>
                            <div class="container container--theme" data-v-48a88b00 data-v-ea80c756>
                                <div class="ads-in-page" data-v-48a88b00>
                                    <div class="ad-in-page__container bottom" data-v-48a88b00>
                                        <div data-aaad="true" data-aa-adunit="/22404391699/FreeConvert_BottomLeaderboard" data-v-48a88b00></div>
                                    </div>
                                </div>
                            </div>
                            <br data-v-ea80c756>
                            <div id="HomeConversionGuide" data-v-ea80c756>
                                <div class="home-conversion-guide home-conversion-guide__wrapper">
                                    <section class="home-conversion-guide__instructions">
                                        <h2>How To Compress a Video?</h2>
                                        <ol>
                                            <li>
                                                <span class="n">Click the “Choose Video” button to select your video file</span>
                                                &nbsp;
                                            </li>
                                            <li>
                                                <span class="n">Keep the default options (they do a great job!) or specify advanced options</span>
                                                &nbsp;
                                            </li>
                                            <li>
                                                <span class="n">Click on the “Compress Video” button to start compression</span>
                                                &nbsp;
                                            </li>
                                            <li>
                                                <span class="n">When the status change to “Done” click the “Download Video” button</span>
                                                &nbsp;
                                            </li>
                                        </ol>
                                        <p>World's best video compressor to compress MP4, AVI, MKV, or any other video file. Choose the default options to compress video size by 40%, or choose a custom size.</p>
                                    </section>
                                    <div class="usp row"></div>
                                </div>
                            </div>
                            <br data-v-ea80c756>
                            <div class="row" data-v-ea80c756>
                                <div class="col-md-12" data-v-ea80c756>
                                    <div class="media__body" data-v-3665bc47 data-v-ea80c756>
                                        <div class="vertical-spacing" data-v-3665bc47>
                                            <p data-v-3665bc47>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-12" data-v-ea80c756>
                                    <div class="media__body" data-v-3665bc47 data-v-ea80c756>
                                        <div class="vertical-spacing" data-v-3665bc47>
                                            <p data-v-3665bc47>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-12" data-v-ea80c756>
                                    <div class="media__body" data-v-3665bc47 data-v-ea80c756>
                                        <div class="vertical-spacing" data-v-3665bc47>
                                            <p data-v-3665bc47>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                                <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!---->
                            <br data-v-ea80c756>
                            <div class="content-card" data-v-da39cb90 data-v-ea80c756>
                                <div class="content-card__wrapper" data-v-da39cb90>
                                    <h2 class="content-card__title" data-v-da39cb90>Your Data, Our Priority</h2>
                                    <p class="content-card__description" data-v-da39cb90>At FreeConvert, we go beyond just converting files—we protect them. Our robust security framework ensures that your data is always safe, whether you're converting an image, video, or document. With advanced encryption, secure data centers, and vigilant monitoring, we've covered every aspect of your data's safety.
        </p>
                                    <a href="/security-and-compliance" class="content-card__button outline" data-v-da39cb90>Learn more about our commitment to security
        </a>
                                </div>
                                <ul class="content-card__features" data-v-da39cb90>
                                    <li data-v-da39cb90>
                                        <img src="/vectors/encryption.svg" alt="SSL/TLS Encryption" data-v-da39cb90>
                                        <span data-v-da39cb90>
                                            SSL/TLS <br/>Encryption
                                        </span>
                                    </li>
                                    <li data-v-da39cb90>
                                        <img src="/vectors/data-center.svg" alt="Secured Data Centers" data-v-da39cb90>
                                        <span data-v-da39cb90>
                                            Secured Data <br/>Centers
                                        </span>
                                    </li>
                                    <li data-v-da39cb90>
                                        <img src="/vectors/access-control.svg" alt="Access Control and Authentication" data-v-da39cb90>
                                        <span data-v-da39cb90>
                                            Access Control and <br/>Authentication
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <br data-v-ea80c756>
                            <div class="media__body" data-v-3665bc47 data-v-ea80c756>
                                <div class="vertical-spacing" data-v-3665bc47>
                                    <p data-v-3665bc47>
                                        <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                        <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                        <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                        <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                        <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                        <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                        <span class="skeleton-line" style="width:100%;" data-v-3665bc47></span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="Footer" data-automation-id="FooterContainer" class="container-fluid min-width" data-v-235b9c48 data-v-9b2d368e>
                        <div id="FooterLinkLists" data-automation-id="FooterLinkListContainer" class="row" data-v-7627bcdf data-v-235b9c48>
                            <div class="footer-link-list col-md-2" data-v-7627bcdf>
                                <p class="footer-link-list__title" data-v-7627bcdf>Video Converter</p>
                                <ul class="footer-link-list__list" data-v-7627bcdf>
                                    <li data-v-7627bcdf>
                                        <a href="/mp4-converter" class="link" data-v-7627bcdf>MP4 Converter</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/convert/video-to-gif" class="link" data-v-7627bcdf>Video to GIF</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/mov-to-mp4" class="link" data-v-7627bcdf>MOV to MP4</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/video-converter" class="link" data-v-7627bcdf>Video Converter</a>
                                    </li>
                                </ul>
                            </div>
                            <div class="footer-link-list col-md-2" data-v-7627bcdf>
                                <p class="footer-link-list__title" data-v-7627bcdf>Audio Converter</p>
                                <ul class="footer-link-list__list" data-v-7627bcdf>
                                    <li data-v-7627bcdf>
                                        <a href="/mp3-converter" class="link" data-v-7627bcdf>MP3 Converter</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/mp4-to-mp3" class="link" data-v-7627bcdf>MP4 to MP3</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/convert/video-to-mp3" class="link" data-v-7627bcdf>Video to MP3</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/audio-converter" class="link" data-v-7627bcdf>Audio Converter</a>
                                    </li>
                                </ul>
                            </div>
                            <div class="footer-link-list col-md-2" data-v-7627bcdf>
                                <p class="footer-link-list__title" data-v-7627bcdf>Image Converter</p>
                                <ul class="footer-link-list__list" data-v-7627bcdf>
                                    <li data-v-7627bcdf>
                                        <a href="/jpg-to-pdf" class="link" data-v-7627bcdf>JPG to PDF</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/pdf-to-jpg" class="link" data-v-7627bcdf>PDF to JPG</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/heic-to-jpg" class="link" data-v-7627bcdf>HEIC to JPG</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/convert/image-to-pdf" class="link" data-v-7627bcdf>Image to PDF</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/image-converter" class="link" data-v-7627bcdf>Image Converter</a>
                                    </li>
                                </ul>
                            </div>
                            <div class="footer-link-list col-md-2" data-v-7627bcdf>
                                <p class="footer-link-list__title" data-v-7627bcdf>Document & Ebook</p>
                                <ul class="footer-link-list__list" data-v-7627bcdf>
                                    <li data-v-7627bcdf>
                                        <a href="/pdf-to-word" class="link" data-v-7627bcdf>PDF to WORD</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/epub-to-pdf" class="link" data-v-7627bcdf>EPUB to PDF</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/epub-to-mobi" class="link" data-v-7627bcdf>EPUB to MOBI</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/document-converter" class="link" data-v-7627bcdf>Document Converter</a>
                                    </li>
                                </ul>
                            </div>
                            <div class="footer-link-list col-md-2" data-v-7627bcdf>
                                <p class="footer-link-list__title" data-v-7627bcdf>Archive & Time</p>
                                <ul class="footer-link-list__list" data-v-7627bcdf>
                                    <li data-v-7627bcdf>
                                        <a href="/rar-to-zip" class="link" data-v-7627bcdf>RAR to Zip</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/time/pst-to-est" class="link" data-v-7627bcdf>PST to EST</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/time/cst-to-est" class="link" data-v-7627bcdf>CST to EST</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/archive-converter" class="link" data-v-7627bcdf>Archive Converter</a>
                                    </li>
                                </ul>
                            </div>
                            <div class="footer-link-list col-md-2" data-v-7627bcdf>
                                <p class="footer-link-list__title" data-v-7627bcdf>Unit Converter</p>
                                <ul class="footer-link-list__list" data-v-7627bcdf>
                                    <li data-v-7627bcdf>
                                        <a href="/unit/lbs-to-kg" class="link" data-v-7627bcdf>Lbs to Kg</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/unit/kg-to-lbs" class="link" data-v-7627bcdf>Kg to Lbs</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/unit/feet-to-meters" class="link" data-v-7627bcdf>Feet to Meters</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="/unit-converter" class="link" data-v-7627bcdf>Unit Converter</a>
                                    </li>
                                </ul>
                            </div>
                            <div class="footer-link-list col-md-2" data-v-7627bcdf>
                                <p class="footer-link-list__title" data-v-7627bcdf>Web Apps</p>
                                <ul class="footer-link-list__list" data-v-7627bcdf>
                                    <li data-v-7627bcdf>
                                        <a href="https://www.photojoiner.com/features/collage-maker" target="_blank" class="link" data-v-7627bcdf>Collage Maker</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="https://imageresizer.com/" target="_blank" class="link" data-v-7627bcdf>Image Resizer</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="https://imageresizer.com/crop-image" target="_blank" class="link" data-v-7627bcdf>Crop Image</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="https://imageresizer.com/color-picker" target="_blank" class="link" data-v-7627bcdf>Color Picker</a>
                                    </li>
                                </ul>
                            </div>
                            <div class="footer-link-list col-md-2" data-v-7627bcdf>
                                <p class="footer-link-list__title" data-v-7627bcdf>Mobile Apps</p>
                                <ul class="footer-link-list__list" data-v-7627bcdf>
                                    <li data-v-7627bcdf>
                                        <a href="https://play.google.com/store/apps/details?id=com.freeconvert.collagemaker" target="_blank" class="link" data-v-7627bcdf>Collage Maker Android</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="https://apps.apple.com/us/app/collage-maker-photojoiner/id1587802950" target="_blank" class="link" data-v-7627bcdf>Collage Maker iOS</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="https://play.google.com/store/apps/details?id=com.freeconvert.image_converter" target="_blank" class="link" data-v-7627bcdf>Image Converter Android</a>
                                    </li>
                                    <li data-v-7627bcdf>
                                        <a href="https://apps.apple.com/us/app/image-converter-pixconverter/id1570076731" target="_blank" class="link" data-v-7627bcdf>Image Converter iOS</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <ul class="footer-navigation__links navbar-nav" data-v-45e44cb6 data-v-235b9c48>
                            <li class="footer-navigation__links__item nav-item visible-in-web" data-v-45e44cb6>
                                <a href="/about" data-v-45e44cb6>About Us</a>
                            </li>
                            <li class="footer-navigation__links__item nav-item visible-in-web" data-v-45e44cb6>
                                <a href="/donate" data-v-45e44cb6>Donate</a>
                            </li>
                            <li class="footer-navigation__links__item nav-item visible-in-web footer-navigation__links__item--top" data-v-45e44cb6>
                                <a href="/privacy" data-v-45e44cb6>Privacy</a>
                            </li>
                            <li class="footer-navigation__links__item nav-item visible-in-web" data-v-45e44cb6>
                                <a href="/terms" data-v-45e44cb6>Terms</a>
                            </li>
                            <li class="footer-navigation__links__item nav-item visible-in-web" data-v-45e44cb6>
                                <a href="/security-and-compliance" data-v-45e44cb6>Security and Compliance</a>
                            </li>
                            <li class="footer-navigation__links__item nav-item visible-in-mobile" data-v-45e44cb6>
                                <a href="/about" data-v-45e44cb6>About Us</a>
                            </li>
                            <li class="footer-navigation__links__item nav-item visible-in-mobile" data-v-45e44cb6>
                                <a href="/donate" data-v-45e44cb6>Donate</a>
                            </li>
                            <li class="footer-navigation__links__item nav-item visible-in-mobile footer-navigation__links__item--top" data-v-45e44cb6>
                                <a href="/privacy" data-v-45e44cb6>Privacy</a>
                            </li>
                            <li class="footer-navigation__links__item nav-item visible-in-mobile" data-v-45e44cb6>
                                <a href="/terms" data-v-45e44cb6>Terms</a>
                            </li>
                            <li class="footer-navigation__links__item nav-item visible-in-mobile" data-v-45e44cb6>
                                <a href="/security-and-compliance" data-v-45e44cb6>Security and Compliance</a>
                            </li>
                            <li class="footer-navigation__links__item nav-item" data-v-45e44cb6>
                                <div class="footer-navigation__links__item--contact-status" data-v-45e44cb6>
                                    <a href="#" data-v-45e44cb6>Contact</a>
                                    <a href="https://status.freeconvert.com" target="_blank" data-v-45e44cb6>Status</a>
                                </div>
                            </li>
                        </ul>
                        <div id="FooterBottom" data-v-38edb786 data-v-235b9c48>
                            <div class="footer-bottom display-flex justify-content-between align-items-center" data-v-38edb786>
                                <a href="/" class="Logo nuxt-link-active" data-v-11580f7e data-v-38edb786>
                                    <img src="https://cdn.freeconvert.com/logo_light.svg" width="152" height="25" alt="Logo" loading="lazy" data-v-11580f7e>
                                </a>
                                <p class="footer-bottom__copyright text-center visible-in-web" data-v-38edb786>
                                    © FreeConvert.com <a href="/changelog" class="app-version" style="color: #89919D;text-decoration: underline;" target="_blank">v2.30</a>
                                    All rights reserved (2025)
                                </p>
                                <div class="drop language-selector__dropdown lang-selector" data-v-14ab5a00 data-v-69aa828c data-v-38edb786>
                                    <a href="#" class="drop__trigger" data-v-14ab5a00>
                                        <svg id="Icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" height="20" width="20" style="transform:scale(1);margin-right:5px;" data-v-69aa828c>
                                            <path fill="#89919D" d="M213.227,0C95.36,0,0,95.467,0,213.333s95.36,213.333,213.227,213.333s213.44-95.467,213.44-213.333S331.093,0,213.227,0z
   M213.333,43.413c17.813,25.6,31.68,54.08,40.747,84.587h-81.493C181.653,97.493,195.52,69.013,213.333,43.413z M48.213,256
  c-3.52-13.653-5.547-27.947-5.547-42.667s2.027-29.013,5.547-42.667h72c-1.707,13.973-2.88,28.16-2.88,42.667
  s1.173,28.693,2.987,42.667H48.213z M65.6,298.667h62.933c6.933,26.667,16.64,52.267,29.44,76.053
  C118.72,361.28,86.08,333.973,65.6,298.667z M128.533,128H65.6c20.48-35.307,53.12-62.613,92.373-76.053
  C145.173,75.733,135.467,101.333,128.533,128z M213.333,383.253c-17.707-25.6-31.573-54.08-40.747-84.587h81.493
  C244.907,329.173,231.04,357.653,213.333,383.253z M263.253,256h-99.84c-2.027-13.973-3.413-28.16-3.413-42.667
  s1.387-28.693,3.413-42.667h99.84c2.027,13.973,3.413,28.16,3.413,42.667S265.28,242.027,263.253,256z M360.96,128h-62.933
  c-6.933-26.667-16.64-52.267-29.44-75.947C307.84,65.493,340.48,92.693,360.96,128z M268.693,374.613L268.693,374.613
  c12.8-23.787,22.507-49.28,29.44-75.947h62.933C340.48,333.973,307.84,361.173,268.693,374.613z M306.347,256
  c1.707-13.973,2.987-28.16,2.987-42.667s-1.173-28.693-2.987-42.667h72c3.52,13.653,5.653,27.947,5.653,42.667
  s-2.027,29.013-5.653,42.667H306.347z" style="transform:scale(0.045);"></path>
                                        </svg>
                                        <span class="drop__trigger__text" data-v-14ab5a00>English</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="drop__icon feather feather-chevron-up" data-v-14ab5a00 data-v-14ab5a00>
                                            <polyline points="18 15 12 9 6 15" data-v-14ab5a00 data-v-14ab5a00></polyline>
                                        </svg>
                                    </a>
                                    <div class="drop__content-wrapper drop-pos-top" data-v-14ab5a00>
                                        <div class="drop__content drop-pos-top" data-v-14ab5a00>
                                            <ul class="language-list scrollbar-theme" data-v-14ab5a00 data-v-69aa828c>
                                                <li data-v-14ab5a00 data-v-69aa828c>
                                                    <a href="#" class="dropdown-selected" data-v-14ab5a00 data-v-69aa828c>English
      </a>
                                                </li>
                                                <li data-v-14ab5a00 data-v-69aa828c>
                                                    <a href="#" data-v-14ab5a00 data-v-69aa828c>Deutsch
      </a>
                                                </li>
                                                <li data-v-14ab5a00 data-v-69aa828c>
                                                    <a href="#" data-v-14ab5a00 data-v-69aa828c>Español
      </a>
                                                </li>
                                                <li data-v-14ab5a00 data-v-69aa828c>
                                                    <a href="#" data-v-14ab5a00 data-v-69aa828c>Français
      </a>
                                                </li>
                                                <li data-v-14ab5a00 data-v-69aa828c>
                                                    <a href="#" data-v-14ab5a00 data-v-69aa828c>Português
      </a>
                                                </li>
                                                <li data-v-14ab5a00 data-v-69aa828c>
                                                    <a href="#" data-v-14ab5a00 data-v-69aa828c>Italiano
      </a>
                                                </li>
                                                <li data-v-14ab5a00 data-v-69aa828c>
                                                    <a href="#" data-v-14ab5a00 data-v-69aa828c>Dutch
      </a>
                                                </li>
                                                <li data-v-14ab5a00 data-v-69aa828c>
                                                    <a href="#" data-v-14ab5a00 data-v-69aa828c>日本語
      </a>
                                                </li>
                                                <li data-v-14ab5a00 data-v-69aa828c>
                                                    <a href="#" data-v-14ab5a00 data-v-69aa828c>简体中文
      </a>
                                                </li>
                                                <li data-v-14ab5a00 data-v-69aa828c>
                                                    <a href="#" data-v-14ab5a00 data-v-69aa828c>한국어
      </a>
                                                </li>
                                                <li data-v-14ab5a00 data-v-69aa828c>
                                                    <a href="#" data-v-14ab5a00 data-v-69aa828c>Svenska
      </a>
                                                </li>
                                                <li data-v-14ab5a00 data-v-69aa828c>
                                                    <a href="#" data-v-14ab5a00 data-v-69aa828c>Türkçe
      </a>
                                                </li>
                                                <li data-v-14ab5a00 data-v-69aa828c>
                                                    <a href="#" data-v-14ab5a00 data-v-69aa828c>Bahasa Indonesia
      </a>
                                                </li>
                                                <li data-v-14ab5a00 data-v-69aa828c>
                                                    <a href="#" data-v-14ab5a00 data-v-69aa828c>Polish
      </a>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="footer-bottom footer-bottom--bottom justify-content-between align-items-center" data-v-38edb786>
                                <p class="footer-bottom__copyright text-center" data-v-38edb786>
                                    © FreeConvert.com <a href="/changelog" class="app-version" style="color: #89919D;text-decoration: underline;" target="_blank">v2.30</a>
                                    All rights reserved (2025)
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="toast__container" data-v-58466f79 data-v-9b2d368e></div>
                    <div id="ZohodeskWidgetPlaceholder" class="zohodesk-widget-circle" data-v-9b2d368e>
                        <svg fill="currentColor" width="25px" height="25px" viewBox="0 0 30 30">
                            <path d="M15 2.25c-7.027 0-12.75 5.52-12.75 12.307.01 2.98 1.124 5.85 3.128 8.056a4.868 4.868 0 0 1-1.98 3.697.75.75 0 0 0-.106 1.182.75.75 0 0 0 .405.19c.421.048.845.07 1.268.068a11.88 11.88 0 0 0 6-1.5c1.305.426 2.67.643 4.043.645 7.027 0 12.75-5.52 12.75-12.307C27.758 7.8 22.027 2.25 15 2.25Zm0 23.115a11.616 11.616 0 0 1-3.893-.675.75.75 0 0 0-.66.082A9.945 9.945 0 0 1 5.64 26.25a7.043 7.043 0 0 0 1.245-3.75.75.75 0 0 0-.195-.675 10.5 10.5 0 0 1-2.94-7.268C3.75 8.595 8.797 3.75 15 3.75s11.25 4.845 11.25 10.807c0 5.963-5.047 10.808-11.25 10.808Z"></path>
                            <path d="M15 16.545a1.545 1.545 0 1 0 0-3.09 1.545 1.545 0 0 0 0 3.09ZM20.25 16.545a1.545 1.545 0 1 0 0-3.09 1.545 1.545 0 0 0 0 3.09ZM9.75 16.545a1.545 1.545 0 1 0 0-3.09 1.545 1.545 0 0 0 0 3.09Z"></path>
                        </svg>
                    </div>
                    <button data-birdeatsbug="trigger" id="beb-trigger" class="button primary beb-trigger" style="display:none;" data-v-2ac8b930 data-v-9b2d368e>
                        Report a Bug
    
                        <svg xmlns="http://www.w3.org/2000/svg" width="1.3em" height="1.3em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="beb-trigger__loader spins feather feather-loader" data-v-2ac8b930 data-v-2ac8b930>
                            <line x1="12" y1="2" x2="12" y2="6" data-v-2ac8b930 data-v-2ac8b930></line>
                            <line x1="12" y1="18" x2="12" y2="22" data-v-2ac8b930 data-v-2ac8b930></line>
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" data-v-2ac8b930 data-v-2ac8b930></line>
                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" data-v-2ac8b930 data-v-2ac8b930></line>
                            <line x1="2" y1="12" x2="6" y2="12" data-v-2ac8b930 data-v-2ac8b930></line>
                            <line x1="18" y1="12" x2="22" y2="12" data-v-2ac8b930 data-v-2ac8b930></line>
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" data-v-2ac8b930 data-v-2ac8b930></line>
                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" data-v-2ac8b930 data-v-2ac8b930></line>
                        </svg>
                        <svg fill="none" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" class="beb-trigger__icon" data-v-2ac8b930>
                            <path d="M19.3367 10.0014L14.67 15.2934L14.67 4.70935L19.3367 10.0014Z" fill="currentColor" data-v-2ac8b930></path>
                            <path d="M8.66998 18C11.0594 18 13.2041 16.9525 14.67 15.2916V4.70835C13.2041 3.04751 11.0594 2 8.66998 2C4.2517 2 0.669983 5.58172 0.669983 10C0.669983 14.4183 4.2517 18 8.66998 18ZM8.67001 11.6C9.55366 11.6 10.27 10.8837 10.27 10C10.27 9.11637 9.55366 8.40002 8.67001 8.40002C7.78635 8.40002 7.07001 9.11637 7.07001 10C7.07001 10.8837 7.78635 11.6 8.67001 11.6Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" opacity="0.75" data-v-2ac8b930></path>
                        </svg>
                    </button>
                    <div class="app-popup visible-in-mobile" style="display:none;" data-v-41ff9b9d data-v-9b2d368e>
                        <div class="popup-content" data-v-41ff9b9d>
                            <a class="close-btn" data-v-41ff9b9d>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x" data-v-41ff9b9d data-v-41ff9b9d>
                                    <line x1="18" y1="6" x2="6" y2="18" data-v-41ff9b9d data-v-41ff9b9d></line>
                                    <line x1="6" y1="6" x2="18" y2="18" data-v-41ff9b9d data-v-41ff9b9d></line>
                                </svg>
                            </a>
                            <div class="hero" data-v-41ff9b9d>
                                <img src="https://cdn.freeconvert.com/video_compressor_app_icon.png" alt="ShrinkVid Video Compressor" loading="lazy" data-v-41ff9b9d>
                                <div data-v-41ff9b9d>
                                    <p style="font-size: 16px; font-weight: bold; color: black" data-v-41ff9b9d>ShrinkVid Video Compressor
        </p>
                                    <p data-v-41ff9b9d>By FreeConvert.com</p>
                                    <div class="stars" data-v-41ff9b9d>
                                        <img src="https://cdn.freeconvert.com/star.svg" loading="lazy" alt="star" data-v-41ff9b9d>
                                        <img src="https://cdn.freeconvert.com/star.svg" loading="lazy" alt="star" data-v-41ff9b9d>
                                        <img src="https://cdn.freeconvert.com/star.svg" loading="lazy" alt="star" data-v-41ff9b9d>
                                        <img src="https://cdn.freeconvert.com/star.svg" loading="lazy" alt="star" data-v-41ff9b9d>
                                        <img src="https://cdn.freeconvert.com/star.svg" loading="lazy" alt="star" data-v-41ff9b9d>
                                    </div>
                                </div>
                            </div>
                            <div class="popup-bottom" data-v-41ff9b9d>
                            <!---->
                            </div>
                            <div class="text-right" data-v-41ff9b9d>
                                <a href="https://play.google.com/store/apps/details?id=com.freeconvert.video_compressor" class="confirm" data-v-41ff9b9d>YES, INSTALL
      </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <script>
            window.__NUXT__ = (function(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z, _, $, aa, ab, ac, ad, ae, af, ag, ah, ai, aj, ak, al, am, an, ao, ap, aq, ar, as, at, au, av, aw, ax, ay, az, aA, aB, aC, aD, aE, aF, aG, aH, aI, aJ, aK, aL, aM, aN, aO, aP, aQ, aR, aS, aT, aU, aV, aW, aX, aY, aZ, a_, a$, ba, bb, bc, bd, be, bf, bg, bh, bi, bj, bk, bl, bm, bn, bo, bp, bq, br, bs, bt, bu, bv, bw, bx, by, bz, bA, bB, bC, bD, bE, bF, bG, bH, bI, bJ, bK, bL, bM, bN, bO, bP, bQ, bR, bS, bT, bU, bV, bW, bX, bY, bZ, b_, b$, ca, cb, cc, cd, ce, cf, cg, ch, ci, cj, ck, cl, cm, cn, co, cp, cq, cr, cs, ct, cu, cv, cw, cx, cy, cz, cA, cB, cC, cD, cE, cF, cG, cH, cI, cJ, cK, cL, cM, cN, cO, cP, cQ, cR, cS, cT, cU, cV, cW, cX, cY, cZ, c_, c$, da, db, dc, dd, de, df, dg, dh, di, dj, dk, dl, dm, dn, do0, dp, dq, dr, ds, dt, du, dv, dw, dx, dy, dz, dA, dB, dC, dD, dE, dF, dG, dH, dI, dJ, dK, dL, dM, dN, dO, dP, dQ, dR, dS, dT, dU, dV, dW, dX, dY, dZ, d_, d$, ea, eb, ec, ed, ee, ef, eg, eh, ei, ej, ek, el, em, en, eo, ep, eq, er, es, et, eu, ev, ew, ex, ey, ez, eA, eB, eC, eD, eE, eF, eG, eH, eI, eJ, eK, eL, eM, eN, eO, eP, eQ, eR, eS, eT, eU, eV, eW, eX, eY, eZ, e_, e$, fa, fb, fc, fd, fe, ff, fg, fh, fi, fj, fk, fl, fm, fn, fo, fp, fq, fr, fs, ft, fu, fv, fw, fx, fy, fz, fA, fB, fC, fD, fE, fF, fG, fH, fI, fJ, fK, fL, fM, fN, fO, fP, fQ, fR, fS, fT, fU, fV, fW, fX, fY, fZ, f_, f$, ga, gb, gc, gd, ge, gf, gg, gh, gi, gj, gk, gl, gm, gn, go, gp, gq, gr, gs, gt, gu, gv, gw, gx, gy, gz, gA, gB, gC, gD, gE, gF, gG, gH, gI, gJ, gK, gL, gM, gN, gO, gP, gQ, gR, gS, gT, gU, gV, gW, gX, gY, gZ, g_, g$, ha, hb, hc, hd, he, hf, hg, hh, hi, hj, hk, hl, hm, hn, ho, hp, hq, hr, hs, ht, hu, hv, hw, hx, hy, hz, hA, hB, hC, hD, hE, hF, hG, hH, hI, hJ, hK, hL, hM, hN, hO, hP, hQ, hR, hS, hT, hU, hV, hW, hX, hY, hZ, h_, h$, ia, ib, ic, id, ie, if0) {
                dj.content = "\u003Ch2\u003EWhich Encoder Is Best for Compressing Video?\u003C\u002Fh2\u003E\n\u003Cp\u003EWe use two popular video encoding methods that are supported by most modern devices and browsers: \u003Ca href=\"https:\u002F\u002Fen.wikipedia.org\u002Fwiki\u002FAdvanced_Video_Coding\" target=\"_blank\"\u003EH.264\u003C\u002Fa\u003E and \u003Ca href=\"https:\u002F\u002Fen.wikipedia.org\u002Fwiki\u002FHigh_Efficiency_Video_Coding\" target=\"_blank\"\u003EH.265\u003C\u002Fa\u003E. Out of these two encoding methods, H.265 yields better compression, especially at higher resolutions such as 1080p or 4k.\u003C\u002Fp\u003E\n\n\u003Ch2\u003EHow to play compressed video?\u003C\u002Fh2\u003E\n\u003Cp\u003ECodecs we use for compression are supported by all major browsers and devices. So you should not have any playback issues. If any issues, try opening the video with the free \u003Ca href=\"https:\u002F\u002Fwww.videolan.org\u002Fvlc\u002Findex.html\" target=\"_blank\"\u003EVLC player\u003C\u002Fa\u003E (Windows, Mac, Linux, and Mobile versions available). Allowed file types are: m2ts, mp4, mp4, mts, mpeg, swf, mod, mp4, mp4, mov, m4v, qt, rm, mpg, 3gpp, flv, divx, vob, dvr-ms, wmv, mp4, rmvb, asf, mkv, 3g2, ts, mpv, wtv, webm, xvid, mp4, 3gp, mp4, mxf, avi, m1v, f4p, mp4, f4v, ogv\u003C\u002Fp\u003E\n\n";
                dk.content = "\u003Ch2\u003EAdvanced Methods of Video Compression\u003C\u002Fh2\u003E\n\u003Cp\u003EThere are two main methods to compress a video. You can either optimize the bitrate or resize the video to a smaller size. We provide 4 settings related to both methods. Here’s an explanation:\u003C\u002Fp\u003E\n\u003Ch3\u003E1. By Video Quality\u003C\u002Fh3\u003E\n\u003Cp\u003E\u003Cb\u003ECRF (Constant Rate Factor):\u003C\u002Fb\u003E CRF method attempts to keep a constant perceived video quality. To do that, it uses different compression levels on different frames. For the H264 encoder, possible CRF values range from 0 to 51. Higher values mean more compression (reduced file size), lower values mean better quality (but bigger file size). The default is set at 23.\u003C\u002Fp\u003E\n\u003Cp\u003E\u003Cb\u003EPreset:\u003C\u002Fb\u003E Presets refers to the video compression speed. Choosing a slower preset allows better optimization (lower bitrate\u002Ffile size) for a given video quality level. If you prefer a lower file size over encoding time, choose a slower preset.\u003C\u002Fp\u003E\n\u003Ch3\u003E2. As a Percentage of the Original Size (Default)\u003C\u002Fh3\u003E\n\u003Cp\u003EThis method allows you to set a target file size for your video as a percentage of the original size. For example, if you set it to 60% for a 1Gb file, we will attempt to make your compressed file size 600Mb or less.&nbsp;\u003C\u002Fp\u003E\n\u003Cp\u003EThe pros of this method are, you can achieve a certain target size. The downside is you don’t know how the target size will affect video quality. To overcome this, start with a decent size (as a percentage of original), then test for video quality. Increase the target size if you need better quality. \u003Cb\u003EThis is the default video compression method used.\u003C\u002Fb\u003E\u003C\u002Fp\u003E\n\u003Ch3\u003E3. Set Max Bitrate\u003C\u002Fh3\u003E\n\u003Cp\u003EThis method allows you to set the max bitrate for given video quality. The quality is set by CRF (constant rate factor). Select this method if you are using the video in a streaming application where you want to control the streaming bandwidth rate. To choose this option, select \u003Cb\u003E\"By Max Bitrate\"\u003C\u002Fb\u003E from the \"Video Compress\" dropdown. For more info: read \u003Ca href=\"https:\u002F\u002Fslhck.info\u002Fvideo\u002F2017\u002F03\u002F01\u002Frate-control.html\" target=\"_blank\"\u003Evideo bitrate control\u003C\u002Fa\u003E.\u003C\u002Fp\u003E\n\u003Ch3\u003E4: Make Video Size Smaller (Re-Size)\u003C\u002Fh3\u003E\n\u003Cp\u003EChoosing a smaller video resolution (dimensions) can also save file size. For example, if you have a 4K (4320p) video but your target device is 1080p, you can downsize the video to fit 1080p and save file size. To choose this option, choose \u003Cb\u003E\"Re-size video\"&nbsp;\u003C\u002Fb\u003Efrom \"Advanced Settings\" above.\u003C\u002Fp\u003E";
                dl.content = "\u003Ch3\u003EOther compressors by FreeConvert.com\u003C\u002Fh3\u003E\n\u003Col\u003E\n\u003Cli\u003E\u003Ca href=\"https:\u002F\u002Fwww.freeconvert.com\u002Fcompress-png\" target=\"_blank\"\u003ECompress PNG\u003C\u002Fa\u003E\u003C\u002Fli\u003E\n\u003Cli\u003E\u003Ca href=\"https:\u002F\u002Fwww.freeconvert.com\u002Fcompress-jpeg\" target=\"_blank\"\u003ECompress JPEG\u003C\u002Fa\u003E\u003C\u002Fli\u003E\n\u003Cli\u003E\u003Ca href=\"https:\u002F\u002Fwww.freeconvert.com\u002Fgif-compressor\" target=\"_blank\"\u003EGIF Compressor\u003C\u002Fa\u003E\u003C\u002Fli\u003E\n\u003Cli\u003E\u003Ca href=\"https:\u002F\u002Fwww.freeconvert.com\u002Fcompress-pdf\" target=\"_blank\"\u003EPDF Compressor\u003C\u002Fa\u003E\u003C\u002Fli\u003E\n\u003Cli\u003E\u003Ca href=\"https:\u002F\u002Fwww.freeconvert.com\u002Fimage-compressor\" target=\"_blank\"\u003EImage Compressor\u003C\u002Fa\u003E\u003C\u002Fli\u003E\n\u003C\u002Fol\u003E";
                dp[0] = {
                    name: "Video Quality & Size",
                    group_id: "5e1a9e3ace1ab6049c70b91d",
                    order: ae,
                    options: [{
                        id: L,
                        name: bL,
                        label: "Video Codec",
                        metas: [{
                            target: [dq, aw, ax, ap, dr, bB],
                            value: bM,
                            label: "H264",
                            is_default: h,
                            _id: ak,
                            remoteId: bj,
                            optionMetaId: ak,
                            code: c,
                            isLocked: a,
                            __v: b
                        }, {
                            target: [dr, bB, dq, aw, ax, ap],
                            value: bN,
                            label: "H.264 - GPU",
                            is_default: a,
                            _id: bC,
                            remoteId: bj,
                            optionMetaId: bC,
                            code: c,
                            isLocked: a,
                            __v: b
                        }, {
                            target: [aw, ax, ap, bB],
                            value: bO,
                            label: "H265",
                            is_default: a,
                            _id: bk,
                            remoteId: bj,
                            optionMetaId: bk,
                            code: c,
                            isLocked: a,
                            __v: b
                        }, {
                            target: [aw, ap, ax, bB],
                            value: bP,
                            label: "H.265 - GPU",
                            is_default: a,
                            _id: bD,
                            remoteId: bj,
                            optionMetaId: bD,
                            code: c,
                            isLocked: a,
                            __v: b
                        }, {
                            target: [aw, ap, "603f2c1dae88b11070f7258e"],
                            value: bQ,
                            label: "AV1 - GPU",
                            is_default: a,
                            _id: bE,
                            remoteId: bj,
                            optionMetaId: bE,
                            code: c,
                            isLocked: a,
                            __v: b
                        }],
                        conditions: [],
                        parent_values: k,
                        helper_text: "H265 codec can reduce video size 20-75% more compared to H264 (especially high-resolution video)",
                        only_multifile: a,
                        class_name: i,
                        hidden: a,
                        order: 2,
                        type: n,
                        input_type: al,
                        validation_regex: "\u002F^(libx265|libx264|h264_nvenc|hevc_nvenc|av1_nvenc)$\u002F",
                        validation_error_message: o,
                        customVariables: {}
                    }, {
                        id: bR,
                        name: bS,
                        label: "Compression Method",
                        metas: [{
                            target: [],
                            value: bT,
                            label: "Target a file size (Percentage)",
                            is_default: h,
                            _id: ay,
                            remoteId: bl,
                            optionMetaId: ay,
                            code: c,
                            isLocked: a,
                            __v: b
                        }, {
                            target: [],
                            value: bU,
                            label: "Target a file size (MB)",
                            is_default: a,
                            _id: bV,
                            remoteId: bl,
                            optionMetaId: bV,
                            code: c,
                            isLocked: a,
                            __v: b
                        }, {
                            target: [],
                            value: bW,
                            label: "Target a video quality",
                            is_default: a,
                            _id: M,
                            remoteId: bl,
                            optionMetaId: M,
                            code: c,
                            isLocked: a,
                            __v: b
                        }, {
                            target: [],
                            value: bX,
                            label: "Target a video resolution",
                            is_default: a,
                            _id: az,
                            remoteId: bl,
                            optionMetaId: az,
                            code: c,
                            isLocked: a,
                            __v: b
                        }, {
                            target: [],
                            value: bY,
                            label: "Target a max bitrate",
                            is_default: a,
                            _id: af,
                            remoteId: bl,
                            optionMetaId: af,
                            code: c,
                            isLocked: a,
                            __v: b
                        }],
                        conditions: [],
                        parent_values: k,
                        helper_text: "Choose \"Target a file size\" to get an exact output file size. Choose \"Target a video quality\" when quality is of importance.",
                        class_name: i,
                        hidden: a,
                        order: ae,
                        type: n,
                        input_type: al,
                        validation_regex: "\u002F^(by_video_quality|by_max_bitrate|by_percentage|by_resolution|by_size)$\u002F",
                        validation_error_message: o,
                        customVariables: {},
                        children: [{
                            id: "67e0d81912a92abd4b4fbe73",
                            name: bZ,
                            label: bm,
                            metas: [{
                                target: [],
                                value: l,
                                label: ds,
                                is_default: a,
                                _id: dt,
                                remoteId: e,
                                optionMetaId: dt,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: p,
                                label: p,
                                is_default: a,
                                _id: du,
                                remoteId: e,
                                optionMetaId: du,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: E,
                                label: E,
                                is_default: a,
                                _id: dv,
                                remoteId: e,
                                optionMetaId: dv,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: I,
                                label: "21 Good Quality - Medium Size",
                                is_default: h,
                                _id: bn,
                                remoteId: e,
                                optionMetaId: bn,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: q,
                                label: q,
                                is_default: a,
                                _id: dw,
                                remoteId: e,
                                optionMetaId: dw,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: r,
                                label: r,
                                is_default: a,
                                _id: dx,
                                remoteId: e,
                                optionMetaId: dx,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: s,
                                label: s,
                                is_default: a,
                                _id: dy,
                                remoteId: e,
                                optionMetaId: dy,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: t,
                                label: t,
                                is_default: a,
                                _id: dz,
                                remoteId: e,
                                optionMetaId: dz,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: u,
                                label: u,
                                is_default: a,
                                _id: dA,
                                remoteId: e,
                                optionMetaId: dA,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: v,
                                label: v,
                                is_default: a,
                                _id: dB,
                                remoteId: e,
                                optionMetaId: dB,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ag,
                                label: "28 Okay Quality - Small Size",
                                is_default: a,
                                _id: dC,
                                remoteId: e,
                                optionMetaId: dC,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: w,
                                label: w,
                                is_default: a,
                                _id: dD,
                                remoteId: e,
                                optionMetaId: dD,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: x,
                                label: x,
                                is_default: a,
                                _id: dE,
                                remoteId: e,
                                optionMetaId: dE,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: y,
                                label: y,
                                is_default: a,
                                _id: dF,
                                remoteId: e,
                                optionMetaId: dF,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: z,
                                label: z,
                                is_default: a,
                                _id: dG,
                                remoteId: e,
                                optionMetaId: dG,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: F,
                                label: F,
                                is_default: a,
                                _id: dH,
                                remoteId: e,
                                optionMetaId: dH,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: A,
                                label: A,
                                is_default: a,
                                _id: dI,
                                remoteId: e,
                                optionMetaId: dI,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: B,
                                label: B,
                                is_default: a,
                                _id: dJ,
                                remoteId: e,
                                optionMetaId: dJ,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: G,
                                label: G,
                                is_default: a,
                                _id: dK,
                                remoteId: e,
                                optionMetaId: dK,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: C,
                                label: C,
                                is_default: a,
                                _id: dL,
                                remoteId: e,
                                optionMetaId: dL,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: D,
                                label: D,
                                is_default: a,
                                _id: dM,
                                remoteId: e,
                                optionMetaId: dM,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: N,
                                label: N,
                                is_default: a,
                                _id: dN,
                                remoteId: e,
                                optionMetaId: dN,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: O,
                                label: O,
                                is_default: a,
                                _id: dO,
                                remoteId: e,
                                optionMetaId: dO,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: P,
                                label: P,
                                is_default: a,
                                _id: dP,
                                remoteId: e,
                                optionMetaId: dP,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: Q,
                                label: Q,
                                is_default: a,
                                _id: dQ,
                                remoteId: e,
                                optionMetaId: dQ,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: R,
                                label: R,
                                is_default: a,
                                _id: dR,
                                remoteId: e,
                                optionMetaId: dR,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: S,
                                label: S,
                                is_default: a,
                                _id: dS,
                                remoteId: e,
                                optionMetaId: dS,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: T,
                                label: T,
                                is_default: a,
                                _id: dT,
                                remoteId: e,
                                optionMetaId: dT,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: U,
                                label: U,
                                is_default: a,
                                _id: dU,
                                remoteId: e,
                                optionMetaId: dU,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: V,
                                label: V,
                                is_default: a,
                                _id: dV,
                                remoteId: e,
                                optionMetaId: dV,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: W,
                                label: W,
                                is_default: a,
                                _id: dW,
                                remoteId: e,
                                optionMetaId: dW,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: X,
                                label: X,
                                is_default: a,
                                _id: dX,
                                remoteId: e,
                                optionMetaId: dX,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: Y,
                                label: Y,
                                is_default: a,
                                _id: dY,
                                remoteId: e,
                                optionMetaId: dY,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aA,
                                label: aA,
                                is_default: a,
                                _id: dZ,
                                remoteId: e,
                                optionMetaId: dZ,
                                code: c,
                                isLocked: a,
                                __v: b
                            }],
                            conditions: [{
                                option: L,
                                meta: [bC],
                                optional: a,
                                _id: d_
                            }],
                            parent_values: [M, af],
                            helper_text: bo,
                            api_hint: "This option is available if you are targeting a \"video quality\" while using the H.264 - GPU codec. Higher CRF values compress more (at the expense of lower video quality)",
                            only_multifile: a,
                            class_name: i,
                            hidden: a,
                            order: ae,
                            type: n,
                            input_type: H,
                            validation_regex: b_,
                            validation_error_message: o,
                            customVariables: {}
                        }, {
                            id: d$,
                            name: bF,
                            label: "Change Resolution",
                            metas: [{
                                target: [],
                                value: b$,
                                label: "Preset Resolutions",
                                is_default: h,
                                _id: aB,
                                remoteId: bG,
                                optionMetaId: aB,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ca,
                                label: "By Width (Keep Aspect Ratio)",
                                is_default: a,
                                _id: cb,
                                remoteId: bG,
                                optionMetaId: cb,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: cc,
                                label: "By Height (Keep Aspect Ratio)",
                                is_default: a,
                                _id: cd,
                                remoteId: bG,
                                optionMetaId: cd,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ce,
                                label: "By Width & Height",
                                is_default: a,
                                _id: bH,
                                remoteId: bG,
                                optionMetaId: bH,
                                code: c,
                                isLocked: a,
                                __v: b
                            }],
                            conditions: [],
                            parent_values: [az],
                            helper_text: "Scaling down video resolution can drastically reduce file size. Note: We adjust your custom dimensions to be divisible by 2.",
                            api_hint: "Shows available video resolution change methods. Applies when your compression method is to target a specific video resolution (scale-down video).",
                            class_name: i,
                            hidden: h,
                            order: ae,
                            type: n,
                            input_type: al,
                            validation_regex: "\u002F^(preset_resolutions|by_height_keep_ar|by_width_keep_ar|by_width_height)$\u002F",
                            validation_error_message: o,
                            customVariables: {},
                            children: [{
                                id: "602bd4f598c6e90023d0648d",
                                name: cf,
                                label: "Enter Width (px)",
                                metas: [],
                                default_value: am,
                                conditions: [{
                                    option: bR,
                                    meta: [az],
                                    optional: a,
                                    _id: "6033522aadb5c50023d52b32"
                                }],
                                parent_values: [cb, bH],
                                helper_text: ea,
                                api_hint: ea,
                                only_multifile: a,
                                class_name: i,
                                hidden: a,
                                order: aq,
                                type: bp,
                                input_type: H,
                                validation_regex: bq,
                                validation_error_message: "Enter video width in pixels (0 - 10000).",
                                customVariables: {
                                    min: b,
                                    max: cg
                                }
                            }, {
                                id: "602bd39598c6e90023d06489",
                                name: ch,
                                label: "Enter Height (px)",
                                metas: [],
                                default_value: am,
                                conditions: [{
                                    option: bR,
                                    meta: [az],
                                    optional: a,
                                    _id: "603351f8adb5c50023d52b31"
                                }],
                                parent_values: [bH, cd],
                                helper_text: eb,
                                api_hint: eb,
                                only_multifile: a,
                                class_name: i,
                                hidden: a,
                                order: ec,
                                type: bp,
                                input_type: H,
                                validation_regex: bq,
                                validation_error_message: "Enter video height in pixels (0 - 10000).",
                                customVariables: {
                                    min: b,
                                    max: cg
                                }
                            }]
                        }, {
                            id: "67d7eca06768e7873848bfad",
                            name: ci,
                            label: bm,
                            metas: [{
                                target: [],
                                value: ar,
                                label: ar,
                                is_default: a,
                                _id: ed,
                                remoteId: d,
                                optionMetaId: ed,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: as,
                                label: as,
                                is_default: a,
                                _id: ee,
                                remoteId: d,
                                optionMetaId: ee,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: Z,
                                label: Z,
                                is_default: a,
                                _id: ef,
                                remoteId: d,
                                optionMetaId: ef,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: _,
                                label: _,
                                is_default: a,
                                _id: eg,
                                remoteId: d,
                                optionMetaId: eg,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: $,
                                label: $,
                                is_default: a,
                                _id: eh,
                                remoteId: d,
                                optionMetaId: eh,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aa,
                                label: aa,
                                is_default: a,
                                _id: ei,
                                remoteId: d,
                                optionMetaId: ei,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ab,
                                label: ab,
                                is_default: a,
                                _id: ej,
                                remoteId: d,
                                optionMetaId: ej,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ac,
                                label: ac,
                                is_default: a,
                                _id: ek,
                                remoteId: d,
                                optionMetaId: ek,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: l,
                                label: l,
                                is_default: a,
                                _id: el,
                                remoteId: d,
                                optionMetaId: el,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: p,
                                label: p,
                                is_default: a,
                                _id: em,
                                remoteId: d,
                                optionMetaId: em,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: E,
                                label: "20 Best Quality - Large Size",
                                is_default: a,
                                _id: en,
                                remoteId: d,
                                optionMetaId: en,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: I,
                                label: I,
                                is_default: a,
                                _id: eo,
                                remoteId: d,
                                optionMetaId: eo,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: q,
                                label: q,
                                is_default: a,
                                _id: ep,
                                remoteId: d,
                                optionMetaId: ep,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: r,
                                label: r,
                                is_default: a,
                                _id: eq,
                                remoteId: d,
                                optionMetaId: eq,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: s,
                                label: s,
                                is_default: a,
                                _id: er,
                                remoteId: d,
                                optionMetaId: er,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: t,
                                label: t,
                                is_default: a,
                                _id: es,
                                remoteId: d,
                                optionMetaId: es,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: u,
                                label: u,
                                is_default: a,
                                _id: et,
                                remoteId: d,
                                optionMetaId: et,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: v,
                                label: v,
                                is_default: a,
                                _id: eu,
                                remoteId: d,
                                optionMetaId: eu,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ag,
                                label: ev,
                                is_default: h,
                                _id: br,
                                remoteId: d,
                                optionMetaId: br,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: w,
                                label: w,
                                is_default: a,
                                _id: ew,
                                remoteId: d,
                                optionMetaId: ew,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: x,
                                label: x,
                                is_default: a,
                                _id: ex,
                                remoteId: d,
                                optionMetaId: ex,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: y,
                                label: y,
                                is_default: a,
                                _id: ey,
                                remoteId: d,
                                optionMetaId: ey,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: z,
                                label: z,
                                is_default: a,
                                _id: ez,
                                remoteId: d,
                                optionMetaId: ez,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: F,
                                label: F,
                                is_default: a,
                                _id: eA,
                                remoteId: d,
                                optionMetaId: eA,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: A,
                                label: A,
                                is_default: a,
                                _id: eB,
                                remoteId: d,
                                optionMetaId: eB,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: B,
                                label: B,
                                is_default: a,
                                _id: eC,
                                remoteId: d,
                                optionMetaId: eC,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: G,
                                label: "36 Okay Quality - Small Size",
                                is_default: a,
                                _id: eD,
                                remoteId: d,
                                optionMetaId: eD,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: C,
                                label: C,
                                is_default: a,
                                _id: eE,
                                remoteId: d,
                                optionMetaId: eE,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: D,
                                label: D,
                                is_default: a,
                                _id: eF,
                                remoteId: d,
                                optionMetaId: eF,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: N,
                                label: N,
                                is_default: a,
                                _id: eG,
                                remoteId: d,
                                optionMetaId: eG,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: O,
                                label: O,
                                is_default: a,
                                _id: eH,
                                remoteId: d,
                                optionMetaId: eH,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: P,
                                label: P,
                                is_default: a,
                                _id: eI,
                                remoteId: d,
                                optionMetaId: eI,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: Q,
                                label: Q,
                                is_default: a,
                                _id: eJ,
                                remoteId: d,
                                optionMetaId: eJ,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: R,
                                label: R,
                                is_default: a,
                                _id: eK,
                                remoteId: d,
                                optionMetaId: eK,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: S,
                                label: S,
                                is_default: a,
                                _id: eL,
                                remoteId: d,
                                optionMetaId: eL,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: T,
                                label: T,
                                is_default: a,
                                _id: eM,
                                remoteId: d,
                                optionMetaId: eM,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: U,
                                label: U,
                                is_default: a,
                                _id: eN,
                                remoteId: d,
                                optionMetaId: eN,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: V,
                                label: V,
                                is_default: a,
                                _id: eO,
                                remoteId: d,
                                optionMetaId: eO,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: W,
                                label: W,
                                is_default: a,
                                _id: eP,
                                remoteId: d,
                                optionMetaId: eP,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: X,
                                label: X,
                                is_default: a,
                                _id: eQ,
                                remoteId: d,
                                optionMetaId: eQ,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: Y,
                                label: Y,
                                is_default: a,
                                _id: eR,
                                remoteId: d,
                                optionMetaId: eR,
                                code: c,
                                isLocked: a,
                                __v: b
                            }],
                            conditions: [{
                                option: L,
                                meta: [bE],
                                optional: a,
                                _id: "67d7eca06768e7873848bfae"
                            }],
                            parent_values: [M, af],
                            helper_text: bo,
                            api_hint: "This option is available if you are targeting a \"video quality\" while using the AV1 - GPU codec. Higher CRF values compress more (at the expense of lower video quality)",
                            only_multifile: a,
                            class_name: i,
                            hidden: a,
                            order: ae,
                            type: n,
                            input_type: H,
                            validation_regex: "\u002F^(10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|44|45|46|47|48|49|50)$\u002F",
                            validation_error_message: o,
                            customVariables: {}
                        }, {
                            id: "602bc68e908d4e0023034072",
                            name: cj,
                            label: bm,
                            metas: [{
                                target: [],
                                is_default: a,
                                _id: eS,
                                label: eT,
                                value: at,
                                remoteId: f,
                                optionMetaId: eS,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: eU,
                                label: p,
                                value: au,
                                remoteId: f,
                                optionMetaId: eU,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: eV,
                                label: E,
                                value: aC,
                                remoteId: f,
                                optionMetaId: eV,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: h,
                                _id: bs,
                                label: "21 Good quality - medium size (default)",
                                value: aD,
                                remoteId: f,
                                optionMetaId: bs,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: eW,
                                label: q,
                                value: aE,
                                remoteId: f,
                                optionMetaId: eW,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: eX,
                                label: r,
                                value: aF,
                                remoteId: f,
                                optionMetaId: eX,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: eY,
                                label: s,
                                value: aG,
                                remoteId: f,
                                optionMetaId: eY,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: eZ,
                                label: t,
                                value: ao,
                                remoteId: f,
                                optionMetaId: eZ,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: e_,
                                label: u,
                                value: aH,
                                remoteId: f,
                                optionMetaId: e_,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: e$,
                                label: v,
                                value: aI,
                                remoteId: f,
                                optionMetaId: e$,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fa,
                                label: "28 Okay quality - small size",
                                value: aJ,
                                remoteId: f,
                                optionMetaId: fa,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fb,
                                label: w,
                                value: aK,
                                remoteId: f,
                                optionMetaId: fb,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fc,
                                label: x,
                                value: aL,
                                remoteId: f,
                                optionMetaId: fc,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fd,
                                label: y,
                                value: aM,
                                remoteId: f,
                                optionMetaId: fd,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fe,
                                label: z,
                                value: aN,
                                remoteId: f,
                                optionMetaId: fe,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: ff,
                                label: F,
                                value: aO,
                                remoteId: f,
                                optionMetaId: ff,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fg,
                                label: A,
                                value: aP,
                                remoteId: f,
                                optionMetaId: fg,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fh,
                                label: B,
                                value: aQ,
                                remoteId: f,
                                optionMetaId: fh,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fi,
                                label: G,
                                value: aR,
                                remoteId: f,
                                optionMetaId: fi,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fj,
                                label: C,
                                value: aS,
                                remoteId: f,
                                optionMetaId: fj,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fk,
                                label: D,
                                value: aT,
                                remoteId: f,
                                optionMetaId: fk,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fl,
                                label: N,
                                value: aU,
                                remoteId: f,
                                optionMetaId: fl,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fm,
                                label: O,
                                value: aV,
                                remoteId: f,
                                optionMetaId: fm,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fn,
                                label: P,
                                value: aW,
                                remoteId: f,
                                optionMetaId: fn,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fo,
                                label: Q,
                                value: aX,
                                remoteId: f,
                                optionMetaId: fo,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fp,
                                label: R,
                                value: aY,
                                remoteId: f,
                                optionMetaId: fp,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fq,
                                label: S,
                                value: aZ,
                                remoteId: f,
                                optionMetaId: fq,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fr,
                                label: T,
                                value: a_,
                                remoteId: f,
                                optionMetaId: fr,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fs,
                                label: U,
                                value: a$,
                                remoteId: f,
                                optionMetaId: fs,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: ft,
                                label: V,
                                value: ba,
                                remoteId: f,
                                optionMetaId: ft,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fu,
                                label: W,
                                value: bb,
                                remoteId: f,
                                optionMetaId: fu,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fv,
                                label: X,
                                value: bc,
                                remoteId: f,
                                optionMetaId: fv,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fw,
                                label: Y,
                                value: bd,
                                remoteId: f,
                                optionMetaId: fw,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: fx,
                                label: aA,
                                value: be,
                                remoteId: f,
                                optionMetaId: fx,
                                code: c,
                                isLocked: a,
                                __v: b
                            }],
                            conditions: [{
                                meta: [ak],
                                optional: a,
                                _id: fy,
                                option: L
                            }],
                            parent_values: [M, af],
                            helper_text: bo,
                            api_hint: "This option is available if you are targeting a \"video quality\" or \"max bitrate\" while using the H.264 codec. Higher CRF values compress more (at the expense of lower video quality)",
                            class_name: i,
                            hidden: a,
                            order: ae,
                            type: n,
                            input_type: H,
                            validation_regex: b_,
                            validation_error_message: o,
                            customVariables: {}
                        }, {
                            id: "602bca90908d4e00230340cc",
                            name: ck,
                            label: "Select Target Size (%)",
                            metas: [],
                            default_value: "60",
                            conditions: [],
                            parent_values: [ay],
                            helper_text: fz,
                            api_hint: fz,
                            only_multifile: a,
                            class_name: i,
                            units: "%",
                            hidden: a,
                            order: ae,
                            type: "slider",
                            input_type: H,
                            validation_regex: "\u002F^[0-9]*$\u002F",
                            validation_error_message: "Must be a valid percentage (0 - 10000%).",
                            properties: {
                                min: b,
                                max: fA
                            },
                            customVariables: {
                                min: b,
                                max: fA
                            }
                        }, {
                            id: "602b4636c03dcb0023e6d224",
                            name: cl,
                            label: bm,
                            metas: [{
                                target: [],
                                value: at,
                                label: eT,
                                is_default: a,
                                _id: fB,
                                remoteId: g,
                                optionMetaId: fB,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: au,
                                label: p,
                                is_default: a,
                                _id: fC,
                                remoteId: g,
                                optionMetaId: fC,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aC,
                                label: E,
                                is_default: a,
                                _id: fD,
                                remoteId: g,
                                optionMetaId: fD,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aD,
                                label: I,
                                is_default: a,
                                _id: fE,
                                remoteId: g,
                                optionMetaId: fE,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aE,
                                label: q,
                                is_default: a,
                                _id: fF,
                                remoteId: g,
                                optionMetaId: fF,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aF,
                                label: r,
                                is_default: a,
                                _id: fG,
                                remoteId: g,
                                optionMetaId: fG,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aG,
                                label: s,
                                is_default: a,
                                _id: fH,
                                remoteId: g,
                                optionMetaId: fH,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ao,
                                label: t,
                                is_default: a,
                                _id: fI,
                                remoteId: g,
                                optionMetaId: fI,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aH,
                                label: u,
                                is_default: a,
                                _id: fJ,
                                remoteId: g,
                                optionMetaId: fJ,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aI,
                                label: v,
                                is_default: a,
                                _id: fK,
                                remoteId: g,
                                optionMetaId: fK,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aJ,
                                label: "28 Good quality - medium size (default)",
                                is_default: h,
                                _id: bt,
                                remoteId: g,
                                optionMetaId: bt,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aK,
                                label: w,
                                is_default: a,
                                _id: fL,
                                remoteId: g,
                                optionMetaId: fL,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aL,
                                label: x,
                                is_default: a,
                                _id: fM,
                                remoteId: g,
                                optionMetaId: fM,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aM,
                                label: y,
                                is_default: a,
                                _id: fN,
                                remoteId: g,
                                optionMetaId: fN,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aN,
                                label: z,
                                is_default: a,
                                _id: fO,
                                remoteId: g,
                                optionMetaId: fO,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aO,
                                label: F,
                                is_default: a,
                                _id: fP,
                                remoteId: g,
                                optionMetaId: fP,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aP,
                                label: A,
                                is_default: a,
                                _id: fQ,
                                remoteId: g,
                                optionMetaId: fQ,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aQ,
                                label: B,
                                is_default: a,
                                _id: fR,
                                remoteId: g,
                                optionMetaId: fR,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aR,
                                label: G,
                                is_default: a,
                                _id: fS,
                                remoteId: g,
                                optionMetaId: fS,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aS,
                                label: C,
                                is_default: a,
                                _id: fT,
                                remoteId: g,
                                optionMetaId: fT,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aT,
                                label: D,
                                is_default: a,
                                _id: fU,
                                remoteId: g,
                                optionMetaId: fU,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aU,
                                label: N,
                                is_default: a,
                                _id: fV,
                                remoteId: g,
                                optionMetaId: fV,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aV,
                                label: O,
                                is_default: a,
                                _id: fW,
                                remoteId: g,
                                optionMetaId: fW,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aW,
                                label: P,
                                is_default: a,
                                _id: fX,
                                remoteId: g,
                                optionMetaId: fX,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aX,
                                label: Q,
                                is_default: a,
                                _id: fY,
                                remoteId: g,
                                optionMetaId: fY,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aY,
                                label: R,
                                is_default: a,
                                _id: fZ,
                                remoteId: g,
                                optionMetaId: fZ,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aZ,
                                label: S,
                                is_default: a,
                                _id: f_,
                                remoteId: g,
                                optionMetaId: f_,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: a_,
                                label: T,
                                is_default: a,
                                _id: f$,
                                remoteId: g,
                                optionMetaId: f$,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: a$,
                                label: U,
                                is_default: a,
                                _id: ga,
                                remoteId: g,
                                optionMetaId: ga,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ba,
                                label: V,
                                is_default: a,
                                _id: gb,
                                remoteId: g,
                                optionMetaId: gb,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: bb,
                                label: W,
                                is_default: a,
                                _id: gc,
                                remoteId: g,
                                optionMetaId: gc,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: bc,
                                label: X,
                                is_default: a,
                                _id: gd,
                                remoteId: g,
                                optionMetaId: gd,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: bd,
                                label: Y,
                                is_default: a,
                                _id: ge,
                                remoteId: g,
                                optionMetaId: ge,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: be,
                                label: aA,
                                is_default: a,
                                _id: gf,
                                remoteId: g,
                                optionMetaId: gf,
                                code: c,
                                isLocked: a,
                                __v: b
                            }],
                            conditions: [{
                                option: L,
                                meta: [bk],
                                optional: a,
                                _id: fy
                            }],
                            parent_values: [M, af],
                            helper_text: bo,
                            api_hint: "This option is available if you are targeting a \"video quality\" or \"max bitrate\" while using the H.265 codec. Higher CRF values compress more (at the expense of lower video quality)",
                            class_name: i,
                            hidden: a,
                            order: ae,
                            type: n,
                            input_type: H,
                            validation_regex: b_,
                            validation_error_message: o,
                            customVariables: {}
                        }, {
                            id: "67e0dc4112a92abd4b4fbf62",
                            name: cm,
                            label: bm,
                            metas: [{
                                target: [],
                                value: l,
                                label: ds,
                                is_default: a,
                                _id: gg,
                                remoteId: j,
                                optionMetaId: gg,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: p,
                                label: p,
                                is_default: a,
                                _id: gh,
                                remoteId: j,
                                optionMetaId: gh,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: E,
                                label: E,
                                is_default: a,
                                _id: gi,
                                remoteId: j,
                                optionMetaId: gi,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: I,
                                label: I,
                                is_default: a,
                                _id: gj,
                                remoteId: j,
                                optionMetaId: gj,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: q,
                                label: q,
                                is_default: a,
                                _id: gk,
                                remoteId: j,
                                optionMetaId: gk,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: r,
                                label: r,
                                is_default: a,
                                _id: gl,
                                remoteId: j,
                                optionMetaId: gl,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: s,
                                label: s,
                                is_default: a,
                                _id: gm,
                                remoteId: j,
                                optionMetaId: gm,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: t,
                                label: t,
                                is_default: a,
                                _id: gn,
                                remoteId: j,
                                optionMetaId: gn,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: u,
                                label: u,
                                is_default: a,
                                _id: go,
                                remoteId: j,
                                optionMetaId: go,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: v,
                                label: v,
                                is_default: a,
                                _id: gp,
                                remoteId: j,
                                optionMetaId: gp,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ag,
                                label: ev,
                                is_default: h,
                                _id: bu,
                                remoteId: j,
                                optionMetaId: bu,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: w,
                                label: w,
                                is_default: a,
                                _id: gq,
                                remoteId: j,
                                optionMetaId: gq,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: x,
                                label: x,
                                is_default: a,
                                _id: gr,
                                remoteId: j,
                                optionMetaId: gr,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: y,
                                label: y,
                                is_default: a,
                                _id: gs,
                                remoteId: j,
                                optionMetaId: gs,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: z,
                                label: z,
                                is_default: a,
                                _id: gt,
                                remoteId: j,
                                optionMetaId: gt,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: F,
                                label: "33 Okay Quality - Small Size",
                                is_default: a,
                                _id: gu,
                                remoteId: j,
                                optionMetaId: gu,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: A,
                                label: A,
                                is_default: a,
                                _id: gv,
                                remoteId: j,
                                optionMetaId: gv,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: B,
                                label: B,
                                is_default: a,
                                _id: gw,
                                remoteId: j,
                                optionMetaId: gw,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: G,
                                label: G,
                                is_default: a,
                                _id: gx,
                                remoteId: j,
                                optionMetaId: gx,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: C,
                                label: C,
                                is_default: a,
                                _id: gy,
                                remoteId: j,
                                optionMetaId: gy,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: D,
                                label: D,
                                is_default: a,
                                _id: gz,
                                remoteId: j,
                                optionMetaId: gz,
                                code: c,
                                isLocked: a,
                                __v: b
                            }],
                            conditions: [{
                                option: L,
                                meta: [bD],
                                optional: a,
                                _id: d_
                            }],
                            parent_values: [M, af],
                            helper_text: bo,
                            api_hint: "This option is available if you are targeting a \"video quality\" while using the H.265 - GPU codec. Higher CRF values compress more (at the expense of lower video quality)",
                            only_multifile: a,
                            class_name: i,
                            hidden: a,
                            order: ae,
                            type: n,
                            input_type: H,
                            validation_regex: "\u002F^(18|19|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38)$\u002F",
                            validation_error_message: o,
                            customVariables: {}
                        }, {
                            id: "602bd5ed98c6e90023d06491",
                            name: cn,
                            label: "Max Bitrate (Kbps)",
                            metas: [],
                            default_value: an,
                            conditions: [],
                            parent_values: [af],
                            helper_text: "Enter the maximum bitrate in Kbps (0-512000) you want to achieve while targeting a certain video quality (specified using CRF)",
                            api_hint: "Enter the maximum bitrate in Kbps (0-512000) you want to achieve while targeting a certain video quality (specified using CRF). This option is available when your compress method is \"Target a max bitrate\"",
                            only_multifile: a,
                            class_name: i,
                            units: K,
                            hidden: a,
                            order: aq,
                            type: bp,
                            input_type: H,
                            validation_regex: bq,
                            validation_error_message: "Enter the maximum bitrate in Kbps (0-512000)",
                            customVariables: {
                                min: b,
                                max: 512000
                            }
                        }, {
                            id: "602bc967908d4e00230340b9",
                            name: co,
                            label: cp,
                            metas: [{
                                target: [],
                                value: cq,
                                label: "Ultra fast",
                                is_default: a,
                                _id: gA,
                                remoteId: ah,
                                optionMetaId: gA,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: cr,
                                label: "Super fast",
                                is_default: a,
                                _id: gB,
                                remoteId: ah,
                                optionMetaId: gB,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: cs,
                                label: "Very fast (Default)",
                                is_default: h,
                                _id: bv,
                                remoteId: ah,
                                optionMetaId: bv,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ct,
                                label: "Faster",
                                is_default: a,
                                _id: gC,
                                remoteId: ah,
                                optionMetaId: gC,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: cu,
                                label: "Fast",
                                is_default: a,
                                _id: gD,
                                remoteId: ah,
                                optionMetaId: gD,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: cv,
                                label: "Medium",
                                is_default: a,
                                _id: gE,
                                remoteId: ah,
                                optionMetaId: gE,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: cw,
                                label: "Slow",
                                is_default: a,
                                _id: gF,
                                remoteId: ah,
                                optionMetaId: gF,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: cx,
                                label: "Slower",
                                is_default: a,
                                _id: gG,
                                remoteId: ah,
                                optionMetaId: gG,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: cy,
                                label: "Very Slow",
                                is_default: a,
                                _id: gH,
                                remoteId: ah,
                                optionMetaId: gH,
                                code: c,
                                isLocked: a,
                                __v: b
                            }],
                            conditions: [{
                                option: L,
                                meta: [ak, bk],
                                optional: a,
                                _id: "67d7f9906768e7873848ca33"
                            }],
                            parent_values: [M],
                            helper_text: bf,
                            api_hint: bf,
                            only_multifile: a,
                            class_name: i,
                            hidden: a,
                            order: aq,
                            type: n,
                            input_type: al,
                            validation_regex: "\u002F^(ultrafast|superfast|veryfast|veryslow|faster|medium|slower|fast|slow)$\u002F",
                            validation_error_message: o,
                            customVariables: {}
                        }, {
                            id: "602becb798c6e90023d064b3",
                            name: cz,
                            label: "Target Size (MB)",
                            metas: [],
                            default_value: K,
                            conditions: [],
                            parent_values: [bV],
                            helper_text: gI,
                            api_hint: gI,
                            only_multifile: a,
                            class_name: i,
                            hidden: a,
                            order: aq,
                            type: bp,
                            input_type: H,
                            validation_regex: bq,
                            validation_error_message: "Video file size must be 0-10240MB",
                            customVariables: {
                                min: b,
                                max: 10240
                            }
                        }, {
                            id: "67e0d2ec12a92abd4b4fbcab",
                            name: cA,
                            label: cp,
                            metas: [{
                                target: [],
                                value: Z,
                                label: gJ,
                                is_default: a,
                                _id: gK,
                                remoteId: m,
                                optionMetaId: gK,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: _,
                                label: "Faster (p2)",
                                is_default: h,
                                _id: bw,
                                remoteId: m,
                                optionMetaId: bw,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: $,
                                label: gL,
                                is_default: a,
                                _id: gM,
                                remoteId: m,
                                optionMetaId: gM,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aa,
                                label: gN,
                                is_default: a,
                                _id: gO,
                                remoteId: m,
                                optionMetaId: gO,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ab,
                                label: gP,
                                is_default: a,
                                _id: gQ,
                                remoteId: m,
                                optionMetaId: gQ,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ac,
                                label: gR,
                                is_default: a,
                                _id: gS,
                                remoteId: m,
                                optionMetaId: gS,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: l,
                                label: gT,
                                is_default: a,
                                _id: gU,
                                remoteId: m,
                                optionMetaId: gU,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: bg,
                                label: "High Quality 2 Passes (slow)",
                                is_default: a,
                                _id: gV,
                                remoteId: m,
                                optionMetaId: gV,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: bh,
                                label: "High Quality 1 Pass (medium)",
                                is_default: a,
                                _id: gW,
                                remoteId: m,
                                optionMetaId: gW,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: bi,
                                label: "High Performance 1 Pass (fast)",
                                is_default: a,
                                _id: gX,
                                remoteId: m,
                                optionMetaId: gX,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: cB,
                                label: "High Performance (hp)",
                                is_default: a,
                                _id: gY,
                                remoteId: m,
                                optionMetaId: gY,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ai,
                                label: "High Quality (hq)",
                                is_default: a,
                                _id: gZ,
                                remoteId: m,
                                optionMetaId: gZ,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: cC,
                                label: "Blue-ray standard (bd)",
                                is_default: a,
                                _id: g_,
                                remoteId: m,
                                optionMetaId: g_,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ar,
                                label: "Lossless (lossless)",
                                is_default: a,
                                _id: g$,
                                remoteId: m,
                                optionMetaId: g$,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: as,
                                label: "Lossless High Performance (losslesshp)",
                                is_default: a,
                                _id: ha,
                                remoteId: m,
                                optionMetaId: ha,
                                code: c,
                                isLocked: a,
                                __v: b
                            }],
                            conditions: [{
                                option: L,
                                meta: [bC, bD],
                                optional: a,
                                _id: "67e0d2ec12a92abd4b4fbcac"
                            }],
                            parent_values: [M],
                            helper_text: bf,
                            api_hint: bf,
                            only_multifile: a,
                            class_name: i,
                            hidden: a,
                            order: aq,
                            type: n,
                            input_type: H,
                            validation_regex: "\u002F^(1|2|3|4|5|6|10|11|12|13|14|15|16|17|18)$\u002F",
                            validation_error_message: o,
                            customVariables: {}
                        }, {
                            id: "67d7f1156768e7873848c334",
                            name: cD,
                            label: cp,
                            metas: [{
                                target: [],
                                value: bg,
                                label: "High quality 2 passes (slow)",
                                is_default: a,
                                _id: hb,
                                remoteId: ad,
                                optionMetaId: hb,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: bh,
                                label: "High quality 1 pass (medium)",
                                is_default: a,
                                _id: hc,
                                remoteId: ad,
                                optionMetaId: hc,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: bi,
                                label: "High performance 1 pass (fast)",
                                is_default: a,
                                _id: hd,
                                remoteId: ad,
                                optionMetaId: hd,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: Z,
                                label: gJ,
                                is_default: a,
                                _id: he,
                                remoteId: ad,
                                optionMetaId: he,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: _,
                                label: "Faster (p2 - default preset)",
                                is_default: h,
                                _id: bx,
                                remoteId: ad,
                                optionMetaId: bx,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: $,
                                label: gL,
                                is_default: a,
                                _id: hf,
                                remoteId: ad,
                                optionMetaId: hf,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: aa,
                                label: gN,
                                is_default: a,
                                _id: hg,
                                remoteId: ad,
                                optionMetaId: hg,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ab,
                                label: gP,
                                is_default: a,
                                _id: hh,
                                remoteId: ad,
                                optionMetaId: hh,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: ac,
                                label: gR,
                                is_default: a,
                                _id: hi,
                                remoteId: ad,
                                optionMetaId: hi,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                value: l,
                                label: gT,
                                is_default: a,
                                _id: hj,
                                remoteId: ad,
                                optionMetaId: hj,
                                code: c,
                                isLocked: a,
                                __v: b
                            }],
                            conditions: [{
                                option: L,
                                meta: [bE],
                                optional: a,
                                _id: "67d7f1156768e7873848c335"
                            }],
                            parent_values: [M],
                            helper_text: bf,
                            api_hint: bf,
                            only_multifile: a,
                            class_name: i,
                            hidden: a,
                            order: aq,
                            type: n,
                            input_type: H,
                            validation_regex: "\u002F^(1|2|3|12|13|14|15|16|17|18)$\u002F",
                            validation_error_message: o,
                            customVariables: {}
                        }, {
                            id: "609f51ffc48aaf0011c1b8ca",
                            name: cE,
                            label: "Rate Control Buffer (kbps)",
                            metas: [],
                            default_value: an,
                            conditions: [],
                            parent_values: [af],
                            helper_text: hk,
                            api_hint: hk,
                            only_multifile: a,
                            class_name: i,
                            units: K,
                            hidden: a,
                            order: ec,
                            type: bp,
                            input_type: H,
                            validation_regex: bq,
                            validation_error_message: "input_must_be_text_number",
                            customVariables: {
                                min: b,
                                max: cg
                            }
                        }, {
                            id: "602beddc98c6e90023d064b4",
                            name: cF,
                            label: "Select Preset Size",
                            metas: [{
                                target: [],
                                is_default: a,
                                _id: hl,
                                label: "8k (7680x4320)",
                                value: cG,
                                remoteId: J,
                                optionMetaId: hl,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: hm,
                                label: "4k (3840x2160)",
                                value: cH,
                                remoteId: J,
                                optionMetaId: hm,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: hn,
                                label: "1440p (2560x1440)",
                                value: cI,
                                remoteId: J,
                                optionMetaId: hn,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: ho,
                                label: "1080p (1920x1080)",
                                value: cJ,
                                remoteId: J,
                                optionMetaId: ho,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: hp,
                                label: "768p (1366x768)",
                                value: cK,
                                remoteId: J,
                                optionMetaId: hp,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: h,
                                _id: by,
                                label: "720p (1280x720)",
                                value: cL,
                                remoteId: J,
                                optionMetaId: by,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: hq,
                                label: "648p (1152x648)",
                                value: cM,
                                remoteId: J,
                                optionMetaId: hq,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: hr,
                                label: "576p (1024x576)",
                                value: cN,
                                remoteId: J,
                                optionMetaId: hr,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: hs,
                                label: "480p (720x480)",
                                value: cO,
                                remoteId: J,
                                optionMetaId: hs,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: ht,
                                label: "360p (480x360)",
                                value: cP,
                                remoteId: J,
                                optionMetaId: ht,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: hu,
                                label: "240p (352x240)",
                                value: cQ,
                                remoteId: J,
                                optionMetaId: hu,
                                code: c,
                                isLocked: a,
                                __v: b
                            }, {
                                target: [],
                                is_default: a,
                                _id: hv,
                                label: "144p (256x144)",
                                value: cR,
                                remoteId: J,
                                optionMetaId: hv,
                                code: c,
                                isLocked: a,
                                __v: b
                            }],
                            conditions: [{
                                meta: [aB],
                                optional: a,
                                _id: "60335177adb5c50023d52b24",
                                option: d$
                            }],
                            parent_values: [az],
                            api_hint: "Select a preset resolution. Option is available when compress video using \"target a video resolution\" method.",
                            class_name: i,
                            hidden: a,
                            order: hw,
                            type: n,
                            input_type: al,
                            validation_regex: "\u002F^(7680:4320|3840:2160|2560:1440|1920:1080|1366:768|1280:720|1152:648|1024:576|720:480|480:360|352:240|256:144)$\u002F",
                            validation_error_message: o,
                            customVariables: {}
                        }]
                    }, {
                        id: "615293fae827339a35f5a6a7",
                        name: cS,
                        label: "Make video compatible with old devices?",
                        metas: [],
                        conditions: [{
                            option: L,
                            meta: [ak, bk],
                            optional: a,
                            _id: "6808b3ef5d4add37161e71ac"
                        }],
                        parent_values: k,
                        helper_text: hx,
                        api_hint: hx,
                        only_multifile: a,
                        class_name: i,
                        hidden: a,
                        order: aq,
                        type: "checkbox",
                        input_type: "boolean",
                        validation_regex: "\u002F^(true|false)$\u002F",
                        validation_error_message: "input_must_be_checkbox",
                        customVariables: {}
                    }]
                };
                dp[1] = {
                    name: "Subtitle Settings",
                    group_id: "65d329dfc2e5e2181485d5ef",
                    order: hw,
                    options: [{
                        id: cT,
                        name: cU,
                        label: "Add Subtitle",
                        metas: [{
                            target: [],
                            value: cV,
                            label: hy,
                            is_default: a,
                            _id: hz,
                            remoteId: cW,
                            optionMetaId: hz,
                            code: c,
                            isLocked: a,
                            __v: b
                        }, {
                            target: [aw, ap, ax, hA],
                            value: cX,
                            label: hB,
                            is_default: a,
                            _id: hC,
                            remoteId: cW,
                            optionMetaId: hC,
                            code: c,
                            isLocked: a,
                            __v: b
                        }, {
                            target: [],
                            value: cY,
                            label: "Upload",
                            is_default: h,
                            _id: av,
                            remoteId: cW,
                            optionMetaId: av,
                            code: c,
                            isLocked: a,
                            __v: b
                        }],
                        conditions: [],
                        parent_values: k,
                        helper_text: hD,
                        api_hint: hD,
                        only_multifile: a,
                        class_name: i,
                        hidden: a,
                        order: 17,
                        type: n,
                        input_type: al,
                        validation_regex: "\u002F^(none|copy|upload)$\u002F",
                        validation_error_message: o,
                        customVariables: {}
                    }, {
                        id: "602be10398c6e90023d06497",
                        name: cZ,
                        label: "Upload Subtitles",
                        metas: [],
                        conditions: [{
                            option: cT,
                            meta: [av],
                            optional: a,
                            _id: "658a69674da89470ea2fa0bc"
                        }],
                        parent_values: k,
                        helper_text: "Upload a .srt or .ass file.",
                        api_hint: "Base64 encoded content of  a .srt or .ass subtitle file.",
                        only_multifile: a,
                        class_name: i,
                        hidden: a,
                        order: at,
                        type: "file_input",
                        input_type: al,
                        validation_regex: K,
                        validation_error_message: "input_must_be_file_input",
                        customVariables: {
                            allowedExts: [".srt", ".ass"],
                            errorMsg: "Not a valid subtitle file"
                        }
                    }, {
                        id: "65783cbea438a90b4801ec62",
                        name: c_,
                        label: "Subtitle Mode",
                        metas: [{
                            target: [],
                            value: c$,
                            label: "Hard",
                            is_default: h,
                            _id: bz,
                            remoteId: hE,
                            optionMetaId: bz,
                            code: c,
                            isLocked: a,
                            __v: b
                        }, {
                            target: [ap, hA, ax],
                            value: da,
                            label: "Soft",
                            is_default: a,
                            _id: hF,
                            remoteId: hE,
                            optionMetaId: hF,
                            code: c,
                            isLocked: a,
                            __v: b
                        }],
                        conditions: [{
                            option: cT,
                            meta: [av],
                            optional: a,
                            _id: "658a697c4da89470ea2fa0d1"
                        }],
                        parent_values: k,
                        helper_text: hG,
                        api_hint: hG,
                        only_multifile: a,
                        class_name: i,
                        hidden: a,
                        order: au,
                        type: n,
                        input_type: al,
                        validation_regex: "\u002F^(none|copy|soft|hard)$\u002F",
                        validation_error_message: o,
                        customVariables: {}
                    }]
                };
                return {
                    layout: "default",
                    data: [{
                        active: de,
                        type: bI,
                        title: df,
                        desc: dg,
                        header_h1: bA,
                        subtext_h1: dh,
                        currentUrl: bJ,
                        conversionGuideContent: {
                            instructions: di,
                            usps: []
                        },
                        contentsExtra: [dj, dk, dl],
                        reviews: [{
                            _id: "63157cc1952edc3fcdba3093",
                            title: "Awesome Site",
                            content: "I needed to email a video clip to choir members, but the file size was a problem. I used FreeConvert to reduce the file size and the result was just right. I had no trouble emailing the file.",
                            user: "Annabelle L",
                            star: ai,
                            __v: b
                        }, {
                            _id: "63157cc1952edc3fcdba3094",
                            title: "Incredible!",
                            content: "Just perfection. Best for converting an existing video to audio (mp3). It lets you trim correctly, fade in\u002Fout, reverse, and also lets you save in different formats. Love it.",
                            user: "Joseph",
                            star: ai,
                            __v: b
                        }, {
                            _id: "6315e21e8097cc5202801c6d",
                            title: "Great service",
                            content: "After trying several competitors, I was shocked that this worked. It converted big psd files into a vector format. I am super thankful and will use this more often!",
                            user: "Klaudia Wyzujak",
                            star: ai,
                            __v: b
                        }, {
                            _id: "6316e40bbeaa374542cee6e2",
                            title: "Best advanced options",
                            content: "FreeConvert.com has the best Advanced Options of any file converter! I strongly suggest others take advantage of these advanced options too to get the best output file quality.",
                            user: "Natalia Fatkulina",
                            star: ai,
                            __v: b
                        }, {
                            _id: "6316e480beaa374542cee6e9",
                            title: "Best site for file conversion",
                            content: "This is really good, even though my file was compressed, the video still has the same quality as the uncompressed version. You saved a future! Thank you so much!",
                            user: "Arianne",
                            star: ai,
                            __v: b
                        }]
                    }],
                    fetch: {},
                    error: k,
                    state: {
                        showGpuUpgradeWarning: a,
                        targetChangeIndex: b,
                        breadcrumbs: [{
                            url: bJ,
                            label: bA
                        }],
                        completed: [],
                        download: a,
                        alert: a,
                        types: a,
                        presetsList: [],
                        list: [],
                        reloadedList: [],
                        sourceList: [],
                        fileInputConcurrentLength: b,
                        history: [],
                        activeFilesCount: b,
                        showAdvancedForm: a,
                        showInvalidPopup: a,
                        showOverLimitPopup: a,
                        smallUploaderDisabled: h,
                        subscription: {
                            minutes: ao,
                            name: "Free",
                            perTaskLimit: dm,
                            plan: {
                                maxFileSizeInGb: dm
                            },
                            loaded: a,
                            free: k
                        },
                        googleToken: {},
                        errors: [],
                        info: {
                            _id: "5e007c16e874f628cc9bb221",
                            is_removed: a,
                            slug: bI,
                            title: df,
                            meta_description: dg,
                            header_h1: bA,
                            subtext_h1: dh,
                            button_text: dn,
                            main_card_text: [{
                                content: di
                            }, dj, dk, dl],
                            allowed_file_ext: ".m2ts, .mp4, .mp4, .mts, .mpeg, .swf, .mod, .mp4, .mp4, .mov, .m4v, .qt, .rm, .mpg, .3gpp, .flv, .divx, .vob, .dvr-ms, .wmv, .mp4, .rmvb, .asf, .mkv, .3g2, .ts, .mpv, .wtv, .webm, .xvid, .mp4, .3gp, .mp4, .mxf, .avi, .m1v, .f4p, .mp4, .f4v, .ogv",
                            created_at: "2019-12-23T08:34:30.807Z",
                            __v: b,
                            updated_at: "2020-09-09T16:29:45.564Z",
                            type: "video",
                            convert_more_text: "Compress More Videos",
                            upload_button_text: "Files",
                            advanced_option: "open",
                            target: K,
                            result_page_h1: "Compression Results",
                            upload_limit: K,
                            template: do0,
                            is_root: h,
                            custom_variables: "{\"statusText\":\"Compressing\",\"defaultTarget\":\"mp4\",\"targets\":\"mp4,flv,mkv,avi,mov,3gp\",\"sampleSource\":\"mkv\",\"sampleTarget\":\"mp4\",\"useIndividualAdvancedOptions\":true}",
                            related_file_ext: "mp4, m4v, mkv, avi, wmv, f4v, f4p, mov, vob, qt, mpv, 3gp, 3g2, rmvb, mts, m2ts, xvid, flv, rm, asf, webm, wtv, dvr-ms, ogv, swf, divx, m1v, mpeg, mpg",
                            result_page_blue_button: bK,
                            operation: "compress",
                            limitAcceptedFiles: h,
                            allowedArr: [".m2ts", aj, aj, ".mts", ".mpeg", ".swf", ".mod", aj, aj, ".mov", ".m4v", ".qt", ".rm", ".mpg", ".3gpp", ".flv", ".divx", ".vob", ".dvr-ms", ".wmv", aj, ".rmvb", ".asf", ".mkv", ".3g2", ".ts", ".mpv", ".wtv", ".webm", ".xvid", aj, ".3gp", aj, ".mxf", ".avi", ".m1v", ".f4p", aj, ".f4v", ".ogv"],
                            advancedOptions: dp,
                            toolPage: h,
                            active: de,
                            customVariables: {
                                statusText: hH,
                                defaultTarget: hI,
                                targets: "mp4,flv,mkv,avi,mov,3gp",
                                sampleSource: "mkv",
                                sampleTarget: hI,
                                useIndividualAdvancedOptions: h
                            }
                        },
                        toasts: [],
                        sidebarFolded: a,
                        alertObj: k,
                        redirect: db,
                        socketReconnectCounter: b,
                        isInternetAvailable: h,
                        interruptedJobs: [],
                        jobIDList: {},
                        exportJobIDList: {},
                        canChangeSubscription: h,
                        interactionInitiated: a,
                        loggedIn: a,
                        documentMounted: a,
                        autoSaveToDrive: a,
                        extra: k,
                        isValidDimension: h,
                        toBeUploadedEvent: k,
                        activeMenu: K,
                        advancedSetting: {
                            merging: a,
                            sorting: a,
                            attachments: {},
                            cropAspectRatio: a,
                            perConversionType: {
                                "video-compressor": {
                                    fieldNames: {
                                        "602a9df886eb7a0023f187b7": bL,
                                        "602a9df886eb7a0023f187b8": bM,
                                        "67df6e90d072ec808f903a37": bN,
                                        "602a9df886eb7a0023f187b9": bO,
                                        "67df6e90d072ec808f903a39": bP,
                                        "67d7e4106768e7873848b83c": bQ,
                                        "602a9f6c86eb7a0023f187bc": bS,
                                        "602a9f6c86eb7a0023f187bd": bT,
                                        "602a9f6c86eb7a0023f187be": bU,
                                        "602a9f6c86eb7a0023f187bf": bW,
                                        "602a9f6c86eb7a0023f187c0": bX,
                                        "602a9f6c86eb7a0023f187c1": bY,
                                        "67e0d81912a92abd4b4fbe73": bZ,
                                        "67e0d81912a92abd4b4fbe75": l,
                                        "67e0d81912a92abd4b4fbe76": p,
                                        "67e0d81912a92abd4b4fbe77": E,
                                        "67e0d81912a92abd4b4fbe78": I,
                                        "67e0d81912a92abd4b4fbe79": q,
                                        "67e0d81912a92abd4b4fbe7a": r,
                                        "67e0d81912a92abd4b4fbe7b": s,
                                        "67e0d81912a92abd4b4fbe7c": t,
                                        "67e0d81912a92abd4b4fbe7d": u,
                                        "67e0d81912a92abd4b4fbe7e": v,
                                        "67e0d81912a92abd4b4fbe7f": ag,
                                        "67e0d81912a92abd4b4fbe80": w,
                                        "67e0d81912a92abd4b4fbe81": x,
                                        "67e0d81912a92abd4b4fbe82": y,
                                        "67e0d81912a92abd4b4fbe83": z,
                                        "67e0d81912a92abd4b4fbe84": F,
                                        "67e0d81912a92abd4b4fbe85": A,
                                        "67e0d81912a92abd4b4fbe86": B,
                                        "67e0d81912a92abd4b4fbe87": G,
                                        "67e0d81912a92abd4b4fbe88": C,
                                        "67e0d81912a92abd4b4fbe89": D,
                                        "67e0d81912a92abd4b4fbe8a": N,
                                        "67e0d81912a92abd4b4fbe8b": O,
                                        "67e0d81912a92abd4b4fbe8c": P,
                                        "67e0d81912a92abd4b4fbe8d": Q,
                                        "67e0d81912a92abd4b4fbe8e": R,
                                        "67e0d81912a92abd4b4fbe8f": S,
                                        "67e0d81912a92abd4b4fbe90": T,
                                        "67e0d81912a92abd4b4fbe91": U,
                                        "67e0d81912a92abd4b4fbe92": V,
                                        "67e0d81912a92abd4b4fbe93": W,
                                        "67e0d81912a92abd4b4fbe94": X,
                                        "67e0d81912a92abd4b4fbe95": Y,
                                        "67e0d81912a92abd4b4fbe96": aA,
                                        "602bccc1908d4e00230340cd": bF,
                                        "602bccc1908d4e00230340ce": b$,
                                        "602bccc1908d4e00230340cf": ca,
                                        "602bccc1908d4e00230340d0": cc,
                                        "602bccc1908d4e00230340d1": ce,
                                        "602bd4f598c6e90023d0648d": cf,
                                        "602bd39598c6e90023d06489": ch,
                                        "67d7eca06768e7873848bfad": ci,
                                        "67d7eca06768e7873848bfaf": ar,
                                        "67d7eca06768e7873848bfb0": as,
                                        "67d7eca06768e7873848bfb1": Z,
                                        "67d7eca06768e7873848bfb2": _,
                                        "67d7eca06768e7873848bfb3": $,
                                        "67d7eca06768e7873848bfb4": aa,
                                        "67d7eca06768e7873848bfb5": ab,
                                        "67d7eca06768e7873848bfb6": ac,
                                        "67d7eca06768e7873848bfb7": l,
                                        "67d7eca06768e7873848bfb8": p,
                                        "67d7eca06768e7873848bfb9": E,
                                        "67d7eca06768e7873848bfba": I,
                                        "67d7eca06768e7873848bfbb": q,
                                        "67d7eca06768e7873848bfbc": r,
                                        "67d7eca06768e7873848bfbd": s,
                                        "67d7eca06768e7873848bfbe": t,
                                        "67d7eca06768e7873848bfbf": u,
                                        "67d7eca06768e7873848bfc0": v,
                                        "67d7eca06768e7873848bfc1": ag,
                                        "67d7eca06768e7873848bfc2": w,
                                        "67d7eca06768e7873848bfc3": x,
                                        "67d7eca06768e7873848bfc4": y,
                                        "67d7eca06768e7873848bfc5": z,
                                        "67d7eca06768e7873848bfc6": F,
                                        "67d7eca06768e7873848bfc7": A,
                                        "67d7eca06768e7873848bfc8": B,
                                        "67d7eca06768e7873848bfc9": G,
                                        "67d7eca06768e7873848bfca": C,
                                        "67d7eca06768e7873848bfcb": D,
                                        "67d7eca06768e7873848bfcc": N,
                                        "67d7eca06768e7873848bfcd": O,
                                        "67d7eca06768e7873848bfce": P,
                                        "67d7eca06768e7873848bfcf": Q,
                                        "67d7eca06768e7873848bfd0": R,
                                        "67d7eca06768e7873848bfd1": S,
                                        "67d7eca06768e7873848bfd2": T,
                                        "67d7eca06768e7873848bfd3": U,
                                        "67d7eca06768e7873848bfd4": V,
                                        "67d7eca06768e7873848bfd5": W,
                                        "67d7eca06768e7873848bfd6": X,
                                        "67d7eca06768e7873848bfd7": Y,
                                        "602bc68e908d4e0023034072": cj,
                                        "602bc68e908d4e0023034074": at,
                                        "602bc68e908d4e0023034075": au,
                                        "602bc68e908d4e0023034076": aC,
                                        "602bc68e908d4e0023034077": aD,
                                        "602bc68e908d4e0023034078": aE,
                                        "602bc68e908d4e0023034079": aF,
                                        "602bc68e908d4e002303407a": aG,
                                        "602bc68e908d4e002303407b": ao,
                                        "602bc68e908d4e002303407c": aH,
                                        "602bc68e908d4e002303407d": aI,
                                        "602bc68e908d4e002303407e": aJ,
                                        "602bc68e908d4e002303407f": aK,
                                        "602bc68e908d4e0023034080": aL,
                                        "602bc68e908d4e0023034081": aM,
                                        "602bc68e908d4e0023034082": aN,
                                        "602bc68e908d4e0023034083": aO,
                                        "602bc68e908d4e0023034084": aP,
                                        "602bc68e908d4e0023034085": aQ,
                                        "602bc68e908d4e0023034086": aR,
                                        "602bc68e908d4e0023034087": aS,
                                        "602bc68e908d4e0023034088": aT,
                                        "602bc68e908d4e0023034089": aU,
                                        "602bc68e908d4e002303408a": aV,
                                        "602bc68e908d4e002303408b": aW,
                                        "602bc68e908d4e002303408c": aX,
                                        "602bc68e908d4e002303408d": aY,
                                        "602bc68e908d4e002303408e": aZ,
                                        "602bc68e908d4e002303408f": a_,
                                        "602bc68e908d4e0023034090": a$,
                                        "602bc68e908d4e0023034091": ba,
                                        "602bc68e908d4e0023034092": bb,
                                        "602bc68e908d4e0023034093": bc,
                                        "602bc68e908d4e0023034094": bd,
                                        "602bc68e908d4e0023034095": be,
                                        "602bca90908d4e00230340cc": ck,
                                        "602b4636c03dcb0023e6d224": cl,
                                        "602bc51a908d4e0023034050": at,
                                        "602bc51a908d4e0023034051": au,
                                        "602bc51a908d4e0023034052": aC,
                                        "602bc51a908d4e0023034053": aD,
                                        "602bc51a908d4e0023034054": aE,
                                        "602bc51a908d4e0023034055": aF,
                                        "602bc51a908d4e0023034056": aG,
                                        "602bc51a908d4e0023034057": ao,
                                        "602bc51a908d4e0023034058": aH,
                                        "602bc51a908d4e0023034059": aI,
                                        "602bc51a908d4e002303405a": aJ,
                                        "602bc51a908d4e002303405b": aK,
                                        "602bc51a908d4e002303405c": aL,
                                        "602bc51a908d4e002303405d": aM,
                                        "602bc51a908d4e002303405e": aN,
                                        "602bc51a908d4e002303405f": aO,
                                        "602bc51a908d4e0023034060": aP,
                                        "602bc51a908d4e0023034061": aQ,
                                        "602bc51a908d4e0023034062": aR,
                                        "602bc51a908d4e0023034063": aS,
                                        "602bc51a908d4e0023034064": aT,
                                        "602bc51a908d4e0023034065": aU,
                                        "602bc51a908d4e0023034066": aV,
                                        "602bc51a908d4e0023034067": aW,
                                        "602bc51a908d4e0023034068": aX,
                                        "602bc51a908d4e0023034069": aY,
                                        "602bc51a908d4e002303406a": aZ,
                                        "602bc51a908d4e002303406b": a_,
                                        "602bc51a908d4e002303406c": a$,
                                        "602bc51a908d4e002303406d": ba,
                                        "602bc51a908d4e002303406e": bb,
                                        "602bc51a908d4e002303406f": bc,
                                        "602bc51a908d4e0023034070": bd,
                                        "602bc51a908d4e0023034071": be,
                                        "67e0dc4112a92abd4b4fbf62": cm,
                                        "67e0dc4112a92abd4b4fbf64": l,
                                        "67e0dc4112a92abd4b4fbf65": p,
                                        "67e0dc4112a92abd4b4fbf66": E,
                                        "67e0dc4112a92abd4b4fbf67": I,
                                        "67e0dc4112a92abd4b4fbf68": q,
                                        "67e0dc4112a92abd4b4fbf69": r,
                                        "67e0dc4112a92abd4b4fbf6a": s,
                                        "67e0dc4112a92abd4b4fbf6b": t,
                                        "67e0dc4112a92abd4b4fbf6c": u,
                                        "67e0dc4112a92abd4b4fbf6d": v,
                                        "67e0dc4112a92abd4b4fbf6e": ag,
                                        "67e0dc4112a92abd4b4fbf6f": w,
                                        "67e0dc4112a92abd4b4fbf70": x,
                                        "67e0dc4112a92abd4b4fbf71": y,
                                        "67e0dc4112a92abd4b4fbf72": z,
                                        "67e0dc4112a92abd4b4fbf73": F,
                                        "67e0dc4112a92abd4b4fbf74": A,
                                        "67e0dc4112a92abd4b4fbf75": B,
                                        "67e0dc4112a92abd4b4fbf76": G,
                                        "67e0dc4112a92abd4b4fbf77": C,
                                        "67e0dc4112a92abd4b4fbf78": D,
                                        "602bd5ed98c6e90023d06491": cn,
                                        "602bc967908d4e00230340b9": co,
                                        "602bc967908d4e00230340ba": cq,
                                        "602bc967908d4e00230340bb": cr,
                                        "602bc967908d4e00230340bc": cs,
                                        "602bc967908d4e00230340bd": ct,
                                        "602bc967908d4e00230340be": cu,
                                        "602bc967908d4e00230340bf": cv,
                                        "602bc967908d4e00230340c0": cw,
                                        "602bc967908d4e00230340c1": cx,
                                        "602bc967908d4e00230340c2": cy,
                                        "602becb798c6e90023d064b3": cz,
                                        "67e0d2ec12a92abd4b4fbcab": cA,
                                        "67e0d2ec12a92abd4b4fbcad": Z,
                                        "67e0d2ec12a92abd4b4fbcae": _,
                                        "67e0d2ec12a92abd4b4fbcaf": $,
                                        "67e0d2ec12a92abd4b4fbcb0": aa,
                                        "67e0d2ec12a92abd4b4fbcb1": ab,
                                        "67e0d2ec12a92abd4b4fbcb2": ac,
                                        "67e0d2ec12a92abd4b4fbcb3": l,
                                        "67e0d2ec12a92abd4b4fbcb4": bg,
                                        "67e0d2ec12a92abd4b4fbcb5": bh,
                                        "67e0d2ec12a92abd4b4fbcb6": bi,
                                        "67e0d2ec12a92abd4b4fbcb7": cB,
                                        "67e0d2ec12a92abd4b4fbcb8": ai,
                                        "67e0d2ec12a92abd4b4fbcb9": cC,
                                        "67e0d2ec12a92abd4b4fbcba": ar,
                                        "67e0d2ec12a92abd4b4fbcbb": as,
                                        "67d7f1156768e7873848c334": cD,
                                        "67d7f1156768e7873848c336": bg,
                                        "67d7f1156768e7873848c337": bh,
                                        "67d7f1156768e7873848c338": bi,
                                        "67d7f1156768e7873848c339": Z,
                                        "67d7f1156768e7873848c33a": _,
                                        "67d7f1156768e7873848c33b": $,
                                        "67d7f1156768e7873848c33c": aa,
                                        "67d7f1156768e7873848c33d": ab,
                                        "67d7f1156768e7873848c33e": ac,
                                        "67d7f1156768e7873848c33f": l,
                                        "609f51ffc48aaf0011c1b8ca": cE,
                                        "602beddc98c6e90023d064b4": cF,
                                        "602beddc98c6e90023d064b6": cG,
                                        "602beddc98c6e90023d064b7": cH,
                                        "602beddc98c6e90023d064b8": cI,
                                        "602beddc98c6e90023d064b9": cJ,
                                        "602beddc98c6e90023d064ba": cK,
                                        "602beddc98c6e90023d064bb": cL,
                                        "602beddc98c6e90023d064bc": cM,
                                        "602beddc98c6e90023d064bd": cN,
                                        "602beddc98c6e90023d064be": cO,
                                        "602beddc98c6e90023d064bf": cP,
                                        "602beddc98c6e90023d064c0": cQ,
                                        "602beddc98c6e90023d064c1": cR,
                                        "615293fae827339a35f5a6a7": cS,
                                        "658a67f8d661c36bcd6cd4fe": cU,
                                        "658a68d34da89470ea2fa0a3": cV,
                                        "658a68d34da89470ea2fa0a4": cX,
                                        "658a68d34da89470ea2fa0a5": cY,
                                        "602be10398c6e90023d06497": cZ,
                                        "65783cbea438a90b4801ec62": c_,
                                        "65783e533b3bc02dc9aa7424": c$,
                                        "658a68844da89470ea2fa06f": da
                                    },
                                    hidden: [bF],
                                    selection: {
                                        "602a9df886eb7a0023f187b7": ak,
                                        "602a9f6c86eb7a0023f187bc": ay,
                                        "67e0d81912a92abd4b4fbe73": bn,
                                        "602bccc1908d4e00230340cd": aB,
                                        "602bd4f598c6e90023d0648d": am,
                                        "602bd39598c6e90023d06489": am,
                                        "67d7eca06768e7873848bfad": br,
                                        "602bc68e908d4e0023034072": bs,
                                        "602bca90908d4e00230340cc": dc,
                                        "602b4636c03dcb0023e6d224": bt,
                                        "67e0dc4112a92abd4b4fbf62": bu,
                                        "602bd5ed98c6e90023d06491": an,
                                        "602bc967908d4e00230340b9": bv,
                                        "67e0d2ec12a92abd4b4fbcab": bw,
                                        "67d7f1156768e7873848c334": bx,
                                        "609f51ffc48aaf0011c1b8ca": an,
                                        "602beddc98c6e90023d064b4": by,
                                        "615293fae827339a35f5a6a7": a,
                                        "658a67f8d661c36bcd6cd4fe": av,
                                        "602be10398c6e90023d06497": dd,
                                        "65783cbea438a90b4801ec62": bz
                                    },
                                    list: dp
                                }
                            },
                            userData: {
                                allSelection: {
                                    page: {
                                        "602a9df886eb7a0023f187b7": ak,
                                        "602a9f6c86eb7a0023f187bc": ay,
                                        "67e0d81912a92abd4b4fbe73": bn,
                                        "602bccc1908d4e00230340cd": aB,
                                        "602bd4f598c6e90023d0648d": am,
                                        "602bd39598c6e90023d06489": am,
                                        "67d7eca06768e7873848bfad": br,
                                        "602bc68e908d4e0023034072": bs,
                                        "602bca90908d4e00230340cc": dc,
                                        "602b4636c03dcb0023e6d224": bt,
                                        "67e0dc4112a92abd4b4fbf62": bu,
                                        "602bd5ed98c6e90023d06491": an,
                                        "602bc967908d4e00230340b9": bv,
                                        "67e0d2ec12a92abd4b4fbcab": bw,
                                        "67d7f1156768e7873848c334": bx,
                                        "609f51ffc48aaf0011c1b8ca": an,
                                        "602beddc98c6e90023d064b4": by,
                                        "615293fae827339a35f5a6a7": a,
                                        "658a67f8d661c36bcd6cd4fe": av,
                                        "602be10398c6e90023d06497": dd,
                                        "65783cbea438a90b4801ec62": bz
                                    },
                                    root: {
                                        "602a9df886eb7a0023f187b7": ak,
                                        "602a9f6c86eb7a0023f187bc": ay,
                                        "67e0d81912a92abd4b4fbe73": bn,
                                        "602bccc1908d4e00230340cd": aB,
                                        "602bd4f598c6e90023d0648d": am,
                                        "602bd39598c6e90023d06489": am,
                                        "67d7eca06768e7873848bfad": br,
                                        "602bc68e908d4e0023034072": bs,
                                        "602bca90908d4e00230340cc": dc,
                                        "602b4636c03dcb0023e6d224": bt,
                                        "67e0dc4112a92abd4b4fbf62": bu,
                                        "602bd5ed98c6e90023d06491": an,
                                        "602bc967908d4e00230340b9": bv,
                                        "67e0d2ec12a92abd4b4fbcab": bw,
                                        "67d7f1156768e7873848c334": bx,
                                        "609f51ffc48aaf0011c1b8ca": an,
                                        "602beddc98c6e90023d064b4": by,
                                        "615293fae827339a35f5a6a7": a,
                                        "658a67f8d661c36bcd6cd4fe": av,
                                        "602be10398c6e90023d06497": dd,
                                        "65783cbea438a90b4801ec62": bz
                                    }
                                },
                                fieldNames: {
                                    "602a9df886eb7a0023f187b7": bL,
                                    "602a9df886eb7a0023f187b8": bM,
                                    "67df6e90d072ec808f903a37": bN,
                                    "602a9df886eb7a0023f187b9": bO,
                                    "67df6e90d072ec808f903a39": bP,
                                    "67d7e4106768e7873848b83c": bQ,
                                    "602a9f6c86eb7a0023f187bc": bS,
                                    "602a9f6c86eb7a0023f187bd": bT,
                                    "602a9f6c86eb7a0023f187be": bU,
                                    "602a9f6c86eb7a0023f187bf": bW,
                                    "602a9f6c86eb7a0023f187c0": bX,
                                    "602a9f6c86eb7a0023f187c1": bY,
                                    "67e0d81912a92abd4b4fbe73": bZ,
                                    "67e0d81912a92abd4b4fbe75": l,
                                    "67e0d81912a92abd4b4fbe76": p,
                                    "67e0d81912a92abd4b4fbe77": E,
                                    "67e0d81912a92abd4b4fbe78": I,
                                    "67e0d81912a92abd4b4fbe79": q,
                                    "67e0d81912a92abd4b4fbe7a": r,
                                    "67e0d81912a92abd4b4fbe7b": s,
                                    "67e0d81912a92abd4b4fbe7c": t,
                                    "67e0d81912a92abd4b4fbe7d": u,
                                    "67e0d81912a92abd4b4fbe7e": v,
                                    "67e0d81912a92abd4b4fbe7f": ag,
                                    "67e0d81912a92abd4b4fbe80": w,
                                    "67e0d81912a92abd4b4fbe81": x,
                                    "67e0d81912a92abd4b4fbe82": y,
                                    "67e0d81912a92abd4b4fbe83": z,
                                    "67e0d81912a92abd4b4fbe84": F,
                                    "67e0d81912a92abd4b4fbe85": A,
                                    "67e0d81912a92abd4b4fbe86": B,
                                    "67e0d81912a92abd4b4fbe87": G,
                                    "67e0d81912a92abd4b4fbe88": C,
                                    "67e0d81912a92abd4b4fbe89": D,
                                    "67e0d81912a92abd4b4fbe8a": N,
                                    "67e0d81912a92abd4b4fbe8b": O,
                                    "67e0d81912a92abd4b4fbe8c": P,
                                    "67e0d81912a92abd4b4fbe8d": Q,
                                    "67e0d81912a92abd4b4fbe8e": R,
                                    "67e0d81912a92abd4b4fbe8f": S,
                                    "67e0d81912a92abd4b4fbe90": T,
                                    "67e0d81912a92abd4b4fbe91": U,
                                    "67e0d81912a92abd4b4fbe92": V,
                                    "67e0d81912a92abd4b4fbe93": W,
                                    "67e0d81912a92abd4b4fbe94": X,
                                    "67e0d81912a92abd4b4fbe95": Y,
                                    "67e0d81912a92abd4b4fbe96": aA,
                                    "602bccc1908d4e00230340cd": bF,
                                    "602bccc1908d4e00230340ce": b$,
                                    "602bccc1908d4e00230340cf": ca,
                                    "602bccc1908d4e00230340d0": cc,
                                    "602bccc1908d4e00230340d1": ce,
                                    "602bd4f598c6e90023d0648d": cf,
                                    "602bd39598c6e90023d06489": ch,
                                    "67d7eca06768e7873848bfad": ci,
                                    "67d7eca06768e7873848bfaf": ar,
                                    "67d7eca06768e7873848bfb0": as,
                                    "67d7eca06768e7873848bfb1": Z,
                                    "67d7eca06768e7873848bfb2": _,
                                    "67d7eca06768e7873848bfb3": $,
                                    "67d7eca06768e7873848bfb4": aa,
                                    "67d7eca06768e7873848bfb5": ab,
                                    "67d7eca06768e7873848bfb6": ac,
                                    "67d7eca06768e7873848bfb7": l,
                                    "67d7eca06768e7873848bfb8": p,
                                    "67d7eca06768e7873848bfb9": E,
                                    "67d7eca06768e7873848bfba": I,
                                    "67d7eca06768e7873848bfbb": q,
                                    "67d7eca06768e7873848bfbc": r,
                                    "67d7eca06768e7873848bfbd": s,
                                    "67d7eca06768e7873848bfbe": t,
                                    "67d7eca06768e7873848bfbf": u,
                                    "67d7eca06768e7873848bfc0": v,
                                    "67d7eca06768e7873848bfc1": ag,
                                    "67d7eca06768e7873848bfc2": w,
                                    "67d7eca06768e7873848bfc3": x,
                                    "67d7eca06768e7873848bfc4": y,
                                    "67d7eca06768e7873848bfc5": z,
                                    "67d7eca06768e7873848bfc6": F,
                                    "67d7eca06768e7873848bfc7": A,
                                    "67d7eca06768e7873848bfc8": B,
                                    "67d7eca06768e7873848bfc9": G,
                                    "67d7eca06768e7873848bfca": C,
                                    "67d7eca06768e7873848bfcb": D,
                                    "67d7eca06768e7873848bfcc": N,
                                    "67d7eca06768e7873848bfcd": O,
                                    "67d7eca06768e7873848bfce": P,
                                    "67d7eca06768e7873848bfcf": Q,
                                    "67d7eca06768e7873848bfd0": R,
                                    "67d7eca06768e7873848bfd1": S,
                                    "67d7eca06768e7873848bfd2": T,
                                    "67d7eca06768e7873848bfd3": U,
                                    "67d7eca06768e7873848bfd4": V,
                                    "67d7eca06768e7873848bfd5": W,
                                    "67d7eca06768e7873848bfd6": X,
                                    "67d7eca06768e7873848bfd7": Y,
                                    "602bc68e908d4e0023034072": cj,
                                    "602bc68e908d4e0023034074": at,
                                    "602bc68e908d4e0023034075": au,
                                    "602bc68e908d4e0023034076": aC,
                                    "602bc68e908d4e0023034077": aD,
                                    "602bc68e908d4e0023034078": aE,
                                    "602bc68e908d4e0023034079": aF,
                                    "602bc68e908d4e002303407a": aG,
                                    "602bc68e908d4e002303407b": ao,
                                    "602bc68e908d4e002303407c": aH,
                                    "602bc68e908d4e002303407d": aI,
                                    "602bc68e908d4e002303407e": aJ,
                                    "602bc68e908d4e002303407f": aK,
                                    "602bc68e908d4e0023034080": aL,
                                    "602bc68e908d4e0023034081": aM,
                                    "602bc68e908d4e0023034082": aN,
                                    "602bc68e908d4e0023034083": aO,
                                    "602bc68e908d4e0023034084": aP,
                                    "602bc68e908d4e0023034085": aQ,
                                    "602bc68e908d4e0023034086": aR,
                                    "602bc68e908d4e0023034087": aS,
                                    "602bc68e908d4e0023034088": aT,
                                    "602bc68e908d4e0023034089": aU,
                                    "602bc68e908d4e002303408a": aV,
                                    "602bc68e908d4e002303408b": aW,
                                    "602bc68e908d4e002303408c": aX,
                                    "602bc68e908d4e002303408d": aY,
                                    "602bc68e908d4e002303408e": aZ,
                                    "602bc68e908d4e002303408f": a_,
                                    "602bc68e908d4e0023034090": a$,
                                    "602bc68e908d4e0023034091": ba,
                                    "602bc68e908d4e0023034092": bb,
                                    "602bc68e908d4e0023034093": bc,
                                    "602bc68e908d4e0023034094": bd,
                                    "602bc68e908d4e0023034095": be,
                                    "602bca90908d4e00230340cc": ck,
                                    "602b4636c03dcb0023e6d224": cl,
                                    "602bc51a908d4e0023034050": at,
                                    "602bc51a908d4e0023034051": au,
                                    "602bc51a908d4e0023034052": aC,
                                    "602bc51a908d4e0023034053": aD,
                                    "602bc51a908d4e0023034054": aE,
                                    "602bc51a908d4e0023034055": aF,
                                    "602bc51a908d4e0023034056": aG,
                                    "602bc51a908d4e0023034057": ao,
                                    "602bc51a908d4e0023034058": aH,
                                    "602bc51a908d4e0023034059": aI,
                                    "602bc51a908d4e002303405a": aJ,
                                    "602bc51a908d4e002303405b": aK,
                                    "602bc51a908d4e002303405c": aL,
                                    "602bc51a908d4e002303405d": aM,
                                    "602bc51a908d4e002303405e": aN,
                                    "602bc51a908d4e002303405f": aO,
                                    "602bc51a908d4e0023034060": aP,
                                    "602bc51a908d4e0023034061": aQ,
                                    "602bc51a908d4e0023034062": aR,
                                    "602bc51a908d4e0023034063": aS,
                                    "602bc51a908d4e0023034064": aT,
                                    "602bc51a908d4e0023034065": aU,
                                    "602bc51a908d4e0023034066": aV,
                                    "602bc51a908d4e0023034067": aW,
                                    "602bc51a908d4e0023034068": aX,
                                    "602bc51a908d4e0023034069": aY,
                                    "602bc51a908d4e002303406a": aZ,
                                    "602bc51a908d4e002303406b": a_,
                                    "602bc51a908d4e002303406c": a$,
                                    "602bc51a908d4e002303406d": ba,
                                    "602bc51a908d4e002303406e": bb,
                                    "602bc51a908d4e002303406f": bc,
                                    "602bc51a908d4e0023034070": bd,
                                    "602bc51a908d4e0023034071": be,
                                    "67e0dc4112a92abd4b4fbf62": cm,
                                    "67e0dc4112a92abd4b4fbf64": l,
                                    "67e0dc4112a92abd4b4fbf65": p,
                                    "67e0dc4112a92abd4b4fbf66": E,
                                    "67e0dc4112a92abd4b4fbf67": I,
                                    "67e0dc4112a92abd4b4fbf68": q,
                                    "67e0dc4112a92abd4b4fbf69": r,
                                    "67e0dc4112a92abd4b4fbf6a": s,
                                    "67e0dc4112a92abd4b4fbf6b": t,
                                    "67e0dc4112a92abd4b4fbf6c": u,
                                    "67e0dc4112a92abd4b4fbf6d": v,
                                    "67e0dc4112a92abd4b4fbf6e": ag,
                                    "67e0dc4112a92abd4b4fbf6f": w,
                                    "67e0dc4112a92abd4b4fbf70": x,
                                    "67e0dc4112a92abd4b4fbf71": y,
                                    "67e0dc4112a92abd4b4fbf72": z,
                                    "67e0dc4112a92abd4b4fbf73": F,
                                    "67e0dc4112a92abd4b4fbf74": A,
                                    "67e0dc4112a92abd4b4fbf75": B,
                                    "67e0dc4112a92abd4b4fbf76": G,
                                    "67e0dc4112a92abd4b4fbf77": C,
                                    "67e0dc4112a92abd4b4fbf78": D,
                                    "602bd5ed98c6e90023d06491": cn,
                                    "602bc967908d4e00230340b9": co,
                                    "602bc967908d4e00230340ba": cq,
                                    "602bc967908d4e00230340bb": cr,
                                    "602bc967908d4e00230340bc": cs,
                                    "602bc967908d4e00230340bd": ct,
                                    "602bc967908d4e00230340be": cu,
                                    "602bc967908d4e00230340bf": cv,
                                    "602bc967908d4e00230340c0": cw,
                                    "602bc967908d4e00230340c1": cx,
                                    "602bc967908d4e00230340c2": cy,
                                    "602becb798c6e90023d064b3": cz,
                                    "67e0d2ec12a92abd4b4fbcab": cA,
                                    "67e0d2ec12a92abd4b4fbcad": Z,
                                    "67e0d2ec12a92abd4b4fbcae": _,
                                    "67e0d2ec12a92abd4b4fbcaf": $,
                                    "67e0d2ec12a92abd4b4fbcb0": aa,
                                    "67e0d2ec12a92abd4b4fbcb1": ab,
                                    "67e0d2ec12a92abd4b4fbcb2": ac,
                                    "67e0d2ec12a92abd4b4fbcb3": l,
                                    "67e0d2ec12a92abd4b4fbcb4": bg,
                                    "67e0d2ec12a92abd4b4fbcb5": bh,
                                    "67e0d2ec12a92abd4b4fbcb6": bi,
                                    "67e0d2ec12a92abd4b4fbcb7": cB,
                                    "67e0d2ec12a92abd4b4fbcb8": ai,
                                    "67e0d2ec12a92abd4b4fbcb9": cC,
                                    "67e0d2ec12a92abd4b4fbcba": ar,
                                    "67e0d2ec12a92abd4b4fbcbb": as,
                                    "67d7f1156768e7873848c334": cD,
                                    "67d7f1156768e7873848c336": bg,
                                    "67d7f1156768e7873848c337": bh,
                                    "67d7f1156768e7873848c338": bi,
                                    "67d7f1156768e7873848c339": Z,
                                    "67d7f1156768e7873848c33a": _,
                                    "67d7f1156768e7873848c33b": $,
                                    "67d7f1156768e7873848c33c": aa,
                                    "67d7f1156768e7873848c33d": ab,
                                    "67d7f1156768e7873848c33e": ac,
                                    "67d7f1156768e7873848c33f": l,
                                    "609f51ffc48aaf0011c1b8ca": cE,
                                    "602beddc98c6e90023d064b4": cF,
                                    "602beddc98c6e90023d064b6": cG,
                                    "602beddc98c6e90023d064b7": cH,
                                    "602beddc98c6e90023d064b8": cI,
                                    "602beddc98c6e90023d064b9": cJ,
                                    "602beddc98c6e90023d064ba": cK,
                                    "602beddc98c6e90023d064bb": cL,
                                    "602beddc98c6e90023d064bc": cM,
                                    "602beddc98c6e90023d064bd": cN,
                                    "602beddc98c6e90023d064be": cO,
                                    "602beddc98c6e90023d064bf": cP,
                                    "602beddc98c6e90023d064c0": cQ,
                                    "602beddc98c6e90023d064c1": cR,
                                    "615293fae827339a35f5a6a7": cS,
                                    "658a67f8d661c36bcd6cd4fe": cU,
                                    "658a68d34da89470ea2fa0a3": cV,
                                    "658a68d34da89470ea2fa0a4": cX,
                                    "658a68d34da89470ea2fa0a5": cY,
                                    "602be10398c6e90023d06497": cZ,
                                    "65783cbea438a90b4801ec62": c_,
                                    "65783e533b3bc02dc9aa7424": c$,
                                    "658a68844da89470ea2fa06f": da
                                },
                                conversionType: {
                                    root: bI
                                },
                                defaultAllowed: [],
                                defaultHidden: []
                            },
                            showOnlyRootSettings: a,
                            targetForExt: {},
                            targetObjects: {},
                            typeForExt: {},
                            defaultTarget: K,
                            targetForFile: {},
                            cropSettingsIds: {},
                            oldSelection: {
                                allSelection: {}
                            },
                            advancedOptionsLoading: a,
                            supportedTargets: k,
                            mergeInfo: k,
                            customDimensionActiveInput: a,
                            selectedPreviewItem: k,
                            options: {}
                        },
                        banner: {
                            bannerList: [],
                            showPerTaskLimitReachedError: a,
                            upgradingMidConversion: a
                        },
                        items: {
                            bulkItemJobId: K,
                            jobs: {},
                            tasks: {},
                            startConversionOnDownloadPage: h
                        },
                        store: {
                            isCypress: a,
                            isMobile: a,
                            isTab: a,
                            isSafari: a,
                            userAgent: "Mozilla\u002F5.0 (Windows NT 10.0; Win64; x64) AppleWebKit\u002F537.36 (KHTML, like Gecko) Chrome\u002F134.0.0.0 Safari\u002F537.36 OPR\u002F119.0.0.0 (Edition std-2)",
                            advancedOptionListResponsiveView: a,
                            showAutoSavetoDriveOption: a,
                            googleDriveTokenForUpload: k,
                            telemetryUser: a,
                            dialogIsOpen: a,
                            country: "US",
                            priceToLong: a,
                            ctaLoading: a
                        },
                        thumb: {
                            pdfToolBarOptions: {
                                viewPages: h,
                                include: "all",
                                splitMode: "custom",
                                pageCount: k,
                                splitRanges: [K]
                            },
                            thumbs: [],
                            addThumbsToPosition: k,
                            showAddFilesButton: k,
                            ranges: k,
                            thumbLoading: a,
                            thumbDragging: a
                        },
                        i18n: {
                            routeParams: {}
                        },
                        forceTarget: a,
                        failedUploadCalls: []
                    },
                    serverRendered: h,
                    routePath: bJ,
                    config: {
                        _app: {
                            basePath: db,
                            assetsPath: db,
                            cdnURL: "https:\u002F\u002Fwww.freeconvert.com\u002F_nuxt\u002F202507161130-499\u002F"
                        }
                    },
                    __i18n: {
                        langs: {
                            en: {
                                "24-h-pass": "24-h pass gives you pro privileges just for 24 hours. This package is not automatically renewed",
                                Compress: bK,
                                Compressor: hJ,
                                Convert: hK,
                                Converter: hL,
                                Cropper: "Cropper",
                                Image: "Image",
                                Maker: "Maker",
                                Trimmer: "Trimmer",
                                When_you_qualify_for_refund: "When You Qualify for a Refund",
                                When_you_qualify_for_refund_desc: "We believe in transparency and fairness. You can request a refund under the following conditions:",
                                about_us: "About Us",
                                access_control_authentication: "Access Control and \u003Cbr\u002F\u003EAuthentication",
                                account_max_file_size_limit: "ACCOUNT_TYPE accounts have a MAX_LIMIT max file size limit",
                                account_presets: "Account Dashboard\u002F Presets",
                                add: "Add",
                                add_files: "Add Files",
                                add_files_by_url: "Add Files by URL",
                                add_files_by_url_label: "Enter Url",
                                add_more: "Add More",
                                add_more_urls: "Add more URLs",
                                add_more_webpages: "Add More Webpages",
                                added: "Added",
                                added_to_queue: " added to queue, add more if you like.",
                                added_total_files: "Added TOTAL files",
                                added_x_of_total_files: "Added X of TOTAL files",
                                address: "Address",
                                address_line_2: "Address Line 2 (Apartment, suit, unit etc)",
                                advanced_options: "Advanced Options",
                                advanced_settings_optional: "Advanced settings (optional)",
                                all: "All",
                                all_files: "All files",
                                all_files_must_have_target: "All files must have a target format.",
                                all_files_removed: "All files removed.",
                                all_pages: "All Pages",
                                already_have_account: "Already have an account?",
                                and_start_over: "and start over",
                                android_video_compressor: "Android Video Compressor",
                                annual: "Annual",
                                annualy: "Annually",
                                api_dialog_description: "Here is how to perform your tasks using Freeconvert's API. Our API can perform complex multi-step file manipulations. For example, you can convert a file and compress the output. Did we mention that all our advanced options are available too? For more information, try our API workflow builder.",
                                api_dialog_title: "Perform This Job with our API",
                                api_doc: "API Documentation",
                                api_feature__dedicated_support: "Dedicated support",
                                api_feature_processing_time_per_file: "Up to 4 hours of processing time per file",
                                api_feature_sla: "99.99% Service Level Agreement",
                                api_feature_unlimited_conversions: "Unlimited conversions",
                                api_feature_unlimited_file_size: "Max 10 GB File Size",
                                api_launcher_hint: "API is not supported for Drive Uploads",
                                api_launcher_hint_dropbox: "API is not supported for Dropbox",
                                api_not_available: "API not available",
                                applied: "Applied!",
                                apply: "Apply",
                                apply_from_preset: "Apply from Preset",
                                apply_settings: "Apply Settings",
                                apply_to_all: "Apply to All Files",
                                apply_to_all_have_same_setting: "Apply to all conversions that have the same settings",
                                archive: "Archive",
                                archive_size_too_big: "Archive size too big",
                                are_you_happy: "Are you a happy user?",
                                area: "Area",
                                at_least_n_characters: "at least LENGTH characters",
                                at_least_one_letter: "at least one letter",
                                at_least_one_number: "at least one number",
                                audio: "Audio",
                                auth_free_sign_up: "Free Sign Up",
                                auth_login: "Log In",
                                auth_logout: "Logout",
                                auth_recover_password: "Recover Password",
                                auth_signup: "Sign Up",
                                based_on: "based on",
                                best_value_for_power_users: "Best Value for Power Users",
                                billing_info: "Billing Info",
                                bookmark_page: "Bookmark Page",
                                broken_file_error: "The file seems to be broken",
                                browse: "Browse",
                                buy_us_coffee: "Buy us Coffee",
                                by_page_range: "By page range",
                                cancel: "Cancel",
                                cant_be_reached: "Can not be reached",
                                card_number: "Card number",
                                change: "Change",
                                change_effective_date: "Change effective date",
                                char_limit_exceeded_toast: "File name cannot exceed 255 characters",
                                charge: "Charge",
                                chart: "Chart",
                                check_inbox: "Please check your inbox",
                                checkout: "Checkout",
                                choose_a_file: "Choose a file",
                                choose_a_password: "Choose a Password",
                                choose_new_password: "Choose a New Password",
                                choose_payment_option: "Choose a payment option",
                                city: "City",
                                click_to_sort: "Click to sort",
                                collage_maker: "Collage Maker",
                                color_picker: "Color Picker",
                                come_back: "Come back",
                                commitment_to_security: "Our Commitment to Security",
                                complete_registration: "Complete Registration",
                                compress: bK,
                                compress_now_tooltip: dn,
                                compress_videos: "Compress videos",
                                compressing: hH,
                                compression: "Compression",
                                compression_tasks: "Compression Tasks",
                                compressor: hJ,
                                compressors: "Compressors",
                                confirm_password_label: "Confirm Password",
                                contact: "Contact",
                                contact_us: "Contact us",
                                continue: "Continue",
                                conversion: "Conversion",
                                conversion_min_per_month: "Conversion minutes per month",
                                conversion_minute_tooltip: hM,
                                conversion_minutes: "Conversion Minutes",
                                conversion_minutes_avg: "Conversion Minutes (Avg)",
                                conversion_minutes_desc: "Conversion minutes measure how long it takes to process your files. For example, most image, document, or audio conversions takes less than a minute.",
                                conversion_rate_limit_reached: "Conversion rate limit reached",
                                conversion_results: "Conversion Results",
                                conversion_table: "Conversion Table",
                                conversion_tasks: "Conversion Tasks",
                                convert: hK,
                                convert_all_to: "Convert All( LENGTH ) to:",
                                convert_bigger_files_by_upgrading: "Convert even bigger files by upgrading your account",
                                convert_images: "Convert images",
                                convert_more_concurrent_desc: "Upgrade to convert more than MAX files at a time.",
                                convert_more_concurrent_title: hN,
                                convert_more_files: hN,
                                convert_new_tooltip: "Click here to convert a new batch of files",
                                convert_new_tooltip_file: "Click here to convert a new batch of files to TARGET",
                                convert_now_tooltip: "Convert Now!",
                                convert_timezone_text_source: "FreeConvert.com can convert SOURCE to these other time zones:",
                                convert_timezone_text_target: "FreeConvert.com can convert TARGET to these other time zones:",
                                convert_timezone_title_source: "Convert SOURCE to other time zones",
                                convert_timezone_title_target: "Convert TARGET to other time zones",
                                convert_to: "Convert to",
                                converter: hL,
                                converter_archive_converter: "Archive Converter",
                                converter_audio_converter: "Audio Converter",
                                converter_document_converter: "Document Converter",
                                converter_ebook_converter: "Ebook Converter",
                                converter_image_converter: "Image Converter",
                                converter_unit_converter: hO,
                                converter_vector_converter: "Vector Converter",
                                converter_video_converter: "Video Converter",
                                converters: "Converters",
                                converting: "Converting",
                                copied: "Copied",
                                copy: hB,
                                copy_link: "Copy Link",
                                copy_to_clipboard: "Copy to clipboard",
                                copy_trim_pos: "Use current position as",
                                copyright_text: "FreeConvert.comVERSION All rights reserved",
                                coupon_has_expired: "Your coupon has expired",
                                create_free_account: "Create a Free Account",
                                creating_job: "Creating Job",
                                credit_card: "Credit Card",
                                credit_card_wallet: "Credit Cards & Wallets",
                                credits: "Credit",
                                crop_image: "Crop Image",
                                current_plan: "Current Plan",
                                currently_subscribed: "You're currently subscribed to this plan",
                                custom: "Custom",
                                custom_include: "Custom Include",
                                custom_include_helper: "Define range to include the document. Example: 1-4,6-8 or 1-3,6,9-11",
                                custom_include_option_helper: "Enter specific pages or ranges separated by commas. For example: 1, 3, 5–7",
                                custom_plan_builder: "Custom Plan Builder",
                                custom_plan_dialog_title: hP,
                                custom_plan_dialog_title_desc: hQ,
                                custom_plan_subtext: "Pay only what you need with our custom plans",
                                custom_pricing: "Custom Pricing",
                                custom_range: "Custom Range",
                                custom_range_hint: "‘Custom Range’ lets you define specific sets of pages (e.g., 1–3, 5–7), creating a separate file for each range. ‘Pages per PDF’ lets you enter a number to automatically split the PDF into equal parts.",
                                custom_range_split: "Custom Range Split",
                                custom_split: "Custom Split",
                                customize: "Customize",
                                cvc: "CVC",
                                data_security_prioritization_note: "At FreeConvert, we prioritize the security of your data as much as we prioritize seamless file conversions. Our extensive security framework is built on cutting-edge technology and industry-leading practices to ensure your data remains safe, confidential, and available whenever needed. Explore the security measures we’ve implemented to protect your trust.",
                                day: "Day",
                                days: "days",
                                delay: "Delay",
                                delay_tooltip: "How long should this image be displayed? Units are in nanoseconds i.s. 1\u002F100th of a second",
                                delete: "Delete",
                                delete_all_files: "Delete All Files?",
                                delete_all_files_reloaded_warning: "When reloaded, original files will \u003Cstrong\u003Enot\u003C\u002Fstrong\u003E be deleted. Go to \u003Cstrong\u003EDashboard → Tasks\u003C\u002Fstrong\u003E to delete them separately.",
                                delete_all_files_warning: "Are you sure you want to delete files from our servers? This cannot be undone!",
                                delete_all_tooltip: "Delete All Files",
                                delete_file: "Delete file",
                                deleted: "Deleted",
                                directly_on_device_using: "directly on your mobile device using our",
                                dmca_upload_warning: "By proceeding, you agree to our \u003Ca href='TERMS_LINK' target='_blank'\u003ETerms of Use\u003C\u002Fa\u003E.",
                                dmca_url_error: "This URL is from a protected source and may be subject to copyright protection.",
                                document: "Document",
                                documentation: "Documentation",
                                documents: "Documents",
                                donate: "Donate",
                                donate_with_paypal: "Or donate with PayPal",
                                done: "Done",
                                dont_have_account: "Don't have an account?",
                                downgrade: "Downgrade",
                                download: "Download",
                                download_all: "Download All",
                                download_started: hR,
                                download_started_msg: hR,
                                downloaded_to_dropbox: "File is being downloaded to your Dropbox folder. Large files may take a few minutes to download.",
                                downloaded_to_dropbox_ongoing: "File is being downloaded to DropBox.",
                                downloaded_to_google_folder: "File is being downloaded to your Google folder. Large files may take a few minutes to download.",
                                downloaded_to_google_ongoing: "File is being downloaded to Google.",
                                downloading: "Downloading",
                                drive_upload_limit_tooltip: "You can save 3 times per file",
                                drm_protected_file: "This file is protected by DRM and cannot be converted",
                                dropbox: "Dropbox",
                                dropbox_failed: "Saving to Dropbox failed due to permission error. Please click \u003Cb\u003ESave to DropBox\u003C\u002Fb\u003E again and click \u003Cb\u003ESave\u003C\u002Fb\u003E when prompted.",
                                duplicate: "duplicate",
                                duration_must_less_than_max: "COMMON_NAME duration (start-end) must be less than MAX_DURATIONs",
                                electric: "Electric",
                                email_already_used: "This email address is already in use",
                                email_label: "Email",
                                email_pass_combo_not_found: "Email\u002FPassword combination not found!",
                                enable: "enable",
                                end: "End",
                                ending_in: "ending in",
                                energy: "Energy",
                                enter_code_below: "Please enter the code below",
                                enter_password: "Enter Password",
                                enter_pdf_passwords: "Enter passwords to unlock PDF files",
                                enter_pdf_passwords_desc: "To unlock password-protected PDFs, please enter the password for each file in the corresponding field. We cannot make changes to password-protected files without the correct passwords.",
                                enter_preset_name: "Enter preset name",
                                enter_valid_email: "Please enter a valid email",
                                error: hS,
                                error_file_too_big: "Error: File Too big",
                                error_saving_preset: "Error saving preset",
                                errors: hS,
                                even_pages: "Even pages",
                                example: "Example",
                                existing: "Existing",
                                expired: "Expired",
                                expiry_date: "Expiry date",
                                expiry_warning_general: "Converted files are automatically deleted after HOUR hours to protect your privacy. Please download files before they are deleted",
                                explore_file_conversion_tools: "Explore COUNT file conversion tools.",
                                exporting: "Exporting",
                                extract_all: "Extract All",
                                extract_all_hint: "Selected pages will be converted into separate PDF files. XX PDF will be created.",
                                extract_all_pages: "Extract all pages",
                                extract_image_from_pdf: "Extract image from PDF",
                                facebook: "Facebook",
                                failed_to_load_payment_method: "Unable to load Payment Methods",
                                feedback_failed_submit: "Unfortunately, your feedback has not been successfully submitted. Please try again.",
                                feedback_submit_successfully: "Your feedback has been successfully submitted.",
                                field_required: "This field is required",
                                file: "File",
                                file_converters: hT,
                                file_name: "File name",
                                file_removed_after_time_for_privacy: "File removed after HOUR hours for privacy.",
                                file_saved_to: "File saved to",
                                file_size: hU,
                                file_size_too_big: "File size SIZE is too big for account type",
                                files: "files",
                                fill_required: "please fill the required fields",
                                finishing_upload: "Finishing Upload",
                                fix_num_page_per_pdf: "Fixed number of pages per PDF",
                                flatten: "Flatten",
                                flexible: "Flexible",
                                flip_image: "Flip Image",
                                footer_link_title_archive_and_time: "Archive & Time",
                                footer_link_title_document_and_ebook: "Document & Ebook",
                                forgot_password: "Forgot password",
                                formula: "Formula",
                                free_user_limit_per_file: "Free users can process a file up to MINUTES minutes. Some of your large files may reach this limit. Please consider upgrading to avoid disruptions.",
                                free_user_password_set: "Free user Password set",
                                frequency: "Frequency",
                                frequently_asked_questions: "Frequently Asked Questions",
                                from: "from",
                                from_device: "From Device",
                                from_dropbox: "From Dropbox",
                                from_google_drive: "From Google Drive",
                                from_onedrive: "From OneDrive",
                                from_url: "From Url",
                                gdrive_saved_to_original_folder: "Saved to original folder",
                                gdrive_saved_to_root_folder: "Saved to the root folder",
                                generate_qr: "Generate QR Code",
                                generate_qr_tooltip: "Generate a QR Code for the download link.",
                                generating: "Generating",
                                get_it_on_mobile: "Get it on Mobile",
                                get_n_months_free: "Get N months free",
                                get_started: "Get Started",
                                gif_converters: hV,
                                gif_maker: "GIF Maker",
                                go_back: "Go back",
                                google_drive: "Google Drive",
                                google_drive_promote_alert_part1: "Try our",
                                google_drive_promote_alert_part2: "Google Drive App",
                                google_drive_promote_alert_part3: "to process files directly from Google Drive.",
                                google_permission_error: "Saving to Google Drive failed due to permission error.Please REGRANT and try again. Learn how to with this SCREENSHOT",
                                half_pages: "Half pages",
                                height: "height",
                                hide_password: "Hide Password",
                                high: "High",
                                highest: "Highest",
                                home: "Home",
                                home_specific_tools_description: "FreeConvert.com can convert yourTARGET files to these other formats",
                                homepage_security_description: "At FreeConvert, we go beyond just converting files—we protect them. Our robust security framework ensures that your data is always safe, whether you're converting an image, video, or document. With advanced encryption, secure data centers, and vigilant monitoring, we've covered every aspect of your data's safety.",
                                homepage_security_title: "Your Data, Our Priority",
                                hours: "hours",
                                how_many_conversion_min_need_monthly: "How many Conversion Minutes you need for a month (Average)",
                                how_many_conversion_min_need_monthly_desc: "Simply multiply the average number of files you need to convert or compress by conversion minutes to get an idea about your monthly conversion minutes requirement",
                                how_refunds_work: "How Refunds Work",
                                how_refunds_work_desc: "The refund amount—whether \u003Cstrong\u003Epartial\u003C\u002Fstrong\u003E or \u003Cstrong\u003Efull\u003C\u002Fstrong\u003E—is determined based on your package price and the specific circumstances. Our team will review your request to ensure a fair and timely resolution.",
                                how_to_convert: "How to convert",
                                if_account_exist_email_send: "If an account exists for \u003Cstrong\u003EEMAIL\u003C\u002Fstrong\u003E, we will email you further instructions.",
                                image_enlarger: "Image Enlarger",
                                image_resizer: "Image Resizer",
                                importing: "Importing",
                                in_all_paid_plans: "In All Paid Plans",
                                in_px_max: "in px (max: X)",
                                in_sec_max: "in sec (max: X)",
                                include: "Include",
                                incorrect_password: "Incorrect password",
                                increased: "Increased",
                                ineligible_locale_user_banner_text: "Your existing plan(s) purchased in CURRENCY are incompatible with our new localized currency plans. If you wish to switch to a localized plan, cancel your active plans and CONTACT_US for refunds.",
                                input_file: "Input File",
                                input_must_be_color_picker: "Input must be a valid color. Example: #FFFFFF",
                                interrupted: "Interrupted",
                                interrupted_has_internet: "An error occurred when STEP_NAME. Reason: REASON",
                                interrupted_no_internet: "An error occurred when STEP_NAME due to a connectivity issue. It will resume when connectivity is back.",
                                invalid: "Invalid",
                                invalid_range: "Invalid Range",
                                invalid_raw_audio_message: "Not a valid raw audio file",
                                invalid_raw_image_message: "Not a valid raw image file",
                                invalid_request: "Invalid Request",
                                invalid_url: "Invalid URL",
                                invite_members: "Invite Members",
                                ios_video_compressor: "iOS Video Compressor",
                                job_already_deleted: "This job is already deleted",
                                job_deleted: "Job deleted",
                                key: "web_apps",
                                label_feedback_write: "write your feedback.",
                                landscape_pages: "Landscape Pages",
                                largest_file_size_fc: "Unfortunately, this is the largest file size supported by FreeConvert",
                                learn_more_about_security: "Learn more about our commitment to security",
                                left: "Left",
                                left_margin: "Left Margin",
                                left_margin_tooltip: "Set the horizontal image position from the top left corner (A positive value moves the image right, while a negative value moves it to the left).",
                                legacy_user_banner: "Your legacy plan(s) are incompatible with our new pricing plans. If you proceed, all your active plans will be canceled. Please CONTACT_US for refunds.",
                                length: "Length",
                                limit_reached: "Limit Reached",
                                limit_reached_desc: "You’ve used up all MINUTES NAME conversion credits.",
                                limit_reached_free_desc: "NAME users get LIMIT conversion minutes per file.",
                                link_to_this_tool: "Link to this tool",
                                linkedin: "Linkedin",
                                load: "Load",
                                loaded: "Loaded",
                                loading: hW,
                                loading_the_presets_is_premium: "Loading advanced options from a preset is a premium feature. Please",
                                login_and_continue: "Use below options to Login and continue",
                                login_here: "login here",
                                login_success_msg: "You have successfully logged in!",
                                login_temporarily_disabled: "Further login attempts are disabled for 1 hour",
                                logout_msg: "You have logged out of your account.",
                                mail_us: "Mail us",
                                manage_billing: "Manage Billing",
                                manage_presets: "Manage presets",
                                manual: "Manual",
                                manual_selection: "Manual Selection",
                                manual_split: "Manual Split",
                                max_dimension_warning: "Maximum X should be N UNIT",
                                max_file_exceed_toast: "Only up to LIMIT files can be selected.",
                                max_size_web_processing: "Max file size (for web processing)",
                                max_time_per_task: "Max processing time per task",
                                merge: "Merge",
                                merge_all_into_one: "Merge all files into one",
                                merge_all_into_one_pdf: "Merge all files into one PDF",
                                merge_into_one: hX,
                                merge_limit_exceeded_text: "Your account type lets you merge LIMIT files at a time. Upgrade for more.",
                                merge_limit_exceeded_title: "Upgrade to merge more files",
                                merge_limit_reached_tooltip: "NAME accounts can merge up to LIMIT files",
                                merge_options: "Merge Options",
                                merge_output_files: "Merge Output Files",
                                merge_pdf_helper: "Enable this option to combine all uploaded and modified files into a single PDF upon export. If unchecked, each file will be exported separately.",
                                merge_tooltip: "Merge them all into one",
                                merging: "Merging",
                                mid_conversion_upgration_prompt_text: "We will automatically resume your tasks once you upgrade.",
                                mid_conversion_upgration_prompt_title: "Go Ahead and Upgrade",
                                midnight: "midnight",
                                min_dimension_warning: "Minimum X should be N UNIT",
                                minute: "Minute",
                                minutes: "Minutes",
                                minutes_automatically_renew: hY,
                                missing_ext_submit_error: "Up to NUM alpha-numerals allowed.",
                                missing_ext_submit_helper: "Enter a file format (i.e .mp3)",
                                mobile_apps: "Mobile Apps",
                                money_back_guarantee: "100% Money Back Guarantee",
                                money_back_guarantee_desc: "At FreeConvert, we take pride in offering a service you’ll love and rely on. Our top priority is your satisfaction, so we offer a \u003Cstrong\u003E100% money-back guarantee\u003C\u002Fstrong\u003E to ensure a worry-free experience.",
                                money_back_guarantee_satisfaction: "100% Money-Back Guarantee for Your Satisfaction",
                                month: "month",
                                monthly: "Monthly",
                                more: "More",
                                more_options: "More Options",
                                n_days: "N days",
                                n_months_free: "N months free",
                                n_sec_left: "N sec left",
                                name_or_business: "Name or Business",
                                navigation_link_item_account: "Account",
                                navigation_link_item_activity: "Activity",
                                navigation_link_item_api: hZ,
                                navigation_link_item_api_keys: "API Keys",
                                navigation_link_item_billing_plan: "Billing Plan",
                                navigation_link_item_converters: hT,
                                navigation_link_item_dashboard: "Dashboard",
                                navigation_link_item_faq: "FAQ",
                                navigation_link_item_invoice: "Invoice",
                                navigation_link_item_jobs: "Jobs",
                                navigation_link_item_my_account: "My Account",
                                navigation_link_item_my_files: "My Files",
                                navigation_link_item_notifications: "Notifications",
                                navigation_link_item_payment_method: h_,
                                navigation_link_item_pricing: "Pricing",
                                navigation_link_item_tasks: "Tasks",
                                navigation_link_item_team: "Team",
                                navigation_link_item_tools: "Tools",
                                navigation_link_item_webhooks: "Webhooks",
                                new_payment_method: "Add a new payment method",
                                new_size_tooltip: "New size",
                                no_of_pages: "Number of pages",
                                no_of_pages_hint: h$,
                                no_of_pages_per_pdf: "No of pages per PDF",
                                no_preset_msg: "You have not saved any presets yet",
                                none: hy,
                                noon: "noon",
                                not_authorized: "Not Authorized",
                                not_eligible_for_24h_plan: "Monthly subscribers can not purchase 24-h (one-time) plan",
                                ocr_converter: "OCR Converter",
                                odd_even_pages: "Odd\u002FEven pages",
                                odd_pages: "Odd pages",
                                of: "of",
                                off_discount: "off discount",
                                ok: "Ok",
                                old_size_tooltip: "Old size",
                                on_demand: "On-Demand",
                                one_time: "one-time",
                                onedrive_failed: "Saving to OneDrive failed. Please click \u003Cb\u003ESave to OneDrive\u003C\u002Fb\u003E again.",
                                open_drive_folder: "Open Google Drive",
                                open_drive_folder_tooltip: "Your processed files will be stored in the original Google Drive folder",
                                optinal: "Optinal",
                                optional: "Optional",
                                order_review: "Order Review",
                                others: "Others",
                                our_user_loves_us: "Our Users Love Us",
                                out_of_conversion_minutes: "Out of conversion minutes",
                                out_of_conversion_minutes_per_task: "SUBSCRIPTION users get LIMIT conversion minutes per file.",
                                output: "Output",
                                output_file: "Output File",
                                owners_can_not_be_removed: "Owners can not be removed",
                                package_automatically_renew: hY,
                                package_conversion_minutes: "conversion minutes",
                                package_conversion_minutes_hint: hM,
                                package_conversion_minutes_n: "Up to LIMIT conversion mins",
                                package_conversions_at_a_time: "conversions at a time",
                                package_credit_hint: "Credits allow you to add conversion minutes to your account as needed. This is a one-time charge, and any unused credits will expire 30 days after purchase.",
                                package_file_size: hU,
                                package_has_ads: "Has Ads",
                                package_max_file_size_hint: "The Max file size limit is only applicable if you are using our web interface. For API users, we do not enforce a maximum file size",
                                package_maximum_file_size: "maximum file size",
                                package_maximum_file_size_n_gb: "Up to LIMIT max file size",
                                package_merge_limit: "Can merge MERGE_LIMIT files at a time",
                                package_never_expire: ia,
                                package_no_ads: "No Ads",
                                package_one_time_duration: "\u002F One Time",
                                package_per_month_duration: "\u002FMonth (cancel any time)",
                                package_per_year_duration: "\u002FMonth, paid annually",
                                package_priority_text: "priority",
                                package_up_to: "Up to",
                                package_video_encoding_text: "based video encoding",
                                page_include_option_helper: "Choose which pages you want to Merge. You can merge all pages or specific ones.",
                                page_not_found: "Page not found",
                                page_numbers: "Page Numbers",
                                page_per_pdf: ib,
                                pages: "Pages",
                                pages_per_pdf: ib,
                                pages_per_pdf_hint: ic,
                                pages_per_pdf_pages_hint: h$,
                                pages_to_merge: "Pages to Merge",
                                pages_to_rotate: "Pages to Rotate",
                                paid_annually: "paid annually",
                                password_change_success: "Your password has changed successfully! Please login.",
                                password_label: "Password",
                                passwords_do_not_match: "Passwords do not match",
                                pay: "Pay",
                                payment: "Payment",
                                payment_authentication_failure: "Payment Authentication Failed!",
                                payment_failed: "Payment Failed",
                                payment_incomplete: "Pending: click the activation link to finish",
                                payment_method: h_,
                                payment_processing: "Your payment is waiting for the approval from Stripe",
                                payment_succeeded: "Payment Succeeded!",
                                payments_are_secured_with: "Payments are secured with",
                                paypal: "Paypal",
                                paypal_title: "PayPal - The safer, easier way to pay online!",
                                pdf_invalid_error: "Error: NAME file is broken, please recheck the file.",
                                pdf_options: "Pdf Options",
                                pending_connection: "Pending Connection",
                                pending_subscription: "You have a pending subscription to this plan",
                                plan: "Plan",
                                plan_feature: "Plan Features",
                                plan_not_selected: "Plan has not selected",
                                please_wait: "Please Wait",
                                please_wait_for_video_load: "Please wait for the video to load",
                                popular: "Popular",
                                portrait_pages: "Portrait Pages",
                                power: "Power",
                                practices: "Practices",
                                prepare_for: "Prepare for",
                                preparing_file: hW,
                                preset_name_character: "Preset name can only contain alphanumeric characters, spaces, and dashes.",
                                preset_name_empty: "Preset name cannot be empty.",
                                preset_name_exists: "Preset name already exists.",
                                price: "Price",
                                price_api_slider_label: "How many conversion minutes do you need?",
                                pricing_header: "Convert more for less",
                                pricing_header_sub: "Quickly convert large files in blazing fast speeds.",
                                pricing_tab_api: hZ,
                                pricing_tab_web: "Web",
                                privacy: "Privacy",
                                pro_advanced_option_selected: "You have selected a Pro feature",
                                pro_video_codec_helper_text: "Use GPU-based codecs, available in pro and on-demand plans, to process your videos extremely fast and save money.",
                                process_completion_timeout: "Process completion timeout",
                                processing_video_wait: "Processing Video, This may take few minutes",
                                product: "Product",
                                prorated_discount: "Prorated Discount",
                                prove_you_human: "Please prove that you are a human.",
                                purchased_already: "You are currently on this plan.",
                                range: "Range",
                                range_out_of_bound: "Range is out of bound",
                                range_type: "Range Type",
                                range_type_hint: ic,
                                ranges: "Ranges",
                                rate_us: "Rate Us!",
                                rated: "Rated",
                                rated_x_on_y_reviews: "Rated \u003Cstrong\u003EX\u003C\u002Fstrong\u003E\u002F5 based on \u003Cstrong\u003E\u003Cspan\u003EY reviews\u003C\u002Fstrong\u003E. Showing our lates reviews,",
                                re_load: "Re-load",
                                re_load_file: "Re-load file",
                                re_load_files: "Re-load files",
                                re_load_files_tooltip: "Re-load your files and try new settings for conversion.",
                                re_load_tooltip: "Re-load your file and try new settings for conversion.",
                                re_load_tooltip_disabled: "This file has expired and cannot be reloaded.",
                                read_less: "Read Less",
                                read_more: "Read More",
                                ready: "Ready",
                                recover_password_here: "Recover password here",
                                reddit: "Reddit",
                                redownload: "Re-download",
                                refund_qualification_1: "\u003Cstrong\u003ENo Usage in the Last Month:\u003C\u002Fstrong\u003E You're eligible for a refund if you haven’t used our services in the past month.",
                                refund_qualification_2: "\u003Cstrong\u003EConversion Issues:\u003C\u002Fstrong\u003E If your file conversions fail and our team confirms the issue, you can request a refund.",
                                refund_qualification_3: "\u003Cstrong\u003EUnresolved Bugs:\u003C\u002Fstrong\u003E We'll refund you if you report a bug that isn’t fixed promptly.",
                                regrant_permission: "re-grant permission",
                                rejected: "Rejected",
                                related_tools: "Related Tools",
                                remember_me_label: "Remember Me",
                                remove_file: "Remove File",
                                report: "Report",
                                request_sent_check_email: "Request Sent. Check verification code in your email.",
                                required_info: "fields marked with * required",
                                resend_button_text: "Click here to request a new verification code",
                                resend_button_text_wait: "Please wait TIME before requesting a new code",
                                reset: "Reset",
                                reset_all: "Reset all options",
                                reset_password_button_text: "Reset Password",
                                resize_image: "Resize Image",
                                restarting_upload: "Restarting Upload",
                                restricted_url: "Restricted URL",
                                reviews: "reviews",
                                right: "Right",
                                rorate_left: "Rotate Left",
                                rorate_right: "Rotate Right",
                                rotate: "Rotate",
                                rotate_direction: "Rotate direction",
                                rotate_image: "Rotate Image",
                                rotate_options: "Rotate Options",
                                save: "Save",
                                save_ao_as_preset: "Save advanced options as preset",
                                save_as: "Save As",
                                save_as_preset: "Save as Preset",
                                save_to: "Save to",
                                save_to_device: "Save to Device",
                                save_to_dropbox: "Save to Dropbox",
                                save_to_gdrive: "Save to Google Drive",
                                save_to_tooltip: "Save to OPTION (limit: LIMIT time)",
                                saved: "Saved",
                                saving: "Saving",
                                saving_the_presets_is_premium: "Saving advanced options as a preset is a premium feature. Please",
                                saving_to: "Saving to",
                                scale_your_plan_to_fit: hP,
                                scale_your_plan_to_fit_desc: hQ,
                                scan_qr_from_mobile: "Scan QR from the mobile",
                                scan_qr_to_download: "Scan the QR code to download this file to mobile device.",
                                screenshot: "screenshot",
                                search: "Search",
                                searching: "Searching...",
                                secured_data_centers: "Secured Data \u003Cbr\u002F\u003ECenters",
                                security_and_compliance: "Security and Compliance",
                                select: "Select",
                                select_conversion_output: "Select conversion output",
                                select_country: "Select Country",
                                select_custom_plan: "How many conversion minutes do you need",
                                select_datetime: "Select TIMEZONE Time",
                                select_files_to_convert: "Please select your files to convert",
                                select_include: "Select Include",
                                select_include_helper: "Select which pages to include on the final PDF",
                                select_plan: "Select Plan",
                                select_preset: "Select Preset",
                                select_preset_msg: "Please select a preset from dropdown.",
                                select_range: "Select Range",
                                select_split_mode: "Select Split Mode",
                                send_feedback: "Send Feedback",
                                send_verification_code: "Send Verification Code",
                                server_error: "Server Error",
                                settings_applied: "Settings applied to the file",
                                settings_applied_all: "Settings applied to all applicable files",
                                sharing_is_caring: "Sharing is caring",
                                show_original_translation: "Show original (English)",
                                show_password: "Show password",
                                showing_latest_reviews: "Showing our latest reviews",
                                signup_and_continue: "Use below options to signup and continue",
                                signup_button_text: "Create my account",
                                signup_here: "Sign up here",
                                site_news_and_updates: "Site News and Updates",
                                site_search_no_matches_found: "No matches found.",
                                site_search_temporarily_unavailable: "Search is temporarily unavailable.",
                                size: "Size",
                                size_exceeded: "Size Exceeded",
                                size_increased: "Size increased",
                                size_same: "Size is same",
                                skip: "skip",
                                slider_helper_text: "Please set a value between",
                                slug_other_group_description: "FreeConvert.com can convert your TARGET files to these other formats:",
                                slug_other_group_title: "Convert TARGET to other file types",
                                slug_other_single_description: "FreeConvert.com can convert your other files to TARGET format:",
                                slug_other_single_title: "Convert other files to TARGET format",
                                slug_related_description: "FreeConvert.com can convert your files to these related formats:",
                                slug_related_single_title: "Related TARGET converters",
                                slug_specific_group_description: "While this page can convert any TARGET_GROUP to TARGET_NAME, you may wish to visit following Converter pages that only support specific conversions",
                                slug_specific_group_title: "Specific TARGET converters",
                                slug_specific_single_description: id,
                                slug_specific_single_title: "Convert Your SOURCE files to other formats",
                                small_file_popup_body_content: "It looks like one of the files you selected is less than 1 Kilobyte! This will probably fail to convert. Please let us know more information about these file(s). Such as; is the file less than 1KB in your system? Did you download this file from somewhere or create it using software, if so, please send details. Your response will help us log this matter quickly.",
                                small_file_popup_files_info: "File: TARGETFILENAME",
                                small_file_popup_title_content: "Your file appears to be too small",
                                socket_offline: "Offline: Pending tasks will resume when connected",
                                socket_online: "Network connected. You are now online.",
                                something_went_wrong: "Something went wrong!",
                                specific: "Specific",
                                specific_converter_text_group: "While this page can convert any TARGET_GROUP to TARGET, you may wish to visit following Converter pages that only support specific conversions",
                                specific_converter_text_single: id,
                                split: "Split",
                                split_by_range: "Split by Range",
                                split_in_half: "Split in half",
                                split_mode: "Split Mode",
                                split_mode_hint: "Split lets you divide your PDF into smaller parts. Select a mode to decide how the pages will be split.",
                                split_options: "Split Options",
                                split_per_pdf_helper: "Give number of pages you need per document",
                                split_range_helper: "Define page ranges to split the document",
                                ssl_tls_encryption: "SSL\u002FTLS \u003Cbr\u002F\u003EEncryption",
                                start: "Start",
                                start_end_time_not_same: "Start time and end time can not be same",
                                start_searching: "Start searching by entering the file type you want to convert. Example",
                                start_time_less_than_end_time: "Start time should be always less than end time",
                                state_or_province: "State or Province",
                                status: "Status",
                                statusText: K,
                                storage_quota_exceeded: "Account reached max storage.",
                                stripe_msg_default: "The package will be activated after we are able to charge your card",
                                stripe_msg_processing: "Upgrade is waiting for approval from Stripe",
                                stripe_msg_requires_action: "Upgrade is waiting for 3D secure payment approval",
                                stripe_msg_requires_payment_method: "Upgrade is waiting for payment method approval",
                                stripe_proration_tooltip: "Prorated discounts are auto-applied if you upgrade using the same credit card. If you paid via PayPal or are using a different credit card for the upgrade, please contact support for a manual proration refund.",
                                stripe_status_processing: "Processing",
                                stripe_status_requires_action: "Authentication Required",
                                stripe_status_requires_payment_method: "Requires Payment Method",
                                submit: "Submit",
                                submit_urls: "Submit the URLs",
                                submitted: "Submitted",
                                submitting: ie,
                                suggest: "Suggest",
                                suggest_output_for_file: "Suggest an output file format for .EXT files",
                                sumitting: ie,
                                target_selector_help: "Only the common target formats are shown. Use file card's output dropdown to see more option.",
                                target_selector_search_placeholder: "Search Format",
                                target_warning_tooltip: "Please select a target for each file or remove unsupported files",
                                task_already_canceled: "This task is already canceled",
                                task_already_deleted: "This task is already deleted",
                                tax_or_vat_id: "Tax\u002FVAT ID",
                                technology: "Technology",
                                temperature: "Temperature",
                                terms: if0,
                                terms_label: "By creating an account you are agreeing to our",
                                terms_of_service: if0,
                                thank_you: "Thank you",
                                this_must_contain: "THIS must contain",
                                time: "Time",
                                time_cant_be_greater_than_duration: "Start\u002Fend time can not be negative or greater than video duration",
                                time_converter: "Time Converter",
                                time_converter_change_notice: "SOURCE changed to TARGET which is in use now",
                                time_converter_other_zone_desc: "FreeConvert.com can convert TIME to these other time zones:",
                                time_converter_other_zone_title: "Convert TIME to other time zones",
                                time_copy_tooltip: "Get a static link to the time shown above",
                                to: "to",
                                toggle: "Toggle",
                                toggle_view_pages: "Toggle View Pages",
                                token_label: "Token",
                                tool: do0,
                                tool_compress_jpeg: "JPEG Compressor",
                                tool_compress_pdf: "PDF Compressor",
                                tool_compress_png: "PNG Compressor",
                                tool_crop_video: "Crop Video",
                                tool_image_compressor: "Image Compressor",
                                tool_title_converters: hV,
                                tool_title_file_compressor: "File Compressors",
                                tool_title_video_tools: "Video Tools",
                                tool_video_compressor: bA,
                                tool_video_trimmer: "Trim Video",
                                top_margin: "Top Margin",
                                top_margin_tooltip: "Set the vertical image position from the top left corner (A positive value moves the image down, while a negative value moves it up).",
                                total: "Total",
                                total_price: "Total price",
                                translate: "Translate",
                                trim: "Trim",
                                try_advance_settings: "Try Advanced Settings",
                                try_again: "Please, try again!",
                                try_free_text: "Want to convert large files without a queue or Ads?",
                                try_free_upgrade: "Upgrade Now",
                                try_job_builder: "Try Job Builder",
                                twitter: "Twitter",
                                type_anything_to_search: "Type anything to search",
                                unable_to_sign_up: "Unable to sign up",
                                unauthorized: "Unauthorized",
                                unit_converter: hO,
                                unit_converter_subtext: "Select a converter and enter a value to convert",
                                unit_links_desc: "FreeConvert.com can convert NAME to these other formats:",
                                unit_links_header: "Convert NAME to other TYPE units",
                                unit_page_subheading: "Enter a value below and we will automatically convert it to",
                                unit_page_table_label: "Enter any unit value to convert",
                                unlimited: "Unlimited",
                                unlock: "Unlock",
                                unselected: "Unselected",
                                unselected_group_helper: "These are pages you chose not to include in the split. You can move them back into any range to include them in a new PDF.",
                                unsupported_pro_codec: "Your current plan does not support Pro codecs.",
                                unused_minutes_never_expire: ia,
                                update_billing_info: "Update Billing Info",
                                updated: "Updated",
                                upgrade: "Upgrade",
                                upgrade_for_more: "Upgrade for more",
                                upgrade_here: "upgrade here",
                                upgrade_recommended: "Upgrade Recommended",
                                upgrade_recommended_desc: "Some of your large files may take longer than the NAME usage limit (LIMIT mins per file)",
                                upgrade_to_convert_bigger_file: "Please, upgrade to convert bigger files",
                                upgrade_to_pro: "Upgrade to Pro",
                                upload_failed: "Upload Failed",
                                upload_timeout: "Upload Failed. Please try again.",
                                uploaded: "Uploaded",
                                uploader_text_add_more_files: "Add More Files",
                                uploader_text_automatically_removed_files: "We have automatically removed files that are bigger than",
                                uploader_text_choose_files: "Choose Files",
                                uploader_text_choose_new_file: "Choose new File",
                                uploader_text_drop_file_here: "Or drop file here",
                                uploader_text_drop_files_here: "Or drop files here",
                                uploader_text_enter_webpage: "Enter Webpage",
                                uploader_text_file_too_big: "File too big",
                                uploader_text_for_more: "for more",
                                uploader_text_max_file_size: "Max file size",
                                uploader_text_merge_into_one: hX,
                                uploader_text_merge_invalid_file: "Invalid file",
                                uploader_text_rest_will_continue_uploading: "Rest of your files will continue uploading",
                                uploader_text_smaller_files_will_continue: "Smaller files will continue to upload",
                                uploader_text_type_not_supported: "Following file type(s) are not supported",
                                uploader_text_valid_types_are: "Valid file types are",
                                uploading: "Uploading",
                                uploading_from_google_drive: "File(s) are being uploaded from Google Drive",
                                url_must_extensions: "URL must end in an allowed extension. Allowed extentions are ",
                                url_not_empty: "URL can not be empty.",
                                url_not_start_with: "URLs should start with http:\u002F\u002F or https:\u002F\u002F",
                                use_current_position: "Copy Player Time",
                                use_for_web_and_api: "Use for Web and API",
                                user_deleted_task: "Task deleted by the user",
                                valid: "Valid",
                                valid_for_hour: "valid for HOUR hour",
                                validating_upload: "Validating Upload",
                                verified: "Verified",
                                video: "Video",
                                videos: "Videos",
                                view_pages: "View Pages",
                                view_pages_to_see_options: "Turn on ‘View Pages’ in the top toolbar to enable page selection options for merging.",
                                voltage: "Voltage",
                                wait_till_page_loaded: "Please wait till all the pages are loaded",
                                wait_until_all_files_loaded: "Wait until all the files are loaded",
                                wait_until_all_files_loaded_preview: "Please wait while we load all your files",
                                waiting: "Waiting",
                                want_more_features: "Want more features?",
                                warning_team_member_can_not_upgrade: "Your are part of team \u003Cstrong\u003ETEAM_NAME\u003C\u002Fstrong\u003E \u003Cnuxt-link to=\"\u002Faccount\u002Fteam\"\u003E(manage)\u003C\u002Fnuxt-link\u003E. Team members can not purchase pro packages",
                                we_emailed_code: "We have emailed you a registration code to your email",
                                we_stand_by_our_service: "We Stand By Our Service",
                                we_stand_by_our_service_desc: "We’re confident you’ll be pleased with our services, like millions of users worldwide. But if things don't go as expected, we’ve got you covered with a guarantee designed for your peace of mind.",
                                web_apps: "Web Apps",
                                weight: "Weight",
                                width: "width",
                                year: "year",
                                yearly: "Yearly",
                                yes: "Yes",
                                yes_delete: "Yes, Delete",
                                you_are_lost: "Looks like you are lost!",
                                your_files_reloading: "Your files are being reloaded",
                                zip_or_postal: "Zip or Postal Code",
                                zoom: "Zoom"
                            }
                        }
                    }
                }
            }(false, 0, "en", "67db7cc6da6800a5b49e4299", "67e0de5a389acf4819fb3ab7", "62302a895fce692cb056452c", "62302c435fce692cb056465a", true, "col-xs-12", "67e0de7d9a5a055c5f8cd70a", null, "18", "67e0ddee389acf4819fb3720", "select", "input_must_be_select", "19", "22", "23", "24", "25", "26", "27", "29", "30", "31", "32", "34", "35", "37", "38", "20", "33", "36", "number", "21", "62302b755fce692cb05645cc", "", "602a9df886eb7a0023f187b7", "602a9f6c86eb7a0023f187bf", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "12", "13", "14", "15", "16", "17", "67db7d7f9095010ce6b0f767", 3, "602a9f6c86eb7a0023f187c1", "28", "62302b6a5fce692cb05645c4", "5", ".mp4", "602a9df886eb7a0023f187b8", "string", "0", "2000", 25, "603f2c1dae88b11070f72577", 4, "10", "11", 18, 19, "658a68d34da89470ea2fa0a5", "603f2c1dae88b11070f72579", "603f2c1dae88b11070f7257e", "602a9f6c86eb7a0023f187bd", "602a9f6c86eb7a0023f187c0", "51", "602bccc1908d4e00230340ce", 20, 21, 22, 23, 24, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, "Slower speeds yield better compression\u002Fquality. However, they use more credits. We recommend \"Very Fast\" which balance both quality and speed.", "1", "2", "3", "623029805fce692cb0564477", "602a9df886eb7a0023f187b9", "62302cda5fce692cb05646c2", "Select Quality (CRF)", "67e0d81912a92abd4b4fbe78", "Higher CRF values compress more (at the expense of lower video quality)", "text", "\u002F^[0-9]d*\u002F", "67d7eca06768e7873848bfc1", "602bc68e908d4e0023034077", "602bc51a908d4e002303405a", "67e0dc4112a92abd4b4fbf6e", "602bc967908d4e00230340bc", "67e0d2ec12a92abd4b4fbcae", "67d7f1156768e7873848c33a", "602beddc98c6e90023d064bb", "65783e533b3bc02dc9aa7424", "Video Compressor", "603f2c1dae88b11070f7257a", "67df6e90d072ec808f903a37", "67df6e90d072ec808f903a39", "67d7e4106768e7873848b83c", "video_compression_resize_method", "623028fe5fce692cb056441d", "602bccc1908d4e00230340d1", "video-compressor", "\u002Fvideo-compressor", "Compress", "video_codec_compress", "libx264", "h264_nvenc", "libx265", "hevc_nvenc", "av1_nvenc", "602a9f6c86eb7a0023f187bc", "compress_video", "by_percentage", "by_size", "602a9f6c86eb7a0023f187be", "by_video_quality", "by_resolution", "by_max_bitrate", "video_compress_crf_h264_nvenc", "\u002F^(18|19|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|44|45|46|47|48|49|50|51)$\u002F", "preset_resolutions", "by_width_keep_ar", "602bccc1908d4e00230340cf", "by_height_keep_ar", "602bccc1908d4e00230340d0", "by_width_height", "video_custom_width_compress", 10000, "video_custom_height_compress", "video_compress_crf_av1_nvenc", "video_compress_crf_x264", "video_compress_quality_percentage", "video_compress_crf_x265", "video_compress_crf_hevc_nvenc", "video_compress_max_bitrate", "video_compress_speed", "Compression Speed", "ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow", "slower", "veryslow", "video_compress_max_filesize", "video_compress_speed_h264_hevc_nvenc", "4", "6", "video_compress_speed_av1_nvenc", "video_compressor_bufsize", "video_compression_resolution_preset", "7680:4320", "3840:2160", "2560:1440", "1920:1080", "1366:768", "1280:720", "1152:648", "1024:576", "720:480", "480:360", "352:240", "256:144", "isCompatibleWithOldDevices_compress", "658a67f8d661c36bcd6cd4fe", "subtitle_add", "none", "658a6a204da89470ea2fa1ed", "copy", "upload", "subtitle", "subtitle_mode", "hard", "soft", "\u002F", 60, void 0, "ToolTemplate", "Video Compressor | Reduce Video File Size Online", "A fast online video compressor to reduce video file size. You can compress video to a desired file size or a quality level. Supports MP4, FLV, MKV and more.", "World's best video compressor tool to reduce video file size", "\u003Ch2\u003EHow To Compress a Video?\u003C\u002Fh2\u003E\n\u003Col\u003E\n\u003Cli\u003E\u003Cspan class=\"n\"\u003EClick the “Choose Video” button to select your video file\u003C\u002Fspan\u003E&nbsp;\u003C\u002Fli\u003E\n\u003Cli\u003E\u003Cspan class=\"n\"\u003EKeep the default options (they do a great job!) or specify advanced options\u003C\u002Fspan\u003E&nbsp;\u003C\u002Fli\u003E\n\u003Cli\u003E\u003Cspan class=\"n\"\u003EClick on the “Compress Video” button to start compression\u003C\u002Fspan\u003E&nbsp;\u003C\u002Fli\u003E\n\u003Cli\u003E\u003Cspan class=\"n\"\u003EWhen the status change to “Done” click the “Download Video” button\u003C\u002Fspan\u003E&nbsp;\u003C\u002Fli\u003E\n\u003C\u002Fol\u003E\n\n\u003Cp\u003EWorld's best video compressor to compress MP4, AVI, MKV, or any other video file. Choose the default options to compress video size by 40%, or choose a custom size.\u003C\u002Fp\u003E\n\n", {}, {}, {}, 1, "Compress Now!", "Tool", Array(2), "603f2c1dae88b11070f7258a", "603f2c1dae88b11070f72584", "18 Best Quality - Large Size", "67e0d81912a92abd4b4fbe75", "67e0d81912a92abd4b4fbe76", "67e0d81912a92abd4b4fbe77", "67e0d81912a92abd4b4fbe79", "67e0d81912a92abd4b4fbe7a", "67e0d81912a92abd4b4fbe7b", "67e0d81912a92abd4b4fbe7c", "67e0d81912a92abd4b4fbe7d", "67e0d81912a92abd4b4fbe7e", "67e0d81912a92abd4b4fbe7f", "67e0d81912a92abd4b4fbe80", "67e0d81912a92abd4b4fbe81", "67e0d81912a92abd4b4fbe82", "67e0d81912a92abd4b4fbe83", "67e0d81912a92abd4b4fbe84", "67e0d81912a92abd4b4fbe85", "67e0d81912a92abd4b4fbe86", "67e0d81912a92abd4b4fbe87", "67e0d81912a92abd4b4fbe88", "67e0d81912a92abd4b4fbe89", "67e0d81912a92abd4b4fbe8a", "67e0d81912a92abd4b4fbe8b", "67e0d81912a92abd4b4fbe8c", "67e0d81912a92abd4b4fbe8d", "67e0d81912a92abd4b4fbe8e", "67e0d81912a92abd4b4fbe8f", "67e0d81912a92abd4b4fbe90", "67e0d81912a92abd4b4fbe91", "67e0d81912a92abd4b4fbe92", "67e0d81912a92abd4b4fbe93", "67e0d81912a92abd4b4fbe94", "67e0d81912a92abd4b4fbe95", "67e0d81912a92abd4b4fbe96", "67e0d81912a92abd4b4fbe74", "602bccc1908d4e00230340cd", "Enter video width in pixels (0 - 10000). If no height is specified, we will keep the video's aspect ratio intact.", "Enter video height in pixels (0 - 10000). If no height is specified, we will keep the video's aspect ratio intact.", 5, "67d7eca06768e7873848bfaf", "67d7eca06768e7873848bfb0", "67d7eca06768e7873848bfb1", "67d7eca06768e7873848bfb2", "67d7eca06768e7873848bfb3", "67d7eca06768e7873848bfb4", "67d7eca06768e7873848bfb5", "67d7eca06768e7873848bfb6", "67d7eca06768e7873848bfb7", "67d7eca06768e7873848bfb8", "67d7eca06768e7873848bfb9", "67d7eca06768e7873848bfba", "67d7eca06768e7873848bfbb", "67d7eca06768e7873848bfbc", "67d7eca06768e7873848bfbd", "67d7eca06768e7873848bfbe", "67d7eca06768e7873848bfbf", "67d7eca06768e7873848bfc0", "28 Good Quality - Medium Size", "67d7eca06768e7873848bfc2", "67d7eca06768e7873848bfc3", "67d7eca06768e7873848bfc4", "67d7eca06768e7873848bfc5", "67d7eca06768e7873848bfc6", "67d7eca06768e7873848bfc7", "67d7eca06768e7873848bfc8", "67d7eca06768e7873848bfc9", "67d7eca06768e7873848bfca", "67d7eca06768e7873848bfcb", "67d7eca06768e7873848bfcc", "67d7eca06768e7873848bfcd", "67d7eca06768e7873848bfce", "67d7eca06768e7873848bfcf", "67d7eca06768e7873848bfd0", "67d7eca06768e7873848bfd1", "67d7eca06768e7873848bfd2", "67d7eca06768e7873848bfd3", "67d7eca06768e7873848bfd4", "67d7eca06768e7873848bfd5", "67d7eca06768e7873848bfd6", "67d7eca06768e7873848bfd7", "602bc68e908d4e0023034074", "18 Best quality - large size", "602bc68e908d4e0023034075", "602bc68e908d4e0023034076", "602bc68e908d4e0023034078", "602bc68e908d4e0023034079", "602bc68e908d4e002303407a", "602bc68e908d4e002303407b", "602bc68e908d4e002303407c", "602bc68e908d4e002303407d", "602bc68e908d4e002303407e", "602bc68e908d4e002303407f", "602bc68e908d4e0023034080", "602bc68e908d4e0023034081", "602bc68e908d4e0023034082", "602bc68e908d4e0023034083", "602bc68e908d4e0023034084", "602bc68e908d4e0023034085", "602bc68e908d4e0023034086", "602bc68e908d4e0023034087", "602bc68e908d4e0023034088", "602bc68e908d4e0023034089", "602bc68e908d4e002303408a", "602bc68e908d4e002303408b", "602bc68e908d4e002303408c", "602bc68e908d4e002303408d", "602bc68e908d4e002303408e", "602bc68e908d4e002303408f", "602bc68e908d4e0023034090", "602bc68e908d4e0023034091", "602bc68e908d4e0023034092", "602bc68e908d4e0023034093", "602bc68e908d4e0023034094", "602bc68e908d4e0023034095", "602b4734c03dcb0023e6d229", "Select a target file size as a percentage (0 - 10000%) of the original. Smaller values compress more. For example, a 100Mb file would become 25Mb if you select 25%.", 100, "602bc51a908d4e0023034050", "602bc51a908d4e0023034051", "602bc51a908d4e0023034052", "602bc51a908d4e0023034053", "602bc51a908d4e0023034054", "602bc51a908d4e0023034055", "602bc51a908d4e0023034056", "602bc51a908d4e0023034057", "602bc51a908d4e0023034058", "602bc51a908d4e0023034059", "602bc51a908d4e002303405b", "602bc51a908d4e002303405c", "602bc51a908d4e002303405d", "602bc51a908d4e002303405e", "602bc51a908d4e002303405f", "602bc51a908d4e0023034060", "602bc51a908d4e0023034061", "602bc51a908d4e0023034062", "602bc51a908d4e0023034063", "602bc51a908d4e0023034064", "602bc51a908d4e0023034065", "602bc51a908d4e0023034066", "602bc51a908d4e0023034067", "602bc51a908d4e0023034068", "602bc51a908d4e0023034069", "602bc51a908d4e002303406a", "602bc51a908d4e002303406b", "602bc51a908d4e002303406c", "602bc51a908d4e002303406d", "602bc51a908d4e002303406e", "602bc51a908d4e002303406f", "602bc51a908d4e0023034070", "602bc51a908d4e0023034071", "67e0dc4112a92abd4b4fbf64", "67e0dc4112a92abd4b4fbf65", "67e0dc4112a92abd4b4fbf66", "67e0dc4112a92abd4b4fbf67", "67e0dc4112a92abd4b4fbf68", "67e0dc4112a92abd4b4fbf69", "67e0dc4112a92abd4b4fbf6a", "67e0dc4112a92abd4b4fbf6b", "67e0dc4112a92abd4b4fbf6c", "67e0dc4112a92abd4b4fbf6d", "67e0dc4112a92abd4b4fbf6f", "67e0dc4112a92abd4b4fbf70", "67e0dc4112a92abd4b4fbf71", "67e0dc4112a92abd4b4fbf72", "67e0dc4112a92abd4b4fbf73", "67e0dc4112a92abd4b4fbf74", "67e0dc4112a92abd4b4fbf75", "67e0dc4112a92abd4b4fbf76", "67e0dc4112a92abd4b4fbf77", "67e0dc4112a92abd4b4fbf78", "602bc967908d4e00230340ba", "602bc967908d4e00230340bb", "602bc967908d4e00230340bd", "602bc967908d4e00230340be", "602bc967908d4e00230340bf", "602bc967908d4e00230340c0", "602bc967908d4e00230340c1", "602bc967908d4e00230340c2", "Enter desired video file size in MB (Megabytes), maximum 10240MB(10GB).", "Fastest (p1)", "67e0d2ec12a92abd4b4fbcad", "Fast (p3)", "67e0d2ec12a92abd4b4fbcaf", "Medium (p4)", "67e0d2ec12a92abd4b4fbcb0", "Slow (p5)", "67e0d2ec12a92abd4b4fbcb1", "Slower (p6)", "67e0d2ec12a92abd4b4fbcb2", "Slowest (p7)", "67e0d2ec12a92abd4b4fbcb3", "67e0d2ec12a92abd4b4fbcb4", "67e0d2ec12a92abd4b4fbcb5", "67e0d2ec12a92abd4b4fbcb6", "67e0d2ec12a92abd4b4fbcb7", "67e0d2ec12a92abd4b4fbcb8", "67e0d2ec12a92abd4b4fbcb9", "67e0d2ec12a92abd4b4fbcba", "67e0d2ec12a92abd4b4fbcbb", "67d7f1156768e7873848c336", "67d7f1156768e7873848c337", "67d7f1156768e7873848c338", "67d7f1156768e7873848c339", "67d7f1156768e7873848c33b", "67d7f1156768e7873848c33c", "67d7f1156768e7873848c33d", "67d7f1156768e7873848c33e", "67d7f1156768e7873848c33f", "Specify the receiver or player's \"buffer size\" (0-10000 kbps). Specified max bitrate will be enforced across each \"buffer size\" worth of data.", "602beddc98c6e90023d064b6", "602beddc98c6e90023d064b7", "602beddc98c6e90023d064b8", "602beddc98c6e90023d064b9", "602beddc98c6e90023d064ba", "602beddc98c6e90023d064bc", "602beddc98c6e90023d064bd", "602beddc98c6e90023d064be", "602beddc98c6e90023d064bf", "602beddc98c6e90023d064c0", "602beddc98c6e90023d064c1", 6, "Only use this option if you plan to play the video on a really old device or if you are having playback issues (it compress less)", "None", "658a68d34da89470ea2fa0a3", "603f1de25f4a16002303db4f", "Copy", "658a68d34da89470ea2fa0a4", "Select the best option for your subtitles: 'Upload' to add your own, or 'Copy' to replicate from the original file.", "658a69a84da89470ea2fa111", "658a68844da89470ea2fa06f", "Hardsubs, always visible and integrated into the video, are suitable for permanent captions, while softsubs, stored separately, can be turned on or off for customized viewing.", "Compressing", "mp4", "Compressor", "Convert", "Converter", "Conversion minutes measure how long it takes to process your files. For example, most image, document, or audio conversions takes less than a minute. A large 1 GB video takes about 10 minutes on average.", "Convert More", "Unit Converter", "Scale Your Plan to Fit Your Needs", "Unlock more conversions at a lower price per minute as you scale up your plan.", "Download Started", "Error", "File Converters", "File Size", "GIF Converters", "Loading", "Merge into one", "Minutes automatically renew", "API", "Payment Method", "Enter how many pages each split file should contain (e.g., 5 will split the PDF into parts of 5 pages each).", "Unused minutes never expire", "Pages per PDF", "Choose to split by specific page ranges or set a number to split the PDF into equal parts.", "FreeConvert.com can convert your SOURCE files to these other formats:", "Submitting", "Terms"));
        </script>
        <script lazy-src="/_nuxt/202507161130-499/1d70c13.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/086f635.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/7a7b684.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/da50cd9.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/d11bd3e.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/0ebe903.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/9e02c49.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/dfc1e98.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/4bf615d.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/0405ab6.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/7747b7d.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/dad127c.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/da5747b.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/0e206dc.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/1b94093.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/5940244.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/1142270.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/06bf22b.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/958c0c3.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/0b11aa7.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/56aa250.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/1dad142.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/1556bb2.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/9d60f1b.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/a6789db.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/bb1f8d2.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/7a42e80.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/33aee4c.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/5f369a6.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/f6d632f.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/dd848e7.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/22575c2.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/d0d0645.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/796bec2.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/0255dc9.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/de1a2cc.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/9a049ef.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/cecc68d.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/d01f61c.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/22f78f8.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/68b4da9.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/a409eae.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/610416c.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/8bd3407.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/319ab29.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/bedba9a.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/c256643.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/2784816.js" defer></script>
        <script lazy-src="/_nuxt/202507161130-499/72a6127.js" defer></script>
        <script type="text/javascript">
            const lazyLoadTimeout = 2500
              , userInteractionEvents = ["mouseover", "keydown", "touchstart", "touchmove", "wheel"]
              , loadScriptsTimer = setTimeout(loadScripts, 2500);
            function loadScripts() {
                Array.from(document.querySelectorAll("script[lazy-src]")).forEach((function(e) {
                    e.setAttribute("src", e.getAttribute("lazy-src")),
                    e.removeAttribute("lazy-src")
                }
                ))
            }
            function triggerScriptLoader() {
                loadScripts(),
                clearTimeout(loadScriptsTimer),
                userInteractionEvents.forEach((function(e) {
                    window.removeEventListener(e, triggerScriptLoader, {
                        passive: !0
                    })
                }
                ))
            }
            function siteSearchInputOnKeyUp(e) {
                sessionStorage.setItem("siteSearchInput", e.target.value)
            }
            function windowClickHandler(e) {
                "SiteSearchInput" === e.target.id && e.target.addEventListener("keyup", siteSearchInputOnKeyUp)
            }
            function checkUser() {
                localStorage.getItem("auth._token.local") && (document.getElementById("NavigationAuthLinks").style.display = "none",
                document.getElementById("NavigationUserDropdown").style.display = "inline-block")
            }
            userInteractionEvents.forEach((function(e) {
                window.addEventListener(e, triggerScriptLoader, {
                    passive: !0
                })
            }
            )),
            sessionStorage.setItem("siteSearchInput", ""),
            window.addEventListener("click", windowClickHandler, !0),
            document.querySelectorAll(".dropdown-close-trigger").forEach((function(e) {
                e.addEventListener("click", (function() {
                    const t = e.closest(".drop");
                    t && (t.classList.add("hidden"),
                    setTimeout((function() {
                        t.classList.remove("hidden")
                    }
                    ), 100))
                }
                ))
            }
            )),
            checkUser()
        </script>
        <script defer src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015" integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ==" data-cf-beacon='{"rayId":"961b2f66c993ef4a","serverTiming":{"name":{"cfExtPri":true,"cfEdge":true,"cfOrigin":true,"cfL4":true,"cfSpeedBrain":true,"cfCacheStatus":true}},"version":"2025.7.0","token":"c52c94a5c6b5435eaae82b57b76bed36"}' crossorigin="anonymous"></script>
    </body>
</html>
