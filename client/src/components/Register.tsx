import React, { useState } from 'react';
import { auth, db } from '../../firebaseconfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { setDoc, doc } from 'firebase/firestore';
import { UserRole } from '../types/auth';

interface BusinessDetails {
  businessName: string;
  phone: string;
  address: string;
}

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [error, setError] = useState('');
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
    businessName: '',
    phone: '',
    address: ''
  });
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Validate business details if registering as vendor
    if (role === 'vendor') {
      if (!businessDetails.businessName.trim()) {
        setError('Business name is required for vendors');
        return;
      }
      if (!businessDetails.phone.trim()) {
        setError('Phone number is required for vendors');
        return;
      }
      if (!businessDetails.address.trim()) {
        setError('Business address is required for vendors');
        return;
      }
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role,
        createdAt: new Date(),
        status: role === 'vendor' ? 'pending' : 'active'
      });

      // If registering as vendor, create vendor document
      if (role === 'vendor') {
        await setDoc(doc(db, 'vendors', user.uid), {
          email: user.email,
          businessName: businessDetails.businessName,
          phone: businessDetails.phone,
          address: businessDetails.address,
          status: 'pending',
          createdAt: new Date(),
          productsCount: 0
        });
      }

      navigate('/signin');
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Business Details Section (shown only for vendors) */}
          {role === 'vendor' && (
            <div className="space-y-4 border-t pt-4 mt-4">
              <h3 className="text-lg font-medium text-gray-900">Business Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <input
                  type="text"
                  value={businessDetails.businessName}
                  onChange={(e) => setBusinessDetails(prev => ({
                    ...prev,
                    businessName: e.target.value
                  }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={businessDetails.phone}
                  onChange={(e) => setBusinessDetails(prev => ({
                    ...prev,
                    phone: e.target.value
                  }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Business Address</label>
                <textarea
                  value={businessDetails.address}
                  onChange={(e) => setBusinessDetails(prev => ({
                    ...prev,
                    address: e.target.value
                  }))}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Register
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={() => navigate('/SignIn')}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition-colors"
          >
            Already have an account? Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;