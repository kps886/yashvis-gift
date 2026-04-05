import React, { useState, useEffect } from 'react';
import api from '../api';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const GOLD    = '#D4AF37';
const COLORS  = ['#D4AF37','#60a5fa','#a78bfa','#34d399','#f87171','#fb923c','#e879f9'];

const Card = ({ label, value, sub, color = 'text-accent-gold' }) => (
    <div className="bg-secondary-bg border border-border-color p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-1">
            {label}
        </p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
    </div>
);

const SectionTitle = ({ children }) => (
    <h3 className="text-base font-bold uppercase tracking-wider text-text-secondary mb-4">
        {children}
    </h3>
);

const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-secondary-bg border border-border-color p-3 text-xs shadow-lg">
            <p className="font-bold mb-1 text-text-primary">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color || GOLD }}>
                    {p.name}: {prefix}{typeof p.value === 'number'
                        ? p.value.toLocaleString('en-IN') : p.value}
                </p>
            ))}
        </div>
    );
};

const AnalyticsDashboard = () => {
    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState('');

    useEffect(() => {
        api.get('/api/analytics')
            .then(r => { setData(r.data); setLoading(false); })
            .catch(() => { setError('Failed to load analytics'); setLoading(false); });
    }, []);

    if (loading) return (
        <div className="text-center py-20 text-text-secondary animate-pulse">
            Loading analytics...
        </div>
    );
    if (error) return (
        <div className="text-center py-20 text-red-400">{error}</div>
    );

    const { summary, statusCounts, revenueChart, ordersChart,
            topProducts, categoryChart, usersChart } = data;

    // Status pie data
    const statusPie = Object.entries(statusCounts)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }));

    return (
        <div className="space-y-8">
            {/* ── Summary cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card label="Total Revenue"
                    value={`₹${summary.totalRevenue.toLocaleString('en-IN')}`}
                    sub={`₹${summary.monthRevenue.toLocaleString('en-IN')} this month`}
                    color="text-accent-gold" />
                <Card label="Total Orders"
                    value={summary.totalOrders}
                    sub={`${summary.todayOrders} today`}
                    color="text-blue-400" />
                <Card label="Customers"
                    value={summary.totalUsers}
                    color="text-green-400" />
                <Card label="Low Stock"
                    value={summary.lowStock}
                    sub="products ≤ 5 units"
                    color={summary.lowStock > 0 ? 'text-red-400' : 'text-green-400'} />
            </div>

            {/* ── Revenue line chart ── */}
            <div className="bg-secondary-bg border border-border-color p-5">
                <SectionTitle>Revenue — Last 30 Days</SectionTitle>
                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={revenueChart}
                        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3"
                            stroke="var(--border-color)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#999' }}
                            interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: '#999' }}
                            tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip prefix="₹" />} />
                        <Line type="monotone" dataKey="revenue" name="Revenue"
                            stroke={GOLD} strokeWidth={2} dot={false}
                            activeDot={{ r: 4, fill: GOLD }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* ── Orders + Users row ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Orders bar */}
                <div className="bg-secondary-bg border border-border-color p-5">
                    <SectionTitle>Orders — Last 7 Days</SectionTitle>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={ordersChart}
                            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3"
                                stroke="var(--border-color)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#999' }} />
                            <YAxis allowDecimals={false}
                                tick={{ fontSize: 10, fill: '#999' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="orders" name="Orders" fill={GOLD}
                                radius={[3,3,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* New users line */}
                <div className="bg-secondary-bg border border-border-color p-5">
                    <SectionTitle>New Customers — Last 30 Days</SectionTitle>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={usersChart}
                            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3"
                                stroke="var(--border-color)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#999' }}
                                interval="preserveStartEnd" />
                            <YAxis allowDecimals={false}
                                tick={{ fontSize: 10, fill: '#999' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="users" name="New Users"
                                stroke="#60a5fa" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Top products + Status pie ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Top products bar */}
                <div className="bg-secondary-bg border border-border-color p-5">
                    <SectionTitle>Top Products by Revenue</SectionTitle>
                    {topProducts.length === 0 ? (
                        <p className="text-text-secondary text-sm text-center py-8">
                            No sales data yet
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                data={topProducts}
                                layout="vertical"
                                margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3"
                                    stroke="var(--border-color)" horizontal={false} />
                                <XAxis type="number"
                                    tick={{ fontSize: 10, fill: '#999' }}
                                    tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="name" width={90}
                                    tick={{ fontSize: 10, fill: '#999' }}
                                    tickFormatter={v => v.length > 12 ? v.slice(0, 12) + '…' : v} />
                                <Tooltip content={<CustomTooltip prefix="₹" />} />
                                <Bar dataKey="revenue" name="Revenue" fill={GOLD}
                                    radius={[0,3,3,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Order status donut */}
                <div className="bg-secondary-bg border border-border-color p-5">
                    <SectionTitle>Orders by Status</SectionTitle>
                    {statusPie.length === 0 ? (
                        <p className="text-text-secondary text-sm text-center py-8">
                            No orders yet
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={statusPie} cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={85}
                                    dataKey="value" nameKey="name"
                                    paddingAngle={3}>
                                    {statusPie.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    formatter={(v) => (
                                        <span style={{ fontSize: 11, color: '#999',
                                            textTransform: 'capitalize' }}>
                                            {v}
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Category revenue ── */}
            {categoryChart.length > 0 && (
                <div className="bg-secondary-bg border border-border-color p-5">
                    <SectionTitle>Revenue by Category</SectionTitle>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={categoryChart}
                            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3"
                                stroke="var(--border-color)" />
                            <XAxis dataKey="name"
                                tick={{ fontSize: 10, fill: '#999' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#999' }}
                                tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip prefix="₹" />} />
                            <Bar dataKey="value" name="Revenue" radius={[3,3,0,0]}>
                                {categoryChart.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;