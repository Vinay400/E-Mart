import React, { useState, useEffect } from 'react';
import { db } from '../../../firebaseconfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { 
  FaMoneyBillWave, 
  FaShoppingCart, 
  FaChartLine, 
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaBox,
  FaStar
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import VendorHeader from './VendorHeader';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Order {
  id: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  items: {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    vendorId: string;
  }[];
}

interface EarningsData {
  totalEarnings: number;
  totalOrders: number;
  averageOrderValue: number;
  ordersByStatus: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  earningsByMonth: {
    [key: string]: number;
  };
}

interface TopProduct {
  name: string;
  revenue: number;
  quantity: number;
}

function Earnings() {
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    ordersByStatus: {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    },
    earningsByMonth: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [revenueGrowth, setRevenueGrowth] = useState(0);
  const [orderGrowth, setOrderGrowth] = useState(0);

  useEffect(() => {
    if (user) {
      fetchEarnings();
    }
  }, [user]);

  const fetchEarnings = async () => {
    try {
      if (!user) {
        setError('Please sign in to view earnings.');
        setLoading(false);
        return;
      }

      // Query orders collection
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(ordersRef);
      const querySnapshot = await getDocs(ordersQuery);

      if (querySnapshot.empty) {
        setEarnings({
          totalEarnings: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          ordersByStatus: {
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
          },
          earningsByMonth: {},
        });
        setTopProducts([]);
        setLoading(false);
        return;
      }

      const orders = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }))
        .filter(order => order.items?.some(item => item.vendorId === user.uid)) as Order[];

      // Calculate total earnings
      const totalEarnings = orders.reduce((sum, order) => {
        const vendorItemsTotal = order.items
          ?.filter(item => item.vendorId === user.uid)
          .reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0;
        return sum + vendorItemsTotal;
      }, 0);

      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalEarnings / totalOrders : 0;

      // Calculate orders by status
      const ordersByStatus = {
        pending: orders.filter(order => order.status === 'pending').length,
        processing: orders.filter(order => order.status === 'processing').length,
        shipped: orders.filter(order => order.status === 'shipped').length,
        delivered: orders.filter(order => order.status === 'delivered').length,
        cancelled: orders.filter(order => order.status === 'cancelled').length,
      };

      // Calculate earnings by month
      const earningsByMonth: { [key: string]: number } = {};
      orders.forEach(order => {
        if (order.status !== 'cancelled' && order.createdAt) {
          const month = order.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
          const vendorItemsTotal = order.items
            ?.filter(item => item.vendorId === user.uid)
            .reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
          earningsByMonth[month] = (earningsByMonth[month] || 0) + vendorItemsTotal;
        }
      });

      // Calculate top products
      const productMap = new Map<string, TopProduct>();
      orders.forEach(order => {
        order.items?.forEach(item => {
          if (item.vendorId === user.uid) {
            const revenue = item.price * item.quantity;
            if (productMap.has(item.name)) {
              const product = productMap.get(item.name)!;
              product.revenue += revenue;
              product.quantity += item.quantity;
            } else {
              productMap.set(item.name, {
                name: item.name,
                revenue,
                quantity: item.quantity,
              });
            }
          }
        });
      });

      const sortedProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopProducts(sortedProducts);
      setEarnings({
        totalEarnings,
        totalOrders,
        averageOrderValue,
        ordersByStatus,
        earningsByMonth,
      });

      // Calculate growth
      const now = new Date();
      const currentMonth = now.toLocaleString('default', { month: 'short', year: 'numeric' });
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toLocaleString('default', { month: 'short', year: 'numeric' });

      const currentRevenue = earningsByMonth[currentMonth] || 0;
      const lastRevenue = earningsByMonth[lastMonth] || 0;

      const revenueGrowth = lastRevenue === 0 ? 100 : ((currentRevenue - lastRevenue) / lastRevenue) * 100;
      const orderGrowthRate = ordersByStatus.pending > 0 ? 
        ((ordersByStatus.delivered - ordersByStatus.pending) / ordersByStatus.pending) * 100 : 0;

      setRevenueGrowth(revenueGrowth);
      setOrderGrowth(orderGrowthRate);

    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError('Failed to fetch earnings data');
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const getChartData = () => {
    const months = Object.keys(earnings.earningsByMonth).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Monthly Revenue',
          data: months.map(month => earnings.earningsByMonth[month]),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
        },
      ],
    };
  };

  const getOrderStatusChartData = () => {
    return {
      labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      datasets: [
        {
          data: [
            earnings.ordersByStatus.pending,
            earnings.ordersByStatus.processing,
            earnings.ordersByStatus.shipped,
            earnings.ordersByStatus.delivered,
            earnings.ordersByStatus.cancelled,
          ],
          backgroundColor: [
            'rgba(255, 206, 86, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(99, 102, 241, 0.5)',
            'rgba(255, 99, 132, 0.5)',
          ],
          borderColor: [
            'rgba(255, 206, 86, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(99, 102, 241, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500">Please sign in to view earnings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <VendorHeader title="Earnings Dashboard" />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Earnings Overview</h2>
        <div className="text-sm text-gray-500">
          <FaCalendarAlt className="inline-block mr-2" />
          Last Updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <FaMoneyBillWave className="text-indigo-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-800">
                ${earnings.totalEarnings.toFixed(2)}
              </p>
              <div className={`text-sm mt-1 ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenueGrowth >= 0 ? <FaArrowUp className="inline" /> : <FaArrowDown className="inline" />}
                {Math.abs(revenueGrowth).toFixed(1)}% vs last month
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FaShoppingCart className="text-green-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">
                {earnings.totalOrders}
              </p>
              <div className={`text-sm mt-1 ${orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {orderGrowth >= 0 ? <FaArrowUp className="inline" /> : <FaArrowDown className="inline" />}
                {Math.abs(orderGrowth).toFixed(1)}% vs last month
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FaChartLine className="text-purple-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Order Value</p>
              <p className="text-2xl font-bold text-gray-800">
                ${earnings.averageOrderValue.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaBox className="text-blue-600 text-2xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Products</p>
              <p className="text-2xl font-bold text-gray-800">
                {topProducts.length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h3>
          <Line options={chartOptions} data={getChartData()} />
        </motion.div>

        {/* Order Status Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status Distribution</h3>
          <div className="h-[300px] flex justify-center">
            <Doughnut data={getOrderStatusChartData()} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Top Products */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Products</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Product</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Revenue</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Units Sold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topProducts.map((product, index) => (
                <tr key={product.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      {index < 3 && <FaStar className="text-yellow-400" />}
                      {product.name}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                    ${product.revenue.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">
                    {product.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Monthly Earnings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Earnings</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Month</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Earnings</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Growth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(earnings.earningsByMonth)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([month, amount], index, array) => {
                  const prevAmount = array[index + 1]?.[1] || 0;
                  const growth = prevAmount === 0 ? 100 : ((amount - prevAmount) / prevAmount) * 100;
                  return (
                    <tr key={month} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-sm text-gray-600">{month}</td>
                      <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                        ${amount.toFixed(2)}
                      </td>
                      <td className={`px-4 py-2 text-sm text-right font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {growth >= 0 ? <FaArrowUp className="inline mr-1" /> : <FaArrowDown className="inline mr-1" />}
                        {Math.abs(growth).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

export default Earnings; 