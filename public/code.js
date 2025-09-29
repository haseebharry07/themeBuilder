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
}

function decodeBase64Utf8(base64) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(bytes);
}
function applyHiddenMenus() {
    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
    if (!saved.themeData || !saved.themeData["--hiddenMenus"]) return;

    let hidden = {};
    try { hidden = JSON.parse(saved.themeData["--hiddenMenus"]); }
    catch (e) { console.warn("❌ Failed to parse --hiddenMenus:", e); return; }

    Object.keys(hidden).forEach(menuId => {
        const menuEl = document.getElementById(menuId);
        const toggleEl = document.getElementById("hide-" + menuId);

        if (!menuEl || !toggleEl) return;

        // Show/hide menu
        menuEl.style.setProperty("display", hidden[menuId].hidden ? "none" : "flex", "important");

        // Restore toggle button correctly
        toggleEl.checked = !!hidden[menuId].toggleChecked;
    });
}

  function restoreHiddenMenus() {
      const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
      if (!saved.themeData || !saved.themeData["--hiddenMenus"]) return;

      let hidden = {};
      try {
          hidden = JSON.parse(saved.themeData["--hiddenMenus"]);
      } catch (e) {
          console.warn("❌ Failed to parse --hiddenMenus:", e);
          return;
      }

      Object.keys(hidden).forEach(menuId => {
          const menuEl = document.getElementById(menuId);
          const toggleEl = document.getElementById("hide-" + menuId);

          if (!menuEl || !toggleEl) return;

          // Restore inline display
          menuEl.style.setProperty("display", hidden[menuId].hidden ? "none" : "flex", "important");

          // Restore toggle button
          toggleEl.checked = hidden[menuId].toggleChecked;
      });
  }


applyCSSFile();
