const thankYouStatus = document.querySelector("[data-thank-you-status]");
const thankYouSummary = document.querySelector("[data-thank-you-summary]");
const thankYouTotal = document.querySelector("[data-thank-you-total]");
const orderReference = document.querySelector("[data-order-reference]");
const emailStatus = document.querySelector("[data-email-status]");

const formatMoney = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2
  }).format(value / 100);

const renderOrder = (order) => {
  if (!order) {
    return;
  }

  thankYouSummary.replaceChildren();
  thankYouTotal.textContent = formatMoney(order.amount_total || 0);
  orderReference.textContent = order.reference || order.session_id || "Pending";
  emailStatus.textContent = order.email_status || "Pending";

  (order.items || []).forEach((item) => {
    const row = document.createElement("div");
    row.className = "checkout-line";
    row.innerHTML = `
      <div>
        <strong>${item.description}</strong>
        <p>${item.quantity} x ${formatMoney(item.amount_total / item.quantity)}</p>
      </div>
      <span>${formatMoney(item.amount_total)}</span>
    `;
    thankYouSummary.appendChild(row);
  });
};

window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");

  if (!sessionId) {
    thankYouStatus.textContent = "Missing Stripe session ID. We could not load your order details.";
    thankYouStatus.dataset.tone = "alert";
    return;
  }

  try {
    const response = await fetch(`/api/order-status?session_id=${encodeURIComponent(sessionId)}`);
    const payload = await response.json();

    if (!response.ok) {
      thankYouStatus.textContent = payload.error || "Could not load your order status.";
      thankYouStatus.dataset.tone = "alert";
      return;
    }

    renderOrder(payload.order);

    if (window.BurgerZoneCart) {
      window.BurgerZoneCart.clearCart();
    }

    thankYouStatus.textContent =
      payload.order?.email_status === "sent"
        ? "Payment confirmed and emails sent to both the restaurant and the customer."
        : "Payment confirmed. Email delivery is still pending or needs SMTP configuration.";
    thankYouStatus.dataset.tone =
      payload.order?.email_status === "sent" ? "success" : "warning";
  } catch (error) {
    thankYouStatus.textContent =
      error.message || "Unexpected error while loading the thank-you page.";
    thankYouStatus.dataset.tone = "alert";
  }
});
