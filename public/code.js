console.log('working');
// ThemeBuilder - safer, namespaced, production-ready
(function () {
  const NS = "themebuilder"; // namespace prefix for storage & IDs
  const STORAGE = {
    themeCSS: `${NS}_themeCSS`,
    userTheme: `userTheme`,
    selectedTheme: `${NS}_selectedTheme`,
    agn: `${NS}_agn`
  };

  // Encoded remote config (same as your cde)
  const remoteEncoded = "aHR0cHM6Ly90aGVtZS1idWlsZGVyLWRlbHRhLnZlcmNlbC5hcHAvYXBpL3RoZW1lL2ZpbGU/YWdlbmN5SWQ9aWdkNjE4";
  // local agn
  const agn = "aWdkNjE4";
  try { localStorage.setItem(STORAGE.agn, agn); } catch (e) { /* ignore storage failures */ }

  // ---- Utilities ----
  function log(...args) { /*toggle console debug here*/ console.debug("[ThemeBuilder]", ...args); }
  function safeJsonParse(s) { try { return JSON.parse(s); } catch (e) { return null; } }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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

  // ---- Submenu / sidebar reordering ----
  function applySubMenuOrder(order) {
    if (!Array.isArray(order)) {
      console.warn("[ThemeBuilder] No valid submenu order provided");
      return;
    }
    const root = document.documentElement;
    order.forEach((menuId, index) => {
      const varName = `--${menuId.replace("sb_", "")}-order`;
      try { root.style.setProperty(varName, index); } catch (e) {}
    });
  }

  function reorderSidebarFromOrder(order) {
    const sidebar = document.querySelector(".hl_nav-header nav.flex-1.w-full");
    if (!sidebar || !Array.isArray(order)) return false;
    order.forEach(menuId => {
      const item = sidebar.querySelector(`#${menuId}`);
      if (item) sidebar.appendChild(item);
    });
    return true;
  }

  function reorderAgencyFromOrder(agencyOrder) {
    const sidebar = document.querySelector(".agency-sidebar");
    if (!sidebar || !Array.isArray(agencyOrder)) return false;
    agencyOrder.forEach(menuId => {
      const menuEl = sidebar.querySelector(`#${menuId}`);
      if (menuEl) sidebar.appendChild(menuEl);
    });
    return true;
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
    restoreHiddenMenus();
    applyHiddenMenus();
    applyLockedMenus();

    try {
      if (saved.themeData["--subMenuOrder"]) {
        const order = safeJsonParse(saved.themeData["--subMenuOrder"]) || [];
        reorderSidebarFromOrder(order.filter(m => m && m.trim() !== "sb_agency-accounts"));
        applySubMenuOrder(order);
      }
    } catch (e) { console.error("[ThemeBuilder] reorder submenu failed", e); }

    try {
      if (saved.themeData["--agencyMenuOrder"]) {
        const agencyOrder = safeJsonParse(saved.themeData["--agencyMenuOrder"]) || [];
        reorderAgencyFromOrder(agencyOrder.filter(m => m && m.trim() !== "sb_agency-accounts"));
      }
    } catch (e) { console.error("[ThemeBuilder] reorder agency menus failed", e); }
  }

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
      const selectedtheme = json.selectedtheme || "";

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
      waitForSidebarAndReapply().finally(() => {
        setTimeout(() => { ThemeBuilder._reapplyLock = false; }, 800);
      });
    },
    _reapplyLock: false
  };

  // ---- Listen to SPA location changes ----
  window.addEventListener("locationchange", () => {
    ThemeBuilder.reapply();
    ThemeBuilder.applyAgencyLogo();
  });

  // ---- Initial bootstrap ----
  // Run applyCSSFile (fetch + inject)
  try { ThemeBuilder.applyCSSFile(); } catch (e) { console.error("[ThemeBuilder] initial apply failed", e); }
  // Apply locked menus a bit later (gives DOM a chance)
  setTimeout(() => { try { applyLockedMenus(); } catch (e) {} }, 3000);
  setTimeout(() => { ThemeBuilder.reapply(); }, 400);
  ThemeBuilder.applyAgencyLogo();

  // Expose to global for manual debugging
  window.ThemeBuilder = ThemeBuilder;
  log("ThemeBuilder initialized");
})();


