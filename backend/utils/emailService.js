import nodemailer from 'nodemailer';

// ── Transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ── Shared email wrapper ──────────────────────────────────────
export const sendEmail = async ({ to, subject, html }) => {
    try {
        await transporter.sendMail({
            from:    process.env.EMAIL_FROM,
            to,
            subject,
            html,
        });
        console.log(`Email sent → ${to} | ${subject}`);
    } catch (err) {
        // Log but never crash the server over a failed email
        console.error('Email failed:', err.message);
    }
};

export const sendPasswordResetEmail = async (userEmail, userName, resetUrl) => {
    const html = layout(`
        <div class="title">Password Reset Request</div>
        <div class="sub">Hi ${userName}, we received a request to reset your password.</div>
        
        <p style="margin-bottom: 24px; font-size: 14px; line-height: 1.6; color: #444;">
            Click the button below to choose a new password. This link is only valid for <strong>10 minutes</strong>.
        </p>

        <a href="${resetUrl}" class="btn" style="margin-top: 0; margin-bottom: 24px;">Reset Password</a>

        <p style="font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 16px;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
    `);

    await sendEmail({
        to: userEmail,
        subject: 'Reset your MonikaCreation password',
        html,
    });
};

// ── Shared layout wrapper ─────────────────────────────────────
const layout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f0f0f0; font-family: 'Helvetica Neue', Arial, sans-serif;
           color: #222; padding: 32px 16px; }
    .card { background: #fff; max-width: 560px; margin: 0 auto;
            border-radius: 2px; overflow: hidden;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #1a1a1a; padding: 28px 32px; text-align: center; }
    .logo   { font-size: 32px; letter-spacing: 3px; color: #D4AF37;
              font-weight: 700; }
    .tagline { color: #888; font-size: 12px; margin-top: 4px;
               letter-spacing: 1px; text-transform: uppercase; }
    .body   { padding: 32px; }
    .title  { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    .sub    { color: #666; font-size: 14px; margin-bottom: 24px; }
    .divider { border: none; border-top: 1px solid #eee; margin: 24px 0; }
    .label  { font-size: 11px; font-weight: 700; text-transform: uppercase;
              letter-spacing: 1px; color: #999; margin-bottom: 12px; }
    .item-row { display: flex; justify-content: space-between;
                align-items: center; padding: 10px 0;
                border-bottom: 1px solid #f5f5f5; font-size: 14px; }
    .item-name { color: #222; font-weight: 600; }
    .item-qty  { color: #999; font-size: 12px; }
    .item-price { font-weight: 700; color: #222; }
    .summary-row { display: flex; justify-content: space-between;
                   font-size: 14px; padding: 5px 0; color: #555; }
    .summary-row.total { font-weight: 700; font-size: 16px;
                         color: #222; border-top: 2px solid #222;
                         margin-top: 8px; padding-top: 12px; }
    .highlight { color: #D4AF37; }
    .address-block { background: #f8f8f8; padding: 16px; border-radius: 2px;
                     font-size: 14px; line-height: 1.8; color: #444; }
    .badge { display: inline-block; padding: 4px 14px; border-radius: 20px;
             font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
             text-transform: uppercase; }
    .badge-processing { background: #dbeafe; color: #1d4ed8; }
    .badge-shipped     { background: #ede9fe; color: #6d28d9; }
    .badge-delivered   { background: #dcfce7; color: #166534; }
    .badge-cancelled   { background: #fee2e2; color: #991b1b; }
    .badge-pending     { background: #fef9c3; color: #854d0e; }
    .btn { display: block; width: fit-content; margin: 24px auto 0;
           background: #D4AF37; color: #1a1a1a; padding: 12px 32px;
           text-decoration: none; font-weight: 700; letter-spacing: 1px;
           text-transform: uppercase; font-size: 13px; border-radius: 2px; }
    .footer { background: #1a1a1a; padding: 20px 32px; text-align: center; }
    .footer p { color: #555; font-size: 11px; line-height: 1.8; }
    .footer a { color: #D4AF37; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">MonikaCreation</div>
      <div class="tagline">Curated collections of luxury and style</div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MonikaCreation. All rights reserved.</p>
      <p style="margin-top:6px">Questions? <a href="mailto:${process.env.EMAIL_USER}">Contact us</a></p>
    </div>
  </div>
</body>
</html>`;

// ── Items HTML snippet ────────────────────────────────────────
const itemsHtml = (items) =>
    items.map(item => `
        <div class="item-row">
            <div>
                <div class="item-name">${item.name}</div>
                <div class="item-qty">Qty: ${item.quantity}</div>
            </div>
            <div class="item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
        </div>
    `).join('');

// ── Price summary snippet ─────────────────────────────────────
const summaryHtml = (order) => `
    <div class="summary-row">
        <span>Subtotal</span>
        <span>₹${order.subtotal.toLocaleString('en-IN')}</span>
    </div>
    <div class="summary-row">
        <span>Delivery</span>
        <span>${order.deliveryFee === 0 ? '<span style="color:#16a34a">FREE</span>' : `₹${order.deliveryFee}`}</span>
    </div>
    ${order.discount > 0 ? `
    <div class="summary-row" style="color:#16a34a">
        <span>Promo (${order.promoCode})</span>
        <span>− ₹${order.discount}</span>
    </div>` : ''}
    <div class="summary-row total">
        <span>Total Paid</span>
        <span class="highlight">₹${order.total.toLocaleString('en-IN')}</span>
    </div>`;

// ── Address snippet ───────────────────────────────────────────
const addressHtml = (addr) => `
    <div class="address-block">
        <strong>${addr.fullName}</strong><br/>
        ${addr.line1}${addr.line2 ? `, ${addr.line2}` : ''}<br/>
        ${addr.city}, ${addr.state} — ${addr.pincode}<br/>
        ${addr.country}<br/>
        <strong>Phone:</strong> ${addr.phone}
    </div>`;

// ─────────────────────────────────────────────────────────────
// 1. ORDER CONFIRMATION EMAIL
// ─────────────────────────────────────────────────────────────
export const sendOrderConfirmation = async (order, userEmail, userName) => {
    const orderId = order._id.toString().slice(-10).toUpperCase();

    const html = layout(`
        <div class="title">Order Confirmed! 🎉</div>
        <div class="sub">Hi ${userName}, thank you for your purchase. We're getting your order ready.</div>

        <div class="label">Order #${orderId}</div>
        ${itemsHtml(order.items)}
        <hr class="divider"/>
        ${summaryHtml(order)}

        <hr class="divider"/>
        <div class="label">Delivering To</div>
        ${addressHtml(order.shippingAddress)}

        <a href="${process.env.FRONTEND_URL}/my-orders" class="btn">Track My Order</a>
    `);

    await sendEmail({
        to:      userEmail,
        subject: `Order Confirmed — #${orderId} | MonikaCreation`,
        html,
    });
};

// ─────────────────────────────────────────────────────────────
// 2. ORDER STATUS UPDATE EMAIL
// ─────────────────────────────────────────────────────────────
const STATUS_MESSAGES = {
    processing: {
        emoji:   '📦',
        title:   'Your order is being processed',
        body:    'Our team has confirmed your order and is preparing it for dispatch.',
    },
    shipped: {
        emoji:   '🚚',
        title:   'Your order is on its way!',
        body:    'Your package has been handed over to the courier and is headed your way.',
    },
    delivered: {
        emoji:   '✅',
        title:   'Your order has been delivered',
        body:    'We hope you love your purchase! If you have any issues, please reach out to us.',
    },
    cancelled: {
        emoji:   '❌',
        title:   'Your order has been cancelled',
        body:    'Your order has been cancelled. If a payment was made, it will be refunded within 5–7 business days.',
    },
};

export const sendStatusUpdate = async (order, userEmail, userName) => {
    const info = STATUS_MESSAGES[order.orderStatus];
    if (!info) return;   // don't email for 'pending' — already sent confirmation

    const orderId = order._id.toString().slice(-10).toUpperCase();

    const html = layout(`
        <div class="title">${info.emoji} ${info.title}</div>
        <div class="sub">Hi ${userName}, ${info.body}</div>

        <div class="label">Order #${orderId}</div>
        <div style="margin-bottom:16px">
            <span class="badge badge-${order.orderStatus}">${order.orderStatus}</span>
        </div>

        ${order.trackingNumber ? `
        <div class="label">Tracking Number</div>
        <div class="address-block" style="font-family:monospace;font-size:16px;
            font-weight:700;letter-spacing:2px">
            ${order.trackingNumber}
        </div>
        <hr class="divider"/>` : ''}

        <div class="label">Order Summary</div>
        ${itemsHtml(order.items)}
        <hr class="divider"/>
        ${summaryHtml(order)}

        <a href="${process.env.FRONTEND_URL}/my-orders" class="btn">View My Orders</a>
    `);

    await sendEmail({
        to:      userEmail,
        subject: `${info.emoji} Order ${order.orderStatus} — #${orderId} | MonikaCreation`,
        html,
    });
};