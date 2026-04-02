import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../cart/cartProvider';
import { useAuth } from '../auth/AuthContext';

// ── Razorpay script loader ────────────────────────────────────
const loadRazorpay = () =>
    new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload  = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

// ── Indian states list ────────────────────────────────────────
const INDIAN_STATES = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
    'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
    'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
    'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
    'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
    'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
    'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const DELIVERY_THRESHOLD = 500;
const DELIVERY_FEE       = 50;

// ── Empty address form ────────────────────────────────────────
const emptyAddress = {
    fullName: '', phone: '', line1: '', line2: '',
    city: '', state: 'Maharashtra', pincode: '', country: 'India',
};

// ── Step indicator ────────────────────────────────────────────
const StepBar = ({ current }) => {
    const steps = ['Address', 'Review Order', 'Payment'];
    return (
        <div className="flex items-center justify-center mb-10 gap-0">
            {steps.map((label, i) => {
                const idx   = i + 1;
                const done  = idx < current;
                const active = idx === current;
                return (
                    <React.Fragment key={label}>
                        <div className="flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${
                                done   ? 'bg-accent-gold border-accent-gold text-primary-bg' :
                                active ? 'border-accent-gold text-accent-gold' :
                                         'border-border-color text-text-secondary'
                            }`}>
                                {done ? '✓' : idx}
                            </div>
                            <span className={`mt-1 text-xs font-semibold uppercase tracking-wider ${
                                active ? 'text-accent-gold' : 'text-text-secondary'
                            }`}>{label}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${
                                done ? 'bg-accent-gold' : 'bg-border-color'
                            }`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ── Order summary sidebar ─────────────────────────────────────
const OrderSummary = ({ cartItems, subtotal, deliveryFee, discount, total, promoCode }) => (
    <div className="bg-secondary-bg border border-border-color p-5 sticky top-24">
        <h3 className="font-serif text-lg mb-4 pb-3 border-b border-border-color"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Order Summary
        </h3>

        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
            {cartItems.map(item => (
                <div key={item._id} className="flex items-center gap-3">
                    <img
                        src={item.images?.[0] || 'https://placehold.co/48x48/222/D4AF37?text=C'}
                        alt={item.name}
                        className="w-12 h-12 object-cover border border-border-color flex-shrink-0"
                    />
                    <div className="flex-grow min-w-0">
                        <p className="text-sm font-semibold truncate">{item.name}</p>
                        <p className="text-xs text-text-secondary">Qty: {item.qty}</p>
                    </div>
                    <p className="text-sm font-semibold flex-shrink-0">
                        ₹{(item.price * item.qty).toLocaleString('en-IN')}
                    </p>
                </div>
            ))}
        </div>

        <div className="border-t border-border-color pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-text-secondary">
                <span>Delivery</span>
                <span className={deliveryFee === 0 ? 'text-green-400' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </span>
            </div>
            {discount > 0 && (
                <div className="flex justify-between text-green-400">
                    <span>Promo ({promoCode})</span>
                    <span>− ₹{discount}</span>
                </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border-color">
                <span>Total</span>
                <span className="text-accent-gold">₹{total.toLocaleString('en-IN')}</span>
            </div>
        </div>

        {subtotal < DELIVERY_THRESHOLD && (
            <p className="mt-3 text-xs text-text-secondary bg-primary-bg p-2 rounded">
                💡 Add ₹{(DELIVERY_THRESHOLD - subtotal).toLocaleString('en-IN')} more for free delivery
            </p>
        )}
    </div>
);

// ── Field helper (Defined outside to prevent focus loss) ──────
const Field = ({ label, name, type = 'text', required, half, children, value, onChange, error }) => (
    <div className={half ? '' : 'md:col-span-2'}>
        <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        {children || (
            <input
                type={type}
                value={value}
                onChange={onChange}
                className={`w-full p-3 bg-primary-bg border rounded focus:outline-none focus:border-accent-gold transition-colors ${
                    error ? 'border-red-500' : 'border-border-color'
                }`}
            />
        )}
        {error && (
            <p className="text-red-400 text-xs mt-1">{error}</p>
        )}
    </div>
);

// ─────────────────────────────────────────────────────────────
// Main Checkout Page
// ─────────────────────────────────────────────────────────────
const CheckoutPage = () => {
    const { cartItems, clearCart, totalPrice } = useContext(CartContext);
    const { user }   = useAuth();
    const navigate   = useNavigate();

    const [step, setStep]                   = useState(1);
    const [address, setAddress]             = useState(emptyAddress);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [useNewAddress, setUseNewAddress] = useState(true);
    const [promoInput, setPromoInput]       = useState('');
    const [promoResult, setPromoResult]     = useState(null);  // { code, discount, message }
    const [promoError, setPromoError]       = useState('');
    const [promoLoading, setPromoLoading]   = useState(false);
    const [placing, setPlacing]             = useState(false);
    const [error, setError]                 = useState('');
    const [addressErrors, setAddressErrors] = useState({});

    // Computed prices
    const subtotal    = totalPrice;
    const deliveryFee = subtotal >= DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const discount    = promoResult?.discount || 0;
    const total       = Math.max(subtotal + deliveryFee - discount, 1);

    // Redirect if cart is empty
    useEffect(() => {
        if (cartItems.length === 0) navigate('/');
    }, [cartItems, navigate]);

    // Load saved addresses from user profile
    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const { data } = await axios.get('/api/users/profile');
                if (data.addresses?.length > 0) {
                    setSavedAddresses(data.addresses);
                    setAddress(data.addresses.find(a => a.isDefault) || data.addresses[0]);
                    setUseNewAddress(false);
                }
            } catch {
                // no saved addresses — fine
            }
        };
        fetchAddresses();
    }, []);

    // ── Address validation ────────────────────────────────────
    const validateAddress = () => {
        const errs = {};
        if (!address.fullName.trim()) errs.fullName = 'Full name is required';
        if (!address.phone.trim() || !/^\d{10}$/.test(address.phone.replace(/\s/g, '')))
            errs.phone = 'Enter a valid 10-digit phone number';
        if (!address.line1.trim()) errs.line1 = 'Address line 1 is required';
        if (!address.city.trim())  errs.city  = 'City is required';
        if (!address.state.trim()) errs.state = 'State is required';
        if (!address.pincode.trim() || !/^\d{6}$/.test(address.pincode))
            errs.pincode = 'Enter a valid 6-digit pincode';
        setAddressErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNextStep = () => {
        if (step === 1 && !validateAddress()) return;
        setStep(s => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── Promo code ────────────────────────────────────────────
    const handleApplyPromo = async () => {
        if (!promoInput.trim()) return;
        setPromoLoading(true);
        setPromoError('');
        setPromoResult(null);
        try {
            const { data } = await axios.post('/api/promo/validate', {
                code: promoInput.trim(),
                subtotal,
            });
            setPromoResult(data);
        } catch (err) {
            setPromoError(err.response?.data?.message || 'Invalid promo code');
        }
        setPromoLoading(false);
    };

    const handleRemovePromo = () => {
        setPromoResult(null);
        setPromoInput('');
        setPromoError('');
    };

    // ── Payment ───────────────────────────────────────────────
    const handlePayment = async () => {
        setPlacing(true);
        setError('');

        // 1. Load Razorpay SDK
        const loaded = await loadRazorpay();
        if (!loaded) {
            setError('Failed to load Razorpay. Check your internet connection.');
            setPlacing(false);
            return;
        }

        try {
            // 2. Create order on backend — get razorpayOrderId
            const { data } = await axios.post('/api/orders/create-payment', {
                items: cartItems.map(item => ({
                    product:  item._id,
                    quantity: item.qty,
                })),
                shippingAddress: address,
                promoCode: promoResult?.code || null,
            });

            // 3. Open Razorpay checkout
            const options = {
                key:         data.keyId,
                amount:      data.amount,          // paise
                currency:    data.currency,
                name:        'Charming',
                description: 'Order Payment',
                order_id:    data.razorpayOrderId,
                prefill: {
                    name:    user.name,
                    email:   user.email,
                    contact: address.phone,
                },
                theme: { color: '#D4AF37' },

                handler: async (response) => {
                    // 4. Payment success — verify on backend
                    try {
                        await axios.post('/api/orders/verify-payment', {
                            orderId:           data.orderId,
                            razorpayOrderId:   response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });
                        clearCart();
                        navigate(`/order-success/${data.orderId}`);
                    } catch {
                        setError('Payment was received but verification failed. Contact support with your payment ID: ' + response.razorpay_payment_id);
                        setPlacing(false);
                    }
                },

                modal: {
                    ondismiss: () => {
                        setError('Payment was cancelled. Your order has not been placed.');
                        setPlacing(false);
                    },
                },
            };

            new window.Razorpay(options).open();
        } catch (err) {
            setError(err.response?.data?.message || 'Error initiating payment. Please try again.');
            setPlacing(false);
        }
    };

    // ─────────────────────────────────────────────────────────
    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <h1 className="text-3xl font-serif text-center mb-8"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                Checkout
            </h1>

            <StepBar current={step} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── Left / Main panel ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* ── STEP 1: Address ── */}
                    {step === 1 && (
                        <div className="bg-secondary-bg border border-border-color p-6">
                            <h2 className="text-xl font-serif mb-5"
                                style={{ fontFamily: "'Playfair Display', serif" }}>
                                Shipping Address
                            </h2>

                            {/* Saved addresses */}
                            {savedAddresses.length > 0 && (
                                <div className="mb-5 space-y-2">
                                    {savedAddresses.map((a, i) => (
                                        <label key={i}
                                            className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-colors ${
                                                !useNewAddress && address === a
                                                    ? 'border-accent-gold bg-accent-gold/5'
                                                    : 'border-border-color hover:border-text-secondary'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="savedAddr"
                                                checked={!useNewAddress && address === a}
                                                onChange={() => { setAddress(a); setUseNewAddress(false); }}
                                                className="mt-1 accent-yellow-500"
                                            />
                                            <div className="text-sm">
                                                <p className="font-bold">{a.fullName}</p>
                                                <p className="text-text-secondary">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                                                <p className="text-text-secondary">{a.city}, {a.state} — {a.pincode}</p>
                                                <p className="text-text-secondary">{a.phone}</p>
                                            </div>
                                        </label>
                                    ))}
                                    <button
                                        onClick={() => { setAddress(emptyAddress); setUseNewAddress(true); }}
                                        className={`w-full p-3 border rounded text-sm font-semibold transition-colors text-left ${
                                            useNewAddress
                                                ? 'border-accent-gold text-accent-gold'
                                                : 'border-border-color text-text-secondary hover:border-text-secondary'
                                        }`}>
                                        + Use a new address
                                    </button>
                                </div>
                            )}

                            {/* Address form */}
                            {(useNewAddress || savedAddresses.length === 0) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field 
                                        label="Full Name" 
                                        required half 
                                        value={address.fullName}
                                        onChange={e => { setAddress({ ...address, fullName: e.target.value }); setAddressErrors({ ...addressErrors, fullName: '' }); }}
                                        error={addressErrors.fullName}
                                    />
                                    <Field 
                                        label="Phone Number" 
                                        type="tel" required half 
                                        value={address.phone}
                                        onChange={e => { setAddress({ ...address, phone: e.target.value }); setAddressErrors({ ...addressErrors, phone: '' }); }}
                                        error={addressErrors.phone}
                                    />
                                    <Field 
                                        label="Address Line 1" 
                                        required 
                                        value={address.line1}
                                        onChange={e => { setAddress({ ...address, line1: e.target.value }); setAddressErrors({ ...addressErrors, line1: '' }); }}
                                        error={addressErrors.line1}
                                    />
                                    <Field 
                                        label="Address Line 2 (optional)" 
                                        value={address.line2}
                                        onChange={e => setAddress({ ...address, line2: e.target.value })}
                                    />
                                    <Field 
                                        label="City" 
                                        required half 
                                        value={address.city}
                                        onChange={e => { setAddress({ ...address, city: e.target.value }); setAddressErrors({ ...addressErrors, city: '' }); }}
                                        error={addressErrors.city}
                                    />
                                    <Field 
                                        label="State" 
                                        required half error={addressErrors.state}>
                                        <select
                                            value={address.state}
                                            onChange={e => setAddress({ ...address, state: e.target.value })}
                                            className="w-full p-3 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold"
                                        >
                                            {INDIAN_STATES.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field 
                                        label="Pincode" 
                                        required half 
                                        value={address.pincode}
                                        onChange={e => { setAddress({ ...address, pincode: e.target.value }); setAddressErrors({ ...addressErrors, pincode: '' }); }}
                                        error={addressErrors.pincode}
                                    />
                                    <Field 
                                        label="Country" 
                                        required half 
                                        value={address.country}
                                        onChange={e => { setAddress({ ...address, country: e.target.value }); setAddressErrors({ ...addressErrors, country: '' }); }}
                                        error={addressErrors.country}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 2: Review & Promo ── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            {/* Delivery address summary */}
                            <div className="bg-secondary-bg border border-border-color p-5">
                                <div className="flex justify-between items-start">
                                    <h2 className="font-serif text-lg mb-3"
                                        style={{ fontFamily: "'Playfair Display', serif" }}>
                                        Delivering To
                                    </h2>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-xs text-accent-gold hover:underline"
                                    >
                                        Change
                                    </button>
                                </div>
                                <p className="font-semibold">{address.fullName}</p>
                                <p className="text-text-secondary text-sm">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
                                <p className="text-text-secondary text-sm">{address.city}, {address.state} — {address.pincode}</p>
                                <p className="text-text-secondary text-sm">{address.phone}</p>
                            </div>

                            {/* Promo code */}
                            <div className="bg-secondary-bg border border-border-color p-5">
                                <h2 className="font-serif text-lg mb-4"
                                    style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Promo Code
                                </h2>

                                {promoResult ? (
                                    <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/40 rounded">
                                        <div>
                                            <p className="font-bold text-green-400 text-sm">{promoResult.code}</p>
                                            <p className="text-green-400/80 text-xs">{promoResult.message}</p>
                                        </div>
                                        <button
                                            onClick={handleRemovePromo}
                                            className="text-red-400 text-xs hover:underline ml-4"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={promoInput}
                                            onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                                            onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                                            placeholder="Enter promo code"
                                            className="flex-grow p-3 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold uppercase tracking-widest text-sm"
                                        />
                                        <button
                                            onClick={handleApplyPromo}
                                            disabled={promoLoading || !promoInput.trim()}
                                            className="px-5 bg-accent-gold text-primary-bg font-bold text-sm uppercase hover:bg-yellow-500 transition-colors disabled:opacity-50 rounded"
                                        >
                                            {promoLoading ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                )}
                                {promoError && (
                                    <p className="text-red-400 text-xs mt-2">{promoError}</p>
                                )}
                            </div>

                            {/* Price breakdown */}
                            <div className="bg-secondary-bg border border-border-color p-5">
                                <h2 className="font-serif text-lg mb-4"
                                    style={{ fontFamily: "'Playfair Display', serif" }}>
                                    Price Details
                                </h2>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between text-text-secondary">
                                        <span>Price ({cartItems.reduce((a, i) => a + i.qty, 0)} items)</span>
                                        <span>₹{subtotal.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between text-text-secondary">
                                        <span>Delivery Charges</span>
                                        <span className={deliveryFee === 0 ? 'text-green-400 font-semibold' : ''}>
                                            {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                                        </span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-400">
                                            <span>Promo Discount</span>
                                            <span>− ₹{discount}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between font-bold text-base pt-3 border-t border-border-color">
                                        <span>Amount Payable</span>
                                        <span className="text-accent-gold">₹{total.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                                {deliveryFee === 0 && (
                                    <p className="text-green-400 text-xs mt-3">
                                        🎉 You're getting free delivery!
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Payment ── */}
                    {step === 3 && (
                        <div className="bg-secondary-bg border border-border-color p-6">
                            <h2 className="text-xl font-serif mb-2"
                                style={{ fontFamily: "'Playfair Display', serif" }}>
                                Payment
                            </h2>
                            <p className="text-text-secondary text-sm mb-6">
                                You will be redirected to Razorpay's secure payment page.
                            </p>

                            {/* Payment method — only Razorpay for now */}
                            <div className="flex items-center gap-3 p-4 border border-accent-gold bg-accent-gold/5 rounded mb-6">
                                <div className="w-5 h-5 rounded-full border-2 border-accent-gold flex items-center justify-center">
                                    <div className="w-2.5 h-2.5 rounded-full bg-accent-gold" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Online Payment</p>
                                    <p className="text-xs text-text-secondary">UPI, Cards, Net Banking, Wallets via Razorpay</p>
                                </div>
                                <img
                                    src="https://razorpay.com/favicon.png"
                                    alt="Razorpay"
                                    className="w-6 h-6 ml-auto opacity-70"
                                />
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 text-red-400 rounded text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Final price reminder */}
                            <div className="flex justify-between items-center p-4 bg-primary-bg rounded mb-6 border border-border-color">
                                <span className="font-semibold">Total Amount</span>
                                <span className="text-xl font-bold text-accent-gold">
                                    ₹{total.toLocaleString('en-IN')}
                                </span>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={placing}
                                className="w-full bg-accent-gold text-primary-bg font-bold py-4 uppercase tracking-wider hover:bg-yellow-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-base"
                            >
                                {placing ? 'Opening Payment...' : `Pay ₹${total.toLocaleString('en-IN')}`}
                            </button>

                            <p className="text-center text-xs text-text-secondary mt-4">
                                🔒 Payments are 100% secure and encrypted
                            </p>
                        </div>
                    )}

                    {/* ── Navigation buttons ── */}
                    <div className="flex justify-between gap-4">
                        {step > 1 && (
                            <button
                                onClick={() => { setStep(s => s - 1); setError(''); }}
                                className="px-6 py-3 border border-border-color hover:border-text-secondary transition-colors font-semibold text-sm uppercase tracking-wider"
                            >
                                ← Back
                            </button>
                        )}
                        {step < 3 && (
                            <button
                                onClick={handleNextStep}
                                className="ml-auto px-8 py-3 bg-accent-gold text-primary-bg font-bold text-sm uppercase tracking-wider hover:bg-yellow-500 transition-colors"
                            >
                                {step === 1 ? 'Continue to Review →' : 'Continue to Payment →'}
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Right: Order summary (always visible) ── */}
                <div className="lg:col-span-1">
                    <OrderSummary
                        cartItems={cartItems}
                        subtotal={subtotal}
                        deliveryFee={deliveryFee}
                        discount={discount}
                        total={total}
                        promoCode={promoResult?.code}
                    />
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;