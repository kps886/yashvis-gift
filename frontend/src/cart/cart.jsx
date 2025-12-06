import React, {useContext} from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from './cartProvider';

// --- Reusable Button ---
export const Button = ({ children, variant = 'primary', ...props }) => {
    const baseStyle = "px-6 py-2 font-bold uppercase tracking-wider transition-transform duration-200 transform hover:scale-105";
    const styles = {
        primary: "bg-accent-gold text-primary-bg",
        secondary: "bg-white/80 text-primary-bg",
        danger: "bg-red-500 text-white"
    };
    return <button className={`${baseStyle} ${styles[variant]}`} {...props}>{children}</button>;
};

export const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);

const CartPage = () => {
    // CHANGE: Get real data from Context
    const { cartItems, removeFromCart } = useContext(CartContext);

    // CHANGE: Calculate Total Price
    const total = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

    return (
        <div className="container mx-auto py-12 px-4 min-h-[60vh]">
            <h1 className="text-4xl font-serif mb-8 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>Your Shopping Bag</h1>
            
            {cartItems.length === 0 ? (
                <div className="text-center">
                    <p className="text-xl mb-6">Your bag is currently empty.</p>
                    <Link to="/" className="inline-block bg-accent-gold text-primary-bg px-6 py-2 font-bold uppercase tracking-wider hover:scale-105 transition-transform">
                        Continue Shopping
                    </Link>
                </div>
            ) : (
                <div className="grid gap-8 max-w-4xl mx-auto">
                    {/* CHANGE: Map through real items */}
                    {cartItems.map((item) => (
                        <div key={item._id} className="flex items-center justify-between bg-secondary-bg p-4 border border-border-color">
                            <div className="flex items-center gap-4">
                                <img src={item.images[0]} alt={item.name} className="w-20 h-20 object-cover" />
                                <div>
                                    <h3 className="font-serif text-lg">{item.name}</h3>
                                    <p className="text-accent-gold">₹{item.price.toLocaleString('en-IN')} x {item.qty}</p>
                                </div>
                            </div>
                            <button onClick={() => removeFromCart(item._id)} className="text-red-500 hover:text-red-400 p-2">
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                    
                    <div className="border-t border-border-color pt-6 text-right">
                        <h3 className="text-2xl font-serif mb-4">Total: ₹{total.toLocaleString('en-IN')}</h3>
                        <Button>Proceed to Checkout</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;