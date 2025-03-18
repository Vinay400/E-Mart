import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, User, MessageCircle, ChevronRight, Store, MapPin, Users, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../firebaseconfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function MainLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const contactus = () => {
    navigate('/contactus');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-x-hidden">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <Store className="h-8 w-8 text-indigo-600" />
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">E-Mart</span>
              </Link>
              
              <div className="hidden lg:flex items-center space-x-8">
                <div className="group relative">
                  <button className="flex items-center space-x-1 text-gray-700 hover:text-indigo-600 transition-colors">
                    <span>Solutions</span>
                    <ChevronRight className="h-4 w-4 transform group-hover:rotate-90 transition-transform" />
                  </button>
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100">
                    <div className="p-4 space-y-3">
                      {['Multi Vendor', 'Multi Store', 'Multilingual', 'Service Aggregator', 'Delivery Management', 'Food & Beverages'].map((item) => (
                        <a key={item} href="#" className="flex items-center space-x-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg p-2 transition-colors">
                          <Store className="h-5 w-5" />
                          <span>{item}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
                <a href="#" className="text-gray-700 hover:text-indigo-600 transition-colors">Develop</a>
                <a href="#" className="text-gray-700 hover:text-indigo-600 transition-colors">Examples</a>
                <a href="#" className="text-gray-700 hover:text-indigo-600 transition-colors">Pricing</a>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">
                      {currentUser.displayName?.split('@')[0]}
                    </span>
                    <ChevronRight className={`h-4 w-4 transform transition-transform ${isUserMenuOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100">
                      <div className="py-1">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  to="/signin"
                  className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  <span>Sign In</span>
                </Link>
              )}
              
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557821552-17105176677c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1932&q=80')] bg-cover bg-center opacity-10"></div>
        </div>
        
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight animate-fade-in">
              Multi-Vendor Ecommerce Platform
            </h1>
            <p className="text-xl mb-8 text-indigo-100 animate-fade-in-delay-1">
              Build Scalable Multi-Vendor Marketplaces in No Time. Sell 10x more by turning your idea into a Multi-Vendor marketplace.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in-delay-2">
              <button className="px-8 py-4 bg-white text-indigo-600 rounded-full font-semibold hover:bg-indigo-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Start Free Trial
              </button>
              <button className="px-8 py-4 border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-all" onClick={contactus}>
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -right-40 -top-40 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -left-40 -bottom-40 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Why Choose Our Multi-Seller Platform?
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Complete Admin Control",
              description: "Full control over vendors, orders, commissions, and products with real-time analytics",
              icon: Store,
              color: "indigo"
            },
            {
              title: "Vendor Freedom",
              description: "Easy registration and seamless selling experience with powerful management tools",
              icon: Users,
              color: "purple"
            },
            {
              title: "Global Reach",
              description: "Expand your marketplace globally with multi-currency and language support",
              icon: MapPin,
              color: "pink"
            }
          ].map((feature, index) => (
            <div 
              key={index} 
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
            >
              <div className={`w-14 h-14 rounded-xl bg-${feature.color}-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-7 h-7 text-${feature.color}-600`} />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {[
              {
                title: "Information",
                links: ["About Us", "Careers", "Contact Us", "Media", "Privacy Policy"]
              },
              {
                title: "Support",
                links: ["API Reference", "Experts", "Forums", "Help Center"]
              },
              {
                title: "Explore",
                links: ["Blog", "Examples", "Industries", "Solutions"]
              },
              {
                title: "Features",
                links: ["All Features", "B2B Ecommerce", "Multi Store", "Payment"]
              },
              {
                title: "Compare",
                links: ["Vs Shopify", "Vs Magento", "Vs WooCommerce"]
              }
            ].map((section, index) => (
              <div key={index}>
                <h4 className="font-semibold text-lg mb-4 text-white/90">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-800 mt-16 pt-8 text-center text-gray-400">
            <p>© 2022-2025, E-MART. All Rights Reserved.</p>
            <p className="mt-2">Made with ❤️ by Vishal Singh</p>
          </div>
        </div>
      </footer>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-4">
        <button className="p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors transform hover:-translate-y-1">
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

export default MainLayout;