import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from './cartProvider';
import { useAuth } from '../auth/AuthContext';

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const CartPage = () => {
    const { cartItems, removeFromCart, updateQty, totalPrice, clearCart } = useContext(CartContext);
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();

    const DELIVERY_THRESHOLD = 500;
    const DELIVERY_FEE = 50;
    const deliveryFee = totalPrice >= DELIVERY_THRESHOLD || totalPrice === 0 ? 0 : DELIVERY_FEE;
    const finalTotal = totalPrice + deliveryFee;

    const handleCheckout = () => {
        if (!isLoggedIn) {
            navigate('/login', { state: { from: { pathname: '/checkout' } } });
        } else {
            navigate('/checkout');
        }
    };

    return (
        <div className="container mx-auto py-12 px-4 min-h-[60vh]">
            <h1 className="text-4xl font-serif mb-8 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
                Your Shopping Bag
            </h1>

            {cartItems.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-xl mb-6 text-text-secondary">Your bag is currently empty.</p>
                    <Link
                        to="/"
                        className="inline-block bg-accent-gold text-primary-bg px-8 py-3 font-bold uppercase tracking-wider hover:bg-yellow-500 transition-colors"
                    >
                        Continue Shopping
                    </Link>
                </div>
            ) : (
                <div className="max-w-4xl mx-auto">
                    <div className="space-y-4 mb-8">
                        {cartItems.map((item) => (
                            <div key={item._id} className="flex items-center gap-4 bg-secondary-bg p-4 border border-border-color">
                                <img
                                    src={item.images?.[0] || 'https://placehold.co/80x80/222222/D4AF37?text=C'}
                                    alt={item.name}
                                    className="w-20 h-20 object-cover border border-border-color flex-shrink-0"
                                />
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-serif text-lg truncate">{item.name}</h3>
                                    {item.size && <p className="text-xs text-text-secondary mt-1 font-semibold uppercase tracking-wider">Size: {item.size}</p>}
                                    <p className="text-accent-gold font-semibold">₹{item.price.toLocaleString('en-IN')}</p>
                                </div>
                                {/* Qty controls */}
                                <div className="flex items-center border border-border-color">
                                    <button
                                        onClick={() => updateQty(item._id, item.size, item.qty - 1)}
                                        className="px-3 py-1 hover:bg-primary-bg transition-colors font-bold"
                                    >
                                        −
                                    </button>
                                    <span className="px-4 py-1 border-x border-border-color font-semibold min-w-[3rem] text-center">
                                        {item.qty}
                                    </span>
                                    <button
                                        onClick={() => updateQty(item._id, item.size, item.qty + 1)}
                                        className="px-3 py-1 hover:bg-primary-bg transition-colors font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                                <p className="font-bold text-right w-28 flex-shrink-0">
                                    ₹{(item.price * item.qty).toLocaleString('en-IN')}
                                </p>
                                <button
                                    onClick={() => removeFromCart(item._id, item.size)}
                                    className="text-red-400 hover:text-red-300 transition-colors p-1 flex-shrink-0"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="bg-secondary-bg border border-border-color p-6">
                        <div className="flex justify-between items-center mb-2 text-text-secondary">
                            <span>Subtotal</span>
                            <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center mb-6 text-text-secondary">
                            <span>Shipping</span>
                            <span className={deliveryFee === 0 ? "text-green-400 font-semibold" : ""}>
                                {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                            </span>
                        </div>
                        {totalPrice > 0 && totalPrice < DELIVERY_THRESHOLD && (
                            <p className="text-xs text-text-secondary mb-4 bg-primary-bg p-2 rounded border border-border-color">
                                💡 Add ₹{(DELIVERY_THRESHOLD - totalPrice).toLocaleString('en-IN')} more for free delivery
                            </p>
                        )}
                        <div className="border-t border-border-color pt-4 flex justify-between items-center mb-6">
                            <h3 className="text-xl font-serif font-bold">Total</h3>
                            <h3 className="text-xl font-bold text-accent-gold">₹{finalTotal.toLocaleString('en-IN')}</h3>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleCheckout}
                                className="flex-1 bg-accent-gold text-primary-bg font-bold py-3 uppercase tracking-wider hover:bg-yellow-500 transition-colors"
                            >
                                {isLoggedIn ? 'Proceed to Checkout →' : 'Sign In to Checkout'}
                            </button>
                            <button
                                onClick={clearCart}
                                className="px-6 py-3 border border-border-color hover:border-red-500/50 hover:text-red-400 transition-colors text-sm font-semibold uppercase tracking-wider"
                            >
                                Clear Bag
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;
