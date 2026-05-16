import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [localError, setLocalError] = useState('');

    const { login, register, loading, authError, setAuthError, isLoggedIn, user } = useAuth();
    const navigate = useNavigate();

    // If already logged in, redirect
    useEffect(() => {
        if (isLoggedIn && user) {
            navigate(getDashboardPath(user.role), { replace: true });
        }
    }, [isLoggedIn, user, navigate]);

    const getDashboardPath = (role) => {
        switch (role) {
            case 'admin': return '/admin';
            case 'shopkeeper': return '/shopkeeper';
            case 'employee': return '/employee';
            default: return '/';
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setLocalError('');
        setAuthError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        let result;
        if (isLogin) {
            result = await login(formData.email, formData.password);
        } else {
            result = await register(formData.name, formData.email, formData.password);
        }

        if (result.success) {
            navigate(getDashboardPath(result.role), { replace: true });
        }
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        setLocalError('');
        setAuthError(null);
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    };

    const error = localError || authError;

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary-bg px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-serif text-accent-gold" style={{ fontFamily: "'Playfair Display', serif" }}>
                        MonikaCreation
                    </h1>
                    <p className="text-text-secondary mt-2">Curated collections of luxury and style.</p>
                </div>

                <div className="bg-secondary-bg border border-border-color p-8 shadow-2xl">
                    <h2 className="text-2xl font-serif text-center mb-6">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block mb-1 text-sm font-bold uppercase tracking-wider text-text-secondary">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required={!isLogin}
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your full name"
                                    className="w-full p-3 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold transition-colors"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block mb-1 text-sm font-bold uppercase tracking-wider text-text-secondary">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                className="w-full p-3 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-bold uppercase tracking-wider text-text-secondary">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full p-3 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold transition-colors"
                            />
                        </div>

                        {!isLogin && (
                            <div>
                                <label className="block mb-1 text-sm font-bold uppercase tracking-wider text-text-secondary">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    required={!isLogin}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full p-3 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold transition-colors"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-accent-gold text-primary-bg font-bold py-3 uppercase tracking-wider hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-text-secondary">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                        <button
                            onClick={switchMode}
                            className="text-accent-gold underline hover:text-yellow-400 transition-colors"
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </div>

                    {/* Role hint for demo */}
                    <div className="mt-6 p-3 bg-primary-bg border border-border-color rounded text-xs text-text-secondary">
                        <p className="font-bold mb-1 text-text-primary">Demo Accounts:</p>
                        <p>Admin: admin@monikaCreation.com / admin123456</p>
                        <p className="mt-1 italic">Run <code>node seed.js</code> in backend to create admin.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
