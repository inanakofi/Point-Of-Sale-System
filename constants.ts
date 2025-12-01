
import { Product, Transaction, Customer, User, StoreSettings } from './types';

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'QikPOS AI',
  currencySymbol: 'GH₵',
  taxRate: 0.08,
  address: '123 Main Street, Accra, Ghana',
  phone: '+233 55 123 4567'
};

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Admin User', pin: '1234', role: 'ADMIN' },
  { id: 'u2', name: 'John Doe', pin: '0000', role: 'STAFF' },
  { id: 'u3', name: 'Jane Smith', pin: '1111', role: 'STAFF' }
];

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Vintage Denim Jacket', category: 'Apparel', price: 89.99, cost: 45.00, stock: 12, lowStockThreshold: 5, sku: 'APP-001', description: 'Classic blue denim jacket with brass buttons.', image: undefined },
  { id: '2', name: 'Cotton Crew Neck Tee', category: 'Apparel', price: 24.50, cost: 8.50, stock: 45, lowStockThreshold: 10, sku: 'APP-002', description: 'Soft cotton t-shirt available in multiple colors.', image: undefined },
  { id: '3', name: 'Leather Crossbody Bag', category: 'Accessories', price: 129.00, cost: 60.00, stock: 8, lowStockThreshold: 3, sku: 'ACC-003', description: 'Genuine leather bag with adjustable strap.', image: undefined },
  { id: '4', name: 'Stainless Steel Water Bottle', category: 'Home', price: 35.00, cost: 12.00, stock: 20, lowStockThreshold: 5, sku: 'HOM-004', description: 'Insulated bottle keeps drinks cold for 24 hours.', image: undefined },
  { id: '5', name: 'Wireless Earbuds', category: 'Electronics', price: 149.99, cost: 85.00, stock: 15, lowStockThreshold: 5, sku: 'ELE-005', description: 'Noise-cancelling earbuds with charging case.', image: undefined },
  { id: '6', name: 'Ceramic Coffee Mug', category: 'Home', price: 12.99, cost: 4.50, stock: 30, lowStockThreshold: 10, sku: 'HOM-006', description: 'Handcrafted ceramic mug, dishwasher safe.', image: undefined },
  { id: '7', name: 'Running Shoes', category: 'Footwear', price: 95.00, cost: 45.00, stock: 10, lowStockThreshold: 8, sku: 'FTW-007', description: 'Lightweight running shoes with foam cushioning.', image: undefined },
  { id: '8', name: 'Wool Scarf', category: 'Accessories', price: 45.00, cost: 15.00, stock: 25, lowStockThreshold: 5, sku: 'ACC-008', description: 'Merino wool scarf, perfect for winter.', image: undefined },
  { id: '9', name: 'Smart Watch', category: 'Electronics', price: 299.00, cost: 180.00, stock: 5, lowStockThreshold: 2, sku: 'ELE-009', description: 'Fitness tracker and smart watch hybrid.', image: undefined },
  { id: '10', name: 'Yoga Mat', category: 'Fitness', price: 29.99, cost: 12.00, stock: 18, lowStockThreshold: 5, sku: 'FIT-010', description: 'Non-slip eco-friendly yoga mat.', image: undefined },
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', firstName: 'Alice', lastName: 'Johnson', email: 'alice.j@example.com', phone: '555-0101', loyaltyPoints: 120, totalSpent: 450.50, joinDate: '2023-01-15', notes: 'Prefers eco-friendly products', creditLimit: 500, currentCredit: 0 },
  { id: 'c2', firstName: 'Bob', lastName: 'Smith', email: 'bob.smith@example.com', phone: '555-0102', loyaltyPoints: 45, totalSpent: 125.00, joinDate: '2023-03-22', creditLimit: 200, currentCredit: 50 },
  { id: 'c3', firstName: 'Carol', lastName: 'Davis', email: 'carol.d@example.com', phone: '555-0103', loyaltyPoints: 890, totalSpent: 2350.75, joinDate: '2022-11-05', notes: 'VIP customer', creditLimit: 2000, currentCredit: 120 },
  { id: 'c4', firstName: 'David', lastName: 'Wilson', email: 'david.w@example.com', phone: '555-0104', loyaltyPoints: 10, totalSpent: 55.20, joinDate: '2023-06-10', creditLimit: 100, currentCredit: 0 },
  { id: 'c5', firstName: 'Eva', lastName: 'Brown', email: 'eva.b@example.com', phone: '555-0105', loyaltyPoints: 230, totalSpent: 890.00, joinDate: '2023-02-01', creditLimit: 1000, currentCredit: 850 },
];

export const MOCK_TRANSACTIONS: Transaction[] = Array.from({ length: 50 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date in last 30 days
  
  const itemCount = Math.floor(Math.random() * 3) + 1;
  const items: any[] = [];
  let subtotal = 0;
  
  for(let j=0; j<itemCount; j++) {
    const product = MOCK_PRODUCTS[Math.floor(Math.random() * MOCK_PRODUCTS.length)];
    const qty = Math.floor(Math.random() * 2) + 1;
    items.push({ ...product, quantity: qty });
    subtotal += product.price * qty;
  }
  
  const customer = Math.random() > 0.7 ? MOCK_CUSTOMERS[Math.floor(Math.random() * MOCK_CUSTOMERS.length)] : null;
  const methodOptions = ['Card', 'Cash', 'Credit'];
  const paymentMethod = methodOptions[Math.floor(Math.random() * methodOptions.length)] as 'Card' | 'Cash' | 'Credit';

  const transaction: Transaction = {
    id: `TXN-${1000 + i}`,
    type: 'SALE',
    date: date.toISOString(),
    items,
    subtotal,
    tax: subtotal * DEFAULT_SETTINGS.taxRate,
    total: subtotal * (1 + DEFAULT_SETTINGS.taxRate),
    paymentMethod: customer ? paymentMethod : (Math.random() > 0.5 ? 'Card' : 'Cash'),
    customerId: customer?.id,
    customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Walk-in Customer'
  };

  return transaction;
}).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
