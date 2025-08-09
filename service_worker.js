// onInstalled : 
// read from storage : replacePct, targetLang 
// if replacePct missing -> set to 10
// if targetLang missing -> set to "es"
// save defaults to storage a
console.log("[SW] boot");
import { AZ_KEY, AZ_REGION} from "./config.js";

const AZ_ENDPOINT = "https://api.cognitive.microsofttranslator.com";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["replacePct", "targetLang"], (s) => {
    const init = {};
    if (s.replacePct == null) init.replacePct = 10; // 10%
    if (s.targetLang == null) init.targetLang = "es";
    chrome.storage.local.set(init);
  });
});

// minimal cache 
async function getCache(k) { return (await chrome.storage.local.get(k))[k]; }
async function setCache(k, v) { return await chrome.storage.local.set({ [k]: v }); }

async function translateText(q, from = "en", to = "es") {
  const text = (q ?? "").trim();

  // check cache 
  const norm = text.normalize("NFKC").toLowerCase().trim();
  // ignore `from` so auto-detect quirks don't break caching
  const cacheKey = `t:${to}:${norm}`;
  const hit = await getCache(cacheKey);
  if (hit) {
    console.log(`[CACHE HIT] ${cacheKey} → ${hit}`);
    return hit;
  }
  console.log(`[CACHE MISS] ${cacheKey}`);
  const params = new URLSearchParams({ "api-version": "3.0", to });
  if (from && from !== "auto") params.set("from", from);

  console.log("[SW] calling Azure", `${AZ_ENDPOINT}/translate?${params.toString()}`);
  const res = await fetch(`${AZ_ENDPOINT}/translate?${params}`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": AZ_KEY,
      "Ocp-Apim-Subscription-Region": AZ_REGION,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([{ Text: text }])
  });

  const body = await res.text();
  if (!res.ok) throw new Error(`Azure ${res.status}: ${body.slice(0, 200)}`);

  const json = JSON.parse(body);
  const translated = json?.[0]?.translations?.[0]?.text;
  if (!translated) throw new Error("No translation in response");

  await setCache(cacheKey, translated);
  return translated;
}

// message router 
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  console.log("[SW] msg:", msg); // should print TRANSLATE
  (async () => {
    try {
      if (msg.type === "TRANSLATE") {
        const t = await translateText(msg.text, msg.from, msg.to);
        sendResponse({ ok: true, translation: t });
      } else {
        sendResponse({ ok: false, error: "Unknown message" });
      }
    } catch (e) {
      sendResponse({ ok: false, error: String(e?.message || e) });
    }
  })();
  return true; // keep port open (async)
});

// check cache elements
chrome.storage.local.get(null, (items) => {
  Object.entries(items)
    .filter(([k]) => k.startsWith("t:")) // only translation keys
    .forEach(([k, v]) => {
      console.log(k, "→", v);
    });
});
