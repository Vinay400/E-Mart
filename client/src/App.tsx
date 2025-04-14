import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SignIn from './components/SignIn';
import MainLayout from './components/MainLayout';
import Register from './components/Register';
import ContactUs from './components/ContactUs';
import VendorDashboard from './components/vendor/VendorDashboard';
import CustomerDashboard from './components/customer/CustomerDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import Checkout from './components/customer/Checkout';
import OrderConfirmation from './components/customer/OrderConfirmation';
import { auth, db } from '../firebaseconfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { CartItem } from './types';

// Separate component for routes to use hooks within Router context
const AppRoutes = () => {
  const [user] = useAuthState(auth);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const location = useLocation();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      } else {
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, [user]);

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Routes>
      <Route path="/" element={<MainLayout />} />
      <Route path="/signin" element={<SignIn title="Welcome Back" />} />
      <Route path="/register" element={<Register />} />
      <Route path="/contact-us" element={<ContactUs />} />
      
      <Route path="/vendor/dashboard" element={
        user && userRole === 'vendor' ? (
          <VendorDashboard />
        ) : (
          <Navigate to="/signin" state={{ from: location }} replace />
        )
      } />

      <Route path="/admin/dashboard" element={
        user && userRole === 'admin' ? (
          <AdminDashboard />
        ) : (
          <Navigate to="/signin" state={{ from: location }} replace />
        )
      } />

      <Route path="/customer/dashboard" element={
        user && userRole === 'customer' ? (
          <CustomerDashboard cartItems={cartItems} setCartItems={setCartItems} />
        ) : (
          <Navigate to="/signin" state={{ from: location }} replace />
        )
      } />

      <Route path="/checkout" element={
        user && userRole === 'customer' ? (
          <Checkout cartItems={cartItems} total={cartTotal} onOrderComplete={() => setCartItems([])} />
        ) : (
          <Navigate to="/signin" state={{ from: location }} replace />
        )
      } />

      <Route path="/order-confirmation" element={
        user ? <OrderConfirmation /> : <Navigate to="/signin" state={{ from: location }} replace />
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App component that provides Router context
const App = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
