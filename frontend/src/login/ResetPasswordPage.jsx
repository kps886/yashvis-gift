import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.put(`/api/users/resetpassword/${token}`, { password });
            setMessage(data.message || 'Password reset successful!');
            
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired token.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-primary-bg">
            
            {/* Ambient Glowing Orbs */}
            <div 
                className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none"
                style={{ backgroundColor: 'var(--accent-gold)' }}
            />
            <div 
                className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-10 pointer-events-none"
                style={{ backgroundColor: 'var(--accent-gold)' }}
            />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-serif text-accent-gold" style={{ fontFamily: "'Playfair Display', serif" }}>
                        MonikaCreation
                    </h1>
                </div>

                <div className="bg-secondary-bg border border-border-color p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                    {/* Subtle inner glow */}
                    <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)', opacity: 0.5 }} />

                    <h2 className="text-2xl font-serif text-center mb-8 text-text-primary">Create New Password</h2>

                    {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">{error}</div>}
                    {message && <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-lg">{message}</div>}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative">
                            {/* Lock Icon */}
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <input
                                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                placeholder="New Password (Min 6)" minLength="6"
                                className="w-full pl-12 pr-4 py-3 bg-primary-bg border border-border-color rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-gold transition-colors"
                            />
                        </div>
                        
                        <div className="relative">
                            {/* Lock Icon */}
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <input
                                type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm New Password" minLength="6"
                                className="w-full pl-12 pr-4 py-3 bg-primary-bg border border-border-color rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-gold transition-colors"
                            />
                        </div>

                        <button
                            type="submit" disabled={loading || message !== ''}
                            className="w-full bg-accent-gold text-primary-bg font-bold py-3 rounded-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-4 text-base uppercase tracking-wider"
                        >
                            {loading ? 'Saving...' : 'Save New Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;