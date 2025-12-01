import React, { useState, useRef } from 'react';
import { StoreSettings, User, UserRole } from '../types';
import { Save, UserPlus, Trash2, Edit2, Shield, Store, Users, CheckCircle, Database, Upload, Download, RefreshCw, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { getBackupData, restoreBackup, factoryReset } from '../services/storageService';

interface SettingsProps {
  settings: StoreSettings;
  users: User[];
  onUpdateSettings: (settings: StoreSettings) => void;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  settings, users, onUpdateSettings, onAddUser, onUpdateUser, onDeleteUser 
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'USERS' | 'DATA'>('GENERAL');
  
  // General Settings State
  const [generalForm, setGeneralForm] = useState<StoreSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState<Partial<User>>({ name: '', pin: '', role: 'STAFF' });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Data Management State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(generalForm);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUserId(user.id);
      setUserForm(user);
    } else {
      setEditingUserId(null);
      setUserForm({ name: '', pin: '', role: 'STAFF' });
    }
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.pin) return;

    if (editingUserId) {
      onUpdateUser({ ...userForm, id: editingUserId } as User);
    } else {
      onAddUser({
        id: `usr_${Date.now()}`,
        name: userForm.name,
        pin: userForm.pin,
        role: userForm.role as UserRole
      });
    }
    setIsUserModalOpen(false);
  };

  const handleBackup = async () => {
    setIsLoading(true);
    try {
        const data = await getBackupData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qikpos-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch(e) {
        console.error(e);
        alert('Failed to generate backup');
    } finally {
        setIsLoading(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
        const result = event.target?.result as string;
        const success = await restoreBackup(result);
        if (success) {
            setRestoreStatus('Success! Reloading...');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            setRestoreStatus('Error: Invalid backup file.');
            setIsLoading(false);
        }
    };
    reader.readAsText(file);
  };

  const handleReset = async (includeDemo: boolean) => {
      if(confirm(`Are you sure? This will DELETE ALL DATA and ${includeDemo ? 'reset to demo data' : 'leave the system empty'}. This cannot be undone.`)) {
          setIsLoading(true);
          await factoryReset(includeDemo);
          window.location.reload();
      }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-500">Manage store configuration and user access.</p>
      </div>

      <div className="flex space-x-4 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('GENERAL')}
          className={`pb-3 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
            activeTab === 'GENERAL' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          General Settings
          {activeTab === 'GENERAL' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('USERS')}
          className={`pb-3 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
            activeTab === 'USERS' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          User Management
          {activeTab === 'USERS' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></div>}
        </button>
        <button
          onClick={() => setActiveTab('DATA')}
          className={`pb-3 px-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
            activeTab === 'DATA' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Data Management
          {activeTab === 'DATA' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'GENERAL' && (
        <form onSubmit={handleSaveGeneral} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 animate-fade-in">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 text-slate-800 font-semibold">
            <Store size={20} className="text-emerald-600" />
            <h3>Store Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Store Name</label>
              <input 
                type="text" 
                value={generalForm.storeName}
                onChange={e => setGeneralForm({...generalForm, storeName: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Phone Number</label>
              <input 
                type="text" 
                value={generalForm.phone}
                onChange={e => setGeneralForm({...generalForm, phone: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium text-slate-700">Address</label>
              <input 
                type="text" 
                value={generalForm.address}
                onChange={e => setGeneralForm({...generalForm, address: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 text-slate-800 font-semibold mt-4">
            <FileText size={20} className="text-emerald-600" />
            <h3>Receipt Customization</h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Receipt Header Message</label>
                <input 
                  type="text" 
                  value={generalForm.receiptHeader || ''}
                  onChange={e => setGeneralForm({...generalForm, receiptHeader: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Welcome to our store!"
                />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Receipt Footer Message</label>
                <input 
                  type="text" 
                  value={generalForm.receiptFooter || ''}
                  onChange={e => setGeneralForm({...generalForm, receiptFooter: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. No refunds after 7 days."
                />
             </div>
          </div>

          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 text-slate-800 font-semibold mt-4">
            <Shield size={20} className="text-emerald-600" />
            <h3>Financial Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Currency Symbol</label>
              <input 
                type="text" 
                value={generalForm.currencySymbol}
                onChange={e => setGeneralForm({...generalForm, currencySymbol: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. $, GH₵, €"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tax Rate (Decimal)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max="1"
                  value={generalForm.taxRate}
                  onChange={e => setGeneralForm({...generalForm, taxRate: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                   {(generalForm.taxRate * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-slate-400">Enter 0.08 for 8%</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {saveSuccess && (
                <span className="text-emerald-600 font-medium flex items-center gap-2 animate-fade-in">
                    <CheckCircle size={18} />
                    Settings Saved!
                </span>
            )}
            <button 
                type="submit"
                className="ml-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
                <Save size={18} />
                Save Changes
            </button>
          </div>
        </form>
      )}

      {activeTab === 'USERS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                 <Users size={20} className="text-emerald-600" />
                 Team Members
             </h3>
             <button 
                onClick={() => handleOpenUserModal()}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
             >
                <UserPlus size={16} />
                <span>Add User</span>
             </button>
          </div>
          
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium text-sm">
                <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">PIN</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-medium text-slate-800">{user.name}</td>
                        <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {user.role}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono">••••</td>
                        <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={() => handleOpenUserModal(user)} className="text-slate-400 hover:text-emerald-600 transition-colors"><Edit2 size={18}/></button>
                            <button onClick={() => onDeleteUser(user.id)} className="text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'DATA' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <Database size={20} className="text-emerald-600" />
                     Backup & Restore
                     {isLoading && <Loader2 className="animate-spin text-slate-400" size={16}/>}
                 </h3>
                 <p className="text-sm text-slate-500 mb-6">Save your data locally or restore from a previous backup file.</p>
                 
                 <div className="space-y-4">
                     <button 
                        onClick={handleBackup}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors border border-indigo-200 disabled:opacity-50"
                     >
                         <Download size={18} />
                         Download Backup (JSON)
                     </button>
                     
                     <div className="relative">
                         <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleRestore}
                            accept=".json"
                            className="hidden" 
                         />
                         <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors border border-slate-200 disabled:opacity-50"
                         >
                             <Upload size={18} />
                             Restore from File
                         </button>
                     </div>
                     
                     {restoreStatus && (
                         <div className={`text-center text-sm font-medium ${restoreStatus.startsWith('Error') ? 'text-rose-600' : 'text-emerald-600'}`}>
                             {restoreStatus}
                         </div>
                     )}
                 </div>
             </div>

             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                 <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                     <AlertTriangle size={20} className="text-rose-600" />
                     Danger Zone
                 </h3>
                 <p className="text-sm text-slate-500 mb-6">Resetting the system will permanently delete all transactions, products, and customers.</p>
                 
                 <div className="space-y-4">
                     <button 
                        onClick={() => handleReset(true)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors border border-rose-200 disabled:opacity-50"
                     >
                         <RefreshCw size={18} />
                         Factory Reset (Demo Data)
                     </button>
                     
                     <button 
                        onClick={() => handleReset(false)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 text-white hover:bg-rose-700 rounded-lg font-medium transition-colors shadow-lg shadow-rose-200 disabled:opacity-50"
                     >
                         <Trash2 size={18} />
                         Factory Reset (Empty)
                     </button>
                 </div>
             </div>
         </div>
      )}

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-bold text-slate-800">{editingUserId ? 'Edit User' : 'Add New User'}</h3>
                    <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                </div>
                <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Full Name</label>
                        <input 
                            required
                            type="text" 
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={userForm.name}
                            onChange={e => setUserForm({...userForm, name: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">4-Digit PIN</label>
                        <input 
                            required
                            type="text"
                            maxLength={4}
                            pattern="\d{4}" 
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono tracking-widest"
                            placeholder="0000"
                            value={userForm.pin}
                            onChange={e => setUserForm({...userForm, pin: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Role</label>
                        <select 
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={userForm.role}
                            onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}
                        >
                            <option value="STAFF">Staff</option>
                            <option value="ADMIN">Administrator</option>
                        </select>
                        <p className="text-xs text-slate-500">Admins have full access. Staff are restricted from Settings and Reports.</p>
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button 
                            type="button"
                            onClick={() => setIsUserModalOpen(false)}
                            className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Save User
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Settings;