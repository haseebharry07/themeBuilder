

// ThemeBuilder - safer, namespaced, production-ready
(function () {
  const NS = "themebuilder"; // namespace prefix for storage & IDs
  const STORAGE = {
    themeCSS: `${NS}_themeCSS`,
    userTheme: `userTheme`,
    selectedTheme: `${NS}_selectedTheme`,
    agn: `agn`
  };
 
  try { localStorage.setItem(STORAGE.agn, agn); } catch (e) { /* ignore storage failures */ }

  // ---- Utilities ----
  function log(...args) { /*toggle console debug here*/ console.debug("[ThemeBuilder]", ...args); }
  function safeJsonParse(s) { try { return JSON.parse(s); } catch (e) { return null; } }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  // ---- Fetch/apply remote CSS JSON ----
  async function applyCSSFile() {

    const url = (() => {
      try { return decodeBase64Utf8(remoteEncoded || remoteEncoded === undefined ? remoteEncoded : remoteEncoded); } catch (e) { return atob(remoteEncoded); }
    })();

    // fallback: try decode remoteEncoded directly
    let decodedUrl;
    try { decodedUrl = decodeBase64Utf8(remoteEncoded); } catch (_) { decodedUrl = null; }
    const finalUrl = decodedUrl || (function () { try { return atob(remoteEncoded); } catch (e) { return null; } })();
    if (!finalUrl) {
      console.error("[ThemeBuilder] invalid remote URL");
      return;
    }

    const cachedCSS = localStorage.getItem(STORAGE.themeCSS);
    if (cachedCSS) {
      const text = decodeBase64Utf8(cachedCSS);
      if (text) injectCSS(text);
    }

    try {
      const res = await fetch(finalUrl, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const css = json.css || "";
      const themeData = json.themeData || {};
      const selectedtheme = json.selectedTheme || "";
      if (themeData && themeData["--custom-logo-url"]) {
        changeFavicon(themeData["--custom-logo-url"]);
      } else {
        changeFavicon('https://storage.googleapis.com/msgsndr/W0un4jEKdf7kQBusAM6W/media/6642738faffa4aad7ee4eb45.png');
      }

      const cssText = decodeBase64Utf8(css);
      try { localStorage.setItem(STORAGE.themeCSS, css); } catch (e) { /* ignore storage quota */ }
      try { localStorage.setItem(STORAGE.selectedTheme, selectedtheme); } catch (e) { /* ignore */ }
      if (!cachedCSS && cssText) injectCSS(cssText);

      // merge theme data safely
      applySidebarLogoFromTheme();
      const savedRaw = localStorage.getItem(STORAGE.userTheme);
      const saved = safeJsonParse(savedRaw) || {};
      const merged = { ...(saved.themeData || {}), ...themeData };
      injectThemeData(merged);

      // restore UI changes
      restoreHiddenMenus();
      applyHiddenMenus();
      log("Theme applied from remote");
    } catch (err) {
      console.error("[ThemeBuilder] Failed to fetch theme:", err);
    }
  }
/**
 * Update Sidebar Logo from CSS Variable
 * Reads: --agency-logo-url (raw URL)
 * Fallback: --agency-logo (url("..."))
 */
function applySidebarLogoFromTheme() {
    try {
        const root = document.documentElement;
        const img = document.querySelector(".agency-logo");
        if (!img) return;

        // First check --agency-logo-url (raw clean URL)
        let url = getComputedStyle(root)
            .getPropertyValue("--agency-logo-url")
            .trim()
            .replace(/^"|"$/g, ""); // remove quotes

        if (!url) {
            // fallback to --agency-logo: url("...")
            let cssUrl = getComputedStyle(root)
                .getPropertyValue("--agency-logo")
                .trim()
                .replace(/^"|"$/g, "");

            const match = cssUrl.match(/url\(['"]?(.*?)['"]?\)/);
            if (match) {
                url = match[1];
            }
        }

        if (!url) return;

        img.src = url;
        img.style.objectFit = "contain";

        // Optional: apply dynamic width & height from vars
        const w = getComputedStyle(root).getPropertyValue("--logo-width").trim();
        const h = getComputedStyle(root).getPropertyValue("--logo-height").trim();
        if (w) img.style.width = w;
        if (h) img.style.height = h;

        console.debug("[ThemeBuilder] Sidebar logo updated →", url);
    } catch (e) {
        console.error("[ThemeBuilder] Failed applying sidebar logo", e);
    }
}

  function decodeBase64Utf8(base64) {
    try {
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      const decoder = new TextDecoder("utf-8");
      return decoder.decode(bytes);
    } catch (e) {
      console.warn("[ThemeBuilder] decodeBase64Utf8 failed:", e);
      return "";
    }
  }

  // ---- DOM/CSS helpers ----
  function injectCSS(cssText) {
    if (!cssText) return;
    const id = `${NS}-css`;
    const old = document.getElementById(id);
    if (old) old.remove();
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = cssText;
    (document.head || document.getElementsByTagName("head")[0] || document.documentElement).appendChild(style);
    log("Injected CSS");
  }

  function changeFavicon(url) {
    if (!url) return;
    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;
    const existing = head.querySelectorAll("link[rel*='icon']");
    existing.forEach(e => e.remove());
    const link = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = url;
    head.appendChild(link);
    log("Favicon changed:", url);
  }

  function updateElementText(selector, newText, attempt = 1) {
    const el = document.querySelector(selector);
    if (!el && attempt < 20) return setTimeout(() => updateElementText(selector, newText, attempt + 1), 300);
    if (el) el.textContent = newText;
  }

  // ---- Theme data injection ----
  function injectThemeData(themeData) {
    if (!themeData || typeof themeData !== "object") return;
    // Save merged version
    const savedRaw = localStorage.getItem(STORAGE.userTheme);
    const saved = safeJsonParse(savedRaw) || {};
    const mergedTheme = { ...(saved.themeData || {}), ...themeData };

    try { localStorage.setItem(STORAGE.userTheme, JSON.stringify({ themeData: mergedTheme })); } catch (e) { /* ignore */ }

    const root = document.documentElement;
    Object.keys(mergedTheme).forEach(key => {
      if (key.startsWith("--") && typeof mergedTheme[key] === "string") {
        try { root.style.setProperty(key, mergedTheme[key]); } catch (e) { /* ignore */ }
      }
    });

    // Optional text updates
    if (mergedTheme["--login-button-text"]) updateElementText("button.hl-btn.bg-curious-blue-500", mergedTheme["--login-button-text"]);
    if (mergedTheme["--login-headline-text"]) updateElementText("h2.heading2", mergedTheme["--login-headline-text"]);
    if (mergedTheme["--forgetpassword-text"]) updateElementText("#forgot_passowrd_btn", mergedTheme["--forgetpassword-text"]);
  }

  // ---- Hidden/Locked menus ----
  function restoreHiddenMenus() {
    const savedRaw = localStorage.getItem(STORAGE.userTheme);
    const saved = safeJsonParse(savedRaw) || {};
    if (!saved.themeData || !saved.themeData["--hiddenMenus"]) return;

    let hiddenMenus;
    try { hiddenMenus = JSON.parse(saved.themeData["--hiddenMenus"]); } catch (e) { console.warn("[ThemeBuilder] invalid --hiddenMenus"); return; }
    if (!hiddenMenus || typeof hiddenMenus !== "object") return;

    Object.keys(hiddenMenus).forEach(menuId => {
      const menuEl = document.getElementById(menuId);
      const toggleEl = document.getElementById("hide-" + menuId);
      if (!menuEl) return;
      const hidden = !!hiddenMenus[menuId].hidden;
      menuEl.style.setProperty("display", hidden ? "none" : "flex", "important");
      if (toggleEl) toggleEl.checked = hidden;
    });
  }
function applyHiddenMenus() { restoreHiddenMenus(); }
  function applyLockedMenus() {
    const savedRaw = localStorage.getItem(STORAGE.userTheme);
    const saved = safeJsonParse(savedRaw) || {};
    if (!saved.themeData || !saved.themeData["--hiddenMenus"]) return;

    let hiddenMenus;
    try { hiddenMenus = JSON.parse(saved.themeData["--hiddenMenus"]); } catch (e) { console.warn("[ThemeBuilder] invalid --hiddenMenus"); return; }
    Object.keys(hiddenMenus).forEach(menuId => {
      const menuEl = document.getElementById(menuId);
      if (!menuEl) return;
      const isHidden = !!hiddenMenus[menuId].hidden;
      if (isHidden) {
        if (!menuEl.querySelector(".tb-lock-icon")) {
          const lockIcon = document.createElement("i");
          lockIcon.className = "tb-lock-icon fas fa-lock ml-2";
          lockIcon.style.color = "#F54927";
          menuEl.appendChild(lockIcon);
        }
        menuEl.style.opacity = "0.6";
        menuEl.style.cursor = "not-allowed";
        if (menuEl.dataset.tbLockBound !== "1") {
          menuEl.addEventListener("click", blockMenuClick, true);
          menuEl.dataset.tbLockBound = "1";
        }
      } else {
        const icon = menuEl.querySelector(".tb-lock-icon");
        if (icon) icon.remove();
        menuEl.style.opacity = "";
        menuEl.style.cursor = "";
        if (menuEl.dataset.tbLockBound === "1") {
          menuEl.removeEventListener("click", blockMenuClick, true);
          delete menuEl.dataset.tbLockBound;
        }
      }
    });
  }

  function blockMenuClick(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById("tb-lock-popup")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "tb-lock-popup";
    overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:99999";
    overlay.innerHTML = `
      <div style="background:#fff;padding:20px 30px;border-radius:12px;max-width:400px;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,0.3)">
        <h3 style="margin-bottom:12px;">Access Denied</h3>
        <p style="margin-bottom:20px;">No access. Please contact the Owner.</p>
        <button style="padding:8px 20px;border:none;border-radius:6px;background:#F54927;color:#fff;cursor:pointer;">OK</button>
      </div>`;
    overlay.querySelector("button").addEventListener("click", () => overlay.remove());
    document.body.appendChild(overlay);
  }

function reorderMenu(order, containerSelector) {
    // Try the exact selector first (keeps agency behavior unchanged)
    let container = document.querySelector(containerSelector);

    // If selector not found, attempt to infer the container from the first existing menu item
    if (!container) {
        for (let i = 0; i < order.length; i++) {
            const id = order[i];
            const el = document.getElementById(id);
            if (el && el.parentElement) {
                container = el.parentElement;
                break;
            }
        }
    }

    // If still not found, try a common sub-account selector (safe fallback)
    if (!container) {
        container = document.querySelector(".hl_nav-header nav") || document.querySelector(".hl_nav-header");
    }

    if (!container) return;

    order.forEach(id => {
        const el = document.getElementById(id);
        if (el) container.appendChild(el);
    });
}
  // ---- Logo injection ----
  async function applyAgencyLogo(attempt = 1) {
    const savedRaw = localStorage.getItem(STORAGE.userTheme);
    const saved = safeJsonParse(savedRaw) || {};
    const themeVars = saved.themeData || {};
    let logoUrl = themeVars["--login-company-logo"] || themeVars["--custom-logo-url"];
    if (logoUrl) {
      logoUrl = logoUrl.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
    }
    const logoImg = document.querySelector(".agency-logo");
    if (logoImg && logoUrl) {
      logoImg.src = logoUrl;
      log("Applied agency logo");
      return;
    }
    if (attempt < 20) {
      await sleep(300);
      return applyAgencyLogo(attempt + 1);
    }
    log("Agency logo not found after retries");
  }
// ✅ ---- Sidebar Titles Restore ----
function applyStoredSidebarTitles() {
  try {
    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
    if (!saved.themeData || !saved.themeData["--sidebarTitles"]) return;

    // Parse the stored sidebar title data
    const titles = JSON.parse(saved.themeData["--sidebarTitles"]);

    Object.entries(titles).forEach(([varName, newLabel]) => {
      // Extract metaKey from variable name, e.g. "--sites-new-name" → "sites"
      const metaKey = varName.replace(/^--| -new-name$/g, "").replace(/-new-name$/, "");
      const cleanMetaKey = metaKey.replace(/^--/, "").replace(/-new-name$/, "");

      // Inject style if missing
      if (!document.querySelector(`style[data-meta="${cleanMetaKey}"]`)) {
        const style = document.createElement("style");
        style.dataset.meta = cleanMetaKey;
        style.innerHTML = `
          a[meta="${cleanMetaKey}"] .nav-title,
          a#${cleanMetaKey} .nav-title {
            visibility: hidden !important;
            position: relative !important;
          }
          a[meta="${cleanMetaKey}"] .nav-title::after,
          a#${cleanMetaKey} .nav-title::after {
            content: var(${varName}, "${cleanMetaKey}");
            visibility: visible !important;
            position: absolute !important;
            left: 0;
          }
        `;
        document.head.appendChild(style);
      }

      // Apply live CSS variable
      document.documentElement.style.setProperty(varName, `"${newLabel}"`);
      console.log(`✅ Sidebar title applied: ${cleanMetaKey} → ${newLabel}`);
    });
  } catch (err) {
    console.error("❌ Failed to apply stored sidebar titles:", err);
  }
}

  // ---- Mutation observer (throttled) ----
  function observeSidebarMutations(sidebar) {
    if (!sidebar) return;
    let timer;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        ThemeBuilder._doReapplyTheme();
      }, 500);
    });
    observer.observe(sidebar, { childList: true, subtree: true });
    // store observer reference if you want to disconnect later
    return observer;
  }

  // ---- Wait for sidebar then re-apply ----
  async function waitForSidebarAndReapply(retries = 60) {
    for (let attempt = 0; attempt < retries; attempt++) {
      const sidebar = document.querySelector(".hl_nav-header nav");
      const menuItems = sidebar?.querySelectorAll("li, a, div[id^='sb_']") || [];
      if (sidebar && menuItems.length > 5) {
        ThemeBuilder._doReapplyTheme();
        observeSidebarMutations(sidebar);
        return true;
      }
      await sleep(300);
    }
    console.warn("[ThemeBuilder] Sidebar not found within retry window");
    return false;
  }

  // ---- Core reapply logic ----
  function _doReapplyTheme() {
    const savedRaw = localStorage.getItem(STORAGE.userTheme);
    const saved = safeJsonParse(savedRaw) || {};
    if (!saved.themeData) {
      log("No theme data found");
      return;
    }
    injectThemeData(saved.themeData);
    applySidebarLogoFromTheme();
    restoreHiddenMenus();
    applyHiddenMenus();
    applyLockedMenus();

    try {
      if (saved.themeData["--subMenuOrder"]) {
         const order = JSON.parse(saved.themeData["--subMenuOrder"]);
        reorderMenu(order, "#subAccountSidebar");
        // const order = safeJsonParse(saved.themeData["--subMenuOrder"]) || [];
        // reorderSidebarFromOrder(order.filter(m => m && m.trim() !== "sb_agency-accounts"));
        // applySubMenuOrder(order);
      }
    } catch (e) { console.error("[ThemeBuilder] reorder submenu failed", e); }

    try {
      if (saved.themeData["--agencyMenuOrder"]) {
        const order = JSON.parse(saved.themeData["--agencyMenuOrder"]);
        reorderMenu(order, "#agencySidebar");
        // const agencyOrder = safeJsonParse(saved.themeData["--agencyMenuOrder"]) || [];
        // reorderAgencyFromOrder(agencyOrder.filter(m => m && m.trim() !== "sb_agency-accounts"));
      }
    } catch (e) { console.error("[ThemeBuilder] reorder agency menus failed", e); }
  }
async function waitForStableSidebar(selector = '#sidebar-v2 nav.flex-1.w-full', timeout = 5000) {
  const start = Date.now();
  let lastHTML = '';
  while (Date.now() - start < timeout) {
    const el = document.querySelector(selector);
    if (!el) {
      await new Promise(r => setTimeout(r, 300));
      continue;
    }
    const currentHTML = el.innerHTML;
    if (currentHTML === lastHTML && currentHTML.length > 0) {
      // Sidebar content hasn't changed between two checks → stable
      return true;
    }
    lastHTML = currentHTML;
    await new Promise(r => setTimeout(r, 300));
  }
  console.warn('[ThemeBuilder] Sidebar did not stabilize within timeout.');
  return false;
}

  // ---- SPA detection (history) ----
  (function () {
    const _push = history.pushState;
    history.pushState = function () { const res = _push.apply(this, arguments); window.dispatchEvent(new Event("locationchange")); return res; };
    const _replace = history.replaceState;
    history.replaceState = function () { const res = _replace.apply(this, arguments); window.dispatchEvent(new Event("locationchange")); return res; };
    window.addEventListener("popstate", () => window.dispatchEvent(new Event("locationchange")));
  })();

  // ---- exposed API and internal flags ----
  const ThemeBuilder = {
    _doReapplyTheme,
    applyCSSFile,
    applyAgencyLogo,
    reapply: () => {
      if (ThemeBuilder._reapplyLock) return;
      ThemeBuilder._reapplyLock = true;
        (async () => {
        await waitForStableSidebar();
        await waitForSidebarAndReapply();
        setTimeout(() => { ThemeBuilder._reapplyLock = false; }, 800);
      })();
    },
    _reapplyLock: false
  };

  // ---- Listen to SPA location changes ----
  window.addEventListener("locationchange", () => {
    ThemeBuilder.reapply();
    ThemeBuilder.applyAgencyLogo();
    setTimeout(() => {
      applyStoredSidebarTitles();
    }, 1200);
  });

  // ---- Initial bootstrap ----
  // Run applyCSSFile (fetch + inject)
  try { ThemeBuilder.applyCSSFile(); } catch (e) { console.error("[ThemeBuilder] initial apply failed", e); }
  // Apply locked menus a bit later (gives DOM a chance)
  setTimeout(() => { try { applyLockedMenus(); } catch (e) {} }, 3000);
  setTimeout(() => { ThemeBuilder.reapply(); }, 400);
  ThemeBuilder.applyAgencyLogo();

    // ✅ Run once on initial load
  setTimeout(() => {
    applyStoredSidebarTitles();
  }, 1500);
  // Expose to global for manual debugging
  window.ThemeBuilder = ThemeBuilder;
  log("ThemeBuilder initialized");
})();



window.addEventListener("load", () => {
  console.log('Loader related It is working');
  document.body.classList.add("loaded");
  document.querySelectorAll("#app + .app-loader, #app > .hl-loader-container")
    .forEach(l => l.remove());
});

function enableBlueWaveTopNav() {
    // Prevent duplicates
    if (document.getElementById("ghl_custom_topnav_wrapper_v4")) return;

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
             handleUrlChange();
         }
     }).observe(document, { subtree: true, childList: true });

 })();
(function () {
    const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
    const themeName = savedThemeObj.selectedTheme;

    if (!themeName) return;

    const isSubAccount = window.location.pathname.startsWith("/v2/location/");

    if (themeName === "BlueWave Theme" && isSubAccount) {
        window.__BLUEWAVE_TOPNAV_ENABLED__ = true;
        console.log('Top Nav code is working');
        enableBlueWaveTopNav();
    }
    // else {
    //      window.__BLUEWAVE_TOPNAV_ENABLED__ = false;
    //      resetGhlSidebar();
    //      disableBlueWaveTopNav();
    //  }
})();
