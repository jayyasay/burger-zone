const revealItems = document.querySelectorAll(".reveal");
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
const modalCartQuantity = document.querySelector("#menu-modal-cart-qty");
const modalQuantityControls = document.querySelector("#menu-modal-quantity-controls");
const modalQuantityButtons = document.querySelectorAll("[data-modal-qty-action]");
const itemQuantityBadges = document.querySelectorAll("[data-item-quantity]");
const itemAddButtons = document.querySelectorAll("[data-cart-add]");
const itemQuantityControls = document.querySelectorAll("[data-cart-controls]");

const menuItems = window.BURGER_ZONE_MENU?.items || {};

let activeTrigger = null;
let activeSlides = [];
let activeSlideIndex = 0;
let activeItemId = "";

const hydrateFeaturedProduct = () => {
  const featuredCard = document.querySelector("[data-featured-item]");
  if (!featuredCard) {
    return;
  }

  const item = menuItems[featuredCard.dataset.featuredItem];
  if (!item) {
    return;
  }

  const featuredImage = featuredCard.querySelector("[data-featured-image]");
  const featuredStamp = featuredCard.querySelector("[data-featured-stamp]");
  const featuredCategory = featuredCard.querySelector("[data-featured-category]");
  const featuredTitle = featuredCard.querySelector("[data-featured-title]");
  const featuredDescription = featuredCard.querySelector("[data-featured-description]");
  const featuredPrice = featuredCard.querySelector("[data-featured-price]");
  const featuredMeta = featuredCard.querySelector("[data-featured-meta]");
  const featuredCalories = featuredCard.querySelector("[data-featured-calories]");
  const featuredProtein = featuredCard.querySelector("[data-featured-protein]");

  if (featuredImage) {
    featuredImage.src = item.cardImage.src;
    featuredImage.alt = item.cardImage.alt;
  }

  if (featuredStamp) {
    featuredStamp.textContent = item.category;
  }

  if (featuredCategory) {
    featuredCategory.textContent = `${item.category} / Ready To Add`;
  }

  if (featuredTitle) {
    featuredTitle.textContent = item.title;
  }

  if (featuredDescription) {
    featuredDescription.textContent = item.description;
  }

  if (featuredPrice) {
    featuredPrice.textContent = item.displayPrice;
  }

  if (featuredMeta) {
    featuredMeta.textContent = item.images?.[0]?.caption || item.category;
  }

  if (featuredCalories) {
    featuredCalories.textContent = item.nutrition.calories;
  }

  if (featuredProtein) {
    featuredProtein.textContent = item.nutrition.protein;
  }
};

const hydrateMenuCards = () => {
  document.querySelectorAll("[data-item-card]").forEach((card) => {
    const item = menuItems[card.dataset.itemCard];
    if (!item) {
      return;
    }

    const itemImage = card.querySelector("[data-item-image]");
    const itemCategory = card.querySelector("[data-item-category]");
    const itemTitle = card.querySelector("[data-item-title]");
    const itemDescription = card.querySelector("[data-item-description]");
    const itemPrice = card.querySelector("[data-item-price]");

    if (itemImage) {
      itemImage.src = item.cardImage.src;
      itemImage.alt = item.cardImage.alt;
    }

    if (itemCategory) {
      itemCategory.textContent = item.category;
    }

    if (itemTitle) {
      itemTitle.textContent = item.title;
    }

    if (itemDescription) {
      itemDescription.textContent = item.description;
    }

    if (itemPrice) {
      itemPrice.textContent = item.displayPrice;
    }
  });
};

const getItemQuantity = (itemId) => window.BurgerZoneCart?.getItemQuantity(itemId) || 0;

const syncItemQuantities = () => {
  document.querySelectorAll("[data-item-quantity]").forEach((badge) => {
    badge.textContent = String(getItemQuantity(badge.dataset.itemQuantity));
  });

  document.querySelectorAll("[data-cart-add]").forEach((button) => {
    const quantity = getItemQuantity(button.dataset.cartAdd);
    button.hidden = quantity > 0;
  });

  document.querySelectorAll("[data-cart-controls]").forEach((control) => {
    const quantity = getItemQuantity(control.dataset.cartControls);
    control.hidden = quantity === 0;
  });

  if (modalCartQuantity) {
    const quantity = activeItemId ? getItemQuantity(activeItemId) : 0;
    modalCartQuantity.textContent = String(quantity);

    if (modalAddToCartButton) {
      modalAddToCartButton.hidden = quantity > 0;
    }

    if (modalQuantityControls) {
      modalQuantityControls.hidden = quantity === 0;
    }
  }
};

const adjustItemQuantity = (itemId, delta) => {
  if (!itemId || !window.BurgerZoneCart) {
    return;
  }

  const nextQuantity = Math.max(0, getItemQuantity(itemId) + delta);
  window.BurgerZoneCart.updateQuantity(itemId, nextQuantity);
};

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
  syncItemQuantities();
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
  syncItemQuantities();
});

modalQuantityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!activeItemId) {
      return;
    }

    adjustItemQuantity(activeItemId, button.dataset.modalQtyAction === "increase" ? 1 : -1);
    syncItemQuantities();
  });
});

document.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-open-item]");
  if (openButton) {
    openMenuModal(openButton.dataset.openItem, openButton);
    return;
  }

  const addButton = event.target.closest("[data-add-to-cart]");
  if (addButton) {
    const itemId = addButton.dataset.id;
    if (!itemId || !window.BurgerZoneCart) {
      return;
    }

    window.BurgerZoneCart.addToCart(itemId, 1);
    syncItemQuantities();
    return;
  }

  const quantityButton = event.target.closest("[data-menu-qty-action]");
  if (quantityButton) {
    adjustItemQuantity(
      quantityButton.dataset.id,
      quantityButton.dataset.menuQtyAction === "increase" ? 1 : -1
    );
    syncItemQuantities();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenuModal();
  }
});

hydrateFeaturedProduct();
hydrateMenuCards();
window.addEventListener("DOMContentLoaded", syncItemQuantities);
window.addEventListener("cart:updated", syncItemQuantities);
