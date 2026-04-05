window.RCBZ_SITE_CONFIG = {
  // Options: "modern" | "brutalist"
  design: "modern"
};

(function applySiteConfig() {
  const allowedDesigns = new Set(["modern", "brutalist"]);
  const configuredDesign = window.RCBZ_SITE_CONFIG?.design;
  const design = allowedDesigns.has(configuredDesign) ? configuredDesign : "modern";

  document.documentElement.dataset.design = design;
  document.documentElement.style.colorScheme = "light";

  const themeColor = design === "brutalist" ? "#fff4dc" : "#f8f2e4";
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", themeColor);
  }
})();
