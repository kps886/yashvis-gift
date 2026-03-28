import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [stockEdit, setStockEdit] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/products');
            setProducts(data);
        } catch {
            setError('Failed to fetch products');
        }
        setLoading(false);
    };

    useEffect(() => { fetchProducts(); }, []);

    const handleUpdateStock = async (productId) => {
        setError(''); setSuccess('');
        try {
            await axios.put(`/api/products/${productId}`, { stock: parseInt(stockEdit) });
            setSuccess('Stock updated successfully');
            setEditingId(null);
            fetchProducts();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update stock');
        }
    };

    const lowStock = products.filter(p => p.stock <= 5);
    const outOfStock = products.filter(p => p.stock === 0);

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Inventory Management
                    </h1>
                    <p className="text-text-secondary mt-1">Welcome, {user.name}</p>
                </div>
                <span className="px-3 py-1 text-xs font-bold border rounded uppercase bg-blue-500/20 text-blue-400 border-blue-500/40">
                    Employee
                </span>
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 text-red-400 rounded text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/40 text-green-400 rounded text-sm">{success}</div>}

            {/* Alerts */}
            {outOfStock.length > 0 && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/40 rounded">
                    <p className="text-red-400 font-bold text-sm">⚠ {outOfStock.length} product(s) are out of stock!</p>
                    <p className="text-red-400/70 text-xs mt-1">{outOfStock.map(p => p.name).join(', ')}</p>
                </div>
            )}
            {lowStock.filter(p => p.stock > 0).length > 0 && (
                <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/40 rounded">
                    <p className="text-orange-400 font-bold text-sm">⚠ {lowStock.filter(p => p.stock > 0).length} product(s) have low stock (≤5)</p>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-secondary-bg border border-border-color p-4 text-center">
                    <p className="text-2xl font-bold text-accent-gold">{products.length}</p>
                    <p className="text-xs text-text-secondary mt-1 uppercase tracking-wider">Total Products</p>
                </div>
                <div className="bg-secondary-bg border border-border-color p-4 text-center">
                    <p className="text-2xl font-bold text-orange-400">{lowStock.filter(p => p.stock > 0).length}</p>
                    <p className="text-xs text-text-secondary mt-1 uppercase tracking-wider">Low Stock</p>
                </div>
                <div className="bg-secondary-bg border border-border-color p-4 text-center">
                    <p className="text-2xl font-bold text-red-400">{outOfStock.length}</p>
                    <p className="text-xs text-text-secondary mt-1 uppercase tracking-wider">Out of Stock</p>
                </div>
            </div>

            <h2 className="text-xl font-semibold mb-4">Product Inventory</h2>

            {loading ? (
                <p className="text-center py-12 text-text-secondary">Loading inventory...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border-color text-text-secondary uppercase tracking-wider text-xs">
                                <th className="text-left py-3 px-4">Product</th>
                                <th className="text-left py-3 px-4">Category</th>
                                <th className="text-left py-3 px-4">Price</th>
                                <th className="text-left py-3 px-4">Stock</th>
                                <th className="text-left py-3 px-4">Update Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p._id} className={`border-b border-border-color transition-colors ${p.stock === 0 ? 'bg-red-500/5' : p.stock <= 5 ? 'bg-orange-500/5' : 'hover:bg-secondary-bg/50'}`}>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            {p.images[0] && (
                                                <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded border border-border-color" />
                                            )}
                                            <div>
                                                <p className="font-medium">{p.name}</p>
                                                {p.tags?.length > 0 && (
                                                    <p className="text-xs text-text-secondary">{p.tags.join(', ')}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-text-secondary">{p.category}</td>
                                    <td className="py-3 px-4 text-accent-gold">₹{p.price.toLocaleString('en-IN')}</td>
                                    <td className="py-3 px-4">
                                        <span className={`font-semibold ${p.stock === 0 ? 'text-red-400' : p.stock <= 5 ? 'text-orange-400' : 'text-green-400'}`}>
                                            {p.stock}
                                            {p.stock === 0 && ' (Out of Stock)'}
                                            {p.stock > 0 && p.stock <= 5 && ' (Low)'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {editingId === p._id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number" min="0"
                                                    value={stockEdit}
                                                    onChange={e => setStockEdit(e.target.value)}
                                                    className="w-20 p-1 bg-primary-bg border border-accent-gold rounded text-sm focus:outline-none"
                                                    autoFocus
                                                />
                                                <button onClick={() => handleUpdateStock(p._id)}
                                                    className="text-xs px-2 py-1 bg-accent-gold text-primary-bg rounded font-bold hover:bg-yellow-500"
                                                >
                                                    Save
                                                </button>
                                                <button onClick={() => setEditingId(null)}
                                                    className="text-xs px-2 py-1 border border-border-color rounded hover:border-text-secondary"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setEditingId(p._id); setStockEdit(p.stock.toString()); }}
                                                className="text-xs px-3 py-1 border border-accent-gold/40 text-accent-gold rounded hover:opacity-80 transition-opacity"
                                            >
                                                Update Stock
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {products.length === 0 && (
                        <p className="text-center py-12 text-text-secondary">No products in inventory.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;
