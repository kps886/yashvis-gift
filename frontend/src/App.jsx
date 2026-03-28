import React, { useState, useEffect, useMemo, useContext } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './login/login';
import CartPage from './cart/cart';
import ProductDetailsPage from './products/product';
import { CartProvider, CartContext } from './cart/cartProvider';

const SunIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>);
const MoonIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>);
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const CartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>);

export const Button = ({ children, variant = 'primary', ...props }) => {
    const baseStyle = "px-6 py-2 font-bold uppercase tracking-wider transition-transform duration-200 transform hover:scale-105";
    const styles = {
        primary: "bg-accent-gold text-primary-bg",
        secondary: "bg-white/80 text-primary-bg",
        danger: "bg-red-500 text-white"
    };
    return <button className={`${baseStyle} ${styles[variant]}`} {...props}>{children}</button>;
};

const Header = ({ theme, toggleTheme }) => {
    const { cartItems } = useContext(CartContext);
    return (
        <header id="navbar" className="bg-secondary-bg text-text-primary border-border-color">
            <div className="p-4 flex justify-start items-center">
                <Link to="/" className="text-4xl font-serif text-accent-gold cursor-pointer" style={{ fontFamily: "'Playfair Display', serif" }}>Charming</Link>
                <nav className="hidden md:flex justify-around space-x-6 font-bold">
                    {/* Placeholder links - these would be filtered views in a real app */}
                    <Link to="/" className="hover:text-accent-gold transition-colors">Electronics</Link>
                    <Link to="/" className="hover:text-accent-gold transition-colors">Bags & Purses</Link>
                    <Link to="/" className="hover:text-accent-gold transition-colors">Fragrances</Link>
                    <Link to="/" className="hover:text-accent-gold transition-colors">Toys</Link>
                    <Link to="/" className="hover:text-accent-gold transition-colors">Home</Link>
                </nav>
                <div className="flex items-center space-x-4">
                    <button onClick={toggleTheme} className="focus:outline-none">
                        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    </button>
                    <Link to="/login" className="hover:text-accent-gold transition-colors"><UserIcon /></Link>
                    <Link to="/cart" className="hover:text-accent-gold transition-colors relative">
                        <CartIcon />
                        {/* CHANGE: Show badge if items exist */}
                        {cartItems.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-accent-gold text-primary-bg text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {cartItems.length}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </header>
    )
};

// --- Product Card Component (Now with Link!) ---
const ProductCard = ({ product }) => (
    <div className="bg-secondary-bg border border-border-color group relative overflow-hidden text-center transition-shadow duration-300 hover:shadow-xl">
        {product.tags?.includes('New Arrival') && (
            <div className="absolute top-3 left-3 bg-accent-gold text-primary-bg px-2 py-1 text-xs font-bold z-10">NEW</div>
        )}
        <div className="relative">
            <Link to={`/product/${product._id}`}>
                <img src={product.images[0] || 'https://placehold.co/400x400/222222/D4AF37?text=Charming'} alt={product.name} className="w-full h-auto aspect-square object-cover transition-transform duration-500 group-hover:scale-105" />
            </Link>
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <span className="bg-white/80 text-primary-bg px-6 py-2 font-bold uppercase">Quick View</span>
            </div>
        </div>
        <div className="p-4">
            <Link to={`/product/${product._id}`}>
                <h3 className="text-lg font-serif hover:text-accent-gold transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>{product.name}</h3>
            </Link>
            <p className="font-bold text-accent-gold mt-1">₹{product.price.toLocaleString('en-IN')}</p>
        </div>
    </div>
);

// --- Homepage Component ---
const HomePage = ({ products, loading, error }) => (
    <div>
        <section className="h-[60vh] bg-gray-800 bg-cover bg-center flex items-center justify-center text-center">
            <div>
                <h1 className="text-5xl md:text-7xl font-serif text-white drop-shadow-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Discover Your Charm</h1>
                <p className="text-xl text-gray-200 mt-4">Curated collections of luxury and style.</p>
                <div className="mt-8 new-arrival-button">
                    <Button>Shop New Arrivals</Button>
                </div>
            </div>
        </section>

        <section className="container mx-auto py-12 px-4">
            <h2 className="text-4xl text-center font-serif mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>New Arrivals</h2>
            
            {loading && <p className="text-center">Loading Products...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {products.map(product => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>
        </section>
    </div>
);

// --- Main App Component ---
export default function App() {
    const [theme, setTheme] = useState('dark');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Theme logic
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
    
    // API Fetch
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await axios.get('/api/products');
                console.log(await axios.get("/abcd"));
                setProducts(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to connect to backend.');
                console.error(err);
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);
    
    const themeStyles = useMemo(() => `
      :root[data-theme='dark'] {
        --primary-bg: #222222;
        --secondary-bg: #333333;
        --text-primary: #F5F5F5;
        --text-secondary: #aaaaaa;
        --accent-gold: #D4AF37;
        --border-color: #444444;
      }
      :root[data-theme='light'] {
        --primary-bg: #F5F5F5;
        --secondary-bg: #FFFFFF;
        --text-primary: #222222;
        --text-secondary: #555555;
        --accent-gold: #D4AF37;
        --border-color: #dddddd;
      }
    `, []);

    return (
        // CHANGE: Wrap everything in CartProvider
        <CartProvider>
            <Router>
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Playfair+Display:wght@700&display=swap');
                    
                    body {
                        background-color: var(--primary-bg);
                        color: var(--text-primary);
                        font-family: 'Montserrat', sans-serif;
                        transition: background-color 0.3s, color 0.3s;
                    }
                    ${themeStyles}
                `}</style>

                <div className="min-h-screen bg-primary-bg text-text-primary flex flex-col">
                    <Header theme={theme} toggleTheme={toggleTheme} />
                    
                    <main className="flex-grow">
                        <Routes>
                            <Route path="/" element={<HomePage products={products} loading={loading} error={error} />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/product/:id" element={<ProductDetailsPage />} />
                        </Routes>
                    </main>

                    <footer className="bg-secondary-bg text-center p-8 border-t border-border-color mt-auto">
                        <p>&copy; 2025 Charming. All Rights Reserved.</p>
                    </footer>
                </div>
            </Router>
        </CartProvider>
    );
}