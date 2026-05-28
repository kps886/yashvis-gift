import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import toast from 'react-hot-toast';

const OTPVerificationPage = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    
    // Timer and Resend State
    const [timeLeft, setTimeLeft] = useState(60); 
    const [isResending, setIsResending] = useState(false);
    const [attemptsLeft, setAttemptsLeft] = useState(3);
    
    const inputRefs = useRef([]);
    const location = useLocation();
    const navigate = useNavigate();
    const { verifyOtpAndLogin, resendOtp, loading } = useAuth();

    const email = location.state?.email;

    // ── Countdown Timer Logic ──
    useEffect(() => {
        if (timeLeft > 0) {
            const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timerId);
        }
    }, [timeLeft]);

    if (!email) {
        return <Navigate to="/login" replace />;
    }

    // ── Input Handling ──
    const handleChange = (index, e) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        
        if (pastedData) {
            const newOtp = [...otp];
            for (let i = 0; i < pastedData.length; i++) {
                newOtp[i] = pastedData[i];
            }
            setOtp(newOtp);
            const focusIndex = Math.min(pastedData.length, 5);
            inputRefs.current[focusIndex].focus();
        }
    };

    // ── Submission ──
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const otpString = otp.join('');
        if (otpString.length !== 6) return toast.error("Please enter a valid 6-digit code");

        const result = await verifyOtpAndLogin(email, otpString);

        if (result.success) {
            toast.success('Email verified successfully!');
            switch (result.role) {
                case 'admin': navigate('/admin', { replace: true }); break;
                case 'shopkeeper': navigate('/shopkeeper', { replace: true }); break;
                case 'employee': navigate('/employee', { replace: true }); break;
                default: navigate('/', { replace: true });
            }
        } else {
            toast.error(result.error);
        }
    };

    // ── Resend Action ──
    const handleResend = async () => {
        if (timeLeft > 0 || attemptsLeft <= 0) return;
        
        setIsResending(true);
        const result = await resendOtp(email);
        setIsResending(false);

        if (result.success) {
            toast.success('A new verification code has been sent!');
            setTimeLeft(60); // Reset timer back to 60 seconds
            setAttemptsLeft(result.attemptsLeft);
            
            // Clear inputs so they can type the new code
            setOtp(['', '', '', '', '', '']);
            if (inputRefs.current[0]) inputRefs.current[0].focus();
        } else {
            toast.error(result.error);
            if (result.error.includes('limit')) {
                setAttemptsLeft(0); // Lock them out on the frontend if backend says limit reached
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-primary-bg">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ backgroundColor: 'var(--accent-gold)' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[150px] opacity-10 pointer-events-none" style={{ backgroundColor: 'var(--accent-gold)' }} />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-serif text-accent-gold" style={{ fontFamily: "'Playfair Display', serif" }}>MonikaCreation</h1>
                </div>

                <div className="bg-secondary-bg border border-border-color p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)', opacity: 0.5 }} />

                    <h2 className="text-2xl font-serif text-center mb-2 text-text-primary">Verify Your Email</h2>
                    <p className="text-sm text-text-secondary text-center mb-8">
                        We sent a 6-digit code to <span className="text-accent-gold font-bold">{email}</span>.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex justify-between gap-2">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold bg-primary-bg border border-border-color rounded-xl focus:outline-none focus:border-accent-gold transition-colors text-text-primary"
                                />
                            ))}
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-accent-gold text-primary-bg font-bold py-4 rounded-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-4 uppercase tracking-wider text-sm">
                            {loading ? 'Verifying...' : 'Verify & Login'}
                        </button>
                    </form>

                    {/* Resend Section */}
                    <div className="mt-8 text-center text-sm text-text-secondary">
                        <p className="mb-2">Didn't receive the code?</p>
                        
                        {attemptsLeft <= 0 ? (
                            <span className="text-red-400 font-bold">Too many attempts. Please try again later.</span>
                        ) : timeLeft > 0 ? (
                            <span>Resend available in <span className="text-accent-gold font-bold">{timeLeft}s</span></span>
                        ) : (
                            <button 
                                type="button"
                                onClick={handleResend}
                                disabled={isResending}
                                className="font-bold text-accent-gold hover:underline transition-colors uppercase tracking-wider"
                            >
                                {isResending ? 'Sending...' : 'Resend Code'}
                            </button>
                        )}
                        
                        {attemptsLeft > 0 && attemptsLeft < 3 && timeLeft > 0 && (
                            <p className="text-xs mt-2 opacity-70">({attemptsLeft} attempts remaining)</p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OTPVerificationPage;