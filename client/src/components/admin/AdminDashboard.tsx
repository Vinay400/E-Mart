import React, { useState, useEffect } from 'react';
import { auth, db } from '../../../firebaseconfig';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiShoppingBag, FiPackage, FiLogOut, FiSettings, FiBarChart2, FiAlertCircle, FiTrendingUp, FiDollarSign, FiShoppingCart } from 'react-icons/fi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface User {
  uid: string;
  email: string;
  role: string;
  createdAt: any;
  status: string;
}

interface Vendor {
  uid: string;
  email: string;
  businessName: string;
  status: string;
  createdAt: any;
  address: string;
  phone: string;
  productsCount: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  vendorId: string;
  status: string;
  createdAt: any;
}

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: any[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: any;
  shippingAddress: any;
}

interface DailyRevenue {
  date: string;
  revenue: number;
}

interface CategorySales {
  category: string;
  sales: number;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingVendors: 0,
    pendingOrders: 0
  });
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [paymentMethodStats, setPaymentMethodStats] = useState<{ method: string; count: number }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const setupListeners = async () => {
      try {
        setLoading(true);

        // Set up real-time listeners
        const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
          if (!isMounted) return;
          const usersData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
          setUsers(usersData);
          updateStats('users', usersData);
        }, (error) => {
          console.error('Error in users listener:', error);
        });

        const unsubscribeVendors = onSnapshot(collection(db, 'vendors'), (snapshot) => {
          if (!isMounted) return;
          const vendorsData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as Vendor));
          setVendors(vendorsData);
          updateStats('vendors', vendorsData);
        }, (error) => {
          console.error('Error in vendors listener:', error);
        });

        const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
          if (!isMounted) return;
          const productsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
          setProducts(productsData);
          updateStats('products', productsData);
          updateCategorySales(productsData);
        }, (error) => {
          console.error('Error in products listener:', error);
        });

        const unsubscribeOrders = onSnapshot(
          query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
          (snapshot) => {
            if (!isMounted) return;
            const ordersData = snapshot.docs.map(doc => {
              const data = doc.data();
              // Ensure createdAt is properly handled
              const createdAt = data.createdAt instanceof Timestamp ? 
                data.createdAt : 
                Timestamp.fromDate(new Date());
              return { ...data, id: doc.id, createdAt } as Order;
            });
            setOrders(ordersData);
            updateStats('orders', ordersData);
            updateRevenueData(ordersData);
            updatePaymentStats(ordersData);
          },
          (error) => {
            console.error('Error in orders listener:', error);
          }
        );

        setLoading(false);

        // Cleanup listeners on unmount
        return () => {
          isMounted = false;
          unsubscribeUsers();
          unsubscribeVendors();
          unsubscribeProducts();
          unsubscribeOrders();
        };
      } catch (error) {
        console.error('Error setting up listeners:', error);
        setLoading(false);
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateStats = (type: string, data: any[]) => {
    setStats(prev => {
      const updates: any = {};
      
      switch(type) {
        case 'users':
          updates.totalUsers = data.length;
          break;
        case 'vendors':
          updates.totalVendors = data.length;
          updates.pendingVendors = data.filter(v => v.status === 'pending').length;
          break;
        case 'products':
          updates.totalProducts = data.length;
          break;
        case 'orders':
          updates.totalOrders = data.length;
          updates.pendingOrders = data.filter(o => o.status === 'pending').length;
          updates.totalRevenue = data.reduce((sum, order) => {
            const orderAmount = typeof order.totalAmount === 'number' ? order.totalAmount : 0;
            return sum + orderAmount;
          }, 0);
          break;
      }

      return { ...prev, ...updates };
    });
  };

  const updateRevenueData = (ordersData: Order[]) => {
    try {
      const revenueByDay = new Map<string, number>();
      ordersData.forEach(order => {
        if (order.createdAt) {
          const date = order.createdAt.toDate().toLocaleDateString();
          const amount = typeof order.totalAmount === 'number' ? order.totalAmount : 0;
          revenueByDay.set(date, (revenueByDay.get(date) || 0) + amount);
        }
      });

      const dailyRevenueData = Array.from(revenueByDay.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7);

      setDailyRevenue(dailyRevenueData);
    } catch (error) {
      console.error('Error updating revenue data:', error);
    }
  };

  const updateCategorySales = (productsData: Product[]) => {
    const salesByCategory = new Map<string, number>();
    productsData.forEach(product => {
      const category = product.category || 'Uncategorized';
      salesByCategory.set(category, (salesByCategory.get(category) || 0) + 1);
    });

    const categorySalesData = Array.from(salesByCategory.entries())
      .map(([category, sales]) => ({ category, sales }));

    setCategorySales(categorySalesData);
  };

  const updatePaymentStats = (ordersData: Order[]) => {
    const paymentMethods = ordersData.reduce((acc, order) => {
      const method = order.paymentStatus || 'Unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const paymentMethodData = Object.entries(paymentMethods)
      .map(([method, count]) => ({ method, count }));

    setPaymentMethodStats(paymentMethodData);
  };

  const handleVendorStatusUpdate = async (vendorId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'vendors', vendorId), {
        status: newStatus,
        updatedAt: new Date()
      });
      // Real-time listener will automatically update the UI
    } catch (error) {
      console.error('Error updating vendor status:', error);
    }
  };

  const handleUserStatusUpdate = async (userId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: new Date()
      });
      // Real-time listener will automatically update the UI
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date()
      });
      // Real-time listener will automatically update the UI
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleProductStatusUpdate = async (productId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        status: newStatus,
        updatedAt: new Date()
      });
      // Real-time listener will automatically update the UI
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', productId));
        // Real-time listener will automatically update the UI
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Update the dashboard card styles
  const DashboardCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium uppercase">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('border-l-4', 'bg-opacity-20')} text-xl`}>
          {icon}
        </div>
      </div>
    </div>
  );

  // Update chart rendering to handle loading state
  const renderChart = (type: 'line' | 'bar' | 'doughnut', data: any, options: any) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    switch (type) {
      case 'line':
        return <Line data={data} options={options} />;
      case 'bar':
        return <Bar data={data} options={options} />;
      case 'doughnut':
        return <Doughnut data={data} options={options} />;
      default:
        return null;
    }
  };

  const VendorDetailsModal = ({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Vendor Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Business Name</p>
            <p className="text-lg font-semibold">{vendor.businessName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-lg font-semibold">{vendor.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="text-lg font-semibold">{vendor.phone || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`px-2 py-1 rounded-full text-xs ${
              vendor.status === 'approved' ? 'bg-green-100 text-green-800' :
              vendor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {vendor.status}
            </span>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-gray-500">Address</p>
            <p className="text-lg font-semibold">{vendor.address || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Products Count</p>
            <p className="text-lg font-semibold">{vendor.productsCount || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Joined Date</p>
            <p className="text-lg font-semibold">
              {vendor.createdAt ? new Date(vendor.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h4 className="text-lg font-semibold mb-4">Vendor Products</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            {products.filter(p => p.vendorId === vendor.uid).length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {products
                  .filter(p => p.vendorId === vendor.uid)
                  .map(product => (
                    <div key={product.id} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{product.price}</p>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.status}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center">No products available</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white h-screen shadow-lg">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
          </div>
          <nav className="mt-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center p-4 text-gray-700 ${
                activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : ''
              }`}
            >
              <FiBarChart2 className="mr-3" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center p-4 text-gray-700 ${
                activeTab === 'users' ? 'bg-indigo-50 text-indigo-600' : ''
              }`}
            >
              <FiUsers className="mr-3" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`w-full flex items-center p-4 text-gray-700 ${
                activeTab === 'vendors' ? 'bg-indigo-50 text-indigo-600' : ''
              }`}
            >
              <FiShoppingBag className="mr-3" />
              Vendors
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center p-4 text-gray-700 ${
                activeTab === 'products' ? 'bg-indigo-50 text-indigo-600' : ''
              }`}
            >
              <FiPackage className="mr-3" />
              Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center p-4 text-gray-700 ${
                activeTab === 'orders' ? 'bg-indigo-50 text-indigo-600' : ''
              }`}
            >
              <FiPackage className="mr-3" />
              Orders
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center p-4 text-gray-700 ${
                activeTab === 'reports' ? 'bg-indigo-50 text-indigo-600' : ''
              }`}
            >
              <FiBarChart2 className="mr-3" />
              Reports
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center p-4 text-gray-700 hover:bg-red-50 hover:text-red-600"
            >
              <FiLogOut className="mr-3" />
              Sign Out
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard
                  title="Total Users"
                  value={stats.totalUsers}
                  icon={<FiUsers />}
                  color="border-blue-500"
                />
                <DashboardCard
                  title="Total Vendors"
                  value={stats.totalVendors}
                  icon={<FiShoppingBag />}
                  color="border-purple-500"
                />
                <DashboardCard
                  title="Total Products"
                  value={stats.totalProducts}
                  icon={<FiPackage />}
                  color="border-green-500"
                />
                <DashboardCard
                  title="Total Orders"
                  value={stats.totalOrders}
                  icon={<FiShoppingCart />}
                  color="border-yellow-500"
                />
                <DashboardCard
                  title="Total Revenue"
                  value={`₹${stats.totalRevenue.toLocaleString('en-IN', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}`}
                  icon={<FiDollarSign />}
                  color="border-indigo-500"
                />
                <DashboardCard
                  title="Pending Actions"
                  value={`${stats.pendingVendors + stats.pendingOrders} Total`}
                  icon={<FiAlertCircle />}
                  color="border-red-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">User Management</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.uid}>
                        <td className="px-6 py-4">{user.email}</td>
                        <td className="px-6 py-4">{user.role}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.status}
                            onChange={(e) => handleUserStatusUpdate(user.uid, e.target.value)}
                            className="rounded border-gray-300 text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="suspended">Suspend</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'vendors' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Vendor Management</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vendors.map((vendor) => (
                      <tr key={vendor.uid} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => {
                              setSelectedVendor(vendor);
                              setIsModalOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            {vendor.businessName}
                          </button>
                        </td>
                        <td className="px-6 py-4">{vendor.email}</td>
                        <td className="px-6 py-4">{vendor.phone || 'Not provided'}</td>
                        <td className="px-6 py-4">{products.filter(p => p.vendorId === vendor.uid).length}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            vendor.status === 'approved' ? 'bg-green-100 text-green-800' :
                            vendor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {vendor.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-3">
                            <select
                              value={vendor.status}
                              onChange={(e) => handleVendorStatusUpdate(vendor.uid, e.target.value)}
                              className="rounded border-gray-300 text-sm"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approve</option>
                              <option value="rejected">Reject</option>
                            </select>
                            <button
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setIsModalOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Render the modal when a vendor is selected */}
              {isModalOpen && selectedVendor && (
                <VendorDetailsModal
                  vendor={selectedVendor}
                  onClose={() => {
                    setIsModalOpen(false);
                    setSelectedVendor(null);
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Product Management</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4">{product.name}</td>
                        <td className="px-6 py-4">₹{product.price}</td>
                        <td className="px-6 py-4">{product.category}</td>
                        <td className="px-6 py-4">
                          {vendors.find(v => v.uid === product.vendorId)?.businessName || 'Unknown'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            product.status === 'active' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <select
                              value={product.status}
                              onChange={(e) => handleProductStatusUpdate(product.id, e.target.value)}
                              className="rounded border-gray-300 text-sm"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Order Management</h2>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4">{order.id}</td>
                        <td className="px-6 py-4">{order.customerName}</td>
                        <td className="px-6 py-4">₹{order.totalAmount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {new Date(order.createdAt.toDate()).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                            className="rounded border-gray-300 text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancel</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Reports & Analytics</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Overview */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Revenue Overview</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Revenue</p>
                      <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString('en-IN', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Orders</p>
                      <p className="text-2xl font-bold">{stats.totalOrders}</p>
                    </div>
                  </div>
                </div>

                {/* User Statistics */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">User Statistics</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Users</p>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Vendors</p>
                      <p className="text-2xl font-bold">{stats.totalVendors}</p>
                    </div>
                  </div>
                </div>

                {/* Daily Revenue Chart */}
                <div className="bg-white p-6 rounded-xl shadow-lg col-span-1 lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Daily Revenue (Last 7 Days)</h3>
                  <div className="h-80">
                    {renderChart('line', {
                      labels: dailyRevenue.map(item => item.date),
                      datasets: [{
                        label: 'Daily Revenue',
                        data: dailyRevenue.map(item => item.revenue),
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        fill: true,
                        tension: 0.4,
                      }]
                    }, {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' as const },
                        title: { display: false }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { color: 'rgba(0, 0, 0, 0.05)' },
                          ticks: { callback: (value: any) => `₹${value}` }
                        },
                        x: {
                          grid: { color: 'rgba(0, 0, 0, 0.05)' }
                        }
                      }
                    })}
                  </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Product Categories</h3>
                  <div className="h-64">
                    {renderChart('bar', {
                      labels: categorySales.map(item => item.category),
                      datasets: [{
                        label: 'Products per Category',
                        data: categorySales.map(item => item.sales),
                        backgroundColor: 'rgba(75, 85, 199, 0.8)',
                      }]
                    }, {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' as const },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        }
                      }
                    })}
                  </div>
                </div>

                {/* Payment Methods Distribution */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Payment Methods</h3>
                  <div className="h-64">
                    {renderChart('doughnut', {
                      labels: paymentMethodStats.map(item => item.method),
                      datasets: [{
                        data: paymentMethodStats.map(item => item.count),
                        backgroundColor: [
                          'rgba(75, 85, 199, 0.8)',
                          'rgba(255, 99, 132, 0.8)',
                          'rgba(255, 205, 86, 0.8)',
                          'rgba(75, 192, 192, 0.8)',
                        ],
                      }]
                    }, {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'right' as const },
                      },
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 