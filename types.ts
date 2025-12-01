
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number; // New field for inventory management
  stock: number;
  lowStockThreshold: number; // New field for alerts
  sku: string;
  description?: string;
  image?: string; // Base64 data URL or URL
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  totalSpent: number;
  joinDate: string;
  notes?: string;
  creditLimit: number;
  currentCredit: number; // Amount currently owed
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  type: 'SALE' | 'PAYMENT'; // New field to distinguish transaction types
  date: string; // ISO string
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'Online' | 'Credit';
  customerId?: string; // Link to customer
  customerName?: string; // Fallback or display name
}

export type ViewState = 'DASHBOARD' | 'REGISTER' | 'INVENTORY' | 'CUSTOMERS' | 'REPORTS' | 'SETTINGS';

export interface SalesSummary {
  dailySales: { date: string; amount: number }[];
  topProducts: { name: string; sold: number }[];
  totalRevenue: number;
  totalOrders: number;
}

export type UserRole = 'ADMIN' | 'STAFF';

export interface User {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
}

export interface StoreSettings {
  storeName: string;
  currencySymbol: string;
  taxRate: number; // percentage as decimal (e.g. 0.08)
  address: string;
  phone: string;
  receiptHeader?: string;
  receiptFooter?: string;
}
