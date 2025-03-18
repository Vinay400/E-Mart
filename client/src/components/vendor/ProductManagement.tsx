import React, { useState, useEffect } from 'react';
import { db } from '../../../firebaseconfig';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import ProductUpload from './ProductUpload';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  vendorId: string;
  createdAt: Date;
  updatedAt: Date;
}

function ProductManagement() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, 'products'), where('vendorId', '==', user?.uid));
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Product[];
      setProducts(productsData);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter(product => product.id !== productId));
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    }
  };

  const handleStockUpdate = async (productId: string, newStock: number) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        stock: newStock,
        updatedAt: new Date(),
      });
      setProducts(products.map(product =>
        product.id === productId ? { ...product, stock: newStock } : product
      ));
    } catch (err) {
      console.error('Error updating stock:', err);
      setError('Failed to update stock');
    }
  };

  if (loading) {
    return <div className="text-center">Loading products...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          {showUploadForm ? 'Cancel' : 'Add New Product'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showUploadForm ? (
        <ProductUpload />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-2">{product.description}</p>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold">${product.price}</span>
                  <span className="text-sm text-gray-500">Category: {product.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600">Stock:</label>
                    <input
                      type="number"
                      value={product.stock}
                      onChange={(e) => handleStockUpdate(product.id, parseInt(e.target.value))}
                      min="0"
                      className="w-20 rounded border border-gray-300 px-2 py-1"
                    />
                  </div>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full text-center text-gray-500">
              No products found. Add your first product!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductManagement; 