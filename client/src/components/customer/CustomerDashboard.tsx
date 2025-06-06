import React, { useState, useEffect, useRef } from 'react';
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
  FaMinus,
  FaBox,
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaTimesCircle,
  FaTag
} from 'react-icons/fa';
import { auth, db } from '../../../firebaseconfig';
import { signOut } from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  addDoc, 
  deleteDoc, 
  onSnapshot,
  writeBatch,
  setDoc,
  getDoc
} from 'firebase/firestore';
import './CustomerDashboard.css';
import { CartItem, Product, Order } from '../../types';

const API_URL = 'http://localhost:5001';

interface ShippingAddress {
  id: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isDefault: boolean;
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error';
  duration?: number;
}

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  type: 'order' | 'promotion' | 'system';
}

interface CustomerDashboardProps {
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

function CustomerDashboard({ cartItems, setCartItems }: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState('browse');
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'>('price-asc');
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    isDefault: false
  });
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotificationsDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef,
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const notificationsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate() || new Date()
          })) as SystemNotification[];
          setSystemNotifications(notificationsData);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching notifications:', error);
        showNotification('Failed to load notifications', 'error');
      }
    };

    fetchNotifications();
  }, [user]);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const batch = writeBatch(db);
      systemNotifications.forEach(notification => {
        if (!notification.isRead) {
          const notificationRef = doc(db, 'notifications', notification.id);
          batch.update(notificationRef, { isRead: true });
        }
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'order':
        return <FaBox className="text-indigo-500" />;
      case 'promotion':
        return <FaTag className="text-green-500" />;
      default:
        return <FaBell className="text-blue-500" />;
    }
  };

  const formatNotificationDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Fetch products from Firestore
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        
        // Get all products from the products collection
        const productsRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsRef);
        
        // Get all vendor IDs from the products
        const vendorIds = new Set(querySnapshot.docs.map(doc => doc.data().vendorId).filter(Boolean));
        console.log('Found vendor IDs:', Array.from(vendorIds));
        
        // Fetch vendor names
        const vendorData: { [key: string]: string } = {};
        for (const vendorId of vendorIds) {
          try {
            const vendorQuery = query(collection(db, 'users'), where('uid', '==', vendorId));
            const vendorSnapshot = await getDocs(vendorQuery);
            if (!vendorSnapshot.empty) {
              const vendorDoc = vendorSnapshot.docs[0];
              vendorData[vendorId] = vendorDoc.data().displayName || 'Unknown Vendor';
              console.log('Found vendor data:', { 
                vendorId, 
                displayName: vendorData[vendorId] 
              });
            } else {
              console.log('No vendor found for ID:', vendorId);
              vendorData[vendorId] = 'Unknown Vendor';
            }
          } catch (err) {
            console.error('Error fetching vendor data:', err);
            vendorData[vendorId] = 'Unknown Vendor';
          }
        }
        
        const productsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const vendorId = data.vendorId;
          
          // Log raw product data
          console.log('Raw product data:', {
            id: doc.id,
            ...data,
            vendorId: vendorId
          });
          
          if (!vendorId) {
            console.warn('Product missing vendorId:', doc.id);
          }
          
          const product = {
            id: doc.id,
            ...data,
            vendor: vendorId ? (vendorData[vendorId] || 'Unknown Vendor') : 'Unknown Vendor',
            vendorId: vendorId // Explicitly include vendorId
          } as Product;
          
          // Log processed product
          console.log('Processed product:', {
            id: product.id,
            name: product.name,
            vendorId: product.vendorId,
            vendor: product.vendor
          });
          
          return product;
        });
        
        console.log('Final processed products:', productsData.length);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        showNotification('Failed to load products. Please try again later.', 'error');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!user) return;

    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('customerId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          customerId: data.customerId,
          customerName: data.customerName,
          items: data.items || [],
          totalAmount: data.totalAmount,
          subtotal: data.subtotal,
          shipping: data.shipping,
          status: data.status,
          paymentStatus: data.paymentStatus,
          paymentMethod: data.paymentMethod,
          createdAt: data.createdAt,
          shippingAddress: data.shippingAddress
        } as Order;
      });
      setOrders(ordersData);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch addresses when the addresses tab is active
  useEffect(() => {
    const fetchAddresses = async () => {
      if (activeTab === 'addresses' && user) {
        setLoadingAddresses(true);
        try {
          const addressesQuery = query(
            collection(db, 'addresses'),
            where('userId', '==', user.uid)
          );
          
          const querySnapshot = await getDocs(addressesQuery);
          const addressesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as ShippingAddress[];
          
          setAddresses(addressesData);
        } catch (error: any) {
          console.error('Error fetching addresses:', error);
          if (error.code === 'permission-denied') {
            showNotification('Permission denied. Please check your Firestore security rules.', 'error');
          } else {
            showNotification('Failed to load addresses. Please try again later.', 'error');
          }
        } finally {
          setLoadingAddresses(false);
        }
      }
    };

    fetchAddresses();
  }, [activeTab, user]);

  // Fetch cart items from Firestore when user logs in
  useEffect(() => {
    if (!user) return;

    const fetchCartItems = async () => {
      try {
        const cartRef = doc(db, 'carts', user.uid);
        const cartDoc = await getDoc(cartRef);
        
        if (cartDoc.exists()) {
          const cartData = cartDoc.data();
          setCartItems(cartData.items || []);
        } else {
          // Create an empty cart document for the user
          await setDoc(cartRef, { items: [] });
        }
      } catch (error) {
        console.error('Error fetching cart items:', error);
        showNotification('Failed to load cart items', 'error');
      }
    };

    fetchCartItems();
  }, [user, setCartItems]);

  // Save cart items to Firestore whenever they change
  useEffect(() => {
    if (!user) return;

    const saveCartItems = async () => {
      try {
        const cartRef = doc(db, 'carts', user.uid);
        await setDoc(cartRef, { 
          items: cartItems,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error('Error saving cart items:', error);
      }
    };

    saveCartItems();
  }, [cartItems, user]);

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
      prevItems.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    showNotification('Item removed from cart', 'success');
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const showNotification = (message: string, type: 'success' | 'error', duration = 3000) => {
    const id = Math.random().toString(36).substring(7);
    const newNotification: Notification = {
      id,
      message,
      type,
      duration
    };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto dismiss after duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, duration);
  };

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      const updatedItems = cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setCartItems(updatedItems);
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.imageUrl,
        vendor: product.vendor || 'Unknown Vendor',
        vendorId: product.vendorId,
        productId: product.id
      };
      setCartItems([...cartItems, newItem]);
    }
    
    showNotification('Item added to cart', 'success');
  };

  const addToWishlist = (product: any) => {
    const isInWishlist = wishlistItems.some(item => item.id === product.id);
    
    if (isInWishlist) {
      setWishlistItems(prevItems => prevItems.filter(item => item.id !== product.id));
      showNotification(`${product.name} removed from wishlist!`, 'success');
    } else {
      setWishlistItems(prevItems => [...prevItems, product]);
      showNotification(`${product.name} added to wishlist!`, 'success');
    }
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showNotification('Your cart is empty', 'error');
      return;
    }
    navigate('/checkout', { 
      state: { 
        cartItems, 
        total: calculateTotal()
      }
    });
  };

  // Function to format date
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: <FaClock className="text-yellow-500" />, color: 'text-yellow-500', bgColor: 'bg-yellow-100' };
      case 'processing':
        return { icon: <FaBox className="text-blue-500" />, color: 'text-blue-500', bgColor: 'bg-blue-100' };
      case 'shipped':
        return { icon: <FaTruck className="text-indigo-500" />, color: 'text-indigo-500', bgColor: 'bg-indigo-100' };
      case 'delivered':
        return { icon: <FaCheckCircle className="text-green-500" />, color: 'text-green-500', bgColor: 'bg-green-100' };
      case 'cancelled':
        return { icon: <FaTrash className="text-red-500" />, color: 'text-red-500', bgColor: 'bg-red-100' };
      default:
        return { icon: <FaClock className="text-gray-500" />, color: 'text-gray-500', bgColor: 'bg-gray-100' };
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const addressData = {
        ...addressForm,
        userId: user.uid,
        createdAt: serverTimestamp()
      };

      if (editingAddress) {
        // Update existing address
        await updateDoc(doc(db, 'addresses', editingAddress.id), addressData);
        showNotification('Address updated successfully', 'success');
      } else {
        // Add new address
        await addDoc(collection(db, 'addresses'), addressData);
        showNotification('Address added successfully', 'success');
      }

      // Reset form and refresh addresses
      setAddressForm({
        fullName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        isDefault: false
      });
      setShowAddressForm(false);
      setEditingAddress(null);
      
      // Refresh addresses list
      const addressesQuery = query(
        collection(db, 'addresses'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(addressesQuery);
      const addressesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShippingAddress[];
      setAddresses(addressesData);
    } catch (error: any) {
      console.error('Error saving address:', error);
      if (error.code === 'permission-denied') {
        showNotification('Permission denied. Please check your Firestore security rules.', 'error');
      } else {
        showNotification('Failed to save address. Please try again later.', 'error');
      }
    }
  };

  const handleEditAddress = (address: ShippingAddress) => {
    setEditingAddress(address);
    setAddressForm({
      fullName: address.fullName,
      address: address.address,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      phone: address.phone,
      isDefault: address.isDefault
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'addresses', addressId));
      showNotification('Address deleted successfully', 'success');
      
      // Refresh addresses list
      const addressesQuery = query(
        collection(db, 'addresses'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(addressesQuery);
      const addressesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShippingAddress[];
      setAddresses(addressesData);
    } catch (error: any) {
      console.error('Error deleting address:', error);
      if (error.code === 'permission-denied') {
        showNotification('Permission denied. Please check your Firestore security rules.', 'error');
      } else {
        showNotification('Failed to delete address. Please try again later.', 'error');
      }
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
      {/* Notification Stack */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg shadow-lg max-w-md ${
              notification.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <FaCheckCircle className="w-5 h-5 mr-3" />
              ) : (
                <FaTimesCircle className="w-5 h-5 mr-3" />
              )}
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </motion.div>
        ))}
      </div>

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
          {notifications.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-4 p-4 rounded-lg ${
                notifications[notifications.length - 1].type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              <div className="flex items-center">
                {notifications[notifications.length - 1].type === 'success' ? (
                  <FaCheckCircle className="w-5 h-5 mr-3" />
                ) : (
                  <FaTimesCircle className="w-5 h-5 mr-3" />
                )}
                <p className="text-sm font-medium">{notifications[notifications.length - 1].message}</p>
              </div>
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
                ) : (
                  <>
                    <div className="mb-6 flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="all">All Categories</option>
                          {Array.from(new Set(products.map(p => p.category))).map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="price-asc">Price: Low to High</option>
                          <option value="price-desc">Price: High to Low</option>
                          <option value="name-asc">Name: A to Z</option>
                          <option value="name-desc">Name: Z to A</option>
                        </select>
                      </div>
                    </div>
                    {filteredProducts.length > 0 ? (
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
                                onError={(e) => {
                                  // Fallback to a default image if the original fails to load
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=No+Image';
                                }}
                              />
                            </div>
                            <div className="mt-4">
                              <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                              <p className="mt-1 text-sm text-gray-500">{product.description || 'No description available'}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-lg font-bold text-indigo-600">₹{product.price?.toFixed(2) || '0.00'}</span>
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
                  </>
                )}
              </div>
            )}
            {activeTab === 'cart' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Your cart is empty</p>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="mt-4 text-indigo-600 hover:text-indigo-800"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <>
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
                                <div className="text-sm text-gray-900">₹{item.price.toFixed(2)}</div>
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
                                  ₹{(item.price * item.quantity).toFixed(2)}
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
                      <div className="text-xl font-bold">
                        Total: ₹{calculateTotal().toFixed(2)}
                      </div>
                      <button
                        onClick={handleCheckout}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Proceed to Checkout
                      </button>
                    </div>
                  </>
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
                            <span className="text-lg font-bold text-indigo-600">₹{product.price?.toFixed(2) || '0.00'}</span>
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
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800">Order History</h2>
                {loadingOrders ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <FaShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Start shopping to place your first order!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const statusInfo = getStatusInfo(order.status);
                      return (
                        <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                          <div className="p-4 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-900">Order #{order.id.slice(-6)}</p>
                                <p className="text-sm text-gray-500">Placed on {formatDate(order.createdAt)}</p>
                              </div>
                              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${statusInfo.bgColor}`}>
                                {statusInfo.icon}
                                <span className={`text-sm font-medium ${statusInfo.color}`}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="space-y-4">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex items-center space-x-4">
                                  <img 
                                    src={item.image} 
                                    alt={item.name} 
                                    className="h-16 w-16 object-cover rounded-md"
                                    onError={(e) => {
                                      // Fallback to a default image if the original fails to load
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=No+Image';
                                    }}
                                  />
                                  <div className="flex-1">
                                    <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                    <p className="text-sm font-medium text-gray-900">₹{item.price.toFixed(2)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm text-gray-500">Shipping Address:</p>
                                  <p className="text-sm text-gray-900">
                                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">Total Amount</p>
                                  <p className="text-lg font-semibold text-gray-900">₹{order.totalAmount.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold text-gray-800">Shipping Addresses</h2>
                  <button
                    onClick={() => {
                      setShowAddressForm(true);
                      setEditingAddress(null);
                      setAddressForm({
                        fullName: '',
                        address: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        phone: '',
                        isDefault: false
                      });
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <FaPlus />
                    Add New Address
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <FaMapMarkerAlt className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses saved</h3>
                    <p className="mt-1 text-sm text-gray-500">Add your shipping addresses here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{address.fullName}</h3>
                            <p className="text-sm text-gray-500">{address.address}</p>
                            <p className="text-sm text-gray-500">
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                            <p className="text-sm text-gray-500">{address.phone}</p>
                            {address.isDefault && (
                              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                Default Address
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditAddress(address)}
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showAddressForm && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                      </h3>
                      <form onSubmit={handleAddressSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Full Name</label>
                          <input
                            type="text"
                            value={addressForm.fullName}
                            onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Address</label>
                          <input
                            type="text"
                            value={addressForm.address}
                            onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">City</label>
                            <input
                              type="text"
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">State</label>
                            <input
                              type="text"
                              value={addressForm.state}
                              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                            <input
                              type="text"
                              value={addressForm.zipCode}
                              onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input
                              type="tel"
                              value={addressForm.phone}
                              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={addressForm.isDefault}
                            onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-900">Set as default address</label>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditingAddress(null);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                          >
                            {editingAddress ? 'Update Address' : 'Add Address'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
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