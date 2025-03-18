export type UserRole = 'admin' | 'vendor' | 'customer';

export interface UserData {
  uid: string;
  email?: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt: Date;
} 