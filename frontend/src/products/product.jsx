import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { CartContext } from '../cart/cartProvider';
import { useAuth } from '../auth/AuthContext';
import { WishlistContext } from '../wishlist/WishlistContext';
import toast from 'react-hot-toast';

// ── Star components ────────────────────────────

const StarRow = ({ rating, size = 18 }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(n => (
            <svg key={n} width={size} height={size} viewBox="0 0 24 24"
                strokeWidth="1.5" stroke="#D4AF37"
                fill={n <= Math.round(rating) ? '#D4AF37' : 'none'}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02
                    12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
        ))}
    </div>
);

// Clickable stars for review form
const StarPicker = ({ value, onChange }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" onClick={() => onChange(n)}
                className="transition-transform hover:scale-110 focus:outline-none">
                <svg width="28" height="28" viewBox="0 0 24 24"
                    strokeWidth="1.5" stroke="#D4AF37"
                    fill={n <= value ? '#D4AF37' : 'none'}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02
                        12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
            </button>
        ))}
    </div>
);

// ─────────────────────────────────────────────────────────────
const ProductDetailsPage = () => {
    const { id } = useParams();
    const { addToCart, cartItems, updateQty, removeFromCart } = useContext(CartContext);
    const { isWishlisted, toggle } = useContext(WishlistContext);
    const { isLoggedIn, user } = useAuth();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState('');
    const [sizeError, setSizeError] = useState(false);
    
    // Review form
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState('');
    
    const fetchProduct = useCallback(async () => {
        try {
            const { data } = await api.get(`/api/products/${id}`);
            setProduct(data);
        } catch { /* silent */ }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);
    
    const cartItem = product ? cartItems.find(x => x._id === product._id && x.size === selectedSize) : null;
 

    const handleAddToCart = () => {
        const hasVariations = product.variations?.length > 0;

        if (hasVariations && !selectedSize) {
            setSizeError(true);
            return;
        }
        setSizeError(false);
        addToCart(product, selectedSize);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const handleWishlist = async () => {
        if (!isLoggedIn) { navigate('/login'); return; }
        await toggle(product._id);
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) { setReviewError('Please select a star rating'); return; }
        if (!comment.trim()) { setReviewError('Please write a comment'); return; }

        setReviewLoading(true);
        setReviewError('');

        try {
            await api.post(`/api/products/${id}/reviews`, { rating, comment });
            setReviewSuccess('Review submitted! Thank you.');
            setRating(0);
            setComment('');
            fetchProduct();  // reload to show new review
        } catch (err) {
            setReviewError(err.response?.data?.message || 'Error submitting review');
        }
        setReviewLoading(false);
    };

    const alreadyReviewed = product?.reviews?.some(
        r => r.user?.toString() === user?._id?.toString()
    );

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="text-text-secondary animate-pulse">Loading...</div>
        </div>
    );
    if (!product) return (
        <div className="text-center py-32">
            <p className="text-xl text-text-secondary mb-4">Product not found.</p>
            <Link to="/" className="text-accent-gold hover:underline">← Back to Shop</Link>
        </div>
    );

    const wishlisted = isWishlisted(product._id);
    const avgRating = product.avgRating || 0;

    return (
        <div className="container mx-auto py-10 px-4 max-w-6xl">
            <Link to="/" className="mb-6 inline-block text-accent-gold hover:underline text-sm">
                ← Back to Shop
            </Link>

            <div className="grid md:grid-cols-2 gap-10 mb-16">
                {/* ── Images ── */}
                <div>
                    <div className="bg-secondary-bg border border-border-color p-3 mb-3">
                        <img
                            src={product.images?.[selectedImage] ||
                                'https://placehold.co/600x600/222/D4AF37?text=MonikaCreation'}
                            alt={product.name}
                            className="w-full aspect-square object-cover"
                        />
                    </div>
                    {product.images?.length > 1 && (
                        <div className="flex gap-2 flex-wrap">
                            {product.images.map((img, i) => (
                                <button key={i} onClick={() => setSelectedImage(i)}
                                    className={`w-16 h-16 border-2 overflow-hidden transition-colors ${selectedImage === i
                                        ? 'border-accent-gold'
                                        : 'border-border-color hover:border-text-secondary'
                                        }`}>
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Details ── */}
                <div>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {product.tags?.map(tag => (
                            <span key={tag} className="px-2 py-0.5 text-xs bg-accent-gold
                                text-primary-bg font-bold uppercase">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-3xl md:text-4xl font-serif mb-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        {product.name}
                    </h1>

                    {/* Rating summary */}
                    {product.reviewCount > 0 ? (
                        <div className="flex items-center gap-2 mb-3">
                            <StarRow rating={avgRating} />
                            <span className="text-sm text-text-secondary">
                                {avgRating.toFixed(1)} ({product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''})
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm text-text-secondary mb-3">No reviews yet</p>
                    )}

                    <p className="text-3xl text-accent-gold font-bold mb-2">
                        ₹{product.price.toLocaleString('en-IN')}
                    </p>

                    <p className="text-sm mb-5">
                        {product.stock > 0
                            ? <span className="text-green-400">✓ In Stock ({product.stock} available)</span>
                            : <span className="text-red-400">✗ Out of Stock</span>
                        }
                    </p>

                    <p className="text-sm leading-relaxed text-text-secondary mb-6">
                        {product.description}
                    </p>

                    {/* Variations */}
                    {product.variations?.length > 0 && (
                        <div className="mb-6 space-y-3">
                            {product.variations.map(v => (
                                <div key={v.name}>
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="font-bold text-xs uppercase tracking-wider">
                                            Select {v.name}
                                        </p>
                                        {sizeError && (
                                            <p className="text-xs text-red-500 font-bold animate-pulse">
                                                Please select a {v.name.toLowerCase()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {v.options.map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => {
                                                    setSelectedSize(opt);
                                                    setSizeError(false);
                                                }}
                                                className={`px-4 py-2 border transition-colors text-sm font-semibold ${selectedSize === opt
                                                        ? 'border-accent-gold bg-accent-gold text-primary-bg'
                                                        : 'border-border-color hover:border-accent-gold text-text-primary'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3 flex-wrap">
                        {cartItem ? (
                            <div className="flex items-center border-2 border-accent-gold rounded h-12 flex-1 min-w-[160px] bg-primary-bg overflow-hidden">
                                <button
                                    onClick={() => cartItem.qty === 1 ? removeFromCart(cartItem._id, cartItem.size) : updateQty(cartItem._id, cartItem.size, cartItem.qty - 1)}
                                    className="w-12 h-full text-xl font-bold hover:bg-accent-gold hover:text-primary-bg transition-colors text-accent-gold flex items-center justify-center"
                                >
                                    −
                                </button>
                                <span className="flex-1 text-center font-bold text-sm text-text-primary">
                                    {cartItem.qty} Added
                                </span>
                                <button
                                    onClick={() => updateQty(cartItem._id, cartItem.size, cartItem.qty + 1)}
                                    disabled={cartItem.qty >= product.stock}
                                    className="w-12 h-full text-xl font-bold hover:bg-accent-gold hover:text-primary-bg transition-colors text-accent-gold flex items-center justify-center"
                                >
                                    +
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                                className={`flex-1 min-w-[160px] h-12 font-bold uppercase tracking-wider transition-all duration-200 text-sm ${
                                    product.stock === 0
                                        ? 'bg-border-color text-text-secondary cursor-not-allowed'
                                        : added
                                            ? 'bg-green-500 text-white scale-95'
                                            : 'bg-accent-gold text-primary-bg hover:bg-yellow-500'
                                }`}
                            >
                                {product.stock === 0 ? 'Out of Stock' : added ? '✓ Added!' : 'Add to Bag'}
                            </button>
                        )}

                        {/* Wishlist button */}
                        <button
                            onClick={handleWishlist}
                            className={`px-4 py-3 border-2 transition-all duration-200
                                font-bold text-sm flex items-center gap-2 ${wishlisted
                                    ? 'border-red-500 text-red-500 bg-red-500/10'
                                    : 'border-border-color hover:border-red-400 hover:text-red-400'
                                }`}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24"
                                stroke="currentColor" strokeWidth="2"
                                fill={wishlisted ? 'currentColor' : 'none'}>
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06
                                    a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78
                                    1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            {wishlisted ? 'Wishlisted' : 'Wishlist'}
                        </button>
                    </div>

                    <p className="text-xs text-text-secondary mt-4">
                        Category: {product.category}
                    </p>
                </div>
            </div>

            {/* ── Reviews section ── */}
            <div className="max-w-3xl">
                <h2 className="text-2xl font-serif mb-6 pb-3 border-b border-border-color"
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                    Customer Reviews
                    {product.reviewCount > 0 && (
                        <span className="ml-3 text-base text-text-secondary font-sans font-normal">
                            {avgRating.toFixed(1)} / 5 · {product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </h2>

                {/* Review form */}
                {isLoggedIn && user?.role === 'user' && !alreadyReviewed && (
                    <div className="bg-secondary-bg border border-border-color p-5 mb-6">
                        <h3 className="font-bold mb-4 text-sm uppercase tracking-wider">
                            Write a Review
                        </h3>
                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase
                                    tracking-wider text-text-secondary mb-2">
                                    Your Rating *
                                </label>
                                <StarPicker value={rating} onChange={setRating} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase
                                    tracking-wider text-text-secondary mb-2">
                                    Your Review *
                                </label>
                                <textarea
                                    rows={4}
                                    value={comment}
                                    onChange={e => {
                                        setComment(e.target.value);
                                        setReviewError('');
                                    }}
                                    placeholder="Share your experience with this product..."
                                    className="w-full p-3 bg-primary-bg border border-border-color
                                        rounded text-sm focus:outline-none focus:border-accent-gold
                                        transition-colors resize-none"
                                />
                            </div>

                            {reviewError && (
                                <p className="text-red-400 text-sm">{reviewError}</p>
                            )}
                            {reviewSuccess && (
                                <p className="text-green-400 text-sm">{reviewSuccess}</p>
                            )}

                            <button type="submit" disabled={reviewLoading}
                                className="bg-accent-gold text-primary-bg font-bold px-6 py-2.5
                                    text-sm uppercase tracking-wider hover:bg-yellow-500
                                    transition-colors disabled:opacity-50">
                                {reviewLoading ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    </div>
                )}

                {!isLoggedIn && (
                    <div className="bg-secondary-bg border border-border-color p-4 mb-6 text-sm text-center">
                        <Link to="/login" className="text-accent-gold hover:underline font-semibold">
                            Sign in
                        </Link>
                        {' '}to leave a review.
                    </div>
                )}

                {alreadyReviewed && (
                    <div className="bg-green-500/10 border border-green-500/40 p-3 mb-6
                        text-green-400 text-sm rounded">
                        ✓ You have already reviewed this product. Thank you!
                    </div>
                )}

                {/* Review list */}
                {product.reviews?.length === 0 ? (
                    <p className="text-text-secondary text-sm py-8 text-center">
                        No reviews yet. Be the first to review this product!
                    </p>
                ) : (
                    <div className="space-y-4">
                        {[...product.reviews].reverse().map((r, i) => (
                            <div key={i}
                                className="bg-secondary-bg border border-border-color p-4">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div>
                                        <p className="font-semibold text-sm">{r.name || 'Customer'}</p>
                                        <StarRow rating={r.rating} size={14} />
                                    </div>
                                    <p className="text-xs text-text-secondary flex-shrink-0">
                                        {new Date(r.createdAt || Date.now())
                                            .toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                            })}
                                    </p>
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    {r.comment}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetailsPage;