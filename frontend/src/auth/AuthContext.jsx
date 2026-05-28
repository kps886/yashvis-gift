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
            return { 
                success: false, 
                error: msg,
                requiresVerification: err.response?.data?.requiresVerification,
                email: err.response?.data?.email
            };
        }
    };

    const register = async (name, email, password) => {
        setLoading(true);
        setAuthError(null);
        try {
            const { data } = await api.post('/api/users/register', { name, email, password });
            
            // Notice we do NOT log them in here anymore. We just return the data.
            setLoading(false);
            return { 
                success: true, 
                requiresVerification: data.requiresVerification, 
                email: data.email 
            };
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed. Please try again.';
            setAuthError(msg);
            setLoading(false);
            return { success: false, error: msg };
        }
    };

    const verifyOtpAndLogin = async (email, otp) => {
        setLoading(true);
        try {
            const { data } = await api.post('/api/users/verify-otp', { email, otp });
            
            localStorage.setItem('monikaCreationUser', JSON.stringify(data));
            setUser(data);
            
            setLoading(false);
            return { success: true, role: data.role };
        } catch (error) {
            setLoading(false);
            return { success: false, error: error.response?.data?.message || 'Verification failed' };
        } 
    };

    const resendOtp = async (email) => {
        try {
            const { data } = await api.post('/api/users/resend-otp', { email });
            return { success: true, message: data.message, attemptsLeft: data.attemptsLeft };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Failed to resend OTP' };
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
            verifyOtpAndLogin,
            resendOtp,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);