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

const defaultMenuSlides = [
  {
    src: "assets/placeholders/menu-slide-1.svg",
    alt: "Placeholder hero photo for a menu item",
    caption: "Placeholder menu photo 1. Replace with your plated product shot."
  },
  {
    src: "assets/placeholders/menu-slide-2.svg",
    alt: "Placeholder close-up food detail photo",
    caption: "Placeholder menu photo 2. Great spot for a close-up texture shot."
  },
  {
    src: "assets/placeholders/menu-slide-3.svg",
    alt: "Placeholder lifestyle menu photo",
    caption: "Placeholder menu photo 3. Use this for a wider serving or table scene."
  }
];

const menuItems = {
  "zone-classic-stack": {
    category: "Best Seller",
    title: "Zone Classic Stack",
    price: "₱89",
    description:
      "A balanced Burger Zone favorite with a juicy single patty, soft bun, bright greens, and a creamy house sauce built for everyday cravings.",
    ingredients: [
      "Toasted burger bun",
      "Seasoned beef patty",
      "Melted cheese slice",
      "Fresh lettuce",
      "Tomato slices",
      "House burger sauce"
    ],
    nutrition: {
      calories: "430 kcal",
      protein: "22 g",
      carbs: "34 g",
      fat: "21 g"
    }
  },
  "double-cheese-zone": {
    category: "Burger",
    title: "Double Cheese Zone",
    price: "₱149",
    description:
      "A heavier build with two savory patties, extra cheese, and more richness for customers who want the full Burger Zone hit.",
    ingredients: [
      "Toasted burger bun",
      "Two seasoned beef patties",
      "Double cheese slices",
      "Lettuce",
      "Pickles",
      "House burger sauce"
    ],
    nutrition: {
      calories: "680 kcal",
      protein: "38 g",
      carbs: "36 g",
      fat: "42 g"
    }
  },
  "loaded-cheese-fries": {
    category: "Loaded Side",
    title: "Loaded Cheese Fries",
    price: "₱79",
    description:
      "Crispy fries layered with cheese drizzle and a savory finish designed for quick sharing or a rich sidekick to the main burger order.",
    ingredients: [
      "Crispy potato fries",
      "Cheese sauce",
      "Savory seasoning",
      "Spring onion garnish",
      "Optional chili flakes"
    ],
    nutrition: {
      calories: "390 kcal",
      protein: "7 g",
      carbs: "46 g",
      fat: "19 g"
    }
  },
  "barkada-box": {
    category: "Group Order",
    title: "Barkada Box",
    price: "₱349",
    description:
      "A group-ready tray with burgers, fries, and dips set up for easy sharing during office snacks, movie nights, and family merienda.",
    ingredients: [
      "Three classic burgers",
      "Large seasoned fries",
      "Cheese dip",
      "House sauce cups",
      "Fresh garnish pack"
    ],
    nutrition: {
      calories: "1480 kcal",
      protein: "68 g",
      carbs: "138 g",
      fat: "74 g"
    }
  },
  "extra-cheese-dip": {
    category: "Add-on",
    title: "Extra Cheese Dip",
    price: "₱25",
    description:
      "A small but high-impact cheese dip that adds extra richness to burgers, fries, and combo trays without overcomplicating the order.",
    ingredients: [
      "Cheddar-style cheese sauce",
      "Milk blend",
      "Light seasoning",
      "Creamy base"
    ],
    nutrition: {
      calories: "120 kcal",
      protein: "3 g",
      carbs: "5 g",
      fat: "10 g"
    }
  },
  "iced-tea": {
    category: "Drink",
    title: "Iced Tea",
    price: "₱39",
    description:
      "A cold, easy-drinking tea option that cuts through richer menu items and keeps the meal feeling balanced and refreshing.",
    ingredients: [
      "Brewed black tea",
      "Cane sugar syrup",
      "Filtered water",
      "Ice"
    ],
    nutrition: {
      calories: "110 kcal",
      protein: "0 g",
      carbs: "28 g",
      fat: "0 g"
    }
  },
  "lemon-cooler": {
    category: "Drink",
    title: "Lemon Cooler",
    price: "₱49",
    description:
      "A bright citrus refresher with a sharp, clean finish that matches the punchy green-and-orange personality of the brand.",
    ingredients: [
      "Fresh lemon mix",
      "Simple syrup",
      "Filtered water",
      "Ice",
      "Lemon slice garnish"
    ],
    nutrition: {
      calories: "95 kcal",
      protein: "0 g",
      carbs: "24 g",
      fat: "0 g"
    }
  },
  "classic-fries-drink-combo": {
    category: "Combo",
    title: "Classic + Fries + Drink",
    price: "₱159",
    description:
      "The straightforward all-in choice: one classic burger, a side of fries, and a drink for customers who want the easy yes.",
    ingredients: [
      "Zone Classic Stack",
      "Regular fries",
      "Choice of iced tea or lemon cooler",
      "House sauce sachet"
    ],
    nutrition: {
      calories: "760 kcal",
      protein: "26 g",
      carbs: "82 g",
      fat: "34 g"
    }
  }
};

let activeTrigger = null;
let activeSlides = defaultMenuSlides;
let activeSlideIndex = 0;

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

  modalCategory.textContent = item.category;
  modalTitle.textContent = item.title;
  modalPrice.textContent = item.price;
  modalDescription.textContent = item.description;
  modalCalories.textContent = item.nutrition.calories;
  modalProtein.textContent = item.nutrition.protein;
  modalCarbs.textContent = item.nutrition.carbs;
  modalFat.textContent = item.nutrition.fat;
  activeSlides = item.images || defaultMenuSlides;
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenuModal();
  }
});
