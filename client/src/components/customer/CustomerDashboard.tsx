import React, { useState, useEffect } from 'react';
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
  FaBell,
  FaShoppingCart,
  FaTrash,
  FaPlus,
  FaMinus
} from 'react-icons/fa';
import { auth } from '../../../firebaseconfig';
import { signOut } from 'firebase/auth';
import { db } from '../../../firebaseconfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import './CustomerDashboard.css';

// Mock cart data - in a real app, this would come from a database or state management
const initialCartItems: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendor: string;
}[] = [];

function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('browse');
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        
        // Get all products from the products collection without status filter
        const productsRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsRef);
        
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('Fetched products:', productsData); // Debug log
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        setNotification({ 
          message: 'Failed to load products. Please try again later.', 
          type: 'error' 
        });
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateQuantity = (id: string, change: number) => {
    setCartItems(prevItems => 
      prevItems.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const addToCart = (product: any) => {
    // Check if product already exists in cart
    const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
      // If product exists, increase quantity
      setCartItems(prevItems => 
        prevItems.map((item, index) => {
          if (index === existingItemIndex) {
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        })
      );
    } else {
      // If product doesn't exist, add it to cart
      const newCartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.imageUrl,
        vendor: product.vendorName || 'Unknown Vendor'
      };
      
      setCartItems(prevItems => [...prevItems, newCartItem]);
    }
    
    // Show notification
    setNotification({ message: `${product.name} added to cart!`, type: 'success' });
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const addToWishlist = (product: any) => {
    const isInWishlist = wishlistItems.some(item => item.id === product.id);
    
    if (isInWishlist) {
      // Remove from wishlist
      setWishlistItems(prevItems => prevItems.filter(item => item.id !== product.id));
      setNotification({ message: `${product.name} removed from wishlist!`, type: 'success' });
    } else {
      // Add to wishlist
      setWishlistItems(prevItems => [...prevItems, product]);
      setNotification({ message: `${product.name} added to wishlist!`, type: 'success' });
    }
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

          {/* Notification */}
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-4 p-4 rounded-lg ${
                notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {notification.message}
            </motion.div>
          )}

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
                onClick={() => setActiveTab('cart')}
                className={`${
                  activeTab === 'cart'
                    ? 'active-tab'
                    : 'text-gray-600 hover:bg-gray-100'
                } flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 tab-button`}
              >
                <FaShoppingCart />
                Cart
                {cartItems.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
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
              <div>
                {loadingProducts ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => (
                      <motion.div 
                        key={product.id}
                        whileHover={{ y: -5 }}
                        className="glass-card p-4 rounded-xl"
                      >
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                          <img
                            src={product.imageUrl || 'https://via.placeholder.com/300'}
                            alt={product.name}
                            className="object-cover object-center"
                          />
                        </div>
                        <div className="mt-4">
                          <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                          <p className="mt-1 text-sm text-gray-500">{product.description || 'No description available'}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-lg font-bold text-indigo-600">${product.price?.toFixed(2) || '0.00'}</span>
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => addToWishlist(product)}
                                className={`p-2 rounded-lg transition-colors ${
                                  wishlistItems.some(item => item.id === product.id)
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                                }`}
                              >
                                <FaHeart />
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => addToCart(product)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                              >
                                <FaShoppingCart />
                                Add to Cart
                              </motion.button>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Vendor: {product.vendorName || 'Unknown Vendor'}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FaShoppingBag className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {searchQuery ? 'Try a different search term' : 'There are no products available at the moment'}
                    </p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'cart' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Your Shopping Cart</h2>
                {cartItems.length > 0 ? (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Vendor
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {cartItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-16 w-16 flex-shrink-0">
                                    <img className="h-16 w-16 rounded-md object-cover" src={item.image} alt={item.name} />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{item.vendor}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">${item.price.toFixed(2)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <button 
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                                  >
                                    <FaMinus className="h-3 w-3 text-gray-600" />
                                  </button>
                                  <span className="text-sm font-medium">{item.quantity}</span>
                                  <button 
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                                  >
                                    <FaPlus className="h-3 w-3 text-gray-600" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button 
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-6 flex justify-between items-center">
                      <div className="text-lg font-medium">
                        Total: <span className="text-indigo-600 font-bold">${calculateTotal().toFixed(2)}</span>
                      </div>
                      <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                        Proceed to Checkout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FaShoppingCart className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
                    <p className="mt-2 text-sm text-gray-500">Add some products to your cart to see them here</p>
                    <button 
                      onClick={() => setActiveTab('browse')}
                      className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Browse Products
                    </button>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'wishlist' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Your Wishlist</h2>
                {wishlistItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistItems.map(product => (
                      <motion.div 
                        key={product.id}
                        whileHover={{ y: -5 }}
                        className="glass-card p-4 rounded-xl"
                      >
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                          <img
                            src={product.imageUrl || 'https://via.placeholder.com/300'}
                            alt={product.name}
                            className="object-cover object-center"
                          />
                        </div>
                        <div className="mt-4">
                          <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                          <p className="mt-1 text-sm text-gray-500">{product.description || 'No description available'}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-lg font-bold text-indigo-600">${product.price?.toFixed(2) || '0.00'}</span>
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => addToWishlist(product)}
                                className="bg-red-100 text-red-600 p-2 rounded-lg transition-colors"
                              >
                                <FaHeart />
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => addToCart(product)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                              >
                                <FaShoppingCart />
                                Add to Cart
                              </motion.button>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Vendor: {product.vendorName || 'Unknown Vendor'}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FaHeart className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">Your wishlist is empty</h3>
                    <p className="mt-2 text-sm text-gray-500">Start adding items you love!</p>
                    <button 
                      onClick={() => setActiveTab('browse')}
                      className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Browse Products
                    </button>
                  </div>
                )}
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