import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from './../cart/cartProvider';
import { Button } from '../App'

const ProductDetailsPage = () => {
    const { id } = useParams();
    const { addToCart } = useContext(CartContext); // CHANGE: Import action
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await axios.get(`/api/products/${id}`);
                setProduct(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) return <div className="text-center py-20">Loading product details...</div>;
    if (!product) return <div className="text-center py-20">Product not found.</div>;

    return (
        <div className="container mx-auto py-12 px-4">
            <Link to="/" className="mb-4 inline-block text-accent-gold hover:underline">&larr; Back to Shop</Link>
            <div className="grid md:grid-cols-2 gap-12">
                <div className="bg-secondary-bg p-4 border border-border-color">
                    <img 
                        src={product.images[0] || 'https://placehold.co/600x600/222222/D4AF37?text=Charming'} 
                        alt={product.name} 
                        className="w-full h-auto object-cover"
                    />
                </div>
                <div>
                    <h1 className="text-4xl font-serif mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{product.name}</h1>
                    <p className="text-2xl text-accent-gold font-bold mb-6">₹{product.price.toLocaleString('en-IN')}</p>
                    <p className="text-lg mb-6 leading-relaxed">{product.description}</p>
                    
                    {/* CHANGE: Button now calls addToCart */}
                    <Button onClick={() => addToCart(product)}>
                        Add to Cart
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsPage;