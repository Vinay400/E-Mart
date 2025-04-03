import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import Earnings from './Earnings';
import { auth } from '../../../firebaseconfig';
import { signOut } from 'firebase/auth';
import { motion } from 'framer-motion';
import { FaBox, FaShoppingCart, FaMoneyBillWave, FaSignOutAlt } from 'react-icons/fa';
import './VendorDashboard.css';

function VendorDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const { isVendor, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen dashboard-container">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isVendor) {
    navigate('/');
    return null;
  }

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen dashboard-container">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-4 py-6 sm:px-0"
        >
          <div className="flex justify-between items-center mb-8 glass-card p-6 rounded-xl">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">Vendor Dashboard</h1>
              <p className="text-gray-600">Manage your products, orders, and earnings</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center gap-2 shadow-lg"
            >
              <FaSignOutAlt />
              Sign Out
            </motion.button>
          </div>
          
          {/* Navigation Tabs */}
          <div className="glass-card rounded-xl p-2 mb-8">
            <nav className="flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('products')}
                className={`${
                  activeTab === 'products'
                    ? 'active-tab'
                    : 'text-gray-600 hover:bg-gray-100'
                } flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 tab-button`}
              >
                <FaBox />
                Products
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('orders')}
                className={`${
                  activeTab === 'orders'
                    ? 'active-tab'
                    : 'text-gray-600 hover:bg-gray-100'
                } flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 tab-button`}
              >
                <FaShoppingCart />
                Orders
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('earnings')}
                className={`${
                  activeTab === 'earnings'
                    ? 'active-tab'
                    : 'text-gray-600 hover:bg-gray-100'
                } flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 tab-button`}
              >
                <FaMoneyBillWave />
                Earnings
              </motion.button>
            </nav>
          </div>

          {/* Content Area */}
          <motion.div
            key={activeTab}
            initial="hidden"
            animate="visible"
            variants={tabVariants}
            transition={{ duration: 0.3 }}
            className="content-card rounded-xl p-6"
          >
            {activeTab === 'products' && <ProductManagement />}
            {activeTab === 'orders' && <OrderManagement />}
            {activeTab === 'earnings' && <Earnings />}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default VendorDashboard; 