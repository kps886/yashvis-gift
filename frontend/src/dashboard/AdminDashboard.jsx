import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

const ROLE_BADGE = {
    admin: 'bg-red-500/20 text-red-400 border-red-500/40',
    shopkeeper: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    employee: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    user: 'bg-green-500/20 text-green-400 border-green-500/40',
};

const AdminDashboard = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('users');
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'employee' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, productsRes] = await Promise.all([
                axios.get('/api/users'),
                axios.get('/api/products'),
            ]);
            setUsers(usersRes.data);
            setProducts(productsRes.data);
        } catch (err) {
            setError('Failed to load data');
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            await axios.post('/api/users/create', newUser);
            setSuccess(`User "${newUser.name}" created as ${newUser.role}`);
            setNewUser({ name: '', email: '', password: '', role: 'employee' });
            setShowCreateUser(false);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating user');
        }
    };

    const handleToggleActive = async (u) => {
        try {
            await axios.put(`/api/users/${u._id}`, { isActive: !u.isActive });
            fetchData();
        } catch (err) {
            setError('Failed to update user');
        }
    };

    const handleDeleteUser = async (id, name) => {
        if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
        try {
            await axios.delete(`/api/users/${id}`);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleDeleteProduct = async (id, name) => {
        if (!window.confirm(`Delete product "${name}"?`)) return;
        try {
            await axios.delete(`/api/products/${id}`);
            fetchData();
        } catch (err) {
            setError('Failed to delete product');
        }
    };

    const stats = {
        totalUsers: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        shopkeepers: users.filter(u => u.role === 'shopkeeper').length,
        employees: users.filter(u => u.role === 'employee').length,
        customers: users.filter(u => u.role === 'user').length,
        products: products.length,
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Admin Dashboard
                    </h1>
                    <p className="text-text-secondary mt-1">Welcome back, {user.name}</p>
                </div>
                <span className="px-3 py-1 text-xs font-bold border rounded uppercase bg-red-500/20 text-red-400 border-red-500/40">
                    Admin
                </span>
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 text-red-400 rounded text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/40 text-green-400 rounded text-sm">{success}</div>}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {[
                    { label: 'Total Users', value: stats.totalUsers },
                    { label: 'Admins', value: stats.admins },
                    { label: 'Shopkeepers', value: stats.shopkeepers },
                    { label: 'Employees', value: stats.employees },
                    { label: 'Customers', value: stats.customers },
                    { label: 'Products', value: stats.products },
                ].map(s => (
                    <div key={s.label} className="bg-secondary-bg border border-border-color p-4 text-center">
                        <p className="text-2xl font-bold text-accent-gold">{s.value}</p>
                        <p className="text-xs text-text-secondary mt-1 uppercase tracking-wider">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border-color mb-6">
                {['users', 'products'].map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-6 py-3 font-bold uppercase tracking-wider text-sm transition-colors capitalize ${
                            tab === t
                                ? 'border-b-2 border-accent-gold text-accent-gold'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-center py-12 text-text-secondary">Loading...</p>
            ) : tab === 'users' ? (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">All Users ({users.length})</h2>
                        <button
                            onClick={() => setShowCreateUser(!showCreateUser)}
                            className="bg-accent-gold text-primary-bg px-4 py-2 text-sm font-bold uppercase hover:bg-yellow-500 transition-colors"
                        >
                            + Create User
                        </button>
                    </div>

                    {showCreateUser && (
                        <div className="bg-secondary-bg border border-border-color p-6 mb-6">
                            <h3 className="font-bold mb-4">Create New User</h3>
                            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    required type="text" placeholder="Full Name"
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    className="p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold"
                                />
                                <input
                                    required type="email" placeholder="Email"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    className="p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold"
                                />
                                <input
                                    required type="password" placeholder="Password (min 6 chars)"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    className="p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold"
                                />
                                <select
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    className="p-2 bg-primary-bg border border-border-color rounded focus:outline-none focus:border-accent-gold"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="shopkeeper">Shopkeeper</option>
                                    <option value="employee">Employee</option>
                                    <option value="user">End User</option>
                                </select>
                                <div className="md:col-span-2 flex gap-3">
                                    <button type="submit" className="bg-accent-gold text-primary-bg px-6 py-2 font-bold hover:bg-yellow-500 transition-colors">
                                        Create
                                    </button>
                                    <button type="button" onClick={() => setShowCreateUser(false)} className="px-6 py-2 border border-border-color hover:border-text-secondary transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border-color text-text-secondary uppercase tracking-wider text-xs">
                                    <th className="text-left py-3 px-4">Name</th>
                                    <th className="text-left py-3 px-4">Email</th>
                                    <th className="text-left py-3 px-4">Role</th>
                                    <th className="text-left py-3 px-4">Status</th>
                                    <th className="text-left py-3 px-4">Joined</th>
                                    <th className="text-left py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id} className="border-b border-border-color hover:bg-secondary-bg/50 transition-colors">
                                        <td className="py-3 px-4 font-medium">{u.name}</td>
                                        <td className="py-3 px-4 text-text-secondary">{u.email}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-0.5 text-xs font-bold border rounded uppercase ${ROLE_BADGE[u.role]}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-0.5 text-xs rounded ${u.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                                {u.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-text-secondary">
                                            {new Date(u.createdAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                {u._id !== user._id && (
                                                    <>
                                                        <button
                                                            onClick={() => handleToggleActive(u)}
                                                            className={`text-xs px-2 py-1 border rounded hover:opacity-80 transition-opacity ${
                                                                u.isActive
                                                                    ? 'border-orange-500/40 text-orange-400'
                                                                    : 'border-green-500/40 text-green-400'
                                                            }`}
                                                        >
                                                            {u.isActive ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(u._id, u.name)}
                                                            className="text-xs px-2 py-1 border border-red-500/40 text-red-400 rounded hover:opacity-80 transition-opacity"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                                {u._id === user._id && (
                                                    <span className="text-xs text-text-secondary italic">You</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <>
                    <h2 className="text-xl font-semibold mb-4">All Products ({products.length})</h2>
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
                                        <td className="py-3 px-4 font-medium">{p.name}</td>
                                        <td className="py-3 px-4 text-text-secondary">{p.category}</td>
                                        <td className="py-3 px-4 text-accent-gold">₹{p.price.toLocaleString('en-IN')}</td>
                                        <td className="py-3 px-4">
                                            <span className={p.stock > 0 ? 'text-green-400' : 'text-red-400'}>
                                                {p.stock}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => handleDeleteProduct(p._id, p.name)}
                                                className="text-xs px-2 py-1 border border-red-500/40 text-red-400 rounded hover:opacity-80 transition-opacity"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
