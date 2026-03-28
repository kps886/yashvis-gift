import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useContext(AuthContext);

    const [cartItems, setCartItems] = useState(() => {
        const localData = localStorage.getItem('cart');
        return localData ? JSON.parse(localData) : [];
    });

    // Clear cart when user logs out
    useEffect(() => {
        if (!user) {
            setCartItems([]);
        }
    }, [user]);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        setCartItems((prevItems) => {
            const exist = prevItems.find((x) => x._id === product._id);
            if (exist) {
                return prevItems.map((x) =>
                    x._id === product._id ? { ...x, qty: x.qty + 1 } : x
                );
            } else {
                return [...prevItems, { ...product, qty: 1 }];
            }
        });
    };

    const removeFromCart = (id) => {
        setCartItems((prevItems) => prevItems.filter((x) => x._id !== id));
    };

    const updateQty = (id, qty) => {
        if (qty < 1) return;
        setCartItems((prevItems) =>
            prevItems.map((x) => (x._id === id ? { ...x, qty } : x))
        );
    };

    const clearCart = () => setCartItems([]);

    const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);
    const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice }}>
            {children}
        </CartContext.Provider>
    );
};
