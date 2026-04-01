
import React, { useState, useMemo } from 'react';
import { Recipe, Sale } from '../types';
import { ShoppingCart, Plus, Minus, CheckCircle, ShieldAlert, Search, X, UtensilsCrossed, Filter } from 'lucide-react';

interface SalesProps {
  recipes: Recipe[];
  onMakeSale: (recipeId: string, qty: number, staffName: string) => void;
  isReadonly?: boolean;
}

export const Sales: React.FC<SalesProps> = ({ recipes, onMakeSale, isReadonly = false }) => {
  const [cart, setCart] = useState<{recipeId: string, qty: number}[]>([]);
  const [staffName, setStaffName] = useState("Garson 1");
  const [successMsg, setSuccessMsg] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Kategorileri reçetelerden dinamik ve alfabetik olarak çıkar
  const categories = useMemo(() => {
    // Cast to string[] to resolve 'localeCompare' does not exist on type 'unknown' error
    const cats = Array.from(new Set(recipes.map(r => r.category))) as string[];
    return cats.sort((a, b) => a.localeCompare(b, 'tr'));
  }, [recipes]);

  // Filtreleme mantığı
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "ALL" || recipe.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [recipes, searchTerm, selectedCategory]);

  const addToCart = (recipeId: string) => {
    if (isReadonly) return;
    setCart(prev => {
      const existing = prev.find(item => item.recipeId === recipeId);
      if (existing) return prev.map(item => item.recipeId === recipeId ? {...item, qty: item.qty + 1} : item);
      return [...prev, { recipeId, qty: 1 }];
    });
  };

  const removeFromCart = (recipeId: string) => {
    if (isReadonly) return;
    setCart(prev => {
      const existing = prev.find(item => item.recipeId === recipeId);
      if (existing && existing.qty > 1) return prev.map(item => item.recipeId === recipeId ? {...item, qty: item.qty - 1} : item);
      return prev.filter(item => item.recipeId !== recipeId);
    });
  };

  const handleCompleteSale = () => {
    if (isReadonly || cart.length === 0) return;
    cart.forEach(item => onMakeSale(item.recipeId, item.qty, staffName));
    setCart([]);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] animate-fade-in">
      {/* Sol Panel: Ürün Seçimi */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
               <UtensilsCrossed className="text-indigo-600" /> Satış Terminali
            </h2>
            <p className="text-slate-500 font-medium">Hızlı satış ve adisyon yönetimi.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2">
            <Filter size={16} className="text-indigo-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {filteredRecipes.length} Ürün Listeleniyor
            </span>
          </div>
        </div>

        {/* Arama ve Kategori Filtreleme Paneli */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-200 mb-6 space-y-5">
          <div className="relative group flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={22} />
              <input 
                type="text" 
                placeholder="Hangi ürünü arıyorsunuz?" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-bold text-slate-800 text-lg placeholder:text-slate-300"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <button className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
              <Search size={24} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
            <button 
              onClick={() => setSelectedCategory("ALL")}
              className={`px-5 py-2.5 rounded-xl text-[11px] font-black tracking-widest transition-all border-2 ${selectedCategory === "ALL" ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}`}
            >
              HEPSİ
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-[11px] font-black tracking-widest transition-all border-2 ${selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Ürün Listesi */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
            {filteredRecipes.length === 0 ? (
              <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
                 <div className="bg-slate-50 p-6 rounded-full mb-4">
                   <Search size={48} className="text-slate-200" />
                 </div>
                 <p className="text-slate-400 font-bold text-lg tracking-tight">Eşleşen ürün bulunamadı.</p>
                 <button onClick={() => {setSearchTerm(""); setSelectedCategory("ALL")}} className="mt-4 text-indigo-600 font-black text-sm hover:underline">Filtreleri Temizle</button>
              </div>
            ) : (
              filteredRecipes.map(recipe => (
                <button
                  key={recipe.id}
                  onClick={() => addToCart(recipe.id)}
                  disabled={isReadonly}
                  className="bg-white hover:bg-indigo-50 border border-slate-200 p-5 rounded-[2.5rem] text-left shadow-sm transition-all active:scale-95 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed hover:border-indigo-300 hover:shadow-xl"
                >
                  <div className="absolute -right-3 -top-3 bg-indigo-100 w-16 h-16 rounded-full opacity-0 group-hover:opacity-20 transition-all group-hover:scale-150"></div>
                  <h3 className="font-black text-slate-800 leading-tight mb-2 h-10 overflow-hidden line-clamp-2">{recipe.name}</h3>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">{recipe.category}</span>
                    <div className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl text-sm">₺{recipe.price.toFixed(0)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sağ Panel: Adisyon Sepeti */}
      <div className="w-full lg:w-[420px] bg-white rounded-[3rem] shadow-2xl border border-slate-200 flex flex-col h-full relative overflow-hidden shrink-0">
        {isReadonly && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-12 text-center">
            <ShieldAlert size={80} className="text-red-500 mb-6 animate-pulse" />
            <h4 className="font-black text-white text-2xl uppercase tracking-widest">SATIŞA KAPALI</h4>
            <p className="text-sm text-slate-400 mt-3 font-medium leading-relaxed">Lisans süresi sona erdiği için işlem yapılamaz.</p>
          </div>
        )}
        
        <div className="p-8 border-b bg-slate-50/50">
           <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-800 text-2xl flex items-center gap-3">
                <ShoppingCart size={28} className="text-indigo-600" /> Adisyon
              </h3>
              <div className="flex flex-col items-end">
                <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                  {cart.length} ÜRÜN
                </span>
              </div>
           </div>
           
           <div className="relative group">
              <input 
                type="text" 
                value={staffName} 
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full pl-5 pr-12 py-4 bg-white border-2 border-slate-200 rounded-[1.5rem] outline-none focus:border-indigo-500 font-bold text-slate-700 text-sm shadow-inner transition-all"
                placeholder="Personel İsmi..."
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 bg-slate-100 p-1.5 rounded-lg text-slate-400">
                <Plus size={16} strokeWidth={3} />
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar bg-white">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-10 space-y-4 py-20">
               <div className="bg-slate-200 p-8 rounded-full">
                 <ShoppingCart size={64} />
               </div>
               <p className="font-black text-xl uppercase tracking-tighter">Sepet Boş</p>
            </div>
          ) : (
            cart.map(item => {
              const recipe = recipes.find(r => r.id === item.recipeId);
              return recipe && (
                <div key={item.recipeId} className="flex justify-between items-center bg-slate-50 p-5 rounded-[2rem] border border-slate-100 group animate-in slide-in-from-right-4 hover:border-indigo-200 transition-all">
                  <div className="flex-1 mr-4">
                    <p className="font-black text-slate-800 text-base leading-tight">{recipe.name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">₺{recipe.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                    <button 
                      onClick={() => removeFromCart(item.recipeId)} 
                      className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Minus size={16} strokeWidth={3} />
                    </button>
                    <span className="font-black text-slate-800 text-lg min-w-[24px] text-center tracking-tighter">{item.qty}</span>
                    <button 
                      onClick={() => addToCart(item.recipeId)} 
                      className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Ödeme Alanı */}
        <div className="p-10 border-t bg-slate-900 text-white rounded-t-[4rem] shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-[11px] text-indigo-400 font-black uppercase tracking-[0.2em] block mb-2">Ödenecek Tutar</span>
              <span className="text-5xl font-black tracking-tighter text-white">
                ₺{cart.reduce((t, i) => t + (recipes.find(r => r.id === i.recipeId)?.price || 0) * i.qty, 0).toLocaleString('tr-TR')}
              </span>
            </div>
            {cart.length > 0 && (
              <button 
                onClick={() => setCart([])} 
                className="text-[10px] text-red-400 font-black hover:text-red-300 transition-colors uppercase tracking-[0.1em] border-b-2 border-red-900/50 pb-1"
              >
                TEMİZLE
              </button>
            )}
          </div>
          
          {successMsg ? (
            <div className="bg-emerald-500 text-white py-6 rounded-[2rem] flex items-center justify-center gap-4 font-black shadow-2xl shadow-emerald-900/50 animate-in zoom-in text-xl">
              <CheckCircle size={32} strokeWidth={3}/> SATIŞ TAMAMLANDI
            </div>
          ) : (
            <button 
              onClick={handleCompleteSale} 
              disabled={cart.length === 0 || isReadonly} 
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 disabled:bg-slate-800 text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-indigo-900/40 transition-all active:scale-95 text-xl flex items-center justify-center gap-4 group"
            >
              <ShoppingCart size={28} className="group-hover:rotate-12 transition-transform" /> 
              SATIŞI ONAYLA
            </button>
          )}
          <p className="text-center text-[10px] text-slate-500 font-bold uppercase mt-6 tracking-[0.3em]">OtelPro Pos Terminali v2.5</p>
        </div>
      </div>
    </div>
  );
};
