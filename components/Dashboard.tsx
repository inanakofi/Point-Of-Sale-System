
import React, { useState } from 'react';
import { Transaction, Product, StoreSettings, User, ViewState } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, Users, AlertTriangle, Printer, X, FileText } from 'lucide-react';
import { printReceipt } from '../services/printerService';

interface DashboardProps {
  transactions: Transaction[];
  products: Product[];
  settings: StoreSettings;
  currentUser: User | null;
  onNavigate: (view: ViewState) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend?: string; onClick?: () => void; className?: string }> = ({ title, value, icon, trend, onClick, className }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between transition-all ${onClick ? 'cursor-pointer hover:border-emerald-500 hover:shadow-md' : ''} ${className}`}
  >
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {trend && <p className="text-emerald-600 text-xs font-medium mt-2 flex items-center">{trend}</p>}
    </div>
    <div className="p-3 bg-slate-50 rounded-lg text-slate-600">
      {icon}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ transactions, products, settings, currentUser, onNavigate }) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Filter for actual sales only
  const salesTransactions = transactions.filter(t => t.type === 'SALE');

  // Calculate basic stats
  const totalRevenue = salesTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalSales = salesTransactions.length;
  // Use dynamic threshold per product, default to 5 if missing
  const lowStockCount = products.filter(p => p.stock <= (p.lowStockThreshold ?? 5)).length;

  // Prepare chart data (Sales by Date)
  const salesByDate = salesTransactions.reduce((acc, t) => {
    const date = t.date.split('T')[0].substring(5); // MM-DD
    acc[date] = (acc[date] || 0) + t.total;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(salesByDate)
    .sort()
    .slice(-7) // Last 7 active days
    .map(date => ({ date, sales: salesByDate[date] }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <p className="text-slate-500">Welcome back, {currentUser?.name}.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`${settings.currencySymbol}${totalRevenue.toFixed(2)}`} 
          icon={<DollarSign size={24} />} 
          trend="+12.5% from last month"
        />
        <StatCard 
          title="Total Transactions" 
          value={totalSales.toString()} 
          icon={<ShoppingBag size={24} />} 
          trend="+5.2% from last month"
        />
        <StatCard 
          title="Low Stock Items" 
          value={lowStockCount.toString()} 
          icon={<AlertTriangle size={24} className={lowStockCount > 0 ? "text-rose-500" : "text-slate-400"} />} 
          trend={lowStockCount > 0 ? "Click to view inventory" : "Stock Healthy"}
          onClick={() => onNavigate('INVENTORY')}
          className={lowStockCount > 0 ? "border-rose-200 bg-rose-50/20" : ""}
        />
        <StatCard 
          title="Active Customers" 
          value="142" 
          icon={<Users size={24} />} 
          trend="+8 this week"
          onClick={() => onNavigate('CUSTOMERS')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Sales Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 12}} />
              <YAxis stroke="#64748b" tick={{fontSize: 12}} tickFormatter={(val) => `${settings.currencySymbol}${val}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: number) => [`${settings.currencySymbol}${val.toFixed(2)}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="sales" stroke="#059669" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
          <div className="space-y-4 overflow-y-auto max-h-60 pr-2 flex-1">
            {transactions.slice(0, 5).map(t => (
              <div 
                key={t.id} 
                onClick={() => setSelectedTx(t)}
                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100 last:border-0 cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${t.type === 'PAYMENT' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {t.type === 'PAYMENT' ? 'PAY' : (t.paymentMethod === 'Card' ? 'CC' : 'CS')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 group-hover:text-emerald-700">{t.id}</p>
                    <p className="text-xs text-slate-500">
                        {new Date(t.date).toLocaleTimeString()} - 
                        {t.type === 'PAYMENT' ? ' Debt Payment' : ` ${t.items.length} items`}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-slate-800">{settings.currencySymbol}{t.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onNavigate('REPORTS')}
            className="mt-4 w-full py-2 text-sm text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition-colors border border-dashed border-emerald-200"
          >
            View All Reports
          </button>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in relative">
                <button 
                    onClick={() => setSelectedTx(null)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${selectedTx.type === 'PAYMENT' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {selectedTx.type === 'PAYMENT' ? <DollarSign size={24} /> : <FileText size={24} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{selectedTx.type === 'PAYMENT' ? 'Payment Receipt' : 'Sale Receipt'}</h3>
                            <p className="text-sm text-slate-500">{selectedTx.id}</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400">
                        {new Date(selectedTx.date).toLocaleDateString()} at {new Date(selectedTx.date).toLocaleTimeString()}
                    </p>
                </div>

                <div className="p-6 max-h-80 overflow-y-auto">
                    {selectedTx.type === 'PAYMENT' ? (
                        <div className="text-center py-4">
                            <p className="text-slate-500 mb-2">Debt Payment Received from</p>
                            <p className="text-lg font-bold text-slate-800 mb-4">{selectedTx.customerName}</p>
                            <p className="text-3xl font-bold text-indigo-600">{settings.currencySymbol}{selectedTx.total.toFixed(2)}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                             {selectedTx.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-slate-700"><span className="font-bold">{item.quantity}x</span> {item.name}</span>
                                    <span className="text-slate-600">{settings.currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                             ))}
                             <div className="border-t border-dashed border-slate-200 my-4 pt-4 space-y-2">
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Subtotal</span>
                                    <span>{settings.currencySymbol}{selectedTx.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Tax</span>
                                    <span>{settings.currencySymbol}{selectedTx.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-slate-800 pt-2 border-t border-slate-100">
                                    <span>Total</span>
                                    <span>{settings.currencySymbol}{selectedTx.total.toFixed(2)}</span>
                                </div>
                             </div>
                        </div>
                    )}
                    
                    {selectedTx.customerName && selectedTx.type === 'SALE' && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600 flex justify-between">
                            <span>Customer:</span>
                            <span className="font-medium">{selectedTx.customerName}</span>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={() => printReceipt(selectedTx, settings)}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Printer size={18} />
                        Print Receipt
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
