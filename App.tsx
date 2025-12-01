
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Register from './components/Register';
import Inventory from './components/Inventory';
import Customers from './components/Customers';
import Reports from './components/Reports';
import Login from './components/Login';
import Settings from './components/Settings';
import { ViewState, Product, Transaction, Customer, User, StoreSettings } from './types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_USERS, DEFAULT_SETTINGS } from './constants';
import { loadData, saveData, KEYS } from './services/storageService';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App State - Load from Storage or fallback to Mock Data
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [products, setProducts] = useState<Product[]>(() => loadData(KEYS.PRODUCTS, MOCK_PRODUCTS));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadData(KEYS.TRANSACTIONS, MOCK_TRANSACTIONS));
  const [customers, setCustomers] = useState<Customer[]>(() => loadData(KEYS.CUSTOMERS, MOCK_CUSTOMERS));
  const [users, setUsers] = useState<User[]>(() => loadData(KEYS.USERS, MOCK_USERS));
  const [settings, setSettings] = useState<StoreSettings>(() => loadData(KEYS.SETTINGS, DEFAULT_SETTINGS));

  // Persistence Effects
  useEffect(() => saveData(KEYS.PRODUCTS, products), [products]);
  useEffect(() => saveData(KEYS.TRANSACTIONS, transactions), [transactions]);
  useEffect(() => saveData(KEYS.CUSTOMERS, customers), [customers]);
  useEffect(() => saveData(KEYS.USERS, users), [users]);
  useEffect(() => saveData(KEYS.SETTINGS, settings), [settings]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleAddCustomer = (newCustomer: Customer) => {
    setCustomers(prev => [newCustomer, ...prev]);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  };

  const handleCompleteSale = (newTxn: Transaction) => {
    setTransactions(prev => [newTxn, ...prev]);
    
    // Decrease stock
    setProducts(prev => prev.map(p => {
      const soldItem = newTxn.items.find(i => i.id === p.id);
      if (soldItem) {
        return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
      }
      return p;
    }));

    // Update Customer Stats (Loyalty Points, Total Spent, and Credit)
    if (newTxn.customerId) {
        setCustomers(prev => prev.map(c => {
            if (c.id === newTxn.customerId) {
                return {
                    ...c,
                    totalSpent: c.totalSpent + newTxn.total,
                    loyaltyPoints: c.loyaltyPoints + Math.floor(newTxn.total), // 1 point per currency unit
                    // If payment method is Credit, increase currentCredit
                    currentCredit: newTxn.paymentMethod === 'Credit' 
                        ? c.currentCredit + newTxn.total 
                        : c.currentCredit
                }
            }
            return c;
        }));
    }
  };

  const handleDebtPayment = (customerId: string, amount: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    // Create a payment transaction record
    const paymentTxn: Transaction = {
      id: `PAY-${Date.now()}`,
      type: 'PAYMENT',
      date: new Date().toISOString(),
      items: [],
      subtotal: 0,
      tax: 0,
      total: amount,
      paymentMethod: 'Cash',
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`
    };

    setTransactions(prev => [paymentTxn, ...prev]);

    // Decrease customer debt
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          currentCredit: Math.max(0, c.currentCredit - amount)
        };
      }
      return c;
    }));
  };

  // User Management Handlers
  const handleAddUser = (user: User) => setUsers(prev => [...prev, user]);
  const handleUpdateUser = (updatedUser: User) => setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  const handleDeleteUser = (userId: string) => setUsers(prev => prev.filter(u => u.id !== userId));

  if (!currentUser) {
    return <Login users={users} storeName={settings.storeName} onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            transactions={transactions} 
            products={products} 
            settings={settings} 
            currentUser={currentUser}
            onNavigate={setCurrentView}
          />
        );
      case 'REGISTER':
        return <Register products={products} customers={customers} onCompleteSale={handleCompleteSale} settings={settings} />;
      case 'INVENTORY':
        return <Inventory products={products} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} settings={settings} />;
      case 'CUSTOMERS':
        return <Customers customers={customers} transactions={transactions} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} onDebtPayment={handleDebtPayment} settings={settings} />;
      case 'REPORTS':
        return <Reports transactions={transactions} />;
      case 'SETTINGS':
        return (
            <Settings 
                settings={settings} 
                users={users} 
                onUpdateSettings={setSettings}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
            />
        );
      default:
        return (
          <Dashboard 
            transactions={transactions} 
            products={products} 
            settings={settings} 
            currentUser={currentUser}
            onNavigate={setCurrentView}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        currentUser={currentUser} 
        onLogout={handleLogout}
        settings={settings}
      />
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
