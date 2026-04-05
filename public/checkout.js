const checkoutForm = document.querySelector("[data-checkout-form]");
const checkoutSummary = document.querySelector("[data-checkout-summary]");
const checkoutSubtotal = document.querySelector("[data-checkout-subtotal]");
const checkoutStatus = document.querySelector("[data-checkout-status]");
const gcashHint = document.querySelector("[data-gcash-hint]");

const renderCheckoutSummary = () => {
  if (!checkoutSummary || !window.BurgerZoneCart) {
    return;
  }

  const cart = window.BurgerZoneCart.getCart();
  const subtotal = window.BurgerZoneCart.getCartSubtotal();

  checkoutSummary.replaceChildren();
  checkoutSubtotal.textContent = window.BurgerZoneCart.formatCurrency(subtotal);

  if (!cart.length) {
    const empty = document.createElement("p");
    empty.className = "checkout-empty";
    empty.textContent = "Your cart is empty. Add items before opening checkout.";
    checkoutSummary.appendChild(empty);
    return;
  }

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "checkout-line";
    row.innerHTML = `
      <div>
        <strong>${item.title}</strong>
        <p>${item.quantity} x ${window.BurgerZoneCart.formatCurrency(item.price)}</p>
      </div>
      <span>${window.BurgerZoneCart.formatCurrency(item.price * item.quantity)}</span>
    `;
    checkoutSummary.appendChild(row);
  });
};

const readCheckoutForm = () => {
  const formData = new FormData(checkoutForm);
  const phoneLocal = String(formData.get("phoneLocal") || "")
    .replace(/\D/g, "")
    .slice(0, 9);

  return {
    customerName: String(formData.get("customerName") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: phoneLocal ? `09${phoneLocal}` : "",
    addressLine1: String(formData.get("addressLine1") || "").trim(),
    city: String(formData.get("city") || "").trim(),
    postalCode: String(formData.get("postalCode") || "").trim(),
    notes: String(formData.get("notes") || "").trim()
  };
};

const showStatus = (message, tone = "warning") => {
  if (!checkoutStatus) {
    return;
  }

  checkoutStatus.textContent = message;
  checkoutStatus.dataset.tone = tone;
  checkoutStatus.hidden = false;
};

const initStripeCheckout = async () => {
  if (!checkoutForm || !window.BurgerZoneCart) {
    return;
  }

  if (!checkoutForm.reportValidity()) {
    return;
  }

  const cart = window.BurgerZoneCart.getCart();
  if (!cart.length) {
    showStatus("Your cart is empty. Add items before continuing to checkout.", "alert");
    return;
  }

  const customer = readCheckoutForm();
  showStatus("Preparing your Stripe Checkout session...", "warning");

  const response = await fetch("/api/create-stripe-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      cart,
      customer
    })
  });

  const paymentSession = await response.json();
  if (!response.ok) {
    showStatus(paymentSession.error || "Could not create a Stripe Checkout session.", "alert");
    return;
  }

  if (!paymentSession.url) {
    showStatus("Stripe did not return a Checkout URL.", "alert");
    return;
  }

  window.location.href = paymentSession.url;
};

checkoutForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await initStripeCheckout();
});

window.addEventListener("DOMContentLoaded", () => {
  renderCheckoutSummary();

  const query = new URLSearchParams(window.location.search);
  const status = query.get("status");

  if (status === "failed") {
    showStatus("Payment failed or was cancelled. You can try Stripe Checkout again below.", "alert");
  }

  if (gcashHint) {
    gcashHint.textContent =
      "Stripe checkout is active now. GCash stays listed as coming soon so the payment section is future-ready without changing the current live flow.";
  }
});
