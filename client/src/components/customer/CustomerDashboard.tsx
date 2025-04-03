import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaShoppingBag, 
  FaHeart, 
  FaHistory, 
  FaMapMarkerAlt, 
  FaCreditCard, 
  FaSignOutAlt,
  FaSearch,
  FaBell
} from 'react-icons/fa';
import { auth } from '../../../firebaseconfig';
import { signOut } from 'firebase/auth';
import './CustomerDashboard.css';

function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('browse');
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8 glass-card p-6 rounded-xl">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Welcome, {user?.displayName || 'Customer'}!
              </h1>
              <p className="text-gray-600">Discover amazing products and deals</p>
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <FaBell className="text-xl" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </motion.button>
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
          </div>

          {/* Search Bar */}
          <div className="glass-card rounded-xl p-4 mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="glass-card rounded-xl p-2 mb-8">
            <nav className="flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('browse')}
                className={`${
                  activeTab === 'browse'
                    ? 'active-tab'
                    : 'text-gray-600 hover:bg-gray-100'
                } flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 tab-button`}
              >
                <FaShoppingBag />
                Browse Products
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('wishlist')}
                className={`${
                  activeTab === 'wishlist'
                    ? 'active-tab'
                    : 'text-gray-600 hover:bg-gray-100'
                } flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 tab-button`}
              >
                <FaHeart />
                Wishlist
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
                <FaHistory />
                Order History
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('addresses')}
                className={`${
                  activeTab === 'addresses'
                    ? 'active-tab'
                    : 'text-gray-600 hover:bg-gray-100'
                } flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 tab-button`}
              >
                <FaMapMarkerAlt />
                Addresses
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('payment')}
                className={`${
                  activeTab === 'payment'
                    ? 'active-tab'
                    : 'text-gray-600 hover:bg-gray-100'
                } flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 tab-button`}
              >
                <FaCreditCard />
                Payment Methods
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
            {activeTab === 'browse' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Product cards will go here */}
                <div className="glass-card p-4 rounded-xl">
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                    <img
                      src="https://via.placeholder.com/300"
                      alt="Product"
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">Product Name</h3>
                    <p className="mt-1 text-sm text-gray-500">Product description goes here</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg font-bold text-indigo-600">$99.99</span>
                      <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
                {/* Add more product cards as needed */}
              </div>
            )}
            {activeTab === 'wishlist' && (
              <div className="text-center py-8">
                <FaHeart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Your wishlist is empty</h3>
                <p className="mt-1 text-sm text-gray-500">Start adding items you love!</p>
              </div>
            )}
            {activeTab === 'orders' && (
              <div className="text-center py-8">
                <FaHistory className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No orders yet</h3>
                <p className="mt-1 text-sm text-gray-500">Your order history will appear here</p>
              </div>
            )}
            {activeTab === 'addresses' && (
              <div className="text-center py-8">
                <FaMapMarkerAlt className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No addresses saved</h3>
                <p className="mt-1 text-sm text-gray-500">Add your shipping addresses here</p>
              </div>
            )}
            {activeTab === 'payment' && (
              <div className="text-center py-8">
                <FaCreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No payment methods</h3>
                <p className="mt-1 text-sm text-gray-500">Add your payment methods here</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default CustomerDashboard; 