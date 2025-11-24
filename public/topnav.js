function enableBlueWaveTopNav() {
    // Prevent duplicates
    const existingWrapper = document.getElementById("ghl_custom_topnav_wrapper_v4");

// If wrapper exists but topnav is disabled → remove it and rebuild
if (existingWrapper && !window.__BLUEWAVE_TOPNAV_ENABLED__) {
    existingWrapper.remove();
}

// If wrapper exists AND topnav is enabled → allow observer to re-init instead of blocking
if (existingWrapper && window.__BLUEWAVE_TOPNAV_ENABLED__) {
    console.log("TopNav already active — skipping rebuild");
    return;
}
console.log('came here');
    (function () {
        "use strict";
        if (!window.__BLUEWAVE_TOPNAV_ENABLED__) return;

        const WRAPPER_ID = "ghl_custom_topnav_wrapper_v4";
        const STYLE_ID = "ghl_custom_topnav_styles_v4";
        const LOGO_URL = "https://msgsndr-private.storage.googleapis.com/companyPhotos/47b7e157-d197-4ce5-9a94-b697c258702a.png";
        const MAX_BUILD_ATTEMPTS = 40;
        const BUILD_INTERVAL_MS = 700;

        const $q = s => document.querySelector(s);
        const $qa = s => Array.from(document.querySelectorAll(s));

        function injectStyles() {
            if ($q(`#${STYLE_ID}`)) return;
            const css = `
          header.hl_header, header.hl_header.--agency {
            width:100vw!important;left:0!important;right:0!important;margin:0!important;
            padding:6px 16px!important;background:#006AFF!important;z-index:9999!important;
            display:flex!important;align-items:center!important;justify-content:space-between!important;
          }
          #${WRAPPER_ID} {
            display:flex!important;align-items:center!important;gap:14px!important;
            flex:1 1 auto!important;overflow-x:auto!important;white-space:nowrap!important;
          }
          #${WRAPPER_ID} img {height:36px!important;cursor:pointer!important;flex-shrink:0!important;}
          #${WRAPPER_ID} nav {display:flex!important;gap:8px!important;align-items:center!important;}
          #${WRAPPER_ID} nav a {
            color:#fff!important;text-decoration:none!important;font-weight:500!important;
            padding:14px 17px!important;border-radius:4px!important; background: #1d7bcd40;
          }
          #${WRAPPER_ID} nav a:hover {background:rgba(255,255,255,0.15)!important;}
          aside#sidebar-v2,#sidebar-v2,.hl_sidebar,.hl_app_sidebar {
            display:none!important;width:0!important;min-width:0!important;visibility:hidden!important;opacity:0!important;
          }
          main,#app,.hl_main-content,.container {
            margin-left:0!important;padding-left:0!important;width:100%!important;
            max-width:100%!important;
          }
        `;
            const s = document.createElement("style");
            s.id = STYLE_ID;
            s.textContent = css;
            document.head.appendChild(s);
        }

        function hideSidebar() {
            const sels = ["aside#sidebar-v2", "#sidebar-v2", ".hl_sidebar", ".hl_app_sidebar"];
            sels.forEach(sel => {
                $qa(sel).forEach(el => {
                    el.style.setProperty("display", "none", "important");
                    el.style.setProperty("width", "0", "important");
                    el.style.setProperty("min-width", "0", "important");
                    el.style.setProperty("visibility", "hidden", "important");
                    el.style.setProperty("opacity", "0", "important");
                });
            });
        }

        function waitForSidebarReady(cb, maxWait = 6000) {
            const start = Date.now();
            const check = setInterval(() => {
                const aside = $q("aside#sidebar-v2") || $q(".hl_app_sidebar") || $q(".hl_sidebar");
                const links = aside ? aside.querySelectorAll("a[href]") : [];
                if (links.length > 5 || Date.now() - start > maxWait) {
                    clearInterval(check);
                    cb(aside);
                }
            }, 250);
        }

        function buildNavbarFromSidebar(aside) {
            const wrapper = document.createElement("div");
            wrapper.id = WRAPPER_ID;

            const logo = document.createElement("img");
            logo.src = LOGO_URL;
            logo.alt = "Logo";
            logo.addEventListener("click", () => window.location.href = "/v2/location");
            wrapper.appendChild(logo);

            const nav = document.createElement("nav");
            // INSERT LOCATION SWITCHER HERE
            //const loc = aside.querySelector("#location-switcher-sidbar-v2");
            //if (loc) {
            //    const clonedLoc = loc.cloneNode(true);
            //    clonedLoc.id = "bw-location-switcher";

            //    clonedLoc.style.transform = "scale(0.75)";
            //    clonedLoc.style.transformOrigin = "left center";
            //    clonedLoc.style.marginRight = "10px";

            //    clonedLoc.querySelectorAll("*").forEach(el => {
            //        el.style.color = "#fff";
            //    });

            //    wrapper.appendChild(clonedLoc);
            //}
            if (aside) {
                const seen = new Set();
                const links = aside.querySelectorAll("a[href]");

                links.forEach(a => {
                    const name = a.textContent.trim();
                    const href = a.href;
                    if (!name || !href || seen.has(name)) return;
                    seen.add(name);

                    const link = document.createElement("a");
                    link.textContent = name;
                    link.href = href;
                    link.addEventListener("click", () => {
                        setTimeout(() => init(), 2000);
                    });

                    nav.appendChild(link);
                });
            }

            wrapper.appendChild(nav);
            return wrapper;
        }

        function insertWrapperIfNeeded(aside) {
            const header = $q("header.hl_header.--agency") || $q("header.hl_header");
            if (!header || $q(`#${WRAPPER_ID}`)) return false;

            const wrapper = buildNavbarFromSidebar(aside);
            const right = header.querySelector(".hl_header__right,.hl_header--controls");
            const container = header.querySelector(".container-fluid") || header;
            //Old COde and working Fine without Location Selector
            //try {
            //    if (right && container) container.insertBefore(wrapper, right);
            //    else header.prepend(wrapper);

            //    return true;
            //} catch (e) {
            //    console.error("Navbar insert error", e);
            //    return false;
            //}
            try {
                if (right && container) container.insertBefore(wrapper, right);
                else header.prepend(wrapper);

                // ⭐ ADD THIS HERE — the event binding ⭐
                const topnavLocationBtn = document.querySelector("#bw-location-switcher");
                if (topnavLocationBtn) {
                    topnavLocationBtn.addEventListener("click", () => {
                        const sidebarTrigger = document.querySelector("#location-switcher-sidbar-v2");

                        if (!sidebarTrigger) return;

                                // Temporarily unhide the location switcher so GHL click works
                                const originalStyles = {
                                    display: sidebarTrigger.style.display,
                                    visibility: sidebarTrigger.style.visibility,
                                    opacity: sidebarTrigger.style.opacity
                                };

                                sidebarTrigger.style.setProperty("display", "flex", "important");
                                sidebarTrigger.style.setProperty("visibility", "visible", "important");
                                sidebarTrigger.style.setProperty("opacity", "1", "important");

                                // Now trigger GHL’s click
                                sidebarTrigger.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
                                sidebarTrigger.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
                                sidebarTrigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));

                                // Re-hide it after 300ms
                                setTimeout(() => {
                                    sidebarTrigger.style.display = originalStyles.display;
                                    sidebarTrigger.style.visibility = originalStyles.visibility;
                                    sidebarTrigger.style.opacity = originalStyles.opacity;
                                }, 300);
                    });

                }

                return true;
            } catch (e) {
                console.error("Navbar insert error", e);
                return false;
            }

        }

        function init() {
            injectStyles();
            hideSidebar();

            waitForSidebarReady((aside) => {
                let attempts = 0;
                const timer = setInterval(() => {
                    attempts++;
                    const ok = insertWrapperIfNeeded(aside);
                    hideSidebar();
                    if (ok || attempts >= MAX_BUILD_ATTEMPTS) clearInterval(timer);
                }, BUILD_INTERVAL_MS);
            });
        }
        let debounceTimer = null;

        // Only create observer WHEN topnav is enabled
        if (window.__BLUEWAVE_TOPNAV_ENABLED__) {

            window.__BLUEWAVE_OBSERVER__ = new MutationObserver(() => {
                if (!window.__BLUEWAVE_TOPNAV_ENABLED__) return; // safety check
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => init(), 700);
            });

            const startObserver = () => {
                window.__BLUEWAVE_OBSERVER__.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            };

            if (document.readyState === "complete" || document.readyState === "interactive") {
                setTimeout(() => {
                    if (!window.__BLUEWAVE_TOPNAV_ENABLED__) return;
                    init();
                    startObserver();
                }, 200);

            } else {
                window.addEventListener("DOMContentLoaded", () => {
                    if (!window.__BLUEWAVE_TOPNAV_ENABLED__) return;
                    init();
                    startObserver();
                });
            }
        }

    })();
}
function forceRemoveBlueWaveTopNav() {
    let attempts = 0;
    const maxAttempts = 20; // 20 × 50ms = 1 second

    const interval = setInterval(() => {
        attempts++;

        const wrapper = document.getElementById("ghl_custom_topnav_wrapper_v4");
        const style = document.getElementById("ghl_custom_topnav_styles_v4");

        if (wrapper) wrapper.remove();
        if (style) style.remove();

        if (attempts >= maxAttempts) {
            clearInterval(interval);
        }

    }, 50);
}
function disableBlueWaveTopNav() {
    // ⛔ Stop re-inserting TopNav
    if (window.__BLUEWAVE_OBSERVER__) {
        window.__BLUEWAVE_OBSERVER__.disconnect();
    }
    const wrapper = document.getElementById("ghl_custom_topnav_wrapper_v4");
    const style = document.getElementById("ghl_custom_topnav_styles_v4");

    if (wrapper) wrapper.remove();
    if (style) style.remove();

    // Restore sidebar
    const sidebars = document.querySelectorAll(
        "aside#sidebar-v2, #sidebar-v2, .hl_sidebar, .hl_app_sidebar"
    );

    sidebars.forEach(el => {
        el.style.removeProperty("display");
        el.style.removeProperty("width");
        el.style.removeProperty("min-width");
        el.style.removeProperty("visibility");
        el.style.removeProperty("opacity");
    });

    forceRemoveBlueWaveTopNav();

    forceSidebarOpen();
}
function resetGhlSidebar() {
   
    const sidebar = document.querySelector("#sidebar-v2");
    const body = document.body;

    // Remove forced hidden inline styles
    sidebar.style.display = "";
    sidebar.style.width = "";
    sidebar.style.minWidth = "";
    sidebar.style.visibility = "";
    sidebar.style.opacity = "";

    // Remove GHL's collapsed class if it exists
    body.classList.remove("sidebar-collapsed");

    // Reset localStorage collapse state
    localStorage.setItem("sidebarCollapsed", "false");
}
function forceSidebarOpen() {
 
    const sidebar = document.querySelector("#sidebar-v2")
        || document.querySelector(".hl_app_sidebar")
        || document.querySelector(".hl_sidebar");

    if (!sidebar) return;

    const fix = () => {
        sidebar.style.display = "block";
        sidebar.style.width = "14rem";
        sidebar.style.minWidth = "14rem";
        sidebar.style.visibility = "visible";
        sidebar.style.opacity = "1";
    };

    // Apply immediately
    fix();

    // Prevent GHL from collapsing again
    const observer = new MutationObserver(() => fix());
    observer.observe(sidebar, { attributes: true, attributeFilter: ["style", "class"] });
}

(function () {
    let lastUrl = location.href;

    new MutationObserver(() => {
        const currentUrl = location.href;

        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            handleUrlChange();   // <-- now this works
        }
    }).observe(document, { subtree: true, childList: true });

})();
function handleUrlChange() {
    const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
    const themeName = savedThemeObj.selectedTheme;

    if (!themeName) return;

    const isSubAccount = window.location.pathname.startsWith("/v2/location/");
    console.log("isSubAccount:", isSubAccount);

    if (themeName === "BlueWave Theme" && isSubAccount) {
        window.__BLUEWAVE_TOPNAV_ENABLED__ = true;
        console.log("Code is working");
        enableBlueWaveTopNav();
    } else {
        window.__BLUEWAVE_TOPNAV_ENABLED__ = false;
        resetGhlSidebar();
        disableBlueWaveTopNav();
    }
}
console.log("Runs till here");
handleUrlChange();    // <-- Now runs safely