
import React, { useState } from 'react';
import { User } from '../types';
import { Lock, LogIn, Store, User as UserIcon, ChevronDown } from 'lucide-react';

interface LoginProps {
  users: User[];
  storeName: string;
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ users, storeName, onLogin }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedUserId);
    if (!user) return;

    if (pin === user.pin) {
      onLogin(user);
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-emerald-600 p-8 text-center">
          <div className="inline-flex p-4 bg-emerald-500 rounded-full mb-4 shadow-inner">
            <Store size={48} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{storeName}</h1>
          <p className="text-emerald-100">Point of Sale System</p>
        </div>

        <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700 block">Select User</label>
                 <div className="relative">
                     <select
                        value={selectedUserId}
                        onChange={(e) => {
                            setSelectedUserId(e.target.value);
                            setError('');
                            setPin('');
                        }}
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none font-medium text-slate-700"
                     >
                         <option value="" disabled>-- Choose Account --</option>
                         {users.map(u => (
                             <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                         ))}
                     </select>
                     <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                 </div>
              </div>

              {selectedUser && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="text-sm font-bold text-slate-700 block">Enter PIN</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                        type="password"
                        autoFocus
                        maxLength={4}
                        value={pin}
                        onChange={(e) => {
                            setPin(e.target.value);
                            setError('');
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center text-xl tracking-widest font-mono"
                        placeholder="••••"
                        />
                    </div>
                  </div>
              )}

              {error && (
                <p className="text-rose-500 text-sm text-center font-medium animate-pulse">{error}</p>
              )}

              <button
                type="submit"
                disabled={!selectedUser || pin.length === 0}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/10 transition-all flex items-center justify-center gap-2"
              >
                <LogIn size={20} />
                Login
              </button>
            </form>
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
             <p className="text-xs text-slate-400">Default Admin PIN: 1234</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
