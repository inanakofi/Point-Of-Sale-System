
import React, { useState, useMemo } from 'react';
import { Product, CartItem, Transaction, Customer, StoreSettings } from '../types';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, CheckCircle, ShoppingCart, ShoppingBag, UserPlus, X, Image as ImageIcon, Wallet, AlertTriangle, Printer } from 'lucide-react';
import { printReceipt } from '../services/printerService';

interface RegisterProps {
  products: Product[];
  customers: Customer[];
  onCompleteSale: (transaction: Transaction) => void;
  settings: StoreSettings;
}

const Register: React.FC<RegisterProps> = ({ products, customers, onCompleteSale, settings }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [completedTxId, setCompletedTxId] = useState<string | null>(null);
  const [lastTxn, setLastTxn] = useState<Transaction | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Customer Selection State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // Confirmation States
  const [isConfirmingCash, setIsConfirmingCash] = useState(false);
  const [isConfirmingCredit, setIsConfirmingCredit] = useState(false);

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map(p => p.category)))];
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  const filteredCustomers = customers.filter(c => 
     c.firstName.toLowerCase().includes(customerSearchTerm.toLowerCase()) || 
     c.lastName.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
     c.phone.includes(customerSearchTerm)
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * settings.taxRate;
    return { subtotal, tax, total: subtotal + tax };
  }, [cart, settings.taxRate]);

  const handleCheckout = (method: 'Card' | 'Cash' | 'Credit') => {
    setErrorMsg(null);

    // Intercept Cash payment for confirmation
    if (method === 'Cash' && !isConfirmingCash) {
        setIsConfirmingCash(true);
        return;
    }
    
    // Intercept Credit payment for confirmation
    if (method === 'Credit' && !isConfirmingCredit) {
        if (!selectedCustomer) {
            setErrorMsg("Customer required for credit sales.");
            return;
        }
        const availableCredit = selectedCustomer.creditLimit - selectedCustomer.currentCredit;
        if (totals.total > availableCredit) {
            setErrorMsg(`Credit limit exceeded. Available: ${settings.currencySymbol}${availableCredit.toFixed(2)}`);
            return;
        }
        setIsConfirmingCredit(true);
        return;
    }

    // Safety check for Credit logic (redundant but safe)
    if (method === 'Credit') {
        if (!selectedCustomer) {
            setErrorMsg("Customer required for credit sales.");
            return;
        }
        const availableCredit = selectedCustomer.creditLimit - selectedCustomer.currentCredit;
        if (totals.total > availableCredit) {
            setErrorMsg(`Credit limit exceeded. Available: ${settings.currencySymbol}${availableCredit.toFixed(2)}`);
            return;
        }
    }

    const txn: Transaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      type: 'SALE',
      date: new Date().toISOString(),
      items: [...cart],
      ...totals,
      paymentMethod: method,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'Walk-in'
    };
    onCompleteSale(txn);
    setIsCheckingOut(true);
    setCompletedTxId(txn.id);
    setLastTxn(txn);
    setIsConfirmingCash(false);
    setIsConfirmingCredit(false);
    
    setTimeout(() => {
        setCart([]);
        setSelectedCustomer(null);
        setIsCheckingOut(false);
        setCompletedTxId(null);
        setLastTxn(null);
        setErrorMsg(null);
    }, 4000); // Increased timeout to allow printing
  };

  const confirmCashCheckout = () => {
      handleCheckout('Cash');
  };

  const confirmCreditCheckout = () => {
      handleCheckout('Credit');
  };

  const handlePrint = () => {
      if (lastTxn) {
          printReceipt(lastTxn, settings);
      }
  };

  if (completedTxId) {
      return (
          <div className="h-full flex flex-col items-center justify-center space-y-6 animate-fade-in">
              <CheckCircle size={80} className="text-emerald-500" />
              <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-800">Payment Successful!</h2>
                  <p className="text-slate-500">Transaction ID: {completedTxId}</p>
              </div>
              <div className="flex gap-4">
                  <button 
                      onClick={handlePrint}
                      className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors shadow-lg"
                  >
                      <Printer size={20} />
                      Print Receipt
                  </button>
                  <button 
                    onClick={() => {
                        setCart([]);
                        setSelectedCustomer(null);
                        setIsCheckingOut(false);
                        setCompletedTxId(null);
                        setLastTxn(null);
                    }}
                    className="px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                      New Sale
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-6">
      {/* Product Grid Section */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search products by name or SKU..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 cursor-pointer transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="h-32 bg-slate-100 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <ImageIcon size={32} className="text-slate-300" />
                  )}
                </div>
                <div className="p-4">
                  <div>
                    <h3 className="font-semibold text-slate-800 line-clamp-1 leading-tight mb-1 group-hover:text-emerald-700">{product.name}</h3>
                    <p className="text-xs text-slate-500">{product.sku}</p>
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="font-bold text-lg text-emerald-600">{settings.currencySymbol}{product.price.toFixed(2)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${product.stock < (product.lowStockThreshold || 5) ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                      {product.stock}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        {/* Customer Selection Header */}
        <div className="p-3 border-b border-slate-100">
             {selectedCustomer ? (
                 <div className="flex items-center justify-between bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                     <div className="flex items-center space-x-2">
                         <div className="w-8 h-8 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs">
                             {selectedCustomer.firstName[0]}{selectedCustomer.lastName[0]}
                         </div>
                         <div>
                             <p className="text-sm font-bold text-slate-800">{selectedCustomer.firstName} {selectedCustomer.lastName}</p>
                             <div className="flex items-center gap-2 text-xs">
                                <span className="text-emerald-600">{selectedCustomer.loyaltyPoints} Pts</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-slate-500">Credit: {settings.currencySymbol}{(selectedCustomer.creditLimit - selectedCustomer.currentCredit).toFixed(0)}</span>
                             </div>
                         </div>
                     </div>
                     <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-rose-500">
                         <X size={16} />
                     </button>
                 </div>
             ) : (
                <div className="relative">
                    {!isCustomerSearchOpen ? (
                        <button 
                            onClick={() => setIsCustomerSearchOpen(true)}
                            className="w-full flex items-center justify-center space-x-2 py-2 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-sm font-medium"
                        >
                            <UserPlus size={16} />
                            <span>Add Customer to Sale</span>
                        </button>
                    ) : (
                        <div className="bg-white rounded-lg border border-slate-200 shadow-lg absolute top-0 left-0 w-full z-10">
                            <div className="p-2 border-b border-slate-100 flex items-center">
                                <Search size={14} className="text-slate-400 mr-2" />
                                <input 
                                    autoFocus
                                    className="flex-1 outline-none text-sm" 
                                    placeholder="Search customer..."
                                    value={customerSearchTerm}
                                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                />
                                <button onClick={() => setIsCustomerSearchOpen(false)}><X size={14} className="text-slate-400"/></button>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {filteredCustomers.length === 0 ? (
                                    <div className="p-3 text-center text-xs text-slate-400">No customers found</div>
                                ) : (
                                    filteredCustomers.map(c => (
                                        <div 
                                            key={c.id} 
                                            className="p-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                                            onClick={() => {
                                                setSelectedCustomer(c);
                                                setIsCustomerSearchOpen(false);
                                                setCustomerSearchTerm('');
                                            }}
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-slate-800">{c.firstName} {c.lastName}</p>
                                                <p className="text-xs text-slate-500">{c.phone}</p>
                                            </div>
                                            <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{c.loyaltyPoints} pts</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
             )}
        </div>

        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart size={20} className="text-emerald-600" />
            Current Sale
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingBag size={48} opacity={0.5} />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex-1 min-w-0 mr-3">
                  <h4 className="font-medium text-slate-800 truncate">{item.name}</h4>
                  <p className="text-sm text-emerald-600 font-semibold">{settings.currencySymbol}{(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-2">
                   <button 
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1 hover:bg-slate-200 rounded-md text-slate-500"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-6 text-center font-medium text-slate-700">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-1 hover:bg-slate-200 rounded-md text-slate-500"
                  >
                    <Plus size={16} />
                  </button>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-500 rounded-md ml-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{settings.currencySymbol}{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax ({(settings.taxRate * 100).toFixed(0)}%)</span>
              <span>{settings.currencySymbol}{totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-800 font-bold text-xl pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>{settings.currencySymbol}{totals.total.toFixed(2)}</span>
            </div>
          </div>
          
          {errorMsg && (
              <div className="mb-3 p-2 bg-rose-50 text-rose-600 text-xs rounded border border-rose-100 flex items-center gap-2">
                  <AlertTriangle size={14} />
                  {errorMsg}
              </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <button 
              disabled={cart.length === 0 || isCheckingOut}
              onClick={() => handleCheckout('Cash')}
              className="flex flex-col items-center justify-center p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-xs"
            >
              <Banknote size={18} className="mb-1" />
              <span>Cash</span>
            </button>
            <button 
              disabled={cart.length === 0 || isCheckingOut}
              onClick={() => handleCheckout('Card')}
              className="flex flex-col items-center justify-center p-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-xs"
            >
              <CreditCard size={18} className="mb-1" />
              <span>Card</span>
            </button>
            <button 
              disabled={cart.length === 0 || isCheckingOut || !selectedCustomer}
              onClick={() => handleCheckout('Credit')}
              className="flex flex-col items-center justify-center p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors text-xs"
              title={!selectedCustomer ? "Select customer first" : "Pay Later"}
            >
              <Wallet size={18} className="mb-1" />
              <span>Credit</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Cash Confirmation Modal */}
      {isConfirmingCash && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in text-center p-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Banknote size={32} className="text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Confirm Cash Sale</h3>
                  <p className="text-slate-600 mb-6">
                      Total Due: <span className="font-bold text-2xl block mt-2 text-slate-900">{settings.currencySymbol}{totals.total.toFixed(2)}</span>
                  </p>
                  <div className="flex gap-3 justify-center">
                      <button 
                          onClick={() => setIsConfirmingCash(false)}
                          className="px-5 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmCashCheckout}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-lg shadow-emerald-200"
                      >
                          Confirm Sale
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Credit Confirmation Modal */}
      {isConfirmingCredit && selectedCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in p-6 relative">
                  <button onClick={() => setIsConfirmingCredit(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Wallet size={32} className="text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Confirm Credit Sale</h3>
                      <p className="text-slate-500 text-sm mt-1">Transaction will be added to customer debt.</p>
                  </div>

                  <div className="space-y-4 mb-6">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex justify-between text-sm text-slate-600 mb-1">
                              <span>Customer</span>
                              <span className="font-medium text-slate-800">{selectedCustomer.firstName} {selectedCustomer.lastName}</span>
                          </div>
                          <div className="flex justify-between text-sm text-slate-600 mb-1">
                              <span>Current Debt</span>
                              <span>{settings.currencySymbol}{selectedCustomer.currentCredit.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-emerald-600 font-medium mb-1 border-t border-slate-200 pt-1">
                              <span>+ New Purchase</span>
                              <span>{settings.currencySymbol}{totals.total.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-1 mt-1">
                              <span>New Balance</span>
                              <span>{settings.currencySymbol}{(selectedCustomer.currentCredit + totals.total).toFixed(2)}</span>
                          </div>
                      </div>
                      
                      <div className="text-xs text-center text-slate-400">
                          Credit Limit: {settings.currencySymbol}{selectedCustomer.creditLimit.toFixed(2)}
                      </div>
                  </div>

                  <div className="flex gap-3 justify-center">
                      <button 
                          onClick={() => setIsConfirmingCredit(false)}
                          className="px-5 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium flex-1"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmCreditCheckout}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-indigo-200 flex-1"
                      >
                          Confirm
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Register;
