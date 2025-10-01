(function () {
  if (!document.querySelector('link[href*="font-awesome"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
    link.crossOrigin = "anonymous";
    link.referrerPolicy = "no-referrer";
    document.head.appendChild(link);
    console.log("✅ Font Awesome CSS loaded dynamically.");
  } else {
    console.log("ℹ️ Font Awesome already loaded, skipping...");
  }
})();

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
  setTimeout(applyMenuCustomizationsFromTheme, 500);

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
    if (!menuEl) {
      console.warn(`⚠️ Menu element with ID '${menuId}' not found`);
      return;
    }

    const { title, icon } = customizations[menuId] || {};

    // 🏷️ Update the title if provided
    const titleSpan = menuEl.querySelector(".nav-title");
    if (titleSpan && title) {
      titleSpan.textContent = title;
    }

    // 🔄 Remove any existing icon
    const oldImg = menuEl.querySelector("img");
    const oldI = menuEl.querySelector("i");
    if (oldImg) oldImg.remove();
    if (oldI) oldI.remove();

    // 🎨 Build a new <i> element from Unicode (like f015)
      if (icon && /^f?[0-9a-f]{3}$/i.test(icon)) {
        const cleanIcon = icon.startsWith("f") ? icon : `f${icon}`;
        const iconEl = document.createElement("i");
        iconEl.className = "fa-solid";
        iconEl.innerHTML = `&#x${cleanIcon};`; // ← Correct Unicode usage
        iconEl.style.fontFamily = "Font Awesome 6 Free";
        iconEl.style.fontWeight = "900"; // solid icons
        iconEl.style.fontSize = "16px";
        iconEl.style.marginRight = "0.5rem";
        iconEl.style.fontStyle = "normal";
        iconEl.style.fontVariant = "normal";
        iconEl.style.textRendering = "auto";
        iconEl.style.lineHeight = "1";

        // Insert before the title
        menuEl.prepend(iconEl);

        console.log(`✅ Icon for '${menuId}' set to: \\u${cleanIcon}`);
      } else {
        console.warn(`⚠️ Icon value for '${menuId}' is invalid or missing:`, icon);
      }
  });
}


applyCSSFile();
