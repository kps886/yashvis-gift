import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../cart/cartProvider';
import { useAuth } from '../auth/AuthContext';

const StarIcon = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"
        className={filled ? 'text-accent-gold' : 'text-text-secondary'}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

const ProductDetailsPage = () => {
    const { id } = useParams();
    const { addToCart } = useContext(CartContext);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await axios.get(`/api/products/${id}`);
                setProduct(data);
            } catch (error) {
                console.error(error);
            }
            setLoading(false);
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = () => {
        addToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="text-text-secondary animate-pulse">Loading product details...</div>
        </div>
    );

    if (!product) return (
        <div className="text-center py-32">
            <p className="text-xl text-text-secondary mb-4">Product not found.</p>
            <Link to="/" className="text-accent-gold hover:underline">← Back to Shop</Link>
        </div>
    );

    const avgRating = product.reviews?.length
        ? product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length
        : 0;

    return (
        <div className="container mx-auto py-12 px-4">
            <Link to="/" className="mb-6 inline-block text-accent-gold hover:underline transition-colors">
                ← Back to Shop
            </Link>

            <div className="grid md:grid-cols-2 gap-12">
                {/* Images */}
                <div>
                    <div className="bg-secondary-bg border border-border-color p-4 mb-3">
                        <img
                            src={product.images[selectedImage] || 'https://placehold.co/600x600/222222/D4AF37?text=Charming'}
                            alt={product.name}
                            className="w-full aspect-square object-cover"
                        />
                    </div>
                    {product.images.length > 1 && (
                        <div className="flex gap-2 flex-wrap">
                            {product.images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedImage(i)}
                                    className={`w-16 h-16 border-2 overflow-hidden transition-colors ${selectedImage === i ? 'border-accent-gold' : 'border-border-color hover:border-text-secondary'}`}
                                >
                                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {product.tags?.map(tag => (
                            <span key={tag} className="px-2 py-0.5 text-xs bg-accent-gold text-primary-bg font-bold uppercase">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-4xl font-serif mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {product.name}
                    </h1>

                    {product.reviews?.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map(n => <StarIcon key={n} filled={n <= Math.round(avgRating)} />)}
                            </div>
                            <span className="text-sm text-text-secondary">({product.reviews.length} reviews)</span>
                        </div>
                    )}

                    <p className="text-3xl text-accent-gold font-bold mb-2">
                        ₹{product.price.toLocaleString('en-IN')}
                    </p>

                    <p className="text-sm text-text-secondary mb-6">
                        {product.stock > 0
                            ? <span className="text-green-400">✓ In Stock ({product.stock} available)</span>
                            : <span className="text-red-400">✗ Out of Stock</span>
                        }
                    </p>

                    <p className="text-base leading-relaxed mb-8 text-text-secondary">{product.description}</p>

                    {product.variations?.length > 0 && (
                        <div className="mb-6 space-y-4">
                            {product.variations.map(v => (
                                <div key={v.name}>
                                    <p className="font-bold text-sm uppercase tracking-wider mb-2">{v.name}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {v.options.map(opt => (
                                            <button key={opt} className="px-4 py-1 border border-border-color hover:border-accent-gold transition-colors text-sm">
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleAddToCart}
                        disabled={product.stock === 0}
                        className={`w-full py-3 font-bold uppercase tracking-wider transition-all duration-200 ${
                            product.stock === 0
                                ? 'bg-border-color text-text-secondary cursor-not-allowed'
                                : added
                                ? 'bg-green-500 text-white scale-95'
                                : 'bg-accent-gold text-primary-bg hover:bg-yellow-500 hover:scale-[1.02]'
                        }`}
                    >
                        {product.stock === 0 ? 'Out of Stock' : added ? '✓ Added to Bag!' : 'Add to Bag'}
                    </button>

                    <p className="text-xs text-text-secondary mt-3 text-center">
                        Category: {product.category}
                    </p>
                </div>
            </div>

            {/* Reviews */}
            {product.reviews?.length > 0 && (
                <div className="mt-16">
                    <h2 className="text-2xl font-serif mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Customer Reviews
                    </h2>
                    <div className="space-y-4">
                        {product.reviews.map((r, i) => (
                            <div key={i} className="bg-secondary-bg border border-border-color p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="font-semibold">{r.name || 'Customer'}</span>
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map(n => <StarIcon key={n} filled={n <= r.rating} />)}
                                    </div>
                                </div>
                                <p className="text-text-secondary text-sm">{r.comment}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetailsPage;
