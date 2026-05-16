import React, { createContext, useState, useContext } from 'react';
import api from './../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('monikaCreationUser');
        return stored ? JSON.parse(stored) : null;
    });
    const [loading, setLoading] = useState(false);
    const [authError, setAuthError] = useState(null);

    // REMOVED: The useEffect that was setting api.defaults.headers

    const login = async (email, password) => {
        setLoading(true);
        setAuthError(null);
        try {
            const { data } = await api.post('/api/users/login', { email, password });
            
            // Set localStorage BEFORE setting React state to guarantee
            // the api.js interceptor can find it immediately
            localStorage.setItem('monikaCreationUser', JSON.stringify(data));
            setUser(data);
            
            setLoading(false);
            return { success: true, role: data.role };
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Please try again.';
            setAuthError(msg);
            setLoading(false);
            return { success: false, error: msg };
        }
    };

    const register = async (name, email, password) => {
        setLoading(true);
        setAuthError(null);
        try {
            const { data } = await api.post('/api/users/register', { name, email, password });
            
            localStorage.setItem('monikaCreationUser', JSON.stringify(data));
            setUser(data);
            
            setLoading(false);
            return { success: true, role: data.role };
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed. Please try again.';
            setAuthError(msg);
            setLoading(false);
            return { success: false, error: msg };
        }
    };

    const logout = () => {
        localStorage.removeItem('monikaCreationUser');
        localStorage.removeItem('cart');
        setUser(null);
    };

    // Role helpers
    const isAdmin = user?.role === 'admin';
    const isShopkeeper = user?.role === 'shopkeeper' || isAdmin;
    const isEmployee = user?.role === 'employee' || isShopkeeper;
    const isLoggedIn = !!user;

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            authError,
            setAuthError,
            login,
            register,
            logout,
            isAdmin,
            isShopkeeper,
            isEmployee,
            isLoggedIn,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);