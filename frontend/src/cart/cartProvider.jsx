import React, { createContext, useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../auth/AuthContext';
import toast from 'react-hot-toast';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const { isLoggedIn } = useAuth();

    // 1. FETCH FROM DB ON LOGIN
    useEffect(() => {
        if (isLoggedIn) {
            api.get('/api/cart')
                .then(res => {
                    // MAGIC TRICK: Flatten the nested DB response back to the normal structure
                    // so your UI (p.price, p.name, etc.) doesn't break!
                    const flatItems = res.data.map(item => ({
                        ...item.product, // Spreads _id, name, price, images
                        size: item.size,
                        qty: item.qty
                    }));
                    setCartItems(flatItems);
                })
                .catch(() => toast.error('Could not load your saved cart'));
        } else {
            setCartItems([]);
        }
    }, [isLoggedIn]);

    // 2. SYNC TO DB WHEN CART CHANGES
    const syncCart = async (updatedItems) => {
        if (isLoggedIn) {
            try {
                // REVERSE MAGIC: Format it exactly how the Mongoose Schema expects it
                const dbItems = updatedItems.map(item => ({
                    product: item._id, // Just the ID
                    size: item.size,
                    qty: item.qty
                }));

                await api.post('/api/cart', { items: dbItems });
            } catch (error) {
                console.error("Cart sync failed", error);
            }
        }
    };

    // 3. CART ACTIONS
    const addToCart = (product, size) => {
        const exist = cartItems.find((x) => x._id === product._id && x.size === size);
        let updated;

        if (exist) {
            if (exist.qty >= product.stock) {
                toast.error(`Only ${product.stock} units available!`);
                return;
            }
            updated = cartItems.map((x) =>
                x._id === product._id && x.size === size ? { ...x, qty: x.qty + 1 } : x
            );
        } else {
            updated = [...cartItems, { ...product, qty: 1, size }];
        }
        setCartItems(updated);
        syncCart(updated);
        toast.success(`Added ${product.name} to your bag!`);
    };

    const removeFromCart = (id, size) => {
        const updated = cartItems.filter((x) => !(x._id === id && x.size === size));

        setCartItems(updated);
        syncCart(updated);
        toast.success('Item removed');
    };

    const updateQty = (id, size, qty) => {
        if (qty < 1) return;
        const item = cartItems.find((x) => x._id === id && x.size === size);
        if (item && qty > item.stock) {
            toast.error(`Only ${item.stock} units available!`);
            return;
        }
        const updated = cartItems.map((x) => (x._id === id && x.size === size ? { ...x, qty } : x));
        
        setCartItems(updated);
        syncCart(updated);
    };

    const clearCart = () => {
        setCartItems([]);
        syncCart([]);
    };

    // 4. CALCULATIONS (Works perfectly now because the data is flattened!)
    const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);
    const totalPrice = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQty,
            clearCart,
            totalItems,
            totalPrice
        }}>
            {children}
        </CartContext.Provider>
    );
};