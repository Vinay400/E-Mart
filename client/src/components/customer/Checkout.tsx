import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShoppingBag, FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import { db, auth } from '../../../firebaseconfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Payment from './Payment';
import './Checkout.css';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendor: string;
  vendorId: string;
}

interface CheckoutProps {
  cartItems: CartItem[];
  total: number;
  onOrderComplete?: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, total, onOrderComplete }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [showPayment, setShowPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    additionalNotes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const required = ['fullName', 'phone', 'address', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        setError(`Please fill in all required fields`);
        return false;
      }
    }
    return true;
  };

  const calculateShipping = () => {
    return 50; // Fixed shipping cost
  };

  const calculateTotal = () => {
    return total + calculateShipping();
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Please sign in to place an order');
      }

      const orderItems = cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        vendorId: item.vendorId,
        vendor: item.vendor
      }));

      const orderData = {
        customerId: user.uid,
        customerName: formData.fullName,
        items: orderItems,
        shippingAddress: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        subtotal: total,
        shipping: calculateShipping(),
        totalAmount: calculateTotal(),
        paymentMethod,
        status: 'pending',
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'unpaid',
        createdAt: serverTimestamp()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      setOrderId(orderRef.id);

      if (paymentMethod === 'online') {
        setShowPayment(true);
      } else {
        if (onOrderComplete) onOrderComplete();
        navigate('/order-confirmation', { state: { orderId: orderRef.id } });
      }
    } catch (err) {
      console.error('Error placing order:', err);
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    if (onOrderComplete) onOrderComplete();
    setShowPayment(false);
    navigate('/order-confirmation', { state: { orderId } });
  };

  const handlePaymentFailure = (error: any) => {
    setError('Payment failed. Please try again.');
    setShowPayment(false);
  };

  if (showPayment && orderId) {
    return (
      <Payment
        orderId={orderId}
        amount={calculateTotal()}
        onSuccess={handlePaymentSuccess}
        onFailure={handlePaymentFailure}
      />
    );
  }

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      <form onSubmit={handlePlaceOrder}>
        <div className="checkout-content">
          <div className="shipping-section">
            <h3>Shipping Information</h3>
            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="state">State *</label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="zipCode">ZIP Code *</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="additionalNotes">Additional Notes</label>
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleInputChange}
                placeholder="Any special instructions for delivery"
              />
            </div>
          </div>

          <div className="order-section">
            <div className="order-summary">
              <h3>Order Summary</h3>
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} />
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p>₹{item.price} x {item.quantity}</p>
                  </div>
                  <p className="item-total">₹{item.price * item.quantity}</p>
                </div>
              ))}
              
              <div className="summary-total">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{total}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>₹{calculateShipping()}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{calculateTotal()}</span>
                </div>
              </div>
            </div>

            <div className="payment-section">
              <h3>Payment Method</h3>
              <div className="payment-methods">
                <div 
                  className={`payment-method ${paymentMethod === 'cod' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <FaMoneyBillWave />
                  <span>Cash on Delivery</span>
                  <p className="payment-description">Pay with cash upon delivery</p>
                </div>
                <div 
                  className={`payment-method ${paymentMethod === 'online' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('online')}
                >
                  <FaCreditCard />
                  <span>Pay Online</span>
                  <p className="payment-description">Pay securely with Razorpay</p>
                </div>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="place-order-btn"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout; 