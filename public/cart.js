const cartRoot = document.querySelector("[data-cart-root]");
const subtotalValue = document.querySelector("[data-cart-subtotal]");
const emptyState = document.querySelector("[data-cart-empty]");
const filledState = document.querySelector("[data-cart-filled]");
const checkoutButtons = document.querySelectorAll("[data-cart-checkout]");
const clearCartButton = document.querySelector("[data-clear-cart]");

const renderCart = () => {
  if (!cartRoot || !window.BurgerZoneCart) {
    return;
  }

  const cart = window.BurgerZoneCart.getCart();
  const subtotal = window.BurgerZoneCart.getCartSubtotal();

  cartRoot.replaceChildren();
  subtotalValue.textContent = window.BurgerZoneCart.formatCurrency(subtotal);

  if (!cart.length) {
    emptyState.hidden = false;
    filledState.hidden = true;
    checkoutButtons.forEach((button) => {
      button.setAttribute("aria-disabled", "true");
      button.classList.add("is-disabled");
      button.href = "#";
    });
    return;
  }

  emptyState.hidden = true;
  filledState.hidden = false;
  checkoutButtons.forEach((button) => {
    button.removeAttribute("aria-disabled");
    button.classList.remove("is-disabled");
    button.href = "checkout.html";
  });

  cart.forEach((item) => {
    const article = document.createElement("article");
    article.className = "cart-item";

    article.innerHTML = `
      <div class="cart-item-media">
        <img src="${item.cardImage.src}" alt="${item.cardImage.alt}" width="1600" height="1000" loading="lazy" />
      </div>
      <div class="cart-item-copy">
        <span class="card-tag">${item.category}</span>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
      </div>
      <div class="cart-item-actions">
        <p class="cart-item-price">${window.BurgerZoneCart.formatCurrency(item.price)}</p>
        <div class="quantity-picker">
          <button type="button" data-qty-action="decrease" data-id="${item.id}" aria-label="Decrease ${item.title} quantity">-</button>
          <span>${item.quantity}</span>
          <button type="button" data-qty-action="increase" data-id="${item.id}" aria-label="Increase ${item.title} quantity">+</button>
        </div>
        <button class="link-button" type="button" data-remove-item="${item.id}">Remove</button>
      </div>
    `;

    cartRoot.appendChild(article);
  });
};

document.addEventListener("click", (event) => {
  const qtyButton = event.target.closest("[data-qty-action]");
  if (qtyButton) {
    const itemId = qtyButton.dataset.id;
    const item = window.BurgerZoneCart.getCart().find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    const nextQuantity =
      qtyButton.dataset.qtyAction === "increase" ? item.quantity + 1 : item.quantity - 1;
    window.BurgerZoneCart.updateQuantity(itemId, nextQuantity);
    renderCart();
    return;
  }

  const removeButton = event.target.closest("[data-remove-item]");
  if (removeButton) {
    window.BurgerZoneCart.removeFromCart(removeButton.dataset.removeItem);
    renderCart();
  }
});

clearCartButton?.addEventListener("click", () => {
  window.BurgerZoneCart.clearCart();
  renderCart();
});

window.addEventListener("cart:updated", renderCart);
window.addEventListener("DOMContentLoaded", renderCart);
