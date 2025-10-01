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
    if (!cachedCSS) injectCSS(cssText);
    injectThemeData(themeData); // ✅ No error now!
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
localStorage.setItem("userTheme", JSON.stringify({
    themeData: themeData
}));  // ... your existing themeData logic ...

  if (themeData["--subMenuOrder"]) {
    try {
      const order = JSON.parse(themeData["--subMenuOrder"]);

      // ✅ This now works, because the function is already defined
      applySubMenuOrder(order);

      // Then run your reorder logic...
      function reorderSidebar(attempt = 1) {
        const sidebar = document.querySelector(".hl_nav-header nav.flex-1.w-full");
        if (!sidebar) {
          if (attempt < 20) return setTimeout(() => reorderSidebar(attempt + 1), 300);
          console.warn("⚠️ Sidebar still not found after 20 attempts.");
          return;
        }

        const allItems = sidebar.querySelectorAll("a[id]");

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
  applyMenuCustomizationsFromTheme();
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
        if (!menuEl || !toggleEl) return;

        // ✅ Show/hide menu based on 'hidden'
        menuEl.style.setProperty("display", hiddenMenus[menuId].hidden ? "none" : "flex", "important");

        // ✅ Set toggle to match menu hidden state
        toggleEl.checked = hiddenMenus[menuId].hidden;

        // ✅ Add listener to update hidden state on toggle change
        toggleEl.addEventListener("change", () => {
            hiddenMenus[menuId].hidden = toggleEl.checked; // only use 'hidden'
            menuEl.style.setProperty("display", hiddenMenus[menuId].hidden ? "none" : "flex", "important");

            // Save updated state
            saved.themeData["--hiddenMenus"] = JSON.stringify(hiddenMenus);
            localStorage.setItem("userTheme", JSON.stringify(saved));
        });
    });
}


function applyHiddenMenus() {
    // ✅ Just call restoreHiddenMenus to unify logic
    restoreHiddenMenus();
}

// Save hide toggle change
function bindHideToggle(menuId) {
    const hideInput = document.getElementById("hide-" + menuId);
    const menuEl = document.getElementById(menuId);

    if (!hideInput || !menuEl) return;

    hideInput.addEventListener("change", () => {
        let saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
        saved.themeData = saved.themeData || {};

        let hiddenMenus = {};
        if (saved.themeData["--hiddenMenus"]) {
            try { hiddenMenus = JSON.parse(saved.themeData["--hiddenMenus"]); }
            catch (e) { console.warn("❌ Failed to parse --hiddenMenus:", e); }
        }

        if (hideInput.checked) {
            // hiddenMenus[menuId] = { hidden: true, display: "none !important", toggleChecked: true };
            menuEl.style.setProperty("display", "none", "important");
        } else {
            hiddenMenus[menuId] = { hidden: false, display: "flex !important", toggleChecked: false };
            menuEl.style.setProperty("display", "flex", "important");
        }

        saved.themeData["--hiddenMenus"] = JSON.stringify(hiddenMenus);
        localStorage.setItem("userTheme", JSON.stringify(saved));
    });
}
function applyMenuCustomizationsFromTheme() {
  const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
  const themeData = saved.themeData || {};
  
  if (!themeData["--menuCustomizations"]) return;
  
  let customizations = {};
  try {
    customizations = JSON.parse(themeData["--menuCustomizations"]);
  } catch (e) {
    console.warn("❌ Failed to parse --menuCustomizations:", e);
    return;
  }

  Object.keys(customizations).forEach(menuId => {
    const menuEl = document.getElementById(menuId);
    if (!menuEl) return;

    const { title, icon } = customizations[menuId];

    // 🏷️ Apply custom title if any
    const titleSpan = menuEl.querySelector(".nav-title");
    if (titleSpan && title) {
      titleSpan.textContent = title;
    }

    // 🔄 Remove any old icon
    const oldImg = menuEl.querySelector("img");
    const oldI = menuEl.querySelector("i");
    if (oldImg) oldImg.remove();
    if (oldI) oldI.remove();

    // 🎨 Build new icon
    if (icon) {
      let iconEl;
      if (/^https?:\/\//.test(icon)) {
        // ✅ URL icon (image)
        iconEl = document.createElement("img");
        iconEl.src = icon;
        iconEl.alt = title || "icon";
        iconEl.className = "md:mr-0 h-5 w-5 mr-2 lg:mr-2 xl:mr-2";
      } else if (/^f[0-9a-f]+$/i.test(icon)) {
        // ✅ Unicode like "f015"
        iconEl = document.createElement("i");
        iconEl.className = "fa-solid";
        iconEl.innerHTML = `&#x${icon};`;
        iconEl.style.fontFamily = "Font Awesome 6 Free";
        iconEl.style.fontWeight = "900";
        iconEl.style.fontSize = "16px";
        iconEl.style.marginRight = "0.5rem";
      } else {
        // ✅ Font Awesome class (e.g., fa-house)
        iconEl = document.createElement("i");
        iconEl.className = icon.includes("fa-") ? icon : `fa-solid ${icon}`;
        iconEl.style.fontFamily = "Font Awesome 6 Free";
        iconEl.style.fontWeight = "900";
        iconEl.style.fontSize = "16px";
        iconEl.style.marginRight = "0.5rem";
      }

      // Add icon before the title
      menuEl.prepend(iconEl);
    }
  });
}


applyCSSFile();
