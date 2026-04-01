const express = require("express");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const Stripe = require("stripe");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const rootDir = __dirname;
const publicDir = path.join(rootDir, "public");
const ordersFile = process.env.ORDERS_FILE
  ? path.resolve(process.env.ORDERS_FILE)
  : path.join(rootDir, "data", "orders.json");

const ensureOrdersDir = () => {
  fs.mkdirSync(path.dirname(ordersFile), { recursive: true });
};

const coerceErrorMessage = (error, fallback) => {
  if (!error) {
    return fallback;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "object" && error.message) {
    return String(error.message);
  }
  return fallback;
};

const createStripeClient = (secretKey) =>
  new Stripe(secretKey, {
    // Prevent long hangs in production if the upstream is slow/unreachable.
    timeout: Number(process.env.STRIPE_TIMEOUT_MS || 20000),
    maxNetworkRetries: Number(process.env.STRIPE_MAX_RETRIES || 2)
  });

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  return secretKey ? createStripeClient(secretKey) : null;
};

const readOrders = () => {
  try {
    ensureOrdersDir();
    return JSON.parse(fs.readFileSync(ordersFile, "utf8"));
  } catch {
    return {};
  }
};

const writeOrders = (orders) => {
  ensureOrdersDir();
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
};

const buildTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2
  }).format(amount / 100);

const getNextOrderReference = (orders) => {
  const numbers = Object.values(orders)
    .map((order) => Number(String(order.reference || "").replace("RCBZ-", "")))
    .filter((value) => Number.isFinite(value));
  const nextNumber = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `RCBZ-${String(nextNumber).padStart(4, "0")}`;
};

const buildLineItemsSummary = (lineItems) =>
  lineItems
    .map(
      (item) =>
        `- ${item.description} x ${item.quantity} (${formatMoney(item.amount_total)})`
    )
    .join("\n");

const buildLineItemsHtml = (lineItems) =>
  lineItems
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;color:#17130d;font-size:15px;">${item.description}</td>
          <td style="padding:12px 0;color:#6a5842;font-size:14px;text-align:center;">${item.quantity}</td>
          <td style="padding:12px 0;color:#17130d;font-size:15px;text-align:right;font-weight:700;">${formatMoney(item.amount_total)}</td>
        </tr>
      `
    )
    .join("");

const sendOrderEmails = async (order) => {
  const transporter = buildTransporter();
  const restaurantEmail = process.env.RESTAURANT_ORDER_EMAIL;
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!transporter || !restaurantEmail || !fromEmail) {
    return {
      status: "pending_configuration",
      message:
        "Email transport is not configured yet. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, and RESTAURANT_ORDER_EMAIL."
    };
  }

  const orderLines = buildLineItemsSummary(order.items);
  const subject = `New RC Burger Zone Order ${order.reference}`;
  const summaryTableHtml = buildLineItemsHtml(order.items);
  const commonCardStyles =
    "max-width:640px;margin:0 auto;background:#fff7e7;border-radius:28px;overflow:hidden;border:1px solid rgba(23,19,13,0.08);";
  const headerStyles =
    "padding:28px 32px;background:linear-gradient(135deg,#f8b344 0%,#dd7b16 100%);color:#17130d;";
  const bodyStyles = "padding:28px 32px;color:#17130d;font-family:Nunito Sans,Arial,sans-serif;";

  const restaurantHtml = `
    <div style="background:#17130d;padding:32px 16px;font-family:Nunito Sans,Arial,sans-serif;">
      <div style="${commonCardStyles}">
        <div style="${headerStyles}">
          <p style="margin:0;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;">RC Burger Zone</p>
          <h1 style="margin:10px 0 0;font-family:Lilita One,Arial,sans-serif;font-size:38px;line-height:1;">New Paid Order</h1>
          <p style="margin:10px 0 0;font-size:16px;font-weight:700;">Reference ${order.reference}</p>
        </div>
        <div style="${bodyStyles}">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">A new order has been paid successfully and is ready for fulfillment.</p>
          <div style="padding:18px 20px;border-radius:20px;background:#ffffff;border:1px solid rgba(23,19,13,0.08);margin-bottom:20px;">
            <p style="margin:0 0 8px;font-size:14px;color:#6a5842;text-transform:uppercase;letter-spacing:.12em;font-weight:800;">Customer</p>
            <p style="margin:0;font-size:16px;line-height:1.8;">${order.customer_name}<br>${order.customer_email}<br>${order.customer_phone || "No phone provided"}<br>${order.address_line1}, ${order.city} ${order.postal_code}</p>
          </div>
          <div style="padding:18px 20px;border-radius:20px;background:#ffffff;border:1px solid rgba(23,19,13,0.08);margin-bottom:20px;">
            <p style="margin:0 0 8px;font-size:14px;color:#6a5842;text-transform:uppercase;letter-spacing:.12em;font-weight:800;">Order Notes</p>
            <p style="margin:0;font-size:15px;line-height:1.7;">${order.order_notes || "No notes provided."}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="padding:0 0 10px;text-align:left;font-size:13px;color:#6a5842;text-transform:uppercase;letter-spacing:.12em;">Item</th>
                <th style="padding:0 0 10px;text-align:center;font-size:13px;color:#6a5842;text-transform:uppercase;letter-spacing:.12em;">Qty</th>
                <th style="padding:0 0 10px;text-align:right;font-size:13px;color:#6a5842;text-transform:uppercase;letter-spacing:.12em;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${summaryTableHtml}
            </tbody>
          </table>
          <div style="margin-top:20px;padding-top:18px;border-top:1px solid rgba(23,19,13,0.1);display:flex;justify-content:space-between;gap:16px;">
            <span style="font-size:15px;font-weight:800;">Grand Total</span>
            <span style="font-size:24px;font-family:Lilita One,Arial,sans-serif;color:#dd7b16;">${formatMoney(order.amount_total)}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const customerHtml = `
    <div style="background:#17130d;padding:32px 16px;font-family:Nunito Sans,Arial,sans-serif;">
      <div style="${commonCardStyles}">
        <div style="${headerStyles}">
          <p style="margin:0;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;">RC Burger Zone</p>
          <h1 style="margin:10px 0 0;font-family:Lilita One,Arial,sans-serif;font-size:38px;line-height:1;">Thank You</h1>
          <p style="margin:10px 0 0;font-size:16px;font-weight:700;">Your order ${order.reference} is confirmed.</p>
        </div>
        <div style="${bodyStyles}">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">We received your payment and sent your order to RC Burger Zone.</p>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr>
                <th style="padding:0 0 10px;text-align:left;font-size:13px;color:#6a5842;text-transform:uppercase;letter-spacing:.12em;">Item</th>
                <th style="padding:0 0 10px;text-align:center;font-size:13px;color:#6a5842;text-transform:uppercase;letter-spacing:.12em;">Qty</th>
                <th style="padding:0 0 10px;text-align:right;font-size:13px;color:#6a5842;text-transform:uppercase;letter-spacing:.12em;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${summaryTableHtml}
            </tbody>
          </table>
          <div style="margin-top:20px;padding-top:18px;border-top:1px solid rgba(23,19,13,0.1);display:flex;justify-content:space-between;gap:16px;">
            <span style="font-size:15px;font-weight:800;">Grand Total</span>
            <span style="font-size:24px;font-family:Lilita One,Arial,sans-serif;color:#dd7b16;">${formatMoney(order.amount_total)}</span>
          </div>
          <p style="margin:22px 0 0;font-size:15px;line-height:1.7;color:#6a5842;">If you need to contact the restaurant, include your order reference ${order.reference}.</p>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: restaurantEmail,
      subject,
      text: `A new paid order has been received.\n\nReference: ${order.reference}\nCustomer: ${order.customer_name}\nEmail: ${order.customer_email}\nPhone: ${order.customer_phone}\nAddress: ${order.address_line1}, ${order.city} ${order.postal_code}\nNotes: ${order.order_notes || "None"}\n\nItems:\n${orderLines}\n\nTotal: ${formatMoney(order.amount_total)}`,
      html: restaurantHtml
    });

    if (order.customer_email) {
      await transporter.sendMail({
        from: fromEmail,
        to: order.customer_email,
        subject: `RC Burger Zone Order Received ${order.reference}`,
        text: `Thank you for your order from RC Burger Zone.\n\nReference: ${order.reference}\n\nItems:\n${orderLines}\n\nTotal: ${formatMoney(order.amount_total)}\n\nWe have received your payment and forwarded your order to the restaurant.`,
        html: customerHtml
      });
    }

    return { status: "sent" };
  } catch (error) {
    return {
      status: "error",
      message: coerceErrorMessage(error, "Email sending failed.")
    };
  }
};

const fulfillStripeSession = async (sessionId) => {
  const stripe = getStripeClient();
  if (!stripe) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer_details"]
    });
  } catch (error) {
    // Helpful hint: this commonly happens when the session is `cs_test_...` but you set a live key, or vice versa.
    const message = coerceErrorMessage(
      error,
      "Could not retrieve the Stripe Checkout session."
    );
    const statusCode =
      error && typeof error === "object" && Number.isFinite(error.statusCode)
        ? error.statusCode
        : 500;
    const enriched = new Error(message);
    enriched.statusCode = statusCode;
    throw enriched;
  }

  const paidStatuses = new Set(["paid", "no_payment_required"]);
  if (!paidStatuses.has(session.payment_status)) {
    return { status: "not_paid", session };
  }

  const orders = readOrders();
  if (orders[session.id]?.fulfilled) {
    return { status: "already_fulfilled", order: orders[session.id], session };
  }

  const order = {
    session_id: session.id,
    fulfilled: true,
    reference: getNextOrderReference(orders),
    payment_status: session.payment_status,
    amount_total: session.amount_total || 0,
    currency: session.currency || "php",
    customer_name:
      session.metadata?.customer_name ||
      session.customer_details?.name ||
      "",
    customer_email:
      session.customer_details?.email ||
      session.customer_email ||
      "",
    customer_phone:
      session.customer_details?.phone ||
      session.metadata?.customer_phone ||
      "",
    address_line1:
      session.metadata?.address_line1 ||
      session.customer_details?.address?.line1 ||
      "",
    city:
      session.metadata?.city ||
      session.customer_details?.address?.city ||
      "",
    postal_code:
      session.metadata?.postal_code ||
      session.customer_details?.address?.postal_code ||
      "",
    order_notes: session.metadata?.order_notes || "",
    items: (session.line_items?.data || []).map((item) => ({
      description: item.description,
      quantity: item.quantity || 1,
      amount_total: item.amount_total || 0
    })),
    email_status: "pending"
  };

  const emailResult = await sendOrderEmails(order);
  order.email_status = emailResult.status;
  if (emailResult.message) {
    order.email_message = emailResult.message;
  }

  orders[session.id] = order;
  try {
    writeOrders(orders);
    order.storage_status = "saved";
  } catch (error) {
    order.storage_status = "error";
    order.storage_message = coerceErrorMessage(
      error,
      "Could not persist orders.json on this host."
    );
    console.error("Failed to write orders file:", order.storage_message);
  }

  return { status: "fulfilled", order, session };
};

app.post(
  "/api/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe || !webhookSecret) {
      res.status(500).send("Stripe webhook is not configured.");
      return;
    }

    const signature = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error) {
      res.status(400).send(`Webhook Error: ${error.message}`);
      return;
    }

    try {
      if (
        event.type === "checkout.session.completed" ||
        event.type === "checkout.session.async_payment_succeeded"
      ) {
        await fulfillStripeSession(event.data.object.id);
      }
      res.json({ received: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.use(express.json());
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/index.html", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});
app.use(express.static(publicDir));

app.get("/api/checkout-config", (_req, res) => {
  res.json({
    environment: process.env.CHECKOUT_ENVIRONMENT || "sandbox",
    publicKey: process.env.CHECKOUT_PUBLIC_KEY || ""
  });
});

app.get("/api/stripe-config", (_req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ""
  });
});

app.get("/api/order-status", async (req, res) => {
  const sessionId = String(req.query.session_id || "").trim();
  if (!sessionId) {
    res.status(400).json({ error: "Missing session_id." });
    return;
  }

  const orders = readOrders();
  if (orders[sessionId]) {
    res.json({ order: orders[sessionId] });
    return;
  }

  try {
    const result = await fulfillStripeSession(sessionId);
    if (result.order) {
      res.json({ order: result.order });
      return;
    }

    res.status(202).json({
      error: "Order exists but payment is not marked as paid yet."
    });
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && Number.isFinite(error.statusCode)
        ? error.statusCode
        : 500;
    console.error("Order status failed:", coerceErrorMessage(error, "Unknown error"));
    res.status(statusCode).json({
      error:
        coerceErrorMessage(error, "Could not load Stripe order status.") +
        " (Tip: check if your Stripe keys match the session mode: cs_test vs cs_live.)"
    });
  }
});

app.post("/api/create-stripe-checkout-session", async (req, res) => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    res.status(500).json({
      error:
        "Missing STRIPE_SECRET_KEY. Add your Stripe test or live secret key to .env before using Stripe Checkout."
    });
    return;
  }

  const cart = Array.isArray(req.body?.cart) ? req.body.cart : [];
  const customer = req.body?.customer || {};

  if (!cart.length) {
    res.status(400).json({ error: "Cart is empty." });
    return;
  }

  if (!customer.customerName || !customer.email) {
    res.status(400).json({ error: "Customer name and email are required." });
    return;
  }

  const origin = req.headers.origin || `http://localhost:${port}`;
  const stripe = getStripeClient();
  if (!stripe) {
    res.status(500).json({ error: "Stripe is not configured." });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "php",
      customer_email: customer.email,
      billing_address_collection: "required",
      line_items: cart.map((item) => ({
        quantity: Number(item.quantity || 1),
        price_data: {
          currency: "php",
          unit_amount: Math.round(Number(item.price || 0) * 100),
          product_data: {
            name: item.title,
            description: item.description,
            metadata: {
              burger_zone_item_id: item.id
            }
          }
        }
      })),
      metadata: {
        customer_name: customer.customerName,
        customer_phone: customer.phone || "",
        address_line1: customer.addressLine1 || "",
        city: customer.city || "",
        postal_code: customer.postalCode || "",
        order_notes: customer.notes || "",
        integration_mode: "stripe_active_checkoutcom_reserved"
      },
      success_url: `${origin}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout.html?status=failed`
    });

    res.json({
      id: session.id,
      url: session.url
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || "Unexpected error while creating Stripe Checkout session."
    });
  }
});

app.post("/api/create-payment-session", async (req, res) => {
  const secretKey = process.env.CHECKOUT_SECRET_KEY;
  const apiBase =
    process.env.CHECKOUT_API_BASE ||
    "https://api.sandbox.checkout.com";

  if (!secretKey) {
    res.status(500).json({
      error:
        "Missing CHECKOUT_SECRET_KEY. Add your Checkout.com secret key to .env before using Pay via GCash."
    });
    return;
  }

  const cart = Array.isArray(req.body?.cart) ? req.body.cart : [];
  const customer = req.body?.customer || {};

  if (!cart.length) {
    res.status(400).json({ error: "Cart is empty." });
    return;
  }

  if (!customer.customerName || !customer.email) {
    res.status(400).json({ error: "Customer name and email are required." });
    return;
  }

  const amount = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const origin =
    req.headers.origin ||
    `http://localhost:${port}`;

  const paymentSessionRequest = {
    amount: Math.round(amount * 100),
    currency: "PHP",
    reference: `RCBZ-${Date.now()}`,
    billing: {
      address: {
        address_line1: customer.addressLine1 || "RC Burger Zone customer checkout",
        city: customer.city || "Muntinlupa City",
        zip: customer.postalCode || "1773",
        country: "PH"
      }
    },
    customer: {
      name: customer.customerName,
      email: customer.email,
      phone: {
        number: customer.phone || ""
      }
    },
    success_url: `${origin}/checkout.html?status=succeeded`,
    failure_url: `${origin}/checkout.html?status=failed`,
    metadata: {
      order_notes: customer.notes || "",
      item_count: String(cart.length),
      payment_preference: "GCash via Checkout.com Flow"
    }
  };

  try {
    const response = await fetch(`${apiBase}/payment-sessions`, {
      method: "POST",
      headers: {
        Authorization: secretKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paymentSessionRequest)
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({
        error: data?.error_codes?.join(", ") || data?.error_type || "Checkout.com rejected the payment session request.",
        details: data
      });
      return;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message || "Unexpected server error while creating payment session."
    });
  }
});

app.listen(port, () => {
  console.log(`RC Burger Zone server running at http://localhost:${port}`);
});
