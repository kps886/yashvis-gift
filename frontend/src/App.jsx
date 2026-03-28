import React, { useState, useEffect, useMemo, useContext } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { CartProvider, CartContext } from './cart/cartProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import LoginPage from './login/LoginPage';
import CartPage from './cart/cart';
import ProductDetailsPage from './products/product';
import AdminDashboard from './dashboard/AdminDashboard';
import ShopkeeperDashboard from './dashboard/ShopkeeperDashboard';
import EmployeeDashboard from './dashboard/EmployeeDashboard';

// ── Icons ────────────────────────────────────────────────────
const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);
const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);
const CartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

// ── Role badge colours ────────────────────────────────────────
const ROLE_COLORS = {
    admin: 'bg-red-500/20 text-red-400 border-red-500/40',
    shopkeeper: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    employee: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    user: 'bg-green-500/20 text-green-400 border-green-500/40',
};

// ── Header ────────────────────────────────────────────────────
const Header = ({ theme, toggleTheme, category, setCategory }) => {
    const { totalItems } = useContext(CartContext);
    const { user, logout, isLoggedIn, isAdmin, isShopkeeper, isEmployee } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileNav, setMobileNav] = useState(false);

    const CATEGORIES = ['Electronics', 'Fragrances', 'Bags & Purses', 'Toys & Games', 'Home & Kitchen'];

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        navigate('/login');
    };

    const getDashboardPath = () => {
        if (isAdmin) return '/admin';
        if (isShopkeeper) return '/shopkeeper';
        if (isEmployee) return '/employee';
        return '/';
    };

    return (
        <header className="bg-secondary-bg text-text-primary border-b border-border-color sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                {/* Logo */}
                <Link to="/" className="text-3xl font-serif text-accent-gold flex-shrink-0" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Charming
                </Link>

                {/* Desktop Category Nav */}
                <nav className="hidden md:flex items-center gap-1 flex-wrap">
                    <button
                        onClick={() => setCategory('')}
                        className={`px-3 py-1.5 text-sm font-semibold transition-colors ${category === '' ? 'text-accent-gold' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        All
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-3 py-1.5 text-sm font-semibold transition-colors whitespace-nowrap ${category === cat ? 'text-accent-gold border-b border-accent-gold' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </nav>

                {/* Right controls */}
                <div className="flex items-center gap-3">
                    <button onClick={toggleTheme} className="p-1 hover:text-accent-gold transition-colors">
                        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    </button>

                    {/* Cart (only for regular users) */}
                    {(!isLoggedIn || user?.role === 'user') && (
                        <Link to="/cart" className="relative hover:text-accent-gold transition-colors p-1">
                            <CartIcon />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-accent-gold text-primary-bg text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                                    {totalItems > 9 ? '9+' : totalItems}
                                </span>
                            )}
                        </Link>
                    )}

                    {/* User Menu */}
                    {isLoggedIn ? (
                        <div className="relative">
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center gap-2 hover:text-accent-gold transition-colors p-1"
                            >
                                <UserIcon />
                                <span className="hidden sm:block text-sm font-semibold max-w-[100px] truncate">{user.name}</span>
                                <span className={`hidden sm:block px-2 py-0.5 text-xs font-bold border rounded uppercase ${ROLE_COLORS[user.role]}`}>
                                    {user.role}
                                </span>
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-52 bg-secondary-bg border border-border-color shadow-xl z-50">
                                    <div className="p-3 border-b border-border-color">
                                        <p className="font-semibold text-sm truncate">{user.name}</p>
                                        <p className="text-xs text-text-secondary truncate">{user.email}</p>
                                    </div>
                                    {(isAdmin || isShopkeeper || isEmployee) && (
                                        <Link
                                            to={getDashboardPath()}
                                            onClick={() => setMenuOpen(false)}
                                            className="block px-4 py-2.5 text-sm hover:bg-primary-bg hover:text-accent-gold transition-colors"
                                        >
                                            Dashboard
                                        </Link>
                                    )}
                                    <Link
                                        to="/"
                                        onClick={() => setMenuOpen(false)}
                                        className="block px-4 py-2.5 text-sm hover:bg-primary-bg hover:text-accent-gold transition-colors"
                                    >
                                        Shop
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-primary-bg transition-colors border-t border-border-color"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="flex items-center gap-2 hover:text-accent-gold transition-colors p-1"
                        >
                            <UserIcon />
                            <span className="hidden sm:block text-sm font-semibold">Sign In</span>
                        </Link>
                    )}

                    {/* Mobile nav toggle */}
                    <button onClick={() => setMobileNav(!mobileNav)} className="md:hidden p-1 hover:text-accent-gold transition-colors">
                        <MenuIcon />
                    </button>
                </div>
            </div>

            {/* Mobile Category Nav */}
            {mobileNav && (
                <div className="md:hidden border-t border-border-color bg-secondary-bg">
                    <div className="container mx-auto px-4 py-2 flex flex-wrap gap-1">
                        <button
                            onClick={() => { setCategory(''); setMobileNav(false); }}
                            className={`px-3 py-1.5 text-sm font-semibold transition-colors ${category === '' ? 'text-accent-gold' : 'text-text-secondary'}`}
                        >
                            All
                        </button>
                        {['Electronics', 'Fragrances', 'Bags & Purses', 'Toys & Games', 'Home & Kitchen'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => { setCategory(cat); setMobileNav(false); }}
                                className={`px-3 py-1.5 text-sm font-semibold transition-colors ${category === cat ? 'text-accent-gold' : 'text-text-secondary'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
};

// ── Product Card ──────────────────────────────────────────────
const ProductCard = ({ product }) => (
    <div className="bg-secondary-bg border border-border-color group relative overflow-hidden text-center transition-shadow duration-300 hover:shadow-xl">
        {product.tags?.includes('New Arrival') && (
            <div className="absolute top-3 left-3 bg-accent-gold text-primary-bg px-2 py-1 text-xs font-bold z-10">NEW</div>
        )}
        {product.stock === 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 text-xs font-bold z-10">OUT OF STOCK</div>
        )}
        <div className="relative overflow-hidden">
            <Link to={`/product/${product._id}`}>
                <img
                    src={product.images[0] || 'https://placehold.co/400x400/222222/D4AF37?text=Charming'}
                    alt={product.name}
                    className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
                />
            </Link>
        </div>
        <div className="p-4">
            <Link to={`/product/${product._id}`}>
                <h3 className="text-base font-serif hover:text-accent-gold transition-colors line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {product.name}
                </h3>
            </Link>
            <p className="font-bold text-accent-gold mt-1">₹{product.price.toLocaleString('en-IN')}</p>
        </div>
    </div>
);

// ── Homepage ──────────────────────────────────────────────────
const HomePage = ({ products, loading, error, category }) => {
    const filtered = category ? products.filter(p => p.category === category) : products;

    return (
        <div>
            {/* Hero — only shown when no category selected */}
            {!category && (
                <section className="h-[55vh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center text-center px-4">
                    <div>
                        <h1 className="text-5xl md:text-7xl font-serif text-white drop-shadow-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                            Discover Your Charm
                        </h1>
                        <p className="text-xl text-gray-300 mt-4">Curated collections of luxury and style.</p>
                        <Link
                            to="/"
                            className="mt-8 inline-block bg-accent-gold text-primary-bg px-8 py-3 font-bold uppercase tracking-wider hover:bg-yellow-500 transition-colors"
                        >
                            Shop New Arrivals
                        </Link>
                    </div>
                </section>
            )}

            <section className="container mx-auto py-12 px-4">
                <h2 className="text-3xl text-center font-serif mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {category || 'All Products'}
                </h2>
                {category && (
                    <p className="text-center text-text-secondary mb-8">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
                )}

                {loading && (
                    <div className="text-center py-16">
                        <div className="inline-block w-8 h-8 border-2 border-accent-gold border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-text-secondary">Loading products...</p>
                    </div>
                )}
                {error && (
                    <div className="text-center py-16">
                        <p className="text-red-400 mb-2">{error}</p>
                        <p className="text-text-secondary text-sm">Make sure the backend server is running.</p>
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <p className="text-center py-16 text-text-secondary">No products found in this category.</p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filtered.map(product => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            </section>
        </div>
    );
};

// ── Root App (with providers) ─────────────────────────────────
export default function App() {
    const [theme, setTheme] = useState('dark');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState('');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await axios.get('/api/products');
                setProducts(data);
            } catch (err) {
                setError('Failed to connect to backend.');
            }
            setLoading(false);
        };
        fetchProducts();
    }, []);

    const themeStyles = useMemo(() => `
        :root[data-theme='dark'] {
            --primary-bg: #1a1a1a;
            --secondary-bg: #2a2a2a;
            --text-primary: #F5F5F5;
            --text-secondary: #999999;
            --accent-gold: #D4AF37;
            --border-color: #3a3a3a;
        }
        :root[data-theme='light'] {
            --primary-bg: #F5F5F5;
            --secondary-bg: #FFFFFF;
            --text-primary: #1a1a1a;
            --text-secondary: #666666;
            --accent-gold: #B8960C;
            --border-color: #e0e0e0;
        }
        * { box-sizing: border-box; }
        body {
            background-color: var(--primary-bg);
            color: var(--text-primary);
            font-family: 'Montserrat', sans-serif;
            transition: background-color 0.3s, color 0.3s;
            margin: 0;
        }
        .bg-primary-bg { background-color: var(--primary-bg); }
        .bg-secondary-bg { background-color: var(--secondary-bg); }
        .text-text-primary { color: var(--text-primary); }
        .text-text-secondary { color: var(--text-secondary); }
        .text-accent-gold { color: var(--accent-gold); }
        .bg-accent-gold { background-color: var(--accent-gold); }
        .border-border-color { border-color: var(--border-color); }
        .border-accent-gold { border-color: var(--accent-gold); }
        .hover\\:text-accent-gold:hover { color: var(--accent-gold); }
        .hover\\:bg-primary-bg:hover { background-color: var(--primary-bg); }
        .focus\\:border-accent-gold:focus { border-color: var(--accent-gold); }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    `, []);

    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Playfair+Display:wght@700&display=swap');
                        ${themeStyles}
                    `}</style>

                    <AppRoutes
                        theme={theme}
                        toggleTheme={toggleTheme}
                        products={products}
                        loading={loading}
                        error={error}
                        category={category}
                        setCategory={setCategory}
                    />
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

// Separate so we can use useNavigate inside Router context
function AppRoutes({ theme, toggleTheme, products, loading, error, category, setCategory }) {
    const { isLoggedIn } = useAuth();

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--text-primary)' }}>
            <Routes>
                {/* Login page — full screen, no header */}
                <Route path="/login" element={<LoginPage />} />

                {/* All other routes — with header */}
                <Route path="/*" element={
                    <>
                        <Header theme={theme} toggleTheme={toggleTheme} category={category} setCategory={setCategory} />
                        <main className="flex-grow">
                            <Routes>
                                <Route path="/" element={
                                    <HomePage products={products} loading={loading} error={error} category={category} />
                                } />
                                <Route path="/cart" element={<CartPage />} />
                                <Route path="/product/:id" element={<ProductDetailsPage />} />

                                {/* Admin only */}
                                <Route path="/admin" element={
                                    <ProtectedRoute allowedRoles={['admin']}>
                                        <AdminDashboard />
                                    </ProtectedRoute>
                                } />

                                {/* Shopkeeper (admin can also access) */}
                                <Route path="/shopkeeper" element={
                                    <ProtectedRoute allowedRoles={['admin', 'shopkeeper']}>
                                        <ShopkeeperDashboard />
                                    </ProtectedRoute>
                                } />

                                {/* Employee (admin + shopkeeper can also access) */}
                                <Route path="/employee" element={
                                    <ProtectedRoute allowedRoles={['admin', 'shopkeeper', 'employee']}>
                                        <EmployeeDashboard />
                                    </ProtectedRoute>
                                } />

                                {/* Catch-all */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </main>
                        <footer style={{ backgroundColor: 'var(--secondary-bg)', borderTop: '1px solid var(--border-color)' }} className="text-center p-8 mt-auto">
                            <p className="text-text-secondary text-sm">&copy; 2025 Charming. All Rights Reserved.</p>
                        </footer>
                    </>
                } />
            </Routes>
        </div>
    );
}

