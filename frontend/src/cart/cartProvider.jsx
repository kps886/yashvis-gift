import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // Load cart from localStorage on start
    const [cartItems, setCartItems] = useState(() => {
        const localData = localStorage.getItem('cart');
        return localData ? JSON.parse(localData) : [];
    });

    // Save to localStorage whenever cart changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        setCartItems((prevItems) => {
            // Check if item already exists
            const exist = prevItems.find((x) => x._id === product._id);
            if (exist) {
                // If it exists, increase quantity
                return prevItems.map((x) =>
                    x._id === product._id ? { ...x, qty: x.qty + 1 } : x
                );
            } else {
                // If not, add it with qty 1
                return [...prevItems, { ...product, qty: 1 }];
            }
        });
    };

    const removeFromCart = (id) => {
        setCartItems((prevItems) => prevItems.filter((x) => x._id !== id));
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart }}>
            {children}
        </CartContext.Provider>
    );
};