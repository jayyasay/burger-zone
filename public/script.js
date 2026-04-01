const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = document.querySelectorAll(".site-nav a");
const revealItems = document.querySelectorAll(".reveal");
const menuTriggers = document.querySelectorAll(".menu-trigger");
const menuModal = document.querySelector("#menu-modal");
const modalCloseButtons = document.querySelectorAll("[data-close-modal]");
const modalCategory = document.querySelector("#menu-modal-category");
const modalTitle = document.querySelector("#menu-modal-title");
const modalPrice = document.querySelector("#menu-modal-price");
const modalDescription = document.querySelector("#menu-modal-description");
const modalIngredients = document.querySelector("#menu-modal-ingredients");
const modalCalories = document.querySelector("#menu-modal-calories");
const modalProtein = document.querySelector("#menu-modal-protein");
const modalCarbs = document.querySelector("#menu-modal-carbs");
const modalFat = document.querySelector("#menu-modal-fat");
const modalImage = document.querySelector("#menu-modal-image");
const modalSlideIndicator = document.querySelector("#menu-modal-slide-indicator");
const modalSlideCaption = document.querySelector("#menu-modal-slide-caption");
const modalPrevButton = document.querySelector("#menu-slider-prev");
const modalNextButton = document.querySelector("#menu-slider-next");
const modalDialog = document.querySelector(".menu-modal-dialog");
const modalAddToCartButton = document.querySelector("#menu-modal-add-to-cart");

const menuItems = window.BURGER_ZONE_MENU?.items || {};

let activeTrigger = null;
let activeSlides = [];
let activeSlideIndex = 0;
let activeItemId = "";

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("nav-open", isOpen);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    });
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

revealItems.forEach((item) => observer.observe(item));

const renderActiveSlide = () => {
  if (!modalImage || !modalSlideIndicator || !modalSlideCaption || !activeSlides.length) {
    return;
  }

  const slide = activeSlides[activeSlideIndex];
  modalImage.src = slide.src;
  modalImage.alt = slide.alt;
  modalSlideCaption.textContent = slide.caption;
  modalSlideIndicator.textContent = `${String(activeSlideIndex + 1).padStart(2, "0")} / ${String(activeSlides.length).padStart(2, "0")}`;
};

const openMenuModal = (itemId, trigger) => {
  if (!menuModal || !menuItems[itemId]) {
    return;
  }

  const item = menuItems[itemId];
  activeTrigger = trigger;
  activeItemId = itemId;

  modalCategory.textContent = item.category;
  modalTitle.textContent = item.title;
  modalPrice.textContent = item.displayPrice;
  modalDescription.textContent = item.description;
  modalCalories.textContent = item.nutrition.calories;
  modalProtein.textContent = item.nutrition.protein;
  modalCarbs.textContent = item.nutrition.carbs;
  modalFat.textContent = item.nutrition.fat;
  activeSlides = item.images || [];
  activeSlideIndex = 0;

  modalIngredients.replaceChildren();
  item.ingredients.forEach((ingredient) => {
    const ingredientItem = document.createElement("li");
    ingredientItem.textContent = ingredient;
    modalIngredients.appendChild(ingredientItem);
  });

  renderActiveSlide();
  menuModal.hidden = false;
  document.body.classList.add("modal-open");
  if (modalDialog) {
    modalDialog.scrollTop = 0;
  }
  if (modalAddToCartButton) {
    modalAddToCartButton.textContent = "Add to Cart";
  }
  document.querySelector(".menu-modal-close")?.focus();
};

const closeMenuModal = () => {
  if (!menuModal || menuModal.hidden) {
    return;
  }

  menuModal.hidden = true;
  document.body.classList.remove("modal-open");
  activeTrigger?.focus();
};

menuTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    openMenuModal(trigger.dataset.item, trigger);
  });
});

modalPrevButton?.addEventListener("click", () => {
  activeSlideIndex = (activeSlideIndex - 1 + activeSlides.length) % activeSlides.length;
  renderActiveSlide();
});

modalNextButton?.addEventListener("click", () => {
  activeSlideIndex = (activeSlideIndex + 1) % activeSlides.length;
  renderActiveSlide();
});

modalCloseButtons.forEach((button) => {
  button.addEventListener("click", closeMenuModal);
});

modalAddToCartButton?.addEventListener("click", () => {
  if (!activeItemId || !window.BurgerZoneCart) {
    return;
  }

  window.BurgerZoneCart.addToCart(activeItemId, 1);
  modalAddToCartButton.textContent = "Added to Cart";
  window.setTimeout(() => {
    modalAddToCartButton.textContent = "Add to Cart";
  }, 1200);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenuModal();
  }
});
