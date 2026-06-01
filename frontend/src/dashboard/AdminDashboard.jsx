import React, { useState, useEffect, useCallback } from 'react';
import api from './../api';
import { useAuth } from '../auth/AuthContext';
import AnalyticsDashboard from './AnalyticsDashboard';

const ROLE_BADGE = {
    admin: 'bg-red-500/20 text-red-400 border-red-500/40',
    shopkeeper: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    employee: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    user: 'bg-green-500/20 text-green-400 border-green-500/40',
};

const ORDER_STATUS_STYLES = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    processing: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    delivered: 'bg-green-500/20 text-green-400 border-green-500/40',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/40',
};

// ── Stat card ─────────────────────────────────────────────────
const Stat = ({ label, value, color = 'text-accent-gold' }) => (
    <div className="bg-secondary-bg border border-border-color p-4 text-center">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-text-secondary mt-1 uppercase tracking-wider">{label}</p>
    </div>
);

// ── Tab button ────────────────────────────────────────────────
const Tab = ({ label, active, onClick, badge }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wider
            transition-colors border-b-2 whitespace-nowrap ${active
                ? 'border-accent-gold text-accent-gold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
    >
        {label}
        {badge > 0 && (
            <span className="bg-accent-gold text-primary-bg text-xs font-bold rounded-full
                px-1.5 py-0.5 leading-none">
                {badge}
            </span>
        )}
    </button>
);

// ─────────────────────────────────────────────────────────────
// Sub-panels
// ─────────────────────────────────────────────────────────────

// ── Users panel ───────────────────────────────────────────────
const UsersPanel = ({ currentUserId }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'employee' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [page, setPage] = useState(1);         // <-- NEW
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/api/users?page=${page}&limit=20`);
            setUsers(data.users);
            setTotalPages(data.pages);
        } catch { setError('Failed to load users'); }
        setLoading(false);
    }, [page]);
    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            await api.post('/api/users/create', newUser);
            setSuccess(`User "${newUser.name}" created as ${newUser.role}`);
            setNewUser({ name: '', email: '', password: '', role: 'employee' });
            setShowForm(false);
            fetchUsers();
        } catch (err) { setError(err.response?.data?.message || 'Error creating user'); }
    };

    const handleToggle = async (u) => {
        try {
            await api.put(`/api/users/${u._id}`, { isActive: !u.isActive });
            fetchUsers();
        } catch { setError('Failed to update user'); }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            await api.delete(`/api/users/${id}`);
            fetchUsers();
        } catch (err) { setError(err.response?.data?.message || 'Failed to delete'); }
    };

    return (
        <div>
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 text-red-400 rounded text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/40 text-green-400 rounded text-sm">{success}</div>}

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">All Users ({users.length})</h2>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="bg-accent-gold text-primary-bg px-4 py-2 text-sm font-bold
                        uppercase hover:bg-yellow-500 transition-colors"
                >
                    + Create User
                </button>
            </div>

            {showForm && (
                <div className="bg-secondary-bg border border-border-color p-5 mb-5">
                    <h3 className="font-bold mb-4 text-sm uppercase tracking-wider">New User</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { ph: 'Full Name', key: 'name', type: 'text' },
                            { ph: 'Email', key: 'email', type: 'email' },
                            { ph: 'Password (min 6)', key: 'password', type: 'password' },
                        ].map(f => (
                            <input key={f.key} required type={f.type} placeholder={f.ph}
                                value={newUser[f.key]}
                                onChange={e => setNewUser({ ...newUser, [f.key]: e.target.value })}
                                className="p-2 bg-primary-bg border border-border-color rounded
                                    focus:outline-none focus:border-accent-gold text-sm"
                            />
                        ))}
                        <select value={newUser.role}
                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                            className="p-2 bg-primary-bg border border-border-color rounded
                                focus:outline-none focus:border-accent-gold text-sm"
                        >
                            {['admin', 'shopkeeper', 'employee', 'user'].map(r => (
                                <option key={r} value={r} className="capitalize">{r}</option>
                            ))}
                        </select>
                        <div className="sm:col-span-2 flex gap-3">
                            <button type="submit"
                                className="bg-accent-gold text-primary-bg px-5 py-2 text-sm
                                    font-bold hover:bg-yellow-500 transition-colors">
                                Create
                            </button>
                            <button type="button" onClick={() => setShowForm(false)}
                                className="px-5 py-2 text-sm border border-border-color
                                    hover:border-text-secondary transition-colors">
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
                    <table className="w-full text-sm min-w-[600px]">
                        <thead>
                            <tr className="border-b border-border-color text-text-secondary
                                uppercase tracking-wider text-xs">
                                {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                                    <th key={h} className="text-left py-3 px-4">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id} className="border-b border-border-color
                                    hover:bg-secondary-bg/50 transition-colors">
                                    <td className="py-3 px-4 font-medium">{u.name}</td>
                                    <td className="py-3 px-4 text-text-secondary text-xs">{u.email}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-0.5 text-xs font-bold border
                                            rounded uppercase ${ROLE_BADGE[u.role]}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`text-xs font-semibold ${u.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                            {u.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-text-secondary text-xs">
                                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="py-3 px-4">
                                        {u._id !== currentUserId ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleToggle(u)}
                                                    className={`text-xs px-2 py-1 border rounded
                                                        hover:opacity-80 transition-opacity ${u.isActive
                                                            ? 'border-orange-500/40 text-orange-400'
                                                            : 'border-green-500/40 text-green-400'
                                                        }`}>
                                                    {u.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button onClick={() => handleDelete(u._id, u.name)}
                                                    className="text-xs px-2 py-1 border border-red-500/40
                                                        text-red-400 rounded hover:opacity-80">
                                                    Delete
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-text-secondary italic">You</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center mt-4 p-4 border-t border-border-color">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border border-border-color text-sm font-semibold hover:border-accent-gold disabled:opacity-50">Previous</button>
                            <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-border-color text-sm font-semibold hover:border-accent-gold disabled:opacity-50">Next</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ── Orders panel ──────────────────────────────────────────────
const OrdersPanel = () => {
    const [orders, setOrders] = useState([]);
    const [page, setPage] = useState(1);         // <-- NEW
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [statusEdit, setStatusEdit] = useState({});   // { [orderId]: { status, tracking } }
    const [updating, setUpdating] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filter, setFilter] = useState('all');

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/api/orders?page=${page}&limit=20&status=${filter}`);
            setOrders(data.orders);
            setTotalPages(data.pages);
        } catch { setError('Failed to load orders'); }
        setLoading(false);
    }, [page, filter]);
    useEffect(() => { setPage(1); }, [filter]);
    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleUpdateStatus = async (orderId) => {
        const edit = statusEdit[orderId];
        if (!edit?.status) return;
        setUpdating(orderId);
        setError(''); setSuccess('');
        try {
            await api.put(`/api/orders/${orderId}/status`, {
                orderStatus: edit.status,
                trackingNumber: edit.tracking || undefined,
            });
            setSuccess('Order status updated');
            setStatusEdit(prev => { const n = { ...prev }; delete n[orderId]; return n; });
            fetchOrders();
        } catch (err) { setError(err.response?.data?.message || 'Update failed'); }
        setUpdating(null);
    };

    const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    const filtered = filter === 'all' ? orders : orders.filter(o => o.orderStatus === filter);

    return (
        <div>
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 text-red-400 rounded text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/40 text-green-400 rounded text-sm">{success}</div>}

            {/* Filter bar */}
            <div className="flex gap-2 flex-wrap mb-5">
                {['all', ...STATUSES].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`px-3 py-1.5 text-xs font-bold uppercase rounded border transition-colors ${filter === s
                            ? 'bg-accent-gold text-primary-bg border-accent-gold'
                            : 'border-border-color text-text-secondary hover:border-text-secondary'
                            }`}>
                        {s} {s === 'all' ? `(${orders.length})` : `(${orders.filter(o => o.orderStatus === s).length})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-center py-12 text-text-secondary animate-pulse">Loading orders...</p>
            ) : filtered.length === 0 ? (
                <p className="text-center py-12 text-text-secondary">No orders found.</p>
            ) : (
                <div className="space-y-3">
                    {orders.map(order => (
                        <div key={order._id}
                            className="bg-secondary-bg border border-border-color overflow-hidden">
                            {/* Row header */}
                            <div
                                className="p-4 flex flex-col sm:flex-row sm:items-center
                                    justify-between gap-3 cursor-pointer hover:bg-primary-bg/40
                                    transition-colors"
                                onClick={() =>
                                    setExpanded(expanded === order._id ? null : order._id)
                                }
                            >
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                                    <span className="font-mono font-semibold text-xs">
                                        #{order._id.slice(-8).toUpperCase()}
                                    </span>
                                    <span className="text-text-secondary">
                                        {order.user?.name || '—'} · {order.user?.email || '—'}
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

                            {/* Expanded detail */}
                            {expanded === order._id && (
                                <div className="border-t border-border-color p-4 space-y-5">
                                    {/* Items */}
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider
                                            text-text-secondary mb-3">Items</p>
                                        <div className="space-y-2">
                                            {order.items.map((item, i) => (
                                                <div key={i} className="flex items-center gap-3 text-sm">
                                                    <img
                                                        src={item.image || 'https://placehold.co/40x40/222/D4AF37?text=C'}
                                                        alt={item.name}
                                                        className="w-10 h-10 object-cover border
                                                            border-border-color flex-shrink-0"
                                                    />
                                                    <div className="flex-grow">
                                                        <p className="font-semibold">{item.name}</p>
                                                        <p className="text-xs text-text-secondary">
                                                            Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                                                        </p>
                                                    </div>
                                                    <p className="font-bold flex-shrink-0">
                                                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Price + address */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="bg-primary-bg p-3 rounded text-xs space-y-1">
                                            <p className="font-bold text-sm mb-2">Price Breakdown</p>
                                            <div className="flex justify-between text-text-secondary">
                                                <span>Subtotal</span>
                                                <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between text-text-secondary">
                                                <span>Delivery</span>
                                                <span className={order.deliveryFee === 0 ? 'text-green-400' : ''}>
                                                    {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}
                                                </span>
                                            </div>
                                            {order.discount > 0 && (
                                                <div className="flex justify-between text-green-400">
                                                    <span>Promo ({order.promoCode})</span>
                                                    <span>−₹{order.discount}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-bold pt-1 border-t border-border-color">
                                                <span>Total</span>
                                                <span className="text-accent-gold">
                                                    ₹{order.total.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-primary-bg p-3 rounded text-xs">
                                            <p className="font-bold text-sm mb-2">Ship To</p>
                                            <p className="font-semibold">{order.shippingAddress.fullName}</p>
                                            <p className="text-text-secondary">
                                                {order.shippingAddress.line1}
                                                {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}
                                            </p>
                                            <p className="text-text-secondary">
                                                {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                                            </p>
                                            <p className="text-text-secondary mt-1">
                                                {order.shippingAddress.phone}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status updater */}
                                    {order.orderStatus !== 'delivered' &&
                                        order.orderStatus !== 'cancelled' && (
                                            <div
                                                className="p-4 rounded"
                                                style={{
                                                    backgroundColor: 'var(--primary-bg)',
                                                    border: '1px solid var(--border-color)'
                                                }}
                                            >
                                                <p className="text-xs font-bold uppercase tracking-wider
                                                text-text-secondary mb-3">
                                                    Update Order Status
                                                </p>
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <select
                                                        value={statusEdit[order._id]?.status || order.orderStatus}
                                                        onChange={e => setStatusEdit(prev => ({
                                                            ...prev,
                                                            [order._id]: {
                                                                ...prev[order._id],
                                                                status: e.target.value,
                                                            },
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
                                                            [order._id]: {
                                                                ...prev[order._id],
                                                                tracking: e.target.value,
                                                            },
                                                        }))}
                                                        className="flex-1 p-2 bg-secondary-bg border
                                                        border-border-color rounded text-sm
                                                        focus:outline-none focus:border-accent-gold"
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateStatus(order._id)}
                                                        disabled={updating === order._id}
                                                        className="px-5 py-2 bg-accent-gold text-primary-bg
                                                        font-bold text-sm hover:bg-yellow-500
                                                        transition-colors disabled:opacity-50 rounded"
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
            {!loading && totalPages > 1 && (
                <div className="flex justify-between items-center mt-6 p-4 bg-secondary-bg border border-border-color rounded">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border border-border-color text-sm font-semibold hover:border-accent-gold disabled:opacity-50">Previous</button>
                    <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-border-color text-sm font-semibold hover:border-accent-gold disabled:opacity-50">Next</button>
                </div>
            )}
        </div>
    );
};

// ── Promo codes panel ─────────────────────────────────────────
const PromoPanel = () => {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        code: '', discountType: 'flat', discountValue: '',
        maxDiscountAmount: '', minOrderValue: '', expiresAt: '',
        usageLimit: '', isActive: true,
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchPromos = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/api/promo');
            setPromos(data);
        } catch { setError('Failed to load promo codes'); }
        setLoading(false);
    };
    useEffect(() => { fetchPromos(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        const payload = {
            ...form,
            discountValue: Number(form.discountValue),
            minOrderValue: Number(form.minOrderValue) || 0,
            maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
            usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
            expiresAt: form.expiresAt || null,
        };
        try {
            await api.post('/api/promo', payload);
            setSuccess(`Promo code "${form.code}" created`);
            setForm({
                code: '', discountType: 'flat', discountValue: '',
                maxDiscountAmount: '', minOrderValue: '', expiresAt: '',
                usageLimit: '', isActive: true,
            });
            setShowForm(false);
            fetchPromos();
        } catch (err) { setError(err.response?.data?.message || 'Error creating promo'); }
    };

    const handleToggle = async (p) => {
        try {
            await api.put(`/api/promo/${p._id}`, { isActive: !p.isActive });
            fetchPromos();
        } catch { setError('Failed to update'); }
    };

    const handleDelete = async (id, code) => {
        if (!window.confirm(`Delete promo code "${code}"?`)) return;
        try {
            await api.delete(`/api/promo/${id}`);
            fetchPromos();
        } catch { setError('Failed to delete'); }
    };

    return (
        <div>
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 text-red-400 rounded text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/40 text-green-400 rounded text-sm">{success}</div>}

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Promo Codes ({promos.length})</h2>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="bg-accent-gold text-primary-bg px-4 py-2 text-sm font-bold
                        uppercase hover:bg-yellow-500 transition-colors"
                >
                    + New Code
                </button>
            </div>

            {showForm && (
                <div className="bg-secondary-bg border border-border-color p-5 mb-5">
                    <h3 className="font-bold mb-4 text-sm uppercase tracking-wider">Create Promo Code</h3>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input required type="text" placeholder="Code (e.g. SAVE50)"
                            value={form.code}
                            onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                            className="p-2 bg-primary-bg border border-border-color rounded
                                focus:outline-none focus:border-accent-gold text-sm uppercase tracking-widest"
                        />
                        <select value={form.discountType}
                            onChange={e => setForm({ ...form, discountType: e.target.value })}
                            className="p-2 bg-primary-bg border border-border-color rounded
                                focus:outline-none focus:border-accent-gold text-sm"
                        >
                            <option value="flat">Flat (₹ off)</option>
                            <option value="percent">Percent (% off)</option>
                        </select>
                        <input required type="number" min="1"
                            placeholder={form.discountType === 'flat' ? 'Amount off (₹)' : 'Percent off (%)'}
                            value={form.discountValue}
                            onChange={e => setForm({ ...form, discountValue: e.target.value })}
                            className="p-2 bg-primary-bg border border-border-color rounded
                                focus:outline-none focus:border-accent-gold text-sm"
                        />
                        <input type="number" min="0"
                            placeholder="Min order value (₹) — optional"
                            value={form.minOrderValue}
                            onChange={e => setForm({ ...form, minOrderValue: e.target.value })}
                            className="p-2 bg-primary-bg border border-border-color rounded
                                focus:outline-none focus:border-accent-gold text-sm"
                        />
                        {form.discountType === 'percent' && (
                            <input type="number" min="1"
                                placeholder="Max discount cap (₹) — optional"
                                value={form.maxDiscountAmount}
                                onChange={e => setForm({ ...form, maxDiscountAmount: e.target.value })}
                                className="p-2 bg-primary-bg border border-border-color rounded
                                    focus:outline-none focus:border-accent-gold text-sm"
                            />
                        )}
                        <input type="number" min="1"
                            placeholder="Usage limit — optional (blank = unlimited)"
                            value={form.usageLimit}
                            onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                            className="p-2 bg-primary-bg border border-border-color rounded
                                focus:outline-none focus:border-accent-gold text-sm"
                        />
                        <div>
                            <label className="block text-xs text-text-secondary mb-1">
                                Expiry Date (optional)
                            </label>
                            <input type="date"
                                value={form.expiresAt}
                                onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                                className="w-full p-2 bg-primary-bg border border-border-color rounded
                                    focus:outline-none focus:border-accent-gold text-sm"
                            />
                        </div>
                        <div className="sm:col-span-2 flex gap-3">
                            <button type="submit"
                                className="bg-accent-gold text-primary-bg px-5 py-2 text-sm
                                    font-bold hover:bg-yellow-500 transition-colors">
                                Create
                            </button>
                            <button type="button" onClick={() => setShowForm(false)}
                                className="px-5 py-2 text-sm border border-border-color
                                    hover:border-text-secondary transition-colors">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <p className="text-center py-12 text-text-secondary animate-pulse">Loading...</p>
            ) : promos.length === 0 ? (
                <p className="text-center py-12 text-text-secondary">No promo codes yet.</p>
            ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-sm min-w-[640px]">
                        <thead>
                            <tr className="border-b border-border-color text-text-secondary
                                uppercase tracking-wider text-xs">
                                {['Code', 'Type', 'Value', 'Min Order', 'Usage', 'Expires', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="text-left py-3 px-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {promos.map(p => (
                                <tr key={p._id} className="border-b border-border-color
                                    hover:bg-secondary-bg/50 transition-colors">
                                    <td className="py-3 px-3 font-mono font-bold tracking-widest text-accent-gold">
                                        {p.code}
                                    </td>
                                    <td className="py-3 px-3 capitalize text-text-secondary">
                                        {p.discountType}
                                    </td>
                                    <td className="py-3 px-3 font-semibold">
                                        {p.discountType === 'flat'
                                            ? `₹${p.discountValue}`
                                            : `${p.discountValue}%${p.maxDiscountAmount ? ` (max ₹${p.maxDiscountAmount})` : ''}`
                                        }
                                    </td>
                                    <td className="py-3 px-3 text-text-secondary">
                                        {p.minOrderValue > 0 ? `₹${p.minOrderValue}` : '—'}
                                    </td>
                                    <td className="py-3 px-3 text-text-secondary">
                                        {p.usedCount}/{p.usageLimit ?? '∞'}
                                    </td>
                                    <td className="py-3 px-3 text-text-secondary text-xs">
                                        {p.expiresAt
                                            ? new Date(p.expiresAt).toLocaleDateString('en-IN')
                                            : 'Never'}
                                    </td>
                                    <td className="py-3 px-3">
                                        <span className={`text-xs font-semibold ${p.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                            {p.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleToggle(p)}
                                                className={`text-xs px-2 py-1 border rounded
                                                    hover:opacity-80 transition-opacity ${p.isActive
                                                        ? 'border-orange-500/40 text-orange-400'
                                                        : 'border-green-500/40 text-green-400'
                                                    }`}>
                                                {p.isActive ? 'Disable' : 'Enable'}
                                            </button>
                                            <button onClick={() => handleDelete(p._id, p.code)}
                                                className="text-xs px-2 py-1 border border-red-500/40
                                                    text-red-400 rounded hover:opacity-80">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ── Products panel (kept simple for admin) ────────────────────
const ProductsPanel = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/api/products')
            .then(r => {
                setProducts(r.data.products); setLoading(false);
            })
            .catch(() => { setError('Failed to load'); setLoading(false); });
    }, []);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            await api.delete(`/api/products/${id}`);
            setProducts(p => p.filter(x => x._id !== id));
        } catch { setError('Failed to delete'); }
    };

    return (
        <div>
            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 text-red-400 rounded text-sm">{error}</div>}
            <h2 className="text-lg font-semibold mb-4">All Products ({products.length})</h2>
            {loading ? (
                <p className="text-center py-12 text-text-secondary animate-pulse">Loading...</p>
            ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-sm min-w-[500px]">
                        <thead>
                            <tr className="border-b border-border-color text-text-secondary
                                uppercase tracking-wider text-xs">
                                {['Product', 'Category', 'Price', 'Stock', 'Actions'].map(h => (
                                    <th key={h} className="text-left py-3 px-4">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p._id} className="border-b border-border-color
                                    hover:bg-secondary-bg/50 transition-colors">
                                    <td className="py-3 px-4 font-medium">{p.name}</td>
                                    <td className="py-3 px-4 text-text-secondary">{p.category}</td>
                                    <td className="py-3 px-4 text-accent-gold">
                                        ₹{p.price.toLocaleString('en-IN')}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={p.stock > 0 ? 'text-green-400' : 'text-red-400'}>
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <button onClick={() => handleDelete(p._id, p.name)}
                                            className="text-xs px-2 py-1 border border-red-500/40
                                                text-red-400 rounded hover:opacity-80">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Main Admin Dashboard
// ─────────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState('analytics');
    const [counts, setCounts] = useState({ users: 0, orders: 0, products: 0, promos: 0 });

    useEffect(() => {
        const load = async () => {
            try {
                // Instantly grab heavy counts from analytics, and fetch the (small) promos array
                const [analyticsRes, promosRes] = await Promise.all([
                    api.get('/api/analytics'),
                    api.get('/api/promo')
                ]);

                const data = analyticsRes.data;

                setCounts({
                    users: data.summary.totalUsers,
                    orders: data.summary.totalOrders,
                    products: data.summary.totalProducts,
                    promos: promosRes.data.length,
                    pending: data.statusCounts.pending,
                    revenue: data.summary.totalRevenue,
                });
            } catch { /* silent */ }
        };
        load();
    }, [tab]);

    return (
        <div className="container mx-auto py-6 px-4 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-serif"
                        style={{ fontFamily: "'Playfair Display', serif" }}>
                        Admin Dashboard
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">Welcome back, {user.name}</p>
                </div>
                <span className={`self-start sm:self-auto px-3 py-1 text-xs font-bold border
                    rounded uppercase ${ROLE_BADGE.admin}`}>
                    Admin
                </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
                <Stat label="Total Revenue"
                    value={`₹${(counts.revenue || 0).toLocaleString('en-IN')}`}
                    color="text-accent-gold" />
                <Stat label="Total Orders" value={counts.orders} color="text-blue-400" />
                <Stat label="Pending Orders" value={counts.pending || 0} color="text-yellow-400" />
                <Stat label="Products" value={counts.products} color="text-purple-400" />
                <Stat label="Users" value={counts.users} color="text-green-400" />
                <Stat label="Promo Codes" value={counts.promos} color="text-pink-400" />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-color mb-6 overflow-x-auto gap-0">
                <Tab label="Analytics" active={tab === 'analytics'} onClick={() => setTab('analytics')} />
                <Tab label="Orders" active={tab === 'orders'} onClick={() => setTab('orders')}
                    badge={counts.pending} />
                <Tab label="Users" active={tab === 'users'} onClick={() => setTab('users')} />
                <Tab label="Products" active={tab === 'products'} onClick={() => setTab('products')} />
                <Tab label="Promo Codes" active={tab === 'promos'} onClick={() => setTab('promos')} />
            </div>

            {/* Panel */}
            {tab === 'analytics' && <AnalyticsDashboard />}
            {tab === 'orders' && <OrdersPanel />}
            {tab === 'users' && <UsersPanel currentUserId={user._id} />}
            {tab === 'products' && <ProductsPanel />}
            {tab === 'promos' && <PromoPanel />}
        </div>
    );
};

export default AdminDashboard;