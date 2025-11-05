

// ThemeBuilder - safer, namespaced, production-ready
(function () {
  const NS = "themebuilder"; // namespace prefix for storage & IDs
  const STORAGE = {
    themeCSS: `${NS}_themeCSS`,
    userTheme: `userTheme`,
    selectedTheme: `${NS}_selectedTheme`,
    agn: `agn`
  };
  // const agn = "aWdkNjE4";
  // ✅ 1. Handle dynamic agencyId (agn)
  //  const remoteEncoded = `aHR0cHM6Ly90aGVtZS1idWlsZGVyLWRlbHRhLnZlcmNlbC5hcHAvYXBpL3RoZW1lL2ZpbGU/YWdlbmN5SWQ9${agn}`;
  // local agnasd
  
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
    ensureSidebarTitleStyle();

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
 // === Subaccount Sidebar Menu Title Support ===
  function ensureSidebarTitleStyle() {
    let style = document.getElementById("tb-subaccount-title-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "tb-subaccount-title-style";
      document.head.appendChild(style);
    }

    style.innerHTML = `
      /* Hide original titles & use CSS variables for each */
      a[meta="launchpad"] .nav-title { visibility: hidden; position: relative; }
      a[meta="launchpad"] .nav-title::after { content: var(--sb_launchpad-new-name, "Launchpad"); visibility: visible; position: absolute; left: 0; }

      a[meta="dashboard"] .nav-title { visibility: hidden; position: relative; }
      a[meta="dashboard"] .nav-title::after { content: var(--sb_dashboard-new-name, "Dashboard"); visibility: visible; position: absolute; left: 0; }

      a[meta="conversations"] .nav-title { visibility: hidden; position: relative; }
      a[meta="conversations"] .nav-title::after { content: var(--sb_conversations-new-name, "Conversations"); visibility: visible; position: absolute; left: 0; }

      a[meta="calendars"] .nav-title { visibility: hidden; position: relative; }
      a[meta="calendars"] .nav-title::after { content: var(--sb_calendars-new-name, "Calendars"); visibility: visible; position: absolute; left: 0; }

      a[meta="contacts"] .nav-title { visibility: hidden; position: relative; }
      a[meta="contacts"] .nav-title::after { content: var(--sb_contacts-new-name, "Contacts"); visibility: visible; position: absolute; left: 0; }

      a[meta="opportunities"] .nav-title { visibility: hidden; position: relative; }
      a[meta="opportunities"] .nav-title::after { content: var(--sb_opportunities-new-name, "Opportunities"); visibility: visible; position: absolute; left: 0; }

      a[meta="payments"] .nav-title { visibility: hidden; position: relative; }
      a[meta="payments"] .nav-title::after { content: var(--sb_payments-new-name, "Payments"); visibility: visible; position: absolute; left: 0; }

      a[meta="email-marketing"] .nav-title { visibility: hidden; position: relative; }
      a[meta="email-marketing"] .nav-title::after { content: var(--sb_email-marketing-new-name, "Email Marketing"); visibility: visible; position: absolute; left: 0; }

      a[meta="automation"] .nav-title { visibility: hidden; position: relative; }
      a[meta="automation"] .nav-title::after { content: var(--sb_automation-new-name, "Automation"); visibility: visible; position: absolute; left: 0; }

      a[meta="sites"] .nav-title { visibility: hidden; position: relative; }
      a[meta="sites"] .nav-title::after { content: var(--sb_sites-new-name, "Sites"); visibility: visible; position: absolute; left: 0; }

      a[meta="memberships"] .nav-title { visibility: hidden; position: relative; }
      a[meta="memberships"] .nav-title::after { content: var(--sb_memberships-new-name, "Memberships"); visibility: visible; position: absolute; left: 0; }

      a[meta="app-media"] .nav-title { visibility: hidden; position: relative; }
      a[meta="app-media"] .nav-title::after { content: var(--sb_app-media-new-name, "App Media"); visibility: visible; position: absolute; left: 0; }

      a[meta="reputation"] .nav-title { visibility: hidden; position: relative; }
      a[meta="reputation"] .nav-title::after { content: var(--sb_reputation-new-name, "Reputation"); visibility: visible; position: absolute; left: 0; }

      a[meta="reporting"] .nav-title { visibility: hidden; position: relative; }
      a[meta="reporting"] .nav-title::after { content: var(--sb_reporting-new-name, "Reporting"); visibility: visible; position: absolute; left: 0; }

      a[meta="app-marketplace"] .nav-title { visibility: hidden; position: relative; }
      a[meta="app-marketplace"] .nav-title::after { content: var(--sb_app-marketplace-new-name, "App Marketplace"); visibility: visible; position: absolute; left: 0; }

      a[meta="custom-values"] .nav-title { visibility: hidden; position: relative; }
      a[meta="custom-values"] .nav-title::after { content: var(--sb_custom-values-new-name, "Custom Values"); visibility: visible; position: absolute; left: 0; }

      a[meta="manage-scoring"] .nav-title { visibility: hidden; position: relative; }
      a[meta="manage-scoring"] .nav-title::after { content: var(--sb_manage-scoring-new-name, "Manage Scoring"); visibility: visible; position: absolute; left: 0; }

      a[meta="domains-urlRedirects"] .nav-title { visibility: hidden; position: relative; }
      a[meta="domains-urlRedirects"] .nav-title::after { content: var(--sb_domains-urlRedirects-new-name, "Domains & URL Redirects"); visibility: visible; position: absolute; left: 0; }

      a[meta="integrations"] .nav-title { visibility: hidden; position: relative; }
      a[meta="integrations"] .nav-title::after { content: var(--sb_integrations-new-name, "Integrations"); visibility: visible; position: absolute; left: 0; }

      a[meta="tags"] .nav-title { visibility: hidden; position: relative; }
      a[meta="tags"] .nav-title::after { content: var(--sb_tags-new-name, "Tags"); visibility: visible; position: absolute; left: 0; }

      a[meta="labs"] .nav-title { visibility: hidden; position: relative; }
      a[meta="labs"] .nav-title::after { content: var(--sb_labs-new-name, "Labs"); visibility: visible; position: absolute; left: 0; }

      a[meta="audit-logs-location"] .nav-title { visibility: hidden; position: relative; }
      a[meta="audit-logs-location"] .nav-title::after { content: var(--sb_audit-logs-location-new-name, "Audit Logs"); visibility: visible; position: absolute; left: 0; }

      a[meta="brand-boards"] .nav-title { visibility: hidden; position: relative; }
      a[meta="brand-boards"] .nav-title::after { content: var(--sb_brand-boards-new-name, "Brand Boards"); visibility: visible; position: absolute; left: 0; }

      a[meta="business_info"] .nav-title { visibility: hidden; position: relative; }
      a[meta="business_info"] .nav-title::after { content: var(--sb_business_info-new-name, "Business Profile"); visibility: visible; position: absolute; left: 0; }

      a[meta="saas-billing"] .nav-title { visibility: hidden; position: relative; }
      a[meta="saas-billing"] .nav-title::after { content: var(--sb_saas-billing-new-name, "Billing"); visibility: visible; position: absolute; left: 0; }

      a[meta="my-staff"] .nav-title { visibility: hidden; position: relative; }
      a[meta="my-staff"] .nav-title::after { content: var(--sb_my-staff-new-name, "My Staff"); visibility: visible; position: absolute; left: 0; }

      a[meta="location-email-services"] .nav-title { visibility: hidden; position: relative; }
      a[meta="location-email-services"] .nav-title::after { content: var(--sb_location-email-services-new-name, "Email Services"); visibility: visible; position: absolute; left: 0; }

      a[meta="phone-number"] .nav-title { visibility: hidden; position: relative; }
      a[meta="phone-number"] .nav-title::after { content: var(--sb_phone-number-new-name, "Phone Numbers"); visibility: visible; position: absolute; left: 0; }

      a[meta="whatsapp"] .nav-title { visibility: hidden; position: relative; }
      a[meta="whatsapp"] .nav-title::after { content: var(--sb_whatsapp-new-name, "WhatsApp"); visibility: visible; position: absolute; left: 0; }

      a[meta="objects"] .nav-title { visibility: hidden; position: relative; }
      a[meta="objects"] .nav-title::after { content: var(--sb_objects-new-name, "Objects"); visibility: visible; position: absolute; left: 0; }

      a[meta="custom-fields-settings"] .nav-title { visibility: hidden; position: relative; }
      a[meta="custom-fields-settings"] .nav-title::after { content: var(--sb_custom-fields-settings-new-name, "Custom Fields"); visibility: visible; position: absolute; left: 0; }
    `;
  }

  // Watch for re-renders (GHL dynamically reloads sidebar)
  const observer = new MutationObserver(() => ensureSidebarTitleStyle());
  observer.observe(document.body, { childList: true, subtree: true });

  console.log("✅ Subaccount title watcher initialized");
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



window.addEventListener("load", () => {
  console.log('Loader related It is working');
  document.body.classList.add("loaded");
  document.querySelectorAll("#app + .app-loader, #app > .hl-loader-container")
    .forEach(l => l.remove());
});