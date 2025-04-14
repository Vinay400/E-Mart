export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendor: string;
  vendorId: string;
  productId: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description?: string;
  vendorId: string;
  vendor?: string;
  stock?: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
    vendorId: string;
    vendor: string;
  }[];
  totalAmount: number;
  subtotal: number;
  shipping: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: string;
  paymentMethod: 'cod' | 'online';
  createdAt: any; // Firebase Timestamp
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
} 