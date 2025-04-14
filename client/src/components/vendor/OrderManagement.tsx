import React, { useState, useEffect } from 'react';
import { db } from '../../../firebaseconfig';
import { collection, query, onSnapshot, updateDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { FaBox, FaTruck, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import VendorHeader from './VendorHeader';

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
    vendorId: string;
    vendor: string;
  }[];
  totalAmount: number;
  subtotal: number;
  shipping: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: string;
  paymentMethod: 'cod' | 'online';
  createdAt: Date;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('No user found');
      setLoading(false);
      return;
    }

    console.log('Current user ID:', user.uid);

    let unsubscribe: () => void;

    try {
      // Query orders where any item has this vendor's ID
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(
        ordersRef,
        where('vendorIds', 'array-contains', user.uid)
      );

      unsubscribe = onSnapshot(
        ordersQuery,
        (snapshot) => {
          try {
            console.log('Total documents in snapshot:', snapshot.docs.length);
            
            const ordersData = snapshot.docs.map(doc => {
              const data = doc.data();
              console.log('Raw order data:', { id: doc.id, ...data });
              return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                items: data.items || []
              } as Order;
            });

            // Sort orders by date client-side
            const sortedOrders = ordersData.sort((a, b) => 
              b.createdAt.getTime() - a.createdAt.getTime()
            );

            setOrders(sortedOrders);
            setLoading(false);
            setError('');
          } catch (err) {
            console.error('Error processing orders data:', err);
            setError('Error processing orders data. Please try again.');
            setLoading(false);
          }
        },
        (err) => {
          console.error('Error listening to orders:', err);
          setError('Failed to fetch orders. Please try again later.');
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Error setting up order listener:', err);
      setError('Failed to set up orders listener. Please try again.');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'processing':
        return <FaBox className="text-blue-500" />;
      case 'shipped':
        return <FaTruck className="text-indigo-500" />;
      case 'delivered':
        return <FaCheckCircle className="text-green-500" />;
      case 'cancelled':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: Order['status']) => {
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
      <VendorHeader title="Order Management" />
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Order Management</h2>
        <div className="text-sm text-gray-500">
          Total Orders: {orders.length}
        </div>
      </div>

      <div className="grid gap-6">
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Order #{order.id.slice(-6)}
                </h3>
                <p className="text-sm text-gray-500">
                  Customer: {order.customerName}
                </p>
                <p className="text-sm text-gray-500">
                  Date: {order.createdAt.toLocaleDateString()}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium text-gray-700 mb-2">Order Items</h4>
              <div className="space-y-2">
                {order.items
                  .filter(item => item.vendorId === user?.uid)
                  .map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-gray-700">Shipping Address</h4>
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-xl font-bold text-gray-800">${order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-end gap-2">
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancel</option>
                  </select>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default OrderManagement; 