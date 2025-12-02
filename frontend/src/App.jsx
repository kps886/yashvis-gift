import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

// --- ICONS (as SVG components for simplicity) ---
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
);
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const CartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
);


// --- Reusable Button Component ---
const Button = ({ children, variant = 'primary', ...props }) => {
    const baseStyle = "px-6 py-2 font-bold uppercase tracking-wider transition-transform duration-200 transform hover:scale-105";
    const styles = {
        primary: "bg-accent-gold text-primary-bg",
        secondary: "bg-white/80 text-primary-bg"
    };
    return <button className={`${baseStyle} ${styles[variant]}`} {...props}>{children}</button>;
};

// --- Header Component ---
const Header = ({ theme, toggleTheme }) => (
    <header className="bg-secondary-bg text-text-primary sticky top-0 z-50 shadow-md border-b border-border-color">
        <div className="container mx-auto flex justify-between items-center p-4">
            <div className="text-4xl font-serif text-accent-gold cursor-pointer" style={{ fontFamily: "'Playfair Display', serif" }}>Charming</div>
            <nav className="hidden md:flex space-x-6 font-bold">
                <a href="#" className="hover:text-accent-gold transition-colors">Electronics</a>
                <a href="#" className="hover:text-accent-gold transition-colors">Fragrances</a>
                <a href="#" className="hover:text-accent-gold transition-colors">Bags & Purses</a>
                <a href="#" className="hover:text-accent-gold transition-colors">Toys</a>
                <a href="#" className="hover:text-accent-gold transition-colors">Home</a>
            </nav>
            <div className="flex items-center space-x-4">
                <button onClick={toggleTheme} className="focus:outline-none">
                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                </button>
                <a href="#" className="hover:text-accent-gold transition-colors"><UserIcon /></a>
                <a href="#" className="hover:text-accent-gold transition-colors"><CartIcon /></a>
            </div>
        </div>
    </header>
);

// --- Product Card Component ---
const ProductCard = ({ product }) => (
    <div className="bg-secondary-bg border border-border-color group relative overflow-hidden text-center transition-shadow duration-300 hover:shadow-xl">
        {product.tags?.includes('New Arrival') && (
            <div className="absolute top-3 left-3 bg-accent-gold text-primary-bg px-2 py-1 text-xs font-bold z-10">NEW</div>
        )}
        <div className="relative">
            <img src={product.images[0] || 'https://placehold.co/400x400/222222/D4AF37?text=Charming'} alt={product.name} className="w-full h-auto aspect-square object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button variant="secondary">Quick View</Button>
            </div>
        </div>
        <div className="p-4">
            <h3 className="text-lg font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>{product.name}</h3>
            <p className="font-bold text-accent-gold mt-1">₹{product.price.toLocaleString('en-IN')}</p>
        </div>
    </div>
);

// --- Homepage Component ---
const HomePage = ({ products }) => (
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

    // Theme switching logic
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
    
    // Fetch products from backend API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // The "proxy" in package.json directs this to http://localhost:5001/api/products
                const { data } = await axios.get('/api/products');
                setProducts(data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch products. Is the backend server running?');
                console.error(err);
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);
    
    // Define CSS variables in a style tag based on the theme
    // This is how we apply the color palette
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
        <>
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
            <div className="min-h-screen bg-primary-bg text-text-primary">
                <Header theme={theme} toggleTheme={toggleTheme} />
                <main>
                    {loading && <p className="text-center py-10">Loading Products...</p>}
                    {error && <p className="text-center py-10 text-red-500">{error}</p>}
                    {!loading && !error && <HomePage products={products} />}
                </main>
            </div>
        </>
    );
}