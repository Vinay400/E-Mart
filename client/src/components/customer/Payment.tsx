import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { db } from '../../../firebaseconfig';
import { doc, updateDoc } from 'firebase/firestore';
import './Payment.css';

interface PaymentProps {
  orderId: string;
  amount: number;
  onSuccess: () => void;
  onFailure: (error: any) => void;
}

const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID || '';
const API_URL = 'http://localhost:5001';

const Payment: React.FC<PaymentProps> = ({ orderId, amount, onSuccess, onFailure }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const displayRazorpay = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load Razorpay script
      await loadRazorpay();

      // Create order on backend
      const response = await fetch('http://localhost:5001/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          orderId: orderId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'E-Mart',
        description: 'Order Payment',
        order_id: data.id,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('http://localhost:5001/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderId,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              onSuccess();
            } else {
              onFailure('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            onFailure('Payment verification failed');
          }
        },
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com',
        },
        theme: {
          color: '#4F46E5',
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Payment error:', error);
          setError('Unable to connect to payment server. Please check your internet connection and try again later.');
      onFailure('Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    displayRazorpay();
  }, []);

  return (
    <div className="payment-container">
      {loading ? (
        <div className="payment-loading">
          <FaSpinner className="spinner" />
          <p>Processing your payment...</p>
        </div>
      ) : error ? (
        <div className="payment-error">
          <FaExclamationCircle className="error-icon" />
          <p>{error}</p>
          <button className="retry-button" onClick={displayRazorpay}>
            Retry Payment
          </button>
          <button className="cancel-button" onClick={() => onFailure(error)}>
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default Payment; 