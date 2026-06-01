import React from 'react';

// ── Shared Layout Wrapper ──
const LegalLayout = ({ title, lastUpdated, children }) => (
    <div className="container mx-auto py-12 px-4 max-w-4xl min-h-[60vh]">
        <h1 className="text-3xl md:text-4xl font-serif mb-2 text-accent-gold" 
            style={{ fontFamily: "'Playfair Display', serif" }}>
            {title}
        </h1>
        <p className="text-sm text-text-secondary mb-8 pb-4 border-b border-border-color">
            Last Updated: {lastUpdated}
        </p>
        <div className="space-y-6 text-sm md:text-base leading-relaxed text-text-primary">
            {children}
        </div>
    </div>
);

// ── 1. Terms of Service ──
export const TermsOfService = () => (
    <LegalLayout title="Terms of Service" lastUpdated="October 24, 2024">
        <p>Welcome to MonikaCreation. By accessing our website and purchasing our products, you agree to be bound by the following terms and conditions.</p>
        <h3 className="text-lg font-bold mt-6 mb-2">1. General Conditions</h3>
        <p>We reserve the right to refuse service to anyone for any reason at any time. You understand that your content (not including credit card information), may be transferred unencrypted and involve transmissions over various networks.</p>
        <h3 className="text-lg font-bold mt-6 mb-2">2. Products and Pricing</h3>
        <p>Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service without notice at any time. We have made every effort to display as accurately as possible the colors and images of our products.</p>
        <h3 className="text-lg font-bold mt-6 mb-2">3. Accuracy of Billing</h3>
        <p>We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order.</p>
    </LegalLayout>
);

// ── 2. Privacy Policy ──
export const PrivacyPolicy = () => (
    <LegalLayout title="Privacy Policy" lastUpdated="October 24, 2024">
        <p>MonikaCreation ("we", "our", or "us") respects your privacy and is committed to protecting your personal data.</p>
        <h3 className="text-lg font-bold mt-6 mb-2">1. Information We Collect</h3>
        <p>When you make a purchase or attempt to make a purchase through the Site, we collect certain information from you, including your name, billing address, shipping address, payment information, email address, and phone number.</p>
        <h3 className="text-lg font-bold mt-6 mb-2">2. How We Use Your Information</h3>
        <p>We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations).</p>
        <h3 className="text-lg font-bold mt-6 mb-2">3. Data Security</h3>
        <p>Your payment information is processed securely via Razorpay. We do not store your credit card details on our servers.</p>
    </LegalLayout>
);

// ── 3. Shipping Policy ──
export const ShippingPolicy = () => (
    <LegalLayout title="Shipping Policy" lastUpdated="October 24, 2024">
        <h3 className="text-lg font-bold mt-6 mb-2">1. Processing Time</h3>
        <p>All orders are processed within 1 to 3 business days. Orders are not shipped or delivered on weekends or holidays. If we are experiencing a high volume of orders, shipments may be delayed by a few days.</p>
        <h3 className="text-lg font-bold mt-6 mb-2">2. Shipping Rates & Delivery Estimates</h3>
        <p>Shipping charges for your order will be calculated and displayed at checkout. We offer free shipping on all orders over ₹500. For orders under ₹500, a flat delivery fee of ₹50 applies. Standard delivery typically takes 3-7 business days depending on your location.</p>
        <h3 className="text-lg font-bold mt-6 mb-2">3. Shipment Confirmation & Order Tracking</h3>
        <p>You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.</p>
    </LegalLayout>
);

// ── 4. Cancellation & Refund Policy ──
export const RefundPolicy = () => (
    <LegalLayout title="Cancellation & Refund Policy" lastUpdated="October 24, 2024">
        <h3 className="text-lg font-bold mt-6 mb-2">1. Order Cancellations</h3>
        <p>You may cancel your order at any time before it has been processed and shipped. Once the order status changes to "Processing" or "Shipped", it cannot be cancelled through the dashboard. If a payment was successfully made for a cancelled order, a full refund will be initiated.</p>
        <h3 className="text-lg font-bold mt-6 mb-2">2. Returns</h3>
        <p>We accept returns within 7 days of delivery. To be eligible for a return, your item must be unused, unwashed, and in the same condition that you received it. It must also be in the original packaging with all tags attached.</p>
        <h3 className="text-lg font-bold mt-6 mb-2">3. Refunds</h3>
        <p>Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment (via Razorpay) within 5-7 business days.</p>
    </LegalLayout>
);