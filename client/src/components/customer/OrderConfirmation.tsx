import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { db } from '../../../firebaseconfig';
import { doc, getDoc } from 'firebase/firestore';
import './OrderConfirmation.css';

interface OrderDetails {
  id: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
    vendorId?: string;
    vendor?: string;
  }>;
  customerId: string;
  customerName: string;
  subtotal: number;
  shipping: number;
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  paymentMethod: 'cod' | 'online';
  paymentStatus: string;
  status: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

const OrderConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDetails | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Check if we have the orderId in location state
        const orderId = location.state?.orderId;
        if (!orderId) {
          setError('No order ID provided');
          setLoading(false);
          return;
        }

        console.log('Fetching order details for ID:', orderId);
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);

        if (!orderDoc.exists()) {
          setError('Order not found');
          setLoading(false);
          return;
        }

        const orderData = orderDoc.data();
        console.log('Retrieved order data:', orderData);

        // Validate required fields
        if (!orderData.items || !orderData.shippingAddress) {
          setError('Invalid order data');
          setLoading(false);
          return;
        }

        setOrder({
          id: orderDoc.id,
          items: orderData.items || [],
          customerId: orderData.customerId,
          customerName: orderData.customerName,
          subtotal: orderData.subtotal || 0,
          shipping: orderData.shipping || 0,
          totalAmount: orderData.totalAmount || 0,
          shippingAddress: orderData.shippingAddress,
          paymentMethod: orderData.paymentMethod || 'cod',
          paymentStatus: orderData.paymentStatus || 'pending',
          status: orderData.status || 'pending',
          createdAt: orderData.createdAt
        });
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location.state]);

  if (loading) {
    return (
      <div className="order-confirmation-container">
        <div className="loading">
          <FaSpinner className="spinner" />
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-confirmation-container">
        <div className="error">
          <FaExclamationTriangle className="error-icon" />
          <p>{error || 'Order not found'}</p>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="back-button"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation-container">
      <div className="success-message">
        <FaCheckCircle className="success-icon" />
        <h1>Order Confirmed!</h1>
        <p>Thank you for your purchase</p>
      </div>

      <div className="order-details">
        <h2>Order Details</h2>
        <p className="order-id">Order ID: {order.id}</p>

        <div className="items-list">
          <h3>Items</h3>
          {order.items.map((item, index) => (
            <div key={index} className="order-item">
              <div className="item-info">
                <span className="item-name">{item.name}</span>
                <span className="item-quantity">x{item.quantity}</span>
              </div>
              <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="shipping-details">
          <h3>Shipping Details</h3>
          <p>{order.customerName}</p>
          <p>{order.shippingAddress.street}</p>
          <p>
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
          </p>
        </div>

        <div className="payment-details">
          <h3>Payment Details</h3>
          <div className="detail-row">
            <span>Subtotal:</span>
            <span>₹{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="detail-row">
            <span>Shipping:</span>
            <span>₹{order.shipping.toFixed(2)}</span>
          </div>
          <div className="detail-row total">
            <span>Total Amount:</span>
            <span>₹{order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="detail-row">
            <span>Payment Method:</span>
            <span>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
          </div>
          <div className="detail-row">
            <span>Status:</span>
            <span className={`status ${order.paymentStatus}`}>
              {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
            </span>
          </div>
        </div>

        <div className="actions">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="continue-shopping"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation; 