import React, { useState, useEffect, useMemo, useContext, useRef } from 'react';
import api from './api'
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
import CheckoutPage from './checkout/CheckoutPage';
import OrderSuccessPage from './orders/OrderSuccessPage';
import MyOrdersPage from './orders/MyOrdersPage';
import ProfilePage from './profile/ProfilePage';
import { WishlistProvider, WishlistContext } from './wishlist/WishlistContext';
import WishlistPage from './wishlist/WishlistPage';

// ── Icons ────────────────────────────────────────────────────
const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);
const HeartIcon = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
        viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
        fill={filled ? 'currentColor' : 'none'}
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0
            0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0
            0 0-7.78z"/>
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

// ── Drawer overlay ────────────────────────────────────────────
const Drawer = ({ open, onClose, children }) => (
    <>
        {/* Dark backdrop */}
        <div
            onClick={onClose}
            className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
        />
        {/* Sliding panel */}
        <div
            className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] z-50 flex flex-col
                transition-transform duration-300 ease-in-out
                ${open ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ backgroundColor: 'var(--secondary-bg)', borderRight: '1px solid var(--border-color)' }}
        >
            {children}
        </div>
    </>
);

const Header = ({ theme, toggleTheme, category, setCategory }) => {
    const { totalItems } = useContext(CartContext);
    const { wishlist } = useContext(WishlistContext);
    const { user, logout, isLoggedIn, isAdmin, isShopkeeper, isEmployee } = useAuth();
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    const CATEGORIES = [
        'Kurta Sets', 'Short Kurtas', 'Sherwanis', 'Nehru Jackets', 'Accessories'
    ];

    useEffect(() => {
        const handler = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        document.body.style.overflow = drawerOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [drawerOpen]);

    const handleLogout = () => {
        logout();
        setDrawerOpen(false);
        setUserMenuOpen(false);
        navigate('/login');
    };

    const getDashboardPath = () => {
        if (isAdmin) return '/admin';
        if (isShopkeeper) return '/shopkeeper';
        if (isEmployee) return '/employee';
        return '/';
    };

    const handleCategoryClick = (cat) => {
        setCategory(cat);
        setDrawerOpen(false);
        navigate('/');
    };

    return (
        <>
            <header
                className="sticky top-0 z-30"
                style={{
                    backgroundColor: 'var(--secondary-bg)',
                    borderBottom: '1px solid var(--border-color)',
                }}
            >
                <div className="px-4 h-16 sm:h-20 flex items-center justify-between relative">
                    
                    {/* ─── MOBILE/TABLET: Left (Hamburger) ─── */}
                    <div className="flex items-center lg:hidden flex-1 justify-start mobile-logo">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="p-2 -ml-2 hover:text-accent-gold transition-colors"
                            aria-label="Open menu"
                        >
                            <MenuIcon />
                        </button>
                    </div>

                    {/* ─── MOBILE/TABLET: Center (Logo) ─── */}
                    <div className="lg:hidden flex justify-center tab-logo">
                        <Link to="/">
                            <img 
                                src="/suman-logo.png" 
                                alt="Monika Creation Logo"
                                className="h-full sm:h-10 w-auto object-contain" 
                            />
                        </Link>
                    </div>

                    {/* ─── DESKTOP: Left (Logo) ─── */}
                    <div className="hidden lg:flex flex-1 justify-start items-center pc-logo">
                        <Link to="/" className="flex-shrink-0">
                            <img 
                                src="/suman-logo.png" 
                                alt="Monika Creation Logo"
                                className="h-100 w-auto object-contain" 
                            />
                        </Link>
                    </div>

                    {/* ─── DESKTOP: Center (Navigation) ─── */}
                    <nav className="hidden lg:flex justify-center items-center gap-4 xl:gap-8">
                        <button
                            onClick={() => handleCategoryClick('')}
                            className={`text-xs xl:text-sm font-semibold tracking-wider uppercase transition-colors ${category === ''
                                ? 'text-accent-gold'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            All
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryClick(cat)}
                                className={`text-xs xl:text-sm font-semibold tracking-wider uppercase transition-colors whitespace-nowrap ${category === cat
                                    ? 'text-accent-gold underline underline-offset-8 decoration-2'
                                    : 'text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </nav>

                    {/* ─── DESKTOP & MOBILE: Right (Icons) ─── */}
                    <div className="flex items-center gap-1 sm:gap-4 justify-end flex-1">
                        
                        {/* THEME TOGGLE: Hidden on mobile/tablet */}
                        <button
                            onClick={toggleTheme}
                            className="hidden lg:block p-1.5 sm:p-2 hover:text-accent-gold transition-colors"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                        </button>

                        {(!isLoggedIn || user?.role === 'user') && (
                            <>
                                {/* WISHLIST: Hidden on mobile/tablet (lg:block added) */}
                                <Link to="/wishlist" className="hidden lg:block relative p-1.5 sm:p-2 hover:text-accent-gold transition-colors">
                                    <HeartIcon filled={false} />
                                    {wishlist.length > 0 && (
                                        <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                                            {wishlist.length > 9 ? '9+' : wishlist.length}
                                        </span>
                                    )}
                                </Link>
                                
                                <Link to="/cart" className="relative p-1.5 sm:p-2 hover:text-accent-gold transition-colors">
                                    <CartIcon />
                                    {totalItems > 0 && (
                                        <span className="absolute top-0 right-0 bg-accent-gold text-primary-bg text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                                            {totalItems > 9 ? '9+' : totalItems}
                                        </span>
                                    )}
                                </Link>
                            </>
                        )}

                        {isLoggedIn ? (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setUserMenuOpen(o => !o)}
                                    className="flex items-center gap-2 p-1.5 sm:p-2 hover:text-accent-gold transition-colors"
                                >
                                    <UserIcon />
                                    <span className="hidden lg:block text-sm font-semibold max-w-[90px] truncate">
                                        {user.name}
                                    </span>
                                </button>

                                {/* Dropdown */}
                                {userMenuOpen && (
                                    <div
                                        className="absolute right-0 top-full mt-3 w-52 shadow-xl z-50 rounded"
                                        style={{ backgroundColor: 'var(--secondary-bg)', border: '1px solid var(--border-color)' }}
                                    >
                                        <div className="p-4 border-b border-border-color">
                                            <p className="font-semibold text-sm truncate">{user.name}</p>
                                            <p className="text-xs text-text-secondary truncate">{user.email}</p>
                                        </div>
                                        {(isAdmin || isShopkeeper || isEmployee) && (
                                            <Link to={getDashboardPath()} onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 text-sm hover:bg-primary-bg hover:text-accent-gold transition-colors">
                                                Dashboard
                                            </Link>
                                        )}
                                        <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 text-sm hover:bg-primary-bg hover:text-accent-gold transition-colors border-t border-border-color">
                                            My Profile
                                        </Link>
                                        {user?.role === 'user' && (
                                            <Link to="/my-orders" onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 text-sm hover:bg-primary-bg hover:text-accent-gold transition-colors">
                                                My Orders
                                            </Link>
                                        )}
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-primary-bg transition-colors border-t border-border-color">
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="flex items-center gap-2 p-1.5 sm:p-2 hover:text-accent-gold transition-colors">
                                <UserIcon />
                                <span className="hidden sm:block text-sm font-semibold">Sign In</span>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile sliding drawer */}
            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                {/* Drawer header */}
                <div className="flex items-center justify-between px-5 h-16 sm:h-20 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <Link to="/" onClick={() => setDrawerOpen(false)}>
                        <img 
                            src="/suman-logo.png" 
                            alt="Monika Creation Logo"
                            className="h-8 sm:h-10 w-auto object-contain"
                        />
                    </Link>
                    <button onClick={() => setDrawerOpen(false)} className="p-2 hover:text-accent-gold transition-colors text-xl leading-none">✕</button>
                </div>

                {isLoggedIn && (
                    <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--primary-bg)' }}>
                        <p className="font-semibold text-sm truncate">{user.name}</p>
                        <p className="text-xs text-text-secondary truncate">{user.email}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold border rounded uppercase bg-accent-gold/10 text-accent-gold border-accent-gold/40">
                            {user.role}
                        </span>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    <div className="px-5 py-6">
                        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-4">Shop Categories</p>
                        <div className="space-y-1">
                            {['', ...CATEGORIES].map(cat => (
                                <button
                                    key={cat || 'all'}
                                    onClick={() => handleCategoryClick(cat)}
                                    className={`w-full text-left px-4 py-3 rounded text-sm font-semibold uppercase tracking-wider transition-colors ${category === cat ? 'bg-accent-gold text-primary-bg' : 'hover:bg-primary-bg text-text-primary'}`}
                                >
                                    {cat || 'All Products'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-3">Account & Settings</p>
                        <div className="space-y-1">
                            {isLoggedIn && (
                                <>
                                    {(isAdmin || isShopkeeper || isEmployee) && (
                                        <Link to={getDashboardPath()} onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold hover:bg-primary-bg transition-colors">
                                            Dashboard
                                        </Link>
                                    )}
                                    {user?.role === 'user' && (
                                        <>
                                            <Link to="/cart" onClick={() => setDrawerOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded text-sm font-semibold hover:bg-primary-bg transition-colors">
                                                <span>My Bag</span>
                                                {totalItems > 0 && <span className="bg-accent-gold text-primary-bg text-xs font-bold rounded-full px-2 py-0.5">{totalItems}</span>}
                                            </Link>
                                            <Link to="/my-orders" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold hover:bg-primary-bg transition-colors">
                                                My Orders
                                            </Link>
                                            <Link to="/wishlist" onClick={() => setDrawerOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded text-sm font-semibold hover:bg-primary-bg transition-colors">
                                                <span>Wishlist</span>
                                                {wishlist.length > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{wishlist.length}</span>}
                                            </Link>
                                            <Link to="/profile" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-semibold hover:bg-primary-bg transition-colors">
                                                My Profile
                                            </Link>
                                        </>
                                    )}
                                </>
                            )}

                            {/* Wishlist Link for logged-out users, so they don't lose access when it's hidden from mobile top nav */}
                            {!isLoggedIn && (
                                <Link to="/wishlist" onClick={() => setDrawerOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded text-sm font-semibold hover:bg-primary-bg transition-colors">
                                    <span>Wishlist</span>
                                    {wishlist.length > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{wishlist.length}</span>}
                                </Link>
                            )}

                            {/* Theme Toggle */}
                            <button onClick={() => { toggleTheme(); }} className="flex items-center gap-3 w-full px-3 py-2.5 rounded text-sm font-semibold hover:bg-primary-bg transition-colors text-text-primary mt-2">
                                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sticky Footer exclusively holding the Authentication action */}
                <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--secondary-bg)' }}>
                    {isLoggedIn ? (
                        <button onClick={handleLogout} className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded text-sm font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20">
                            Sign Out
                        </button>
                    ) : (
                        <Link to="/login" onClick={() => setDrawerOpen(false)} className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded text-sm font-bold bg-accent-gold text-primary-bg hover:bg-yellow-500 transition-colors uppercase tracking-wider">
                            Sign In / Register
                        </Link>
                    )}
                </div>
            </Drawer>
        </>
    );
};

// ── Product Card ──────────────────────────────────────────────
const ProductCard = ({ product }) => {
    const { isWishlisted, toggle } = useContext(WishlistContext);
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const [heartAnim, setHeartAnim] = useState(false);

    const wishlisted = isWishlisted(product._id);

    const handleWishlist = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoggedIn) { navigate('/login'); return; }
        setHeartAnim(true);
        await toggle(product._id);
        setTimeout(() => setHeartAnim(false), 400);
    };

    const avgRating = product.avgRating || 0;

    return (
        <div className="bg-secondary-bg border border-border-color group relative
            overflow-hidden text-center transition-shadow duration-300 hover:shadow-xl">

            {product.tags?.includes('New Arrival') && (
                <div className="absolute top-3 left-3 bg-accent-gold text-primary-bg
                    px-2 py-0.5 text-xs font-bold z-10 uppercase">
                    New
                </div>
            )}
            {product.stock === 0 && (
                <div className="absolute top-3 right-10 bg-red-500 text-white
                    px-2 py-0.5 text-xs font-bold z-10 uppercase">
                    Out
                </div>
            )}

            {/* Wishlist heart */}
            <button
                onClick={handleWishlist}
                className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex
                    items-center justify-center transition-all duration-200 shadow-md
                    ${wishlisted
                        ? 'bg-red-500 text-white'
                        : 'bg-white/80 text-gray-600 hover:bg-red-50 hover:text-red-500'}
                    ${heartAnim ? 'scale-125' : 'scale-100'}`}
                title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
                <HeartIcon filled={wishlisted} />
            </button>

            <div className="relative overflow-hidden">
                <Link to={`/product/${product._id}`}>
                    <img
                        src={product.images?.[0] ||
                            'https://placehold.co/400x400/222222/D4AF37?text=MonikaCreation'}
                        alt={product.name}
                        className="w-full aspect-square object-cover transition-transform
                            duration-500 group-hover:scale-105"
                    />
                </Link>
            </div>

            <div className="p-3">
                <Link to={`/product/${product._id}`}>
                    <h3 className="text-sm font-serif hover:text-accent-gold transition-colors
                        line-clamp-2 mb-1"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        {product.name}
                    </h3>
                </Link>

                {/* Star rating */}
                {product.reviewCount > 0 && (
                    <div className="flex items-center justify-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map(n => (
                            <svg key={n} width="10" height="10" viewBox="0 0 24 24"
                                fill={n <= Math.round(avgRating) ? '#D4AF37' : 'none'}
                                stroke="#D4AF37" strokeWidth="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14
                                    18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27
                                    8.91 8.26 12 2"/>
                            </svg>
                        ))}
                        <span className="text-xs text-text-secondary">
                            ({product.reviewCount})
                        </span>
                    </div>
                )}

                <p className="font-bold text-accent-gold text-sm">
                    ₹{product.price.toLocaleString('en-IN')}
                </p>
            </div>
        </div>
    );
};

// ── Homepage ──────────────────────────────────────────────────
const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low → High' },
    { value: 'price_desc', label: 'Price: High → Low' },
    { value: 'name_asc', label: 'Name: A → Z' },
];

const HomePage = ({ products, loading, error, category, search, setSearch,
    sort, setSort, page, setPage, pagination }) => (
    <div>
        {/* Hero */}
        {!category && !search && page === 1 && (
            <section className="h-[55vh] bg-gradient-to-br from-gray-900 via-gray-800
                to-gray-900 flex items-center justify-center text-center px-4">
                <div>
                    <h1 className="text-5xl md:text-7xl font-serif text-white drop-shadow-lg"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Discover Your Charm
                    </h1>
                    <p className="text-xl text-gray-300 mt-4">
                        Curated collections of luxury and style.
                    </p>
                    <Link to="/" className="mt-8 inline-block bg-accent-gold text-primary-bg
                        px-8 py-3 font-bold uppercase tracking-wider hover:bg-yellow-500
                        transition-colors">
                        Shop New Arrivals
                    </Link>
                </div>
            </section>
        )}

        <section className="container mx-auto py-10 px-4">
            {/* Search bar */}
            <div className="relative max-w-xl mx-auto mb-8">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4
                    text-text-secondary pointer-events-none"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <path strokeLinecap="round" strokeLinejoin="round"
                        strokeWidth={2} d="M21 21l-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-11 pr-10 py-3 bg-secondary-bg border border-border-color
                        rounded-full focus:outline-none focus:border-accent-gold transition-colors
                        text-sm"
                />
                {search && (
                    <button onClick={() => setSearch('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary
                            hover:text-text-primary text-lg leading-none">
                        ✕
                    </button>
                )}
            </div>

            {/* Toolbar: title + count + sort */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-2xl font-serif"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        {search ? `Results for "${search}"` : category || 'All Products'}
                    </h2>
                    <p className="text-sm text-text-secondary mt-0.5">
                        {pagination.total} product{pagination.total !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {(search || category) && (
                        <button onClick={() => setSearch('')}
                            className="text-xs text-text-secondary hover:text-accent-gold
                                underline transition-colors">
                            Clear filters
                        </button>
                    )}
                    <select
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                        className="p-2 pr-8 bg-secondary-bg border border-border-color rounded
                            text-sm focus:outline-none focus:border-accent-gold transition-colors
                            appearance-none cursor-pointer"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 8px center'
                        }}
                    >
                        {SORT_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="text-center py-16">
                    <div className="inline-block w-8 h-8 border-2 border-accent-gold
                        border-t-transparent rounded-full animate-spin mb-4"/>
                    <p className="text-text-secondary">Loading products...</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="text-center py-16">
                    <p className="text-red-400 mb-2">{error}</p>
                    <p className="text-text-secondary text-sm">
                        Make sure the backend server is running.
                    </p>
                </div>
            )}

            {/* Empty */}
            {!loading && !error && products.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-text-secondary text-lg mb-3">No products found.</p>
                    <button onClick={() => setSearch('')}
                        className="text-accent-gold text-sm hover:underline">
                        Clear search
                    </button>
                </div>
            )}

            {/* Grid */}
            {!loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {products.map(product => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12 flex-wrap">
                    <button
                        onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0 }); }}
                        disabled={page === 1}
                        className="px-4 py-2 border border-border-color text-sm font-semibold
                            hover:border-accent-gold hover:text-accent-gold transition-colors
                            disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        ← Prev
                    </button>

                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                        .filter(n => n === 1 || n === pagination.pages ||
                            Math.abs(n - page) <= 1)
                        .reduce((acc, n, i, arr) => {
                            if (i > 0 && n - arr[i - 1] > 1) acc.push('...');
                            acc.push(n);
                            return acc;
                        }, [])
                        .map((n, i) => n === '...' ? (
                            <span key={`dot${i}`}
                                className="px-2 text-text-secondary">…</span>
                        ) : (
                            <button key={n}
                                onClick={() => { setPage(n); window.scrollTo({ top: 0 }); }}
                                className={`w-9 h-9 text-sm font-bold border transition-colors ${page === n
                                    ? 'bg-accent-gold text-primary-bg border-accent-gold'
                                    : 'border-border-color hover:border-accent-gold hover:text-accent-gold'
                                    }`}>
                                {n}
                            </button>
                        ))
                    }

                    <button
                        onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0 }); }}
                        disabled={page === pagination.pages}
                        className="px-4 py-2 border border-border-color text-sm font-semibold
                            hover:border-accent-gold hover:text-accent-gold transition-colors
                            disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Next →
                    </button>
                </div>
            )}
        </section>
    </div>
);

// ── Root App (with providers) ─────────────────────────────────
export default function App() {
    const [theme, setTheme] = useState('dark');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [category, setCategory] = useState('');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('newest');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ pages: 1, total: 0 });

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
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page,
                    limit: 12,
                    sort,
                    ...(category && { category }),
                    ...(search && { search }),
                });
                const { data } = await api.get(`/api/products?${params}`);
                setProducts(data.products);
                setPagination({ pages: data.pages, total: data.total });
            } catch {
                setError('Failed to connect to backend.');
            }
            setLoading(false);
        };
        fetchProducts();
    }, [page, sort, category, search]);

    useEffect(() => { setPage(1); }, [category, search, sort]);

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
                <WishlistProvider>
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
                            search={search}
                            setSearch={setSearch}
                            sort={sort}
                            setSort={setSort}
                            page={page}
                            setPage={setPage}
                            pagination={pagination}
                        />
                    </Router>
                </WishlistProvider>
            </CartProvider>
        </AuthProvider>
    );
}

// Separate so we can use useNavigate inside Router context
function AppRoutes({ theme, toggleTheme, products, loading, error, category, setCategory, search, setSearch, sort, setSort, page, setPage, pagination }) {

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
                                    <HomePage
                                        products={products}
                                        loading={loading}
                                        error={error}
                                        category={category}
                                        search={search}
                                        setSearch={setSearch}
                                        sort={sort}
                                        setSort={setSort}
                                        page={page}
                                        setPage={setPage}
                                        pagination={pagination}
                                    />
                                } />
                                <Route path="/cart" element={<CartPage />} />
                                <Route path="/wishlist" element={
                                    <ProtectedRoute allowedRoles={['user', 'admin', 'shopkeeper', 'employee']}>
                                        <WishlistPage />
                                    </ProtectedRoute>
                                } />
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

                                <Route path="/checkout" element={
                                    <ProtectedRoute allowedRoles={['user', 'admin', 'shopkeeper', 'employee']}>
                                        <CheckoutPage />
                                    </ProtectedRoute>
                                } />

                                <Route path="/order-success/:id" element={
                                    <ProtectedRoute allowedRoles={['user', 'admin', 'shopkeeper', 'employee']}>
                                        <OrderSuccessPage />
                                    </ProtectedRoute>
                                } />

                                <Route path="/my-orders" element={
                                    <ProtectedRoute allowedRoles={['user', 'admin', 'shopkeeper', 'employee']}>
                                        <MyOrdersPage />
                                    </ProtectedRoute>
                                } />

                                <Route path="/profile" element={
                                    <ProtectedRoute allowedRoles={['user', 'admin', 'shopkeeper', 'employee']}>
                                        <ProfilePage />
                                    </ProtectedRoute>
                                } />

                                {/* Catch-all */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </main>
                        <footer style={{ backgroundColor: 'var(--secondary-bg)', borderTop: '1px solid var(--border-color)' }} className="text-center p-8 mt-auto">
                            <p className="text-text-secondary text-sm">&copy; 2025 MonikaCreation. All Rights Reserved.</p>
                        </footer>
                    </>
                } />
            </Routes>
        </div>
    );
}

