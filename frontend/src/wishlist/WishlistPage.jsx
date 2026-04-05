import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../cart/cartProvider';
import { WishlistContext } from '../wishlist/WishlistContext';

const WishlistPage = () => {
    const { wishlist, toggle, loading } = useContext(WishlistContext);
    const { addToCart } = useContext(CartContext);
    const navigate = useNavigate();

    if (loading) return (
        <div className="text-center py-32 text-text-secondary animate-pulse">
            Loading wishlist...
        </div>
    );

    return (
        <div className="container mx-auto py-10 px-4 max-w-5xl">
            <h1 className="text-3xl font-serif mb-8"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                My Wishlist
                <span className="ml-3 text-lg text-text-secondary font-sans font-normal">
                    ({wishlist.length})
                </span>
            </h1>

            {wishlist.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">🤍</div>
                    <p className="text-text-secondary text-lg mb-6">
                        Your wishlist is empty.
                    </p>
                    <Link to="/"
                        className="bg-accent-gold text-primary-bg font-bold px-8 py-3
                            uppercase tracking-wider hover:bg-yellow-500 transition-colors">
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {wishlist.map(product => (
                        <div key={product._id}
                            className="bg-secondary-bg border border-border-color overflow-hidden
                                group transition-shadow hover:shadow-xl">
                            {/* Image */}
                            <div className="relative overflow-hidden aspect-square">
                                <Link to={`/product/${product._id}`}>
                                    <img
                                        src={product.images?.[0] ||
                                            'https://placehold.co/400x400/222/D4AF37?text=C'}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform
                                            duration-500 group-hover:scale-105"
                                    />
                                </Link>
                                {/* Remove from wishlist */}
                                <button
                                    onClick={() => toggle(product._id)}
                                    className="absolute top-3 right-3 w-8 h-8 rounded-full
                                        bg-red-500 text-white flex items-center justify-center
                                        hover:bg-red-600 transition-colors shadow-lg"
                                    title="Remove from wishlist"
                                >
                                    ✕
                                </button>
                                {product.stock === 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/70
                                        text-white text-center text-xs py-1.5 font-bold uppercase">
                                        Out of Stock
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <Link to={`/product/${product._id}`}>
                                    <h3 className="font-serif text-base hover:text-accent-gold
                                        transition-colors line-clamp-2 mb-1"
                                        style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {product.name}
                                    </h3>
                                </Link>
                                <p className="text-accent-gold font-bold mb-3">
                                    ₹{product.price.toLocaleString('en-IN')}
                                </p>
                                <button
                                    onClick={() => {
                                        if (product.stock > 0) {
                                            addToCart(product);
                                            navigate('/cart');
                                        }
                                    }}
                                    disabled={product.stock === 0}
                                    className="w-full py-2 bg-accent-gold text-primary-bg font-bold
                                        text-sm uppercase tracking-wider hover:bg-yellow-500
                                        transition-colors disabled:opacity-40
                                        disabled:cursor-not-allowed"
                                >
                                    {product.stock > 0 ? 'Add to Bag' : 'Out of Stock'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WishlistPage;