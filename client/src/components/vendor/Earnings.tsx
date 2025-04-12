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
  FaStar,
  FaChartBar
} from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import VendorHeader from './VendorHeader';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
    image?: string;
  }[];
  customerId: string;
  customerName: string;
  paymentStatus: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
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
    fetchEarnings();
  }, [user]);

  const fetchEarnings = async () => {
    try {
      if (!user) {
        console.log('No user found');
        return;
      }
      
      console.log('Current user ID:', user.uid);
      
      const q = query(collection(db, 'orders'));
      const querySnapshot = await getDocs(q);
      
      const orders = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Order data:', data);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()
        };
      }) as Order[];

      console.log('All orders:', orders);

      // Filter orders that contain items from this vendor
      const vendorOrders = orders.filter(order => {
        const hasVendorItems = order.items?.some(item => {
          console.log('Checking item:', item, 'against vendor:', user.uid);
          return item.vendorId === user.uid;
        });
        console.log('Order', order.id, 'has vendor items:', hasVendorItems);
        return hasVendorItems;
      });

      console.log('Vendor orders:', vendorOrders);

      const totalEarnings = vendorOrders.reduce((sum, order) => {
        const vendorItemsTotal = order.items
          ?.filter(item => item.vendorId === user.uid)
          .reduce((itemSum, item) => {
            console.log('Adding to earnings:', item.price * item.quantity);
            return itemSum + (item.price * item.quantity);
          }, 0) || 0;
        console.log('Order total for vendor:', vendorItemsTotal);
        return sum + vendorItemsTotal;
      }, 0);

      console.log('Total earnings calculated:', totalEarnings);

      const totalOrders = vendorOrders.length;
      const averageOrderValue = totalOrders > 0 ? totalEarnings / totalOrders : 0;

      // Calculate orders by status
      const ordersByStatus = {
        pending: vendorOrders.filter(order => order.status === 'pending').length,
        processing: vendorOrders.filter(order => order.status === 'processing').length,
        shipped: vendorOrders.filter(order => order.status === 'shipped').length,
        delivered: vendorOrders.filter(order => order.status === 'delivered').length,
        cancelled: vendorOrders.filter(order => order.status === 'cancelled').length,
      };

      console.log('Orders by status:', ordersByStatus);

      // Calculate earnings by month
      const earningsByMonth: { [key: string]: number } = {};
      vendorOrders.forEach(order => {
        if (order.status !== 'cancelled' && order.createdAt) {
          const month = order.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
          const vendorItemsTotal = order.items
            ?.filter(item => item.vendorId === user.uid)
            .reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
          console.log('Adding to month:', month, 'amount:', vendorItemsTotal);
          earningsByMonth[month] = (earningsByMonth[month] || 0) + vendorItemsTotal;
        }
      });

      console.log('Earnings by month:', earningsByMonth);

      calculateGrowthMetrics(vendorOrders);
      calculateTopProducts(vendorOrders);

      setEarnings({
        totalEarnings,
        totalOrders,
        averageOrderValue,
        ordersByStatus,
        earningsByMonth,
      });
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError('Failed to fetch earnings data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowthMetrics = (vendorOrders: Order[]) => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const currentMonthOrders = vendorOrders.filter(order => 
      order.createdAt >= lastMonth && order.createdAt < now
    );
    const lastMonthOrders = vendorOrders.filter(order => 
      order.createdAt >= twoMonthsAgo && order.createdAt < lastMonth
    );

    const currentRevenue = currentMonthOrders.reduce((sum, order) => {
      return sum + (order.items
        ?.filter(item => item.vendorId === user?.uid)
        .reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0);
    }, 0);

    const lastRevenue = lastMonthOrders.reduce((sum, order) => {
      return sum + (order.items
        ?.filter(item => item.vendorId === user?.uid)
        .reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0) || 0);
    }, 0);

    const revenueGrowth = lastRevenue === 0 ? 100 : ((currentRevenue - lastRevenue) / lastRevenue) * 100;
    const orderGrowth = lastMonthOrders.length === 0 ? 100 : 
      ((currentMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100;

    setRevenueGrowth(revenueGrowth);
    setOrderGrowth(orderGrowth);
  };

  const calculateTopProducts = (vendorOrders: Order[]) => {
    const productMap = new Map<string, TopProduct>();

    vendorOrders.forEach(order => {
      order.items?.forEach(item => {
        if (item.vendorId === user?.uid) {
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
    const months = Object.keys(earnings.earningsByMonth);
    const values = Object.values(earnings.earningsByMonth);

    return {
      labels: months,
      datasets: [
        {
          label: 'Monthly Revenue',
          data: values,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          tension: 0.3,
        },
      ],
    };
  };

  const getOrderStatusChartData = () => {
    return {
      labels: Object.keys(earnings.ordersByStatus),
      datasets: [
        {
          data: Object.values(earnings.ordersByStatus),
          backgroundColor: [
            'rgba(251, 191, 36, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(99, 102, 241, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
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