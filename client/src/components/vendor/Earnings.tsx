import React, { useState, useEffect } from 'react';
import { db } from '../../../firebaseconfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';

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
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      // Calculate earnings data
      const totalEarnings = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalEarnings / totalOrders : 0;
      
      // Calculate orders by status
      const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setEarnings({
        totalEarnings,
        totalOrders,
        averageOrderValue,
        ordersByStatus: {
          pending: ordersByStatus.pending || 0,
          processing: ordersByStatus.processing || 0,
          shipped: ordersByStatus.shipped || 0,
          delivered: ordersByStatus.delivered || 0,
          cancelled: ordersByStatus.cancelled || 0,
        },
      });
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError('Failed to fetch earnings data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Earnings Overview</h2>

      {error && (
        <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Earnings</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            ${earnings.totalEarnings.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Orders</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {earnings.totalOrders}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Average Order Value</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            ${earnings.averageOrderValue.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Orders by Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{earnings.ordersByStatus.pending}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Processing</div>
            <div className="text-2xl font-bold text-blue-600">{earnings.ordersByStatus.processing}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Shipped</div>
            <div className="text-2xl font-bold text-purple-600">{earnings.ordersByStatus.shipped}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Delivered</div>
            <div className="text-2xl font-bold text-green-600">{earnings.ordersByStatus.delivered}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Cancelled</div>
            <div className="text-2xl font-bold text-red-600">{earnings.ordersByStatus.cancelled}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Earnings; 