const pct = document.getElementById("pct");
const pctVal = document.getElementById("pctVal");
const lang = document.getElementById("lang");
const saveBtn = document.getElementById("save");

chrome.storage.local.get(["replacePct", "targetLang"], ({ replacePct = 10, targetLang = "es" }) => {
  pct.value = replacePct;
  pctVal.textContent = replacePct + "%";
  lang.value = targetLang;
});

pct.addEventListener("input", () => pctVal.textContent = pct.value + "%");

saveBtn.addEventListener("click", () => {
  chrome.storage.local.set({ replacePct: Number(pct.value), targetLang: lang.value }, () => {
    saveBtn.textContent = "Saved ✓";
    setTimeout(() => saveBtn.textContent = "Save", 800);
  });
});
