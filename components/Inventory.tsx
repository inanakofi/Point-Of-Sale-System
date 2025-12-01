
import React, { useState } from 'react';
import { Product, StoreSettings } from '../types';
import { suggestProductDetails, generateProductImage } from '../services/geminiService';
import { Sparkles, Plus, Search, Loader2, AlertTriangle, TrendingUp, Image as ImageIcon, Upload, Camera, Edit2 } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  settings: StoreSettings;
}

const Inventory: React.FC<InventoryProps> = ({ products, onAddProduct, onUpdateProduct, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: '',
    price: 0,
    cost: 0,
    stock: 0,
    lowStockThreshold: 10,
    sku: '',
    description: '',
    image: ''
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        ...product
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        category: '',
        price: 0,
        cost: 0,
        stock: 0,
        lowStockThreshold: 10,
        sku: '',
        description: '',
        image: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSmartFill = async () => {
    if (!formData.name) return;
    setAiLoading(true);
    const suggestion = await suggestProductDetails(formData.name);
    if (suggestion) {
      setFormData(prev => ({
        ...prev,
        category: suggestion.category || prev.category,
        price: suggestion.price || prev.price,
        cost: suggestion.price ? suggestion.price * 0.5 : prev.cost, // Guess cost as 50% of price
        sku: suggestion.sku || prev.sku,
        description: suggestion.description || prev.description
      }));
    }
    setAiLoading(false);
  };

  const handleGenerateImage = async () => {
    if (!formData.name) return;
    setImageLoading(true);
    const description = formData.description || `A ${formData.name} product`;
    const imageBase64 = await generateProductImage(formData.name, description);
    
    if (imageBase64) {
      setFormData(prev => ({ ...prev, image: imageBase64 }));
    }
    setImageLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.price) {
      if (editingId) {
        // Update existing
        const updatedProduct: Product = {
            ...products.find(p => p.id === editingId)!,
            ...formData as Product,
            price: Number(formData.price),
            cost: Number(formData.cost),
            stock: Number(formData.stock),
            lowStockThreshold: Number(formData.lowStockThreshold)
        };
        onUpdateProduct(updatedProduct);
      } else {
        // Create new
        const newProduct: Product = {
            id: Date.now().toString(),
            name: formData.name,
            category: formData.category || 'General',
            price: Number(formData.price),
            cost: Number(formData.cost) || 0,
            stock: Number(formData.stock) || 0,
            lowStockThreshold: Number(formData.lowStockThreshold) || 5,
            sku: formData.sku || `GEN-${Date.now()}`,
            description: formData.description,
            image: formData.image
        };
        onAddProduct(newProduct);
      }
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
          <p className="text-slate-500">Track stock levels, costs, and add new products.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus size={20} />
          <span>Add Product</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
           <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search inventory..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium text-sm">
            <tr>
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">SKU</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Stock</th>
              <th className="px-6 py-3">Margin</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => {
               const isLowStock = p.stock <= (p.lowStockThreshold ?? 5);
               const profit = p.price - p.cost;
               const margin = p.price > 0 ? (profit / p.price) * 100 : 0;
               
               return (
                <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${isLowStock ? 'bg-rose-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={16} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 flex items-center gap-2">
                              {p.name}
                              {isLowStock && (
                                  <span className="bg-rose-100 text-rose-600 p-1 rounded-md flex items-center gap-1" title={`Low stock (Threshold: ${p.lowStockThreshold})`}>
                                      <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></div>
                                      <AlertTriangle size={14} />
                                  </span>
                              )}
                          </p>
                          {p.description && <p className="text-xs text-slate-400 truncate max-w-xs">{p.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">{p.sku}</td>
                    <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                        {p.category}
                    </span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-sm">
                            <span className="font-medium text-slate-800">{settings.currencySymbol}{p.price.toFixed(2)}</span>
                            <span className="block text-xs text-slate-400">Cost: {settings.currencySymbol}{p.cost.toFixed(2)}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                    <span className={`font-medium ${isLowStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {p.stock}
                    </span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 text-sm text-slate-600">
                             <TrendingUp size={14} className={margin > 40 ? "text-emerald-500" : "text-amber-500"}/>
                             <span>{margin.toFixed(0)}%</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                    <button 
                        onClick={() => handleOpenModal(p)}
                        className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"
                    >
                        <Edit2 size={16} /> Edit
                    </button>
                    </td>
                </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <div className="flex gap-6 flex-col lg:flex-row">
                {/* Left Column: Image */}
                <div className="w-full lg:w-1/3 space-y-4">
                  <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden relative group">
                    {imageLoading ? (
                      <div className="flex flex-col items-center text-slate-500">
                        <Loader2 className="animate-spin mb-2" size={24} />
                        <span className="text-xs">Generating...</span>
                      </div>
                    ) : formData.image ? (
                      <>
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, image: ''})}
                          className="absolute top-2 right-2 p-1 bg-white/80 rounded-full text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          &times;
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                         <ImageIcon size={48} className="mb-2 opacity-50" />
                         <span className="text-sm">No Image</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col items-center justify-center px-4 py-2 bg-slate-100 text-slate-600 rounded-lg cursor-pointer hover:bg-slate-200 transition-colors text-xs font-medium text-center">
                      <Upload size={16} className="mb-1" />
                      <span>Upload</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    <button 
                      type="button"
                      onClick={handleGenerateImage}
                      disabled={!formData.name || imageLoading}
                      className="flex flex-col items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-medium disabled:opacity-50"
                    >
                      <Camera size={16} className="mb-1" />
                      <span>AI Gen</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Details */}
                <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Product Name</label>
                      <div className="flex gap-2">
                        <input 
                          required
                          type="text" 
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="e.g. Vintage Leather Jacket"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                        <button 
                          type="button"
                          onClick={handleSmartFill}
                          disabled={aiLoading || !formData.name}
                          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors whitespace-nowrap"
                        >
                          {aiLoading ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18} />}
                          <span>AI Fill</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Category</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">SKU</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                          value={formData.sku}
                          onChange={e => setFormData({...formData, sku: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Price ({settings.currencySymbol})</label>
                        <input 
                          required
                          type="number" 
                          step="0.01"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.price}
                          onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Cost ({settings.currencySymbol})</label>
                        <input 
                          required
                          type="number" 
                          step="0.01"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.cost}
                          onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Stock</label>
                        <input 
                          required
                          type="number" 
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.stock}
                          onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Low Stock Alert Level</label>
                        <input 
                          required
                          type="number" 
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          value={formData.lowStockThreshold}
                          onChange={e => setFormData({...formData, lowStockThreshold: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Description</label>
                      <textarea 
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                    </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end space-x-3 border-t border-slate-100 mt-4">
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
                  {editingId ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
