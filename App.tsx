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
import { DEFAULT_SETTINGS } from './constants';
import { initializeDatabase } from './services/storageService';
import { db } from './services/db';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // App State
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  // Initialization Effect
  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();
        
        const [
            loadedProducts,
            loadedTransactions,
            loadedCustomers,
            loadedUsers,
            loadedSettings
        ] = await Promise.all([
            db.getAll<Product>('products'),
            db.getAll<Transaction>('transactions'),
            db.getAll<Customer>('customers'),
            db.getAll<User>('users'),
            db.getSettings()
        ]);

        // Fix sort order for transactions (newest first)
        loadedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setProducts(loadedProducts);
        setTransactions(loadedTransactions);
        setCustomers(loadedCustomers);
        setUsers(loadedUsers);
        if (loadedSettings) setSettings(loadedSettings);
      } catch (error) {
          console.error("Failed to initialize database", error);
      } finally {
          setLoading(false);
      }
    };
    init();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // --- Handlers with DB Persistence ---

  const handleAddProduct = async (newProduct: Product) => {
    await db.add('products', newProduct);
    setProducts(prev => [newProduct, ...prev]);
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    await db.update('products', updatedProduct);
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleAddCustomer = async (newCustomer: Customer) => {
    await db.add('customers', newCustomer);
    setCustomers(prev => [newCustomer, ...prev]);
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    await db.update('customers', updatedCustomer);
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  };

  const handleCompleteSale = async (newTxn: Transaction) => {
    // 1. Save Transaction
    await db.add('transactions', newTxn);
    setTransactions(prev => [newTxn, ...prev]);
    
    // 2. Decrease stock
    const updatedProducts: Product[] = [];
    const newProductsState = products.map(p => {
      const soldItem = newTxn.items.find(i => i.id === p.id);
      if (soldItem) {
        const updated = { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
        updatedProducts.push(updated);
        return updated;
      }
      return p;
    });
    
    // Update State
    setProducts(newProductsState);
    // Update DB (Parallel)
    await Promise.all(updatedProducts.map(p => db.update('products', p)));

    // 3. Update Customer Stats
    if (newTxn.customerId) {
        let updatedCustomer: Customer | undefined;
        const newCustomersState = customers.map(c => {
            if (c.id === newTxn.customerId) {
                updatedCustomer = {
                    ...c,
                    totalSpent: c.totalSpent + newTxn.total,
                    loyaltyPoints: c.loyaltyPoints + Math.floor(newTxn.total),
                    currentCredit: newTxn.paymentMethod === 'Credit' 
                        ? c.currentCredit + newTxn.total 
                        : c.currentCredit
                };
                return updatedCustomer;
            }
            return c;
        });
        
        setCustomers(newCustomersState);
        if (updatedCustomer) await db.update('customers', updatedCustomer);
    }
  };

  const handleDebtPayment = async (customerId: string, amount: number) => {
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

    await db.add('transactions', paymentTxn);
    setTransactions(prev => [paymentTxn, ...prev]);

    // Decrease customer debt
    const updatedCustomer = {
        ...customer,
        currentCredit: Math.max(0, customer.currentCredit - amount)
    };
    
    await db.update('customers', updatedCustomer);
    setCustomers(prev => prev.map(c => c.id === customerId ? updatedCustomer : c));
  };

  const handleUpdateSettings = async (newSettings: StoreSettings) => {
      await db.saveSettings(newSettings);
      setSettings(newSettings);
  };

  // User Management Handlers
  const handleAddUser = async (user: User) => {
      await db.add('users', user);
      setUsers(prev => [...prev, user]);
  };

  const handleUpdateUser = async (updatedUser: User) => {
      await db.update('users', updatedUser);
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteUser = async (userId: string) => {
      await db.delete('users', userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
  };

  if (loading) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white">
              <Loader2 size={48} className="animate-spin text-emerald-500 mb-4" />
              <h2 className="text-xl font-bold">Loading QikPOS...</h2>
              <p className="text-slate-400 text-sm">Initializing Database</p>
          </div>
      );
  }

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
                onUpdateSettings={handleUpdateSettings}
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