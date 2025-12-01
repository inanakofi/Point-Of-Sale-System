
import React, { useState } from 'react';
import { Transaction } from '../types';
import { analyzeSalesData } from '../services/geminiService';
import { Send, Bot, Loader2, FileText, TrendingUp, DollarSign } from 'lucide-react';

interface ReportsProps {
  transactions: Transaction[];
}

const Reports: React.FC<ReportsProps> = ({ transactions }) => {
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setAiResponse(null);
    
    const response = await analyzeSalesData(transactions, query);
    setAiResponse(response);
    setLoading(false);
  };

  const generateReport = (type: 'TRANSACTIONS' | 'SALES' | 'PROFIT') => {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) return;

      let title = '';
      let content = '';

      if (type === 'TRANSACTIONS') {
          title = 'Transaction Log';
          content = `
            <table style="width:100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background:#f0f0f0; text-align:left;">
                        <th style="padding:10px; border-bottom:1px solid #ccc;">ID</th>
                        <th style="padding:10px; border-bottom:1px solid #ccc;">Date</th>
                        <th style="padding:10px; border-bottom:1px solid #ccc;">Type</th>
                        <th style="padding:10px; border-bottom:1px solid #ccc;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.map(t => `
                        <tr>
                            <td style="padding:10px; border-bottom:1px solid #eee;">${t.id}</td>
                            <td style="padding:10px; border-bottom:1px solid #eee;">${new Date(t.date).toLocaleString()}</td>
                            <td style="padding:10px; border-bottom:1px solid #eee;">${t.type}</td>
                            <td style="padding:10px; border-bottom:1px solid #eee;">${t.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
          `;
      } else if (type === 'SALES') {
          const salesByDate: Record<string, number> = {};
          transactions.filter(t => t.type === 'SALE').forEach(t => {
              const date = t.date.split('T')[0];
              salesByDate[date] = (salesByDate[date] || 0) + t.total;
          });

          title = 'Daily Sales Report';
          content = `
             <table style="width:100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background:#f0f0f0; text-align:left;">
                        <th style="padding:10px; border-bottom:1px solid #ccc;">Date</th>
                        <th style="padding:10px; border-bottom:1px solid #ccc;">Total Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(salesByDate).sort().map(([date, total]) => `
                        <tr>
                            <td style="padding:10px; border-bottom:1px solid #eee;">${date}</td>
                            <td style="padding:10px; border-bottom:1px solid #eee;">${total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
          `;
      } else if (type === 'PROFIT') {
          let totalRevenue = 0;
          let totalCost = 0;
          
          transactions.filter(t => t.type === 'SALE').forEach(t => {
              totalRevenue += t.total; // Simplified, usually ex-tax
              t.items.forEach(i => {
                  totalCost += (i.cost || 0) * i.quantity;
              });
          });

          title = 'Profit & Loss Statement';
          content = `
            <div style="margin-top:20px; font-size: 16px;">
                <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                    <span>Total Sales Revenue:</span>
                    <strong>${totalRevenue.toFixed(2)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                    <span>Cost of Goods Sold (COGS):</span>
                    <strong>${totalCost.toFixed(2)}</strong>
                </div>
                 <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:2px solid #000; font-size: 18px; margin-top:10px;">
                    <span>Gross Profit:</span>
                    <strong>${(totalRevenue - totalCost).toFixed(2)}</strong>
                </div>
            </div>
          `;
      }

      printWindow.document.write(`
        <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; }
                    h1 { text-align: center; color: #333; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                ${content}
                <div style="text-align:center; margin-top:40px;">
                    <button onclick="window.print()" style="padding:10px 20px; cursor:pointer;">Print Report</button>
                </div>
            </body>
        </html>
      `);
      printWindow.document.close();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800">Reports & Analytics</h2>
        <p className="text-slate-500 mt-2">Generate standard reports or ask AI for insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button 
            onClick={() => generateReport('TRANSACTIONS')}
            className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-emerald-500 transition-all group"
          >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100">
                  <FileText size={24} />
              </div>
              <h3 className="font-bold text-slate-700">Transaction Log</h3>
              <p className="text-xs text-slate-400 mt-1">Full history list</p>
          </button>

          <button 
            onClick={() => generateReport('SALES')}
            className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-emerald-500 transition-all group"
          >
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-100">
                  <TrendingUp size={24} />
              </div>
              <h3 className="font-bold text-slate-700">Sales Report</h3>
              <p className="text-xs text-slate-400 mt-1">Daily breakdown</p>
          </button>

          <button 
            onClick={() => generateReport('PROFIT')}
            className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-emerald-500 transition-all group"
          >
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-purple-100">
                  <DollarSign size={24} />
              </div>
              <h3 className="font-bold text-slate-700">Profit & Loss</h3>
              <p className="text-xs text-slate-400 mt-1">Revenue vs Cost</p>
          </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <Bot className="text-emerald-100" />
            AI Analyst
          </h3>
          <p className="text-emerald-100 text-sm opacity-90">Powered by Gemini 2.5 Flash</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Chat Interface */}
          <div className="min-h-[200px] bg-slate-50 rounded-xl p-6 border border-slate-100">
            {!aiResponse && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center space-y-2">
                <Bot size={48} opacity={0.2} />
                <p>Try asking: "What is my best selling category?" or "How much did we make on Friday?"</p>
              </div>
            )}
            
            {loading && (
               <div className="flex flex-col items-center justify-center h-full space-y-3">
                 <Loader2 className="animate-spin text-emerald-600" size={32} />
                 <p className="text-slate-500 text-sm animate-pulse">Analyzing transaction history...</p>
               </div>
            )}

            {aiResponse && (
              <div className="prose prose-slate max-w-none">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleAiQuery} className="relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your sales..." 
              className="w-full pl-6 pr-14 py-4 bg-white border border-slate-300 rounded-full focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm outline-none transition-all text-lg"
            />
            <button 
              type="submit" 
              disabled={loading || !query.trim()}
              className="absolute right-2 top-2 p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={20}/> : <Send size={20} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Reports;
