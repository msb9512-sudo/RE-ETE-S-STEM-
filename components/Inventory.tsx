
import React, { useState } from 'react';
import { InventoryItem, Unit, StockMovementType, Category } from '../types';
import { Plus, Trash2, Search, Edit2, X, Save, Flame, Gift, Utensils, Settings2, Hash, Tag } from 'lucide-react';

interface InventoryProps {
  inventory: InventoryItem[];
  categories: string[];
  onAddItem: (item: Omit<InventoryItem, 'id'>) => void;
  onUpdateItem: (id: string, updates: Partial<InventoryItem>) => void;
  onDeleteItem: (id: string) => void;
  onStockAction: (itemId: string, type: StockMovementType, amount: number, reason: string) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
  isReadonly?: boolean;
}

export const Inventory: React.FC<InventoryProps> = ({ inventory, categories, onAddItem, onUpdateItem, onDeleteItem, onStockAction, onAddCategory, onDeleteCategory, isReadonly = false }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionItem, setActionItem] = useState<{item: InventoryItem, type: StockMovementType} | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [newCatName, setNewCatName] = useState("");
  
  const initialFormState = {
    name: '', 
    category: categories[0] || '',
    quantity: 0, 
    unit: Unit.KG,
    minLevel: 10, 
    costPerUnit: 0
  };

  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>(initialFormState);

  const filteredInventory = inventory
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadonly) return;
    if (editingId) onUpdateItem(editingId, newItem);
    else onAddItem(newItem);
    setNewItem(initialFormState);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (item: InventoryItem) => {
    if (isReadonly) return;
    setNewItem({
      name: item.name, category: item.category, quantity: item.quantity,
      unit: item.unit, minLevel: item.minLevel, costPerUnit: item.costPerUnit
    });
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadonly) return;
    const amountInput = document.getElementById('actionAmount') as HTMLInputElement;
    const reasonInput = document.getElementById('actionReason') as HTMLInputElement;
    const amount = parseFloat(amountInput.value);
    const reason = reasonInput.value;
    if (actionItem && amount > 0) {
      onStockAction(actionItem.item.id, actionItem.type, amount, reason);
      setActionItem(null);
    }
  };

  return (
    <div className="space-y-6 relative animate-fade-in">
      {isManagingCategories && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
             <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Tag size={20} className="text-indigo-600"/> Kategorileri Yönet
                </h3>
                <button onClick={() => setIsManagingCategories(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={20} /></button>
             </div>
             <div className="p-6 space-y-4">
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={newCatName} 
                   onChange={e => setNewCatName(e.target.value)} 
                   placeholder="Yeni kategori adı..."
                   className="flex-1 px-3 py-2 border border-slate-300 rounded-xl outline-none text-slate-900 bg-white focus:border-indigo-500 font-semibold"
                 />
                 <button 
                   onClick={() => { if(newCatName.trim()){ onAddCategory(newCatName.trim()); setNewCatName(""); } }}
                   className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                 >
                   Ekle
                 </button>
               </div>
               <div className="max-h-60 overflow-y-auto space-y-2">
                 {categories.map(cat => (
                   <div key={cat} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border group">
                     <span className="font-bold text-slate-700">{cat}</span>
                     <button 
                       onClick={() => onDeleteCategory(cat)}
                       className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200">
             <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  {editingId ? <Edit2 size={24} className="text-blue-500"/> : <Plus size={24} className="text-green-500"/>}
                  {editingId ? 'Ürün Düzenle' : 'Yeni Ürün Kartı'}
                </h3>
                <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600 p-2"><X size={20} /></button>
             </div>
             <div className="p-6">
               <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-600 mb-1">Ürün Adı</label>
                  <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none bg-white text-slate-900 font-semibold focus:border-indigo-500"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Kategori</label>
                  <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as Category})} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none bg-white text-slate-900 font-semibold">
                    <option value="">Kategori Seçin</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Birim</label>
                  <select value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value as Unit})} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none bg-white text-slate-900 font-semibold">
                    {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                {!editingId && (
                   <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">Başlangıç Stok</label>
                    <input required type="number" step="0.01" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none bg-white text-slate-900 font-bold focus:border-indigo-500"/>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Kritik Seviye</label>
                  <input required type="number" value={newItem.minLevel} onChange={e => setNewItem({...newItem, minLevel: parseFloat(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none bg-white text-slate-900 font-bold focus:border-indigo-500"/>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Birim Maliyet (₺)</label>
                  <input required type="number" step="0.01" value={newItem.costPerUnit} onChange={e => setNewItem({...newItem, costPerUnit: parseFloat(e.target.value)})} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl outline-none bg-white text-slate-900 font-bold focus:border-indigo-500"/>
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t">
                   <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-6 py-2 rounded-xl border font-bold text-slate-600 hover:bg-slate-50">İptal</button>
                   <button type="submit" disabled={isReadonly} className="bg-indigo-600 text-white px-8 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 font-black shadow-lg shadow-indigo-100 transition-all">
                     <Save size={18}/> Kaydet
                   </button>
                </div>
              </form>
             </div>
           </div>
        </div>
      )}

      {actionItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 border border-slate-200">
             <h3 className="text-xl font-black text-slate-800 mb-4">{actionItem.type} İşlemi</h3>
             <form onSubmit={handleActionSubmit} className="space-y-4">
               <div>
                 <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Miktar ({actionItem.item.unit})</label>
                 <input id="actionAmount" type="number" step="0.01" required className="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 text-slate-900 font-bold focus:border-indigo-500 outline-none transition-all" autoFocus />
               </div>
               <div>
                 <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1 block">Açıklama / Sebep</label>
                 <input id="actionReason" type="text" className="w-full border-2 border-slate-100 p-3 rounded-xl bg-slate-50 text-slate-900 font-semibold focus:border-indigo-500 outline-none transition-all" placeholder="Neden?" />
               </div>
               <div className="flex justify-end gap-3 pt-4">
                 <button type="button" onClick={() => setActionItem(null)} className="px-4 py-2 text-slate-500 font-bold hover:text-slate-800">İptal</button>
                 <button type="submit" className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black shadow-lg shadow-slate-200 hover:bg-black transition-all">Onayla</button>
               </div>
             </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Merkezi Depo Yönetimi</h2>
          <p className="text-slate-500 font-medium">Tüm ürünler ve sarf malzemeleri tek bir merkezden takip edilir.</p>
        </div>
        <div className="flex gap-3">
            <button 
              onClick={() => setIsManagingCategories(true)}
              disabled={isReadonly}
              className="bg-white text-slate-700 px-5 py-2.5 rounded-xl border-2 border-slate-100 flex items-center gap-2 transition-all font-black hover:border-indigo-300 disabled:opacity-50 shadow-sm"
            >
              <Settings2 size={18} className="text-indigo-600" /> Kategorileri Düzenle
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              disabled={isReadonly}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-xl shadow-indigo-100 font-black hover:bg-indigo-700 disabled:opacity-50"
            >
              <Plus size={20} /> Yeni Stok Kartı
            </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b flex flex-wrap gap-2 bg-slate-50/30">
            <button 
              onClick={() => setSelectedCategory("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${selectedCategory === "ALL" ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200'}`}
            >
              TÜM ÜRÜNLER
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200'}`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
        </div>

        <div className="p-6 border-b flex items-center gap-4 bg-white">
          <div className="bg-slate-100 p-2.5 rounded-xl text-slate-400">
            <Search size={22} />
          </div>
          <input 
            type="text" 
            placeholder="Ürün adı veya koduna göre ara..." 
            className="flex-1 outline-none text-slate-900 font-bold bg-transparent text-lg placeholder:text-slate-300" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">Ürün Künyesi</th>
                <th className="px-8 py-5">Kategori</th>
                <th className="px-8 py-5 text-center">Güncel Stok</th>
                <th className="px-8 py-5 text-right">Birim Maliyet</th>
                <th className="px-8 py-5 text-center">Hareketler</th>
                <th className="px-8 py-5 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredInventory.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center text-slate-400 font-bold italic">Kayıtlı ürün bulunamadı.</td></tr>
              ) : (
                filteredInventory.map(item => {
                  const isCritical = item.quantity <= item.minLevel;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 group transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-black text-slate-800 text-base">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {item.id.substr(0,8)}</p>
                      </td>
                      <td className="px-8 py-5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-500 rounded-lg uppercase">
                              <Hash size={10} /> {item.category}
                          </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-base font-black px-3 py-1 rounded-xl ${isCritical ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-50 text-green-700'}`}>
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-slate-600">₺{item.costPerUnit.toFixed(2)}</td>
                      <td className="px-8 py-5 text-center">
                        <div className="flex justify-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button disabled={isReadonly} onClick={() => setActionItem({item, type: StockMovementType.WASTE})} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all" title="Fire"><Flame size={18}/></button>
                          <button disabled={isReadonly} onClick={() => setActionItem({item, type: StockMovementType.COMPLIMENT})} className="p-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-all" title="İkram"><Gift size={18}/></button>
                          <button disabled={isReadonly} onClick={() => setActionItem({item, type: StockMovementType.STAFF_MEAL})} className="p-2 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-all" title="Personel"><Utensils size={18}/></button>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                         <div className="flex justify-center gap-2">
                           <button disabled={isReadonly} className="p-2.5 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-all" onClick={() => handleEdit(item)}><Edit2 size={18} /></button>
                           <button disabled={isReadonly} className="p-2.5 hover:bg-red-50 text-red-600 rounded-xl transition-all" onClick={() => onDeleteItem(item.id)}><Trash2 size={18} /></button>
                         </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
