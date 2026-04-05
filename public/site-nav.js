(function () {
  const navMarkup = (currentPage) => `
    <button
      class="nav-toggle brutalist-nav-toggle"
      type="button"
      aria-expanded="false"
      aria-controls="site-nav"
      aria-label="Toggle navigation menu"
    >
      <span class="nav-toggle-icon" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>

    <nav class="site-nav brutalist-nav" id="site-nav">
      <a href="index.html"${currentPage === "home" ? ' aria-current="page"' : ""}>Home</a>
      <a href="menu.html"${currentPage === "menu" ? ' aria-current="page"' : ""}>Shop Menu</a>
      <a class="cart-link" href="cart.html"${currentPage === "cart" ? ' aria-current="page"' : ""}>
        <span class="cart-link-label">
          <span class="cart-link-text">Cart</span>
          <span class="cart-badge brutalist-cart-badge" data-cart-count hidden>0</span>
        </span>
      </a>
      <a href="checkout.html"${currentPage === "checkout" ? ' aria-current="page"' : ""}>Checkout</a>
    </nav>
  `;

  const mountSiteNav = () => {
    document.querySelectorAll("[data-site-nav]").forEach((slot) => {
      slot.innerHTML = navMarkup(slot.dataset.page || "");
    });

    const navToggle = document.querySelector(".nav-toggle");
    const siteNav = document.querySelector(".site-nav");
    const navLinks = document.querySelectorAll(".site-nav a");

    if (!navToggle || !siteNav) {
      return;
    }

    const closeNav = () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    };

    const toggleNav = () => {
      const isOpen = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("nav-open", isOpen);
    };

    navToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleNav();
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        closeNav();
      });
    });

    document.addEventListener("click", (event) => {
      if (!siteNav.classList.contains("is-open")) {
        return;
      }

      if (siteNav.contains(event.target) || navToggle.contains(event.target)) {
        return;
      }

      closeNav();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && siteNav.classList.contains("is-open")) {
        closeNav();
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountSiteNav, { once: true });
  } else {
    mountSiteNav();
  }
})();
