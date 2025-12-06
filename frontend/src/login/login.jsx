import React, { useState } from 'react';

const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ email: '', password: '', name: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form Data:', formData);
        // TODO: Connect to Backend API for Login/Register
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="bg-secondary-bg p-8 rounded-lg shadow-xl w-full max-w-md border border-border-color">
                <h2 className="text-3xl font-serif text-center mb-6 text-accent-gold">
                    {isLogin ? 'Welcome Back' : 'Join Charming'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4 login-from">
                    {!isLogin && (
                        <div>
                            <label className="block mb-1 font-bold">Name</label>
                            <input 
                                type="text" 
                                className="w-full p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block mb-1 font-bold">Email</label>
                        <input 
                            type="email" 
                            className="w-full p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-bold">Password</label>
                        <input 
                            type="password" 
                            className="w-full p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                    
                    <button type="submit" className="w-full bg-accent-gold text-primary-bg font-bold py-2 rounded hover:bg-yellow-600 transition-colors">
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button 
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm underline hover:text-accent-gold"
                    >
                        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;