// Minimal MVP: random replacement using local dictionary
// This script runs on every page to replace words with their translations

let SETTINGS = { replacePct: 100, targetLang: "es" };

// load settings + dictionary once per page
(async function init() {
    const s = await chrome.storage.local.get(["replacePct", "targetLang"]);
    SETTINGS = { ...SETTINGS, ...s };
    DICT = await fetch(chrome.runtime.getURL("dict/en_es.json")).then(r => r.json());
    ensureTooltip();
    await replaceInPage(); // document.body is default root
    const observer = new MutationObserver(async (mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === "childList" && (mutation.addedNodes.length > 0)) {
                await replaceInPage();
                break; // Only need to run once per batch
            }
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();

function ensureTooltip() {
    if (document.getElementById("liw-tooltip")) return;
    const tip = document.createElement("div");
    tip.id = "liw-tooltip";
    document.documentElement.appendChild(tip);
    document.addEventListener("mousemove", (e) => {
        const t = document.getElementById("liw-tooltip");
        if (!t || t.style.display === "none") return;
        const PAD = 12;
        t.style.left = (e.clientX + PAD) + "px";
        t.style.top = (e.clientY + PAD) + "px";
    });
}

function showTooltip(text) {
    const t = document.getElementById("liw-tooltip");
    if (!t) return;
    t.textContent = text;
    t.style.display = "block";
}
function hideTooltip() {
    const t = document.getElementById("liw-tooltip");
    if (!t) return;
    t.style.display = "none";
}

async function replaceInPage(root = document.body) {
    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                // skip empty text nodes
                if (!node.nodeValue || !node.nodeValue.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }
                
                // if node has no element parent, reject (not rendered on pg)
                const p = node.parentElement;
                if (!p) return NodeFilter.FILTER_REJECT;
                // skip text in these elements 
                const tag = p.closest("script, style, noscript, code, pre, textarea, input, select, svg, math");
                if (tag) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });

    const nodes = [];
    let n; while (n = walker.nextNode()) nodes.push(n);

    for (const textNode of nodes) {
        const original = textNode.nodeValue;
        // tokenize words (simple MVP): word boundaries
        const tokens = original.split(/(\b)/);
        let changed = false;

        for (let i = 0; i < tokens.length; i++) {
            const tok = tokens[i];
            if (!/\w+/.test(tok)) continue;
            if (tok.toLowerCase() !== "cat") continue;

            // probability gate
            if (Math.random() * 100 > SETTINGS.replacePct) continue;

            const lower = tok.toLowerCase();
            const translated = await translateViaSW(lower, "en", "es");
            if (!translated) continue;

            // preserve capitalization for first letter
            let out = translated;
            if (isCapitalized(tok)) out = capFirst(out);

            // wrap with span
            tokens[i] = wrapSpan(out, tok, SETTINGS.targetLang);
            changed = true;
        }

        if (changed) {
            const span = document.createElement("span");
            span.innerHTML = tokens.join("");
            textNode.replaceWith(span);
        }
    }

    // delegate hover events
    document.addEventListener("mouseover", onHover, true);
    document.addEventListener("mouseout", onUnhover, true);
}

function onHover(e) {
    const t = e.target;
    if (t && t.classList && t.classList.contains("liw")) {
        const orig = t.getAttribute("data-original");
        const lang = t.getAttribute("data-lang");
        // Simple tooltip text (add pronunciation later)
        showTooltip(`${orig}  →  ${t.textContent}  (${lang})`);
    }
}
function onUnhover(e) {
    const t = e.target;
    if (t && t.classList && t.classList.contains("liw")) hideTooltip();
}

function wrapSpan(translated, original, lang) {
    return `<span class="liw" data-original="${escapeHtml(original)}" data-lang="${lang}">${escapeHtml(translated)}</span>`;
}

function isCapitalized(w) { return /^[A-Z]/.test(w); }
function capFirst(w) { return w.charAt(0).toUpperCase() + w.slice(1); }

function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function translateViaSW(text, from="auto", to="es"){
  return new Promise((resolve)=>{
    chrome.runtime.sendMessage({type:"TRANSLATE", text, from, to}, (resp)=>{
      if (chrome.runtime.lastError) return resolve(null);
      resolve(resp?.ok ? resp.translation : null);
    });
  });
}

