const cde = "aHR0cHM6Ly90aGVtZS1idWlsZGVyLWRlbHRhLnZlcmNlbC5hcHAvYXBpL3RoZW1lL2ZpbGU/YWdlbmN5SWQ9aWdkNjE4";
const agn = "aWdkNjE4";
// ✅ 1️⃣ Define this function FIRST
function applySubMenuOrder(order) {
  if (!Array.isArray(order)) {
    console.warn("⚠️ No valid submenu order provided to applySubMenuOrder()");
    return;
  }
  const root = document.documentElement;
  order.forEach((menuId, index) => {
    const varName = `--${menuId.replace("sb_", "")}-order`;
    root.style.setProperty(varName, index);
  });
}

// ✅ 2️⃣ Fetch and apply CSS theme file
async function applyCSSFile() {
  try {
    const url = atob(cde);
    const cachedCSS = localStorage.getItem("themeCSS");
    if (cachedCSS) injectCSS(decodeBase64Utf8(cachedCSS));

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load file");
    const { css, themeData } = await res.json();
    const cssText = decodeBase64Utf8(css);
    localStorage.setItem("themeCSS", css);
    if (!cachedCSS) injectCSS(cssText);

    // 📌 Merge previous themeData with new
    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
    const mergedTheme = { ...(saved.themeData || {}), ...themeData };

    injectThemeData(mergedTheme);
    restoreHiddenMenus();
    applyHiddenMenus();
  } catch (err) {
    console.error("❌ Failed to apply CSS:", err.message);
  }
}

function injectCSS(cssText) {
  const oldStyle = document.getElementById("theme-css");
  if (oldStyle) oldStyle.remove();
  const style = document.createElement("style");
  style.id = "theme-css";
  style.innerHTML = cssText;
  document.head.appendChild(style);
}

function injectThemeData(themeData) {
  if (!themeData || typeof themeData !== "object") return;

  localStorage.setItem("userTheme", JSON.stringify({ themeData,agn }));
  const root = document.documentElement;

  Object.keys(themeData).forEach(key => {
    if (key.startsWith("--") && typeof themeData[key] === "string") {
      root.style.setProperty(key, themeData[key]);
    }
  });

  // // ✅ Handle submenu order
  // if (themeData["--subMenuOrder"]) {
  //   try {
  //     let order = JSON.parse(themeData["--subMenuOrder"]);
  //     order = order.filter(menuId => menuId.trim() !== "sb_agency-accounts");
  //     applySubMenuOrder(order);
  //   } catch (e) {
  //     console.error("❌ Failed to apply sub menu order:", e);
  //   }
  // }

  // // ✅ Handle agency menu order
  // if (themeData["--agencyMenuOrder"]) {
  //   try {
  //     let agencyOrder = JSON.parse(themeData["--agencyMenuOrder"]);
  //     agencyOrder = agencyOrder.filter(menuId => menuId.trim() !== "sb_agency-accounts");
  //     applySubMenuOrder(agencyOrder);
  //   } catch (e) {
  //     console.error("❌ Failed to apply agency menu order:", e);
  //   }
  // }

  // ✅ Update login button text
  if (themeData["--login-button-text"]) updateElementText("button.hl-btn.bg-curious-blue-500", themeData["--login-button-text"]);
  if (themeData["--login-headline-text"]) updateElementText("h2.heading2", themeData["--login-headline-text"]);
  if (themeData["--forgetpassword-text"]) updateElementText("#forgot_passowrd_btn", themeData["--forgetpassword-text"]);
}

function updateElementText(selector, newText, attempt = 1) {
  const el = document.querySelector(selector);
  if (!el && attempt < 20) return setTimeout(() => updateElementText(selector, newText, attempt + 1), 300);
  if (el) el.textContent = newText;
}

function decodeBase64Utf8(base64) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(bytes);
}

function restoreHiddenMenus() {
  const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
  if (!saved.themeData || !saved.themeData["--hiddenMenus"]) return;

  let hiddenMenus = {};
  try {
    hiddenMenus = JSON.parse(saved.themeData["--hiddenMenus"]);
  } catch (e) {
    console.warn("❌ Failed to parse --hiddenMenus:", e);
    return;
  }

  Object.keys(hiddenMenus).forEach(menuId => {
    const menuEl = document.getElementById(menuId);
    const toggleEl = document.getElementById("hide-" + menuId);
    if (!menuEl) return;

    menuEl.style.setProperty("display", hiddenMenus[menuId].hidden ? "none" : "flex", "important");
    if (toggleEl) toggleEl.checked = hiddenMenus[menuId].hidden;
  });
}

function applyHiddenMenus() { restoreHiddenMenus(); }

function applyLockedMenus() {
  const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
  if (!saved.themeData || !saved.themeData["--hiddenMenus"]) return;

  let hiddenMenus = {};
  try {
    hiddenMenus = JSON.parse(saved.themeData["--hiddenMenus"]);
  } catch (e) {
    console.warn("❌ Failed to parse --hiddenMenus:", e);
    return;
  }

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
        menuEl.addEventListener("click", blockMenuClick);
        menuEl.dataset.tbLockBound = "1";
      }
    } else {
      const icon = menuEl.querySelector(".tb-lock-icon");
      if (icon) icon.remove();
      menuEl.style.opacity = "";
      menuEl.style.cursor = "";
      if (menuEl.dataset.tbLockBound === "1") {
        menuEl.removeEventListener("click", blockMenuClick);
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
function observeSidebarMutations(sidebar) {
  const observer = new MutationObserver((mutations) => {
    _doReapplyTheme();
  });

  observer.observe(sidebar, { childList: true, subtree: true });
}

// 📌 NEW: Wait for sidebar before applying theme
function waitForSidebarAndReapply(retries = 60) {
  let attempt = 0;
  const interval = setInterval(() => {
    attempt++;

    // ✅ Target the real sidebar container
    const sidebar = document.querySelector(".hl_nav-header nav");
    // ✅ Make sure it actually has menu items
    const menuItems = sidebar?.querySelectorAll("li, a, div[id^='sb_']") || [];

    if (sidebar && menuItems.length > 5) {
      clearInterval(interval);
      _doReapplyTheme();

      // ✅ Start watching for future DOM changes
      observeSidebarMutations(sidebar);
    }

    if (attempt >= retries) {
      clearInterval(interval);
    }
  }, 300);
}
  


// Core logic separated
function _doReapplyTheme() {
  const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
  if (!saved.themeData) {
    console.warn("⚠️ No theme data found.");
    return;
  }

  injectThemeData(saved.themeData);

  restoreHiddenMenus();
  applyHiddenMenus();

  applyLockedMenus();

  // ✅ Reorder Submenu if available
  try {
    if (saved.themeData["--subMenuOrder"]) {
      const order = JSON.parse(saved.themeData["--subMenuOrder"]);
      reorderSidebarFromOrder(order.filter(m => m && m.trim() !== "sb_agency-accounts"));
    } else {
    }
  } catch (e) {
    console.error("❌ Failed to reorder submenu:", e);
  }

  // ✅ Reorder Agency Sidebar if available
  try {
    if (saved.themeData["--agencyMenuOrder"]) {
      const agencyOrder = JSON.parse(saved.themeData["--agencyMenuOrder"]);
      reorderAgencyFromOrder(agencyOrder.filter(m => m && m.trim() !== "sb_agency-accounts"));
    } else {
    }
  } catch (e) {
    console.error("❌ Failed to reorder agency menus:", e);
  }

}

// ✅ Helper: Reorder Submenu (Main Sidebar)
function reorderSidebarFromOrder(order) {
  const sidebar = document.querySelector(".hl_nav-header nav.flex-1.w-full");
  if (!sidebar || !Array.isArray(order)) return false;

  order.forEach(menuId => {
    const item = sidebar.querySelector(`#${menuId}`);
    if (item) sidebar.appendChild(item); // re-append in correct order
  });
  return true;
}

// ✅ Helper: Reorder Agency Sidebar
function reorderAgencyFromOrder(agencyOrder) {
  const sidebar = document.querySelector(".agency-sidebar");
  if (!sidebar || !Array.isArray(agencyOrder)) return false;

  agencyOrder.forEach(menuId => {
    const menuEl = sidebar.querySelector(`#${menuId}`);
    if (menuEl) sidebar.appendChild(menuEl); // re-append in correct order
  });
  return true;
}
// Central reapply function
function reapplyTheme() {
  waitForSidebarAndReapply();
}

// ============================= SPA Detection =============================
(function() {
  const _push = history.pushState;
  history.pushState = function() { const res = _push.apply(this, arguments); window.dispatchEvent(new Event("locationchange")); return res; };
  const _replace = history.replaceState;
  history.replaceState = function() { const res = _replace.apply(this, arguments); window.dispatchEvent(new Event("locationchange")); return res; };
  window.addEventListener("popstate", () => window.dispatchEvent(new Event("locationchange")));
})();
window.addEventListener("locationchange", () => reapplyTheme());

// ✅ Initial load
applyCSSFile();
setTimeout(() => applyLockedMenus(), 3000);
setTimeout(() => reapplyTheme(), 400);
