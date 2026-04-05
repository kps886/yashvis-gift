import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';
import { AuthContext } from '../auth/AuthContext';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [wishlist, setWishlist] = useState([]);   // array of product objects
    const [loading, setLoading] = useState(false);

    // Load wishlist when user logs in
    const userId = user?._id;

    useEffect(() => {
        // 2. Only use the extracted userId inside the effect
        if (userId) {

            setLoading(true);
            api.get('/api/users/wishlist')
                .then(r => setWishlist(r.data))
                .catch((err) => console.error("Wishlist fetch failed:", err))
                .finally(() => setLoading(false));
        } else {
            setWishlist([]);
        }

        // 3. The linter is completely happy because userId is the ONLY external variable used!
    }, [userId]);

    const toggle = async (productId) => {
        if (!user) return false;   // caller should redirect to login
        try {
            const { data } = await api.post(`/api/users/wishlist/${productId}`);
            // Optimistic: refetch full list to get populated product data
            const list = await api.get('/api/users/wishlist');
            setWishlist(list.data);
            return data.wishlisted;
        } catch {
            return null;
        }
    };

    const isWishlisted = (productId) =>
        wishlist.some(p => (p._id || p) === productId || p._id?.toString() === productId);

    return (
        <WishlistContext.Provider value={{ wishlist, loading, toggle, isWishlisted }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => useContext(WishlistContext);