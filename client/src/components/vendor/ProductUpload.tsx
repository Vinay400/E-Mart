import React, { useState } from 'react';
import { db, storage } from '../../../firebaseconfig';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../hooks/useAuth';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: File | null;
}

function ProductUpload() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    image: null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let imageUrl = '';
      
      // Upload image if selected
      if (formData.image) {
        // Create a unique filename
        const timestamp = Date.now();
        const uniqueFilename = `${timestamp}_${formData.image.name}`;
        const storageRef = ref(storage, `products/${user.uid}/${uniqueFilename}`);
        
        // Upload the file
        await uploadBytes(storageRef, formData.image);
        // Get the download URL
        imageUrl = await getDownloadURL(storageRef);
      }

      // Add product to Firestore
      await addDoc(collection(db, 'products'), {
        ...formData,
        imageUrl,
        vendorId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setSuccess(true);
      setFormData({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category: '',
        image: null,
      });
    } catch (err: any) {
      console.error('Error uploading product:', err);
      if (err.code === 'storage/unauthorized') {
        setError('You are not authorized to upload images');
      } else if (err.code === 'storage/canceled') {
        setError('Upload was canceled');
      } else if (err.code === 'storage/unknown') {
        setError('An unknown error occurred');
      } else {
        setError('Failed to upload product. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Product uploaded successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price ($)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              required
              min="0"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="">Select a category</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="books">Books</option>
            <option value="home">Home & Garden</option>
            <option value="sports">Sports</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
            className="mt-1 block w-full"
          />
          {formData.image && (
            <p className="mt-1 text-sm text-gray-500">
              Selected file: {formData.image.name}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Upload Product'}
        </button>
      </form>
    </div>
  );
}

export default ProductUpload; 