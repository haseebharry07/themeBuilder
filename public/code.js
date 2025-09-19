const cde = "aHR0cHM6Ly90aGVtZS1idWlsZGVyLWRlbHRhLnZlcmNlbC5hcHAvYXBpL3RoZW1lL2ZpbGU/YWdlbmN5SWQ9aWdkNjE4";
async function applyCSSFile() {
    try {
        const ced = atob(cde);
        const cachedCSS = localStorage.getItem("themeCSS");
        if (cachedCSS) injectCSS(atob(cachedCSS));
        const res = await fetch(ced);
        if (!res.ok) throw new Error("Failed to load file");
        const data = await res.json();
        const cssText = atob(data.css);
        localStorage.setItem("themeCSS", data.css);
        if (!cachedCSS) injectCSS(cssText);

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

applyCSSFile();
