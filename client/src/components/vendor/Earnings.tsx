import React, { useState, useEffect } from 'react';
import { db } from '../../../firebaseconfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { FaMoneyBillWave, FaShoppingCart, FaChartLine, FaCalendarAlt } from 'react-icons/fa';

interface Order {
  id: string;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
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

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      if (!user) return;
      
      const q = query(
        collection(db, 'orders'),
        where('vendorId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Order[];

      // Calculate earnings data
      const totalEarnings = orders.reduce((sum, order) => sum + order.totalAmount, 0);
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
        if (order.status !== 'cancelled') {
          const month = order.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
          earningsByMonth[month] = (earningsByMonth[month] || 0) + order.totalAmount;
        }
      });

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Earnings Overview</h2>
        <div className="text-sm text-gray-500">
          <FaCalendarAlt className="inline-block mr-2" />
          Last Updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </div>

      {/* Order Status Distribution */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(earnings.ordersByStatus).map(([status, count]) => (
            <motion.div
              key={status}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-lg ${getStatusColor(status)}`}
            >
              <p className="text-sm font-medium capitalize">{status}</p>
              <p className="text-2xl font-bold">{count}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Monthly Earnings */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Earnings</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Month</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Earnings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(earnings.earningsByMonth)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([month, amount]) => (
                  <tr key={month}>
                    <td className="px-4 py-2 text-sm text-gray-600">{month}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                      ${amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Earnings; 