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

const RAZORPAY_KEY_ID = 'rzp_test_KuTmaka4Tn3byf';
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

      // Check if server is running
      try {
        const healthCheck = await fetch(`${API_URL}/health`);
        if (!healthCheck.ok) {
          throw new Error('Payment server is not responding');
        }
      } catch (error) {
        throw new Error('Unable to connect to payment server. Please try again later.');
      }

      // Load Razorpay script
      const res = await loadRazorpay();
      if (!res) {
        throw new Error('Failed to load Razorpay SDK');
      }
      const response = await fetch(`${API_URL}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: 'INR',
          receipt: orderId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const data = await response.json();

      if (!data || !data.id) {
        throw new Error('Invalid order data received');
      }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'E-Mart',
        description: 'Order Payment',
        order_id: data.id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch(`${API_URL}/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Update order status in Firestore
              const orderRef = doc(db, 'orders', orderId);
              await updateDoc(orderRef, {
                paymentStatus: 'paid',
                paymentId: response.razorpay_payment_id,
                updatedAt: new Date(),
              });

              onSuccess();
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            onFailure(error);
            setError('Payment verification failed. Please try again.');
          }
        },
        modal: {
          ondismiss: function() {
            setError('Payment cancelled. Please try again.');
            onFailure(new Error('Payment cancelled'));
          }
        },
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com',
          contact: '',
        },
        theme: {
          color: '#4CAF50',
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on('payment.failed', function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
        onFailure(response.error);
      });
      
      paymentObject.open();
    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process payment');
      onFailure(error);
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