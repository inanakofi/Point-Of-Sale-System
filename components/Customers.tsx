
import React, { useState } from 'react';
import { Customer, Transaction, StoreSettings } from '../types';
import { Search, Plus, User, Phone, Mail, Award, Edit2, Calendar, ArrowLeft, ShoppingBag, Clock, Filter, ArrowUp, ArrowDown, Wallet, Banknote, AlertTriangle, CheckCircle } from 'lucide-react';

interface CustomersProps {
  customers: Customer[];
  transactions: Transaction[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDebtPayment: (customerId: string, amount: number) => void;
  settings: StoreSettings;
}

const Customers: React.FC<CustomersProps> = ({ customers, transactions, onAddCustomer, onUpdateCustomer, onDebtPayment, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'joined' | 'spent' | 'loyalty' | 'debt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Debt Payment State
  const [isPayDebtModalOpen, setIsPayDebtModalOpen] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  const [formData, setFormData] = useState<Partial<Customer>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    creditLimit: 0,
    currentCredit: 0
  });

  const viewingCustomer = viewingCustomerId ? customers.find(c => c.id === viewingCustomerId) : null;

  const filteredAndSortedCustomers = customers
    .filter(c => 
      c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'joined':
          comparison = new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
          break;
        case 'spent':
          comparison = a.totalSpent - b.totalSpent;
          break;
        case 'loyalty':
          comparison = a.loyaltyPoints - b.loyaltyPoints;
          break;
        case 'debt':
          comparison = a.currentCredit - b.currentCredit;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleOpenModal = (customer?: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormError(null);
    if (customer) {
      setEditingId(customer.id);
      setFormData(customer);
    } else {
      setEditingId(null);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', notes: '', creditLimit: 500, currentCredit: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const creditLimit = Number(formData.creditLimit) || 0;
    const currentCredit = Number(formData.currentCredit) || 0;

    // Validation: Credit Limit cannot be less than Current Debt
    if (creditLimit < currentCredit) {
      setFormError(`Credit limit (${settings.currencySymbol}${creditLimit}) cannot be less than current debt (${settings.currencySymbol}${currentCredit})`);
      return;
    }

    if (formData.firstName && formData.lastName) {
      if (editingId) {
        // Update existing
        const updatedCustomer = {
            ...customers.find(c => c.id === editingId)!,
            ...formData,
            creditLimit: creditLimit,
        } as Customer;
        onUpdateCustomer(updatedCustomer);
      } else {
        // Create new
        const newCustomer: Customer = {
          id: `CUST-${Date.now()}`,
          firstName: formData.firstName!,
          lastName: formData.lastName!,
          email: formData.email || '',
          phone: formData.phone || '',
          loyaltyPoints: 0,
          totalSpent: 0,
          joinDate: new Date().toISOString().split('T')[0],
          notes: formData.notes,
          creditLimit: creditLimit,
          currentCredit: 0
        };
        onAddCustomer(newCustomer);
      }
      setIsModalOpen(false);
    }
  };

  const handlePayDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingCustomer) return;
    
    const amount = parseFloat(paymentAmount);
    if (amount > 0) {
      // Open confirmation dialog instead of submitting immediately
      setIsConfirmingPayment(true);
    }
  };

  const finalizePayment = () => {
    if (!viewingCustomer) return;
    const amount = parseFloat(paymentAmount);
    if (amount > 0) {
      onDebtPayment(viewingCustomer.id, amount);
      setIsConfirmingPayment(false);
      setIsPayDebtModalOpen(false);
      setPaymentAmount('');
    }
  };

  const handleOpenPayDebt = () => {
    if (viewingCustomer) {
      setPaymentAmount(viewingCustomer.currentCredit.toFixed(2));
      setIsPayDebtModalOpen(true);
      setIsConfirmingPayment(false);
    }
  };

  // Detailed View Render
  if (viewingCustomer) {
    const customerHistory = transactions.filter(t => t.customerId === viewingCustomer.id);
    const creditPercent = viewingCustomer.creditLimit > 0 ? (viewingCustomer.currentCredit / viewingCustomer.creditLimit) * 100 : 0;

    return (
      <div className="space-y-6 animate-fade-in">
        <button 
          onClick={() => setViewingCustomerId(null)}
          className="flex items-center space-x-2 text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Customer List</span>
        </button>

        {/* Header Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-6 opacity-10">
              <User size={120} className="text-emerald-900" />
           </div>
           
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-3xl shadow-inner">
                    {viewingCustomer.firstName[0]}{viewingCustomer.lastName[0]}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-800">{viewingCustomer.firstName} {viewingCustomer.lastName}</h1>
                    <div className="flex items-center gap-4 text-slate-500 mt-2 text-sm">
                        <span className="flex items-center gap-1"><Mail size={14}/> {viewingCustomer.email}</span>
                        <span className="flex items-center gap-1"><Phone size={14}/> {viewingCustomer.phone}</span>
                        <span className="flex items-center gap-1"><Calendar size={14}/> Joined {viewingCustomer.joinDate}</span>
                    </div>
                  </div>
              </div>
              <div className="flex flex-wrap items-center gap-6 justify-end">
                  <div className="text-right">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Lifetime Value</p>
                      <p className="text-2xl font-bold text-slate-800">{settings.currencySymbol}{viewingCustomer.totalSpent.toFixed(2)}</p>
                  </div>
                  
                  <div className="text-right">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Credit Balance</p>
                      <p className={`text-2xl font-bold ${viewingCustomer.currentCredit > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {settings.currencySymbol}{viewingCustomer.currentCredit.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">Limit: {settings.currencySymbol}{viewingCustomer.creditLimit.toFixed(2)}</p>
                  </div>
                  
                  {viewingCustomer.currentCredit > 0 && (
                      <button 
                        onClick={handleOpenPayDebt}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-indigo-200"
                      >
                          <Banknote size={16} />
                          Pay Debt
                      </button>
                  )}

                  <div className="text-right">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loyalty Points</p>
                      <p className="text-2xl font-bold text-emerald-600 flex items-center gap-1 justify-end">
                          <Award size={20} />
                          {viewingCustomer.loyaltyPoints}
                      </p>
                  </div>
                  <button 
                    onClick={(e) => handleOpenModal(viewingCustomer, e)}
                    className="ml-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                  >
                    <Edit2 size={20} />
                  </button>
              </div>
           </div>
           
           <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   {viewingCustomer.notes && <p className="text-sm text-slate-500 italic">Note: {viewingCustomer.notes}</p>}
                </div>
                <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Credit Usage</span>
                        <span>{(creditPercent).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                            className={`h-2 rounded-full transition-all duration-500 ${creditPercent >= 100 ? 'bg-rose-500' : creditPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(creditPercent, 100)}%` }}
                        ></div>
                    </div>
                </div>
           </div>
        </div>

        {/* Purchase History Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Clock size={20} className="text-slate-400" />
                    Transaction History
                </h3>
                <span className="text-sm text-slate-500">{customerHistory.length} Records</span>
            </div>
            
            {customerHistory.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                    <ShoppingBag size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No transaction history found for this customer.</p>
                </div>
            ) : (
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium text-sm">
                        <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Transaction ID</th>
                            <th className="px-6 py-3">Details</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {customerHistory.map(tx => (
                            <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-slate-600 text-sm">
                                    {new Date(tx.date).toLocaleDateString()} <span className="text-xs text-slate-400 ml-1">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </td>
                                <td className="px-6 py-4 text-emerald-600 font-mono text-sm">{tx.id}</td>
                                <td className="px-6 py-4">
                                    {tx.type === 'PAYMENT' ? (
                                        <span className="text-sm font-medium text-indigo-600">Debt Repayment</span>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            {tx.items.map((item, idx) => (
                                                <span key={idx} className="text-sm text-slate-700">
                                                    <span className="font-medium">{item.quantity}x</span> {item.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        tx.type === 'PAYMENT' 
                                            ? 'bg-indigo-100 text-indigo-700' 
                                            : (tx.paymentMethod === 'Credit' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600')
                                    }`}>
                                        {tx.type === 'PAYMENT' ? 'PAYMENT' : tx.paymentMethod}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 text-right font-bold ${tx.type === 'PAYMENT' ? 'text-indigo-600' : 'text-slate-800'}`}>
                                    {tx.type === 'PAYMENT' ? '-' : ''}{settings.currencySymbol}{tx.total.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
        
        {/* Pay Debt Modal */}
        {isPayDebtModalOpen && (
             <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in relative">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="text-xl font-bold text-slate-800">Record Payment</h3>
                        <button onClick={() => setIsPayDebtModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                    </div>
                    
                    {!isConfirmingPayment ? (
                        <form onSubmit={handlePayDebtSubmit} className="p-6">
                            <p className="text-sm text-slate-500 mb-4">Record a cash payment to reduce the customer's outstanding balance.</p>
                            
                            <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex justify-between text-sm text-slate-600 mb-1">
                                    <span>Current Balance</span>
                                    <span>{settings.currencySymbol}{viewingCustomer.currentCredit.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-slate-800">
                                    <span>Remaining After</span>
                                    <span>{settings.currencySymbol}{Math.max(0, viewingCustomer.currentCredit - parseFloat(paymentAmount || '0')).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="space-y-2 mb-6">
                                <label className="text-sm font-medium text-slate-700">Payment Amount</label>
                                <input 
                                    autoFocus
                                    required
                                    type="number"
                                    step="0.01"
                                    max={viewingCustomer.currentCredit}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-lg font-bold"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsPayDebtModalOpen(false)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
                                >
                                    Proceed
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-emerald-600" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 mb-2">Confirm Payment</h4>
                            <p className="text-slate-600 mb-6">
                                Are you sure you want to record a payment of <span className="font-bold text-slate-900">{settings.currencySymbol}{parseFloat(paymentAmount).toFixed(2)}</span>?
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button 
                                    onClick={() => setIsConfirmingPayment(false)}
                                    className="px-5 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={finalizePayment}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-lg shadow-emerald-200"
                                >
                                    Confirm Payment
                                </button>
                            </div>
                        </div>
                    )}
                </div>
             </div>
        )}
      </div>
    );
  }

  // Default List View Render
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Customer Management</h2>
          <p className="text-slate-500">Manage customer profiles and loyalty program.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, email, or phone..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <Filter size={16} className="text-slate-500"/>
                <span className="text-sm text-slate-500 font-medium hidden sm:inline">Sort by:</span>
                <select 
                    className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                >
                    <option value="name">Name</option>
                    <option value="joined">Date Joined</option>
                    <option value="spent">Total Spent</option>
                    <option value="loyalty">Loyalty Points</option>
                    <option value="debt">Outstanding Debt</option>
                </select>
            </div>
            
            <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors flex items-center gap-1"
                title={sortOrder === 'asc' ? "Ascending" : "Descending"}
            >
                {sortOrder === 'asc' ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
            </button>
        </div>
      </div>
      
      {/* Results Count */}
      <div className="flex items-center justify-between px-2">
         <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-800">{filteredAndSortedCustomers.length}</span> customers
            {searchTerm && <span> matching "<span className="font-medium text-slate-800">{searchTerm}</span>"</span>}
         </p>
      </div>

      {/* Customers List */}
      {filteredAndSortedCustomers.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAndSortedCustomers.map(customer => {
                const creditUsage = customer.creditLimit > 0 ? (customer.currentCredit / customer.creditLimit) * 100 : 0;
                return (
                <div 
                    key={customer.id} 
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group relative cursor-pointer"
                    onClick={() => setViewingCustomerId(customer.id)}
                >
                    <button 
                        onClick={(e) => handleOpenModal(customer, e)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors z-10"
                        title="Edit Customer"
                    >
                        <Edit2 size={16} />
                    </button>

                    <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-lg">
                            {customer.firstName[0]}{customer.lastName[0]}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">{customer.firstName} {customer.lastName}</h3>
                            <div className="text-sm text-slate-500 space-y-1 mt-1">
                            <div className="flex items-center gap-2">
                                <Mail size={14} /> {customer.email || 'No email'}
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={14} /> {customer.phone || 'No phone'}
                            </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex flex-col">
                                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Credit Balance</span>
                                <div className="flex items-baseline gap-1">
                                    <span className={`font-bold ${customer.currentCredit > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                        {settings.currencySymbol}{customer.currentCredit.toFixed(0)}
                                    </span>
                                    <span className="text-xs text-slate-400">/ {settings.currencySymbol}{customer.creditLimit}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                                <Award size={16} className="text-amber-600" />
                                <span className="font-bold text-amber-700">{customer.loyaltyPoints} pts</span>
                            </div>
                        </div>
                        
                        {/* Visual Credit Usage Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-500 ${creditUsage >= 100 ? 'bg-rose-500' : creditUsage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(creditUsage, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )})}
        </div>
      ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
             <User size={48} className="opacity-20 mb-4" />
             <p className="text-lg font-medium text-slate-600">No customers found</p>
             <p className="text-sm">Try adjusting your search or filters</p>
          </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">First Name</label>
                    <input 
                        required
                        type="text" 
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={formData.firstName}
                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Last Name</label>
                    <input 
                        required
                        type="text" 
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={formData.lastName}
                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                    />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Phone</label>
                <input 
                  type="tel" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Wallet size={16} /> Credit Limit ({settings.currencySymbol})
                </label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.creditLimit}
                  onChange={e => setFormData({...formData, creditLimit: parseFloat(e.target.value)})}
                  placeholder="0.00"
                />
              </div>
              
              {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg flex items-start gap-2">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <span>{formError}</span>
                  </div>
              )}

               <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <textarea 
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Preferences, allergies, etc."
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
