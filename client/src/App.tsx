import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SignIn from './components/SignIn';
import MainLayout from './components/MainLayout';
import Register from './components/Register';
import ContactUs from './components/ContactUs';
import VendorDashboard from './components/vendor/VendorDashboard';
import CustomerDashboard from './components/customer/CustomerDashboard';
import Checkout from './components/customer/Checkout';
import OrderConfirmation from './components/customer/OrderConfirmation';
import { auth, db } from '../firebaseconfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendor: string;
  vendorId: string;
  productId: string;
}

function AppRoutes() {
  const [user, loading] = useAuthState(auth);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
        }
        setRoleLoading(false);
      } else if (!loading) {
        setRoleLoading(false);
      }
    };

    checkUserRole();
  }, [user, loading]);

  const handleOrderComplete = () => {
    setCartItems([]);
  };

  // Add debugging logs
  console.log('Current user:', user);
  console.log('Current location:', location.pathname);
  console.log('User role:', userRole);
  console.log('Cart items:', cartItems);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Get cart items from location state if available
  const locationCartItems = location.state?.cartItems || cartItems;
  const locationTotal = location.state?.total || cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Redirect authenticated users to their dashboard if they're on the main page
  if (user && location.pathname === '/' && userRole) {
    return <Navigate to={userRole === 'vendor' ? '/vendor/dashboard' : '/customer/dashboard'} replace />;
  }

  return (
    <Routes>
      <Route path="/signin" element={
        user ? 
          <Navigate to={userRole === 'vendor' ? '/vendor/dashboard' : '/customer/dashboard'} replace /> : 
          <SignIn title="Sign In" />
      } />
      <Route path="/" element={
        user ? 
          <Navigate to={userRole === 'vendor' ? '/vendor/dashboard' : '/customer/dashboard'} replace /> : 
          <MainLayout />
      } />
      <Route path="/register" element={
        user ? 
          <Navigate to={userRole === 'vendor' ? '/vendor/dashboard' : '/customer/dashboard'} replace /> : 
          <Register />
      } />
      <Route path="/contactus" element={<ContactUs />} />
      <Route path="/vendor/dashboard" element={
        user ? 
          userRole === 'vendor' ? 
            <VendorDashboard /> : 
            <Navigate to="/customer/dashboard" replace /> :
          <Navigate to="/signin" state={{ from: location }} replace />
      } />
      <Route path="/customer/dashboard" element={
        user ? 
          userRole === 'customer' ? 
            <CustomerDashboard cartItems={cartItems} setCartItems={setCartItems} /> : 
            <Navigate to="/vendor/dashboard" replace /> :
          <Navigate to="/signin" state={{ from: location }} replace />
      } />
      <Route path="/checkout" element={
        user ? (
          locationCartItems.length > 0 ? (
            <Checkout 
              cartItems={locationCartItems} 
              total={locationTotal} 
              onOrderComplete={handleOrderComplete}
            />
          ) : (
            <Navigate to="/customer/dashboard" replace />
          )
        ) : (
          <Navigate to="/signin" state={{ from: location }} replace />
        )
      } />
      <Route path="/order-confirmation" element={
        user ? <OrderConfirmation /> : 
        <Navigate to="/signin" state={{ from: location }} replace />
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;