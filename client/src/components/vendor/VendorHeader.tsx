import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

interface VendorHeaderProps {
  title?: string;
}

const VendorHeader: React.FC<VendorHeaderProps> = ({ title }) => {
  const { user } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-8 text-white mb-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">
                {(user?.displayName || user?.email || 'V')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-bold">
                {user?.displayName || 'Welcome Vendor'}
              </h2>
              <p className="text-indigo-100">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <p className="text-sm text-indigo-100">{title || 'Vendor Dashboard'}</p>
            <p className="text-xs text-indigo-200 mt-1">Account ID: {user?.uid?.slice(0, 8)}...</p>
            <p className="text-xs text-indigo-200 mt-1">Last Login: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VendorHeader; 