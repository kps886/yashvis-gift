import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from '../auth/AuthContext';
import toast from 'react-hot-toast';

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

    const addToCart = (product, size) => {
        setCartItems((prevItems) => {
            const exist = prevItems.find((x) => x._id === product._id && x.size === size);
            if (exist) {
                toast.success(`Increased quantity of ${product.name}`);
                return prevItems.map((x) =>
                    x._id === product._id && x.size === size ? { ...x, qty: x.qty + 1 } : x
                );
            } else {
                toast.success(`Added ${product.name} to your bag!`);
                return [...prevItems, { ...product, qty: 1, size }];
            }
        });
    };

    const removeFromCart = (id, size) => {
        setCartItems((prevItems) => prevItems.filter((x) => !(x._id === id && x.size === size)));
        toast.success('Item removed from bag');
    };

    const updateQty = (id, size, qty) => {
        if (qty < 1) return;
        setCartItems((prevItems) =>
            prevItems.map((x) => (x._id === id && x.size === size ? { ...x, qty } : x))
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
