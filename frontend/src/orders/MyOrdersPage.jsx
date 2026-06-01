import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast'; // ✅ NEW: For clean notifications

const STATUS_STYLES = {
    pending:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    processing: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    shipped:    'bg-purple-500/20 text-purple-400 border-purple-500/40',
    delivered:  'bg-green-500/20 text-green-400 border-green-500/40',
    cancelled:  'bg-red-500/20 text-red-400 border-red-500/40',
};

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];

const OrderTracker = ({ status }) => {
    if (status === 'cancelled') return (
        <div className="flex items-center justify-center p-4 bg-red-500/10 border border-red-500/20 rounded mt-3">
            <span className="text-red-400 text-sm font-bold tracking-wider uppercase">
                ✕ Order Cancelled
            </span>
        </div>
    );
    
    const current = STATUS_STEPS.indexOf(status);
    const labels  = ['Order Placed', 'Processing', 'Shipped', 'Delivered'];
    return (
        <div className="flex items-center gap-0 w-full mt-3">
            {STATUS_STEPS.map((s, i) => {
                const done   = i <= current;
                const active = i === current;
                return (
                    <React.Fragment key={s}>
                        <div className="flex flex-col items-center flex-shrink-0">
                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                                done ? 'bg-accent-gold border-accent-gold text-primary-bg' : 'border-border-color text-text-secondary'
                            }`}>
                                {done ? '✓' : i + 1}
                            </div>
                            <span className={`mt-1 text-[10px] sm:text-xs whitespace-nowrap ${active ? 'text-accent-gold font-semibold' : 'text-text-secondary'}`}>
                                {labels[i]}
                            </span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? 'bg-accent-gold' : 'bg-border-color'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const MyOrdersPage = () => {
    const [orders, setOrders]     = useState([]);
    const [loading, setLoading]   = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [cancellingId, setCancellingId] = useState(null); // ✅ NEW: Track which order is being cancelled

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await api.get('/api/orders/my');
                setOrders(data);
            } catch {
                // handle silently
            }
            setLoading(false);
        };
        fetch();
    }, []);

    // ✅ NEW: Cancel Order Logic
    const handleCancelOrder = async (orderId) => {
        // Double check so they don't misclick
        if (!window.confirm("Are you sure you want to cancel this order? If you have already paid, a refund will be initiated.")) return;

        setCancellingId(orderId);
        try {
            await api.put(`/api/orders/${orderId}/cancel`);
            toast.success("Order cancelled successfully");
            
            // Optimistically update the UI so we don't have to reload the whole page
            setOrders(prevOrders => prevOrders.map(order => 
                order._id === orderId ? { ...order, orderStatus: 'cancelled' } : order
            ));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to cancel order");
        }
        setCancellingId(null);
    };

    if (loading) return (
        <div className="text-center py-32 text-text-secondary animate-pulse">Loading your orders...</div>
    );

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <h1 className="text-3xl font-serif mb-8"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                My Orders
            </h1>

            {orders.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-text-secondary text-lg mb-6">You haven't placed any orders yet.</p>
                    <Link to="/" className="bg-accent-gold text-primary-bg font-bold px-8 py-3 uppercase tracking-wider hover:bg-yellow-500 transition-colors">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order._id} className="bg-secondary-bg border border-border-color overflow-hidden hover:border-accent-gold/50 transition-colors">
                            {/* Order header */}
                            <div
                                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                                onClick={() => setExpanded(expanded === order._id ? null : order._id)}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                                    <div>
                                        <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Order ID</p>
                                        <p className="font-mono text-sm font-semibold">{order._id.slice(-10).toUpperCase()}</p>
                                    </div>
                                    <div className="hidden sm:block w-px h-8 bg-border-color" />
                                    <div>
                                        <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Date Placed</p>
                                        <p className="text-sm font-semibold">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                    <div className="hidden sm:block w-px h-8 bg-border-color" />
                                    <div>
                                        <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Total Amount</p>
                                        <p className="text-sm font-bold text-accent-gold">₹{order.total.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 border-t border-border-color pt-3 md:border-0 md:pt-0">
                                    <span className={`px-3 py-1 text-xs font-bold border rounded uppercase ${STATUS_STYLES[order.orderStatus]}`}>
                                        {order.orderStatus}
                                    </span>
                                    <span className="text-text-secondary text-sm">
                                        {expanded === order._id ? '▲' : '▼'}
                                    </span>
                                </div>
                            </div>

                            {/* Expanded detail */}
                            {expanded === order._id && (
                                <div className="border-t border-border-color p-4 md:p-6 space-y-6 bg-primary-bg/30">
                                    {/* Tracker */}
                                    <OrderTracker status={order.orderStatus} />

                                    {/* Tracking number */}
                                    {order.trackingNumber && (
                                        <div className="p-3 bg-secondary-bg border border-border-color rounded inline-block">
                                            <p className="text-xs text-text-secondary uppercase tracking-wider">Courier Tracking Number</p>
                                            <p className="font-mono font-bold text-accent-gold mt-1">{order.trackingNumber}</p>
                                        </div>
                                    )}

                                    {/* Items */}
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3">Items Ordered</h3>
                                        <div className="space-y-3">
                                            {order.items.map((item, i) => (
                                                <div key={i} className="flex items-center gap-4 bg-secondary-bg p-3 border border-border-color rounded">
                                                    <img
                                                        src={item.image || item.product?.images?.[0] || 'https://placehold.co/48x48/222/D4AF37?text=C'}
                                                        alt={item.name}
                                                        className="w-16 h-16 object-cover border border-border-color flex-shrink-0"
                                                    />
                                                    <div className="flex-grow">
                                                        <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                                                        <p className="text-xs text-text-secondary mt-1">Size: {item.size || 'Standard'} | Qty: {item.quantity}</p>
                                                    </div>
                                                    <p className="text-sm font-bold text-accent-gold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Price breakdown and Shipping side-by-side on desktop */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="bg-secondary-bg border border-border-color p-4 rounded text-sm space-y-2">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Payment Summary</h3>
                                            <div className="flex justify-between text-text-secondary">
                                                <span>Subtotal</span><span>₹{order.subtotal.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between text-text-secondary">
                                                <span>Delivery</span>
                                                <span className={order.deliveryFee === 0 ? 'text-green-400 font-semibold' : ''}>
                                                    {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
                                                </span>
                                            </div>
                                            {order.discount > 0 && (
                                                <div className="flex justify-between text-green-400">
                                                    <span>Promo ({order.promoCode})</span>
                                                    <span>− ₹{order.discount}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-bold text-base pt-3 mt-3 border-t border-border-color">
                                                <span>Total Paid</span>
                                                <span className="text-accent-gold">₹{order.total.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>

                                        <div className="bg-secondary-bg border border-border-color p-4 rounded">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">Delivered To</h3>
                                            <p className="text-sm font-bold text-text-primary mb-1">{order.shippingAddress.fullName}</p>
                                            <p className="text-sm text-text-secondary leading-relaxed">
                                                {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
                                                {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}<br />
                                                <span className="inline-block mt-2 font-mono">{order.shippingAddress.phone}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* ✅ NEW: Cancel Button Area */}
                                    {order.orderStatus === 'pending' && (
                                        <div className="pt-4 mt-2 border-t border-border-color flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <p className="text-xs text-text-secondary">
                                                Need to make a change? You can cancel this order before it begins processing.
                                            </p>
                                            <button 
                                                onClick={() => handleCancelOrder(order._id)}
                                                disabled={cancellingId === order._id}
                                                className="px-6 py-2.5 border border-red-500/40 text-red-400 font-bold uppercase tracking-wider text-xs hover:bg-red-500/10 hover:border-red-500 transition-colors disabled:opacity-50 whitespace-nowrap rounded"
                                            >
                                                {cancellingId === order._id ? 'Cancelling...' : 'Cancel Order'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyOrdersPage;