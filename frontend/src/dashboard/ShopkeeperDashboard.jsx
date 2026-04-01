import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

const CATEGORIES = ['Electronics', 'Fragrances', 'Bags & Purses', 'Toys & Games', 'Home & Kitchen'];

const emptyForm = {
    name: '', description: '', price: '', category: 'Electronics',
    images: [], stock: '', tags: '', existingImages: []
};

const ShopkeeperDashboard = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Note: Make sure to pass your auth token in headers if required by your backend
            const { data } = await axios.get('/api/products');
            setProducts(data);
        } catch {
            setError('Failed to fetch products');
        }
        setLoading(false);
    };

    useEffect(() => { fetchProducts(); }, []);

    const openAddForm = () => {
        setEditingProduct(null);
        setForm(emptyForm);
        setShowForm(true);
        setError(''); setSuccess('');
    };

    const openEditForm = (p) => {
        setEditingProduct(p);
        setForm({
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category,
            // We can't put existing URLs into a file input, so we separate them
            images: [], 
            existingImages: p.images || [],
            stock: p.stock,
            tags: p.tags ? p.tags.join(', ') : '',
        });
        setShowForm(true);
        setError(''); setSuccess('');
    };

    const handleFileChange = (e) => {
        // Convert FileList to an array and store in state
        setForm({ ...form, images: Array.from(e.target.files) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');

        // Use FormData to send files + text data
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('description', form.description);
        formData.append('price', parseFloat(form.price));
        formData.append('category', form.category);
        formData.append('stock', parseInt(form.stock));
        
        // Backend will need to split this string back into an array
        const tagsString = form.tags.split(',').map(s => s.trim()).filter(Boolean).join(',');
        formData.append('tags', tagsString); 

        // Append new files
        form.images.forEach((file) => {
            formData.append('images', file); // 'images' must match your backend Multer configuration
        });

        // Append existing images so the backend knows what to keep (if editing)
        if (editingProduct) {
            formData.append('existingImages', JSON.stringify(form.existingImages));
        }

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${user.token}`
            }
        };

        try {
            if (editingProduct) {
                await axios.put(`/api/products/${editingProduct._id}`, formData, config);
                setSuccess('Product updated successfully');
            } else {
                await axios.post('/api/products', formData, config);
                setSuccess('Product created successfully');
            }
            setShowForm(false);
            fetchProducts();
        } catch (err) {
            setError(err.response?.data?.message || 'Error saving product');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            await axios.delete(`/api/products/${id}`);
            setSuccess('Product deleted');
            fetchProducts();
        } catch {
            setError('Failed to delete product');
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Product Management
                    </h1>
                    <p className="text-text-secondary mt-1">Welcome, {user?.name}</p>
                </div>
                <span className="px-3 py-1 text-xs font-bold border rounded uppercase bg-purple-500/20 text-purple-400 border-purple-500/40">
                    Shopkeeper
                </span>
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 text-red-400 rounded text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/40 text-green-400 rounded text-sm">{success}</div>}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-secondary-bg border border-border-color p-4 text-center">
                    <p className="text-2xl font-bold text-accent-gold">{products.length}</p>
                    <p className="text-xs text-text-secondary mt-1 uppercase tracking-wider">Total Products</p>
                </div>
                <div className="bg-secondary-bg border border-border-color p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{products.filter(p => p.stock > 0).length}</p>
                    <p className="text-xs text-text-secondary mt-1 uppercase tracking-wider">In Stock</p>
                </div>
                <div className="bg-secondary-bg border border-border-color p-4 text-center">
                    <p className="text-2xl font-bold text-red-400">{products.filter(p => p.stock === 0).length}</p>
                    <p className="text-xs text-text-secondary mt-1 uppercase tracking-wider">Out of Stock</p>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Products ({products.length})</h2>
                <button
                    onClick={openAddForm}
                    className="bg-accent-gold text-primary-bg px-4 py-2 text-sm font-bold uppercase hover:bg-yellow-500 transition-colors"
                >
                    + Add Product
                </button>
            </div>

            {/* Product Form */}
            {showForm && (
                <div className="bg-secondary-bg border border-border-color p-6 mb-6">
                    <h3 className="font-bold mb-4">{editingProduct ? 'Edit Product' : 'New Product'}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input required type="text" placeholder="Product Name"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                            className="p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold"
                        />
                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                            className="p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input required type="number" min="0" step="0.01" placeholder="Price (₹)"
                            value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                            className="p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold"
                        />
                        <input required type="number" min="0" placeholder="Stock quantity"
                            value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                            className="p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold"
                        />
                        <textarea required placeholder="Description" rows={3}
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                            className="md:col-span-2 p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold resize-none"
                        />
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm text-text-secondary mb-1">Upload Images</label>
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-gold file:text-primary-bg hover:file:bg-yellow-500"
                            />
                            {editingProduct && form.existingImages.length > 0 && (
                                <p className="text-xs text-text-secondary mt-2">
                                    Current images: {form.existingImages.length} (Uploading new ones will add to or replace these based on your backend logic)
                                </p>
                            )}
                        </div>

                        <input type="text" placeholder='Tags e.g. "New Arrival, Bestseller" (comma-separated)'
                            value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                            className="md:col-span-2 p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold"
                        />
                        <div className="md:col-span-2 flex gap-3">
                            <button type="submit" className="bg-accent-gold text-primary-bg px-6 py-2 font-bold hover:bg-yellow-500 transition-colors">
                                {editingProduct ? 'Update' : 'Create'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-border-color hover:border-text-secondary transition-colors">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <p className="text-center py-12 text-text-secondary">Loading products...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border-color text-text-secondary uppercase tracking-wider text-xs">
                                <th className="text-left py-3 px-4">Product</th>
                                <th className="text-left py-3 px-4">Category</th>
                                <th className="text-left py-3 px-4">Price</th>
                                <th className="text-left py-3 px-4">Stock</th>
                                <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p._id} className="border-b border-border-color hover:bg-secondary-bg/50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            {p.images && p.images[0] && (
                                                <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded border border-border-color" />
                                            )}
                                            <span className="font-medium">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-text-secondary">{p.category}</td>
                                    <td className="py-3 px-4 text-accent-gold font-semibold">₹{p.price.toLocaleString('en-IN')}</td>
                                    <td className="py-3 px-4">
                                        <span className={p.stock > 0 ? 'text-green-400' : 'text-red-400'}>
                                            {p.stock} {p.stock === 0 ? '(Out)' : ''}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditForm(p)}
                                                className="text-xs px-2 py-1 border border-accent-gold/40 text-accent-gold rounded hover:opacity-80 transition-opacity"
                                            >
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(p._id, p.name)}
                                                className="text-xs px-2 py-1 border border-red-500/40 text-red-400 rounded hover:opacity-80 transition-opacity"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {products.length === 0 && (
                        <p className="text-center py-12 text-text-secondary">No products yet. Add your first product above.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ShopkeeperDashboard;