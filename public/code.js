const cde = "aHR0cHM6Ly90aGVtZS1idWlsZGVyLWRlbHRhLnZlcmNlbC5hcHAvYXBpL3RoZW1lL2ZpbGU/YWdlbmN5SWQ9aWdkNjE4";

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
}

function decodeBase64Utf8(base64) {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(bytes);
}

applyCSSFile();
