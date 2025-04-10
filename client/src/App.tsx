import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SignIn from './components/SignIn';
import MainLayout from './components/MainLayout';
import Register from './components/Register';
import ContactUs from './components/ContactUs';
import VendorDashboard from './components/vendor/VendorDashboard';
import CustomerDashboard from './components/customer/CustomerDashboard';
import Checkout from './components/customer/Checkout';
import OrderConfirmation from './components/customer/OrderConfirmation';
import { auth } from '../firebaseconfig';
import { useAuthState } from 'react-firebase-hooks/auth';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendor: string;
}

function AppRoutes() {
  const [user, loading] = useAuthState(auth);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const location = useLocation();

  const handleOrderComplete = () => {
    setCartItems([]);
  };

  // Add debugging logs
  console.log('Current user:', user);
  console.log('Current location:', location.pathname);
  console.log('Cart items:', cartItems);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Get cart items from location state if available
  const locationCartItems = location.state?.cartItems || cartItems;
  const locationTotal = location.state?.total || cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Routes>
      <Route path="/signin" element={<SignIn title="Sign In" />} />
      <Route path="/" element={<MainLayout />} />
      <Route path="/register" element={<Register />} />
      <Route path="/contactus" element={<ContactUs />} />
      <Route path="/vendor/dashboard" element={
        user ? <VendorDashboard /> : <Navigate to="/signin" state={{ from: location }} replace />
      } />
      <Route path="/customer/dashboard" element={
        user ? <CustomerDashboard cartItems={cartItems} setCartItems={setCartItems} /> : 
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