const cde = "aHR0cHM6Ly90aGVtZS1idWlsZGVyLWRlbHRhLnZlcmNlbC5hcHAvYXBpL3RoZW1lL2ZpbGU/YWdlbmN5SWQ9aWdkNjE4";

function applySubMenuOrder(order) {
  const root = document.documentElement; // :root for CSS vars
  order.forEach((menuId, index) => {
    const varName = `--${menuId.replace("sb_", "")}-order`;
    root.style.setProperty(varName, index);
    console.log(`🎨 Set ${varName} = ${index}`);
  });
}

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
        injectThemeData(themeData);
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
        console.log("🎨 Theme Data received:", themeData); // ✅ DEBUG LOG

    const oldTheme = document.getElementById("theme-vars");
    if (oldTheme) oldTheme.remove();
    const style = document.createElement("style");
    style.id = "theme-vars";
    let vars = ":root {";
    for (const [key, value] of Object.entries(themeData)) {
        vars += `${key}: ${value};`;
    }
    vars += "}";
    style.innerHTML = vars;
    document.head.appendChild(style);
    localStorage.setItem("userTheme", JSON.stringify({ themeData }));
     if (themeData["--login-headline-text"]) {
                const heading = document.querySelector(".hl_login .hl_login--body .login-card-heading h2");
                if (heading) {
                    heading.textContent = themeData["--login-headline-text"];
                }
            }

        // === Apply Button Text ===
        if (themeData["--login-button-text"]) {
            const loginBtn = document.querySelector(".hl_login .hl_login--body button.hl-btn");
            if (loginBtn) {
                loginBtn.textContent = themeData["--login-button-text"];
            }
        }
        // 📁 3. Apply Agency Sidebar Order
    if (themeData["--agencyMenuOrder"]) {
        try {
            const order = JSON.parse(themeData["--agencyMenuOrder"]); // Should be array of IDs
                        console.log("🏢 Agency Menu Order from DB:", order); // ✅ DEBUG LOG

            const sidebar = document.querySelector(".hl_nav-header nav.flex-1.w-full");
                        console.log("📁 Agency Sidebar Element:", sidebar); // ✅ DEBUG LOG

            if (sidebar && Array.isArray(order)) {
                order.forEach(menuId => {
                    const item = sidebar.querySelector(`#${menuId}`);
                                        console.log(`🔁 Agency Item Found (${menuId}):`, !!item); // ✅ DEBUG LOG

                    if (item) sidebar.appendChild(item); // Move to end in correct order
                });
            }
        } catch (e) {
            console.error("❌ Failed to apply agency menu order:", e);
        }
    }

    // 📂 4. Apply Sub-Account Sidebar Order (optional, if you have a sub-account section)
      // 📂 4. Apply Sub-Account Sidebar Order
    // 📂 4. Apply Sub-Account Sidebar Order (wait for DOM)
if (themeData["--subMenuOrder"]) {
    try {
        const order = JSON.parse(themeData["--subMenuOrder"]);
        console.log("📂 Sub-Account Menu Order from DB:", order);

        function applySubMenuOrder(attempt = 1) {
            const sidebar = document.querySelector(".hl_nav-header nav.flex-1.w-full");

            if (!sidebar) {
                console.log(`⏳ Sub-Account sidebar not found yet (attempt ${attempt})...`);
                if (attempt < 20) {
                    // retry every 300ms up to ~6s
                    return setTimeout(() => applySubMenuOrder(attempt + 1), 300);
                } else {
                    console.warn("⚠️ Sidebar still not found after 20 attempts.");
                    return;
                }
            }

            console.log("✅ Sub-Account Sidebar found! Total children:", sidebar.children.length);

            const allItems = sidebar.querySelectorAll("a[id]");
            console.log("📜 Menu items present before reordering:", allItems.length);

            if (Array.isArray(order)) {
                order.forEach(menuId => {
                    const item = sidebar.querySelector(`#${menuId}`);
                    console.log(`🔁 Trying to reorder ${menuId} →`, !!item);
                    if (item) sidebar.appendChild(item);
                    else console.warn(`⚠️ Menu item ${menuId} not found in DOM`);
                });
            }

            console.log("✅ Sub-Account Menu Reorder Complete!");
        }

        // ⏱ Try reordering when DOM is ready
        applySubMenuOrder();
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

applyCSSFile();
