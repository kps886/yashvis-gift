import express from 'express';
import Order   from '../models/Order.js';
import Product from '../models/Product.js';
import User    from '../models/User.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Full analytics summary
// @route   GET /api/analytics
// @access  Private/Admin
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const now        = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const last7Start = new Date(now - 7  * 24 * 60 * 60 * 1000);
        const last30Start = new Date(now - 30 * 24 * 60 * 60 * 1000);

        const [allOrders, allUsers, allProducts] = await Promise.all([
            Order.find({ paymentStatus: 'paid' }).sort({ createdAt: 1 }),
            User.find({}),
            Product.find({}),
        ]);

        // ── Summary cards ─────────────────────────────────────
        const totalRevenue  = allOrders.reduce((a, o) => a + o.total, 0);
        const todayRevenue  = allOrders
            .filter(o => o.paidAt >= todayStart)
            .reduce((a, o) => a + o.total, 0);
        const monthRevenue  = allOrders
            .filter(o => o.paidAt >= monthStart)
            .reduce((a, o) => a + o.total, 0);
        const totalOrders   = allOrders.length;
        const todayOrders   = allOrders.filter(o => o.createdAt >= todayStart).length;

        // All orders (including unpaid) for status breakdown
        const allOrdersAll  = await Order.find({});
        const statusCounts  = {
            pending:    allOrdersAll.filter(o => o.orderStatus === 'pending').length,
            processing: allOrdersAll.filter(o => o.orderStatus === 'processing').length,
            shipped:    allOrdersAll.filter(o => o.orderStatus === 'shipped').length,
            delivered:  allOrdersAll.filter(o => o.orderStatus === 'delivered').length,
            cancelled:  allOrdersAll.filter(o => o.orderStatus === 'cancelled').length,
        };

        // ── Revenue by day (last 30 days) ─────────────────────
        const revenueByDay = {};
        for (let i = 29; i >= 0; i--) {
            const d   = new Date(now - i * 24 * 60 * 60 * 1000);
            const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            revenueByDay[key] = 0;
        }
        allOrders
            .filter(o => o.paidAt >= last30Start)
            .forEach(o => {
                const key = new Date(o.paidAt)
                    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                if (revenueByDay[key] !== undefined) {
                    revenueByDay[key] += o.total;
                }
            });

        const revenueChart = Object.entries(revenueByDay).map(([date, revenue]) => ({
            date, revenue,
        }));

        // ── Orders by day (last 7 days) ───────────────────────
        const ordersByDay = {};
        for (let i = 6; i >= 0; i--) {
            const d   = new Date(now - i * 24 * 60 * 60 * 1000);
            const key = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
            ordersByDay[key] = 0;
        }
        allOrdersAll
            .filter(o => new Date(o.createdAt) >= last7Start)
            .forEach(o => {
                const key = new Date(o.createdAt)
                    .toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
                if (ordersByDay[key] !== undefined) ordersByDay[key]++;
            });

        const ordersChart = Object.entries(ordersByDay).map(([date, orders]) => ({
            date, orders,
        }));

        // ── Top selling products ──────────────────────────────
        const productSales = {};
        allOrders.forEach(order => {
            order.items.forEach(item => {
                const id = item.product?.toString() || item.name;
                if (!productSales[id]) {
                    productSales[id] = { name: item.name, qty: 0, revenue: 0 };
                }
                productSales[id].qty     += item.quantity;
                productSales[id].revenue += item.price * item.quantity;
            });
        });
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 8);

        // ── Category revenue breakdown ────────────────────────
        const categoryRevenue = {};
        allOrders.forEach(order => {
            order.items.forEach(item => {
                const product = allProducts.find(p => p._id.toString() === item.product?.toString());
                const cat     = product?.category || 'Other';
                categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.price * item.quantity;
            });
        });
        const categoryChart = Object.entries(categoryRevenue)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // ── New users over last 30 days ───────────────────────
        const usersByDay = {};
        for (let i = 29; i >= 0; i--) {
            const d   = new Date(now - i * 24 * 60 * 60 * 1000);
            const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            usersByDay[key] = 0;
        }
        allUsers
            .filter(u => new Date(u.createdAt) >= last30Start)
            .forEach(u => {
                const key = new Date(u.createdAt)
                    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                if (usersByDay[key] !== undefined) usersByDay[key]++;
            });
        const usersChart = Object.entries(usersByDay).map(([date, users]) => ({ date, users }));

        res.json({
            summary: {
                totalRevenue,
                todayRevenue,
                monthRevenue,
                totalOrders,
                todayOrders,
                totalUsers:    allUsers.length,
                totalProducts: allProducts.length,
                lowStock:      allProducts.filter(p => p.stock <= 5).length,
            },
            statusCounts,
            revenueChart,
            ordersChart,
            topProducts,
            categoryChart,
            usersChart,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Analytics error' });
    }
});

export default router;