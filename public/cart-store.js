(function () {
  const STORAGE_KEY = "burger-zone-cart-v1";
  const menuData = window.BURGER_ZONE_MENU?.items || {};
  let lastCartCount = 0;

  const readCart = () => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeCart = (cart) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: cart }));
  };

  const getCart = () =>
    readCart()
      .map((entry) => {
        const item = menuData[entry.id];
        if (!item) {
          return null;
        }

        return {
          ...item,
          quantity: entry.quantity
        };
      })
      .filter(Boolean);

  const getCartCount = () => getCart().reduce((sum, item) => sum + item.quantity, 0);

  const getCartSubtotal = () => getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getItemQuantity = (itemId) => {
    const entry = readCart().find((item) => item.id === itemId);
    return entry ? entry.quantity : 0;
  };

  const addToCart = (itemId, quantity = 1) => {
    if (!menuData[itemId]) {
      return;
    }

    const cart = readCart();
    const existing = cart.find((entry) => entry.id === itemId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ id: itemId, quantity });
    }

    writeCart(cart);
  };

  const updateQuantity = (itemId, quantity) => {
    const cart = readCart()
      .map((entry) =>
        entry.id === itemId ? { ...entry, quantity: Math.max(0, quantity) } : entry
      )
      .filter((entry) => entry.quantity > 0);

    writeCart(cart);
  };

  const removeFromCart = (itemId) => {
    writeCart(readCart().filter((entry) => entry.id !== itemId));
  };

  const clearCart = () => {
    writeCart([]);
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2
    }).format(value);

  const syncCartBadges = () => {
    const count = getCartCount();
    document.querySelectorAll("[data-cart-count]").forEach((badge) => {
      badge.textContent = String(count);
      badge.hidden = count === 0;
    });

    document.querySelectorAll("[data-cart-fab]").forEach((fab) => {
      fab.hidden = count === 0;

      if (lastCartCount === 0 && count > 0) {
        fab.classList.remove("is-shimmering");
        // Restart the animation each time the cart appears from zero.
        void fab.offsetWidth;
        fab.classList.add("is-shimmering");

        window.setTimeout(() => {
          fab.classList.remove("is-shimmering");
        }, 1200);
      }
    });

    document.querySelectorAll("[data-cart-fab-label]").forEach((label) => {
      label.textContent = count === 1 ? "1 item ready" : `${count} items ready`;
    });

    lastCartCount = count;
  };

  window.BurgerZoneCart = {
    addToCart,
    clearCart,
    formatCurrency,
    getCart,
    getCartCount,
    getItemQuantity,
    getCartSubtotal,
    removeFromCart,
    syncCartBadges,
    updateQuantity
  };

  window.addEventListener("DOMContentLoaded", syncCartBadges);
  window.addEventListener("cart:updated", syncCartBadges);
})();
