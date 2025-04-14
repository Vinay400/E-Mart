import React, { useState, useEffect } from 'react';
import { Store, User, LogOut, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseconfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { motion } from 'framer-motion';

function MainLayout() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Video Background - Moved to top level */}
      <div className="fixed inset-0 w-full h-full -z-10">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source
            src="/119857-719283287 (online-video-cutter.com).mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 to-purple-900/80 backdrop-blur-[2px]"></div>
      </div>

      {/* Navbar - Updated for transparency */}
      <nav className="sticky top-0 z-50 bg-transparent">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-2">
              <Store className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white">
                E-Mart
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link 
                to="/contact-us"
                className="inline-flex items-center justify-center space-x-2 px-6 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-md select-none"
              >
                <MessageCircle className="h-5 w-5" />
                <span>Contact Us</span>
              </Link>
              
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-md select-none"
                  >
                    <User className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </span>
                  </button>

                  {isUserMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20"
                    >
                      <div className="py-1">
                        <Link
                          to="/customer/dashboard"
                          className="w-full inline-flex items-center space-x-2 px-4 py-2 text-left text-white hover:bg-white/20 select-none"
                        >
                          <User className="h-5 w-5 flex-shrink-0" />
                          <span>Dashboard</span>
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full inline-flex items-center space-x-2 px-4 py-2 text-left text-white hover:bg-white/20 select-none"
                        >
                          <LogOut className="h-5 w-5 flex-shrink-0" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <Link 
                  to="/signin"
                  className="inline-flex items-center justify-center space-x-2 px-6 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors backdrop-blur-md select-none"
                >
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative min-h-[calc(100vh-5rem)] flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-7xl font-bold mb-6 text-white"
            >
              Welcome to E-Mart
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl mb-8 text-gray-200"
            >
              Your one-stop shop for all your needs. Join as a customer or vendor to get started.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md mx-auto"
            >
              <Link
                to="/register"
                className="w-full inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white rounded-full font-semibold hover:bg-white/20 transition-colors backdrop-blur-md border border-white/50 select-none"
              >
                Get Started
              </Link>
              <Link
                to="/signin"
                className="w-full inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg select-none"
              >
                Sign In
              </Link>
            </motion.div>

            {/* Contact Us Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8"
            >
              <Link
                to="/contact-us"
                className="inline-flex items-center justify-center space-x-2 px-6 py-3 text-sm text-white/90 hover:text-white transition-colors select-none group"
              >
                <MessageCircle className="h-5 w-5 transform group-hover:scale-110 transition-transform" />
                <span>Need help? Contact our support team</span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Animated Gradient Orbs */}
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
        <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none"></div>
      </main>
    </div>
  );
}

export default MainLayout;