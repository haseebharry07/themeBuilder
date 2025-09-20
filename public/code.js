const cde = "aHR0cHM6Ly90aGVtZS1idWlsZGVyLWRlbHRhLnZlcmNlbC5hcHAvYXBpL3RoZW1lL2ZpbGU/YWdlbmN5SWQ9aWdkNjE4";

async function applyCSSFile() {
    try {
        const url = atob(cde);
        // Check cached CSS first
        const cachedCSS = localStorage.getItem("themeCSS");
        if (cachedCSS) injectCSS(atob(cachedCSS));
        // Fetch API
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load file");
        const { css, themeData } = await res.json();
        // Inject CSS
        const cssText = atob(css);
        localStorage.setItem("themeCSS", css);
        if (!cachedCSS) injectCSS(cssText);
        // Inject themeData as CSS variables
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
    const oldTheme = document.getElementById("theme-vars");
    if (oldTheme) oldTheme.remove();
    const style = document.createElement("style");
    style.id = "theme-vars";
    // Build :root block
    let vars = ":root {";
    for (const [key, value] of Object.entries(themeData)) {
        vars += `${key}: ${value};`;
    }
    vars += "}";

    style.innerHTML = vars;
    document.head.appendChild(style);
}

applyCSSFile();
