import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

const OrderSuccessPage = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await axios.get(`/api/orders/${id}`);
                setOrder(data);
            } catch {
                // silently fail — user still sees success UI
            }
        };
        fetchOrder();
    }, [id]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="text-center max-w-md w-full">
                {/* Success icon */}
                <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-3xl font-serif mb-2 text-green-400"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    Order Placed!
                </h1>
                <p className="text-text-secondary mb-6">
                    Thank you for your purchase. Your order has been confirmed and is being processed.
                </p>

                {order && (
                    <div className="bg-secondary-bg border border-border-color p-5 text-left mb-6 text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Order ID</span>
                            <span className="font-mono text-xs">{order._id.slice(-10).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Amount Paid</span>
                            <span className="font-bold text-accent-gold">₹{order.total.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Delivering To</span>
                            <span className="text-right">{order.shippingAddress.city}, {order.shippingAddress.state}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">Status</span>
                            <span className="text-blue-400 font-semibold capitalize">{order.orderStatus}</span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to="/my-orders"
                        className="bg-accent-gold text-primary-bg font-bold px-6 py-3 uppercase tracking-wider hover:bg-yellow-500 transition-colors"
                    >
                        Track My Orders
                    </Link>
                    <Link
                        to="/"
                        className="border border-border-color px-6 py-3 font-semibold uppercase tracking-wider hover:border-text-secondary transition-colors text-sm"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessPage;