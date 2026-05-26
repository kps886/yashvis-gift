import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../auth/AuthContext';

const CATEGORIES = ['Kurta Sets', 'Short Kurtas', 'Sherwanis', 'Modi Jackets', 'Accessories'];

const ORDER_STATUS_STYLES = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    processing: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    delivered: 'bg-green-500/20 text-green-400 border-green-500/40',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/40',
};

const emptyForm = {
    name: '', description: '', price: '', category: 'Kurta Sets',
    images: [], stock: '', tags: '', existingImages: [],
    sizes: '',
};

const Tab = ({ label, active, onClick, badge }) => (
    <button onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase
            tracking-wider transition-colors border-b-2 whitespace-nowrap ${active
                ? 'border-accent-gold text-accent-gold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}>
        {label}
        {badge > 0 && (
            <span className="bg-accent-gold text-primary-bg text-xs font-bold
                rounded-full px-1.5 py-0.5 leading-none">
                {badge}
            </span>
        )}
    </button>
);

// ── Orders panel (shared with admin) ─────────────────────────
const OrdersPanel = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [statusEdit, setStatusEdit] = useState({});
    const [updating, setUpdating] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filter, setFilter] = useState('all');

    const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/api/orders');
            setOrders(data);
        } catch { setError('Failed to load orders'); }
        setLoading(false);
    };
    useEffect(() => { fetchOrders(); }, []);

    const handleUpdateStatus = async (orderId) => {
        const edit = statusEdit[orderId];
        if (!edit?.status) return;
        setUpdating(orderId); setError(''); setSuccess('');
        try {
            await api.put(`/api/orders/${orderId}/status`, {
                orderStatus: edit.status,
                trackingNumber: edit.tracking || undefined,
            });
            setSuccess('Order updated successfully');
            setStatusEdit(prev => { const n = { ...prev }; delete n[orderId]; return n; });
            fetchOrders();
        } catch { setError('Failed to update order'); }
        setUpdating(null);
    };

    const filtered = filter === 'all' ? orders : orders.filter(o => o.orderStatus === filter);

    return (
        <div>
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 text-red-400 rounded text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/40 text-green-400 rounded text-sm">{success}</div>}

            <div className="flex gap-2 flex-wrap mb-5">
                {['all', ...STATUSES].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`px-3 py-1.5 text-xs font-bold uppercase rounded border
                            transition-colors ${filter === s
                                ? 'bg-accent-gold text-primary-bg border-accent-gold'
                                : 'border-border-color text-text-secondary hover:border-text-secondary'
                            }`}>
                        {s} ({s === 'all' ? orders.length : orders.filter(o => o.orderStatus === s).length})
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-center py-12 text-text-secondary animate-pulse">Loading orders...</p>
            ) : filtered.length === 0 ? (
                <p className="text-center py-12 text-text-secondary">No orders found.</p>
            ) : (
                <div className="space-y-3">
                    {filtered.map(order => (
                        <div key={order._id}
                            className="bg-secondary-bg border border-border-color overflow-hidden">
                            <div
                                className="p-4 flex flex-col sm:flex-row sm:items-center
                                    justify-between gap-3 cursor-pointer hover:bg-primary-bg/40
                                    transition-colors"
                                onClick={() => setExpanded(expanded === order._id ? null : order._id)}
                            >
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                    <span className="font-mono font-semibold text-xs">
                                        #{order._id.slice(-8).toUpperCase()}
                                    </span>
                                    <span className="text-text-secondary">
                                        {order.user?.name}
                                    </span>
                                    <span className="font-bold text-accent-gold">
                                        ₹{order.total.toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-text-secondary text-xs">
                                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 text-xs font-bold border
                                        rounded uppercase ${ORDER_STATUS_STYLES[order.orderStatus]}`}>
                                        {order.orderStatus}
                                    </span>
                                    <span className="text-text-secondary text-xs">
                                        {expanded === order._id ? '▲' : '▼'}
                                    </span>
                                </div>
                            </div>

                            {expanded === order._id && (
                                <div className="border-t border-border-color p-4 space-y-4">
                                    <div className="space-y-2">
                                        {order.items.map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 text-sm">
                                                <img
                                                    src={item.image || 'https://placehold.co/40x40/222/D4AF37?text=C'}
                                                    alt={item.name}
                                                    className="w-10 h-10 object-cover border border-border-color flex-shrink-0"
                                                />
                                                <div className="flex-grow">
                                                    <p className="font-semibold">{item.name}</p>
                                                    <p className="text-xs text-text-secondary">
                                                        Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                                <p className="font-bold">
                                                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="text-sm bg-primary-bg p-3 rounded">
                                        <p className="font-bold mb-1">Ship To</p>
                                        <p className="text-text-secondary">
                                            {order.shippingAddress.fullName} · {order.shippingAddress.phone}
                                        </p>
                                        <p className="text-text-secondary">
                                            {order.shippingAddress.line1}, {order.shippingAddress.city},
                                            {order.shippingAddress.state} — {order.shippingAddress.pincode}
                                        </p>
                                    </div>

                                    {order.orderStatus !== 'delivered' &&
                                        order.orderStatus !== 'cancelled' && (
                                            <div className="p-3 rounded border border-border-color bg-primary-bg">
                                                <p className="text-xs font-bold uppercase tracking-wider
                                                text-text-secondary mb-3">
                                                    Update Status
                                                </p>
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <select
                                                        value={statusEdit[order._id]?.status || order.orderStatus}
                                                        onChange={e => setStatusEdit(prev => ({
                                                            ...prev,
                                                            [order._id]: { ...prev[order._id], status: e.target.value },
                                                        }))}
                                                        className="flex-1 p-2 bg-secondary-bg border
                                                        border-border-color rounded text-sm
                                                        focus:outline-none focus:border-accent-gold"
                                                    >
                                                        {STATUSES.map(s => (
                                                            <option key={s} value={s} className="capitalize">{s}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="text"
                                                        placeholder="Tracking number (optional)"
                                                        value={statusEdit[order._id]?.tracking || order.trackingNumber || ''}
                                                        onChange={e => setStatusEdit(prev => ({
                                                            ...prev,
                                                            [order._id]: { ...prev[order._id], tracking: e.target.value },
                                                        }))}
                                                        className="flex-1 p-2 bg-secondary-bg border
                                                        border-border-color rounded text-sm
                                                        focus:outline-none focus:border-accent-gold"
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateStatus(order._id)}
                                                        disabled={updating === order._id}
                                                        className="px-5 py-2 bg-accent-gold text-primary-bg
                                                        font-bold text-sm hover:bg-yellow-500 transition-colors
                                                        disabled:opacity-50 rounded"
                                                    >
                                                        {updating === order._id ? 'Saving...' : 'Update'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Products panel ────────────────────────────────────────────
const ProductsPanel = ({ user }) => {
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
            const { data } = await api.get('/api/products');
            console.log('Fetched products:', data);
            setProducts(data.products);
        } catch { setError('Failed to fetch products'); }
        setLoading(false);
    };
    useEffect(() => { fetchProducts(); }, []);

    const openAddForm = () => { setEditingProduct(null); setForm(emptyForm); setShowForm(true); setError(''); setSuccess(''); };
    const openEditForm = (p) => {
        setEditingProduct(p);
        const existingSizes = p.variations?.find(v => v.name === 'Size')?.options.join(', ') || '';
        setForm({
            name: p.name, description: p.description, price: p.price,
            category: p.category, images: [], existingImages: p.images || [],
            stock: p.stock, tags: p.tags ? p.tags.join(', ') : '', sizes: existingSizes
        });
        setShowForm(true); setError(''); setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setSuccess('');
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('description', form.description);
        formData.append('price', parseFloat(form.price));
        formData.append('category', form.category);
        formData.append('stock', parseInt(form.stock));
        formData.append('tags', form.tags.split(',').map(s => s.trim()).filter(Boolean).join(','));
        const formattedVariations = form.sizes.trim() ? [{
            name: 'Size',
            options: form.sizes.split(',').map(s => s.trim()).filter(Boolean)
        }] : [];
        formData.append('variations', JSON.stringify(formattedVariations));
        form.images.forEach(file => formData.append('images', file));
        if (editingProduct) formData.append('existingImages', JSON.stringify(form.existingImages));

        try {
            if (editingProduct) {
                await api.put(`/api/products/${editingProduct._id}`, formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } });
                setSuccess('Product updated');
            } else {
                await api.post('/api/products', formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } });
                setSuccess('Product created');
            }
            setShowForm(false); fetchProducts();
        } catch (err) { setError(err.response?.data?.message || 'Error saving product'); }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try { await api.delete(`/api/products/${id}`); fetchProducts(); }
        catch { setError('Failed to delete product'); }
    };

    return (
        <div>
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 text-red-400 rounded text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/40 text-green-400 rounded text-sm">{success}</div>}

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Products ({products.length})</h2>
                <button onClick={openAddForm}
                    className="bg-accent-gold text-primary-bg px-4 py-2 text-sm font-bold
                        uppercase hover:bg-yellow-500 transition-colors">
                    + Add Product
                </button>
            </div>

            {showForm && (
                <div className="bg-secondary-bg border border-border-color p-5 mb-5">
                    <h3 className="font-bold mb-4 text-sm uppercase tracking-wider">
                        {editingProduct ? 'Edit Product' : 'New Product'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input required type="text" placeholder="Product Name"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                            className="p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold text-sm"
                        />
                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                            className="p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold text-sm">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input required type="number" min="0" step="0.01" placeholder="Price (₹)"
                            value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                            className="p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold text-sm"
                        />
                        <input required type="number" min="0" placeholder="Stock quantity"
                            value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                            className="p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold text-sm"
                        />
                        <textarea required placeholder="Description" rows={3}
                            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                            className="sm:col-span-2 p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold resize-none text-sm"
                        />
                        <div className="sm:col-span-2">
                            <label className="block text-xs text-text-secondary mb-1">Upload Images</label>
                            <input type="file" multiple accept="image/*"
                                onChange={e => setForm({ ...form, images: Array.from(e.target.files) })}
                                className="w-full p-2 bg-primary-bg border border-border-color rounded text-sm
                                    file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0
                                    file:text-xs file:font-bold file:bg-accent-gold file:text-primary-bg
                                    hover:file:bg-yellow-500"
                            />
                            {editingProduct && form.existingImages.length > 0 && (
                                <p className="text-xs text-text-secondary mt-1">
                                    {form.existingImages.length} existing image(s). Upload new ones to add/replace.
                                </p>
                            )}
                        </div>
                        <input type="text" placeholder='Tags: "New Arrival, Bestseller" (comma-separated)'
                            value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                            className="sm:col-span-2 p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold text-sm"
                        />
                        <input type="text" placeholder='Sizes available: "S, M, L, XL, XXL" (comma-separated)'
                            value={form.sizes} onChange={e => setForm({ ...form, sizes: e.target.value })}
                            className="sm:col-span-2 p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold text-sm"
                        />
                        <div className="sm:col-span-2 flex gap-3">
                            <button type="submit"
                                className="bg-accent-gold text-primary-bg px-5 py-2 text-sm font-bold hover:bg-yellow-500 transition-colors">
                                {editingProduct ? 'Update' : 'Create'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)}
                                className="px-5 py-2 text-sm border border-border-color hover:border-text-secondary transition-colors">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <p className="text-center py-12 text-text-secondary animate-pulse">Loading...</p>
            ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-sm min-w-[520px]">
                        <thead>
                            <tr className="border-b border-border-color text-text-secondary uppercase tracking-wider text-xs">
                                {['Product', 'Category', 'Price', 'Stock', 'Actions'].map(h => (
                                    <th key={h} className="text-left py-3 px-4">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p._id} className="border-b border-border-color hover:bg-secondary-bg/50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2">
                                            {p.images?.[0] && (
                                                <img src={p.images[0]} alt={p.name}
                                                    className="w-9 h-9 object-cover border border-border-color flex-shrink-0" />
                                            )}
                                            <span className="font-medium">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-text-secondary">{p.category}</td>
                                    <td className="py-3 px-4 text-accent-gold font-semibold">₹{p.price.toLocaleString('en-IN')}</td>
                                    <td className="py-3 px-4">
                                        <span className={p.stock > 0 ? 'text-green-400' : 'text-red-400'}>
                                            {p.stock}{p.stock === 0 ? ' (Out)' : ''}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditForm(p)}
                                                className="text-xs px-2 py-1 border border-accent-gold/40 text-accent-gold rounded hover:opacity-80">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(p._id, p.name)}
                                                className="text-xs px-2 py-1 border border-red-500/40 text-red-400 rounded hover:opacity-80">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {products.length === 0 && (
                        <p className="text-center py-12 text-text-secondary">No products yet.</p>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Main ShopkeeperDashboard ──────────────────────────────────
const ShopkeeperDashboard = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState('orders');

    const [counts, setCounts] = useState({ products: 0, orders: 0, pending: 0, outOfStock: 0 });
    useEffect(() => {
        Promise.all([api.get('/api/products'), api.get('/api/orders')]).then(([p, o]) => {
            setCounts({
                products: p.data.length,
                orders: o.data.length,
                pending: o.data.filter(x => x.orderStatus === 'pending').length,
                outOfStock: p.data.filter(x => x.stock === 0).length,
            });
        }).catch(() => { });
    }, [tab]);

    return (
        <div className="container mx-auto py-6 px-4 max-w-7xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-serif"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Shopkeeper Dashboard
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">Welcome, {user?.name}</p>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 text-xs font-bold border
                    rounded uppercase bg-purple-500/20 text-purple-400 border-purple-500/40">
                    Shopkeeper
                </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {[
                    { label: 'Total Orders', value: counts.orders, color: 'text-blue-400' },
                    { label: 'Pending', value: counts.pending, color: 'text-yellow-400' },
                    { label: 'Total Products', value: counts.products, color: 'text-accent-gold' },
                    { label: 'Out of Stock', value: counts.outOfStock, color: 'text-red-400' },
                ].map(s => (
                    <div key={s.label} className="bg-secondary-bg border border-border-color p-4 text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-text-secondary mt-1 uppercase tracking-wider">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-color mb-6 overflow-x-auto">
                <Tab label="Orders" active={tab === 'orders'} onClick={() => setTab('orders')}
                    badge={counts.pending} />
                <Tab label="Products" active={tab === 'products'} onClick={() => setTab('products')} />
            </div>

            {tab === 'orders' && <OrdersPanel />}
            {tab === 'products' && <ProductsPanel user={user} />}
        </div>
    );
};

export default ShopkeeperDashboard;