const { ConnectionPoolReadyEvent } = require("mongodb");

const cde = "aHR0cHM6Ly90aGVtZS1idWlsZGVyLWRlbHRhLnZlcmNlbC5hcHAvYXBpL3RoZW1lL2ZpbGU/YWdlbmN5SWQ9aWdkNjE4";

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

// ✅ 2️⃣ Then continue with the rest of your code
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
console.log('Here is the Theme Css Data', css);
    if (!cachedCSS) injectCSS(cssText);

    // 📌 FIX: Merge previous themeData with new
    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
    const mergedTheme = { ...(saved.themeData || {}), ...themeData };
console.log('Here is the Theme Css Data', mergedTheme);

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

  localStorage.setItem("userTheme", JSON.stringify({ themeData }));

  const root = document.documentElement;
  Object.keys(themeData).forEach(key => {
    if (key.startsWith("--") && typeof themeData[key] === "string") {
      root.style.setProperty(key, themeData[key]);
    }
  });

  // ✅ Handle submenu order
  if (themeData["--subMenuOrder"]) {
    try {
      let order = JSON.parse(themeData["--subMenuOrder"]);
      order = order.filter(menuId => menuId.trim() !== "sb_agency-accounts");
      applySubMenuOrder(order);

      function reorderSidebar(attempt = 1) {
        const sidebar = document.querySelector(".hl_nav-header nav.flex-1.w-full");
        if (!sidebar) {
          if (attempt < 20) return setTimeout(() => reorderSidebar(attempt + 1), 300);
          return;
        }
        if (Array.isArray(order)) {
          order.forEach(menuId => {
            const item = sidebar.querySelector(`#${menuId}`);
          });
        }
      }
      reorderSidebar();
    } catch (e) {
      console.error("❌ Failed to apply sub menu order:", e);
    }
  }

  // ✅ Handle agency menu order
  if (themeData["--agencyMenuOrder"]) {
    try {
      let agencyOrder = JSON.parse(themeData["--agencyMenuOrder"]);
      agencyOrder = agencyOrder.filter(menuId => menuId.trim() !== "sb_agency-accounts");
      applySubMenuOrder(agencyOrder);

      function reorderAgencySidebar(attempt = 1) {
        const sidebar = document.querySelector(".agency-sidebar");
        if (!sidebar) {
          if (attempt < 20) return setTimeout(() => reorderAgencySidebar(attempt + 1), 300);
          return;
        }
        agencyOrder.forEach(menuId => {
          const menuEl = sidebar.querySelector(`#${menuId}`);
          if (menuEl) sidebar.appendChild(menuEl);
        });
      }

      reorderAgencySidebar();
    } catch (e) {
      console.error("❌ Failed to apply agency menu order:", e);
    }
  }

  // ✅ 🔥 Update login button text
  if (themeData["--login-button-text"]) {
    const newText = themeData["--login-button-text"];
    function updateLoginButton(attempt = 1) {
      const loginBtn = document.querySelector("button.hl-btn.bg-curious-blue-500");
      if (!loginBtn) {
        if (attempt < 20) return setTimeout(() => updateLoginButton(attempt + 1), 300);
        return;
      }
      loginBtn.textContent = newText;
    }
    updateLoginButton();
  }

  // ✅ 🔥 Update login headline text
  if (themeData["--login-headline-text"]) {
    const newHeadline = themeData["--login-headline-text"];
    function updateLoginHeadline(attempt = 1) {
      const headlineEl = document.querySelector("h2.heading2");
      if (!headlineEl) {
        if (attempt < 20) return setTimeout(() => updateLoginHeadline(attempt + 1), 300);
        return;
      }
      headlineEl.textContent = newHeadline;
    }
    updateLoginHeadline();
  }

  // ✅ 🔥 Update "Forgot password?" link
  if (themeData["--forgetpassword-text"]) {
    const newForgotText = themeData["--forgetpassword-text"];
    function updateForgotPasswordText(attempt = 1) {
      const forgotLink = document.querySelector("#forgot_passowrd_btn");
      if (!forgotLink) {
        if (attempt < 20) return setTimeout(() => updateForgotPasswordText(attempt + 1), 300);
        return;
      }
      forgotLink.textContent = newForgotText;
    }
    updateForgotPasswordText();
  }
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

function applyHiddenMenus() {
  restoreHiddenMenus();
}

function bindHideToggle(menuId) {
  const hideInput = document.getElementById("hide-" + menuId);
  const menuEl = document.getElementById(menuId);
  if (!hideInput || !menuEl) return;

  // guard to avoid double-binding
  if (hideInput.dataset.tbBound === "1") return;
  hideInput.dataset.tbBound = "1";

  hideInput.addEventListener("change", () => {
    let saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
    saved.themeData = saved.themeData || {};

    let hiddenMenus = {};
    if (saved.themeData["--hiddenMenus"]) {
      try { hiddenMenus = JSON.parse(saved.themeData["--hiddenMenus"]); }
      catch (e) { console.warn("❌ Failed to parse --hiddenMenus:", e); }
    }

    hiddenMenus[menuId] = { hidden: hideInput.checked };
    menuEl.style.setProperty("display", hideInput.checked ? "none" : "flex", "important");

    saved.themeData["--hiddenMenus"] = JSON.stringify(hiddenMenus);
    localStorage.setItem("userTheme", JSON.stringify(saved));
  });
}

// 🔐 Lock menu logic
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
      // add lock icon once
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
      // remove lock state if present
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
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.5)";
  overlay.style.backdropFilter = "blur(3px)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "99999";

  const popup = document.createElement("div");
  popup.style.background = "#fff";
  popup.style.padding = "20px 30px";
  popup.style.borderRadius = "12px";
  popup.style.maxWidth = "400px";
  popup.style.textAlign = "center";
  popup.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";

  const title = document.createElement("h3");
  title.textContent = "Access Denied";
  title.style.marginBottom = "12px";

  const msg = document.createElement("p");
  msg.textContent = "No access. Please contact the Owner.";
  msg.style.marginBottom = "20px";

  const okBtn = document.createElement("button");
  okBtn.textContent = "OK";
  okBtn.style.padding = "8px 20px";
  okBtn.style.border = "none";
  okBtn.style.borderRadius = "6px";
  okBtn.style.background = "#F54927";
  okBtn.style.color = "#fff";
  okBtn.style.cursor = "pointer";

  okBtn.addEventListener("click", () => overlay.remove());

  popup.appendChild(title);
  popup.appendChild(msg);
  popup.appendChild(okBtn);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

// // 📌 FIX: Reapply theme whenever sidebar DOM changes (prevents losing changes)
// const observer = new MutationObserver(() => {
//   const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
//   if (saved.themeData) {
//     injectThemeData(saved.themeData);
//     restoreHiddenMenus();
//     applyLockedMenus();
//   }
// });

// // Watch sidebar changes
// observer.observe(document.body, { childList: true, subtree: true });

// Initial load
applyCSSFile();

// Apply lock icons after delay
setTimeout(() => applyLockedMenus(), 3000);



// 🔁 1️⃣ Watch for URL changes (SPA route changes)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log("🔁 Route changed, re-applying theme...");
    reapplyTheme();
  }
}).observe(document, { subtree: true, childList: true });

// 🔄 2️⃣ Central function to re-apply everything
// function reapplyTheme() {
//   // small delay to ensure DOM is loaded before we reapply
//   setTimeout(() => {
//     const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
//     if (!saved.themeData) return;

//     // 🔥 Re-apply all customizations
//     injectThemeData(saved.themeData);
//     restoreHiddenMenus();
//     applyHiddenMenus();
//     applyLockedMenus();
//   }, 500);
// }
/* ======= Robust re-apply block (paste BELOW your applyCSSFile call) ======= */

// tiny debounce helper
function debounce(fn, wait = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// try to reorder sidebar DOM (move nodes) from an order array
function reorderSidebarFromOrder(order) {
  const sidebar = document.querySelector(".hl_nav-header nav.flex-1.w-full");
  if (!sidebar) return false;
  order.forEach(menuId => {
    const item = sidebar.querySelector(`#${menuId}`);
    if (item) sidebar.appendChild(item); // move to end in given order
  });
  return true;
}

function reorderAgencyFromOrder(agencyOrder) {
  const sidebar = document.querySelector(".agency-sidebar");
  if (!sidebar) return false;
  agencyOrder.forEach(menuId => {
    const menuEl = sidebar.querySelector(`#${menuId}`);
    if (menuEl) sidebar.appendChild(menuEl);
  });
  return true;
}

// central reapply function (safe to call multiple times)
function reapplyTheme() {
  console.log("🔄 [reapplyTheme] Triggered - Waiting 80ms for DOM to settle...");

  setTimeout(() => {
    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
    if (!saved.themeData) {
      console.warn("⚠️ [reapplyTheme] No themeData found in localStorage. Skipping re-apply.");
      return;
    }

    console.log("✅ [reapplyTheme] Theme data found. Starting re-apply...");

    // Re-inject CSS variables + text updates
    console.log("🎨 [reapplyTheme] Injecting theme data (CSS variables, texts, etc.)...");
    injectThemeData(saved.themeData);

    // Re-apply hidden + locked menus
    console.log("👁️‍🗨️ [reapplyTheme] Restoring hidden menus...");
    restoreHiddenMenus();

    console.log("🔒 [reapplyTheme] Applying hidden menu states...");
    applyHiddenMenus();

    console.log("🔐 [reapplyTheme] Applying locked menu states...");
    applyLockedMenus();

    // Reorder sidebar if needed
    try {
      if (saved.themeData["--subMenuOrder"]) {
        const order = JSON.parse(saved.themeData["--subMenuOrder"]);
        console.log("📂 [reapplyTheme] Applying SubMenu Order:", order);
        reorderSidebarFromOrder(order.filter(m => m && m.trim() !== "sb_agency-accounts"));
      } else {
        console.log("ℹ️ [reapplyTheme] No SubMenu order found.");
      }
    } catch (e) {
      console.error("❌ [reapplyTheme] Failed to reorder submenus:", e);
    }

    // Reorder agency sidebar if needed
    try {
      if (saved.themeData["--agencyMenuOrder"]) {
        const agencyOrder = JSON.parse(saved.themeData["--agencyMenuOrder"]);
        console.log("🏢 [reapplyTheme] Applying Agency Menu Order:", agencyOrder);
        reorderAgencyFromOrder(agencyOrder.filter(m => m && m.trim() !== "sb_agency-accounts"));
      } else {
        console.log("ℹ️ [reapplyTheme] No Agency menu order found.");
      }
    } catch (e) {
      console.error("❌ [reapplyTheme] Failed to reorder agency menus:", e);
    }

    console.log("✅ [reapplyTheme] Finished successfully.");
  }, 80); // small tick to let SPA router render new DOM
}

// ------------- SPA navigation detection -------------
// dispatch a custom event when history API changes
(function() {
  const _push = history.pushState;
  history.pushState = function() {
    const res = _push.apply(this, arguments);
    window.dispatchEvent(new Event("locationchange"));
    return res;
  };
  const _replace = history.replaceState;
  history.replaceState = function() {
    const res = _replace.apply(this, arguments);
    window.dispatchEvent(new Event("locationchange"));
    return res;
  };
  window.addEventListener("popstate", () => window.dispatchEvent(new Event("locationchange")));
})();

// when location changes, reapply (debounced)
const debouncedReapply = debounce(() => reapplyTheme(), 120);
window.addEventListener("locationchange", debouncedReapply);

// also intercept internal anchor clicks that cause SPA navigation (fallback)
document.addEventListener("click", (ev) => {
  const a = ev.target.closest && ev.target.closest("a[href]");
  if (!a || !a.href) return;
  // only same-origin internal links
  try {
    const url = new URL(a.href, location.href);
    if (url.origin === location.origin && !a.hasAttribute("data-no-reapply")) {
      // small delay because router may update DOM asynchronously
      setTimeout(() => reapplyTheme(), 120);
    }
  } catch (e) {}
});

// ------------- watch the sidebar specifically (debounced) -------------
let _sidebarObserver;
function watchSidebarDom() {
  // look for the main sidebar(s)
  const sidebar = document.querySelector(".hl_nav-header nav.flex-1.w-full") || document.querySelector(".agency-sidebar");
  if (!sidebar) {
    return setTimeout(watchSidebarDom, 400);
  }

  // single observer (avoid creating multiples)
  if (_sidebarObserver) {
    _sidebarObserver.disconnect();
  }

  _sidebarObserver = new MutationObserver(debounce((mutations) => {
    // reapply once mutations stop
    reapplyTheme();
  }, 140));

  _sidebarObserver.observe(sidebar, { childList: true, subtree: true });
}

// start watching now
watchSidebarDom();

// also run once immediately (after initial CSS is applied)
setTimeout(() => {
  reapplyTheme();
}, 400);

